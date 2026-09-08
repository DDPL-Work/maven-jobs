const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  createCompany,
  updatePackage,
} = require("../controllers/company.controller");

// FSE creates company
router.post(
  "/",
  auth.protectUser,
  role("FSE"),
  createCompany
);

// CRM updates package
router.put(
  "/:id/package",
  auth.protectCRM,
  role("CRM"),
  updatePackage
);

module.exports = router;
