const express = require("express");
const multer = require("multer");
const authController = require("../controllers/auth.controller");
const candidateController = require("../controllers/candidate.controller");
const chatController = require("../controllers/chat.controller");
const {
  protectCandidate,
  protectCandidateManagers,
  optionalAuthCandidate,
} = require("../middleware/candidate.middleware");
const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");
const { aiResumeLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.post("/auth/register", upload.single("resume"), candidateController.register);
router.post("/auth/login", candidateController.login);
router.post("/auth/google", authController.googleLogin);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);

router.get("/landing/home", cacheRoute({ key: "cache:landing:candidate-home", ttl: 120 }), candidateController.getLandingHome);
router.get("/landing/:token", candidateController.getLandingByToken);

router.get("/public/landing/:shareId", candidateController.getPublicProfileByShareId);

router.get("/auth/me", protectCandidate, candidateController.me);
router.get(
  "/dashboard",
  protectCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:dashboard:${req.user?._id || req.user?.id}`,
    ttl: 120,
  }),
  candidateController.getDashboard,
);
router.get("/quiz/ranking", candidateController.getQuizRanking);
router.get("/quiz/today", protectCandidate, candidateController.getTodayQuiz);
router.post("/quiz/today/submit", protectCandidate, candidateController.submitTodayQuiz);

router.get(
  "/jobs",
  optionalAuthCandidate,
  cacheRoute({
    key: (req) => {
      const q = new URLSearchParams(
        Object.entries(req.query).map(([k, v]) => [k, String(v)]),
      );
      return `cache:candidate:jobs:${req.user?._id || req.user?.id || 'anon'}:${q.toString() || "all"}`;
    },
    ttl: 300,
  }),
  candidateController.getJobs,
);
router.get(
  "/jobs/saved",
  protectCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:savedJobs:${req.user?._id || req.user?.id}`,
    ttl: 120,
  }),
  candidateController.getSavedJobs,
);
router.get("/jobs/suggest", candidateController.getJobSuggestions);
router.get(
  "/jobs/:id",
  optionalAuthCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:job:${req.params.id}:${req.user?._id || 'anon'}`,
    ttl: 300,
  }),
  candidateController.getJobDetail,
);
router.get("/jobs/:id/similar", optionalAuthCandidate, candidateController.getSimilarJobs);
router.get("/jobs/:id/match-score", protectCandidate, candidateController.getJobMatchScore);
router.patch(
  "/jobs/:id/save",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:savedJobs:${req.user?._id || req.user?.id}`,
    (req) => `cache:candidate:jobs:${req.user?._id || req.user?.id}:*`,
  ]),
  candidateController.toggleSavedJob,
);
router.get("/companies/filter-options", candidateController.getCompanyFilterOptions);
router.get("/companies/stats", candidateController.getCompanyStats);
router.get(
  "/companies",
  cacheRoute({
    key: (req) => `cache:candidate:companies:${req.user?._id || 'anon'}:${JSON.stringify(req.query)}`,
    ttl: 600,
  }),
  candidateController.getCompanies,
);
router.get(
  "/companies/:id",
  cacheRoute({
    key: (req) => `cache:candidate:company:${req.params.id}`,
    ttl: 600,
  }),
  candidateController.getCompanyDetail,
);
router.patch(
  "/companies/:id/follow",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:company:${req.params.id}`,
    (req) => `cache:candidate:dashboard:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.toggleCompanyFollow,
);
router.post(
  "/jobs/:id/interest",
  protectCandidate,
  candidateController.expressInterest,
);
router.post("/companies/:id/reviews", protectCandidate, candidateController.submitCompanyReview);
router.get(
  "/applications",
  protectCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:applications:${req.user?._id || req.user?.id}`,
    ttl: 120,
  }),
  candidateController.getApplications,
);
router.post(
  "/applications",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:applications:${req.user?._id || req.user?.id}`,
    (req) => `cache:candidate:dashboard:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.createApplication,
);
router.get("/nvites", protectCandidate, candidateController.getNvites);
router.get("/chats", protectCandidate, chatController.getCandidateThreads);
router.get("/chats/:threadId/messages", protectCandidate, chatController.getCandidateThreadMessages);
router.post("/chats/:threadId/messages", protectCandidate, chatController.sendCandidateMessage);
router.patch("/chats/:threadId/read", protectCandidate, chatController.markCandidateThreadRead);
router.get(
  "/profile",
  protectCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:profile:${req.user?._id || req.user?.id}`,
    ttl: 600,
  }),
  candidateController.getProfile,
);
router.patch(
  "/profile",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:profile:${req.user?._id || req.user?.id}`,
    (req) => `cache:candidate:dashboard:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.updateProfile,
);
router.get("/profile/history", protectCandidate, candidateController.getProfileHistory);
router.post(
  "/profile/resume",
  protectCandidate,
  upload.single("resume"),
  invalidateCache([
    (req) => `cache:candidate:profile:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.uploadResume,
);
router.delete(
  "/profile/resume",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:profile:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.deleteResume,
);
router.get(
  "/profile/resume",
  protectCandidate,
  candidateController.serveResume,
);
router.post(
  "/profile/image",
  protectCandidate,
  upload.single("image"),
  invalidateCache([
    (req) => `cache:candidate:profile:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.uploadProfileImage,
);
router.post(
  "/profile/project-media",
  protectCandidate,
  upload.single("image"),
  candidateController.uploadProjectMedia,
);
router.get(
  "/notifications",
  protectCandidate,
  cacheRoute({
    key: (req) => `cache:candidate:notifications:${req.user?._id || req.user?.id}`,
    ttl: 30,
  }),
  candidateController.getNotifications,
);
router.patch(
  "/notifications/:id/read",
  protectCandidate,
  invalidateCache([
    (req) => `cache:candidate:notifications:${req.user?._id || req.user?.id}`,
  ]),
  candidateController.markNotificationRead,
);

router.post("/resume/enhance", protectCandidate, aiResumeLimiter, candidateController.enhanceResumeWithAI);
router.post("/resume/ats-score", protectCandidate, aiResumeLimiter, candidateController.analyzeResumeATS);
router.post("/resume/analyze", protectCandidate, aiResumeLimiter, candidateController.analyzeResume);
router.post("/ai/suggest-skills-autocomplete", protectCandidate, candidateController.suggestSkillsAutocomplete);
router.get("/ai/profile-analysis", protectCandidate, aiResumeLimiter, candidateController.analyzeProfileWithAI);

router.get(
  "/exports/candidates",
  protectCandidateManagers,
  candidateController.exportCandidateProfiles,
);
router.get(
  "/exports/resumes",
  protectCandidateManagers,
  candidateController.exportCandidateResumes,
);

router.get("/:id", candidateController.getPublicCandidateById);
router.get("/:id/resume", candidateController.getPublicCandidateResume);
router.get("/:id/resume/download", candidateController.downloadPublicCandidateResume);

module.exports = router;
