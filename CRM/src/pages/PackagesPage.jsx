import { useEffect, useMemo, useState } from "react";
import { LuBadgePercent, LuPencilLine } from "react-icons/lu";
import {
  EmptyState,
  MetricCard,
  ModalShell,
  PageState,
  PanelCard,
  SelectField,
  SectionHeading,
  TextAreaField,
  TextField,
} from "../components/Ui";
import { getPackages, updatePackage } from "../services/crmApi";
import { formatNumber, titleCase } from "../utils/formatters";

export default function PackagesPage() {
  const PACKAGE_ROLLOUT_OPTIONS = [
    {
      label: "Apply for everyone",
      value: "APPLY_FOR_EVERYONE",
    },
    {
      label: "Apply after current limit is exhausted",
      value: "APPLY_AFTER_EXHAUSTION",
    },
  ];

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [jobLimit, setJobLimit] = useState("");
  const [price, setPrice] = useState("");
  const [smbJobPostingLimit, setSmbJobPostingLimit] = useState("");
  const [cvAccessLimit, setCvAccessLimit] = useState("");
  const [nviteLimit, setNviteLimit] = useState("");
  const [description, setDescription] = useState("");
  const [rolloutMode, setRolloutMode] = useState("APPLY_FOR_EVERYONE");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const metrics = useMemo(() => {
    const totalCapacity = packages.reduce(
      (sum, pkg) => sum + Number(pkg.jobLimit || 0),
      0,
    );

    return [
      {
        label: "Package plans",
        value: formatNumber(packages.length),
        detail: "Default CRM job-posting plans offered to client companies.",
        icon: LuBadgePercent,
        tone: "blue",
      },
      {
        label: "Combined limits",
        value: formatNumber(totalCapacity),
        detail: "Editable total posting capacity across all default plan templates.",
        icon: LuBadgePercent,
        tone: "lime",
      },
    ];
  }, [packages]);

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getPackages();
      const order = { STANDARD: 1, PREMIUM: 2, ELITE: 3 };
      const sorted = response.data.sort((a, b) => (order[a.name?.toUpperCase()] || 99) - (order[b.name?.toUpperCase()] || 99));
      setPackages(sorted);
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load package plans.");
    } finally {
      setIsLoading(false);
    }
  }

  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    setJobLimit(String(pkg.jobLimit || pkg.jobPostingLimit || ""));
    setPrice(String(pkg.price || "0"));
    setSmbJobPostingLimit(String(pkg.smbJobPostingLimit || "0"));
    setCvAccessLimit(String(pkg.cvAccessLimit || "0"));
    setNviteLimit(String(pkg.nviteLimit || "0"));
    setDescription(pkg.description || "");
    setRolloutMode("APPLY_FOR_EVERYONE");
    setActionError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");

    try {
      await updatePackage(selectedPackage.name, {
        jobPostingLimit: Number(jobLimit || 0),
        price: Number(price || 0),
        smbJobPostingLimit: Number(smbJobPostingLimit || 0),
        cvAccessLimit: Number(cvAccessLimit || 0),
        nviteLimit: Number(nviteLimit || 0),
        description,
        rolloutMode,
      });
      await loadPackages();
      setIsModalOpen(false);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update package.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageState title="Loading package controls..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PanelCard>
        <SectionHeading
          eyebrow="Package management"
          title="Define and edit job-posting packages"
          description="CRM controls Standard, Premium, and Elite plans, including editable posting limits and positioning notes for each package."
        />

        {actionError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {packages.length ? (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-lime-300 hover:bg-lime-50/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {titleCase(pkg.name)}
                    </p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                      ₹{formatNumber(pkg.price || 0)}
                    </p>
                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
                      <p><strong>{pkg.jobLimit || pkg.jobPostingLimit || 0}</strong> Max Job Postings</p>
                      <p><strong>{pkg.smbJobPostingLimit || 0}</strong> SMB Job Postings</p>
                      <p><strong>{pkg.cvAccessLimit || 0}</strong> CV Access</p>
                      <p><strong>{pkg.nviteLimit || 0}</strong> Send MIvites</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
                  >
                    <LuPencilLine size={18} />
                  </button>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  {pkg.description}
                </p>
              </div>
            ))
          ) : (
            <div className="lg:col-span-3">
              <EmptyState
                title="No package plans found"
                description="CRM package definitions will appear here once the backend provisions them."
              />
            </div>
          )}
        </div>
      </PanelCard>

      <ModalShell
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPackage ? `Edit ${titleCase(selectedPackage.name)} package` : "Edit package"}
        description="Adjust default posting limits and choose how this package change should roll out across existing client accounts."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Price (₹)"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
            <TextField
              label="Max Job Posting"
              type="number"
              value={jobLimit}
              onChange={(event) => setJobLimit(event.target.value)}
              required
            />
            <TextField
              label="SMB Job Posting"
              type="number"
              value={smbJobPostingLimit}
              onChange={(event) => setSmbJobPostingLimit(event.target.value)}
              required
            />
            <TextField
              label="Max CV Access"
              type="number"
              value={cvAccessLimit}
              onChange={(event) => setCvAccessLimit(event.target.value)}
              required
            />
            <TextField
              label="Max Send MIvites"
              type="number"
              value={nviteLimit}
              onChange={(event) => setNviteLimit(event.target.value)}
              required
            />
          </div>
          <TextAreaField
            label="Package description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
          <SelectField
            label="Rollout mode"
            value={rolloutMode}
            onChange={(event) => setRolloutMode(event.target.value)}
            options={PACKAGE_ROLLOUT_OPTIONS}
            required
          />
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {rolloutMode === "APPLY_FOR_EVERYONE"
              ? "Apply for everyone: all existing clients on this package move to the updated job-posting limit immediately."
              : "Apply after current limit is exhausted: existing clients keep their current limit until they fully consume it; then the new limit applies automatically."}
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Update package"}
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
