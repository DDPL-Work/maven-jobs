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
} from "react-icons/lu";

const LeadDetailModal = ({ lead, activities = [], onClose, onLogActivity, onEditActivity, onDeleteActivity }) => {
  if (!lead) return null;

  const isApproved = lead.status === "Approved";
  const assignedFseName = lead.assignedTo?.fullName || lead.assignedToName || "";
  const showAssignedFse = Boolean(assignedFseName);

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
            </div>
          </section>

          <section className="detail-section">
            <h3>Contact Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label"><LuUserRound /> CONTACT PERSON</span>
                <p className="detail-value">{lead.contactName}</p>
              </div>
              <div className="detail-item">
                <span className="detail-label"><LuPhone /> PHONE</span>
                <p className="detail-value">{lead.phone}</p>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label"><LuMail /> EMAIL</span>
                <p className="detail-value">{lead.contactEmail}</p>
              </div>
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
                    <p className="activity-notes">{activity.notes}</p>
                    {activity.nextFollowUp && (
                      <p className="next-follow-up">
                        <LuCalendar className="calendar-icon" /> Next Follow-up:{" "}
                        {new Date(activity.nextFollowUp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
