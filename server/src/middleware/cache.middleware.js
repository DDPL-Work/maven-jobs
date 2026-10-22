const cacheService = require("../services/cache/cache.service");

function serializeQuery(query = {}) {
  const sorted = Object.entries(query)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)]);
  return new URLSearchParams(sorted).toString() || "default";
}

function cacheRoute({ key, ttl = 300, condition = () => true }) {
  return async (req, res, next) => {
    if (!condition(req)) return next();

    const cacheKey = typeof key === "function" ? key(req) : key;
    if (!cacheKey) return next();

    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        const duration = Date.now() - startTime;
        console.log(`[Redis:Cache] ⚡ HIT  ${req.method} ${req.originalUrl || req.url} -> key="${cacheKey}" (${duration}ms)`);
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        res.setHeader("X-Cache-Time", `${duration}ms`);
        return originalJson(cached);
      }
    } catch {
      // Proceed to live handler if Redis lookup fails
    }

    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Cache-Key", cacheKey);

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
        cacheService.set(cacheKey, body, ttl).then(() => {
          console.log(`[Redis:Cache] 💾 MISS & STORED ${req.method} ${req.originalUrl || req.url} -> key="${cacheKey}" (TTL: ${ttl}s)`);
        }).catch((err) => {
          console.warn(`[Redis:Cache] ⚠️ Failed to store key="${cacheKey}":`, err?.message || "");
        });
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
            cacheService.delPattern(key).then(() => {
              console.log(`[Redis:Cache] 🧹 PURGED pattern="${key}"`);
            }).catch(() => {});
          } else {
            cacheService.del(key).then(() => {
              console.log(`[Redis:Cache] 🧹 PURGED key="${key}"`);
            }).catch(() => {});
          }
        });
      }
    });
    next();
  };
}

module.exports = { cacheRoute, invalidateCache, serializeQuery };


