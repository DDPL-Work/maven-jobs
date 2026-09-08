const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middleware/rateLimit.middleware");

const {
  registerCandidate,
  login,
  logout,
  me,
  refresh,
  revoke,
  session,
  googleLogin,
  googleStatus,
} = require("../controllers/auth.controller");

router.post("/register", authLimiter, registerCandidate);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.get("/google/status", googleStatus);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.post("/revoke", authLimiter, revoke);
router.get("/me", me);
router.get("/session", session);

module.exports = router;
