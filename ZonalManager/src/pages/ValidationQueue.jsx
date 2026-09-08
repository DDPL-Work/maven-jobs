import { useEffect, useMemo, useState } from "react";
import {
  LuBuilding2,
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuCircleAlert,
  LuCircleCheck,
  LuMapPin,
  LuRefreshCw,
  LuSearch,
  LuSend,
  LuUserRound,
} from "react-icons/lu";
import {
  assignLeadToStateManager,
  deleteLeadActivity,
  fetchLeads,
  fetchStateManagers,
  logLeadActivity,
  updateLeadStatus,
} from "../api/leadApi";
import AssignFseModal from "../components/AssignFseModal";
import LeadDetailModal from "../components/LeadDetailModal";
import LogActivityModal from "../components/LogActivityModal";
import ActionConfirmModal from "../components/ActionConfirmModal";

const ACTIVE_STATUS_OPTIONS = ["", "FORWARDED", "ASSIGNED", "CONVERTED", "REJECTED", "LOST"];
const TERMINAL_STATUSES = ["CONVERTED", "REJECTED", "LOST"];

const toLeadLocation = (lead) => {
  if (lead.address?.trim()) {
    return lead.address.trim();
  }

  return [lead.city, lead.state].filter(Boolean).join(", ");
};

export default function ValidationQueue() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLead, setAssignLead] = useState(null);
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const [stateManagers, setStateManagers] = useState([]);
  const [activities, setActivities] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [myZone, setMyZone] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const sessionRaw = sessionStorage.getItem("crm_panel_session");
      if (!sessionRaw) {
        return;
      }

      const session = JSON.parse(sessionRaw);
      const zone = String(session?.user?.zone || "").trim();
      if (zone) {
        setMyZone(zone);
        setLocation(zone);
      }
    } catch {
      // Ignore malformed session payload.
    }
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchLeads({ search, location, date, status, page: 1, limit: 100 });
      const leadItems = Array.isArray(response?.data) ? response.data : [];

      const mappedLeads = leadItems
        .map((lead) => ({
          ...lead,
          id: lead.id || lead._id,
          category: lead.businessCategory || "Unknown",
          contactEmail: lead.email || "-",
          location: toLeadLocation(lead),
          assignedToName: lead.assignedTo?.fullName || "",
          assignedRole: String(lead.assignedTo?.role || "").toUpperCase(),
          generatorName: lead.createdBy?.fullName || "Lead Generator",
        }))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      const nextActivities = {};
      mappedLeads.forEach((lead) => {
        nextActivities[lead.id] = Array.isArray(lead.activities) ? lead.activities : [];
      });

      setActivities(nextActivities);
      setLeads(mappedLeads);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load zone leads.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return leads.slice(start, start + itemsPerPage);
  }, [leads, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [leads.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, location, date, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, location, date, status]);

  useEffect(() => {
    const loadStateManagers = async () => {
      try {
        const data = await fetchStateManagers();
        setStateManagers(Array.isArray(data) ? data : []);
      } catch {
        setStateManagers([]);
      }
    };

    loadStateManagers();
  }, []);

  const handleConvert = async (event, lead) => {
    event.stopPropagation();
    setConfirmAction({ type: "CONVERT", lead });
  };

  const handleAssign = (event, lead) => {
    event.stopPropagation();
    setConfirmAction({ type: "FORWARD", lead });
  };

  const handleAssignLead = async (leadId, stateManagerId) => {
    await assignLeadToStateManager(leadId, stateManagerId);
    setShowAssignModal(false);
    setAssignLead(null);
    await loadLeads();
  };

  const handleConfirmStatusAction = async () => {
    if (!confirmAction?.lead) {
      return;
    }

    if (confirmAction.type === "FORWARD") {
      setAssignLead(confirmAction.lead);
      setShowAssignModal(true);
      setConfirmAction(null);
      return;
    }

    try {
      setActionSubmitting(true);
      await updateLeadStatus(confirmAction.lead.id, "CONVERTED");
      await loadLeads();
    } catch (requestError) {
      window.alert(requestError?.response?.data?.message || "Failed to convert lead.");
    } finally {
      setActionSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleLogActivity = () => {
    setEditingActivityIndex(null);
    setShowDetailModal(false);
    setShowActivityModal(true);
  };

  const handleEditActivity = (index) => {
    setEditingActivityIndex(index);
    setShowDetailModal(false);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = async (index) => {
    if (!selectedLead?.id) {
      return;
    }

    try {
      await deleteLeadActivity(selectedLead.id, index);
      await loadLeads();
    } catch (requestError) {
      window.alert(requestError?.response?.data?.message || "Failed to delete activity.");
    }
  };

  const handleActivitySubmit = async (payload) => {
    if (!selectedLead?.id) {
      return;
    }

    try {
      await logLeadActivity(selectedLead.id, {
        ...payload,
        activityIndex: editingActivityIndex,
        nextFollowUpAt: payload.nextFollowUp || null,
      });
      setShowActivityModal(false);
      setEditingActivityIndex(null);
      await loadLeads();
      setShowDetailModal(true);
    } catch (requestError) {
      window.alert(requestError?.response?.data?.message || "Failed to save activity.");
    }
  };

  const pendingCount = useMemo(
    () => leads.filter((lead) => !TERMINAL_STATUSES.includes(String(lead.status || "").toUpperCase())).length,
    [leads],
  );

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
          <div>
            <h1>Zone Leads</h1>
            <p>Review zone pipeline, assign leads to State Managers, and monitor progress.</p>
          </div>
          <div
            style={{
              backgroundColor: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#c2410c",
              padding: "10px 18px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.95rem",
              fontWeight: "700",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <LuCircleAlert size={20} />
            {pendingCount} Active Leads
          </div>
        </div>
      </section>

      <section className="my-leads-toolbar-card">
        <div className="my-leads-search">
          <LuSearch />
          <input
            type="text"
            placeholder="Search company, contact, lead code..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="my-leads-filter">
          <div className="my-leads-filter-label">
            <LuMapPin size={18} />
            <span>Region:</span>
          </div>
          <select
            className="filter-chip"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              background:
                "#edf2f8 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23536e94' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat calc(100% - 10px) 50%",
            }}
          >
            <option value="">All Zones</option>
            <option value={myZone || "North"}>{myZone || "North"} Zone</option>
          </select>

          <div className="my-leads-filter-label" style={{ marginLeft: "8px" }}>
            <LuCalendar size={18} />
            <span>Timeline:</span>
          </div>
          <select
            className="filter-chip"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              background:
                "#edf2f8 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23536e94' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat calc(100% - 10px) 50%",
            }}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>

          <select
            className="filter-chip"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={{
              appearance: "none",
              paddingRight: "30px",
              background:
                "#edf2f8 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23536e94' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat calc(100% - 10px) 50%",
            }}
          >
            <option value="">All Statuses</option>
            {ACTIVE_STATUS_OPTIONS.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading && !leads.length ? (
        <section className="my-leads-table-card">
          <div style={{ padding: "64px 24px", textAlign: "center", color: "#64748b" }}>
            Loading zone leads...
          </div>
        </section>
      ) : error ? (
        <section className="my-leads-table-card">
          <div style={{ padding: "24px", color: "#b91c1c" }}>{error}</div>
        </section>
      ) : !leads.length ? (
        <section className="my-leads-table-card">
          <div
            style={{
              padding: "64px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "360px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#ecfdf5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <LuCircleCheck size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 12px 0" }}>
              No Leads Found
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, textAlign: "center", maxWidth: "380px", lineHeight: "1.5" }}>
              No zone leads match your current filters.
            </p>
          </div>
        </section>
      ) : (
        <section className="my-leads-table-card">
          <div className="table-wrap">
            <table className="my-leads-table">
              <thead>
                <tr>
                  <th>COMPANY NAME</th>
                  <th>LOCATION</th>
                  <th>LEAD GENERATOR</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const normalizedStatus = String(lead.status || "").toUpperCase();
                  const isTerminal = TERMINAL_STATUSES.includes(normalizedStatus);
                  const isAssignedToStateManager = lead.assignedRole === "STATE_MANAGER";

                  return (
                    <tr key={lead.id} className="clickable-row" onClick={() => handleRowClick(lead)}>
                      <td>
                        <div className="company-cell">
                          <span className="row-icon">
                            <LuBuilding2 size={16} />
                          </span>
                          <strong>{lead.companyName}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="location-cell">
                          <LuMapPin size={16} />
                          {lead.location || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span className="contact-name">
                            <LuUserRound size={16} />
                            {lead.generatorName}
                          </span>
                          <small>{lead.contactName}</small>
                        </div>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: normalizedStatus === "CONVERTED" ? "#10b981" : normalizedStatus === "REJECTED" || normalizedStatus === "LOST" ? "#dc2626" : "#2563eb",
                              background: normalizedStatus === "CONVERTED" ? "#ecfdf5" : normalizedStatus === "REJECTED" || normalizedStatus === "LOST" ? "#fee2e2" : "#eff6ff",
                              padding: "3px 9px",
                              borderRadius: "12px",
                              border: normalizedStatus === "CONVERTED" ? "1px solid #10b981" : normalizedStatus === "REJECTED" || normalizedStatus === "LOST" ? "1px solid #dc2626" : "1px solid #2563eb",
                            }}
                          >
                            {normalizedStatus.replace("_", " ")}
                          </span>

                          {isAssignedToStateManager ? (
                            <small style={{ color: "#334155", fontSize: "0.75rem" }}>
                              Assigned: {lead.assignedToName}
                            </small>
                          ) : null}

                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                            {!isTerminal ? (
                              <button
                                title="Convert Lead"
                                onClick={(event) => handleConvert(event, lead)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #e2e8f0",
                                  background: "#f8fafc",
                                  color: "#10b981",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                }}
                              >
                                <LuRefreshCw size={14} />
                                Convert
                              </button>
                            ) : null}

                            {!isTerminal ? (
                              <button
                                title="Assign to State Manager"
                                onClick={(event) => handleAssign(event, lead)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #e2e8f0",
                                  background: "#f8fafc",
                                  color: "#2563eb",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                }}
                              >
                                <LuSend size={14} />
                                {isAssignedToStateManager ? "Reassign" : "Assign"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-wrap">
                <div className="pagination-info">
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                  <strong>{Math.min(currentPage * itemsPerPage, leads.length)}</strong> of{" "}
                  <strong>{leads.length}</strong> zone leads
                </div>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <LuChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <LuChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showDetailModal && selectedLead ? (
        <LeadDetailModal
          lead={selectedLead}
          activities={activities[selectedLead.id] || []}
          onClose={() => setShowDetailModal(false)}
          onLogActivity={handleLogActivity}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      ) : null}

      {showActivityModal && selectedLead ? (
        <LogActivityModal
          lead={selectedLead}
          initialData={
            editingActivityIndex !== null
              ? activities[selectedLead.id]?.[editingActivityIndex]
              : null
          }
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivityIndex(null);
            setShowDetailModal(true);
          }}
          onSubmit={handleActivitySubmit}
        />
      ) : null}

      {showAssignModal && assignLead ? (
        <AssignFseModal
          lead={assignLead}
          fses={stateManagers}
          myZone={myZone}
          onClose={() => {
            setShowAssignModal(false);
            setAssignLead(null);
          }}
          onSubmit={handleAssignLead}
        />
      ) : null}

      <ActionConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === "CONVERT" ? "Confirm Conversion" : "Confirm Forward"}
        message={
          confirmAction?.type === "CONVERT"
            ? `Convert lead for ${confirmAction?.lead?.companyName || "this company"}?`
            : `Forward lead for ${confirmAction?.lead?.companyName || "this company"} to a State Manager?`
        }
        confirmLabel={confirmAction?.type === "CONVERT" ? "Yes, Convert" : "Yes, Forward"}
        tone={confirmAction?.type === "FORWARD" ? "forward" : "primary"}
        isSubmitting={actionSubmitting}
        onClose={() => {
          if (!actionSubmitting) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirmStatusAction}
      />
    </div>
  );
}
