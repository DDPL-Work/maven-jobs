import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiEdit2, FiDollarSign, FiClock, FiMapPin, FiBriefcase, FiTarget, FiCheck, FiX, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { searchCities } from '../../utils/citySearch.jsx';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
];

const SALARY_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const NOTICE_OPTIONS = [
  'Immediate', '<7 Days', '<15 Days', '<30 Days', '<60 Days',
];

const COMMON_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Tech Lead',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
  'SDE', 'SDE 2', 'SDE 3', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'Technical Architect', 'Solution Architect',
  'Product Manager', 'Senior Product Manager', 'Product Owner',
  'Project Manager', 'Technical Project Manager', 'Scrum Master',
  'Data Scientist', 'Data Engineer', 'Data Analyst', 'Machine Learning Engineer',
  'AI Engineer', 'Research Scientist', 'Business Analyst',
  'UI/UX Designer', 'UX Researcher', 'Product Designer',
  'QA Engineer', 'SDET', 'Automation Engineer',
  'System Administrator', 'Network Engineer', 'Security Engineer',
  'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer',
  'Consultant', 'Senior Consultant', 'Manager', 'Senior Manager',
  'Director', 'Vice President', 'CTO', 'CEO',
  'Intern', 'Trainee', 'Associate', 'Analyst',
];

