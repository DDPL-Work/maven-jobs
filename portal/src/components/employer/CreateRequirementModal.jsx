import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiAward, FiBell, FiUsers, FiTag } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 720,
            maxHeight: '92vh',
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 28px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #002366 0%, #1e40af 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 35, 102, 0.2)'
              }}>
                <FiBriefcase size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  {initialData ? 'Edit Resdex Requirement' : 'Create Resdex Requirement'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Workspace folder for candidates, search criteria & talent alerts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: 'none',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 28px',
            background: '#f8fafc',
            gap: 20
          }}>
            {[
              { id: 'basic', label: '1. Basic Details', icon: FiBriefcase },
              { id: 'criteria', label: '2. Search & Hiring Criteria', icon: FiTag },
              { id: 'alerts', label: '3. Alerts & Sharing', icon: FiBell },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2.5px solid #002366' : '2.5px solid transparent',
                  color: activeTab === tab.id ? '#002366' : '#64748b',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Body Content */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {errors.submit && (
                <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 13, marginBottom: 18, fontWeight: 500 }}>
                  {errors.submit}
                </div>
              )}

              {/* TAB 1: BASIC DETAILS */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Requirement Name <span style={{ color: '#ef4444' }}>*</span>
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
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: 14,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {errors.name && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.name}</span>}
                    <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                      Visible title of this hiring workspace/folder.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Target Job Title <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Java Developer"
                        value={jobTitle}
                        onChange={(e) => {
                          setJobTitle(e.target.value);
                          setErrors({ ...errors, jobTitle: null });
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 10,
                          border: `1.5px solid ${errors.jobTitle ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: 14,
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {errors.jobTitle && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.jobTitle}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Requirement Status
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setStatus('open')}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: status === 'open' ? '2px solid #10b981' : '1px solid #cbd5e1',
                            background: status === 'open' ? '#ecfdf5' : '#fff',
                            color: status === 'open' ? '#047857' : '#475569',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {status === 'open' && <FiCheck size={15} />} Open / Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus('closed')}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: status === 'closed' ? '2px solid #64748b' : '1px solid #cbd5e1',
                            background: status === 'closed' ? '#f1f5f9' : '#fff',
                            color: status === 'closed' ? '#1e293b' : '#64748b',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {status === 'closed' && <FiCheck size={15} />} Closed / Filled
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Hiring Notes / Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add hiring guidelines, team budget, interview rounds or client details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 14,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HIRING & SEARCH CRITERIA */}
              {activeTab === 'criteria' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Skills input */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Mandatory / Key Skills <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: 8,
                      border: `1.5px solid ${errors.skills ? '#ef4444' : '#cbd5e1'}`,
                      borderRadius: 10,
                      background: '#fff',
                      minHeight: 46
                    }}>
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0 }}
                          >
                            <FiX size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Type skill & press Enter (e.g. Java, Spring Boot, MySQL)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        style={{
                          flex: 1,
                          minWidth: 220,
                          border: 'none',
                          outline: 'none',
                          padding: '6px 8px',
                          fontSize: 13
                        }}
                      />
                    </div>
                    {errors.skills && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.skills}</span>}
                    <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                      These skills will be queried whenever you click "Run Search".
                    </span>
                  </div>

                  {/* Experience & Salary ranges */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Experience Range (Years)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          placeholder="Min (e.g. 3)"
                          value={experienceMin}
                          onChange={(e) => setExperienceMin(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                        />
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>to</span>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          placeholder="Max (e.g. 7)"
                          value={experienceMax}
                          onChange={(e) => setExperienceMax(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Annual Salary Range (₹ Lakhs / PA)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="Min (e.g. 8)"
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                        />
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>to</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Max (e.g. 18)"
                          value={salaryMax}
                          onChange={(e) => setSalaryMax(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Target Locations
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {POPULAR_LOCATIONS.map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleAddLocation(loc)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: locations.includes(loc) ? '1.5px solid #002366' : '1px solid #cbd5e1',
                            background: locations.includes(loc) ? '#002366' : '#fff',
                            color: locations.includes(loc) ? '#fff' : '#475569',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {locations.includes(loc) ? `✓ ${loc}` : `+ ${loc}`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add other city and press Enter..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={handleCustomLocationAdd}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Notice Period */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                      Notice Period
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {NOTICE_PERIOD_OPTIONS.map(opt => (
                        <label
                          key={opt}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={noticePeriod.includes(opt)}
                            onChange={() => toggleNotice(opt)}
                            style={{ accentColor: '#002366', width: 16, height: 16 }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Education & Industry */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Preferred Education (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech / B.E., MCA, Any Graduate"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Industry / Domain (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IT-Software, BFSI, Ecommerce"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ALERTS & SHARING */}
              {activeTab === 'alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Email Alert Box */}
                  <div style={{
                    padding: 20,
                    borderRadius: 14,
                    border: '1.5px solid #e2e8f0',
                    background: alertsEnabled ? '#f0f9ff' : '#f8fafc',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: alertsEnabled ? '#0284c7' : '#94a3b8',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FiBell size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            Automated Talent Match Alerts
                          </h4>
                          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                            Get notified by email when new matching candidates register or update profiles.
                          </p>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={alertsEnabled}
                          onChange={(e) => setAlertsEnabled(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          inset: 0,
                          backgroundColor: alertsEnabled ? '#0284c7' : '#cbd5e1',
                          borderRadius: 24,
                          transition: '0.2s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: 18,
                            width: 18,
                            left: alertsEnabled ? 23 : 3,
                            bottom: 3,
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: '0.2s'
                          }} />
                        </span>
                      </label>
                    </div>

                    {alertsEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14, borderTop: '1px solid #bae6fd' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
                            Alert Frequency
                          </label>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="alertFreq"
                                value="DAILY"
                                checked={alertFrequency === 'DAILY'}
                                onChange={() => setAlertFrequency('DAILY')}
                                style={{ accentColor: '#0284c7' }}
                              />
                              Daily Digest (Recommended)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="alertFreq"
                                value="WEEKLY"
                                checked={alertFrequency === 'WEEKLY'}
                                onChange={() => setAlertFrequency('WEEKLY')}
                                style={{ accentColor: '#0284c7' }}
                              />
                              Weekly Summary
                            </label>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
                            Recipient Emails
                          </label>
                          <input
                            type="text"
                            placeholder="recruiter@company.com, hiring.manager@company.com"
                            value={alertEmails}
                            onChange={(e) => setAlertEmails(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: '1.5px solid #bae6fd',
                              fontSize: 13,
                              outline: 'none',
                              background: '#fff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company-Wide Ownership */}
                  <div style={{
                    padding: 20,
                    borderRadius: 14,
                    border: '1.5px solid #e2e8f0',
                    background: '#fff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: '#e0e7ff',
                          color: '#4338ca',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FiUsers size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                            Company-Wide Ownership
                          </h4>
                          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                            Requirements belong to your company tenant. Other recruiters in your company can view and collaborate.
                          </p>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isCompanyShared}
                          onChange={(e) => setIsCompanyShared(e.target.checked)}
                          style={{ accentColor: '#4338ca', width: 18, height: 18 }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Visible to Team</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 28px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc'
            }}>
              <div>
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'alerts' ? 'criteria' : 'basic')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      color: '#475569',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
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
                    style={{
                      padding: '10px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#002366',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Next: {activeTab === 'basic' ? 'Criteria' : 'Alerts & Sharing'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#002366',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(0, 35, 102, 0.25)'
                    }}
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