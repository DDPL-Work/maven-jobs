import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuExternalLink, LuFilter, LuUsers } from "react-icons/lu";
import {
  fetchCompanyApplications,
  previewCompanyApplicationResume,
  updateCompanyApplicationStatus,
} from "../api/companyApi";

const PAGE_SIZE = 10;
const DEFAULT_STATUS_OPTIONS = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
];

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getApplicationClass = (value = "") => {
  const normalized = String(value || "").toLowerCase();
  if (
    [
      "applied",
      "screening",
      "shortlisted",
      "interview",
      "offered",
      "hired",
      "rejected",
    ].includes(normalized)
  ) {
    return `app-status-${normalized}`;
  }
  return "app-status-default";
};

const prettifyStatus = (value = "") =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((segment) => (segment ? `${segment[0].toUpperCase()}${segment.slice(1)}` : ""))
    .join(" ");

export default function Applies() {
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [updatingId, setUpdatingId] = useState("");
  const [resumeBusyId, setResumeBusyId] = useState("");
  const [banner, setBanner] = useState({ type: "", message: "" });

  const statusOptions = useMemo(
    () => response?.statuses || DEFAULT_STATUS_OPTIONS,
    [response?.statuses],
  );

  const allFilterOptions = useMemo(
    () => ["ALL", ...statusOptions],
    [statusOptions],
  );

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchCompanyApplications({
          status: statusFilter,
          page,
          limit: PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setResponse(data);

        const rowDrafts = {};
        (data?.items || []).forEach((item) => {
          rowDrafts[item.id] = item.status || "APPLIED";
        });
        setDraftStatuses(rowDrafts);

        const resolvedPage = Number(data?.pagination?.page || page);
        if (resolvedPage !== page) {
          setPage(resolvedPage);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError(requestError?.response?.data?.message || "Unable to load applications.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const items = response?.items || [];
  const summary = response?.summary || { total: 0, byStatus: {} };
  const pagination = response?.pagination || {
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const handleStatusUpdate = async (application) => {
    const applicationId = String(application?.id || "").trim();
    const nextStatus = String(draftStatuses[applicationId] || application?.status || "APPLIED");
    const currentStatus = String(application?.status || "APPLIED");

    if (!applicationId || !nextStatus || nextStatus === currentStatus) {
      return;
    }

    setBanner({ type: "", message: "" });
    setUpdatingId(applicationId);

    try {
      const result = await updateCompanyApplicationStatus(applicationId, nextStatus);
      const updated = result?.data || null;
      const successMessage = result?.message || "Application status updated successfully.";

      setResponse((current) => {
        if (!current || !updated) {
          return current;
        }

        const nextItems = (current.items || []).map((item) =>
          item.id === applicationId ? { ...item, ...updated } : item,
        );

        const previousStatus = String(currentStatus || "").toUpperCase();
        const targetStatus = String(updated.status || nextStatus).toUpperCase();
        const summaryMap = { ...(current.summary?.byStatus || {}) };

        if (summaryMap[previousStatus] !== undefined && previousStatus !== targetStatus) {
          summaryMap[previousStatus] = Math.max(0, Number(summaryMap[previousStatus] || 0) - 1);
        }
        if (summaryMap[targetStatus] !== undefined && previousStatus !== targetStatus) {
          summaryMap[targetStatus] = Number(summaryMap[targetStatus] || 0) + 1;
        }

        return {
          ...current,
          items: nextItems,
          summary: {
            ...(current.summary || {}),
            byStatus: summaryMap,
          },
        };
      });

      setDraftStatuses((current) => ({
        ...current,
        [applicationId]: String(updated?.status || nextStatus),
      }));

      setBanner({ type: "success", message: successMessage });
    } catch (requestError) {
      setBanner({
        type: "error",
        message: requestError?.response?.data?.message || "Unable to update application status.",
      });
    } finally {
      setUpdatingId("");
    }
  };

  const handleOpenResume = async (application) => {
    const applicationId = String(application?.id || "").trim();
    if (!applicationId) {
      return;
    }

    setBanner({ type: "", message: "" });
    setResumeBusyId(applicationId);

    try {
      const resumeBlob = await previewCompanyApplicationResume(applicationId);
      const blobUrl = window.URL.createObjectURL(resumeBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 120000);
    } catch (requestError) {
      setBanner({
        type: "error",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to open resume preview.",
      });
    } finally {
      setResumeBusyId("");
    }
  };

  if (isLoading) {
    return (
      <div className="company-page-state">
        <div className="company-panel-card">
          <h2>Loading applications...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-page-state">
        <div className="status-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      <section className="company-panel-card company-applies-hero">
        <div>
          <h2 className="company-section-title">Applies</h2>
        </div>

        <div className="company-applies-filter-wrap">
          <label className="company-field">
            <span>
              <LuFilter size={14} /> Status filter
            </span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="company-inline-select"
            >
              {allFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : prettifyStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="company-summary-grid">
        <article className="company-summary-card">
          <p>Total applications</p>
          <strong>{Number(summary.total || 0)}</strong>
        </article>
        <article className="company-summary-card">
          <p>Shortlisted</p>
          <strong>{Number(summary.byStatus?.SHORTLISTED || 0)}</strong>
        </article>
        <article className="company-summary-card">
          <p>Interview</p>
          <strong>{Number(summary.byStatus?.INTERVIEW || 0)}</strong>
        </article>
        <article className="company-summary-card">
          <p>Rejected</p>
          <strong>{Number(summary.byStatus?.REJECTED || 0)}</strong>
        </article>
      </section>

      <section className="company-panel-card">
        {banner.message ? (
          <div className={banner.type === "success" ? "status-banner success-banner" : "status-banner"}>
            {banner.message}
          </div>
        ) : null}

        <div className="company-jobs-table-wrap">
          <table className="company-jobs-table company-applications-table company-applies-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied role</th>
                <th>Current status</th>
                <th>Update status</th>
                <th>Contact</th>
                <th>Applied on</th>
                <th>Resume</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((application) => {
                  const draftValue = draftStatuses[application.id] || application.status || "APPLIED";
                  const hasStatusChange = String(draftValue) !== String(application.status || "APPLIED");

                  return (
                    <tr key={application.id}>
                      <td>
                        <p className="company-table-main">{application.candidateName || "Candidate"}</p>
                        <p className="company-table-sub">
                          {application.candidateCurrentTitle || "Role not set"}
                        </p>
                      </td>
                      <td>
                        <p className="company-table-main">
                          <LuUsers size={14} /> {application.jobTitle || "Unknown role"}
                        </p>
                      </td>
                      <td>
                        <span className={`company-application-chip ${getApplicationClass(application.status)}`}>
                          {prettifyStatus(application.status || "APPLIED")}
                        </span>
                      </td>
                      <td>
                        <div className="company-status-update-cell">
                          <select
                            value={draftValue}
                            className="company-inline-select"
                            onChange={(event) =>
                              setDraftStatuses((current) => ({
                                ...current,
                                [application.id]: event.target.value,
                              }))
                            }
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {prettifyStatus(status)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="company-resume-link company-status-update-btn"
                            onClick={() => handleStatusUpdate(application)}
                            disabled={!hasStatusChange || updatingId === application.id}
                          >
                            {updatingId === application.id ? "Updating..." : "Update"}
                            <LuCheck size={13} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <p className="company-table-sub">{application.candidateEmail || "-"}</p>
                        <p className="company-table-sub">{application.candidatePhone || "-"}</p>
                      </td>
                      <td>{formatDate(application.appliedAt)}</td>
                      <td>
                        {application.resumeUrl || application.resumeFileName ? (
                          <button
                            type="button"
                            className="company-resume-link"
                            onClick={() => handleOpenResume(application)}
                            disabled={resumeBusyId === application.id}
                          >
                            {resumeBusyId === application.id ? "Opening..." : "Open resume"}
                            <LuExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="company-table-sub">Not uploaded</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="company-empty-cell">
                    No applications found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {Number(pagination.totalItems || 0) ? (
          <div className="company-pagination-row">
            <p className="company-pagination-meta">
              Showing{" "}
              <strong>
                {(Number(pagination.page || 1) - 1) * Number(pagination.limit || PAGE_SIZE) + 1}
                {"-"}
                {Math.min(
                  Number(pagination.page || 1) * Number(pagination.limit || PAGE_SIZE),
                  Number(pagination.totalItems || 0),
                )}
              </strong>{" "}
              of <strong>{Number(pagination.totalItems || 0)}</strong> applications
            </p>

            <div className="company-pagination-controls">
              <button
                type="button"
                className="company-page-btn"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </button>

              {Array.from(
                { length: Math.max(1, Number(pagination.totalPages || 1)) },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`company-page-btn ${Number(pagination.page || 1) === pageNumber ? "active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                className="company-page-btn"
                onClick={() =>
                  setPage((current) =>
                    Math.min(Number(pagination.totalPages || 1), current + 1),
                  )
                }
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
