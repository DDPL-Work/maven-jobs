import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FiX,
  FiCalendar,
  FiClock,
  FiLink,
  FiFileText,
  FiVideo,
  FiSend,
  FiChevronDown,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiUsers,
  FiCode,
  FiBriefcase,
  FiAward,
  FiDollarSign,
  FiRepeat,
  FiEdit3,
} from 'react-icons/fi';
import authService from '../../services/authService';
import './ScheduleVideoCallModal.css';

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

const OTHER_VALUE = 'other';
const MAX_CUSTOM_REASON = 250;

const REASON_OPTIONS = [
  { value: 'screening', label: 'Initial screening call', description: 'A short introductory conversation', icon: FiPhone },
  { value: 'hr', label: 'HR interview', description: 'Background, expectations and culture fit', icon: FiUsers },
  { value: 'technical', label: 'Technical interview', description: 'Skills assessment and problem solving', icon: FiCode },
  { value: 'managerial', label: 'Managerial round', description: 'Conversation with the hiring manager', icon: FiBriefcase },
  { value: 'final', label: 'Final interview', description: 'The last round before a decision', icon: FiAward },
  { value: 'offer', label: 'Salary and offer discussion', description: 'Compensation, benefits and joining date', icon: FiDollarSign },
  { value: 'followup', label: 'Follow-up discussion', description: 'Clarify open points from a previous round', icon: FiRepeat },
  { value: OTHER_VALUE, label: 'Other', description: 'Write your own reason', icon: FiEdit3 },
];

const INITIAL_FORM = { date: '', time: '', link: '' };

