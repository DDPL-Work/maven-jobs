const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  createJob,
  approveJob,
} = require("../controllers/job.controller");

// CLIENT or CRM create job
router.post(
  "/",
  auth.protectCRM,
  role("CLIENT", "CRM"),
  createJob
);

// CRM approves job
router.put(
  "/approve/:id",
  auth.protectCRM,
  role("CRM"),
  approveJob
);

module.exports = router;
