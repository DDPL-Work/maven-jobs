import React, { useState } from 'react';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import authService from '../../services/authService';
import './TalentCloudDemoForm.css';

export default function TalentCloudDemoForm({ 
  title = "Book your personalized demo!",
  showTitle = true,
  buttonText = "Continue",
  hiringForLabel = "HIRING FOR",
  placeholderName = "Full name",
  placeholderMobile = "Mobile number",
  placeholderEmail = "Work email",
  onSubmit,
  onSuccess,
  isEmbedded = false,
  className = ""
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    entityType: '', // 'company' | 'consultancy'
    designation: '',
    organizationName: '',
    employeeCount: '',
    city: ''
  });

  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleTabClick = (type) => {
    setFormData((prev) => ({
      ...prev,
      entityType: prev.entityType === type ? '' : type
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleCaptchaToggle = () => {
    setCaptchaChecked(!captchaChecked);
    setCaptchaError(false);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMessage('Please enter a valid work email address');
      return;
    }

    // If an entity tab is selected, validate its expanded fields
    if (formData.entityType) {
      if (!formData.designation.trim()) {
        setErrorMessage('Please enter your designation');
        return;
      }
      if (!formData.organizationName.trim()) {
        setErrorMessage(`Please enter your ${formData.entityType === 'company' ? 'company' : 'consultancy'} name`);
        return;
      }
      if (!formData.employeeCount) {
        setErrorMessage('Please select the number of employees');
        return;
      }
      if (!formData.city.trim()) {
        setErrorMessage('Please enter your city');
        return;
      }
    }

    if (!captchaChecked) {
      setCaptchaError(true);
      setErrorMessage('Please verify that you are not a robot');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await authService.submitSalesEnquiry({
          fullName: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
          entityType: formData.entityType,
          designation: formData.designation,
          organizationName: formData.organizationName,
          employeeCount: formData.employeeCount,
          city: formData.city,
          source: 'TALENT_CLOUD',
        });
      }
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setCaptchaChecked(false);
    setCaptchaError(false);
    setErrorMessage('');
    setFormData({
      fullName: '',
      mobile: '',
      email: '',
      entityType: '',
      designation: '',
      organizationName: '',
      employeeCount: '',
      city: ''
    });
  };

  return (
    <div className={`tcd-card ${isEmbedded ? 'tcd-embedded' : ''} ${className}`}>
      {isSubmitted ? (
        <div className="tcd-success-wrap">
          <div className="tcd-success-icon-badge">
            <svg
              className="tcd-success-check-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="tcd-success-title">Thank you!</h2>
          <p className="tcd-success-desc">
            Our team will get in touch with you soon<br />to discuss your requirements.
          </p>
          <button type="button" onClick={handleReset} className="tcd-btn-reset">
            Submit another query
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="tcd-form">
          {showTitle && title && <h3 className="tcd-heading">{title}</h3>}

          {errorMessage && (
            <div className="tcd-error-banner">
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div className="tcd-input-group">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder={placeholderName}
              className="tcd-input"
              autoComplete="name"
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="tcd-input-group">
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder={placeholderMobile}
              className="tcd-input"
              maxLength={10}
              autoComplete="tel"
              required
            />
          </div>

          {/* Email */}
          <div className="tcd-input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={placeholderEmail}
              className="tcd-input"
              autoComplete="email"
              required
            />
          </div>

          {/* Toggle Tabs: Your company / Your consultancy */}
          <div className="tcd-entity-section">
            {hiringForLabel && <span className="tcd-entity-label">{hiringForLabel}</span>}
            <div className="tcd-tabs-row">
              <button
                type="button"
                className={`tcd-tab-btn ${formData.entityType === 'company' ? 'active' : ''}`}
                onClick={() => handleTabClick('company')}
              >
                Your company
              </button>
              <button
                type="button"
                className={`tcd-tab-btn ${formData.entityType === 'consultancy' ? 'active' : ''}`}
                onClick={() => handleTabClick('consultancy')}
              >
                Your consultancy
              </button>
            </div>
          </div>

          {/* Dynamic Expanded Fields (Show more when tab selected) */}
          {formData.entityType && (
            <div className="tcd-expanded-fields">
              <div className="tcd-input-group">
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Designation name"
                  className="tcd-input"
                  required
                />
              </div>

              <div className="tcd-input-group">
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder={
                    formData.entityType === 'company' 
                      ? "Company name" 
                      : "Consultancy name"
                  }
                  className="tcd-input"
                  required
                />
              </div>

              <div className="tcd-input-group">
                <select
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleInputChange}
                  className="tcd-input tcd-select"
                  required
                >
                  <option value="">Number of employees</option>
                  <option value="1-15">1 - 15</option>
                  <option value="16-50">16 - 50</option>
                  <option value="51-200">51 - 200</option>
                  <option value="201-500">201 - 500</option>
                  <option value="501-1000">501 - 1,000</option>
                  <option value="1000+">1,000+ employees</option>
                </select>
              </div>

              <div className="tcd-input-group">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="tcd-input"
                  required
                />
              </div>
            </div>
          )}

          {/* reCAPTCHA Mockup Widget */}
          <div className={`tcd-recaptcha-box ${captchaError ? 'error-state' : ''}`}>
            <div className="tcd-recaptcha-left" onClick={handleCaptchaToggle}>
              <div className={`tcd-recaptcha-checkbox ${captchaChecked ? 'checked' : ''}`}>
                {captchaChecked && <FiCheck size={18} strokeWidth={3} />}
              </div>
              <span className="tcd-recaptcha-label">I'm not a robot</span>
            </div>

            <div className="tcd-recaptcha-right">
              <div className="tcd-recaptcha-logo-icon">
                <FiRefreshCw size={18} />
              </div>
              <span className="tcd-recaptcha-brand-text">reCAPTCHA</span>
            </div>
          </div>

          {/* Continue / Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="tcd-btn-continue"
          >
            {isSubmitting ? 'Processing...' : buttonText}
          </button>

          {/* Consent Text */}
          <p className="tcd-consent">
            By clicking the Submit button, you agree to be contacted via Email, Phone, or WhatsApp.
          </p>
        </form>
      )}
    </div>
  );
}
