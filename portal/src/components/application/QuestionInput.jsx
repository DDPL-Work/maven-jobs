import React from "react";

function TextInput({ value, onChange, maxLength, placeholder, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength || 500}
        placeholder={placeholder || "Type your answer..."}
        className={`am-text-input${error ? " has-error" : ""}`}
        aria-required={required}
      />
      {maxLength > 0 && (
        <span className="am-char-count">{String(value || "").length}/{maxLength}</span>
      )}
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function ParagraphInput({ value, onChange, maxLength, placeholder, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength || 2000}
        placeholder={placeholder || "Type your answer..."}
        rows={4}
        className={`am-textarea${error ? " has-error" : ""}`}
        aria-required={required}
      />
      {maxLength > 0 && (
        <span className="am-char-count">{String(value || "").length}/{maxLength}</span>
      )}
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function YesNoInput({ value, onChange, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <div className="am-yesno-group">
        {["Yes", "No"].map((opt) => (
          <button
            key={opt}
            type="button"
            className={`am-yesno-btn${value === opt ? " selected" : ""}`}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function MultipleChoiceInput({ value, onChange, options, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <div className="am-choice-group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`am-choice-btn${value === opt ? " selected" : ""}`}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function CheckboxInput({ value, onChange, options, required, error }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    onChange(next);
  };
  return (
    <div className="am-question-input-wrap">
      <div className="am-checkbox-group">
        {options.map((opt) => (
          <label key={opt} className="am-checkbox-label">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function DropdownInput({ value, onChange, options, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`am-dropdown${error ? " has-error" : ""}`}
        aria-required={required}
      >
        <option value="">Select an option...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function NumericInput({ value, onChange, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a number..."
        className={`am-text-input${error ? " has-error" : ""}`}
        aria-required={required}
      />
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function UrlInput({ value, onChange, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className={`am-text-input${error ? " has-error" : ""}`}
        aria-required={required}
      />
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

function DateInput({ value, onChange, required, error }) {
  return (
    <div className="am-question-input-wrap">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`am-text-input${error ? " has-error" : ""}`}
        aria-required={required}
      />
      {error && <span className="am-field-error">{error}</span>}
    </div>
  );
}

const INPUT_MAP = {
  TEXT: TextInput,
  PARAGRAPH: ParagraphInput,
  YES_NO: YesNoInput,
  MULTIPLE_CHOICE: MultipleChoiceInput,
  CHECKBOX: CheckboxInput,
  DROPDOWN: DropdownInput,
  NUMERIC: NumericInput,
  URL: UrlInput,
  DATE: DateInput,
};

export default function QuestionInput({ type, value, onChange, ...props }) {
  const InputComponent = INPUT_MAP[type] || TextInput;
  return <InputComponent value={value} onChange={onChange} {...props} />;
}
