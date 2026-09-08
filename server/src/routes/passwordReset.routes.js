const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  employerForgotPassword,
  employerVerifyResetOTP,
  employerResetPassword,
} = require("../controllers/passwordReset.controller");

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});

// Candidate password reset routes
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-reset-otp", verifyOtpLimiter, verifyResetOTP);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

// Employer password reset routes
router.post("/employer/forgot-password", forgotPasswordLimiter, employerForgotPassword);
router.post("/employer/verify-reset-otp", verifyOtpLimiter, employerVerifyResetOTP);
router.post("/employer/reset-password", resetPasswordLimiter, employerResetPassword);

module.exports = router;
