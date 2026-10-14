import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronDown,
  FiHelpCircle,
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiPhone,
  FiMail,
  FiShoppingCart,
  FiFolder,
  FiBarChart2,
  FiCheckSquare,
  FiBriefcase,
  FiSettings,
  FiLayers,
  FiTrash2,
  FiMapPin,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import mavenLogo from "../../../assets/maven-logo-BdiSsfJk.svg";
import promoImg from "../../../assets/free-job-posting-promo.png";
import { getCartItems, removeFromCart, clearCart, getCartTotals } from "../../utils/cartStorage";

/* ─── By Brands Configuration (Hidden for future use; toggle to true when brand list is ready) ─── */
const SHOW_BY_BRANDS = false;
const FUTURE_BRANDS_LIST = [
  // Future brands structure:
  // { id: "brand-1", name: "Brand Name", tagline: "Tagline / Description", logo: "/path/to/logo.svg", link: "/brand-link" }
];

export default function LandingEmployeeHeader({
  solid = false,
  isLoggedIn = false,
  onOpenLoginModal,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showTalentCloud, setShowTalentCloud] = useState(false);
  const [showOfferings, setShowOfferings] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => getCartItems());
  const [cartTotals, setCartTotals] = useState(() => getCartTotals());
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    byProducts: false,
    byBusinessType: false,
    solutions: false,
    byBrands: false,
    howItWorks: false,
  });

  const isBuyOnlinePage = location.pathname === "/buy-online";

  // Real-time synchronization of employer cart across pages and tabs
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
    if (mobileDrawerOpen || cartDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen, cartDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
        setCartDrawerOpen(false);
        setShowHamburgerMenu(false);
        setShowOfferings(false);
        setShowTalentCloud(false);
        setShowContact(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav
        className={`elp-nav ${solid || scrolled || isBuyOnlinePage ? "scrolled" : ""}`}
      >
        <div className="elp-nav-inner">
          {/* Logo on Left */}
          <Link
            to="/employer-login"
            className="elp-logo"
            aria-label="Go to homepage"
          >
            <img
              src={mavenLogo}
              alt="MavenJobs"
              style={{ height: 34, width: "auto" }}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="elp-nav-links">
            <div
              className="elp-nav-item"
              onMouseEnter={() => setShowOfferings(true)}
              onMouseLeave={() => setShowOfferings(false)}
            >
              <a
                href={
                  location.pathname === "/employer-login"
                    ? "#offerings"
                    : "/employer-login#offerings"
                }
                className="elp-nav-link dropdown"
              >
                Our offerings{" "}
                <FiChevronDown
                  size={14}
                  className={`elp-chevron ${showOfferings ? "rotated" : ""}`}
                />
              </a>

              <div
                className={`elp-mega-menu ${showOfferings ? "visible" : ""}`}
              >
                <div className="elp-mega-inner">
                  <div className="elp-mega-grid">
                    <div className="elp-mega-promo">
                      <div className="elp-promo-card">
                        <img
                          src={promoImg}
                          alt="Promo"
                          className="elp-promo-img"
                        />
                        <div className="elp-promo-content">
                          <h3>
                            With Free Job Posting, hire local talent at zero
                            cost
                          </h3>
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
                            to="/job-posting"
                            className="elp-promo-link"
                            onClick={() => setShowOfferings(false)}
                          >
                            Free Job Posting <FiArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="elp-mega-section">
                      <span className="elp-section-label">BY PRODUCTS</span>
                      <div className="elp-section-links">
                        <Link
                          to="/job-posting"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">Job Posting</div>
                          <div className="elp-mega-link-desc">
                            Find & attract relevant talent
                          </div>
                        </Link>
                        <Link
                          to="/resume-database"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Resume Database (Resdex)
                          </div>
                          <div className="elp-mega-link-desc">
                            Access India's largest database
                          </div>
                        </Link>
                        <Link
                          to="/hiring-automation"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Hiring Automation
                          </div>
                          <div className="elp-mega-link-desc">
                            Streamline your recruitment workflow
                          </div>
                        </Link>
                        <Link
                          to="/expert-assist"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Expert Assist
                          </div>
                          <div className="elp-mega-link-desc">
                            Our Assisted hiring solution
                          </div>
                        </Link>
                        <Link
                          to="/branding"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Employer Branding
                          </div>
                          <div className="elp-mega-link-desc">
                            Showcase your brand presence
                          </div>
                        </Link>
                        <Link
                          to="/talent-pulse"
                          className="elp-mega-link"
                          onClick={() => setShowOfferings(false)}
                        >
                          <div className="elp-mega-link-title">
                            Talent Planning
                          </div>
                          <div className="elp-mega-link-desc">
                            Make informed hiring decisions
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="elp-mega-section">
                      <span className="elp-section-label">
                        BY BUSINESS TYPE
                      </span>
                      <div className="elp-section-links">
                        <a
                          href={
                            location.pathname === "/employer-login"
                              ? "#solutions"
                              : "/employer-login#solutions"
                          }
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Enterprises
                        </a>
                        <a
                          href={
                            location.pathname === "/employer-login"
                              ? "#solutions"
                              : "/employer-login#solutions"
                          }
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Small & medium business
                        </a>
                        <a
                          href={
                            location.pathname === "/employer-login"
                              ? "#solutions"
                              : "/employer-login#solutions"
                          }
                          className="elp-mega-link simple"
                          onClick={() => setShowOfferings(false)}
                        >
                          Consultants & agency
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Maven Talent Cloud Mega Menu */}
            <div
              className="elp-nav-item"
              onMouseEnter={() => setShowTalentCloud(true)}
              onMouseLeave={() => setShowTalentCloud(false)}
            >
              <a
                href="/maven-talent-cloud"
                className="elp-nav-link dropdown"
              >
                Maven Talent Cloud{" "}
                <FiChevronDown
                  size={14}
                  className={`elp-chevron ${showTalentCloud ? "rotated" : ""}`}
                />
              </a>

              <div
                className={`elp-mega-menu elp-tc-mega ${showTalentCloud ? "visible" : ""}`}
              >
                <div className="elp-tc-inner">
                  {/* Left Showcase Box */}
                  <div className="elp-tc-showcase">
                    <div className="elp-tc-showcase-content">
                      <h3 className="elp-tc-brand-title">Maven Talent Cloud</h3>
                      <h4 className="elp-tc-headline">
                        One-Stop Solution. Talent Decoded.
                      </h4>
                      <p className="elp-tc-desc">
                        One-stop solution for planning, sourcing, screening,
                        employer branding, hiring automation, powered by AI to
                        help you decode top talent.
                      </p>
                      <Link
                        to="/maven-talent-cloud"
                        className="elp-tc-learn-link"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        Learn more <FiArrowRight size={15} />
                      </Link>
                    </div>

                    <div className="elp-tc-promo-banner">
                      <div className="elp-tc-promo-tag">
                        ✨ AI-Powered Suite
                      </div>
                      <div className="elp-tc-tags-row">
                        <span className="elp-tc-chip">Sourcing</span>
                        <span className="elp-tc-chip">Screening</span>
                        <span className="elp-tc-chip">Automated</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Solutions For Grid (Except By Brands section as requested) */}
                  <div className="elp-tc-solutions-col">
                    <span className="elp-section-label">SOLUTIONS FOR</span>
                    <div className="elp-tc-grid">
                      <Link
                        to="/maven-talent-cloud?tab=sourcing#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-blue">
                          <FiFolder size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Talent Sourcing
                          </div>
                          <div className="elp-tc-card-desc">
                            Find the right talent
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/maven-talent-cloud?tab=planning#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-purple">
                          <FiBarChart2 size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Talent Planning
                          </div>
                          <div className="elp-tc-card-desc">
                            Take informed hiring decisions
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/maven-talent-cloud?tab=screening#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-teal">
                          <FiCheckSquare size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Screening &amp; Evaluation
                          </div>
                          <div className="elp-tc-card-desc">
                            Assess candidates' skills
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/maven-talent-cloud?tab=branding#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-amber">
                          <FiLayers size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Employer Branding
                          </div>
                          <div className="elp-tc-card-desc">
                            Showcase your brand presence
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/maven-talent-cloud?tab=assisted#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-indigo">
                          <FiBriefcase size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Assisted Hiring
                          </div>
                          <div className="elp-tc-card-desc">
                            Outsource your hiring needs
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/maven-talent-cloud?tab=automation#solutions-section"
                        className="elp-tc-card"
                        onClick={() => setShowTalentCloud(false)}
                      >
                        <div className="elp-tc-icon-wrap bg-emerald">
                          <FiSettings size={20} />
                        </div>
                        <div className="elp-tc-card-text">
                          <div className="elp-tc-card-title">
                            Hiring Automation
                          </div>
                          <div className="elp-tc-card-desc">
                            Automate your recruitment
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* By Brands Section (Configured for future use; currently hidden via SHOW_BY_BRANDS flag) */}
                  {SHOW_BY_BRANDS && (
                    <div className="elp-tc-brands-col">
                      <span className="elp-section-label">BY BRANDS</span>
                      <div className="elp-tc-brands-list">
                        {FUTURE_BRANDS_LIST.map((brand) => (
                          <Link
                            key={brand.id || brand.name}
                            to={brand.link || "#"}
                            className="elp-tc-brand-card"
                            onClick={() => setShowTalentCloud(false)}
                          >
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="elp-tc-brand-logo"
                              />
                            ) : (
                              <div className="elp-tc-brand-logo-fallback">
                                {brand.name ? brand.name.charAt(0) : "B"}
                              </div>
                            )}
                            <div className="elp-tc-brand-info">
                              <span className="elp-tc-brand-name">
                                {brand.name}
                              </span>
                              <span className="elp-tc-brand-tagline">
                                {brand.tagline}
                              </span>
                            </div>
                            <FiArrowRight
                              size={14}
                              className="elp-tc-brand-arrow"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* <a
              href={
                location.pathname === "/employer-login"
                  ? "#solutions"
                  : "/employer-login#solutions"
              }
              className="elp-nav-link"
            >
              Solutions
            </a> */}
            <a
              href={
                location.pathname === "/employer-login"
                  ? "#how-it-works"
                  : "/employer-login#how-it-works"
              }
              className="elp-nav-link"
            >
              How it works
            </a>
          </div>

          {/* Nav Actions (Right side of header) */}
          <div className="elp-nav-actions">
            {/* Sales Enquiry Contact Number Dropdown */}
            <div
              className="elp-contact-wrapper"
              onMouseEnter={() => setShowContact(true)}
              onMouseLeave={() => setShowContact(false)}
            >
              <button
                type="button"
                className={`elp-contact-trigger ${showContact ? "open" : ""}`}
                aria-label="Sales enquiry contact phone numbers"
              >
                <FiPhone size={14} className="elp-contact-trigger-icon" />
                <span className="elp-contact-phone-text">7015999431</span>
                <FiChevronDown
                  size={14}
                  className={`elp-chevron ${showContact ? "rotated" : ""}`}
                />
              </button>

              <div
                className={`elp-contact-dropdown ${showContact ? "visible" : ""}`}
              >
                <div className="elp-contact-arrow" />

                <div className="elp-contact-kicker">EMPLOYER SALES &amp; SUPPORT</div>

                <div className="elp-contact-body">
                  {/* Phone & WhatsApp */}
                  <div className="elp-contact-section">
                    <div className="elp-contact-region-title">Call or WhatsApp</div>
                    <div className="elp-contact-item">
                      <FiPhone size={14} className="elp-contact-item-icon" />
                      <a
                        href="tel:+917015999431"
                        className="elp-contact-item-text"
                      >
                        <strong>+91 7015999431</strong>
                      </a>
                      <a
                        href="https://wa.me/917015999431"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="elp-wa-icon"
                        title="Chat on WhatsApp"
                      >
                        <FaWhatsapp size={15} color="#25D366" />
                      </a>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 2, paddingLeft: 22 }}>
                      10:00 AM to 6:00 PM (Mon - Sat)
                    </div>
                  </div>

                  {/* Email IDs */}
                  <div className="elp-contact-section">
                    <div className="elp-contact-region-title">Email Us</div>
                    <div className="elp-contact-item">
                      <FiMail size={14} className="elp-contact-item-icon" />
                      <a
                        href="mailto:crm@mavenjobs.in"
                        className="elp-contact-item-text link"
                      >
                        crm@mavenjobs.in
                      </a>
                    </div>
                    <div className="elp-contact-item">
                      <FiMail size={14} className="elp-contact-item-icon" />
                      <a
                        href="mailto:info@mavenjobs.in"
                        className="elp-contact-item-text link"
                      >
                        info@mavenjobs.in
                      </a>
                    </div>
                  </div>

                  {/* Office Address */}
                  <div className="elp-contact-section">
                    <div className="elp-contact-region-title">Office Address</div>
                    <div className="elp-contact-item" style={{ alignItems: "flex-start", gap: 8 }}>
                      <FiMapPin size={15} className="elp-contact-item-icon" style={{ marginTop: 2, flexShrink: 0, color: "#2563eb" }} />
                      <span className="elp-contact-item-text" style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "#334155" }}>
                        S11, Phase 2, 2nd Floor, Mittal Mega Mall, S-11, Phase, Sector 25, Panipat, Haryana 132104
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Help & Support Button */}
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
                  <button
                    className="elp-btn-buy"
                    onClick={() => navigate("/buy-online")}
                  >
                    Buy online
                  </button>
                )}

                {/* Cart Trigger */}
                <button
                  type="button"
                  className="elp-cart-trigger"
                  onClick={() => setCartDrawerOpen(true)}
                  title="View Cart"
                  aria-label="Shopping Cart"
                >
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <FiShoppingCart size={19} />
                    {cartItems.length > 0 && (
                      <span className="elp-cart-badge">
                        {cartItems.length > 99 ? "99+" : cartItems.length}
                      </span>
                    )}
                  </div>
                </button>

                <div className="elp-hamburger-wrapper">
                  <button
                    className="elp-hamburger-btn"
                    onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                    aria-label="Jobseeker options"
                  >
                    {showHamburgerMenu ? (
                      <FiX size={24} />
                    ) : (
                      <FiMenu size={24} />
                    )}
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
              <>
                {/* Cart Trigger for Logged In */}
                <button
                  type="button"
                  className="elp-cart-trigger"
                  onClick={() => setCartDrawerOpen(true)}
                  title="View Cart"
                  aria-label="Shopping Cart"
                >
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <FiShoppingCart size={19} />
                    {cartItems.length > 0 && (
                      <span className="elp-cart-badge">
                        {cartItems.length > 99 ? "99+" : cartItems.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  className="elp-btn-filled"
                  onClick={() => navigate("/post-job")}
                >
                  Post a job
                </button>
              </>
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
            <img
              src={mavenLogo}
              alt="MavenJobs"
              style={{ height: 28, width: "auto" }}
            />
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
                    to="/job-posting"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Job Posting
                  </Link>
                  <Link
                    to="/resume-database"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Resume Database (Resdex)
                  </Link>
                  <Link
                    to="/hiring-automation"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Hiring Automation
                  </Link>
                  <Link
                    to="/expert-assist"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Expert Assist
                  </Link>
                  <Link
                    to="/branding"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Employer Branding
                  </Link>
                  <Link
                    to="/talent-pulse"
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Talent Planning
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
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Enterprises
                  </a>
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Small & medium business
                  </a>
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Consultants & agency
                  </a>
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
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Enterprise Solutions
                  </a>
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    SMB Hiring
                  </a>
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#solutions"
                        : "/employer-login#solutions"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Recruitment Platform
                  </a>
                </div>
              )}
            </div>

            {/* Accordion: BY BRANDS (Configured for future use; hidden for now) */}
            {SHOW_BY_BRANDS && (
              <div className="elp-drawer-accordion">
                <button
                  type="button"
                  className={`elp-drawer-acc-btn ${openSections.byBrands ? "open" : ""}`}
                  onClick={() => toggleSection("byBrands")}
                >
                  <span>BY BRANDS</span>
                  <FiChevronDown
                    size={16}
                    className={`elp-drawer-chevron ${openSections.byBrands ? "rotated" : ""}`}
                  />
                </button>
                {openSections.byBrands && (
                  <div className="elp-drawer-sublist">
                    {FUTURE_BRANDS_LIST.map((brand) => (
                      <Link
                        key={brand.id || brand.name}
                        to={brand.link || "#"}
                        className="elp-drawer-subitem"
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        {brand.name} {brand.tagline ? `— ${brand.tagline}` : ""}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                    href={
                      location.pathname === "/employer-login"
                        ? "#how-it-works"
                        : "/employer-login#how-it-works"
                    }
                    className="elp-drawer-subitem"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Platform Overview
                  </a>
                  <a
                    href={
                      location.pathname === "/employer-login"
                        ? "#how-it-works"
                        : "/employer-login#how-it-works"
                    }
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

      {/* ─── Cart Right-sliding Sidebar Drawer ─── */}
      <div
        className={`elp-cart-overlay ${cartDrawerOpen ? "open" : ""}`}
        onClick={() => setCartDrawerOpen(false)}
      />

      <div
        className={`elp-cart-drawer ${cartDrawerOpen ? "open" : ""}`}
        aria-hidden={!cartDrawerOpen}
      >
        <div className="elp-cart-header">
          <div className="elp-cart-header-title">
            <FiShoppingCart size={20} color="#2563eb" />
            <span>My Cart {cartItems.length > 0 && `(${cartItems.length})`}</span>
          </div>
          <button
            type="button"
            className="elp-cart-close-btn"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="elp-cart-body">
          {cartItems.length === 0 ? (
            <>
              {/* Empty cart notification */}
              <div className="elp-cart-empty">
                <div className="elp-cart-empty-circle">
                  <FiShoppingCart size={34} />
                </div>
                <h4 className="elp-cart-empty-heading">Your cart is empty</h4>
                <p className="elp-cart-empty-sub">
                  Explore our recruitment packages, job postings, and database
                  credits to hire top candidates quickly.
                </p>
                <button
                  type="button"
                  className="elp-cart-explore-btn"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    navigate("/buy-online");
                  }}
                >
                  Explore Plans &amp; Pricing
                </button>
              </div>
            </>
          ) : (
            <div className="elp-cart-items-section">
              <div className="elp-cart-items-top-bar">
                <span className="elp-cart-items-count-text">
                  {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"} in your Cart
                </span>
                <button
                  type="button"
                  className="elp-cart-clear-all-btn"
                  onClick={() => clearCart()}
                  title="Remove all items from cart"
                >
                  Clear all
                </button>
              </div>

              <div className="elp-cart-items-list">
                {cartItems.map((item) => {
                  const itemId = item.id || item._id || item.code;
                  const itemPrice = Number(item.total ?? item.price ?? 0);
                  const isPlan = item.itemType === "PLAN";

                  return (
                    <div key={itemId} className="elp-cart-item-card">
                      <div className="elp-cart-item-card-head">
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                            <span className="elp-cart-item-name">{item.name}</span>
                            <span className={`elp-cart-item-type-badge ${isPlan ? "plan" : "addon"}`}>
                              {isPlan ? "Plan" : item.category || "Product"}
                            </span>
                          </div>
                          <div className="elp-cart-item-details">
                            {item.quantity > 1 && <span>Qty: <strong>{item.quantity} {item.unit || "Units"}</strong> • </span>}
                            <span>{item.validity} Days Validity</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="elp-cart-item-remove-btn"
                          onClick={() => removeFromCart(itemId)}
                          title="Remove from cart"
                          aria-label="Remove item"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>

                      <div className="elp-cart-item-card-foot">
                        <div className="elp-cart-item-price-wrap">
                          {item.discount > 0 && item.basePrice > itemPrice && (
                            <span className="elp-cart-item-base-price">
                              ₹{Number(item.basePrice).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="elp-cart-item-price">
                            {itemPrice === 0 ? "Free" : `₹${itemPrice.toLocaleString("en-IN")}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="elp-cart-item-buy-now-btn"
                          onClick={() => {
                            setCartDrawerOpen(false);
                            if (isBuyOnlinePage) {
                              window.dispatchEvent(
                                new CustomEvent("employer-resume-cart-checkout", { detail: { item } })
                              );
                            } else {
                              navigate(
                                `/buy-online?resume_cart=true&checkout_item=${encodeURIComponent(itemId)}`
                              );
                            }
                          }}
                        >
                          Complete Purchase <FiArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assistance block */}
              <div className="elp-cart-help-box" style={{ marginTop: 6 }}>
                <div className="elp-cart-help-title">Need help with custom plans?</div>
                <p className="elp-cart-help-desc">
                  Our sales experts will customize the best enterprise bundle for your hiring volume.
                </p>
                <a href="tel:+917015999431" className="elp-cart-help-tel">
                  <FiPhone size={14} /> Call +91 7015999431
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="elp-cart-footer">
          <div className="elp-cart-total-row">
            <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})</span>
            <strong>₹{cartTotals.total.toLocaleString("en-IN")}</strong>
          </div>
          {cartTotals.taxTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b" }}>
              <span>Includes GST / Taxes</span>
              <span>₹{cartTotals.taxTotal.toLocaleString("en-IN")}</span>
            </div>
          )}
          <button
            type="button"
            className="elp-cart-checkout-btn"
            disabled={cartItems.length === 0}
            onClick={() => {
              setCartDrawerOpen(false);
              const firstItem = cartItems[0];
              if (firstItem) {
                if (isBuyOnlinePage) {
                  window.dispatchEvent(
                    new CustomEvent("employer-resume-cart-checkout", { detail: { item: firstItem } })
                  );
                } else {
                  navigate(
                    `/buy-online?resume_cart=true&checkout_item=${encodeURIComponent(
                      firstItem.id || firstItem._id || firstItem.code
                    )}`
                  );
                }
              } else {
                navigate("/buy-online");
              }
            }}
          >
            {cartItems.length > 0 ? (
              <>Proceed to Checkout ({cartItems.length}) <FiArrowRight size={16} /></>
            ) : (
              <>Explore Plans &amp; Pricing <FiArrowRight size={16} /></>
            )}
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

        /* ─── Maven Talent Cloud Mega Menu ───────────────────────────────── */
        .elp-mega-menu.elp-tc-mega {
          width: 1040px;
          max-width: 96vw;
        }

        .elp-tc-inner {
          padding: 30px 32px;
          display: flex;
          gap: 36px;
        }

        .elp-tc-showcase {
          width: 290px;
          flex-shrink: 0;
          background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .elp-tc-brand-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.22rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .elp-tc-headline {
          font-size: 0.92rem;
          font-weight: 700;
          color: #2563eb;
          margin: 0 0 10px 0;
          line-height: 1.35;
        }

        .elp-tc-desc {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .elp-tc-learn-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2563eb;
          font-size: 0.85rem;
          font-weight: 800;
          text-decoration: none;
          transition: gap 0.2s;
        }

        .elp-tc-learn-link:hover {
          gap: 10px;
        }

        .elp-tc-promo-banner {
          margin-top: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .elp-tc-promo-tag {
          font-size: 0.72rem;
          font-weight: 800;
          color: #2563eb;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .elp-tc-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .elp-tc-chip {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .elp-tc-solutions-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .elp-tc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .elp-tc-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px;
          border-radius: 14px;
          text-decoration: none;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .elp-tc-card:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 20, 60, 0.05);
        }

        .elp-tc-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .elp-tc-card:hover .elp-tc-icon-wrap {
          transform: scale(1.05);
        }

        .elp-tc-icon-wrap.bg-blue { background: #eff6ff; color: #2563eb; }
        .elp-tc-icon-wrap.bg-purple { background: #faf5ff; color: #9333ea; }
        .elp-tc-icon-wrap.bg-teal { background: #f0fdfa; color: #0d9488; }
        .elp-tc-icon-wrap.bg-amber { background: #fffbeb; color: #d97706; }
        .elp-tc-icon-wrap.bg-indigo { background: #eef2ff; color: #4f46e5; }
        .elp-tc-icon-wrap.bg-emerald { background: #ecfdf5; color: #059669; }

        .elp-tc-card-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .elp-tc-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
        }

        .elp-tc-card:hover .elp-tc-card-title {
          color: #2563eb;
        }

        .elp-tc-card-desc {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
          line-height: 1.35;
        }

        /* ─── By Brands Column (When SHOW_BY_BRANDS is true) ───────────── */
        .elp-tc-brands-col {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-left: 1px solid #e2e8f0;
          padding-left: 24px;
        }

        .elp-tc-brands-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .elp-tc-brand-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          background: #ffffff;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .elp-tc-brand-card:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateX(3px);
        }

        .elp-tc-brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .elp-tc-brand-logo-fallback {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .elp-tc-brand-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .elp-tc-brand-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }

        .elp-tc-brand-card:hover .elp-tc-brand-name {
          color: #2563eb;
        }

        .elp-tc-brand-tagline {
          font-size: 0.74rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .elp-tc-brand-arrow {
          color: #94a3b8;
          flex-shrink: 0;
          transition: transform 0.2s, color 0.2s;
        }

        .elp-tc-brand-card:hover .elp-tc-brand-arrow {
          transform: translateX(3px);
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

        /* ─── Sales Enquiry Contact Dropdown ────────────────────────────── */
        .elp-contact-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .elp-contact-trigger {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.92);
          font-size: 0.86rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }

        .elp-contact-trigger:hover,
        .elp-contact-trigger.open {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .elp-nav.scrolled .elp-contact-trigger {
          color: #1e293b;
        }

        .elp-nav.scrolled .elp-contact-trigger:hover,
        .elp-nav.scrolled .elp-contact-trigger.open {
          color: #2563eb;
          background: #eff6ff;
        }

        .elp-contact-trigger-icon {
          color: currentColor;
          flex-shrink: 0;
        }

        .elp-contact-phone-text {
          font-size: 0.86rem;
          font-weight: 700;
        }

        .elp-contact-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          right: -10px;
          width: 380px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 20, 60, 0.16);
          border: 1px solid #e2e8f0;
          padding: 22px 24px 20px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .elp-contact-dropdown.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .elp-contact-arrow {
          position: absolute;
          top: -7px;
          right: 52px;
          width: 13px;
          height: 13px;
          background: #ffffff;
          border-left: 1px solid #e2e8f0;
          border-top: 1px solid #e2e8f0;
          transform: rotate(45deg);
        }

        .elp-contact-kicker {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .elp-contact-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 480px;
          overflow-y: auto;
        }

        .elp-contact-section {
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .elp-contact-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .elp-contact-region-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .elp-contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 0.84rem;
        }

        .elp-contact-item-icon {
          color: #64748b;
          flex-shrink: 0;
        }

        .elp-contact-item-text {
          color: #1e293b;
          text-decoration: none;
          font-size: 0.84rem;
          transition: color 0.15s;
        }

        .elp-contact-item-text.link {
          color: #2563eb;
        }

        .elp-contact-item-text.link:hover {
          text-decoration: underline;
        }

        .elp-contact-subtext {
          color: #64748b;
          font-size: 0.76rem;
          font-weight: 400;
        }

        .elp-wa-icon {
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
          transition: transform 0.15s;
        }

        .elp-wa-icon:hover {
          transform: scale(1.15);
        }

        .elp-contact-inline-links {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .elp-contact-pipe {
          margin: 0 6px;
          color: #cbd5e1;
          font-size: 0.78rem;
        }

        /* ─── Cart Button & Sliding Drawer ───────────────────────────────── */
        .elp-cart-trigger {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .elp-cart-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .elp-nav.scrolled .elp-cart-trigger {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.24);
          color: #64748b;
        }

        .elp-nav.scrolled .elp-cart-trigger:hover {
          background: #eff6ff;
          color: #2563eb;
          border-color: #2563eb;
        }

        .elp-cart-overlay {
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

        .elp-cart-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .elp-cart-drawer {
          position: fixed;
          top: 0;
          right: -420px;
          width: 380px;
          max-width: 90vw;
          height: 100vh;
          background: #ffffff;
          z-index: 100001;
          box-shadow: -12px 0 40px rgba(0, 35, 102, 0.14);
          display: flex;
          flex-direction: column;
          transition: right 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        .elp-cart-drawer.open {
          right: 0;
        }

        .elp-cart-header {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          flex-shrink: 0;
        }

        .elp-cart-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .elp-cart-close-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .elp-cart-close-btn:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        .elp-cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .elp-cart-empty {
          text-align: center;
          padding: 20px 10px 10px;
        }

        .elp-cart-empty-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .elp-cart-empty-heading {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .elp-cart-empty-sub {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 18px;
        }

        .elp-cart-explore-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }

        .elp-cart-explore-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .elp-cart-plans-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .elp-cart-plans-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .elp-cart-plan-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          background: #ffffff;
          transition: all 0.2s;
        }

        .elp-cart-plan-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }

        .elp-cart-plan-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .elp-cart-plan-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
        }

        .elp-cart-plan-badge {
          font-size: 0.68rem;
          font-weight: 800;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 7px;
          border-radius: 5px;
          text-transform: uppercase;
        }

        .elp-cart-plan-badge.popular {
          background: #eff6ff;
          color: #2563eb;
        }

        .elp-cart-plan-desc {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0 0 10px;
          line-height: 1.35;
        }

        .elp-cart-plan-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .elp-cart-plan-price {
          font-size: 0.86rem;
          font-weight: 800;
          color: #0f172a;
        }

        .elp-cart-plan-btn {
          background: #f1f5f9;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .elp-cart-plan-btn:hover {
          background: #e2e8f0;
        }

        .elp-cart-plan-btn.primary {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .elp-cart-plan-btn.primary:hover {
          background: #dbeafe;
        }

        .elp-cart-help-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
        }

        .elp-cart-help-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .elp-cart-help-desc {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0 0 8px;
          line-height: 1.35;
        }

        .elp-cart-help-tel {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
        }

        .elp-cart-footer {
          padding: 18px 22px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .elp-cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          color: #475569;
        }

        .elp-cart-total-row strong {
          font-size: 1.15rem;
          color: #0f172a;
          font-weight: 800;
        }

        .elp-cart-checkout-btn {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .elp-cart-checkout-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .elp-cart-checkout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .elp-cart-badge {
          position: absolute;
          top: -7px;
          right: -9px;
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          min-width: 17px;
          height: 17px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 1.5px solid #ffffff;
          line-height: 1;
        }

        .elp-cart-items-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .elp-cart-items-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 4px;
        }

        .elp-cart-items-count-text {
          font-size: 0.82rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .elp-cart-clear-all-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .elp-cart-clear-all-btn:hover {
          text-decoration: underline;
          background: #fee2e2;
        }

        .elp-cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .elp-cart-item-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 35, 102, 0.04);
          transition: all 0.18s ease;
        }

        .elp-cart-item-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(0, 35, 102, 0.08);
          transform: translateY(-1px);
        }

        .elp-cart-item-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .elp-cart-item-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
        }

        .elp-cart-item-type-badge {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .elp-cart-item-type-badge.plan {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .elp-cart-item-type-badge.addon {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .elp-cart-item-details {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
        }

        .elp-cart-item-remove-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .elp-cart-item-remove-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }

        .elp-cart-item-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px dashed #e2e8f0;
          gap: 10px;
        }

        .elp-cart-item-price-wrap {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .elp-cart-item-base-price {
          font-size: 0.8rem;
          color: #94a3b8;
          text-decoration: line-through;
        }

        .elp-cart-item-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: #002366;
        }

        .elp-cart-item-buy-now-btn {
          background: #002366;
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .elp-cart-item-buy-now-btn:hover {
          background: #001948;
          transform: translateY(-1px);
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
          .elp-cart-trigger {
            display: flex !important;
            width: 36px !important;
            height: 36px !important;
          }
          .elp-contact-phone-text {
            display: none;
          }
          .elp-contact-trigger {
            padding: 6px;
          }
          .elp-contact-dropdown {
            right: -60px;
            width: 330px;
            max-width: 90vw;
          }
          .elp-mob-menu-btn {
            display: flex !important;
          }
          .elp-nav-inner {
            padding: 0 16px;
            gap: 10px;
            justify-content: space-between;
          }
          .elp-nav-actions {
            gap: 8px;
            margin-left: auto;
          }
          .elp-btn-buy {
            padding: 7px 12px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .elp-contact-wrapper {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