const formatIndian = (num) => {
  if (!num) return '';
  const n = Number(num);
  if (isNaN(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (abs >= 100000) return (n / 100000).toFixed(1) + ' Lakhs';
  if (abs >= 1000) return (n / 1000).toFixed(1) + ' K';
  return String(n);
};

const formatUSD = (num) => {
  if (!num) return '';
  const n = Number(num);
  if (isNaN(n)) return '';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n;
};

const parseSalary = (val) => {
  if (!val) return { amount: '', currency: 'INR', period: 'monthly' };
  try {
    const p = JSON.parse(val);
    if (p && typeof p === 'object' && p.amount !== undefined) return p;
  } catch {}
  return { amount: '', currency: 'INR', period: 'monthly' };
};

const ChipsAutocomplete = React.memo(({ items, setItems, placeholder, searchFn, allItems, icon }) => {
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

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="cp-autocomplete-wrap">
      {items.length > 0 && (
        <div className="cp-chips-grid">
          {items.map(s => (
            <span key={s} className="cp-chip">
              {s}
              <button className="cp-chip-remove" onClick={() => removeItem(s)}><FiX size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="cp-autocomplete-row">
        <div className="cp-autocomplete-input-wrap">
          {icon}
          <input
            ref={inputRef}
            className="cp-autocomplete-input"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder={placeholder}
          />
        </div>
        <button className="cp-btn-add" onClick={() => addItem(query)}><FiPlus size={14} /></button>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="cp-autocomplete-dropdown">
          {suggestions.map((s, i) => (
            <li
              key={s}
              className={`cp-autocomplete-item ${highlightIdx === i ? 'cp-autocomplete-item-active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); addItem(s); }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <FiPlus size={12} />
              <span>{s}</span>
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

  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [salaryPeriod, setSalaryPeriod] = useState('monthly');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const salary = parseSalary(user?.expectedSalary);
    setSalaryAmount(salary.amount || '');
    setSalaryCurrency(salary.currency || 'INR');
    setSalaryPeriod(salary.period || 'monthly');
    setNoticePeriod(user?.noticePeriod || '');
    setLocations(prev => { const raw = user?.preferredLocations; return (Array.isArray(raw) ? raw : []) || []; });
    setRoles(prev => { const raw = user?.preferredRoles; return (Array.isArray(raw) ? raw : []) || []; });
  }, [editing]);

  const annualAmount = useMemo(() => {
    const amt = Number(salaryAmount);
    if (isNaN(amt) || !amt) return '';
    return salaryPeriod === 'monthly' ? amt * 12 : amt;
  }, [salaryAmount, salaryPeriod]);

  const annualLabel = useMemo(() => {
    if (!annualAmount) return '';
    if (salaryCurrency === 'INR') return `₹${Number(annualAmount).toLocaleString('en-IN')} per Annum (${formatIndian(annualAmount)})`;
    return `$${Number(annualAmount).toLocaleString('en-US')} per Annum (${formatUSD(annualAmount)})`;
  }, [annualAmount, salaryCurrency]);

  const monthlyLabel = useMemo(() => {
    if (salaryPeriod === 'monthly' && salaryAmount && !isNaN(Number(salaryAmount))) {
      if (salaryCurrency === 'INR') return `₹${Number(salaryAmount).toLocaleString('en-IN')}/month`;
      return `$${Number(salaryAmount).toLocaleString('en-US')}/month`;
    }
    return '';
  }, [salaryAmount, salaryCurrency, salaryPeriod]);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      expectedSalary: salaryAmount ? JSON.stringify({ amount: salaryAmount, currency: salaryCurrency, period: salaryPeriod }) : '',
      noticePeriod,
      preferredLocations: locations,
      preferredRoles: roles,
    };
    const r = await onSave(data);
    if (r?.success) setEditing(false);
    setSaving(false);
  };

  const displaySalary = user?.expectedSalary;
  const salaryParsed = useMemo(() => {
    if (!displaySalary) return '';
    try {
      const p = JSON.parse(displaySalary);
      if (p && p.amount) {
        const amt = Number(p.amount);
        if (isNaN(amt)) return displaySalary;
        if (p.currency === 'INR') {
          const perMonth = p.period === 'yearly' ? `₹${amt.toLocaleString('en-IN')}/yr` : `₹${amt.toLocaleString('en-IN')}/mo`;
          const annual = p.period === 'yearly' ? amt : amt * 12;
          return `${perMonth} (${formatIndian(annual)} per Annum)`;
        }
        const perMonth = p.period === 'yearly' ? `$${amt.toLocaleString('en-US')}/yr` : `$${amt.toLocaleString('en-US')}/mo`;
        const annual = p.period === 'yearly' ? amt : amt * 12;
        return `${perMonth} (${formatUSD(annual)} per Annum)`;
      }
    } catch {}
    return displaySalary;
  }, [displaySalary]);

  const calcTotalExp = (exps) => {
    if (!Array.isArray(exps) || !exps.length) return null;
    let totalMonths = 0;
    exps.forEach(e => {
      if (!e.startDate) return;
      const s = new Date(e.startDate);
      if (isNaN(s.getTime())) return;
      const end = e.currentlyWorking ? new Date() : (e.endDate ? new Date(e.endDate) : null);
      if (!end || isNaN(end.getTime())) return;
      totalMonths += (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth());
    });
    if (totalMonths <= 0) return null;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    return parts.join(' ');
  };

  const notice = user?.noticePeriod;
  const locationsArr = user?.preferredLocations;
  const rolesArr = user?.preferredRoles;
  const totalExpDisp = calcTotalExp(user?.workExperiences) || user?.totalExperience;
  const hasData = displaySalary || notice || locationsArr?.length || rolesArr?.length || totalExpDisp;

  if (!hasData && !editing) {
    return (
      <div className="ps-card ps-add-card" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Career Profile</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiTarget size={14} />
          <span>Set your career preferences</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Career Profile</h3>
        {!editing && (
          <button className="ps-edit-btn" onClick={() => setEditing(true)} aria-label="Edit career profile">
            <FiEdit2 size={14} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="ps-edit-wrap">
          {/* Salary */}
          <div className="cp-field">
            <label className="ps-label">Expected Salary</label>
            <div className="cp-salary-row">
              <div className="cp-currency-toggle">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    className={`cp-currency-btn ${salaryCurrency === c.code ? 'cp-currency-btn-active' : ''}`}
                    onClick={() => setSalaryCurrency(c.code)}
                    title={c.name}
                  >{c.symbol}</button>
                ))}
              </div>
              <input
                className="cp-salary-input"
                type="text"
                inputMode="numeric"
                value={salaryAmount}
                onChange={e => setSalaryAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 30000"
              />
              <div className="cp-period-select">
                <button
                  className={`cp-period-btn ${showPeriodDropdown ? 'cp-period-btn-open' : ''}`}
                  onClick={() => setShowPeriodDropdown(prev => !prev)}
                  onBlur={() => setTimeout(() => setShowPeriodDropdown(false), 200)}
                >
                  {SALARY_PERIODS.find(p => p.value === salaryPeriod)?.label}
                  <FiChevronDown size={12} className={`cp-chevron ${showPeriodDropdown ? 'cp-chevron-open' : ''}`} />
                </button>
                {showPeriodDropdown && (
                  <ul className="cp-period-dropdown-menu">
                    {SALARY_PERIODS.map(p => (
                      <li
                        key={p.value}
                        className={`cp-period-dropdown-item ${salaryPeriod === p.value ? 'cp-period-dropdown-item-active' : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); setSalaryPeriod(p.value); setShowPeriodDropdown(false); }}
                      >{p.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {annualLabel && (
              <div className="cp-annual-label">
                {monthlyLabel && <span className="cp-monthly-badge">{monthlyLabel}</span>}
                <span className="cp-annual-text">≈ {annualLabel}</span>
              </div>
            )}
          </div>

          {/* Notice Period */}
          <div className="cp-field">
            <label className="ps-label">Notice Period</label>
            <div className="cp-notice-dropdown-wrap">
              <button
                className="cp-notice-btn"
                onClick={() => setShowNoticeDropdown(prev => !prev)}
                onBlur={() => setTimeout(() => setShowNoticeDropdown(false), 200)}
              >
                {noticePeriod || 'Select notice period'}
                <FiChevronDown size={14} className={`cp-chevron ${showNoticeDropdown ? 'cp-chevron-open' : ''}`} />
              </button>
              {showNoticeDropdown && (
                <ul className="cp-notice-dropdown">
                  {NOTICE_OPTIONS.map(o => (
                    <li
                      key={o}
                      className={`cp-notice-option ${noticePeriod === o ? 'cp-notice-option-active' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); setNoticePeriod(o); setShowNoticeDropdown(false); }}
                    >{o}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="cp-field">
            <label className="ps-label">Preferred Locations</label>
            <ChipsAutocomplete
              items={locations}
              setItems={setLocations}
              placeholder="Search cities..."
              searchFn={(q) => searchCities(q).map(x => x.label || x.city)}
              allItems={[]}
              icon={<FiMapPin size={14} className="cp-autocomplete-icon" />}
            />
          </div>

          {/* Preferred Roles */}
          <div className="cp-field">
            <label className="ps-label">Preferred Roles</label>
            <ChipsAutocomplete
              items={roles}
              setItems={setRoles}
              placeholder="Search roles..."
              searchFn={(q, all) => COMMON_ROLES.filter(r => r.toLowerCase().includes(q.toLowerCase()))}
              allItems={COMMON_ROLES}
              icon={<FiBriefcase size={14} className="cp-autocomplete-icon" />}
            />
          </div>

          <div className="ps-edit-actions">
            <button className="ps-btn ps-btn-primary" onClick={handleSave} disabled={saving}>
              <FiCheck size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={() => setEditing(false)}><FiX size={14} /> Cancel</button>
          </div>
        </div>
      ) : (
        <div className="ps-career-grid">
          {displaySalary && <MetaItem icon={<FiDollarSign size={15} />} label="Expected Salary" value={salaryParsed} />}
          {notice && <MetaItem icon={<FiClock size={15} />} label="Notice Period" value={notice} />}
          {locationsArr?.length > 0 && <MetaItem icon={<FiMapPin size={15} />} label="Preferred Locations" value={locationsArr.join(', ')} />}
          {rolesArr?.length > 0 && <MetaItem icon={<FiBriefcase size={15} />} label="Preferred Roles" value={rolesArr.join(', ')} />}
          {totalExpDisp && <MetaItem icon={<FiClock size={15} />} label="Total Experience" value={totalExpDisp} />}
        </div>
      )}
    </div>
  );
});

const MetaItem = React.memo(({ icon, label, value }) => (
  <div className="ps-career-item">
    <span className="ps-career-icon">{icon}</span>
    <div>
      <p className="ps-career-label">{label}</p>
      <p className="ps-career-value">{value || 'Not set'}</p>
    </div>
  </div>
));

const FiChevronDown = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default CareerProfileSection;
