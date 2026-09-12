const mongoose = require("mongoose");

const jobPostingReportSubscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      index: true,
    },
    subscription: {
      type: String,
      enum: ["disabled", "weekly", "monthly"],
      default: "disabled",
    },
    emailList: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    lastSentAt: {
      type: Date,
      default: null,
    },
    lastSentPeriod: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "JobPostingReportSubscription",
  jobPostingReportSubscriptionSchema
);
