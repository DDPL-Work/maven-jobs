const mongoose = require("mongoose");

/**
 * ResdexReportLog Schema
 * Tracks granular recruiter/subuser actions performed in Resdex:
 * - Searches performed & queries
 * - CV Views (Web & Mobile App)
 * - CV Downloads in Excel
 * - CV Downloads in Word
 * - NVites sent
 * - Duplicate Candidates Detected
 * - Resumes Forwarded
 * - SMS Sent
 * - View Phone / Direct Calls & Durations
 * - Subuser Logins & Session durations
 * - Comments / Notes & Ratings added to candidates in Folders
 */
const resdexReportLogSchema = new mongoose.Schema(
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
    subuserName: {
      type: String,
      default: "Recruiter",
      trim: true,
    },
    subuserEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    actionType: {
      type: String,
      enum: [
        "SEARCH",
        "CV_VIEW",
        "CV_DOWNLOAD_EXCEL",
        "CV_DOWNLOAD_WORD",
        "NVITE_SENT",
        "DUPLICATE_CANDIDATE_DETECTED",
        "RESUME_FORWARDED",
        "SMS_SENT",
        "PHONE_VIEW_CALL",
        "USER_LOGIN",
        "USER_LOGOUT",
        "CANDIDATE_COMMENT",
        "CANDIDATE_CONTACTED",
      ],
      required: true,
      index: true,
    },
    // Target Candidate details (if action targets a candidate)
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
      index: true,
    },
    candidateName: {
      type: String,
      default: "",
      trim: true,
    },
    candidateRole: {
      type: String,
      default: "",
      trim: true,
    },
    // Category or section under Resdex
    section: {
      type: String,
      enum: [
        "DATABASE_USAGE",
        "SEARCH_REPORT",
        "USER_LOGIN",
        "CONTACTED_CANDIDATE_MIS",
        "COMMENTS_REPORTS",
        "CALL_REPORT",
      ],
      default: "DATABASE_USAGE",
      index: true,
    },
    // Device / Platform info (Web vs App)
    platform: {
      type: String,
      enum: ["WEB", "APP"],
      default: "WEB",
    },
    // Search specific metrics
    searchQuery: {
      type: String,
      default: "",
      trim: true,
    },
    searchFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    // Call / Contact specific metrics
    callDurationSeconds: {
      type: Number,
      default: 0, // In seconds (e.g. converted to min:sec)
    },
    callConnected: {
      type: Boolean,
      default: false,
    },
    contactChannel: {
      type: String,
      enum: ["NVITE", "EMAIL", "PHONE", "SMS", "WHATSAPP", "OTHER"],
      default: "NVITE",
    },
    contactStatus: {
      type: String,
      default: "Delivered", // 'Delivered' | 'Responded' | 'Opened' | 'Failed'
    },
    // Login session tracking metrics
    loginTime: {
      type: Date,
      default: null,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    sessionDurationMinutes: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    // Comments & Evaluation tracking
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    folderName: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    commentText: {
      type: String,
      default: "",
    },
    // Credit expenditure if credits deducted
    creditsUsed: {
      type: Number,
      default: 0,
      min: 0,
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

// Indexes for fast date filtering, aggregations, and grouped queries
resdexReportLogSchema.index({ companyId: 1, section: 1, actionDate: -1 });
resdexReportLogSchema.index({ companyId: 1, userId: 1, actionType: 1, actionDate: -1 });
resdexReportLogSchema.index({ companyId: 1, actionType: 1, actionDate: -1 });
resdexReportLogSchema.index({ companyId: 1, candidateId: 1, actionType: 1 });

module.exports = mongoose.model("ResdexReportLog", resdexReportLogSchema);
