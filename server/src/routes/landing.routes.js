const express = require("express");
const router = express.Router();

const {
  getHomeLandingData,
  getLandingPageData,
  getPublicJobs,
  getPublicCompanyDetail,
  getEmployerLandingData,
  getSearchSuggestions,
  getLocationSuggestions,
} = require("../controllers/landing.controller");
const { cacheRoute, invalidateCache, serializeQuery } = require("../middleware/cache.middleware");
const { optionalAuthCandidate } = require("../middleware/candidate.middleware");

router.get("/home", cacheRoute({ key: "cache:landing:home", ttl: 120 }), getHomeLandingData);

router.get(
  "/jobs",
  optionalAuthCandidate,
  cacheRoute({
    key: (req) => `cache:landing:jobs:${serializeQuery(req.query)}`,
    ttl: 300,
    condition: (req) => !req.user,
  }),
  getPublicJobs,
);

router.get(
  "/search-suggestions",
  cacheRoute({
    key: (req) =>
      `cache:landing:search-sugg:${encodeURIComponent(String(req.query.q || "").trim().toLowerCase())}`,
    ttl: 600,
    condition: (req) => Boolean(req.query.q && req.query.q.trim().length >= 1),
  }),
  getSearchSuggestions,
);

router.get(
  "/location-suggestions",
  cacheRoute({
    key: (req) =>
      `cache:landing:loc-sugg:${encodeURIComponent(String(req.query.q || "").trim().toLowerCase())}`,
    ttl: 600,
    condition: (req) => Boolean(req.query.q && req.query.q.trim().length >= 1),
  }),
  getLocationSuggestions,
);

router.get("/companies/:id", cacheRoute({
  key: (req) => `cache:landing:company:${req.params.id}`,
  ttl: 600,
}), getPublicCompanyDetail);

router.get("/employer", cacheRoute({ key: "cache:landing:employer", ttl: 300 }), getEmployerLandingData);

router.get("/:token", cacheRoute({
  key: (req) => `cache:landing:token:${req.params.token}`,
  ttl: 600,
}), getLandingPageData);

module.exports = router;

