import { useEffect, useMemo, useState } from "react";
import { fetchCompanyProfile, updateCompanyProfile } from "../api/companyApi";

const defaultForm = {
  email: "",
  currentPassword: "",
  newPassword: "",
  companyEmail: "",
  industry: "",
  phone: "",
  website: "",
  linkedIn: "",
  city: "",
  region: "",
  zone: "",
  address: "",
  pincode: "",
};

export default function Profile({ onSessionRefresh }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchCompanyProfile();
        if (!isMounted) {
          return;
        }

        setProfile(data);
        setForm({
          email: data.user?.email || "",
          currentPassword: "",
          newPassword: "",
          companyEmail: data.company?.email || "",
          industry: data.company?.industry || "",
          phone: data.company?.phone || "",
          website: data.company?.website || "",
          linkedIn: data.company?.linkedIn || "",
          city: data.company?.location?.city || "",
          region: data.company?.location?.region || "",
          zone: data.company?.location?.zone || "",
          address: data.company?.location?.address || "",
          pincode: data.company?.location?.pincode || "",
        });
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || "Unable to load profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const companySummary = useMemo(() => profile?.company || {}, [profile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNote("");

    try {
      const response = await updateCompanyProfile(form);
      setNote(response.message || "Profile updated successfully.");
      const nextProfile = response.data || profile;
      setProfile(nextProfile);

      const rawSession = sessionStorage.getItem("company_panel_session");
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          const nextSession = {
            ...parsed,
            user: {
              ...(parsed.user || {}),
              email: nextProfile?.user?.email || parsed.user?.email || "",
            },
            company: {
              ...(parsed.company || {}),
              ...(nextProfile?.company || {}),
            },
          };
          sessionStorage.setItem("company_panel_session", JSON.stringify(nextSession));
          if (typeof onSessionRefresh === "function") {
            onSessionRefresh();
          }
        } catch {
          // no-op
        }
      }
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="company-panel-card">Loading profile...</div>;
  }

  return (
    <section className="company-panel-card">
      <div className="company-card-head">
        <h2>Profile</h2>
      </div>

      {error ? <div className="status-banner">{error}</div> : null}
      {note ? <div className="status-banner success-banner">{note}</div> : null}

      <div className="company-summary-grid mt-6">
        <article className="company-summary-card">
          <p>Company</p>
          <strong>{companySummary.name || "-"}</strong>
        </article>
        <article className="company-summary-card">
          <p>Package</p>
          <strong>{companySummary.packageType || "-"}</strong>
        </article>
        <article className="company-summary-card">
          <p>Job Limit</p>
          <strong>{Number(companySummary.jobLimit || 0)}</strong>
        </article>
        <article className="company-summary-card">
          <p>Manager</p>
          <strong>{companySummary.accountManager || "Unassigned"}</strong>
        </article>
      </div>

      <form className="company-form-grid" onSubmit={handleSubmit}>
        <div className="form-section-card">
          <h3>Access Credentials</h3>
          <div className="company-form-grid two-col">
            <label className="company-field">
              <span>User Mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>

            <label className="company-field">
              <span>Current Password</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                placeholder="Required only when changing password"
              />
            </label>

            <label className="company-field">
              <span>New Password</span>
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                placeholder="Leave empty to keep current password"
              />
            </label>
          </div>
        </div>

        <div className="form-section-card">
          <h3>Company Information</h3>
          <div className="company-form-grid two-col">
            <label className="company-field">
              <span>Company Email</span>
              <input
                type="email"
                value={form.companyEmail}
                onChange={(event) => setForm((current) => ({ ...current, companyEmail: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Industry</span>
              <input
                value={form.industry}
                onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Website</span>
              <input
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>LinkedIn</span>
              <input
                value={form.linkedIn}
                onChange={(event) => setForm((current) => ({ ...current, linkedIn: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>City</span>
              <input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Region</span>
              <input
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Zone</span>
              <input
                value={form.zone}
                onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
              />
            </label>

            <label className="company-field">
              <span>Pincode</span>
              <input
                value={form.pincode}
                onChange={(event) => setForm((current) => ({ ...current, pincode: event.target.value }))}
              />
            </label>

            <label className="company-field full">
              <span>Address</span>
              <textarea
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                rows={3}
              />
            </label>
          </div>
        </div>

        <div className="company-form-actions">
          <button type="submit" className="company-primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
