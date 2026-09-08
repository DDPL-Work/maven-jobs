import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiUsers, FiFileText, FiCheck, FiX, FiPlus,
  FiEdit2, FiEye, FiAlertCircle,
  FiMessageSquare, FiChevronRight, FiChevronLeft, FiSearch,
  FiBriefcase, FiMapPin, FiClock, FiDollarSign,
  FiSliders, FiChevronDown,
} from 'react-icons/fi';
import authService from '../../../../services/authService';
import './SendMivite.css';

const PAGE_SIZE = 10;

const defaultFilters = {
  keyword: '', skills: [], currentCompany: '', designation: '',
  minExperience: '', maxExperience: '', currentCity: [], noticePeriod: [],
  expectedSalaryMin: '', expectedSalaryMax: '',
};

const TEMPLATES = [
  {
    id: 'application',
    name: 'Application Invite',
    subject: 'Action Required: Application Invite from {{company_name}}',
    body: `Hi {{candidate_name}},

We found your profile suitable for open positions we are hiring for. We would like to invite you to apply for the following roles at {{company_name}}.

{{jobs_list}}

If you are interested in these opportunities, please apply using the links provided above to take the process forward. We look forward to reviewing your profile.

Best Regards,
{{recruiter_name}}
{{company_name}}`,
  }
];

const STEPS = [
  { id: 'search', label: 'Search & Select', icon: FiSearch },
  { id: 'job', label: 'Select Job', icon: FiBriefcase },
  { id: 'compose', label: 'Compose', icon: FiEdit2 },
  { id: 'review', label: 'Review & Send', icon: FiSend },
];

/* ── helpers ── */
function formatSalary(val) {
  if (!val) return '';
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (!n) return val;
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

function formatExp(exp) {
  if (!exp || exp === 'Fresher') return exp || 'Fresher';
  const n = parseFloat(String(exp));
  if (!n) return exp;
  const yrs = Math.floor(n);
  const mos = Math.round((n - yrs) * 12);
  if (yrs === 0) return mos + ' mos';
  return yrs + ' yr' + (yrs > 1 ? 's' : '') + (mos ? ' ' + mos + ' mos' : '');
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarGradient(name) {
  let hash = 0;
  const s = name || 'User';
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return { bg: `linear-gradient(135deg, hsl(${h},70%,65%), hsl(${(h + 40) % 360},70%,55%))`, color: '#fff' };
}

/* ── sub-components ── */
function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="sm-filter-section">
      <button className="sm-filter-hd" onClick={onToggle} type="button">
        <span>{title}</span>
        <FiChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
      </button>
      {open && <div className="sm-filter-bd">{children}</div>}
    </div>
  );
}

function ChipInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const handleKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) onChange([...value, input.trim()]);
      setInput('');
    }
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="sm-chip-field">
      <div className="sm-chip-list">
        {value.map((v, i) => (
          <span key={i} className="sm-chip-tag">{v}<button type="button" onClick={() => remove(i)}><FiX size={10} /></button></span>
        ))}
        <input className="sm-chip-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={placeholder} />
      </div>
    </div>
  );
}

