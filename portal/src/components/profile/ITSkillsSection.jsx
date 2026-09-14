import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiCheck, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';
import CustomSelect from '../common/CustomSelect';

const ITSkillsSection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([]);
  const [editItem, setEditItem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [lastUsed, setLastUsed] = useState('');
  const [expYears, setExpYears] = useState('');
  const [expMonths, setExpMonths] = useState('');

  // Dropdown options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const val = String(currentYear - i);
    return { label: val, value: val };
  });
  const yearExpOptions = Array.from({ length: 16 }, (_, i) => {
    const val = i === 15 ? '15+' : String(i);
    return { label: val, value: val };
  });
  const monthExpOptions = Array.from({ length: 12 }, (_, i) => {
    const val = String(i);
    return { label: val, value: val };
  });

  useEffect(() => {
    try {
      if (typeof user?.itSkills === 'string') {
        const parsed = JSON.parse(user.itSkills);
        setSkills(Array.isArray(parsed) ? parsed : []);
      } else if (Array.isArray(user?.itSkills)) {
        setSkills(user.itSkills);
      } else {
        setSkills([]);
      }
    } catch (e) {
      setSkills([]); // fallback if invalid JSON
    }
  }, [user?.itSkills]);

  const handleEditClick = (item = null) => {
    if (item) {
      setEditItem(item);
      setName(item.name || '');
      setVersion(item.version || '');
      setLastUsed(item.lastUsed || '');
      setExpYears(item.expYears || '');
      setExpMonths(item.expMonths || '');
    } else {
      setEditItem(null);
      setName('');
      setVersion('');
      setLastUsed('');
      setExpYears('');
      setExpMonths('');
    }
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditItem(null);
  };

  const handleSaveItem = async () => {
    if (!name.trim()) return;

    const newItem = {
      id: editItem?.id || Date.now().toString(),
      name: name.trim(),
      version: version.trim(),
      lastUsed,
      expYears,
      expMonths,
    };

    let nextSkills;
    if (editItem) {
      nextSkills = skills.map((s) => (s.id === editItem.id ? newItem : s));
    } else {
      nextSkills = [...skills, newItem];
    }

    setSaving(true);
    await onSave({ itSkills: JSON.stringify(nextSkills) });
    setSaving(false);
    setEditing(false);
  };

  const handleDeleteItem = async (id) => {
    const nextSkills = skills.filter((s) => s.id !== id);
    setSaving(true);
    await onSave({ itSkills: JSON.stringify(nextSkills) });
    setSaving(false);
    setEditing(false);
  };

  const formatExperience = (y, m) => {
    const years = y ? `${y} Year${y === '1' ? '' : 's'}` : '0 Year';
    const months = m ? `${m} Month${m === '1' ? '' : 's'}` : '0 Month';
    return `${years} ${months}`;
  };

  return (
    <>
      <style>{`
        .it-skills-dropdown .custom-select-dropdown {
          max-height: 160px !important;
        }
      `}</style>
      <div className="ps-card">
        <div className="ps-card-header">
        <h3 className="ps-section-title">IT skills</h3>
        {!editing && skills.length < 10 && (
          <button className="ps-edit-btn" onClick={() => handleEditClick(null)} aria-label="Add IT Skill" style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            Add <FiPlus size={16} />
          </button>
        )}
      </div>

      <div className="ps-about-body">
        {skills.length === 0 ? (
          <div className="ps-add-placeholder" onClick={() => handleEditClick(null)} style={{ cursor: 'pointer' }}>
            <FiEdit2 size={14} />
            <span>Add your IT skills, software, and tools (Max 10)</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-3)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Skills</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Version</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Last used</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Experience</th>
                  <th style={{ padding: '12px 8px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 500, color: 'var(--navy)' }}>{skill.name}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-2)' }}>{skill.version || '-'}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-2)' }}>{skill.lastUsed || '-'}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-2)' }}>{formatExperience(skill.expYears, skill.expMonths)}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <button onClick={() => handleEditClick(skill)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', padding: '4px' }}>
                        <FiEdit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="bdm-overlay" onClick={handleCancel}>
          <div className="bdm-container" onClick={(e) => e.stopPropagation()}>
            <div className="bdm-header">
              <div className="bdm-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="bdm-title">IT skills</h2>
                  <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>Add 10%</span>
                </div>
                <button className="bdm-close" onClick={handleCancel}>
                  <FiX size={20} />
                </button>
              </div>
              <p className="bdm-sub-label">
                Mention skills like programming languages (Java, Python), softwares (Microsoft Word, Excel) and more, to show your technical expertise.
              </p>
            </div>
            
            <div className="bdm-body">
              <div className="bdm-form">
                <div className="bdm-field">
                  <label>
                    Skill / software name <span>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="bdm-input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Skill / Software name" 
                  />
                </div>
                
                <div className="bdm-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="bdm-field">
                    <label>Software version</label>
                    <input 
                      type="text" 
                      className="bdm-input" 
                      value={version} 
                      onChange={(e) => setVersion(e.target.value)} 
                      placeholder="Software version" 
                    />
                  </div>
                  
                  <div className="bdm-field">
                    <label>Last used</label>
                    <CustomSelect className="it-skills-dropdown" value={lastUsed} onChange={(e) => setLastUsed(e.target.value)} options={yearOptions} placeholder="Last used" />
                  </div>
                </div>

                <div className="bdm-field">
                  <label>Experience</label>
                  <div className="bdm-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <CustomSelect className="it-skills-dropdown" value={expYears} onChange={(e) => setExpYears(e.target.value)} options={yearExpOptions} placeholder="Years" />
                    <CustomSelect className="it-skills-dropdown" value={expMonths} onChange={(e) => setExpMonths(e.target.value)} options={monthExpOptions} placeholder="Months" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bdm-footer" style={{ padding: '24px', borderTop: '1px solid var(--slate-3)', display: 'flex', justifyContent: editItem ? 'space-between' : 'flex-end', background: 'var(--card-bg)' }}>
              {editItem && (
                <button 
                  className="ps-btn ps-btn-ghost" 
                  onClick={() => handleDeleteItem(editItem.id)} 
                  style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  <FiTrash2 size={16} /> Delete
                </button>
              )}
              <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
                <button 
                  className="bdm-btn-cancel" 
                  onClick={handleCancel}
                  style={{ border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  className="bdm-btn-save" 
                  onClick={handleSaveItem} 
                  disabled={saving || !name.trim()} 
                  style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', opacity: (!name.trim() || saving) ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
});

export default ITSkillsSection;
