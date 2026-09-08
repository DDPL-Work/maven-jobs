import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiMail,
  FiLock,
  FiX,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import api from "../services/api";
import "./AuthModals.css";

const SCREENS = {
  EMAIL: "email",
  OTP: "otp",
  NEW_PASSWORD: "new_password",
  SUCCESS: "success",
  GOOGLE_ONLY: "google_only",
};

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600;

const API_PREFIX = {
  candidate: "/auth",
  employer: "/company-panel/auth",
};

export default function ForgotPassword({ isOpen, onClose, onLoginWithGoogle, userType = "candidate" }) {
  const [screen, setScreen] = useState(SCREENS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const otpRefs = useRef([]);
  const countdownRef = useRef(null);

  const isEmployer = userType === "employer";
  const apiBase = API_PREFIX[userType] || API_PREFIX.candidate;

  const resetState = useCallback(() => {
    setScreen(SCREENS.EMAIL);
    setEmail("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setError("");
    setIsLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCountdown(OTP_EXPIRY_SECONDS);
    setCanResend(false);
    setPasswordStrength(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (screen === SCREENS.OTP && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [screen]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const calculatePasswordStrength = (pw) => {
    let strength = 0;
    if (pw.length >= 8) strength++;
    if (/[a-z]/.test(pw)) strength++;
    if (/[A-Z]/.test(pw)) strength++;
    if (/\d/.test(pw)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    setPasswordStrength(calculatePasswordStrength(val));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post(`${apiBase}/forgot-password`, { email: email.trim() });
      if (res.data.isGoogleOnly) {
        setScreen(SCREENS.GOOGLE_ONLY);
        return;
      }
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setScreen(SCREENS.OTP);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === OTP_LENGTH) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      const newOtp = pasted.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      otpRefs.current[focusIndex]?.focus();
      if (pasted.length === OTP_LENGTH) {
        handleVerifyOTP(pasted);
      }
    }
  };

  const handleVerifyOTP = async (otpValue) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post(`${apiBase}/verify-reset-otp`, {
        email: email.trim(),
        otp: otpValue,
      });
      setResetToken(res.data.resetToken);
      setScreen(SCREENS.NEW_PASSWORD);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTPManual = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    handleVerifyOTP(otpValue);
  };

  const handleResendOTP = async () => {
    setError("");
    setIsLoading(true);
    try {
      await api.post(`${apiBase}/forgot-password`, { email: email.trim() });
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setError("Password must contain uppercase, lowercase, number, and special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await api.post(`${apiBase}/reset-password`, {
        resetToken,
        newPassword,
      });
      setScreen(SCREENS.SUCCESS);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  const strengthColors = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  const brandColor = isEmployer ? "#2563eb" : "#143f86";
  const brandBgLight = isEmployer ? "#eff6ff" : "#f0f4ff";

  return (
    <div className="register-modal-overlay">
      <div className="register-modal-backdrop" onClick={onClose}></div>
      <div className="register-modal-content" style={{ maxWidth: "520px" }}>
        <button className="register-modal-close" onClick={onClose} aria-label="Close Modal">
          <FiX aria-hidden="true" />
        </button>

        <div style={{ padding: "40px 32px" }}>
          {screen === SCREENS.EMAIL && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: brandBgLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <FiShield size={28} color={brandColor} />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
                  Forgot Password?
                </h2>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                  Enter your {isEmployer ? "work email" : "email address"} and we'll send you a verification code to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendOTP}>
                <div className="auth-form-group">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isEmployer ? "Work Email" : "Email Address"} <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      placeholder={isEmployer ? "Enter your work email" : "Enter your email address"}
                      className="register-input"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ color: "#dc2626", marginBottom: "16px", fontSize: "14px", fontWeight: "500" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-register-submit"
                  disabled={isLoading}
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  {isLoading ? "Sending OTP..." : "Send Verification Code"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: brandColor,
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {screen === SCREENS.OTP && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <FiCheckCircle size={28} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
                  Enter Verification Code
                </h2>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                  We've sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "24px" }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={handleOTPPaste}
                    style={{
                      width: "48px",
                      height: "56px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#0f172a",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      fontFamily: "'Courier New', monospace",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = brandColor)}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                ))}
              </div>

              {error && (
                <div style={{ color: "#dc2626", marginBottom: "16px", fontSize: "14px", fontWeight: "500", textAlign: "center" }}>
                  {error}
                </div>
              )}

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                {countdown > 0 ? (
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    Code expires in <strong style={{ color: brandColor }}>{formatCountdown(countdown)}</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    style={{
                      background: "none",
                      border: "none",
                      color: brandColor,
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FiRefreshCw size={14} />
                    Resend Code
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOTPManual}
                className="btn-register-submit"
                disabled={isLoading || otp.join("").length !== OTP_LENGTH}
                style={{ width: "100%" }}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  onClick={() => { setScreen(SCREENS.EMAIL); setError(""); setOtp(Array(OTP_LENGTH).fill("")); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          {screen === SCREENS.NEW_PASSWORD && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: brandBgLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <FiLock size={28} color={brandColor} />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>
                  Create New Password
                </h2>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="auth-form-group">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    New Password <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="register-input"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "16px",
                        background: "none",
                        border: "none",
                        color: brandColor,
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {newPassword && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "2px",
                            backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : "#e2e8f0",
                            transition: "background-color 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: "12px", color: strengthColors[passwordStrength - 1] || "#64748b", margin: 0 }}>
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Enter a password"}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#374151", margin: "0 0 8px 0" }}>
                    Password must contain:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                    {[
                      { label: "8+ characters", test: newPassword.length >= 8 },
                      { label: "Uppercase letter", test: /[A-Z]/.test(newPassword) },
                      { label: "Lowercase letter", test: /[a-z]/.test(newPassword) },
                      { label: "Number", test: /\d/.test(newPassword) },
                      { label: "Special character", test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
                    ].map(({ label, test }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiCheckCircle
                          size={12}
                          color={test ? "#16a34a" : "#94a3b8"}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ fontSize: "12px", color: test ? "#16a34a" : "#64748b" }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="auth-form-group">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Confirm Password <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="register-input"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "16px",
                        background: "none",
                        border: "none",
                        color: brandColor,
                        cursor: "pointer",
                      }}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>
                    Passwords do not match
                  </p>
                )}

                {error && (
                  <div style={{ color: "#dc2626", marginBottom: "16px", fontSize: "14px", fontWeight: "500" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-register-submit"
                  disabled={isLoading}
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {screen === SCREENS.SUCCESS && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <FiCheckCircle size={40} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 12px 0" }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px 0", lineHeight: "1.6" }}>
                Your password has been successfully changed. Please login with your new password.
              </p>
              <button
                onClick={handleGoToLogin}
                className="btn-register-submit"
                style={{ width: "100%" }}
              >
                Login Now
                <FiArrowRight style={{ marginLeft: "8px" }} />
              </button>
            </div>
          )}

          {screen === SCREENS.GOOGLE_ONLY && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: brandBgLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <FcGoogle size={40} />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 12px 0" }}>
                Google Account Detected
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 8px 0", lineHeight: "1.6" }}>
                This account uses <strong>Google Sign-In</strong>.
              </p>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px 0", lineHeight: "1.6" }}>
                Please continue using Google to sign in.
              </p>
              <button
                onClick={() => {
                  if (onLoginWithGoogle) {
                    onLoginWithGoogle();
                  } else {
                    handleGoToLogin();
                  }
                }}
                className="btn-register-submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  backgroundColor: "#fff",
                  color: "#374151",
                  border: "1px solid #e2e8f0",
                  fontWeight: "600",
                }}
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>
              <button
                onClick={handleGoToLogin}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  marginTop: "16px",
                }}
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
