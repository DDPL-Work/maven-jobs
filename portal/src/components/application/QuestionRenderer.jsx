import React from "react";
import QuestionInput from "./QuestionInput";

const qid = (q) => q._id || q.id;

export default function QuestionRenderer({ question, value, onChange, error }) {
  if (!question) return null;

  return (
    <div className="am-question-container">
      <label className="am-question-label">
        {question.question}
        {question.required && <span className="am-required-asterisk">*</span>}
      </label>
      <QuestionInput
        type={question.type || "TEXT"}
        value={value}
        onChange={(val) => onChange(qid(question), val)}
        options={question.options}
        required={question.required}
        error={error}
        placeholder={question.placeholder}
      />
    </div>
  );
}
