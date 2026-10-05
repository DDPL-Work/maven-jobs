import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployerFooter from '../../../../../components/EmployerFooter';
import mavenLogo from '../../../../../../assets/maven-logo-BdiSsfJk.svg';
import mentor1 from '../../../../../../assets/mentor1.png';
import mentor2 from '../../../../../../assets/mentor2.png';
import mentor3 from '../../../../../../assets/mentor3.png';
import {
  FiBook, FiClock, FiCheckCircle, FiArrowRight, FiArrowLeft,
  FiList, FiCalendar, FiUsers, FiHelpCircle, FiX, FiExternalLink,
  FiChevronRight
} from 'react-icons/fi';
import LcHeader from '../LcHeader';
import './GuidePages.css';

export default function GuideLayout({
  guideId,
  title,
  subtitle,
  category,
  categoryColor = '#002366',
  badgeText = 'Complete Guide',
  readTime = '12 min read',
  lastUpdated = 'October 2026',
  author = { name: 'Nancy', role: 'AI Hiring Specialist', img: mentor2 },
  heroKeyPoints = [],
  heroAction = { label: 'Explore Tool', onClick: () => {} },
  tocSections = [],
  prevGuide = null,
  nextGuide = null,
  children
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(tocSections[0]?.id || '');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Track scroll progress and active section
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }

      // Check which section is in view
      const scrollPosition = window.scrollY + 140;
      for (let i = tocSections.length - 1; i >= 0; i--) {
        const el = document.getElementById(tocSections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(tocSections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocSections]);

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileDrawerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="gl-page">
      {/* ─── STICKY HEADER (REUSED FROM LEARNING CENTER) ─── */}
      <LcHeader activeSection="guides" />

      {/* Reading progress bar */}
      <div
        className="gl-reading-progress"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ─── HERO BANNER ─── */}
      <section className="gl-hero">
        <div className="gl-hero-inner">
          <nav className="gl-breadcrumbs" aria-label="Breadcrumb">
            <span
              className="gl-breadcrumb-link"
              onClick={() => navigate('/employers/learning-center')}
            >
              Learning Center
            </span>
            <span className="gl-breadcrumb-sep"><FiChevronRight size={12} /></span>
            <span
              className="gl-breadcrumb-link"
              onClick={() => navigate('/employers/learning-center#lc-section-guides')}
            >
              Guides
            </span>
            <span className="gl-breadcrumb-sep"><FiChevronRight size={12} /></span>
            <span className="gl-breadcrumb-active">{category}</span>
          </nav>

          <div className="gl-hero-grid">
            <div className="gl-hero-main">
              <div className="gl-hero-badge-row">
                <span
                  className="gl-category-tag"
                  style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                >
                  <FiBook size={13} /> {badgeText}
                </span>
                <span className="gl-time-badge">
                  <FiClock size={13} /> {readTime}
                </span>
                <span className="gl-status-badge">
                  <FiCheckCircle size={13} /> Verified for 2026
                </span>
              </div>

              <h1 className="gl-hero-title">{title}</h1>
              <p className="gl-hero-subtitle">{subtitle}</p>

              <div className="gl-hero-meta">
                <div className="gl-hero-meta-item">
                  <img
                    src={author.img}
                    alt={author.name}
                    className="gl-author-avatar"
                  />
                  <span>Curated by <strong>{author.name}</strong> ({author.role})</span>
                </div>
                <div className="gl-hero-meta-item">
                  <span>Last updated: <strong>{lastUpdated}</strong></span>
                </div>
              </div>
            </div>

            {/* Hero Quick Overview Card */}
            <div className="gl-hero-card">
              <div className="gl-hero-card-header">
                <div
                  className="gl-hero-card-icon"
                  style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                >
                  <FiBook />
                </div>
                <div>
                  <h3 className="gl-hero-card-title">What You'll Learn</h3>
                  <p className="gl-hero-card-subtitle">Key takeaways in this guide</p>
                </div>
              </div>

              <ul className="gl-hero-card-points">
                {heroKeyPoints.map((point, idx) => (
                  <li key={idx}>
                    <FiCheckCircle size={15} color={categoryColor} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {heroAction && (
                <button
                  className="gl-hero-card-btn"
                  style={{ backgroundColor: categoryColor, color: '#fff' }}
                  onClick={heroAction.onClick}
                >
                  {heroAction.label} <FiArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TWO-COLUMN GUIDE CONTAINER ─── */}
      <main className="gl-container">
        {/* Left Sticky Sidebar */}
        <aside className="gl-sidebar">
          <div className="gl-toc-box">
            <div className="gl-toc-header">
              <h3 className="gl-toc-title">
                <FiList size={15} /> Guide Contents
              </h3>
              <span className="gl-toc-count">{tocSections.length} sections</span>
            </div>

            <nav className="gl-toc-nav" aria-label="Table of Contents">
              {tocSections.map((sec, idx) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={`gl-toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => scrollTo(sec.id)}
                  >
                    <span className="gl-toc-item-step">{idx + 1}</span>
                    <span className="gl-toc-item-label">{sec.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Webinar / Assistance Widget */}
          <div className="gl-sidebar-widget">
            <h4>Live Masterclass</h4>
            <p>Prefer live instruction? Join our weekday masterclasses with platform coaches.</p>
            <button
              className="gl-widget-btn"
              onClick={() => navigate('/employers/learning-center#lc-section-webinars')}
            >
              <FiCalendar size={14} /> View Free Webinars
            </button>
          </div>
        </aside>

        {/* Right Main Content */}
        <div className="gl-content">
          {children}

          {/* ─── BOTTOM NAVIGATION ─── */}
          <div className="gl-bottom-nav">
            {prevGuide ? (
              <div
                className="gl-nav-card prev"
                onClick={() => navigate(prevGuide.path)}
              >
                <div className="gl-nav-card-arrow">
                  <FiArrowLeft />
                </div>
                <div>
                  <div className="gl-nav-card-dir">Previous Guide</div>
                  <div className="gl-nav-card-title">{prevGuide.title}</div>
                </div>
              </div>
            ) : (
              <div
                className="gl-nav-card prev"
                onClick={() => navigate('/employers/learning-center')}
              >
                <div className="gl-nav-card-arrow">
                  <FiArrowLeft />
                </div>
                <div>
                  <div className="gl-nav-card-dir">Overview</div>
                  <div className="gl-nav-card-title">Back to Learning Center</div>
                </div>
              </div>
            )}

            {nextGuide ? (
              <div
                className="gl-nav-card next"
                onClick={() => navigate(nextGuide.path)}
              >
                <div className="gl-nav-card-arrow">
                  <FiArrowRight />
                </div>
                <div>
                  <div className="gl-nav-card-dir">Next Guide</div>
                  <div className="gl-nav-card-title">{nextGuide.title}</div>
                </div>
              </div>
            ) : (
              <div
                className="gl-nav-card next"
                onClick={() => navigate('/employers/learning-center')}
              >
                <div className="gl-nav-card-arrow">
                  <FiArrowRight />
                </div>
                <div>
                  <div className="gl-nav-card-dir">Overview</div>
                  <div className="gl-nav-card-title">Explore All Modules</div>
                </div>
              </div>
            )}
          </div>

          {/* ─── RECRUITER SUPPORT BANNER ─── */}
          <section className="gl-support-banner">
            <div className="gl-support-info">
              <h3>Need Personalized Assistance with Your Hiring Mandates?</h3>
              <p>
                Our enterprise talent coaches conduct 1-on-1 workflow reviews to help you optimize search strings, job descriptions, and AI outreach automation.
              </p>
            </div>
            <div className="gl-support-actions">
              <button
                type="button"
                className="gl-btn-primary"
                onClick={() => navigate('/expert-assist')}
              >
                <FiUsers size={16} />
                <span>Request Coach Assist</span>
              </button>
              <button
                type="button"
                className="gl-btn-outline"
                onClick={() => navigate('/employer-help')}
              >
                <FiHelpCircle size={16} />
                <span>Help Center</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* ─── MOBILE FLOATING TOC BUTTON ─── */}
      <button
        className="gl-mobile-toc-fab"
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Open Table of Contents"
      >
        <FiList size={16} /> Contents ({tocSections.length})
      </button>

      {/* ─── MOBILE DRAWER OVERLAY ─── */}
      {mobileDrawerOpen && (
        <div
          className="gl-mobile-drawer-overlay"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      <div className={`gl-mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="gl-mobile-drawer-header">
          <h3 className="gl-toc-title">
            <FiList size={16} /> Guide Contents
          </h3>
          <button
            className="gl-mobile-drawer-close"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <FiX />
          </button>
        </div>
        <nav className="gl-toc-nav">
          {tocSections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              className={`gl-toc-item ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => scrollTo(sec.id)}
            >
              <span className="gl-toc-item-step">{idx + 1}</span>
              <span className="gl-toc-item-label">{sec.title}</span>
            </button>
          ))}
        </nav>
      </div>

      <EmployerFooter />
    </div>
  );
}
