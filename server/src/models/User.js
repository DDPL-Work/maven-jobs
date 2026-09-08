const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false, default: "" },
    role: {
      type: String,
      enum: ["ADMIN", "CRM", "FSE", "CLIENT", "CANDIDATE"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String, default: "" },
    avatar: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null, // Only for CLIENT users
    },
    department: { type: String, default: "" },
    scope: { type: String, default: "" },
    accessStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_INVITE", "RESTRICTED"],
      default: "ACTIVE",
    },
    isActive: { type: Boolean, default: true },
    termsAccepted: { type: Boolean, default: false },
    membership: {
      plan: {
        type: String,
        enum: ["FREE", "PRO", "ELITE"],
        default: "FREE",
      },
      active: { type: Boolean, default: false },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
