const express = require("express");
const authController = require("../controllers/auth.controller");
const controller = require("../controllers/company-panel.controller");
const employerJobController = require("../controllers/employer-job.controller");
const chatController = require("../controllers/chat.controller");
const resdexController = require("../controllers/resdex.controller");
const nviteController = require("../controllers/nvite.controller");
const folderController = require("../controllers/folder.controller");
const creditController = require("../controllers/credit.controller");
const { protectUser } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { resolveCompanyContext } = require("../middleware/company-context.middleware");
const uploadCompanyMedia = require("../middleware/company-media-upload.middleware");
const multer = require("multer");
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const error = new Error("Only PDF files are allowed.");
      error.statusCode = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
}).single("resume");

const router = express.Router();

router.post("/auth/register", controller.register);
router.post("/auth/login", controller.login);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);

router.use(protectUser);
router.use(role("CLIENT"));
router.use(resolveCompanyContext);

router.get("/dashboard", controller.getDashboard);
router.post("/jobs", controller.createJob);
router.get("/jobs/:id", controller.getJob);
router.patch("/jobs/:id", controller.updateJob);

// Manage Jobs & Responses endpoints
router.get("/jobs-responses", employerJobController.getEmployerJobs);
router.get("/jobs-responses/filters", employerJobController.getEmployerJobFilters);
router.get("/jobs-responses/:jobId/detail", employerJobController.getJobDetailWithResponses);
router.get("/jobs-responses/:jobId/responses", employerJobController.getJobResponses);
router.patch("/jobs-responses/:jobId/applications/:applicationId/status", employerJobController.updateCandidateJobStatus);
router.post("/jobs-responses/:jobId/applications/:applicationId/comments", employerJobController.addCandidateComment);
router.patch("/jobs-responses/:jobId/close", employerJobController.closeEmployerJob);
router.post("/jobs-responses/bulk-close", employerJobController.bulkCloseJobs);
router.post("/jobs-responses/bulk-refresh", employerJobController.bulkRefreshJobs);

// Full Candidate Profile (for employer view when clicking candidate name)
router.get("/candidates/:candidateId/full-profile", employerJobController.getCandidateFullProfile);
router.get("/package-change-requests", controller.getPackageChangeRequests);
router.post("/package-change-requests", controller.createPackageChangeRequest);
router.get("/applications", controller.getApplications);
router.patch("/applications/:applicationId/status", controller.updateApplicationStatus);
router.get("/applications/:applicationId/resume/preview", controller.previewApplicationResume);
router.post("/applications/:applicationId/resume/upload", uploadPdf, controller.uploadApplicationResume);
router.get("/analytics", controller.getAnalytics);
router.get("/activity", controller.getRecentActivity);
router.get("/chats", chatController.getCompanyThreads);
router.get("/chats/:threadId/messages", chatController.getCompanyThreadMessages);
router.post("/chats/:threadId/messages", chatController.sendCompanyMessage);
router.patch("/chats/:threadId/read", chatController.markCompanyThreadRead);
router.post("/reviews/react", controller.toggleReviewReaction);
router.get("/profile", controller.getProfile);
router.patch("/profile", controller.updateProfile);
router.patch("/profile/media", uploadCompanyMedia, controller.updateCompanyMedia);
router.get("/subscriptions", controller.getSubscriptions);

// Account
router.post("/delete-account", controller.deleteAccount);

// AI
router.post("/ai/enhance-description", controller.enhanceDescription);
router.post("/ai/suggest-skills", controller.suggestSkills);

// Notifications
router.get("/notifications", controller.getNotifications);
router.patch("/notifications/:id/read", controller.markNotificationRead);

// Resdex — Resume Search & Database
router.get("/resdex/search", resdexController.searchCandidates);
router.get("/resdex/filters", resdexController.getFilterOptions);
router.post("/resdex/ai-parse", resdexController.aiParseQuery);
router.get("/resdex/searches", resdexController.listSearches);
router.post("/resdex/searches", resdexController.saveSearch);
router.get("/resdex/searches/recent", resdexController.recentSearches);
router.patch("/resdex/searches/:id", resdexController.updateSearch);
router.delete("/resdex/searches/:id", resdexController.deleteSearch);
router.patch("/resdex/searches/:id/pin", resdexController.togglePin);

// NVite — Send MIvites
router.post("/resdex/nvite/send", nviteController.sendNvite);
router.get("/resdex/nvite/list", nviteController.listNvites);
router.get("/resdex/nvite/stats", nviteController.getNviteStats);

// Folders — Candidate Folder Management
router.get("/folders", folderController.listFolders);
router.post("/folders", folderController.createFolder);
router.get("/folders/duplicate/:id", folderController.duplicateFolder);
router.post("/folders/candidates/move", folderController.moveCandidates);
router.post("/folders/candidates/copy", folderController.copyCandidates);
router.get("/folders/:id", folderController.getFolder);
router.patch("/folders/:id", folderController.updateFolder);
router.delete("/folders/:id", folderController.deleteFolder);
router.post("/folders/:id/candidates", folderController.addCandidate);
router.delete("/folders/:id/candidates/:candidateId", folderController.removeCandidate);
router.patch("/folders/:id/candidates/:candidateId", folderController.updateCandidate);
router.post("/folders/:id/candidates/bulk-remove", folderController.bulkRemoveCandidates);

// Credits — Resume Search & Download Credits
router.get("/credits", creditController.getCredits);
router.get("/credits/history", creditController.getCreditHistory);
router.post("/credits/topup", creditController.topupCredits);
router.post("/credits/verify", creditController.verifyTopup);
router.post("/credits/use", creditController.useCredits);
router.post("/credits/search", creditController.searchCredits);
router.get("/credits/check/:candidateId", creditController.checkResumeAccess);

module.exports = router;
