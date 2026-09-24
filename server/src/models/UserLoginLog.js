const mongoose = require("mongoose");

/**
 * UserLoginLog Schema
 * Tracks login and logout events for RECRUITER and CLIENT users.
 * Used for auditing, reporting (Resdex User-Login tab), and session analysis.
 */
const userLoginLogSchema = new mongoose.Schema(
  {
    userId: {
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
    userName: {
      type: String,
      default: "",
      trim: true,
    },
    userEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["CLIENT", "RECRUITER"],
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: ["LOGIN", "LOGOUT"],
      required: true,
      index: true,
    },
    loginTime: {
      type: Date,
      default: null,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    // Derived: logoutTime - loginTime in minutes (populated on logout)
    sessionDurationMinutes: {
      type: Number,
      default: 0,
    },
    // Session ID allows correlating login and logout events
    sessionId: {
      type: String,
      default: "",
      index: true,
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    platform: {
      type: String,
      enum: ["WEB", "APP", "UNKNOWN"],
      default: "WEB",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast reporting queries
userLoginLogSchema.index({ companyId: 1, event: 1, timestamp: -1 });
userLoginLogSchema.index({ companyId: 1, userId: 1, event: 1, timestamp: -1 });
userLoginLogSchema.index({ companyId: 1, role: 1, timestamp: -1 });
userLoginLogSchema.index({ sessionId: 1, event: 1 });

module.exports = mongoose.model("UserLoginLog", userLoginLogSchema);
