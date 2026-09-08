// routes/crm.routes.js
const express = require("express");
const router = express.Router();
const { registerCrmUser, getMyProfile } = require("../controllers/crm.controller");
const { protectCRM } = require("../middleware/auth.middleware");

router.post("/register", registerCrmUser);
router.get("/me", protectCRM, getMyProfile);

module.exports = router;
