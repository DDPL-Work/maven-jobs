const asyncHandler = require("../middleware/async.middleware");
const {
  checkRateLimit,
  invalidatePreviousOTPs,
  createOTP,
  verifyOTP,
  resetPassword,
  getAccountProvider,
  OTP_EXPIRY_MINUTES,
} = require("../services/passwordReset.service");
const { sendPasswordResetOTPEmail, sendEmployerPasswordResetOTPEmail } = require("../email/index");
const { EVENTS } = require("../events/events");
const EventBus = require("../events/EventBus");
const logger = require("../config/logger");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

function createPasswordResetController({
  entityType,
  eventRequested,
  eventChanged,
  emailSender,
  emailSubjectPrefix,
}) {
  const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw createHttpError(400, "Email is required");
    }

    const accountInfo = await getAccountProvider(normalizedEmail, entityType);

    if (!accountInfo) {
      logger.info("[PasswordReset] Forgot password requested for non-existent email", {
        email: normalizedEmail,
        entityType,
      });
      return res.status(200).json({
        success: true,
        message: "If an account exists, an OTP has been sent.",
      });
    }

    if (entityType === "candidate" && accountInfo.provider === "google" && !accountInfo.hasPassword) {
      logger.info("[PasswordReset] Google-only account attempted password reset", {
        email: normalizedEmail,
      });
      return res.status(200).json({
        success: true,
        message: "This account uses Google Sign-In. Please continue using Google.",
        provider: "google",
        isGoogleOnly: true,
      });
    }

    const rateLimitOk = await checkRateLimit(normalizedEmail, entityType);
    if (!rateLimitOk) {
      throw createHttpError(429, "Too many requests. Please try again later.");
    }

    await invalidatePreviousOTPs(normalizedEmail, entityType);

    const { otp } = await createOTP({
      userId: accountInfo.userId,
      email: normalizedEmail,
      entityType,
      ipAddress: req.ip || req.connection?.remoteAddress || "",
      userAgent: req.get("User-Agent") || "",
    });

    try {
      await emailSender({
        to: normalizedEmail,
        name: accountInfo.name,
        otp,
      });
      logger.info("[PasswordReset] OTP email sent", { email: normalizedEmail, entityType });
    } catch (emailErr) {
      logger.error("[PasswordReset] Failed to send OTP email", {
        email: normalizedEmail,
        entityType,
        error: emailErr.message,
      });
    }

    EventBus.emit(eventRequested, {
      userId: accountInfo.userId,
      email: normalizedEmail,
      fullName: accountInfo.name,
    });

    return res.status(200).json({
      success: true,
      message: "If an account exists, an OTP has been sent.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  });

  const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedOTP = String(otp || "").trim();

    if (!normalizedEmail) {
      throw createHttpError(400, "Email is required");
    }

    if (!normalizedOTP || normalizedOTP.length !== 6) {
      throw createHttpError(400, "Please enter a valid 6-digit OTP");
    }

    if (!/^\d{6}$/.test(normalizedOTP)) {
      throw createHttpError(400, "OTP must be 6 digits");
    }

    const result = await verifyOTP({ email: normalizedEmail, otp: normalizedOTP, entityType });

    if (!result.success) {
      const errorMessages = {
        NO_ACTIVE_OTP: "No active OTP found. Please request a new one.",
        OTP_USED: "This OTP has already been used. Please request a new one.",
        OTP_ALREADY_VERIFIED: "OTP already verified. Please check your email for the reset link.",
        OTP_EXPIRED: "OTP has expired. Please request a new one.",
        MAX_ATTEMPTS_EXCEEDED: "Too many failed attempts. Please request a new OTP.",
        INVALID_OTP: `Invalid OTP. ${result.remainingAttempts || 0} attempts remaining.`,
      };

      throw createHttpError(400, errorMessages[result.code] || "OTP verification failed");
    }

    logger.info("[PasswordReset] OTP verified, reset token issued", {
      email: normalizedEmail,
      entityType,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken: result.resetToken,
      expiresIn: 15 * 60,
    });
  });

  const resetPasswordHandler = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      throw createHttpError(400, "Reset token is required");
    }

    if (!newPassword) {
      throw createHttpError(400, "New password is required");
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw createHttpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw createHttpError(
        400,
        "Password must contain uppercase, lowercase, number, and special character"
      );
    }

    const result = await resetPassword({ resetToken, newPassword });

    if (!result.success) {
      const errorMessages = {
        INVALID_RESET_TOKEN: "Invalid or expired reset token. Please start over.",
        USER_NOT_FOUND: "User account not found.",
      };

      throw createHttpError(400, errorMessages[result.code] || "Password reset failed");
    }

    EventBus.emit(eventChanged, {
      userId: result.userId,
      email: result.email,
      fullName: "",
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || req.connection?.remoteAddress || "",
    });

    logger.info("[PasswordReset] Password reset completed", {
      email: result.email,
      entityType,
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. Please login with your new password.",
    });
  });

  return { forgotPassword, verifyResetOTP, resetPassword: resetPasswordHandler };
}

const candidatePasswordReset = createPasswordResetController({
  entityType: "candidate",
  eventRequested: EVENTS.CANDIDATE_PASSWORD_RESET_REQUESTED,
  eventChanged: EVENTS.CANDIDATE_PASSWORD_CHANGED,
  emailSender: sendPasswordResetOTPEmail,
  emailSubjectPrefix: "Maven Jobs",
});

const employerPasswordReset = createPasswordResetController({
  entityType: "employer",
  eventRequested: EVENTS.RECRUITER_PASSWORD_RESET_REQUESTED,
  eventChanged: EVENTS.RECRUITER_PASSWORD_RESET_REQUESTED,
  emailSender: sendEmployerPasswordResetOTPEmail,
  emailSubjectPrefix: "Maven Jobs Employer",
});

module.exports = {
  forgotPassword: candidatePasswordReset.forgotPassword,
  verifyResetOTP: candidatePasswordReset.verifyResetOTP,
  resetPassword: candidatePasswordReset.resetPassword,
  employerForgotPassword: employerPasswordReset.forgotPassword,
  employerVerifyResetOTP: employerPasswordReset.verifyResetOTP,
  employerResetPassword: employerPasswordReset.resetPassword,
};
