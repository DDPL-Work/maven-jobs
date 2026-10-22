import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiTrendingUp, FiMessageSquare, FiBell,
  FiChevronDown, FiChevronUp, FiSearch, FiGrid, FiSend, FiLogOut,
  FiBarChart2, FiUsers, FiStar, FiFolder, FiFileText,
  FiMenu, FiX, FiDollarSign, FiShoppingCart, FiSettings, FiList, FiCheck, FiBookOpen, FiMessageCircle,
  FiEye, FiEyeOff, FiClock, FiCalendar, FiTrash2, FiUser, FiExternalLink, FiBookmark,
  FiArrowRight, FiCreditCard
} from 'react-icons/fi';
import { VscFeedback } from "react-icons/vsc";
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';
import notAllowedImg from '../../../assets/notAllowed.png';
import authService from '../../services/authService';
import { registerPushNotifications, subscribeToForegroundNotifications } from '../../services/firebase';
import FeedbackModal from '../../components/employer/FeedbackModal';
import PlanExpiryBanner from '../../components/employer/PlanExpiryBanner';
import { getCartItems, removeFromCart, clearCart, getCartTotals } from '../../utils/cartStorage';
import { getSavedCandidates, removeSavedCandidateFromStorage, resolveAvatarUrl } from '../../utils/savedProfilesStorage';

const C = {
  navy: "#002366",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b",
  dm: "'DM Sans',sans-serif",
  fd: "'Bricolage Grotesque',sans-serif",
};


