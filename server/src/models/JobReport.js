const mongoose = require("mongoose");

const jobReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reporterName: {
      type: String,
      trim: true,
      default: "",
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    reporterPhone: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      enum: [
        "FRAUD_SCAM",
        "ASKING_MONEY",
        "INACCURATE_DETAILS",
        "OFFENSIVE_CONTENT",
        "EXPIRED_JOB",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },
    reasonLabel: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assignedCrm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
      index: true,
    },
    assignedCrmEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    assignedCrmName: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ["NONE", "JOB_REMOVED", "COMPANY_WARNED", "JOB_MODIFIED", "DISMISSED"],
      default: "NONE",
    },
    crmNotes: {
      type: String,
      trim: true,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    sourceIp: {
      type: String,
      default: "",
      trim: true,
    },
    sourceUserAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

jobReportSchema.pre("save", function () {
  if (!this.reportId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.reportId = `REP-${timestamp}-${randomSuffix}`;
  }
});

module.exports = mongoose.model("JobReport", jobReportSchema);
