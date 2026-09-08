const getQuestionId = (q) => q._id || q.id;

export const validateQuestion = (question, value) => {
  if (question.required) {
    if (value === undefined || value === null || value === "") {
      return "This question is required";
    }
    if (Array.isArray(value) && value.length === 0) {
      return "Please select at least one option";
    }
  }

  return null;
};

export const validateScreeningAnswers = (questions, answers) => {
  const errors = {};
  let isValid = true;

  questions.forEach((q) => {
    const qid = getQuestionId(q);
    const error = validateQuestion(q, answers[qid]);
    if (error) {
      errors[qid] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};
