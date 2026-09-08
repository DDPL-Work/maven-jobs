import { useEffect, useMemo, useState } from "react";
import { LuLoaderCircle } from "react-icons/lu";
import logo from "./assets/maven-logo.svg";

const MAX_UPLOAD_FILE_SIZE = 8 * 1024 * 1024;
const MAX_CLIENT_JD_FILES = 5;
const PHONE_DIGITS_REQUIRED = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PDF_MIME_TYPES = new Set(["application/pdf"]);

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

const resolveCandidateProfileUrl = () => {
  const normalizedApiV1 = normalizeApiV1BaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (normalizedApiV1) {
    return `${normalizedApiV1}/candidate/profile`;
  }

  const candidateModuleBaseUrl = String(import.meta.env.VITE_CANDIDATE_API_URL || "").trim();
  if (candidateModuleBaseUrl) {
    return `${candidateModuleBaseUrl.replace(/\/+$/, "")}/profile`;
  }

  return "http://localhost:3000/api/v1/candidate/profile";
};

const resolveCandidateResumeUrl = () => {
  const normalizedApiV1 = normalizeApiV1BaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (normalizedApiV1) {
    return `${normalizedApiV1}/candidate/profile/resume`;
  }

  const candidateModuleBaseUrl = String(import.meta.env.VITE_CANDIDATE_API_URL || "").trim();
  if (candidateModuleBaseUrl) {
    return `${candidateModuleBaseUrl.replace(/\/+$/, "")}/profile/resume`;
  }

  return "http://localhost:3000/api/v1/candidate/profile/resume";
};

