const { Client } = require("@elastic/elasticsearch");

let _client = null;
let _available = false;
let _lastPingAt = 0;

// Re-check ES availability at most once every 60 seconds
const PING_TTL_MS = 60 * 1000;

/**
 * Returns the singleton Elasticsearch client.
 * Lazily created on first call.
 */
function getClient() {
  if (_client) return _client;

  const node = process.env.ELASTICSEARCH_NODE || "https://localhost:9200";
  const username = process.env.ELASTICSEARCH_USERNAME || "";
  const password = process.env.ELASTICSEARCH_PASSWORD || "";

  const opts = {
    node,
    tls: {
      // Allow self-signed certificates on local dev
      rejectUnauthorized: false,
    },
    requestTimeout: 5000, // 5s timeout so a slow ES never stalls a request
  };

  if (username && password) {
    opts.auth = { username, password };
  }

  _client = new Client(opts);
  return _client;
}

/**
 * Async availability check with TTL cache.
 * Returns true if ES is reachable AND ELASTICSEARCH_ENABLED === "true".
 * The ping is only fired at most once per PING_TTL_MS — so the first
 * request after server start pays the ping cost, subsequent calls are instant.
 */
async function esAvailable() {
  if (process.env.ELASTICSEARCH_ENABLED !== "true") return false;

  const now = Date.now();
  // Return cached result if it's still fresh
  if (_available && now - _lastPingAt < PING_TTL_MS) return true;

  try {
    const client = getClient();
    await client.ping();
    _available = true;
    _lastPingAt = now;
    console.log("[ES] Elasticsearch is available ✓");
    return true;
  } catch (err) {
    console.warn("[ES] Elasticsearch not available:", err.message);
    _available = false;
    _lastPingAt = now; // don't hammer ES if it's down
    return false;
  }
}

/**
 * Synchronous availability check — returns the CACHED value only.
 * Never triggers a network ping. Safe to call in a hot path.
 */
function esAvailableSync() {
  if (process.env.ELASTICSEARCH_ENABLED !== "true") return false;
  const now = Date.now();
  return _available && now - _lastPingAt < PING_TTL_MS;
}

/**
 * Reset availability flag (used when ES recovers after being down).
 */
function resetAvailability() {
  _available = false;
  _lastPingAt = 0;
}

module.exports = { getClient, esAvailable, esAvailableSync, resetAvailability };
