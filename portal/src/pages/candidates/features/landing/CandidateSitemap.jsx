import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiUser, FiBriefcase, FiGrid, FiBookOpen,
  FiAward, FiStar, FiZap, FiFileText, FiCalendar,
  FiGlobe, FiDollarSign, FiInfo, FiMenu, FiChevronRight,
  FiLock, FiLogIn,
} from 'react-icons/fi';
import { FaBuilding, FaGraduationCap, FaXTwitter } from 'react-icons/fa6';
import { FaLinkedinIn, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { useAuth } from "../../../../AuthContext";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import './CandidateSitemap.css';
import LandingFooter from '../../../../components/LandingFooter';

const protectedPaths = new Set([
  '/dashboard', '/profile', '/saved-jobs', '/daily-quiz',
  '/resume-builder', '/resume-view', '/profile/resume', '/leave',
  '/info',
]);

const employerPublicPaths = new Set([
  '/employer-help',
]);

const candidateGroups = [
  {
    title: 'Dashboard & Profile', icon: FiUser,
    pages: [
      { label: 'Dashboard', path: '/dashboard', icon: FiHome, desc: 'Your personalized home feed and overview.' },
      { label: 'My Profile', path: '/profile', icon: FiUser, desc: 'Edit and manage your professional profile.' },
      { label: 'Resume Builder', path: '/resume-builder', icon: FiFileText, desc: 'Create a standout resume with our builder.' },
    ],
  },
  {
    title: 'Jobs & Applications', icon: FiBriefcase,
    pages: [
      { label: 'Browse Jobs', path: '/jobs', icon: FiGrid, desc: 'Explore thousands of job openings.' },
      { label: 'Application Status', path: '/info', icon: FiBookOpen, desc: 'Track the status of your applications.' },
    ],
  },
  {
    title: 'Companies', icon: FaBuilding,
    pages: [
      { label: 'Explore Companies', path: '/companies', icon: FiGlobe, desc: 'Discover top companies and employers.' },
    ],
  },
  {
    title: 'Growth & Learning', icon: FaGraduationCap,
    pages: [
      { label: 'Blogs & Articles', path: '/blogs', icon: FiBookOpen, desc: 'Read career tips and industry insights.' },
      { label: 'Salary Insights', path: '/salary-insights', icon: FiDollarSign, desc: 'Research salaries by role and location.' },
    ],
  },
  {
    title: 'Premium & Services', icon: FiStar,
    pages: [
      { label: 'Maven Pro', path: '/pro', icon: FiZap, desc: 'Unlock advanced career tools and insights.' },
      { label: 'Premium', path: '/premium', icon: FiAward, desc: 'Go premium for exclusive benefits.' },
      { label: 'Services', path: '/services', icon: FiStar, desc: 'Explore our range of career services.' },
    ],
  },
  {
    title: 'More', icon: FiMenu,
    pages: [
      { label: 'Leave / Time Off', path: '/leave', icon: FiCalendar, desc: 'Manage your leave requests.' },
      { label: 'About Page', path: '/maven-jobs/about', icon: FiInfo, desc: 'Learn more about MavenJobs.' },
    ],
  },
];

const employerGroups = [
  {
    title: 'Dashboard & Jobs', icon: FiBriefcase,
    pages: [
      { label: 'Employer Dashboard', path: '/employer-dashboard', icon: FiHome, desc: 'Manage your hiring activity.' },
      { label: 'Post a Job', path: '/post-job', icon: FiFileText, desc: 'Create and publish job listings.' },
      { label: 'Draft Jobs', path: '/employer-draft-jobs', icon: FiFileText, desc: 'View and edit draft job posts.' },
    ],
  },
  {
    title: 'Talent & Hiring', icon: FiUser,
    pages: [
      { label: 'Resdex – Search Resumes', path: '/resdex', icon: FiGrid, desc: 'Search candidate resumes.' },
      { label: 'Talent Pulse', path: '/talent-pulse', icon: FiZap, desc: 'Discover talent insights.' },
      { label: 'Hiring Automation', path: '/hiring-automation', icon: FiFileText, desc: 'Automate your hiring workflow.' },
    ],
  },
  {
    title: 'Branding & Resources', icon: FiStar,
    pages: [
      { label: 'Branding', path: '/branding', icon: FiAward, desc: 'Build your employer brand.' },
      { label: 'Job Posting Solutions', path: '/job-posting', icon: FiGlobe, desc: 'Explore job posting plans.' },
      { label: 'Buy Online', path: '/buy-online', icon: FiDollarSign, desc: 'Purchase hiring credits online.' },
      { label: 'Analytics', path: '/employer-dashboard/analytics', icon: FiGrid, desc: 'Track hiring metrics.' },
      { label: 'Help Center', path: '/employer-help', icon: FiInfo, desc: 'Get support and guidance.' },
    ],
  },
];

const socialLinks = [
  { icon: FaXTwitter, url: 'https://x.com/Maven_Jobs', label: 'X' },
  { icon: FaLinkedinIn, url: 'https://www.linkedin.com/company/mavenjobs-in/', label: 'LinkedIn' },
  { icon: FaFacebookF, url: 'https://www.facebook.com/mavenjobs.in', label: 'Facebook' },
  { icon: FaInstagram, url: 'https://www.instagram.com/mavenjobs.in/', label: 'Instagram' },
];

export default function SiteMap() {
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const isCandidateLoggedIn = !!user;
  const isEmployerLoggedIn = !!localStorage.getItem('employerToken');

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleCandidateClick = useCallback((page) => {
    if (isCandidateLoggedIn || !protectedPaths.has(page.path)) {
      navigate(page.path);
    } else {
      openLogin();
    }
  }, [isCandidateLoggedIn, navigate, openLogin]);

  const handleEmployerClick = useCallback((path) => {
    if (isEmployerLoggedIn || employerPublicPaths.has(path)) {
      navigate(path);
    } else {
      navigate('/employer-login');
    }
  }, [isEmployerLoggedIn, navigate]);

  const showCandidateSection = !isEmployerLoggedIn;
  const showEmployerSection = !isCandidateLoggedIn;

  return (
    <div className="cs-root">
      {/* Navbar */}
      <nav className={`cs-nav${isScrolled ? ' cs-nav--scrolled' : ''}`}>
        <div className="cs-nav__inner">
          <div className="cs-nav__brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={mavenLogo} alt="MavenJobs" className="cs-nav__logo" />
          </div>
          <div className="cs-nav__actions">
            {user ? (
              <AvatarDropdown />
            ) : (
              <>
                <button className="cs-btn cs-btn--ghost" onClick={() => openLogin()}>Sign In</button>
                <button className="cs-btn cs-btn--primary" onClick={() => navigate('/employer-login')}>Employer Sign In</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="cs-header">
        <div className="cs-header__bg" />
        <div className="cs-header__content">
          <span className="cs-header__badge">Site Map</span>
          <h1 className="cs-header__title">Explore Everything on MavenJobs</h1>
          <p className="cs-header__sub">
            {!isCandidateLoggedIn && !isEmployerLoggedIn
              ? 'Navigate to any page, tool, or feature. Some pages require signing in.'
              : 'Navigate to any page available to you.'}
          </p>
        </div>
      </header>

      {/* Sitemap Grid */}
      <main className="cs-main">
        <div className="cs-grid">
          {showCandidateSection && candidateGroups.map((group) => (
            <div key={group.title} className="cs-group">
              <div className="cs-group__hd">
                <div className="cs-group__icon"><group.icon size={16} /></div>
                <h2 className="cs-group__title">{group.title}</h2>
              </div>
              <div className="cs-group__body">
                {group.pages.map((page) => {
                  const isProtected = protectedPaths.has(page.path);
                  return (
                    <button key={page.path} className="cs-page" onClick={() => handleCandidateClick(page)}>
                      <div className="cs-page__icon"><page.icon size={15} /></div>
                      <div className="cs-page__info">
                        <span className="cs-page__label">{page.label}</span>
                        <span className="cs-page__desc">{page.desc}</span>
                      </div>
                      {!isCandidateLoggedIn && isProtected ? (
                        <FiLock size={13} className="cs-page__lock" />
                      ) : (
                        <FiChevronRight size={14} className="cs-page__arrow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {showEmployerSection && (
            <>
              {!isCandidateLoggedIn && (
                <div className="cs-section-heading">
                  <h2>For Employers</h2>
                </div>
              )}
              {employerGroups.map((group) => (
                <div key={group.title} className="cs-group">
                  <div className="cs-group__hd">
                    <div className="cs-group__icon"><group.icon size={16} /></div>
                    <h2 className="cs-group__title">{group.title}</h2>
                  </div>
                  <div className="cs-group__body">
                    {group.pages.map((page) => (
                      <button key={page.path} className="cs-page" onClick={() => handleEmployerClick(page.path)}>
                        <div className="cs-page__icon"><page.icon size={15} /></div>
                        <div className="cs-page__info">
                          <span className="cs-page__label">{page.label}</span>
                          <span className="cs-page__desc">{page.desc}</span>
                        </div>
                        {!isEmployerLoggedIn && !employerPublicPaths.has(page.path) ? (
                          <FiLogIn size={13} className="cs-page__lock" />
                        ) : (
                          <FiChevronRight size={14} className="cs-page__arrow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
    <LandingFooter />
    </div>
  );
}