// Local date as YYYY-MM-DD (toISOString would return the UTC date, which can be off by one day)
const toLocalISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatSummary = (date, time) => {
  if (!date || !time) return '';
  const dt = new Date(`${date}T${time}`);
  if (Number.isNaN(dt.getTime())) return '';
  const d = dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const t = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${d} at ${t}`;
};

const getTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
};

/* -------------------------------------------------------------------------- */
/*  Custom dropdown                                                           */
/* -------------------------------------------------------------------------- */

const ReasonSelect = ({ value, onChange, hasError, describedBy }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const selectedIndex = REASON_OPTIONS.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? REASON_OPTIONS[selectedIndex] : null;
  const SelectedIcon = selected ? selected.icon : null;

  const [listStyle, setListStyle] = useState({});

  // Close when clicking / tapping outside and update position
  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      if (wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.bottom - 12;
        setListStyle({
          position: 'fixed',
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
          maxHeight: `${Math.max(200, Math.min(availableHeight, 350))}px`,
          zIndex: 100000,
        });
      }
    };

    updatePosition();

    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && listRef.current && !listRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleScroll = (e) => {
      if (e.target !== listRef.current) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  // Keep the highlighted option visible while using the keyboard
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const list = listRef.current;
    const el = list.children[activeIndex];
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 6;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
  }, [open, activeIndex]);

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(REASON_OPTIONS[index].value);
    setOpen(false);
    if (triggerRef.current) triggerRef.current.focus();
  };

  const handleKeyDown = (e) => {
    const last = REASON_OPTIONS.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActiveIndex(last);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openList();
        else if (activeIndex >= 0) choose(activeIndex);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault(); // tells the modal not to close as well
          setOpen(false);
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="svcm-select" ref={wrapRef}>
      <button
        type="button"
        id="svcm-reason"
        ref={triggerRef}
        className={`svcm-select__trigger${open ? ' is-open' : ''}${hasError ? ' has-error' : ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="svcm-reason-list"
        aria-activedescendant={open && activeIndex >= 0 ? `svcm-reason-opt-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={hasError || undefined}
      >
        {selected ? (
          <span className="svcm-select__value">
            <span className="svcm-select__chip">
              <SelectedIcon />
            </span>
            <span className="svcm-select__label">{selected.label}</span>
          </span>
        ) : (
          <span className="svcm-select__placeholder">Select a reason for the call</span>
        )}
        <FiChevronDown className="svcm-select__chevron" aria-hidden="true" />
      </button>

      {open && createPortal(
        <ul
          id="svcm-reason-list"
          ref={listRef}
          role="listbox"
          aria-label="Reason for the call"
          className="svcm-select__list"
          style={listStyle}
        >
          {REASON_OPTIONS.map((opt, index) => {
            const Icon = opt.icon;
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={opt.value}
                id={`svcm-reason-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`svcm-select__option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()} // keep focus on the trigger
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <span className="svcm-select__chip">
                  <Icon />
                </span>
                <span className="svcm-select__text">
                  <span className="svcm-select__option-label">{opt.label}</span>
                  <span className="svcm-select__option-desc">{opt.description}</span>
                </span>
                {isSelected && <FiCheck className="svcm-select__check" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>,
        document.getElementById('svcm-overlay') || document.body
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Small presentational helper                                               */
/* -------------------------------------------------------------------------- */

const FieldError = ({ id, message }) =>
  message ? (
    <p className="svcm-error" id={id} role="alert">
      <FiAlertCircle aria-hidden="true" />
      <span>{message}</span>
    </p>
  ) : null;

/* -------------------------------------------------------------------------- */
/*  Modal                                                                     */
/* -------------------------------------------------------------------------- */

const ScheduleVideoCallModal = ({ isOpen, onClose, candidateId, editCall, onUpdateSuccess }) => {


  const [form, setForm] = useState(INITIAL_FORM);
  const [reasonType, setReasonType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const dateRef = useRef(null);
  const customRef = useRef(null);

  // Fresh form every time the modal opens
  useEffect(() => {
    if (!isOpen) return undefined;
    if (editCall) {
      setForm({
        date: editCall.date || '',
        time: editCall.time || '',
        link: editCall.link || '',
      });
      // Try to map reason to known options or fallback to other
      const knownReason = REASON_OPTIONS.find(o => o.label === editCall.reason);
      if (knownReason) {
        setReasonType(knownReason.value);
        setCustomReason('');
      } else {
        setReasonType(OTHER_VALUE);
        setCustomReason(editCall.reason || '');
      }
    } else {
      setForm(INITIAL_FORM);
      setReasonType('');
      setCustomReason('');
    }
    setErrors({});
    setSubmitError('');
    setIsSuccess(false);
    setIsSubmitting(false);
    const raf = requestAnimationFrame(() => {
      if (dateRef.current) dateRef.current.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, editCall]);

  // Lock page scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close on Escape (the dropdown marks the event as handled when it uses it)
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isSubmitting, onClose]);

  // Jump straight into the text field when "Other" is chosen
  useEffect(() => {
    if (reasonType === OTHER_VALUE && customRef.current) customRef.current.focus();
  }, [reasonType]);

  if (!isOpen) return null;

  const clearError = (key) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name);
    if (name === 'date') clearError('time');
    setSubmitError('');
  };

  const handleReasonChange = (value) => {
    setReasonType(value);
    clearError('reason');
    setSubmitError('');
  };

  const handleCustomChange = (e) => {
    setCustomReason(e.target.value);
    clearError('customReason');
    setSubmitError('');
  };

  const validate = () => {
    const next = {};
    const today = toLocalISODate();

    if (!form.date) next.date = 'Choose a date for the call.';
    else if (form.date < today) next.date = 'The date cannot be in the past.';

    if (!form.time) next.time = 'Choose a start time.';
    else if (form.date === today && new Date(`${form.date}T${form.time}`) <= new Date()) {
      next.time = 'Choose a time later than now.';
    }

    if (!form.link.trim()) next.link = 'Add the meeting link.';
    else if (!isValidHttpUrl(form.link.trim())) next.link = 'Enter a full link that starts with https://';

    if (!reasonType) next.reason = 'Select a reason for the call.';
    else if (reasonType === OTHER_VALUE && !customReason.trim()) {
      next.customReason = 'Describe the reason for the call.';
    }

    return next;
  };

  const getFinalReason = () => {
    if (reasonType === OTHER_VALUE) return customReason.trim();
    const match = REASON_OPTIONS.find((o) => o.value === reasonType);
    return match ? match.label : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        date: form.date,
        time: form.time,
        link: form.link.trim(),
        reason: getFinalReason(),
      };
      
      if (editCall && onUpdateSuccess) {
        await onUpdateSuccess(editCall._id, payload);
      } else {
        await authService.scheduleVideoCall(candidateId, payload);
      }
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setSubmitError(error?.message || 'The invitation could not be sent. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayMouseDown = (e) => {
    // Only when the press starts on the backdrop itself (not a drag that ends there)
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  const summary = formatSummary(form.date, form.time);
  const timeZone = getTimeZone();

  return createPortal(
    <div id="svcm-overlay" className="svcm-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div className="svcm-dialog" role="dialog" aria-modal="true" aria-labelledby="svcm-title">
        {/* Header */}
        <header className="svcm-header">
          <span className="svcm-header__icon" aria-hidden="true">
            <FiVideo />
          </span>
          <div className="svcm-header__text">
            <h2 id="svcm-title" className="svcm-header__title">
              {isSuccess 
                ? (editCall ? 'Call rescheduled' : 'Invitation sent') 
                : (editCall ? 'Reschedule video call' : 'Schedule video call')}
            </h2>
            <p className="svcm-header__subtitle">
              {isSuccess
                ? (editCall ? "We've notified the candidate about the new date and time." : "The candidate has been notified by email.")
                : (editCall ? "Update the date, time, or link for this meeting." : "Send the candidate a meeting invitation by email.")}
            </p>
          </div>
          <button
            type="button"
            className="svcm-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <FiX />
          </button>
        </header>

        {isSuccess ? (
          <>
            <div className="svcm-body svcm-success">
              <span className="svcm-success__icon" aria-hidden="true">
                <FiCheckCircle />
              </span>
              <h3 className="svcm-success__title">The video call is scheduled</h3>
              <p className="svcm-success__text">
                An email with the date, time and meeting link is on its way to the candidate.
              </p>
              <dl className="svcm-success__details">
                <div>
                  <dt>When</dt>
                  <dd>{summary}</dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>{getFinalReason()}</dd>
                </div>
              </dl>
            </div>
            <footer className="svcm-footer">
              <button type="button" className="svcm-btn svcm-btn--primary" onClick={onClose}>
                Done
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="svcm-body">
              <form id="svcm-form" className="svcm-form" onSubmit={handleSubmit} noValidate>
                {submitError && (
                  <div className="svcm-banner" role="alert">
                    <FiAlertCircle aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="svcm-row">
                  <div className="svcm-field">
                    <label className="svcm-label" htmlFor="svcm-date">
                      <FiCalendar aria-hidden="true" />
                      Date
                    </label>
                    <input
                      ref={dateRef}
                      id="svcm-date"
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      min={toLocalISODate()}
                      className={`svcm-input${errors.date ? ' has-error' : ''}`}
                      aria-invalid={errors.date ? 'true' : undefined}
                      aria-describedby={errors.date ? 'svcm-date-error' : undefined}
                    />
                    <FieldError id="svcm-date-error" message={errors.date} />
                  </div>

                  <div className="svcm-field">
                    <label className="svcm-label" htmlFor="svcm-time">
                      <FiClock aria-hidden="true" />
                      Time
                    </label>
                    <input
                      id="svcm-time"
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className={`svcm-input${errors.time ? ' has-error' : ''}`}
                      aria-invalid={errors.time ? 'true' : undefined}
                      aria-describedby={errors.time ? 'svcm-time-error' : undefined}
                    />
                    <FieldError id="svcm-time-error" message={errors.time} />
                  </div>
                </div>

                {summary && (
                  <p className="svcm-summary">
                    <FiCalendar aria-hidden="true" />
                    <span>
                      {summary}
                      {timeZone && <span className="svcm-summary__tz"> ({timeZone})</span>}
                    </span>
                  </p>
                )}

                <div className="svcm-field">
                  <label className="svcm-label" htmlFor="svcm-link">
                    <FiLink aria-hidden="true" />
                    Meeting link
                  </label>
                  <input
                    id="svcm-link"
                    type="url"
                    name="link"
                    value={form.link}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    autoComplete="off"
                    className={`svcm-input${errors.link ? ' has-error' : ''}`}
                    aria-invalid={errors.link ? 'true' : undefined}
                    aria-describedby={errors.link ? 'svcm-link-error' : undefined}
                  />
                  <FieldError id="svcm-link-error" message={errors.link} />
                </div>

                <div className="svcm-field">
                  <label className="svcm-label" htmlFor="svcm-reason">
                    <FiFileText aria-hidden="true" />
                    Reason for the call
                  </label>
                  <ReasonSelect
                    value={reasonType}
                    onChange={handleReasonChange}
                    hasError={Boolean(errors.reason)}
                    describedBy={errors.reason ? 'svcm-reason-error' : undefined}
                  />
                  <FieldError id="svcm-reason-error" message={errors.reason} />
                </div>

                {reasonType === OTHER_VALUE && (
                  <div className="svcm-field svcm-field--reveal">
                    <label className="svcm-label" htmlFor="svcm-custom-reason">
                      <FiEdit3 aria-hidden="true" />
                      Your reason
                    </label>
                    <textarea
                      ref={customRef}
                      id="svcm-custom-reason"
                      value={customReason}
                      onChange={handleCustomChange}
                      maxLength={MAX_CUSTOM_REASON}
                      rows={3}
                      placeholder="For example: Walkthrough of the take-home assignment"
                      className={`svcm-input svcm-textarea${errors.customReason ? ' has-error' : ''}`}
                      aria-invalid={errors.customReason ? 'true' : undefined}
                      aria-describedby={errors.customReason ? 'svcm-custom-error' : 'svcm-custom-count'}
                    />
                    <div className="svcm-field__meta">
                      <FieldError id="svcm-custom-error" message={errors.customReason} />
                      <span id="svcm-custom-count" className="svcm-counter">
                        {customReason.length}/{MAX_CUSTOM_REASON}
                      </span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <footer className="svcm-footer">
              <button
                type="button"
                className="svcm-btn svcm-btn--ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="svcm-form"
                className="svcm-btn svcm-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="svcm-spinner" aria-hidden="true" />
                    Sending
                  </>
                ) : (
                  <>
                    <FiSend aria-hidden="true" />
                    {editCall ? 'Reschedule Call' : 'Send Invitation'}
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ScheduleVideoCallModal;