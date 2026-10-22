const express = require("express");
const authController = require("../controllers/auth.controller");
const controller = require("../controllers/company-panel.controller");
const employerJobController = require("../controllers/employer-job.controller");
const chatController = require("../controllers/chat.controller");
const resdexController = require("../controllers/resdex.controller");
const nviteController = require("../controllers/nvite.controller");
const folderController = require("../controllers/folder.controller");
const creditController = require("../controllers/credit.controller");
const employerReportController = require("../controllers/employer-report.controller");
const userManagementController = require("../controllers/user-management.controller");
const passwordResetController = require("../controllers/passwordReset.controller");
const {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} = require("./passwordReset.routes");
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

router.post("/auth/send-mobile-otp", controller.sendMobileOtp);
router.post("/auth/verify-mobile-otp", controller.verifyMobileOtp);
router.post("/auth/send-email-otp", controller.sendEmailOtp);
router.post("/auth/verify-email-otp", controller.verifyEmailOtp);

// Employer Mobile OTP Login routes (CLIENT & RECRUITER)
router.post("/auth/mobile-login/send-otp", controller.sendEmployerMobileLoginOtp);
router.post("/auth/mobile-login/verify-otp", controller.verifyEmployerMobileLoginOtp);

// Public Employer Password Reset routes
router.post("/auth/forgot-password", forgotPasswordLimiter, passwordResetController.employerForgotPassword);
router.post("/auth/verify-reset-otp", verifyOtpLimiter, passwordResetController.employerVerifyResetOTP);
router.post("/auth/reset-password", resetPasswordLimiter, passwordResetController.employerResetPassword);

router.post("/auth/employer/forgot-password", forgotPasswordLimiter, passwordResetController.employerForgotPassword);
router.post("/auth/employer/verify-reset-otp", verifyOtpLimiter, passwordResetController.employerVerifyResetOTP);
router.post("/auth/employer/reset-password", resetPasswordLimiter, passwordResetController.employerResetPassword);

const { cacheRoute, invalidateCache, serializeQuery } = require("../middleware/cache.middleware");

const companyDashboardInvalidate = [
  (req) => `cache:company-panel:dashboard:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:analytics:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:job-filters:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:profile:${req.company?._id || req.user?.companyId}`,
  (req) => `cache:company-panel:jobs-responses:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:job-responses:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:candidate-profile:*`,
];

const companyFolderInvalidate = [
  (req) => `cache:company-panel:folders:*:${req.company?._id || req.user?.companyId}:*`,
];

const companySubscriptionInvalidate = [
  (req) => `cache:company-panel:subscriptions:${req.company?._id || req.user?.companyId}`,
  (req) => `cache:company-panel:quota-usage:${req.company?._id || req.user?.companyId}:*`,
  (req) => `cache:company-panel:dashboard:${req.company?._id || req.user?.companyId}:*`,
];

router.get("/packages", cacheRoute({ key: "cache:company-panel:packages", ttl: 900 }), controller.getPackages);

router.use(protectUser);
router.use(role("CLIENT", "RECRUITER"));

// ── FAST-PATH CACHED ROUTES ──────────────────────────────────────────
// cacheRoute runs FIRST before database/company resolution.
// Cache hits return in 1-2ms without any MongoDB queries!
// Cache misses fall through to resolveCompanyContext and controller.

router.get("/dashboard", cacheRoute({
  key: (req) => {
    const companyId = req.user?.companyId;
    const role = req.user?.role || "CLIENT";
    const userId = req.user?._id || req.user?.id;
    return `cache:company-panel:dashboard:${companyId}:${role}:${role === "RECRUITER" ? userId : "all"}`;
  },
  ttl: 300,
}), resolveCompanyContext, controller.getDashboard);

router.get("/jobs-responses/filters", cacheRoute({
  key: (req) => `cache:company-panel:job-filters:${req.user?.companyId}:${req.user?._id || req.user?.id}`,
  ttl: 300,
}), resolveCompanyContext, employerJobController.getEmployerJobFilters);

router.get("/analytics", cacheRoute({
  key: (req) => {
    const companyId = req.user?.companyId;
    const role = req.user?.role || "CLIENT";
    const userId = req.user?._id || req.user?.id;
    return `cache:company-panel:analytics:${companyId}:${role}:${role === "RECRUITER" ? userId : "all"}:${serializeQuery(req.query)}`;
  },
  ttl: 300,
}), resolveCompanyContext, controller.getAnalytics);

