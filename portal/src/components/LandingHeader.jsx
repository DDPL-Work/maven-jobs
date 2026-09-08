import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../AuthContext";
import AvatarDropdown from "./common/AvatarDropdown";
import mavenLogo from "../../assets/maven-logo-BdiSsfJk.svg";
import "../pages/candidates/features/landing/NaukriLandingPage.css";

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

export default function LandingHeader() {
  const { user, openLogin, openRegister } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEmployerDropdownOpen, setIsEmployerDropdownOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close mobile menu on resize to desktop + scrolled shadow state
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    const onResize = () => {
      if (window.innerWidth > 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Scroll lock when mobile menu open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isMobileMenuOpen]);

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
            }
          ]
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

  return (
    <nav className={`lp-nav${isScrolled ? " lp-nav--scrolled" : ""}`}>
      <div className="lp-nav__inner">
        <Link to="/" className="lp-nav__logo">
          <img src={mavenLogo} alt="Maven Jobs" />
        </Link>

        <button
          className="lp-nav__hamburger"
          onClick={() => setIsMobileMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="lp-hamburger-inner">
            <span
              className={`lp-hamburger-line${isMobileMenuOpen ? " open" : ""}`}
            />
            <span
              className={`lp-hamburger-line${isMobileMenuOpen ? " open" : ""}`}
            />
          </div>
        </button>

        {/* Mobile drawer backdrop */}
        <div
          className={`lp-drawer-backdrop${isMobileMenuOpen ? " open" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={`lp-nav__body${isMobileMenuOpen ? " lp-nav__body--open" : ""}`}
        >
          <div className="lp-sidebar-head">
            <Link
              to="/"
              className="lp-nav__logo"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img src={mavenLogo} alt="Maven Jobs" />
            </Link>
          </div>

          <div className="lp-nav__links">
            {navCols.map(({ label, to, cols }) => (
              <div
                key={label}
                className="lp-nav__item"
                onMouseEnter={() =>
                  !isMobileMenuOpen && setActiveNavDropdown(label)
                }
                onMouseLeave={() =>
                  !isMobileMenuOpen && setActiveNavDropdown(null)
                }
              >
                <Link
                  to={to}
                  onClick={(e) => {
                    if (isMobileMenuOpen && cols.length > 0) {
                      e.preventDefault();
                      setActiveNavDropdown((prev) =>
                        prev === label ? null : label,
                      );
                    } else if (isMobileMenuOpen) {
                      setIsMobileMenuOpen(false);
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
                  <div className="lp-mega">
                    {cols.map((col, idx) => (
                      <div key={idx} className="lp-mega__col">
                        {col.sections ? (
                          col.sections.map((sec, sIdx) => (
                            <div key={sIdx} style={{ marginBottom: sIdx !== col.sections.length - 1 ? '16px' : '0' }}>
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
          </div>

          <div className="lp-nav__actions">
            {user ? (
              <AvatarDropdown />
            ) : (
              <>
                <button
                  type="button"
                  className="lp-btn lp-btn--outline"
                  onClick={openLogin}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="lp-btn lp-btn--fill"
                  onClick={openRegister}
                >
                  Register
                </button>
              </>
            )}
            {!user && (
              <div
                className="lp-employer-wrap"
                onMouseEnter={() =>
                  !isMobileMenuOpen && setIsEmployerDropdownOpen(true)
                }
                onMouseLeave={() =>
                  !isMobileMenuOpen && setIsEmployerDropdownOpen(false)
                }
              >
                <div
                  className="lp-employer-trigger"
                  onClick={() => {
                    if (isMobileMenuOpen) {
                      setIsEmployerDropdownOpen((prev) => !prev);
                    }
                  }}
                >
                  For employers
                  <FiChevronDown
                    style={{
                      transform: isEmployerDropdownOpen
                        ? "rotate(180deg)"
                        : "none",
                      transition: "transform 0.25s",
                    }}
                  />
                </div>
                {isEmployerDropdownOpen && (
                  <div className="lp-employer-drop">
                    <Link
                      to="/employer-login"
                      className="lp-employer-drop__item"
                    >
                      Employer Login <FiArrowRight />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
