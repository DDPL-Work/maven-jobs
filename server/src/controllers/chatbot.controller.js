const ChatBotService = require("../services/openai/ChatBotService");

exports.getThreadMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const threadId = String(req.params.threadId || req.query.threadId || "").trim();

    if (!threadId) {
      return res.status(400).json({ success: false, message: "threadId is required" });
    }

    const messages = await ChatBotService.listMessages({
      threadId,
      userId,
      limit: Number(req.query.limit || 50),
    });

    res.status(200).json({ success: true, data: { messages } });
  } catch (error) {
    next(error);
  }
};

exports.sendChatbotMessage = async (req, res, next) => {
  try {
    const threadId = String(req.body.threadId || "").trim();
    const text = req.body.text;

    const result = await ChatBotService.sendMessage({
      threadId,
      user: req.user,
      text,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.listThreads = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const threads = await ChatBotService.listThreads(userId);
    res.status(200).json({ success: true, data: { threads } });
  } catch (error) {
    next(error);
  }
};

exports.deleteThread = async (req, res, next) => {
  try {
    const threadId = String(req.params.threadId || "").trim();
    if (!threadId) {
      return res.status(400).json({ success: false, message: "threadId is required" });
    }
    const result = await ChatBotService.deleteThread(threadId, req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.clearHistory = async (req, res, next) => {
  try {
    const threadId = String(req.body.threadId || req.params.threadId || "").trim();
    if (!threadId) {
      return res.status(400).json({ success: false, message: "threadId is required" });
    }
    const result = await ChatBotService.clearHistory(threadId, req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getUsageStats = async (req, res, next) => {
  try {
    const stats = await ChatBotService.getUsageStats(req.user._id, req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getMatchedJobs = async (req, res, next) => {
  try {
    const EliteJobMatchService = require("../services/openai/EliteJobMatchService");
    const TierManager = require("../services/openai/TierManager");
    const capabilities = await TierManager.getCapabilities(req.user);
    const jobs = await EliteJobMatchService.getMatchedJobs(req.user._id, capabilities.name);
    res.status(200).json({ success: true, data: { jobs, tier: capabilities.name } });
  } catch (error) {
    next(error);
  }
};

exports.recommendJobs = async (req, res, next) => {
  try {
    const result = await ChatBotService.getJobRecommendations(req.user);
    res.status(200).json({ success: result.success, data: result });
  } catch (error) {
    next(error);
  }
};

exports.recommendCandidates = async (req, res, next) => {
  try {
    const result = await ChatBotService.getCandidateRecommendations(req.user);
    res.status(200).json({ success: result.success, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getTopApplicants = async (req, res, next) => {
  try {
    if (req.user.role !== "CLIENT" || !req.user.companyId) {
      return res.status(403).json({ success: false, message: "Only employers can access this." });
    }
    const applicants = await ChatBotService.getTopApplicants(req.user.companyId);
    res.status(200).json({ success: true, data: { applicants } });
  } catch (error) {
    next(error);
  }
};

exports.uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided." });
    }
    const threadId = String(req.body.threadId || "").trim();
    const result = await ChatBotService.uploadPdf(req.file, req.user, threadId);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json({ success: result.success, data: result });
  } catch (error) {
    next(error);
  }
};

exports.listThreadsWithDetails = async (req, res, next) => {
  try {
    const threads = await ChatBotService.getThreadsWithDetails(req.user._id);
    res.status(200).json({ success: true, data: { threads } });
  } catch (error) {
    next(error);
  }
};
