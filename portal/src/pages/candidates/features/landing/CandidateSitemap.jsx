import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiHome, FiUser, FiBriefcase, FiSearch, FiBookmark,
  FiTrendingUp, FiDollarSign, FiHelpCircle, FiFileText,
  FiEye, FiAward, FiZap, FiStar, FiCalendar, FiGlobe,
  FiDownload, FiLock, FiChevronRight, FiClock, FiLayers,
  FiTarget, FiShield, FiCompass, FiBookOpen, FiActivity
} from 'react-icons/fi';
import { FaBuilding, FaGraduationCap } from 'react-icons/fa6';
import { useAuth } from '../../../../AuthContext';
import AvatarDropdown from '../../../../components/common/AvatarDropdown';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import LandingFooter from '../../../../layout/candidate/LandingFooter';
import './CandidateSitemap.css';

/* --------------------------------------------------------------------------
   Protected Candidate Routes (triggers login modal if unauthenticated)
   -------------------------------------------------------------------------- */
const PROTECTED_PATHS = new Set([
  '/dashboard',
  '/profile',
  '/saved-jobs',
  '/recommended-jobs',
  '/daily-quiz',
  '/resume-builder',
  '/resume-view',
  '/profile/resume',
  '/candidate/email-templates',
  '/info',
]);

/* --------------------------------------------------------------------------
   Comprehensive Candidate Sourcing & Career Navigation Architecture
   -------------------------------------------------------------------------- */
