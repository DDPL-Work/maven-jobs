import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';

const AboutSection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user?.summary || '');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { if (editing) textRef.current?.focus(); }, [editing]);
  useEffect(() => { setValue(user?.summary || ''); }, [user?.summary]);

  const summary = value;
  const short = summary?.length > 250 ? summary.slice(0, 250) + '...' : summary;

  const handleSave = async () => {
    setSaving(true);
    const r = await onSave({ summary: value });
    if (r?.success) setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setValue(user?.summary || '');
    setEditing(false);
  };

  if (!user?.summary && !editing) {
    return (
      <div className="ps-card ps-add-card" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">About</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiEdit2 size={14} />
          <span>Add a professional summary to tell recruiters about yourself</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">About</h3>
        {!editing && (
          <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit about section">
            <FiEdit2 size={14} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="ps-edit-wrap">
          <textarea ref={textRef} className="ps-textarea" value={value} onChange={e => setValue(e.target.value)} placeholder="Write a professional summary..." rows={4} />
          <div className="ps-edit-actions">
            <button className="ps-btn ps-btn-primary" onClick={handleSave} disabled={saving}>
              <FiCheck size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={handleCancel}><FiX size={14} /> Cancel</button>
          </div>
        </div>
      ) : (
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

export default AboutSection;
