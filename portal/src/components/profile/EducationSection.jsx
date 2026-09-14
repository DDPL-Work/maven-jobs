import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiEdit2, FiTrash2, FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';
import CustomSelect from '../common/CustomSelect';

const emptyEdu = () => ({
  id: Date.now() + Math.random(),
  isNew: true,
  school: '',
  degree: '',
  field: '',
  startYear: '',
  endYear: '',
  currentlyStudying: false,
  educationLevel: '',
  courseType: 'Full time',
  gradingSystem: '',
  marks: '',
});

const formatEduYears = (e) => {
  if (e.startYear && e.currentlyStudying) return `${e.startYear} - Present`;
  if (e.startYear && e.endYear) return `${e.startYear} - ${e.endYear}`;
  if (e.startYear) return e.startYear;
  return '';
};

const EduCard = React.memo(({ edu, palette, onEdit, onDelete, editing, onSaveItem, onCancel }) => {
  const [f, setF] = useState({ 
    ...edu,
    educationLevel: edu.educationLevel || '',
    courseType: edu.courseType || 'Full time',
    gradingSystem: edu.gradingSystem || '',
    marks: edu.marks || '',
  });

  useEffect(() => {
    if (editing) setF({ 
      ...edu,
      educationLevel: edu.educationLevel || '',
      courseType: edu.courseType || 'Full time',
      gradingSystem: edu.gradingSystem || '',
      marks: edu.marks || '',
    });
  }, [editing, edu]);

  if (editing) {
    return (
      <div className="bdm-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
        <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '700px' }}>
          <div className="bdm-header">
            <div className="bdm-title-row">
              <h2 className="bdm-title">Education</h2>
              <button className="bdm-close" onClick={onCancel}><FiX size={20} /></button>
            </div>
          </div>
          <div className="bdm-body">
            <p className="bdm-sub-label" style={{ marginTop: '-12px', marginBottom: '24px' }}>Details like course, university, and more, help recruiters identify your educational background</p>
            
            <div className="bdm-form">
              <div className="bdm-field">
                <label>Education <span>*</span></label>
                <CustomSelect 
                  value={f.educationLevel} 
                  onChange={e => setF(p => ({ ...p, educationLevel: e.target.value }))}
                  placeholder="Select education"
                  options={[
                    { label: 'Doctorate/Ph.D', value: 'Doctorate/Ph.D' },
                    { label: 'Masters/Post-Graduation', value: 'Masters/Post-Graduation' },
                    { label: 'Graduation/Diploma', value: 'Graduation/Diploma' },
                    { label: '12th', value: '12th' },
                    { label: '10th', value: '10th' }
                  ]}
                />
              </div>

              <div className="bdm-field">
                <label>University/Institute <span>*</span></label>
                <input value={f.school} onChange={e => setF(p => ({ ...p, school: e.target.value }))} placeholder="Select university/institute" />
              </div>

              <div className="bdm-field">
                <label>Course <span>*</span></label>
                <CustomSelect 
                  value={f.degree} 
                  onChange={e => setF(p => ({ ...p, degree: e.target.value }))}
                  placeholder="Select course"
                  options={[
                    { label: 'B.Tech/B.E.', value: 'B.Tech/B.E.' },
                    { label: 'B.Sc', value: 'B.Sc' },
                    { label: 'B.A', value: 'B.A' },
                    { label: 'B.Com', value: 'B.Com' },
                    { label: 'BCA', value: 'BCA' },
                    { label: 'M.Tech', value: 'M.Tech' },
                    { label: 'MBA/PGDM', value: 'MBA/PGDM' },
                    { label: 'MCA', value: 'MCA' }
                  ]}
                />
              </div>

              <div className="bdm-field">
                <label>Specialization <span>*</span></label>
                <CustomSelect 
                  value={f.field} 
                  onChange={e => setF(p => ({ ...p, field: e.target.value }))}
                  placeholder="Select specialization"
                  options={[
                    { label: 'Computers', value: 'Computers' },
                    { label: 'Electrical', value: 'Electrical' },
                    { label: 'Electronics', value: 'Electronics' },
                    { label: 'Mechanical', value: 'Mechanical' },
                    { label: 'Civil', value: 'Civil' },
                    { label: 'Information Technology', value: 'Information Technology' }
                  ]}
                />
              </div>

              <div className="bdm-field">
                <label>Course Type <span>*</span></label>
                <div className="bdm-radio-group">
                  <label>
                    <input type="radio" name="courseType" checked={f.courseType === 'Full time'} onChange={() => setF(p => ({ ...p, courseType: 'Full time' }))} /> Full time
                  </label>
                  <label>
                    <input type="radio" name="courseType" checked={f.courseType === 'Part time'} onChange={() => setF(p => ({ ...p, courseType: 'Part time' }))} /> Part time
                  </label>
                  <label>
                    <input type="radio" name="courseType" checked={f.courseType === 'Correspondence/Distance learning'} onChange={() => setF(p => ({ ...p, courseType: 'Correspondence/Distance learning' }))} /> Correspondence/Distance learning
                  </label>
                </div>
              </div>

              <div className="bdm-field">
                <label>Course duration <span>*</span></label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <CustomSelect 
                    value={f.startYear} 
                    onChange={e => setF(p => ({ ...p, startYear: e.target.value }))}
                    placeholder="Starting Year"
                    options={[...Array(30)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                  />
                  <CustomSelect 
                    value={f.endYear} 
                    onChange={e => setF(p => ({ ...p, endYear: e.target.value }))}
                    placeholder="Ending Year"
                    options={[...Array(35)].map((_, i) => ({ label: String(new Date().getFullYear() + 5 - i), value: String(new Date().getFullYear() + 5 - i) }))}
                  />
                </div>
              </div>

              <div className="bdm-field">
                <label>Grading System</label>
                <CustomSelect 
                  value={f.gradingSystem} 
                  onChange={e => setF(p => ({ ...p, gradingSystem: e.target.value }))}
                  placeholder="Select grading system"
                  options={[
                    { label: 'Scale 10 Grading System', value: 'Scale 10 Grading System' },
                    { label: 'Scale 4 Grading System', value: 'Scale 4 Grading System' },
                    { label: 'Marks', value: 'Marks' },
                    { label: 'Percentage', value: 'Percentage' }
                  ]}
                />
              </div>
              
              {f.gradingSystem && (
                <div className="bdm-field">
                  <label>{f.gradingSystem}</label>
                  <input value={f.marks} onChange={e => setF(p => ({ ...p, marks: e.target.value }))} placeholder="Eg. 8.5" />
                </div>
              )}
            </div>
          </div>
          <div className="bdm-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '24px 32px' }}>
            <button className="bdm-btn-cancel" onClick={onCancel} style={{ border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none' }}>Cancel</button>
            <button className="bdm-btn-save" onClick={() => f.school.trim() && onSaveItem(f)} disabled={!f.school.trim()} style={{ background: f.school.trim() ? 'var(--blue)' : 'var(--slate-3)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, fontSize: '0.95rem', cursor: f.school.trim() ? 'pointer' : 'not-allowed' }}>Save</button>
          </div>
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
    const dataToSave = { ...data };
    delete dataToSave.isNew;
    if (editIdx !== null && editIdx < next.length) {
      next[editIdx] = { ...dataToSave, id: next[editIdx]?.id || Date.now() + Math.random() };
    } else {
      next.push({ ...dataToSave, id: Date.now() + Math.random() });
    }
    persist(next);
  };

  const handleCancel = () => {
    setEducations(prev => prev.filter(e => !e.isNew));
    setEditIdx(null);
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
            onCancel={handleCancel}
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
