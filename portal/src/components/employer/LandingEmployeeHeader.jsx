import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowRight, FiChevronDown, FiHelpCircle, FiPhone, FiMenu, FiX, FiArrowUpRight } from "react-icons/fi";
import mavenLogo from "../../../assets/maven-logo-BdiSsfJk.svg";
import promoImg from "../../../assets/free-job-posting-promo.png";
import "../../pages/candidates/features/landing/EmployerLandingPage.css";

export default function LandingEmployeeHeader({ solid = false, isLoggedIn = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showOfferings, setShowOfferings] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  const isBuyOnlinePage = location.pathname === "/buy-online";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`elp-nav ${solid || scrolled || isBuyOnlinePage ? "scrolled" : ""}`}>
      <div className="elp-nav-inner">
        <Link to="/employer-login" className="elp-logo" aria-label="Go to homepage">
          <img src={mavenLogo} alt="MavenJobs" style={{ height: 36 }} />
        </Link>
        <div className="elp-nav-links">
          <div
            className="elp-nav-item"
            onMouseEnter={() => setShowOfferings(true)}
            onMouseLeave={() => setShowOfferings(false)}
          >
            <a href={location.pathname === "/employer-login" ? "#offerings" : "/employer-login#offerings"} className="elp-nav-link dropdown">
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
                        <div className="elp-mega-link-title">Hiring Automation</div>
                        <div className="elp-mega-link-desc">
                          Streamline your recruitment workflow
                        </div>
                      </Link>
                      <Link
                        to="/expert-assist"
                        className="elp-mega-link"
                        onClick={() => setShowOfferings(false)}
                      >
                        <div className="elp-mega-link-title">Expert Assist</div>
                        <div className="elp-mega-link-desc">
                          Our Assisted hiring solution
                        </div>
                      </Link>
                      <Link
                        to="/branding"
                        className="elp-mega-link"
                        onClick={() => setShowOfferings(false)}
                      >
                        <div className="elp-mega-link-title">Employer Branding</div>
                        <div className="elp-mega-link-desc">
                          Showcase your brand presence
                        </div>
                      </Link>
                      <Link
                        to="/talent-pulse"
                        className="elp-mega-link"
                        onClick={() => setShowOfferings(false)}
                      >
                        <div className="elp-mega-link-title">Talent Planning</div>
                        <div className="elp-mega-link-desc">
                          Make informed hiring decisions
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="elp-mega-section">
                    <span className="elp-section-label">BY BUSINESS TYPE</span>
                    <div className="elp-section-links">
                      <a
                        href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
                        className="elp-mega-link simple"
                        onClick={() => setShowOfferings(false)}
                      >
                        Enterprises
                      </a>
                      <a
                        href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
                        className="elp-mega-link simple"
                        onClick={() => setShowOfferings(false)}
                      >
                        Small & medium business
                      </a>
                      <a
                        href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"}
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
          <a href={location.pathname === "/employer-login" ? "#solutions" : "/employer-login#solutions"} className="elp-nav-link">
            Solutions
          </a>
          <a href={location.pathname === "/employer-login" ? "#how-it-works" : "/employer-login#how-it-works"} className="elp-nav-link">
            How it works
          </a>
        </div>
        <div
          className="elp-nav-actions"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
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
          <Link
            to="/employer-help"
            className="elp-help-trigger"
            title="Help & Support"
          >
            <FiHelpCircle size={20} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
