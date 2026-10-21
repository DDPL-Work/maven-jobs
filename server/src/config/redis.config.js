const Redis = require("ioredis");

/**
 * Resolves Redis connection options according to the environment:
 * - If REDIS_ENV === "cloud" OR (NODE_ENV === "production" && REDIS_ENV !== "local"):
 *     Uses Cloud Redis (Redis Cloud credentials).
 * - Otherwise (local development):
 *     Uses Local Redis (redis://localhost:6379 or REDIS_LOCAL_URL).
 */
function getRedisConfig() {
  const isCloud =
    process.env.REDIS_ENV === "cloud" ||
    (process.env.NODE_ENV === "production" && process.env.REDIS_ENV !== "local");

  if (isCloud) {
    const host = process.env.REDIS_CLOUD_HOST || process.env.REDIS_HOST || "wind-level-history-54776.db.redis.io";
    const port = Number(process.env.REDIS_CLOUD_PORT || process.env.REDIS_PORT || 13527);
    const username = process.env.REDIS_CLOUD_USERNAME || process.env.REDIS_USERNAME || "default";
    const password = process.env.REDIS_CLOUD_PASSWORD || process.env.REDIS_PASSWORD || "W0hLp2K6Xya5DppvMSt8Bno8w08p5stV";
    const tlsEnabled = String(process.env.REDIS_CLOUD_TLS ?? process.env.REDIS_TLS ?? "false").toLowerCase() === "true";

    const url =
      process.env.REDIS_CLOUD_URL ||
      (tlsEnabled
        ? `rediss://${username}:${password}@${host}:${port}`
        : `redis://${username}:${password}@${host}:${port}`);

    return {
      type: "cloud",
      isCloud: true,
      url,
      host,
      port,
      username,
      password,
      tls: tlsEnabled ? { rejectUnauthorized: false } : undefined,
    };
  }

  const url = process.env.REDIS_LOCAL_URL || process.env.REDIS_URL || "redis://localhost:6379";
  return {
    type: "local",
    isCloud: false,
    url,
    host: "localhost",
    port: 6379,
    username: "",
    password: "",
    tls: undefined,
  };
}

/**
 * Creates and returns a configured ioredis client instance.
 *
 * @param {object} customOptions - Overrides or additional ioredis options
 * @returns {Redis}
 */
function createRedisClient(customOptions = {}) {
  const config = getRedisConfig();
  const options = {
    maxRetriesPerRequest: 1, // Fail fast on commands so application falls back to DB
    commandTimeout: 2500, // 2.5s command timeout
    enableOfflineQueue: false, // Don't queue unbounded commands in memory if offline
    lazyConnect: true,
    retryStrategy(times) {
      // Reconnect with capped backoff (max 3 seconds)
      return Math.min(times * 100, 3000);
    },
    ...customOptions,
  };

  if (config.tls) {
    options.tls = config.tls;
  }

  const client = new Redis(config.url, options);

  client.on("error", (err) => {
    // Suppress ECONNREFUSED noise in non-production local development
    if (err.code !== "ECONNREFUSED" || process.env.NODE_ENV === "production" || config.isCloud) {
      console.error(`[Redis:${config.type}] error:`, err.message);
    }
  });

  client.on("ready", () => {
    console.log(`[Redis:${config.type}] ready at ${config.host}:${config.port}`);
  });

  client.on("reconnecting", () => {
    console.log(`[Redis:${config.type}] reconnecting...`);
  });

  return client;
}

module.exports = {
  getRedisConfig,
  createRedisClient,
};