const resolveClientIntakeUrl = () => {
  const normalizedApiV1 = normalizeApiV1BaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (normalizedApiV1) {
    return `${normalizedApiV1}/lead-generator/client-intakes`;
  }

  return "http://localhost:3000/api/v1/lead-generator/client-intakes";
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

const isPdfFile = (file = null) => {
  if (!file) {
    return false;
  }

  const mimeType = String(file.type || "").toLowerCase();
  const fileName = String(file.name || "").toLowerCase();
  return PDF_MIME_TYPES.has(mimeType) || fileName.endsWith(".pdf");
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
  const [view, setView] = useState("role");
  const [isCandidateSubmitting, setIsCandidateSubmitting] = useState(false);
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);

  const [candidateFeedback, setCandidateFeedback] = useState({ type: "", message: "" });
  const [candidateName, setCandidateName] = useState("");
  const [candidateReferenceId, setCandidateReferenceId] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    name: "",
    preferredPosition: "",
    email: "",
    phone: "",
    preferredLocation: "",
    expectedSalary: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateStep, setCandidateStep] = useState(1);
  const [candidateAuthToken, setCandidateAuthToken] = useState("");

  const [clientFeedback, setClientFeedback] = useState({ type: "", message: "" });
  const [clientReferenceId, setClientReferenceId] = useState("");
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientForm, setClientForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    roleTitle: "",
    budget: "",
    companySize: "",
    interviewLocation: "",
    alternatePhone: "",
    alternateEmail: "",
    specialNotes: "",
    organisationType: "",
    designation: "",
  });
  const [gstCertificateFile, setGstCertificateFile] = useState(null);
  const [clientStep, setClientStep] = useState(1);

  const candidateRegisterUrl = useMemo(resolveCandidateRegisterUrl, []);
  const candidateProfileUrl = useMemo(resolveCandidateProfileUrl, []);
  const candidateResumeUrl = useMemo(resolveCandidateResumeUrl, []);
  const clientIntakeUrl = useMemo(resolveClientIntakeUrl, []);
  const appDownloadUrl =
    String(import.meta.env.VITE_CANDIDATE_APP_URL || "").trim() || "https://play.google.com/store/apps";
  const qrToken = resolveQrTokenFromLocation();

  const updateCandidateField = (field) => (event) => {
    setCandidateForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updateClientField = (field) => (event) => {
    setClientForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetCandidateDraft = () => {
    setCandidateForm({
      name: "",
      preferredPosition: "",
      email: "",
      phone: "",
      preferredLocation: "",
      expectedSalary: "",
    });
    setResumeFile(null);
    setCandidateName("");
    setCandidateReferenceId("");
    setShowDownloadModal(false);
    setCandidateFeedback({ type: "", message: "" });
    setCandidateAuthToken("");
  };

  const resetClientDraft = () => {
    setClientForm({
      companyName: "",
      email: "",
      phone: "",
      roleTitle: "",
      budget: "",
      companySize: "",
      interviewLocation: "",
      alternatePhone: "",
      alternateEmail: "",
      specialNotes: "",
      organisationType: "",
      designation: "",
    });
    setGstCertificateFile(null);
    setClientFeedback({ type: "", message: "" });
    setClientReferenceId("");
    setClientCompanyName("");
  };

  const resetCandidateFlow = () => {
    resetCandidateDraft();
    setCandidateStep(1);
    setView("role");
  };

  const resetClientFlow = () => {
    resetClientDraft();
    setClientStep(1);
    setView("role");
  };

  const validateClientStepOne = () => {
    if (!clientForm.companyName.trim() || !clientForm.email.trim() || !clientForm.phone.trim()) {
      return "Company name, email, and phone number are mandatory.";
    }

    if (!EMAIL_PATTERN.test(clientForm.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!isValidPhoneNumber(clientForm.phone)) {
      return "Phone number must contain exactly 10 digits.";
    }

    return "";
  };

  const handleClientNext = (event) => {
    event.preventDefault();
    setClientFeedback({ type: "", message: "" });

    const validationMessage = validateClientStepOne();
    if (validationMessage) {
      setClientFeedback({ type: "error", message: validationMessage });
      return;
    }

    setClientStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateCandidateStepOne = () => {
    if (
      !candidateForm.name.trim() ||
      !candidateForm.preferredPosition.trim() ||
      !candidateForm.email.trim() ||
      !candidateForm.phone.trim()
    ) {
      return "All fields are mandatory.";
    }

    if (!isValidPhoneNumber(candidateForm.phone)) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!EMAIL_PATTERN.test(candidateForm.email.trim())) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const handleCandidateNext = async (event) => {
    event.preventDefault();
    setCandidateFeedback({ type: "", message: "" });

    const validationMessage = validateCandidateStepOne();
    if (validationMessage) {
      setCandidateFeedback({ type: "error", message: validationMessage });
      return;
    }

    const payload = new FormData();
    payload.append("name", candidateForm.name.trim());
    payload.append("designation", candidateForm.preferredPosition.trim());
    payload.append("phone", `+91${toIndianPhoneDigits(candidateForm.phone)}`);
    payload.append("email", candidateForm.email.trim());
    if (qrToken) {
      payload.append("qrToken", qrToken);
    }

    setIsCandidateSubmitting(true);

    try {
      const response = await fetch(candidateRegisterUrl, {
        method: "POST",
        body: payload,
      });
      const parsed = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(parsed.message || "Unable to submit candidate registration.");
      }

      setCandidateAuthToken(parsed.token || "");
      setCandidateName(candidateForm.name.trim());
      setCandidateReferenceId(String(parsed.referenceId || "").trim());
      
      setCandidateStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setCandidateFeedback({
        type: "error",
        message: error.message || "Unable to submit candidate registration.",
      });
    } finally {
      setIsCandidateSubmitting(false);
    }
  };

  const validateCandidateForm = () => {
    if (resumeFile) {
      if (!isPdfFile(resumeFile)) {
        return "Please upload CV in PDF format only.";
      }
      if (resumeFile.size > MAX_UPLOAD_FILE_SIZE) {
        return "CV size must be 8MB or less.";
      }
    }
    return "";
  };

  const validateClientForm = () => {
    if (!clientForm.companyName.trim() || !clientForm.email.trim() || !clientForm.phone.trim()) {
      return "Company name, email, and phone number are mandatory.";
    }

    if (!EMAIL_PATTERN.test(clientForm.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!isValidPhoneNumber(clientForm.phone)) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!clientForm.roleTitle.trim()) {
      return "Please provide a role title for the position.";
    }

    if (clientForm.alternateEmail.trim() && !EMAIL_PATTERN.test(clientForm.alternateEmail.trim())) {
      return "Please enter a valid alternate email address.";
    }

    if (clientForm.alternatePhone.trim() && !isValidPhoneNumber(clientForm.alternatePhone)) {
      return "Alternate contact number must contain exactly 10 digits.";
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

    setIsCandidateSubmitting(true);

    try {
      if (candidateForm.expectedSalary.trim() || candidateForm.preferredLocation.trim()) {
        const profilePayload = {};
        if (candidateForm.expectedSalary.trim()) profilePayload.expectedSalary = candidateForm.expectedSalary.trim();
        if (candidateForm.preferredLocation.trim()) profilePayload.preferredLocations = [candidateForm.preferredLocation.trim()];

        const response = await fetch(candidateProfileUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${candidateAuthToken}`,
          },
          body: JSON.stringify(profilePayload),
        });
        
        if (!response.ok) {
          const parsed = await parseResponseSafely(response);
          throw new Error(parsed.message || "Failed to update profile information.");
        }
      }

      if (resumeFile) {
        const resumePayload = new FormData();
        resumePayload.append("resume", resumeFile);

        const response = await fetch(candidateResumeUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${candidateAuthToken}`,
          },
          body: resumePayload,
        });

        if (!response.ok) {
          const parsed = await parseResponseSafely(response);
          throw new Error(parsed.message || "Failed to upload resume.");
        }
      }

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

  const submitClient = async (event) => {
    event.preventDefault();
    setClientFeedback({ type: "", message: "" });

    const validationMessage = validateClientForm();
    if (validationMessage) {
      setClientFeedback({ type: "error", message: validationMessage });
      return;
    }

    const payload = new FormData();
    payload.append("companyName", clientForm.companyName.trim());
    payload.append("email", clientForm.email.trim());
    payload.append("phone", `+91${toIndianPhoneDigits(clientForm.phone)}`);
    payload.append("roleTitle", clientForm.roleTitle.trim());
    payload.append("budget", clientForm.budget.trim());
    payload.append("companySize", clientForm.companySize);
    payload.append("interviewLocation", clientForm.interviewLocation.trim());
    payload.append("alternatePhone", clientForm.alternatePhone.trim() ? `+91${toIndianPhoneDigits(clientForm.alternatePhone)}` : "");
    payload.append("alternateEmail", clientForm.alternateEmail.trim());
    payload.append("specialNotes", clientForm.specialNotes.trim());
    payload.append("organisationType", clientForm.organisationType);
    payload.append("designation", clientForm.designation.trim());
    if (gstCertificateFile) {
      payload.append("gstCertificate", gstCertificateFile);
    }
    if (qrToken) {
      payload.append("qrToken", qrToken);
    }

    setIsClientSubmitting(true);

    try {
      const response = await fetch(clientIntakeUrl, {
        method: "POST",
        body: payload,
      });
      const parsed = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(parsed.message || "Unable to submit client role posting.");
      }

      setClientCompanyName(clientForm.companyName.trim());
      setClientReferenceId(String(parsed.referenceId || "").trim());
      setView("client-thanks");
      setShowDownloadModal(true);
    } catch (error) {
      setClientFeedback({
        type: "error",
        message: error.message || "Unable to submit client role posting.",
      });
    } finally {
      setIsClientSubmitting(false);
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

  const isCandidateSuccessView = view === "thanks";
  const isClientSuccessView = view === "client-thanks";
  const downloadModalContent = isCandidateSuccessView
    ? {
        ariaLabel: "Track Your Match",
        title: "Track Your Match",
        description: "Download App & Connect with your growth.",
        primaryLabel: "Download Maven App",
        secondaryLabel: "",
      }
    : isClientSuccessView
    ? {
        ariaLabel: "Make Your Great Team",
        title: "Make Your Great Team",
        description: "Download App & Grow with Maven",
        primaryLabel: "Download Maven App",
        secondaryLabel: "",
      }
    : {
        ariaLabel: "Download MavenJobs App",
        title: "Download MavenJobs App",
        description: "Track your application status and updates live from the app.",
        primaryLabel: "Download Now",
        secondaryLabel: "Continue on Web",
      };

  return (
    <main className="landing-shell">
      <img src={logo} alt="Maven Jobs" className="brand-logo brand-logo-fixed" />

      <section className={view === "role" ? "role-selection-wrapper" : "landing-card"}>
        {view === "role" ? (
          <>
            <div className="role-grid">
              <button
                type="button"
                className="role-card"
                onClick={() => {
                  setCandidateFeedback({ type: "", message: "" });
                  setCandidateStep(1);
                  setView("candidate");
                }}
              >
                <h2 className="gradient-heading">Match your desired role</h2>
                <p>As per Location, CTC, Overall Growth</p>
                <span className="role-card-btn">Candidate Login</span>
              </button>

              <button
                type="button"
                className="role-card"
                onClick={() => {
                  setClientFeedback({ type: "", message: "" });
                  setClientStep(1);
                  setView("client");
                }}
              >
                <h2 className="gradient-heading">Need a great team?</h2>
                <p>Build with Maven Join. Connect. Grow.</p>
                <span className="role-card-btn">Employer Login</span>
              </button>
            </div>
          </>
        ) : null}

        {view === "candidate" ? (
          <>
            <div className="match-flow-head">
              <h1 className="headline">Match Here</h1>
              <p className="match-flow-copy" aria-label="Location, CTC, Overall Growth">
                <span className="match-flow-token match-flow-token-location">Location</span>
                <span className="match-flow-divider">|</span>
                <span className="match-flow-token match-flow-token-ctc">CTC</span>
                <span className="match-flow-divider">|</span>
                <span className="match-flow-token match-flow-token-growth">Overall Growth</span>
              </p>
            </div>

            {candidateFeedback.message ? (
              <div className={`feedback ${candidateFeedback.type === "error" ? "feedback-error" : "feedback-info"}`}>
                {candidateFeedback.message}
              </div>
            ) : null}

            <form
              className="candidate-form"
              onSubmit={candidateStep === 2 ? submitCandidate : handleCandidateNext}
              noValidate
            >
              {candidateStep === 1 ? (
                <>
                  <label className="form-field">
                    <span className="field-label">
                      Full Name <span className="required-asterisk">*</span>
                    </span>
                    <input
                      type="text"
                      value={candidateForm.name}
                      onChange={updateCandidateField("name")}
                      placeholder="Your full name"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Preferred Position <span className="required-asterisk">*</span>
                    </span>
                    <input
                      type="text"
                      value={candidateForm.preferredPosition}
                      onChange={updateCandidateField("preferredPosition")}
                      placeholder="e.g. Software Engineer"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Email <span className="required-asterisk">*</span>
                    </span>
                    <input
                      type="email"
                      value={candidateForm.email}
                      onChange={updateCandidateField("email")}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Phone Number <span className="required-asterisk">*</span>
                    </span>
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

                  <div className="form-actions">
                    <button type="submit" className="button button-primary" disabled={isCandidateSubmitting}>
                      {isCandidateSubmitting ? <LuLoaderCircle className="spin" /> : "Next"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="form-field">
                    <span className="field-label">Preferred Location (optional)</span>
                    <input
                      type="text"
                      value={candidateForm.preferredLocation}
                      onChange={updateCandidateField("preferredLocation")}
                      placeholder="e.g. Bangalore, Remote"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Expected CTC (optional)</span>
                    <input
                      type="text"
                      value={candidateForm.expectedSalary}
                      onChange={updateCandidateField("expectedSalary")}
                      placeholder="e.g. 10 LPA"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Upload CV (optional)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="form-actions">
                    <button type="submit" className="button button-primary" disabled={isCandidateSubmitting}>
                      {isCandidateSubmitting ? <LuLoaderCircle className="spin" /> : "Join with Maven"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        ) : null}

        {view === "client" ? (
          <>
            <div className="match-flow-head">
              <h1 className="headline">Build Great Team</h1>
              <p className="match-flow-copy" aria-label="Fit to Role, Skill versus Budget Match">
                <span className="match-flow-token match-flow-token-growth">Fit to Role</span>
                <span className="match-flow-divider">|</span>
                <span className="match-flow-token match-flow-token-ctc">Skill vs Budget Match</span>
              </p>
            </div>

            {clientFeedback.message ? (
              <div className={`feedback ${clientFeedback.type === "error" ? "feedback-error" : "feedback-info"}`}>
                {clientFeedback.message}
              </div>
            ) : null}

            <form
              className="candidate-form client-form"
              onSubmit={clientStep === 2 ? submitClient : handleClientNext}
              noValidate
            >
              {clientStep === 1 ? (
                <>
                  <label className="form-field">
                    <span className="field-label">
                      Company Name <span className="required-asterisk">*</span>
                    </span>
                    <input
                      type="text"
                      value={clientForm.companyName}
                      onChange={updateClientField("companyName")}
                      placeholder="Company legal name"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Organisation Type</span>
                    <select
                      className="input custom-select"
                      style={{ height: "42px", appearance: "auto" }}
                      value={clientForm.organisationType}
                      onChange={updateClientField("organisationType")}
                    >
                      <option value="">Select Type...</option>
                      {["Sole Proprietorship", "Partnership Firm", "Limited Liability Partnership (LLP)", "Private Limited Company (Pvt Ltd)", "Public Limited Company", "One Person Company (OPC)", "Cooperative Society"].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Company Email <span className="required-asterisk">*</span>
                    </span>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={updateClientField("email")}
                      placeholder="hr@company.com"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Alternate Email Address</span>
                    <input
                      type="email"
                      value={clientForm.alternateEmail}
                      onChange={updateClientField("alternateEmail")}
                      placeholder="hiring@company.com"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">
                      Phone Number <span className="required-asterisk">*</span>
                    </span>
                    <div className="phone-input-row">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={clientForm.phone}
                        onChange={(event) =>
                          setClientForm((prev) => ({ ...prev, phone: toIndianPhoneDigits(event.target.value) }))
                        }
                        placeholder="9876543210"
                      />
                    </div>
                  </label>

                  <label className="form-field">
                    <span className="field-label">Your Designation</span>
                    <input
                      type="text"
                      value={clientForm.designation}
                      onChange={updateClientField("designation")}
                      placeholder="e.g. Owner, HR, Administrative"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Budget / CTC (optional)</span>
                    <input
                      type="text"
                      value={clientForm.budget}
                      onChange={updateClientField("budget")}
                      placeholder="e.g. 8-10 LPA"
                    />
                  </label>

                  <div className="form-actions">
                    <button type="submit" className="button button-primary" disabled={isClientSubmitting}>
                      {isClientSubmitting ? <LuLoaderCircle className="spin" /> : "Next"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="form-field">
                    <span className="field-label">GST Certificate Upload (optional)</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={(event) => setGstCertificateFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Company Size</span>
                    <select
                      className="input custom-select"
                      style={{ height: "42px", appearance: "auto" }}
                      value={clientForm.companySize}
                      onChange={updateClientField("companySize")}
                    >
                      <option value="">Select Size...</option>
                      {["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => (
                        <option key={size} value={size}>
                          {size} Employees
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="field-label">Interview Location</span>
                    <input
                      type="text"
                      value={clientForm.interviewLocation}
                      onChange={updateClientField("interviewLocation")}
                      placeholder="e.g. Gurgaon, Remote, Hybrid"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Alternate Contact Number</span>
                    <div className="phone-input-row">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={clientForm.alternatePhone}
                        onChange={(event) =>
                          setClientForm((prev) => ({ ...prev, alternatePhone: toIndianPhoneDigits(event.target.value) }))
                        }
                        placeholder="9876543210"
                      />
                    </div>
                  </label>



                  <label className="form-field form-field-full">
                    <span className="field-label">Role Title <span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      value={clientForm.roleTitle}
                      onChange={updateClientField("roleTitle")}
                      placeholder="e.g. Territory Sales Manager"
                      required
                    />
                  </label>

                  <label className="form-field form-field-full">
                    <span className="field-label">
                      Special Notes <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#5f7598' }}>(anything you want to share with us to build a great team)</span>
                    </span>
                    <textarea
                      value={clientForm.specialNotes}
                      onChange={updateClientField("specialNotes")}
                      placeholder="Need White Collar, Manager, VP, Want Bulk Hiring, Fast Hiring..."
                      style={{ minHeight: "100px" }}
                    />
                  </label>

                  <div className="form-actions">
                    <button type="submit" className="button button-primary" disabled={isClientSubmitting}>
                      {isClientSubmitting ? <LuLoaderCircle className="spin" /> : "Connect with Maven"}
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
              Your application has been submitted successfully.
            </p>
            <p className="sub-copy" style={{ marginTop: '8px', fontWeight: '600', color: '#18458a' }}>
              Team will connect soon within 2-3 working days.
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
                Track Your Match
              </button>
              <button type="button" className="button button-secondary" onClick={resetCandidateFlow}>
                Submit Another Candidate
              </button>
            </div>
          </section>
        ) : null}

        {view === "client-thanks" ? (
          <section className="thanks-card">
            <h1 className="headline">THANK YOU{clientCompanyName ? `, ${clientCompanyName}` : ""}</h1>
            <p className="sub-copy">
              Your role posting has been submitted successfully.
            </p>
            {clientReferenceId ? (
              <p className="reference-copy">
                Reference ID: <strong>{clientReferenceId}</strong>
              </p>
            ) : null}
            <div className="thanks-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowDownloadModal(true)}
              >
                Make Your Great Team
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  resetClientDraft();
                  setClientStep(1);
                  setView("client");
                }}
              >
                Refer to another Associated Company or Person
              </button>
              <button type="button" className="button button-secondary" onClick={resetClientFlow}>
                Back to Role Selection
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
              aria-label={downloadModalContent.ariaLabel}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="download-modal-head">
                <img src={logo} alt="Maven Jobs" className="download-modal-logo" />
                <h2>{downloadModalContent.title}</h2>
                <p>{downloadModalContent.description}</p>
              </div>
              <div className="download-modal-actions">
                <a className="button button-primary" href={appDownloadUrl} target="_blank" rel="noreferrer">
                  {downloadModalContent.primaryLabel}
                </a>
                {downloadModalContent.secondaryLabel ? (
                  <button type="button" className="button button-secondary" onClick={() => setShowDownloadModal(false)}>
                    {downloadModalContent.secondaryLabel}
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
