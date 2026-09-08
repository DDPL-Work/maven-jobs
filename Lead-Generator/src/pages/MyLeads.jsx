import { useEffect, useState } from "react";
import {
  LuBuilding2,
  LuCalendarDays,
  LuLoaderCircle,
  LuMapPin,
  LuSearch,
  LuUserRound,
  LuRefreshCw,
  LuSend
} from "react-icons/lu";
import { fetchLeads, updateLeadStatus, logLeadActivity, deleteLeadActivity, addLeadContact } from "../api/leadApi";
import LeadDetailModal from "../components/LeadDetailModal";
import LogActivityModal from "../components/LogActivityModal";
import ContactPickerModal from "../components/ContactPickerModal";
import ActionConfirmModal from "../components/ActionConfirmModal";
import AddContactModal from "../components/AddContactModal";

const TIMELINE_FILTERS = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

const formatStatus = (status = "") => {
  if (["QUALIFIED", "WON"].includes(status)) {
    return "Approved";
  }

  if (status === "LOST") {
    return "Rejected";
  }

  if (status === "CONVERTED") {
    return "Converted";
  }

  if (status === "FORWARDED") {
    return "Forwarded";
  }

  return "Pending";
};

const formatLocation = (lead) => {
  if (lead.address && String(lead.address).trim().toLowerCase() !== "unknown") {
    return lead.address;
  }

  const parts = [lead.city, lead.state]
    .map((item) => String(item || "").trim())
    .filter((item) => item && item.toLowerCase() !== "unknown");

  return parts.length ? parts.join(", ") : "Location not available";
};

const getLeadContacts = (lead = {}) => {
  const contacts = Array.isArray(lead.contacts)
    ? lead.contacts
        .map((contact) => ({
          fullName: String(contact?.fullName || "").trim(),
          phone: String(contact?.phone || "").trim(),
          email: String(contact?.email || "").trim(),
        }))
        .filter((contact) => contact.fullName || contact.phone || contact.email)
    : [];

  if (contacts.length) {
    return contacts;
  }

  const fallback = {
    fullName: String(lead.contactName || "").trim(),
    phone: String(lead.phone || "").trim(),
    email: String(lead.contactEmail || lead.email || "").trim(),
  };

  return fallback.fullName || fallback.phone || fallback.email ? [fallback] : [];
};

const normalizeActivityContact = (contact = {}) => {
  const normalized = {
    fullName: String(contact?.fullName || contact?.contactName || "").trim(),
    phone: String(contact?.phone || "").trim(),
    email: String(contact?.email || "").trim(),
  };

  return normalized.fullName || normalized.phone || normalized.email ? normalized : null;
};

const mapLeadForRow = (lead) => ({
  ...lead,
  id: lead.id,
  companyName: lead.companyName || "Unknown company",
  location: formatLocation(lead),
  contactName: lead.contactName || "Unknown contact",
  contactEmail: lead.email || "-",
  status: formatStatus(lead.status),
  phone: lead.phone || "Not provided",
  category: lead.businessCategory || "Unknown",
  contacts: getLeadContacts(lead),
  activities: Array.isArray(lead.activities) ? lead.activities : [],
});

