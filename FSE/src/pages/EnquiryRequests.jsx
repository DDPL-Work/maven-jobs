import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LuSearch,
  LuPhone,
  LuMail,
  LuBuilding2,
  LuMapPin,
  LuUsers,
  LuCalendar,
  LuEye,
  LuFilter,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
  LuChevronUp,
  LuCircleCheck,
  LuClock,
  LuX,
  LuMessageSquareQuote,
  LuSparkles,
} from "react-icons/lu";
import Swal from "sweetalert2";
import { fetchSalesEnquiries, updateSalesEnquiry } from "../api/fseApi";
import "./EnquiryRequests.css";

const STATUS_CONFIG = {
  NEW: { label: "New Request", class: "status-pill-new" },
  CONTACTED: { label: "Contacted", class: "status-pill-contacted" },
  IN_DISCUSSION: { label: "In Discussion", class: "status-pill-discussion" },
  DEMO_SCHEDULED: { label: "Demo Scheduled", class: "status-pill-demo" },
  CONVERTED: { label: "Converted", class: "status-pill-approved" },
  CLOSED: { label: "Closed", class: "status-pill-closed" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EnquiryRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Load Enquiries
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSalesEnquiries({
        page,
        limit,
        search,
        status: statusFilter,
        entityType: entityTypeFilter,
        source: sourceFilter,
      });

      if (res && res.success) {
        setItems(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load sales enquiries:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, entityTypeFilter, sourceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced / Enter search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");
    setEntityTypeFilter("");
    setSourceFilter("");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (entityTypeFilter) count++;
    if (sourceFilter) count++;
    return count;
  }, [statusFilter, entityTypeFilter, sourceFilter]);

  // Open Details Modal
  const handleOpenModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEditStatus(enquiry.status || "NEW");
    setEditNotes(enquiry.notes || "");
    setIsModalOpen(true);
  };

  // Save Status / Notes
  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    setIsUpdating(true);
    try {
      const res = await updateSalesEnquiry(selectedEnquiry._id, {
        status: editStatus,
        notes: editNotes,
      });

      if (res && res.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Enquiry status updated successfully.",
          timer: 1600,
          showConfirmButton: false,
        });

        // Update local item
        setItems((prev) =>
          prev.map((item) =>
            item._id === selectedEnquiry._id
              ? { ...item, status: editStatus, notes: editNotes }
              : item
          )
        );
        setSelectedEnquiry((prev) => ({
          ...prev,
          status: editStatus,
          notes: editNotes,
        }));
        setIsModalOpen(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err?.response?.data?.message || err?.message || "Could not update status.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute Stats from current items/total
  const stats = useMemo(() => {
    const newCount = items.filter((i) => i.status === "NEW").length;
    const contactedCount = items.filter(
      (i) => i.status === "CONTACTED" || i.status === "IN_DISCUSSION"
    ).length;
    const convertedCount = items.filter(
      (i) => i.status === "CONVERTED" || i.status === "DEMO_SCHEDULED"
    ).length;

    return {
      total,
      newCount,
      contactedCount,
      convertedCount,
    };
  }, [items, total]);

  // Pagination calculation
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="my-leads-page enquiry-page">
      {/* ─── Page Header (Matching FSE Global Pattern) ─── */}
      <header className="page-header-premium">
        <div className="header-left">
          <div className="breadcrumb">
            <span>Dashboard</span>
            <span className="separator">/</span>
            <span className="current">Sales Enquiries</span>
          </div>
          <h1 className="page-title-premium">Sales Enquiries</h1>
          <p className="page-subtitle">
            View, track, and process demo & enquiry requests originating from Maven Talent Cloud & Employer portal.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={() => loadData()}
          title="Refresh Data"
        >
          <LuRefreshCw className={loading ? "spin" : ""} size={16} /> Refresh
        </button>
      </header>

      {/* ─── Stats Grid (Matching index.css stats-grid-premium) ─── */}
      <div className="stats-grid-premium">
        <div className="stat-card-premium">
          <div className="stat-icon icon-blue">
            <LuMessageSquareQuote />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Enquiries</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon icon-gold">
            <LuClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">New Requests</span>
            <span className="stat-value">{stats.newCount}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon icon-orange">
            <LuPhone />
          </div>
          <div className="stat-content">
            <span className="stat-label">In Discussion</span>
            <span className="stat-value">{stats.contactedCount}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon icon-green">
            <LuCircleCheck />
          </div>
          <div className="stat-content">
            <span className="stat-label">Converted / Demo</span>
            <span className="stat-value">{stats.convertedCount}</span>
          </div>
        </div>
      </div>

      {/* ─── Filters Toolbar (Matching index.css my-leads-filters-container-premium) ─── */}
      <section className="my-leads-filters-container-premium">
        <div className="filter-main-row">
          <div className="search-box-premium">
            <LuSearch className="search-icon" />
            <input
              className="search-input-premium"
              placeholder="Search by Ref ID, Client name, Company, Phone, City..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(e);
                }
              }}
            />
          </div>

          <div className="filter-actions-toolbar">
            <button
              type="button"
              className={`advanced-toggle-btn ${showAdvanced ? "active" : ""}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <LuFilter size={16} />
              <span>Advanced Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
              {showAdvanced ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </button>

            {(search || statusFilter || entityTypeFilter || sourceFilter || searchInput) && (
              <button
                type="button"
                className="reset-btn-premium"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="advanced-filters-panel animate-slide-down">
            <div className="filter-grid-layout">
              <div className="filter-control">
                <label>Pipeline Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New Request</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="IN_DISCUSSION">In Discussion</option>
                  <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="filter-control">
                <label>Entity Type</label>
                <select
                  value={entityTypeFilter}
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Entities</option>
                  <option value="company">Direct Company</option>
                  <option value="consultancy">Consultancy</option>
                </select>
              </div>

              <div className="filter-control">
                <label>Enquiry Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Sources</option>
                  <option value="TALENT_CLOUD">Maven Talent Cloud</option>
                  <option value="EMPLOYER_LANDING">Employer Landing</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Tabular Enquiry View (Matching index.css my-leads-table grid-table) ─── */}
      <section className="my-leads-table-card-premium">
        <div className="table-wrap">
          <table className="my-leads-table grid-table">
            <thead>
              <tr className="header-level-1">
                <th colSpan="3">CLIENT &amp; ORGANIZATION</th>
                <th colSpan="2">CONTACT DETAILS</th>
                <th colSpan="2">REQUIREMENTS</th>
                <th rowSpan="2">STATUS</th>
                <th rowSpan="2">ACTION</th>
              </tr>
              <tr className="header-level-2">
                <th>RECEIVED DATE</th>
                <th>REF ID</th>
                <th>CLIENT &amp; COMPANY</th>
                <th>PHONE NUMBER</th>
                <th>EMAIL &amp; LOCATION</th>
                <th>HEADCOUNT</th>
                <th>SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#64748b" }}>
                      <LuRefreshCw className="spin" size={18} /> Loading enquiry records...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "50px 20px" }}>
                    <div style={{ color: "#64748b", fontSize: "1rem", fontWeight: 600, marginBottom: 4 }}>
                      No enquiry requests found
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                      Try adjusting your search query or filter options.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((enquiry) => {
                  const statusMeta = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.NEW;
                  return (
                    <tr key={enquiry._id} className="grid-row">
                      {/* Received Date */}
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#64748b" }}>
                        {formatDate(enquiry.createdAt)}
                      </td>

                      {/* Ref ID */}
                      <td>
                        <span className="enquiry-ref-code">{enquiry.referenceId || "ENQ-GEN"}</span>
                      </td>

                      {/* Client & Organization */}
                      <td>
                        <div className="cell-client-stack">
                          <span className="cell-primary-text">{enquiry.fullName}</span>
                          <span className="cell-sub-text">
                            {enquiry.designation ? `${enquiry.designation} · ` : ""}
                            <strong>{enquiry.organizationName || "Independent"}</strong>
                          </span>
                          {enquiry.entityType && (
                            <div>
                              <span
                                className={`entity-badge ${
                                  enquiry.entityType === "company"
                                    ? "entity-badge-company"
                                    : "entity-badge-consultancy"
                                }`}
                              >
                                {enquiry.entityType}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td>
                        <a
                          href={`tel:+91${enquiry.mobile}`}
                          className="cell-link"
                          title="Call phone"
                        >
                          <LuPhone size={13} /> +91 {enquiry.mobile}
                        </a>
                      </td>

                      {/* Email & Location */}
                      <td>
                        <div className="cell-contact-stack">
                          <a
                            href={`mailto:${enquiry.email}`}
                            className="cell-link cell-link-muted"
                            title="Send email"
                          >
                            <LuMail size={13} /> {enquiry.email}
                          </a>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#64748b" }}>
                            <LuMapPin size={12} color="#94a3b8" />
                            <span>{enquiry.city || "Not specified"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Headcount */}
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: "#334155", fontSize: "0.82rem" }}>
                          {enquiry.employeeCount || "-"}
                        </span>
                      </td>

                      {/* Source */}
                      <td style={{ textAlign: "center" }}>
                        <span className="source-tag">
                          {enquiry.source === "EMPLOYER_LANDING" ? "Landing Page" : "Talent Cloud"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`status-pill ${statusMeta.class}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            className="icon-btn text-blue-600 hover:text-blue-800"
                            title="View & Process"
                            onClick={() => handleOpenModal(enquiry)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                          >
                            <LuEye size={17} />
                          </button>
                          <a
                            href={`tel:+91${enquiry.mobile}`}
                            className="icon-btn text-green-600 hover:text-green-800"
                            title="Quick Call"
                            style={{ display: "inline-flex", alignItems: "center", padding: "4px" }}
                          >
                            <LuPhone size={15} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Table Pagination Bar (Matching FSE Styling) ─── */}
        <div className="table-pagination-footer">
          <div className="pagination-entries-info">
            <span>
              Showing <strong>{total > 0 ? startIndex : 0}</strong> to{" "}
              <strong>{endIndex}</strong> of <strong>{total}</strong> entries
            </span>

            <div className="per-page-selector">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="pagination-nav">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              title="Previous Page"
            >
              <LuChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
              let pageNumber = idx + 1;
              if (totalPages > 7 && page > 4) {
                pageNumber = page - 3 + idx;
                if (pageNumber > totalPages) return null;
              }

              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`pagination-btn ${page === pageNumber ? "active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                  disabled={loading}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              title="Next Page"
            >
              <LuChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Detail & Status Update Modal (Matching index.css modal standards) ─── */}
      {isModalOpen && selectedEnquiry && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="presentation"
        >
          <div
            className="modal-content"
            style={{ maxWidth: "640px" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>Enquiry Details</h2>
                <p>Reference: {selectedEnquiry.referenceId}</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <LuX size={20} />
              </button>
            </header>

            <div className="modal-body">
              {/* Quick Actions Header Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  padding: "14px 18px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                    {selectedEnquiry.fullName}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                    {selectedEnquiry.designation ? `${selectedEnquiry.designation} at ` : ""}
                    <strong>{selectedEnquiry.organizationName || "Independent"}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={`tel:+91${selectedEnquiry.mobile}`}
                    className="quick-call-cta"
                  >
                    <LuPhone size={14} /> Call Client
                  </a>
                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="quick-email-cta"
                  >
                    <LuMail size={14} /> Email
                  </a>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="detail-section">
                <h3>Company &amp; Organization</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">
                      <LuBuilding2 size={13} /> Organization Name
                    </span>
                    <p className="detail-value" style={{ fontWeight: 700, color: "#1e40af", fontSize: "1.1rem" }}>
                      {selectedEnquiry.organizationName || "Independent / Direct"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Entity Type</span>
                    <p className="detail-value" style={{ textTransform: "capitalize" }}>
                      {selectedEnquiry.entityType || "Company"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Headcount</span>
                    <p className="detail-value">
                      {selectedEnquiry.employeeCount || "Not specified"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuMapPin size={13} /> Location
                    </span>
                    <p className="detail-value">
                      {selectedEnquiry.city || "Not specified"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Lead Source</span>
                    <p className="detail-value">
                      {selectedEnquiry.source === "EMPLOYER_LANDING"
                        ? "Employer Landing Page"
                        : "Maven Talent Cloud"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="detail-section" style={{ marginTop: "16px" }}>
                <h3>Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Contact Person</span>
                    <p className="detail-value" style={{ fontWeight: 600 }}>
                      {selectedEnquiry.fullName}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Designation</span>
                    <p className="detail-value">
                      {selectedEnquiry.designation || "Not provided"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuPhone size={13} /> Phone
                    </span>
                    <p className="detail-value">+91 {selectedEnquiry.mobile}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuMail size={13} /> Work Email
                    </span>
                    <p className="detail-value">{selectedEnquiry.email}</p>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Received Date &amp; Time</span>
                    <p className="detail-value">{formatDate(selectedEnquiry.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Status Update & Internal Notes Card */}
              <div className="enquiry-process-card">
                <h4 className="enquiry-process-title">
                  <LuSparkles size={16} /> Process &amp; Update Pipeline Status
                </h4>

                <div className="process-form-grid">
                  <div className="process-form-field">
                    <label>Pipeline Stage</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="NEW">NEW - Needs Initial Call</option>
                      <option value="CONTACTED">CONTACTED - Call Completed</option>
                      <option value="IN_DISCUSSION">IN_DISCUSSION - Requirements Review</option>
                      <option value="DEMO_SCHEDULED">DEMO_SCHEDULED - Product Demo Booked</option>
                      <option value="CONVERTED">CONVERTED - Signed Up / Account Created</option>
                      <option value="CLOSED">CLOSED - Dropped / Not Interested</option>
                    </select>
                  </div>

                  <div className="process-form-field">
                    <label>Internal FSE Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Add conversation updates, follow-up times..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="process-action-buttons">
                  <button
                    type="button"
                    className="btn-secondary-custom"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary-custom"
                    disabled={isUpdating}
                    onClick={handleSaveStatus}
                  >
                    {isUpdating ? "Saving..." : "Save Status & Notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