/* ── main component ── */
export default function SendMivite({ company, user, initialResults, initialSelectedIds, onClearSelection }) {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  /* ── search state ── */
  const [filters, setFilters] = useState(defaultFilters);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openSections, setOpenSections] = useState({ basic: true, experience: true, location: true, employment: false, salary: false });
  const searchInitiated = useRef(false);

  /* ── pre-populate from search tab if provided ── */
  const initialApplied = useRef(false);
  useEffect(() => {
    if (initialApplied.current) return;
    if (initialResults && initialResults.length > 0) {
      setResults(initialResults);
      setPagination(prev => ({ ...prev, total: initialResults.length }));
      setHasSearched(true);
      searchInitiated.current = true;
    }
    if (initialSelectedIds && initialSelectedIds.length > 0) {
      setSelectedIds(new Set(initialSelectedIds));
    }
    initialApplied.current = true;
  }, [initialResults, initialSelectedIds]);

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── job & compose state ── */
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [viewJob, setViewJob] = useState(null);

  useEffect(() => {
    if (step === 1 && employerJobs.length === 0) {
      const loadJobs = async () => {
        setLoadingJobs(true);
        try {
          const res = await authService.getEmployerDashboard();
          const normalizedJobs = Array.isArray(res?.data?.jobs) ? res.data.jobs : (res?.data?.jobs?.data || []);
          if (normalizedJobs.length > 0) {
            // Can filter by status here if needed, but showing all employer jobs is usually fine
            // or filter by job.status !== 'CLOSED' etc.
            setEmployerJobs(normalizedJobs.filter(job => job.status !== 'CLOSED' && job.status !== 'DRAFT'));
          }
        } catch (e) {
          console.error(e);
        }
        setLoadingJobs(false);
      };
      loadJobs();
    }
  }, [step, employerJobs.length]);

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [previewName, setPreviewName] = useState('John Doe');

  /* derived */
  const selectedCandidates = useMemo(() =>
    results.filter(c => selectedIds.has(c.id || c._id)),
    [results, selectedIds],
  );

  const fetchCandidates = useCallback(async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = { page: String(page), limit: String(PAGE_SIZE) };
      Object.entries(filters).forEach(([key, val]) => {
        if (Array.isArray(val) && val.length) params[key] = val.join(',');
        else if (typeof val === 'string' && val.trim()) params[key] = val.trim();
      });
      const res = await authService.searchResdexCandidates(params);
      if (res?.success) {
        setResults(res.data.candidates || []);
        setPagination(res.data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      } else {
        setResults([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      }
    } catch {
      setResults([]);
      setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (!searchInitiated.current && hasSearched) {
      fetchCandidates(1);
      searchInitiated.current = true;
    }
  }, [hasSearched, fetchCandidates]);

  const handleSearch = () => { searchInitiated.current = true; fetchCandidates(1); setSelectedIds(new Set()); };

  const toggleCandidate = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === results.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(results.map(c => c.id || c._id)));
  };

  /* ── template / compose handlers ── */
  const handleSelectJob = (job) => {
    setSelectedJobs(prev => {
      const isSelected = prev.some(j => (j._id || j.id) === (job._id || job.id));
      if (isSelected) {
        return prev.filter(j => (j._id || j.id) !== (job._id || job.id));
      } else {
        return [...prev, job];
      }
    });
  };

  const getJobsListText = (jobs) => {
    if (!jobs || jobs.length === 0) return 'No jobs selected.';
    return jobs.map(job => `Role: ${job.title}
Location: ${job.location || 'Not specified'}
Experience Required: ${job.experience || 'Not specified'}
Salary: ${(job.salaryMin || job.salaryMax) ? `${job.salaryMin ? formatSalary(job.salaryMin) : '0'} - ${job.salaryMax ? formatSalary(job.salaryMax) : ''}` : 'Not specified'}
Apply here: ${job.externalLink || (`${window.location.origin}/jobs/${job.id || job._id}`)}`).join('\n\n---\n\n');
  };

  const replaceVariables = (text) =>
    text
      .replace(/\{\{candidate_name\}\}/g, previewName || 'Candidate')
      .replace(/\{\{company_name\}\}/g, company?.name || 'Company')
      .replace(/\{\{jobs_list\}\}/g, getJobsListText(selectedJobs))
      .replace(/\{\{recruiter_name\}\}/g, user?.name || 'Recruiter');

  const canProceed = () => {
    switch (step) {
      case 0: return selectedIds.size > 0;
      case 1: return selectedJobs.length > 0;
      case 2: return subject.trim().length > 0 && body.trim().length > 20;
      case 3: return true;
      default: return false;
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const recipients = selectedCandidates.map(c => c.email).filter(Boolean);
      if (recipients.length === 0) { setError('No valid email addresses found for selected candidates.'); setSending(false); return; }
      
      const jobsListText = getJobsListText(selectedJobs);
      const finalSubject = subject
        .replace(/\{\{company_name\}\}/g, company?.name || 'Company')
        .replace(/\{\{jobs_list\}\}/g, jobsListText)
        .replace(/\{\{recruiter_name\}\}/g, user?.name || 'Recruiter');
        
      const finalBody = body
        .replace(/\{\{company_name\}\}/g, company?.name || 'Company')
        .replace(/\{\{jobs_list\}\}/g, jobsListText)
        .replace(/\{\{recruiter_name\}\}/g, user?.name || 'Recruiter');

      const res = await authService.sendMivite({
        recipients,
        subject: finalSubject.trim(),
        body: finalBody.trim(),
        templateId: selectedTemplate?.id,
        jobIds: selectedJobs.map(j => j._id || j.id),
      });
      if (res?.success) setSent(true);
      else setError(res?.message || 'Failed to send invitations');
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    }
    setSending(false);
  };

  const handleReset = () => {
    setStep(0);
    setSent(false);
    setError(null);
    setSelectedIds(new Set());
    setResults([]);
    setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
    setHasSearched(false);
    setSelectedJobs([]);
    setSelectedTemplate(TEMPLATES[0]);
    setSubject(TEMPLATES[0].subject);
    setBody(TEMPLATES[0].body);
    searchInitiated.current = false;
    if (onClearSelection) onClearSelection();
  };

  /* ── success ── */
  if (sent) {
    return (
      <div className="sm-root">
        <div className="sm-success">
          <div className="sm-success-icon"><FiCheck size={40} /></div>
          <h2 className="sm-success-title">Invitations Sent!</h2>
          <p className="sm-success-desc">
            Your invitations have been sent to <strong>{selectedCandidates.length}</strong> candidate{selectedCandidates.length !== 1 ? 's' : ''}.
          </p>
          <p className="sm-success-desc" style={{ fontSize: '.78rem', color: '#94a3b8' }}>
            {selectedCandidates.map(c => c.name || c.email).join(', ')}
          </p>
          <div className="sm-success-actions">
            <button className="sm-btn sm-btn-primary" onClick={handleReset}>
              <FiSend size={14} /> Send More Invitations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm-root">
      <div className="sm-header">
        <div>
          <h2 className="sm-title"><FiSend size={20} /> Send MIvites</h2>
          <p className="sm-subtitle">Search candidates, select them, and send bulk personalized invitations</p>
        </div>
      </div>

      {/* Steps */}
      <div className="sm-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={s.id} className={`sm-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="sm-step-indicator">{isDone ? <FiCheck size={14} /> : <Icon size={14} />}</div>
              <span className="sm-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className={`sm-step-line ${isDone ? 'done' : ''}`} />}
            </div>
          );
        })}
      </div>

      <div className="sm-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="sm-step-content">
                <div className="sm-step-header">
                  <FiSearch size={18} />
                  <h3>Search & Select Candidates</h3>
                </div>
                <p className="sm-step-desc">Find candidates using filters, then select the ones you want to invite.</p>

                <div className="sm-layout">
                  <aside className="sm-sidebar">
                    <div className="sm-sidebar-header">
                      <h3 className="sm-sidebar-title"><FiSliders size={14} /> Filters</h3>
                    </div>
                    <div className="sm-filters-scroll">
                      <div className="sm-filter-section">
                        <button className="sm-filter-section-header" onClick={() => toggleSection('basic')} type="button">
                          <div className="sm-filter-section-left">
                            <FiSearch size={13} />
                            <span>Basic Search</span>
                          </div>
                          <FiChevronDown size={13} style={{ transform: openSections.basic ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        {openSections.basic && (
                          <div className="sm-filter-section-body">
                            <div className="sm-field">
                              <label className="sm-field-label">Keyword</label>
                              <input className="sm-finput" placeholder="Job title, skill, company..." value={filters.keyword}
                                onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-field-label">Skills</label>
                              <ChipInput value={filters.skills} onChange={v => setFilters(p => ({ ...p, skills: v }))} placeholder="Type & Enter" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm-filter-section">
                        <button className="sm-filter-section-header" onClick={() => toggleSection('experience')} type="button">
                          <div className="sm-filter-section-left">
                            <FiBriefcase size={13} />
                            <span>Experience</span>
                          </div>
                          <FiChevronDown size={13} style={{ transform: openSections.experience ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        {openSections.experience && (
                          <div className="sm-filter-section-body">
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div className="sm-field" style={{ flex: 1 }}>
                                <label className="sm-field-label">Min</label>
                                <input className="sm-finput" type="number" min="0" placeholder="0"
                                  value={filters.minExperience} onChange={e => setFilters(p => ({ ...p, minExperience: e.target.value }))} />
                              </div>
                              <div className="sm-field" style={{ flex: 1 }}>
                                <label className="sm-field-label">Max</label>
                                <input className="sm-finput" type="number" min="0" placeholder="15"
                                  value={filters.maxExperience} onChange={e => setFilters(p => ({ ...p, maxExperience: e.target.value }))} />
                              </div>
                            </div>
                            <div className="sm-field">
                              <label className="sm-field-label">Notice Period</label>
                              <select className="sm-finput" value={filters.noticePeriod[0] || ''}
                                onChange={e => setFilters(p => ({ ...p, noticePeriod: e.target.value ? [e.target.value] : [] }))}>
                                <option value="">Any</option>
                                <option value="Immediate">Immediate</option>
                                <option value="15 Days">15 Days</option>
                                <option value="30 Days">30 Days</option>
                                <option value="45 Days">45 Days</option>
                                <option value="60 Days">60 Days</option>
                                <option value="90 Days">90 Days</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm-filter-section">
                        <button className="sm-filter-section-header" onClick={() => toggleSection('location')} type="button">
                          <div className="sm-filter-section-left">
                            <FiMapPin size={13} />
                            <span>Location</span>
                          </div>
                          <FiChevronDown size={13} style={{ transform: openSections.location ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        {openSections.location && (
                          <div className="sm-filter-section-body">
                            <div className="sm-field">
                              <label className="sm-field-label">City</label>
                              <input className="sm-finput" placeholder="e.g. Mumbai"
                                value={Array.isArray(filters.currentCity) ? filters.currentCity[0] || '' : filters.currentCity}
                                onChange={e => setFilters(p => ({ ...p, currentCity: e.target.value ? [e.target.value] : [] }))} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm-filter-section">
                        <button className="sm-filter-section-header" onClick={() => toggleSection('employment')} type="button">
                          <div className="sm-filter-section-left">
                            <FiUsers size={13} />
                            <span>Employment</span>
                          </div>
                          <FiChevronDown size={13} style={{ transform: openSections.employment ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        {openSections.employment && (
                          <div className="sm-filter-section-body">
                            <div className="sm-field">
                              <label className="sm-field-label">Company</label>
                              <input className="sm-finput" placeholder="Current company"
                                value={filters.currentCompany} onChange={e => setFilters(p => ({ ...p, currentCompany: e.target.value }))} />
                            </div>
                            <div className="sm-field">
                              <label className="sm-field-label">Designation</label>
                              <input className="sm-finput" placeholder="e.g. SDE"
                                value={filters.designation} onChange={e => setFilters(p => ({ ...p, designation: e.target.value }))} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm-filter-section">
                        <button className="sm-filter-section-header" onClick={() => toggleSection('salary')} type="button">
                          <div className="sm-filter-section-left">
                            <FiDollarSign size={13} />
                            <span>Salary</span>
                          </div>
                          <FiChevronDown size={13} style={{ transform: openSections.salary ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        {openSections.salary && (
                          <div className="sm-filter-section-body">
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div className="sm-field" style={{ flex: 1 }}>
                                <label className="sm-field-label">Min</label>
                                <input className="sm-finput" type="number" min="0" placeholder="0"
                                  value={filters.expectedSalaryMin} onChange={e => setFilters(p => ({ ...p, expectedSalaryMin: e.target.value }))} />
                              </div>
                              <div className="sm-field" style={{ flex: 1 }}>
                                <label className="sm-field-label">Max</label>
                                <input className="sm-finput" type="number" min="0" placeholder="50L"
                                  value={filters.expectedSalaryMax} onChange={e => setFilters(p => ({ ...p, expectedSalaryMax: e.target.value }))} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm-sidebar-footer">
                      <button className="sm-btn sm-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSearch}>
                        <FiSearch size={14} /> Search
                      </button>
                      <button className="sm-btn sm-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                        onClick={() => { setFilters(defaultFilters); setResults([]); setHasSearched(false); setSelectedIds(new Set()); searchInitiated.current = false; }}>
                        Clear Filters
                      </button>
                    </div>
                  </aside>

                  <main className="sm-main">
                    <div className="sm-candidates-area">
                      {!hasSearched ? (
                        <div className="sm-empty-state">
                          <FiSearch size={32} />
                          <p>Use the filters to search for candidates.</p>
                        </div>
                      ) : loading ? (
                        <div className="sm-loading-state">
                          <div className="sm-spinner" />
                          <p>Searching candidates...</p>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="sm-empty-state">
                          <FiUsers size={32} />
                          <p>No candidates found matching your criteria.</p>
                        </div>
                      ) : (
                        <>
                          <div className="sm-results-bar">
                            <div className="sm-results-info">
                              <FiUsers size={14} />
                              <span>{pagination.total} candidate{pagination.total !== 1 ? 's' : ''} found</span>
                              <span className="sm-results-dot" />
                              <span className="sm-selected-count">{selectedIds.size} selected</span>
                            </div>
                            <label className="sm-select-all">
                              <input type="checkbox" checked={results.length > 0 && selectedIds.size === results.length}
                                onChange={toggleAll} />
                              <span>Select all</span>
                            </label>
                          </div>

                           <div className="sm-candidate-list">
                            {results.map((c) => {
                              const cid = c.id || c._id;
                              const isSelected = selectedIds.has(cid);
                              const grad = getAvatarGradient(c.name);
                              const picUrl = (typeof c.profilePic === 'string' ? c.profilePic : c.profilePic?.url) || c.avatar || '';
                              const useImg = Boolean(picUrl);
                              return (
                                <div key={cid} className={`sm-candidate-row ${isSelected ? 'selected' : ''}`}>
                                  <label className="sm-cb-wrap">
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleCandidate(cid)} />
                                    <span className="sm-cb-mark"><FiCheck size={10} /></span>
                                  </label>
                                  <div className="sm-cand-avatar" style={{
                                    background: useImg ? 'transparent' : grad.bg,
                                    color: grad.color, overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700,
                                  }}>
                                    {useImg ? (
                                      <img src={picUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = grad.bg; e.target.parentElement.textContent = getInitials(c.name); }}
                                      />
                                    ) : getInitials(c.name)}
                                  </div>
                                  <div className="sm-cand-body">
                                    <div className="sm-cand-name">{c.name}</div>
                                    <div className="sm-cand-title">{(c.currentTitle || c.headline || '').slice(0, 80)}</div>
                                    <div className="sm-cand-meta">
                                      {(c.currentCompany) && <span><FiBriefcase size={11} /> {c.currentCompany}</span>}
                                      {(c.currentCity) && <span><FiMapPin size={11} /> {c.currentCity}</span>}
                                      {c.totalExperience && <span><FiClock size={11} /> {formatExp(c.totalExperience)}</span>}
                                      {(c.expectedSalary || c.currentSalary) && <span><FiDollarSign size={11} /> {formatSalary(c.expectedSalary || c.currentSalary)}</span>}
                                    </div>
                                    {Array.isArray(c.skills) && c.skills.length > 0 && (
                                      <div className="sm-cand-skills">
                                        {c.skills.slice(0, 5).map((s, i) => <span key={i} className="sm-cand-skill">{s}</span>)}
                                        {c.skills.length > 5 && <span className="sm-cand-skill sm-cand-skill-more">+{c.skills.length - 5}</span>}
                                      </div>
                                    )}
                                  </div>
                                  <div className="sm-cand-email">{c.email || '—'}</div>
                                </div>
                              );
                            })}
                          </div>

                          {pagination.totalPages > 1 && (
                            <div className="sm-pagination">
                              <button className="sm-btn sm-btn-ghost" disabled={pagination.page <= 1}
                                onClick={() => fetchCandidates(pagination.page - 1)}>
                                <FiChevronLeft size={13} /> Prev
                              </button>
                              <div className="sm-page-info">
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                  let p = i + 1;
                                  if (pagination.totalPages > 5) {
                                    const half = 2;
                                    let start = Math.max(1, pagination.page - half);
                                    let end = Math.min(pagination.totalPages, start + 4);
                                    if (end - start < 4) start = Math.max(1, end - 4);
                                    p = start + i;
                                  }
                                  return (
                                    <button key={p} className={`sm-page-btn ${p === pagination.page ? 'active' : ''}`}
                                      onClick={() => fetchCandidates(p)}>{p}</button>
                                  );
                                })}
                              </div>
                              <button className="sm-btn sm-btn-ghost" disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchCandidates(pagination.page + 1)}>
                                Next <FiChevronRight size={13} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="sm-step-nav">
                      <div />
                      <button className="sm-btn sm-btn-primary" disabled={!canProceed()} onClick={() => setStep(1)}>
                        {selectedIds.size > 0
                          ? `Select Job (${selectedIds.size} selected)`
                          : 'Select candidates first'}{' '}
                        <FiChevronRight size={14} />
                      </button>
                    </div>
                  </main>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="sm-step-content">
                <div className="sm-step-header">
                  <FiBriefcase size={18} />
                  <h3>Choose a Job</h3>
                </div>
                <p className="sm-step-desc">
                  Select the job you want to invite <strong>{selectedCandidates.length}</strong> candidate{selectedCandidates.length !== 1 ? 's' : ''} to apply for.
                </p>

                {loadingJobs ? (
                  <div className="sm-loading-state" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="sm-spinner" />
                    <p style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Loading jobs...</p>
                  </div>
                ) : employerJobs.length === 0 ? (
                  <div className="sm-empty-state" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <FiBriefcase size={32} />
                    <p style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>No active jobs found. Please create a job first.</p>
                  </div>
                ) : (
                  <div className="sm-template-grid">
                    {employerJobs.map(job => {
                        const isSelected = selectedJobs.some(j => (j._id || j.id) === (job._id || job.id));
                        return (
                        <div key={job._id || job.id} className={`sm-template-card ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelectJob(job)} style={{ cursor: 'pointer', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 16, right: 16 }}>
                              <div style={{ 
                                width: 18, 
                                height: 18, 
                                borderRadius: 4, 
                                border: isSelected ? 'none' : '2px solid #cbd5e1',
                                backgroundColor: isSelected ? '#2563eb' : '#fff',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box'
                              }}>
                                {isSelected && <FiCheck size={12} color="#fff" strokeWidth={3} />}
                              </div>
                            </div>
                          <div className="sm-template-icon"><FiBriefcase size={18} /></div>
                          <div className="sm-template-name" style={{ textAlign: 'left', paddingRight: 24 }}>{job.title}</div>
                          <div className="sm-template-preview" style={{ textAlign: 'left' }}>{job.location || 'Remote'} &bull; {job.jobType || 'Full-time'}</div>
                          <div style={{ marginTop: 16, display: 'flex' }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewJob(job); }}
                              className="sm-btn sm-btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px', minHeight: 0, background: '#f1f5f9' }}>
                              <FiEye size={12} /> View Details
                            </button>
                          </div>
                        </div>
                        );
                      })}
                  </div>
                )}

                <div className="sm-step-nav">
                  <button className="sm-btn sm-btn-ghost" onClick={() => setStep(0)}>
                    <FiChevronLeft size={14} /> Back to Search
                  </button>
                  <button className="sm-btn sm-btn-primary" disabled={!canProceed()} onClick={() => setStep(2)}>
                    Compose Message <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="sm-step-content">
                <div className="sm-step-header">
                  <FiEdit2 size={18} />
                  <h3>Compose Message</h3>
                </div>
                <p className="sm-step-desc">
                  Personalize your message for <strong>{selectedCandidates.length}</strong> recipient{selectedCandidates.length !== 1 ? 's' : ''}.
                  Use variables like {'{{candidate_name}}'}, {'{{job_title}}'}, {'{{company_name}}'}.
                </p>

                {selectedJobs.length > 0 && (
                  <div className="sm-template-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ marginBottom: 4 }}>Selected Jobs: <strong>{selectedJobs.length}</strong></span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {selectedJobs.map(j => (
                        <span key={j._id || j.id} style={{ fontSize: 11, padding: '2px 6px', background: '#e2e8f0', borderRadius: 4 }}>{j.title}</span>
                      ))}
                    </div>
                    <button className="sm-btn sm-btn-ghost" onClick={() => setStep(1)} style={{ fontSize: '0.72rem', padding: '4px 10px', marginTop: 8 }}>Change</button>
                  </div>
                )}

                <div className="sm-field">
                  <label className="sm-field-label">Subject Line *</label>
                  <input className="sm-input" type="text" placeholder="Enter email subject" value={subject}
                    onChange={e => setSubject(e.target.value)} />
                </div>

                <div className="sm-field">
                  <label className="sm-field-label">Message Body *</label>
                  <textarea className="sm-textarea sm-textarea-body" placeholder="Write your message here... Use {{candidate_name}} for personalization."
                    value={body} onChange={e => setBody(e.target.value)} rows={10} />
                </div>

                <div className="sm-variables-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <span className="sm-variables-label" style={{ marginRight: 8, fontSize: 13, color: '#64748b', alignSelf: 'center' }}>Insert variable:</span>
                  {['{{candidate_name}}', '{{company_name}}', '{{jobs_list}}', '{{recruiter_name}}'].map(v => (
                    <button key={v} className="sm-var-chip" onClick={() => setBody(prev => prev + v)}>
                      <FiPlus size={10} /> {v}
                    </button>
                  ))}
                </div>

                <div className="sm-preview-toggle">
                  <button className="sm-btn sm-btn-ghost" onClick={() => {
                    const el = document.getElementById('sm-preview-area');
                    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                  }}>
                    <FiEye size={13} /> Preview
                  </button>
                  <div className="sm-preview-input">
                    <span className="sm-preview-label">Test with name:</span>
                    <input className="sm-input sm-input-inline" value={previewName}
                      onChange={e => setPreviewName(e.target.value)} style={{ width: 160 }} />
                  </div>
                </div>

                <div id="sm-preview-area" className="sm-preview-area" style={{ display: 'none' }}>
                  <div className="sm-preview-subject"><strong>Subject:</strong> {replaceVariables(subject)}</div>
                  <div className="sm-preview-body">{replaceVariables(body).split('\n').map((l, i) => <p key={i}>{l || <br />}</p>)}</div>
                </div>

                <div className="sm-step-nav">
                  <button className="sm-btn sm-btn-ghost" onClick={() => setStep(1)}>
                    <FiChevronLeft size={14} /> Back to Job Selection
                  </button>
                  <button className="sm-btn sm-btn-primary" disabled={!canProceed()} onClick={() => setStep(3)}>
                    Review & Send <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="sm-step-content">
                <div className="sm-step-header">
                  <FiSend size={18} />
                  <h3>Review & Send</h3>
                </div>
                <p className="sm-step-desc">Review your invitation before sending to {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''}.</p>

                {error && (
                  <div className="sm-error-banner"><FiAlertCircle size={14} /> {error}</div>
                )}

                <div className="sm-review-grid">
                  <div className="sm-review-card">
                    <div className="sm-review-card-header"><FiUsers size={14} /> Recipients</div>
                    <div className="sm-review-card-value">{selectedCandidates.length}</div>
                    <div className="sm-review-card-label">candidates will receive this invitation</div>
                    <div className="sm-review-recipients">
                      {selectedCandidates.slice(0, 6).map((c, i) => (
                        <div key={i} className="sm-review-recipient">
                          <span style={{ fontWeight: 700 }}>{c.name || 'Candidate'}</span>
                          {c.email && <span style={{ color: '#94a3b8', marginLeft: 6, fontWeight: 400 }}>{c.email}</span>}
                        </div>
                      ))}
                      {selectedCandidates.length > 6 && (
                        <div className="sm-review-recipient" style={{ color: '#94a3b8' }}>+{selectedCandidates.length - 6} more</div>
                      )}
                    </div>
                  </div>

                  <div className="sm-review-card">
                    <div className="sm-review-card-header"><FiBriefcase size={14} /> Jobs</div>
                    <div className="sm-review-card-value">{selectedJobs.map(j => j.title).join(', ')}</div>
                    <div className="sm-review-card-label">Invite candidate to apply</div>
                  </div>

                  <div className="sm-review-card sm-review-card-full">
                    <div className="sm-review-card-header"><FiMessageSquare size={14} /> Message Preview</div>
                    <div className="sm-review-subject"><strong>Subject:</strong> {replaceVariables(subject)}</div>
                    <div className="sm-review-body">{replaceVariables(body).split('\n').map((l, i) => <p key={i}>{l || <br />}</p>)}</div>
                  </div>
                </div>

                <div className="sm-step-nav">
                  <button className="sm-btn sm-btn-ghost" onClick={() => setStep(2)}>
                    <FiChevronLeft size={14} /> Back to Compose
                  </button>
                  <button className="sm-btn sm-btn-send" onClick={handleSend} disabled={sending}>
                    {sending ? 'Sending...' : <><FiSend size={14} /> Send to {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? 's' : ''}</>}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Job Details Modal */}
      <AnimatePresence>
        {viewJob && (
          <div className="sm-modal-overlay" onClick={() => setViewJob(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', fontFamily: 'Bricolage Grotesque, sans-serif' }}>{viewJob.title}</h3>
                  <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(viewJob.companyId?.name || company?.name) && <span><FiBriefcase size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {viewJob.companyId?.name || company?.name}</span>}
                    {viewJob.location && <span><FiMapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {viewJob.location}</span>}
                  </div>
                </div>
                <button onClick={() => setViewJob(null)} style={{ background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'background .2s' }} onMouseOver={e => e.currentTarget.style.background='#e2e8f0'} onMouseOut={e => e.currentTarget.style.background='#f1f5f9'}><FiX size={18} /></button>
              </div>
              <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
                {viewJob.summary && (
                  <div style={{ marginBottom: 24, fontSize: 14, color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</strong>
                    {viewJob.summary}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                  <div><strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Job Type</strong><div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{viewJob.jobType || 'Not specified'}</div></div>
                  <div><strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Workplace</strong><div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{viewJob.workplaceType || 'Not specified'}</div></div>
                  <div><strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Experience</strong><div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{viewJob.experience || 'Not specified'}</div></div>
                  
                  <div><strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Department</strong><div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{viewJob.department || 'Not specified'}</div></div>
                  <div>
                    <strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Salary Range</strong>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                      {viewJob.salaryMin || viewJob.salaryMax ? `${viewJob.salaryMin ? formatSalary(viewJob.salaryMin) : '0'} - ${viewJob.salaryMax ? formatSalary(viewJob.salaryMax) : ''}` : 'Not specified'}
                    </div>
                  </div>
                  <div><strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Deadline</strong><div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{viewJob.deadline ? new Date(viewJob.deadline).toLocaleDateString() : 'Not specified'}</div></div>
                </div>

                {viewJob.skills && viewJob.skills.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <strong style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: 12 }}>Required Skills</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {viewJob.skills.map((skill, i) => (
                        <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewJob.requirements && (
                  <div style={{ marginBottom: 20 }}>
                    <strong style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: 12 }}>Requirements</strong>
                    <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewJob.requirements}</div>
                  </div>
                )}

                {viewJob.responsibilities && (
                  <div style={{ marginBottom: 20 }}>
                    <strong style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: 12 }}>Responsibilities</strong>
                    <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewJob.responsibilities}</div>
                  </div>
                )}
                
                <div style={{ marginBottom: 20 }}>
                  <strong style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: 12 }}>Full Description</strong>
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewJob.description || 'No description provided.'}</div>
                </div>

                {viewJob.externalLink && (
                   <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                     <FiBriefcase color="#64748b" />
                     <div style={{ fontSize: 13, color: '#475569' }}>
                       <strong>External Apply Link:</strong> <a href={viewJob.externalLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', marginLeft: 4 }}>{viewJob.externalLink}</a>
                     </div>
                   </div>
                )}
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0, background: '#f8fafc', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                 <button className="sm-btn sm-btn-ghost" onClick={() => setViewJob(null)}>Close</button>
                 <button className="sm-btn sm-btn-primary" onClick={() => { handleSelectJob(viewJob); setViewJob(null); }} style={{ padding: '10px 24px' }}>
                   {selectedJobs.some(j => (j._id || j.id) === (viewJob._id || viewJob.id)) ? 'Unselect This Job' : 'Select This Job'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
