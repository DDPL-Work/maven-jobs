import React, { useState } from "react";
import { LuCircleCheck, LuChevronDown, LuMail, LuPhone, LuUserRound, LuX } from "react-icons/lu";

const normalizeContact = (contact = {}) => ({
  fullName: String(contact?.fullName || contact?.contactName || "").trim(),
  phone: String(contact?.phone || "").trim(),
  email: String(contact?.email || "").trim(),
});

const LogActivityModal = ({ lead, initialData, activityContact, onClose, onSubmit }) => {
  const [outcome, setOutcome] = useState(initialData?.outcome || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [subStatus, setSubStatus] = useState(initialData?.subStatus || "");
  const [franchiseStatus, setFranchiseStatus] = useState(initialData?.franchiseStatus || "");
  const [nextFollowUp, setNextFollowUp] = useState(initialData?.nextFollowUpAt || initialData?.nextFollowUp || "");

  const resolvedContact = normalizeContact(activityContact || initialData?.contact || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ outcome, notes, subStatus, franchiseStatus, nextFollowUp, contact: resolvedContact });
  };

  return (
    <div className="modal-overlay log-activity-overlay" onClick={onClose}>
      <div className="modal-content log-activity-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
           <div className="header-info">
              <h2>{initialData ? 'Edit Activity' : 'Log Activity'}</h2>
              <p>{lead?.companyName || 'Lead Company'}</p>
           </div>
           <button className="close-btn" onClick={onClose}>
             <LuX />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="activity-contact-banner">
            <p className="activity-contact-title">Logging for contact</p>
            <div className="activity-contact-grid">
              <span><LuUserRound /> {resolvedContact.fullName || "Unknown Contact"}</span>
              <span><LuPhone /> {resolvedContact.phone || "Phone not available"}</span>
              <span><LuMail /> {resolvedContact.email || "Email not available"}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">STATUS</label>
            <div className="select-container">
              <select 
                value={outcome} 
                onChange={(e) => setOutcome(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Status...</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Not Picked">Not Picked</option>
                <option value="Onboard">Onboard</option>
                <option value="Call Later">Call Later</option>
                <option value="New">New</option>
              </select>
              <LuChevronDown className="select-icon" />
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="form-label">Sub Status</label>
              <div className="select-container">
                <select 
                  value={subStatus} 
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="" disabled>Select Sub Status</option>
                  <option value="2nd time not picked">2nd time not picked</option>
                  <option value="Contract Share">Contract Share</option>
                  <option value="Enough Vendor Empanelment">Enough Vendor Empanelment</option>
                  <option value="Hiring Sealed">Hiring Sealed</option>
                  <option value="Manager Ask">Manager Ask</option>
                  <option value="Meeting Align">Meeting Align</option>
                  <option value="Misaligned T&C">Misaligned T&C</option>
                  <option value="Not Right Person">Not Right Person</option>
                  <option value="Official Mail Ask">Official Mail Ask</option>
                  <option value="Reference Ask">Reference Ask</option>
                  <option value="Self Hiring">Self Hiring</option>
                  <option value="Ready To Visit">Ready To Visit</option>
                  <option value="Callback">Callback</option>
                  <option value="NA">NA</option>
                  <option value="New Lead">New Lead</option>
                </select>
                <LuChevronDown className="select-icon" />
              </div>
            </div>

            <div>
              <label className="form-label">Franchise Status</label>
              <div className="select-container">
                <select 
                  value={franchiseStatus} 
                  onChange={(e) => setFranchiseStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="" disabled>Select Status</option>
                  <option value="All">All</option>
                  <option value="Application Form Share">Application Form Share</option>
                  <option value="No Franchise Discuss">No Franchise Discuss</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Will Think About It">Will Think About It</option>
                  <option value="Form Filled">Form Filled</option>
                  <option value="Form Not Filled">Form Not Filled</option>
                </select>
                <LuChevronDown className="select-icon" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">MEETING NOTES</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Key takeaways, client feedback, next steps..."
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">NEXT FOLLOW-UP</label>
            <div className="input-icon-container">
              <input 
                type="date" 
                value={nextFollowUp} 
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn submit-log-btn">
              <LuCircleCheck /> {initialData ? 'Update Log' : 'Submit Log'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default LogActivityModal;
