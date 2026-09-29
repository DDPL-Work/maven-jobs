const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    folderType: {
      type: String,
      enum: ["REQUIREMENT", "FOLDER"],
      default: "FOLDER",
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, default: "", trim: true },
    icon: { type: String, default: "folder" },
    color: { type: String, default: "#002366" },
    isPublic: { type: Boolean, default: false },
    candidateCount: { type: Number, default: 0 },
    contactedCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: null },
    createdBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    sharedWith: [{ type: String, trim: true }],
    isCompanyShared: { type: Boolean, default: true },
    jobTitle: { type: String, default: "", trim: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    criteria: {
      jobTitle: { type: String, default: "", trim: true },
      skills: [{ type: String, trim: true }],
      experienceMin: { type: Number },
      experienceMax: { type: Number },
      salaryMin: { type: Number },
      salaryMax: { type: Number },
      locations: [{ type: String, trim: true }],
      education: { type: String, trim: true },
      industry: { type: String, trim: true },
      noticePeriod: [{ type: String, trim: true }],
      rawSearchQuery: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    alerts: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ["DAILY", "WEEKLY"], default: "DAILY" },
      recipients: [{ type: String, trim: true }],
      lastSentAt: { type: Date, default: null },
    },
    prospectCount: { type: Number, default: 0 },
    shortlistedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

folderSchema.index({ companyId: 1, folderType: 1, name: 1 }, { unique: true });
folderSchema.index({ companyId: 1, updatedAt: -1 });
folderSchema.index({ employerId: 1, updatedAt: -1 });

module.exports = mongoose.model("Folder", folderSchema);
