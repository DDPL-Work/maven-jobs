import React, { useState, useEffect } from 'react';
import { LuX, LuChevronDown, LuCalendar } from 'react-icons/lu';

const LogActivityModal = ({ lead, initialData, onClose, onSubmit }) => {
  const [status, setStatus] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [interactionMode, setInteractionMode] = useState('Call');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  useEffect(() => {
    if (initialData) {
      setStatus(initialData.status || '');
      setSubStatus(initialData.subStatus || '');
      setInteractionMode(initialData.type || 'Call');
      if (initialData.date) {
        setActivityDate(new Date(initialData.date).toISOString().split('T')[0]);
      }
      setNotes(initialData.remark || initialData.notes || '');
      if (initialData.nextFollowUpAt || initialData.nextFollowUp) {
        const d = new Date(initialData.nextFollowUpAt || initialData.nextFollowUp);
        setNextFollowUp(d.toISOString().split('T')[0]);
      }
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
      status, 
      subStatus, 
      type: interactionMode, 
      date: activityDate, 
      remark: notes, 
      nextFollowUpAt: nextFollowUp 
    });
  };

  return (
    <div className="modal-overlay log-activity-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div className="modal-content log-activity-modal" style={{
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '520px',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        
        <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Log Follow-up</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: '600' }}>{lead?.companyName || 'Lead Company'}</p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'none', 
            border: 'none', 
            color: '#94a3b8', 
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            borderRadius: '50%',
            transition: 'background 0.2s'
          }}>
            <LuX size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STATUS */}
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>STATUS</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  backgroundColor: '#f8fafc', 
                  fontSize: '0.95rem', 
                  color: '#334155', 
                  fontWeight: '500',
                  appearance: 'none'
                }}
                required
              >
                <option value="">Select Status...</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Converted">Converted (Onboarded)</option>
                <option value="Pending">Pending Validation</option>
              </select>
              <LuChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* SUB STATUS */}
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>SUB STATUS</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={subStatus} 
                onChange={(e) => setSubStatus(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  backgroundColor: '#f8fafc', 
                  fontSize: '0.95rem', 
                  color: '#334155', 
                  fontWeight: '500',
                  appearance: 'none'
                }}
              >
                <option value="">Select Sub Status...</option>
                <option value="Price Discussion">Price Discussion</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Call Back">Call Back</option>
                <option value="Comparison">Comparison with Others</option>
              </select>
              <LuChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* INTERACTION MODE */}
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>INTERACTION MODE</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={interactionMode} 
                  onChange={(e) => setInteractionMode(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    backgroundColor: '#f8fafc', 
                    fontSize: '0.95rem', 
                    color: '#334155', 
                    fontWeight: '500',
                    appearance: 'none'
                  }}
                >
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Visit">Field Visit</option>
                  <option value="Email">Email</option>
                </select>
                <LuChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* ACTIVITY DATE */}
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>ACTIVITY DATE</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={activityDate} 
                  onChange={(e) => setActivityDate(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    backgroundColor: '#f8fafc', 
                    fontSize: '0.95rem', 
                    color: '#334155', 
                    fontWeight: '500'
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* MEETING NOTES */}
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>MEETING NOTES</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key takeaways, client response, and next steps..."
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid #f1f5f9', 
                backgroundColor: '#f8fafc', 
                fontSize: '0.95rem', 
                color: '#334155', 
                fontWeight: '500',
                minHeight: '120px',
                resize: 'none'
              }}
              required
            ></textarea>
          </div>

          {/* NEXT FOLLOW-UP */}
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '8px', letterSpacing: '0.5px' }}>NEXT FOLLOW-UP</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                value={nextFollowUp} 
                onChange={(e) => setNextFollowUp(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  backgroundColor: '#f8fafc', 
                  fontSize: '0.95rem', 
                  color: '#334155', 
                  fontWeight: '500'
                }}
              />
              <LuCalendar style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          <button type="submit" style={{ 
            marginTop: '12px',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#1e40af',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.2)'
          }}>
            {initialData ? 'Update Record' : 'Submit Follow-up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogActivityModal;
