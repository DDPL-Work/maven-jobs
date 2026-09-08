import { useEffect, useMemo, useState } from "react";
import { LuSettings2, LuUserCog } from "react-icons/lu";
import {
  Badge,
  MetricCard,
  PageState,
  PanelCard,
  SectionHeading,
  SelectField,
  TextField,
} from "../components/Ui";
import { getSettings, updateSettings } from "../services/crmApi";
import { titleCase } from "../utils/formatters";
import { INDIAN_STATES_AND_UT_ARRAY } from "indian-states-cities-list";

const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;
const DEPARTMENT_REGEX = /^[a-zA-Z\s\-&]+$/;
const TERRITORY_REGEX = /^[a-zA-Z\s\-]+$/;

const stateOptions = INDIAN_STATES_AND_UT_ARRAY.map((name) => ({ label: name, value: name })).sort(
  (a, b) => a.label.localeCompare(b.label),
);

const defaultForm = {
  fullName: "",
  phone: "",
  department: "",
  scope: "",
  territory: "",
  state: "",
};

function validateFullName(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (!NAME_REGEX.test(trimmed)) return "Name can only contain letters, spaces, apostrophes, hyphens, and periods.";
  return "";
}

function validatePhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\d{10}$/.test(trimmed)) return "Phone number must be exactly 10 digits.";
  return "";
}

function validateDepartment(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!DEPARTMENT_REGEX.test(trimmed)) return "Department can only contain letters, spaces, hyphens, and ampersands.";
  return "";
}

function validateTerritory(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!TERRITORY_REGEX.test(trimmed)) return "Territory can only contain letters, spaces, and hyphens.";
  return "";
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getSettings();
      setSettings(response.data);
      setFormState({
        fullName: response.data.profile.fullName || "",
        phone: response.data.profile.phone || "",
        department: response.data.profile.department || "",
        scope: response.data.profile.scope || "",
        territory: response.data.profile.territory || "",
        state: response.data.profile.state || "",
      });
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load CRM settings.");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePhoneChange = (event) => {
    const raw = event.target.value;
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    setFormState((current) => ({ ...current, phone: digitsOnly }));
    const error = validatePhone(digitsOnly);
    setFormErrors((current) => {
      const next = { ...current };
      if (error) next.phone = error;
      else delete next.phone;
      return next;
    });
  };

  const handleDepartmentChange = (event) => {
    const raw = event.target.value;
    const filtered = raw.replace(/[^a-zA-Z\s\-&]/g, "");
    setFormState((current) => ({ ...current, department: filtered }));
    const error = validateDepartment(filtered);
    setFormErrors((current) => {
      const next = { ...current };
      if (error) next.department = error;
      else delete next.department;
      return next;
    });
  };

  const handleTerritoryChange = (event) => {
    const raw = event.target.value;
    const filtered = raw.replace(/[^a-zA-Z\s\-]/g, "");
    setFormState((current) => ({ ...current, territory: filtered }));
    const error = validateTerritory(filtered);
    setFormErrors((current) => {
      const next = { ...current };
      if (error) next.territory = error;
      else delete next.territory;
      return next;
    });
  };

  const handleFullNameChange = (event) => {
    const raw = event.target.value;
    setFormState((current) => ({ ...current, fullName: raw }));
    const error = validateFullName(raw);
    setFormErrors((current) => {
      const next = { ...current };
      if (error) next.fullName = error;
      else delete next.fullName;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setSuccessNote("");

    const errors = {};
    const nameError = validateFullName(formState.fullName);
    if (nameError) errors.fullName = nameError;

    const phoneError = validatePhone(formState.phone);
    if (phoneError) errors.phone = phoneError;

    const departmentError = validateDepartment(formState.department);
    if (departmentError) errors.department = departmentError;

    const territoryError = validateTerritory(formState.territory);
    if (territoryError) errors.territory = territoryError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActionError("Please fix the validation errors before saving.");
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      await updateSettings(formState);
      await loadSettings();
      setSuccessNote("CRM profile updated successfully.");
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageState title="Loading settings..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="CRM role"
          value={titleCase(settings.profile.role)}
          detail="Current operational role attached to this CRM account."
          icon={LuUserCog}
          tone="blue"
        />
        <MetricCard
          label="Available channels"
          value={settings.channels.join(" / ")}
          detail="Delivery channels enabled for CRM-driven promotions and alerts."
          icon={LuSettings2}
          tone="lime"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PanelCard>
          <SectionHeading
            eyebrow="CRM profile"
            title="Update operational account settings"
            description="Maintain CRM contact, territory, state, scope, and organizational metadata used by the backend."
          />

          {actionError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </div>
          ) : null}

          {successNote ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successNote}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <TextField
                label="Full name"
                value={formState.fullName}
                onChange={handleFullNameChange}
              />
              {formErrors.fullName && <p className="mt-1 text-xs text-rose-600">{formErrors.fullName}</p>}
            </div>
            <div>
              <TextField
                label="Phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={formState.phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
              />
              {formErrors.phone && <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p>}
            </div>
            <div>
              <TextField
                label="Department"
                value={formState.department}
                onChange={handleDepartmentChange}
                placeholder="e.g. Human Resources, Engineering"
              />
              {formErrors.department && <p className="mt-1 text-xs text-rose-600">{formErrors.department}</p>}
            </div>
            <TextField
              label="Scope"
              value={formState.scope}
              onChange={(event) =>
                setFormState((current) => ({ ...current, scope: event.target.value }))
              }
            />
            <div>
              <TextField
                label="Territory"
                value={formState.territory}
                onChange={handleTerritoryChange}
                placeholder="e.g. North India, South Zone"
              />
              {formErrors.territory && <p className="mt-1 text-xs text-rose-600">{formErrors.territory}</p>}
            </div>
            <SelectField
              label="State"
              value={formState.state}
              onChange={(event) =>
                setFormState((current) => ({ ...current, state: event.target.value }))
              }
              options={[{ label: "Select state", value: "" }, ...stateOptions]}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </form>
        </PanelCard>

        <PanelCard>
          <SectionHeading
            eyebrow="System configuration"
            title="Package and channel snapshot"
            description="Reference the current package templates and enabled outbound channels without leaving the CRM workspace."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {settings.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-lime-300 hover:bg-lime-50/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {titleCase(pkg.name)}
                  </h3>
                  <Badge tone="lime">{pkg.jobLimit} posts</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {pkg.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">Enabled channels</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {settings.channels.map((channel) => (
                <Badge key={channel} tone="blue">
                  {titleCase(channel)}
                </Badge>
              ))}
            </div>
          </div>
        </PanelCard>
      </section>
    </div>
  );
}
