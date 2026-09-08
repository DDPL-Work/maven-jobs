const mongoose = require("mongoose");

const chatBotThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, enum: ["CLIENT", "CANDIDATE", "COMPANY", "ADMIN", "CRM"], default: "CLIENT", index: true },

    title: { type: String, default: "ChatBot" },

    userTier: {
      type: String,
      enum: ["FREE", "PRO", "ELITE", "STANDARD", "PREMIUM"],
      default: "FREE",
    },

    profileSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    messageCount: { type: Number, default: 0 },

    lastActivityAt: { type: Date, default: Date.now },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Allow multiple threads per user (e.g., different sessions)
chatBotThreadSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatBotThread", chatBotThreadSchema);
