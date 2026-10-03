import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiBriefcase, FiUsers, FiFileText, FiLayers,
  FiTrendingUp, FiAward, FiSettings, FiShield, FiHelpCircle,
  FiBookOpen, FiChevronRight, FiLock, FiFolder, FiExternalLink,
  FiGrid, FiBarChart2, FiDollarSign, FiCompass, FiMapPin,
  FiCheckCircle, FiCheck, FiCpu, FiTag, FiSmartphone, FiDownload
} from 'react-icons/fi';
import EmployerFooter from '../../../../layout/employer/EmployerFooter';
import './EmployerSideMap.css';
import EmployerHeader from '../../../../components/employer/EmployerHeader';

/* --------------------------------------------------------------------------
   Data Architecture: Grouped by operational modules for Clients & Recruiters
   Inspired by Naukri.com's Enterprise & Recruiter Directory
   -------------------------------------------------------------------------- */

const EMPLOYER_SECTIONS = [
  {
    id: 'job-posting',
    title: 'Job Posting & Application Management',
    desc: 'Publish active job openings, review applicant pipelines, and manage draft listings.',
    icon: FiBriefcase,
    color: '#2563eb',
    bg: '#eff6ff',
    tag: 'Core Hiring',
    items: [
      {
        title: 'Post a Job',
        path: '/post-job',
        desc: 'Create and publish vacancy requirements with custom screening questionnaires and SLAs.',
        roles: ['recruiter', 'client'],
        isProtected: true,
        tag: 'Instant Live'
      },
      {
        title: 'Manage Jobs & Responses',
        path: '/employer-dashboard/jobs-responses',
        desc: 'Track candidate applications across all active, paused, and closed job listings.',
        roles: ['recruiter', 'client'],
        isProtected: true,
        tag: 'Application Tracking'
      },
      {
        title: 'Draft Jobs',
        path: '/employer-draft-jobs',
        desc: 'Access saved drafts and complete unfinished job posting specifications.',
        roles: ['recruiter'],
        isProtected: true,
        tag: 'Drafts'
      },
      {
        title: 'Job Posting Solutions',
        path: '/job-posting',
        desc: 'Overview of enterprise job listing tiers, candidate reach, and visibility options.',
        roles: ['client'],
        isProtected: false,
        tag: 'Overview'
      },
      {
        title: 'Job Posting Reports & Analytics',
        path: '/reports-job-posting',
        desc: 'Funnel analytics covering impressions, views, application conversion rates, and drop-offs.',
        roles: ['client', 'recruiter'],
        isProtected: true,
        tag: 'Reports'
      }
    ]
  },
  {
    id: 'resdex',
    title: 'Resdex & Talent Sourcing Suite',
    desc: 'India’s premier candidate resume repository with advanced Boolean filters & matching.',
    icon: FiLayers,
    color: '#059669',
    bg: '#ecfdf5',
    tag: 'Candidate Search',
    items: [
      {
        title: 'Search Resumes (Resdex)',
        path: '/resume-search',
        desc: 'Search active white-collar profiles using Boolean queries, CTC filters, experience, and skills.',
        roles: ['recruiter'],
        isProtected: true,
        tag: 'Primary Search'
      },
      {
        title: 'Resdex Requirements Mandates',
        path: '/resdex-requirements',
        desc: 'Create automated role matching mandates to receive AI-curated talent batches daily.',
        roles: ['recruiter'],
        isProtected: true,
        tag: 'Automated'
      },
      {
        title: 'Saved Searches & Alerts',
        path: '/manage-search',
        desc: 'Save custom search strings and set instant email alerts when matching talent registers.',
        roles: ['recruiter'],
        isProtected: true,
        tag: 'Alerts'
      },
      {
        title: 'Candidate Folders & Shortlists',
        path: '/manage-folders',
        desc: 'Organize candidate resumes into project folders, collaborate with hiring managers, and export CVs.',
        roles: ['recruiter', 'client'],
        isProtected: true,
        tag: 'Pipeline'
      },
      {
        title: 'Similar CVs (SimCV)',
        path: '/simcv',
        desc: 'Instant algorithm-driven recommendations based on an ideal candidate profile or job description.',
        roles: ['recruiter'],
        isProtected: true,
        tag: 'AI Matching'
      },
      {
        title: 'Resdex Usage & Download Reports',
        path: '/report/resdex',
        desc: 'Audit recruiter CV views, contact unmasks, email outreach, and download quota utilization.',
        roles: ['client'],
        isProtected: true,
        tag: 'Audit Log'
      }
    ]
  },
  {
    id: 'branding',
    title: 'Employer Branding & Talent Intelligence',
    desc: 'Enhance your workplace employer value proposition and gain hiring market intelligence.',
    icon: FiAward,
    color: '#7c3aed',
    bg: '#f5f3ff',
    tag: 'EVP & Intelligence',
    items: [
      {
        title: 'Employer Branding Hub',
        path: '/branding',
        desc: 'Custom career site banners, workplace stories, leadership videos, and talent attraction suites.',
        roles: ['client'],
        isProtected: false,
        tag: 'EVP Builder'
      },
      {
        title: 'Talent Pulse Insights',
        path: '/talent-pulse',
        desc: 'Real-time talent supply, market salary benchmarks, competitor hiring trends, and notice period data.',
        roles: ['client', 'recruiter'],
        isProtected: false,
        tag: 'Market Intel'
      },
      {
        title: 'Hiring Automation & Workflows',
        path: '/hiring-automation',
        desc: 'Automate candidate status transitions, bulk interview scheduling, and feedback notifications.',
        roles: ['recruiter', 'client'],
        isProtected: false,
        tag: 'Workflow Automation'
      },
      {
        title: 'Resume Database Solutions',
        path: '/resume-database',
        desc: 'Comprehensive overview of database coverage, fresh talent volume, and candidate verification.',
        roles: ['client'],
        isProtected: false,
        tag: 'Database Info'
      }
    ]
  },
  {
    id: 'client-admin',
    title: 'Account, Team & Quota Administration',
    desc: 'Enterprise controls for account admins, multi-recruiter licenses, and balance tracking.',
    icon: FiSettings,
    color: '#0284c7',
    bg: '#f0f9ff',
    tag: 'Client Controls',
    items: [
      {
        title: 'Employer Dashboard Overview',
        path: '/employer-dashboard',
        desc: 'Central control room showcasing active jobs, total applications, team performance, and shortcuts.',
        roles: ['client', 'recruiter'],
        isProtected: true,
        tag: 'Cockpit'
      },
      {
        title: 'Company Profile & Credentials',
        path: '/company-profile',
        desc: 'Manage verified business details, GSTIN, headquarters address, culture showcase, and logos.',
        roles: ['client'],
        isProtected: true,
        tag: 'Verified Org'
      },
      {
        title: 'Sub-User & Team Management',
        path: '/employer/settings/users',
        desc: 'Add recruiter seats, assign role permissions, transfer candidate folders, and track logins.',
        roles: ['client'],
        isProtected: true,
        tag: 'User Access'
      },
      {
        title: 'Manage CV & Posting Quota',
        path: '/employer/settings/quota',
        desc: 'Track and allocate CV view balance, daily unmask caps, and job posting validity among recruiters.',
        roles: ['client'],
        isProtected: true,
        tag: 'Credits Allocation'
      },
      {
        title: 'My Subscriptions & Enterprise Licenses',
        path: '/my-subscriptions',
        desc: 'View active contracts, renewal dates, tax invoices, and license entitlement summaries.',
        roles: ['client'],
        isProtected: true,
        tag: 'Licenses'
      },
      {
        title: 'Product & Notification Settings',
        path: '/product-settings',
        desc: 'Configure email digests, candidate response alerts, two-factor authentication, and security preferences.',
        roles: ['client', 'recruiter'],
        isProtected: true,
        tag: 'Preferences'
      }
    ]
  },
  {
    id: 'pricing-buy',
    title: 'Commercials, Pricing & Enterprise Hiring',
    desc: 'Instant credit top-ups, custom enterprise subscription plans, and assisted hiring.',
    icon: FiDollarSign,
    color: '#ea580c',
    bg: '#fff7ed',
    tag: 'Plans & Upgrades',
    items: [
      {
        title: 'Buy Online (Instant Credits)',
        path: '/buy-online',
        desc: 'Direct online purchase of single job postings, Resdex CV bundles, and micro-hiring packages.',
        roles: ['client', 'recruiter'],
        isProtected: false,
        tag: 'Instant Checkout'
      },
      {
        title: 'Plans & Enterprise Pricing',
        path: '/employer-dashboard/pricing',
        desc: 'Transparent pricing matrix comparing Startup, Growth, and Enterprise hiring tiers.',
        roles: ['client'],
        isProtected: true,
        tag: 'Pricing Matrix'
      },
      {
        title: 'Expert Assist (Assisted Hiring)',
        path: '/expert-assist',
        desc: 'Dedicated talent acquisition consultants delivering pre-screened, interview-ready candidates under SLAs.',
        roles: ['client'],
        isProtected: false,
        tag: 'Dedicated SLA'
      },
      {
        title: 'Client Registration Form',
        path: '/recruit/client-registration-form',
        desc: 'Onboarding and commercial registration portal for new organizations and recruitment agencies.',
        roles: ['client'],
        isProtected: false,
        tag: 'New Registration'
      }
    ]
  },
  {
    id: 'learning',
    title: 'Recruiter Training & Learning Center',
    desc: 'Best practice guides and tutorials to maximize hiring velocity and candidate conversion.',
    icon: FiBookOpen,
    color: '#0d9488',
    bg: '#ccfbf1',
    tag: 'Training Hub',
    items: [
      {
        title: 'Employer Learning Center Home',
        path: '/employers/learning-center',
        desc: 'Comprehensive knowledge base covering recruiter workflows, candidate outreach, and ROI optimization.',
        roles: ['recruiter', 'client'],
        isProtected: false,
        tag: 'Knowledge Base'
      },
      {
        title: 'Job Posting Best Practices Guide',
        path: '/employers/learning-center/guides/job-posting',
        desc: 'How to write high-converting job descriptions, optimize salary visibility, and target top talent.',
        roles: ['recruiter'],
        isProtected: false,
        tag: 'Masterclass'
      },
      {
        title: 'Advanced Resdex Boolean Search Guide',
        path: '/employers/learning-center/guides/resdex',
        desc: 'Master Boolean syntax (AND, OR, NOT, NEAR), semantic proximity filters, and hidden talent discovery.',
        roles: ['recruiter'],
        isProtected: false,
        tag: 'Search Tips'
      },
      {
        title: 'AI-Rex Candidate Screening Guide',
        path: '/employers/learning-center/guides/ai-rex',
        desc: 'Leverage AI matching algorithms to auto-rank thousands of applicants against key mandate criteria.',
        roles: ['recruiter'],
        isProtected: false,
        tag: 'AI Tools'
      }
    ]
  },
  {
    id: 'support-legal',
    title: 'Help Center, Sales Zones & Governance',
    desc: 'Territory assistance, state-wise helplines, recruiter security, and privacy compliance.',
    icon: FiHelpCircle,
    color: '#4f46e5',
    bg: '#eef2ff',
    tag: 'Support & Legal',
    items: [
      {
        title: 'Employer Help Center',
        path: '/employer-help',
        desc: 'State-wise regional helplines, recruiter FAQ directory, ticket resolution, and live customer service.',
        roles: ['client', 'recruiter'],
        isProtected: false,
        tag: 'Help & FAQ'
      },
      {
        title: 'India Sales Zones & Territory Map',
        path: '/maven-jobs/zones',
        desc: 'Interactive regional map connecting corporate employers with North, South, East, and West hiring teams.',
        roles: ['client'],
        isProtected: false,
        tag: 'Territory Support'
      },
      {
        title: 'Employer Privacy Policy',
        path: '/employer-privacy-policy',
        desc: 'Data governance standards detailing candidate privacy, GDPR compliance, and CV security measures.',
        roles: ['client'],
        isProtected: false,
        tag: 'Data Governance'
      },
      {
        title: 'Trust & Safety Standards',
        path: '/trust-and-safety',
        desc: 'Authentic job guarantee, anti-scam recruiter guidelines, and candidate verification policies.',
        roles: ['client', 'recruiter'],
        isProtected: false,
        tag: 'Compliance'
      }
    ]
  },
  {
    id: 'mobile-app',
    title: 'Recruiter Mobile Suite & Tools',
    desc: 'Hiring on the go: Sourcing, masked calling, and candidate application review on Android & iOS.',
    icon: FiSmartphone,
    color: '#059669',
    bg: '#ecfdf5',
    tag: 'Mobile Hiring',
    items: [
      {
        title: 'Download MavenJobs Recruiter App',
        path: '/download/recruiter-app',
        desc: 'Official mobile app for recruiters and hiring managers. Search Resdex, make masked calls, and shortlist applicants on the move.',
        roles: ['recruiter', 'client'],
        isProtected: false,
        tag: 'Recruiter App'
      },
      {
        title: 'Download Jobseeker / Candidate App',
        path: '/download/candidate-app',
        desc: 'Candidate companion app for browsing verified jobs, tracking application status, and chatting with recruiters.',
        roles: ['client', 'recruiter'],
        isProtected: false,
        tag: 'Candidate App'
      }
    ]
  }
];

