import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FiX,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiShare2,
  FiPaperclip,
  FiMail,
  FiMessageSquare,
  FiChevronDown
} from 'react-icons/fi';
import authService from '../../services/authService';
import './ForwardCVModal.css';

const INITIAL_FORM = { toEmail: '', subject: 'Candidate CV Forwarded', message: '', isResumeAttached: true };

const ForwardCVModal = ({ isOpen, onClose, candidateId, candidateName = 'Candidate' }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [companyUsers, setCompanyUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const dropdownRef = useRef(null);

  // Fetch company users
  useEffect(() => {
    if (isOpen) {
      authService.getCompanyUsers()
        .then(res => {
          if (res && res.data) {
            setCompanyUsers(res.data);
            setFilteredUsers(res.data);
          }
        })
        .catch(err => console.error("Error fetching company users:", err));
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...INITIAL_FORM,
      subject: `CV of ${candidateName}`
    });
    setErrors({});
    setSubmitError('');
    setIsSuccess(false);
    setIsSubmitting(false);
  }, [isOpen, candidateName]);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};
    if (!form.toEmail.trim()) nextErrors.toEmail = 'Recipient email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.toEmail)) nextErrors.toEmail = 'Invalid email address.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';
    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    
    if (name === 'toEmail') {
      setIsDropdownOpen(true);
      const filtered = companyUsers.filter(u => 
        (u.email && u.email.toLowerCase().includes(value.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  };

  const selectUser = (email) => {
    setForm(prev => ({ ...prev, toEmail: email }));
    setIsDropdownOpen(false);
    if (errors.toEmail) setErrors(prev => ({ ...prev, toEmail: null }));
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
      await authService.forwardCandidateCV({
        candidateId,
        toEmail: form.toEmail,
        subject: form.subject,
        message: form.message,
        isResumeAttached: form.isResumeAttached
      });
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setSubmitError(error?.message || 'Failed to forward CV. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fcvm-overlay" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    }}>
      <div className="fcvm-dialog" role="dialog" aria-modal="true" aria-labelledby="fcvm-title">
        <header className="fcvm-header">
          <span className="fcvm-header__icon" aria-hidden="true">
            <FiShare2 />
          </span>
          <div className="fcvm-header__text">
            <h2 id="fcvm-title" className="fcvm-header__title">
              {isSuccess ? 'CV Forwarded' : 'Forward CV'}
            </h2>
            <p className="fcvm-header__subtitle">
              {isSuccess ? 'The CV has been forwarded successfully.' : 'Send this candidate profile to your colleagues.'}
            </p>
          </div>
          <button type="button" className="fcvm-close" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <FiX />
          </button>
        </header>

        {isSuccess ? (
          <>
            <div className="fcvm-body fcvm-success">
              <span className="fcvm-success__icon" aria-hidden="true">
                <FiCheckCircle />
              </span>
              <h3 className="fcvm-success__title">Success!</h3>
              <p className="fcvm-success__text">
                The CV of <strong>{candidateName}</strong> was forwarded to <strong>{form.toEmail}</strong>.
              </p>
            </div>
            <footer className="fcvm-footer">
              <button type="button" className="fcvm-btn fcvm-btn--primary" onClick={onClose}>Done</button>
            </footer>
          </>
        ) : (
          <>
            <div className="fcvm-body">
              <form id="fcvm-form" className="fcvm-form" onSubmit={handleSubmit} noValidate>
                {submitError && (
                  <div className="fcvm-banner" role="alert">
                    <FiAlertCircle aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="fcvm-field" ref={dropdownRef}>
                  <label className="fcvm-label" htmlFor="fcvm-toEmail">
                    <FiMail aria-hidden="true" /> To
                  </label>
                  <div className="fcvm-autocomplete-wrapper">
                    <input
                      id="fcvm-toEmail"
                      type="email"
                      name="toEmail"
                      value={form.toEmail}
                      onChange={handleChange}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Select or enter email"
                      className={`fcvm-input ${errors.toEmail ? 'has-error' : ''}`}
                      autoComplete="off"
                    />
                    <FiChevronDown className="fcvm-autocomplete-chevron" onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
                    {isDropdownOpen && filteredUsers.length > 0 && (
                      <ul className="fcvm-dropdown">
                        {filteredUsers.map(u => (
                          <li key={u._id} onClick={() => selectUser(u.email)}>
                            <div className="fcvm-dropdown-name">{u.name}</div>
                            <div className="fcvm-dropdown-email">{u.email}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.toEmail && (
                    <p className="fcvm-error" role="alert"><FiAlertCircle /> <span>{errors.toEmail}</span></p>
                  )}
                </div>

                <div className="fcvm-field">
                  <label className="fcvm-label" htmlFor="fcvm-subject">
                    <FiMessageSquare aria-hidden="true" /> Subject
                  </label>
                  <input
                    id="fcvm-subject"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`fcvm-input ${errors.subject ? 'has-error' : ''}`}
                  />
                  {errors.subject && (
                    <p className="fcvm-error" role="alert"><FiAlertCircle /> <span>{errors.subject}</span></p>
                  )}
                </div>

                <div className="fcvm-field">
                  <label className="fcvm-label" htmlFor="fcvm-message">
                    <FiMessageSquare aria-hidden="true" /> Message
                  </label>
                  <textarea
                    id="fcvm-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add a note for the recipient..."
                    className={`fcvm-input fcvm-textarea ${errors.message ? 'has-error' : ''}`}
                  />
                  {errors.message && (
                    <p className="fcvm-error" role="alert"><FiAlertCircle /> <span>{errors.message}</span></p>
                  )}
                </div>

                <div className="fcvm-field-checkbox">
                  <label className="fcvm-checkbox-label">
                    <input
                      type="checkbox"
                      name="isResumeAttached"
                      checked={form.isResumeAttached}
                      onChange={handleChange}
                    />
                    <span className="fcvm-checkbox-text">
                      <FiPaperclip aria-hidden="true" /> Include Candidate Resume as Attachment (Link)
                    </span>
                  </label>
                </div>
              </form>
            </div>

            <footer className="fcvm-footer">
              <button type="button" className="fcvm-btn fcvm-btn--ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" form="fcvm-form" className="fcvm-btn fcvm-btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Forwarding...' : <><FiSend aria-hidden="true" /> Forward CV</>}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ForwardCVModal;
