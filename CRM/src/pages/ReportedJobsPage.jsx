import { useEffect, useMemo, useState } from "react";
import {
  LuBan,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuCalendar,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuEye,
  LuMail,
  LuPhone,
  LuRefreshCw,
  LuSearch,
  LuShieldAlert,
  LuTriangleAlert,
  LuUser,
} from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  ModalShell,
  PageState,
  PanelCard,
  SectionHeading,
  SelectField,
  TextAreaField,
  ToolbarInput,
} from "../components/Ui";
import {
  getReportedJobs,
  updateReportedJob,
} from "../services/crmApi";
import { formatDateTime, formatNumber, titleCase } from "../utils/formatters";

const STATUS_TONES = {
  PENDING: "amber",
  UNDER_REVIEW: "blue",
  RESOLVED: "emerald",
  DISMISSED: "slate",
};

const ACTION_LABELS = {
  NO_ACTION: "No Action Needed",
  JOB_REMOVED: "Job Removed / Deactivated",
  COMPANY_WARNED: "Company Warned",
  FALSE_REPORT: "False / Invalid Report",
  OTHER: "Other Resolution",
};

export default function ReportedJobsPage() {
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, underReview: 0, resolved: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal form states
  const [reviewStatus, setReviewStatus] = useState("UNDER_REVIEW");
  const [reviewAction, setReviewAction] = useState("NO_ACTION");
  const [reviewNotes, setReviewNotes] = useState("");

  const loadData = async (status = statusFilter, search = searchQuery) => {
    setIsLoading(true);
    setPageError("");
    try {
      const res = await getReportedJobs({
        status: status !== "ALL" ? status : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });

      if (res.success) {
        setReports(res.data || []);
        if (res.counts) {
          setCounts(res.counts);
        }
      } else {
        setPageError(res.message || "Failed to load reported jobs.");
      }
    } catch (err) {
      setPageError(err.message || "Unable to connect to reports service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter, searchQuery);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadData(statusFilter, searchQuery);
  };

  const openReviewModal = (report) => {
    setSelectedReport(report);
    setReviewStatus(report.status || "UNDER_REVIEW");
    setReviewAction(report.actionTaken || "NO_ACTION");
    setReviewNotes(report.crmNotes || "");
    setActionError("");
    setActionSuccess("");
    setIsModalOpen(true);
  };

  const handleSaveResolution = async (overrideStatus, overrideAction) => {
    if (!selectedReport) return;
    setIsSaving(true);
    setActionError("");
    setActionSuccess("");

    const targetStatus = overrideStatus || reviewStatus;
    const targetAction = overrideAction || reviewAction;

    try {
      const res = await updateReportedJob(selectedReport._id, {
        status: targetStatus,
        actionTaken: targetAction,
        crmNotes: reviewNotes,
      });

      if (res.success) {
        setActionSuccess("Report updated successfully.");
        // Refresh local list
        setReports((prev) =>
          prev.map((r) => (r._id === selectedReport._id ? res.data : r))
        );
        setSelectedReport(res.data);
        setTimeout(() => {
          setIsModalOpen(false);
          loadData();
        }, 1200);
      } else {
        setActionError(res.message || "Failed to update report.");
      }
    } catch (err) {
      setActionError(err.message || "Error updating report.");
    } finally {
      setIsSaving(false);
    }
  };

  const metricCards = useMemo(() => {
    return [
      {
        label: "Total reports",
        value: formatNumber(counts.total || reports.length),
        icon: LuShieldAlert,
        tone: "blue",
      },
      {
        label: "Pending review",
        value: formatNumber(counts.pending || 0),
        icon: LuClock,
        tone: "amber",
      },
      {
        label: "Under review",
        value: formatNumber(counts.underReview || 0),
        icon: LuTriangleAlert,
        tone: "blue",
      },
      {
        label: "Resolved / Dismissed",
        value: formatNumber(counts.resolved || 0),
        icon: LuCircleCheck,
        tone: "emerald",
      },
    ];
  }, [counts, reports]);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) => {
      return (
        (r.jobTitle && r.jobTitle.toLowerCase().includes(q)) ||
        (r.companyName && r.companyName.toLowerCase().includes(q)) ||
        (r.reportId && r.reportId.toLowerCase().includes(q)) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(q)) ||
        (r.reporterEmail && r.reporterEmail.toLowerCase().includes(q)) ||
        (r.reasonLabel && r.reasonLabel.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    });
  }, [reports, searchQuery]);

  if (isLoading && reports.length === 0) {
    return <PageState title="Loading reported jobs..." />;
  }

  if (pageError && reports.length === 0) {
    return (
      <PageState
        title="Unable to load reported jobs"
        description={pageError}
        error
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Top Metric Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {/* Main Content Panel */}
      <PanelCard>
        <SectionHeading
          eyebrow="Compliance & Safety"
          title="Candidate Reported Jobs"
          description="Investigate and manage job posts reported by candidates for companies assigned to your CRM portfolio."
          action={
            <button
              onClick={() => loadData(statusFilter, searchQuery)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-lime-300 hover:bg-lime-50 disabled:opacity-50"
            >
              <LuRefreshCw className={isLoading ? "animate-spin" : ""} size={16} />
              Refresh
            </button>
          }
        />

        {/* Search and Filters */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={handleSearchSubmit}>
            <ToolbarInput
              icon={LuSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by report ID, job title, company, or reporter details..."
            />
          </form>
          <SelectField
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Pending Review", value: "PENDING" },
              { label: "Under Review", value: "UNDER_REVIEW" },
              { label: "Resolved", value: "RESOLVED" },
              { label: "Dismissed", value: "DISMISSED" },
            ]}
          />
        </div>

        {/* Row count summary badge */}
        <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredReports.length}</strong> of{" "}
            <strong className="text-slate-800">{reports.length}</strong> reports loaded
          </span>
          {statusFilter !== "ALL" && (
            <span className="text-lime-700">Filter applied: {titleCase(statusFilter)}</span>
          )}
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_130px_1.4fr_1.1fr_1.1fr_1fr_100px_90px] items-center gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>S.No</span>
            <span>Report ID</span>
            <span>Job Title</span>
            <span>Company</span>
            <span>Reason</span>
            <span>Reporter</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          {/* Table Rows */}
          {filteredReports.length ? (
            filteredReports.map((report, idx) => (
              <div
                key={report._id}
                className="grid grid-cols-[60px_130px_1.4fr_1.1fr_1.1fr_1fr_100px_90px] items-center gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 transition hover:bg-lime-50/25"
              >
                {/* S.No */}
                <div className="font-semibold text-slate-400">#{idx + 1}</div>

                {/* Report ID & Date */}
                <div>
                  <p className="font-bold text-slate-900">{report.reportId}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateTime(report.createdAt)}
                  </p>
                </div>

                {/* Job Title */}
                <div>
                  <p className="font-semibold text-slate-900">{report.jobTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {report.jobId?.location || "India"} &bull;{" "}
                    {report.jobId?.isActive ? (
                      <span className="text-emerald-600 font-medium">Active</span>
                    ) : (
                      <span className="text-rose-600 font-medium">Inactive/Removed</span>
                    )}
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <p className="font-semibold text-slate-800">{report.companyName}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Assigned CRM: {report.assignedCrmName || report.assignedCrmEmail || "Assigned CRM"}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <span className="inline-block rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">
                    {report.reasonLabel || report.reason}
                  </span>
                  {report.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500 italic">
                      "{report.description}"
                    </p>
                  )}
                </div>

                {/* Reporter */}
                <div>
                  <p className="font-medium text-slate-900">
                    {report.reporterName || "Anonymous Candidate"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[140px]">
                    {report.reporterEmail || "Confidential"}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Badge tone={STATUS_TONES[report.status] || "slate"}>
                    {titleCase(report.status)}
                  </Badge>
                </div>

                {/* Action Button */}
                <div className="text-right">
                  <button
                    onClick={() => openReviewModal(report)}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    <LuEye size={13} />
                    Review
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No reported jobs found"
              description={
                searchQuery || statusFilter !== "ALL"
                  ? "No reports match your current filter or search criteria."
                  : "All clear! There are no candidate-reported jobs for your assigned companies."
              }
            />
          )}
        </div>
      </PanelCard>

      {/* Review & Resolution Modal */}
      {selectedReport && (
        <ModalShell
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Review Job Report: ${selectedReport.reportId}`}
          description={`Report filed on ${formatDateTime(selectedReport.createdAt)}`}
          width="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Feedback Banners */}
            {actionError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {actionSuccess}
              </div>
            )}

            {/* Section 1: Job & Company Details */}
            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Reported Job
                </p>
                <p className="mt-1 font-bold text-slate-900 text-base">
                  {selectedReport.jobTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Status:{" "}
                  {selectedReport.jobId?.isActive ? (
                    <span className="font-semibold text-emerald-600">Active Listing</span>
                  ) : (
                    <span className="font-semibold text-rose-600">Deactivated / Off Market</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Company
                </p>
                <p className="mt-1 font-bold text-slate-900 text-base">
                  {selectedReport.companyName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Assigned CRM:{" "}
                  <strong className="text-slate-700">
                    {selectedReport.assignedCrmName || selectedReport.assignedCrmEmail || "Portfolio CRM"}
                  </strong>
                </p>
              </div>
            </div>

            {/* Section 2: Report Breakdown */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <div className="flex items-center gap-2">
                <LuTriangleAlert className="text-rose-600" size={18} />
                <h4 className="font-bold text-rose-900">
                  Allegation: {selectedReport.reasonLabel || selectedReport.reason}
                </h4>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-rose-800">Candidate Comments:</p>
                <p className="mt-1 rounded-xl bg-white p-3 text-sm text-slate-800 shadow-sm border border-rose-100 leading-relaxed">
                  {selectedReport.description || "No written explanation provided."}
                </p>
              </div>

              {/* Reporter Contact */}
              <div className="mt-4 flex flex-wrap gap-4 border-t border-rose-100 pt-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <LuUser size={13} className="text-slate-400" />
                  Reporter: <strong>{selectedReport.reporterName || "Candidate"}</strong>
                </span>
                {selectedReport.reporterEmail && (
                  <span className="flex items-center gap-1">
                    <LuMail size={13} className="text-slate-400" />
                    <a
                      href={`mailto:${selectedReport.reporterEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedReport.reporterEmail}
                    </a>
                  </span>
                )}
                {selectedReport.reporterPhone && (
                  <span className="flex items-center gap-1">
                    <LuPhone size={13} className="text-slate-400" />
                    <span>{selectedReport.reporterPhone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: CRM Investigation & Actions */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h4 className="font-bold text-slate-900 text-base">CRM Resolution & Action</h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Review Status"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  options={[
                    { label: "Pending", value: "PENDING" },
                    { label: "Under Review", value: "UNDER_REVIEW" },
                    { label: "Resolved", value: "RESOLVED" },
                    { label: "Dismissed", value: "DISMISSED" },
                  ]}
                />

                <SelectField
                  label="Action Taken"
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  options={[
                    { label: "No Action Needed", value: "NO_ACTION" },
                    { label: "Deactivate / Remove Job", value: "JOB_REMOVED" },
                    { label: "Warned Company", value: "COMPANY_WARNED" },
                    { label: "False / Malicious Report", value: "FALSE_REPORT" },
                    { label: "Other Resolution", value: "OTHER" },
                  ]}
                />
              </div>

              <TextAreaField
                label="CRM Investigation Notes"
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document your findings, communications with the company, or verification notes..."
              />

              {/* Quick Action Shortcut Buttons */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveResolution("RESOLVED", "JOB_REMOVED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <LuBan size={14} />
                    Deactivate Job & Resolve
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveResolution("RESOLVED", "COMPANY_WARNED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    <LuTriangleAlert size={14} />
                    Warn Company & Resolve
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveResolution("DISMISSED", "FALSE_REPORT")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                  >
                    <LuCircleX size={14} />
                    Dismiss as False Report
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveResolution()}
                  className="rounded-2xl bg-[#163060] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20498f] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
