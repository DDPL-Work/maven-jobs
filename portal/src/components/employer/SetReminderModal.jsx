import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import './SetReminderModal.css';

// Default templates mapped from the dropdown selection
const DEFAULT_DESCRIPTIONS = {
  "For call later": "Call this candidate later",
  "For interview follow up": "Schedule an interview with this candidate",
  "For sending JD": "Send job description to this candidate",
  "For other task": ""
};

const toLocalISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const SetReminderModal = ({ isOpen, onClose, initialType, candidate, onSubmit }) => {
  const [type, setType] = useState(initialType || "For other task");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mailCalendarEvent, setMailCalendarEvent] = useState(false);
  const [loading, setLoading] = useState(false);

  // When modal opens, prefill defaults
  useEffect(() => {
    if (isOpen) {
      const activeType = initialType || "For other task";
      setType(activeType);
      setDescription(DEFAULT_DESCRIPTIONS[activeType] || "");
      setDate(toLocalISODate(new Date(Date.now() + 86400000))); // Default to tomorrow
      setTime("09:00");
      setMailCalendarEvent(true);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handlePillClick = (newType) => {
    setType(newType);
    setDescription(DEFAULT_DESCRIPTIONS[newType] || "");
  };

  const handleDatePillClick = (days) => {
    setDate(toLocalISODate(new Date(Date.now() + days * 86400000)));
  };

  const handleSubmit = async () => {
    if (!description.trim() || !date || !time) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const combinedDateTime = new Date(`${date}T${time}`);
      await onSubmit({
        type,
        description,
        date: combinedDateTime.toISOString(),
        mailCalendarEvent
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error setting reminder");
    } finally {
      setLoading(false);
    }
  };

  const titleString = type.toLowerCase().startsWith("for ") ? `Remind me ${type.toLowerCase()}` : `Remind me for ${type.toLowerCase()}`;

  const modalContent = (
    <div className="srm-overlay" onClick={onClose}>
      <div className="srm-modal" onClick={e => e.stopPropagation()}>
        <button className="srm-close" onClick={onClose}>
          <FiX size={20} />
        </button>

        <h2 className="srm-title">{titleString}</h2>

        <div className="srm-body">
          <div className="srm-group">
            <label className="srm-label">Description</label>
            <input 
              type="text" 
              className="srm-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What do you need to be reminded of?" 
            />
            <div className="srm-pills">
              <button type="button" className={`srm-pill ${type === 'For call later' ? 'active' : ''}`} onClick={() => handlePillClick('For call later')}>Call later</button>
              <button type="button" className={`srm-pill ${type === 'For interview follow up' ? 'active' : ''}`} onClick={() => handlePillClick('For interview follow up')}>Interview</button>
              <button type="button" className={`srm-pill ${type === 'For sending JD' ? 'active' : ''}`} onClick={() => handlePillClick('For sending JD')}>Send job description</button>
            </div>
          </div>

          <div className="srm-row">
            <div className="srm-group" style={{ flex: 1 }}>
              <label className="srm-label">Date</label>
              <div className="srm-input-wrap">
                <FiCalendar className="srm-icon" />
                <input 
                  type="date" 
                  className="srm-input srm-input-icon" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  min={toLocalISODate()}
                />
              </div>
              <div className="srm-pills">
                <button type="button" className="srm-pill" onClick={() => handleDatePillClick(1)}>Tomorrow</button>
                <button type="button" className="srm-pill" onClick={() => handleDatePillClick(2)}>In 2 days</button>
              </div>
            </div>

            <div className="srm-group" style={{ flex: 1 }}>
              <label className="srm-label">Time</label>
              <div className="srm-input-wrap">
                <FiClock className="srm-icon" />
                <input 
                  type="time" 
                  className="srm-input srm-input-icon" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="srm-footer">
          <div className="srm-footer-left">
            <button className="srm-btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Set Reminder"}
            </button>
            <button className="srm-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
          <label className="srm-checkbox-label">
            <input 
              type="checkbox" 
              checked={mailCalendarEvent} 
              onChange={e => setMailCalendarEvent(e.target.checked)} 
            />
            Mail calendar event to me
          </label>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SetReminderModal;
