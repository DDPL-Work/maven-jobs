import React from 'react';
import { Link } from 'react-router-dom';
import mavenLogo from '../../../assets/maven-logo-BdiSsfJk.svg';

export default function EmployerFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#334155',
      marginTop: 'auto',
      width: '100%',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '48px 24px 28px',
      }}>
        {/* Top 4-Column Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px 40px',
          alignItems: 'start',
        }}>
          {/* Column 1: Brand & Recruiter Helpline */}
          <div>
            <Link to="/employer-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <img
                src={mavenLogo}
                alt="Maven Jobs"
                style={{ height: 32, width: 'auto', display: 'block', objectFit: 'contain' }}
              />
              
            </Link>

            <div style={{ marginTop: 8 }}>
              <h4 style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}>
                Recruiter Helpline
              </h4>
              <a
                href="tel:18001025558"
                style={{
                  display: 'inline-block',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#0f172a',
                  textDecoration: 'none',
                  margin: '4px 0 6px',
                  letterSpacing: '0.02em',
                }}
              >
                1800 102 5558
              </a>
              <p style={{
                fontSize: 13,
                color: '#64748b',
                margin: '0 0 10px',
                lineHeight: 1.4,
              }}>
                10:00 AM to 6:00 PM, Mon - Sat
              </p>
              <Link
                to="/maven-jobs/contact"
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Column 2: Recruiter Solutions */}
          <div>
            <h4 style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 16px',
              letterSpacing: '-0.01em',
            }}>
              Recruiter Solutions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink to="/employer-dashboard">Home</FooterLink>
              <FooterLink to="/post-job">Jobs & Responses</FooterLink>
              <FooterLink to="/resdex">Resdex</FooterLink>
              <FooterLink to="/report/resdex">Reports</FooterLink>
            </div>
          </div>

          {/* Column 3: Information */}
          <div>
            <h4 style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 16px',
              letterSpacing: '-0.01em',
            }}>
              Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink to="/">Jobseeker Home</FooterLink>
              <FooterLink to="/maven-jobs/about">About Us</FooterLink>
              <FooterLink to="/employer-dashboard">Clients</FooterLink>
              <FooterLink to="/maven-jobs/careers">Careers</FooterLink>
              <FooterLink to="/maven-jobs/terms">Terms & Conditions</FooterLink>
              <FooterLink to="/maven-jobs/privacy">Privacy policy</FooterLink>
              <FooterLink to="/blogs">Learning Center</FooterLink>
              <FooterLink to="/sitemap">Site Map</FooterLink>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 16px',
              letterSpacing: '-0.01em',
            }}>
              Legal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink to="/maven-jobs/grievance">Grievances</FooterLink>
              <FooterLink to="/maven-jobs/summons">Summons and Notice</FooterLink>
              <FooterLink to="/maven-jobs/trust-safety">Trust and Safety</FooterLink>
              <FooterLink to="/maven-jobs/whitehat">Whitehat</FooterLink>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div style={{
          marginTop: 44,
          paddingTop: 24,
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 13,
            color: '#64748b',
            margin: 0,
            fontWeight: 400,
          }}>
            All rights reserved @{currentYear} Maven Jobs (India) Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 13.5,
        color: '#475569',
        textDecoration: 'none',
        lineHeight: 1.3,
        transition: 'color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#002366';
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#475569';
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {children}
    </Link>
  );
}