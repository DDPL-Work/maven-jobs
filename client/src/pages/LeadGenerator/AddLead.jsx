import { startTransition, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuLoaderCircle, LuPlus } from "react-icons/lu";
import { toast } from "sonner";
import { createLead, getLeadGeneratorMeta } from "../../services/leadGeneratorApi";

const initialFormState = {
  contactName: "",
  companyName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  businessCategory: "",
  leadSource: "",
  status: "NEW",
  priority: "MEDIUM",
  city: "",
  state: "",
  pincode: "",
  address: "",
  nextFollowUpAt: "",
  notes: "",
};

const Field = ({ label, children, required = false }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </span>
    {children}
  </label>
);

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#103C7F] focus:ring-4 focus:ring-[#103C7F]/10";

export default function AddLead() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const data = await getLeadGeneratorMeta();

        if (!active) {
          return;
        }

        startTransition(() => {
          setMeta(data);
          setFormState((current) => ({
            ...current,
            state: current.state || data.defaultState || "",
            businessCategory: current.businessCategory || data.businessCategories?.[0] || "",
            leadSource: current.leadSource || data.leadSources?.[0] || "",
            status: current.status || data.leadStatuses?.[0] || "NEW",
            priority: current.priority || data.leadPriorities?.[1] || "MEDIUM",
          }));
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load lead form options.");
      } finally {
        if (active) {
          setLoadingMeta(false);
        }
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const lead = await createLead(formState);
      toast.success(`Lead ${lead.leadCode} created successfully.`);
      navigate("/lead-generator/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save lead right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/lead-generator/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#103C7F]"
          >
            <LuArrowLeft />
            Back to Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Add New Lead</h1>
          <p className="mt-2 text-sm text-slate-500">
            Capture lead details once and keep the pipeline ready for follow-up and state review.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Lead records are stored in the shared production backend.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)] md:p-8"
      >
        {loadingMeta ? (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
            <LuLoaderCircle className="animate-spin text-xl" />
            Loading lead form...
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Store the core information the Lead Generator needs first.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Contact Name" required>
                  <input
                    name="contactName"
                    value={formState.contactName}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter contact person name"
                    required
                  />
                </Field>

                <Field label="Company Name" required>
                  <input
                    name="companyName"
                    value={formState.companyName}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter business name"
                    required
                  />
                </Field>

                <Field label="Phone Number" required>
                  <input
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter primary contact number"
                    required
                  />
                </Field>

                <Field label="Alternate Phone">
                  <input
                    name="alternatePhone"
                    value={formState.alternatePhone}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Optional alternate number"
                  />
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter email address"
                  />
                </Field>

                <Field label="Pincode">
                  <input
                    name="pincode"
                    value={formState.pincode}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter pincode"
                  />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Lead Classification</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Business category and source stay aligned with the backend metadata.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Business Category" required>
                  <select
                    name="businessCategory"
                    value={formState.businessCategory}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  >
                    {(meta?.businessCategories || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Lead Source" required>
                  <select
                    name="leadSource"
                    value={formState.leadSource}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  >
                    {(meta?.leadSources || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleChange}
                    className={inputClassName}
                  >
                    {(meta?.leadStatuses || []).map((option) => (
                      <option key={option} value={option}>
                        {option.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    name="priority"
                    value={formState.priority}
                    onChange={handleChange}
                    className={inputClassName}
                  >
                    {(meta?.leadPriorities || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Location & Follow-up</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These details will support State Manager workflows in the next phase.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="City" required>
                  <input
                    name="city"
                    value={formState.city}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter city"
                    required
                  />
                </Field>

                <Field label="State" required>
                  <input
                    name="state"
                    value={formState.state}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Enter state"
                    required
                  />
                </Field>

                <Field label="Next Follow Up">
                  <input
                    type="datetime-local"
                    name="nextFollowUpAt"
                    value={formState.nextFollowUpAt}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Address">
                  <input
                    name="address"
                    value={formState.address}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Street, area, landmark"
                  />
                </Field>
              </div>
            </section>

            <section>
              <Field label="Notes">
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleChange}
                  rows="5"
                  className={`${inputClassName} resize-none`}
                  placeholder="Add conversation notes, requirements, or handover context"
                />
              </Field>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <Link
                to="/lead-generator/dashboard"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#103C7F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d3167] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <LuLoaderCircle className="animate-spin" /> : <LuPlus />}
                {submitting ? "Saving Lead..." : "Save Lead"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
