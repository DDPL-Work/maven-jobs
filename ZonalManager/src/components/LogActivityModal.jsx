import React, { useState, useEffect } from 'react';
import { LuX, LuCircleCheck, LuCalendar, LuMessageSquare, LuChevronDown } from 'react-icons/lu';

const toDatetimeLocal = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const LogActivityModal = ({ lead, initialData, onClose, onSubmit }) => {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  useEffect(() => {
    if (initialData) {
      setOutcome(initialData.outcome || '');
      setNotes(initialData.notes || '');
      setNextFollowUp(toDatetimeLocal(initialData.nextFollowUpAt || initialData.nextFollowUp));
    } else {
      setOutcome("");
      setNotes("");
      setNextFollowUp("");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ outcome, notes, nextFollowUp });
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
          <div className="form-group">
            <label className="form-label">OUTCOME</label>
            <div className="select-container">
              <select 
                value={outcome} 
                onChange={(e) => setOutcome(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Outcome...</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Follow Up Required">Follow Up Required</option>
                <option value="Busy">Busy</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
              <LuChevronDown className="select-icon" />
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
                type="datetime-local" 
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
