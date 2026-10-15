const express = require("express");
const multer = require("multer");
const chatbotController = require("../controllers/chatbot.controller");
const { protectUser } = require("../middleware/auth.middleware");
const {
  chatbotRateLimiter,
  validateChatbotInput,
} = require("../middleware/chatbot.middleware");
const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");

const router = express.Router();

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const err = new Error("Only PDF files are allowed.");
      err.statusCode = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

router.use(protectUser);

const chatbotCacheInvalidate = [
  (req) => `cache:chatbot:usage:${req.user?._id || req.user?.id}`,
  (req) => `cache:chatbot:threads:${req.user?._id || req.user?.id}`,
];

router.get("/threads", cacheRoute({
  key: (req) => `cache:chatbot:threads:${req.user?._id || req.user?.id}`,
  ttl: 180,
}), chatbotController.listThreads);
router.get("/threads/details", chatbotController.listThreadsWithDetails);
router.get("/threads/:threadId/messages", chatbotController.getThreadMessages);
router.get("/usage", cacheRoute({
  key: (req) => `cache:chatbot:usage:${req.user?._id || req.user?.id}`,
  ttl: 180,
}), chatbotController.getUsageStats);
router.get("/matched-jobs", chatbotController.getMatchedJobs);
router.get("/recommend-jobs", chatbotController.recommendJobs);
router.get("/recommend-candidates", cacheRoute({
  key: (req) => `cache:chatbot:recommend-candidates:${req.user?.companyId || req.user?._id || req.user?.id}`,
  ttl: 1800,
}), chatbotController.recommendCandidates);
router.get("/top-applicants", chatbotController.getTopApplicants);

router.post("/message", chatbotRateLimiter, validateChatbotInput, invalidateCache(chatbotCacheInvalidate), chatbotController.sendChatbotMessage);
router.post("/upload", pdfUpload.single("file"), chatbotController.uploadPdf);

router.delete("/threads/:threadId", invalidateCache(chatbotCacheInvalidate), chatbotController.deleteThread);
router.post("/threads/:threadId/clear", invalidateCache(chatbotCacheInvalidate), chatbotController.clearHistory);

module.exports = router;
