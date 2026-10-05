import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import {
  FiChevronDown, FiZap, FiBriefcase,
  FiSearch, FiArrowRight
} from 'react-icons/fi';
import './LearningCenter.css';

export default function LcHeader({ activeSection = 'guides', onNav }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);
  const guidesDropdownRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guidesDropdownRef.current && !guidesDropdownRef.current.contains(e.target)) {
        setGuidesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleNav = (secId) => {
    if (onNav) {
      onNav(secId);
    } else {
      navigate(`/employers/learning-center#lc-section-${secId}`);
      setTimeout(() => {
        const el = document.getElementById(`lc-section-${secId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const isGuidesActive =
    activeSection === 'guides' ||
    location.pathname.includes('/guides/') ||
    guidesDropdownOpen;

  return (
    <header className={`lc-header ${scrolled ? 'lc-header--scrolled' : ''}`}>
      <div className="lc-header-inner">
        <div
          className="lc-header-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/employers/learning-center')}
        >
          <img src={mavenLogo} alt="MavenJobs" className="lc-header-logo" />
          <span className="lc-header-title">Learning Center</span>
        </div>

        <nav className="lc-header-nav">
          <button
            className={`lc-header-nav-btn ${activeSection === 'cert' ? 'active' : ''}`}
            onClick={() => handleNav('cert')}
          >
            <span className="lc-nav-text-full">Certification Programme</span>
            <span className="lc-nav-text-short">Certification</span>
            <span className="lc-header-free-pill">Free</span>
          </button>

          <button
            className={`lc-header-nav-btn ${activeSection === 'webinars' ? 'active' : ''}`}
            onClick={() => handleNav('webinars')}
          >
            Webinars
          </button>

          {/* Guides Dropdown with 3 options */}
          <div className="lc-header-dropdown-wrap" ref={guidesDropdownRef}>
            <button
              type="button"
              className={`lc-header-nav-btn ${isGuidesActive ? 'active' : ''}`}
              onClick={() => setGuidesDropdownOpen(prev => !prev)}
            >
              Guides <FiChevronDown size={14} className={`lc-nav-chevron ${guidesDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {guidesDropdownOpen && (
              <div className="lc-header-dropdown-menu">
                <div className="lc-header-dropdown-heading">PRODUCT GUIDES</div>

                <Link
                  to="/employers/learning-center/guides/ai-rex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lc-header-dropdown-item"
                  onClick={() => setGuidesDropdownOpen(false)}
                >
                  <div className="lc-dropdown-item-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                    <FiZap size={16} />
                  </div>
                  <div className="lc-dropdown-item-text">
                    <div className="lc-dropdown-item-title">
                      AI REX Guide
                      <span className="lc-dropdown-badge" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>New</span>
                    </div>
                    <div className="lc-dropdown-item-desc">Agentic sourcing & automated screening</div>
                  </div>
                </Link>

                <Link
                  to="/employers/learning-center/guides/job-posting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lc-header-dropdown-item"
                  onClick={() => setGuidesDropdownOpen(false)}
                >
                  <div className="lc-dropdown-item-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <FiBriefcase size={16} />
                  </div>
                  <div className="lc-dropdown-item-text">
                    <div className="lc-dropdown-item-title">
                      Job Posting Guide
                      <span className="lc-dropdown-badge" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>Popular</span>
                    </div>
                    <div className="lc-dropdown-item-desc">Post jobs, write JDs & manage responses</div>
                  </div>
                </Link>

                <Link
                  to="/employers/learning-center/guides/resdex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lc-header-dropdown-item"
                  onClick={() => setGuidesDropdownOpen(false)}
                >
                  <div className="lc-dropdown-item-icon" style={{ backgroundColor: '#eff6ff', color: '#002366' }}>
                    <FiSearch size={16} />
                  </div>
                  <div className="lc-dropdown-item-text">
                    <div className="lc-dropdown-item-title">
                      Resdex Master Guide
                      <span className="lc-dropdown-badge" style={{ backgroundColor: '#eff6ff', color: '#002366' }}>10Cr+ CVs</span>
                    </div>
                    <div className="lc-dropdown-item-desc">Boolean search & deep filters playbook</div>
                  </div>
                </Link>

                <div className="lc-header-dropdown-footer">
                  <button
                    type="button"
                    className="lc-dropdown-footer-link"
                    onClick={() => {
                      setGuidesDropdownOpen(false);
                      handleNav('guides');
                    }}
                  >
                    View All in Guides Section <FiArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
