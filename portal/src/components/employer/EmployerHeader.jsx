import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiTrendingUp, FiMessageSquare, FiBell,
  FiChevronDown, FiChevronUp, FiSearch, FiGrid, FiSend, FiLogOut,
  FiBarChart2, FiUsers, FiStar, FiFolder, FiFileText,
  FiMenu, FiX, FiDollarSign, FiShoppingCart, FiSettings, FiList, FiCheck
} from 'react-icons/fi';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';
import authService from '../../services/authService';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditData, setCreditData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [employerNotifications, setEmployerNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState("");
  const profileBtnRef = useRef(null);
  const profileSidebarRef = useRef(null);
  const dropdownRefs = useRef({});
  const employerToken = localStorage.getItem("employerToken");
  const isEmployerLoggedIn = !!employerToken && employerToken !== "undefined";

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
    if (!isEmployerLoggedIn) return;
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

  const displayEmail =
    user?.email ||
    dashboardUser?.email ||
    sessionUser?.email ||
    company?.email ||
    dashboardCompany?.email ||
    "";

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
    if (!localStorage.getItem("employerToken")) navigate("/employer-login");
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
    return () => window.removeEventListener("employer-credits-changed", handler);
  }, [refreshCredits]);

  const loadNotifications = useCallback(async () => {
    if (!isEmployerLoggedIn) return;
    try {
      setNotificationsLoading(true);
      setNotificationsError("");
      const resp = await authService.getEmployerNotifications();
      const list = resp?.data?.notifications || resp?.data || resp?.notifications || resp || [];
      setEmployerNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      setNotificationsError((err?.message || err?.error || "Failed to load notifications").toString());
    } finally {
      setNotificationsLoading(false);
    }
  }, [isEmployerLoggedIn]);

  useEffect(() => {
    if (isEmployerLoggedIn) {
      loadNotifications();
    }
  }, [isEmployerLoggedIn, loadNotifications]);

  useEffect(() => {
    if (showNotifications && isEmployerLoggedIn) {
      loadNotifications();
    }
  }, [showNotifications, isEmployerLoggedIn, loadNotifications]);

  const unreadNotificationsCount = employerNotifications.filter(
    (n) => String(n?.status || "").toUpperCase() !== "READ"
  ).length;

  useEffect(() => {
    if (!showProfileSidebar && !openDropdown && !showNotifications) return;
    const handler = (e) => {
      if (openDropdown) {
        const dd = dropdownRefs.current[openDropdown];
        if (dd && !dd.contains(e.target)) setOpenDropdown(null);
      }
      if (e.key === 'Escape') {
        setShowProfileSidebar(false);
        setShowNotifications(false);
        setOpenDropdown(null);
        setShowChangePassword(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [showProfileSidebar, openDropdown, showNotifications]);

  useEffect(() => {
    if (showProfileSidebar || showNotifications) {
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
  }, [showProfileSidebar, showNotifications]);

  const handleNavClick = useCallback((tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
    } else {
      if (tabId === "home") {
        navigate(localStorage.getItem("employerToken") ? "/employer-dashboard" : "/employer-login");
      } else if (tabId === "analysis") {
        navigate("/employer-dashboard/analytics");
      } else if (tabId === "jobs") {
        navigate("/post-job");
      }
    }
  }, [onNavigate, navigate]);

  const handleLogoutAction = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("employerToken");
      localStorage.removeItem("candidateToken");
      localStorage.removeItem("token");
      localStorage.removeItem("employerUser");
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
      pathname.startsWith('/resdex') ||
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
      pathname.includes('/manage-users') ||
      pathname.includes('/manage-quota') ||
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
        { label: "Search Resumes",     path: "/resdex" },
        { label: "Send MIvite",         path: "/resdex?tab=mivites" },
        { label: "Manage Searches",    path: "/manage-search" },
        { label: "Folders",            path: "/employer-dashboard/folders" },
        { label: "Resdex Requirements",path: "#" },
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
    { label: "Resdex",  icon: FiSearch, path: "/resdex" },
    { label: "Database", icon: FiGrid,   path: "/resdex" },
    { label: "Mivites", icon: FiSend,   path: "#" },
    { label: "Pricing & Credits", icon: FiDollarSign, path: "/employer-dashboard/pricing" },
  ];

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 200, background: "#fff",
        borderBottom: `1px solid ${C.s200}`,
        boxShadow: scrolled ? "0 4px 24px rgba(0,35,102,.08)" : "none",
        transition: "box-shadow .25s"
      }}>
        <div style={{
          maxWidth: 1160, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", gap: 0, height: 58
        }}>
          <button type="button" onClick={() => navigate(localStorage.getItem("employerToken") ? "/employer-dashboard" : "/employer-login")}
            aria-label="Go to employer dashboard"
            style={{
              display: "flex", alignItems: "center", marginRight: 28, flexShrink: 0,
              border: "none", background: "transparent", padding: 0, cursor: "pointer"
            }}
          >
            <img src={mavenLogo} alt="MavenJobs" style={{ height: 26, width: "auto" }} />
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

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="ep-hamburger"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 8, color: C.s600, marginLeft: 'auto'
            }}
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {location?.pathname === "/employer-dashboard" && (
              <>
                <button onClick={onMessagesClick}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    padding: "6px 12px", borderRadius: 10, background: "transparent",
                    border: "none", cursor: "pointer", color: C.s500, position: "relative",
                    transition: "all .16s", fontSize: 11, fontWeight: 600
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.color = C.navy; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.s500; }}
                >
                  <div style={{ position: "relative" }}>
                    <FiMessageSquare size={17} />
                  </div>
                  Messages
                </button>

                <div style={{ width: 1, height: 30, background: C.s200 }} />
              </>
            )}

            <button
              type="button"
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
                position: "relative", transition: "all .16s"
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
            <div style={{ position: "relative" }}>
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

              {/* Right-side Sliding Profile Sidebar */}
              {showProfileSidebar && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 99999,
                    background: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                  onClick={() => setShowProfileSidebar(false)}
                >
                  <div
                    ref={profileSidebarRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      maxWidth: 340,
                      height: "100vh",
                      background: "#ffffff",
                      boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.16)",
                      display: "flex",
                      flexDirection: "column",
                      overflowY: "auto",
                      animation: "epSlideLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
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
                    {creditData && (
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
                    )}

                    {/* Navigation Items */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                      {/* 1. Company Profile */}
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

                      {/* 2. My Subscriptions */}
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
                        <FiList size={18} color="#64748b" />
                        <span>My Subscriptions</span>
                      </button>

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
                                navigate("/employer-dashboard");
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
                              Product Settings
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileSidebar(false);
                                navigate("/manage-users");
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
                                navigate("/manage-quota");
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

              {/* Change Password Modal */}
              {showChangePassword && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 100001,
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
                      onSubmit={(e) => {
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
                        setTimeout(() => {
                          setCpLoading(false);
                          setCpMsg({ type: "success", text: "Password updated successfully!" });
                          setTimeout(() => {
                            setShowChangePassword(false);
                            setCpCurrent("");
                            setCpNew("");
                            setCpConfirm("");
                            setCpMsg(null);
                          }, 1200);
                        }, 500);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: 14 }}
                    >
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={cpCurrent}
                          onChange={(e) => setCpCurrent(e.target.value)}
                          placeholder="Enter current password"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${C.s300}`,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={cpNew}
                          onChange={(e) => setCpNew(e.target.value)}
                          placeholder="At least 6 characters"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${C.s300}`,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={cpConfirm}
                          onChange={(e) => setCpConfirm(e.target.value)}
                          placeholder="Re-enter new password"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${C.s300}`,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
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

              {showLogoutConfirm && (
                <div style={{
                  position: "fixed", inset: 0, zIndex: 99999,
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
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed', top: 58, left: 0, right: 0, bottom: 0,
            background: '#fff', zIndex: 9999, overflowY: 'auto',
            padding: '16px 0',
            animation: 'adFadeIn 0.2s ease-out',
          }}>
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(n => (
                <button key={n.id}
                  onClick={() => { handleNavClick(n.id); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 12, border: 'none',
                    background: resolvedActiveTab === n.id ? `${C.navy}10` : 'transparent',
                    color: resolvedActiveTab === n.id ? C.navy : C.s700,
                    fontSize: 14, fontWeight: 600, fontFamily: C.dm,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <n.icon size={18} />
                  {n.label}
                </button>
              ))}
              {dropdownNavs.map(nav => (
                <div key={nav.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 12,
                    color: C.s700, fontSize: 14, fontWeight: 600, fontFamily: C.dm,
                  }}>
                    <nav.icon size={18} />
                    {nav.label}
                  </div>
                  <div style={{ paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {nav.items.map(item => (
                      <button key={item.label} onClick={() => {
                        if (item.path !== '#') navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', borderRadius: 10, border: 'none',
                          background: 'transparent', color: C.s600,
                          fontSize: 13.5, fontWeight: 500, fontFamily: C.dm,
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Global Employer Notification Sidebar ─── */}
        <div
          className={`pd-notif-overlay ${showNotifications ? 'show' : ''}`}
          onClick={() => setShowNotifications(false)}
        />
        <div className={`pd-notif-sidebar ${showNotifications ? 'show' : ''}`}>
          <div className="pd-notif-head">
            <h3>Notifications</h3>
            <button
              className="pd-notif-close"
              onClick={() => setShowNotifications(false)}
              aria-label="Close notifications"
            >
              <FiX size={18} />
            </button>
          </div>
          <div className="pd-notif-body">
            <div className="pd-notif-date">Today</div>

            {notificationsLoading && (
              <div style={{ padding: "0 24px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.s500, fontFamily: C.fd }}>
                  Loading notifications...
                </div>
                <div style={{ height: 40 }} />
              </div>
            )}

            {!notificationsLoading && notificationsError && (
              <div style={{ padding: "0 24px 16px", color: "#b91c1c", fontSize: 12.5, fontWeight: 800, fontFamily: C.fd }}>
                {notificationsError}
              </div>
            )}

            {!notificationsLoading && !notificationsError && employerNotifications.length === 0 && (
              <div style={{ padding: "0 24px 16px", color: C.s400, fontSize: 12.5, fontWeight: 700, fontFamily: C.fd }}>
                No notifications right now.
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
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await authService.markEmployerNotificationRead(id);
                    } catch {}

                    setEmployerNotifications((current) =>
                      current.map((x) => {
                        const xid = String(x?.id || x?._id || "");
                        if (!xid || xid !== id) return x;
                        return { ...x, status: "READ" };
                      })
                    );

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
        </div>

        <style>{`
          .pd-notif-overlay { position: fixed; inset: 0; background: rgba(0, 35, 102, 0.35); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 100000; opacity: 0; visibility: hidden; transition: all 0.3s; }
          .pd-notif-overlay.show { opacity: 1; visibility: visible; }
          .pd-notif-sidebar { position: fixed; top: 0; right: -400px; width: 400px; max-width: 90vw; height: 100vh; background: white; z-index: 100001; box-shadow: -12px 0 40px rgba(0, 35, 102, 0.12); display: flex; flex-direction: column; transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
          .pd-notif-sidebar.show { right: 0; }
          .pd-notif-head { padding: 20px 22px; border-bottom: 1px solid ${C.s200}; display: flex; align-items: center; justify-content: space-between; }
          .pd-notif-head h3 { font-family: ${C.fd}; font-size: 18px; font-weight: 800; color: ${C.navy}; margin:0;}
          .pd-notif-close { background: ${C.s100}; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.s500}; cursor: pointer; transition: all 0.2s; }
          .pd-notif-close:hover { background: #FEE2E2; color: #ef4444; transform: rotate(90deg); }
          .pd-notif-body { flex: 1; overflow-y: auto; padding: 16px 0; }
          .pd-notif-date { padding: 0 24px 10px; font-size: 11.5px; font-weight: 800; color: ${C.s400}; letter-spacing: 0.08em; text-transform: uppercase; }
          .pd-notif-item { display: flex; gap: 14px; padding: 16px 24px; border-bottom: 1px solid ${C.s100}; cursor: pointer; transition: background 0.15s; }
          .pd-notif-item:hover { background: ${C.s50}; }
          .pd-notif-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
          .pd-notif-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .pd-notif-title { font-size: 14px; font-weight: 600; line-height: 1.4; color: ${C.s800}; }
          .pd-notif-desc { font-size: 12.5px; color: ${C.s500}; }
          .pd-notif-time { font-size: 11.5px; color: ${C.s400}; margin-top: 2px; }

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
            .ep-hamburger { display: flex !important; align-items: center; justify-content: center; }
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
        `}</style>
      </header>
    </>
  );
}
