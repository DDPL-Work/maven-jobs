const mongoose = require("mongoose");

const packageChangeRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentPackageType: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "ELITE"],
      required: true,
    },
    requestedPackageType: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "ELITE"],
      required: true,
    },
    currentJobLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    requestedJobLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1200,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    isUpgrade: {
      type: Boolean,
      required: true,
      default: false,
    },
    decisionNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1200,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    effectiveAt: {
      type: Date,
      required: true,
      index: true,
    },
    appliedAt: {
      type: Date,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

packageChangeRequestSchema.index(
  { companyId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  },
);
packageChangeRequestSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("PackageChangeRequest", packageChangeRequestSchema);
