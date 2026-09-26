const mongoose = require("mongoose");

const companyNotificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["ALL", "CLIENT", "RECRUITER"],
      default: "ALL",
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "APPLICATION",
        "JOB",
        "INTERVIEW",
        "OFFER",
        "CHAT",
        "SYSTEM",
        "CAMPAIGN",
        "QUOTA",
        "TEAM",
      ],
      default: "SYSTEM",
    },
    status: {
      type: String,
      enum: ["UNREAD", "READ"],
      default: "UNREAD",
      index: true,
    },
    actionUrl: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

companyNotificationSchema.index({ companyId: 1, createdAt: -1 });
companyNotificationSchema.index({ companyId: 1, recipientUserId: 1, status: 1 });

module.exports = mongoose.model("CompanyNotification", companyNotificationSchema);
