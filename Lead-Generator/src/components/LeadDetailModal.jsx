import React from "react";
import {
  LuX,
  LuBuilding2,
  LuMapPin,
  LuUserRound,
  LuPhone,
  LuMail,
  LuCalendar,
  LuCircleCheck,
  LuPencil,
  LuTrash2,
  LuUserPlus,
} from "react-icons/lu";

const getLeadContacts = (lead = {}) => {
  const contacts = Array.isArray(lead.contacts)
    ? lead.contacts
        .map((contact) => ({
          fullName: String(contact?.fullName || "").trim(),
          phone: String(contact?.phone || "").trim(),
          email: String(contact?.email || "").trim(),
          designation: String(contact?.designation || "").trim(),
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

const LeadDetailModal = ({ lead, activities = [], onClose, onLogActivity, onEditActivity, onDeleteActivity, onAddContact }) => {
  if (!lead) return null;

  const isApproved = lead.status === "Approved";
  const assignedFseName = lead.assignedTo?.fullName || lead.assignedToName || "";
  const showAssignedFse = Boolean(assignedFseName);
  const contacts = getLeadContacts(lead);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content lead-detail-modal" onClick={(event) => event.stopPropagation()}>
        <header className={`modal-header ${isApproved ? "header-approved" : "header-pending"}`}>
          <div className="header-info">
            <div className="header-icon-circle">
              <LuBuilding2 />
            </div>
            <div>
              <h2>{isApproved ? "Lead Approved" : "Lead Details"}</h2>
              <p>ID: {lead.id} | {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <LuX />
          </button>
        </header>

        <div className="modal-body">
          {showAssignedFse && (
            <div className="assigned-fse-banner">
              <LuUserRound className="fse-icon" />
              <div>
                <span className="banner-label">ASSIGNED FSE</span>
                <p>Currently assigned to {assignedFseName}</p>
              </div>
            </div>
          )}

          <section className="detail-section">
            <h3>Company Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label"><LuBuilding2 /> COMPANY</span>
                <p className="detail-value">{lead.companyName}</p>
              </div>
              <div className="detail-item">
                <span className="detail-label"><LuBuilding2 /> CATEGORY</span>
                <p className="detail-value">{lead.category}</p>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label"><LuMapPin /> ADDRESS</span>
                <p className="detail-value">{lead.location}</p>
              </div>
              {lead.sourcingDate && (
                <div className="detail-item">
                  <span className="detail-label"><LuCalendar /> SOURCING DATE</span>
                  <p className="detail-value">{new Date(lead.sourcingDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label"><LuBuilding2 /> STARTUP</span>
                <p className="detail-value">{lead.isStartup ? "Yes" : "No"}</p>
              </div>
              {lead.masterUnion && (
                <div className="detail-item">
                  <span className="detail-label"><LuBuilding2 /> MASTER UNION</span>
                  <p className="detail-value">{lead.masterUnion}</p>
                </div>
              )}
              {lead.subStatus && (
                <div className="detail-item">
                  <span className="detail-label"><LuBuilding2 /> SUB STATUS</span>
                  <p className="detail-value">{lead.subStatus}</p>
                </div>
              )}
              {lead.franchiseStatus && (
                <div className="detail-item">
                  <span className="detail-label"><LuBuilding2 /> FRANCHISE STATUS</span>
                  <p className="detail-value">{lead.franchiseStatus}</p>
                </div>
              )}
              {lead.employeeCount && (
                <div className="detail-item">
                  <span className="detail-label"><LuBuilding2 /> COMPANY SIZE</span>
                  <p className="detail-value">{lead.employeeCount}</p>
                </div>
              )}
            </div>
          </section>

          <section className="detail-section">
            <div className="section-header">
              <h3>Contact Details</h3>
              <button className="log-activity-btn" onClick={() => onAddContact && onAddContact(lead)} style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                <LuUserPlus /> Add Contact
              </button>
            </div>
            <div className="lead-contacts-list">
              {contacts.map((contact, index) => (
                <article
                  key={`lead-contact-${index}-${contact.phone || contact.email || contact.fullName}`}
                  className="lead-contact-card"
                >
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label"><LuUserRound /> CONTACT PERSON</span>
                      <p className="detail-value">{contact.fullName || "Not available"}</p>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><LuPhone /> PHONE</span>
                      <p className="detail-value">{contact.phone || "Not available"}</p>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><LuMail /> EMAIL</span>
                      <p className="detail-value">{contact.email || "Not available"}</p>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><LuUserRound /> DESIGNATION</span>
                      <p className="detail-value">{contact.designation || "-"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <div className="section-header">
              <h3>Follow Ups</h3>
              <button className="log-activity-btn" onClick={() => onLogActivity(lead)}>
                <LuCircleCheck /> Log Activity
              </button>
            </div>
            {activities && activities.length > 0 ? (
              <div className="activities-list">
                {activities.map((activity, index) => (
                  <div key={index} className="activity-card">
                    <div className="activity-header">
                      <span className="activity-outcome">{activity.outcome}</span>
                      <div className="activity-header-right">
                        <span className="activity-date">
                          {new Date(activity.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <div className="activity-actions">
                          <button className="action-btn edit-btn" title="Edit" onClick={() => onEditActivity(index)}>
                            <LuPencil />
                          </button>
                          <button className="action-btn delete-btn" title="Delete" onClick={() => onDeleteActivity(index)}>
                            <LuTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                    {activity.subStatus ? (
                      <p className="activity-substatus" style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginTop: "4px", marginBottom: "4px" }}>
                        SubStatus: {activity.subStatus}
                      </p>
                    ) : null}
                    {activity.franchiseStatus ? (
                      <p className="activity-substatus" style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginTop: "0", marginBottom: "4px" }}>
                        Franchise Status: {activity.franchiseStatus}
                      </p>
                    ) : null}
                    <p className="activity-notes">{activity.notes}</p>
                    {activity?.contact?.fullName ? (
                      <p className="activity-contact-name">
                        <LuUserRound /> Followed up with: {activity.contact.fullName}
                      </p>
                    ) : null}
                    {(activity.nextFollowUpAt || activity.nextFollowUp) && (
                      <p className="next-follow-up">
                        <LuCalendar className="calendar-icon" /> Next Follow-up:{" "}
                        {new Date(activity.nextFollowUpAt || activity.nextFollowUp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="follow-up-history">
                <p className="empty-history">No follow-up activities logged yet.</p>
              </div>
            )}
          </section>
        </div>

        <footer className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default LeadDetailModal;
