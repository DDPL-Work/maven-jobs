import React, { useState } from "react";
import { LuX, LuUserPlus } from "react-icons/lu";

export default function AddContactModal({ lead, onClose, onSubmit }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ fullName, phone, email, designation, isPrimary });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content log-activity-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
           <div className="header-info">
              <h2>Add Contact Person</h2>
              <p>{lead?.companyName || 'Lead Company'}</p>
           </div>
           <button className="close-btn" onClick={onClose}>
             <LuX />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">FULL NAME *</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              required
              placeholder="Contact Name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">PHONE *</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              required
              placeholder="Phone Number"
            />
          </div>

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Email Address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">DESIGNATION</label>
            <input 
              type="text" 
              value={designation} 
              onChange={(e) => setDesignation(e.target.value)}
              className="form-input"
              placeholder="e.g. HR Manager"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
             <input type="checkbox" id="primary-contact" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
             <label htmlFor="primary-contact" style={{ margin: 0, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Set as Primary Contact</label>
          </div>

          <footer className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="primary-btn submit-log-btn" disabled={submitting}>
              <LuUserPlus /> {submitting ? 'Adding...' : 'Add Contact'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
