import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiChevronDown, FiChevronRight, FiChevronLeft, FiX, FiPlus,
  FiSave, FiClock, FiStar, FiTrendingUp, FiUsers, FiDatabase,
  FiSliders, FiMapPin, FiBriefcase, FiDollarSign, FiCalendar,
  FiBook, FiAward, FiShield, FiGlobe, FiLinkedin, FiGithub,
  FiExternalLink, FiFilter, FiRefreshCw, FiCheck,
  FiMail, FiMessageSquare, FiDownload, FiShare2, FiEye,
  FiZap, FiSettings, FiBookmark, FiTrash2, FiEdit3,
  FiTarget, FiBarChart2, FiHome, FiArrowLeft, FiToggleLeft,
  FiLayers, FiBox, FiCode, FiCloud, FiCpu, FiServer,
  FiSend, FiFolder, FiAlertCircle,
} from 'react-icons/fi';
import authService from '../../../../services/authService';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CandidateCard from '../../../../components/employer/CandidateCard';
import SendMivite from './SendMivite';
import FolderSelectorModal from '../../../../components/employer/FolderSelectorModal';
import './SearchResume.css';

const C = {
  navy: "#002366", navyD: "#001540", navyM: "#1a3a6e",
  green: "#10b981", indigo: "#6366f1", amber: "#f59e0b",
  sky: "#0ea5e9", red: "#ef4444", purple: "#8b5cf6",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
};

const CARD = {
  borderRadius: 16, border: `1px solid ${C.s200}`,
  background: "#fff", boxShadow: "0 2px 12px rgba(10,22,40,0.05)",
};

const SECTION_GROUPS = [
  { id: "basic", label: "Basic Search", icon: FiSearch },
  { id: "experience", label: "Experience", icon: FiBriefcase },
  { id: "location", label: "Location", icon: FiMapPin },
  { id: "salary", label: "Salary", icon: FiDollarSign },
  { id: "notice", label: "Notice Period", icon: FiCalendar },
  { id: "employment", label: "Employment Details", icon: FiLayers },
  { id: "education", label: "Education", icon: FiBook },
  { id: "skills", label: "Skills", icon: FiCode },
  { id: "certifications", label: "Certifications", icon: FiAward },
  { id: "diversity", label: "Diversity Hiring", icon: FiShield },
  { id: "additional", label: "Additional Details", icon: FiSettings },
];

const NOTICE_OPTIONS = [
  "Available Immediately", "15 Days", "30 Days", "45 Days",
  "60 Days", "90 Days", "Serving Notice",
];

const SKILL_CATEGORIES = [
  { id: "programming", label: "Programming Languages", icon: "⌨️" },
  { id: "frontend", label: "Frontend", icon: "🎨" },
  { id: "backend", label: "Backend", icon: "⚙️" },
  { id: "cloud", label: "Cloud & DevOps", icon: "☁️" },
  { id: "ai", label: "AI & ML", icon: "🤖" },
  { id: "devops", label: "DevOps & SRE", icon: "🛠️" },
  { id: "databases", label: "Databases", icon: "🗄️" },
  { id: "soft", label: "Soft Skills", icon: "💬" },
];

const DIVERSITY_OPTIONS = [
  { id: "womenHiring", label: "Women Hiring" },
  { id: "careerBreak", label: "Career Break Returnship" },
  { id: "veterans", label: "Veterans" },
  { id: "disabilities", label: "Persons with Disabilities" },
  { id: "returnships", label: "Returnship Programs" },
  { id: "freshers", label: "Freshers / Entry Level" },
  { id: "campusHiring", label: "Campus Hiring" },
];

const RECRUITER_TIPS = [
  "Use boolean search (AND/OR/NOT) for precise matching",
  "Add multiple skills to narrow results",
  "Save frequent searches for quick access",
  "Try AI Assistant for natural language search",
];

