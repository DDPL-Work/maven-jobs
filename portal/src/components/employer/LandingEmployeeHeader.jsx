import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronDown,
  FiHelpCircle,
  FiMenu,
  FiX,
  FiArrowUpRight,
} from "react-icons/fi";
import mavenLogo from "../../../assets/maven-logo-BdiSsfJk.svg";
import promoImg from "../../../assets/free-job-posting-promo.png";

export default function LandingEmployeeHeader({ solid = false, isLoggedIn = false, onOpenLoginModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showOfferings, setShowOfferings] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    byProducts: false,
    byBusinessType: false,
    solutions: false,
    howItWorks: false,
  });

  const isBuyOnlinePage = location.pathname === "/buy-online";

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
        setShowHamburgerMenu(false);
        setShowOfferings(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav className={`elp-nav ${solid || scrolled || isBuyOnlinePage ? "scrolled" : ""}`}>
        <div className="elp-nav-inner">
          {/* Logo on Left */}
          <Link to="/employer-login" className="elp-logo" aria-label="Go to homepage">
            <img src={mavenLogo} alt="MavenJobs" style={{ height: 34, width: "auto" }} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="elp-nav-links">
            <div
              className="elp-nav-item"
              onMouseEnter={() => setShowOfferings(true)}
              onMouseLeave={() => setShowOfferings(false)}
            >
              <a
                href={location.pathname === "/employer-login" ? "#offerings" : "/employer-login#offerings"}
                className="elp-nav-link dropdown"
              >
                Our offerings{" "}
                <FiChevronDown
                  size={14}
                  className={`elp-chevron ${showOfferings ? "rotated" : ""}`}
                />
              </a>

              <div className={`elp-mega-menu ${showOfferings ? "visible" : ""}`}>
                <div className="elp-mega-inner">
                  <div className="elp-mega-grid">
                    <div className="elp-mega-promo">
                      <div className="elp-promo-card">
                        <img src={promoImg} alt="Promo" className="elp-promo-img" />
                        <div className="elp-promo-content">
                          <h3>With Free Job Posting, hire local talent at zero cost</h3>
                          <div className="elp-promo-bullets">
                            <p>
                              Unlimited free postings with{" "}
                              <strong>one active job at a time</strong>
                            </p>
                            <p>
                              Get up to <strong>50 candidates/job</strong> while
                              your post remains visible for 7 days
                            </p>
                          </div>
                          <Link
                            to="/buy-online?category=jobs"
                            className="elp-promo-link"
                            onClick={() => setShowOfferings(false)}
                          >
                            Explore Job Postings <FiArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="elp-mega-section">
                      <span className="elp-section-label">BY PRODUCTS</span>
                      <div className="elp-section-links">
                        <Link
                          to="/buy-online?category=combined"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">Combined Plans & Packages</div>
                          <div className="elp-mega-link-desc">
                            All-in-one hiring with Jobs, ResDex & AI
                          </div>
                        </Link>
                        <Link
                          to="/buy-online?category=jobs"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">Job Posting Solutions</div>
                          <div className="elp-mega-link-desc">
                            SMB Jobs & Hot Vacancies with custom counters
                          </div>
                        </Link>
                        <Link
                          to="/buy-online?category=resdex"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Resume Database (ResDex)
                          </div>
                          <div className="elp-mega-link-desc">
                            Search millions of verified candidate CVs
                          </div>
                        </Link>
                        <Link
                          to="/buy-online?category=standalone"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">AI & Productivity Credits</div>
                          <div className="elp-mega-link-desc">
                            Automate JD writing & screening questions
                          </div>
                        </Link>
                        <Link
                          to="/buy-online#enterprise"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">Custom & Enterprise Plans</div>
                          <div className="elp-mega-link-desc">
                            Tailored corporate volume & multi-seat setup
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="elp-mega-section">
                      <span className="elp-section-label">BY BUSINESS TYPE</span>
                      <div className="elp-section-links">
                        <Link
                          to="/buy-online?category=combined"
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Free Forever Plan
                        </Link>
                        <Link
                          to="/buy-online?category=combined"
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Small & medium business (SMB Starter)
                        </Link>
                        <Link
                          to="/buy-online?category=combined"
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Corporate & Growth Companies
                        </Link>
                        <Link
                          to="/buy-online#enterprise"
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Large Enterprises & Agencies
                        </Link>
                        <Link
                          to="/buy-online#compare"
                          className="elp-mega-link simple"
                          style={{ color: "#4338ca", fontWeight: 700 }}
                          onClick={() => setShowOfferings(false)}
                        >
                          Compare All Plan Capabilities →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a
              href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
              className="elp-nav-link"
            >
              Solutions
            </a>
            <a
              href={location.pathname === "/employer-login" ? "#how-it-works" : "/employer-login#how-it-works"}
              className="elp-nav-link"
            >
              How it works
            </a>
          </div>

          {/* Nav Actions (Right side of header) */}
          <div className="elp-nav-actions">
            {/* Help & Support Button (replaces the call button) */}
            <Link
              to="/employer-help"
              className="elp-help-trigger"
              title="Help & Support"
              aria-label="Help & Support"
            >
              <FiHelpCircle size={20} />
            </Link>

            {!isLoggedIn && (
              <>
                {!isBuyOnlinePage && (
                  <button className="elp-btn-buy" onClick={() => navigate("/buy-online")}>
                    Buy online
                  </button>
                )}
                <div className="elp-hamburger-wrapper">
                  <button
                    className="elp-hamburger-btn"
                    onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                    aria-label="Jobseeker options"
                  >
                    {showHamburgerMenu ? <FiX size={24} /> : <FiMenu size={24} />}
                  </button>
                  {showHamburgerMenu && (
                    <div className="elp-hamburger-dropdown">
                      <Link to="/" className="elp-jobseeker-link">
                        <div className="elp-jobseeker-content">
                          <h4>Are you a jobseeker?</h4>
                          <p>Takes you to the MavenJobs jobseeker page</p>
                        </div>
                        <FiArrowUpRight size={18} />
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {isLoggedIn && (
              <button className="elp-btn-filled" onClick={() => navigate("/post-job")}>
                Post a job
              </button>
            )}

            {/* Mobile menu icon (right-most on small screens) */}
            <button
              type="button"
              className="elp-mob-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile menu"
            >
              <FiMenu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Left-sliding Sidebar Drawer ─── */}
      <div
        className={`elp-mob-overlay ${mobileDrawerOpen ? "open" : ""}`}
        onClick={() => setMobileDrawerOpen(false)}
      />

      <div
        className={`elp-mob-drawer ${mobileDrawerOpen ? "open" : ""}`}
        aria-hidden={!mobileDrawerOpen}
      >
        {/* Drawer Header */}
        <div className="elp-drawer-header">
          <Link
            to="/employer-login"
            className="elp-drawer-logo"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <img src={mavenLogo} alt="MavenJobs" style={{ height: 28, width: "auto" }} />
          </Link>

          <div className="elp-drawer-header-actions">
            {!isBuyOnlinePage && (
              <button
                type="button"
                className="elp-drawer-buy-btn"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate("/buy-online");
                }}
              >
                Buy online
              </button>
            )}

            <button
              type="button"
              className="elp-drawer-close-btn"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body (Promotion card removed) */}
        <div className="elp-drawer-body">
          {/* Section: Our offerings */}
          <div className="elp-drawer-section">
            <div className="elp-drawer-section-title">Our offerings</div>

            {/* Accordion 1: BY PRODUCTS */}
            <div className="elp-drawer-accordion">
              <button
                type="button"
                className={`elp-drawer-acc-btn ${openSections.byProducts ? "open" : ""}`}
                onClick={() => toggleSection("byProducts")}
              >
                <span>BY PRODUCTS</span>
                <FiChevronDown
                  size={16}
                  className={`elp-drawer-chevron ${openSections.byProducts ? "rotated" : ""}`}
                />
              </button>
              {openSections.byProducts && (
                <div className="elp-drawer-sublist">
                  <Link
                    to="/buy-online?category=combined"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Combined Plans & Packages
                  </Link>
                  <Link
                    to="/buy-online?category=jobs"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Job Posting Solutions (SMB & Hot)
                  </Link>
                  <Link
                    to="/buy-online?category=resdex"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Resume Database (ResDex)
                  </Link>
                  <Link
                    to="/buy-online?category=standalone"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    AI & Productivity Credits
                  </Link>
                  <Link
                    to="/buy-online#enterprise"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Custom & Enterprise Plans
                  </Link>
                </div>
              )}
            </div>

            {/* Accordion 2: BY BUSINESS TYPE */}
            <div className="elp-drawer-accordion">
              <button
                type="button"
                className={`elp-drawer-acc-btn ${openSections.byBusinessType ? "open" : ""}`}
                onClick={() => toggleSection("byBusinessType")}
              >
                <span>BY BUSINESS TYPE</span>
                <FiChevronDown
                  size={16}
                  className={`elp-drawer-chevron ${openSections.byBusinessType ? "rotated" : ""}`}
                />
              </button>
              {openSections.byBusinessType && (
                <div className="elp-drawer-sublist">
                  <Link
                    to="/buy-online?category=combined"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Free Forever Plan
                  </Link>
                  <Link
                    to="/buy-online?category=combined"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Small & medium business (SMB Starter)
                  </Link>
                  <Link
                    to="/buy-online?category=combined"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Corporate & Growth Companies
                  </Link>
                  <Link
                    to="/buy-online#enterprise"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Large Enterprises & Agencies
                  </Link>
                  <Link
                    to="/buy-online#compare"
                    className="elp-drawer-subitem"
                    style={{ color: "#4338ca", fontWeight: 700 }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Compare Plan Capabilities →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Section: Maven Talent Cloud */}
          <div className="elp-drawer-section">
            <div className="elp-drawer-section-title">Maven Talent Cloud</div>

            {/* Accordion 3: Solutions */}
            <div className="elp-drawer-accordion">
              <button
                type="button"
                className={`elp-drawer-acc-btn ${openSections.solutions ? "open" : ""}`}
                onClick={() => toggleSection("solutions")}
              >
                <span>Solutions</span>
                <FiChevronDown
                  size={16}
                  className={`elp-drawer-chevron ${openSections.solutions ? "rotated" : ""}`}
                />
              </button>
              {openSections.solutions && (
                <div className="elp-drawer-sublist">
                  <a
                    href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Enterprise Solutions
                  </a>
                  <a
                    href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    SMB Hiring
                  </a>
                  <a
                    href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Recruitment Platform
                  </a>
                </div>
              )}
            </div>

            {/* Accordion 4: How it works */}
            <div className="elp-drawer-accordion">
              <button
                type="button"
                className={`elp-drawer-acc-btn ${openSections.howItWorks ? "open" : ""}`}
                onClick={() => toggleSection("howItWorks")}
              >
                <span>How it works</span>
                <FiChevronDown
                  size={16}
                  className={`elp-drawer-chevron ${openSections.howItWorks ? "rotated" : ""}`}
                />
              </button>
              {openSections.howItWorks && (
                <div className="elp-drawer-sublist">
                  <a
                    href={location.pathname === "/employer-login" ? "#how-it-works" : "/employer-login#how-it-works"}
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Platform Overview
                  </a>
                  <a
                    href={location.pathname === "/employer-login" ? "#how-it-works" : "/employer-login#how-it-works"}
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Process & Delivery
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="elp-drawer-divider" />

          {/* Jobseeker Link */}
          <Link
            to="/"
            className="elp-drawer-jobseeker"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <span>Jobseeker</span>
            <FiArrowUpRight size={18} />
          </Link>

          <div style={{ height: 20, flexShrink: 0 }} />
        </div>

        {/* Fixed / Sticky Bottom Register & Login Buttons */}
        <div className="elp-drawer-footer">
          <button
            type="button"
            className="elp-drawer-register-btn"
            onClick={() => {
              setMobileDrawerOpen(false);
              navigate("/recruit/client-registration-form");
            }}
          >
            Register
          </button>
          <button
            type="button"
            className="elp-drawer-login-btn"
            onClick={() => {
              setMobileDrawerOpen(false);
              if (onOpenLoginModal) {
                onOpenLoginModal();
              } else {
                navigate("/employer-login");
              }
            }}
          >
            Log in
          </button>
        </div>
      </div>

      {/* ─── Self-contained Scoped Header Styles ─── */}
      <style>{`
        /* ─── Navbar Desktop & Base ─────────────────────────────────────────── */
        .elp-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 500;
          height: 72px;
          display: flex;
          align-items: center;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
        }

        .elp-nav.scrolled {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom-color: #e2e8f0;
          box-shadow: 0 4px 20px rgba(10, 22, 40, 0.07);
        }

        .elp-nav-inner {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 0 36px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-sizing: border-box;
        }

        .elp-logo {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          text-decoration: none;
          cursor: pointer;
        }

        .elp-nav-links {
          display: flex;
          gap: 6px;
          margin-left: 16px;
        }

        .elp-nav-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 9px;
          transition: all 0.18s;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .elp-nav.scrolled .elp-nav-link {
          color: #334155;
        }

        .elp-nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.12);
        }

        .elp-nav.scrolled .elp-nav-link:hover {
          color: #2563eb;
          background: #eff6ff;
        }

        .elp-nav-item {
          position: static;
        }

        .elp-nav-link.dropdown {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .elp-chevron {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .elp-chevron.rotated {
          transform: rotate(180deg);
        }

        /* ─── Mega Menu (Desktop) ─────────────────────────────────────────── */
        .elp-mega-menu {
          position: absolute;
          top: calc(100% + 5px);
          left: 50%;
          width: 980px;
          max-width: 95vw;
          background: white;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-50%) translateY(15px);
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 24px 60px rgba(0, 35, 102, 0.12);
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          overflow: hidden;
          text-align: left;
        }

        .elp-mega-menu.visible {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .elp-mega-inner {
          padding: 32px 36px;
        }

        .elp-mega-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr 0.8fr;
          gap: 40px;
          align-items: start;
        }

        .elp-mega-promo {
          border-right: 1px solid #e2e8f0;
          padding-right: 32px;
        }

        .elp-promo-card {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .elp-promo-img {
          width: 120px;
          height: 150px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .elp-promo-content h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          line-height: 1.35;
          margin-bottom: 12px;
          color: #0f172a;
        }

        .elp-promo-bullets {
          margin-bottom: 16px;
        }

        .elp-promo-bullets p {
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 6px;
          line-height: 1.45;
        }

        .elp-promo-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2563eb;
          font-weight: 800;
          font-size: 0.85rem;
          text-decoration: none;
          transition: gap 0.2s;
          cursor: pointer;
        }

        .elp-promo-link:hover {
          gap: 10px;
        }

        .elp-mega-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .elp-section-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .elp-section-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .elp-mega-link {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 1px;
          transition: transform 0.2s;
          cursor: pointer;
        }

        .elp-mega-link:hover {
          transform: translateX(4px);
        }

        .elp-mega-link-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .elp-mega-link:hover .elp-mega-link-title {
          color: #2563eb;
        }

        .elp-mega-link-desc {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .elp-mega-link.simple {
          font-size: 0.95rem;
          font-weight: 700;
          color: #334155;
          padding: 2px 0;
        }

        .elp-mega-link.simple:hover {
          color: #2563eb;
        }

        /* ─── Nav Actions ─────────────────────────────────────────────────── */
        .elp-nav-actions {
          display: flex;
          gap: 12px;
          margin-left: auto;
          align-items: center;
        }

        .elp-btn-buy {
          background-color: #2b5cff;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.15s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }

        .elp-btn-buy:hover {
          background-color: #1a4ae0;
          transform: translateY(-1px);
        }

        .elp-hamburger-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .elp-hamburger-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.18s;
        }

        .elp-nav.scrolled .elp-hamburger-btn {
          color: #0f172a;
        }

        .elp-hamburger-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          background: #f3f4fa;
          border-radius: 12px;
          width: max-content;
          max-width: 300px;
          padding: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100;
          text-align: left;
        }

        .elp-jobseeker-link {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          text-decoration: none;
          color: #0f172a;
          gap: 16px;
          cursor: pointer;
        }

        .elp-jobseeker-content h4 {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #002366;
        }

        .elp-jobseeker-content p {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .elp-jobseeker-link svg {
          color: #64748b;
          margin-top: 2px;
        }

        .elp-jobseeker-link:hover .elp-jobseeker-content h4 {
          text-decoration: underline;
        }

        .elp-help-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .elp-help-trigger:hover {
          background: rgba(255,255,255,0.2);
        }

        .elp-nav.scrolled .elp-help-trigger {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.24);
          color: #64748b;
        }

        .elp-nav.scrolled .elp-help-trigger:hover {
          background: #f8fafc;
          color: #2563eb;
          border-color: #2563eb;
        }

        .elp-btn-filled {
          padding: 10px 22px;
          background: #2563eb;
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          white-space: nowrap;
        }

        .elp-btn-filled:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
        }

        /* Mobile Hamburger Icon (Right-most on small screens) */
        .elp-mob-menu-btn {
          display: none;
          background: transparent;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.95);
          padding: 6px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .elp-mob-menu-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .elp-nav.scrolled .elp-mob-menu-btn {
          color: #0f172a;
        }

        .elp-nav.scrolled .elp-mob-menu-btn:hover {
          background: rgba(15, 23, 42, 0.06);
        }

        /* ─── Mobile Left Sidebar Drawer ─────────────────────────────────── */
        .elp-mob-overlay {
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

        .elp-mob-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .elp-mob-drawer {
          position: fixed;
          top: 0;
          left: -380px;
          width: 340px;
          max-width: 88vw;
          height: 100vh;
          background: #ffffff;
          z-index: 100001;
          box-shadow: 12px 0 40px rgba(0, 35, 102, 0.12);
          display: flex;
          flex-direction: column;
          transition: left 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        .elp-mob-drawer.open {
          left: 0;
        }

        /* Drawer Header */
        .elp-drawer-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          flex-shrink: 0;
        }

        .elp-drawer-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          cursor: pointer;
        }

        .elp-drawer-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .elp-drawer-buy-btn {
          background: transparent;
          color: #2563eb;
          border: 1.5px solid #2563eb;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .elp-drawer-buy-btn:hover {
          background: #eff6ff;
        }

        .elp-drawer-close-btn {
          background: transparent;
          border: none;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.15s;
        }

        .elp-drawer-close-btn:hover {
          color: #dc2626;
        }

        /* Drawer Scrollable Body */
        .elp-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
        }

        /* Drawer Sections */
        .elp-drawer-section {
          margin-bottom: 18px;
        }

        .elp-drawer-section-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .elp-drawer-accordion {
          border-bottom: 1px solid #f8fafc;
        }

        .elp-drawer-acc-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 0;
          background: none;
          border: none;
          color: #475569;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }

        .elp-drawer-acc-btn:hover {
          color: #2563eb;
        }

        .elp-drawer-acc-btn.open {
          color: #2563eb;
        }

        .elp-drawer-chevron {
          transition: transform 0.22s ease;
          color: #94a3b8;
        }

        .elp-drawer-chevron.rotated {
          transform: rotate(180deg);
          color: #2563eb;
        }

        .elp-drawer-sublist {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 14px;
          padding-bottom: 10px;
          animation: elpFadeSlide 0.18s ease-out;
        }

        .elp-drawer-subitem {
          padding: 8px 12px;
          font-size: 13.5px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.14s;
          display: block;
        }

        .elp-drawer-subitem:hover {
          background: #f1f5f9;
          color: #2563eb;
          font-weight: 600;
          padding-left: 16px;
        }

        .elp-drawer-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 12px 0 16px;
        }

        .elp-drawer-jobseeker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          text-decoration: none;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.15s;
        }

        .elp-drawer-jobseeker:hover {
          color: #2563eb;
        }

        .elp-drawer-jobseeker svg {
          color: #64748b;
        }

        /* Drawer Footer */
        .elp-drawer-footer {
          padding: 16px 20px 24px;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
          display: flex;
          gap: 12px;
        }

        .elp-drawer-register-btn {
          flex: 1;
          background: #f1f5f9;
          color: #0f172a;
          border: 1.5px solid #cbd5e1;
          padding: 13px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .elp-drawer-register-btn:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .elp-drawer-login-btn {
          flex: 1;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 13px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .elp-drawer-login-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        @keyframes elpFadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── Responsive Media Queries ───────────────────────────────────── */
        @media (max-width: 1024px) {
          .elp-nav-links {
            display: none !important;
          }
          .elp-hamburger-wrapper {
            display: none !important;
          }
          .elp-help-trigger {
            display: flex !important;
            width: 36px !important;
            height: 36px !important;
          }
          .elp-mob-menu-btn {
            display: flex !important;
          }
          .elp-nav-inner {
            padding: 0 16px;
            gap: 12px;
            justify-content: space-between;
          }
          .elp-nav-actions {
            gap: 10px;
            margin-left: auto;
          }
          .elp-btn-buy {
            padding: 7px 14px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}
