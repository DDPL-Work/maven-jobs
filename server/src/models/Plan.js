const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    planType: {
      type: String,
      required: true,
      enum: ["FREE", "SMB", "CORPORATE", "ENTERPRISE", "CUSTOM"],
      default: "FREE",
    },
    description: {
      type: String,
      default: "",
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