const CANDIDATE_SECTIONS = [
  {
    id: 'jobs-search',
    title: 'Job Search & Opportunities',
    desc: 'Explore thousands of active jobs, recommendations, and track submissions.',
    icon: FiBriefcase,
    color: '#2563eb',
    bg: '#eff6ff',
    badge: 'Core Search',
    pages: [
      {
        label: 'Browse All Jobs',
        path: '/jobs',
        icon: FiSearch,
        desc: 'Search openings across tech, management, sales, engineering & remote roles.',
        badge: 'Popular',
      },
      {
        label: 'Recommended Jobs',
        path: '/recommended-jobs',
        icon: FiTarget,
        desc: 'AI-curated matches tailored to your verified skills, experience, and salary.',
        badge: 'Personalized',
      },
      {
        label: 'Saved & Bookmarked Jobs',
        path: '/saved-jobs',
        icon: FiBookmark,
        desc: 'Keep track of vacancies you want to review and apply to later.',
      },
      {
        label: 'Application Status Tracker',
        path: '/info',
        icon: FiClock,
        desc: 'Real-time recruiter status updates: Viewed, Shortlisted, or Scheduled.',
      },
      {
        label: 'Job Market Insights',
        path: '/jobs/info',
        icon: FiActivity,
        desc: 'High-growth job sectors, top in-demand skills, and active hiring hubs.',
      },
    ],
  },
  {
    id: 'career-growth',
    title: 'Career Growth & Prep Tools',
    desc: 'Master technical interviews, test your knowledge, and benchmark your salary.',
    icon: FaGraduationCap,
    color: '#059669',
    bg: '#ecfdf5',
    badge: 'Interview & Prep',
    pages: [
      {
        label: 'Interview Questions Bank',
        path: '/interview-questions',
        icon: FiHelpCircle,
        desc: 'Real interview Q&As from top tech MNCs, unicorns, and startup panels.',
        badge: 'Free Prep',
      },
      {
        label: 'Take-Home Salary Calculator',
        path: '/salary-calculator',
        desc: 'Calculate exact in-hand monthly salary from your gross CTC after tax & PF deductions.',
        icon: FiDollarSign,
      },
      {
        label: 'Salary Insights & Benchmarks',
        path: '/salary-insights',
        icon: FiTrendingUp,
        desc: 'Market compensation percentiles by role, experience tier, and Indian cities.',
      },
      {
        label: 'Daily Skill Quiz & Challenges',
        path: '/daily-quiz',
        icon: FiAward,
        desc: 'Solve 5 daily industry questions to earn XP, level up, and showcase readiness.',
        badge: 'Earn XP',
      },
      {
        label: 'Career Blogs & Advice',
        path: '/blogs',
        icon: FiBookOpen,
        desc: 'Actionable career guidance, resume crafting hacks, and salary negotiation tips.',
      },
    ],
  },
  {
    id: 'companies',
    title: 'Companies & Workplaces',
    desc: 'Research employer work culture, salary transparency, and verified reviews.',
    icon: FaBuilding,
    color: '#7c3aed',
    bg: '#f5f3ff',
    badge: 'Directory',
    pages: [
      {
        label: 'Explore Companies',
        path: '/companies',
        icon: FiGlobe,
        desc: 'Browse 10,000+ top Indian MNCs, product companies, and funded startups.',
      },
      {
        label: 'Featured Hiring Employers',
        path: '/companies/top-companies',
        icon: FaBuilding,
        desc: 'Verified companies currently running aggressive talent acquisition drives.',
        badge: 'Actively Hiring',
      },
    ],
  },
  {
    id: 'resume-tools',
    title: 'Resume Tools & Document Center',
    desc: 'Build, audit, and download recruiter-approved, ATS-compliant resumes.',
    icon: FiFileText,
    color: '#ea580c',
    bg: '#fff7ed',
    badge: 'Resume Suite',
    pages: [
      {
        label: 'Interactive Resume Builder',
        path: '/resume-builder',
        icon: FiFileText,
        desc: 'Create an ATS-friendly professional resume with smart phrase suggestions.',
        badge: 'Builder',
      },
      {
        label: 'My Resume Preview & Viewer',
        path: '/profile/resume',
        icon: FiEye,
        desc: 'View, verify, and download your currently active profile resume.',
      },
      {
        label: 'Online Resume Maker Templates',
        path: '/services/resume-maker',
        icon: FiLayers,
        desc: 'Choose from recruiter-endorsed resume layouts engineered for readability.',
      },
      {
        label: 'Resume Quality Score Checker',
        path: '/services/resume-quality-score',
        icon: FiActivity,
        desc: 'Instant diagnostic feedback on keyword density, formatting, and ATS score.',
        badge: 'ATS Checker',
      },
      {
        label: 'Curated Resume Samples by Role',
        path: '/services/resume-samples',
        icon: FiBookOpen,
        desc: 'Inspect real resumes of successfully hired engineers, managers, and designers.',
      },
      {
        label: 'Cover & Job Letter Samples',
        path: '/services/job-letter-samples',
        icon: FiFileText,
        desc: 'Ready-to-use cover letters, interview follow-ups, and resignation templates.',
      },
    ],
  },
  {
    id: 'career-services',
    title: 'Fast-Track Career Services',
    desc: 'Accelerate your job search with expert writers, spotlighting, and active outreach.',
    icon: FiZap,
    color: '#0284c7',
    bg: '#f0f9ff',
    badge: 'Career Boosters',
    pages: [
      {
        label: 'All Career Services',
        path: '/services',
        icon: FiStar,
        desc: 'Overview of all assisted candidate services, career plans, and bundles.',
      },
      {
        label: 'Expert Text Resume Writing',
        path: '/services/text-resume',
        icon: FiFileText,
        desc: 'Have experienced industry specialists craft an executive text resume for you.',
      },
      {
        label: 'Visual Infographic Resume',
        path: '/services/visual-resume',
        icon: FiEye,
        desc: 'Custom visual resume highlighting key achievements for modern hiring teams.',
      },
      {
        label: 'Recruiter Resume Critique',
        path: '/services/resume-critique',
        icon: FiActivity,
        desc: 'Comprehensive 12-point audit of your existing resume with improvement steps.',
      },
      {
        label: 'Priority Applicant Service',
        path: '/services/priority-applicant',
        icon: FiZap,
        desc: 'Highlight your job applications to recruiters and rank on top of the applicant list.',
        badge: '3x Views',
      },
      {
        label: 'Jobs4U Search Assistant',
        path: '/services/jobs4u',
        icon: FiTarget,
        desc: 'Dedicated career assistant finding and delivering relevant job opportunities to you.',
      },
      {
        label: 'Resume Display in Resdex',
        path: '/services/resume-display',
        icon: FiStar,
        desc: 'Spotlight your profile when hiring managers perform active talent searches.',
      },
      {
        label: 'Monthly Growth Subscriptions',
        path: '/services/monthly-subscriptions',
        icon: FiCalendar,
        desc: 'Continuous career support packages including monthly alerts and direct outreach.',
      },
    ],
  },
  {
    id: 'membership-profile',
    title: 'Membership, Profile & Time Off',
    desc: 'Manage your candidate account, premium privileges, and personal records.',
    icon: FiUser,
    color: '#0d9488',
    bg: '#ccfbf1',
    badge: 'Account & Perks',
    pages: [
      {
        label: 'Candidate Dashboard Feed',
        path: '/dashboard',
        icon: FiHome,
        desc: 'Your central hub for notifications, recent views, and application updates.',
      },
      {
        label: 'My Candidate Profile',
        path: '/profile',
        icon: FiUser,
        desc: 'Update work experience, education, verified skills, and portfolio links.',
      },
      {
        label: 'Maven Premium Membership',
        path: '/premium',
        icon: FiAward,
        desc: 'Unlock direct recruiter calls, confidential profile mode, and salary reports.',
        badge: 'Premium',
      },
      {
        label: 'Maven Pro Career Suite',
        path: '/pro',
        icon: FiZap,
        desc: 'Advanced tools, interview simulations, and verified skill badges.',
      },
      {
        label: 'Leave & Time Off Tracker',
        path: '/candidate/email-templates',
        icon: FiCalendar,
        desc: 'Track vacation balances, sick leaves, and personal holiday calendars.',
      },
    ],
  },
  {
    id: 'support-info',
    title: 'Mobile App, Support & Information',
    desc: 'Download our native mobile app, read platform policies, or reach our support desk.',
    icon: FiHelpCircle,
    color: '#4f46e5',
    bg: '#eef2ff',
    badge: 'Help & Info',
    pages: [
      {
        label: 'Download MavenJobs Mobile App',
        path: '/download/candidate-app',
        icon: FiDownload,
        desc: 'Search and apply on the go with instant push notifications on Android & iOS.',
        badge: 'Get App',
      },
      {
        label: 'About MavenJobs',
        path: '/maven-jobs/about',
        icon: FiGlobe,
        desc: 'Our mission to connect India’s top talent with verified global employers.',
      },
      {
        label: 'Contact Support Desk',
        path: '/maven-jobs/contact',
        icon: FiHelpCircle,
        desc: 'Have questions or need assistance? Reach out to candidate support team.',
      },
      {
        label: 'Trust, Safety & Anti-Fraud',
        path: '/maven-jobs/trust-safety',
        icon: FiShield,
        desc: 'Guidelines on genuine recruiters, scam alerts, and verified job guarantee.',
      },
      {
        label: 'Terms of Service & Privacy',
        path: '/maven-jobs/terms',
        icon: FiFileText,
        desc: 'Our user agreements, candidate data protection, and platform rules.',
      },
    ],
  },
];

