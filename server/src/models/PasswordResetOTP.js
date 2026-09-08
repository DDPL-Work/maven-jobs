const mongoose = require("mongoose");

const passwordResetOTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["candidate", "employer"],
      default: "candidate",
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ["password_reset"],
      default: "password_reset",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

passwordResetOTPSchema.index({ userId: 1, purpose: 1, entityType: 1 });
passwordResetOTPSchema.index({ email: 1, purpose: 1, entityType: 1, createdAt: -1 });

module.exports = mongoose.model("PasswordResetOTP", passwordResetOTPSchema);
