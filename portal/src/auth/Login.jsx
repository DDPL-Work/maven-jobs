import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  FiMail,
  FiLock,
  FiX,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiSmartphone,
} from "react-icons/fi";
import mavenLogo from "../../assets/maven-logo-BdiSsfJk.svg";
import { useAuth } from "../AuthContext";
import ForgotPassword from "./ForgotPassword";
import "./AuthModals.css";

export default function Login({ isOpen, onClose, openSignUp }) {
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMode, setLoginMode] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    if (isOpen) return;
    setLoginMode("password");
    setOtpSent(false);
    setOtp("");
    setResendTimer(0);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(
      () => setResendTimer((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearTimeout(t);
  }, [resendTimer]);

  const switchToOTP = () => {
    setLoginMode("otp");
    setOtpSent(false);
    setError("");
  };

  const switchToPassword = () => {
    setLoginMode("password");
    setOtpSent(false);
    setOtp("");
    setResendTimer(0);
    setError("");
  };

  const handleEditMobile = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  const handleGetOTP = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setOtp("");
      setResendTimer(30);
    }, 1200);
  };

  const handleVerifyOTP = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="register-modal-overlay">
      <div className="register-modal-backdrop" onClick={onClose}></div>
      <div className="register-modal-content" style={{ maxWidth: "1050px" }}>
        <button
          className="register-modal-close"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="register-layout">
          {/* Left Column: New User Promo */}
          <div className="register-left">
            <div className="register-logo-container">
              <img
                src={mavenLogo}
                alt="Maven Jobs"
                className="register-modal-logo"
              />
            </div>
            <div className="register-left-content">
              <h3>New to MavenJobs?</h3>

              <ul className="register-benefits-list">
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>One click apply using MavenJobs profile.</span>
                </li>
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Get relevant job recommendations.</span>
                </li>
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Showcase profile to top companies.</span>
                </li>
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Know application status instantly.</span>
                </li>
              </ul>

              <button
                type="button"
                className="btn-register-submit"
                style={{
                  marginTop: "40px",
                  background: "rgba(20, 63, 134, 0.08)",
                  color: "#143f86",
                  boxShadow: "none",
                  border: "1.5px solid rgba(20, 63, 134, 0.1)",
                }}
                onClick={() => {
                  onClose();
                  if (openSignUp) openSignUp();
                }}
              >
                Register for Free{" "}
                <FiArrowRight style={{ marginLeft: "8px" }} />
              </button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="register-right">
            <div className="register-header-top">
              <h2>Login</h2>
              <div className="register-login-link">
                No account?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    onClose();
                    if (openSignUp) openSignUp();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#143f86",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                    fontSize: "inherit",
                  }}
                >
                  Create one
                </button>
              </div>
            </div>
            <p className="register-sub">
              Welcome back! Please enter your details.
            </p>

            <form
              className="register-form"
              onSubmit={
                loginMode === "password"
                  ? handleSubmit
                  : otpSent
                    ? handleVerifyOTP
                    : handleGetOTP
              }
            >
              {loginMode === "password" && (
                <>
              <div className="auth-form-group">
                <label>
                  EMAIL ID / USERNAME{" "}
                  <span className="required-dot"></span>
                </label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Enter Email ID / Username"
                    className="register-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>
                  PASSWORD <span className="required-dot"></span>
                </label>
                <div className="input-wrapper input-wrapper--password">
                  <FiLock className="input-icon" aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    className="register-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      color: "#143f86",
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      fontWeight: "700",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
                </>
              )}

              {loginMode === "otp" && !otpSent && (
                <div className="auth-form-group">
                  <label>
                    MOBILE NUMBER <span className="required-dot"></span>
                  </label>
                  <div className="input-wrapper">
                    <FiSmartphone className="input-icon" aria-hidden="true" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit Mobile Number"
                      className="register-input"
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                    />
                  </div>
                  <div style={{ marginTop: "4px" }}></div>
                </div>
              )}

              {loginMode === "otp" && otpSent && (
                <div className="auth-form-group">
                  <div className="auth-otp-info">
                    <span>
                      Please enter the OTP sent to{" "}
                      <strong>{mobileNumber}</strong>
                    </span>
                    <button
                      type="button"
                      className="auth-edit-link"
                      onClick={handleEditMobile}
                    >
                      Edit
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="auth-otp-input"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>
              )}

              {error && (
                <div
                  style={{
                    color: "red",
                    marginBottom: "16px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="register-actions-row">
                <button
                  type="submit"
                  className="btn-register-submit"
                  disabled={isLoading}
                >
                  {isLoading
                    ? loginMode === "password"
                      ? "Logging in..."
                      : otpSent
                        ? "Verifying..."
                        : "Sending OTP..."
                    : loginMode === "password"
                      ? "Login to Account"
                      : otpSent
                        ? "Verify & Login"
                        : "Get OTP"}
                </button>

                {loginMode === "password" && (
                  <button
                    type="button"
                    onClick={switchToOTP}
                    style={{
                      color: "#143f86",
                      fontSize: "1.05rem",
                      fontWeight: "800",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "16px 0 0 0",
                      fontFamily: "inherit",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    Use OTP to Login
                  </button>
                )}

                {loginMode === "otp" && !otpSent && (
                  <button
                    type="button"
                    onClick={switchToPassword}
                    style={{
                      color: "#143f86",
                      fontSize: "1.05rem",
                      fontWeight: "800",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "16px 0 0 0",
                      fontFamily: "inherit",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    Use Email to Login
                  </button>
                )}

                {loginMode === "otp" && otpSent && (
                  <div className="auth-resend-area">
                    {resendTimer > 0 ? (
                      <span className="auth-resend-timer">
                        Resend OTP in 00:
                        {String(resendTimer).padStart(2, "0")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="auth-resend-btn"
                        onClick={() => handleGetOTP(null)}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                )}

                <div className="auth-separator">
                  <span>Or</span>
                </div>

                <div className="google-login-wrapper">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      loginWithGoogle(credentialResponse.credential);
                    }}
                    onError={() => {
                      console.error("Google Login Failed");
                    }}
                    useOneTap={false}
                    theme="outline"
                    shape="rectangular"
                    size="large"
                    text="signin_with"
                    logo_alignment="left"
                    width="100%"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="candidate"
      />
    </div>
  );
}