export default function MyLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [availableZones, setAvailableZones] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContactPickerModal, setShowContactPickerModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [activities, setActivities] = useState({});
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const [selectedActivityContact, setSelectedActivityContact] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    let mounted = true;

    const loadLeads = async () => {
      try {
        setLoadingRows(true);
        const response = await fetchLeads({
          page: 1,
          limit: 50,
          search: debouncedSearch,
          zone: zoneFilter,
          date: dateFilter,
        });

        if (!mounted) {
          return;
        }

        const mappedRows = (response.items || []).map(mapLeadForRow);

        setRows(mappedRows);

        const dynamicZones = Array.isArray(response?.filters?.availableZones)
          ? response.filters.availableZones.filter((zone) => String(zone || "").trim())
          : [];
        const fallbackZones = Array.from(
          new Set(
            mappedRows
              .map((lead) => lead.createdBy?.zone)
              .filter((zone) => String(zone || "").trim()),
          ),
        );
        setAvailableZones(dynamicZones.length ? dynamicZones : fallbackZones);
        
        // Sync activities state
        const initialActivities = {};
        mappedRows.forEach(lead => {
          if (lead.activities) {
            initialActivities[lead._id || lead.id] = lead.activities;
          }
        });
        setActivities(initialActivities);

        setError("");
      } catch (requestError) {
        if (mounted) {
          setRows([]);
          setError(requestError.response?.data?.message || "Unable to load leads.");
        }
      } finally {
        if (mounted) {
          setLoadingRows(false);
        }
      }
    };

    loadLeads();

    return () => {
      mounted = false;
    };
  }, [debouncedSearch, zoneFilter, dateFilter]);

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleLogActivity = (lead) => {
    const leadContacts = getLeadContacts(lead);
    if (!leadContacts.length) {
      alert("No contact found for this lead.");
      return;
    }

    setEditingActivityIndex(null);
    setSelectedActivityContact(null);
    setShowDetailModal(false);

    if (leadContacts.length === 1) {
      setSelectedActivityContact(leadContacts[0]);
      setShowActivityModal(true);
      return;
    }

    setShowContactPickerModal(true);
  };

  const handleSelectActivityContact = (contact) => {
    setSelectedActivityContact(contact);
    setShowContactPickerModal(false);
    setShowActivityModal(true);
  };

  const handleEditActivity = (index) => {
    const leadId = selectedLead?._id || selectedLead?.id;
    const existingActivity = activities[leadId]?.[index];
    const fallbackContact = getLeadContacts(selectedLead)[0] || null;

    setEditingActivityIndex(index);
    setSelectedActivityContact(normalizeActivityContact(existingActivity?.contact) || fallbackContact);
    setShowDetailModal(false);
    setShowContactPickerModal(false);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = async (index) => {
    const leadId = selectedLead._id || selectedLead.id;
    try {
      const updatedLead = await deleteLeadActivity(leadId, index);
      const mappedLead = mapLeadForRow(updatedLead);

      setActivities((prev) => ({
        ...prev,
        [leadId]: mappedLead.activities,
      }));
      setRows((prev) => prev.map((row) => (row.id === mappedLead.id ? { ...row, ...mappedLead } : row)));
      setSelectedLead((current) => (current?.id === mappedLead.id ? { ...current, ...mappedLead } : current));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete activity.");
    }
  };

  const handleActivitySubmit = async (data) => {
    const leadId = selectedLead._id || selectedLead.id;

    try {
      const updatedLead = await logLeadActivity(leadId, {
        outcome: data.outcome,
        notes: data.notes,
        contact: data.contact,
        activityIndex: editingActivityIndex,
        nextFollowUpAt: data.nextFollowUp || null,
      });
      const mappedLead = mapLeadForRow(updatedLead);

      setShowActivityModal(false);
      setShowContactPickerModal(false);
      setEditingActivityIndex(null);
      setSelectedActivityContact(null);

      setActivities((prev) => ({
        ...prev,
        [leadId]: mappedLead.activities,
      }));
      setRows((prev) => prev.map((row) => (row.id === mappedLead.id ? { ...row, ...mappedLead } : row)));
      setSelectedLead((current) => (current?.id === mappedLead.id ? { ...current, ...mappedLead } : current));
      setShowDetailModal(true);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to log activity.");
    }
  };

  const handleAddContact = (lead) => {
    setShowDetailModal(false);
    setShowAddContactModal(true);
  };

  const handleAddContactSubmit = async (contactData) => {
    const leadId = selectedLead._id || selectedLead.id;
    try {
      const updatedLead = await addLeadContact(leadId, contactData);
      const mappedLead = mapLeadForRow(updatedLead);
      
      setShowAddContactModal(false);
      setRows((prev) => prev.map((row) => (row.id === mappedLead.id ? { ...row, ...mappedLead } : row)));
      setSelectedLead((current) => (current?.id === mappedLead.id ? { ...current, ...mappedLead } : current));
      setShowDetailModal(true);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to add contact.");
    }
  };

  const handleConvert = async (e, lead) => {
    e.stopPropagation();
    setConfirmAction({ type: "CONVERT", lead });
  };

  const handleForward = async (e, lead) => {
    e.stopPropagation();
    setConfirmAction({ type: "FORWARD", lead });
  };

  const handleConfirmStatusAction = async () => {
    if (!confirmAction?.lead?.id) {
      return;
    }

    const nextStatus = confirmAction.type === "CONVERT" ? "CONVERTED" : "FORWARDED";
    const nextStatusLabel = confirmAction.type === "CONVERT" ? "Converted" : "Forwarded";

    try {
      setActionSubmitting(true);
      await updateLeadStatus(confirmAction.lead.id, nextStatus);
      setRows((prev) =>
        prev.map((r) => (r.id === confirmAction.lead.id ? { ...r, status: nextStatusLabel } : r))
      );
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          `Failed to ${confirmAction.type === "CONVERT" ? "convert" : "forward"} lead.`,
      );
    } finally {
      setActionSubmitting(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <h1>My Submitted Leads</h1>
        <p>Track and manage your lead submissions.</p>
      </section>

      <section className="my-leads-toolbar-card">
        <div className="my-leads-search">
          <LuSearch />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search company, contact, phone, lead code..."
          />
        </div>

        <div className="my-leads-zone-time-row">
          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">
              <LuMapPin />
              Region:
            </span>
            <select
              className="my-leads-select-input"
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
            >
              <option value="">All Zones</option>
              {availableZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>

          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">
              <LuCalendarDays />
              Timeline:
            </span>
            <select
              className="my-leads-select-input"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              {TIMELINE_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

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
              {loadingRows ? (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    <span className="loading-block">
                      <LuLoaderCircle className="spin" />
                      Loading leads...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    {error}
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="clickable-row"
                  >
                    <td>
                      <div className="company-cell">
                        <span className="row-icon">
                          <LuBuilding2 />
                        </span>
                        <strong>
                          {lead.companyName}
                          {lead.isStartup && <span className="lead-badge lead-badge-s" title="Startup">S</span>}
                          {lead.masterUnion === "Yes" && <span className="lead-badge lead-badge-m" title="Master Union">M</span>}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <span className="location-cell">
                        <LuMapPin />
                        {lead.location}
                      </span>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-name">
                          <LuUserRound />
                          {lead.contactName}
                        </span>
                        <small>{lead.contactEmail}</small>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        {lead.status === "Converted" && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: "12px", border: "1px solid #10b981" }}>
                            Converted
                          </span>
                        )}
                        {lead.status === "Forwarded" && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "12px", border: "1px solid #2563eb" }}>
                            Forwarded
                          </span>
                        )}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {lead.status !== "Forwarded" && (
                            <button
                              title="Convert Lead"
                              onClick={(e) => handleConvert(e, lead)}
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", background: lead.status === "Converted" ? "#ecfdf5" : "#f8fafc", color: "#10b981", fontSize: "0.75rem", fontWeight: 600, cursor: lead.status === "Converted" ? "default" : "pointer", opacity: lead.status === "Converted" ? 0.6 : 1, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                              disabled={lead.status === "Converted"}
                            >
                              <LuRefreshCw size={14} />
                              Convert
                            </button>
                          )}
                          {lead.status !== "Converted" && (
                            <button
                              title="Forward to State Manager"
                              onClick={(e) => handleForward(e, lead)}
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", background: lead.status === "Forwarded" ? "#eff6ff" : "#f8fafc", color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, cursor: lead.status === "Forwarded" ? "default" : "pointer", opacity: lead.status === "Forwarded" ? 0.6 : 1, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                              disabled={lead.status === "Forwarded"}
                            >
                              <LuSend size={14} />
                              Forward
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    No matching leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showDetailModal && (
        <LeadDetailModal
          lead={selectedLead}
          activities={activities[selectedLead?._id || selectedLead?.id] || []}
          onClose={() => setShowDetailModal(false)}
          onLogActivity={handleLogActivity}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
          onAddContact={handleAddContact}
        />
      )}

      {showAddContactModal && (
        <AddContactModal
          lead={selectedLead}
          onClose={() => {
            setShowAddContactModal(false);
            setShowDetailModal(true);
          }}
          onSubmit={handleAddContactSubmit}
        />
      )}

      {showContactPickerModal && (
        <ContactPickerModal
          lead={selectedLead}
          contacts={getLeadContacts(selectedLead)}
          onClose={() => {
            setShowContactPickerModal(false);
            setShowDetailModal(true);
          }}
          onSelect={handleSelectActivityContact}
        />
      )}

      {showActivityModal && (
        <LogActivityModal
          key={`${selectedLead?._id || selectedLead?.id}-${editingActivityIndex ?? "new"}-${selectedActivityContact?.phone || selectedActivityContact?.email || selectedActivityContact?.fullName || "contact"}`}
          lead={selectedLead}
          initialData={editingActivityIndex !== null ? activities[selectedLead?._id || selectedLead?.id]?.[editingActivityIndex] : null}
          activityContact={selectedActivityContact}
          onClose={() => {
            setShowActivityModal(false);
            setShowContactPickerModal(false);
            setEditingActivityIndex(null);
            setSelectedActivityContact(null);
            setShowDetailModal(true); // Reopen detail modal on cancel
          }}
          onSubmit={handleActivitySubmit}
        />
      )}

      <ActionConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === "CONVERT" ? "Confirm Conversion" : "Confirm Forward"}
        message={
          confirmAction?.type === "CONVERT"
            ? `Convert lead for ${confirmAction?.lead?.companyName || "this company"}?`
            : `Forward lead for ${confirmAction?.lead?.companyName || "this company"} to the next stage?`
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
