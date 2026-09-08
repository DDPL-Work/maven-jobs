import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiEdit2, FiPlus, FiX, FiCheck, FiLoader, FiSearch } from 'react-icons/fi';
import authService from '../../services/authService';

const SkillChip = React.memo(({ name, removable, onRemove }) => (
  <span className="ps-skill-chip" style={removable ? { paddingRight: 8, display: 'inline-flex', alignItems: 'center', gap: 4 } : {}}>
    {name}
    {removable && <button onClick={() => onRemove(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', lineHeight: 1 }}><FiX size={12} /></button>}
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
          <h3 className="ps-section-title">Skills</h3>
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
        <h3 className="ps-section-title">Skills</h3>
        {!editing && (
          <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit skills">
            <FiEdit2 size={14} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="ps-edit-wrap">
          <div className="ps-skills-grid" style={{ marginBottom: 12 }}>
            {displaySkills.map((s) => (
              <SkillChip key={s} name={s} removable onRemove={handleRemove} />
            ))}
          </div>
          <div className="ps-autocomplete-wrap">
            <div className="ps-add-skill-row">
              <div className="ps-input-icon-wrap">
                <FiSearch size={14} className="ps-input-icon" />
                <input
                  ref={inputRef}
                  className="ps-input"
                  style={{ flex: 1, paddingLeft: 32 }}
                  value={newSkill}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Type a skill name…"
                />
                {loading && <FiLoader size={14} className="ps-input-spinner" />}
              </div>
              <button className="ps-btn ps-btn-primary" onClick={() => addSkill(newSkill)}><FiPlus size={14} /> Add</button>
            </div>
            {showDropdown && suggestions.length > 0 && (
              <ul className="ps-autocomplete-dropdown" ref={dropdownRef}>
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    className={`ps-autocomplete-item ${highlightIdx === i ? 'ps-autocomplete-item-active' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); addSkill(s); }}
                    onMouseEnter={() => setHighlightIdx(i)}
                  >
                    <FiPlus size={12} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
            {newSkill.trim().length >= 2 && !loading && suggestions.length === 0 && (
              <div className="ps-autocomplete-empty">No suggestions — press Enter to add "{newSkill.trim()}"</div>
            )}
          </div>
          <div className="ps-edit-actions" style={{ marginTop: 8 }}>
            <button className="ps-btn ps-btn-ghost" onClick={() => setEditing(false)}><FiCheck size={14} /> Done</button>
          </div>
        </div>
      ) : (
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
