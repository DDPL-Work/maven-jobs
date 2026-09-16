const mongoose = require("mongoose");

/**
 * LoginOTP — tracks OTP sessions for mobile-number-based candidate login.
 *
 * The `sessionId` returned by the 2Factor SMS API is stored here and used
 * during the verify step so we never need to store the raw OTP ourselves.
 *
 * TTL is enforced both by the `expiresAt` index (MongoDB auto-deletes docs)
 * and by explicit checks in the controller (belt-and-suspenders).
 */
const loginOTPSchema = new mongoose.Schema(
  {
    /** 10-digit mobile number (no country code prefix) */
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    /** The User._id that owns this phone number */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    /**
     * Session ID returned by 2Factor.in after successfully sending the OTP.
     * Passed back to 2Factor during the verify step.
     */
    sessionId: {
      type: String,
      required: true,
    },

    /**
     * The actual OTP code. Used when we send OTPs ourselves (e.g. via email)
     * rather than relying on a 3rd party service to store and verify it.
     */
    otpCode: {
      type: String,
    },

    /** When this OTP document auto-expires (10 minutes from creation) */
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },

    /** Marked true after a successful verify so the OTP cannot be reused */
    used: {
      type: Boolean,
      default: false,
    },

    /** Number of failed verify attempts against this OTP */
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Lock out after this many failures */
    maxAttempts: {
      type: Number,
      default: 5,
    },

    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for fast "latest unused OTP for a phone" lookups
loginOTPSchema.index({ phone: 1, used: 1, createdAt: -1 });

module.exports = mongoose.model("LoginOTP", loginOTPSchema);
