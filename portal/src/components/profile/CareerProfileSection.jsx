import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiEdit2, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { searchCities } from '../../utils/citySearch.jsx';
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';
import CustomSelect from '../common/CustomSelect';

import { COMMON_ROLES, INDUSTRIES, DEPARTMENTS, ROLE_CATEGORIES, JOB_ROLES } from '../../data/careerProfileOptions';

const ChipsAutocomplete = React.memo(({ items, setItems, placeholder, searchFn, allItems, maxItems }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
      const results = searchFn ? searchFn(val.trim(), allItems) : allItems.filter(r => r.toLowerCase().includes(val.trim().toLowerCase()));
      const filtered = results.filter(r => !items.includes(r));
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightIdx(-1);
    }, 200);
  };

  const addItem = (name) => {
    if (maxItems && items.length >= maxItems) return;
    const s = name.trim();
    if (!s || items.includes(s)) return;
    setItems(prev => [...prev, s]);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setHighlightIdx(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const removeItem = (name) => {
    setItems(prev => prev.filter(x => x !== name));
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addItem(query);
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
      if (highlightIdx >= 0 && highlightIdx < suggestions.length) addItem(suggestions[highlightIdx]);
      else addItem(query);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightIdx(-1);
    }
  };

  return (
    <div className="cp-autocomplete-wrap" style={{ position: 'relative' }}>
      <div className="cp-autocomplete-input-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', border: '1px solid var(--slate-3)', borderRadius: '8px' }}>
        {items.map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--slate-1)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', color: 'var(--navy)' }}>
            {s}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-3)' }} onClick={() => removeItem(s)}><FiX size={12} /></button>
          </span>
        ))}
        {(!maxItems || items.length < maxItems) && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder={items.length === 0 ? placeholder : 'Add another...'}
            style={{ flex: 1, border: '1px solid var(--slate-4)', borderRadius: '4px', padding: '4px 8px', outline: 'none', background: 'white', minWidth: '120px', fontSize: '0.9rem' }}
          />
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--slate-3)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, listStyle: 'none', margin: '4px 0 0 0', padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <li
              key={s}
              style={{ padding: '8px 16px', cursor: 'pointer', background: highlightIdx === i ? 'var(--blue-lt)' : 'transparent', color: highlightIdx === i ? 'var(--blue)' : 'var(--navy)', fontSize: '0.9rem' }}
              onMouseDown={(e) => { e.preventDefault(); addItem(s); }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const CareerProfileSection = React.memo(({ user, onEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentIndustry, setCurrentIndustry] = useState('');
  const [department, setDepartment] = useState('');
  const [roleCategory, setRoleCategory] = useState('');
  const [jobRole, setJobRole] = useState('');
  
  const [desiredJobType, setDesiredJobType] = useState([]);
  const [desiredEmploymentType, setDesiredEmploymentType] = useState([]);
  
  const [preferredRoles, setPreferredRoles] = useState([]);
  const [preferredLocations, setPreferredLocations] = useState([]);
  
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  
  const [preferredShift, setPreferredShift] = useState('');

  useEffect(() => {
    if (!editing) return;
    
    const cpo = user?.careerProfileObj || {};
    
    setCurrentIndustry(cpo.currentIndustry || '');
    setDepartment(cpo.department || '');
    setRoleCategory(cpo.roleCategory || '');
    setJobRole(cpo.jobRole || '');
    
    setDesiredJobType(cpo.desiredJobType || []);
    setDesiredEmploymentType(cpo.desiredEmploymentType || []);
    
    setPreferredShift(cpo.preferredShift || '');
    
    setPreferredRoles(cpo.preferredJobRole !== undefined ? cpo.preferredJobRole : (user?.preferredRoles || []));
    setPreferredLocations(cpo.preferredWorkLocation !== undefined ? cpo.preferredWorkLocation : (user?.preferredLocations || []));
    
    let amt = '';
    let curr = 'INR';
    try {
      if (user?.expectedSalary) {
        const p = JSON.parse(user.expectedSalary);
        if (p.amount) amt = p.amount;
        if (p.currency) curr = p.currency;
      }
    } catch {
      amt = user?.expectedSalary || '';
    }
    setSalaryAmount(cpo.preferredAnnualSalary || amt);
    
  }, [editing, user]);

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const careerProfileObj = {
      currentIndustry,
      department,
      roleCategory,
      jobRole,
      desiredJobType,
      desiredEmploymentType,
      preferredJobRole: preferredRoles,
      preferredWorkLocation: preferredLocations,
      preferredAnnualSalary: salaryAmount,
      preferredShift,
    };
    
    const expectedSalary = JSON.stringify({
      amount: salaryAmount,
      currency: salaryCurrency,
      period: 'yearly'
    });

    const data = {
      careerProfileObj,
      preferredLocations,
      preferredRoles,
      expectedSalary
    };

    const r = await onSave(data);
    if (r?.success) setEditing(false);
    setSaving(false);
  };

  const toggleCheckbox = (arr, setArr, val) => {
    if (arr.includes(val)) {
      setArr(arr.filter(item => item !== val));
    } else {
      setArr([...arr, val]);
    }
  };
  
  const cpo = user?.careerProfileObj || {};
  const currentIndustryDisp = cpo.currentIndustry;
  const departmentDisp = cpo.department;
  const roleCategoryDisp = cpo.roleCategory;
  const jobRoleDisp = cpo.jobRole;
  const desiredJobTypeDisp = cpo.desiredJobType?.join(', ');
  const desiredEmploymentTypeDisp = cpo.desiredEmploymentType?.join(', ');
  const preferredRolesDisp = (cpo.preferredJobRole !== undefined ? cpo.preferredJobRole : (user?.preferredRoles || [])).join(', ');
  const preferredLocationsDisp = (cpo.preferredWorkLocation !== undefined ? cpo.preferredWorkLocation : (user?.preferredLocations || [])).join(', ');
  const salaryDisp = cpo.preferredAnnualSalary || (() => {
    try {
      const p = JSON.parse(user?.expectedSalary || '{}');
      return p.amount;
    } catch { return user?.expectedSalary; }
  })();
  const shiftDisp = cpo.preferredShift;
  
  const hasData = currentIndustryDisp || departmentDisp || preferredRolesDisp || preferredLocationsDisp || salaryDisp;

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Career profile</h3>
        <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit career profile" style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer' }}>
          <FiEdit2 size={16} />
        </button>
      </div>
      
      <div className="ps-about-body">
        {!hasData && !editing ? (
          <div className="ps-add-placeholder" onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontWeight: 500 }}>
            <FiPlus size={16} />
            <span>Add details about your current and preferred job profile</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Current industry</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{currentIndustryDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Department</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{departmentDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Role category</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{roleCategoryDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Job role</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{jobRoleDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Desired job type</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{desiredJobTypeDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Desired employment type</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{desiredEmploymentTypeDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Preferred job role</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{preferredRolesDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Preferred work location</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{preferredLocationsDisp || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Preferred annual salary</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{salaryDisp ? `₹${Number(salaryDisp).toLocaleString('en-IN')}` : '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Preferred shift</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{shiftDisp || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="bdm-overlay" onClick={handleCancel}>
          <div className="bdm-container" onClick={(e) => e.stopPropagation()}>
            <div className="bdm-header">
              <div className="bdm-title-row">
                <h2 className="bdm-title">Career profile</h2>
                <button className="bdm-close" onClick={handleCancel}>
                  <FiX size={20} />
                </button>
              </div>
              <p className="bdm-sub-label">
                Add details about your current and preferred job profile. This helps us personalise your job recommendations.
              </p>
            </div>
            
            <div className="bdm-body">
              <div className="bdm-form">
                
                <div className="bdm-field">
                  <label>Current industry <span style={{ color: 'var(--red)' }}>*</span></label>
                  <CustomSelect value={currentIndustry} onChange={(e) => setCurrentIndustry(e.target.value)} options={INDUSTRIES} placeholder="Select Industry" />
                </div>
                
                <div className="bdm-field">
                  <label>Department <span style={{ color: 'var(--red)' }}>*</span></label>
                  <CustomSelect value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENTS} placeholder="Select Department" />
                </div>
                
                <div className="bdm-field">
                  <label>Role category <span style={{ color: 'var(--red)' }}>*</span></label>
                  <CustomSelect value={roleCategory} onChange={(e) => setRoleCategory(e.target.value)} options={ROLE_CATEGORIES} placeholder="Select Role Category" />
                </div>
                
                <div className="bdm-field">
                  <label>Job role <span style={{ color: 'var(--red)' }}>*</span></label>
                  <CustomSelect value={jobRole} onChange={(e) => setJobRole(e.target.value)} options={JOB_ROLES} placeholder="Select Job Role" />
                </div>
                
                <div className="bdm-field">
                  <label>Desired job type</label>
                  <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
                      <input type="checkbox" checked={desiredJobType.includes('Permanent')} onChange={() => toggleCheckbox(desiredJobType, setDesiredJobType, 'Permanent')} style={{ width: '18px', height: '18px', accentColor: 'var(--navy)' }} />
                      Permanent
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
                      <input type="checkbox" checked={desiredJobType.includes('Contractual')} onChange={() => toggleCheckbox(desiredJobType, setDesiredJobType, 'Contractual')} style={{ width: '18px', height: '18px', accentColor: 'var(--navy)' }} />
                      Contractual
                    </label>
                  </div>
                </div>
                
                <div className="bdm-field">
                  <label>Desired employment type</label>
                  <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
                      <input type="checkbox" checked={desiredEmploymentType.includes('Full time')} onChange={() => toggleCheckbox(desiredEmploymentType, setDesiredEmploymentType, 'Full time')} style={{ width: '18px', height: '18px', accentColor: 'var(--navy)' }} />
                      Full time
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
                      <input type="checkbox" checked={desiredEmploymentType.includes('Part time')} onChange={() => toggleCheckbox(desiredEmploymentType, setDesiredEmploymentType, 'Part time')} style={{ width: '18px', height: '18px', accentColor: 'var(--navy)' }} />
                      Part time
                    </label>
                  </div>
                </div>
                
                <div className="bdm-field">
                  <label>Preferred job role (Max 3)</label>
                  <ChipsAutocomplete
                    items={preferredRoles}
                    setItems={setPreferredRoles}
                    placeholder="Enter your preferred job role"
                    searchFn={(q, all) => COMMON_ROLES.filter(r => r.toLowerCase().includes(q.toLowerCase()))}
                    allItems={COMMON_ROLES}
                    maxItems={3}
                  />
                </div>
                
                <div className="bdm-field">
                  <label>Preferred work location (Max 10)</label>
                  <ChipsAutocomplete
                    items={preferredLocations}
                    setItems={setPreferredLocations}
                    placeholder="Tell us your location preferences to work"
                    searchFn={(q) => searchCities(q).map(x => x.label || x.city)}
                    allItems={[]}
                    maxItems={10}
                  />
                </div>
                
                <div className="bdm-field">
                  <label>Preferred annual salary</label>
                  <div className="cp-salary-wrap" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--slate-3)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '0 12px', background: 'var(--slate-1)', borderRight: '1px solid var(--slate-3)', display: 'flex', alignItems: 'center', height: '42px', color: 'var(--text-3)' }}>
                      ₹ <svg style={{ marginLeft: 4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                    <input 
                      type="text" 
                      value={salaryAmount} 
                      onChange={(e) => setSalaryAmount(e.target.value.replace(/[^0-9]/g, ''))} 
                      placeholder="e.g. 5,00,000" 
                      style={{ border: 'none', padding: '0 16px', flex: 1, outline: 'none', height: '42px', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
                
                <div className="bdm-field">
                  <label>Preferred shift</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {['Day', 'Night', 'Flexible'].map(shift => (
                      <button
                        key={shift}
                        onClick={(e) => { e.preventDefault(); setPreferredShift(shift); }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '24px',
                          border: `1px solid ${preferredShift === shift ? 'var(--navy)' : 'var(--slate-3)'}`,
                          background: 'white',
                          color: preferredShift === shift ? 'var(--navy)' : 'var(--text-3)',
                          fontWeight: preferredShift === shift ? 600 : 400,
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        {shift}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="bdm-footer">
              <button 
                className="bdm-btn-cancel" 
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="bdm-btn-save" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CareerProfileSection;
