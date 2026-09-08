import { useEffect, useMemo, useState } from "react";
import logo from "./assets/maven-logo.svg";

const MAX_UPLOAD_FILE_SIZE = 8 * 1024 * 1024;
const PHONE_DIGITS_REQUIRED = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_SIZES = [
  "1-10 (Startup)",
  "11-50 (Small)",
  "51-200 (Mid-size)",
  "201-500 (Large)",
  "500+ (Enterprise)",
];

const normalizeApiV1BaseUrl = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  const trimmedValue = rawValue.replace(/\/+$/, "");
  const match = trimmedValue.match(/^(.*\/api\/v1)(?:\/.*)?$/i);
  return (match ? match[1] : trimmedValue).replace(/\/+$/, "");
};

const resolveCandidateRegisterUrl = () => {
  const normalizedApiV1 = normalizeApiV1BaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (normalizedApiV1) {
    return `${normalizedApiV1}/candidate/auth/register`;
  }

  const candidateModuleBaseUrl = String(import.meta.env.VITE_CANDIDATE_API_URL || "").trim();
  if (candidateModuleBaseUrl) {
    return `${candidateModuleBaseUrl.replace(/\/+$/, "")}/auth/register`;
  }

  return "http://localhost:3000/api/v1/candidate/auth/register";
};

const parseResponseSafely = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const isValidPhoneNumber = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === PHONE_DIGITS_REQUIRED;
};

const toIndianPhoneDigits = (value = "") => {
  const digitsOnly = String(value || "").replace(/\D/g, "");
  if (digitsOnly.startsWith("91") && digitsOnly.length > PHONE_DIGITS_REQUIRED) {
    return digitsOnly.slice(2, 12);
  }

  return digitsOnly.slice(0, 10);
};

const resolveQrTokenFromLocation = () => {
  const query = new URLSearchParams(window.location.search);
  const queryToken = String(query.get("token") || "").trim();
  if (queryToken) {
    return queryToken;
  }

  const segments = String(window.location.pathname || "")
    .split("/")
    .filter(Boolean);
  const landingTokenIndex = segments.findIndex((part) => part.toLowerCase() === "landing");

  if (landingTokenIndex >= 0 && segments[landingTokenIndex + 1]) {
    return decodeURIComponent(segments[landingTokenIndex + 1]);
  }

  return "";
};

