import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiBriefcase, FiEdit2, FiCalendar, FiMapPin, FiCheck, FiX, FiPlus, FiTrash2, FiChevronDown, FiClock, FiLoader } from 'react-icons/fi';
import authService from '../../services/authService';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';
import CustomSelect from '../common/CustomSelect';

const SkillChip = React.memo(({ name, removable, onRemove }) => (
  <span className="ps-skill-chip" style={{
    background: removable ? '#F8FAFC' : 'var(--blue-lt)',
    color: removable ? 'var(--navy)' : 'var(--blue)',
    border: removable ? '1px solid var(--slate-4)' : 'none',
    borderRadius: '20px',
    padding: removable ? '6px 10px 6px 14px' : '6px 14px',
    fontSize: '0.85rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  }}>
    {name}
    {removable && (
      <button onClick={() => onRemove(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}>
        <FiX size={14} />
      </button>
    )}
  </span>
));

const COLORS = [
  { bg: '#EEF2FF', color: '#4338CA' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#E0E7FF', color: '#3730A3' },
];

const getInitials = (name) =>
  String(name || 'C').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDuration = (start, end) => {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  if (isNaN(s.getTime())) return null;
  let totalMonths = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (totalMonths < 0) totalMonths = 0;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  return parts.join(' ') || '< 1 mo';
};

const formatDateRange = (start, end, currentlyWorking) => {
  if (!start) return '';
  const s = new Date(start);
  const startStr = `${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  if (currentlyWorking) return `${startStr} - Present`;
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = `${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${startStr} - ${endStr}`;
};

const calcTotalDuration = (exps) => {
  let totalMonths = 0;
  exps.forEach(e => {
    if (!e.startDate) return;
    const s = new Date(e.startDate);
    if (isNaN(s.getTime())) return;
    const end = e.currentlyWorking ? new Date() : (e.endDate ? new Date(e.endDate) : null);
    if (!end || isNaN(end.getTime())) return;
    totalMonths += (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth());
  });
  if (totalMonths <= 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  return parts.join(' ');
};

const emptyExp = () => ({
  id: Date.now() + Math.random(),
  isNew: true,
  title: '',
  company: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  totalExperience: '',
  noticePeriod: '',
  location: '',
  summary: '',
  skills: [],
});

const ExperienceCard = React.memo(({ exp, palette, onEditThis, onDelete, editing, onSave, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const [editData, setEditData] = useState({ 
    ...exp, 
    skillsInput: '',
    skills: exp.skills || [],
    employmentType: exp.employmentType || 'Full-time',
    totalExpYears: exp.totalExpYears || '',
    totalExpMonths: exp.totalExpMonths || '',
    currentSalary: exp.currentSalary || ''
  });

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.suggestSkillsAutocomplete(query.trim(), editData.skills || []);
      const items = res?.data?.suggestions || [];
      const filtered = items.filter(s => !(editData.skills || []).includes(s));
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightIdx(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [editData.skills]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setEditData(p => ({ ...p, skillsInput: val }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const addSkill = useCallback((name) => {
    const s = name.trim();
    if (!s || (editData.skills || []).includes(s)) return;
    setEditData(p => ({ ...p, skills: [...(p.skills || []), s], skillsInput: '' }));
    setSuggestions([]);
    setShowDropdown(false);
    setHighlightIdx(-1);
    if (inputRef.current) inputRef.current.focus();
  }, [editData.skills]);

  const handleRemoveSkill = useCallback((name) => {
    setEditData(p => ({ ...p, skills: (p.skills || []).filter(s => s !== name) }));
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill(editData.skillsInput);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
        addSkill(suggestions[highlightIdx]);
      } else {
        addSkill(editData.skillsInput);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightIdx(-1);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (editing) setEditData({ 
      ...exp, 
      skillsInput: '',
      skills: exp.skills || [],
      employmentType: exp.employmentType || 'Full-time',
      totalExpYears: exp.totalExpYears || '',
      totalExpMonths: exp.totalExpMonths || '',
      currentSalary: exp.currentSalary || ''
    });
  }, [editing, exp]);

  const duration = formatDuration(exp.startDate, exp.currentlyWorking ? null : exp.endDate);
  const dateLabel = formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking);

  if (editing) {
    return (
      <div className="bdm-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
        <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '700px' }}>
          <div className="bdm-header">
            <div className="bdm-title-row">
              <h2 className="bdm-title">Employment</h2>
              <button className="bdm-close" onClick={onCancel}><FiX size={20} /></button>
            </div>
          </div>
          <div className="bdm-body">
            <p className="bdm-sub-label" style={{ marginTop: '-12px', marginBottom: '24px' }}>Details like job title, company name, etc, help employers understand your work</p>
            <div className="bdm-form">
              <div className="bdm-field">
                <label>Is this your current employment?</label>
                <div className="bdm-radio-group">
                  <label>
                    <input type="radio" name="currentJob" checked={editData.currentlyWorking} onChange={() => setEditData(p => ({ ...p, currentlyWorking: true, endDate: '' }))} /> Yes
                  </label>
                  <label>
                    <input type="radio" name="currentJob" checked={!editData.currentlyWorking} onChange={() => setEditData(p => ({ ...p, currentlyWorking: false }))} /> No
                  </label>
                </div>
              </div>

              <div className="bdm-field">
                <label>Employment type</label>
                <div className="bdm-radio-group">
                  <label>
                    <input type="radio" name="empType" checked={editData.employmentType === 'Full-time'} onChange={() => setEditData(p => ({ ...p, employmentType: 'Full-time' }))} /> Full-time
                  </label>
                  <label>
                    <input type="radio" name="empType" checked={editData.employmentType === 'Internship'} onChange={() => setEditData(p => ({ ...p, employmentType: 'Internship' }))} /> Internship
                  </label>
                </div>
              </div>

              <div className="bdm-field">
                <label>Total experience <span>*</span></label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <CustomSelect 
                    value={editData.totalExpYears} 
                    onChange={e => setEditData(p => ({ ...p, totalExpYears: e.target.value }))}
                    placeholder="Years"
                    options={[...Array(31)].map((_, i) => ({ label: `${i} Years`, value: String(i) }))}
                  />
                  <CustomSelect 
                    value={editData.totalExpMonths} 
                    onChange={e => setEditData(p => ({ ...p, totalExpMonths: e.target.value }))}
                    placeholder="Months"
                    options={[...Array(12)].map((_, i) => ({ label: `${i} Months`, value: String(i) }))}
                  />
                </div>
              </div>

              <div className="bdm-field">
                <label>Current company name <span>*</span></label>
                <input value={editData.company} onChange={e => setEditData(p => ({ ...p, company: e.target.value }))} placeholder="Type your organization" />
              </div>

              <div className="bdm-field">
                <label>Current job title <span>*</span></label>
                <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} placeholder="Type your designation" />
              </div>

              <div className="bdm-field">
                <label>Joining date <span>*</span></label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input type="month" value={editData.startDate} onChange={e => setEditData(p => ({ ...p, startDate: e.target.value }))} />
                  {!editData.currentlyWorking && (
                    <input type="month" value={editData.endDate} onChange={e => setEditData(p => ({ ...p, endDate: e.target.value }))} />
                  )}
                </div>
              </div>

              <div className="bdm-field">
                <label>Current salary <span>*</span></label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CustomSelect 
                    value="₹"
                    onChange={() => {}}
                    placeholder="₹"
                    options={[
                      { label: '₹', value: '₹' },
                      { label: '$', value: '$' }
                    ]}
                    style={{ width: '100px' }}
                  />
                  <input value={editData.currentSalary} onChange={e => setEditData(p => ({ ...p, currentSalary: e.target.value }))} placeholder="Eg. 4,50,000" style={{ flex: 1 }} />
                </div>
              </div>

              <div className="bdm-field">
                <label>Skills used <span>*</span></label>
                
                <div className="ps-skills-grid" style={{ marginBottom: (editData.skills && editData.skills.length > 0) ? '12px' : '0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(editData.skills || []).map((s) => (
                    <SkillChip key={s} name={s} removable onRemove={handleRemoveSkill} />
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    value={editData.skillsInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Add skills"
                  />
                  {loading && <FiLoader size={14} className="ps-input-spinner" style={{ position: 'absolute', right: '16px', top: '12px', color: 'var(--text-3)' }} />}
                  
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="ps-autocomplete-dropdown" ref={dropdownRef} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--slate-3)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', padding: '8px 0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                      {suggestions.map((s, i) => {
                      const matchIdx = s.toLowerCase().indexOf(editData.skillsInput.toLowerCase());
                      const beforeMatch = matchIdx >= 0 ? s.substring(0, matchIdx) : '';
                      const matchText = matchIdx >= 0 ? s.substring(matchIdx, matchIdx + editData.skillsInput.length) : '';
                      const afterMatch = matchIdx >= 0 ? s.substring(matchIdx + editData.skillsInput.length) : s;
                      return (
                        <li
                          key={s}
                          className={`ps-autocomplete-item ${highlightIdx === i ? 'ps-autocomplete-item-active' : ''}`}
                          onMouseDown={(e) => { e.preventDefault(); addSkill(s); }}
                          onMouseEnter={() => setHighlightIdx(i)}
                          style={{ padding: '8px 16px', cursor: 'pointer', background: highlightIdx === i ? 'var(--blue-lt)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span>
                            {beforeMatch}
                            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{matchText}</span>
                            {afterMatch}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="bdm-field">
              <label>Profile summary <span>*</span></label>
              <textarea value={editData.summary} onChange={e => setEditData(p => ({ ...p, summary: e.target.value }))} placeholder="Eg. Details about your role and responsibilities" rows={4} />
              <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '4px' }}>{2000 - (editData.summary?.length || 0)} character(s) left</p>
            </div>
            
            <div className="bdm-field">
              <label>Notice period <span>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months', 'Serving Notice Period'].map(np => (
                  <button
                    key={np}
                    onClick={() => setEditData(p => ({ ...p, noticePeriod: np }))}
                    className={`bdm-pill ${editData.noticePeriod === np ? 'active' : ''}`}
                  >
                    {np}
                  </button>
                ))}
              </div>
            </div>
            </div>

          </div>
          <div className="bdm-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '24px 32px' }}>
            <button className="bdm-btn-cancel" onClick={onCancel} style={{ border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none' }}>Cancel</button>
            <button className="bdm-btn-save" onClick={() => {
              const pendingSkill = editData.skillsInput.trim();
              const finalSkills = pendingSkill && !(editData.skills || []).includes(pendingSkill) ? [...(editData.skills || []), pendingSkill] : (editData.skills || []);
              onSave({ ...editData, skills: finalSkills });
            }} style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, fontSize: '0.95rem' }}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-exp-item">
      <div className="ps-exp-row" style={{ marginBottom: exp.summary || exp.skills?.length ? 10 : 0 }}>
        <div className="ps-exp-icon" style={{ background: palette.bg, color: palette.color }}>
          {getInitials(exp.company || 'Company')}
        </div>
        <div className="ps-exp-info">
          <h4 className="ps-exp-title">{exp.title}</h4>
          <p className="ps-exp-company">
            {exp.company}
            {duration && <span className="ps-exp-badge"><FiClock size={10} /> {duration}</span>}
          </p>
          <div className="ps-exp-meta">
            {dateLabel && <span><FiCalendar size={11} /> {dateLabel}</span>}
            {exp.noticePeriod && <span>{exp.noticePeriod} notice</span>}
            {exp.location && <span><FiMapPin size={11} /> {exp.location}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-start', flexShrink: 0 }}>
          <button className="ps-icon-btn" onClick={onEditThis} aria-label="Edit"><FiEdit2 size={13} /></button>
          <button className="ps-icon-btn ps-icon-btn-danger" onClick={onDelete} aria-label="Delete"><FiTrash2 size={13} /></button>
        </div>
      </div>
      {exp.summary && (
        <div className="ps-exp-summary-wrap">
          <p className="ps-exp-summary">{expanded ? exp.summary : exp.summary.length > 200 ? exp.summary.slice(0, 200) + '...' : exp.summary}</p>
          {exp.summary.length > 200 && (
            <button className="ps-see-more" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'See more'} <FiChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>
      )}
      {exp.skills?.length > 0 && (
        <div className="ps-exp-skills">
          {exp.skills.map(s => <span key={s} className="ps-exp-skill">{s}</span>)}
        </div>
      )}
    </div>
  );
});

const ExperienceSection = React.memo(({ user, onEdit, onSave }) => {
  const [experiences, setExperiences] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  const raw = user?.workExperiences;
  const parsed = Array.isArray(raw) ? raw : [];
  const totalDuration = calcTotalDuration(experiences.length ? experiences : parsed);

  useEffect(() => {
    if (parsed.length) setExperiences(parsed);
    else if (user?.currentTitle) setExperiences([{ id: Date.now(), title: user.currentTitle, company: user.currentCompany || '', totalExperience: user.totalExperience || '', noticePeriod: user.noticePeriod || '', location: user.currentCity || '', summary: '', skills: [], startDate: '', endDate: '', currentlyWorking: false }]);
    else setExperiences([]);
  }, [user?.workExperiences, user?.currentTitle, user?.currentCompany, user?.totalExperience, user?.noticePeriod, user?.currentCity]);

  const handleAdd = () => {
    setExperiences(prev => [...prev, emptyExp()]);
    setEditIndex(experiences.length);
  };

  const handleSaveItem = async (data) => {
    const next = [...experiences];
    const dataToSave = { ...data };
    delete dataToSave.isNew;
    if (editIndex !== null && editIndex < next.length) {
      next[editIndex] = { ...dataToSave, id: next[editIndex]?.id || Date.now() + Math.random() };
    } else {
      next.push({ ...dataToSave, id: Date.now() + Math.random() });
    }
    setExperiences(next);
    setEditIndex(null);
    setSaving(true);
    await onSave({ workExperiences: JSON.stringify(next) });
    setSaving(false);
  };

  const handleCancel = () => {
    setExperiences(prev => prev.filter(e => !e.isNew));
    setEditIndex(null);
  };

  const handleDelete = (idx) => {
    const next = experiences.filter((_, i) => i !== idx);
    setExperiences(next);
    onSave({ workExperiences: JSON.stringify(next) });
  };

  const isEmpty = !experiences.length && !user?.currentTitle;

  if (isEmpty && editIndex === null) {
    return (
      <div className="ps-card ps-add-card" onClick={handleAdd} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Experience</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiBriefcase size={14} />
          <span>Add your work experience</span>
        </div>
      </div>
    );
  }

  const displayExps = experiences.length ? experiences : parsed;

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Experience</h3>
        {editIndex === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {totalDuration && <span className="ps-total-exp"><FiClock size={12} /> {totalDuration}</span>}
            <button className="ps-edit-btn" onClick={handleAdd} aria-label="Add experience" title="Add experience">
              <FiPlus size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="ps-exp-list">
        {displayExps.map((exp, i) => (
          <ExperienceCard
            key={exp.id || i}
            exp={exp}
            palette={COLORS[i % COLORS.length]}
            onEditThis={() => setEditIndex(i)}
            onDelete={() => handleDelete(i)}
            editing={editIndex === i}
            onSave={handleSaveItem}
            onCancel={handleCancel}
          />
        ))}
        {editIndex === null && displayExps.length > 0 && (
          <button className="ps-add-exp-btn" onClick={handleAdd}>
            <FiPlus size={14} /> Add another experience
          </button>
        )}
      </div>
    </div>
  );
});

export default ExperienceSection;
