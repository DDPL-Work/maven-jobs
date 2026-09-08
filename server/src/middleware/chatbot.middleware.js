const TierManager = require("../services/openai/TierManager");
const ChatBotMessage = require("../models/ChatBotMessage");

const chatbotRateLimiter = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const capabilities = await TierManager.getCapabilities(req.user);
    const dailyLimit = capabilities.dailyMessageLimit || 10;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await ChatBotMessage.countDocuments({
      userId: req.user._id,
      senderRole: "USER",
      createdAt: { $gte: todayStart },
    });

    if (todayCount >= dailyLimit) {
      const tierName = capabilities.name || "FREE";
      return res.status(429).json({
        success: false,
        message: `Daily message limit reached for ${tierName} tier (${dailyLimit} messages). Please try again tomorrow or upgrade your plan.`,
        data: {
          tier: tierName,
          dailyLimit,
          dailyUsed: todayCount,
          resetAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }

    req.chatbot = {
      capabilities,
      dailyUsed: todayCount,
      dailyLimit,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const validateChatbotInput = (req, res, next) => {
  if (req.method === "POST" && req.body) {
    let text = String(req.body.text || "").trim();
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, 4000);
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }
    req.body.text = text;
  }
  next();
};

module.exports = {
  chatbotRateLimiter,
  validateChatbotInput,
};
