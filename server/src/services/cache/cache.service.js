const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_PREFIX = "cache:";

let client = null;

function getClient() {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1, // Fail fast if a command fails, fallback to DB
      commandTimeout: 2000, // 2 second timeout so commands don't hang
      enableOfflineQueue: false, // Don't queue commands in memory if Redis is down
      lazyConnect: true,
      retryStrategy(times) {
        // Reconnect indefinitely with a capped exponential backoff (max 3 seconds)
        return Math.min(times * 100, 3000);
      },
    });

    client.on("error", (err) => {
      // Only suppress ECONNREFUSED in non-production environments
      if (err.code !== "ECONNREFUSED" || process.env.NODE_ENV === "production") {
        console.error("[Cache] Redis error:", err.message);
      }
    });

    client.on("ready", () => console.log("[Cache] Redis ready"));
    client.on("reconnecting", () => console.log("[Cache] Redis reconnecting..."));
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

    stream.on("data", (keys) => {
      if (keys.length) {
        keys.forEach((k) => pipeline.del(k));
      }
    });

    return new Promise((resolve) => {
      stream.on("end", () => {
        pipeline.exec().catch(() => {});
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
    await getClient().connect();
    console.log("[Cache] Redis connected");
  } catch {
    console.warn("[Cache] Redis unavailable — caching disabled");
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
  buildKey,
};
