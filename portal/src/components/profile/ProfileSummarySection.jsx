import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';

const ProfileSummarySection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [summaryValue, setSummaryValue] = useState(user?.summary || '');
  const [headlineValue, setHeadlineValue] = useState(user?.headline || '');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { if (editing) textRef.current?.focus(); }, [editing]);
  useEffect(() => { 
    setSummaryValue(user?.summary || ''); 
    setHeadlineValue(user?.headline || '');
  }, [user?.summary, user?.headline]);

  const summary = summaryValue;
  const short = summary?.length > 250 ? summary.slice(0, 250) + '...' : summary;

  const handleSave = async () => {
    setSaving(true);
    const r = await onSave({ summary: summaryValue, headline: headlineValue });
    if (r?.success !== false) setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setSummaryValue(user?.summary || '');
    setHeadlineValue(user?.headline || '');
    setEditing(false);
  };

  if (!user?.summary && !editing) {
    return (
      <div className="ps-card ps-add-card" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Profile summary</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiEdit2 size={14} />
          <span>Add a professional summary to highlight your achievements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Profile summary</h3>
        {!editing && (
          <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit about section">
            <FiEdit2 size={14} />
          </button>
        )}
      </div>
      {editing && (
        <div className="bdm-overlay" onClick={handleCancel} style={{ zIndex: 9999 }}>
          <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <div className="bdm-header">
              <div className="bdm-title-row">
                <h2 className="bdm-title">Profile summary</h2>
                <button className="bdm-close" onClick={handleCancel}><FiX size={20} /></button>
              </div>
            </div>
            <div className="bdm-body">
              <div className="bdm-form">
                <div className="bdm-field">
                  <label>Resume Headline</label>
                  <p className="bdm-sub-label" style={{ marginTop: '4px', marginBottom: '8px' }}>It is the first thing recruiters notice in your profile. Write concisely what makes you unique and right for the role you are looking for.</p>
                  <textarea value={headlineValue} onChange={e => setHeadlineValue(e.target.value)} placeholder="Start typing..." rows={3} />
                </div>
                <div className="bdm-field" style={{ marginTop: '24px' }}>
                  <label>Profile Summary</label>
                  <p className="bdm-sub-label" style={{ marginTop: '4px', marginBottom: '8px' }}>Your Profile Summary should mention the highlights of your career and education, what your professional interests are, and what kind of a career you are looking for.</p>
                  <textarea ref={textRef} value={summaryValue} onChange={e => setSummaryValue(e.target.value)} placeholder="Start typing..." rows={4} />
                </div>
              </div>
            </div>
            <div className="bdm-footer">
              <button className="bdm-btn-cancel" onClick={handleCancel}>Cancel</button>
              <button className="bdm-btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {!editing && (
        <div className="ps-about-body">
          <p className="ps-about-text">{expanded ? summary : short}</p>
          {summary?.length > 250 && (
            <button className="ps-see-more" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'See more'} <FiChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default ProfileSummarySection;
