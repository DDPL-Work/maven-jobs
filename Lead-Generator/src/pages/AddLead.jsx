import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuBuilding2,
  LuFileText,
  LuLoaderCircle,
  LuMail,
  LuMapPin,
  LuPhone,
  LuPlus,
  LuTrash2,
  LuUserRound,
} from "react-icons/lu";
import { toast } from "sonner";
import { createLead, fetchLeadMeta } from "../api/leadApi";

const BUSINESS_CATEGORY_OPTIONS = [
  "IT & Technology",
  "Manufacturing",
  "Retail",
  "Healthcare",
  "Logistics",
  "Finance",
];

const LEAD_SOURCE_OPTIONS = [
  "Cold Call",
  "Referral",
  "Field Visit",
  "Social Media",
  "Inbound Inquiry",
];

const createEmptyContact = () => ({
  fullName: "",
  phone: "",
  email: "",
  designation: "",
});

const initialForm = {
  companyName: "",
  contacts: [createEmptyContact()],
  businessCategory: "",
  leadSource: "",
  address: "",
  sourcingDate: "",
  isStartup: false,
  masterUnion: "No",
  isOtherSource: false,
  subStatus: "",
  franchiseStatus: "",
  employeeCount: "",
  nextFollowUpAt: "",
};

function Field({ label, children }) {
  return (
    <label className="form-field">
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

export default function AddLead() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({
    businessCategories: BUSINESS_CATEGORY_OPTIONS,
    leadSources: LEAD_SOURCE_OPTIONS,
  });
  const [form, setForm] = useState(initialForm);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const data = await fetchLeadMeta();
        if (mounted) {
          setMeta({
            ...data,
            businessCategories: BUSINESS_CATEGORY_OPTIONS,
            leadSources: data?.leadSources?.length ? data.leadSources : LEAD_SOURCE_OPTIONS,
          });
          setForm((current) => ({ ...current, businessCategory: "", leadSource: "" }));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load form options.");
        if (mounted) {
          setMeta({
            businessCategories: BUSINESS_CATEGORY_OPTIONS,
            leadSources: LEAD_SOURCE_OPTIONS,
          });
        }
      } finally {
        if (mounted) {
          setLoadingMeta(false);
        }
      }
    };

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContactChange = (index, field, value) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    }));
  };

  const handleAddContact = () => {
    setForm((current) => ({
      ...current,
      contacts: [...current.contacts, createEmptyContact()],
    }));
  };

  const handleRemoveContact = (index) => {
    setForm((current) => {
      if (current.contacts.length === 1) {
        return current;
      }

      return {
        ...current,
        contacts: current.contacts.filter((_, contactIndex) => contactIndex !== index),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const sanitizedContacts = form.contacts.map((contact) => ({
      fullName: contact.fullName.trim(),
      phone: contact.phone.trim(),
      email: contact.email.trim().toLowerCase(),
      designation: contact.designation?.trim() || "",
    }));

    if (!sanitizedContacts.length) {
      toast.error("Add at least one contact person.");
      return;
    }

    const uniquePhones = new Set();
    const uniqueEmails = new Set();

    for (const [index, contact] of sanitizedContacts.entries()) {
      const contactNumber = index + 1;

      if (!contact.fullName) {
        toast.error(`Contact ${contactNumber}: full name is required.`);
        return;
      }

      const normalizedPhone = contact.phone.replace(/\D/g, "");
      if (normalizedPhone.length < 10) {
        toast.error(`Contact ${contactNumber}: phone number must contain at least 10 digits.`);
        return;
      }

      if (uniquePhones.has(normalizedPhone)) {
        toast.error(`Contact ${contactNumber}: this phone number is already added.`);
        return;
      }
      uniquePhones.add(normalizedPhone);

      if (contact.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          toast.error(`Contact ${contactNumber}: please enter a valid email address.`);
          return;
        }

        if (uniqueEmails.has(contact.email)) {
          toast.error(`Contact ${contactNumber}: this email is already added.`);
          return;
        }
        uniqueEmails.add(contact.email);
      }
    }

    try {
      setSaving(true);
      const [primaryContact] = sanitizedContacts;
      const payload = {
        contactName: primaryContact.fullName,
        companyName: form.companyName.trim(),
        phone: primaryContact.phone,
        email: primaryContact.email,
        contacts: sanitizedContacts.map((contact, index) => ({
          fullName: contact.fullName,
          phone: contact.phone,
          email: contact.email,
          designation: contact.designation,
          isPrimary: index === 0,
        })),
        businessCategory: form.businessCategory,
        leadSource: form.leadSource,
        address: form.address.trim(),
        sourcingDate: form.sourcingDate || null,
        isStartup: form.isStartup,
        masterUnion: form.isMasterUnion ? "Yes" : "No",
        isOtherSource: form.isOtherSource,
        subStatus: form.subStatus.trim(),
        franchiseStatus: form.franchiseStatus.trim(),
        employeeCount: form.employeeCount.trim(),
        nextFollowUpAt: form.nextFollowUpAt || null,
      };
      const lead = await createLead(payload);
      toast.success(`Lead ${lead.leadCode} saved successfully.`);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-section">
      <section className="add-lead-header">
        <div>
          <h1>Add New Lead Details</h1>
          <p>Please provide accurate information for quick approval.</p>
        </div>
      </section>

      <form className="add-lead-form" onSubmit={handleSubmit}>
        {loadingMeta ? (
          <div className="loading-block">
            <LuLoaderCircle className="spin" />
            Loading lead form...
          </div>
        ) : (
          <>
            <section className="lead-block company-block">
              <div className="lead-block-header">
                <span className="lead-block-icon">
                  <LuBuilding2 />
                </span>
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
                    <option value="" disabled>
                      Select Category...
                    </option>
                    {(meta?.businessCategories || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="lead-block-grid one-col">
                <Field label="Employee Count / Company Size">
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Company Size</span>
                  <input
                    className="input add-lead-input"
                    name="employeeCount"
                    value={form.employeeCount}
                    onChange={handleChange}
                    placeholder="E.g. 10-50, 50-100"
                  />
                </Field>

                <Field label="Is Startup">
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isStartup"
                      checked={form.isStartup}
                      onChange={handleChange}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '15px', color: '#334155' }}>Company is a Startup</span>
                  </div>
                </Field>

                <Field label="Master Union">
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Master Union</span>
                  <select
                    className="input add-lead-input add-lead-select"
                    name="masterUnion"
                    value={form.masterUnion || "No"}
                    onChange={handleChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>

                <Field label="Location or Address">
                  <div className="input-shell">
                    <input
                      className="input add-lead-input"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Location / Address"
                      required
                    />
                    <LuMapPin className="input-icon" />
                  </div>
                </Field>
              </div>
            </section>

            <section className="lead-block">
              <div className="lead-block-header contact-block-header">
                <div className="lead-block-title">
                  <span className="lead-block-icon">
                    <LuUserRound />
                  </span>
                  <h2>Contact Person</h2>
                </div>
                <button
                  type="button"
                  className="button button-secondary add-contact-button"
                  onClick={handleAddContact}
                >
                  <LuPlus />
                  Add Contact
                </button>
              </div>

              <div className="contact-list">
                {form.contacts.map((contact, index) => (
                  <article className="contact-card" key={`contact-${index}`}>
                    <div className="contact-card-header">
                      <h3>Contact {index + 1}</h3>
                      {form.contacts.length > 1 ? (
                        <button
                          type="button"
                          className="contact-remove-button"
                          onClick={() => handleRemoveContact(index)}
                        >
                          <LuTrash2 />
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="lead-block-grid two-col contact-grid">
                      <Field label={`Contact ${index + 1} Full Name`}>
                        <input
                          className="input add-lead-input"
                          value={contact.fullName}
                          onChange={(event) => handleContactChange(index, "fullName", event.target.value)}
                          placeholder="Full Name"
                          required
                        />
                      </Field>

                      <Field label={`Contact ${index + 1} Phone Number`}>
                        <div className="input-shell">
                          <input
                            className="input add-lead-input"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            value={contact.phone}
                            onChange={(event) => handleContactChange(index, "phone", event.target.value)}
                            placeholder="9876543210"
                            required
                          />
                          <LuPhone className="input-icon" />
                        </div>
                      </Field>
                    </div>

                    <div className="lead-block-grid one-col">
                      <Field label={`Contact ${index + 1} Email Address`}>
                        <div className="input-shell">
                          <input
                            className="input add-lead-input"
                            type="email"
                            value={contact.email}
                            onChange={(event) => handleContactChange(index, "email", event.target.value)}
                            placeholder="Email Address"
                          />
                          <LuMail className="input-icon" />
                        </div>
                      </Field>

                      <Field label={`Contact ${index + 1} Designation`}>
                        <div className="input-shell">
                          <input
                            className="input add-lead-input"
                            value={contact.designation || ""}
                            onChange={(event) => handleContactChange(index, "designation", event.target.value)}
                            placeholder="Designation"
                          />
                        </div>
                      </Field>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="lead-block">
              <div className="lead-block-header">
                <span className="lead-block-icon">
                  <LuFileText />
                </span>
                <h2>Lead Source</h2>
              </div>

              <div className="lead-block-grid one-col lead-source-grid">
                <Field label="Source">
                  <select
                    className="input add-lead-input add-lead-select"
                    name="leadSource"
                    value={form.leadSource}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select Source...
                    </option>
                    {(meta?.leadSources || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sourcing Date">
                  <input
                    type="date"
                    className="input add-lead-input"
                    name="sourcingDate"
                    value={form.sourcingDate}
                    onChange={handleChange}
                  />
                </Field>
              </div>
            </section>

            <div className="add-lead-actions">
              <Link to="/" className="cancel-inline">
                Cancel
              </Link>
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? <LuLoaderCircle className="spin" /> : null}
                {saving ? "Submitting..." : "Submit Lead"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
