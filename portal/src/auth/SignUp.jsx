import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiX,
  FiCheck,
  FiUserCheck,
  FiCheckCircle,
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiFileText,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { FaGraduationCap, FaWhatsapp } from "react-icons/fa";
import { LuLoaderCircle } from "react-icons/lu";
import mavenLogo from "../../assets/maven-logo-BdiSsfJk.svg";
import "./AuthModals.css";

import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

export default function SignUp({ isOpen, onClose, openLogin }) {
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [workStatus, setWorkStatus] = useState("experienced");
  const [updatesAccepted, setUpdatesAccepted] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    preferredPosition: "",
    preferredLocation: "",
    expectedSalary: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const { name, email, password, phone } = formData;

    if (!name || !email || !password || !phone) {
      setError("Please fill all required fields in Step 1.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be 10 digits.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handlePrevStep = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      name,
      email,
      password,
      phone,
      preferredPosition,
      preferredLocation,
      expectedSalary,
    } = formData;

    setIsLoading(true);
    setError("");

    const payload = new FormData();
    payload.append("name", name);
    payload.append("email", email);
    payload.append("password", password);
    payload.append("phone", phone);
    payload.append(
      "designation",
      preferredPosition ||
        (workStatus === "experienced"
          ? "Experienced Professional"
          : "Fresher / Student")
    );
    payload.append("preferredLocation", preferredLocation);
    payload.append("expectedSalary", expectedSalary);

    if (resumeFile) {
      payload.append("resume", resumeFile);
    }

    payload.append("termsAccepted", true);

    const result = await register(payload);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="register-modal-overlay">
      <div className="register-modal-backdrop" onClick={onClose}></div>
      <div className="register-modal-content">
        <button
          className="register-modal-close"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="register-layout">
          {/* Left Column: Visuals & Benefits */}
          <div className="register-left">
            <div className="register-logo-container">
              <img
                src={mavenLogo}
                alt="Maven Jobs"
                className="register-modal-logo"
              />
            </div>
            <div className="register-left-content">
              <div className="register-illustration">
                <div className="illustration-circle">
                  <FiUserCheck
                    aria-hidden="true"
                    className="illustration-icon"
                  />
                  <div className="illustration-accent"></div>
                  <div className="illustration-accent-2"></div>
                </div>
              </div>

              <h3>
                {step === 1
                  ? "Join our community of professionals"
                  : "Complete your registration"}
              </h3>

              <ul className="register-benefits-list">
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Build a standout profile for top recruiters</span>
                </li>
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Get personalized job alerts daily</span>
                </li>
                <li>
                  <FiCheckCircle className="benefit-icon" aria-hidden="true" />
                  <span>Accelerate your career growth with Maven</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="register-right">
            <div className="register-header-top">
              <div className="register-header-left">
                <h2>{step === 1 ? "Create Profile" : "Almost There"}</h2>
                <div className="step-indicator">Step {step} of 2</div>
              </div>
              <div className="register-login-link">
                Joined already?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    onClose();
                    if (openLogin) openLogin();
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
                  Login here
                </button>
              </div>
            </div>
            <p className="register-sub">
              India's leading platform for career opportunities
            </p>

            <form
              className="register-form"
              onSubmit={step === 1 ? handleNextStep : handleSubmit}
            >
              {step === 1 ? (
                <>
                  <div className="auth-form-group">
                    <label>
                      FULL NAME <span className="required-dot"></span>
                    </label>
                    <div className="input-wrapper">
                      <FiUser className="input-icon" aria-hidden="true" />
                      <input
                        type="text"
                        name="name"
                        placeholder="What is your name?"
                        className="register-input"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>
                      EMAIL ID <span className="required-dot"></span>
                    </label>
                    <div className="input-wrapper">
                      <FiMail className="input-icon" aria-hidden="true" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Tell us your Email ID"
                        className="register-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>
                      PASSWORD <span className="required-dot"></span>
                    </label>
                    <div className="input-wrapper">
                      <FiLock className="input-icon" aria-hidden="true" />
                      <input
                        type="password"
                        name="password"
                        placeholder="(Minimum 6 characters)"
                        className="register-input"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>
                      MOBILE NUMBER <span className="required-dot"></span>
                    </label>
                    <div className="input-wrapper mobile-wrapper">
                      <span className="mobile-prefix">+91</span>
                      <input
                        type="number"
                        name="phone"
                        placeholder="Enter your mobile number"
                        className="register-input mobile-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>
                      WORK STATUS <span className="required-dot"></span>
                    </label>
                    <div className="work-status-cards">
                      <div
                        className={`work-status-card ${workStatus === "experienced" ? "active" : ""}`}
                        onClick={() => setWorkStatus("experienced")}
                      >
                        <div className="ws-card-content">
                          <div className="ws-card-title">Experienced</div>
                          <div className="ws-card-desc">
                            I have work experience
                          </div>
                        </div>
                        <FiBriefcase
                          className="ws-card-icon"
                          aria-hidden="true"
                        />
                        {workStatus === "experienced" && (
                          <div className="ws-card-check">
                            <FiCheck aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div
                        className={`work-status-card ${workStatus === "fresher" ? "active" : ""}`}
                        onClick={() => setWorkStatus("fresher")}
                      >
                        <div className="ws-card-content">
                          <div className="ws-card-title">Fresher</div>
                          <div className="ws-card-desc">
                            I am a student/grad
                          </div>
                        </div>
                        <FaGraduationCap
                          className="ws-card-icon"
                          aria-hidden="true"
                        />
                        {workStatus === "fresher" && (
                          <div className="ws-card-check">
                            <FiCheck aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-form-group">
                    <label>PREFERRED POSITION</label>
                    <div className="input-wrapper">
                      <FiBriefcase className="input-icon" aria-hidden="true" />
                      <input
                        type="text"
                        name="preferredPosition"
                        placeholder="e.g. Software Engineer"
                        className="register-input"
                        value={formData.preferredPosition}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>PREFERRED LOCATION</label>
                    <div className="input-wrapper">
                      <FiMapPin className="input-icon" aria-hidden="true" />
                      <input
                        type="text"
                        name="preferredLocation"
                        placeholder="e.g. Bengaluru, Remote"
                        className="register-input"
                        value={formData.preferredLocation}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>EXPECTED SALARY (CTC)</label>
                    <div className="input-wrapper">
                      <FiDollarSign className="input-icon" aria-hidden="true" />
                      <input
                        type="text"
                        name="expectedSalary"
                        placeholder="e.g. 10 LPA"
                        className="register-input"
                        value={formData.expectedSalary}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label>UPLOAD RESUME (PDF)</label>
                    <div className="input-wrapper">
                      <FiFileText className="input-icon" aria-hidden="true" />
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        className="register-input file-input"
                        style={{ paddingTop: "14px" }}
                      />
                    </div>
                    {resumeFile && (
                      <div className="file-name-preview">
                        <FiCheckCircle color="#10b981" /> {resumeFile.name}
                      </div>
                    )}
                  </div>
                </>
              )}

                <div className="updates-checkbox" style={step === 2 ? { marginTop: "12px" } : {}}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={updatesAccepted}
                    onChange={(e) => setUpdatesAccepted(e.target.checked)}
                  />
                  <span className="checkmark" style={{ border: "1.5px solid #94a3b8" }}>
                    {updatesAccepted && <FiCheck aria-hidden="true" />}
                  </span>
                  <span className="checkbox-text">
                    Send me important updates via SMS, Email, and{" "}
                    <span className="whatsapp-text">
                      <FaWhatsapp /> WhatsApp
                    </span>
                  </span>
                </label>
              </div>

              {step === 2 && (
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "8px", lineHeight: "1.4" }}>
                  By clicking Register, you agree to the{" "}
                  <Link to="/maven-jobs/terms" target="_blank" style={{ color: "#143f86", textDecoration: "underline" }}>Terms and Conditions</Link>
                  {" "}&{" "}
                  <Link to="/maven-jobs/privacy" target="_blank" style={{ color: "#143f86", textDecoration: "underline" }}>Privacy Policy</Link>
                  {" "}of MavenJobs.
                </div>
              )}

            

              {error && (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    marginTop: "8px",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="register-actions-row">
                {step === 1 ? (
                  <button type="submit" className="btn-register-submit">
                    Next Step <FiChevronRight style={{ marginLeft: "8px" }} />
                  </button>
                ) : (
                  <div className="dual-actions">
                    <button
                      type="button"
                      className="btn-back"
                      onClick={handlePrevStep}
                      disabled={isLoading}
                    >
                      <FiChevronLeft style={{ marginRight: "8px" }} /> Back
                    </button>
                    <button
                      type="submit"
                      className="btn-register-submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LuLoaderCircle
                            className="spin"
                            style={{ marginRight: "8px" }}
                          />{" "}
                          Creating...
                        </>
                      ) : (
                        "Register Now"
                      )}
                    </button>
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div className="auth-separator">
                      <span>Or</span>
                    </div>

                    <div className="google-login-wrapper">
                      <GoogleLogin
                        onSuccess={(credentialResponse) => {
                          loginWithGoogle(credentialResponse.credential);
                        }}
                        onError={() => {
                          console.error("Google Sign-Up Failed");
                        }}
                        useOneTap={false}
                        theme="outline"
                        shape="rectangular"
                        size="large"
                        text="signup_with"
                        logo_alignment="left"
                        width="100%"
                      />
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .step-indicator {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 4px;
        }
        .file-name-preview {
          font-size: 0.8rem;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-weight: 600;
        }
        .dual-actions {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 12px;
          width: 100%;
        }
        .btn-back {
          height: 56px;
          border-radius: 14px;
          border: 1.5px solid #cbd5e1;
          background: white;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        @media (max-width: 500px) {
          .dual-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
