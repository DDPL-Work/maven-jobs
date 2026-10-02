import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiAward, FiBell, FiUsers, FiTag } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './CreateRequirementModal.css';

const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '60 Days',
  '90 Days'
];

const POPULAR_LOCATIONS = [
  'Pune',
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Remote'
];

export default function CreateRequirementModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  currentUser = null
}) {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'criteria' | 'alerts'
  
  // Basic info
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('open'); // 'open' | 'closed'
  const [description, setDescription] = useState('');
  
  // Criteria
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceMin, setExperienceMin] = useState('');
  const [experienceMax, setExperienceMax] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [education, setEducation] = useState('');
  const [industry, setIndustry] = useState('');
  const [noticePeriod, setNoticePeriod] = useState([]);
  
  // Alerts
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState('DAILY'); // 'DAILY' | 'WEEKLY'
  const [alertEmails, setAlertEmails] = useState('');
  
  // Company Visibility
  const [isCompanyShared, setIsCompanyShared] = useState(true);
  
  // Errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setJobTitle(initialData.jobTitle || initialData.criteria?.jobTitle || initialData.name || '');
        setStatus(initialData.status === 'closed' ? 'closed' : 'open');
        setDescription(initialData.description || '');
        
        const criteria = initialData.criteria || {};
        setSkills(Array.isArray(criteria.skills) ? criteria.skills : (initialData.skills || []));
        setExperienceMin(criteria.experienceMin !== undefined ? String(criteria.experienceMin) : (initialData.experienceMin || ''));
        setExperienceMax(criteria.experienceMax !== undefined ? String(criteria.experienceMax) : (initialData.experienceMax || ''));
        setSalaryMin(criteria.salaryMin !== undefined ? String(criteria.salaryMin) : (initialData.salaryMin || ''));
        setSalaryMax(criteria.salaryMax !== undefined ? String(criteria.salaryMax) : (initialData.salaryMax || ''));
        setLocations(Array.isArray(criteria.locations) ? criteria.locations : (initialData.locations || []));
        setEducation(criteria.education || initialData.education || '');
        setIndustry(criteria.industry || initialData.industry || '');
        setNoticePeriod(Array.isArray(criteria.noticePeriod) ? criteria.noticePeriod : (initialData.noticePeriod || []));
        
        const alerts = initialData.alerts || {};
        setAlertsEnabled(alerts.enabled !== false);
        setAlertFrequency(alerts.frequency || 'DAILY');
        setAlertEmails(Array.isArray(alerts.recipients) ? alerts.recipients.join(', ') : (alerts.email || ''));
        
        setIsCompanyShared(initialData.isCompanyShared !== false);
      } else {
        setName('');
        setJobTitle('');
        setStatus('open');
        setDescription('');
        setSkills([]);
        setSkillInput('');
        setExperienceMin('');
        setExperienceMax('');
        setSalaryMin('');
        setSalaryMax('');
        setLocations([]);
        setLocationInput('');
        setEducation('');
        setIndustry('');
        setNoticePeriod(['Immediate', '30 Days']);
        setAlertsEnabled(true);
        setAlertFrequency('DAILY');
        setAlertEmails(currentUser?.email || '');
        setIsCompanyShared(true);
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, initialData, currentUser]);

  if (!isOpen) return null;

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = skillInput.trim().replace(/^,+|,+$/g, '');
      if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        setSkills([...skills, trimmed]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddLocation = (loc) => {
    if (!locations.includes(loc)) {
      setLocations([...locations, loc]);
    } else {
      setLocations(locations.filter(l => l !== loc));
    }
  };

  const handleCustomLocationAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = locationInput.trim();
      if (trimmed && !locations.includes(trimmed)) {
        setLocations([...locations, trimmed]);
      }
      setLocationInput('');
    }
  };

  const toggleNotice = (opt) => {
    if (noticePeriod.includes(opt)) {
      setNoticePeriod(noticePeriod.filter(n => n !== opt));
    } else {
      setNoticePeriod([...noticePeriod, opt]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Requirement name is required';
    if (!jobTitle.trim()) errs.jobTitle = 'Target job title is required';
    if (skills.length === 0) errs.skills = 'Add at least one mandatory skill';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.name || errs.jobTitle) setActiveTab('basic');
      else if (errs.skills) setActiveTab('criteria');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const emailList = alertEmails
      ? alertEmails.split(',').map(m => m.trim()).filter(Boolean)
      : (currentUser?.email ? [currentUser.email] : []);

    const payload = {
      name: name.trim(),
      jobTitle: jobTitle.trim(),
      description: description.trim(),
      status: status, // 'open' | 'closed'
      folderType: 'REQUIREMENT',
      color: initialData?.color || '#002366',
      icon: 'briefcase',
      isPublic: isCompanyShared,
      isCompanyShared: isCompanyShared,
      
      // Full hiring criteria as specified in 
      criteria: {
        jobTitle: jobTitle.trim(),
        skills,
        experienceMin: experienceMin !== '' ? Number(experienceMin) : undefined,
        experienceMax: experienceMax !== '' ? Number(experienceMax) : undefined,
        salaryMin: salaryMin !== '' ? Number(salaryMin) : undefined,
        salaryMax: salaryMax !== '' ? Number(salaryMax) : undefined,
        locations,
        education: education.trim() || undefined,
        industry: industry.trim() || undefined,
        noticePeriod,
        // Serialized query filter ready for 1-click execution in Resdex Search
        rawSearchQuery: {
          keyword: skills.join(' '),
          skills: skills,
          minExp: experienceMin || undefined,
          maxExp: experienceMax || undefined,
          minSalary: salaryMin || undefined,
          maxSalary: salaryMax || undefined,
          location: locations.join(', '),
          noticePeriod: noticePeriod
        }
      },
      
      // Email alert settings as specified in
      alerts: {
        enabled: alertsEnabled,
        frequency: alertFrequency,
        recipients: emailList
      },

      // Fallback fields for backwards compatibility with generic folder queries
      skills,
      locations,
      noticePeriod
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || err?.message || 'Failed to save requirement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="crm-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="crm-dialog"
        >
          {/* Header */}
          <div className="crm-header">
            <div className="crm-header-info">
              <div className="crm-header-icon">
                <FiBriefcase size={20} />
              </div>
              <div>
                <h2 className="crm-header-title">
                  {initialData ? 'Edit Resdex Requirement' : 'Create Resdex Requirement'}
                </h2>
                <p className="crm-header-subtitle">
                  Workspace folder for candidates, search criteria & talent alerts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="crm-close-btn"
              aria-label="Close modal"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="crm-stepper-tabs">
            {[
              { id: 'basic', step: '1', title: 'Basic Details', shortTitle: 'Basic', icon: FiBriefcase },
              { id: 'criteria', step: '2', title: 'Hiring Criteria', shortTitle: 'Criteria', icon: FiTag },
              { id: 'alerts', step: '3', title: 'Alerts & Sharing', shortTitle: 'Alerts', icon: FiBell },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const isCompleted =
                (tab.id === 'basic' && (activeTab === 'criteria' || activeTab === 'alerts')) ||
                (tab.id === 'criteria' && activeTab === 'alerts');

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'basic') setActiveTab('basic');
                    else if (tab.id === 'criteria') {
                      const errs = validate();
                      if (errs.name || errs.jobTitle) {
                        setErrors(errs);
                        return;
                      }
                      setActiveTab('criteria');
                    } else if (tab.id === 'alerts') {
                      const errs = validate();
                      if (Object.keys(errs).length > 0) {
                        setErrors(errs);
                        return;
                      }
                      setActiveTab('alerts');
                    }
                  }}
                  className={`crm-step-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <span className="crm-step-badge">
                    {isCompleted ? <FiCheck size={12} /> : tab.step}
                  </span>
                  <span className="crm-step-label-full">{tab.title}</span>
                  <span className="crm-step-label-short">{tab.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <form onSubmit={handleSubmit} className="crm-form">
            <div className="crm-body">
              {errors.submit && (
                <div className="crm-error-banner">
                  {errors.submit}
                </div>
              )}

              {/* TAB 1: BASIC DETAILS */}
              {activeTab === 'basic' && (
                <div className="crm-tab-content">
                  <div className="crm-field">
                    <label className="crm-label">
                      Requirement Name <span className="crm-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Java Backend Developer - Pune"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!jobTitle) setJobTitle(e.target.value);
                        setErrors({ ...errors, name: null });
                      }}
                      className={`crm-input ${errors.name ? 'has-error' : ''}`}
                    />
                    {errors.name && <span className="crm-error-text">{errors.name}</span>}
                    <span className="crm-hint-text">
                      Visible title of this hiring workspace/folder.
                    </span>
                  </div>

                  <div className="crm-grid-2col">
                    <div className="crm-field">
                      <label className="crm-label">
                        Target Job Title <span className="crm-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Java Developer"
                        value={jobTitle}
                        onChange={(e) => {
                          setJobTitle(e.target.value);
                          setErrors({ ...errors, jobTitle: null });
                        }}
                        className={`crm-input ${errors.jobTitle ? 'has-error' : ''}`}
                      />
                      {errors.jobTitle && <span className="crm-error-text">{errors.jobTitle}</span>}
                    </div>

                    <div className="crm-field">
                      <label className="crm-label">
                        Requirement Status
                      </label>
                      <div className="crm-status-group">
                        <button
                          type="button"
                          onClick={() => setStatus('open')}
                          className={`crm-status-btn ${status === 'open' ? 'active-open' : ''}`}
                        >
                          {status === 'open' && <FiCheck size={14} />} Open / Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus('closed')}
                          className={`crm-status-btn ${status === 'closed' ? 'active-closed' : ''}`}
                        >
                          {status === 'closed' && <FiCheck size={14} />} Closed / Filled
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="crm-field">
                    <label className="crm-label">
                      Hiring Notes / Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add hiring guidelines, team budget, interview rounds or client details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="crm-textarea"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HIRING & SEARCH CRITERIA */}
              {activeTab === 'criteria' && (
                <div className="crm-tab-content">
                  {/* Skills input */}
                  <div className="crm-field">
                    <label className="crm-label">
                      Mandatory / Key Skills <span className="crm-label-required">*</span>
                    </label>
                    <div className={`crm-skills-box ${errors.skills ? 'has-error' : ''}`}>
                      {skills.map((skill) => (
                        <span key={skill} className="crm-skill-chip">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="crm-skill-chip-remove"
                            aria-label={`Remove ${skill}`}
                          >
                            <FiX size={13} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Type skill & press Enter (e.g. Java, Spring Boot, MySQL)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="crm-skill-input"
                      />
                    </div>
                    {errors.skills && <span className="crm-error-text">{errors.skills}</span>}
                    <span className="crm-hint-text">
                      These skills will be queried whenever you click "Run Search".
                    </span>
                  </div>

                  {/* Experience & Salary ranges */}
                  <div className="crm-grid-2col">
                    <div className="crm-field">
                      <label className="crm-label">
                        Experience Range (Years)
                      </label>
                      <div className="crm-range-row">
                        <div className="crm-range-input-wrap">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            placeholder="Min (e.g. 2)"
                            value={experienceMin}
                            onChange={(e) => setExperienceMin(e.target.value)}
                            className="crm-input crm-range-input"
                          />
                          <span className="crm-input-unit">Yrs</span>
                        </div>
                        <span className="crm-range-separator">—</span>
                        <div className="crm-range-input-wrap">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            placeholder="Max (e.g. 6)"
                            value={experienceMax}
                            onChange={(e) => setExperienceMax(e.target.value)}
                            className="crm-input crm-range-input"
                          />
                          <span className="crm-input-unit">Yrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="crm-field">
                      <label className="crm-label">
                        Annual Salary Range (₹ Lakhs / PA)
                      </label>
                      <div className="crm-range-row">
                        <div className="crm-range-input-wrap">
                          <span className="crm-input-prefix">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Min (e.g. 6)"
                            value={salaryMin}
                            onChange={(e) => setSalaryMin(e.target.value)}
                            className="crm-input crm-range-input with-prefix with-unit"
                          />
                          <span className="crm-input-unit">LPA</span>
                        </div>
                        <span className="crm-range-separator">—</span>
                        <div className="crm-range-input-wrap">
                          <span className="crm-input-prefix">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Max (e.g. 15)"
                            value={salaryMax}
                            onChange={(e) => setSalaryMax(e.target.value)}
                            className="crm-input crm-range-input with-prefix with-unit"
                          />
                          <span className="crm-input-unit">LPA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="crm-field">
                    <label className="crm-label">
                      Target Locations
                    </label>
                    <div className="crm-location-pills">
                      {POPULAR_LOCATIONS.map(loc => {
                        const isSelected = locations.includes(loc);
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleAddLocation(loc)}
                            className={`crm-loc-pill ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected ? <FiCheck size={11} style={{ marginRight: 3 }} /> : <span style={{ marginRight: 3, fontWeight: 700 }}>+</span>}
                            <span>{loc}</span>
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      placeholder="Add custom city and press Enter..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={handleCustomLocationAdd}
                      className="crm-input"
                    />
                  </div>

                  {/* Notice Period */}
                  <div className="crm-field">
                    <label className="crm-label">
                      Notice Period
                    </label>
                    <div className="crm-notice-group">
                      {NOTICE_PERIOD_OPTIONS.map(opt => {
                        const isSelected = noticePeriod.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleNotice(opt)}
                            className={`crm-notice-chip ${isSelected ? 'selected' : ''}`}
                          >
                            {isSelected && <FiCheck size={12} className="crm-chip-check" />}
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Education & Industry */}
                  <div className="crm-grid-2col">
                    <div className="crm-field">
                      <label className="crm-label">
                        Preferred Education (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech / B.E., MCA, Any Graduate"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="crm-input"
                      />
                    </div>
                    <div className="crm-field">
                      <label className="crm-label">
                        Industry / Domain (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IT-Software, BFSI, Ecommerce"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="crm-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ALERTS & SHARING */}
              {activeTab === 'alerts' && (
                <div className="crm-tab-content">
                  {/* Email Alert Box */}
                  <div className={`crm-alerts-card ${alertsEnabled ? 'active' : ''}`}>
                    <div className="crm-alerts-header">
                      <div className="crm-alerts-icon-title">
                        <div className={`crm-alerts-icon ${alertsEnabled ? 'active' : ''}`}>
                          <FiBell size={18} />
                        </div>
                        <div>
                          <h4 className="crm-alerts-title">
                            Automated Talent Match Alerts
                          </h4>
                          <p className="crm-alerts-desc">
                            Get notified by email when new matching candidates register or update profiles.
                          </p>
                        </div>
                      </div>
                      <label className="crm-switch">
                        <input
                          type="checkbox"
                          checked={alertsEnabled}
                          onChange={(e) => setAlertsEnabled(e.target.checked)}
                        />
                        <span className="crm-slider" />
                      </label>
                    </div>

                    {alertsEnabled && (
                      <div className="crm-alerts-body">
                        <div className="crm-field">
                          <label className="crm-label" style={{ color: '#0369a1' }}>
                            Alert Frequency
                          </label>
                          <div className="crm-radio-group">
                            <label className={`crm-radio-card ${alertFrequency === 'DAILY' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="alertFreq"
                                value="DAILY"
                                checked={alertFrequency === 'DAILY'}
                                onChange={() => setAlertFrequency('DAILY')}
                              />
                              <div className="crm-radio-card-content">
                                <span className="crm-radio-card-title">Daily Digest</span>
                                <span className="crm-radio-card-sub">Recommended for active hiring</span>
                              </div>
                            </label>
                            <label className={`crm-radio-card ${alertFrequency === 'WEEKLY' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="alertFreq"
                                value="WEEKLY"
                                checked={alertFrequency === 'WEEKLY'}
                                onChange={() => setAlertFrequency('WEEKLY')}
                              />
                              <div className="crm-radio-card-content">
                                <span className="crm-radio-card-title">Weekly Summary</span>
                                <span className="crm-radio-card-sub">Sent once every week</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="crm-field">
                          <label className="crm-label" style={{ color: '#0369a1' }}>
                            Recipient Emails
                          </label>
                          <input
                            type="text"
                            placeholder="recruiter@company.com, hiring.manager@company.com"
                            value={alertEmails}
                            onChange={(e) => setAlertEmails(e.target.value)}
                            className="crm-input"
                            style={{ borderColor: '#bae6fd' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company-Wide Ownership */}
                  <div className="crm-sharing-card">
                    <div className="crm-sharing-header">
                      <div className="crm-alerts-icon-title">
                        <div className="crm-sharing-icon">
                          <FiUsers size={18} />
                        </div>
                        <div>
                          <h4 className="crm-alerts-title">
                            Company-Wide Ownership
                          </h4>
                          <p className="crm-alerts-desc">
                            Requirements belong to your company tenant. Other recruiters in your company can view and collaborate.
                          </p>
                        </div>
                      </div>
                      <label className="crm-switch">
                        <input
                          type="checkbox"
                          checked={isCompanyShared}
                          onChange={(e) => setIsCompanyShared(e.target.checked)}
                        />
                        <span className="crm-slider" />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="crm-footer">
              <div className="crm-footer-left">
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'alerts' ? 'criteria' : 'basic')}
                    className="crm-btn-secondary"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="crm-footer-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="crm-btn-secondary"
                >
                  Cancel
                </button>

                {activeTab !== 'alerts' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const errs = validate();
                      if (activeTab === 'basic' && (errs.name || errs.jobTitle)) {
                        setErrors(errs);
                        return;
                      }
                      setActiveTab(activeTab === 'basic' ? 'criteria' : 'alerts');
                    }}
                    className="crm-btn-primary"
                  >
                    <span className="crm-btn-text-full">
                      Next: {activeTab === 'basic' ? 'Criteria' : 'Alerts & Sharing'}
                    </span>
                    <span className="crm-btn-text-short">Next</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="crm-btn-primary"
                  >
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Requirement' : 'Create Requirement'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
