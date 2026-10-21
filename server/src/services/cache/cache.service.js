const { createRedisClient, getRedisConfig } = require("../../config/redis.config");

const CACHE_PREFIX = "cache:";

let client = null;

function getClient() {
  if (!client) {
    client = createRedisClient();
  }
  return client;
}

function buildKey(...parts) {
  return CACHE_PREFIX + parts.filter(Boolean).join(":");
}

async function get(key) {
  try {
    const redis = getClient();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function set(key, data, ttlSeconds = 300) {
  try {
    const redis = getClient();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
  }
}

async function del(key) {
  try {
    const redis = getClient();
    await redis.del(key);
  } catch {
  }
}

async function delPattern(pattern) {
  try {
    const redis = getClient();
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    let hasKeys = false;

    stream.on("data", (keys) => {
      if (keys && keys.length) {
        hasKeys = true;
        keys.forEach((k) => pipeline.del(k));
      }
    });

    return new Promise((resolve) => {
      stream.on("end", async () => {
        if (hasKeys) {
          try {
            await pipeline.exec();
          } catch {}
        }
        resolve();
      });
      stream.on("error", () => resolve());
    });
  } catch {
  }
}

async function cacheAside({ key, ttl, fetch }) {
  try {
    const cached = await get(key);
    if (cached !== null) return cached;

    const fresh = await fetch();
    if (fresh !== null && fresh !== undefined) {
      await set(key, fresh, ttl);
    }
    return fresh;
  } catch {
    return fetch();
  }
}

async function connect() {
  try {
    const c = getClient();
    if (c.status === "ready" || c.status === "connecting" || c.status === "connect") {
      return;
    }
    await c.connect();
    console.log("[Cache] Redis connected");
  } catch (err) {
    console.warn("[Cache] Redis unavailable — caching fallback to DB:", err?.message || "");
  }
}

async function disconnect() {
  if (client) {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    client = null;
  }
}

module.exports = {
  getClient,
  get,
  set,
  del,
  delPattern,
  cacheAside,
  connect,
  disconnect,
  buildKey,
  getRedisConfig,
};
