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
const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");
const { optionalAuthCandidate } = require("../middleware/candidate.middleware");

router.get("/home", cacheRoute({ key: "cache:landing:home", ttl: 120 }), getHomeLandingData);

router.get(
  "/jobs",
  optionalAuthCandidate,
  cacheRoute({
    key: (req) => {
      const q = new URLSearchParams(
        Object.entries(req.query).map(([k, v]) => [k, String(v)]),
      );
      return `cache:landing:jobs:${q.toString() || "all"}`;
    },
    ttl: 300,
    condition: (req) => !req.user && (!req.query.page || req.query.page === "1"),
  }),
  getPublicJobs,
);

router.get("/search-suggestions", getSearchSuggestions);

router.get("/location-suggestions", getLocationSuggestions);

router.get("/companies/:id", cacheRoute({
  key: (req) => `cache:landing:company:${req.params.id}`,
  ttl: 600,
}), getPublicCompanyDetail);

router.get("/employer", cacheRoute({ key: "cache:landing:employer", ttl: 300 }), getEmployerLandingData);

router.get("/:token", getLandingPageData);

module.exports = router;
