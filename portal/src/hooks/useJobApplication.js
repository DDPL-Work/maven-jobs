import { useState, useCallback, useEffect } from "react";
import { useCreateApplication } from "./useCandidateMutations";
import { validateScreeningAnswers } from "../utils/validation";

const getQuestionId = (q) => q._id || q.id;

export default function useJobApplication(job, user) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const createApplicationMutation = useCreateApplication(user?._id || user?.id);

  const hasScreeningQuestions = job?.screeningQuestions?.length > 0;

  useEffect(() => {
    setHasApplied(job?.hasApplied || false);
  }, [job?.hasApplied]);

  useEffect(() => {
    const jobId = job?._id || job?.id;
    if (jobId && isModalOpen) {
      try {
        const saved = localStorage.getItem(`draft_app_${jobId}`);
        if (saved) {
          setAnswers(JSON.parse(saved));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [job?._id, job?.id, isModalOpen]);

  useEffect(() => {
    const jobId = job?._id || job?.id;
    if (jobId && isModalOpen && Object.keys(answers).length > 0) {
      localStorage.setItem(`draft_app_${jobId}`, JSON.stringify(answers));
    }
  }, [answers, job?._id, job?.id, isModalOpen]);

  const buildAnswersPayload = (finalAnswers) => {
    const questions = job?.screeningQuestions || [];
    return questions.map((q) => {
      const qid = getQuestionId(q);
      return {
        questionId: qid,
        question: q.question || "",
        answer: finalAnswers[qid] !== undefined ? finalAnswers[qid] : "",
      };
    });
  };

  const doSubmit = async (finalAnswers, appliedFrom) => {
    setIsSubmitting(true);
    const jobId = job?._id || job?.id;
    if (!jobId) return;

    const payload = {
      jobId,
      appliedFrom,
    };

    if (hasScreeningQuestions) {
      payload.answers = buildAnswersPayload(finalAnswers);
    }

    try {
      await createApplicationMutation.mutateAsync(payload);
      localStorage.removeItem(`draft_app_${jobId}`);
      setHasApplied(true);
      setIsSuccess(true);
      if (hasScreeningQuestions) {
        setTimeout(() => {
          setIsModalOpen(false);
          setTimeout(() => setIsSuccess(false), 200);
        }, 2500);
      }
    } catch (error) {
      const msg = error?.message || error?.error || "";
      if (msg.includes("already applied")) {
        setHasApplied(true);
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyClick = useCallback(
    (appliedFrom = "JOB_DETAILS") => {
      if (hasApplied) return;
      if (!user) return;

      if (!hasScreeningQuestions) {
        doSubmit({}, appliedFrom);
      } else {
        setIsModalOpen(true);
      }
    },
    [hasScreeningQuestions, hasApplied, user]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setErrors({});
    setTimeout(() => setIsSuccess(false), 200);
  }, []);

  const handleChange = useCallback(
    (questionId, value) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (errors[questionId]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e, appliedFrom = "QUICK_APPLY") => {
      e?.preventDefault();
      const questions = job?.screeningQuestions || [];
      if (questions.length === 0) {
        await doSubmit({}, appliedFrom);
        return;
      }

      const { isValid, errors: validationErrors } = validateScreeningAnswers(questions, answers);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      await doSubmit(answers, appliedFrom);
    },
    [job, answers]
  );

  return {
    isModalOpen,
    answers,
    errors,
    isSubmitting,
    isSuccess,
    hasApplied,
    hasScreeningQuestions,
    handleApplyClick,
    handleCloseModal,
    handleChange,
    handleSubmit,
  };
}
