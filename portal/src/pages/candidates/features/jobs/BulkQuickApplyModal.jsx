import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import authService from "../../../../services/authService";

const normalizeQuestionKey = (text) =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const QUESTION_TYPES = {
  TEXT: "TEXT",
  PARAGRAPH: "PARAGRAPH",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  CHECKBOX: "CHECKBOX",
  YES_NO: "YES_NO",
  DROPDOWN: "DROPDOWN",
  NUMERIC: "NUMERIC",
  URL: "URL",
  DATE: "DATE",
  FILE_UPLOAD: "FILE_UPLOAD",
};

export default function BulkQuickApplyModal({
  selectedJobIds,
  jobsData,
  onApplySuccess,
  onClose,
}) {
  const [step, setStep] = useState("questions");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState({ successful: [], failed: [] });
  const autoStartedRef = useRef(false);

  const selectedJobs = useMemo(
    () =>
      (jobsData || []).filter((job) =>
        selectedJobIds.includes(String(job.id ?? job._id)),
      ),
    [jobsData, selectedJobIds],
  );

  const questions = useMemo(() => {
    const map = new Map();
    selectedJobs.forEach((job) => {
      const qs = Array.isArray(job.screeningQuestions)
        ? job.screeningQuestions
        : [];
      qs.forEach((q) => {
        const key = normalizeQuestionKey(q.question);
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, {
            key,
            questionId: q._id || q.id || key,
            question: q.question,
            type: q.type || "TEXT",
            options: Array.isArray(q.options) ? q.options : [],
            maxLength: q.maxLength,
            jobIds: [],
            jobTitles: [],
          });
        }
        const entry = map.get(key);
        const jobId = String(job.id ?? job._id);
        if (!entry.jobIds.includes(jobId)) {
          entry.jobIds.push(jobId);
          entry.jobTitles.push(job.title || "");
        }
      });
    });
    return [...map.values()];
  }, [selectedJobs]);

  const noQuestions = questions.length === 0;

  const allAnswered = questions.every((q) => {
    const val = answers[q.key];
    if (q.type === QUESTION_TYPES.CHECKBOX) {
      return Array.isArray(val) && val.length > 0;
    }
    return typeof val === "string" && val.trim() !== "";
  });

  const handleAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const buildAnswersForJob = (job) => {
    const qs = Array.isArray(job.screeningQuestions)
      ? job.screeningQuestions
      : [];
    return qs
      .map((q) => {
        const key = normalizeQuestionKey(q.question);
        const val = answers[key];
        const answer = Array.isArray(val) ? val.join(", ") : val || "";
        return {
          questionId: q._id || q.id || key,
          question: q.question,
          answer,
        };
      })
      .filter((a) => a.answer);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStep("applying");
    setProgress({ done: 0, total: selectedJobs.length });

    const successful = [];
    const failed = [];

    for (const job of selectedJobs) {
      const jobId = String(job.id ?? job._id);
      try {
        await authService.createApplication({
          jobId,
          appliedFrom: "QUICK_APPLY",
          answers: buildAnswersForJob(job),
        });
        successful.push(jobId);
      } catch (err) {
        const msg =
          typeof err === "string"
            ? err
            : err?.message || err?.error || "";
        if (msg.toLowerCase().includes("already applied")) {
          successful.push(jobId);
        } else {
          failed.push({ id: jobId, title: job.title || jobId });
        }
      }
      setProgress((prev) => ({
        done: prev.done + 1,
        total: selectedJobs.length,
      }));
    }

    setResults({ successful, failed });
    setStep("success");
    if (onApplySuccess) onApplySuccess(successful);
  };

  const handleCloseAuto = () => {
    if (submitting) return;
    onClose && onClose();
  };

  // If none of the selected jobs have screening questions,
  // jump straight to the applying state.
  useEffect(() => {
    if (noQuestions && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noQuestions]);

  const renderInput = (q) => {
    const type = q.type || QUESTION_TYPES.TEXT;
    const val = answers[q.key];
    const commonProps = {
      className: "rj-qa-input",
      placeholder: "Your answer",
      onChange: (e) => handleAnswer(q.key, e.target.value),
    };

    if (type === QUESTION_TYPES.PARAGRAPH) {
      return (
        <textarea
          {...commonProps}
          className="rj-qa-input rj-qa-textarea"
          rows={3}
          value={val || ""}
        />
      );
    }

    if (
      type === QUESTION_TYPES.MULTIPLE_CHOICE ||
      type === QUESTION_TYPES.DROPDOWN
    ) {
      return (
        <select {...commonProps} value={val || ""}>
          <option value="" disabled>
            Select an option
          </option>
          {q.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (type === QUESTION_TYPES.YES_NO) {
      return (
        <select {...commonProps} value={val || ""}>
          <option value="" disabled>
            Select an option
          </option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (type === QUESTION_TYPES.CHECKBOX) {
      const selectedVals = Array.isArray(val) ? val : [];
      return (
        <div className="rj-qa-checks">
          {q.options.map((opt) => (
            <label key={opt} className="rj-qa-check">
              <input
                type="checkbox"
                checked={selectedVals.includes(opt)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedVals, opt]
                    : selectedVals.filter((v) => v !== opt);
                  handleAnswer(q.key, next);
                }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        {...commonProps}
        type={
          type === QUESTION_TYPES.NUMERIC
            ? "number"
            : type === QUESTION_TYPES.URL
              ? "url"
              : type === QUESTION_TYPES.DATE
                ? "date"
                : "text"
        }
        maxLength={q.maxLength || undefined}
        value={val || ""}
      />
    );
  };

  return (
    <div className="rj-qa-overlay" onClick={handleCloseAuto}>
      <div className="rj-qa-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rj-qa-header">
          <div>
            <h3>Quick Apply</h3>
            <p>
              {selectedJobs.length} job{selectedJobs.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <button
            className="rj-qa-close"
            onClick={handleCloseAuto}
            disabled={submitting}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Step 1: Questions */}
        {step === "questions" && (
          <div className="rj-qa-step" key="questions">
            {noQuestions ? (
              <div className="rj-qa-none">
                No screening questions for the selected jobs.
              </div>
            ) : (
              <div className="rj-qa-questions">
                {questions.map((q) => (
                  <div className="rj-qa-question" key={q.key}>
                    <div className="rj-qa-q-head">
                      <span className="rj-qa-q-text">{q.question}</span>
                      {q.jobIds.length > 1 && (
                        <span className="rj-qa-q-count">
                          Asked in {q.jobIds.length} jobs
                        </span>
                      )}
                    </div>
                    {renderInput(q)}
                  </div>
                ))}
              </div>
            )}

            <div className="rj-qa-footer">
              <button
                className="rj-qa-cancel"
                onClick={handleCloseAuto}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="rj-qa-submit"
                onClick={handleSubmit}
                disabled={!noQuestions && !allAnswered}
              >
                Submit Applications
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Applying */}
        {step === "applying" && (
          <div className="rj-qa-step rj-qa-center" key="applying">
            <div className="rj-qa-spinner" />
            <h4>Applying to {progress.total} jobs...</h4>
            <div className="rj-qa-progress">
              <div
                className="rj-qa-progress-bar"
                style={{
                  width: `${(progress.done / Math.max(progress.total, 1)) * 100}%`,
                }}
              />
            </div>
            <span className="rj-qa-progress-label">
              {progress.done} / {progress.total}
            </span>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="rj-qa-step rj-qa-center" key="success">
            <div className="rj-qa-success-icon">
              <FiCheckCircle size={44} />
            </div>
            <h4>
              Successfully applied to {results.successful.length} job
              {results.successful.length !== 1 ? "s" : ""}!
            </h4>
            {results.failed.length > 0 && (
              <p className="rj-qa-fail-note">
                Applied to {results.successful.length} jobs.{" "}
                {results.failed.length} failed.
              </p>
            )}
            {results.failed.length > 0 && (
              <ul className="rj-qa-fail-list">
                {results.failed.map((f) => (
                  <li key={f.id}>
                    <FiAlertCircle size={13} /> {f.title}
                  </li>
                ))}
              </ul>
            )}
            <button className="rj-qa-submit" onClick={handleCloseAuto}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}