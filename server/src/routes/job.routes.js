const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  createJob,
  approveJob,
} = require("../controllers/job.controller");

const { invalidateCache } = require("../middleware/cache.middleware");

const jobInvalidatePatterns = [
  "cache:landing:home",
  "cache:landing:employer",
  "cache:landing:candidate-home",
  "cache:landing:jobs:*",
  "cache:candidate:jobs:*",
  "cache:candidate:dashboard:*",
  "cache:company-panel:dashboard:*",
  "cache:company-panel:job-filters:*",
  "cache:company-panel:analytics:*",
];

// CLIENT or CRM create job
router.post(
  "/",
  auth.protectCRM,
  role("CLIENT", "RECRUITER", "CRM"),
  invalidateCache(jobInvalidatePatterns),
  createJob
);

// CRM approves job
router.put(
  "/approve/:id",
  auth.protectCRM,
  role("CRM"),
  invalidateCache(jobInvalidatePatterns),
  approveJob
);

module.exports = router;