router.get("/quota-usage", cacheRoute({
  key: (req) => `cache:company-panel:quota-usage:${req.user?.companyId}:${req.user?._id || req.user?.id}`,
  ttl: 120,
}), resolveCompanyContext, controller.getQuotaUsage);

router.get("/profile", cacheRoute({
  key: (req) => `cache:company-panel:profile:${req.user?.companyId}`,
  ttl: 600,
}), resolveCompanyContext, controller.getProfile);

router.get("/subscriptions", cacheRoute({
  key: (req) => `cache:company-panel:subscriptions:${req.user?.companyId}`,
  ttl: 180,
}), resolveCompanyContext, controller.getSubscriptions);

router.get("/resdex/filters", cacheRoute({
  key: "cache:company-panel:resdex:filters",
  ttl: 900,
}), resolveCompanyContext, resdexController.getFilterOptions);

// ── STANDARD ROUTES (Require full company context) ───────────────────
router.use(resolveCompanyContext);

router.post("/jobs", invalidateCache(companyDashboardInvalidate), controller.createJob);
router.get("/jobs/:id", controller.getJob);
router.patch("/jobs/:id", invalidateCache(companyDashboardInvalidate), controller.updateJob);

// Manage Jobs & Responses endpoints
router.get("/jobs-responses", cacheRoute({
  key: (req) => `cache:company-panel:jobs-responses:${req.company?._id || req.user?.companyId}:${req.user?.role || "CLIENT"}:${req.user?._id || req.user?.id}:${serializeQuery(req.query)}`,
  ttl: 120,
}), employerJobController.getEmployerJobs);

router.get("/jobs-responses/:jobId/detail", cacheRoute({
  key: (req) => `cache:company-panel:jobs-responses:detail:${req.company?._id || req.user?.companyId}:${req.params.jobId}`,
  ttl: 180,
}), employerJobController.getJobDetailWithResponses);

router.get("/jobs-responses/:jobId/nvite-recipients", employerJobController.getJobNviteRecipients);

router.get("/jobs-responses/:jobId/responses", cacheRoute({
  key: (req) => `cache:company-panel:job-responses:${req.company?._id || req.user?.companyId}:${req.params.jobId}:${serializeQuery(req.query)}`,
  ttl: 120,
}), employerJobController.getJobResponses);

router.patch("/jobs-responses/:jobId/applications/:applicationId/status", invalidateCache(companyDashboardInvalidate), employerJobController.updateCandidateJobStatus);
router.post("/jobs-responses/:jobId/applications/:applicationId/comments", invalidateCache(companyDashboardInvalidate), employerJobController.addCandidateComment);
router.patch("/jobs-responses/:jobId/close", invalidateCache(companyDashboardInvalidate), employerJobController.closeEmployerJob);
router.patch("/jobs-responses/:jobId/open", invalidateCache(companyDashboardInvalidate), employerJobController.openEmployerJob);
router.post("/jobs-responses/bulk-close", invalidateCache(companyDashboardInvalidate), employerJobController.bulkCloseJobs);
router.post("/jobs-responses/bulk-refresh", invalidateCache(companyDashboardInvalidate), employerJobController.bulkRefreshJobs);
router.post("/jobs-responses/bulk-collaborators", invalidateCache(companyDashboardInvalidate), employerJobController.updateCollaborators);

// Full Candidate Profile (for employer view when clicking candidate name)
router.get("/candidates/:candidateId/full-profile", cacheRoute({
  key: (req) => `cache:company-panel:candidate-profile:${req.params.candidateId}:${req.query.applicationId || req.query.jobId || "base"}`,
  ttl: 300,
}), employerJobController.getCandidateFullProfile);
router.get("/candidates/:candidateId/also-viewed", employerJobController.getAlsoViewedCandidates);
router.post("/candidates/:candidateId/schedule-video-call", employerJobController.scheduleVideoCall);
router.get("/scheduled-calls", employerJobController.getScheduledCalls);
router.patch("/scheduled-calls/:id", employerJobController.updateScheduledCall);
router.get("/package-change-requests", controller.getPackageChangeRequests);
router.post("/package-change-requests", invalidateCache([...companyDashboardInvalidate, ...companySubscriptionInvalidate]), controller.createPackageChangeRequest);

