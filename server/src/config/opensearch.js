const { Client } = require("@opensearch-project/opensearch");

let _client = null;
let _available = false;
let _lastPingAt = 0;

// Re-check OS availability at most once every 60 seconds
const PING_TTL_MS = 60 * 1000;

/**
 * Returns the singleton OpenSearch client.
 * Lazily created on first call.
 */
function getClient() {
  if (_client) return _client;

  const node =
    process.env.OPENSEARCH_NODE ||
    "https://search-maven-portal-lrx3j4cdqtdgmwdealchu3mgmq.ap-south-1.es.amazonaws.com";
  const username = process.env.OPENSEARCH_USERNAME || "mavenPortal";
  const password = process.env.OPENSEARCH_PASSWORD || "MavenPortal@123";

  _client = new Client({
    node,
    auth: { username, password },
    ssl: {
      // Allow self-signed / Amazon-issued certificates
      rejectUnauthorized: false,
    },
    requestTimeout: 10000, // 10s — slightly more generous for AWS-hosted cluster
  });

  return _client;
}

/**
 * Async availability check with TTL cache.
 * Returns true if OS is reachable AND OPENSEARCH_ENABLED === "true".
 * The ping is fired at most once per PING_TTL_MS.
 */
async function osAvailable() {
  if (process.env.OPENSEARCH_ENABLED !== "true") return false;

  const now = Date.now();
  if (_available && now - _lastPingAt < PING_TTL_MS) return true;

  try {
    const client = getClient();
    await client.ping();
    _available = true;
    _lastPingAt = now;
    console.log("[OS] OpenSearch is available ✓");
    return true;
  } catch (err) {
    console.warn("[OS] OpenSearch not available:", err.message);
    _available = false;
    _lastPingAt = now; // don't hammer OS if it's down
    return false;
  }
}

/**
 * Synchronous availability check — returns the CACHED value only.
 * Never triggers a network ping. Safe to call in a hot path.
 */
function osAvailableSync() {
  if (process.env.OPENSEARCH_ENABLED !== "true") return false;
  const now = Date.now();
  return _available && now - _lastPingAt < PING_TTL_MS;
}

/**
 * Reset availability flag (used when OS recovers after being down).
 */
function resetAvailability() {
  _available = false;
  _lastPingAt = 0;
}

// ── Backward-compatible aliases so any code that still references
//    the old esAvailable / esAvailableSync names keeps working. ──
const esAvailable = osAvailable;
const esAvailableSync = osAvailableSync;

module.exports = {
  getClient,
  osAvailable,
  osAvailableSync,
  resetAvailability,
  // aliases
  esAvailable,
  esAvailableSync,
};
