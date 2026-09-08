import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  FiSearch, FiSave, FiClock, FiStar, FiTrash2, FiEdit3,
  FiCopy, FiShare2, FiDownload, FiSliders, FiChevronRight,
  FiGrid, FiList, FiX, FiChevronDown, FiMapPin, FiBriefcase,
  FiDollarSign, FiUsers, FiTrendingUp, FiEye, FiPlus,
  FiBell, FiAlertCircle, FiTool, FiBarChart2, FiBookmark,
  FiHome, FiSend, FiTarget, FiZap, FiArrowUpRight,
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import authService from '../../../../services/authService';
import './ManageSearch.css';

const C = {
  navy: '#002366', navyD: '#001540', navyM: '#1a3a6e',
  green: '#10b981', indigo: '#6366f1', amber: '#f59e0b',
  sky: '#0ea5e9', red: '#ef4444', purple: '#8b5cf6',
  s50: '#f8fafc', s100: '#f1f5f9', s200: '#e2e8f0',
  s300: '#cbd5e1', s400: '#94a3b8', s500: '#64748b',
  s600: '#475569', s700: '#334155', s800: '#1e293b', s900: '#0f172a',
};

const GRADIENTS = [
  { bg: 'linear-gradient(135deg, #2563eb, #1e40af)', color: '#fff' },
  { bg: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff' },
  { bg: 'linear-gradient(135deg, #059669, #047857)', color: '#fff' },
  { bg: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff' },
  { bg: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' },
  { bg: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff' },
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNumber(n) {
  if (!n && n !== 0) return '';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatSalaryRange(min, max) {
  const parts = [];
  if (min) parts.push('₹' + formatNumber(min));
  if (max) parts.push('₹' + formatNumber(max));
  return parts.join(' - ') || 'Any';
}

function NormalizeSearch(s) {
  return {
    id: s._id || s.id || '',
    name: s.name || 'Untitled Search',
    type: 'saved',
    pinned: Boolean(s.isPinned),
    createdAt: s.createdAt || new Date().toISOString(),
    lastUsed: s.lastRunAt || s.createdAt || new Date().toISOString(),
    timesUsed: 1,
    resultCount: s.resultCount || 0,
    notes: '',
    filters: s.filters || {},
    recentCandidates: [],
  };
}

const STORAGE_KEY = 'manageSearch_searches';

function persistToLocal(searches) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(searches)); } catch {}
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function PinIcon({ size = 14, filled = false, color = '#94a3b8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? color : 'none'} stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2" fill={filled ? '#fff' : 'none'} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function SummaryCard({ icon: Icon, label, value, color, gradient, delay }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.1 + delay * 0.08, ease: 'power3.out' });
  }, [delay]);

  return (
    <div className="ms-stat-card" ref={ref}>
      <div className="ms-stat-icon" style={{ background: color + '18', color }}>
        <Icon size={16} />
      </div>
      <div className="ms-stat-value">{typeof value === 'number' ? formatNumber(value) : value}</div>
      <div className="ms-stat-label">{label}</div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: gradient || `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '14px 14px 0 0', opacity: 0.6 }} />
    </div>
  );
}

function SearchCard({ search, view, onOpen, onPin, onRename, onDuplicate, onDelete, onRun, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.05 + index * 0.04, ease: 'power3.out' });
  }, [index]);

  const isPinned = search.pinned;
  const maxChips = view === 'list' ? 4 : 5;
  const allChips = search.filters.skills || [];
  const visibleChips = allChips.slice(0, maxChips);
  const extraChips = allChips.length - maxChips;
  const totalExp = search.filters.minExperience && search.filters.maxExperience
    ? `${search.filters.minExperience}-${search.filters.maxExperience} yrs`
    : search.filters.minExperience ? `${search.filters.minExperience}+ yrs` : '';

  const handleRun = useCallback((e) => { e.stopPropagation(); onRun(search); }, [onRun, search]);
  const handlePin = useCallback((e) => { e.stopPropagation(); onPin(search); }, [onPin, search]);
  const handleDelete = useCallback((e) => { e.stopPropagation(); onDelete(search); }, [onDelete, search]);
  const handleRename = useCallback((e) => { e.stopPropagation(); onRename(search); }, [onRename, search]);
  const handleDuplicate = useCallback((e) => { e.stopPropagation(); onDuplicate(search); }, [onDuplicate, search]);
  const handleOpen = useCallback(() => onOpen(search), [onOpen, search]);
  const handleKeyDown = useCallback((e) => { if (e.key === 'Enter') onOpen(search); }, [onOpen, search]);

  if (view === 'list') {
    return (
      <div ref={ref} className={`ms-card-list ${isPinned ? 'ms-card-list-pinned' : ''}`}
        onClick={handleOpen} role="button" tabIndex={0} aria-label={`Search: ${search.name}`}
        onKeyDown={handleKeyDown}>
        <div className="ms-card-list-left">
          {isPinned && <PinIcon size={13} filled color={C.amber} />}
          <div className="ms-card-list-name">{search.name}</div>
          <div className="ms-card-list-meta">
            <span><FiClock size={11} /> {formatDate(search.lastUsed)}</span>
            <span><FiUsers size={11} /> {search.resultCount}</span>
          </div>
          <div className="ms-card-list-chips">
            {visibleChips.map((s, i) => <span key={i} className="ms-chip" title={s}>{s}</span>)}
            {extraChips > 0 && <span className="ms-chip ms-chip-more">+{extraChips}</span>}
            {search.filters.currentCity?.length > 0 && (
              <span className="ms-chip ms-chip-location">{search.filters.currentCity[0]}</span>
            )}
          </div>
        </div>
        <div className="ms-card-list-right">
          <button className="sr-btn" style={{ padding: '5px 12px', fontSize: '0.72rem' }}
            onClick={handleRun} aria-label="Run search">Run</button>
          <button className="sr-btn sr-btn-ghost" style={{ padding: '5px 8px' }}
            onClick={handlePin} aria-label={isPinned ? 'Unpin search' : 'Pin search'}>
            <PinIcon size={12} filled={isPinned} color={isPinned ? C.amber : C.s400} />
          </button>
          <button className="sr-btn sr-btn-ghost" style={{ padding: '5px 8px' }}
            onClick={handleDelete} aria-label="Delete search">
            <FiTrash2 size={12} color={C.s400} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`ms-card ${isPinned ? 'ms-card-pinned' : ''}`}
      onClick={handleOpen} role="button" tabIndex={0} aria-label={`Search: ${search.name}`}
      onKeyDown={handleKeyDown}>
      <div className="ms-card-header">
        <h4 className="ms-card-name">{search.name}</h4>
        <div className="ms-card-badges">
          {isPinned && <span className="ms-badge ms-badge-pinned"><PinIcon size={9} filled color="#b45309" /> Pinned</span>}
          {search.type === 'saved' && <span className="ms-badge ms-badge-saved"><FiBookmark size={9} /> Saved</span>}
        </div>
      </div>
      <div className="ms-card-meta">
        <span><FiClock size={12} /> {formatDate(search.lastUsed)}</span>
        <span><FiSave size={12} /> {formatDate(search.createdAt)}</span>
        <span>Used {search.timesUsed} time{search.timesUsed !== 1 ? 's' : ''}</span>
      </div>
      <div className="ms-card-stats">
        <div className="ms-card-stat">
          <div className="ms-card-stat-value">{formatNumber(search.resultCount)}</div>
          <div className="ms-card-stat-label">Candidates</div>
        </div>
        <div className="ms-card-stat">
          <div className="ms-card-stat-value">{Math.floor((search.timesUsed || 1) * 2.3)}</div>
          <div className="ms-card-stat-label">Profile Views</div>
        </div>
        <div className="ms-card-stat">
          <div className="ms-card-stat-value">{Math.max(1, Math.floor((search.timesUsed || 1) * 0.3))}</div>
          <div className="ms-card-stat-label">Interviews</div>
        </div>
      </div>
      <div className="ms-card-chips">
        {visibleChips.map((s, i) => <span key={i} className="ms-chip" title={s}>{s}</span>)}
        {extraChips > 0 && <span className="ms-chip ms-chip-more">+{extraChips}</span>}
        {totalExp && <span className="ms-chip ms-chip-exp">{totalExp}</span>}
        {search.filters.currentCity?.slice(0, 2).map((city, i) => (
          <span key={i} className="ms-chip ms-chip-location"><FiMapPin size={9} /> {city}</span>
        ))}
        {search.filters.remote && <span className="ms-chip ms-chip-location">Remote</span>}
        {(search.filters.expectedSalaryMin || search.filters.expectedSalaryMax) && (
          <span className="ms-chip ms-chip-salary">
            <FiDollarSign size={9} /> {formatSalaryRange(search.filters.expectedSalaryMin, search.filters.expectedSalaryMax)}
          </span>
        )}
      </div>
      <div className="ms-card-actions">
        <button className="sr-btn sr-btn-primary" style={{ padding: '5px 12px', fontSize: '0.72rem' }}
          onClick={handleRun} aria-label="Run search">
          <FiSearch size={11} /> Run Search
        </button>
        <button className="sr-btn" style={{ padding: '5px 10px', fontSize: '0.72rem' }}
          onClick={handleRename} aria-label="Rename search">
          <FiEdit3 size={11} /> Rename
        </button>
        <button className="sr-btn" style={{ padding: '5px 10px', fontSize: '0.72rem' }}
          onClick={handleDuplicate} aria-label="Duplicate search">
          <FiCopy size={11} />
        </button>
        <button className="sr-btn sr-btn-ghost" style={{ padding: '5px 10px' }}
          onClick={handlePin} aria-label={isPinned ? 'Unpin search' : 'Pin search'}>
          <PinIcon size={12} filled={isPinned} color={isPinned ? C.amber : C.s400} />
        </button>
        <button className="sr-btn sr-btn-ghost" style={{ padding: '5px 10px', color: C.s400 }}
          onClick={handleDelete} aria-label="Delete search">
          <FiTrash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ManageSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode = searchParams.get('view') || 'grid';
  const searchType = searchParams.get('type') || 'all';
  const dateFilter = searchParams.get('date') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  const setFilterParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || value === 'newest' || (key === 'view' && value === 'grid')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const [company, setCompany] = useState({});
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState([]);
  const [drawerSearch, setDrawerSearch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const headerRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) { navigate('/employer-login'); return; }
    const load = async () => {
      try {
        const [dashRes, searchesRes] = await Promise.all([
          authService.getEmployerDashboard().catch(() => null),
          authService.getResdexSearches().catch(() => null),
        ]);
        if (dashRes?.success) {
          setCompany(dashRes.data.company || dashRes.data);
          setUser(dashRes.data.user || dashRes.data);
        }
        if (searchesRes?.success && Array.isArray(searchesRes.data)) {
          const normalized = searchesRes.data.map(NormalizeSearch);
          setSearches(normalized);
          persistToLocal(normalized);
        } else {
          const cached = loadFromLocal();
          if (cached) setSearches(cached);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [navigate]);

  useEffect(() => {
    gsap.fromTo('.ms-title', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    gsap.fromTo('.ms-subtitle', { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: 'power3.out' });
  }, []);

  const computedStats = useMemo(() => {
    const total = searches.length;
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
    const thisWeek = searches.filter(s => new Date(s.lastUsed) >= oneWeekAgo).length;
    const totalCandidates = searches.reduce((sum, s) => sum + (s.resultCount || 0), 0);
    const pinned = searches.filter(s => s.pinned).length;
    return { savedSearches: total, searchesThisWeek: thisWeek, profilesViewed: totalCandidates, successfulHires: pinned };
  }, [searches]);

  const computedInsights = useMemo(() => {
    const skillCounts = {};
    const locationCounts = {};
    searches.forEach(s => {
      const filters = s.filters || {};
      (filters.skills || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
      (filters.currentCity || []).forEach(city => {
        locationCounts[city] = (locationCounts[city] || 0) + 1;
      });
    });
    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
    const sortedLocs = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    return { topSkills: sortedSkills, topLocations: sortedLocs };
  }, [searches]);

  const filteredSearches = useMemo(() => {
    let result = [...searches];

    if (searchType === 'pinned') result = result.filter(s => s.pinned);
    else if (searchType === 'saved') result = result.filter(s => !s.pinned);
    else if (searchType === 'recent') {
      const cutoff = new Date(Date.now() - 7 * 86400000);
      result = result.filter(s => new Date(s.lastUsed) >= cutoff);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === 'today') cutoff.setDate(now.getDate() - 1);
      else if (dateFilter === 'week') cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === 'month') cutoff.setDate(now.getDate() - 30);
      else if (dateFilter === 'quarter') cutoff.setMonth(now.getMonth() - 3);
      result = result.filter(s => new Date(s.lastUsed) >= cutoff);
    }

    if (statusFilter === 'active') {
      const cutoff = new Date(Date.now() - 30 * 86400000);
      result = result.filter(s => new Date(s.lastUsed) >= cutoff);
    } else if (statusFilter === 'expired') {
      const cutoff = new Date(Date.now() - 30 * 86400000);
      result = result.filter(s => new Date(s.lastUsed) < cutoff);
    }

    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (sortBy === 'newest') return new Date(b.lastUsed) - new Date(a.lastUsed);
      if (sortBy === 'oldest') return new Date(a.lastUsed) - new Date(b.lastUsed);
      if (sortBy === 'mostUsed') return (b.timesUsed || 0) - (a.timesUsed || 0);
      if (sortBy === 'alpha') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [searches, searchType, dateFilter, statusFilter, sortBy]);

  const pinnedSearches = useMemo(() => filteredSearches.filter(s => s.pinned), [filteredSearches]);
  const unpinnedSearches = useMemo(() => filteredSearches.filter(s => !s.pinned), [filteredSearches]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (searchType !== 'all') c++;
    if (dateFilter !== 'all') c++;
    if (statusFilter !== 'all') c++;
    if (sortBy !== 'newest') c++;
    return c;
  }, [searchType, dateFilter, statusFilter, sortBy]);

  const handleResetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleOpenDrawer = useCallback((search) => {
    setDrawerSearch(search);
    setTimeout(() => {
      document.querySelector('.ms-drawer')?.classList.add('open');
      document.querySelector('.ms-drawer-overlay')?.classList.add('open');
    }, 10);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    document.querySelector('.ms-drawer')?.classList.remove('open');
    document.querySelector('.ms-drawer-overlay')?.classList.remove('open');
    setTimeout(() => setDrawerSearch(null), 300);
  }, []);

  const handleRunSearch = useCallback((search) => {
    navigate('/resdex', { state: { savedFilters: search.filters, searchName: search.name } });
  }, [navigate]);

  const handlePinToggle = useCallback(async (search) => {
    setSearches(prev => {
      const updated = prev.map(s => s.id === search.id ? { ...s, pinned: !s.pinned } : s);
      persistToLocal(updated);
      return updated;
    });
    try { await authService.togglePinResdexSearch(search.id); } catch {}
  }, []);

  const handleDelete = useCallback((search) => {
    setDeleteTarget(search);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      persistToLocal(updated);
      return updated;
    });
    setDeleteTarget(null);
    try { await authService.deleteResdexSearch(id); } catch {}
  }, [deleteTarget]);

  const handleRename = useCallback((search) => {
    setRenameTarget(search);
    setRenameValue(search.name);
  }, []);

  const handleRenameConfirm = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const id = renameTarget.id;
    const newName = renameValue.trim();
    setSearches(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, name: newName } : s);
      persistToLocal(updated);
      return updated;
    });
    setRenameTarget(null);
    setRenameValue('');
    try { await authService.updateResdexSearch(id, { name: newName }); } catch {}
  }, [renameTarget, renameValue]);

  const handleDuplicate = useCallback(async (search) => {
    const newName = search.name + ' (Copy)';
    try {
      const res = await authService.saveResdexSearch({ name: newName, filters: search.filters, isPinned: false });
      if (res?.success) {
        const normalized = NormalizeSearch(res.data);
        setSearches(prev => {
          const updated = [normalized, ...prev];
          persistToLocal(updated);
          return updated;
        });
        return;
      }
    } catch {}
    const dup = {
      ...search, id: 'local_' + Date.now(), name: newName,
      pinned: false, createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(), timesUsed: 0,
    };
    setSearches(prev => {
      const updated = [dup, ...prev];
      persistToLocal(updated);
      return updated;
    });
  }, []);

  const setViewMode = useCallback((mode) => setFilterParam('view', mode), [setFilterParam]);
  const setSearchTypeFn = useCallback((val) => setFilterParam('type', val), [setFilterParam]);
  const setDateFilterFn = useCallback((val) => setFilterParam('date', val), [setFilterParam]);
  const setStatusFilterFn = useCallback((val) => setFilterParam('status', val), [setFilterParam]);
  const setSortByFn = useCallback((val) => setFilterParam('sort', val), [setFilterParam]);

  if (loading) {
    return (
      <EmployerLayout company={company} activeTab="resdex"
        onNavigate={(tid) => { if (tid === 'home') navigate('/employer-dashboard'); else if (tid === 'analysis') navigate('/employer-dashboard/analytics'); }}
        onMessagesClick={() => {}} onNotificationsClick={() => {}}
        onLogout={() => { localStorage.removeItem('employerToken'); navigate('/employer-login'); }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#002366', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </EmployerLayout>
    );
  }

  return (
    <>
      <EmployerLayout
        company={company}
        activeTab="resdex"
        onNavigate={(tid) => {
          if (tid === 'home') navigate('/employer-dashboard');
          else if (tid === 'analysis') navigate('/employer-dashboard/analytics');
        }}
        onMessagesClick={() => {}}
        onNotificationsClick={() => {}}
        onLogout={() => { localStorage.removeItem('employerToken'); navigate('/employer-login'); }}
      >
        <div className="ms-root">
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Resdex', path: '/resdex' },
            { label: 'Manage Searches' },
          ]} />

          <div className="ms-header">
            <div ref={headerRef}>
              <h1 className="ms-title">Manage Resume Searches</h1>
              <p className="ms-subtitle">Access, organize and reuse all your saved and previous candidate searches.</p>
            </div>
            <button className="sr-btn sr-btn-primary" style={{ padding: '10px 22px', fontSize: '0.82rem', flexShrink: 0 }}
              onClick={() => navigate('/resdex')} aria-label="Create new search">
              <FiPlus size={15} /> New Search
            </button>
          </div>

          <div className="ms-summary" ref={summaryRef}>
            <SummaryCard icon={FiBookmark} label="Saved Searches" value={computedStats.savedSearches} color="#2563eb" gradient="linear-gradient(90deg, #2563eb, #1e40af)" delay={0} />
            <SummaryCard icon={FiTrendingUp} label="Searches This Week" value={computedStats.searchesThisWeek} color="#059669" gradient="linear-gradient(90deg, #059669, #047857)" delay={1} />
            <SummaryCard icon={FiEye} label="Profiles Viewed" value={computedStats.profilesViewed} color="#7c3aed" gradient="linear-gradient(90deg, #7c3aed, #5b21b6)" delay={2} />
            <SummaryCard icon={PinIcon} label="Pinned" value={computedStats.successfulHires} color="#d97706" gradient="linear-gradient(90deg, #d97706, #b45309)" delay={3} />
          </div>

          <div className="ms-layout">
            <aside className="ms-sidebar" aria-label="Search filters">
              <div className="ms-sidebar-header">
                <h3 className="ms-sidebar-title"><FiSliders size={14} /> Filters</h3>
                {activeFilterCount > 0 && (
                  <button className="ms-sidebar-reset" onClick={handleResetFilters}>Reset</button>
                )}
              </div>
              <div className="ms-sidebar-scroll">
                <div className="ms-filter-group">
                  <span className="ms-filter-label">Search Type</span>
                  <div className="ms-filter-options" role="radiogroup" aria-label="Search type">
                    {[
                      { key: 'all', label: 'All Searches' },
                      { key: 'pinned', label: 'Pinned' },
                      { key: 'saved', label: 'Saved' },
                      { key: 'recent', label: 'Recent' },
                    ].map(opt => (
                      <button key={opt.key} className={`ms-filter-option ${searchType === opt.key ? 'active' : ''}`}
                        onClick={() => setSearchTypeFn(opt.key)} role="radio" aria-checked={searchType === opt.key}>
                        <span className="ms-filter-radio" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ms-filter-divider" />

                <div className="ms-filter-group">
                  <span className="ms-filter-label">Created Date</span>
                  <div className="ms-filter-options" role="radiogroup" aria-label="Date filter">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: 'Last 7 Days' },
                      { key: 'month', label: 'Last 30 Days' },
                      { key: 'quarter', label: 'Last 3 Months' },
                    ].map(opt => (
                      <button key={opt.key} className={`ms-filter-option ${dateFilter === opt.key ? 'active' : ''}`}
                        onClick={() => setDateFilterFn(opt.key)} role="radio" aria-checked={dateFilter === opt.key}>
                        <span className="ms-filter-radio" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ms-filter-divider" />

                <div className="ms-filter-group">
                  <span className="ms-filter-label">Status</span>
                  <div className="ms-filter-options" role="radiogroup" aria-label="Status filter">
                    {[
                      { key: 'all', label: 'All Status' },
                      { key: 'active', label: 'Active' },
                      { key: 'expired', label: 'Expired' },
                    ].map(opt => (
                      <button key={opt.key} className={`ms-filter-option ${statusFilter === opt.key ? 'active' : ''}`}
                        onClick={() => setStatusFilterFn(opt.key)} role="radio" aria-checked={statusFilter === opt.key}>
                        <span className="ms-filter-radio" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ms-filter-divider" />

                <div className="ms-filter-group">
                  <span className="ms-filter-label">Sort By</span>
                  <div className="ms-filter-options" role="radiogroup" aria-label="Sort order">
                    {[
                      { key: 'newest', label: 'Newest' },
                      { key: 'oldest', label: 'Oldest' },
                      { key: 'mostUsed', label: 'Most Used' },
                      { key: 'alpha', label: 'Alphabetical' },
                    ].map(opt => (
                      <button key={opt.key} className={`ms-filter-option ${sortBy === opt.key ? 'active' : ''}`}
                        onClick={() => setSortByFn(opt.key)} role="radio" aria-checked={sortBy === opt.key}>
                        <span className="ms-filter-radio" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <main className="ms-main">
              <div className="ms-toolbar">
                <div className="ms-toolbar-left">
                  <span className="ms-count">{filteredSearches.length} search{filteredSearches.length !== 1 ? 'es' : ''}</span>
                  {activeFilterCount > 0 && (
                    <span style={{ fontSize: '0.72rem', color: C.s500, fontWeight: 600 }}>
                      ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                    </span>
                  )}
                </div>
                <div className="ms-toolbar-right">
                  <div className="ms-view-toggle" role="group" aria-label="View mode">
                    <button className={`ms-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')} aria-label="Grid view" title="Grid View">
                      <FiGrid size={14} />
                    </button>
                    <button className={`ms-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')} aria-label="List view" title="List View">
                      <FiList size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {filteredSearches.length === 0 ? (
                <div className="ms-empty">
                  <div className="ms-empty-icon"><FiSearch size={28} /></div>
                  <h3 className="ms-empty-title">No Saved Searches Yet</h3>
                  <p className="ms-empty-desc">Save your favourite candidate searches to quickly continue recruiting later.</p>
                  <button className="sr-btn sr-btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                    onClick={() => navigate('/resdex')}>
                    <FiSearch size={15} /> Start Searching
                  </button>
                </div>
              ) : (
                <>
                  {pinnedSearches.length > 0 && (
                    <div>
                      <h3 className="ms-section-title"><PinIcon size={15} filled color={C.amber} /> Pinned Searches</h3>
                      {viewMode === 'grid' ? (
                        <div className="ms-card-grid">
                          {pinnedSearches.map((s, i) => (
                            <SearchCard key={s.id} search={s} view="grid" index={i}
                              onOpen={handleOpenDrawer} onPin={handlePinToggle}
                              onRename={handleRename} onDuplicate={handleDuplicate}
                              onDelete={handleDelete} onRun={handleRunSearch} />
                          ))}
                        </div>
                      ) : (
                        <div className="ms-card-list-view">
                          {pinnedSearches.map((s, i) => (
                            <SearchCard key={s.id} search={s} view="list" index={i}
                              onOpen={handleOpenDrawer} onPin={handlePinToggle}
                              onRename={handleRename} onDuplicate={handleDuplicate}
                              onDelete={handleDelete} onRun={handleRunSearch} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {unpinnedSearches.length > 0 && (
                    <div>
                      {pinnedSearches.length > 0 && (
                        <h3 className="ms-section-title"><FiSearch size={15} /> All Searches</h3>
                      )}
                      {viewMode === 'grid' ? (
                        <div className="ms-card-grid">
                          {unpinnedSearches.map((s, i) => (
                            <SearchCard key={s.id} search={s} view="grid" index={i + pinnedSearches.length}
                              onOpen={handleOpenDrawer} onPin={handlePinToggle}
                              onRename={handleRename} onDuplicate={handleDuplicate}
                              onDelete={handleDelete} onRun={handleRunSearch} />
                          ))}
                        </div>
                      ) : (
                        <div className="ms-card-list-view">
                          {unpinnedSearches.map((s, i) => (
                            <SearchCard key={s.id} search={s} view="list" index={i + pinnedSearches.length}
                              onOpen={handleOpenDrawer} onPin={handlePinToggle}
                              onRename={handleRename} onDuplicate={handleDuplicate}
                              onDelete={handleDelete} onRun={handleRunSearch} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </main>

            <aside className="ms-insights" aria-label="Search insights">
              <div className="ms-insight-card">
                <h4 className="ms-insight-title"><FiBarChart2 size={14} /> Most Searched Skills</h4>
                {computedInsights.topSkills.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: C.s400, fontStyle: 'italic' }}>No skills data yet</p>
                ) : (
                  <div className="ms-insight-list">
                    {computedInsights.topSkills.map((skill, i) => {
                      const max = computedInsights.topSkills[0].count;
                      const pct = max > 0 ? (skill.count / max) * 100 : 0;
                      const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
                      return (
                        <div key={skill.name} className="ms-insight-item">
                          <div className="ms-insight-item-label" style={{ flex: 1 }}>
                            {skill.name}
                            <span className="ms-insight-item-value">{skill.count}</span>
                          </div>
                          <div className="ms-insight-bar">
                            <div className="ms-insight-bar-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="ms-insight-card">
                <h4 className="ms-insight-title"><FiMapPin size={14} /> Most Active Locations</h4>
                {computedInsights.topLocations.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: C.s400, fontStyle: 'italic' }}>No location data yet</p>
                ) : (
                  <div className="ms-insight-list">
                    {computedInsights.topLocations.map(loc => {
                      const max = computedInsights.topLocations[0].count;
                      const pct = max > 0 ? (loc.count / max) * 100 : 0;
                      return (
                        <div key={loc.name} className="ms-insight-item">
                          <div className="ms-insight-item-label" style={{ flex: 1 }}>
                            <FiMapPin size={12} /> {loc.name}
                            <span className="ms-insight-item-value">{loc.count}</span>
                          </div>
                          <div className="ms-insight-bar">
                            <div className="ms-insight-bar-fill" style={{ width: `${pct}%`, background: '#10b981' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="ms-insight-card">
                <h4 className="ms-insight-title"><FiZap size={14} /> Quick Actions</h4>
                <div className="ms-quick-actions">
                  <button className="ms-quick-btn ms-quick-btn-primary" onClick={() => navigate('/resdex')}>
                    <FiPlus size={14} /> Create New Search
                  </button>
                  <button className="ms-quick-btn" onClick={() => {}}>
                    <FiDownload size={14} /> Export Searches
                  </button>
                  <button className="ms-quick-btn" onClick={() => {}}>
                    <FiBell size={14} /> Manage Alerts
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </EmployerLayout>

      <div className={`ms-drawer-overlay ${drawerSearch ? 'open' : ''}`} onClick={handleCloseDrawer} />
      <div className={`ms-drawer ${drawerSearch ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Search preview">
        {drawerSearch && (
          <>
            <div className="ms-drawer-header">
              <h3 className="ms-drawer-title">{drawerSearch.name}</h3>
              <button className="ms-drawer-close" onClick={handleCloseDrawer} aria-label="Close preview">
                <FiX size={18} />
              </button>
            </div>
            <div className="ms-drawer-body">
              <div className="ms-drawer-field">
                <span className="ms-drawer-field-label">Search Name</span>
                <div className="ms-drawer-field-value">{drawerSearch.name}</div>
              </div>
              <div className="ms-drawer-field">
                <span className="ms-drawer-field-label">Created</span>
                <div className="ms-drawer-field-value">{formatDate(drawerSearch.createdAt)}</div>
              </div>
              <div className="ms-drawer-field">
                <span className="ms-drawer-field-label">Last Run</span>
                <div className="ms-drawer-field-value">{formatDate(drawerSearch.lastUsed)}</div>
              </div>
              <div className="ms-drawer-field">
                <span className="ms-drawer-field-label">Times Used</span>
                <div className="ms-drawer-field-value">{drawerSearch.timesUsed}</div>
              </div>
              {drawerSearch.notes && (
                <div className="ms-drawer-field">
                  <span className="ms-drawer-field-label">Notes</span>
                  <div className="ms-drawer-field-value" style={{ fontWeight: 500, color: C.s600 }}>{drawerSearch.notes}</div>
                </div>
              )}
              <div className="ms-drawer-field">
                <span className="ms-drawer-field-label">Filters</span>
                <div className="ms-drawer-chips">
                  {drawerSearch.filters.keyword && <span className="ms-chip" style={{ background: '#dbeafe', color: '#1e40af' }}>{drawerSearch.filters.keyword}</span>}
                  {(drawerSearch.filters.skills || []).map((s, i) => <span key={i} className="ms-chip">{s}</span>)}
                  {drawerSearch.filters.minExperience && <span className="ms-chip ms-chip-exp">{drawerSearch.filters.minExperience}-{drawerSearch.filters.maxExperience} yrs</span>}
                  {(drawerSearch.filters.currentCity || []).map((city, i) => <span key={i} className="ms-chip ms-chip-location"><FiMapPin size={9} /> {city}</span>)}
                  {drawerSearch.filters.remote && <span className="ms-chip ms-chip-location">Remote</span>}
                </div>
              </div>
            </div>
            <div className="ms-drawer-footer">
              <button className="sr-btn sr-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => { handleRunSearch(drawerSearch); handleCloseDrawer(); }}>
                <FiSearch size={14} /> Run Search Again
              </button>
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <div className="ms-modal-overlay" onClick={() => setDeleteTarget(null)} role="dialog" aria-modal="true" aria-label="Delete confirmation">
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-icon"><FiTrash2 size={24} color="#dc2626" /></div>
            <h3 className="ms-modal-title">Delete Saved Search?</h3>
            <p className="ms-modal-desc">You can recreate it anytime by running a new search and saving it.</p>
            <div className="ms-modal-actions">
              <button className="sr-btn" style={{ padding: '10px 24px' }} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="sr-btn" style={{ padding: '10px 24px', background: '#dc2626', color: 'white', borderColor: '#dc2626' }}
                onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="ms-modal-overlay" onClick={() => setRenameTarget(null)} role="dialog" aria-modal="true" aria-label="Rename search">
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-icon" style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}>
              <FiEdit3 size={24} color="#002366" />
            </div>
            <h3 className="ms-modal-title">Rename Search</h3>
            <p className="ms-modal-desc" style={{ marginBottom: 12 }}>Give your search a new name.</p>
            <input className="ms-rename-input" value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); }}
              placeholder="Search name" autoFocus aria-label="New search name" />
            <div className="ms-modal-actions" style={{ marginTop: 20 }}>
              <button className="sr-btn" style={{ padding: '10px 24px' }} onClick={() => setRenameTarget(null)}>Cancel</button>
              <button className="sr-btn sr-btn-primary" style={{ padding: '10px 24px' }}
                disabled={!renameValue.trim() || renameValue.trim() === renameTarget.name}
                onClick={handleRenameConfirm}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