router.get("/applications", controller.getApplications);
router.patch("/applications/:applicationId/status", invalidateCache(companyDashboardInvalidate), controller.updateApplicationStatus);
router.get("/applications/:applicationId/resume/preview", controller.previewApplicationResume);
router.post("/applications/:applicationId/resume/upload", uploadPdf, controller.uploadApplicationResume);
router.get("/quota-management", controller.getQuotaManagement);
router.patch("/quota-management", invalidateCache(companySubscriptionInvalidate), controller.updateQuotaManagement);
router.get("/activity", controller.getRecentActivity);
router.get("/chats", chatController.getCompanyThreads);
router.get("/chats/:threadId/messages", chatController.getCompanyThreadMessages);
router.post("/chats/:threadId/messages", chatController.sendCompanyMessage);
router.patch("/chats/:threadId/read", chatController.markCompanyThreadRead);
router.post("/reviews/react", controller.toggleReviewReaction);
router.patch("/profile", invalidateCache(companyDashboardInvalidate), controller.updateProfile);
router.patch("/profile/media", uploadCompanyMedia, invalidateCache(companyDashboardInvalidate), controller.updateCompanyMedia);
router.post("/subscriptions/request-invoice", controller.requestSubscriptionInvoice);

// Account
router.post("/delete-account", controller.deleteAccount);

// AI
router.post("/ai/enhance-description", controller.enhanceDescription);
router.post("/ai/screening-questions", controller.generateScreeningQuestions);
router.post("/ai/generate-screening-questions", controller.generateScreeningQuestions);
router.post("/ai/suggest-skills", controller.suggestSkills);

// Notifications
router.get("/notifications", controller.getNotifications);
router.patch("/notifications/:id/read", controller.markNotificationRead);
router.patch("/notifications/read-all", controller.markAllNotificationsRead);
router.post("/notifications/fcm-token", controller.saveFcmToken);
router.delete("/notifications/fcm-token", controller.removeFcmToken);

// Resdex — Resume Search & Database
router.get("/resdex/search", cacheRoute({
  key: (req) => `cache:resdex:search:${req.company?._id || req.user?.companyId}:${serializeQuery(req.query)}`,
  ttl: 180,
}), resdexController.searchCandidates);
router.post("/resdex/ai-parse", resdexController.aiParseQuery);
router.get("/resdex/searches", resdexController.listSearches);
router.post("/resdex/searches", resdexController.saveSearch);
router.get("/resdex/searches/recent", resdexController.recentSearches);
router.post("/resdex/searches/record-recent", resdexController.recordRecentSearch);
router.patch("/resdex/searches/:id", resdexController.updateSearch);
router.delete("/resdex/searches/:id", resdexController.deleteSearch);
router.patch("/resdex/searches/:id/pin", resdexController.togglePin);
router.post("/resdex/forward-cv", resdexController.forwardCV);
router.get("/resdex/shared-cvs", resdexController.getSharedCVs);
router.post("/resdex/reminders", resdexController.setCandidateReminder);
router.get("/resdex/reminders", resdexController.getCandidateReminders);
router.delete("/resdex/reminders/:id", resdexController.deleteCandidateReminder);
// NVite — Send MIvites
router.post("/resdex/nvite/send", nviteController.sendNvite);
router.get("/resdex/nvite/list", nviteController.listNvites);
router.get("/resdex/nvite/stats", nviteController.getNviteStats);

