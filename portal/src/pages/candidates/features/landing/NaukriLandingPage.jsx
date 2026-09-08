import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiChevronRight,
  FiClock,
  FiCompass,
  FiHeart,
  FiMapPin,
  FiMonitor,
  FiSearch,
  FiShoppingBag,
  FiTool,
  FiTrendingUp,
  FiUsers,
  FiX,
  FiZap,
  FiHome,
  FiBox,
  FiAward,
} from "react-icons/fi";
import {
  FaApple,
  FaFacebookF,
  FaGooglePlay,
  FaInstagram,
  FaLinkedinIn,
  FaStar,
  FaGraduationCap,
  FaBuilding,
  FaRupeeSign,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import qrImage from "../../../../../assets/QR.png";
import "./NaukriLandingPage.css";
import LandingHeader from "../../../../components/LandingHeader";
import { useLandingHome } from "../../../../hooks/useLandingQueries";
import { usePublishedBlogs } from "../../../../hooks/useCandidateQueries";
import GlobalSearchForm from "../../../../components/common/GlobalSearchForm";

const interviewCompanies = [
  { name: "TCS", logo: "TCS", color: "#2563eb", count: "2.5K+ Interviews" },
  { name: "Flipkart", logo: "FK", color: "#f59e0b", count: "488 Interviews" },
  { name: "Byjus", logo: "BY", color: "#7c3aed", count: "816 Interviews" },
  {
    name: "Cognizant",
    logo: "CG",
    color: "#0891b2",
    count: "1.6K+ Interviews",
  },
  { name: "Accenture", logo: "AC", color: "#dc2626", count: "2K+ Interviews" },
  { name: "Amazon", logo: "AMZ", color: "#d97706", count: "1.7K+ Interviews" },
  { name: "Wipro", logo: "WP", color: "#16a34a", count: "1.2K+ Interviews" },
  { name: "Infosys", logo: "INF", color: "#0284c7", count: "1.4K+ Interviews" },
];

const interviewRoles = [
  { name: "Software Engineer", count: "7.2K+ questions" },
  { name: "Business Analyst", count: "2.8K+ questions" },
  { name: "Consultant", count: "2.4K+ questions" },
  { name: "Financial Analyst", count: "894 questions" },
  { name: "Sales & Marketing", count: "991 questions" },
  { name: "Quality Engineer", count: "1.3K+ questions" },
  { name: "Product Manager", count: "1.1K+ questions" },
  { name: "Data Scientist", count: "2.0K+ questions" },
];

const trendingTags = [
  { label: "Remote", icon: FiHome, color: "#eef2ff" },
  { label: "MNC", icon: FaBuilding, color: "#fffbeb" },
  { label: "Analytics", icon: FiSearch, color: "#f0fdfa" },
  { label: "Supply Chain", icon: FiBox, color: "#f8fafc" },
  { label: "Data Science", icon: FiBarChart2, color: "#fffbeb" },
  { label: "Software & IT", icon: FiMonitor, color: "#f8fafc" },
  { label: "Fresher", icon: FaGraduationCap, color: "#fffbeb" },
  { label: "Fortune 500", icon: FiAward, color: "#f0fdfa" },
];

const socialLinks = [
  { label: "X", icon: FaXTwitter, url: "https://x.com/Maven_Jobs" },
  {
    label: "LinkedIn",
    icon: FaLinkedinIn,
    url: "https://www.linkedin.com/company/mavenjobs-in/",
  },
  {
    label: "Facebook",
    icon: FaFacebookF,
    url: "https://www.facebook.com/mavenjobs.in?rdid=Wpu7WO4FcCWTZ0KV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1EaA6f6Up3%2F#",
  },
  {
    label: "Instagram",
    icon: FaInstagram,
    url: "https://www.instagram.com/mavenjobs.in/",
  },
];

const CATS_ICONS = [
  FiMonitor,
  FiBarChart2,
  FiHeart,
  FiBookOpen,
  FiTrendingUp,
  FiTool,
  FiShoppingBag,
  FiCompass,
];

const sponsoredCompaniesData = [
  {
    name: "TechNova Solutions",
    logoText: "TN",
    logoColor: "#e11d48",
    rating: "4.2",
    reviews: "1.2K+ reviews",
    tags: ["Private", "B2B", "Global MNC", "Software", "AI/ML"],
    bgImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "AeroDynamics Corp",
    logoText: "AD",
    logoColor: "#64748b",
    rating: "3.8",
    reviews: "450 reviews",
    tags: ["Aviation", "Manufacturing", "Defense"],
    bgImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "HealthCare Plus",
    logoText: "HC+",
    logoColor: "#10b981",
    rating: "4.5",
    reviews: "5.1K+ reviews",
    tags: ["Healthcare", "Hospital", "Public Sector"],
    bgImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "FinServe Global",
    logoText: "FSG",
    logoColor: "#6366f1",
    rating: "4.0",
    reviews: "8.5K+ reviews",
    tags: ["Banking", "Finance", "Investment"],
    bgImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "EcoEnergy Group",
    logoText: "EE",
    logoColor: "#84cc16",
    rating: "4.1",
    reviews: "2.3K+ reviews",
    tags: ["Renewable Energy", "Sustainability", "B2B"],
    bgImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Quantum Computing Inc",
    logoText: "QC",
    logoColor: "#000",
    rating: "4.8",
    reviews: "950 reviews",
    tags: ["Technology", "Research", "Hardware"],
    bgImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "BioGenetics Lab",
    logoText: "BGL",
    logoColor: "#3b82f6",
    rating: "3.9",
    reviews: "3.2K+ reviews",
    tags: ["Biotech", "Clinical Trials", "Research"],
    bgImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Nexus Retailers",
    logoText: "NR",
    logoColor: "#0f172a",
    rating: "3.5",
    reviews: "890 reviews",
    tags: ["Retail", "E-commerce", "B2C", "Logistics"],
    bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

const sponsoredCategoriesList = [
  "All", "IT Services", "Technology", "Healthcare & Life Sciences", 
  "Manufacturing & Production", "Infrastructure, Transport & Real Estate", 
  "BFSI", "BPM", "+4 more"
];

const toFilterSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Converts the experience dropdown label ("Fresher (less than 1 year)", "3 years", "5+ years")
// into the job-listing sidebar range bucket ("0-1", "1-2", "2-5", "5-8", "8-12", "12+")
const expLabelToRange = (value = "") => {
  const s = String(value || "").trim();
  if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(s) || /^\d+(\.\d+)?\+$/.test(s))
    return s;
  const m = /(\d+(?:\.\d+)?)/.exec(s);
  if (!m) return "";
  const n = parseFloat(m[1]);
  if (s.toLowerCase().includes("fresher")) return "0-1";
  if (n <= 1) return "0-1";
  if (n === 2) return "1-2";
  if (n <= 4) return "2-5";
  if (n <= 8) return "5-8";
  if (n <= 12) return "8-12";
  return "12+";
};

export default function NaukriLandingPage() {
  const navigate = useNavigate();
  const [activeTopCat, setActiveTopCat] = useState("All");
  const [activeSponsorCat, setActiveSponsorCat] = useState("All");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [companyPage, setCompanyPage] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [showAllSponsored, setShowAllSponsored] = useState(false);

  const pageRef = useRef(null);
  const { data: landingData } = useLandingHome();
  const { data: blogsData, isLoading: blogsLoading } = usePublishedBlogs({
    limit: 4,
  });
  const blogs = blogsData?.blogs || [];

  const goToJobs = ({
    keyword = "",
    location = "",
    experience = "",
  } = {}) => {
    const params = new URLSearchParams();
    const kw = String(keyword || "").trim();
    const loc = String(location || "").trim();
    const exp = expLabelToRange(experience);
    if (kw) params.set("q", kw);
    if (loc) params.set("location", loc);
    if (exp) params.set("experience", exp);
    const filterSlug = toFilterSlug(kw);
    navigate(
      `${filterSlug ? `/jobs/${filterSlug}` : "/jobs"}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  // --- Dynamic data with fallbacks ---
  const dynamicTopCategories = landingData?.topCategories?.length
    ? [
        "All",
        ...new Set(
          landingData.topCategories
            .map((c) => String(c || "").trim())
            .filter((c) => c.toLowerCase() !== "all"),
        ),
      ]
    : ["All"];
  const dynamicCompanies = landingData?.companies?.length
    ? landingData.companies
    : [];
  const dynamicCategories = landingData?.categories?.length
    ? landingData.categories.map((c, i) => ({ ...c, icon: CATS_ICONS[i % 8] }))
    : [];
  const dynamicPopularSearches = landingData?.popularSearches?.length
    ? landingData.popularSearches
    : [];
  const dynamicJobRoles = landingData?.jobRoles?.length
    ? landingData.jobRoles
    : [];
  const dynamicStats = landingData?.stats?.length
    ? landingData.stats
    : [
        { num: "0", label: "Active Job Listings" },
        { num: "0", label: "Registered Job Seekers" },
        { num: "0", label: "Companies Hiring" },
        { num: "0", label: "Offers This Month" },
      ];
  const dynamicTrustedBrands = landingData?.trustedBrands?.length
    ? landingData.trustedBrands
    : [];

  const filteredCompanies =
    activeTopCat === "All"
      ? dynamicCompanies
      : dynamicCompanies.filter((c) => c.category === activeTopCat);

  const COMPANIES_PER_PAGE = 4;
  const companyPageCount = Math.max(
    Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE),
    1,
  );
  const maxCompanyPage = companyPageCount - 1;
  const pagedCompanies = filteredCompanies.slice(
    companyPage * COMPANIES_PER_PAGE,
    companyPage * COMPANIES_PER_PAGE + COMPANIES_PER_PAGE,
  );

  useEffect(() => {
    setCompanyPage(0);
  }, [activeTopCat]);
  useEffect(() => {
    if (!dynamicTopCategories.includes(activeTopCat)) setActiveTopCat("All");
  }, [dynamicTopCategories]);

  // GSAP — hero entrance animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;
    const isMobile = window.innerWidth <= 768;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".lp-nav", { y: -24, autoAlpha: 0, duration: 0.7, clearProps: "all" })
        .to(
          "[data-hero-intro]",
          {
            autoAlpha: 1,
            y: 0,
            duration: isMobile ? 0.5 : 0.8,
            stagger: isMobile ? 0.06 : 0.1,
          },
          "-=0.2",
        );
      gsap.from(".lp-stat", {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        delay: 0.4,
        stagger: 0.08,
        ease: "power3.out",
      });
      gsap.from(".lp-nav__hamburger", {
        autoAlpha: 0,
        scale: 0.8,
        duration: 0.4,
        delay: 0.3,
        ease: "back.out(1.7)",
      });
      const handleScroll = () => {
        const total =
          document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress((window.scrollY / total) * 100);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  return (
    <div className="lp-root" ref={pageRef}>
      {/* Scroll progress */}
      <div className="lp-progress">
        <div
          className="lp-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      
      <LandingHeader />


      <main>
        {/* ── HERO — Centralized ── */}
        <section className="lp-hero">
          <div className="lp-hero__inner">
            <div className="lp-hero__eyebrow" data-hero-intro>
              <span className="lp-hero__dot" />
              Maven Jobs · India's Hiring Platform
            </div>
            <h1 data-hero-intro>
              Find Your <span>Next Career Move</span>
              <br />
              With More Clarity
            </h1>
            <p className="lp-hero__sub" data-hero-intro>
              Maven Jobs connects talent with fast-moving teams across India
              through cleaner search, stronger employer discovery, and practical
              career tools.
            </p>

            {/* Search */}
            <GlobalSearchForm variant="landing" hero />

            {/* Popular */}
            {dynamicPopularSearches.length > 0 && (
              <div className="lp-hero__chips" data-hero-intro>
                <span className="lp-hero__chips-label">Trending:</span>
                {dynamicPopularSearches.slice(0, 6).map((s, i) => (
                  <button
                    key={s + i}
                    type="button"
                    className="lp-chip"
                    onClick={() => goToJobs({ keyword: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Tag badges */}
            <div className="lp-hero__tags" data-hero-intro>
              {trendingTags.map((tag) => {
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.label}
                    type="button"
                    className="lp-tag-badge"
                    onClick={() => goToJobs({ keyword: tag.label })}
                  >
                    <span
                      className="lp-tag-badge__icon"
                      style={{ background: tag.color }}
                    >
                      <Icon />
                    </span>
                    <span className="lp-tag-badge__label">{tag.label}</span>
                    <FiChevronRight className="lp-tag-badge__arrow" />
                  </button>
                );
              })}
            </div>

            {/* Trusted */}
            {dynamicTrustedBrands.length > 0 && (
              <div className="lp-trusted" data-hero-intro>
                <span className="lp-trusted__label">Trusted by teams at</span>
                <div className="lp-trusted__row">
                  {dynamicTrustedBrands.map((b) => (
                    <span key={b} className="lp-trusted__item">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="lp-stats">
          <div className="lp-wrap">
            <div className="lp-stats__grid">
              {dynamicStats.map((s, i) => (
                <div key={s.label + i} className="lp-stat">
                  <div className="lp-stat__num">{s.num}</div>
                  <div className="lp-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TOP COMPANIES ── */}
        <section className="lp-section lp-companies">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">Discover Employers</p>
                <h2 className="lp-title">Top Companies Hiring Now</h2>
              </div>
              <Link to="/companies" className="lp-view-all">
                View More <FiArrowRight />
              </Link>
            </div>

            {/* Category filters */}
            <div className="lp-cats">
              {dynamicTopCategories.map((cat, i) => (
                <button
                  key={cat + i}
                  type="button"
                  className={`lp-cats__btn${activeTopCat === cat ? " lp-cats__btn--active" : ""}`}
                  onClick={() => setActiveTopCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Carousel controls row */}
            <div className="lp-companies__bar">
              <span>{filteredCompanies.length} verified companies</span>
              {maxCompanyPage > 0 && (
                <div className="lp-companies__nav">
                  <button
                    type="button"
                    className="lp-companies__arrow"
                    disabled={companyPage === 0}
                    onClick={() => setCompanyPage((p) => Math.max(0, p - 1))}
                    aria-label="Prev"
                  >
                    ←
                  </button>
                  <span>
                    {companyPage + 1} / {companyPageCount}
                  </span>
                  <button
                    type="button"
                    className="lp-companies__arrow"
                    disabled={companyPage === maxCompanyPage}
                    onClick={() =>
                      setCompanyPage((p) => Math.min(maxCompanyPage, p + 1))
                    }
                    aria-label="Next"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* Companies grid */}
            <div className="lp-companies__grid">
              {Array.from({ length: COMPANIES_PER_PAGE }).map((_, i) => {
                const company = pagedCompanies[i];
                if (!company)
                  return (
                    <div
                      key={`ghost-${i}`}
                      className="lp-co-card lp-co-card--ghost"
                      aria-hidden="true"
                    />
                  );
                return (
                  <div
                    key={company.name + i}
                    className="lp-co-card"
                    onClick={() =>
                      company.id && navigate(`/company/${company.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && company.id)
                        navigate(`/company/${company.id}`);
                    }}
                  >
                    <div className="lp-co-card__head">
                      <div
                        className="lp-co-card__logo"
                        style={{ background: company.color }}
                      >
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt="" />
                        ) : (
                          company.logo
                        )}
                      </div>
                      <div className="lp-co-card__meta">
                        <h3 title={company.name}>{company.name}</h3>
                        <div className="lp-co-card__rating">
                          <FaStar className="lp-star" />
                          <span>
                            {Number(company.rating || 4.1).toFixed(1)}
                          </span>
                          <span className="lp-co-card__reviews">
                            ({company.reviews || "0"} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="lp-co-card__desc">
                      {company.desc || "Verified employer hiring on MavenJobs."}
                    </p>
                    <div className="lp-co-card__foot">
                      <span className="lp-co-card__badge">
                        <FiBriefcase /> {Number(company.jobs || 0)} open roles
                      </span>
                      <Link
                        to={`/jobs/${toFilterSlug(company.name || "company")}?q=${encodeURIComponent(company.name || "")}`}
                        className="lp-co-card__jobs"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Jobs <FiArrowRight />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── JOB CATEGORIES ── */}
        <section className="lp-section lp-bg-alt">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">Browse by Domain</p>
                <h2 className="lp-title">Explore Job Categories</h2>
              </div>
              <Link to="/jobs" className="lp-view-all">
                Browse all <FiArrowRight />
              </Link>
            </div>
            <div className={`lp-cat-grid ${showAllCats ? 'lp-cat-grid--expanded' : ''}`}>
              {dynamicCategories.map((cat, i) => {
                const Icon = cat.icon;
                const encoded = encodeURIComponent(cat.label);
                return (
                  <Link
                    key={cat.label + i}
                    to={`/jobs?department=${encoded}`}
                    className={`lp-cat-card ${i >= 4 ? 'lp-cat-card--hidden-mobile' : ''}`}
                  >
                    <div className="lp-cat-card__icon">
                      <Icon />
                    </div>
                    <div className="lp-cat-card__body">
                      <h3>{cat.label}</h3>
                      <p>{cat.description}</p>
                    </div>
                    <span className="lp-cat-card__count">{cat.count}</span>
                  </Link>
                );
              })}
            </div>
            {dynamicCategories.length > 4 && (
              <div className="lp-cat-mobile-action">
                <button
                  type="button"
                  className="lp-view-all lp-view-all--mobile-toggle"
                  onClick={() => setShowAllCats(!showAllCats)}
                >
                  {showAllCats ? "Show Less" : "View More"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── JOB ROLES ── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">In Demand</p>
                <h2 className="lp-title">Popular Job Roles</h2>
              </div>
            </div>
            <div className={`lp-roles-grid ${showAllRoles ? 'lp-roles-grid--expanded' : ''}`}>
              {dynamicJobRoles.map((role, i) => (
                <Link
                  to={`/jobs?q=${encodeURIComponent(role.name)}`}
                  key={role.name + i}
                  className={`lp-role ${i >= 4 ? 'lp-role--hidden-mobile' : ''}`}
                >
                  <span className="lp-role__name">{role.name}</span>
                  <span className="lp-role__count">{role.count}</span>
                  <FiArrowRight className="lp-role__arrow" />
                </Link>
              ))}
            </div>
            {dynamicJobRoles.length > 4 && (
              <div className="lp-cat-mobile-action">
                <button
                  type="button"
                  className="lp-view-all lp-view-all--mobile-toggle"
                  onClick={() => setShowAllRoles(!showAllRoles)}
                >
                  {showAllRoles ? "Show Less" : "View More"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── SPONSORED COMPANIES ── */}
        <section className="lp-section lp-companies">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">Promoted</p>
                <h2 className="lp-title">Sponsored Companies</h2>
              </div>
              <Link to="/companies" className="lp-view-all">
                View More <FiArrowRight />
              </Link>
            </div>

            <div className="lp-cats">
              {sponsoredCategoriesList.map((cat, i) => (
                <button
                  key={cat + i}
                  type="button"
                  className={`lp-cats__btn${activeSponsorCat === cat ? " lp-cats__btn--active" : ""}`}
                  onClick={() => setActiveSponsorCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={`lp-spon-grid ${showAllSponsored ? 'lp-spon-grid--expanded' : ''}`}>
              {sponsoredCompaniesData.map((company, i) => (
                <div key={company.name + i} className={`lp-spon-card ${i >= 4 ? 'lp-spon-card--hidden-mobile' : ''}`}>
                  <div className="lp-spon-card__logo" style={{ background: company.logoColor }}>
                    {company.logoText}
                  </div>
                  <h3 className="lp-spon-card__name">{company.name}</h3>
                  <div className="lp-spon-card__rating">
                    <FaStar className="lp-star" />
                    <span className="lp-spon-card__score">{company.rating}</span>
                    <span className="lp-spon-card__sep">|</span>
                    <span className="lp-spon-card__reviews">{company.reviews}</span>
                  </div>
                  <div className="lp-spon-card__tags">
                    {company.tags.map((tag) => (
                      <span key={tag} className="lp-spon-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {sponsoredCompaniesData.length > 4 && (
              <div className="lp-cat-mobile-action">
                <button
                  type="button"
                  className="lp-view-all lp-view-all--mobile-toggle"
                  onClick={() => setShowAllSponsored(!showAllSponsored)}
                >
                  {showAllSponsored ? "Show Less" : "View More"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── BLOGS ── */}
        <section className="lp-section lp-bg-alt" id="blogs">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">From Our Blog</p>
                <h2 className="lp-title">Career Insights & Guides</h2>
              </div>
              <Link to="/blogs" state={{ from: "/" }} className="lp-view-all">
                View all articles <FiArrowRight />
              </Link>
            </div>
            <div className="lp-blogs-grid">
              {blogsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="lp-blog-card lp-blog-card--skeleton">
                    <div className="lp-blog-card__img-wrap" />
                    <div className="lp-blog-card__body">
                      <div className="lp-blog-skel lp-blog-skel--meta" />
                      <div className="lp-blog-skel lp-blog-skel--title" />
                      <div className="lp-blog-skel lp-blog-skel--title lp-blog-skel--short" />
                      <div className="lp-blog-skel lp-blog-skel--excerpt" />
                    </div>
                  </div>
                ))
              ) : blogs.length === 0 ? (
                <p
                  style={{
                    gridColumn: "1/-1",
                    textAlign: "center",
                    color: "var(--lp-muted)",
                    padding: "40px 0",
                  }}
                >
                  No articles yet. Check back soon.
                </p>
              ) : (
                blogs.map((bl) => {
                  const catSlug = (bl.category || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-");
                  return (
                    <Link
                      key={bl._id || bl.slug}
                      to={`/blogs/${bl.slug}`}
                      className="lp-blog-card"
                    >
                      <div className="lp-blog-card__img-wrap">
                        {bl.coverImage?.url ? (
                          <img
                            src={bl.coverImage.url}
                            alt={bl.title}
                            className="lp-blog-card__img"
                          />
                        ) : (
                          <div className="lp-blog-card__img-placeholder">
                            <FiBookOpen size={28} />
                          </div>
                        )}
                        <span
                          className={`lp-blog-badge lp-blog-badge--${catSlug}`}
                        >
                          {bl.category}
                        </span>
                      </div>
                      <div className="lp-blog-card__body">
                        <div className="lp-blog-card__meta">
                          <span>
                            <FiClock size={10} />{" "}
                            {bl.metadata?.readTimeMinutes || "?"} min read
                          </span>
                          <span>
                            {bl.publishedAt
                              ? new Date(bl.publishedAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : ""}
                          </span>
                        </div>
                        <h3 className="lp-blog-card__title">{bl.title}</h3>
                        <p className="lp-blog-card__excerpt">
                          {bl.excerpt || ""}
                        </p>
                        {bl.tags?.length > 0 && (
                          <div className="lp-blog-card__tags">
                            {bl.tags.map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        )}
                        <div className="lp-blog-card__foot">
                          <span>{bl.author?.name || "Maven Jobs"}</span>
                          <span className="lp-blog-card__read-more">
                            Read article <FiArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── INTERVIEW PREP ── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-section__hd">
              <div>
                <p className="lp-eyebrow">Ace Your Interviews</p>
                <h2 className="lp-title">Interview Preparation</h2>
              </div>
            </div>
            <div className="lp-interview-grid">
              <div className="lp-interview-col">
                <div className="lp-interview-col__hd">By Company</div>
                {interviewCompanies.map((ic) => (
                  <div key={ic.name} className="lp-interview-row">
                    <div
                      className="lp-interview-logo"
                      style={{ background: ic.color }}
                    >
                      {ic.logo}
                    </div>
                    <div className="lp-interview-info">
                      <span className="lp-interview-name">{ic.name}</span>
                      <span className="lp-interview-count">{ic.count}</span>
                    </div>
                    <FiChevronRight className="lp-interview-arrow" />
                  </div>
                ))}
              </div>
              <div className="lp-interview-col">
                <div className="lp-interview-col__hd">By Role</div>
                {interviewRoles.map((ir) => (
                  <div key={ir.name} className="lp-interview-row">
                    <div className="lp-interview-dot" />
                    <div className="lp-interview-info">
                      <span className="lp-interview-name">{ir.name}</span>
                      <span className="lp-interview-count">{ir.count}</span>
                    </div>
                    <FiChevronRight className="lp-interview-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer__inner">
            <div className="lp-footer__brand">
              <img
                src={mavenLogo}
                alt="Maven Jobs"
                className="lp-footer__logo"
              />
              <p>
                India's most trusted hiring platform for the next generation of
                careers.
              </p>
              <div className="lp-footer__socials">
                {socialLinks.map(({ label, icon: Icon, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
            <div className="lp-footer__col">
              <h4>For Job Seekers</h4>
              <Link to="/jobs">Browse jobs</Link>
              <Link to="/companies">Companies</Link>
              <Link to="/blogs" state={{ from: "/" }}>
                Career advice
              </Link>
              <Link to="/services">Resume builder</Link>
              <Link to="/salary-insights">Salary insights</Link>
            </div>
            <div className="lp-footer__col">
              <h4>For Employers</h4>
              <Link to="/employer-login">Employer login</Link>
              <Link to="/post-job">Post a job</Link>
            </div>
            <div className="lp-footer__col">
              <h4>Company</h4>
              <Link to="/maven-jobs/about">About us</Link>
              <Link to="/blogs" state={{ from: "/" }}>
                Blog
              </Link>
              <Link to="/maven-jobs/press">Press</Link>
              <Link to="/maven-jobs/careers">Careers at Maven</Link>
              <Link to="/maven-jobs/contact">Contact</Link>
              <Link to="/sitemap">Site Map</Link>
            </div>
            <div className="lp-footer__app">
              <h4>Get the App</h4>
              <a href="#" className="lp-app-btn">
                <FaApple /> App Store
              </a>
              <a href="#" className="lp-app-btn">
                <FaGooglePlay /> Google Play
              </a>
              <div className="lp-footer__qr">
                <img src={qrImage} alt="QR" />
                <span>Scan to download</span>
              </div>
            </div>
          </div>
          <div className="lp-footer__bottom">
            <span>
              © {new Date().getFullYear()} Maven Jobs. All rights reserved.
            </span>
            <div>
              <Link to="/maven-jobs/privacy">Privacy Policy</Link>
              <Link to="/maven-jobs/terms">Terms of Service</Link>
              <Link to="/maven-jobs/cookies">Cookie Settings</Link>
              <Link to="/maven-jobs/fraud-alert">Fraud Alert</Link>
              <Link to="/maven-jobs/refund-policy">Refund Policy</Link>
              <Link to="/maven-jobs/grievance">Grievance</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
