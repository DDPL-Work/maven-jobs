const mongoose = require("mongoose");

const assignedMemberSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["USER", "CRM"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const adminRoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true },
    scope: { type: String, default: "Custom" },
    description: { type: String, default: "" },
    isSystemRole: { type: Boolean, default: false },
    systemRoleKey: {
      type: String,
      enum: ["ADMIN", "CRM", "FSE", "CLIENT", "CANDIDATE", null],
      default: null,
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    members: {
      type: [assignedMemberSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminRole", adminRoleSchema);
