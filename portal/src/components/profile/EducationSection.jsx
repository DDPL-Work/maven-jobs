import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiEdit2, FiPlus, FiTrash2, FiCheck, FiX, FiCalendar } from 'react-icons/fi';

const emptyEdu = () => ({
  id: Date.now() + Math.random(),
  school: '',
  degree: '',
  field: '',
  startYear: '',
  endYear: '',
  currentlyStudying: false,
});

const formatEduYears = (e) => {
  if (e.startYear && e.currentlyStudying) return `${e.startYear} - Present`;
  if (e.startYear && e.endYear) return `${e.startYear} - ${e.endYear}`;
  if (e.startYear) return e.startYear;
  return '';
};

const EduCard = React.memo(({ edu, palette, onEdit, onDelete, editing, onSaveItem, onCancel }) => {
  const [f, setF] = useState({ ...edu });

  useEffect(() => {
    if (editing) setF({ ...edu });
  }, [editing, edu]);

  if (editing) {
    return (
      <div className="ps-edu-edit-card">
        <div className="ps-field">
          <label className="ps-label">School / University *</label>
          <input className="ps-input" value={f.school} onChange={e => setF(p => ({ ...p, school: e.target.value }))} placeholder="e.g. Stanford University" />
        </div>
        <div className="ps-field-row">
          <div className="ps-field">
            <label className="ps-label">Degree</label>
            <input className="ps-input" value={f.degree} onChange={e => setF(p => ({ ...p, degree: e.target.value }))} placeholder="e.g. Bachelor of Science" />
          </div>
          <div className="ps-field">
            <label className="ps-label">Field of Study</label>
            <input className="ps-input" value={f.field} onChange={e => setF(p => ({ ...p, field: e.target.value }))} placeholder="e.g. Computer Science" />
          </div>
        </div>
        <div className="ps-field-row">
          <div className="ps-field">
            <label className="ps-label">Start Year</label>
            <input className="ps-input" type="month" value={f.startYear} onChange={e => setF(p => ({ ...p, startYear: e.target.value }))} />
          </div>
          <div className="ps-field" style={{ opacity: f.currentlyStudying ? 0.35 : 1, pointerEvents: f.currentlyStudying ? 'none' : 'auto' }}>
            <label className="ps-label">End Year</label>
            <input className="ps-input" type="month" value={f.endYear} onChange={e => setF(p => ({ ...p, endYear: e.target.value }))} disabled={f.currentlyStudying} />
          </div>
        </div>
        <label className="ps-checkbox-label">
          <input type="checkbox" checked={f.currentlyStudying} onChange={e => setF(p => ({ ...p, currentlyStudying: e.target.checked, endYear: e.target.checked ? '' : p.endYear }))} />
          <span>Currently studying here</span>
        </label>
        <div className="ps-edit-actions">
          <button className="ps-btn ps-btn-primary" onClick={() => f.school.trim() && onSaveItem(f)} disabled={!f.school.trim()}>
            <FiCheck size={14} /> Save
          </button>
          <button className="ps-btn ps-btn-ghost" onClick={onCancel}><FiX size={14} /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-edu-item">
      <div className="ps-edu-icon-col">
        <FiBookOpen size={18} />
      </div>
      <div className="ps-edu-info">
        <h4 className="ps-edu-degree">{edu.degree ? `${edu.degree}${edu.field ? `, ${edu.field}` : ''}` : edu.school}</h4>
        {edu.degree && edu.school && <p className="ps-edu-school">{edu.school}</p>}
        {!edu.degree && edu.school && <p className="ps-edu-school">{edu.school}</p>}
        {formatEduYears(edu) && (
          <p className="ps-edu-years"><FiCalendar size={11} /> {formatEduYears(edu)}</p>
        )}
      </div>
      <div className="ps-edu-actions">
        <button className="ps-icon-btn" onClick={onEdit} aria-label="Edit"><FiEdit2 size={13} /></button>
        <button className="ps-icon-btn ps-icon-btn-danger" onClick={onDelete} aria-label="Delete"><FiTrash2 size={13} /></button>
      </div>
    </div>
  );
});

const EducationSection = React.memo(({ user, onEdit, onSave }) => {
  const [educations, setEducations] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const raw = user?.educations;
  const parsed = Array.isArray(raw) ? raw : [];

  useEffect(() => {
    if (parsed.length) setEducations(parsed);
    else if (user?.education) setEducations([{ id: Date.now(), school: user.education, degree: '', field: '', startYear: '', endYear: '', currentlyStudying: false }]);
    else setEducations([]);
  }, [user?.educations, user?.education]);

  const [prevState, setPrevState] = useState(null);

  const persist = async (next) => {
    const prev = educations;
    setPrevState(prev);
    setSaving(true);
    setEducations(next);
    setEditIdx(null);
    const result = await onSave({ educations: JSON.stringify(next) });
    if (!result || !result.success) {
      setEducations(prev);
    }
    setSaving(false);
  };

  const handleAdd = () => {
    setEducations(prev => [...prev, emptyEdu()]);
    setEditIdx(educations.length);
  };

  const handleSaveItem = (data) => {
    if (!data.school.trim()) return;
    const next = [...educations];
    if (editIdx !== null) next[editIdx] = { ...data, id: next[editIdx]?.id || Date.now() + Math.random() };
    else next.push({ ...data, id: Date.now() + Math.random() });
    persist(next);
  };

  const handleDelete = (idx) => {
    persist(educations.filter((_, i) => i !== idx));
  };

  const isEmpty = !educations.length && !user?.education;

  if (isEmpty && editIdx === null) {
    return (
      <div className="ps-card ps-add-card" onClick={handleAdd} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Education</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiBookOpen size={14} />
          <span>Add your education</span>
        </div>
      </div>
    );
  }

  const display = educations.length ? educations : parsed;

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Education</h3>
        {editIdx === null && (
          <button className="ps-edit-btn" onClick={handleAdd} aria-label="Add education" title="Add education">
            <FiPlus size={16} />
          </button>
        )}
      </div>
      <div className="ps-edu-list">
        {display.map((edu, i) => (
          <EduCard
            key={edu.id || i}
            edu={edu}
            editing={editIdx === i}
            onEdit={() => setEditIdx(i)}
            onDelete={() => handleDelete(i)}
            onSaveItem={handleSaveItem}
            onCancel={() => setEditIdx(null)}
          />
        ))}
        {editIdx === null && display.length > 0 && (
          <button className="ps-add-exp-btn" onClick={handleAdd}>
            <FiPlus size={14} /> Add another education
          </button>
        )}
      </div>
    </div>
  );
});

export default EducationSection;
