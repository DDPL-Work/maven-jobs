import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiEdit2, FiPlus, FiX, FiCheck, FiLoader, FiSearch } from 'react-icons/fi';
import authService from '../../services/authService';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';

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

const SkillsSection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
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
      const res = await authService.suggestSkillsAutocomplete(query.trim(), [...skills, ...(user?.skills || [])]);
      const items = res?.data?.suggestions || [];
      const filtered = items.filter(s => !skills.includes(s));
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightIdx(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [skills, user?.skills]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setSuggestions([]);
      setShowDropdown(false);
      setNewSkill('');
    }
  }, [editing]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewSkill(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const addSkill = useCallback((name) => {
    const s = name.trim();
    if (!s || skills.includes(s)) return;
    const next = [...skills, s];
    setSkills(next);
    setNewSkill('');
    setSuggestions([]);
    setShowDropdown(false);
    setHighlightIdx(-1);
    onSave({ skills: next });
    if (inputRef.current) inputRef.current.focus();
  }, [skills, onSave]);

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill(newSkill);
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
        addSkill(newSkill);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightIdx(-1);
    }
  };

  const handleRemove = (name) => {
    const next = skills.filter(s => s !== name);
    setSkills(next);
    onSave({ skills: next });
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const displaySkills = editing ? skills : (user?.skills || []);

  if (!user?.skills?.length && !editing) {
    return (
      <div className="ps-card ps-add-card" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Key skills</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiPlus size={14} />
          <span>Add your key skills</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Key skills</h3>
        {!editing && (
          <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit skills">
            <FiEdit2 size={14} />
          </button>
        )}
      </div>
      {editing && (
        <div className="bdm-overlay" onClick={() => setEditing(false)} style={{ zIndex: 9999 }}>
          <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '700px' }}>
            <div className="bdm-header">
              <div className="bdm-title-row">
                <h2 className="bdm-title">Key skills</h2>
                <button className="bdm-close" onClick={() => setEditing(false)}><FiX size={20} /></button>
              </div>
            </div>
            
            <div className="bdm-body">
              <p className="bdm-sub-label" style={{ marginTop: '-12px', marginBottom: '24px' }}>Add skills that best define your expertise, for e.g, Direct Marketing, Oracle, Java, etc. (Minimum 1)</p>
              
              <div className="bdm-form">
                <div className="bdm-field">
                  <label>Skills</label>
                  <div className="ps-skills-grid" style={{ marginBottom: skills.length > 0 ? '16px' : '0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {skills.map((s) => (
                      <SkillChip key={s} name={s} removable onRemove={handleRemove} />
                    ))}
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputRef}
                      value={newSkill}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Add skills"
                    />
                    {loading && <FiLoader size={14} className="ps-input-spinner" style={{ position: 'absolute', right: '16px', top: '15px', color: 'var(--text-3)' }} />}
                    
                    {showDropdown && suggestions.length > 0 && (
                      <ul className="ps-autocomplete-dropdown" ref={dropdownRef} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--slate-3)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', padding: '8px 0', listStyle: 'none' }}>
                        {suggestions.map((s, i) => (
                          <li
                            key={s}
                            className={`ps-autocomplete-item ${highlightIdx === i ? 'ps-autocomplete-item-active' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); addSkill(s); }}
                            onMouseEnter={() => setHighlightIdx(i)}
                            style={{ padding: '8px 16px', cursor: 'pointer', background: highlightIdx === i ? 'var(--blue-lt)' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <FiSearch size={14} color="var(--text-4)" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <label>Or you can select from the suggested set of skills</label>
                  <div className="ps-skills-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {['Redux', 'React Native', 'Mern', 'Mern Stack', 'Hooks', 'Nextjs', 'Flux', 'UI', 'Jest', 'Pwa'].filter(s => !skills.includes(s)).map(s => (
                      <button key={s} onClick={() => addSkill(s)} style={{
                        background: 'white', border: '1px solid var(--slate-4)', borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                        {s} <FiPlus size={14} style={{ color: 'var(--text-3)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bdm-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: 'none', padding: '24px 32px' }}>
              <button className="bdm-btn-cancel" onClick={() => setEditing(false)} style={{ border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none' }}>Cancel</button>
              <button className="bdm-btn-save" onClick={() => { onSave({ skills }); setEditing(false); }} style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, fontSize: '0.95rem' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {!editing && (
        <div className="ps-skills-grid">
          {displaySkills.map((s) => (
            <SkillChip key={s} name={s} />
          ))}
        </div>
      )}
    </div>
  );
});

export default SkillsSection;
