import React, { useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiX,
  FiCheckCircle,
  FiShield,
  FiDollarSign,
  FiClock,
  FiFileText,
  FiAlertCircle,
  FiLoader,
  FiLock,
  FiLogIn,
} from "react-icons/fi";
import authService from "../services/authService";
import { useAuth } from "../AuthContext";
import "./ReportJobModal.css";

const REPORT_REASONS = [
  {
    id: "FRAUD_SCAM",
    label: "Suspicious or fraudulent opportunity / Scam",
    desc: "Looks fake, impersonating a company, or suspicious identity",
    icon: FiAlertTriangle,
  },
  {
    id: "ASKING_MONEY",
    label: "Employer is asking for money or payment",
    desc: "Requires registration fee, training charges, or security deposit",
    icon: FiDollarSign,
  },
  {
    id: "INACCURATE_DETAILS",
    label: "Misleading or inaccurate job details",
    desc: "Incorrect salary, role, location, or qualifications advertised",
    icon: FiFileText,
  },
  {
    id: "EXPIRED_JOB",
    label: "Position is closed, expired, or already filled",
    desc: "Company is no longer hiring for this position",
    icon: FiClock,
  },
  {
    id: "OFFENSIVE_CONTENT",
    label: "Offensive, discriminatory, or inappropriate content",
    desc: "Contains abusive, harassing, or discriminatory language",
    icon: FiShield,
  },
  {
    id: "OTHER",
    label: "Other issue",
    desc: "Any other policy violation or concern not listed above",
    icon: FiAlertCircle,
  },
];

export default function ReportJobModal({ isOpen, onClose, job, user: userProp }) {
  const { user: authUser, openLogin } = useAuth();
  const currentUser = userProp || authUser;

  const [selectedReason, setSelectedReason] = useState("FRAUD_SCAM");
  const [description, setDescription] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync candidate phone when user data changes
  useEffect(() => {
    if (currentUser?.phone) {
      setReporterPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setIsSuccess(false);
      setDescription("");
      if (!selectedReason) setSelectedReason("FRAUD_SCAM");
      if (currentUser?.phone) setReporterPhone(currentUser.phone);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const jobId = job?._id || job?.id;
  const companyName =
    job?.companyId?.name || job?.companyName || job?.company || "Company";
  const jobTitle = job?.title || job?.role || "Job Posting";

  const handleLoginClick = () => {
    if (onClose) onClose();
    if (openLogin) openLogin();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setErrorMsg("You must be logged in as a candidate to report a job.");
      handleLoginClick();
      return;
    }

    if (!selectedReason) {
      setErrorMsg("Please select a reason for reporting this job.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await authService.reportJob(jobId, {
        reason: selectedReason,
        description: description.trim(),
        reporterName: (currentUser.name || currentUser.fullName || "Candidate").trim(),
        reporterEmail: (currentUser.email || "").trim(),
        reporterPhone: (reporterPhone || currentUser.phone || "").trim(),
      });

      if (res?.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res?.message || "Failed to submit report. Please try again.");
      }
    } catch (err) {
      setErrorMsg(
        err?.message ||
          err?.error?.message ||
          "An error occurred while submitting your report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rjm-overlay" onClick={onClose}>
      <div className="rjm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rjm-header">
          <div className="rjm-header-left">
            <div className="rjm-badge-icon">
              <FiAlertTriangle />
            </div>
            <div className="rjm-header-titles">
              <h3 className="rjm-title">Report this Job</h3>
              <p className="rjm-subtitle">
                {jobTitle} &bull; {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rjm-close-btn"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="rjm-body">
          {!currentUser ? (
            /* Candidate Login Required State */
            <div className="rjm-login-required-wrap">
              <div className="rjm-login-icon-wrap">
                <FiLock />
              </div>
              <h4 className="rjm-login-title">Sign In Required</h4>
              <p className="rjm-login-desc">
                To report a job listing, you must be signed in with your candidate account.
                This ensures reports are authentic, verified, and keeps our hiring platform safe.
              </p>
              <div className="rjm-login-actions">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="rjm-login-btn"
                >
                  <FiLogIn />
                  <span>Sign In as Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rjm-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success confirmation */
            <div className="rjm-success-state">
              <div className="rjm-success-icon-wrap">
                <FiCheckCircle />
              </div>
              <h4 className="rjm-success-title">Report Submitted</h4>
              <p className="rjm-success-desc">
                Thank you for helping us maintain a safe community. Our CRM
                account management and compliance team have been notified to
                review this job listing.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rjm-success-done-btn"
              >
                Done
              </button>
            </div>
          ) : (
            /* Report Form for Logged-In Candidate */
            <form onSubmit={handleSubmit} className="rjm-form">
              {errorMsg && (
                <div className="rjm-error-banner">
                  <FiAlertCircle className="rjm-error-icon" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Logged In Candidate Identity Badge */}
              <div>
                <label className="rjm-label">Reporting Candidate</label>
                <div className="rjm-reporter-card">
                  <div className="rjm-reporter-avatar">
                    {(currentUser.name || currentUser.email || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="rjm-reporter-info">
                    <div className="rjm-reporter-name-row">
                      <span className="rjm-reporter-name">
                        {currentUser.name || "Candidate"}
                      </span>
                      <span className="rjm-verified-badge">
                        <FiCheckCircle size={11} /> Verified Account
                      </span>
                    </div>
                    <span className="rjm-reporter-email">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <label className="rjm-label">
                  Why are you reporting this job? <span className="rjm-required">*</span>
                </label>
                <div className="rjm-reasons-group">
                  {REPORT_REASONS.map((r) => {
                    const isSelected = selectedReason === r.id;
                    const Icon = r.icon;
                    return (
                      <label
                        key={r.id}
                        className={`rjm-reason-card ${isSelected ? "is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={r.id}
                          checked={isSelected}
                          onChange={() => setSelectedReason(r.id)}
                          className="rjm-radio-input"
                        />
                        <div className="rjm-reason-content">
                          <div className="rjm-reason-header">
                            <Icon className="rjm-reason-icon" />
                            <span>{r.label}</span>
                          </div>
                          <p className="rjm-reason-desc">{r.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="rjm-label">
                  Additional Details / Evidence (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what occurred, any money requested, or inaccuracies observed..."
                  className="rjm-textarea"
                />
              </div>

              {/* Reporter Contact Info */}
              <div className="rjm-contact-section">
                <label className="rjm-label">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="rjm-text-input"
                />
                <p className="rjm-privacy-note">
                  Your identity is kept strictly confidential and will never be shared with the employer.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="rjm-footer">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rjm-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rjm-submit-btn"
                >
                  {submitting && <FiLoader className="rjm-spinner" />}
                  <span>{submitting ? "Submitting..." : "Submit Report"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
