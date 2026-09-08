import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuMapPin, 
  LuCalendar,
  LuBuilding2,
  LuUserRound,
  LuRefreshCw,
  LuActivity,
  LuFilter,
  LuEye,
  LuPlus,
  LuPencil,
  LuTrash2,
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

export default function LeadgenQueue() {
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
  
  // Activities state
  const [activities, setActivities] = useState({});

  // Filters
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await fetchLeads({ search, date, sourceRole: "LEAD_GENERATOR" });
      let leadsArray = Array.isArray(data) ? data : (data?.leads || data?.data || []);
      
      const mappedLeads = leadsArray.map(lead => ({
        ...lead,
        id: lead._id || lead.id,
        category: lead.businessCategory || "Unknown",
        contactEmail: lead.email || "-",
        location: lead.address || [lead.city, lead.state].filter(Boolean).join(", "),
      }));

      setLeads(mappedLeads);
      
      const initialActivities = {};
      mappedLeads.forEach(lead => {
        if (lead.activities) {
          initialActivities[lead._id || lead.id] = lead.activities;
        }
      });
      setActivities(initialActivities);
    } catch (err) {
      console.error("Failed to load Leadgen leads", err);
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
    }, 500);
    return () => clearTimeout(handler);
  }, [search, date]);

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

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };
  
  const handleLogActivity = (lead) => {
    setSelectedLead(lead);
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
        activityIndex: editingActivityIndex
      });
      setShowActivityModal(false);
      setEditingActivityIndex(null);
      await loadLeads();
      setShowDetailModal(true);
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Failed to log activity.");
    }
  };

  const handleForward = (lead) => {
    setAssignLead(lead);
    setShowAssignModal(true);
  };

  const handleAssignLead = async (leadId, fseId) => {
    await assignLeadToFSE(leadId, fseId);
    setShowAssignModal(false);
    setAssignLead(null);
    await loadLeads();
  };

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#1e3a8a", margin: 0 }}>Leadgen Queue</h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.95rem" }}>Review and transfer leads forwarded by your Lead Generation team.</p>
          </div>
          <div style={{ 
            backgroundColor: "#fff7ed", 
            border: "1px solid #fed7aa",
            color: "#c2410c", 
            padding: "8px 16px", 
            borderRadius: "10px",
            display: "flex", 
            alignItems: "center",
            gap: "8px",
            fontSize: "0.9rem",
            fontWeight: "700"
          }}>
            <LuActivity size={18} />
            {leads.filter(l => l.status === "FORWARDED").length} Pending Review
          </div>
        </div>
      </section>

      <section className="my-leads-toolbar-card" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        gap: "20px", 
        background: "#fff", 
        padding: "16px", 
        borderRadius: "12px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: "24px",
        border: "1px solid #e2e8f0"
      }}>
        <div className="my-leads-search" style={{ flex: 1, position: "relative" }}>
          <LuSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search Company, Leadgen or Code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 40px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
          />
        </div>

        <div className="my-leads-filter" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
            <LuFilter size={16} />
            <span>Timeline:</span>
          </div>
          <select 
            className="filter-chip"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}
          >
            <option value="">Recent Leads</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </section>

      {loading && leads.length === 0 ? (
        <div style={{ padding: "100px", textAlign: "center", color: "#94a3b8" }}>
          <LuRefreshCw className="animate-spin" size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <p>Loading queue...</p>
        </div>
      ) : (
        <section className="my-leads-table-card" style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div className="table-wrap">
            <table className="my-leads-table" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1" }}>
              <thead style={{ background: "#1e3a8a", color: "#fff" }}>
                <tr>
                  <th colSpan="3" style={{ padding: "14px 24px", textAlign: "center", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>Basic Information</th>
                  <th colSpan="4" style={{ padding: "14px 24px", textAlign: "center", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>Source Information</th>
                  <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>Action</th>
                </tr>
                <tr style={{ background: "#2563eb", color: "#fff", fontSize: "0.65rem" }}>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Creation Date</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Company & Category</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Location & State</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Source (Leadgen)</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Contact Person</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Phone</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: "800", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Status</th>
                  <th style={{ padding: "12px 24px", textAlign: "center", fontWeight: "800", textTransform: "uppercase" }}></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  return (
                    <tr key={lead.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }}>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#334155", borderRight: "1px solid #e2e8f0" }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 24px", borderRight: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ color: "#1e40af", fontSize: "0.9rem", fontWeight: "800" }}>{lead.companyName}</strong>
                        </div>
                        <small style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: "700" }}>{lead.category}</small>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#64748b", borderRight: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <LuMapPin size={12} style={{ color: "#94a3b8" }} /> {lead.city}, {lead.state}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                        {lead.createdBy?.fullName || "Leadgen"}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                        {lead.contactName}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#475569", borderRight: "1px solid #e2e8f0" }}>
                        {lead.phone}
                      </td>
                      <td style={{ padding: "16px 24px", borderRight: "1px solid #e2e8f0" }}>
                        <span style={{ 
                          fontSize: "0.7rem", 
                          fontWeight: "800", 
                          color: lead.status === "FORWARDED" ? "#ea580c" : "#10b981", 
                          background: lead.status === "FORWARDED" ? "#fff7ed" : "#ecfdf5", 
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          border: `1px solid ${lead.status === "FORWARDED" ? "#ea580c" : "#10b981"}`,
                          textTransform: "uppercase" 
                        }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                          <button 
                            onClick={() => handleRowClick(lead)}
                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", transition: "all 0.2s" }}
                            title="View"
                          >
                            <LuEye size={16} />
                          </button>
                          <button 
                            onClick={() => handleLogActivity(lead)}
                            style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", transition: "all 0.2s" }}
                            title="Log Activity"
                          >
                            <LuPlus size={16} />
                          </button>
                          <button 
                            onClick={() => handleForward(lead)}
                            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", transition: "all 0.2s" }}
                            title="Transfer to FSE"
                          >
                            <LuSend size={16} />
                          </button>
                          <button 
                            onClick={() => {/* Handle Delete */}}
                            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", transition: "all 0.2s" }}
                            title="Delete"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          activities={activities[selectedLead.id] || []}
          onClose={() => setShowDetailModal(false)}
          onLogActivity={() => handleLogActivity(selectedLead)}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
          isManager={true}
        />
      )}

      {showActivityModal && selectedLead && (
        <LogActivityModal
          lead={selectedLead}
          initialData={editingActivityIndex !== null ? activities[selectedLead.id]?.[editingActivityIndex] : null}
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
    </div>
  );
}