export default function EmployerSideMap() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'recruiter' | 'client'
  const [searchQuery, setSearchQuery] = useState('');

  // Check login state
  const isEmployerLoggedIn = Boolean(localStorage.getItem('employerUser') || localStorage.getItem('token'));

  // Filter sections and items based on role tab and search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return EMPLOYER_SECTIONS.map((section) => {
      const filteredItems = section.items.filter((item) => {
        // Role filter
        if (activeTab === 'recruiter' && !item.roles.includes('recruiter')) {
          return false;
        }
        if (activeTab === 'client' && !item.roles.includes('client')) {
          return false;
        }

        // Search query filter
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q) ||
          (item.tag && item.tag.toLowerCase().includes(q))
        );
      });

      return {
        ...section,
        items: filteredItems,
      };
    }).filter((section) => section.items.length > 0);
  }, [activeTab, searchQuery]);

  // Total counts for stats
  const totalItemsCount = useMemo(() => {
    return EMPLOYER_SECTIONS.reduce((acc, sec) => acc + sec.items.length, 0);
  }, []);

  const recruiterItemsCount = useMemo(() => {
    return EMPLOYER_SECTIONS.reduce((acc, sec) => {
      return acc + sec.items.filter((item) => item.roles.includes('recruiter')).length;
    }, 0);
  }, []);

  const clientItemsCount = useMemo(() => {
    return EMPLOYER_SECTIONS.reduce((acc, sec) => {
      return acc + sec.items.filter((item) => item.roles.includes('client')).length;
    }, 0);
  }, []);

  return (
    <div className="esm-page-root">
      <EmployerHeader solid />

      {/* Hero Section */}
      <section className="esm-hero">
        <div className="esm-hero-container">
          <div className="esm-breadcrumb">
            <FiCompass size={13} />
            <span>Employer &amp; Recruiter Directory</span>
          </div>

          <h1 className="esm-hero-title">
            Enterprise &amp; Recruiter <span>Site Map</span>
          </h1>

          <p className="esm-hero-subtitle">
            Complete architectural directory of MavenJobs employer tools, candidate sourcing suites,
            account administration modules, and support desks designed for Clients and Recruiters.
          </p>

          {/* Search & Role Filter Tabs */}
          <div className="esm-controls-row">
            {/* Search Input */}
            <div className="esm-search-box">
              <FiSearch size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Search solutions, tools, routes (e.g. Resdex, Post Job, Quota)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="esm-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="esm-role-tabs" role="tablist">
              <button
                type="button"
                className={`esm-role-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>All Solutions</span>
                <span className="esm-tab-count">{totalItemsCount}</span>
              </button>

              <button
                type="button"
                className={`esm-role-tab ${activeTab === 'recruiter' ? 'active' : ''}`}
                onClick={() => setActiveTab('recruiter')}
              >
                <FiUsers size={14} />
                <span>For Recruiters</span>
                <span className="esm-tab-count">{recruiterItemsCount}</span>
              </button>

              <button
                type="button"
                className={`esm-role-tab ${activeTab === 'client' ? 'active' : ''}`}
                onClick={() => setActiveTab('client')}
              >
                <FiBriefcase size={14} />
                <span>For Clients &amp; Admins</span>
                <span className="esm-tab-count">{clientItemsCount}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Category Quick Jump Bar */}
      <nav className="esm-jump-bar" aria-label="Module quick links">
        <div className="esm-jump-container">
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Jump To:
          </span>
          {EMPLOYER_SECTIONS.map((sec) => (
            <a key={sec.id} href={`#${sec.id}`} className="esm-jump-link">
              <span>{sec.title.split('&')[0].trim()}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="esm-content">
        {/* Stats Overview Bar */}
        <div className="esm-stats-strip">
          <div className="esm-stat-card">
            <div className="esm-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiBriefcase size={22} />
            </div>
            <div>
              <div className="esm-stat-val">5+</div>
              <div className="esm-stat-lbl">Posting &amp; Response Tools</div>
            </div>
          </div>

          <div className="esm-stat-card">
            <div className="esm-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <FiLayers size={22} />
            </div>
            <div>
              <div className="esm-stat-val">6+</div>
              <div className="esm-stat-lbl">Resdex Sourcing Modules</div>
            </div>
          </div>

          <div className="esm-stat-card">
            <div className="esm-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <FiSettings size={22} />
            </div>
            <div>
              <div className="esm-stat-val">6+</div>
              <div className="esm-stat-lbl">Admin &amp; Quota Controls</div>
            </div>
          </div>

          <div className="esm-stat-card">
            <div className="esm-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <FiBookOpen size={22} />
            </div>
            <div>
              <div className="esm-stat-val">4+</div>
              <div className="esm-stat-lbl">Masterclass Guides</div>
            </div>
          </div>
        </div>

        {/* Section Groups */}
        {filteredSections.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <FiSearch size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>No solutions found</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              No employer modules matched your search term "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
              style={{
                background: '#002366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '8px 20px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <section key={section.id} id={section.id} className="esm-section">
                <div className="esm-section-header">
                  <div className="esm-section-title-group">
                    <div
                      className="esm-section-icon"
                      style={{ background: section.bg, color: section.color }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h2 className="esm-section-title">{section.title}</h2>
                      <p className="esm-section-desc">{section.desc}</p>
                    </div>
                  </div>
                  <span
                    className="esm-section-tag"
                    style={{ background: section.bg, color: section.color }}
                  >
                    {section.tag} · {section.items.length} links
                  </span>
                </div>

                <div className="esm-items-grid">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="esm-item-card"
                    >
                      <div>
                        <div className="esm-item-top">
                          <div
                            className="esm-item-icon-box"
                            style={{ background: section.bg, color: section.color }}
                          >
                            <IconComponent size={18} />
                          </div>

                          <div className="esm-item-badges">
                            {item.roles.includes('recruiter') && item.roles.includes('client') ? (
                              <span className="esm-badge esm-badge-both">Client &amp; Recruiter</span>
                            ) : item.roles.includes('client') ? (
                              <span className="esm-badge esm-badge-client">Client Admin</span>
                            ) : (
                              <span className="esm-badge esm-badge-recruiter">Recruiter</span>
                            )}

                            {item.isProtected && (
                              <span className="esm-badge esm-badge-auth" title="Requires Employer Login">
                                <FiLock size={9} /> Login Req.
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="esm-item-title">{item.title}</h3>
                        <p className="esm-item-desc">{item.desc}</p>
                      </div>

                      <div className="esm-item-footer">
                        <span className="esm-item-path">{item.tag || 'Explore'}</span>
                        <span className="esm-item-action">
                          Open <FiChevronRight size={13} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Bottom Enterprise CTA */}
        <div className="esm-enterprise-cta">
          <div className="esm-enterprise-info">
            <h3 className="esm-enterprise-title">Ready to Transform Your Organization’s Hiring?</h3>
            <p className="esm-enterprise-desc">
              Connect with our enterprise talent solutions team to unlock customized candidate pipelines,
              unlimited Resdex sourcing, and multi-recruiter sub-user seats.
            </p>
          </div>
          <div className="esm-enterprise-actions">
            <Link to="/buy-online" className="esm-btn-primary">
              <FiDollarSign size={15} />
              <span>Buy Hiring Plans</span>
            </Link>
            <Link to="/employer-help" className="esm-btn-secondary">
              <FiHelpCircle size={15} />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      </main>

      <EmployerFooter />
    </div>
  );
}
