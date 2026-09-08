const express = require("express");
const aiController = require("../controllers/ai.controller");
const { protectCandidate } = require("../middleware/candidate.middleware");
const { aiResumeLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.post("/match-score", protectCandidate, aiController.getMatchScore);
router.post("/resume/enhance", protectCandidate, aiResumeLimiter, aiController.enhanceResume);
router.post("/resume/ats-score", protectCandidate, aiResumeLimiter, aiController.analyzeResumeATS);
router.post("/resume/analyze", protectCandidate, aiResumeLimiter, aiController.analyzeResume);
router.post("/skills/suggest", protectCandidate, aiController.suggestSkills);
router.post("/profile/analyze", protectCandidate, aiResumeLimiter, aiController.analyzeProfile);

module.exports = router;