export default function EmployerHeader({
  company = {},
  user,
  activeTab = 'home',
  onNavigate,
  onMessagesClick,
  onNotificationsClick,
  onLogout,
  requireAuth = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutTarget, setLogoutTarget] = useState("maven");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpMsg, setCpMsg] = useState(null);
  const [cpLoading, setCpLoading] = useState(false);
  const [showCpCurrent, setShowCpCurrent] = useState(false);
  const [showCpNew, setShowCpNew] = useState(false);
  const [showCpConfirm, setShowCpConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSections, setMobileSections] = useState({
    jobs: false,
    resdex: false,
    report: false,
    settings: false,
  });

  const toggleMobileSection = (section) => {
    setMobileSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const [creditData, setCreditData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [employerNotifications, setEmployerNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [notifActiveTab, setNotifActiveTab] = useState("activity"); // "activity" | "reminders"
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersError, setRemindersError] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const profileBtnRef = useRef(null);
  const profileSidebarRef = useRef(null);
  const dropdownRefs = useRef({});
  const searchHeaderRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showRecentSearchesMenu, setShowRecentSearchesMenu] = useState(false);
  const recentSearchesMenuRef = useRef(null);

  const [showSavedProfilesSidebar, setShowSavedProfilesSidebar] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [savedProfilesLoading, setSavedProfilesLoading] = useState(false);
  const [savedProfilesError, setSavedProfilesError] = useState("");
  const [savedProfilesSearch, setSavedProfilesSearch] = useState("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => getCartItems());
  const [cartTotals, setCartTotals] = useState(() => getCartTotals());
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [dropdownActiveIndex, setDropdownActiveIndex] = useState(-1);

  // Sync employer cart across windows and tabs
  useEffect(() => {
    const updateCart = () => {
      const items = getCartItems();
      setCartItems(items);
      setCartTotals(getCartTotals(items));
    };
    updateCart();
    window.addEventListener("employer-cart-updated", updateCart);
    window.addEventListener("storage", updateCart);
    return () => {
      window.removeEventListener("employer-cart-updated", updateCart);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("resdex_recent_searches") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.filter(Boolean).slice(0, 10);
      }
    } catch {}
    return [];
  });

  const [searchKeyword, setSearchKeyword] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("keyword") || sp.get("query") || "";
    } catch {
      return "";
    }
  });
  const userStored = localStorage.getItem("employerUser");
  const isEmployerLoggedIn = !!userStored && userStored !== "undefined";

  const saveRecentSearch = useCallback((term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem("resdex_recent_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (isEmployerLoggedIn) {
      authService.recordResdexRecentSearch(clean).catch(() => {});
    }

    try {
      window.dispatchEvent(new CustomEvent("resdex-recent-searches-updated", { detail: { query: clean } }));
    } catch {}
  }, [isEmployerLoggedIn]);

  const handleSelectRecentSearch = useCallback((term) => {
    if (!term) return;
    setSearchKeyword(term);
    saveRecentSearch(term);
    window.open(`/resume-search?keyword=${encodeURIComponent(term)}`, '_blank');
    setIsSearchExpanded(false);
    setShowRecentDropdown(false);
    setShowRecentSearchesMenu(false);
  }, [saveRecentSearch]);

  const [sessionUser, setSessionUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("employerUser") || "null") || JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [dashboardCompany, setDashboardCompany] = useState(null);
  const [dashboardUser, setDashboardUser] = useState(null);

  useEffect(() => {
    let active = true;
    authService.getResdexRecentSearches()
      .then((res) => {
        if (!active || !res?.success || !Array.isArray(res.data)) return;
        const apiNames = res.data.map(item => item?.name).filter(Boolean);
        if (apiNames.length > 0) {
          setRecentSearches((prev) => {
            const combined = Array.from(new Set([...prev, ...apiNames])).filter(Boolean);
            const sliced = combined.slice(0, 10);
            try {
              localStorage.setItem("resdex_recent_searches", JSON.stringify(sliced));
            } catch {}
            return sliced;
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const q = e?.detail?.query;
      if (q && typeof q === 'string') {
        const clean = q.trim();
        setRecentSearches((prev) => {
          if (prev.some(s => s.toLowerCase() === clean.toLowerCase())) return prev;
          const updated = [clean, ...prev].slice(0, 10);
          try {
            localStorage.setItem("resdex_recent_searches", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    };
    window.addEventListener("resdex-recent-searches-updated", handler);
    return () => window.removeEventListener("resdex-recent-searches-updated", handler);
  }, []);

  const loadSavedProfiles = useCallback(() => {
    try {
      setSavedProfilesLoading(true);
      setSavedProfilesError("");

      // Strictly load candidates saved in local storage (local DB)
      const localCandidates = getSavedCandidates();
      setSavedProfiles(Array.isArray(localCandidates) ? localCandidates : []);
    } catch (err) {
      setSavedProfilesError((err?.message || "Failed to load saved profiles").toString());
    } finally {
      setSavedProfilesLoading(false);
    }
  }, []);

  const handleRemoveSavedProfile = useCallback((candidateId, e) => {
    if (e) e.stopPropagation();
    removeSavedCandidateFromStorage(candidateId);
    setSavedProfiles((prev) =>
      prev.filter((c) => {
        const id = String(c.candidateId || c._id || c.id || (c.userId && (c.userId._id || c.userId.id || c.userId)) || '');
        return id !== String(candidateId);
      })
    );
  }, []);

  useEffect(() => {
    loadSavedProfiles();
  }, [loadSavedProfiles]);

  useEffect(() => {
    if (showSavedProfilesSidebar) {
      loadSavedProfiles();
    }
  }, [showSavedProfilesSidebar, loadSavedProfiles]);

  useEffect(() => {
    const handler = () => loadSavedProfiles();
    window.addEventListener("employer-saved-profiles-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("employer-saved-profiles-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [loadSavedProfiles]);

  const filteredSavedProfiles = useMemo(() => {
    if (!savedProfilesSearch.trim()) return savedProfiles;
    const q = savedProfilesSearch.toLowerCase().trim();
    return savedProfiles.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const title = (p.currentTitle || p.headline || "").toLowerCase();
      const company = (p.currentCompany || "").toLowerCase();
      const city = (p.currentCity || "").toLowerCase();
      const skills = (Array.isArray(p.skills) ? p.skills.join(" ") : "").toLowerCase();
      return name.includes(q) || title.includes(q) || company.includes(q) || city.includes(q) || skills.includes(q);
    });
  }, [savedProfiles, savedProfilesSearch]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const kw = sp.get("keyword") || sp.get("query") || location.state?.savedFilters?.keyword || "";
    if (kw) {
      setSearchKeyword(kw);
    }
  }, [location.search, location.state]);

  useEffect(() => {
    if (isSearchExpanded) {
      setShowRecentDropdown(true);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowRecentDropdown(false);
    }
  }, [isSearchExpanded]);

  const filteredLiveSuggestions = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return [];

    // Matches from recent searches (excluding exact match)
    const recentMatches = recentSearches.filter(
      (s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q
    );

    // Matches from live backend API search suggestions
    const apiMatches = searchSuggestions.filter(
      (s) => s && typeof s === "string" && s.toLowerCase() !== q
    );

    const combined = [];
    const seen = new Set([q]);

    for (const item of [...recentMatches, ...apiMatches]) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        combined.push(item);
        if (combined.length >= 6) break;
      }
    }

    return combined;
  }, [searchKeyword, recentSearches, searchSuggestions]);

  useEffect(() => {
    const q = searchKeyword.trim();
    if (!q || !isSearchExpanded) {
      setSearchSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await authService.getSearchSuggestions(q);
        if (active && res?.data?.suggestions && Array.isArray(res.data.suggestions)) {
          setSearchSuggestions(res.data.suggestions);
        }
      } catch {
        if (active) setSearchSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchKeyword, isSearchExpanded]);

  useEffect(() => {
    setDropdownActiveIndex(-1);
  }, [searchKeyword, showRecentDropdown]);

  const handleSearchKeyDown = (e) => {
    if (!showRecentDropdown) return;

    const totalItems = searchKeyword.trim()
      ? 1 + filteredLiveSuggestions.length
      : Math.min(recentSearches.length, 5);

    if (totalItems <= 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      if (dropdownActiveIndex >= 0) {
        e.preventDefault();
        if (searchKeyword.trim()) {
          if (dropdownActiveIndex === 0) {
            handleSelectRecentSearch(searchKeyword.trim());
          } else if (filteredLiveSuggestions[dropdownActiveIndex - 1]) {
            handleSelectRecentSearch(filteredLiveSuggestions[dropdownActiveIndex - 1]);
          }
        } else {
          const selected = recentSearches[dropdownActiveIndex];
          if (selected) {
            handleSelectRecentSearch(selected);
          }
        }
      }
    } else if (e.key === "Escape") {
      setShowRecentDropdown(false);
      setIsSearchExpanded(false);
    }
  };

  useEffect(() => {
    if (!isEmployerLoggedIn) return;
    if (company && (company.name || company.logoUrl)) {
      setDashboardCompany(company);
      return;
    }
    try {
      const currentSaved = JSON.parse(localStorage.getItem("employerUser") || "{}");
      if (currentSaved.companyName) {
        setDashboardCompany(currentSaved);
        return;
      }
    } catch {}

    let active = true;
    authService.getEmployerDashboard()
      .then((res) => {
        if (!active || !res?.data) return;
        if (res.data.company) {
          setDashboardCompany(res.data.company);
          try {
            const currentSaved = JSON.parse(localStorage.getItem("employerUser") || "{}");
            const updated = {
              ...currentSaved,
              companyName: res.data.company.name || currentSaved.companyName,
              companyId: res.data.company.id || res.data.company._id || currentSaved.companyId,
              logoUrl: res.data.company.logoUrl || currentSaved.logoUrl,
              coverImageUrl: res.data.company.coverImageUrl || currentSaved.coverImageUrl,
            };
            if (res.data.user) {
              updated.username = res.data.user.username || res.data.user.name || updated.username;
              updated.name = res.data.user.name || res.data.user.username || updated.name;
              updated.email = res.data.user.email || updated.email;
              updated.role = res.data.user.role || updated.role;
              updated.avatar = res.data.user.avatar || updated.avatar;
            }
            localStorage.setItem("employerUser", JSON.stringify(updated));
            setSessionUser(updated);
          } catch {}
        }
        if (res.data.user) {
          setDashboardUser(res.data.user);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isEmployerLoggedIn]);

  const displayName = (() => {
    const r = (user?.role || dashboardUser?.role || sessionUser?.role || '').toLowerCase();
    if (r && r !== 'client') {
      const uName = user?.name || user?.username || dashboardUser?.name || dashboardUser?.username || sessionUser?.name || sessionUser?.username;
      if (uName) return uName;
    }
    if (user?.name || user?.username) return user.name || user.username;
    if (company?.name) return company.name;
    const uName = dashboardUser?.name || dashboardUser?.username || sessionUser?.name || sessionUser?.username;
    if (uName && uName !== "Client" && uName !== "Company") return uName;
    if (dashboardCompany?.name) return dashboardCompany.name;
    if (sessionUser?.companyName) return sessionUser.companyName;
    if (uName) return uName;
    return isEmployerLoggedIn ? "Employer" : "Company";
  })();

  const displayImage =
    user?.avatar ||
    user?.profilePic ||
    company?.logoUrl ||
    company?.avatar ||
    sessionUser?.avatar ||
    sessionUser?.profilePic ||
    sessionUser?.logoUrl ||
    dashboardCompany?.logoUrl ||
    dashboardUser?.avatar ||
    dashboardUser?.profilePic ||
    "";

  const displayEmail = (() => {
    const r = (user?.role || dashboardUser?.role || sessionUser?.role || '').toLowerCase();
    if (r && r !== 'client') {
      const uEmail = user?.email || dashboardUser?.email || sessionUser?.email;
      if (uEmail) return uEmail;
    }
    return user?.email || dashboardUser?.email || sessionUser?.email || company?.email || dashboardCompany?.email || "";
  })();

  const initials = (() => {
    const text = (displayName || "").trim();
    const parts = text.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase() || "ST";
  })();

  const displayRole = (() => {
    let raw = user?.role || user?.userRole || "";
    if (!raw && dashboardUser) {
      raw = dashboardUser.role || dashboardUser.userRole || "";
    }
    if (!raw && sessionUser) {
      raw = sessionUser.role || sessionUser.userRole || sessionUser.subRole || sessionUser.type || "";
    }
    if (!raw && company) {
      raw = company.role || company.userRole || company.user?.role || "";
    }
    if (!raw && dashboardCompany) {
      raw = dashboardCompany.role || dashboardCompany.userRole || "";
    }

    const norm = String(raw || "").trim().toLowerCase();
    if (norm === "client" || norm === "super user" || norm === "superuser") {
      return "Super User";
    }
    if (norm === "recruiter") {
      return "Recruiter";
    }
    if (norm) {
      return norm.charAt(0).toUpperCase() + norm.slice(1);
    }
    return isEmployerLoggedIn ? "Super User" : "";
  })();

  const isSuperUser = displayRole === "Super User";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!requireAuth) return;
    const handler = () => navigate("/employer-login");
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, [navigate, requireAuth]);

  useEffect(() => {
    if (!requireAuth) return;
    if (!localStorage.getItem("employerUser")) navigate("/employer-login");
  }, [navigate, requireAuth]);

  const refreshCredits = useCallback(async () => {
    try {
      const res = await authService.getCredits();
      if (res?.success) setCreditData(res.data);
    } catch {}
  }, []);

  useEffect(() => { refreshCredits(); }, [refreshCredits]);

  useEffect(() => {
    const handler = () => refreshCredits();
    window.addEventListener("employer-credits-changed", handler);
    window.addEventListener("plan-status-changed", handler);
    return () => {
      window.removeEventListener("employer-credits-changed", handler);
      window.removeEventListener("plan-status-changed", handler);
    };
  }, [refreshCredits]);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!isEmployerLoggedIn) return;
    try {
      if (!silent) {
        setNotificationsLoading(true);
        setNotificationsError("");
      }
      const resp = await authService.getEmployerNotifications();
      const list = resp?.data?.notifications || resp?.data || resp?.notifications || resp || [];
      setEmployerNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      if (!silent) {
        setNotificationsError((err?.message || err?.error || "Failed to load notifications").toString());
      }
    } finally {
      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  }, [isEmployerLoggedIn]);

  useEffect(() => {
    if (isEmployerLoggedIn) {
      loadNotifications();

      // Register employer FCM push token
      const role = isSuperUser ? "CLIENT" : "RECRUITER";
      registerPushNotifications(role).catch(() => {});

      // Listen for foreground in-app push notifications
      let unsubPromise = subscribeToForegroundNotifications(() => {
        loadNotifications(true);
      });

      // Background AJAX polling (every 20s) while tab is visible
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadNotifications(true);
        }
      }, 20000);

      // Immediate AJAX refetch when window or tab regains focus
      const onFocus = () => {
        loadNotifications(true);
      };
      window.addEventListener("focus", onFocus);

      const onRefreshEvent = () => {
        loadNotifications(true);
      };
      window.addEventListener("employer-notifications-refresh", onRefreshEvent);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("employer-notifications-refresh", onRefreshEvent);
        if (unsubPromise && typeof unsubPromise.then === "function") {
          unsubPromise.then((unsub) => {
            if (typeof unsub === "function") unsub();
          });
        }
      };
    }
  }, [isEmployerLoggedIn, isSuperUser, loadNotifications]);

  useEffect(() => {
    if (showNotifications && isEmployerLoggedIn) {
      loadNotifications();
    }
  }, [showNotifications, isEmployerLoggedIn, loadNotifications]);

  const loadReminders = useCallback(async () => {
    if (!isEmployerLoggedIn) return;
    try {
      setRemindersLoading(true);
      setRemindersError("");
      const res = await authService.getCandidateReminders();
      const list = res?.data || [];
      const currentUid = sessionUser?._id || sessionUser?.id || sessionUser?.userId || user?._id || user?.id || '';
      // Strict user isolation & client-side deduplication
      const seen = new Set();
      const filtered = [];
      for (const r of list) {
        if (currentUid) {
          const rUid = r.userId?._id || r.userId?.id || r.userId;
          if (rUid && String(rUid) !== String(currentUid)) continue;
        }
        const cId = String(r.candidateId?._id || r.candidateId?.id || r.candidateId || "");
        const dKey = r.date ? new Date(r.date).toISOString().slice(0, 16) : "";
        const dedupeKey = cId && dKey ? `${cId}_${dKey}` : String(r._id || r.id);
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          filtered.push(r);
        }
      }
      setReminders(filtered);
    } catch (err) {
      setRemindersError((err?.message || "Failed to load reminders").toString());
    } finally {
      setRemindersLoading(false);
    }
  }, [isEmployerLoggedIn, sessionUser, user]);

  useEffect(() => {
    if (isEmployerLoggedIn && (showNotifications || notifActiveTab === "reminders")) {
      loadReminders();
    }
  }, [showNotifications, notifActiveTab, isEmployerLoggedIn, loadReminders]);

  useEffect(() => {
    const handler = () => loadReminders();
    window.addEventListener("employer-reminders-changed", handler);
    return () => window.removeEventListener("employer-reminders-changed", handler);
  }, [loadReminders]);

  const handleDeleteReminder = useCallback(async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await authService.deleteCandidateReminder(id);
      setReminders(prev => prev.filter(r => String(r._id || r.id) !== String(id)));
    } catch {}
  }, []);

  const formatReminderDate = useCallback((dStr) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;
      if (isTomorrow) return `Tomorrow at ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return dStr;
    }
  }, []);

  const unreadNotificationsCount = employerNotifications.filter(
    (n) => String(n?.status || "").toUpperCase() !== "READ"
  ).length;

  useEffect(() => {
    if (!showProfileSidebar && !openDropdown && !showNotifications && !mobileMenuOpen && !isSearchExpanded && !showRecentSearchesMenu && !showSavedProfilesSidebar) return;
    const handler = (e) => {
      if (openDropdown) {
        const dd = dropdownRefs.current[openDropdown];
        if (dd && !dd.contains(e.target)) setOpenDropdown(null);
      }
      if (showRecentSearchesMenu) {
        if (recentSearchesMenuRef.current && !recentSearchesMenuRef.current.contains(e.target)) {
          setShowRecentSearchesMenu(false);
        }
      }
      if (isSearchExpanded) {
        if (searchHeaderRef.current && !searchHeaderRef.current.contains(e.target)) {
          setIsSearchExpanded(false);
        }
      }
      if (e.key === 'Escape') {
        setShowProfileSidebar(false);
        setShowNotifications(false);
        setMobileMenuOpen(false);
        setOpenDropdown(null);
        setShowChangePassword(false);
        setIsSearchExpanded(false);
        setShowRecentSearchesMenu(false);
        setShowSavedProfilesSidebar(false);
        setCartDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [showProfileSidebar, openDropdown, showNotifications, mobileMenuOpen, isSearchExpanded, showRecentSearchesMenu, showSavedProfilesSidebar, cartDrawerOpen]);

  useEffect(() => {
    if (showProfileSidebar || showNotifications || mobileMenuOpen || showSavedProfilesSidebar || cartDrawerOpen) {
      document.body.classList.add("employer-sidebar-open");
      window.dispatchEvent(new CustomEvent("employer-sidebar-toggle", { detail: { open: true } }));
    } else {
      document.body.classList.remove("employer-sidebar-open");
      window.dispatchEvent(new CustomEvent("employer-sidebar-toggle", { detail: { open: false } }));
    }
    return () => {
      document.body.classList.remove("employer-sidebar-open");
      window.dispatchEvent(new CustomEvent("employer-sidebar-toggle", { detail: { open: false } }));
    };
  }, [showProfileSidebar, showNotifications, mobileMenuOpen, showSavedProfilesSidebar, cartDrawerOpen]);

  const handleSearchSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const query = searchKeyword.trim();
    if (!query) {
      searchInputRef.current?.focus();
      return;
    }
    saveRecentSearch(query);
    window.open(`/resume-search?keyword=${encodeURIComponent(query)}`, '_blank');
    setIsSearchExpanded(false);
    setShowRecentDropdown(false);
  }, [searchKeyword, saveRecentSearch]);

  const handleNavClick = useCallback((tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
    } else {
      if (tabId === "home") {
        navigate(localStorage.getItem("employerUser") ? "/employer-dashboard" : "/employer-login");
      } else if (tabId === "analysis") {
        navigate("/employer-dashboard/analytics");
      } else if (tabId === "jobs") {
        navigate("/post-job");
      }
    }
  }, [onNavigate, navigate]);

  const handleLogoutAction = useCallback(async () => {
    try { await authService.logoutEmployer(); } catch {}
    localStorage.clear();
    sessionStorage.clear();
    
    if (onLogout) {
      onLogout();
    } else {
      navigate("/employer-login");
    }
    setShowLogoutConfirm(false);
  }, [onLogout, navigate]);

  const resolvedActiveTab = useMemo(() => {
    const pathname = location.pathname;
    // Under Jobs
    if (
      pathname.startsWith('/post-job') ||
      pathname.includes('/jobs-responses') ||
      pathname.includes('/job-responses') ||
      pathname.includes('/draft-jobs')
    ) {
      return 'jobs';
    }
    // Under Resdex
    if (
      pathname.startsWith('/resume-search') ||
      pathname.includes('/manage-search') ||
      pathname.includes('/folders')
    ) {
      return 'resdex';
    }
    // Under Report
    if (
      pathname.includes('/report') ||
      pathname.includes('/reports-')
    ) {
      return 'report';
    }
    // Under Analysis
    if (
      pathname.includes('/analytics') ||
      pathname.includes('/analysis')
    ) {
      return 'analysis';
    }
    // If on sidebar/settings pages, do not point out home
    if (
      pathname.includes('/employer/settings/users') ||
      pathname.includes('/employer/settings/quota') ||
      pathname.includes('/company-profile') ||
      pathname.includes('/subscriptions')
    ) {
      return '';
    }
    // Explicit prop if not 'home'
    if (activeTab && activeTab !== 'home') {
      return activeTab;
    }
    // Home exact path
    if (pathname === '/employer-dashboard' || pathname === '/employer-dashboard/') {
      return 'home';
    }
    return '';
  }, [location.pathname, activeTab]);

  const navLinks = [
    { id: "home",     icon: FiHome,       label: "Home" },
    { id: "analysis", icon: FiTrendingUp,  label: "Analysis" },
  ];

  const dropdownNavs = [
    {
      id: "jobs", icon: FiBriefcase, label: "Jobs",
      items: [
        { label: "Post a Hot Vacancy",   path: "/post-job?type=hot" },
        { label: "Post a SMB Job",    path: "/post-job?type=management" },
        { label: "Post a Internship",    path: "/post-job?type=internship" },
        { label: "Manage Jobs & Responses",        path: "/employer/jobs-responses" },
      ],
    },
    {
      id: "resdex", icon: FiSearch, label: "Resdex",
      items: [
        { label: "Search Resumes",     path: "/resume-search" },
        { label: "Send MIvite",         path: "/resume-search?tab=mivites" },
        { label: "Manage Searches",    path: "/manage-search" },
        { label: "Folders",            path: "/employer-dashboard/folders" },
        { label: "Resdex Requirements",path: "/resdex-requirements" },
      ],
    },
    {
      id: "report", icon: FiBarChart2, label: "Report",
      items: [
        { label: "Job Posting", path: "/reports-job-posting" },
        { label: "Resdex",      path: "/report/resdex" },
      ],
    },
  ];

  const dropdownItems = [
    { label: "Resdex",  icon: FiSearch, path: "/resume-search" },
    { label: "Database", icon: FiGrid,   path: "/resume-search" },
    { label: "Mivites", icon: FiSend,   path: "#" },
    { label: "Pricing & Credits", icon: FiDollarSign, path: "/employer-dashboard/pricing" },
  ];

  return (
    <>
      <header
        ref={searchHeaderRef}
        style={{
          position: "sticky", top: 0, zIndex: 200, background: "#fff",
          borderBottom: `1px solid ${C.s200}`,
          boxShadow: scrolled || isSearchExpanded ? "0 4px 24px rgba(0,35,102,.08)" : "none",
          transition: "box-shadow .25s"
        }}
      >
        <PlanExpiryBanner />
        <div
          className="ep-header-inner"
          style={{
            maxWidth: 1160, margin: "0 auto", padding: "0 20px",
            display: "flex", alignItems: "center", gap: 0, height: 58
          }}
        >
          <button type="button" onClick={() => navigate(localStorage.getItem("employerUser") ? "/employer-dashboard" : "/employer-login")}
            aria-label="Go to employer dashboard"
            className="ep-header-logo-btn"
            style={{
              display: "flex", alignItems: "center", marginRight: 28, flexShrink: 0,
              border: "none", background: "transparent", padding: 0, cursor: "pointer"
            }}
          >
            <img src={mavenLogo} alt="MavenJobs" className="ep-header-logo-img" style={{ height: 26, width: "auto" }} />
          </button>

          <nav className="ep-nav-desktop" style={{ display: "flex", alignItems: "stretch", flex: 1, paddingLeft: 12, height: 58 }}>
            {navLinks.map(n => (
              <button key={n.id}
                className={`ep-nav-link${resolvedActiveTab === n.id ? " active" : ""}`}
                onClick={() => handleNavClick(n.id)}
                style={{ flexDirection: "column", gap: 2, fontSize: 11, fontWeight: 600, padding: "8px 14px", alignItems: "center", justifyContent: "center" }}
              >
                <n.icon size={17} />
                {n.label}
              </button>
            ))}
            {dropdownNavs.map(nav => (
              <div key={nav.id} ref={el => dropdownRefs.current[nav.id] = el}
                style={{ position: "relative", display: "flex", alignItems: "stretch" }}
                onMouseEnter={() => setOpenDropdown(nav.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`ep-nav-link${(openDropdown === nav.id || resolvedActiveTab === nav.id) ? " active" : ""}`}
                  style={{ flexDirection: "column", gap: 2, fontSize: 11, fontWeight: 600, padding: "8px 14px", cursor: "pointer", alignItems: "center", justifyContent: "center" }}
                >
                  <nav.icon size={17} />
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {nav.label} <FiChevronDown size={10} style={{ transition: "transform 0.2s", transform: openDropdown === nav.id ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </span>
                </button>
                {openDropdown === nav.id && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, zIndex: 9999,
                    minWidth: 190, borderRadius: 14,
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(226,232,240,0.8)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)",
                    padding: 5, overflow: "hidden"
                  }}>
                    {nav.items.map(item => (
                      <button key={item.label} onClick={() => {
                        if (item.path !== "#") navigate(item.path);
                        setOpenDropdown(null);
                      }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "9px 14px", borderRadius: 10,
                          border: "none", background: "transparent",
                          color: "#1E293B", fontSize: 13, fontWeight: 600, fontFamily: C.dm,
                          cursor: "pointer", textAlign: "left",
                          whiteSpace: "nowrap",
                          transition: "all 0.12s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#F1F5F9"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Compact search bar (small input box, shown when NOT expanded) */}
          {!isSearchExpanded && (
            <div
              className="ep-header-search-compact"
              onClick={() => setIsSearchExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsSearchExpanded(true);
                }
              }}
              title="Click to search candidate resumes on Resdex"
              aria-label="Search resumes on Resdex"
            >
              <FiSearch size={14} style={{ color: C.s400, flexShrink: 0 }} />
              <span className="ep-compact-search-placeholder">
                {searchKeyword ? searchKeyword : "Search Resdex resumes..."}
              </span>
              {/* <span className="ep-compact-search-badge">Resdex</span> */}
            </div>
          )}

          <div className="ep-topbar-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>
            {/* Recent Searches Header Button & Dropdown Popover */}
            <div className="ep-header-recent-wrap" style={{ position: "relative" }} ref={recentSearchesMenuRef}>
              <button
                type="button"
                className="ep-header-recent-btn"
                onClick={() => setShowRecentSearchesMenu((prev) => !prev)}
                title="Recent Searches"
                aria-label="Recent Searches"
                aria-expanded={showRecentSearchesMenu}
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: showRecentSearchesMenu ? C.s100 : C.s50,
                  border: `1px solid ${showRecentSearchesMenu ? C.navy + '30' : C.s200}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: showRecentSearchesMenu ? C.navy : C.s500,
                  position: "relative", transition: "all .16s", flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,35,102,.2)"; e.currentTarget.style.color = C.navy; }}
                onMouseLeave={e => {
                  if (!showRecentSearchesMenu) {
                    e.currentTarget.style.borderColor = C.s200;
                    e.currentTarget.style.color = C.s500;
                  }
                }}
              >
                <FiClock size={16} />
              </button>

              {showRecentSearchesMenu && (
                <div className="ep-header-recent-searches-popover">
                  <div className="ep-popover-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FiClock size={14} color={C.navy} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: C.fd }}>Recent Searches</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.s500, fontWeight: 700, background: C.s100, padding: "2px 7px", borderRadius: 6 }}>
                      {recentSearches.length}
                    </span>
                  </div>
                  <div className="ep-popover-list">
                    {recentSearches.length === 0 ? (
                      <div style={{ padding: "24px 16px", textAlign: "center", color: C.s500, fontSize: 12.5 }}>
                        <FiClock size={20} color={C.s400} style={{ marginBottom: 6 }} />
                        <div>No recent searches yet</div>
                        <div style={{ fontSize: 11, color: C.s400, marginTop: 4 }}>Searches from header or Resdex will appear here</div>
                      </div>
                    ) : (
                      recentSearches.map((term, i) => (
                        <div
                          key={i}
                          className="ep-popover-item"
                          onClick={() => {
                            handleSelectRecentSearch(term);
                            setShowRecentSearchesMenu(false);
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                            <FiSearch size={13} color={C.s400} style={{ flexShrink: 0 }} />
                            <span className="ep-popover-item-text">{term}</span>
                          </div>
                          <span className="ep-popover-item-badge">Search</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="ep-popover-foot">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecentSearchesMenu(false);
                        navigate("/manage-search");
                      }}
                      className="ep-popover-foot-link"
                    >
                      Manage Saved Searches →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Profiles Header Button */}
            <button
              type="button"
              className="ep-header-saved-btn"
              onClick={() => setShowSavedProfilesSidebar((prev) => !prev)}
              title="Saved Profiles"
              aria-label="Saved Profiles"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: showSavedProfilesSidebar ? C.s100 : C.s50,
                border: `1px solid ${showSavedProfilesSidebar ? C.navy + '30' : C.s200}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: showSavedProfilesSidebar ? C.navy : C.s500,
                position: "relative", transition: "all .16s", flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,35,102,.2)"; e.currentTarget.style.color = C.navy; }}
              onMouseLeave={e => {
                if (!showSavedProfilesSidebar) {
                  e.currentTarget.style.borderColor = C.s200;
                  e.currentTarget.style.color = C.s500;
                }
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <FiBookmark size={16} />
                {savedProfiles.length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 8,
                    backgroundColor: C.navy,
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid #ffffff",
                    lineHeight: 1,
                  }}>
                    {savedProfiles.length > 99 ? "99+" : savedProfiles.length}
                  </span>
                )}
              </div>
            </button>

            {/* Subscriptions Header Button (After Login) */}
            {isEmployerLoggedIn && (
              <button
                type="button"
                className="ep-header-sub-btn"
                onClick={() => navigate("/employer-dashboard/subscriptions")}
                title="My Subscriptions"
                aria-label="My Subscriptions"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: location.pathname.includes("subscriptions") ? `${C.navy}14` : C.s50,
                  border: `1px solid ${location.pathname.includes("subscriptions") ? C.navy + '35' : C.s200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: location.pathname.includes("subscriptions") ? C.navy : C.s500,
                  position: "relative",
                  transition: "all .16s",
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(0,35,102,.25)";
                  e.currentTarget.style.color = C.navy;
                }}
                onMouseLeave={e => {
                  if (!location.pathname.includes("subscriptions")) {
                    e.currentTarget.style.borderColor = C.s200;
                    e.currentTarget.style.color = C.s500;
                  }
                }}
              >
                <FiCreditCard size={16} />
              </button>
            )}

            {/* Cart Header Button */}
            <button
              type="button"
              className="ep-header-cart-btn"
              onClick={() => setCartDrawerOpen((prev) => !prev)}
              title="Cart"
              aria-label="Shopping Cart"
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: cartDrawerOpen ? C.s100 : C.s50,
                border: `1px solid ${cartDrawerOpen ? C.navy + '30' : C.s200}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: cartDrawerOpen ? C.navy : C.s500,
                position: "relative", transition: "all .16s", flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,35,102,.2)"; e.currentTarget.style.color = C.navy; }}
              onMouseLeave={e => {
                if (!cartDrawerOpen) {
                  e.currentTarget.style.borderColor = C.s200;
                  e.currentTarget.style.color = C.s500;
                }
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <FiShoppingCart size={16} />
                {cartItems.length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 8,
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid #ffffff",
                    lineHeight: 1,
                  }}>
                    {cartItems.length > 99 ? "99+" : cartItems.length}
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              className="ep-header-notif-btn"
              onClick={(e) => {
                setShowNotifications((prev) => !prev);
                if (onNotificationsClick && typeof onNotificationsClick === "function" && onNotificationsClick.name !== "noop") {
                  onNotificationsClick(e);
                }
              }}
              aria-label="Toggle notifications"
              style={{
                width: 36, height: 36, borderRadius: 9, background: showNotifications ? C.s100 : C.s50,
                border: `1px solid ${showNotifications ? C.navy + '30' : C.s200}`, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: showNotifications ? C.navy : C.s500,
                position: "relative", transition: "all .16s", flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,35,102,.2)"; e.currentTarget.style.color = C.navy; }}
              onMouseLeave={e => {
                if (!showNotifications) {
                  e.currentTarget.style.borderColor = C.s200;
                  e.currentTarget.style.color = C.s500;
                }
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <FiBell size={16} />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    border: "1.5px solid #ffffff",
                  }} />
                )}
              </div>
            </button>

            {isEmployerLoggedIn ? (
            <div className="ep-profile-desktop" style={{ position: "relative" }}>
              <button ref={profileBtnRef} onClick={() => setShowProfileSidebar((p) => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "5px 12px 5px 5px", borderRadius: 12,
                  background: showProfileSidebar
                    ? `linear-gradient(135deg, ${C.navy}12, ${C.navy}08)`
                    : `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`,
                  border: `1px solid ${showProfileSidebar ? C.navy + '30' : C.navy + '15'}`,
                  cursor: "pointer", fontFamily: C.dm,
                  transition: "all 0.18s", outline: "none"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy + '40'; e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}14, ${C.navy}08)`; }}
                onMouseLeave={e => { if (!showProfileSidebar) { e.currentTarget.style.borderColor = C.navy + '15'; e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`; } }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  background: displayImage
                    ? "transparent"
                    : "linear-gradient(135deg,#f8fafc,#e2e8f0)"
                }}>
                  {displayImage ? (
                    <img src={displayImage} alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.style.background = "linear-gradient(135deg,#f8fafc,#e2e8f0)";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8" }}>
                      {initials}
                    </span>
                  )}
                </div>
                <div style={{ lineHeight: 1.2, textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: C.s500 }}>
                    {displayRole}
                  </div>
                </div>
                <FiChevronDown size={13} color={C.s400} style={{
                  transition: "transform 0.2s",
                  transform: showProfileSidebar ? "rotate(180deg)" : "rotate(0deg)"
                }} />
              </button>

              {/* Profile Sidebar */}
              {showProfileSidebar && (
                <div
                  className="ep-profile-sidebar-backdrop"
                  onClick={() => setShowProfileSidebar(false)}
                >
                  <div
                    ref={profileSidebarRef}
                    className="ep-profile-sidebar-panel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Top Header of Sidebar */}
                    <div style={{
                      padding: "20px 20px 16px",
                      borderBottom: `1px solid ${C.s200}`,
                      position: "relative",
                      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                    }}>
                      {/* Close button */}
                      <button
                        onClick={() => setShowProfileSidebar(false)}
                        aria-label="Close"
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1px solid ${C.s200}`,
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.s600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "#0f172a";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.color = C.s600;
                        }}
                      >
                        <FiX size={17} />
                      </button>

                      {/* User Info Card */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          flexShrink: 0,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: displayImage ? "transparent" : "linear-gradient(135deg, #002366, #1e5eff)",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: 16,
                          boxShadow: "0 4px 12px rgba(0, 35, 102, 0.15)",
                        }}>
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={displayName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement.style.background = "linear-gradient(135deg, #002366, #1e5eff)";
                              }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                          <div style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#0F172A",
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {displayName}
                          </div>
                          {displayEmail && (
                            <div style={{
                              fontSize: 12,
                              color: C.s500,
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {displayEmail}
                            </div>
                          )}
                          {displayRole && (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              marginTop: 6,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: `${C.navy}12`,
                              color: C.navy,
                              fontSize: 10.5,
                              fontWeight: 700,
                            }}>
                              {displayRole}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Credits Card (if available) */}
                    {/* {isSuperUser && creditData && (
                      <div style={{
                        margin: "14px 16px 4px",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                        border: "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FiDollarSign size={18} color="#d97706" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>
                              {creditData.balance} Credits
                            </div>
                            <div style={{ fontSize: 10.5, color: "#b45309" }}>Resume Search & Download</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowProfileSidebar(false);
                            navigate("/employer-dashboard/pricing");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "#002366",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <FiShoppingCart size={11} /> Top Up
                        </button>
                      </div>
                    )} */}

                    {/* Navigation Items */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                      {/* 1. Company Profile */}
                      {isSuperUser && (
                        <button
                          onClick={() => {
                            setShowProfileSidebar(false);
                            navigate("/employer-dashboard/company-profile");
                          }}
                          className="ep-sidebar-btn"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            width: "100%",
                            padding: "11px 14px",
                            borderRadius: 10,
                            border: "none",
                            background: "transparent",
                            color: "#334155",
                            fontSize: 14.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.14s",
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M2 10h20" />
                            <path d="M10 10v10" />
                          </svg>
                          <span>Company Profile</span>
                        </button>
                      )}

                      {/* 2. My Subscriptions */}
                      {isSuperUser && (
                      <button
                        onClick={() => {
                          setShowProfileSidebar(false);
                          navigate("/employer-dashboard/subscriptions");
                        }}
                        className="ep-sidebar-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: "transparent",
                          color: "#334155",
                          fontSize: 14.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.14s",
                        }}
                      >
                        <FiCreditCard size={18} color="#64748b" />
                        <span>My Subscriptions</span>
                      </button>
                      )}

                      {/* 3. Settings (Collapsible Accordion) */}
                      <div>
                        <button
                          onClick={() => setSettingsOpen((prev) => !prev)}
                          className="ep-sidebar-btn"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "11px 14px",
                            borderRadius: 10,
                            border: "none",
                            background: "transparent",
                            color: "#334155",
                            fontSize: 14.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.14s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <FiSettings size={18} color="#64748b" />
                            <span>Settings</span>
                          </div>
                          {settingsOpen ? (
                            <FiChevronUp size={16} color="#64748b" />
                          ) : (
                            <FiChevronDown size={16} color="#64748b" />
                          )}
                        </button>

                        {/* Settings Sub-items */}
                        {settingsOpen && (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            paddingLeft: 46,
                            paddingRight: 6,
                            marginTop: 2,
                            marginBottom: 4,
                          }}>
                            <button
                              onClick={() => {
                                setShowProfileSidebar(false);
                                navigate("/product-settings");
                              }}
                              className="ep-sidebar-subbtn"
                              style={{
                                padding: "9px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: location.pathname.includes("product-settings")
                                  ? "#e0f2fe"
                                  : "transparent",
                                color: location.pathname.includes("product-settings")
                                  ? "#0284c7"
                                  : "#334155",
                                fontSize: 14,
                                fontWeight: location.pathname.includes("product-settings") ? 600 : 500,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.14s",
                              }}
                            >
                              Product Settings
                            </button>

                            {isSuperUser && (
                              <>
                            <button
                              onClick={() => {
                                setShowProfileSidebar(false);
                                navigate("/employer/settings/users");
                              }}
                              className="ep-sidebar-subbtn"
                              style={{
                                padding: "9px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                color: "#334155",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.14s",
                              }}
                            >
                              Manage Users
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileSidebar(false);
                                navigate("/employer/settings/quota");
                              }}
                              className="ep-sidebar-subbtn"
                              style={{
                                padding: "9px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                color: "#334155",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.14s",
                              }}
                            >
                              Manage Quota
                            </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setShowProfileSidebar(false);
                                setShowChangePassword(true);
                              }}
                              className="ep-sidebar-subbtn"
                              style={{
                                padding: "9px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                color: "#334155",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.14s",
                              }}
                            >
                              Change Password
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Learning Center */}
                      <Link
                        to="/employers/learning-center"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowProfileSidebar(false)}
                        className="ep-sidebar-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: "transparent",
                          color: "#334155",
                          fontSize: 14.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.14s",
                          textDecoration: "none"
                        }}
                      >
                        <FiBookOpen size={18} color="#64748b" />
                        <span>Learning Center</span>
                      </Link>

                      {/* Feedback */}
                      <button
                        onClick={() => {
                          setShowProfileSidebar(false);
                          setShowFeedbackModal(true);
                        }}
                        className="ep-sidebar-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: "transparent",
                          color: "#334155",
                          fontSize: 14.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.14s",
                        }}
                      >
                        <VscFeedback size={18} color="#64748b" />
                        <span>Feedback</span>
                      </button>

                      {/* Flexible Spacer for distinct gap between top tabs and logout button */}
                      <div style={{ flex: 1, minHeight: 48 }} />
                    </div>

                    {/* Footer / Logout */}
                    <div style={{
                      marginTop: "auto",
                      padding: "20px 16px 26px",
                      borderTop: `1px solid ${C.s200}`,
                      background: "#fafbfc",
                    }}>
                      <button
                        onClick={() => {
                          setLogoutTarget("maven");
                          setShowProfileSidebar(false);
                          setShowLogoutConfirm(true);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: "1px solid #fecaca",
                          background: "#fff5f5",
                          color: "#dc2626",
                          fontSize: 14.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff5f5";
                        }}
                      >
                        <FiLogOut size={16} />
                        Logout from Maven Jobs
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/employer-login")}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.navy}`,
                  background: C.navy,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: C.fd,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(0,35,102,0.16)",
                  transition: "all 0.16s",
                }}
                className="ep-login-desktop"
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,35,102,0.24)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,35,102,0.16)";
                }}
              >
                Login
              </button>
            )}

            {/* Hamburger / Menu Bar (mobile only, rightmost) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(p => !p)}
              className="ep-hamburger"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              style={{
                display: 'none',
                width: 36,
                height: 36,
                borderRadius: 9,
                background: mobileMenuOpen ? `${C.navy}12` : C.s50,
                border: `1px solid ${mobileMenuOpen ? C.navy + '30' : C.s200}`,
                cursor: 'pointer',
                color: mobileMenuOpen ? C.navy : C.s700,
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.16s',
                flexShrink: 0
              }}
            >
              {mobileMenuOpen ? <FiX size={19} /> : <FiMenu size={19} />}
            </button>
          </div>
        </div>

        {/* ─── Expanded Search Row on Y-axis (Header expands vertically) ─── */}
        {isSearchExpanded && (
          <div className="ep-header-search-expanded-row">
            <div className="ep-header-search-expanded-inner">
              <form onSubmit={handleSearchSubmit} className="ep-header-search-form">
                <div className="ep-search-input-field-wrap">
                  <FiSearch size={17} className="ep-search-field-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setShowRecentDropdown(true);
                    }}
                    onFocus={() => setShowRecentDropdown(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search candidate profiles by keywords, skills, designations (e.g. React Developer, Node.js, Mumbai)..."
                    className="ep-search-field-input"
                  />
                  {searchKeyword && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchKeyword("");
                        searchInputRef.current?.focus();
                        setShowRecentDropdown(true);
                      }}
                      className="ep-search-field-clear"
                      aria-label="Clear keyword"
                      title="Clear"
                    >
                      <FiX size={14} />
                    </button>
                  )}

                  {/* Dropdown: Shows recent 5 searches initially, and updates dynamically based on typing */}
                  {isSearchExpanded && showRecentDropdown && (
                    <div className="ep-search-recent-dropdown">
                      <div className="ep-search-recent-header">
                        {searchKeyword.trim() ? (
                          <FiSearch size={12} className="ep-search-recent-header-icon" />
                        ) : (
                          <FiClock size={12} className="ep-search-recent-header-icon" />
                        )}
                        <span className="ep-search-recent-header-label">
                          {searchKeyword.trim() ? `Suggestions for "${searchKeyword.trim()}"` : "Recent Searches"}
                        </span>
                      </div>
                      <div className="ep-search-recent-list">
                        {/* 1. When typing: top row to directly search for typed query */}
                        {searchKeyword.trim() && (
                          <div
                            className={`ep-search-recent-item ${dropdownActiveIndex === 0 ? "active" : ""}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectRecentSearch(searchKeyword.trim());
                            }}
                          >
                            <div className="ep-search-recent-item-left">
                              <FiSearch size={13} className="ep-search-recent-item-icon" style={{ color: C.navy }} />
                              <span className="ep-search-recent-item-text">
                                Search for <strong>"{searchKeyword.trim()}"</strong>
                              </span>
                            </div>
                            <span className="ep-search-recent-item-badge" style={{ background: `${C.navy}12`, color: C.navy, fontWeight: 700 }}>
                              Search
                            </span>
                          </div>
                        )}

                        {/* 2. Initial state (empty input): show only recent 5 searches */}
                        {!searchKeyword.trim() && recentSearches && recentSearches.length > 0 && (
                          recentSearches.slice(0, 5).map((term, index) => (
                            <div
                              key={index}
                              className={`ep-search-recent-item ${dropdownActiveIndex === index ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectRecentSearch(term);
                              }}
                            >
                              <div className="ep-search-recent-item-left">
                                <FiClock size={13} className="ep-search-recent-item-icon" />
                                <span className="ep-search-recent-item-text">{term}</span>
                              </div>
                              <span className="ep-search-recent-item-badge">Recent</span>
                            </div>
                          ))
                        )}

                        {/* 3. When typing: show matching live suggestions and matching recent searches */}
                        {searchKeyword.trim() && filteredLiveSuggestions.map((term, index) => {
                          const itemIndex = index + 1; // 0 is the "Search for ..." item
                          const isRecent = recentSearches.some(r => r.toLowerCase() === term.toLowerCase());
                          return (
                            <div
                              key={term}
                              className={`ep-search-recent-item ${dropdownActiveIndex === itemIndex ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectRecentSearch(term);
                              }}
                            >
                              <div className="ep-search-recent-item-left">
                                {isRecent ? (
                                  <FiClock size={13} className="ep-search-recent-item-icon" />
                                ) : (
                                  <FiSearch size={13} className="ep-search-recent-item-icon" />
                                )}
                                <span className="ep-search-recent-item-text">{term}</span>
                              </div>
                              <span className="ep-search-recent-item-badge">
                                {isRecent ? "Recent" : "Suggested"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="ep-search-action-btn"
                  disabled={!searchKeyword.trim()}
                >
                  <FiSearch size={15} />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setShowRecentDropdown(false);
                  }}
                  className="ep-search-close-action-btn"
                  aria-label="Close search"
                  title="Close (Esc)"
                >
                  <FiX size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── Responsive Mobile Sidebar Drawer ─── */}
        <div
          className={`ep-mob-sidebar-overlay ${mobileMenuOpen ? 'show' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={`ep-mob-sidebar ${mobileMenuOpen ? 'show' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Mobile Sidebar Header */}
          <div style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${C.s200}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            flexShrink: 0,
          }}>
            {isEmployerLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: displayImage ? "transparent" : "linear-gradient(135deg, #002366, #1e5eff)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.style.background = "linear-gradient(135deg, #002366, #1e5eff)";
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0F172A",
                    fontFamily: C.fd,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {displayName}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.s500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {displayEmail || displayRole}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #002366, #1e5eff)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  <FiBriefcase size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0F172A",
                    fontFamily: C.fd,
                  }}>
                    Employer Portal
                  </div>
                  <div style={{ fontSize: 11, color: C.s500 }}>
                    Sign in to post & manage jobs
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${C.s200}`,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.s600,
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fee2e2";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = C.s600;
              }}
            >
              <FiX size={17} />
            </button>
          </div>

          {/* Quick Actions moved from header to mobile sidebar */}
          <div className="ep-mob-quick-grid">
            {/* 1. Notifications Tile */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowNotifications(true);
              }}
              className="ep-mob-quick-tile"
              title="Notifications"
            >
              <div className="ep-mob-quick-tile-icon" style={{ background: "#EFF6FF", color: C.navy }}>
                <FiBell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span className="ep-mob-quick-tile-badge">
                    {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                  </span>
                )}
              </div>
              <div className="ep-mob-quick-tile-info">
                <span className="ep-mob-quick-tile-title">Alerts</span>
                <span className="ep-mob-quick-tile-sub">
                  {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} new` : "Notifications"}
                </span>
              </div>
            </button>

            {/* 2. Cart Tile */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCartDrawerOpen(true);
              }}
              className="ep-mob-quick-tile"
              title="Cart"
            >
              <div className="ep-mob-quick-tile-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                <FiShoppingCart size={17} />
                {cartItems.length > 0 && (
                  <span className="ep-mob-quick-tile-badge">
                    {cartItems.length > 99 ? "99+" : cartItems.length}
                  </span>
                )}
              </div>
              <div className="ep-mob-quick-tile-info">
                <span className="ep-mob-quick-tile-title">My Cart</span>
                <span className="ep-mob-quick-tile-sub">
                  {cartItems.length > 0 ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''}` : "Empty"}
                </span>
              </div>
            </button>

            {/* 3. Saved Profiles Tile */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowSavedProfilesSidebar(true);
              }}
              className="ep-mob-quick-tile"
              title="Saved Profiles"
            >
              <div className="ep-mob-quick-tile-icon" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                <FiBookmark size={17} />
                {savedProfiles.length > 0 && (
                  <span className="ep-mob-quick-tile-badge" style={{ background: "#16A34A" }}>
                    {savedProfiles.length > 99 ? "99+" : savedProfiles.length}
                  </span>
                )}
              </div>
              <div className="ep-mob-quick-tile-info">
                <span className="ep-mob-quick-tile-title">Saved</span>
                <span className="ep-mob-quick-tile-sub">
                  {savedProfiles.length > 0 ? `${savedProfiles.length} profiles` : "Bookmarks"}
                </span>
              </div>
            </button>

            {/* 4. Subscriptions / Pricing Tile */}
            {isEmployerLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/employer-dashboard/subscriptions");
                }}
                className="ep-mob-quick-tile"
                title="My Subscriptions"
              >
                <div className="ep-mob-quick-tile-icon" style={{ background: "#FAF5FF", color: "#7C3AED" }}>
                  <FiCreditCard size={17} />
                </div>
                <div className="ep-mob-quick-tile-info">
                  <span className="ep-mob-quick-tile-title">Plans</span>
                  <span className="ep-mob-quick-tile-sub">Subscriptions</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/buy-online");
                }}
                className="ep-mob-quick-tile"
                title="Pricing & Plans"
              >
                <div className="ep-mob-quick-tile-icon" style={{ background: "#FAF5FF", color: "#7C3AED" }}>
                  <FiCreditCard size={17} />
                </div>
                <div className="ep-mob-quick-tile-info">
                  <span className="ep-mob-quick-tile-title">Pricing</span>
                  <span className="ep-mob-quick-tile-sub">Explore plans</span>
                </div>
              </button>
            )}
          </div>

          {/* Mobile Sidebar Scrollable Navigation Tabs */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}>
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => {
                handleNavClick("home");
                setMobileMenuOpen(false);
              }}
              className={`ep-mob-nav-btn ${resolvedActiveTab === "home" || location.pathname === "/employer-dashboard" ? "active" : ""}`}
            >
              <FiHome size={18} />
              <span>Home</span>
            </button>

            {/* 2. Analytics */}
            <button
              type="button"
              onClick={() => {
                handleNavClick("analysis");
                setMobileMenuOpen(false);
              }}
              className={`ep-mob-nav-btn ${resolvedActiveTab === "analysis" || location.pathname.includes("analytics") ? "active" : ""}`}
            >
              <FiTrendingUp size={18} />
              <span>Analytics</span>
            </button>

            {/* 3. Job (Collapsible Accordion) */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSection("jobs")}
                className={`ep-mob-accordion-btn ${mobileSections.jobs ? "open" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FiBriefcase size={18} />
                  <span>Job</span>
                </div>
                <FiChevronDown
                  size={16}
                  style={{
                    transition: "transform 0.22s ease",
                    transform: mobileSections.jobs ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {mobileSections.jobs && (
                <div className="ep-mob-sublist">
                  {dropdownNavs.find(d => d.id === 'jobs')?.items.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.path !== "#") navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="ep-mob-subbtn"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Resdex (Collapsible Accordion) */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSection("resdex")}
                className={`ep-mob-accordion-btn ${mobileSections.resdex ? "open" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FiSearch size={18} />
                  <span>Resdex</span>
                </div>
                <FiChevronDown
                  size={16}
                  style={{
                    transition: "transform 0.22s ease",
                    transform: mobileSections.resdex ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {mobileSections.resdex && (
                <div className="ep-mob-sublist">
                  {dropdownNavs.find(d => d.id === 'resdex')?.items.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.path !== "#") navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="ep-mob-subbtn"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Report (Collapsible Accordion) */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSection("report")}
                className={`ep-mob-accordion-btn ${mobileSections.report ? "open" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FiBarChart2 size={18} />
                  <span>Report</span>
                </div>
                <FiChevronDown
                  size={16}
                  style={{
                    transition: "transform 0.22s ease",
                    transform: mobileSections.report ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {mobileSections.report && (
                <div className="ep-mob-sublist">
                  {dropdownNavs.find(d => d.id === 'report')?.items.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.path !== "#") navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="ep-mob-subbtn"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Company Profile */}
            <button
              type="button"
              onClick={() => {
                navigate("/employer-dashboard/company-profile");
                setMobileMenuOpen(false);
              }}
              className={`ep-mob-nav-btn ${location.pathname.includes("company-profile") ? "active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 10h20" />
                <path d="M10 10v10" />
              </svg>
              <span>Company Profile</span>
            </button>

            {/* 7. My Subscription */}
            <button
              type="button"
              onClick={() => {
                navigate("/employer-dashboard/subscriptions");
                setMobileMenuOpen(false);
              }}
              className={`ep-mob-nav-btn ${location.pathname.includes("subscriptions") ? "active" : ""}`}
            >
              <FiCreditCard size={18} />
              <span>My Subscriptions</span>
            </button>

            {/* Saved Profiles Mobile Button */}
            {/* <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowSavedProfilesSidebar(true);
              }}
              className="ep-mob-nav-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <FiBookmark size={18} />
                <span>Saved Profiles</span>
              </div>
              {savedProfiles.length > 0 && (
                <span style={{
                  background: `${C.navy}12`,
                  color: C.navy,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 10,
                }}>
                  {savedProfiles.length}
                </span>
              )}
            </button> */}



            {/* 8. Settings (Collapsible Accordion with all child tabs) */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSection("settings")}
                className={`ep-mob-accordion-btn ${mobileSections.settings ? "open" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FiSettings size={18} />
                  <span>Settings</span>
                </div>
                <FiChevronDown
                  size={16}
                  style={{
                    transition: "transform 0.22s ease",
                    transform: mobileSections.settings ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {mobileSections.settings && (
                <div className="ep-mob-sublist">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/product-settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`ep-mob-subbtn ${location.pathname.includes("product-settings") ? "active" : ""}`}
                  >
                    Product Settings
                  </button>
                  {isSuperUser && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/employer/settings/users");
                          setMobileMenuOpen(false);
                        }}
                        className={`ep-mob-subbtn ${location.pathname.includes("employer/settings/users") ? "active" : ""}`}
                      >
                        Manage Users
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/employer/settings/quota");
                          setMobileMenuOpen(false);
                        }}
                        className={`ep-mob-subbtn ${location.pathname.includes("employer/settings/quota") ? "active" : ""}`}
                      >
                        Manage Quota
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(true);
                      setMobileMenuOpen(false);
                    }}
                    className="ep-mob-subbtn"
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>

            {/* 9. Learning Center */}
            <Link
              to="/employers/learning-center"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="ep-mob-nav-btn"
              style={{ textDecoration: "none" }}
            >
              <FiBookOpen size={18} />
              <span>Learning Center</span>
            </Link>

            {/* 10. Feedback */}
            <button
              type="button"
              onClick={() => {
                setShowFeedbackModal(true);
                setMobileMenuOpen(false);
              }}
              className="ep-mob-nav-btn"
            >
              <VscFeedback size={18} />
              <span>Feedback</span>
            </button>

            <div style={{ height: 16, flexShrink: 0 }} />
          </div>

          {/* Pinned / Fixed Bottom Logout Button */}
          <div style={{
            marginTop: "auto",
            flexShrink: 0,
            padding: "14px 16px 20px",
            borderTop: `1px solid ${C.s200}`,
            background: "#fafbfc",
          }}>
            {isEmployerLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setLogoutTarget("maven");
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="ep-mob-logout-btn"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigate("/employer-login");
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: C.navy,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: C.fd,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Login to Maven Jobs
              </button>
            )}
          </div>
        </div>

        {/* ─── Global Employer Notification Sidebar (Tabs: Activity & Reminders) ─── */}
        <div
          className={`pd-notif-overlay ${showNotifications ? 'show' : ''}`}
          onClick={() => setShowNotifications(false)}
        />
        <div className={`pd-notif-sidebar ${showNotifications ? 'show' : ''}`}>
          {/* Header */}
          <div className="pd-notif-head">
            <h3>All notifications</h3>
            <button
              className="pd-notif-close"
              onClick={() => setShowNotifications(false)}
              aria-label="Close notifications"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="pd-notif-tabs-bar">
            <button
              type="button"
              className={`pd-notif-tab-btn ${notifActiveTab === 'activity' ? 'active' : ''}`}
              onClick={() => setNotifActiveTab('activity')}
            >
              <span>Activity</span>
              {unreadNotificationsCount > 0 && (
                <span className="pd-notif-tab-badge">{unreadNotificationsCount}</span>
              )}
              {notifActiveTab === 'activity' && <div className="pd-notif-tab-indicator" />}
            </button>

            <button
              type="button"
              className={`pd-notif-tab-btn ${notifActiveTab === 'reminders' ? 'active' : ''}`}
              onClick={() => setNotifActiveTab('reminders')}
            >
              <span>Reminders</span>
              {reminders.length > 0 && (
                <span className="pd-notif-tab-badge">{reminders.length}</span>
              )}
              {notifActiveTab === 'reminders' && <div className="pd-notif-tab-indicator" />}
            </button>
          </div>

          {/* Tab 1: Activity (Notifications) */}
          {notifActiveTab === 'activity' && (
            <div className="pd-notif-body">
              {unreadNotificationsCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 10px' }}>
                  <button
                    type="button"
                    className="pd-notif-mark-read"
                    onClick={() => {
                      if (unreadNotificationsCount === 0) return;
                      setEmployerNotifications((curr) =>
                        curr.map((x) => ({ ...x, status: "READ" }))
                      );
                      authService.markAllEmployerNotificationsRead().catch(() => {});
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {notificationsLoading && (
                <div style={{ padding: "30px 24px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.s500, fontFamily: C.fd }}>
                    Loading notifications...
                  </div>
                </div>
              )}

              {!notificationsLoading && notificationsError && (
                <div style={{ padding: "20px 24px", color: "#b91c1c", fontSize: 13, fontWeight: 700, fontFamily: C.fd }}>
                  {notificationsError}
                </div>
              )}

              {!notificationsLoading && !notificationsError && employerNotifications.length === 0 && (
                <div className="pd-notif-empty-state">
                  <img
                    src={notAllowedImg}
                    alt="No activity"
                    style={{
                      width: 140,
                      maxWidth: "70%",
                      height: "auto",
                      objectFit: "contain",
                      marginBottom: 14
                    }}
                  />
                  <h4 className="pd-empty-title">You have no new activity</h4>
                </div>
              )}

              {!notificationsLoading && employerNotifications.map((n) => {
                const id = String(n?.id || n?._id || "");
                const isRead = String(n?.status || "").toUpperCase() === "READ";
                const title = n?.title || "";
                const desc = n?.message || n?.desc || "";
                const time = n?.lastUpdated || n?.createdAt || "";

                return (
                  <div
                    className="pd-notif-item"
                    key={id || title + time}
                    onClick={() => {
                      if (!id) return;
                      if (!isRead) {
                        setEmployerNotifications((current) =>
                          current.map((x) => {
                            const xid = String(x?.id || x?._id || "");
                            if (!xid || xid !== id) return x;
                            return { ...x, status: "READ" };
                          })
                        );
                        authService.markEmployerNotificationRead(id).catch(() => {});
                      }

                      if (n?.actionUrl) {
                        setShowNotifications(false);
                        navigate(n.actionUrl);
                      }
                    }}
                    style={{ background: isRead ? "transparent" : "#EEF2FF" }}
                  >
                    <div
                      className="pd-notif-icon"
                      style={{
                        background: isRead ? C.s200 : `${C.navy}14`,
                        color: isRead ? C.s500 : C.navy,
                      }}
                    >
                      <FiBell size={16} />
                    </div>

                    <div className="pd-notif-content">
                      <div className="pd-notif-title" style={{ opacity: isRead ? 0.7 : 1, fontWeight: isRead ? 600 : 700 }}>
                        {title}
                      </div>
                      {desc ? <div className="pd-notif-desc">{desc}</div> : null}
                      {time ? <div className="pd-notif-time">{time}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Reminders (Set by recruiter) */}
          {notifActiveTab === 'reminders' && (
            <div className="pd-notif-body">
              {remindersLoading && (
                <div style={{ padding: "30px 24px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.s500, fontFamily: C.fd }}>
                    Loading reminders...
                  </div>
                </div>
              )}

              {!remindersLoading && remindersError && (
                <div style={{ padding: "20px 24px", color: "#b91c1c", fontSize: 13, fontWeight: 700, fontFamily: C.fd }}>
                  {remindersError}
                </div>
              )}

              {!remindersLoading && !remindersError && reminders.length === 0 && (
                <div className="pd-notif-empty-state">
                  <img
                    src={notAllowedImg}
                    alt="No reminders"
                    style={{
                      width: 140,
                      maxWidth: "70%",
                      height: "auto",
                      objectFit: "contain",
                      marginBottom: 14
                    }}
                  />
                  <h4 className="pd-empty-title">You have no reminders</h4>
                  <p className="pd-empty-sub">
                    Reminders set on candidates in Resdex will appear here for you.
                  </p>
                </div>
              )}

              {!remindersLoading && reminders.map((rem) => {
                const remId = rem._id || rem.id;
                const candidate = rem.candidateId;
                const candidateName = rem.candidateName || candidate?.name || rem.candidateProfile?.name || rem.candidateProfile?.fullName || (candidate?.email ? candidate.email.split('@')[0] : "Candidate");
                const candidateTitle = rem.candidateProfile?.currentTitle || rem.candidateProfile?.headline || rem.candidateProfile?.currentCompany || "";
                const candidateCity = rem.candidateProfile?.currentCity || rem.candidateProfile?.city || "";
                const targetCandidateId = rem.candidateUserId || candidate?._id || candidate?.id || rem.candidateProfile?.userId?._id || rem.candidateProfile?.userId || (typeof candidate === "string" ? candidate : null);
                const isSent = rem.status === "sent";

                const handleOpenCandidateFullProfile = (e) => {
                  if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                  if (targetCandidateId) {
                    window.open(`/employer/candidate/${targetCandidateId}`, '_blank', 'noopener,noreferrer');
                  }
                };

                return (
                  <div className="pd-rem-card" key={remId || rem.date}>
                    <div className="pd-rem-head-row">
                      <span className="pd-rem-type-pill">
                        {rem.type || "Reminder"}
                      </span>
                      <div className="pd-rem-time-badge">
                        <FiClock size={12} />
                        <span>{formatReminderDate(rem.date)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReminder(remId, e)}
                        className="pd-rem-delete-btn"
                        title="Dismiss reminder"
                        aria-label="Dismiss reminder"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>

                    <div
                      className="pd-rem-candidate-row"
                      onClick={handleOpenCandidateFullProfile}
                      role={targetCandidateId ? "button" : undefined}
                      tabIndex={targetCandidateId ? 0 : undefined}
                      title={targetCandidateId ? `View ${candidateName}'s full profile in new tab` : candidateName}
                    >
                      <div className="pd-rem-avatar">
                        {candidate?.avatar || candidate?.profilePic || rem.candidateProfile?.avatar ? (
                          <img src={candidate?.avatar || candidate?.profilePic || rem.candidateProfile?.avatar} alt={candidateName} />
                        ) : (
                          <span className="pd-rem-avatar-initials">
                            {candidateName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="pd-rem-cand-info">
                        <div className="pd-rem-cand-name-wrap">
                          <span className="pd-rem-cand-name">{candidateName}</span>
                          <FiExternalLink size={12} className="pd-rem-cand-ext-icon" />
                        </div>
                        {(candidateTitle || candidateCity) && (
                          <div className="pd-rem-cand-title">
                            {[candidateTitle, candidateCity].filter(Boolean).join(" • ")}
                          </div>
                        )}
                      </div>
                    </div>

                    {rem.description && (
                      <div className="pd-rem-desc">{rem.description}</div>
                    )}

                    <div className="pd-rem-footer-row">
                      <span className={`pd-rem-status-tag ${isSent ? 'sent' : 'pending'}`}>
                        {isSent ? '● Sent' : '● Pending'}
                      </span>
                      {targetCandidateId && (
                        <button
                          type="button"
                          onClick={handleOpenCandidateFullProfile}
                          className="pd-rem-view-cand-btn"
                          title="Open candidate profile in new tab"
                        >
                          View Full Profile <FiExternalLink size={11} style={{ marginLeft: 4 }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Global Employer Saved Profiles Sidebar ─── */}
        <div
          className={`pd-saved-overlay ${showSavedProfilesSidebar ? 'show' : ''}`}
          onClick={() => setShowSavedProfilesSidebar(false)}
        />
        <div className={`pd-saved-sidebar ${showSavedProfilesSidebar ? 'show' : ''}`}>
          {/* Header */}
          <div className="pd-saved-head">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: `${C.navy}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.navy,
              }}>
                <FiBookmark size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A", fontFamily: C.fd }}>
                  Saved Profiles
                </h3>
                <span style={{ fontSize: 12, color: C.s500, fontWeight: 500 }}>
                  {savedProfiles.length} candidate{savedProfiles.length === 1 ? '' : 's'} saved
                </span>
              </div>
            </div>
            <button
              className="pd-saved-close"
              onClick={() => setShowSavedProfilesSidebar(false)}
              aria-label="Close saved profiles"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Search Filter in Sidebar */}
          <div className="pd-saved-filter-bar">
            <div className="pd-saved-search-box">
              <FiSearch size={14} color={C.s400} />
              <input
                type="text"
                placeholder="Filter saved profiles by name, skill, title..."
                value={savedProfilesSearch}
                onChange={(e) => setSavedProfilesSearch(e.target.value)}
                className="pd-saved-search-input"
              />
              {savedProfilesSearch && (
                <button
                  type="button"
                  onClick={() => setSavedProfilesSearch("")}
                  className="pd-saved-search-clear"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="pd-saved-body">
            {savedProfilesLoading && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.s500, fontSize: 13, fontWeight: 600 }}>
                <div className="pd-saved-spinner" />
                <div style={{ marginTop: 12 }}>Loading saved profiles...</div>
              </div>
            )}

            {!savedProfilesLoading && savedProfilesError && (
              <div style={{ margin: 16, padding: "14px 16px", borderRadius: 10, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
                {savedProfilesError}
              </div>
            )}

            {!savedProfilesLoading && !savedProfilesError && filteredSavedProfiles.length === 0 && (
              <div className="pd-saved-empty-state">
                <div className="pd-saved-empty-icon-wrap">
                  <FiBookmark size={32} color={C.navy} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                  {savedProfiles.length === 0 ? "No saved candidate profiles yet" : "No matches found"}
                </h4>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.5, maxWidth: 280 }}>
                  {savedProfiles.length === 0
                    ? "When you save candidate profiles from Resdex search, they will appear here for fast access."
                    : `No saved profiles match "${savedProfilesSearch}". Try checking another keyword.`}
                </p>
                {savedProfiles.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSavedProfilesSidebar(false);
                      window.open("/resume-search", "_blank");
                    }}
                    className="pd-saved-action-btn"
                  >
                    <FiSearch size={14} /> Search Resumes
                  </button>
                )}
              </div>
            )}

            {!savedProfilesLoading && filteredSavedProfiles.map((cand) => {
              const cId = cand.candidateId || cand._id || cand.id;
              const name = cand.name || "Candidate";
              const title = cand.currentTitle || cand.headline || "";
              const company = cand.currentCompany || "";
              const exp = cand.totalExperience != null ? `${cand.totalExperience} yrs` : "";
              const city = cand.currentCity || cand.city || "";
              const folderName = cand.folderName || "Saved Folder";
              const skills = Array.isArray(cand.skills) ? cand.skills.slice(0, 4) : [];
              const savedDate = cand.savedAt ? new Date(cand.savedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

              const avatarUrl = resolveAvatarUrl(cand);

              return (
                <div
                  key={cand._id || `${cId}_${cand.folderId || ''}`}
                  className="pd-saved-card"
                  onClick={() => {
                    setShowSavedProfilesSidebar(false);
                    window.open(`/employer/candidate/${cId}`, "_blank", "noopener,noreferrer");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div
                      className="pd-saved-card-avatar"
                      style={{
                        position: "relative",
                        background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${C.navy}, #1e5eff)`,
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 10,
                            display: "block",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".pd-saved-avatar-fallback");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="pd-saved-avatar-fallback"
                        style={{
                          display: avatarUrl ? "none" : "flex",
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${C.navy}, #1e5eff)`,
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {name.trim() ? name.trim().slice(0, 2).toUpperCase() : "CA"}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <h4
                          className="pd-saved-cand-name"
                          title={`View profile of ${name}`}
                          style={{ cursor: "pointer" }}
                        >
                          {name}
                        </h4>
                        {savedDate && <span className="pd-saved-card-date">{savedDate}</span>}
                      </div>

                      {(title || company) && (
                        <div className="pd-saved-cand-role">
                          {title}{title && company ? ' • ' : ''}{company}
                        </div>
                      )}

                      <div className="pd-saved-cand-meta">
                        {exp && <span>{exp}</span>}
                        {exp && city && <span>•</span>}
                        {city && <span>{city}</span>}
                        <span className="pd-saved-folder-tag" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                          <FiBookmark size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} /> Saved Profile
                        </span>
                      </div>

                      {skills.length > 0 && (
                        <div className="pd-saved-skills-wrap">
                          {skills.map((sk, idx) => (
                            <span key={idx} className="pd-saved-skill-pill">{sk}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedProfile(cId, e)}
                          title="Remove from saved profiles"
                          style={{
                            background: "none",
                            border: `1px solid ${C.s200}`,
                            borderRadius: 7,
                            padding: "5px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#dc2626",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.borderColor = C.s200;
                          }}
                        >
                          <FiTrash2 size={12} />
                          <span>Remove</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSavedProfilesSidebar(false);
                            window.open(`/employer/candidate/${cId}`, "_blank", "noopener,noreferrer");
                          }}
                          className="pd-saved-view-btn"
                        >
                          View Full Profile <FiExternalLink size={12} style={{ marginLeft: 4 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pd-saved-foot">
            <button
              type="button"
              onClick={() => {
                setShowSavedProfilesSidebar(false);
                navigate("/employer-dashboard/folders");
              }}
              className="pd-saved-foot-link"
            >
              Manage Folders & Candidates →
            </button>
          </div>
        </div>

        {/* ─── Global Employer Cart Sidebar ─── */}
        <div
          className={`pd-saved-overlay ${cartDrawerOpen ? 'show' : ''}`}
          onClick={() => setCartDrawerOpen(false)}
        />
        <div className={`pd-saved-sidebar ${cartDrawerOpen ? 'show' : ''}`}>
          {/* Header */}
          <div className="pd-saved-head">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: `${C.navy}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.navy,
              }}>
                <FiShoppingCart size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A", fontFamily: C.fd }}>
                  My Cart
                </h3>
                <span style={{ fontSize: 12, color: C.s500, fontWeight: 500 }}>
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} saved in cart
                </span>
              </div>
            </div>
            <button
              className="pd-saved-close"
              onClick={() => setCartDrawerOpen(false)}
              aria-label="Close cart"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Cart Body */}
          <div className="pd-saved-body">
            {cartItems.length === 0 ? (
              <div className="pd-saved-empty-state">
                <div className="pd-saved-empty-icon-wrap" style={{ background: "#eff6ff" }}>
                  <FiShoppingCart size={32} color={C.navy} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                  Your cart is empty
                </h4>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.5, maxWidth: 280 }}>
                  When you initiate a purchase on plans, job postings, or resume database credits, items will be saved here so you can finish anytime.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate("/buy-online");
                  }}
                  className="pd-saved-action-btn"
                >
                  <FiShoppingCart size={14} /> Explore Plans &amp; Pricing
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.s500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Items in Cart ({cartItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    style={{ background: "none", border: "none", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Clear all
                  </button>
                </div>

                {cartItems.map((item) => {
                  const itemId = item.id || item._id || item.code;
                  const itemPrice = Number(item.total ?? item.price ?? 0);
                  const isPlan = item.itemType === "PLAN";

                  return (
                    <div key={itemId} className="pd-saved-card">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                            <h4 className="pd-saved-cand-name" style={{ fontSize: 15 }}>
                              {item.name}
                            </h4>
                            <span className="pd-saved-folder-tag" style={{ background: isPlan ? "#eff6ff" : "#f0fdf4", color: isPlan ? "#1d4ed8" : "#15803d", borderColor: isPlan ? "#bfdbfe" : "#bbf7d0" }}>
                              {isPlan ? "Plan" : item.category || "Product"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.s500 }}>
                            {item.quantity > 1 && <span>Qty: <strong>{item.quantity} {item.unit || "Units"}</strong> • </span>}
                            <span>{item.validity} Days Validity</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(itemId)}
                          title="Remove item from cart"
                          style={{
                            background: "transparent", border: "none", color: C.s400,
                            cursor: "pointer", padding: 4, borderRadius: 6, display: "flex",
                            alignItems: "center", justifyContent: "center", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fee2e2"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.s400; e.currentTarget.style.background = "transparent"; }}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px dashed ${C.s200}` }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          {item.discount > 0 && item.basePrice > itemPrice && (
                            <span style={{ fontSize: 12, color: C.s400, textDecoration: "line-through" }}>
                              ₹{Number(item.basePrice).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontFamily: C.fd }}>
                            {itemPrice === 0 ? "Free" : `₹${itemPrice.toLocaleString("en-IN")}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCartDrawerOpen(false);
                            navigate(`/buy-online?resume_cart=true&checkout_item=${encodeURIComponent(itemId)}`);
                          }}
                          style={{
                            background: C.navy, color: "#fff", border: "none",
                            padding: "6px 12px", borderRadius: 8, fontSize: 12,
                            fontWeight: 700, cursor: "pointer", display: "inline-flex",
                            alignItems: "center", gap: 4, transition: "opacity 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Complete Purchase <FiArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pd-saved-foot" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: C.s600 }}>
              <span>Total ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})</span>
              <strong style={{ fontSize: 17, color: "#0F172A", fontFamily: C.fd }}>
                ₹{cartTotals.total.toLocaleString("en-IN")}
              </strong>
            </div>
            {cartTotals.taxTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.s400 }}>
                <span>Includes GST / Taxes</span>
                <span>₹{cartTotals.taxTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => {
                setCartDrawerOpen(false);
                const first = cartItems[0];
                if (first) {
                  navigate(`/buy-online?resume_cart=true&checkout_item=${encodeURIComponent(first.id || first._id || first.code)}`);
                } else {
                  navigate("/buy-online");
                }
              }}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 10,
                border: "none", background: cartItems.length > 0 ? C.navy : C.s300,
                color: "#ffffff", fontSize: 13.5, fontWeight: 700,
                cursor: cartItems.length > 0 ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: cartItems.length > 0 ? "0 4px 14px rgba(0,35,102,0.2)" : "none"
              }}
            >
              {cartItems.length > 0 ? (
                <>Proceed to Checkout ({cartItems.length}) <FiArrowRight size={14} /></>
              ) : (
                <>Explore Plans &amp; Pricing <FiArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>

        <style>{`
          /* ─── Global Saved Profiles Sidebar & Popover ─── */
          .pd-saved-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 35, 102, 0.35);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 100000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
          }
          .pd-saved-overlay.show {
            opacity: 1;
            visibility: visible;
          }
          .pd-saved-sidebar {
            position: fixed;
            top: 0;
            right: -440px;
            left: auto !important;
            width: 440px;
            max-width: 94vw;
            height: 100vh;
            background: #ffffff;
            z-index: 100001;
            box-shadow: -14px 0 45px rgba(0, 35, 102, 0.14);
            display: flex;
            flex-direction: column;
            transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pd-saved-sidebar.show {
            right: 0 !important;
            left: auto !important;
          }
          .pd-saved-head {
            padding: 18px 22px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid ${C.s200};
            background: #ffffff;
          }
          .pd-saved-close {
            background: ${C.s100};
            border: none;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${C.s500};
            cursor: pointer;
            transition: all 0.2s;
          }
          .pd-saved-close:hover {
            background: #FEE2E2;
            color: #ef4444;
            transform: rotate(90deg);
          }
          .pd-saved-filter-bar {
            padding: 12px 18px;
            border-bottom: 1px solid ${C.s100};
            background: #f8fafc;
          }
          .pd-saved-search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #ffffff;
            border: 1px solid ${C.s200};
            border-radius: 8px;
            padding: 7px 12px;
            transition: border-color 0.15s;
          }
          .pd-saved-search-box:focus-within {
            border-color: ${C.navy};
            box-shadow: 0 0 0 2px ${C.navy}15;
          }
          .pd-saved-search-input {
            border: none;
            outline: none;
            font-size: 13px;
            color: #0f172a;
            width: 100%;
            background: transparent;
            font-family: inherit;
          }
          .pd-saved-search-input::placeholder {
            color: #94a3b8;
          }
          .pd-saved-search-clear {
            border: none;
            background: none;
            cursor: pointer;
            color: #94a3b8;
            padding: 0;
            display: flex;
            align-items: center;
          }
          .pd-saved-search-clear:hover {
            color: #0f172a;
          }
          .pd-saved-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f8fafc;
          }
          .pd-saved-card {
            background: #ffffff;
            border: 1px solid ${C.s200};
            border-radius: 12px;
            padding: 14px 16px;
            transition: all 0.16s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .pd-saved-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 6px 16px rgba(0, 35, 102, 0.06);
            transform: translateY(-1px);
          }
          .pd-saved-card-avatar {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, ${C.navy}, #1e5eff);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
            overflow: hidden;
          }
          .pd-saved-cand-name {
            margin: 0;
            font-size: 14.5px;
            font-weight: 700;
            color: #0f172a;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .pd-saved-card-date {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
            flex-shrink: 0;
          }
          .pd-saved-cand-role {
            font-size: 12.5px;
            color: #475569;
            margin-top: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
          }
          .pd-saved-cand-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 6px;
            font-size: 11.5px;
            color: #64748b;
            flex-wrap: wrap;
          }
          .pd-saved-folder-tag {
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10.5px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .pd-saved-skills-wrap {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
          }
          .pd-saved-skill-pill {
            background: #f1f5f9;
            color: #334155;
            font-size: 10.5px;
            padding: 2px 7px;
            border-radius: 5px;
            font-weight: 500;
          }
          .pd-saved-view-btn {
            background: none;
            border: none;
            color: ${C.navy};
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            padding: 4px 6px;
            border-radius: 6px;
            transition: all 0.14s;
          }
          .pd-saved-view-btn:hover {
            background: #eff6ff;
            text-decoration: underline;
          }
          .pd-saved-empty-state {
            padding: 50px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .pd-saved-empty-icon-wrap {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: #eff6ff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
          }
          .pd-saved-action-btn {
            background: ${C.navy};
            color: #ffffff;
            border: none;
            padding: 9px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: opacity 0.15s;
          }
          .pd-saved-action-btn:hover {
            opacity: 0.9;
          }
          .pd-saved-foot {
            padding: 14px 20px;
            border-top: 1px solid ${C.s200};
            background: #ffffff;
            text-align: center;
          }
          .pd-saved-foot-link {
            background: none;
            border: none;
            color: ${C.navy};
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }
          .pd-saved-foot-link:hover {
            text-decoration: underline;
          }
          .pd-saved-spinner {
            width: 26px;
            height: 26px;
            border: 3px solid #e2e8f0;
            border-top-color: ${C.navy};
            border-radius: 50%;
            margin: 0 auto;
            animation: spin 0.8s linear infinite;
          }

          /* ─── Header Recent Searches Popover ─── */
          .ep-header-recent-searches-popover {
            position: absolute;
            top: calc(100% + 8px);
            right: -40px;
            width: 320px;
            max-width: 90vw;
            background: #ffffff;
            border: 1px solid ${C.s200};
            border-radius: 14px;
            box-shadow: 0 16px 36px rgba(0, 35, 102, 0.12), 0 3px 8px rgba(0, 0, 0, 0.04);
            z-index: 100000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: fadeInDown 0.18s ease-out;
          }
          .ep-popover-head {
            padding: 12px 16px;
            border-bottom: 1px solid ${C.s100};
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #fafbfc;
          }
          .ep-popover-clear-btn {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 4px;
          }
          .ep-popover-clear-btn:hover {
            color: #dc2626;
            text-decoration: underline;
          }
          .ep-popover-list {
            max-height: 280px;
            overflow-y: auto;
            padding: 6px;
          }
          .ep-popover-item {
            padding: 9px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.14s;
          }
          .ep-popover-item:hover {
            background: #f1f5f9;
          }
          .ep-popover-item-text {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .ep-popover-item-badge {
            font-size: 10px;
            font-weight: 700;
            color: ${C.navy};
            background: #eff6ff;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
            margin-left: 8px;
            flex-shrink: 0;
          }
          .ep-popover-foot {
            padding: 10px 16px;
            border-top: 1px solid ${C.s100};
            background: #fafbfc;
            text-align: center;
          }
          .ep-popover-foot-link {
            background: none;
            border: none;
            color: ${C.navy};
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }
          .ep-popover-foot-link:hover {
            text-decoration: underline;
          }
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .pd-notif-overlay { position: fixed; inset: 0; background: rgba(0, 35, 102, 0.35); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 100000; opacity: 0; visibility: hidden; transition: all 0.3s; }
          .pd-notif-overlay.show { opacity: 1; visibility: visible; }
          .pd-notif-sidebar { position: fixed; top: 0; right: -420px; left: auto !important; width: 420px; max-width: 92vw; height: 100vh; background: white; z-index: 100001; box-shadow: -12px 0 40px rgba(0, 35, 102, 0.12); display: flex; flex-direction: column; transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
          .pd-notif-sidebar.show { right: 0 !important; left: auto !important; }
          .pd-notif-head { padding: 18px 22px 14px; display: flex; align-items: center; justify-content: space-between; }
          .pd-notif-head h3 { font-family: ${C.fd}; font-size: 19px; font-weight: 800; color: #0F172A; margin:0;}
          .pd-notif-close { background: ${C.s100}; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.s500}; cursor: pointer; transition: all 0.2s; }
          .pd-notif-close:hover { background: #FEE2E2; color: #ef4444; transform: rotate(90deg); }
          
          /* Notification Tabs */
          .pd-notif-tabs-bar {
            display: flex;
            align-items: center;
            border-bottom: 1px solid ${C.s200};
            padding: 0 16px;
            gap: 20px;
          }
          .pd-notif-tab-btn {
            position: relative;
            background: none;
            border: none;
            padding: 10px 4px 12px;
            font-size: 14px;
            font-weight: 500;
            color: #64748B;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: 'DM Sans', sans-serif;
            transition: color 0.15s ease;
          }
          .pd-notif-tab-btn:hover {
            color: #0F172A;
          }
          .pd-notif-tab-btn.active {
            color: #2563EB;
            font-weight: 700;
          }
          .pd-notif-tab-indicator {
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 3px;
            background: #2563EB;
            border-radius: 3px 3px 0 0;
          }
          .pd-notif-tab-badge {
            background: #EFF6FF;
            color: #2563EB;
            font-size: 11px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 10px;
            border: 1px solid #DBEAFE;
          }
          .pd-notif-mark-read {
            background: transparent;
            border: none;
            color: #2563EB;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.15s;
          }
          .pd-notif-mark-read:hover {
            background: #EFF6FF;
          }

          .pd-notif-body { flex: 1; overflow-y: auto; padding: 14px 0; }
          .pd-notif-date { padding: 0 24px 10px; font-size: 11.5px; font-weight: 800; color: ${C.s400}; letter-spacing: 0.08em; text-transform: uppercase; }
          .pd-notif-item { display: flex; gap: 14px; padding: 14px 22px; border-bottom: 1px solid ${C.s100}; cursor: pointer; transition: background 0.15s; }
          .pd-notif-item:hover { background: ${C.s50}; }
          .pd-notif-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
          .pd-notif-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
          .pd-notif-title { font-size: 13.5px; font-weight: 600; line-height: 1.4; color: ${C.s800}; }
          .pd-notif-desc { font-size: 12px; color: ${C.s500}; }
          .pd-notif-time { font-size: 11px; color: ${C.s400}; margin-top: 2px; }

          /* Empty State */
          .pd-notif-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            text-align: center;
          }
          .pd-empty-title {
            font-size: 16px;
            font-weight: 700;
            color: #1E293B;
            margin: 14px 0 6px;
            font-family: 'DM Sans', sans-serif;
          }
          .pd-empty-sub {
            font-size: 12.5px;
            color: #64748B;
            max-width: 260px;
            line-height: 1.5;
            margin: 0 0 16px;
          }
          .pd-empty-action-btn {
            background: #002366;
            color: #ffffff;
            border: none;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .pd-empty-action-btn:hover {
            background: #001948;
            transform: translateY(-1px);
          }

          /* Reminder Card */
          .pd-rem-card {
            margin: 0 16px 12px;
            padding: 13px 15px;
            background: #ffffff;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
            transition: all 0.16s ease;
          }
          .pd-rem-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 4px 14px rgba(0, 35, 102, 0.07);
          }
          .pd-rem-head-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
          }
          .pd-rem-type-pill {
            background: #EFF6FF;
            color: #1D4ED8;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            letter-spacing: 0.02em;
          }
          .pd-rem-time-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11.5px;
            color: #D97706;
            font-weight: 600;
            margin-right: auto;
          }
          .pd-rem-delete-btn {
            background: transparent;
            border: none;
            color: #94A3B8;
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
          }
          .pd-rem-delete-btn:hover {
            background: #FEE2E2;
            color: #EF4444;
          }
          .pd-rem-candidate-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            background: #F8FAFC;
            border: 1px solid #EEF2F6;
            border-radius: 9px;
            margin-bottom: 9px;
            transition: all 0.15s ease;
            cursor: pointer;
          }
          .pd-rem-candidate-row:hover {
            background: #EFF6FF;
            border-color: #BFDBFE;
          }
          .pd-rem-avatar {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            background: #E0E7FF;
            color: #3730A3;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
            font-weight: 700;
            font-size: 13px;
          }
          .pd-rem-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .pd-rem-avatar-initials {
            font-weight: 800;
            font-size: 13px;
            color: #1E3A8A;
          }
          .pd-rem-cand-info {
            flex: 1;
            min-width: 0;
          }
          .pd-rem-cand-name-wrap {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            max-width: 100%;
          }
          .pd-rem-cand-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #002366;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.15s ease;
          }
          .pd-rem-candidate-row:hover .pd-rem-cand-name {
            color: #2563EB;
            text-decoration: underline;
          }
          .pd-rem-cand-ext-icon {
            color: #94A3B8;
            flex-shrink: 0;
            transition: color 0.15s ease, transform 0.15s ease;
          }
          .pd-rem-candidate-row:hover .pd-rem-cand-ext-icon {
            color: #2563EB;
            transform: translate(1px, -1px);
          }
          .pd-rem-cand-title {
            font-size: 11.5px;
            color: #64748B;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 1px;
          }
          .pd-rem-desc {
            font-size: 12.5px;
            color: #334155;
            line-height: 1.45;
            margin-bottom: 10px;
            padding: 6px 10px;
            background: #F8FAFC;
            border-left: 2.5px solid #002366;
            border-radius: 0 6px 6px 0;
            font-style: italic;
          }
          .pd-rem-footer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 7px;
            border-top: 1px dashed #E2E8F0;
          }
          .pd-rem-status-tag {
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .pd-rem-status-tag.pending {
            color: #D97706;
          }
          .pd-rem-status-tag.sent {
            color: #10B981;
          }
          .pd-rem-view-cand-btn {
            background: #EFF6FF;
            border: 1px solid #DBEAFE;
            color: #002366;
            font-size: 11.5px;
            font-weight: 700;
            cursor: pointer;
            padding: 4px 9px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            transition: all 0.15s ease;
          }
          .pd-rem-view-cand-btn:hover {
            background: #002366;
            border-color: #002366;
            color: #ffffff;
            transform: translateY(-1px);
          }

          .ep-nav-link {
            padding: 18px 14px; font-size: 13px; font-weight: 600; color: ${C.s500};
            cursor: pointer; border: none; background: none; border-bottom: 2.5px solid transparent;
            transition: all .16s; white-space: nowrap; font-family: 'DM Sans', sans-serif;
            display: inline-flex; align-items: center; gap: 6px;
          }
          .ep-nav-link:hover { color: ${C.navy}; }
          .ep-nav-link.active { color: ${C.navy}; border-bottom-color: ${C.navy}; font-weight: 700; }
          
          @media (max-width: 1024px) {
            .ep-nav-desktop { display: none !important; }
            .ep-profile-desktop { display: none !important; }
            .ep-login-desktop { display: none !important; }
            .ep-header-recent-wrap { display: none !important; }
            .ep-header-recent-btn { display: none !important; }
            .ep-header-saved-btn { display: none !important; }
            .ep-header-sub-btn { display: none !important; }
            .ep-header-cart-btn { display: none !important; }
            .ep-header-notif-btn { display: none !important; }
            .ep-hamburger {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 36px !important;
              height: 36px !important;
              min-width: 36px !important;
              max-width: 36px !important;
              flex: 0 0 36px !important;
              border-radius: 9px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            .ep-header-msg-btn {
              width: 36px !important;
              height: 36px !important;
              padding: 0 !important;
              border-radius: 9px !important;
              background: ${C.s50} !important;
              border: 1px solid ${C.s200} !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .ep-header-msg-btn:hover {
              border-color: rgba(0, 35, 102, 0.2) !important;
              color: ${C.navy} !important;
            }
            .ep-msg-text { display: none !important; }
            .ep-msg-sep { display: none !important; }

            .ep-header-inner {
              padding: 0 14px !important;
              height: 56px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 8px !important;
              box-sizing: border-box !important;
            }
            .ep-header-logo-btn {
              margin-right: 0 !important;
              flex: 0 0 auto !important;
            }
            .ep-header-logo-img {
              height: 24px !important;
              width: auto !important;
              max-width: 120px !important;
            }
            .ep-topbar-actions {
              display: flex !important;
              align-items: center !important;
              gap: 0 !important;
              margin-left: 0 !important;
              flex: 0 0 auto !important;
              width: auto !important;
              padding: 0 !important;
            }
            .ep-topbar-actions button {
              flex: 0 0 auto !important;
            }
          }
          
          /* Mobile Sidebar Drawer */
          .ep-mob-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 100000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }
          .ep-mob-sidebar-overlay.show {
            opacity: 1;
            visibility: visible;
          }

          .ep-mob-sidebar {
            position: fixed;
            top: 0;
            left: -360px;
            width: 320px;
            max-width: 86vw;
            height: 100vh;
            background: #ffffff;
            z-index: 100001;
            box-shadow: 10px 0 35px rgba(0, 35, 102, 0.14);
            display: flex;
            flex-direction: column;
            transition: left 0.32s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'DM Sans', sans-serif;
          }
          .ep-mob-sidebar.show {
            left: 0;
          }

          /* Mobile Sidebar Quick Action Grid */
          .ep-mob-quick-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            padding: 12px 14px 10px;
            background: #f8fafc;
            border-bottom: 1px solid ${C.s200};
            flex-shrink: 0;
          }
          .ep-mob-quick-tile {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
            font-family: 'DM Sans', sans-serif;
            min-width: 0;
          }
          .ep-mob-quick-tile:hover, .ep-mob-quick-tile:active {
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateY(-1px);
          }
          .ep-mob-quick-tile-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            position: relative;
          }
          .ep-mob-quick-tile-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            border-radius: 8px;
            background: #ef4444;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #ffffff;
            line-height: 1;
          }
          .ep-mob-quick-tile-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex: 1;
          }
          .ep-mob-quick-tile-title {
            font-size: 12.5px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ep-mob-quick-tile-sub {
            font-size: 10.5px;
            color: #64748b;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ep-mob-nav-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 11px 14px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: #334155;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-align: left;
            transition: all 0.14s ease;
            font-family: 'DM Sans', sans-serif;
          }
          .ep-mob-nav-btn:hover {
            background: #f1f5f9;
            color: #002366;
          }
          .ep-mob-nav-btn.active {
            background: rgba(0, 35, 102, 0.08);
            color: #002366;
            font-weight: 700;
          }

          .ep-mob-accordion-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 11px 14px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: #334155;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-align: left;
            transition: all 0.14s ease;
            font-family: 'DM Sans', sans-serif;
          }
          .ep-mob-accordion-btn:hover {
            background: #f1f5f9;
            color: #002366;
          }
          .ep-mob-accordion-btn.open {
            color: #002366;
          }

          .ep-mob-sublist {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding-left: 36px;
            padding-right: 6px;
            margin-top: 2px;
            margin-bottom: 6px;
            animation: epSlideDown 0.18s ease-out;
          }

          .ep-mob-subbtn {
            display: block;
            width: 100%;
            padding: 8px 12px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: all 0.14s ease;
            font-family: 'DM Sans', sans-serif;
          }
          .ep-mob-subbtn:hover {
            background: #f1f5f9;
            color: #002366;
            font-weight: 600;
          }
          .ep-mob-subbtn.active {
            background: #e0f2fe;
            color: #0284c7;
            font-weight: 600;
          }

          .ep-mob-logout-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 11px 14px;
            border-radius: 10px;
            border: 1px solid #fecaca;
            background: #fff5f5;
            color: #dc2626;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'DM Sans', sans-serif;
          }
          .ep-mob-logout-btn:hover {
            background: #fee2e2;
            border-color: #fca5a5;
            transform: translateY(-1px);
          }

          @keyframes epSlideDown {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .ep-profile-sidebar-backdrop {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            display: flex;
            justify-content: flex-start;
          }

          .ep-profile-sidebar-panel {
            width: 100%;
            max-width: 340px;
            height: 100vh;
            background: #ffffff;
            box-shadow: 8px 0 32px rgba(15, 23, 42, 0.16);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            animation: epSlideRight 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }

          /* Full screen / Desktop: Open Profile Sidebar on the RIGHT side */
          @media (min-width: 1024px) {
            .ep-profile-sidebar-backdrop {
              justify-content: flex-end;
            }
            .ep-profile-sidebar-panel {
              box-shadow: -8px 0 32px rgba(15, 23, 42, 0.16);
              border-left: 1px solid #e2e8f0;
              border-right: none;
              animation: epSlideLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            }
          }

          @keyframes epSlideRight {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }

          @keyframes epSlideLeft {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }

          .ep-sidebar-btn:hover {
            background: #f1f5f9 !important;
            color: #002366 !important;
          }

          .ep-sidebar-subbtn:hover {
            background: #f1f5f9 !important;
            color: #002366 !important;
            font-weight: 600 !important;
          }

          /* Compact Search Trigger */
          .ep-header-search-compact {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            height: 36px;
            padding: 0 12px;
            cursor: pointer;
            transition: all 0.18s ease;
            user-select: none;
            max-width: 250px;
            min-width: 170px;
            margin-right: 14px;
            flex-shrink: 1;
          }

          .ep-header-search-compact:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            box-shadow: 0 2px 8px rgba(0, 35, 102, 0.05);
          }

          .ep-compact-search-placeholder {
            font-size: 12px;
            font-weight: 500;
            color: #94a3b8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            font-family: 'DM Sans', sans-serif;
          }

          .ep-compact-search-badge {
            font-size: 10px;
            font-weight: 700;
            background: rgba(0, 35, 102, 0.08);
            color: #002366;
            padding: 2px 6px;
            border-radius: 5px;
            letter-spacing: 0.02em;
            flex-shrink: 0;
          }

          /* Expanded Search Row on Y-axis */
          .ep-header-search-expanded-row {
            border-top: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            animation: epSearchExpand 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 6px 20px rgba(0, 35, 102, 0.06);
          }

          @keyframes epSearchExpand {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ep-header-search-expanded-inner {
            max-width: 1160px;
            margin: 0 auto;
            padding: 10px 20px;
          }

          .ep-header-search-form {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
          }

          .ep-search-input-field-wrap {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 1.5px solid #002366;
            box-shadow: 0 0 0 3px rgba(0, 35, 102, 0.08);
            border-radius: 12px;
            padding: 0 14px;
            height: 44px;
            transition: all 0.16s ease;
          }

          .ep-search-field-icon {
            color: #002366;
            flex-shrink: 0;
            margin-right: 10px;
          }

          .ep-search-field-input {
            width: 100%;
            border: none;
            background: transparent;
            outline: none;
            font-size: 13.5px;
            font-weight: 500;
            color: #0f172a;
            font-family: 'DM Sans', sans-serif;
          }

          .ep-search-field-input::placeholder {
            color: #94a3b8;
          }

          .ep-search-field-clear {
            background: #f1f5f9;
            border: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            cursor: pointer;
            padding: 0;
            transition: all 0.14s ease;
            flex-shrink: 0;
          }

          .ep-search-field-clear:hover {
            background: #e2e8f0;
            color: #0f172a;
          }

          .ep-search-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 44px;
            padding: 0 20px;
            border-radius: 12px;
            border: none;
            background: #002366;
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 700;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0, 35, 102, 0.2);
            transition: all 0.16s ease;
            flex-shrink: 0;
            white-space: nowrap;
          }

          .ep-search-action-btn:hover {
            background: #001948;
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(0, 35, 102, 0.28);
          }

          .ep-search-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
            background: #002366;
          }

          .ep-search-close-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 44px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #64748b;
            cursor: pointer;
            transition: all 0.14s ease;
            flex-shrink: 0;
          }

          .ep-search-close-action-btn:hover {
            background: #fee2e2;
            color: #ef4444;
            border-color: #fca5a5;
          }

          /* Recent Searches Dropdown on Input Box */
          .ep-search-recent-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            right: 0;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 12px 32px rgba(0, 35, 102, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
            z-index: 350;
            overflow: hidden;
            animation: epDropdownFade 0.16s ease-out;
          }

          @keyframes epDropdownFade {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ep-search-recent-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: #f8fafc;
            border-bottom: 1px solid #f1f5f9;
          }

          .ep-search-recent-header-icon {
            color: #64748b;
          }

          .ep-search-recent-header-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-family: 'DM Sans', sans-serif;
          }

          .ep-search-recent-list {
            padding: 4px 0;
          }

          .ep-search-recent-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 14px;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
          }

          .ep-search-recent-item:hover {
            background: #f1f5f9;
          }

          .ep-search-recent-item-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            flex: 1;
          }

          .ep-search-recent-item-icon {
            color: #94a3b8;
            flex-shrink: 0;
            transition: color 0.15s ease;
          }

          .ep-search-recent-item:hover .ep-search-recent-item-icon {
            color: #002366;
          }

          .ep-search-recent-item-text {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'DM Sans', sans-serif;
          }

          .ep-search-recent-item:hover .ep-search-recent-item-text {
            color: #002366;
          }

          .ep-search-recent-item-badge {
            font-size: 10.5px;
            font-weight: 600;
            color: #94a3b8;
            background: #f1f5f9;
            padding: 2px 7px;
            border-radius: 4px;
            margin-left: 8px;
            flex-shrink: 0;
          }

          .ep-search-recent-item:hover .ep-search-recent-item-badge {
            background: #e2e8f0;
            color: #002366;
          }

          .ep-search-recent-item.active {
            background: #eff6ff;
          }

          .ep-search-recent-item.active .ep-search-recent-item-icon {
            color: #002366;
          }

          .ep-search-recent-item.active .ep-search-recent-item-text {
            color: #002366;
          }

          .ep-search-recent-item.active .ep-search-recent-item-badge {
            background: #dbeafe;
            color: #002366;
          }

          @media (max-width: 1024px) {
            .ep-header-search-compact {
              display: flex !important;
              align-items: center !important;
              flex: 1 1 auto !important;
              max-width: none !important;
              min-width: 0 !important;
              height: 36px !important;
              padding: 0 10px !important;
              margin: 0 !important;
              border-radius: 9px !important;
              box-sizing: border-box !important;
            }
            .ep-compact-search-badge {
              display: none !important;
            }
            .ep-header-search-expanded-inner {
              padding: 8px 14px !important;
            }
          }

          @media (max-width: 640px) {
            .ep-header-inner {
              padding: 0 10px !important;
              height: 52px !important;
              gap: 6px !important;
            }
            .ep-header-logo-btn {
              margin-right: 0 !important;
              flex: 0 0 auto !important;
            }
            .ep-header-logo-img {
              height: 22px !important;
              max-width: 105px !important;
            }
            .ep-header-search-compact {
              display: flex !important;
              align-items: center !important;
              flex: 1 1 auto !important;
              max-width: none !important;
              min-width: 0 !important;
              height: 34px !important;
              padding: 0 8px !important;
              gap: 6px !important;
              margin: 0 !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
            }
            .ep-compact-search-placeholder {
              font-size: 11.5px !important;
            }
            .ep-hamburger {
              width: 34px !important;
              height: 34px !important;
              min-width: 34px !important;
              max-width: 34px !important;
              flex: 0 0 34px !important;
              border-radius: 8px !important;
            }
            .ep-header-search-expanded-inner {
              padding: 8px 10px !important;
            }
            .ep-search-input-field-wrap {
              height: 38px !important;
              padding: 0 10px !important;
            }
            .ep-search-field-input {
              font-size: 12.5px !important;
            }
            .ep-search-action-btn {
              height: 38px !important;
              padding: 0 12px !important;
              font-size: 12px !important;
            }
            .ep-search-close-action-btn {
              width: 34px !important;
              height: 38px !important;
            }
          }

          @media (max-width: 380px) {
            .ep-header-inner {
              padding: 0 8px !important;
              gap: 5px !important;
            }
            .ep-header-logo-img {
              height: 20px !important;
              max-width: 88px !important;
            }
            .ep-header-search-compact {
              height: 32px !important;
              padding: 0 6px !important;
              gap: 5px !important;
              border-radius: 7px !important;
            }
            .ep-compact-search-placeholder {
              font-size: 10.5px !important;
            }
            .ep-hamburger {
              width: 32px !important;
              height: 32px !important;
              min-width: 32px !important;
              max-width: 32px !important;
              flex: 0 0 32px !important;
              border-radius: 7px !important;
            }
            .ep-mob-quick-grid {
              gap: 6px !important;
              padding: 10px 10px 8px !important;
            }
            .ep-mob-quick-tile {
              padding: 8px 8px !important;
              gap: 8px !important;
            }
            .ep-mob-quick-tile-title {
              font-size: 11.5px !important;
            }
            .ep-mob-quick-tile-sub {
              font-size: 9.5px !important;
            }
          }
        `}</style>
      </header>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100005,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => {
            setShowChangePassword(false);
            setCpMsg(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 18,
              maxWidth: 420,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px 24px 22px",
              boxShadow: "0 20px 48px rgba(15, 23, 42, 0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                setShowChangePassword(false);
                setCpMsg(null);
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FiX size={16} />
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Change Password
            </h2>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 18px" }}>
              Enter your current password and choose a new secure password.
            </p>

            {cpMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 14,
                  background: cpMsg.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: cpMsg.type === "success" ? "#15803d" : "#b91c1c",
                  border: `1px solid ${cpMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                {cpMsg.text}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCpMsg(null);
                if (!cpCurrent) {
                  setCpMsg({ type: "error", text: "Please enter your current password." });
                  return;
                }
                if (cpNew.length < 6) {
                  setCpMsg({ type: "error", text: "New password must be at least 6 characters." });
                  return;
                }
                if (cpNew !== cpConfirm) {
                  setCpMsg({ type: "error", text: "New passwords do not match." });
                  return;
                }
                setCpLoading(true);
                try {
                  await authService.employerChangePassword(cpCurrent, cpNew);
                  setCpMsg({ type: "success", text: "Password updated successfully!" });
                  setTimeout(() => {
                    setShowChangePassword(false);
                    setCpCurrent("");
                    setCpNew("");
                    setCpConfirm("");
                    setCpMsg(null);
                  }, 1200);
                } catch (err) {
                  setCpMsg({ type: "error", text: err?.message || "Failed to change password." });
                } finally {
                  setCpLoading(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Current Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCpCurrent ? "text" : "password"}
                    required
                    value={cpCurrent}
                    onChange={(e) => setCpCurrent(e.target.value)}
                    placeholder="Enter current password"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.s300}`,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpCurrent(!showCpCurrent)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      padding: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showCpCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCpNew ? "text" : "password"}
                    required
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.s300}`,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpNew(!showCpNew)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      padding: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showCpNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCpConfirm ? "text" : "password"}
                    required
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.s300}`,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpConfirm(!showCpConfirm)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      padding: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showCpConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCpMsg(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.s300}`,
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cpLoading}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: C.navy,
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: cpLoading ? 0.7 : 1,
                  }}
                >
                  {cpLoading ? "Updating..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100005,
          background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24
        }} onClick={() => setShowLogoutConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
            maxWidth: 400, width: "100%",
            padding: "36px 32px 28px",
            textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(239,68,68,0.12)"
            }}>
              <FiLogOut size={26} color="#DC2626" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              Logout from Maven Jobs
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14.5, color: "#475569", fontWeight: 500, lineHeight: 1.5 }}>
              Are you sure you want to log out of your Maven Jobs account?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "11px 24px", borderRadius: 12, border: `1.5px solid #E2E8F0`,
                  background: "#fff", color: "#475569", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: C.dm, transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAction}
                style={{
                  padding: "11px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: C.dm,
                  boxShadow: "0 6px 20px rgba(220,38,38,0.25)",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 10px 28px rgba(220,38,38,0.35)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(220,38,38,0.25)";
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </>
  );
}
