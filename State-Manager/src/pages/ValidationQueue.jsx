import { useState, useEffect } from "react";
import { 
  LuCircleAlert, 
  LuSearch, 
  LuMapPin, 
  LuCalendar,
  LuCircleCheck,
  LuBuilding2,
  LuUserRound,
  LuRefreshCw,
  LuSend
} from "react-icons/lu";
import {
  fetchLeads,
  updateLeadStatus,
  logLeadActivity,
  deleteLeadActivity,
  fetchFSEs,
  assignLeadToFSE,
} from "../api/leadApi";
import LeadDetailModal from "../components/LeadDetailModal";
import LogActivityModal from "../components/LogActivityModal";
import AssignFseModal from "../components/AssignFseModal";
import ActionConfirmModal from "../components/ActionConfirmModal";

export default function ValidationQueue() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Actions
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLead, setAssignLead] = useState(null);
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const [fses, setFses] = useState([]);
  const [myZone, setMyZone] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  
  // Activities state for modal (mocked for now, or synced if backend supports)
  const [activities, setActivities] = useState({});

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await fetchLeads({ search, location, date });
      let leadsArray = [];
      if (Array.isArray(data)) {
        leadsArray = data;
      } else if (data && data.leads) {
        leadsArray = data.leads;
      }
      
      const pending = leadsArray.filter(l => 
        ["FORWARDED", "ASSIGNED", "CONVERTED", "REJECTED", "Assigned", "Converted"].includes(l.status)
      );
      
      const mappedLeads = pending.map(lead => ({
        ...lead,
        id: lead._id || lead.id,
        category: lead.businessCategory || "Unknown",
        contactEmail: lead.email || "-",
        location: lead.address || [lead.city, lead.state].filter(Boolean).join(", "),
      }));

      // Sort newest first
      const sorted = mappedLeads.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLeads(sorted);
      
      // Sync activities state
      const initialActivities = {};
      sorted.forEach(lead => {
        if (lead.activities) {
          initialActivities[lead._id || lead.id] = lead.activities;
        }
      });
      setActivities(initialActivities);
    } catch (err) {
      console.error("Failed to load validation leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const crmSession = sessionStorage.getItem("crm_panel_session");
      if (crmSession) {
        const parsed = JSON.parse(crmSession);
        if (parsed?.user?.zone) {
          setMyZone(parsed.user.zone);
        }
      }
    } catch {
      // Ignore parse failures.
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadLeads();
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [search, location, date]);

  useEffect(() => {
    const loadFses = async () => {
      try {
        const data = await fetchFSEs();
        setFses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load FSE list", err);
      }
    };

    loadFses();
  }, []);

  const handleConvert = async (e, lead) => {
    e.stopPropagation();
    setConfirmAction({ type: "CONVERT", lead });
  };

  const handleForward = async (e, lead) => {
    e.stopPropagation();
    setConfirmAction({ type: "FORWARD", lead });
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

    const lead = confirmAction.lead;
    const leadId = lead._id || lead.id;
    try {
      setActionSubmitting(true);
      await updateLeadStatus(leadId, "CONVERTED");
      setLeads((prev) =>
        prev.map((record) => ((record._id || record.id) === leadId ? { ...record, status: "CONVERTED" } : record))
      );
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to convert lead.");
    } finally {
      setActionSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleAssignLead = async (leadId, fseId) => {
    await assignLeadToFSE(leadId, fseId);
    setShowAssignModal(false);
    setAssignLead(null);
    await loadLeads();
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
    const leadId = selectedLead._id || selectedLead.id;
    try {
      await deleteLeadActivity(leadId, index);
      loadLeads();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Failed to delete activity.");
    }
  };

  const handleActivitySubmit = async (data) => {
    const leadId = selectedLead._id || selectedLead.id;

    try {
      await logLeadActivity(leadId, {
        ...data,
        activityIndex: editingActivityIndex,
        nextFollowUpAt: data.nextFollowUp // The backend expects nextFollowUpAt
      });
      
      setShowActivityModal(false);
      setEditingActivityIndex(null);
      await loadLeads();
      setShowDetailModal(true);
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Failed to log activity.");
    }
  };

  // Using leads directly since filtering is handled by the server
  const displayLeads = leads;

  return (
    <div className="page-section my-leads-page">
      
      {/* Header Area */}
      <section className="my-leads-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Validation Queue</h1>
            <p>Review and approve incoming leads from your team.</p>
          </div>
          <div style={{ 
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
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}>
            <LuCircleAlert size={20} />
            {displayLeads.filter(l => l.status === "FORWARDED" || l.status === "Forwarded").length} Leads Pending Review
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="my-leads-toolbar-card">
        {/* Search Input */}
        <div className="my-leads-search">
          <LuSearch />
          <input 
            type="text" 
            placeholder="Search Company or Lead Generator..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Custom Filters */}
        <div className="my-leads-filter">
          <div className="my-leads-filter-label">
            <LuMapPin size={18} />
            <span>Region:</span>
          </div>
          <select 
            className="filter-chip"
            style={{ appearance: "none", paddingRight: "30px", background: "#edf2f8 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23536e94' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat calc(100% - 10px) 50%" }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All Zones</option>
            <option value="North">North Zone</option>
            <option value="South">South Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
          </select>

          <div className="my-leads-filter-label" style={{ marginLeft: "8px" }}>
            <LuCalendar size={18} />
            <span>Timeline:</span>
          </div>
          <select 
            className="filter-chip"
            style={{ appearance: "none", paddingRight: "30px", background: "#edf2f8 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23536e94' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\") no-repeat calc(100% - 10px) 50%" }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </section>

      {/* Main Content Area */}
      {loading && leads.length === 0 ? (
        <section className="my-leads-table-card">
          <div style={{ padding: "64px 24px", textAlign: "center", color: "#64748b" }}>
            Loading queue...
          </div>
        </section>
      ) : displayLeads.length === 0 ? (
        <section className="my-leads-table-card">
          <div style={{ 
            padding: "64px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px"
          }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              backgroundColor: "#ecfdf5", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "24px"
            }}>
              <LuCircleCheck size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 12px 0" }}>
              All Caught Up!
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, textAlign: "center", maxWidth: "340px", lineHeight: "1.5" }}>
              There are no pending leads to review matching your current filters.
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
                  <th>CONTACT PERSON</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {displayLeads.map((lead, idx) => (
                  <tr key={lead._id || lead.id || idx} className="clickable-row" onClick={() => handleRowClick(lead)}>
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
                        {lead.location || "Dehradun"}
                      </span>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-name">
                          <LuUserRound size={16} />
                          {lead.contactName || "Contact"}
                        </span>
                        <small>{lead.contactEmail}</small>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        {/* Converted Pill */}
                        {(lead.status === "CONVERTED" || lead.status === "Converted") && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: "12px", border: "1px solid #10b981" }}>
                            Converted
                          </span>
                        )}

                        {/* Forwarded/Assigned Pill */}
                        {(lead.status === "ASSIGNED" || lead.status === "Assigned") && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "12px", border: "1px solid #2563eb" }}>
                            Forwarded
                          </span>
                        )}
                        {lead.assignedTo?.fullName && (
                          <small style={{ color: "#334155", fontSize: "0.75rem" }}>
                            Assigned: {lead.assignedTo.fullName}
                          </small>
                        )}

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {/* Convert Button */}
                          {lead.status !== "ASSIGNED" && lead.status !== "Assigned" && (
                            <button
                              title="Convert Lead"
                              onClick={(e) => handleConvert(e, lead)}
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", background: lead.status === "Converted" || lead.status === "CONVERTED" ? "#ecfdf5" : "#f8fafc", color: "#10b981", fontSize: "0.75rem", fontWeight: 600, cursor: lead.status === "Converted" || lead.status === "CONVERTED" ? "default" : "pointer", opacity: lead.status === "Converted" || lead.status === "CONVERTED" ? 0.6 : 1, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                              disabled={lead.status === "Converted" || lead.status === "CONVERTED"}
                            >
                              <LuRefreshCw size={14} />
                              Convert
                            </button>
                          )}

                          {/* Forward Button */}
                          {lead.status !== "CONVERTED" && lead.status !== "Converted" && (
                            <button
                              title="Forward"
                              onClick={(e) => handleForward(e, lead)}
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", background: lead.status === "ASSIGNED" || lead.status === "Assigned" ? "#eff6ff" : "#f8fafc", color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, cursor: lead.status === "ASSIGNED" || lead.status === "Assigned" ? "default" : "pointer", opacity: lead.status === "ASSIGNED" || lead.status === "Assigned" ? 0.6 : 1, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                              disabled={lead.status === "ASSIGNED" || lead.status === "Assigned"}
                            >
                              <LuSend size={14} />
                              {lead.status === "ASSIGNED" || lead.status === "Assigned" ? "Forwarded" : "Forward"}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          activities={activities[selectedLead._id || selectedLead.id] || []}
          onClose={() => setShowDetailModal(false)}
          onLogActivity={handleLogActivity}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      )}

      {showActivityModal && selectedLead && (
        <LogActivityModal
          lead={selectedLead}
          initialData={editingActivityIndex !== null ? activities[selectedLead?._id || selectedLead?.id]?.[editingActivityIndex] : null}
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivityIndex(null);
            setShowDetailModal(true);
          }}
          onSubmit={handleActivitySubmit}
        />
      )}

      {showAssignModal && assignLead && (
        <AssignFseModal
          lead={assignLead}
          fses={fses}
          myZone={myZone}
          onClose={() => {
            setShowAssignModal(false);
            setAssignLead(null);
          }}
          onSubmit={handleAssignLead}
        />
      )}

      <ActionConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === "CONVERT" ? "Confirm Conversion" : "Confirm Forward"}
        message={
          confirmAction?.type === "CONVERT"
            ? `Convert lead for ${confirmAction?.lead?.companyName || "this company"}?`
            : `Forward lead for ${confirmAction?.lead?.companyName || "this company"} and continue assignment?`
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