export default function App() {
  const [view, setView] = useState("candidate");
  const [currentStep, setCurrentStep] = useState(1);
  const [isCandidateSubmitting, setIsCandidateSubmitting] = useState(false);

  const [candidateFeedback, setCandidateFeedback] = useState({ type: "", message: "" });
  const [candidateName, setCandidateName] = useState("");
  const [candidateReferenceId, setCandidateReferenceId] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    name: "",
    preferredPosition: "",
    email: "",
    phone: "",
    tagline: "",
    companySize: "",
    linkedIn: "",
  });
  const [resumeFile, setResumeFile] = useState(null);

  const candidateRegisterUrl = useMemo(resolveCandidateRegisterUrl, []);
  const appDownloadUrl =
    String(import.meta.env.VITE_CANDIDATE_APP_URL || "").trim() || "https://play.google.com/store/apps";
  const qrToken = resolveQrTokenFromLocation();

  const updateCandidateField = (field) => (event) => {
    setCandidateForm((prev) => ({ ...prev, [field]: event.target.value }));
    setCandidateFeedback({ type: "", message: "" });
  };

  const handleNext = () => {
    if (!candidateForm.name.trim() || !candidateForm.preferredPosition.trim() || !candidateForm.email.trim() || !candidateForm.phone.trim()) {
      setCandidateFeedback({ type: "error", message: "All personal details are mandatory." });
      return;
    }
    if (!isValidPhoneNumber(candidateForm.phone)) {
      setCandidateFeedback({ type: "error", message: "Enter a valid 10-digit phone number." });
      return;
    }
    if (!EMAIL_PATTERN.test(candidateForm.email.trim())) {
      setCandidateFeedback({ type: "error", message: "Enter a valid email address." });
      return;
    }
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  const resetCandidateDraft = () => {
    setCandidateForm({
      name: "",
      preferredPosition: "",
      email: "",
      phone: "",
      tagline: "",
      companySize: "",
      linkedIn: "",
    });
    setResumeFile(null);
    setCandidateName("");
    setCandidateReferenceId("");
    setShowDownloadModal(false);
    setCandidateFeedback({ type: "", message: "" });
    setCurrentStep(1);
  };

  const resetCandidateFlow = () => {
    resetCandidateDraft();
    setView("candidate");
  };

  const validateCandidateForm = () => {
    if (!resumeFile) {
      return "CV upload is mandatory.";
    }
    if (resumeFile.size > MAX_UPLOAD_FILE_SIZE) {
      return "CV size must be 8MB or less.";
    }
    return "";
  };

  const submitCandidate = async (event) => {
    event.preventDefault();
    setCandidateFeedback({ type: "", message: "" });

    const validationMessage = validateCandidateForm();
    if (validationMessage) {
      setCandidateFeedback({ type: "error", message: validationMessage });
      return;
    }

    const payload = new FormData();
    payload.append("name", candidateForm.name.trim());
    payload.append("designation", candidateForm.preferredPosition.trim());
    payload.append("phone", `+91${toIndianPhoneDigits(candidateForm.phone)}`);
    payload.append("email", candidateForm.email.trim());
    payload.append("tagline", candidateForm.tagline.trim());
    payload.append("companySize", candidateForm.companySize);
    payload.append("linkedIn", candidateForm.linkedIn.trim());
    if (qrToken) {
      payload.append("qrToken", qrToken);
    }
    payload.append("resume", resumeFile);

    setIsCandidateSubmitting(true);

    try {
      const response = await fetch(candidateRegisterUrl, {
        method: "POST",
        body: payload,
      });
      const parsed = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(parsed.message || "Unable to submit application.");
      }

      setCandidateName(candidateForm.name.trim());
      setCandidateReferenceId(String(parsed.referenceId || "").trim());
      setView("thanks");
      setShowDownloadModal(true);
    } catch (error) {
      setCandidateFeedback({
        type: "error",
        message: error.message || "Unable to submit application.",
      });
    } finally {
      setIsCandidateSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showDownloadModal) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowDownloadModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDownloadModal]);

  return (
    <main className="landing-shell">
      <section className="landing-card">
        <header className="landing-head">
          <img src={logo} alt="Maven" className="brand-logo" />
          <p className="brand-copy">OneScanr Gateway</p>
        </header>

        {view === "candidate" ? (
          <>
            <h1 className="headline">Company Application</h1>
            <p className="sub-copy">
              {currentStep === 1 
                ? "Step 1: Personal details. Let's get to know you." 
                : "Step 2: Experience & Documents. Upload your credentials."}
            </p>

            <div className="wizard-progress">
              <div className={`progress-dot ${currentStep >= 1 ? "active" : ""}`}>1</div>
              <div className={`progress-line ${currentStep >= 2 ? "active" : ""}`} />
              <div className={`progress-dot ${currentStep >= 2 ? "active" : ""}`}>2</div>
            </div>

            {candidateFeedback.message ? (
              <div className={`feedback ${candidateFeedback.type === "error" ? "feedback-error" : "feedback-info"}`}>
                {candidateFeedback.message}
              </div>
            ) : null}

            <form className="candidate-form" onSubmit={submitCandidate} noValidate>
              {currentStep === 1 ? (
                <>
                  <label className="form-field">
                    <span className="field-label">Full Name <span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      value={candidateForm.name}
                      onChange={updateCandidateField("name")}
                      placeholder="Your full name"
                    />
                  </label>
                  <label className="form-field">
                    <span className="field-label">Preferred Position <span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      value={candidateForm.preferredPosition}
                      onChange={updateCandidateField("preferredPosition")}
                      placeholder="e.g. Software Engineer"
                    />
                  </label>
                  <label className="form-field">
                    <span className="field-label">Email <span className="required-asterisk">*</span></span>
                    <input
                      type="email"
                      value={candidateForm.email}
                      onChange={updateCandidateField("email")}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="form-field">
                    <span className="field-label">Phone Number <span className="required-asterisk">*</span></span>
                    <div className="phone-input-row">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={candidateForm.phone}
                        onChange={(event) =>
                          setCandidateForm((prev) => ({ ...prev, phone: toIndianPhoneDigits(event.target.value) }))
                        }
                        placeholder="9876543210"
                      />
                    </div>
                  </label>
                  <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
                    <button type="button" className="button button-primary" onClick={handleNext} style={{ width: "100%" }}>
                      Next Step
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="form-field">
                    <span className="field-label">Current Company Tagline</span>
                    <input
                      type="text"
                      value={candidateForm.tagline}
                      onChange={updateCandidateField("tagline")}
                      placeholder="e.g. Innovating HR Tech"
                    />
                  </label>
                  <label className="form-field">
                    <span className="field-label">Current Business Size</span>
                    <select 
                      className="custom-select"
                      value={candidateForm.companySize}
                      onChange={updateCandidateField("companySize")}
                    >
                      <option value="">Select Company Size</option>
                      {COMPANY_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ) )}
                    </select>
                  </label>
                  <label className="form-field form-field-full">
                    <span className="field-label">LinkedIn Profile URL</span>
                    <input
                      type="url"
                      value={candidateForm.linkedIn}
                      onChange={updateCandidateField("linkedIn")}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </label>
                  <label className="form-field form-field-full">
                    <span className="field-label">Upload CV <span className="required-asterisk">*</span></span>
                    <input
                      type="file"
                      accept="application/pdf,.doc,.docx"
                      onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <div className="form-actions" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                    <button type="button" className="button button-secondary" onClick={handleBack} style={{ flex: 1 }}>
                      Back
                    </button>
                    <button type="submit" className="button button-primary" disabled={isCandidateSubmitting} style={{ flex: 2 }}>
                      {isCandidateSubmitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        ) : null}

        {view === "thanks" ? (
          <section className="thanks-card">
            <h1 className="headline">THANK YOU{candidateName ? `, ${candidateName}` : ""}</h1>
            <p className="sub-copy">
              Your application has been submitted successfully to the employer.
            </p>
            {candidateReferenceId ? (
              <p className="reference-copy">
                Reference ID: <strong>{candidateReferenceId}</strong>
              </p>
            ) : null}
            <div className="thanks-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowDownloadModal(true)}
              >
                Download OneScanr App
              </button>
              <button type="button" className="button button-secondary" onClick={resetCandidateFlow}>
                Submit Another Application
              </button>
            </div>
          </section>
        ) : null}

        {showDownloadModal ? (
          <div className="download-modal-backdrop" role="presentation" onClick={() => setShowDownloadModal(false)}>
            <section
              className="download-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Download OneScanr App"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="download-modal-head">
                <img src={logo} alt="OneScanr" className="download-modal-logo" />
                <h2>Download OneScanr App</h2>
                <p>Track your application status and updates live from the app.</p>
              </div>
              <div className="download-modal-actions">
                <a className="button button-primary" href={appDownloadUrl} target="_blank" rel="noreferrer">
                  Download Now
                </a>
                <button type="button" className="button button-secondary" onClick={() => setShowDownloadModal(false)}>
                  Continue on Web
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
