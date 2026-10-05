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
import QuotaExhausted from '../../../../components/employer/QuotaExhausted';
import FolderSelectorModal from '../../../../components/employer/FolderSelectorModal';
import SetReminderModal from '../../../../components/employer/SetReminderModal';
import './SearchResume.css';
import { useToast } from '../../../../context/ToastContext';

const ACTIVE_IN_OPTIONS = [
  { label: "3 days", value: "3d" },
  { label: "7 days", value: "7d" },
  { label: "15 days", value: "15d" },
  { label: "30 days", value: "30d" },
  { label: "2 months", value: "2m" },
  { label: "3 months", value: "3m" },
  { label: "6 months", value: "6m" },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Experience - High to Low", value: "experience_high" },
  { label: "Experience - Low to High", value: "experience_low" },
  { label: "Recent Activity", value: "newest" },
  { label: "Salary - Low to High", value: "salary_low" },
  { label: "Salary - High to Low", value: "salary_high" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 40, 50, 100];

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
  const [quotaUsage, setQuotaUsage] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "mivites" ? "mivites" : "search");
  const [activeSections, setActiveSections] = useState(["basic", "experience", "location"]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [saveSearchModal, setSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { showToast } = useToast();

  const [filterOptions, setFilterOptions] = useState({
    skills: [], groupedSkills: {}, cities: [], companies: [],
    titles: [], noticePeriods: NOTICE_OPTIONS, certifications: [],
  });

  const [filters, setFilters] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialFilters = {
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
    };
    let hasUrlFilters = false;
    for (const [key, value] of searchParams.entries()) {
      if (['tab', 'activeTab', 'version', 'page', 'limit'].includes(key)) continue;
      if (key in initialFilters) {
        if (Array.isArray(initialFilters[key])) {
          initialFilters[key] = value.split(',').filter(Boolean);
        } else if (typeof initialFilters[key] === 'boolean') {
          initialFilters[key] = value === 'true';
        } else {
          initialFilters[key] = value;
        }
        hasUrlFilters = true;
      }
    }
    if (searchParams.get("uniqueId") || searchParams.get("uresid") || searchParams.get("simCvSource") || searchParams.get("candidateId")) {
      hasUrlFilters = true;
    }
    // We can store a flag on window if we need to auto-search on mount
    if (hasUrlFilters) window.__AUTO_SEARCH_RESDEX__ = true;
    return initialFilters;
  });

  const [savedSearches, setSavedSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const locationStateProcessed = useRef(false);
  const [stats, setStats] = useState({ totalCandidates: 0, searchesThisMonth: 0 });

  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Map());
  const [cachedResults, setCachedResults] = useState([]);
  const [folderCandidateId, setFolderCandidateId] = useState(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderInitialTab, setFolderInitialTab] = useState('REQUIREMENT');
  const [folderCandidateIds, setFolderCandidateIds] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [quotaErrorMsg, setQuotaErrorMsg] = useState(null); // null = credit error, string = quota error

  // Toolbar & Header Controls State
  const [activeIn, setActiveIn] = useState("6m");
  const [sortBy, setSortBy] = useState("relevance");
  const [pageSize, setPageSize] = useState(20);
  const [activeInOpen, setActiveInOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [addToOpen, setAddToOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderType, setReminderType] = useState("For other task");
  const [pageInputValue, setPageInputValue] = useState(1);

  const activeInRef = useRef(null);
  const sortRef = useRef(null);
  const pageSizeRef = useRef(null);
  const addToRef = useRef(null);
  const reminderRef = useRef(null);
  const skillSearchRef = useRef(null);

  useEffect(() => {
    setPageInputValue(searchPagination.page);
  }, [searchPagination.page]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeInRef.current && !activeInRef.current.contains(e.target)) setActiveInOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target)) setPageSizeOpen(false);
      if (addToRef.current && !addToRef.current.contains(e.target)) setAddToOpen(false);
      if (reminderRef.current && !reminderRef.current.contains(e.target)) setReminderOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userStored = localStorage.getItem("employerUser");
    if (!userStored) { setSessionExpired(true); setLoading(false); return; }
    const load = async () => {
      try {
        const [dashRes, filtersRes, searchesRes, recentRes, quotaRes] = await Promise.all([
          authService.getEmployerDashboard().catch(() => null),
          authService.getResdexFilters().catch(() => ({ success: true, data: { skills: [], groupedSkills: {}, cities: [], companies: [], titles: [], noticePeriods: NOTICE_OPTIONS, certifications: [] } })),
          authService.getResdexSearches().catch(() => ({ success: true, data: [] })),
          authService.getResdexRecentSearches().catch(() => ({ success: true, data: [] })),
          authService.getQuotaUsage().catch(() => null),
        ]);
        if (dashRes?.success) {
          setCompany(dashRes.data.company || dashRes.data);
          setUser(dashRes.data.user || dashRes.data);
        }
        if (filtersRes?.success) setFilterOptions(filtersRes.data);
        if (searchesRes?.success) setSavedSearches(searchesRes.data);
        if (recentRes?.success) setRecentSearches(recentRes.data);
        if (quotaRes) {
          setQuotaUsage(quotaRes.data || quotaRes);
        }
      } catch { setSessionExpired(true); }
      finally {
        setLoading(false);
        setQuotaLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = () => { setSessionExpired(true); };
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, []);

  useEffect(() => {
    const stateSignature = (location.key || '') + '_' + JSON.stringify(location.state || {}) + '_' + location.search;
    if (locationStateProcessed.current !== stateSignature) {
      let handled = false;
      if (location.state?.preSelectedCandidate) {
        handled = true;
        const c = location.state.preSelectedCandidate;
        const id = c.id || c._id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || String(c);
        setSelectedCandidates(new Map([[id, c]]));
        setCachedResults(prev => prev.some(p => (p.id || p._id || (p.userId && (p.userId._id || p.userId.id || p.userId)) || String(p)) === id) ? prev : [c, ...prev]);
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('tab') === 'mivites') {
          setActiveTab('mivites');
        }
      }
      if (location.state?.savedFilters) {
        handled = true;
        const sf = location.state.savedFilters;
        const mappedFilters = {
          ...filters,
          ...sf,
          keyword: sf.keyword || sf.jobTitle || '',
          skills: Array.isArray(sf.skills) ? sf.skills : (typeof sf.skills === 'string' ? sf.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
          designation: sf.designation || sf.jobTitle || '',
          minExperience: sf.minExperience !== undefined ? sf.minExperience : (sf.minExp !== undefined ? sf.minExp : ''),
          maxExperience: sf.maxExperience !== undefined ? sf.maxExperience : (sf.maxExp !== undefined ? sf.maxExp : ''),
          currentSalaryMin: sf.currentSalaryMin !== undefined ? sf.currentSalaryMin : (sf.minSalary !== undefined ? sf.minSalary : ''),
          currentSalaryMax: sf.currentSalaryMax !== undefined ? sf.currentSalaryMax : (sf.maxSalary !== undefined ? sf.maxSalary : ''),
          currentCity: Array.isArray(sf.currentCity) ? sf.currentCity : (Array.isArray(sf.locations) ? sf.locations : (typeof sf.location === 'string' ? sf.location.split(',').map(s => s.trim()).filter(Boolean) : [])),
          noticePeriod: Array.isArray(sf.noticePeriod) ? sf.noticePeriod : (typeof sf.noticePeriod === 'string' ? [sf.noticePeriod] : []),
          ug: sf.ug || sf.education || '',
          industry: sf.industry || '',
        };
        setFilters(mappedFilters);
        if (location.state.searchName) {
          setSearchName(location.state.searchName);
        }
        setActiveSections(prev => {
          const sections = new Set(prev);
          if (mappedFilters.keyword || mappedFilters.designation) sections.add("basic");
          if (mappedFilters.skills?.length > 0) sections.add("skills");
          if (mappedFilters.minExperience || mappedFilters.maxExperience) sections.add("experience");
          if (mappedFilters.currentCity?.length > 0) sections.add("location");
          if (mappedFilters.currentSalaryMin || mappedFilters.currentSalaryMax) sections.add("salary");
          if (mappedFilters.noticePeriod?.length > 0) sections.add("notice");
          if (mappedFilters.ug || mappedFilters.pg) sections.add("education");
          if (mappedFilters.industry || mappedFilters.department || mappedFilters.role) sections.add("employment");
          return Array.from(sections);
        });
        setTimeout(() => fetchCandidates(1, mappedFilters), 0);
      } else if (window.__AUTO_SEARCH_RESDEX__) {
        handled = true;
        delete window.__AUTO_SEARCH_RESDEX__;
        setTimeout(() => fetchCandidates(1, filters), 0);
      }
      if (handled) {
        locationStateProcessed.current = stateSignature;
      }
    }
  }, [location.state, location.search, location.key]);

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

  const hasAppliedFilters = useCallback((filterState = filters) => {
    if (!filterState) return false;
    return Object.entries(filterState).some(([key, value]) => {
      if (key === "currency") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return value > 0;
      return false;
    });
  }, [filters]);

  const showFilterWarning = useCallback((
    msg = "Please apply at least one filter (such as keyword, skills, experience, or location) before searching.",
    title = "Please Apply a Filter",
    type = "warning"
  ) => {
    showToast(`${title}: ${msg}`, type);
  }, [showToast]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "currency") return;
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === "boolean" && value) count++;
      else if (typeof value === "string" && value.trim()) count++;
      else if (typeof value === "number" && value > 0) count++;
    });
    return count;
  }, [filters]);

  const isSearchExhausted = useMemo(() => {
    if (quotaLoading) return false;
    return !quotaUsage?.cvAccess || Number(quotaUsage.cvAccess.left || 0) <= 0;
  }, [quotaUsage, quotaLoading]);

  const isMivitesExhausted = useMemo(() => {
    if (quotaLoading) return false;
    return !quotaUsage?.nvite || Number(quotaUsage.nvite.left || 0) <= 0;
  }, [quotaUsage, quotaLoading]);

  const availablePlansForSearch = useMemo(() => {
    if (!quotaUsage) return [];
    const available = [];
    if (Number(quotaUsage.nvite?.left || 0) > 0) {
      available.push({
        label: "Send MIvites",
        type: "mivite",
        url: "/resume-search?tab=mivites",
        left: Number(quotaUsage.nvite.left || 0),
        total: Number(quotaUsage.nvite.total || 0),
      });
    }
    if (Number(quotaUsage.hotVacancy?.left || 0) > 0) {
      available.push({
        label: "Hot Vacancy",
        type: "hot",
        url: "/post-job?type=hot",
        left: Number(quotaUsage.hotVacancy.left || 0),
        total: Number(quotaUsage.hotVacancy.total || 0),
      });
    }
    if (Number(quotaUsage.jobPosting?.left || 0) > 0) {
      available.push({
        label: "Standard Job",
        type: "standard",
        url: "/post-job",
        left: Number(quotaUsage.jobPosting.left || 0),
        total: Number(quotaUsage.jobPosting.total || 0),
      });
    }
    if (Number(quotaUsage.internship?.left || 0) > 0) {
      available.push({
        label: "Internship",
        type: "internship",
        url: "/post-job?type=internship",
        left: Number(quotaUsage.internship.left || 0),
        total: Number(quotaUsage.internship.total || 0),
      });
    }
    if (Number(quotaUsage.smbJobPosting?.left || 0) > 0) {
      available.push({
        label: "SMB Job",
        type: "management",
        url: "/post-job?type=management",
        left: Number(quotaUsage.smbJobPosting.left || 0),
        total: Number(quotaUsage.smbJobPosting.total || 0),
      });
    }
    return available;
  }, [quotaUsage]);

  const availablePlansForMivites = useMemo(() => {
    if (!quotaUsage) return [];
    const available = [];
    if (Number(quotaUsage.cvAccess?.left || 0) > 0) {
      available.push({
        label: "Resume Search",
        type: "resdex",
        url: "/resume-search",
        left: Number(quotaUsage.cvAccess.left || 0),
        total: Number(quotaUsage.cvAccess.total || 0),
      });
    }
    if (Number(quotaUsage.hotVacancy?.left || 0) > 0) {
      available.push({
        label: "Hot Vacancy",
        type: "hot",
        url: "/post-job?type=hot",
        left: Number(quotaUsage.hotVacancy.left || 0),
        total: Number(quotaUsage.hotVacancy.total || 0),
      });
    }
    if (Number(quotaUsage.jobPosting?.left || 0) > 0) {
      available.push({
        label: "Standard Job",
        type: "standard",
        url: "/post-job",
        left: Number(quotaUsage.jobPosting.left || 0),
        total: Number(quotaUsage.jobPosting.total || 0),
      });
    }
    if (Number(quotaUsage.internship?.left || 0) > 0) {
      available.push({
        label: "Internship",
        type: "internship",
        url: "/post-job?type=internship",
        left: Number(quotaUsage.internship.left || 0),
        total: Number(quotaUsage.internship.total || 0),
      });
    }
    if (Number(quotaUsage.smbJobPosting?.left || 0) > 0) {
      available.push({
        label: "SMB Job",
        type: "management",
        url: "/post-job?type=management",
        left: Number(quotaUsage.smbJobPosting.left || 0),
        total: Number(quotaUsage.smbJobPosting.total || 0),
      });
    }
    return available;
  }, [quotaUsage]);

  const generateSlug = (activeFilters) => {
    const parts = [];
    if (activeFilters.keyword) parts.push(activeFilters.keyword.replace(/[^a-zA-Z0-9]+/g, '-'));
    if (activeFilters.skills && activeFilters.skills.length > 0) parts.push(activeFilters.skills.map(s => s.replace(/[^a-zA-Z0-9]+/g, '-')).join('-'));
    if (activeFilters.designation) parts.push(activeFilters.designation.replace(/[^a-zA-Z0-9]+/g, '-'));
    if (parts.length > 0) {
      parts.push("candidates");
    } else {
      parts.push("all-candidates");
    }
    if (activeFilters.currentCity && activeFilters.currentCity.length > 0) {
      parts.push("in");
      parts.push(activeFilters.currentCity.map(c => c.replace(/[^a-zA-Z0-9]+/g, '-')).join('-'));
    }
    const finalSlug = parts.filter(Boolean).join('-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
    return finalSlug || 'all-candidates';
  };

  const fetchCandidates = useCallback(async (
    page = 1,
    overrideFilters = null,
    overrideSort = null,
    overrideActiveIn = null,
    overrideLimit = null
  ) => {
    if (quotaUsage && (!quotaUsage.cvAccess || Number(quotaUsage.cvAccess.left || 0) <= 0)) {
      setSearchLoading(false);
      return;
    }

    const activeFilters = overrideFilters || filters;
    const currentSort = overrideSort !== null && overrideSort !== undefined ? overrideSort : sortBy;
    const currentActiveIn = overrideActiveIn !== null && overrideActiveIn !== undefined ? overrideActiveIn : activeIn;
    const currentLimit = overrideLimit || pageSize;

    const urlParams = new URLSearchParams(window.location.search || location.search);
    const simTargetId = urlParams.get("uniqueId") || urlParams.get("uresid") || urlParams.get("candidateId");
    const isSimSearch = Boolean(simTargetId && (urlParams.get("simCvSource") || urlParams.get("uniqueId") || urlParams.get("uresid")));

    if (!isSimSearch && !hasAppliedFilters(activeFilters)) {
      showFilterWarning("Please apply at least one filter before searching for candidates.");
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);

    try {
      if (isSimSearch && simTargetId) {
        const simRes = await authService.getSimilarCandidates(simTargetId, {
          page: String(page),
          limit: String(currentLimit),
          searchText: activeFilters.keyword || "",
        });
        if (simRes?.success) {
          const candidates = simRes.candidates || simRes.data || [];
          const total = typeof simRes.total === "number" ? simRes.total : (simRes.pagination?.total ?? candidates.length);
          setSearchResults(candidates);
          setCachedResults(candidates);
          setSearchPagination({
            page,
            limit: currentLimit,
            total,
            totalPages: simRes.pagination?.totalPages || Math.max(1, Math.ceil(total / currentLimit)),
          });
        } else {
          setSearchResults([]);
          setSearchPagination({ page: 1, limit: currentLimit, total: 0, totalPages: 0 });
        }
        setSearchLoading(false);
        return;
      }

      const params = {};
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) params[key] = value.join(",");
        else if (typeof value === "boolean" && value) params[key] = "true";
        else if (typeof value === "string" && value.trim()) params[key] = value.trim();
      });

      params.page = String(page);
      params.limit = String(currentLimit);
      if (currentSort) params.sort = currentSort;
      if (currentActiveIn) params.activeIn = currentActiveIn;

      // Update URL with SEO slug and actual query filters
      const slug = generateSlug(activeFilters);
      const urlSearchParams = new URLSearchParams(params);
      if (activeTab === "mivites") {
        urlSearchParams.set("tab", "mivites");
      }
      window.history.replaceState(null, '', `/resume-search/${slug}?${urlSearchParams.toString()}`);

      const res = await authService.searchResdexCandidates(params);
      if (res?.success) {
        const candidates = res.data.candidates || [];
        setSearchResults(candidates);
        setCachedResults(candidates);
        setSearchPagination(res.data.pagination || { page: 1, limit: currentLimit, total: 0, totalPages: 0 });
      } else {
        setSearchResults([]);
        setSearchPagination({ page: 1, limit: currentLimit, total: 0, totalPages: 0 });
      }
      refreshRecentSearches();
    } catch {
      setSearchResults([]);
      setSearchPagination({ page: 1, limit: currentLimit, total: 0, totalPages: 0 });
    }
    setSearchLoading(false);
  }, [filters, location.search, sortBy, activeIn, pageSize, activeTab, quotaUsage]);

  // Toolbar Actions & Logics
  const allCurrentSelected = useMemo(() => {
    if (!searchResults.length) return false;
    return searchResults.every(c => {
      const id = c.id || c._id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || String(c);
      return selectedCandidates.has(id);
    });
  }, [searchResults, selectedCandidates]);

  const handleSelectAllToggle = useCallback(() => {
    setSelectedCandidates(prev => {
      const next = new Map(prev);
      if (allCurrentSelected) {
        searchResults.forEach(c => {
          const id = c.id || c._id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || String(c);
          next.delete(id);
        });
      } else {
        searchResults.forEach(c => {
          const id = c.id || c._id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || String(c);
          next.set(id, c);
        });
      }
      return next;
    });
  }, [allCurrentSelected, searchResults]);

  const handleAddToRequirement = useCallback(() => {
    const ids = Array.from(selectedCandidates.keys());
    if (ids.length === 0) {
      showFilterWarning("Please select at least one candidate first.", "Select Candidate", "info");
      return;
    }
    setFolderInitialTab('REQUIREMENT');
    setFolderCandidateIds(ids);
    setFolderCandidateId(ids[0]);
    setFolderModalOpen(true);
  }, [selectedCandidates, showFilterWarning]);

  const handleAddToFolder = useCallback(() => {
    const ids = Array.from(selectedCandidates.keys());
    if (ids.length === 0) {
      showFilterWarning("Please select at least one candidate first.", "Select Candidate", "info");
      return;
    }
    setFolderInitialTab('FOLDER');
    setFolderCandidateIds(ids);
    setFolderCandidateId(ids[0]);
    setFolderModalOpen(true);
  }, [selectedCandidates, showFilterWarning]);

  const handleSetReminder = useCallback(async (data) => {
    const ids = Array.from(selectedCandidates.keys());
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await authService.setCandidateReminder({
          candidateId: id,
          type: data.type,
          description: data.description,
          date: data.date,
          mailCalendarEvent: data.mailCalendarEvent,
        });
      }
      showFilterWarning(`Reminder set successfully for ${ids.length} candidate${ids.length > 1 ? 's' : ''}`, "Success", "success");
    } catch (err) {
      showFilterWarning("Failed to set reminder: " + (err.message || "Unknown error"), "Reminder Error", "error");
    }
  }, [selectedCandidates, showFilterWarning]);

  const handleSwitchToNVite = useCallback(() => {
    setActiveTab("mivites");
    navigate("/resume-search?tab=mivites", { replace: true });
  }, [navigate]);

  const handlePageJump = useCallback((e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInputValue, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= (searchPagination.totalPages || 1)) {
        fetchCandidates(pageNum);
      } else {
        setPageInputValue(searchPagination.page);
      }
    }
  }, [pageInputValue, searchPagination.totalPages, searchPagination.page, fetchCandidates]);

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
    if (isSearchExhausted) return;
    if (!hasAppliedFilters(filters)) {
      showFilterWarning("Please apply at least one filter before searching for candidates.");
      return;
    }
    // setFilterWarning("");
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
      const newFilters = { ...filters, ...search.filters };
      setFilters(newFilters);
      setTimeout(() => fetchCandidates(1, newFilters), 0);
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
      onLogout={async () => { 
          try { await authService.logoutEmployer(); } catch {} 
          localStorage.clear(); sessionStorage.clear(); 
          navigate("/employer-login"); 
      }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Resdex' },
        { label: activeTab === 'search' ? 'Search Resume' : 'Send MIvites' },
      ]} />

        <div className="sr-tab-bar">
          <button className={`sr-tab-btn ${activeTab === "search" ? "active" : ""}`} onClick={() => { setActiveTab("search"); navigate("/resume-search", { replace: true }); }}>
            <FiSearch size={15} /> Search Resume
          </button>
          <button className={`sr-tab-btn ${activeTab === "mivites" ? "active" : ""}`} onClick={() => { setActiveTab("mivites"); navigate("/resume-search?tab=mivites", { replace: true }); }}>
            <FiSend size={15} /> Send MIvites
          </button>
        </div>


        {activeTab === "search" ? (
          isSearchExhausted ? (
            <QuotaExhausted
              jobTypeLabel="Resume Search"
              availablePlans={availablePlansForSearch}
              activeTab="resdex"
              purchaseUrl="/buy-online"
              wrapLayout={false}
            />
          ) : (
            <>
              <div className="sr-header">
              <div>
                <h1 className="sr-title">Search Resume</h1>
                <p className="sr-subtitle">Find the best candidates using advanced AI-powered search filters.</p>
                {(location.state?.requirementId || location.state?.searchName || searchParams.get("simCvSource") || searchParams.get("uniqueId") || searchParams.get("uresid")) && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px',
                    borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe',
                    color: '#1d4ed8', fontSize: '0.82rem', fontWeight: 600, marginTop: 8
                  }}>
                    <span>
                      {searchParams.get("simCvSource") || searchParams.get("uniqueId") || searchParams.get("uresid")
                        ? `Similar Profiles Search (${searchPagination.total} matches)`
                        : `Requirement: ${searchName || location.state?.searchName}`}
                    </span>
                    {location.state?.requirementId && (
                      <button type="button" onClick={() => navigate(`/employer-dashboard/folders/${location.state.requirementId}`)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.82rem', fontWeight: 700 }}>
                        View Folder
                      </button>
                    )}
                  </div>
                )}
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

            {/* <AnimatePresence>
              {filterWarning && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 18px',
                    borderRadius: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiAlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span>{filterWarning}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterWarning("")}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 2,
                      }}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence> */}

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
                      {/* Row 1: Filters & Pagination Toolbar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '10px',
                        fontSize: '0.85rem',
                        color: '#334155',
                      }}>
                        {/* Left: Active in */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#475569', fontWeight: 500 }}>Active in</span>
                          <div style={{ position: 'relative' }} ref={activeInRef}>
                            <button
                              type="button"
                              onClick={() => { setActiveInOpen(p => !p); setSortOpen(false); setPageSizeOpen(false); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                padding: '5px 12px',
                                fontSize: '0.84rem',
                                color: '#1e293b',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <span>{ACTIVE_IN_OPTIONS.find(o => o.value === activeIn)?.label || activeIn}</span>
                              <FiChevronDown size={14} color="#64748b" style={{ transform: activeInOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            </button>

                            {activeInOpen && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 4,
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                                zIndex: 100,
                                minWidth: 150,
                                padding: '4px 0',
                              }}>
                                {ACTIVE_IN_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setActiveIn(opt.value);
                                      setActiveInOpen(false);
                                      fetchCandidates(1, null, null, opt.value);
                                    }}
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '8px 14px',
                                      background: activeIn === opt.value ? '#e0f2fe' : 'transparent',
                                      color: activeIn === opt.value ? '#0284c7' : '#334155',
                                      fontWeight: activeIn === opt.value ? 700 : 500,
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '0.84rem',
                                    }}
                                    onMouseEnter={(e) => { if (activeIn !== opt.value) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={(e) => { if (activeIn !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Sort by, Show, Pagination */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          {/* Sort by */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#475569', fontWeight: 500 }}>Sort by:</span>
                            <div style={{ position: 'relative' }} ref={sortRef}>
                              <button
                                type="button"
                                onClick={() => { setSortOpen(p => !p); setActiveInOpen(false); setPageSizeOpen(false); }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#fff',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  padding: '5px 12px',
                                  fontSize: '0.84rem',
                                  color: '#1e293b',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Relevance'}</span>
                                <FiChevronDown size={14} color="#64748b" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                              </button>

                              {sortOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: 4,
                                  background: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                                  zIndex: 100,
                                  minWidth: 190,
                                  padding: '4px 0',
                                }}>
                                  {SORT_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setSortBy(opt.value);
                                        setSortOpen(false);
                                        fetchCandidates(1, null, opt.value);
                                      }}
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 14px',
                                        background: sortBy === opt.value ? '#e0f2fe' : 'transparent',
                                        color: sortBy === opt.value ? '#0284c7' : '#334155',
                                        fontWeight: sortBy === opt.value ? 700 : 500,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.84rem',
                                      }}
                                      onMouseEnter={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = '#f8fafc'; }}
                                      onMouseLeave={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Show (Page size) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#475569', fontWeight: 500 }}>Show</span>
                            <div style={{ position: 'relative' }} ref={pageSizeRef}>
                              <button
                                type="button"
                                onClick={() => { setPageSizeOpen(p => !p); setActiveInOpen(false); setSortOpen(false); }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#fff',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 6,
                                  padding: '5px 10px',
                                  fontSize: '0.84rem',
                                  color: '#1e293b',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <span>{pageSize}</span>
                                <FiChevronDown size={14} color="#64748b" style={{ transform: pageSizeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                              </button>

                              {pageSizeOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: 4,
                                  background: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                                  zIndex: 100,
                                  minWidth: 70,
                                  padding: '4px 0',
                                }}>
                                  {PAGE_SIZE_OPTIONS.map(size => (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => {
                                        setPageSize(size);
                                        setPageSizeOpen(false);
                                        fetchCandidates(1, null, null, null, size);
                                      }}
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '6px 10px',
                                        background: pageSize === size ? '#e0f2fe' : 'transparent',
                                        color: pageSize === size ? '#0284c7' : '#334155',
                                        fontWeight: pageSize === size ? 700 : 500,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.84rem',
                                      }}
                                      onMouseEnter={(e) => { if (pageSize !== size) e.currentTarget.style.background = '#f8fafc'; }}
                                      onMouseLeave={(e) => { if (pageSize !== size) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Top Pagination Jump */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              title="First page"
                              disabled={searchPagination.page <= 1}
                              onClick={() => fetchCandidates(1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: searchPagination.page <= 1 ? 'not-allowed' : 'pointer',
                                color: searchPagination.page <= 1 ? '#cbd5e1' : '#64748b',
                                fontSize: '1rem',
                                padding: '2px 4px',
                                fontWeight: 700,
                              }}
                            >
                              «
                            </button>
                            <button
                              type="button"
                              title="Previous page"
                              disabled={searchPagination.page <= 1}
                              onClick={() => fetchCandidates(searchPagination.page - 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: searchPagination.page <= 1 ? 'not-allowed' : 'pointer',
                                color: searchPagination.page <= 1 ? '#cbd5e1' : '#64748b',
                                fontSize: '1rem',
                                padding: '2px 4px',
                                fontWeight: 700,
                              }}
                            >
                              ‹
                            </button>

                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: '#fff',
                              border: '1px solid #d1d5db',
                              borderRadius: 4,
                              padding: '3px 8px',
                              fontSize: '0.82rem',
                              color: '#334155',
                            }}>
                              <span>Page </span>
                              <input
                                type="number"
                                min="1"
                                max={searchPagination.totalPages || 1}
                                value={pageInputValue}
                                onChange={(e) => setPageInputValue(e.target.value)}
                                onKeyDown={handlePageJump}
                                onBlur={() => {
                                  const num = parseInt(pageInputValue, 10);
                                  if (num && num >= 1 && num <= (searchPagination.totalPages || 1) && num !== searchPagination.page) {
                                    fetchCandidates(num);
                                  } else {
                                    setPageInputValue(searchPagination.page);
                                  }
                                }}
                                style={{
                                  width: 38,
                                  textAlign: 'center',
                                  border: 'none',
                                  outline: 'none',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  padding: 0,
                                  margin: '0 2px',
                                }}
                              />
                              <span> of {(searchPagination.totalPages || 1).toLocaleString()}</span>
                            </div>

                            <button
                              type="button"
                              title="Next page"
                              disabled={searchPagination.page >= (searchPagination.totalPages || 1)}
                              onClick={() => fetchCandidates(searchPagination.page + 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: searchPagination.page >= (searchPagination.totalPages || 1) ? 'not-allowed' : 'pointer',
                                color: searchPagination.page >= (searchPagination.totalPages || 1) ? '#cbd5e1' : '#64748b',
                                fontSize: '1rem',
                                padding: '2px 4px',
                                fontWeight: 700,
                              }}
                            >
                              ›
                            </button>
                            <button
                              type="button"
                              title="Last page"
                              disabled={searchPagination.page >= (searchPagination.totalPages || 1)}
                              onClick={() => fetchCandidates(searchPagination.totalPages || 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: searchPagination.page >= (searchPagination.totalPages || 1) ? 'not-allowed' : 'pointer',
                                color: searchPagination.page >= (searchPagination.totalPages || 1) ? '#cbd5e1' : '#64748b',
                                fontSize: '1rem',
                                padding: '2px 4px',
                                fontWeight: 700,
                              }}
                            >
                              »
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Secondary Action Toolbar Card */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '10px 18px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        {/* Left actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                          {/* Select all */}
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              fontSize: '0.88rem',
                              fontWeight: 500,
                              color: '#1e293b',
                              userSelect: 'none',
                            }}
                            onClick={(e) => { e.preventDefault(); handleSelectAllToggle(); }}
                          >
                            <div
                              style={{
                                width: 17,
                                height: 17,
                                borderRadius: 3,
                                border: allCurrentSelected ? '1.5px solid #1e3a8a' : '1.5px solid #94a3b8',
                                background: allCurrentSelected ? '#1e3a8a' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {allCurrentSelected && <FiCheck size={12} strokeWidth={3} />}
                            </div>
                            <span>Select all</span>
                          </label>

                          {/* Add to dropdown */}
                          <div style={{ position: 'relative' }} ref={addToRef}>
                            <button
                              type="button"
                              onClick={() => { setAddToOpen(p => !p); setReminderOpen(false); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                color: '#334155',
                                padding: '4px 0',
                              }}
                            >
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 18,
                                height: 18,
                                borderRadius: 3,
                                background: '#475569',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}>+</span>
                              <span>Add to</span>
                              <FiChevronDown size={14} color="#64748b" style={{ transform: addToOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            </button>

                            {addToOpen && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 6,
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                boxShadow: '0 10px 28px rgba(15,23,42,0.14)',
                                zIndex: 100,
                                minWidth: 190,
                                padding: '6px 0',
                              }}>
                                <div style={{
                                  padding: '6px 14px 4px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  letterSpacing: '0.6px',
                                  color: '#94a3b8',
                                  textTransform: 'uppercase',
                                }}>
                                  RESDEX
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setAddToOpen(false); handleAddToRequirement(); }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '9px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.88rem',
                                    color: '#1e293b',
                                    fontWeight: 500,
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  Resdex requirement
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setAddToOpen(false); handleAddToFolder(); }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '9px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.88rem',
                                    color: '#1e293b',
                                    fontWeight: 500,
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  Resdex folder
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Set reminder dropdown */}
                          <div style={{ position: 'relative' }} ref={reminderRef}>
                            <button
                              type="button"
                              onClick={() => { setReminderOpen(p => !p); setAddToOpen(false); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                color: '#334155',
                                padding: '4px 0',
                              }}
                            >
                              <FiClock size={16} color="#475569" />
                              <span>Set reminder</span>
                              <FiChevronDown size={14} color="#64748b" style={{ transform: reminderOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            </button>

                            {reminderOpen && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 6,
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                boxShadow: '0 10px 28px rgba(15,23,42,0.14)',
                                zIndex: 100,
                                minWidth: 200,
                                padding: '6px 0',
                              }}>
                                {[
                                  "For call later",
                                  "For interview follow up",
                                  "For sending JD",
                                  "For other task",
                                ].map(type => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                      setReminderOpen(false);
                                      const ids = Array.from(selectedCandidates.keys());
                                      if (ids.length === 0) {
                                        showFilterWarning("Please select at least one candidate first to set a reminder.", "Select Candidate", "info");
                                        return;
                                      }
                                      setReminderType(type);
                                      setIsReminderModalOpen(true);
                                    }}
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '9px 14px',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '0.86rem',
                                      color: '#1e293b',
                                      fontWeight: 500,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Switch to NVite */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 500 }}>
                            Want to reach candidates using bulk mails?
                          </span>
                          <button
                            type="button"
                            onClick={handleSwitchToNVite}
                            style={{
                              background: '#1565c0',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '7px 18px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(21, 101, 192, 0.25)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#0d47a1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#1565c0'; }}
                          >
                            Switch to NVite
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {searchResults.map((candidate, index) => {
                          const cid = candidate.id || candidate.userId;
                          return (
                            <CandidateCard key={cid || index} candidate={candidate}
                              isSelected={selectedCandidates.has(cid)}
                              searchKeyword={filters.keyword || searchParams.get("keyword") || searchParams.get("skills") || ""}
                              onToggleSelect={(c) => {
                                const id = c.id || c._id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || String(c);
                                setSelectedCandidates(prev => {
                                  const next = new Map(prev);
                                  if (next.has(id)) next.delete(id); else next.set(id, c);
                                  return next;
                                });
                              }}
                              onAddToFolder={(c) => {
                                const targetId = c.userId || c.id;
                                setFolderCandidateId(targetId);
                                setFolderCandidateIds([targetId]);
                                setFolderInitialTab('FOLDER');
                                setFolderModalOpen(true);
                              }}
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
          )
        ) : (
          isMivitesExhausted ? (
            <QuotaExhausted
              jobTypeLabel="Send MIvites"
              availablePlans={availablePlansForMivites}
              activeTab="resdex"
              purchaseUrl="/buy-online"
              wrapLayout={false}
            />
          ) : (
            <SendMivite company={company} user={user}
              initialResults={cachedResults}
              initialSelectedIds={Array.from(selectedCandidates.keys())}
              onClearSelection={() => setSelectedCandidates(new Map())}
              startStep={location.state?.startAtJobStep ? 1 : 0}
            />
          )
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
            onClick={() => { setShowCreditModal(false); setQuotaErrorMsg(null); }}>
            <motion.div className="sr-save-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: "center", padding: "40px 32px 28px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: quotaErrorMsg ? "#fef3c7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FiAlertCircle size={28} color={quotaErrorMsg ? "#d97706" : "#dc2626"} />
              </div>
              {quotaErrorMsg ? (
                <>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: C.s800, marginBottom: 8 }}>CV Quota Exhausted</h3>
                  <p style={{ fontSize: "0.85rem", color: C.s500, marginBottom: 24, lineHeight: 1.6 }}>
                    {quotaErrorMsg}
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="sr-btn sr-btn-ghost" onClick={() => { setShowCreditModal(false); setQuotaErrorMsg(null); }}>Close</button>
                    <button className="sr-btn sr-btn-primary" onClick={() => { setShowCreditModal(false); setQuotaErrorMsg(null); navigate("/employer-dashboard/analytics"); }}
                      style={{ background: "linear-gradient(135deg,#d97706,#b45309)" }}>
                      View Quota
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Reminder Modal */}
      <SetReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        initialType={reminderType}
        candidate={selectedCandidates.size === 1 ? Array.from(selectedCandidates.values())[0] : null}
        onSubmit={handleSetReminder}
      />

      {/* Folder / Requirement Modal */}
      {(folderCandidateId || folderModalOpen) && (
        <FolderSelectorModal
          candidateId={folderCandidateId}
          candidateIds={folderCandidateIds.length > 0 ? folderCandidateIds : (folderCandidateId ? [folderCandidateId] : [])}
          initialTab={folderInitialTab}
          onClose={() => { setFolderCandidateId(null); setFolderModalOpen(false); setFolderCandidateIds([]); }}
          onAdded={() => {
            showFilterWarning("Saved to folder/requirement successfully!");
          }}
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

