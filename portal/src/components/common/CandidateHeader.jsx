import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiChevronDown, FiMenu, FiTrendingUp, FiX, FiFileText, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "../../AuthContext";
import { useCandidateNotifications } from "../../hooks/useCandidateQueries";
import NotificationSidebar from "./NotificationSidebar";
import SearchAutocomplete from "../SearchAutocomplete";
import AvatarDropdown from "./AvatarDropdown";
import GlobalSearchForm from "./GlobalSearchForm";
import mavenLogo from "../../../assets/maven-logo-BdiSsfJk.svg";
import "../../pages/candidates/features/landing/NaukriLandingPage.css";
import "./CandidateHeader.css";

const toFilterSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const jobFilterPath = (label = "") => {
  const slug = toFilterSlug(label);
  return slug ? `/jobs/${slug}` : "/jobs";
};

const navCols = [
  {
    label: "Jobs",
    to: "/jobs",
    cols: [
      {
        title: "Popular categories",
        links: [
          ["IT jobs", "/jobs?q=IT+jobs"],
          ["Sales jobs", "/jobs?q=Sales+jobs"],
          ["Marketing jobs", "/jobs?q=Marketing+jobs"],
          ["Data Science jobs", "/jobs?q=Data+Science+jobs"],
          ["HR jobs", "/jobs?q=HR+jobs"],
          ["Engineering jobs", "/jobs?q=Engineering+jobs"],
        ],
      },
      {
        title: "Jobs in demand",
        links: [
          ["Fresher jobs", "/jobs?experience=0-1"],
          ["MNC jobs", "/jobs?jobType=MNC"],
          ["Remote jobs", "/jobs?workMode=Remote"],
          ["Work from office", "/jobs?workMode=On+Site"],
          ["Walk-in jobs", "/jobs?q=Walk-in"],
          ["Part-time jobs", "/jobs?jobType=Part+Time"],
        ],
      },
      {
        title: "Jobs by location",
        links: [
          ["Delhi", "/jobs?location=Delhi"],
          ["Mumbai", "/jobs?location=Mumbai"],
          ["Bangalore", "/jobs?location=Bangalore"],
          ["Hyderabad", "/jobs?location=Hyderabad"],
          ["Chennai", "/jobs?location=Chennai"],
          ["Pune", "/jobs?location=Pune"],
        ],
      },
    ],
  },
  {
    label: "Companies",
    to: "/companies",
    cols: [
      {
        title: "Explore categories",
        links: [
          ["Unicorn", "/companies?type=unicorn"],
          ["MNC", "/companies?type=mnc"],
          ["Startup", "/companies?type=startup"],
          ["Product based", "/companies?type=product"],
          ["Internet", "/companies?type=internet"],
        ],
      },
      {
        title: "Explore collections",
        links: [
          ["Top companies", "/companies?sort=popular"],
          ["IT companies", "/companies?q=IT"],
          ["Fintech companies", "/companies?q=Fintech"],
          ["Sponsored", "/companies?tag=sponsored"],
          ["Featured", "/companies?tag=featured"],
        ],
      },
      {
        title: "Research companies",
        links: [
          ["Interview questions", "/interview-questions"],
          ["Company salaries", "/salary-insights"],
          ["Company reviews", "/companies?tab=reviews"],
          ["Salary Calculator", "/salary-calculator"],
        ],
      },
    ],
  },
  {
    label: "Services",
    to: "/services",
    cols: [
      {
        sections: [
          {
            title: "Resume writing",
            links: [
              ["Text resume", "/services/text-resume"],
              ["Visual resume", "/services/visual-resume"],
              ["Resume critique", "/services/resume-critique"],
            ],
          },
          {
            title: "Find Jobs",
            links: [
              ["Jobs4u", "/services/jobs4u"],
              ["Priority applicant", "/services/priority-applicant"],
              ["Contact us", "/services/contact-us"],
            ],
          },
        ],
      },
      {
        title: "Get recruiter's attention",
        links: [
          ["Resume display", "/services/resume-display"],
          ["Monthly subscriptions", "/services/monthly-subscriptions"],
          ["Basic & premium plans", "/services/basic-and-premium-plans"],
        ],
      },
      {
        title: "Free resume resources",
        links: [
          ["Resume maker", "/services/resume-maker"],
          ["Resume quality score", "/services/resume-quality-score"],
          ["Resume samples", "/services/resume-samples"],
          ["Job letter samples", "/services/job-letter-samples"],
        ],
      },
    ],
  },
];

