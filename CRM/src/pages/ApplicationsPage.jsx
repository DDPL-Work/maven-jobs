import { useEffect, useMemo, useState } from "react";
import { LuDownload, LuFileCheck2, LuSearch, LuUsers } from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  ModalShell,
  PageState,
  PanelCard,
  SectionHeading,
  SelectField,
  ToolbarInput,
} from "../components/Ui";
import { downloadResume, getApplications, getCandidateProfile, updateApplicationStatus } from "../services/crmApi";
import { formatDateTime, formatNumber, titleCase } from "../utils/formatters";

const statusOptions = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [liveProfile, setLiveProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const companyOptions = useMemo(() => {
    const names = [...new Set(applications.map((a) => a.companyName).filter(Boolean))].sort();
    return [{ label: "All companies", value: "ALL" }, ...names.map((n) => ({ label: n, value: n }))];
  }, [applications]);

  const dateOptions = [
    { label: "All dates", value: "ALL" },
    { label: "Today", value: "TODAY" },
    { label: "Last 7 days", value: "7D" },
    { label: "Last 30 days", value: "30D" },
    { label: "Last 90 days", value: "90D" },
  ];

  const filteredApplications = useMemo(() => {
    const now = new Date();
    return applications.filter((application) => {
      const haystack = [
        application.candidateName,
        application.candidateEmail,
        application.candidatePhone,
        application.candidateDesignation,
        application.companyName,
        application.jobTitle,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || application.status === statusFilter;
      const matchesCompany =
        companyFilter === "ALL" || application.companyName === companyFilter;

      let matchesDate = true;
      if (dateFilter !== "ALL" && application.appliedAt) {
        const applied = new Date(application.appliedAt);
        const diffMs = now - applied;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (dateFilter === "TODAY") matchesDate = diffDays < 1;
        else if (dateFilter === "7D") matchesDate = diffDays <= 7;
        else if (dateFilter === "30D") matchesDate = diffDays <= 30;
        else if (dateFilter === "90D") matchesDate = diffDays <= 90;
      }

      return matchesSearch && matchesStatus && matchesCompany && matchesDate;
    });
  }, [applications, searchQuery, statusFilter, companyFilter, dateFilter]);

  const metrics = useMemo(() => {
    const inReview = applications.filter((item) =>
      ["SCREENING", "SHORTLISTED", "INTERVIEW"].includes(item.status),
    ).length;
    const offered = applications.filter((item) => item.status === "OFFERED").length;

    return [
      {
        label: "Applications",
        value: formatNumber(applications.length),
        icon: LuFileCheck2,
        tone: "blue",
      },
      {
        label: "In review",
        value: formatNumber(inReview),
        icon: LuUsers,
        tone: "amber",
      },
      {
        label: "Offers issued",
        value: formatNumber(offered),
        icon: LuFileCheck2,
        tone: "lime",
      },
    ];
  }, [applications]);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getApplications();
      setApplications(response.data);
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load applications.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleStatusUpdate = async (applicationId, status) => {
    setUpdatingId(applicationId);
    setActionError("");

    try {
      await updateApplicationStatus(applicationId, { status });
      await loadApplications();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update application status.");
    } finally {
      setUpdatingId("");
    }
  };

  const [isDownloadingCv, setIsDownloadingCv] = useState(false);

  const handleDownloadResume = async () => {
    if (!liveProfile?.resume?.url && !selectedApplication?.resumeUrl) return;

    setIsDownloadingCv(true);
    try {
      const blob = await downloadResume(selectedApplication.candidateId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // To show in browser (inline), we just open it
      window.open(url, "_blank");
      // Clean up the URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Failed to download resume:", err);
      alert("Unable to load resume. Please try again.");
    } finally {
      setIsDownloadingCv(false);
    }
  };

  const openCandidateModal = async (application) => {
    setSelectedApplication(application);
    setLiveProfile(null);

    if (!application.candidateId) return;

    setIsLoadingProfile(true);

    try {
      const response = await getCandidateProfile(application.candidateId);
      setLiveProfile(response.data || null);
    } catch (err) {
      console.error("Failed to fetch live candidate profile:", err);
      // Fall back silently to application-level data if profile fetch fails
      setLiveProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const closeCandidateModal = () => {
    setSelectedApplication(null);
    setLiveProfile(null);
  };

  if (isLoading) {
    return <PageState title="Loading applications..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PanelCard>
        <SectionHeading title="Applications" />

        {actionError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ToolbarInput
            icon={LuSearch}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search candidate or job"
          />
          <SelectField
            label="Company"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            options={companyOptions}
          />
          <SelectField
            label="Date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            options={dateOptions}
          />
          <SelectField
            label="Stage"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: "All stages", value: "ALL" },
              ...statusOptions.map((status) => ({
                label: titleCase(status),
                value: status,
              })),
            ]}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.85fr_0.8fr] gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Candidate</span>
            <span>Opportunity</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Stage control</span>
          </div>
          {filteredApplications.length ? (
            filteredApplications.map((application) => (
              <div
                key={application.id}
                className="grid grid-cols-[1.1fr_1fr_0.8fr_0.85fr_0.8fr] gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 transition hover:bg-lime-50/30"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => openCandidateModal(application)}
                    className="font-semibold text-slate-900 underline-offset-2 transition hover:text-[#163060] hover:underline"
                  >
                    {application.candidateName}
                  </button>
                  <p className="mt-1 text-xs text-slate-500">{application.candidateEmail}</p>
                </div>
                <div>
                  <p>{application.companyName}</p>
                  <p className="mt-1 text-xs text-slate-400">{application.jobTitle}</p>
                </div>
                <div>
                  <Badge tone="blue">{titleCase(application.status)}</Badge>
                </div>
                <div className="text-xs text-slate-500">
                  {formatDateTime(application.updatedAt)}
                </div>
                <div>
                  <select
                    value={application.status}
                    onChange={(event) =>
                      handleStatusUpdate(application.id, event.target.value)
                    }
                    disabled={updatingId === application.id}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                title="No applications match the filters"
                description="Adjust the search or stage filters to widen the application view."
              />
            </div>
          )}
        </div>
      </PanelCard>

      <ModalShell
        open={Boolean(selectedApplication)}
        onClose={closeCandidateModal}
        title={
          liveProfile?.candidateName ||
          selectedApplication?.candidateName ||
          "Candidate Details"
        }
        description=""
      >
        {selectedApplication ? (
          <div className="space-y-5">
            {isLoadingProfile ? (
              <p className="text-xs text-slate-400">Loading latest profile data…</p>
            ) : null}

            {(() => {
              // Merge live profile over cached application data
              const p = liveProfile || {};
              const a = selectedApplication;
              const phone = p.candidatePhone || a.candidatePhone || "";
              const altPhone = p.candidateAltPhone || a.candidateAltPhone || "";
              const designation = p.candidateDesignation || a.candidateDesignation || "";
              const currentCompany = p.candidateCurrentCompany || a.candidateCurrentCompany || "";
              const experience = p.candidateExperience || a.candidateExperience || "";
              const city = p.candidateCity || a.candidateCity || "";
              const state = p.candidateState || a.candidateState || "";
              const country = p.candidateCountry || a.candidateCountry || "";
              const headline = p.candidateHeadline || a.candidateHeadline || "";
              const summary = p.candidateSummary || a.candidateSummary || "";
              const skills = (p.candidateSkills?.length ? p.candidateSkills : a.candidateSkills) || [];
              const resumeUrl = p.resumeUrl || a.resumeUrl || "";
              const resumeFileName = p.resumeFileName || a.resumeFileName || "";
              const resumeUploadedAt = p.resumeUploadedAt || a.resumeUploadedAt || null;
              const location = [city, state, country].filter(Boolean).join(", ");

              return (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {p.candidateEmail || a.candidateEmail || "Unavailable"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Phone
                      </p>
                      <p className={`mt-1 text-sm font-medium ${phone ? "text-slate-700" : "text-amber-500"}`}>
                        {phone || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Alternate phone
                      </p>
                      <p className={`mt-1 text-sm font-medium ${altPhone ? "text-slate-700" : "text-amber-500"}`}>
                        {altPhone || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Designation
                      </p>
                      <p className={`mt-1 text-sm font-medium ${designation ? "text-slate-700" : "text-amber-500"}`}>
                        {designation || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Current company
                      </p>
                      <p className={`mt-1 text-sm font-medium ${currentCompany ? "text-slate-700" : "text-amber-500"}`}>
                        {currentCompany || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Experience
                      </p>
                      <p className={`mt-1 text-sm font-medium ${experience ? "text-slate-700" : "text-amber-500"}`}>
                        {experience || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Location
                      </p>
                      <p className={`mt-1 text-sm font-medium ${location ? "text-slate-700" : "text-amber-500"}`}>
                        {location || "Not filled yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Application status
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {titleCase(a.status)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Job
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {a.jobTitle || "Unavailable"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Company
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {a.companyName || "Unavailable"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Applied at
                      </p>
                      <p className={`mt-1 text-sm font-medium ${a.appliedAt ? "text-slate-700" : "text-amber-500"}`}>
                        {a.appliedAt ? formatDateTime(a.appliedAt) : "Not captured"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Last updated
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDateTime(a.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {headline ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Headline
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{headline}</p>
                    </div>
                  ) : null}

                  {summary ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Profile summary
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
                    </div>
                  ) : null}

                  {skills.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Skills
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!resumeUrl || isDownloadingCv}
                      onClick={handleDownloadResume}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${resumeUrl
                          ? "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                    >
                      <LuDownload size={16} className={isDownloadingCv ? "animate-bounce" : ""} />
                      {isDownloadingCv ? "Loading PDF..." : resumeUrl ? "Download Candidate CV" : "CV not available"}
                    </button>
                    {resumeFileName ? (
                      <p className="text-xs text-slate-500">File: {resumeFileName}</p>
                    ) : null}
                    {resumeUploadedAt ? (
                      <p className="text-xs text-slate-500">
                        Uploaded: {formatDateTime(resumeUploadedAt)}
                      </p>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
