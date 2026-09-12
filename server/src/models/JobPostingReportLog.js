const mongoose = require("mongoose");

/**
 * JobPostingReportLog Schema
 * Stores activity and usage events related to Job Postings for reporting & analytics
 * Directly powers Job Posting One-Click & Customised reports (User-wise & Job-wise)
 */
const jobPostingReportLogSchema = new mongoose.Schema(
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
    userName: {
      type: String,
      default: "Recruiter",
      trim: true,
    },
    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    alias: {
      type: String,
      default: "",
      trim: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
      index: true,
    },
    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },
    actionType: {
      type: String,
      enum: [
        "JOB_POST",
        "JOB_EDIT",
        "JOB_REFRESH",
        "JOB_DELETE",
        "JOB_CLOSE",
        "JOB_VIEW",
        "APPLICATION_RECEIVED",
      ],
      required: true,
      index: true,
    },
    // Credit or monetary cost deduction incurred by this specific action
    expense: {
      type: Number,
      default: 0,
      min: 0,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "Active",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid aggregation queries across date ranges & companies
jobPostingReportLogSchema.index({ companyId: 1, actionDate: -1 });
jobPostingReportLogSchema.index({ companyId: 1, userId: 1, actionType: 1, actionDate: -1 });
jobPostingReportLogSchema.index({ companyId: 1, jobId: 1, actionType: 1, actionDate: -1 });

module.exports = mongoose.model("JobPostingReportLog", jobPostingReportLogSchema);