const CandidateHeader = () => {
  const { user, openLogin } = useAuth();
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [isHeaderSearchExpanded, setIsHeaderSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const { data: notificationsData = [] } = useCandidateNotifications(!!user);

  const FALLBACK_NOTIFICATIONS = [
    {
      id: "fb-new-jobs",
      icon: <FiBell />,
      color: "#10B981",
      bg: "#ECFDF5",
      title: "3 new jobs in your area",
      desc: "New jobs matching your profile",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-growth",
      icon: <FiTrendingUp />,
      color: "#002366",
      bg: "#EEF2FF",
      title: "Your career growth summary",
      desc: "Track applications, views, and interviews",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-alert",
      icon: <FiBell />,
      color: "#DC2626",
      bg: "#FEF2F2",
      title: "Application deadline approaching",
      desc: "Complete your applications on time",
      time: "Today",
      unread: false,
    },
  ];

  const dynamicNotifications = React.useMemo(() => {
    const backendItems = notificationsData.map((item) => ({
      ...item,
      icon:
        item.category === "CHAT" || item.metadata?.source === "COMPANY_CHAT" ? (
          <FiMessageSquare />
        ) : item.category === "APPLICATION" ? (
          <FiFileText />
        ) : (
          <FiBell />
        ),
      color: "#2563EB",
      bg: "#EFF6FF",
      desc: item.message || "Open notification",
      time: item.lastUpdated || "Just now",
      unread: item.status !== "READ",
    }));

    const allItems = [...backendItems, ...FALLBACK_NOTIFICATIONS];

    while (allItems.length < 9) {
      allItems.push({
        id: `fb-auto-${allItems.length}`,
        icon: <FiBell />,
        color: "#2563EB",
        bg: "#EFF6FF",
        title: "Stay updated with MavenJobs",
        desc: "You have new opportunities waiting",
        time: "Today",
        unread: false,
      });
    }

    return allItems;
  }, [notificationsData]);

  const unreadNotificationCount = dynamicNotifications.filter(
    (item) => item.unread && !readNotificationIds.includes(item.id),
  ).length;

  const handleMarkAllRead = () => {
    setReadNotificationIds(dynamicNotifications.map((n) => n.id));
  };
  const headerRef = useRef(null);

  // Close the expanded search when clicking outside the header.
  // Ignore clicks inside the portal dropdown (LocationAutocomplete).
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".la-portal-dropdown")) {
        return;
      }
      if (
        isHeaderSearchExpanded &&
        headerRef.current &&
        !headerRef.current.contains(e.target)
      ) {
        setIsHeaderSearchExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHeaderSearchExpanded]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
    <header
      ref={headerRef}
      className={`ch-header${isHeaderSearchExpanded ? " search-expanded" : ""}`}
    >
      <div className="ch-header-inner">
        <Link to="/">
          <img src={mavenLogo} alt="Maven Jobs" className="ch-logo" />
        </Link>

        {/* Right side wrapper to maintain desktop flex layout */}
        <div className="ch-header-right-side" style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Mobile Overlay */}
          <div className={`mobile-overlay ${isMobileMenuOpen ? "show" : ""}`} onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Sidebar (also acts as nav links container on desktop) */}
          <div className={`ch-nav-menu-wrapper ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            
            {/* Mobile Sidebar Header */}
            <div className="mobile-only-sidebar-header" style={{ display: 'none' }}>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={mavenLogo} alt="Maven Jobs" className="ch-logo" />
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#0f172a' }}
              >
                <FiX />
              </button>
            </div>

            <div className="ch-nav-links"> 
            {navCols.map(({ label, to, cols }) => (
              <div
                key={label}
                className="ch-nav-item"
                onMouseEnter={() => {
                if (window.innerWidth > 1024) setActiveNavDropdown(label);
              }}
              onMouseLeave={() => {
                if (window.innerWidth > 1024) setActiveNavDropdown(null);
              }}
              >
                <Link
                  to={to}
                  className={`ch-nav-link${label === "Jobs" ? " active" : ""}`}
                  onClick={(e) => {
                    if (window.innerWidth <= 1024 && cols.length > 0) {
                      e.preventDefault();
                      setActiveNavDropdown(activeNavDropdown === label ? null : label);
                    }
                  }}
                >
                  {label}
                  {cols.length > 0 && (
                    <FiChevronDown
                      style={{
                        transform:
                          activeNavDropdown === label
                            ? "rotate(180deg)"
                            : "none",
                        transition: "transform 0.25s",
                        opacity: 0.6,
                      }}
                    />
                  )}
                </Link>
                {activeNavDropdown === label && cols.length > 0 && (
                  <div className="ch-mega">
                    {cols.map((col, idx) => (
                      <div key={idx} className="ch-mega__col">
                        {col.sections ? (
                          col.sections.map((sec, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                marginBottom:
                                  sIdx !== col.sections.length - 1 ? "16px" : "0",
                              }}
                            >
                              <h4>{sec.title}</h4>
                              {sec.links.map(([text, href]) => (
                                <Link key={text} to={href}>
                                  {text}
                                </Link>
                              ))}
                            </div>
                          ))
                        ) : (
                          <>
                            <h4>{col.title}</h4>
                            {col.links.map(([text, href]) => (
                              <Link key={text} to={href}>
                                {text}
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {user && (
              <div className="ch-nav-item">
                <Link
                  to="/blogs"
                  state={{ from: "/profile-dashboard" }}
                  className="ch-nav-link"
                >
                  Blogs
                </Link>
              </div>
            )}
            </div>
            
            {/* Mobile-only User Actions (Profile / Login) inside sidebar */}
            <div className="mobile-only-sidebar-actions">
              {user ? (
                <div className="ch-user-logged">
                  <AvatarDropdown dropdownAlign="left" />
                </div>
              ) : (
                <div className="ch-user-guest" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="ch-btn-secondary" onClick={openLogin} style={{ width: '100%' }}>
                    Login
                  </button>
                  <button className="ch-btn-primary" style={{ width: '100%' }}>Register</button>
                </div>
              )}
            </div>
          </div>

          <div
            onClick={(e) => {
              if (!isHeaderSearchExpanded) {
                e.preventDefault();
                setIsHeaderSearchExpanded(true);
              }
            }}
            style={{
              cursor: isHeaderSearchExpanded ? "default" : "pointer",
              position: "relative",
              visibility: isHeaderSearchExpanded ? "hidden" : "visible",
            }}
          >
            {!isHeaderSearchExpanded && <div style={{ position: "absolute", inset: 0, zIndex: 10 }} />}
            <SearchAutocomplete />
          </div>

          <div className="ch-user-actions">
            {user ? (
              <div className="ch-user-logged">
                <button
                  title="Notifications"
                  className="ch-icon-btn ch-notif-btn"
                  onClick={() => setShowNotifications(true)}
                >
                  <FiBell size={18} />
                  {unreadNotificationCount > 0 && (
                    <span className="ch-notif-badge" style={{ position: "absolute", top: "4px", right: "4px", background: "#ef4444", color: "#fff", fontSize: "0.6rem", padding: "1px 4px", borderRadius: "10px", fontWeight: "bold" }}>
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  )}
                </button>
                <div className="desktop-only-action">
                  <AvatarDropdown />
                </div>
              </div>
            ) : (
              <div className="ch-user-guest desktop-only-action">
                <button className="ch-btn-secondary" onClick={openLogin}>
                  Login
                </button>
                <button className="ch-btn-primary">Register</button>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={30} strokeWidth={3} /> : <FiMenu size={30} strokeWidth={3} />}
          </button>
        </div>

        {isHeaderSearchExpanded && (
          <div className="ch-expanded-search-container">
            <GlobalSearchForm
              variant="landing"
              raised
              autoFocusKeyword
              onSubmitted={() => setIsHeaderSearchExpanded(false)}
            />
          </div>
        )}
      </div>
    </header>
      <NotificationSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={dynamicNotifications}
        unreadCount={unreadNotificationCount}
        onMarkAllRead={handleMarkAllRead}
        readIds={readNotificationIds}
      />
    </>
  );
};

export default CandidateHeader;