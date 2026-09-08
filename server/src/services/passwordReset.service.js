const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const PasswordResetOTP = require("../models/PasswordResetOTP");
const User = require("../models/User");
const logger = require("../config/logger");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_REQUESTS_PER_HOUR = 3;
const MAX_OTP_VERIFY_ATTEMPTS = 5;
const RESET_TOKEN_SECRET = process.env.JWT_SECRET + "_password_reset";
const RESET_TOKEN_EXPIRY = "15m";

function generateOTP() {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(crypto.randomInt(min, max + 1)).padStart(OTP_LENGTH, "0");
}

async function hashOTP(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOTPAgainstHash(otp, hash) {
  return bcrypt.compare(otp, hash);
}

function generateResetToken(userId, email, entityType) {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { typ: "password_reset", sub: String(userId), email, entityType: entityType || "candidate" },
    RESET_TOKEN_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY }
  );
}

function verifyResetToken(token) {
  const jwt = require("jsonwebtoken");
  return jwt.verify(token, RESET_TOKEN_SECRET);
}

async function checkRateLimit(email, entityType = "candidate") {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await PasswordResetOTP.countDocuments({
    email: email.toLowerCase(),
    entityType,
    purpose: "password_reset",
    createdAt: { $gte: oneHourAgo },
  });

  if (recentCount >= MAX_OTP_REQUESTS_PER_HOUR) {
    logger.warn("[PasswordReset] Rate limit exceeded", { email, entityType, recentCount });
    return false;
  }
  return true;
}

async function invalidatePreviousOTPs(email, entityType = "candidate") {
  await PasswordResetOTP.updateMany(
    { email: email.toLowerCase(), entityType, purpose: "password_reset", used: false },
    { $set: { used: true } }
  );
}

async function createOTP({ userId, email, entityType = "candidate", ipAddress, userAgent }) {
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpDoc = await PasswordResetOTP.create({
    userId,
    email: email.toLowerCase(),
    entityType,
    otpHash,
    purpose: "password_reset",
    expiresAt,
    ipAddress: ipAddress || "",
    userAgent: userAgent || "",
  });

  logger.info("[PasswordReset] OTP created", {
    email,
    entityType,
    otpId: otpDoc._id,
    expiresAt,
  });

  return { otp, otpDoc };
}

async function verifyOTP({ email, otp, entityType = "candidate" }) {
  const otpDoc = await PasswordResetOTP.findOne({
    email: email.toLowerCase(),
    entityType,
    purpose: "password_reset",
    used: false,
    verified: false,
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    logger.warn("[PasswordReset] No active OTP found", { email, entityType });
    return { success: false, code: "NO_ACTIVE_OTP" };
  }

  if (otpDoc.used) {
    logger.warn("[PasswordReset] OTP already used", { email, entityType });
    return { success: false, code: "OTP_USED" };
  }

  if (otpDoc.verified) {
    logger.warn("[PasswordReset] OTP already verified", { email, entityType });
    return { success: false, code: "OTP_ALREADY_VERIFIED" };
  }

  if (new Date() > otpDoc.expiresAt) {
    logger.warn("[PasswordReset] OTP expired", { email, entityType });
    return { success: false, code: "OTP_EXPIRED" };
  }

  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    logger.warn("[PasswordReset] OTP max attempts exceeded", {
      email,
      entityType,
      attempts: otpDoc.attempts,
    });
    return { success: false, code: "MAX_ATTEMPTS_EXCEEDED" };
  }

  const isValid = await verifyOTPAgainstHash(otp, otpDoc.otpHash);

  if (!isValid) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    logger.warn("[PasswordReset] OTP verification failed", {
      email,
      entityType,
      attempts: otpDoc.attempts,
    });
    return {
      success: false,
      code: "INVALID_OTP",
      remainingAttempts: otpDoc.maxAttempts - otpDoc.attempts,
    };
  }

  otpDoc.verified = true;
  await otpDoc.save();

  logger.info("[PasswordReset] OTP verified successfully", { email, entityType });

  const resetToken = generateResetToken(otpDoc.userId, email, entityType);

  return { success: true, resetToken, userId: otpDoc.userId };
}

async function resetPassword({ resetToken, newPassword }) {
  let payload;
  try {
    payload = verifyResetToken(resetToken);
  } catch (err) {
    logger.warn("[PasswordReset] Invalid or expired reset token", {
      error: err.message,
    });
    return { success: false, code: "INVALID_RESET_TOKEN" };
  }

  if (payload.typ !== "password_reset") {
    return { success: false, code: "INVALID_RESET_TOKEN" };
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return { success: false, code: "USER_NOT_FOUND" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  const entityType = payload.entityType || "candidate";

  await PasswordResetOTP.updateMany(
    { userId: user._id, entityType, purpose: "password_reset", used: false },
    { $set: { used: true } }
  );

  const Session = require("../models/Session");
  const RefreshToken = require("../models/RefreshToken");

  await Session.updateMany(
    { userId: user._id, isActive: true },
    { $set: { isActive: false, revokedAt: new Date(), revokedReason: "password_reset" } }
  );

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: "password_reset" } }
  );

  logger.info("[PasswordReset] Password changed successfully", {
    userId: user._id,
    email: user.email,
    entityType,
  });

  return { success: true, email: user.email, entityType };
}

async function getAccountProvider(email, entityType = "candidate") {
  const query = { email: email.toLowerCase() };
  if (entityType === "employer") {
    query.role = "CLIENT";
  }

  const user = await User.findOne(query).select(
    "provider password email name role"
  );
  if (!user) return null;
  return {
    provider: user.provider,
    hasPassword: Boolean(user.password && user.password.length > 0),
    name: user.name,
    email: user.email,
    userId: user._id,
    role: user.role,
  };
}

module.exports = {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_REQUESTS_PER_HOUR,
  MAX_OTP_VERIFY_ATTEMPTS,
  generateOTP,
  hashOTP,
  verifyOTPAgainstHash,
  generateResetToken,
  verifyResetToken,
  checkRateLimit,
  invalidatePreviousOTPs,
  createOTP,
  verifyOTP,
  resetPassword,
  getAccountProvider,
};
