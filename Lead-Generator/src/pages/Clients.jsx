import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuBuilding2,
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
  LuLoaderCircle,
  LuMail,
  LuPhoneCall,
  LuSearch,
} from "react-icons/lu";
import { fetchClientIntakes } from "../api/leadApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
];

const MODE_OPTIONS = [
  { value: "", label: "All Modes" },
  { value: "MANUAL", label: "Manual" },
  { value: "UPLOAD_JD", label: "JD Upload" },
  { value: "BOTH", label: "Manual + JD" },
];

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatSubmissionMode = (value = "") => {
  if (value === "UPLOAD_JD") {
    return "JD Upload";
  }
  if (value === "MANUAL") {
    return "Manual";
  }
  if (value === "BOTH") {
    return "Manual + JD";
  }
  return "-";
};

const formatStatus = (value = "") => {
  if (value === "IN_REVIEW") {
    return "In Review";
  }
  if (value === "CONTACTED") {
    return "Contacted";
  }
  if (value === "CLOSED") {
    return "Closed";
  }
  return "New";
};

const buildPageList = (currentPage, totalPages) => {
  if (totalPages <= 1) {
    return [];
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const currentPage = pagination.page || 1;
  const pageList = useMemo(() => buildPageList(currentPage, pagination.totalPages), [currentPage, pagination.totalPages]);

  const loadClients = useCallback(async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await fetchClientIntakes({
        page: pageToLoad,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        submissionMode: modeFilter,
      });

      setClients(Array.isArray(response?.items) ? response.items : []);
      setPagination({
        page: Number(response?.pagination?.page) || 1,
        limit: Number(response?.pagination?.limit) || PAGE_SIZE,
        total: Number(response?.pagination?.total) || 0,
        totalPages: Number(response?.pagination?.totalPages) || 1,
      });
      setError("");
    } catch (requestError) {
      setClients([]);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
      });
      setError(requestError?.response?.data?.message || "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, modeFilter]);

  useEffect(() => {
    loadClients(1);
  }, [loadClients]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return;
    }

    loadClients(nextPage);
  };

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <h1>Client Intakes</h1>
        <p>Track role postings submitted from Maven Portal client flow.</p>
      </section>

      <section className="my-leads-toolbar-card">
        <div className="my-leads-search">
          <LuSearch />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search reference ID, company, email, phone..."
          />
        </div>

        <div className="my-leads-zone-time-row">
          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">Status:</span>
            <select
              className="my-leads-select-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">Mode:</span>
            <select
              className="my-leads-select-input"
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value)}
            >
              {MODE_OPTIONS.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="my-leads-table-card">
        <div className="table-wrap">
          <table className="my-leads-table clients-table">
            <thead>
              <tr>
                <th>REFERENCE</th>
                <th>COMPANY</th>
                <th>CONTACT</th>
                <th>SUBMISSION</th>
                <th>ROLE / JD</th>
                <th>RECEIVED ON</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    <span className="loading-block">
                      <LuLoaderCircle className="spin" />
                      Loading client intakes...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    {error}
                  </td>
                </tr>
              ) : clients.length ? (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.referenceId || "-"}</strong>
                    </td>
                    <td>
                      <span className="company-cell">
                        <span className="row-icon">
                          <LuBuilding2 />
                        </span>
                        <strong>{client.companyName || "-"}</strong>
                      </span>
                    </td>
                    <td>
                      <div className="client-contact-cell">
                        <span>
                          <LuMail />
                          {client.email || "-"}
                        </span>
                        <span>
                          <LuPhoneCall />
                          {client.phone || "-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="client-mode-stack">
                        <span className="client-chip client-chip-mode">{formatSubmissionMode(client.submissionMode)}</span>
                        <span className="client-chip client-chip-status">{formatStatus(client.status)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="client-role-cell">
                        <span>{client.roleTitle || "Role via JD upload"}</span>
                        {Number(client.jdAttachmentCount || 0) > 0 ? (
                          <small>
                            <LuFileText />
                            {Number(client.jdAttachmentCount || 0)} JD file(s)
                          </small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="client-time-cell">
                        <LuCalendarDays />
                        {formatDateTime(client.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No client intakes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="clients-pagination">
        <div className="clients-pagination-info">
          Showing {clients.length} of {pagination.total} records
        </div>
        <div className="clients-pagination-actions">
          <button
            type="button"
            className="button button-secondary clients-pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={loading || currentPage <= 1}
          >
            <LuChevronLeft />
            Prev
          </button>

          {pageList.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`clients-page-pill ${pageNumber === currentPage ? "is-active" : ""}`}
              onClick={() => goToPage(pageNumber)}
              disabled={loading}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            className="button button-secondary clients-pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={loading || currentPage >= pagination.totalPages}
          >
            Next
            <LuChevronRight />
          </button>
        </div>
      </section>
    </div>
  );
}
