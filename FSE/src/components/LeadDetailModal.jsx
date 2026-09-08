import {
  LuBuilding2,
  LuCalendar,
  LuCalendarDays,
  LuChartNoAxesCombined,
  LuCircleCheck,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuSend,
  LuTrash2,
  LuUserRound,
  LuX,
  LuBriefcase,
  LuStar,
  LuMessageSquare,
  LuClock,
} from "react-icons/lu";

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PROJECTION_COLOR = {
  "WP > 50": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "WP < 50": { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  "MP < 50": { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  "MP > 50": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

export default function LeadDetailModal({
  lead,
  activities = [],
  onClose,
  onLogActivity,
  onEditActivity,
  onDeleteActivity,
  onEditLead,
  onTransferToSM,
}) {
  if (!lead) return null;

  const contactList = Array.isArray(lead.contacts) && lead.contacts.length
    ? lead.contacts
    : [{ fullName: lead.contactName, phone: lead.phone, email: lead.email, designation: "", isPrimary: true }];

  const projStyle = lead.projection ? PROJECTION_COLOR[lead.projection] : null;

  return (
    <div className="modal-overlay ldm-premium-overlay" onClick={onClose}>
      <div className="modal-content ldm-premium-content" onClick={(e) => e.stopPropagation()}>
        
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="ldm-header">
          <div className="ldm-header-main">
            <div className={`ldm-status-indicator status-${lead.status?.toLowerCase() || 'new'}`} />
            <div className="ldm-title-area">
              <div className="ldm-company-row">
                <h2 className="ldm-company-name">{lead.companyName}</h2>
                {lead.clientType === "Premium" && (
                  <span className="ldm-premium-tag"><LuStar size={12} fill="currentColor" /> Premium</span>
                )}
                {lead.clientType === "Standard" && (
                  <span className="ldm-standard-tag"><LuStar size={12} fill="currentColor" /> Standard</span>
                )}
              </div>
              <p className="ldm-lead-code">{lead.leadCode} • {lead.businessCategory}</p>
            </div>
          </div>
          
          <div className="ldm-header-actions">
            {lead.status === "CONVERTED" && (
              <button 
                className="ldm-action-btn btn-transfer"
                onClick={() => onTransferToSM(lead)}
                title="Transfer to State Manager"
              >
                <LuSend size={16} />
                <span>Transfer to SM</span>
              </button>
            )}
            <button 
              className="ldm-action-btn btn-edit"
              onClick={() => onEditLead(lead)}
              title="Edit Lead Details"
            >
              <LuPencil size={16} />
              <span>Edit</span>
            </button>
            <button className="ldm-close-btn" onClick={onClose}><LuX size={20} /></button>
          </div>
        </header>

        <div className="ldm-body-wrapper">
          {/* ── Left Column: Core Info ────────────────────────────────── */}
          <aside className="ldm-sidebar">
            <div className="ldm-section">
              <h3 className="ldm-section-title">Lead Information</h3>
              <div className="ldm-info-grid">
                <div className="ldm-info-item">
                  <span className="ldm-label"><LuBriefcase /> Sourced By</span>
                  <p className="ldm-value">{lead.sourcedBy || "Self"}</p>
                </div>
                <div className="ldm-info-item">
                  <span className="ldm-label"><LuCalendarDays /> Sourcing Date</span>
                  <p className="ldm-value">{formatDateOnly(lead.sourcingDate)}</p>
                </div>
                <div className="ldm-info-item">
                  <span className="ldm-label"><LuChartNoAxesCombined /> Projection</span>
                  <p className="ldm-value">
                    {lead.projection ? (
                      <span className="ldm-proj-badge" style={projStyle ? {
                        background: projStyle.bg,
                        color: projStyle.color,
                        borderColor: projStyle.border
                      } : {}}>{lead.projection}</span>
                    ) : "—"}
                  </p>
                </div>
                <div className="ldm-info-item full-width">
                  <span className="ldm-label"><LuMapPin /> Location</span>
                  <p className="ldm-value">{lead.address}</p>
                  <p className="ldm-sub-value">{lead.city}, {lead.state}</p>
                </div>
              </div>
            </div>

            <div className="ldm-section">
              <h3 className="ldm-section-title">Contact Persons</h3>
              <div className="ldm-contacts">
                {contactList.map((c, i) => (
                  <div key={i} className={`ldm-contact-card ${c.isPrimary ? 'is-primary' : ''}`}>
                    <div className="ldm-contact-header">
                      <LuUserRound size={14} />
                      <span className="ldm-contact-name">{c.fullName}</span>
                      {c.isPrimary && <span className="ldm-tag-primary">Primary</span>}
                    </div>
                    {c.designation && <p className="ldm-contact-role">{c.designation}</p>}
                    <div className="ldm-contact-links">
                      {c.phone && <a href={`tel:${c.phone}`}><LuPhone size={12} /> {c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`}><LuMail size={12} /> Email</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {lead.tnc && (
              <div className="ldm-section ldm-tnc-section">
                <h3 className="ldm-section-title">Onboarding Terms (TNC)</h3>
                <div className="ldm-tnc-content">
                  <LuMessageSquare size={14} />
                  <p>{lead.tnc}</p>
                </div>
              </div>
            )}
          </aside>

          {/* ── Right Column: Activity Timeline ────────────────────────── */}
          <main className="ldm-main">
            <div className="ldm-section-header">
              <h3 className="ldm-section-title">Activity Timeline</h3>
              <button className="ldm-add-activity-btn" onClick={() => onLogActivity(lead)}>
                <LuCircleCheck size={14} /> Log Activity
              </button>
            </div>

            <div className="ldm-timeline">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="ldm-timeline-item">
                    <div className="ldm-timeline-marker">
                      <div className="ldm-marker-circle" />
                      {index < activities.length - 1 && <div className="ldm-marker-line" />}
                    </div>
                    <div className="ldm-timeline-content">
                      <div className="ldm-timeline-header">
                        <div className="ldm-outcome-row">
                          <span className="ldm-outcome">{activity.outcome}</span>
                          {activity.interactionMode && (
                            <span className="ldm-mode-badge">
                              {activity.interactionMode === "Call" ? <LuPhone size={10} /> : <LuMapPin size={10} />}
                              {activity.interactionMode}
                            </span>
                          )}
                        </div>
                        <div className="ldm-timeline-actions">
                          <button onClick={() => onEditActivity(index)}><LuPencil size={12} /></button>
                          <button onClick={() => onDeleteActivity(index)} className="btn-delete"><LuTrash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="ldm-time-row">
                        <LuClock size={12} />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      {activity.subStatus && (
                        <div className="ldm-substatus-tag">
                          <span>Sub Status:</span> {activity.subStatus}
                        </div>
                      )}
                      <p className="ldm-activity-notes">{activity.notes}</p>
                      {activity.nextFollowUpAt && (
                        <div className="ldm-next-follow">
                          <LuCalendar size={12} />
                          <span>Next Follow-up: {formatDate(activity.nextFollowUpAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="ldm-empty-timeline">
                  <LuMessageSquare size={40} />
                  <p>No activity history available for this lead.</p>
                  <span>Log your first interaction to start the timeline.</span>
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="ldm-footer">
          <p>Last updated: {formatDate(lead.updatedAt)}</p>
          <button className="ldm-close-footer-btn" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
