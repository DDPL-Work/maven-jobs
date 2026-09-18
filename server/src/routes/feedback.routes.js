const express = require("express");
const { submitFeedback } = require("../controllers/feedback.controller");
const { protectUser } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { resolveCompanyContext } = require("../middleware/company-context.middleware");

const router = express.Router();

router.post("/", protectUser, role("CLIENT", "RECRUITER"), resolveCompanyContext, submitFeedback);

module.exports = router;