export default function SearchResume() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTabParam = searchParams.get("activeTab") || "bAdvSrch";
  const versionParam = searchParams.get("version") || "v1";

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "mivites" ? "mivites" : "search");
  const [activeSections, setActiveSections] = useState(["basic", "experience", "location"]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [saveSearchModal, setSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [filterOptions, setFilterOptions] = useState({
    skills: [], groupedSkills: {}, cities: [], companies: [],
    titles: [], noticePeriods: NOTICE_OPTIONS, certifications: [],
  });

  const [filters, setFilters] = useState({
      keyword: "", skills: [], booleanQuery: "", currentCompany: "",
      previousCompany: "", designation: "", excludeKeywords: "",
      minExperience: "", maxExperience: "",
      currentCity: [], preferredCity: [], remote: false, hybrid: false, relocation: false,
      currency: "INR", currentSalaryMin: "", currentSalaryMax: "",
      expectedSalaryMin: "", expectedSalaryMax: "",
      noticePeriod: [],
      department: "", role: "", industry: "", employmentType: "", employmentStatus: "",
      ug: "", pg: "", doctorate: "", institute: "", graduationYear: "", minPercentage: "",
      certifications: [],
      diversityGender: [], careerBreak: false, veterans: false, disabilities: false,
      returnship: false, womenHiring: false, campusHiring: false, freshers: false,
      languages: [], workPermit: [], passport: false, visa: "",
      github: "", linkedIn: "", portfolio: "",
  });

  const [savedSearches, setSavedSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const locationStateProcessed = useRef(false);
  const [stats, setStats] = useState({ totalCandidates: 0, searchesThisMonth: 0 });

  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Map());
  const [cachedResults, setCachedResults] = useState([]);
  const [folderCandidateId, setFolderCandidateId] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const skillSearchRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("employerToken");
    if (!token) { setSessionExpired(true); setLoading(false); return; }
    const load = async () => {
      try {
        const [dashRes, filtersRes, searchesRes, recentRes] = await Promise.all([
          authService.getEmployerDashboard().catch(() => null),
          authService.getResdexFilters().catch(() => ({ success: true, data: { skills: [], groupedSkills: {}, cities: [], companies: [], titles: [], noticePeriods: NOTICE_OPTIONS, certifications: [] } })),
          authService.getResdexSearches().catch(() => ({ success: true, data: [] })),
          authService.getResdexRecentSearches().catch(() => ({ success: true, data: [] })),
        ]);
        if (dashRes?.success) {
          setCompany(dashRes.data.company || dashRes.data);
          setUser(dashRes.data.user || dashRes.data);
        }
        if (filtersRes?.success) setFilterOptions(filtersRes.data);
        if (searchesRes?.success) setSavedSearches(searchesRes.data);
        if (recentRes?.success) setRecentSearches(recentRes.data);
      } catch { setSessionExpired(true); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = () => { setSessionExpired(true); };
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, []);

  useEffect(() => {
    if (!locationStateProcessed.current) {
      let handled = false;
      if (location.state?.preSelectedCandidate) {
        handled = true;
        const c = location.state.preSelectedCandidate;
        const id = c.id || c.userId || c._id;
        setSelectedCandidates(new Map([[id, c]]));
        setCachedResults(prev => prev.some(p => (p.id || p.userId || p._id) === id) ? prev : [c, ...prev]);
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('tab') === 'mivites') {
          setActiveTab('mivites');
        }
      }
      if (location.state?.savedFilters) {
        handled = true;
        setFilters(prev => ({ ...prev, ...location.state.savedFilters }));
        if (location.state.searchName) {
          setSearchName(location.state.searchName);
        }
        setTimeout(() => fetchCandidates(1), 100);
      }
      if (handled) {
        locationStateProcessed.current = true;
      }
    }
  }, [location.state, location.search]);

  const toggleSection = (id) => {
    setActiveSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === "boolean" && value) count++;
      else if (typeof value === "string" && value.trim()) count++;
      else if (typeof value === "number" && value > 0) count++;
    });
    return count;
  }, [filters]);

  const fetchCandidates = useCallback(async (page = 1) => {
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const creditRes = await authService.searchCredits();
      if (!creditRes?.success) {
        setShowCreditModal(true);
        setSearchLoading(false);
        return;
      }
      window.dispatchEvent(new CustomEvent("employer-credits-changed", { detail: creditRes.data }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "";
      if (msg.toLowerCase().includes("credit") || msg.toLowerCase().includes("insufficient")) {
        setShowCreditModal(true);
        setSearchLoading(false);
        return;
      }
    }
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) params[key] = value.join(",");
        else if (typeof value === "boolean" && value) params[key] = "true";
        else if (typeof value === "string" && value.trim()) params[key] = value.trim();
      });
      params.page = String(page);
      params.limit = "10";
      const res = await authService.searchResdexCandidates(params);
      if (res?.success) {
        const candidates = res.data.candidates || [];
        setSearchResults(candidates);
        setCachedResults(candidates);
        setSearchPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } else {
        setSearchResults([]);
        setSearchPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      }
      refreshRecentSearches();
    } catch {
      setSearchResults([]);
      setSearchPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
    }
    setSearchLoading(false);
  }, [filters]);

  if (sessionExpired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <FiUsers size={48} color={C.s400} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.s900, marginBottom: 8 }}>Session Expired</h2>
          <p style={{ color: C.s500, fontSize: "0.9rem", marginBottom: 20 }}>Please log in again to access Resdex.</p>
          <button onClick={() => navigate("/employer-login")} style={{
            padding: "10px 24px", borderRadius: 10, background: C.navy, color: "#fff",
            border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Go to Login</button>
        </div>
      </div>
    );
  }

  const refreshRecentSearches = useCallback(async () => {
    try {
      const res = await authService.getResdexRecentSearches();
      if (res?.success) setRecentSearches(res.data);
    } catch {}
  }, []);

  const handleSearch = () => {
    fetchCandidates(1);
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: "", skills: [], booleanQuery: "", currentCompany: "",
      previousCompany: "", designation: "", excludeKeywords: "",
      minExperience: "", maxExperience: "",
      currentCity: [], preferredCity: [], remote: false, hybrid: false, relocation: false,
      currency: "INR", currentSalaryMin: "", currentSalaryMax: "",
      expectedSalaryMin: "", expectedSalaryMax: "",
      noticePeriod: [],
      department: "", role: "", industry: "", employmentType: "", employmentStatus: "",
      ug: "", pg: "", doctorate: "", institute: "", graduationYear: "", minPercentage: "",
      certifications: [],
      diversityGender: [], careerBreak: false, veterans: false, disabilities: false,
      returnship: false, womenHiring: false, campusHiring: false, freshers: false,
      languages: [], workPermit: [], passport: false, visa: "",
      github: "", linkedIn: "", portfolio: "",
    });
  };

  const handleAiParse = async () => {
    if (!aiQuery.trim()) return;
    setAiProcessing(true);
    try {
      const res = await authService.aiParseResdexQuery(aiQuery);
      if (res?.success && res.data) {
        const parsed = res.data;
        setFilters(prev => ({
          ...prev,
          keyword: parsed.keyword || prev.keyword,
          skills: parsed.skills || prev.skills,
          minExperience: parsed.minExperience || prev.minExperience,
          maxExperience: parsed.maxExperience || prev.maxExperience,
          currentCity: parsed.currentCity || prev.currentCity,
          preferredCity: parsed.preferredCity || prev.preferredCity,
          currentCompany: parsed.currentCompany || prev.currentCompany,
          designation: parsed.designation || prev.designation,
          noticePeriod: parsed.noticePeriod ? [parsed.noticePeriod] : prev.noticePeriod,
          remote: parsed.remote || prev.remote,
          expectedSalaryMin: parsed.expectedSalaryMin || prev.expectedSalaryMin,
          expectedSalaryMax: parsed.expectedSalaryMax || prev.expectedSalaryMax,
          industry: parsed.industry || prev.industry,
        }));
        setShowAiAssistant(false);
        setAiQuery("");
      }
    } catch { /* ignore */ }
    finally { setAiProcessing(false); }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    try {
      const res = await authService.saveResdexSearch({ name: searchName.trim(), filters });
      if (res?.success) {
        setSavedSearches(prev => [res.data, ...prev]);
        setSaveSearchModal(false);
        setSearchName("");
      }
    } catch { /* ignore */ }
  };

  const handleLoadSearch = (search) => {
    if (search.filters) {
      setFilters(prev => ({ ...prev, ...search.filters }));
      setTimeout(() => fetchCandidates(1), 100);
    }
  };

  if (loading) {
    return <SearchResumeSkeleton />;
  }

  return (
    <EmployerLayout
      company={company}
      activeTab="resdex"
      onNavigate={(tab) => {
        if (tab === "home") navigate("/employer-dashboard");
        else if (tab === "analysis") navigate("/employer-dashboard/analytics");
      }}
      onMessagesClick={() => {}}
      onNotificationsClick={() => {}}
      onLogout={() => { localStorage.removeItem("employerToken"); navigate("/employer-login"); }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Resdex' },
        { label: activeTab === 'search' ? 'Search Resume' : 'Send MIvites' },
      ]} />

        <div className="sr-tab-bar">
          <button className={`sr-tab-btn ${activeTab === "search" ? "active" : ""}`} onClick={() => { setActiveTab("search"); navigate("/resdex", { replace: true }); }}>
            <FiSearch size={15} /> Search Resume
          </button>
          <button className={`sr-tab-btn ${activeTab === "mivites" ? "active" : ""}`} onClick={() => { setActiveTab("mivites"); navigate("/resdex?tab=mivites", { replace: true }); }}>
            <FiSend size={15} /> Send MIvites
          </button>
        </div>

        {activeTab === "search" ? (
          <>
            <div className="sr-header">
              <div>
                <h1 className="sr-title">Search Resume</h1>
                <p className="sr-subtitle">Find the best candidates using advanced AI-powered search filters.</p>
              </div>
              <div className="sr-header-actions">
                <button className="sr-btn sr-btn-ghost" onClick={() => setSaveSearchModal(true)}>
                  <FiSave size={14} /> Save Search
                </button>
                <button className="sr-btn sr-btn-ghost" onClick={() => setShowAiAssistant(true)}>
                  <FiZap size={14} /> AI Assistant
                </button>
                <button className="sr-btn sr-btn-primary" onClick={handleSearch}>
                  <FiSearch size={14} /> Search Candidates
                </button>
              </div>
            </div>

            <button className="sr-mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
              <FiFilter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            <div className={`sr-layout ${mobileFiltersOpen ? 'sr-layout--filters-open' : ''}`}>
              <aside className={`sr-sidebar ${mobileFiltersOpen ? 'sr-sidebar--open' : ''}`}>
                <div className="sr-sidebar-header">
                  <h3 className="sr-sidebar-title"><FiSliders size={15} /> Filters</h3>
                  <div className="sr-sidebar-actions">
                    {activeFilterCount > 0 && (
                      <button className="sr-clear-btn" onClick={handleClearFilters}>Clear ({activeFilterCount})</button>
                    )}
                    <button className="sr-sidebar-close" onClick={() => setMobileFiltersOpen(false)}>
                      <FiX size={18} />
                    </button>
                  </div>
                </div>

                <div className="sr-filters">
                  {SECTION_GROUPS.map(group => {
                    const isOpen = activeSections.includes(group.id);
                    const SectionIcon = group.icon || FiFilter;
                    return (
                      <div key={group.id} className="sr-filter-section">
                        <button className="sr-filter-section-header" onClick={() => toggleSection(group.id)}>
                          <div className="sr-filter-section-left">
                            <SectionIcon size={14} />
                            <span>{group.label}</span>
                          </div>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <FiChevronDown size={14} />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="sr-filter-section-body"
                            >
                              <FilterContent groupId={group.id} filters={filters} updateFilter={updateFilter}
                                toggleArrayFilter={toggleArrayFilter} filterOptions={filterOptions} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div className="sr-sidebar-apply">
                  <button className="sr-btn sr-btn-primary sr-btn-block" onClick={handleSearch}>
                    <FiSearch size={15} /> Search Candidates
                  </button>
                </div>
              </aside>
              {mobileFiltersOpen && <div className="sr-sidebar-overlay" onClick={() => setMobileFiltersOpen(false)} />}

              <main className="sr-main">
                <div className="sr-main-inner">
                  {!hasSearched ? (
                    <>
                      <div className="sr-ai-assistant-card" onClick={() => setShowAiAssistant(true)}>
                        <FiZap size={18} className="sr-ai-icon" />
                        <div>
                          <div className="sr-ai-assistant-title">AI Resume Assistant</div>
                          <div className="sr-ai-assistant-desc">
                            Convert natural language into filters. Try "Find React Developers with 2-4 years experience"
                          </div>
                        </div>
                        <FiChevronRight size={16} className="sr-ai-arrow" />
                      </div>

                      <div className="sr-recent-searches">
                        <h3 className="sr-recent-title"><FiClock size={14} /> Recent Searches</h3>
                        {recentSearches.length === 0 ? (
                          <div className="sr-recent-empty">
                            <FiSearch size={32} />
                            <p>No recent searches</p>
                            <span>Your search history will appear here</span>
                          </div>
                        ) : (
                          <div className="sr-recent-list">
                            {(() => {
                              const grouped = {};
                              recentSearches.forEach(s => {
                                const key = s.name || "Untitled Search";
                                if (!grouped[key]) grouped[key] = { ...s, _count: 0 };
                                grouped[key]._count++;
                                if (new Date(s.lastRunAt || 0) > new Date(grouped[key].lastRunAt || 0))
                                  grouped[key].lastRunAt = s.lastRunAt;
                                if ((s.resultCount || 0) > (grouped[key].resultCount || 0))
                                  grouped[key].resultCount = s.resultCount;
                              });
                              return Object.values(grouped).slice(0, 5).map((s, i) => (
                                <div key={s._id || i} className="sr-recent-item" onClick={() => handleLoadSearch(s)}>
                                  <div className="sr-recent-item-left">
                                    <FiClock size={13} />
                                    <span className="sr-recent-item-name">{s.name}</span>
                                    {s._count > 1 && <span className="sr-recent-badge">x{s._count}</span>}
                                  </div>
                                  <div className="sr-recent-item-meta">
                                    <span className="sr-recent-item-count">{s.resultCount || 0} candidates</span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="sr-quick-stats">
                        <div className="sr-stat-card">
                          <FiDatabase size={20} />
                          <div className="sr-stat-value">{stats.totalCandidates || "—"}</div>
                          <div className="sr-stat-label">Total Profiles</div>
                        </div>
                        <div className="sr-stat-card">
                          <FiTrendingUp size={20} />
                          <div className="sr-stat-value">{stats.searchesThisMonth || "—"}</div>
                          <div className="sr-stat-label">Searches (Month)</div>
                        </div>
                        <div className="sr-stat-card">
                          <FiUsers size={20} />
                          <div className="sr-stat-value">{savedSearches.length}</div>
                          <div className="sr-stat-label">Saved Searches</div>
                        </div>
                      </div>

                      <div className="sr-saved-searches">
                        <h3 className="sr-recent-title"><FiStar size={14} /> Saved Searches</h3>
                        {savedSearches.length === 0 ? (
                          <div className="sr-recent-empty">
                            <FiSave size={32} />
                            <p>No saved searches</p>
                            <span>Save your search criteria for quick access</span>
                          </div>
                        ) : (
                          <div className="sr-saved-list">
                            {savedSearches.map((s, i) => (
                              <div key={s._id || i} className="sr-saved-item">
                                <div className="sr-saved-item-top">
                                  <div className="sr-saved-item-left">
                                    {s.isPinned ? <FiStar size={13} style={{ fill: C.amber, color: C.amber }} /> : <FiBookmark size={13} />}
                                    <span className="sr-saved-item-name">{s.name}</span>
                                  </div>
                                  <div className="sr-saved-item-actions">
                                    <button className="sr-icon-btn" title="Delete">
                                      <FiTrash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                                <div className="sr-saved-item-meta">
                                  {s.resultCount > 0 && <span>{s.resultCount} results</span>}
                                  {s.lastRunAt && <span>{new Date(s.lastRunAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sr-tips-card">
                        <h4><FiTarget size={14} /> Recruiter Tips</h4>
                        <ul>
                          {RECRUITER_TIPS.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : searchLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          height: 200, background: 'white', borderRadius: 16,
                          border: `1px solid ${C.s200}`, padding: 20,
                        }}>
                          <div style={{ display: 'flex', gap: 14 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.s100, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ height: 16, width: '30%', background: C.s100, borderRadius: 6, marginBottom: 8 }} />
                              <div style={{ height: 12, width: '50%', background: C.s100, borderRadius: 6, marginBottom: 12 }} />
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ height: 12, width: 80, background: C.s100, borderRadius: 6 }} />
                                <div style={{ height: 12, width: 100, background: C.s100, borderRadius: 6 }} />
                                <div style={{ height: 12, width: 80, background: C.s100, borderRadius: 6 }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '60px 20px', background: 'white',
                      borderRadius: 16, border: `1px solid ${C.s200}`,
                    }}>
                      <FiSearch size={48} color={C.s300} style={{ marginBottom: 16 }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.s800, marginBottom: 8 }}>No Candidates Found</h3>
                      <p style={{ fontSize: '0.85rem', color: C.s500, maxWidth: 400, margin: '0 auto 20px' }}>
                        Try broadening your search criteria or removing some filters.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="sr-results-summary" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', fontSize: '0.82rem', color: C.s500,
                      }}>
                        <span>Showing {searchResults.length} of {searchPagination.total.toLocaleString()} results{selectedCandidates.size > 0 ? ` | ${selectedCandidates.size} selected` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {searchResults.map((candidate, index) => {
                          const cid = candidate.id || candidate.userId;
                          return (
                            <CandidateCard key={cid || index} candidate={candidate}
                              isSelected={selectedCandidates.has(cid)}
                              onToggleSelect={(c) => {
                                const id = c.id || c.userId;
                                setSelectedCandidates(prev => {
                                  const next = new Map(prev);
                                  if (next.has(id)) next.delete(id); else next.set(id, c);
                                  return next;
                                });
                              }}
                              onAddToFolder={(c) => setFolderCandidateId(c.userId || c.id)}
                            />
                          );
                        })}
                      </div>
                      {searchPagination.totalPages > 1 && (
                        <Pagination
                          current={searchPagination.page}
                          total={searchPagination.totalPages}
                          onChange={fetchCandidates}
                        />
                      )}
                    </>
                  )}
                </div>
              </main>
            </div>
          </>
        ) : (
          <SendMivite company={company} user={user}
            initialResults={cachedResults}
            initialSelectedIds={Array.from(selectedCandidates.keys())}
            onClearSelection={() => setSelectedCandidates(new Map())}
            startStep={location.state?.startAtJobStep ? 1 : 0}
          />
        )}

      <AnimatePresence>
        {showAiAssistant && (
          <motion.div className="sr-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAiAssistant(false)}>
            <motion.div className="sr-ai-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="sr-ai-modal-header">
                <div className="sr-ai-modal-title-row">
                  <FiZap size={18} />
                  <h3>AI Resume Assistant</h3>
                </div>
                <button className="sr-ai-modal-close" onClick={() => setShowAiAssistant(false)}><FiX size={18} /></button>
              </div>
              <div className="sr-ai-modal-body">
                <p className="sr-ai-modal-desc">Describe the candidate you're looking for in natural language.</p>
                <div className="sr-ai-examples">
                  {[
                    "Find React Developers with 2-4 years experience",
                    "Senior Java developers in Bangalore, 30 days notice",
                    "Marketing managers with SaaS experience, remote",
                  ].map((ex, i) => (
                    <button key={i} className="sr-ai-example" onClick={() => setAiQuery(ex)}>
                      "{ex}"
                    </button>
                  ))}
                </div>
                <textarea className="sr-ai-textarea" placeholder="Type your search query in natural language..."
                  value={aiQuery} onChange={e => setAiQuery(e.target.value)} rows={4} />
              </div>
              <div className="sr-ai-modal-footer">
                <button className="sr-btn sr-btn-ghost" onClick={() => setShowAiAssistant(false)}>Cancel</button>
                <button className="sr-btn sr-btn-primary" onClick={handleAiParse} disabled={aiProcessing || !aiQuery.trim()}>
                  {aiProcessing ? "Parsing..." : "Apply Filters"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveSearchModal && (
          <motion.div className="sr-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSaveSearchModal(false)}>
            <motion.div className="sr-save-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="sr-ai-modal-header">
                <div className="sr-ai-modal-title-row">
                  <FiSave size={18} />
                  <h3>Save Search</h3>
                </div>
                <button className="sr-ai-modal-close" onClick={() => setSaveSearchModal(false)}><FiX size={18} /></button>
              </div>
              <div className="sr-ai-modal-body">
                <p className="sr-ai-modal-desc">Name your search to access it later.</p>
                <input className="sr-save-input" type="text" placeholder="e.g., Senior React Developers"
                  value={searchName} onChange={e => setSearchName(e.target.value)} autoFocus />
                <div className="sr-save-info">
                  <FiFilter size={13} />
                  <span>{activeFilterCount} active filters will be saved</span>
                </div>
              </div>
              <div className="sr-ai-modal-footer">
                <button className="sr-btn sr-btn-ghost" onClick={() => setSaveSearchModal(false)}>Cancel</button>
                <button className="sr-btn sr-btn-primary" onClick={handleSaveSearch} disabled={!searchName.trim()}>
                  Save Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreditModal && (
          <motion.div className="sr-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreditModal(false)}>
            <motion.div className="sr-save-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: "center", padding: "40px 32px 28px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FiAlertCircle size={28} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: C.s800, marginBottom: 8 }}>Insufficient Credits</h3>
              <p style={{ fontSize: "0.85rem", color: C.s500, marginBottom: 24, lineHeight: 1.6 }}>
                You need 10 credits per resume search. Please top up your account to continue searching.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="sr-btn sr-btn-ghost" onClick={() => setShowCreditModal(false)}>Cancel</button>
                <button className="sr-btn sr-btn-primary" onClick={() => { setShowCreditModal(false); navigate("/employer-dashboard/pricing"); }}
                  style={{ background: "linear-gradient(135deg,#002366,#1a3a6e)" }}>
                  Buy Credits
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {folderCandidateId && (
        <FolderSelectorModal
          candidateId={folderCandidateId}
          onClose={() => setFolderCandidateId(null)}
        />
      )}
    </EmployerLayout>
  );
}

function FilterContent({ groupId, filters, updateFilter, toggleArrayFilter, filterOptions }) {
  switch (groupId) {
    case "basic":
      return (
        <div className="sr-filter-fields">
          <InputField label="Keyword" value={filters.keyword} onChange={v => updateFilter("keyword", v)} placeholder="e.g., React Developer" />
          <ChipField label="Skills" values={filters.skills} onAdd={v => updateFilter("skills", [...filters.skills, v])}
            onRemove={v => updateFilter("skills", filters.skills.filter(s => s !== v))}
            suggestions={filterOptions.skills || []} />
          <InputField label="Boolean Query (AND/OR/NOT)" value={filters.booleanQuery} onChange={v => updateFilter("booleanQuery", v)}
            placeholder="e.g., React AND Node NOT Angular" />
          <InputField label="Current Company" value={filters.currentCompany} onChange={v => updateFilter("currentCompany", v)}
            placeholder="Company name" />
          <InputField label="Previous Company" value={filters.previousCompany} onChange={v => updateFilter("previousCompany", v)}
            placeholder="Past company" />
          <InputField label="Designation" value={filters.designation} onChange={v => updateFilter("designation", v)}
            placeholder="Job title" />
          <InputField label="Exclude Keywords" value={filters.excludeKeywords} onChange={v => updateFilter("excludeKeywords", v)}
            placeholder="comma-separated" />
        </div>
      );
    case "experience":
      return (
        <div className="sr-filter-fields">
          <div className="sr-range-row">
            <div className="sr-range-field">
              <label className="sr-field-label">Min Experience (years)</label>
              <input type="number" className="sr-input" min="0" max="50" placeholder="0"
                value={filters.minExperience} onChange={e => updateFilter("minExperience", e.target.value)} />
            </div>
            <div className="sr-range-field">
              <label className="sr-field-label">Max Experience (years)</label>
              <input type="number" className="sr-input" min="0" max="50" placeholder="30"
                value={filters.maxExperience} onChange={e => updateFilter("maxExperience", e.target.value)} />
            </div>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="sr-filter-fields">
          <MultiSelect label="Current City" values={filters.currentCity}
            options={filterOptions.cities || []}
            onToggle={v => toggleArrayFilter("currentCity", v)} />
          <MultiSelect label="Preferred City" values={filters.preferredCity}
            options={filterOptions.cities || []}
            onToggle={v => toggleArrayFilter("preferredCity", v)} />
          <CheckboxField label="Remote" checked={filters.remote} onChange={v => updateFilter("remote", v)} />
          <CheckboxField label="Hybrid" checked={filters.hybrid} onChange={v => updateFilter("hybrid", v)} />
          <CheckboxField label="Open to Relocation" checked={filters.relocation} onChange={v => updateFilter("relocation", v)} />
        </div>
      );
    case "salary":
      return (
        <div className="sr-filter-fields">
          <SelectField label="Currency" value={filters.currency} options={["INR", "USD", "EUR", "GBP", "AED", "SGD"]}
            onChange={v => updateFilter("currency", v)} />
          <div className="sr-range-row">
            <InputField label="Current Salary Min" value={filters.currentSalaryMin}
              onChange={v => updateFilter("currentSalaryMin", v)} placeholder="Min" type="number" />
            <InputField label="Current Salary Max" value={filters.currentSalaryMax}
              onChange={v => updateFilter("currentSalaryMax", v)} placeholder="Max" type="number" />
          </div>
          <div className="sr-range-row">
            <InputField label="Expected Salary Min" value={filters.expectedSalaryMin}
              onChange={v => updateFilter("expectedSalaryMin", v)} placeholder="Min" type="number" />
            <InputField label="Expected Salary Max" value={filters.expectedSalaryMax}
              onChange={v => updateFilter("expectedSalaryMax", v)} placeholder="Max" type="number" />
          </div>
        </div>
      );
    case "notice":
      return (
        <div className="sr-filter-fields">
          <div className="sr-chip-group">
            {NOTICE_OPTIONS.map(opt => (
              <button key={opt} className={`sr-chip ${filters.noticePeriod.includes(opt) ? 'active' : ''}`}
                onClick={() => toggleArrayFilter("noticePeriod", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    case "employment":
      return (
        <div className="sr-filter-fields">
          <InputField label="Department" value={filters.department}
            onChange={v => updateFilter("department", v)} placeholder="e.g., Engineering" />
          <InputField label="Role" value={filters.role}
            onChange={v => updateFilter("role", v)} placeholder="e.g., Senior Developer" />
          <InputField label="Industry" value={filters.industry}
            onChange={v => updateFilter("industry", v)} placeholder="e.g., IT Services" />
          <SelectField label="Employment Type" value={filters.employmentType}
            options={["", "Full Time", "Part Time", "Contract", "Internship", "Freelance"]}
            onChange={v => updateFilter("employmentType", v)} />
        </div>
      );
    case "education":
      return (
        <div className="sr-filter-fields">
          <InputField label="UG (Bachelor's)" value={filters.ug}
            onChange={v => updateFilter("ug", v)} placeholder="e.g., B.Tech" />
          <InputField label="PG (Master's)" value={filters.pg}
            onChange={v => updateFilter("pg", v)} placeholder="e.g., M.Tech" />
          <InputField label="Doctorate" value={filters.doctorate}
            onChange={v => updateFilter("doctorate", v)} placeholder="e.g., PhD" />
          <InputField label="Institute" value={filters.institute}
            onChange={v => updateFilter("institute", v)} placeholder="e.g., IIT, NIT" />
          <InputField label="Graduation Year" value={filters.graduationYear}
            onChange={v => updateFilter("graduationYear", v)} placeholder="e.g., 2020" />
          <InputField label="Minimum Percentage" value={filters.minPercentage}
            onChange={v => updateFilter("minPercentage", v)} placeholder="e.g., 60" type="number" />
        </div>
      );
    case "skills":
      return (
        <div className="sr-filter-fields">
          <ChipField label="Search Skills" values={filters.skills} onAdd={v => updateFilter("skills", [...filters.skills, v])}
            onRemove={v => updateFilter("skills", filters.skills.filter(s => s !== v))}
            suggestions={filterOptions.skills || []} />
          {SKILL_CATEGORIES.map(cat => {
            const groupedSkills = filterOptions.groupedSkills?.[cat.id] || [];
            if (groupedSkills.length === 0) return null;
            const displaySkills = groupedSkills.slice(0, 8);
            return (
              <div key={cat.id} className="sr-skill-category">
                <div className="sr-skill-category-label">{cat.icon} {cat.label}</div>
                <div className="sr-skill-chips">
                  {displaySkills.map(s => (
                    <button key={s} className={`sr-chip-sm ${filters.skills.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleArrayFilter("skills", s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    case "certifications":
      return (
        <div className="sr-filter-fields">
          <div className="sr-chip-group">
            {(filterOptions.certifications || []).map(cert => (
              <button key={cert} className={`sr-chip ${filters.certifications.includes(cert) ? 'active' : ''}`}
                onClick={() => toggleArrayFilter("certifications", cert)}>
                {cert}
              </button>
            ))}
          </div>
        </div>
      );
    case "diversity":
      return (
        <div className="sr-filter-fields">
          {DIVERSITY_OPTIONS.map(opt => (
            <CheckboxField key={opt.id} label={opt.label}
              checked={filters[opt.id]} onChange={v => updateFilter(opt.id, v)} />
          ))}
        </div>
      );
    case "additional":
      return (
        <div className="sr-filter-fields">
          <InputField label="Languages" value={filters.languages.length > 0 ? filters.languages.join(", ") : ""}
            onChange={v => updateFilter("languages", v.split(",").map(s => s.trim()).filter(Boolean))}
            placeholder="e.g., English, Hindi" />
          <InputField label="GitHub URL" value={filters.github}
            onChange={v => updateFilter("github", v)} placeholder="GitHub profile" />
          <InputField label="LinkedIn URL" value={filters.linkedIn}
            onChange={v => updateFilter("linkedIn", v)} placeholder="LinkedIn profile" />
          <InputField label="Portfolio URL" value={filters.portfolio}
            onChange={v => updateFilter("portfolio", v)} placeholder="Portfolio website" />
          <CheckboxField label="Has Passport" checked={filters.passport} onChange={v => updateFilter("passport", v)} />
        </div>
      );
    default:
      return null;
  }
}



function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="sr-field">
      {label && <label className="sr-field-label">{label}</label>}
      <input type={type} className="sr-input" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="sr-field">
      {label && <label className="sr-field-label">{label}</label>}
      <select className="sr-input sr-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt || "Any"}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="sr-checkbox-field">
      <div className={`sr-checkbox ${checked ? 'checked' : ''}`}
        onClick={() => onChange(!checked)}>
        {checked && <FiCheck size={10} />}
      </div>
      <span className="sr-checkbox-label">{label}</span>
    </label>
  );
}

function ChipField({ label, values, onAdd, onRemove, suggestions }) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s))
    .slice(0, 8);

  const handleAdd = (val) => {
    if (val.trim() && !values.includes(val.trim())) {
      onAdd(val.trim());
    }
    setInput("");
  };

  return (
    <div className="sr-field">
      {label && <label className="sr-field-label">{label}</label>}
      <div className="sr-chip-input-wrap">
        {values.map(v => (
          <span key={v} className="sr-chip-value">
            {v} <FiX size={11} onClick={() => onRemove(v)} />
          </span>
        ))}
        <input className="sr-chip-input" placeholder="Type to add..." value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(input); } }}
          onFocus={() => setShowSuggestions(true)} />
      </div>
      {showSuggestions && input && filteredSuggestions.length > 0 && (
        <div className="sr-suggestions">
          {filteredSuggestions.map(s => (
            <div key={s} className="sr-suggestion" onClick={() => { handleAdd(s); }}>
              <FiPlus size={12} /> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ label, values, options, onToggle }) {
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

  return (
    <div className="sr-field">
      {label && <label className="sr-field-label">{label}</label>}
      <input className="sr-input" placeholder={`Search ${label.toLowerCase()}...`} value={search}
        onChange={e => setSearch(e.target.value)} />
      <div className="sr-multi-select-list">
        {filtered.map(opt => (
          <label key={opt} className="sr-checkbox-field">
            <div className={`sr-checkbox ${values.includes(opt) ? 'checked' : ''}`}
              onClick={() => onToggle(opt)}>
              {values.includes(opt) && <FiCheck size={10} />}
            </div>
            <span className="sr-checkbox-label">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Pagination({ current, total, onChange }) {
  const getRange = () => {
    const maxVisible = 5;
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push(null); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push(null); pages.push(total); }
    return pages;
  };

  const range = getRange();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 24, padding: '16px 0',
    }}>
      <button className="sr-btn" disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <FiChevronLeft size={14} /> Prev
      </button>
      {range.map((page, i) =>
        page === null ? (
          <span key={`e${i}`} style={{ color: C.s400, fontSize: '0.82rem', padding: '0 4px' }}>...</span>
        ) : (
          <button key={page}
            className={`sr-btn ${page === current ? 'sr-btn-primary' : ''}`}
            onClick={() => onChange(page)}
            style={{ minWidth: 36, justifyContent: 'center', fontWeight: page === current ? 700 : 500 }}>
            {page}
          </button>
        )
      )}
      <button className="sr-btn" disabled={current >= total}
        onClick={() => onChange(current + 1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Next <FiChevronRight size={14} />
      </button>
    </div>
  );
}

function SearchResumeSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>
      <div style={{ height: 58, background: "#fff", borderBottom: "1px solid #e2e8f0", position: 'sticky', top: 0, zIndex: 200 }} />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '20px 20px 48px' }}>
        <div style={{ height: 16, width: 300, background: "#f1f5f9", borderRadius: 6, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 28 }}>
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 48, background: "#f1f5f9", borderRadius: 12 }} />
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 120, background: "#f1f5f9", borderRadius: 16 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
