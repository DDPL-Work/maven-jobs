import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiEdit2, FiCalendar, FiMapPin, FiCheck, FiX, FiPlus, FiTrash2, FiChevronDown, FiClock } from 'react-icons/fi';

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
  const [editData, setEditData] = useState({ ...exp, skillsInput: (exp.skills || []).join(', ') });

  useEffect(() => {
    if (editing) setEditData({ ...exp, skillsInput: (exp.skills || []).join(', ') });
  }, [editing, exp]);

  const duration = formatDuration(exp.startDate, exp.currentlyWorking ? null : exp.endDate);
  const dateLabel = formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking);

  if (editing) {
    return (
      <div className="ps-exp-edit-card">
        <div className="ps-field-row">
          <div className="ps-field">
            <label className="ps-label">Job Title</label>
            <input className="ps-input" value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Software Engineer" />
          </div>
          <div className="ps-field">
            <label className="ps-label">Company</label>
            <input className="ps-input" value={editData.company} onChange={e => setEditData(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" />
          </div>
        </div>
        <div className="ps-field-row">
          <div className="ps-field">
            <label className="ps-label">Start Date</label>
            <input className="ps-input" type="month" value={editData.startDate} onChange={e => setEditData(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="ps-field" style={{ opacity: editData.currentlyWorking ? 0.35 : 1, pointerEvents: editData.currentlyWorking ? 'none' : 'auto' }}>
            <label className="ps-label">End Date</label>
            <input className="ps-input" type="month" value={editData.endDate} onChange={e => setEditData(p => ({ ...p, endDate: e.target.value }))} disabled={editData.currentlyWorking} />
          </div>
        </div>
        <label className="ps-checkbox-label">
          <input type="checkbox" checked={editData.currentlyWorking} onChange={e => setEditData(p => ({ ...p, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : p.endDate }))} />
          <span>I currently work here</span>
        </label>
        <div className="ps-field-row">
          <div className="ps-field">
            <label className="ps-label">Notice Period</label>
            <input className="ps-input" value={editData.noticePeriod} onChange={e => setEditData(p => ({ ...p, noticePeriod: e.target.value }))} placeholder="e.g. 30 Days" />
          </div>
          <div className="ps-field">
            <label className="ps-label">Location</label>
            <input className="ps-input" value={editData.location} onChange={e => setEditData(p => ({ ...p, location: e.target.value }))} placeholder="e.g. New Delhi" />
          </div>
        </div>
        <div className="ps-field">
          <label className="ps-label">Summary</label>
          <textarea className="ps-textarea" value={editData.summary} onChange={e => setEditData(p => ({ ...p, summary: e.target.value }))} placeholder="Describe your responsibilities and achievements..." rows={3} />
        </div>
        <div className="ps-field">
          <label className="ps-label">Skills Used (comma-separated)</label>
          <input className="ps-input" value={editData.skillsInput} onChange={e => setEditData(p => ({ ...p, skillsInput: e.target.value }))} placeholder="e.g. React, Node.js, MongoDB" />
        </div>
        <div className="ps-edit-actions">
          <button className="ps-btn ps-btn-primary" onClick={() => onSave({ ...editData, skills: editData.skillsInput.split(',').map(s => s.trim()).filter(Boolean) })}>
            <FiCheck size={14} /> Save
          </button>
          <button className="ps-btn ps-btn-ghost" onClick={onCancel}><FiX size={14} /> Cancel</button>
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
    if (editIndex !== null) next[editIndex] = { ...data, id: next[editIndex]?.id || Date.now() + Math.random() };
    else next.push({ ...data, id: Date.now() + Math.random() });
    setExperiences(next);
    setEditIndex(null);
    setSaving(true);
    await onSave({ workExperiences: JSON.stringify(next) });
    setSaving(false);
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
            onCancel={() => setEditIndex(null)}
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
