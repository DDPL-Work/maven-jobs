import React, { useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';

const DiversitySection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for form
  const [disability, setDisability] = useState(user?.diversityInfo?.disability || '');
  const [military, setMilitary] = useState(user?.diversityInfo?.military || '');
  const [careerBreak, setCareerBreak] = useState(user?.diversityInfo?.careerBreak || '');
  
  const handleSave = async () => {
    setSaving(true);
    const diversityInfo = { disability, military, careerBreak };
    const r = await onSave({ diversityInfo });
    if (r?.success !== false) setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setDisability(user?.diversityInfo?.disability || '');
    setMilitary(user?.diversityInfo?.military || '');
    setCareerBreak(user?.diversityInfo?.careerBreak || '');
    setEditing(false);
  };

  const di = user?.diversityInfo || {};
  const hasDetails = di.disability || di.military || di.careerBreak;

  return (
    <div className="ps-card" style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', top: '-12px', right: '16px', background: '#F3E8FF', color: '#7E22CE', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: '4px' }}>New</span>
      
      <div className="ps-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 className="ps-section-title">Diversity & inclusion</h3>
          {!editing && (
            <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit diversity">
              <FiEdit2 size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="bdm-sub-label" style={{ marginBottom: '16px' }}>Share details to attract recruiters who value people from different backgrounds</p>

      {!editing && (
        <div className="ps-diversity-view">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {di.disability ? (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '4px' }}>Disability status</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 500 }}>{di.disability}</div>
              </div>
            ) : (
              <div>
                <a href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Add disability status</a>
              </div>
            )}

            {di.military ? (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '4px' }}>Military experience</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 500 }}>{di.military}</div>
              </div>
            ) : (
              <div>
                <a href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Add military experience</a>
              </div>
            )}

            {di.careerBreak ? (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '4px' }}>Career break</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 500 }}>{di.careerBreak}</div>
              </div>
            ) : (
              <div>
                <a href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Add career break</a>
              </div>
            )}

          </div>
        </div>
      )}

      {editing && (
        <div className="bdm-overlay" onClick={handleCancel} style={{ zIndex: 9999 }}>
          <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <div className="bdm-header">
              <div className="bdm-title-row">
                <h2 className="bdm-title">Diversity & inclusion</h2>
                <button className="bdm-close" onClick={handleCancel}><FiX size={20} /></button>
              </div>
              <p className="bdm-sub-label">Share details to attract recruiters who value people from different backgrounds</p>
            </div>
            
            <div className="bdm-body">
              <div className="bdm-form">
                
                <div className="bdm-field">
                  <label>Disability status</label>
                  <p className="bdm-sub-label" style={{ marginTop: '2px', marginBottom: '8px' }}>Share your status to get jobs that match your needs</p>
                  <div className="bdm-pills">
                    {['Have disability', 'Do not have disability'].map(opt => (
                      <button key={opt} className={`bdm-pill ${disability === opt ? 'active' : ''}`} onClick={() => setDisability(opt)}>{opt}</button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Military experience</label>
                  <div className="bdm-pills">
                    {['Currently serving', 'Previously served', 'Never served'].map(opt => (
                      <button key={opt} className={`bdm-pill ${military === opt ? 'active' : ''}`} onClick={() => setMilitary(opt)}>{opt}</button>
                    ))}
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Career break</label>
                  <p className="bdm-sub-label" style={{ marginTop: '2px', marginBottom: '8px' }}>Help recruiters understand your unique path</p>
                  <div className="bdm-pills">
                    {['Have taken', 'Have not taken'].map(opt => (
                      <button key={opt} className={`bdm-pill ${careerBreak === opt ? 'active' : ''}`} onClick={() => setCareerBreak(opt)}>{opt}</button>
                    ))}
                  </div>
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
    </div>
  );
});

export default DiversitySection;
