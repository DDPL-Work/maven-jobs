import { useEffect, useState } from "react";
import {
  LuBuilding2,
  LuCalendarDays,
  LuChartNoAxesCombined,
  LuFileText,
  LuGlobe,
  LuLoaderCircle,
  LuMail,
  LuMapPin,
  LuPhone,
  LuPlus,
  LuTag,
  LuTrash2,
  LuUserRound,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { updateFseLead, fetchFseMeta } from "../api/fseApi";
import {
  DEFAULT_BUSINESS_CATEGORY_OPTIONS,
  DEFAULT_LEAD_SOURCE_OPTIONS,
  PROJECTION_OPTIONS,
  STATE_OPTIONS,
  EMPLOYEE_COUNT_OPTIONS,
} from "../pages/AddLead";

const createEmptyContact = () => ({
  fullName: "",
  phone: "",
  email: "",
  designation: "",
});

function Field({ label, children }) {
  return (
    <label className="form-field">
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

export default function EditLeadModal({ lead, onClose, onSave }) {
  const [meta, setMeta] = useState({
    businessCategories: DEFAULT_BUSINESS_CATEGORY_OPTIONS,
    leadSources: DEFAULT_LEAD_SOURCE_OPTIONS,
  });
  const [form, setForm] = useState({
    companyName: lead?.companyName || "",
    businessCategory: lead?.businessCategory || "",
    leadSource: lead?.leadSource || "",
    address: lead?.address || "",
    state: lead?.state || "",
    employeeCount: lead?.employeeCount || "",
    reference: lead?.reference || "",
    sourcingDate: lead?.sourcingDate ? new Date(lead.sourcingDate).toISOString().split("T")[0] : "",
    projection: lead?.projection || "",
    clientType: lead?.clientType || "Standard",
    status: lead?.status || "ASSIGNED",
    notes: lead?.notes || "",
    nextFollowUpAt: lead?.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().split("T")[0] : "",
    contacts: Array.isArray(lead?.contacts) && lead.contacts.length 
      ? lead.contacts.map(c => ({ ...c })) 
      : [{ fullName: lead?.contactName || "", phone: lead?.phone || "", email: lead?.email || "", designation: lead?.designation || "" }],
  });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const data = await fetchFseMeta();
        if (mounted) {
          setMeta({
            businessCategories: data?.businessCategories?.length
              ? data.businessCategories
              : DEFAULT_BUSINESS_CATEGORY_OPTIONS,
            leadSources: data?.leadSources?.length ? data.leadSources : DEFAULT_LEAD_SOURCE_OPTIONS,
          });
        }
      } catch {
        if (mounted) {
          setMeta({
            businessCategories: DEFAULT_BUSINESS_CATEGORY_OPTIONS,
            leadSources: DEFAULT_LEAD_SOURCE_OPTIONS,
          });
        }
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => { mounted = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleContactChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const handleAddContact = () => {
    setForm((prev) => ({ ...prev, contacts: [...prev.contacts, createEmptyContact()] }));
  };

  const handleRemoveContact = (index) => {
    setForm((prev) => {
      if (prev.contacts.length === 1) return prev;
      return { ...prev, contacts: prev.contacts.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const sanitizedContacts = form.contacts.map((c) => ({
      fullName: c.fullName.trim(),
      phone: c.phone.trim(),
      email: c.email.trim().toLowerCase(),
      designation: c.designation?.trim() || "",
    }));

    if (!sanitizedContacts.length) {
      setError("Add at least one contact person.");
      return;
    }

    // Basic validation
    for (const [idx, contact] of sanitizedContacts.entries()) {
      const num = idx + 1;
      if (!contact.fullName) {
        setError(`Contact ${num}: full name is required.`);
        return;
      }
      if (contact.phone.replace(/\D/g, "").length < 10) {
        setError(`Contact ${num}: phone number must contain at least 10 digits.`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        contacts: sanitizedContacts.map((c, i) => ({ ...c, isPrimary: i === 0 })),
        companyName: form.companyName.trim(),
        address: form.address.trim(),
        reference: form.reference.trim(),
        notes: form.notes.trim(),
      };
      await updateFseLead(lead.id, payload);
      onSave();
      onClose();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update lead.");
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fse-modal-large" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-info">
            <div className="header-icon-circle"><LuBuilding2 /></div>
            <div>
              <h2>Edit Lead Details</h2>
              <p>Update the information for {lead.companyName}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><LuX /></button>
        </header>

        <form className="modal-body add-lead-form" onSubmit={handleSubmit}>
          {loadingMeta ? (
            <div className="loading-block">
              <LuLoaderCircle className="spin" />
              Loading form data…
            </div>
          ) : (
            <>
              {error ? <div className="status-banner">{error}</div> : null}

              {/* Company Information */}
              <section className="lead-block">
                <div className="lead-block-header">
                  <span className="lead-block-icon"><LuBuilding2 /></span>
                  <h2>Company Information</h2>
                </div>
                <div className="lead-block-grid two-col">
                  <Field label="Company Name">
                    <input
                      className="input add-lead-input"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="Company Name"
                      required
                    />
                  </Field>
                  <Field label="Business Category">
                    <select
                      className="input add-lead-input add-lead-select"
                      name="businessCategory"
                      value={form.businessCategory}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Category…</option>
                      {meta.businessCategories.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="State">
                    <div className="input-shell input-shell-left">
                      <LuGlobe className="input-icon" />
                      <select
                        className="input add-lead-input add-lead-select"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>Select State…</option>
                        {STATE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Employee Count">
                    <div className="input-shell input-shell-left">
                      <LuUsers className="input-icon" />
                      <select
                        className="input add-lead-input add-lead-select"
                        name="employeeCount"
                        value={form.employeeCount}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>Employee Count…</option>
                        {EMPLOYEE_COUNT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
                <div className="lead-block-grid one-col" style={{ marginTop: "12px" }}>
                  <Field label="Location / Address">
                    <div className="input-shell input-shell-left">
                      <LuMapPin className="input-icon" />
                      <input
                        className="input add-lead-input"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Location / Address"
                        required
                      />
                    </div>
                  </Field>
                </div>
              </section>

              {/* Contact Persons */}
              <section className="lead-block">
                <div className="lead-block-header contact-block-header">
                  <div className="lead-block-title">
                    <span className="lead-block-icon"><LuUserRound /></span>
                    <h2>Contact Person(s)</h2>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary add-contact-button"
                    onClick={handleAddContact}
                  >
                    <LuPlus /> Add Contact
                  </button>
                </div>
                <div className="contact-list">
                  {form.contacts.map((contact, index) => (
                    <article className="contact-card" key={`contact-${index}`}>
                      <div className="contact-card-header">
                        <h3>{index === 0 ? "Primary Contact" : `Contact ${index + 1}`}</h3>
                        {form.contacts.length > 1 ? (
                          <button
                            type="button"
                            className="contact-remove-button"
                            onClick={() => handleRemoveContact(index)}
                          >
                            <LuTrash2 /> Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="lead-block-grid two-col contact-grid">
                        <Field label="Full Name">
                          <input
                            className="input add-lead-input"
                            value={contact.fullName}
                            onChange={(e) => handleContactChange(index, "fullName", e.target.value)}
                            placeholder="Full Name"
                            required
                          />
                        </Field>
                        <Field label="Phone Number">
                          <div className="input-shell input-shell-left">
                            <LuPhone className="input-icon" />
                            <input
                              className="input add-lead-input"
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                              placeholder="Phone Number"
                              required
                            />
                          </div>
                        </Field>
                      </div>
                      <div className="lead-block-grid two-col contact-grid" style={{ marginTop: "10px" }}>
                        <Field label="Email Address">
                          <div className="input-shell input-shell-left">
                            <LuMail className="input-icon" />
                            <input
                              className="input add-lead-input"
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, "email", e.target.value)}
                              placeholder="Email Address"
                            />
                          </div>
                        </Field>
                        <Field label="Designation">
                          <input
                            className="input add-lead-input"
                            value={contact.designation || ""}
                            onChange={(e) => handleContactChange(index, "designation", e.target.value)}
                            placeholder="Designation"
                          />
                        </Field>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Lead Source */}
              <section className="lead-block">
                <div className="lead-block-header">
                  <span className="lead-block-icon"><LuFileText /></span>
                  <h2>Lead Source & Projection</h2>
                </div>
                <div className="lead-block-grid two-col lead-source-grid">
                  <Field label="Source">
                    <select
                      className="input add-lead-input add-lead-select"
                      name="leadSource"
                      value={form.leadSource}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Source…</option>
                      {meta.leadSources.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Reference">
                    <div className="input-shell input-shell-left">
                      <LuTag className="input-icon" />
                      <input
                        className="input add-lead-input"
                        name="reference"
                        value={form.reference}
                        onChange={handleChange}
                        placeholder="Reference"
                      />
                    </div>
                  </Field>
                </div>
                <div className="lead-block-grid two-col lead-source-grid" style={{ marginTop: "12px" }}>
                  <Field label="Sourcing Date">
                    <div className="input-shell input-shell-left">
                      <LuCalendarDays className="input-icon" />
                      <input
                        type="date"
                        className="input add-lead-input"
                        name="sourcingDate"
                        value={form.sourcingDate}
                        onChange={handleChange}
                      />
                    </div>
                  </Field>
                  <Field label="Client Type">
                    <div className="input-shell input-shell-left">
                      <LuTag className="input-icon" />
                      <select
                        className="input add-lead-input add-lead-select"
                        name="clientType"
                        value={form.clientType}
                        onChange={handleChange}
                        required
                      >
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Lead Status">
                    <div className="input-shell input-shell-left">
                      <LuTag className="input-icon" />
                      <select
                        className="input add-lead-input add-lead-select"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        required
                      >
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="FOLLOW_UP">FOLLOW_UP</option>
                        <option value="CONVERTED">CONVERTED (Customer)</option>
                        <option value="LOST">LOST</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </Field>
                </div>
                <div className="lead-block-grid one-col" style={{ marginTop: "12px" }}>
                  <div className="fse-projection-block">
                    <div className="fse-projection-header">
                      <LuChartNoAxesCombined />
                      <span>Projection</span>
                    </div>
                    <div className="fse-projection-options">
                      {PROJECTION_OPTIONS.map((opt) => (
                        <label key={opt} className={`fse-projection-chip${form.projection === opt ? " selected" : ""}`}>
                          <input
                            type="radio"
                            name="projection"
                            value={opt}
                            checked={form.projection === opt}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section className="lead-block">
                <div className="lead-block-header">
                  <span className="lead-block-icon"><LuCalendarDays /></span>
                  <h2>Notes & Follow-up</h2>
                </div>
                <div className="lead-block-grid one-col">
                  <Field label="Notes">
                    <textarea
                      className="input add-lead-input textarea"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Notes…"
                      rows={3}
                    />
                  </Field>
                  <Field label="Next Follow-up">
                    <div className="input-shell input-shell-left">
                      <LuCalendarDays className="input-icon" />
                      <input
                        type="date"
                        className="input add-lead-input"
                        name="nextFollowUpAt"
                        value={form.nextFollowUpAt}
                        onChange={handleChange}
                      />
                    </div>
                  </Field>
                </div>
              </section>
            </>
          )}
        </form>

        <footer className="modal-footer">
          <button className="secondary-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="button button-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <LuLoaderCircle className="spin" /> : null}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