export default function CandidateSitemap() {
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const isCandidateLoggedIn = Boolean(user || localStorage.getItem('user'));

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return CANDIDATE_SECTIONS.map((section) => {
      // Category filter
      if (activeCategory !== 'all' && section.id !== activeCategory) {
        return null;
      }

      const matchingPages = section.pages.filter((page) => {
        if (!q) return true;
        return (
          page.label.toLowerCase().includes(q) ||
          page.desc.toLowerCase().includes(q) ||
          (page.badge && page.badge.toLowerCase().includes(q))
        );
      });

      if (matchingPages.length === 0) return null;

      return {
        ...section,
        pages: matchingPages,
      };
    }).filter(Boolean);
  }, [searchQuery, activeCategory]);

  // Handle page click (respecting authentication requirements)
  const handlePageClick = useCallback(
    (page) => {
      const isProtected = PROTECTED_PATHS.has(page.path);
      if (isProtected && !isCandidateLoggedIn) {
        openLogin();
      } else {
        navigate(page.path);
      }
    },
    [isCandidateLoggedIn, navigate, openLogin]
  );

  // Total count of available pages
  const totalPagesCount = useMemo(() => {
    return CANDIDATE_SECTIONS.reduce((acc, s) => acc + s.pages.length, 0);
  }, []);

  return (
    <div className="cs-root">
      {/* Top Navbar */}
      <nav className={`cs-nav ${isScrolled ? 'cs-nav--scrolled' : ''}`}>
        <div className="cs-nav__inner">
          <div
            className="cs-nav__brand"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <img src={mavenLogo} alt="MavenJobs" className="cs-nav__logo" />
          </div>

          <div className="cs-nav__actions">
            <Link to="/employer/site-map" className="cs-btn cs-btn--employer-switch">
              <FiBriefcase size={14} />
              <span>Employer Site Map</span>
            </Link>

            {user ? (
              <AvatarDropdown />
            ) : (
              <>
                <button
                  type="button"
                  className="cs-btn cs-btn--ghost"
                  onClick={() => openLogin()}
                >
                  Candidate Sign In
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn--primary"
                  onClick={() => navigate('/employer-login')}
                >
                  Employer Login
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="cs-header">
        <div className="cs-header__bg" />
        <div className="cs-header__content">
          <div className="cs-header__badge">
            <FiCompass size={13} />
            <span>Candidate Directory</span>
          </div>

          <h1 className="cs-header__title">
            Explore Everything for <span>Your Career</span>
          </h1>

          <p className="cs-header__sub">
            The complete architectural directory of MavenJobs job opportunities, interview
            preparation tools, resume builders, and career acceleration services.
          </p>

          {/* Search Box */}
          <div className="cs-search-container">
            <div className="cs-search-bar">
              <FiSearch size={17} color="#64748b" />
              <input
                type="text"
                placeholder="Search jobs, resume tools, salary calculators, quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cs-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="cs-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="cs-filter-bar">
            <button
              type="button"
              className={`cs-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Features ({totalPagesCount})
            </button>
            {CANDIDATE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`cs-filter-pill ${activeCategory === sec.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(sec.id)}
              >
                {sec.title.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="cs-main">
        {/* Quick Stats Ribbon */}
        <div className="cs-stats-row">
          <div className="cs-stat-card">
            <div className="cs-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiBriefcase size={22} />
            </div>
            <div>
              <div className="cs-stat-num">50,000+</div>
              <div className="cs-stat-label">Active Verified Jobs</div>
            </div>
          </div>

          <div className="cs-stat-card">
            <div className="cs-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <FaGraduationCap size={22} />
            </div>
            <div>
              <div className="cs-stat-num">1,200+</div>
              <div className="cs-stat-label">Interview Q&amp;As &amp; Quizzes</div>
            </div>
          </div>

          <div className="cs-stat-card">
            <div className="cs-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <FaBuilding size={22} />
            </div>
            <div>
              <div className="cs-stat-num">10,000+</div>
              <div className="cs-stat-label">Hiring Companies</div>
            </div>
          </div>

          <div className="cs-stat-card">
            <div className="cs-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <FiFileText size={22} />
            </div>
            <div>
              <div className="cs-stat-num">6+</div>
              <div className="cs-stat-label">Resume Builders &amp; ATS Tools</div>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        {filteredSections.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <FiSearch size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>
              No candidate features found
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              No tools or pages matched your search term "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              style={{
                background: '#002366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '8px 20px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="cs-grid">
            {filteredSections.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="cs-group">
                  {/* Group Header */}
                  <div className="cs-group__hd">
                    <div className="cs-group__hd-left">
                      <div
                        className="cs-group__icon"
                        style={{ background: group.bg, color: group.color }}
                      >
                        <GroupIcon size={18} />
                      </div>
                      <h2 className="cs-group__title">{group.title}</h2>
                    </div>
                    <span
                      className="cs-group__count"
                      style={{ background: group.bg, color: group.color }}
                    >
                      {group.pages.length}
                    </span>
                  </div>

                  {/* Group Pages List */}
                  <div className="cs-group__body">
                    {group.pages.map((page) => {
                      const isProtected = PROTECTED_PATHS.has(page.path);
                      const PageIcon = page.icon;

                      return (
                        <button
                          key={page.path}
                          type="button"
                          className="cs-page"
                          onClick={() => handlePageClick(page)}
                        >
                          <div className="cs-page__icon">
                            <PageIcon size={15} />
                          </div>

                          <div className="cs-page__info">
                            <div className="cs-page__label-row">
                              <span className="cs-page__label">{page.label}</span>
                              {page.badge && (
                                <span className="cs-page__badge">{page.badge}</span>
                              )}
                            </div>
                            <span className="cs-page__desc">{page.desc}</span>
                          </div>

                          {!isCandidateLoggedIn && isProtected ? (
                            <span title="Login Required">
                              <FiLock size={13} className="cs-page__lock" />
                            </span>
                          ) : (
                            <FiChevronRight size={14} className="cs-page__arrow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>


      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
