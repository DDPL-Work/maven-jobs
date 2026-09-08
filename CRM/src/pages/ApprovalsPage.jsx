import { useEffect, useMemo, useState } from "react";
import {
  LuCircleX,
  LuClipboardCheck,
  LuRepeat2,
  LuSearch,
  LuShieldCheck,
} from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  ModalShell,
  PageState,
  PanelCard,
  SectionHeading,
  TextAreaField,
  ToolbarInput,
} from "../components/Ui";
import {
  getJobApprovals,
  getPackageChangeRequests,
  updateJobApproval,
  updatePackageChangeRequest,
} from "../services/crmApi";
import { formatDateTime, formatNumber, titleCase } from "../utils/formatters";

export default function ApprovalsPage() {
  const [jobs, setJobs] = useState([]);
  const [packageRequests, setPackageRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedPackageRequest, setSelectedPackageRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [packageRejectionReason, setPackageRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPackageRejectModalOpen, setIsPackageRejectModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) =>
      [job.title, job.companyName, job.department, job.location]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    );
  }, [jobs, searchQuery]);

  const filteredPackageRequests = useMemo(() => {
    return packageRequests.filter((request) =>
      [
        request.companyName,
        request.currentPackageType,
        request.requestedPackageType,
        request.reason,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    );
  }, [packageRequests, searchQuery]);

  const metrics = useMemo(() => {
    const pendingJobs = jobs.filter((job) => job.approvalStatus === "PENDING").length;
    const pendingPackage = packageRequests.filter((request) => request.status === "PENDING").length;

    return [
      {
        label: "Approval queue",
        value: formatNumber(pendingJobs + pendingPackage),
        icon: LuShieldCheck,
        tone: "blue",
      },
      {
        label: "Pending jobs",
        value: formatNumber(pendingJobs),
        icon: LuClipboardCheck,
        tone: "amber",
      },
      {
        label: "Package changes",
        value: formatNumber(pendingPackage),
        icon: LuRepeat2,
        tone: "lime",
      },
    ];
  }, [jobs, packageRequests]);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    setIsLoading(true);
    setPageError("");

    try {
      const [jobResponse, packageResponse] = await Promise.all([
        getJobApprovals(),
        getPackageChangeRequests({ status: "PENDING" }),
      ]);
      setJobs(jobResponse.data || []);
      setPackageRequests(packageResponse.data || []);
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load approval queue.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleApproveJob = async (job) => {
    setActionError("");
    setIsSaving(true);

    try {
      await updateJobApproval(job.id, { decision: "APPROVE" });
      await loadApprovals();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to approve job.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectJob = async (event) => {
    event.preventDefault();
    setActionError("");
    setIsSaving(true);

    try {
      await updateJobApproval(selectedJob.id, {
        decision: "REJECT",
        rejectionReason,
      });
      await loadApprovals();
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setSelectedJob(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to reject job.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePackageRequest = async (request) => {
    setActionError("");
    setIsSaving(true);

    try {
      await updatePackageChangeRequest(request.id, { decision: "APPROVE" });
      await loadApprovals();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to approve package change request.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectPackageRequest = async (event) => {
    event.preventDefault();
    setActionError("");
    setIsSaving(true);

    try {
      await updatePackageChangeRequest(selectedPackageRequest.id, {
        decision: "REJECT",
        decisionNote: packageRejectionReason,
      });
      await loadApprovals();
      setIsPackageRejectModalOpen(false);
      setPackageRejectionReason("");
      setSelectedPackageRequest(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to reject package change request.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageState title="Loading approval queue..." />;
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
        <SectionHeading
          title="Review job and package requests from client companies"
        />

        {actionError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 max-w-xl">
          <ToolbarInput
            icon={LuSearch}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search approval queue"
          />
        </div>

        <div className="mt-8 space-y-5">
          <h3 className="text-lg font-bold text-slate-900">Job approvals</h3>
          {filteredJobs.length ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-[24px] border border-slate-200 p-5 transition hover:border-lime-300 hover:bg-lime-50/30"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                      <Badge tone={job.approvalStatus === "PENDING" ? "amber" : "rose"}>
                        {titleCase(job.approvalStatus)}
                      </Badge>
                      <Badge tone="blue">{titleCase(job.createdBySource)}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {job.companyName} {"\u2022"} {job.department || "General"} {"\u2022"}{" "}
                      {job.location || "Location pending"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {job.jobType || "Role"} {"\u2022"} {job.workplaceType || "Flexible"} {"\u2022"}{" "}
                      {job.experience || "Experience open"}
                    </p>
                    {job.rejectionReason ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {job.rejectionReason}
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-400">Updated {formatDateTime(job.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApproveJob(job)}
                      disabled={isSaving}
                      className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setRejectionReason(job.rejectionReason || "");
                        setIsRejectModalOpen(true);
                      }}
                      className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No jobs in the approval queue"
              description="Pending or rejected client-created openings will show here for CRM review."
            />
          )}
        </div>

        <div className="mt-10 space-y-5">
          <h3 className="text-lg font-bold text-slate-900">Package change requests</h3>
          {filteredPackageRequests.length ? (
            filteredPackageRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[24px] border border-slate-200 p-5 transition hover:border-lime-300 hover:bg-lime-50/30"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{request.companyName}</h3>
                      <Badge tone={request.isUpgrade ? "emerald" : "amber"}>
                        {request.isUpgrade ? "Upgrade" : "Downgrade"}
                      </Badge>
                      <Badge tone="blue">
                        {titleCase(request.currentPackageType)} {"->"} {titleCase(request.requestedPackageType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {request.currentJobLimit} {"->"} {request.requestedJobLimit} posts capacity
                    </p>
                    <p className="text-sm text-slate-500">
                      Effective: {formatDateTime(request.effectiveAt)}
                    </p>
                    {request.reason ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {request.reason}
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-400">
                      Requested {formatDateTime(request.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprovePackageRequest(request)}
                      disabled={isSaving}
                      className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPackageRequest(request);
                        setPackageRejectionReason(request.decisionNote || "");
                        setIsPackageRejectModalOpen(true);
                      }}
                      className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No package change requests pending"
              description="Company upgrade or downgrade requests will appear here once submitted."
            />
          )}
        </div>
      </PanelCard>

      <ModalShell
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject job submission"
        description=""
      >
        <form onSubmit={handleRejectJob} className="space-y-5">
          <TextAreaField
            label="Rejection reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Explain the package, compliance, or content issue the client should correct."
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Submitting..." : "Confirm rejection"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={isPackageRejectModalOpen}
        onClose={() => setIsPackageRejectModalOpen(false)}
        title="Reject package change request"
        description=""
      >
        <form onSubmit={handleRejectPackageRequest} className="space-y-5">
          <TextAreaField
            label="Decision note"
            value={packageRejectionReason}
            onChange={(event) => setPackageRejectionReason(event.target.value)}
            placeholder="Mention commercial policy, billing constraints, or account pre-conditions."
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPackageRejectModalOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-lime-300 hover:bg-lime-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Submitting..." : "Confirm rejection"}
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
