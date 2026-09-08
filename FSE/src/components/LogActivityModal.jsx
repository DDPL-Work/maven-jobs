import { useEffect, useState } from "react";
import { LuCircleCheck, LuChevronDown, LuX } from "react-icons/lu";

const STATUS_OPTIONS = [
  "Interested",
  "Not Interested",
  "Not Picked",
  "Onboard",
  "Call Later",
  "New",
];

const SUB_STATUS_MAP = {
  "Interested": [
    "Need Demo",
    "Package Explained",
    "Meeting Scheduled",
    "Positive Response",
    "Callback Requested"
  ],
  "Not Interested": [
    "Already Using",
    "Budget Issue",
    "Not Relevant",
    "No Requirement",
    "Refused to talk"
  ],
  "Not Picked": [
    "Switch Off",
    "Busy / Declined",
    "Call Disconnected",
    "Ringing No Response",
    "Wrong Number"
  ],
  "Onboard": [
    "Document Collected",
    "Payment Pending",
    "Onboarded Successfully",
    "Forwarded to SM"
  ],
  "Call Later": [
    "Next Week",
    "After 2 Days",
    "Call in Evening",
    "Busy right now"
  ],
  "New": [
    "Untouched",
    "Data Verified"
  ]
};

const toDateInput = (value) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

export default function LogActivityModal({ lead, initialData, onClose, onSubmit, isSubmitting }) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [interactionMode, setInteractionMode] = useState("Call");
  const [date, setDate] = useState(toDateInput(new Date()));

  useEffect(() => {
    if (initialData) {
      setOutcome(initialData.outcome || "");
      setNotes(initialData.notes || "");
      setSubStatus(initialData.subStatus || "");
      setNextFollowUpAt(toDateInput(initialData.nextFollowUpAt));
      setInteractionMode(initialData.interactionMode || "Call");
      setDate(toDateInput(initialData.date || new Date()));
      return;
    }

    setOutcome("");
    setNotes("");
    setSubStatus("");
    setNextFollowUpAt("");
    setInteractionMode("Call");
    setDate(toDateInput(new Date()));
  }, [initialData]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      outcome,
      notes,
      subStatus,
      nextFollowUpAt: nextFollowUpAt || null,
      interactionMode,
      date: date || null,
    });
  };

  return (
    <div className="modal-overlay log-activity-overlay" onClick={onClose}>
      <div className="modal-content log-activity-modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="header-info">
            <h2>{initialData ? "Edit Follow-up" : "Log Follow-up"}</h2>
            <p>{lead?.companyName || "Lead"}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <LuX />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="activity-outcome">STATUS</label>
            <div className="select-container">
              <select
                id="activity-outcome"
                value={outcome}
                onChange={(event) => {
                  setOutcome(event.target.value);
                  setSubStatus(""); // Reset sub-status when main status changes
                }}
                className="form-select"
                required
              >
                <option value="">Select Status...</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <LuChevronDown className="select-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="activity-substatus">SUB STATUS</label>
            <div className="select-container">
              <select
                id="activity-substatus"
                value={subStatus}
                onChange={(event) => setSubStatus(event.target.value)}
                className="form-select"
                disabled={!outcome}
              >
                <option value="">Select Sub Status...</option>
                {outcome && SUB_STATUS_MAP[outcome]?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <LuChevronDown className="select-icon" />
            </div>
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="activity-mode">INTERACTION MODE</label>
              <div className="select-container">
                <select
                  id="activity-mode"
                  value={interactionMode}
                  onChange={(event) => setInteractionMode(event.target.value)}
                  className="form-select"
                  required
                >
                  <option value="Call">Call</option>
                  <option value="Visit">Visit</option>
                </select>
                <LuChevronDown className="select-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="activity-date">ACTIVITY DATE</label>
              <input
                id="activity-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="activity-notes">MEETING NOTES</label>
            <textarea
              id="activity-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="form-textarea"
              placeholder="Key takeaways, client response, and next steps..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="activity-next-followup">NEXT FOLLOW-UP</label>
            <input
              id="activity-next-followup"
              type="date"
              value={nextFollowUpAt}
              onChange={(event) => setNextFollowUpAt(event.target.value)}
              className="form-input"
            />
          </div>

          <footer className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn submit-log-btn" disabled={isSubmitting}>
              <LuCircleCheck /> {isSubmitting ? "Saving..." : initialData ? "Update Log" : "Submit Log"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
