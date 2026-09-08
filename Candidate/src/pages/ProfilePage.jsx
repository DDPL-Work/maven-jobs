import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  PageState,
  PanelCard,
  SectionHeading,
  TextAreaField,
  TextField,
  SelectField,
} from "../components/Ui";
import { formatDateTime, titleCase } from "../utils/formatters";
import { getProfile, updateProfile, uploadResume } from "../services/candidateApi";
import { INDIAN_STATES_AND_UT_ARRAY, STATE_WISE_CITIES } from "indian-states-cities-list";

const stateOptions = INDIAN_STATES_AND_UT_ARRAY.map((name) => ({ label: name, value: name })).sort(
  (a, b) => a.label.localeCompare(b.label),
);

const emptyForm = {
  name: "",
  phone: "",
  altPhone: "",
  headline: "",
  summary: "",
  totalExperience: "",
  currentTitle: "",
  currentCompany: "",
  noticePeriod: "",
  currentCity: "",
  currentState: "",
  currentCountry: "",
  preferredLocations: "",
  preferredRoles: "",
  skills: "",
  linkedInUrl: "",
  portfolioUrl: "",
  expectedSalary: "",
};

const phoneRegex = /^\d{10}$/;
const urlRegex = /^(https?:\/\/)?(www\.)?(linkedin\.com|github\.com|.*\.[a-z]{2,})(\/.*)?$/i;
const nameRegex = /^[a-zA-Z\s\-'.]+$/;

function sanitizeInput(value) {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateField(field, value) {
  const trimmed = value.trim();

  switch (field) {
    case "name":
      if (!trimmed) return "";
      if (trimmed.length < 2) return "Name must be at least 2 characters.";
      if (!nameRegex.test(trimmed)) return "Name contains invalid characters.";
      if (/<|>|script/i.test(trimmed)) return "Name contains invalid content.";
      return "";

    case "phone":
    case "altPhone":
      if (!trimmed) return "";
      if (!/^\d{10}$/.test(trimmed)) return "Phone number must be exactly 10 digits.";
      return "";

    case "linkedInUrl":
      if (!trimmed) return "";
      if (!/linkedin\.com/i.test(trimmed)) return "Enter a valid LinkedIn URL.";
      return "";

    case "portfolioUrl":
      if (!trimmed) return "";
      if (!urlRegex.test(trimmed)) return "Enter a valid URL (e.g. https://example.com).";
      return "";

    case "totalExperience":
      if (!trimmed) return "";
      if (/<|>|script/i.test(trimmed)) return "Invalid experience value.";
      return "";

    case "expectedSalary":
      if (!trimmed) return "";
      const salaryNum = Number(trimmed.replace(/[,\s]/g, ""));
      if (isNaN(salaryNum) || salaryNum < 0) return "Enter a valid salary (non-negative number).";
      if (/<|>|script/i.test(trimmed)) return "Invalid salary value.";
      return "";

    case "currentCity":
      if (!trimmed) return "";
      if (/<|>|script/i.test(trimmed)) return "Invalid city value.";
      return "";

    case "headline":
    case "summary":
    case "currentTitle":
    case "currentCompany":
    case "preferredLocations":
    case "preferredRoles":
    case "skills":
      if (/<|>|script/i.test(trimmed)) return "Field contains invalid content.";
      return "";

    default:
      return "";
  }
}

export default function ProfilePage() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    profile: null,
    history: [],
  });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const syncForm = (profile) => {
    setForm({
      name: profile.user.name || "",
      phone: profile.phone || "",
      altPhone: profile.altPhone || "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      totalExperience: profile.totalExperience || "",
      currentTitle: profile.currentTitle || profile.user?.designation || "",
      currentCompany: profile.currentCompany || "",
      noticePeriod: profile.noticePeriod || "",
      currentCity: profile.currentCity || "",
      currentState: profile.currentState || "",
      currentCountry: profile.currentCountry || "",
      preferredLocations: (profile.preferredLocations || []).join(", "),
      preferredRoles: (profile.preferredRoles || []).join(", "),
      skills: (profile.skills || []).join(", "),
      linkedInUrl: profile.linkedInUrl || "",
      portfolioUrl: profile.portfolioUrl || "",
      expectedSalary: profile.expectedSalary || "",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await getProfile();

        if (isMounted) {
          setState({
            loading: false,
            error: "",
            profile: response.data.profile,
            history: response.data.history,
          });
          syncForm(response.data.profile);
        }
      } catch (error) {
        if (isMounted) {
          setState({
            loading: false,
            error: error.message || "Unable to load profile.",
            profile: null,
            history: [],
          });
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const resumeLabel = useMemo(() => {
    if (!state.profile?.resume?.url) {
      return "No resume uploaded yet";
    }

    return `${state.profile.resume.fileName} | ${titleCase(
      state.profile.resume.storageProvider || "cloud storage",
    )}`;
  }, [state.profile]);

  const handleChange = (field) => (event) => {
    const raw = event.target.value;
    const sanitized = sanitizeInput(raw);
    setForm((current) => ({ ...current, [field]: sanitized }));

    const error = validateField(field, sanitized);
    setErrors((current) => {
      const next = { ...current };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handlePhoneChange = (field) => (event) => {
    const raw = event.target.value;
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, [field]: digitsOnly }));

    const error = validateField(field, digitsOnly);
    setErrors((current) => {
      const next = { ...current };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleStateChange = (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, currentState: value, currentCity: "" }));
    setErrors((current) => {
      const next = { ...current };
      delete next.currentState;
      delete next.currentCity;
      return next;
    });
  };

  const cityOptions = useMemo(() => {
    if (!form.currentState) return [];
    const stateKey = form.currentState.replace(/\s+/g, "");
    const cities = STATE_WISE_CITIES[stateKey] || [];
    return cities.map((c) => ({ label: c.value, value: c.value }));
  }, [form.currentState]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const allErrors = {};
    for (const [field, value] of Object.entries(form)) {
      const error = validateField(field, value);
      if (error) allErrors[field] = error;
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setFeedback("Please fix the validation errors before saving.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    setErrors({});

    try {
      const response = await updateProfile(form);
      setState((current) => ({
        ...current,
        profile: response.data,
      }));
      syncForm(response.data);
      setFeedback("Profile updated successfully.");
    } catch (error) {
      setFeedback(error.message || "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Robust PDF parsing for auto-fill
    if (file.type === "application/pdf") {
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + " ";
        }
        // Helper regexes
        const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?(\d{10,12})/);
        const linkedInMatch = text.match(/https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9\-_/]+/);
        // Name: first non-empty line, likely at top
        let name = "";
        const lines = text.split(/\n|\r|\r\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) name = lines[0];
        // Experience: look for years or experience
        let experience = "";
        const expMatch = text.match(/([0-9]+\+?)\s*(years|yrs|year|yr)?\s*(of)?\s*experience/i);
        if (expMatch) experience = expMatch[1] + (expMatch[2] ? " " + expMatch[2] : " years");
        // City: look for 'Current City' or 'Location' or after 'Address'
        let city = "";
        const cityMatch = text.match(/Current City:?\s*([A-Za-z ]+)/i) || text.match(/Location:?\s*([A-Za-z ]+)/i) || text.match(/Address:?\s*([A-Za-z ]+)/i);
        if (cityMatch) city = cityMatch[1].trim();
        // Summary: look for 'Summary' or 'Profile Summary' section
        let summary = "";
        const summaryMatch = text.match(/(Summary|Professional Summary|Profile Summary|About)[\s:]*([\s\S]{0,500})/i);
        if (summaryMatch) summary = summaryMatch[2].split(/\n|\r|\r\n/)[0].trim();
        setForm((current) => ({
          ...current,
          name: sanitizeInput(name) || current.name,
          phone: phoneMatch ? sanitizeInput(phoneMatch[0]).replace(/\D/g, "").slice(0, 10) : current.phone,
          totalExperience: sanitizeInput(experience) || current.totalExperience,
          currentCity: sanitizeInput(city) || current.currentCity,
          linkedInUrl: linkedInMatch ? linkedInMatch[0] : current.linkedInUrl,
          summary: sanitizeInput(summary) || current.summary,
        }));
      };
      reader.readAsArrayBuffer(file);
    }
    setIsUploading(true);
    setFeedback("");

    try {
      const response = await uploadResume(file);
      setState((current) => ({
        ...current,
        profile: response.data,
      }));
      syncForm(response.data);
      setFeedback("Resume uploaded successfully.");
    } catch (error) {
      setFeedback(error.message || "Unable to upload resume.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  if (state.loading) {
    return (
      <PageState
        title="Loading profile"
        description="Fetching your candidate profile, resume status, and edit history."
      />
    );
  }

  if (state.error || !state.profile) {
    return (
      <PageState
        title="Profile unavailable"
        description={state.error || "Unable to load candidate profile."}
        error
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard>
          <SectionHeading
            eyebrow="Candidate Profile"
            title="Maintain your core application profile"
            description="Changes are tracked centrally so Admin and CRM can access the latest approved candidate data when required."
          />

          {feedback ? (
            <div className="mt-5 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm font-medium text-lime-800">
              {feedback}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <TextField label="Full name" value={form.name} onChange={handleChange("name")} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.phone}
                onChange={handlePhoneChange("phone")}
                placeholder="9876543210"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
              />
            </label>
            {errors.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Alternate phone</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.altPhone}
                onChange={handlePhoneChange("altPhone")}
                placeholder="9876543210"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
              />
            </label>
            {errors.altPhone && <p className="text-xs text-rose-600">{errors.altPhone}</p>}
            <TextField label="Headline" value={form.headline} onChange={handleChange("headline")} />
            {errors.headline && <p className="text-xs text-rose-600">{errors.headline}</p>}
            <TextField label="Total experience" value={form.totalExperience} onChange={handleChange("totalExperience")} placeholder="e.g. 3 years" />
            {errors.totalExperience && <p className="text-xs text-rose-600">{errors.totalExperience}</p>}
            <TextField label="Designation" value={form.currentTitle} onChange={handleChange("currentTitle")} />
            {errors.currentTitle && <p className="text-xs text-rose-600">{errors.currentTitle}</p>}
            <TextField label="Current company" value={form.currentCompany} onChange={handleChange("currentCompany")} />
            {errors.currentCompany && <p className="text-xs text-rose-600">{errors.currentCompany}</p>}
            <TextField label="Notice period" value={form.noticePeriod} onChange={handleChange("noticePeriod")} />
            <SelectField
              label="Current city"
              value={form.currentCity}
              onChange={handleChange("currentCity")}
              options={[{ label: form.currentState ? "Select city" : "Select state first", value: "" }, ...cityOptions]}
              disabled={!form.currentState}
            />
            {errors.currentCity && <p className="text-xs text-rose-600">{errors.currentCity}</p>}
            <SelectField
              label="Current state"
              value={form.currentState}
              onChange={handleStateChange}
              options={[{ label: "Select state", value: "" }, ...stateOptions]}
            />
            <TextField label="Current country" value={form.currentCountry} onChange={handleChange("currentCountry")} />
            <TextField
              label="Preferred roles"
              value={form.preferredRoles}
              onChange={handleChange("preferredRoles")}
              placeholder="e.g. Product Manager, UX Designer"
            />
            {errors.preferredRoles && <p className="text-xs text-rose-600">{errors.preferredRoles}</p>}
            <TextField
              label="Preferred locations"
              value={form.preferredLocations}
              onChange={handleChange("preferredLocations")}
              placeholder="e.g. Bengaluru, Remote"
            />
            {errors.preferredLocations && <p className="text-xs text-rose-600">{errors.preferredLocations}</p>}
            <TextField
              label="Skills"
              value={form.skills}
              onChange={handleChange("skills")}
              placeholder="e.g. Figma, React, SQL"
            />
            {errors.skills && <p className="text-xs text-rose-600">{errors.skills}</p>}
            <TextField label="LinkedIn URL" value={form.linkedInUrl} onChange={handleChange("linkedInUrl")} placeholder="https://linkedin.com/in/yourname" />
            {errors.linkedInUrl && <p className="text-xs text-rose-600">{errors.linkedInUrl}</p>}
            <TextField label="Portfolio URL" value={form.portfolioUrl} onChange={handleChange("portfolioUrl")} placeholder="https://yourportfolio.com" />
            {errors.portfolioUrl && <p className="text-xs text-rose-600">{errors.portfolioUrl}</p>}
            <TextField label="Expected salary" value={form.expectedSalary} onChange={handleChange("expectedSalary")} placeholder="e.g. 800000" />
            {errors.expectedSalary && <p className="text-xs text-rose-600">{errors.expectedSalary}</p>}
            <TextAreaField label="Professional summary" value={form.summary} onChange={handleChange("summary")} className="md:col-span-2" />
            {errors.summary && <p className="text-xs text-rose-600 md:col-span-2">{errors.summary}</p>}
            <div className="md:col-span-2">
              <button type="submit" disabled={isSaving} className="rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f7f] disabled:cursor-not-allowed disabled:opacity-70">
                {isSaving ? "Saving..." : "Save profile changes"}
              </button>
            </div>
          </form>
        </PanelCard>

        <div className="space-y-6">
          <PanelCard>
            <SectionHeading
              eyebrow="Resume"
              title="Upload your latest CV"
              description="Only PDF files are supported. Resume storage is handled securely through the configured backend provider."
            />

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Current file</p>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{resumeLabel}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {state.profile.resume.uploadedAt
                  ? `Uploaded on ${formatDateTime(state.profile.resume.uploadedAt)}`
                  : "Upload a resume as PDF to unlock applications."}
              </p>
              <label className="mt-5 inline-flex cursor-pointer items-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-lime-300 hover:bg-lime-50 hover:text-[#163060]">
                {isUploading ? "Uploading..." : "Upload resume"}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
          </PanelCard>

          <PanelCard>
            <SectionHeading
              eyebrow="Edit History"
              title="Tracked profile activity"
              description="Profile and resume changes are stored centrally for governance and reporting."
            />

            <div className="mt-5 space-y-3">
              {state.history.length ? (
                state.history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {titleCase(item.action)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {(item.changedFields || []).length
                        ? item.changedFields.join(", ")
                        : "Initial profile record"}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No profile history yet"
                  description="Profile edits and resume updates will appear here."
                />
              )}
            </div>
          </PanelCard>
        </div>
      </section>
    </div>
  );
}
