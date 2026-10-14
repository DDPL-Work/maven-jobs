import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiArrowRight } from 'react-icons/fi';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';
import './TalentCloudHeader.css';

export default function TalentCloudHeader({ onSelectTab, onRequestDemo }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const offerings = [
    { id: 'sourcing', label: 'Talent Sourcing' },
    { id: 'planning', label: 'Talent Planning' },
    { id: 'screening', label: 'Screening and Evaluation' },
    { id: 'branding', label: 'Employer Branding' },
    { id: 'automation', label: 'Hiring Automation' },
    { id: 'assisted', label: 'Assisted Hiring' },
  ];

  const handleOfferingClick = (id) => {
    setDropdownOpen(false);
    if (onSelectTab) {
      onSelectTab(id);
    } else {
      const el = document.getElementById('solutions-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleDemoClick = (e) => {
    e?.preventDefault();
    if (onRequestDemo) {
      onRequestDemo();
    } else {
      const el = document.getElementById('demo-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="mtc-header">
      <div className="mtc-header-container">
        {/* Brand Logo & Name */}
        <Link to="/maven-talent-cloud" className="mtc-header-brand">
          <img src={mavenLogo} alt="Maven Jobs" className="mtc-header-logo-img" />
          <div className="mtc-header-brand-text">
            <strong>talent</strong> <span>cloud</span>
          </div>
        </Link>

        {/* Right Nav */}
        <div className="mtc-header-right">
          {/* Hiring Needs Dropdown */}
          <div 
            className={`mtc-dropdown-wrap ${dropdownOpen ? 'open' : ''}`}
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button 
              type="button" 
              className="mtc-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Hiring Needs 
              <FiChevronDown size={15} className="mtc-dropdown-chevron" />
            </button>

            <div className="mtc-dropdown-menu">
              {offerings.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOfferingClick(item.id)}
                  className="mtc-dropdown-item"
                >
                  <span>{item.label}</span>
                  <FiArrowRight size={13} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Request Demo Button */}
          <button 
            type="button" 
            onClick={handleDemoClick} 
            className="mtc-header-btn-demo"
          >
            Request Demo
          </button>
        </div>
      </div>
    </header>
  );
}
