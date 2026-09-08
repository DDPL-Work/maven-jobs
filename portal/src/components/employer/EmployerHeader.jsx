import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiTrendingUp, FiMessageSquare, FiBell,
  FiChevronDown, FiSearch, FiGrid, FiSend, FiLogOut,
  FiBarChart2, FiUsers, FiStar, FiFolder, FiFileText,
  FiMenu, FiX, FiDollarSign, FiShoppingCart
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
  activeTab = 'home',
  onNavigate,
  onMessagesClick,
  onNotificationsClick,
  onLogout,
  requireAuth = false,
}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditData, setCreditData] = useState(null);
  const profileBtnRef = useRef(null);
  const profileMenuRef = useRef(null);
  const dropdownRefs = useRef({});
  const employerToken = localStorage.getItem("employerToken");
  const isEmployerLoggedIn = !!employerToken && employerToken !== "undefined";

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

  useEffect(() => {
    if (!showProfileMenu && !openDropdown) return;
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target) &&
          profileBtnRef.current && !profileBtnRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (openDropdown) {
        const dd = dropdownRefs.current[openDropdown];
        if (dd && !dd.contains(e.target)) setOpenDropdown(null);
      }
      if (e.key === 'Escape') { setShowProfileMenu(false); setOpenDropdown(null); }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [showProfileMenu, openDropdown]);

  const handleNavClick = useCallback((tabId) => {
    if (onNavigate) onNavigate(tabId);
  }, [onNavigate]);

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

  const navLinks = [
    { id: "home",     icon: FiHome,       label: "Home" },
    { id: "analysis", icon: FiTrendingUp,  label: "Analysis" },
  ];

  const dropdownNavs = [
    {
      id: "jobs", icon: FiBriefcase, label: "Jobs",
      items: [
        { label: "Hot Vacancy",   path: "/post-job?type=hot" },
        { label: "Internship",    path: "/post-job?type=internship" },
        { label: "Management",    path: "/post-job?type=management" },
        { label: "Draft",         path: "/employer-draft-jobs" },
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
        { label: "Job Posting", path: "/job-posting" },
        { label: "Resdex",      path: "/resdex" },
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
                className={`ep-nav-link${activeTab === n.id ? " active" : ""}`}
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
                  className={`ep-nav-link${openDropdown === nav.id ? " active" : ""}`}
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

            <button onClick={onNotificationsClick}
              style={{
                width: 36, height: 36, borderRadius: 9, background: C.s50,
                border: `1px solid ${C.s200}`, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: C.s500,
                position: "relative", transition: "all .16s"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,35,102,.2)"; e.currentTarget.style.color = C.navy; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = C.s500; }}
            >
              <FiBell size={16} />
            </button>

            {isEmployerLoggedIn ? (
            <div style={{ position: "relative" }}>
              <button ref={profileBtnRef} onClick={() => setShowProfileMenu(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "5px 12px 5px 5px", borderRadius: 12,
                  background: showProfileMenu
                    ? `linear-gradient(135deg, ${C.navy}12, ${C.navy}08)`
                    : `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`,
                  border: `1px solid ${showProfileMenu ? C.navy + '30' : C.navy + '15'}`,
                  cursor: "pointer", fontFamily: C.dm,
                  transition: "all 0.18s", outline: "none"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy + '40'; e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}14, ${C.navy}08)`; }}
                onMouseLeave={e => { if (!showProfileMenu) { e.currentTarget.style.borderColor = C.navy + '15'; e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`; } }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  background: company.logoUrl
                    ? "transparent"
                    : "linear-gradient(135deg,#f8fafc,#e2e8f0)"
                }}>
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name || "Company"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.style.background = "linear-gradient(135deg,#f8fafc,#e2e8f0)";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8" }}>
                      {company.name ? company.name.slice(0, 2).toUpperCase() : "ST"}
                    </span>
                  )}
                </div>
                <div style={{ lineHeight: 1.2, textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {company.name || "Company"}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: C.s500 }}>
                    HR Portal
                  </div>
                </div>
                <FiChevronDown size={13} color={C.s400} style={{
                  transition: "transform 0.2s",
                  transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)"
                }} />
              </button>

              {showProfileMenu && (
                <div ref={profileMenuRef} style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 9999,
                  minWidth: 220, borderRadius: 16,
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
                  padding: 6, overflow: "hidden"
                }}>
                  {dropdownItems.map((item, i) => (
                    <button key={item.label} onClick={() => {
                      if (item.path !== "#") navigate(item.path);
                      setShowProfileMenu(false);
                    }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 14px", borderRadius: 10,
                        border: "none", background: "transparent",
                        color: "#1E293B", fontSize: 13.5, fontWeight: 600, fontFamily: C.dm,
                        cursor: "pointer", transition: "all 0.12s", textAlign: "left"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#F1F5F9"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                  {creditData && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FiDollarSign size={16} color="#f59e0b" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.s700 }}>{creditData.balance} Credits</span>
                      </div>
                      <button onClick={() => { setShowProfileMenu(false); navigate("/employer-dashboard/pricing"); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: "#002366", color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: C.fd, cursor: "pointer" }}>
                        <FiShoppingCart size={11} /> Top Up
                      </button>
                    </div>
                  )}
                  <div style={{ height: 1, background: "#E2E8F0", margin: "4px 8px" }} />
                  <button onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "none", background: "transparent",
                      color: "#DC2626", fontSize: 13.5, fontWeight: 600, fontFamily: C.dm,
                      cursor: "pointer", transition: "all 0.12s", textAlign: "left"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
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
                    maxWidth: 380, width: "100%",
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
                      Confirm Logout
                    </h3>
                    <p style={{ margin: "0 0 24px", fontSize: 14.5, color: "#475569", fontWeight: 500, lineHeight: 1.5 }}>
                      Are you sure you want to log out of your HR Portal?
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      <button onClick={() => setShowLogoutConfirm(false)}
                        style={{
                          padding: "11px 28px", borderRadius: 12, border: `1.5px solid #E2E8F0`,
                          background: "#fff", color: "#475569", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", fontFamily: C.dm, transition: "all 0.15s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                      >
                        Cancel
                      </button>
                      <button onClick={handleLogoutAction}
                        style={{
                          padding: "11px 28px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                          color: "#fff", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", fontFamily: C.dm,
                          boxShadow: "0 6px 20px rgba(220,38,38,0.25)",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(220,38,38,0.35)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(220,38,38,0.25)"; }}
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
                    background: activeTab === n.id ? `${C.navy}10` : 'transparent',
                    color: activeTab === n.id ? C.navy : C.s700,
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

        <style>{`
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
        `}</style>
      </header>
    </>
  );
}
