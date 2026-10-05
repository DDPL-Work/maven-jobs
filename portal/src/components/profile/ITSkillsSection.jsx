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

        /* Desktop Table View */
        .it-skills-desktop-view {
          display: block;
          overflow-x: auto;
        }

        .it-skills-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.92rem;
        }

        .it-skills-table th {
          padding: 10px 12px;
          font-weight: 600;
          font-size: 0.82rem;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          letter-spacing: 0.02em;
        }

        .it-skills-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .it-skills-table tr:last-child td {
          border-bottom: none;
        }

        .it-skills-table .it-skill-name-cell {
          font-weight: 600;
          color: #0f172a;
        }

        .it-action-edit-btn {
          background: none;
          border: none;
          color: var(--blue, #2563eb);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .it-action-edit-btn:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }

        /* Mobile Card View */
        .it-skills-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 10px;
        }

        .it-skill-mobile-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 13px 15px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .it-skill-mobile-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        .it-skill-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .it-skill-name-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .it-skill-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .it-skill-version-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          background: #e2e8f0;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .it-skill-edit-btn-mob {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: var(--blue, #2563eb);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .it-skill-edit-btn-mob:hover,
        .it-skill-edit-btn-mob:active {
          background: #eff6ff;
          border-color: var(--blue, #2563eb);
        }

        .it-skill-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .it-skill-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.8rem;
        }

        .it-meta-label {
          color: #64748b;
          font-weight: 500;
        }

        .it-meta-val {
          color: #1e293b;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .it-skills-desktop-view {
            display: none;
          }
          .it-skills-mobile-cards {
            display: flex;
          }
          .it-skills-modal-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
      `}</style>
      <div className="ps-card">
        <div className="ps-card-header">
          <h3 className="ps-section-title">IT skills</h3>
          {!editing && skills.length < 10 && (
            <button
              className="ps-edit-btn"
              onClick={() => handleEditClick(null)}
              aria-label="Add IT Skill"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--blue)',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              Add <FiPlus size={16} />
            </button>
          )}
        </div>

        <div className="ps-about-body">
          {skills.length === 0 ? (
            <div
              className="ps-add-placeholder"
              onClick={() => handleEditClick(null)}
              style={{ cursor: 'pointer' }}
            >
              <FiEdit2 size={14} />
              <span>Add your IT skills, software, and tools (Max 10)</span>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="it-skills-desktop-view">
                <table className="it-skills-table">
                  <thead>
                    <tr>
                      <th>Skills</th>
                      <th>Version</th>
                      <th>Last used</th>
                      <th>Experience</th>
                      <th style={{ width: '44px', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id}>
                        <td className="it-skill-name-cell">{skill.name}</td>
                        <td>{skill.version || '—'}</td>
                        <td>{skill.lastUsed || '—'}</td>
                        <td>{formatExperience(skill.expYears, skill.expMonths)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="it-action-edit-btn"
                            onClick={() => handleEditClick(skill)}
                            aria-label={`Edit ${skill.name}`}
                          >
                            <FiEdit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="it-skills-mobile-cards">
                {skills.map((skill) => (
                  <div key={skill.id} className="it-skill-mobile-card">
                    <div className="it-skill-card-top">
                      <div className="it-skill-name-wrap">
                        <span className="it-skill-name">{skill.name}</span>
                        {skill.version && (
                          <span className="it-skill-version-tag">{skill.version}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="it-skill-edit-btn-mob"
                        onClick={() => handleEditClick(skill)}
                        aria-label={`Edit ${skill.name}`}
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </div>

                    <div className="it-skill-card-meta">
                      <div className="it-skill-meta-pill">
                        <span className="it-meta-label">Experience</span>
                        <span className="it-meta-val">
                          {formatExperience(skill.expYears, skill.expMonths)}
                        </span>
                      </div>
                      {skill.lastUsed && (
                        <div className="it-skill-meta-pill">
                          <span className="it-meta-label">Last used</span>
                          <span className="it-meta-val">{skill.lastUsed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {editing && (
          <div className="bdm-overlay" onClick={handleCancel}>
            <div className="bdm-container" onClick={(e) => e.stopPropagation()}>
              <div className="bdm-header">
                <div className="bdm-title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="bdm-title">IT skills</h2>
                    <span
                      style={{
                        color: '#16a34a',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      Add 10%
                    </span>
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

                  <div
                    className="bdm-row it-skills-modal-grid"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
                  >
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
                      <CustomSelect
                        className="it-skills-dropdown"
                        value={lastUsed}
                        onChange={(e) => setLastUsed(e.target.value)}
                        options={yearOptions}
                        placeholder="Last used"
                      />
                    </div>
                  </div>

                  <div className="bdm-field">
                    <label>Experience</label>
                    <div
                      className="bdm-row it-skills-modal-grid"
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
                    >
                      <CustomSelect
                        className="it-skills-dropdown"
                        value={expYears}
                        onChange={(e) => setExpYears(e.target.value)}
                        options={yearExpOptions}
                        placeholder="Years"
                      />
                      <CustomSelect
                        className="it-skills-dropdown"
                        value={expMonths}
                        onChange={(e) => setExpMonths(e.target.value)}
                        options={monthExpOptions}
                        placeholder="Months"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bdm-footer"
                style={{
                  padding: '24px',
                  borderTop: '1px solid var(--slate-3)',
                  display: 'flex',
                  justifyContent: editItem ? 'space-between' : 'flex-end',
                  background: 'var(--card-bg)',
                }}
              >
                {editItem && (
                  <button
                    className="ps-btn ps-btn-ghost"
                    onClick={() => handleDeleteItem(editItem.id)}
                    style={{
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FiTrash2 size={16} /> Delete
                  </button>
                )}
                <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
                  <button
                    className="bdm-btn-cancel"
                    onClick={handleCancel}
                    style={{
                      border: 'none',
                      color: 'var(--blue)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="bdm-btn-save"
                    onClick={handleSaveItem}
                    disabled={saving || !name.trim()}
                    style={{
                      background: 'var(--blue)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 24px',
                      borderRadius: '24px',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      opacity: !name.trim() || saving ? 0.7 : 1,
                    }}
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
