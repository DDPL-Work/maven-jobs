const mongoose = require("mongoose");

const aiUsageLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    feature: {
      type: String,
      required: true,
      enum: [
        "IMPROVE_JD",
        "IMPROVE_REQUIREMENTS",
        "IMPROVE_RESPONSIBILITIES",
        "WRITE_FULL_JD",
        "SCREENING_QUESTIONS",
        "GENERAL_AI",
      ],
      index: true,
    },
    creditsUsed: {
      type: Number,
      default: 1,
    },
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    planType: {
      type: String,
      default: "FREE",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

aiUsageLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("AiUsageLog", aiUsageLogSchema);
