import React, { useEffect, useRef, useState } from "react";
import { FiX, FiCheckCircle, FiClock } from "react-icons/fi";
import QuestionRenderer from "./QuestionRenderer";
import "./ApplicationModal.css";

const getCompanyLogo = (job) => {
  return job?.companyLogoUrl || job?.company?.logoUrl || "";
};

const getCompanyName = (job) => {
  return job?.companyName || job?.company?.name || "";
};

const getJobLocation = (job) => {
  return job?.location || job?.company?.location || "";
};

export default function ApplicationModal({
  isOpen,
  onClose,
  job,
  user,
  answers,
  errors,
  isSubmitting,
  isSuccess,
  onChange,
  onSubmit,
}) {
  const modalRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const companyLogo = getCompanyLogo(job);
  const companyName = getCompanyName(job);
  const jobLocation = getJobLocation(job);
  const questions = job?.screeningQuestions || [];
  const candidateName = user?.name || user?.fullname || "Candidate";

  return (
    <div
      className="am-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="am-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="am-modal-title"
      >
        <div className="am-header">
          <div className="am-header-top">
            <div className="am-company-info">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="am-company-logo"
                />
              ) : (
                <div className="am-company-logo-fallback">
                  {(companyName || "C")[0].toUpperCase()}
                </div>
              )}
              <div className="am-job-info">
                <h2 id="am-modal-title">{job?.title || ""}</h2>
                <p className="am-company-name-text">{companyName}{jobLocation ? ` \u2022 ${jobLocation}` : ""}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="am-close-btn"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="am-divider"></div>

          {!showSuccess && (
            <div className="am-greeting">
              <h3>Hi {candidateName.split(" ")[0]},</h3>
              <p className="am-greeting-msg">
                {companyName} would like to know a little more about you before reviewing your application.
              </p>
              <p className="am-greeting-note">Please answer the following screening questions honestly.</p>
              <div className="am-estimate">
                <FiClock size={15} />
                <span>This usually takes less than <strong>2 minutes</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="am-body">
          {showSuccess ? (
            <div className="am-success-view">
              <div className="am-success-icon-wrap">
                <FiCheckCircle size={48} />
              </div>
              <h3 className="am-success-title">Application Submitted!</h3>
              <p className="am-success-desc">
                Your application for <strong>{job?.title}</strong> at <strong>{companyName}</strong> has been sent successfully.
              </p>
              <p className="am-success-sub">The employer will review your application and get back to you.</p>
            </div>
          ) : (
            <form id="am-application-form" onSubmit={onSubmit} noValidate>
              {questions.length === 0 ? (
                <div className="am-empty-questions">
                  <p>No screening questions for this position. Your application will be submitted directly.</p>
                </div>
              ) : (
                <>
                  <div className="am-questions-progress">
                    {questions.map((q, idx) => {
                      const qid = q._id || q.id;
                      const isAnswered = answers[qid] !== undefined && answers[qid] !== null && answers[qid] !== "";
                      return (
                        <div
                          key={qid || idx}
                          className={`am-progress-dot${isAnswered ? " filled" : ""}`}
                          title={`Question ${idx + 1}`}
                        />
                      );
                    })}
                    <span className="am-progress-label">{questions.length} question{questions.length > 1 ? "s" : ""}</span>
                  </div>
                  {questions.map((q, idx) => {
                    const qIdentifier = q._id || q.id;
                    return (
                      <div key={qIdentifier || idx} className="am-question-wrapper">
                        <span className="am-question-number">Question {idx + 1}</span>
                        <QuestionRenderer
                          question={q}
                          value={answers[qIdentifier]}
                          onChange={onChange}
                          error={errors[qIdentifier]}
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </form>
          )}
        </div>

        {!showSuccess && (
          <div className="am-footer">
            <button
              type="button"
              className="am-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="am-application-form"
              className="am-submit-btn"
              disabled={isSubmitting || questions.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="am-spinner"></span>
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
