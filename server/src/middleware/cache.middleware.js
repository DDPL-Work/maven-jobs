const cacheService = require("../services/cache/cache.service");

function cacheRoute({ key, ttl = 300, condition = () => true }) {
  return async (req, res, next) => {
    if (!condition(req)) return next();

    const cacheKey = typeof key === "function" ? key(req) : key;
    if (!cacheKey) return next();

    const originalJson = res.json.bind(res);

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        res.setHeader("X-Cache", "HIT");
        return originalJson(cached);
      }
    } catch {
      // Proceed to live handler if Redis lookup fails
    }

    res.setHeader("X-Cache", "MISS");

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
        cacheService.set(cacheKey, body, ttl).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

function invalidateCache(patterns) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => {
          const key = typeof pattern === "function" ? pattern(req) : pattern;
          if (!key) return;
          if (key.includes("*")) {
            cacheService.delPattern(key).catch(() => {});
          } else {
            cacheService.del(key).catch(() => {});
          }
        });
      }
    });
    next();
  };
}

module.exports = { cacheRoute, invalidateCache };