// Folders — Candidate Folder Management
router.get("/folders", cacheRoute({
  key: (req) => `cache:company-panel:folders:list:${req.company?._id || req.user?.companyId}:${req.user?._id || req.user?.id}`,
  ttl: 180,
}), folderController.listFolders);
router.get("/folders/saved-profiles", cacheRoute({
  key: (req) => `cache:company-panel:folders:saved:${req.company?._id || req.user?.companyId}:${req.user?._id || req.user?.id}:${serializeQuery(req.query)}`,
  ttl: 180,
}), folderController.getAllSavedProfiles);
router.post("/folders", invalidateCache(companyFolderInvalidate), folderController.createFolder);
router.get("/folders/candidates/contacted", cacheRoute({
  key: (req) => `cache:company-panel:folders:contacted:${req.company?._id || req.user?.companyId}:${req.user?._id || req.user?.id}`,
  ttl: 180,
}), folderController.getContactedCandidates);
router.get("/folders/duplicate/:id", folderController.duplicateFolder);
router.post("/folders/candidates/move", invalidateCache(companyFolderInvalidate), folderController.moveCandidates);
router.post("/folders/candidates/copy", invalidateCache(companyFolderInvalidate), folderController.copyCandidates);
router.get("/folders/:id", cacheRoute({
  key: (req) => `cache:company-panel:folders:detail:${req.company?._id || req.user?.companyId}:${req.params.id}`,
  ttl: 180,
}), folderController.getFolder);
router.patch("/folders/:id", invalidateCache(companyFolderInvalidate), folderController.updateFolder);
router.delete("/folders/:id", invalidateCache(companyFolderInvalidate), folderController.deleteFolder);
router.post("/folders/:id/candidates", invalidateCache(companyFolderInvalidate), folderController.addCandidate);
router.delete("/folders/:id/candidates/:candidateId", invalidateCache(companyFolderInvalidate), folderController.removeCandidate);
router.patch("/folders/:id/candidates/:candidateId", invalidateCache(companyFolderInvalidate), folderController.updateCandidate);
router.post("/folders/:id/candidates/:candidateId/comments", invalidateCache(companyFolderInvalidate), folderController.addCandidateComment);
router.delete("/folders/:id/candidates/:candidateId/comments/:commentId", invalidateCache(companyFolderInvalidate), folderController.deleteCandidateComment);
router.post("/folders/:id/candidates/bulk-remove", invalidateCache(companyFolderInvalidate), folderController.bulkRemoveCandidates);
router.post("/folders/:id/test-alert", folderController.sendTestAlert);

// Credits — Resume Search & Download Credits
router.get("/credits", creditController.getCredits);
router.get("/credits/history", creditController.getCreditHistory);
router.post("/credits/topup", creditController.topupCredits);
router.post("/credits/verify", creditController.verifyTopup);
router.post("/credits/use", creditController.useCredits);
router.post("/credits/search", creditController.searchCredits);
router.get("/credits/check/:candidateId", creditController.checkResumeAccess);

// Reports — Job Posting & Resdex usage reports
router.get("/reports/job-posting", cacheRoute({
  key: (req) => `cache:company-panel:reports:job-posting:${req.company?._id || req.user?.companyId}:${serializeQuery(req.query)}`,
  ttl: 300,
}), employerReportController.getJobPostingReport);
router.get("/reports/job-posting/subscription", employerReportController.getJobPostingReportSubscription);
router.post("/reports/job-posting/subscription", employerReportController.saveJobPostingReportSubscription);
router.post("/reports/job-posting/send-email", employerReportController.sendJobPostingReportEmail);

router.get("/reports/resdex", cacheRoute({
  key: (req) => `cache:company-panel:reports:resdex:${req.company?._id || req.user?.companyId}:${serializeQuery(req.query)}`,
  ttl: 300,
}), employerReportController.getResdexReport);
router.get("/reports/resdex/subscription", employerReportController.getResdexReportSubscription);
router.post("/reports/resdex/subscription", employerReportController.saveResdexReportSubscription);
router.post("/reports/resdex/send-email", employerReportController.sendResdexReportEmail);


// User Management (Sub-users & recruiters)
router.get("/user-management/users", userManagementController.getUsers);
router.post("/user-management/users", userManagementController.createUser);
router.put("/user-management/users/:id", userManagementController.updateUser);
router.post("/user-management/users/bulk-delete", userManagementController.deleteUsers);
router.put("/user-management/users/:id/password", userManagementController.changeUserPassword);
router.put("/user-management/users/time-restrictions", userManagementController.updateTimeRestrictions);

  // Allowed Domains
  router.get("/user-management/domains", userManagementController.getCompanyDomains);
  router.post("/user-management/domains", userManagementController.addCompanyDomain);
  router.put("/user-management/domains", userManagementController.editCompanyDomain);
  router.delete("/user-management/domains", userManagementController.deleteCompanyDomain);
  router.post("/user-management/domains/otp", userManagementController.sendDomainOtp);
  router.post("/user-management/domains/verify-otp", userManagementController.verifyDomainOtp);
// Security Settings
router.get("/user-management/security-settings", userManagementController.getSecuritySettings);
router.put("/user-management/security-settings", userManagementController.updateSecuritySettings);

// Product Settings
router.get("/product-settings", userManagementController.getProductSettings);
router.put("/product-settings", userManagementController.updateProductSettings);
router.post("/product-settings/reset-resdex-logins", userManagementController.resetSubusersResdexLogin);

router.patch("/auth/change-password", controller.changePassword);

module.exports = router;
