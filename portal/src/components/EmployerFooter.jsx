import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import mavenLogo from '../../assets/maven-logo-BdiSsfJk.svg';
import './EmployerFooter.css';

export default function EmployerFooter() {
  return (
    <footer className="emp-footer">
      <div className="emp-footer-inner">
        <div className="emp-footer-top">
          <div className="emp-footer-col">
            <h4>Recruiter services</h4>
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
          </div>
          
          <div className="emp-footer-col">
            <h4>Customer support</h4>
            <p>Toll Free: 1800 102 5558</p>
            <p>(10:00 AM to 6:00 PM, Mon - Sat)</p>
            <a href="mailto:support@mavenjobs.com">support@mavenjobs.com</a>
          </div>
        </div>

        <div className="emp-footer-sales">
          <h4 className="emp-footer-sales-main-heading">Sales enquiries</h4>
          <h5 className="emp-footer-sales-sub-heading">India</h5>
          
          <div className="emp-footer-sales-grid">
            <div className="emp-footer-sales-item">
              <strong>North Zone</strong>
              <p>Toll Free: 1800 102 2558</p>
              <p>(10:00 AM to 6:00 PM)</p>
              <p>+91 - 9818882211</p>
              <a href="mailto:north@mavenjobs.com">north@mavenjobs.com</a>
            </div>

            <div className="emp-footer-sales-item">
              <strong>South Zone</strong>
              <p>Toll Free: 1800 102 2559</p>
              <p>(10:00 AM to 6:00 PM)</p>
              <p>+91 - 9818882212</p>
              <a href="mailto:south@mavenjobs.com">south@mavenjobs.com</a>
            </div>

            <div className="emp-footer-sales-item">
              <strong>East Zone</strong>
              <p>Toll Free: 1800 102 2560</p>
              <p>(10:00 AM to 6:00 PM)</p>
              <p>+91 - 9818882213</p>
              <a href="mailto:east@mavenjobs.com">east@mavenjobs.com</a>
            </div>

            <div className="emp-footer-sales-item">
              <strong>West Zone</strong>
              <p>Toll Free: 1800 102 2561</p>
              <p>(10:00 AM to 6:00 PM)</p>
              <p>+91 - 9818882214</p>
              <a href="mailto:west@mavenjobs.com">west@mavenjobs.com</a>
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
            <a href="https://www.instagram.com/@mavenjobs" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
