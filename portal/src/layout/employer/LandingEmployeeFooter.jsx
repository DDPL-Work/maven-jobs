import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';
import './LandingEmployeeFooter.css';

export default function EmployerFooter() {
  return (
    <footer className="emp-footer">
      <div className="emp-footer-inner">
        <div className="emp-footer-top">
          <div className="emp-footer-col">
            <h4>Recruiter services</h4>
            <Link to="/maven-talent-cloud">Maven Talent Cloud</Link>
            <Link to="/post-job">Job Posting</Link>
            <a href="#">Resume Database (Resdex)</a>
            <a href="#">Employer Branding</a>
            <a href="#">Talent Pulse</a>
          </div>
          
          <div className="emp-footer-col">
            <h4>Information</h4>
            <Link to="/maven-jobs/about">About us</Link>
            <a href="#">Clients</a>
            <a href="#">Careers</a>
            <Link to="/maven-jobs/employer-terms">Terms & Conditions</Link>
            <Link to="/maven-jobs/employer-privacy">Privacy policy</Link>
            <a href="#">Jobseeker home</a>
            <a href="#">FAQs</a>
          </div>
          
          <div className="emp-footer-col">
            <h4>Legal</h4>
            <Link to="/maven-jobs/employer-grievance">Grievances</Link>
            <Link to="/maven-jobs/summons">Summons and Notice</Link>
            <Link to="/maven-jobs/trust-safety">Trust and Safety</Link>
            <Link to="/maven-jobs/whitehat">Whitehat</Link>
            <Link to="/maven-jobs/zones">Find Your Zone</Link>
          </div>
          
          <div className="emp-footer-col">
            <h4>Contact Details</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
              <FiPhone style={{ flexShrink: 0, color: '#38bdf8' }} size={14} />
              <a href="tel:+917015999431" style={{ color: 'inherit', textDecoration: 'none' }}>+91 7015999431</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px' }}>
              <FiMail style={{ marginTop: '3px', flexShrink: 0, color: '#38bdf8' }} size={14} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <a href="mailto:crm@mavenjobs.in" style={{ color: 'inherit', textDecoration: 'none' }}>crm@mavenjobs.in</a>
                <a href="mailto:info@mavenjobs.in" style={{ color: 'inherit', textDecoration: 'none' }}>info@mavenjobs.in</a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
              <FiMapPin style={{ marginTop: '3px', flexShrink: 0, color: '#38bdf8' }} size={15} />
              <span>S11, Phase 2, 2nd Floor, Mittal Mega Mall, S-11, Phase, Sector 25, Panipat, Haryana 132104</span>
            </div>
          </div>
        </div>

        <div className="emp-footer-bottom">
          <div className="emp-footer-brand">
            {/* using brightness(0) invert(1) on the logo to make it white if it's currently colored/black */}
            <img src={mavenLogo} alt="Maven Jobs" />
          </div>
          
          <div className="emp-footer-copyright">
            &copy; {new Date().getFullYear()} MavenJobs Private Limited | All Rights Reserved
          </div>

          <div className="emp-footer-socials">
            <a href="https://www.linkedin.com/company/mavenjobs-in/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn size={14} />
            </a>
            <a href="https://www.instagram.com/mavenjobs.in" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
