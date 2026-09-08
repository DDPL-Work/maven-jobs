// models/CrmUser.js
const mongoose = require("mongoose");

const crmUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    profileImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    profileImagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["LEAD_GENERATOR", "STATE_MANAGER", "ZONAL_MANAGER", "FSE", "APPROVER", "ADMIN", "NATIONAL_SALES_HEAD"],
      required: true,
    },
    designations: {
      type: [String],
      enum: ["LEAD_GENERATOR", "STATE_MANAGER", "ZONAL_MANAGER", "FSE", "APPROVER", "ADMIN", "NATIONAL_SALES_HEAD"],
      default: [],
    },
    territory: {
      type: String, // useful for Lead Generator (Zone)
    },
    state: {
      type: String, // useful for State Manager
    },
    department: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
    accessStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_INVITE", "RESTRICTED"],
      default: "ACTIVE",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    targets: {
      leadGeneration: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      meetings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CrmUser", crmUserSchema);
