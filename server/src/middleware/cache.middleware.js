const cacheService = require("../services/cache/cache.service");

function cacheRoute({ key, ttl = 300, condition = () => true }) {
  return async (req, res, next) => {
    if (!condition(req)) return next();

    const cacheKey = typeof key === "function" ? key(req) : key;
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
        cacheService.set(cacheKey, body, ttl).catch(() => {});
      }
      return originalJson(body);
    };

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return res.json(cached);
      }
    } catch {
    }

    next();
  };
}

function invalidateCache(patterns) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => {
          const key = typeof pattern === "function" ? pattern(req) : pattern;
          cacheService.delPattern(key).catch(() => {});
        });
      }
    });
    next();
  };
}

module.exports = { cacheRoute, invalidateCache };
