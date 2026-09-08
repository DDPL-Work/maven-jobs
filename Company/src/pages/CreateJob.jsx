import { useState } from "react";
import { LuInfo, LuPlus, LuTrash2 } from "react-icons/lu";
import { createCompanyJob } from "../api/companyApi";

const defaultForm = {
  title: "",
  summary: "",
  department: "",
  jobType: "",
  workplaceType: "",
  location: "",
  experience: "",
  salaryMin: "",
  salaryMax: "",
  skills: [""],
  deadline: "",
  description: "",
};

export default function CreateJob({ onSessionRefresh }) {
  const [form, setForm] = useState({ ...defaultForm, skills: [] });
  const [skillDraft, setSkillDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const handleReset = () => {
    setForm(defaultForm);
    setError("");
    setNote("");
  };

  const handleAddSkillTag = (event) => {
    if (event) event.preventDefault();
    const normalized = skillDraft.trim();
    if (!normalized) return;

    if (form.skills.includes(normalized)) {
      setSkillDraft("");
      return;
    }

    setForm((current) => ({
      ...current,
      skills: [...current.skills, normalized],
    }));
    setSkillDraft("");
  };

  const handleRemoveSkillTag = (skillToRemove) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNote("");

    try {
      const payload = {
        ...form,
        salaryMin: Number(form.salaryMin || 0),
        salaryMax: Number(form.salaryMax || 0),
        skills: form.skills.map((s) => s.trim()).filter(Boolean),
      };

      const response = await createCompanyJob(payload);
      setNote(response.message || "Job request submitted successfully.");
      setForm(defaultForm);
      if (typeof onSessionRefresh === "function") {
        onSessionRefresh();
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="company-panel-card">
      <div className="company-card-head">
        <h2>Create Job</h2>
        <p>
          Jobs within package limit go live instantly. Extra jobs are routed to CRM for approval or rejection.
        </p>
      </div>

      <div className="form-intro-banner">
        <LuInfo size={16} />
        <p>
          Package overflow submissions are sent to CRM as approval requests. You can continue posting without losing
          data.
        </p>
      </div>

      {error ? <div className="status-banner">{error}</div> : null}
      {note ? <div className="status-banner success-banner">{note}</div> : null}

      <form className="company-form-grid two-col" onSubmit={handleSubmit}>
        <label className="company-field">
          <span>Job Title *</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>

        <label className="company-field">
          <span>Department</span>
          <input
            value={form.department}
            onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
          />
        </label>

        <label className="company-field">
          <span>Job Type</span>
          <select
            value={form.jobType}
            onChange={(event) => setForm((current) => ({ ...current, jobType: event.target.value }))}
          >
            <option value="">Select</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </label>

        <label className="company-field">
          <span>Workplace Type</span>
          <select
            value={form.workplaceType}
            onChange={(event) => setForm((current) => ({ ...current, workplaceType: event.target.value }))}
          >
            <option value="">Select</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
        </label>

        <label className="company-field">
          <span>Location</span>
          <input
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
          />
        </label>

        <label className="company-field">
          <span>Experience</span>
          <input
            value={form.experience}
            onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))}
            placeholder="2-4 years"
          />
        </label>

        <label className="company-field">
          <span>Salary Min</span>
          <input
            type="number"
            min="0"
            value={form.salaryMin}
            onChange={(event) => setForm((current) => ({ ...current, salaryMin: event.target.value }))}
          />
        </label>

        <label className="company-field">
          <span>Salary Max</span>
          <input
            type="number"
            min="0"
            value={form.salaryMax}
            onChange={(event) => setForm((current) => ({ ...current, salaryMax: event.target.value }))}
          />
        </label>

        <label className="company-field">
          <span>Deadline</span>
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
          />
        </label>

        <div className="company-field full">
          <span>Required Skills *</span>
          <div className="company-skills-card">
            <div className="company-skill-input-group">
              <input
                value={skillDraft}
                placeholder="e.g. React.js"
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkillTag();
                  }
                }}
              />
              <button type="button" className="company-skill-add-btn" onClick={handleAddSkillTag}>
                <LuPlus size={18} />
                Add
              </button>
            </div>

            <div className="company-skill-tags-list">
              {form.skills.length > 0 ? (
                form.skills.map((skill) => (
                  <span key={skill} className="company-skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="company-tag-remove"
                      onClick={() => handleRemoveSkillTag(skill)}
                    >
                      <LuPlus size={14} style={{ transform: "rotate(45deg)" }} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="company-no-skills">No skills added yet. Professional skills help in matching.</span>
              )}
            </div>
          </div>
        </div>

        <label className="company-field full">
          <span>Job Summary</span>
          <textarea
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            rows={3}
          />
        </label>

        <label className="company-field full">
          <span>Job Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={6}
          />
        </label>

        <div className="company-form-actions full">
          <button type="button" className="company-secondary-btn" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </button>
          <button type="submit" className="company-primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Job"}
          </button>
        </div>
      </form>
    </section>
  );
}
