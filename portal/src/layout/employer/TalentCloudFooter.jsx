import React from 'react';
import { Link } from 'react-router-dom';
import { FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';
import './TalentCloudFooter.css';

export default function TalentCloudFooter({ onSelectTab, onSelectBrand }) {
  const offerings = [
    { id: 'sourcing', label: 'Talent Sourcing' },
    { id: 'planning', label: 'Talent Planning' },
    { id: 'screening', label: 'Screening and Evaluation' },
    { id: 'branding', label: 'Employer Branding' },
    { id: 'automation', label: 'Hiring Automation' },
    { id: 'assisted', label: 'Assisted Hiring' },
  ];

  const brands = [
    { id: 'maven-jobs', label: 'Maven Jobs', link: '/post-job' },
    { id: 'executive', label: 'Executive Search', link: '/maven-talent-cloud?tab=sourcing#solutions-section' },
    { id: 'tech', label: 'Tech Talent Hub', link: '/maven-talent-cloud?tab=sourcing#solutions-section' },
    { id: 'campus', label: 'Maven Campus', link: '/maven-talent-cloud?tab=sourcing#solutions-section' },
    { id: 'reviews', label: 'Company Reviews & Insights', link: '/maven-talent-cloud?tab=branding#solutions-section' },
    { id: 'assessment', label: 'Skill Assessment', link: '/maven-talent-cloud?tab=screening#solutions-section' },
    { id: 'branding', label: 'Employer Branding Edge', link: '/maven-talent-cloud?tab=branding#solutions-section' },
    { id: 'assist', label: 'Maven Assist', link: '/maven-talent-cloud?tab=assisted#solutions-section' },
    { id: 'automation', label: 'Hiring Automation Suite', link: '/maven-talent-cloud?tab=automation#solutions-section' },
  ];

  const handleOfferingClick = (id) => {
    if (onSelectTab) {
      onSelectTab(id);
    } else {
      const el = document.getElementById('solutions-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBrandClick = (brand) => {
    if (onSelectBrand) {
      onSelectBrand(brand);
    } else {
      const el = document.getElementById('solutions-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="mtc-footer">
      <div className="mtc-footer-container">
        <div className="mtc-footer-main">
          {/* Left Column: Brand & Tagline */}
          <div className="mtc-footer-brand-col">
            <Link to="/maven-talent-cloud" className="mtc-footer-brand-header">
              <img src={mavenLogo} alt="Maven Jobs" className="mtc-footer-logo-img" />
              <div className="mtc-footer-brand-title">
                 <strong>talent</strong> <span>cloud</span>
              </div>
            </Link>

            <h3 className="mtc-footer-tagline">
              One-Stop Solution. Talent Decoded.
            </h3>

            <p className="mtc-footer-desc">
              One-stop solution for planning, sourcing, screening, employer branding, 
              hiring automation, powered by Maven AI to help you decode top talent.
            </p>

            <div className="mtc-footer-socials">
              <a 
                href="https://www.linkedin.com/company/mavenjobs-in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mtc-footer-social-btn"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={15} />
              </a>
              <a 
                href="https://www.instagram.com/mavenjobs.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mtc-footer-social-btn"
                aria-label="Instagram"
              >
                <FaInstagram size={15} />
              </a>
            </div>
          </div>

          {/* Middle Column: Offerings */}
          <div>
            <h4 className="mtc-footer-col-heading">Offerings</h4>
            <ul className="mtc-footer-links-list">
              {offerings.map((item) => (
                <li key={item.id}>
                  <button 
                    type="button" 
                    onClick={() => handleOfferingClick(item.id)} 
                    className="mtc-footer-link"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Brands */}
          <div>
            <h4 className="mtc-footer-col-heading">Brands</h4>
            <ul className="mtc-footer-links-list">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <button 
                    type="button" 
                    onClick={() => handleBrandClick(brand)} 
                    className="mtc-footer-link"
                  >
                    {brand.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mtc-footer-bottom">
          <div className="mtc-footer-copyright">
            &copy; {new Date().getFullYear()} Maven Jobs. All rights reserved
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/blogs" style={{ color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>Blogs</Link>
            <Link to="/employer-login#faq" style={{ color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>FAQs</Link>
            <Link to="/employer-login" style={{ color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>Employer Login</Link>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>Jobseeker Home</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
