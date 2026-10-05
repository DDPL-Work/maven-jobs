import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuideLayout from './GuideLayout';
import {
  FiSearch, FiFilter, FiFolder, FiMail, FiDownload,
  FiBell, FiUsers, FiCheckCircle, FiChevronDown, FiCopy,
  FiCheck, FiSliders, FiHelpCircle, FiInfo, FiAlertTriangle,
  FiShield, FiLayers, FiPrinter, FiZap, FiBookOpen
} from 'react-icons/fi';
import {
  RESDEX_GUIDE_CONFIG,
  RESDEX_TOC_SECTIONS,
  RESDEX_BOOLEAN_SAMPLES,
  RESDEX_BOOLEAN_OPERATORS,
  RESDEX_FAQS
} from '../learningCenterData';

export default function ResdexGuide() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyQuery = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const FAQS = RESDEX_FAQS;

  return (
    <GuideLayout
      guideId={RESDEX_GUIDE_CONFIG.id}
      title={RESDEX_GUIDE_CONFIG.title}
      subtitle={RESDEX_GUIDE_CONFIG.subtitle}
      category={RESDEX_GUIDE_CONFIG.category}
      categoryColor={RESDEX_GUIDE_CONFIG.categoryColor}
      badgeText={RESDEX_GUIDE_CONFIG.badgeText}
      readTime={RESDEX_GUIDE_CONFIG.readTime}
      lastUpdated={RESDEX_GUIDE_CONFIG.lastUpdated}
      author={RESDEX_GUIDE_CONFIG.author}
      heroKeyPoints={RESDEX_GUIDE_CONFIG.heroKeyPoints}
      heroAction={{
        label: RESDEX_GUIDE_CONFIG.heroAction.label,
        onClick: () => navigate(RESDEX_GUIDE_CONFIG.heroAction.targetPath)
      }}
      tocSections={RESDEX_TOC_SECTIONS}
      prevGuide={RESDEX_GUIDE_CONFIG.prevGuide}
      nextGuide={RESDEX_GUIDE_CONFIG.nextGuide}
    >
      {/* ─── SECTION 1: WHAT IS RESDEX ─── */}
      <section id="sec-intro" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiSearch size={14} /> Database Overview
        </span>
        <h2 className="gl-section-title">What is Resdex?</h2>
        <p className="gl-section-lead">
          Resdex is India's largest and most frequently updated talent database, hosting over 10 Crore verified resumes across every functional area, industry, and seniority level.
        </p>

        <p className="gl-p">
          While job postings capture active job seekers looking for immediate changes, Resdex gives talent acquisition teams direct access to passive candidates—professionals who are not actively browsing job boards but are receptive to compelling, personalized outreach from top employers.
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
              <FiSearch />
            </div>
            <h4>Proactive Sourcing</h4>
            <p>Directly contact qualified professionals instead of waiting for inbound applications.</p>
          </div>

          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <FiZap />
            </div>
            <h4>Freshness Guarantee</h4>
            <p>Millions of candidates update their profiles, notice periods, and contact details every month.</p>
          </div>

          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
              <FiFolder />
            </div>
            <h4>Pipeline Organization</h4>
            <p>Structure candidate pipelines into collaborative folders for hiring managers and client projects.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: SEARCH INPUTS & KEYWORDS ─── */}
      <section id="sec-search-inputs" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiSliders size={14} /> Search Mechanics
        </span>
        <h2 className="gl-section-title">Search Inputs & Keyword Types</h2>
        <p className="gl-section-lead">
          The Resdex search engine indexes full resume text, candidate profiles, verified work histories, and educational credentials. Understanding how to structure your inputs is critical to finding the exact talent you need.
        </p>

        <h3 className="gl-subhead">Core Search Fields</h3>
        <ul className="gl-list">
          <li>
            <strong>Any Keywords (OR Search):</strong> Matches resumes containing at least one of the entered keywords. Useful for synonyms (e.g. <code>Sales, Business Development, Client Acquisition</code>).
          </li>
          <li>
            <strong>All Keywords (AND Search):</strong> Requires that every specified term be present somewhere in the candidate's resume (e.g. <code>Python, Django, AWS</code>).
          </li>
          <li>
            <strong>Excluding Keywords (NOT Search):</strong> Suppresses resumes containing disqualifying terms (e.g. <code>Intern, Freelance, Trainee</code>).
          </li>
          <li>
            <strong>Exact Phrase Search (" "):</strong> Wrapping terms in quotation marks forces the search engine to look for the exact consecutive sequence of words (e.g. <code>"Microservices Architecture"</code>).
          </li>
        </ul>

        <div className="gl-callout info">
          <FiInfo className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">Handling Keyword Variations</h4>
            <p>
              Candidates frequently use different spellings or acronyms. Always include common variations: e.g., <code>(React OR React.js OR ReactJS)</code> or <code>(PostgreSQL OR Postgres)</code> to prevent missing qualified CVs.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: BOOLEAN SEARCH MASTERCLASS ─── */}
      <section id="sec-boolean" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiBookOpen size={14} /> Expert Syntax
        </span>
        <h2 className="gl-section-title">Boolean Search Masterclass</h2>
        <p className="gl-section-lead">
          Boolean operators allow you to construct sophisticated, high-precision search strings that filter out thousands of irrelevant profiles with mathematical precision.
        </p>

        <h3 className="gl-subhead">The Three Core Operators</h3>
        <div className="gl-table-container">
          <table className="gl-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Syntax Rule</th>
                <th>Logic & Effect</th>
                <th>Example Query</th>
              </tr>
            </thead>
            <tbody>
              {RESDEX_BOOLEAN_OPERATORS.map((b, idx) => (
                <tr key={idx}>
                  <td><strong>{b.op}</strong></td>
                  <td><code>{b.op}</code></td>
                  <td>{b.result}</td>
                  <td><code>{b.example}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="gl-subhead">Ready-to-Use Boolean Strings for Key Roles</h3>
        <p className="gl-p">
          Copy and paste these verified Boolean strings directly into the Resdex search bar:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {RESDEX_BOOLEAN_SAMPLES.map((sample, idx) => (
            <div key={idx} className="gl-query-box">
              <div className="gl-query-content">
                <span style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {sample.role}
                </span>
                <span>{sample.query}</span>
              </div>
              <button
                className="gl-copy-btn"
                onClick={() => copyQuery(sample.query, idx)}
              >
                {copiedIdx === idx ? <FiCheck /> : <FiCopy />} {copiedIdx === idx ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 4: RECRUITER SEARCH STRATEGY ─── */}
      <section id="sec-strategy" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiShield size={14} /> Strategic Methodology
        </span>
        <h2 className="gl-section-title">Search Strategy: Think Like a Candidate</h2>
        <p className="gl-section-lead">
          The most successful sourcing recruiters write search strings by anticipating how candidates describe their achievements on a resume.
        </p>

        <div className="gl-grid-2">
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ color: '#dc2626' }}>Ineffective Sourcing Habits</h4>
            <ul className="gl-list" style={{ marginTop: '10px' }}>
              <li>Typing overly long paragraphs or job descriptions into the search bar.</li>
              <li>Searching for generic adjectives (e.g., "hardworking", "passionate", "rockstar").</li>
              <li>Setting rigid 100% exact title filters that exclude internal promotions.</li>
            </ul>
          </div>

          <div className="gl-card-feature" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 style={{ color: '#059669' }}>High-Yield Sourcing Strategy</h4>
            <ul className="gl-list" style={{ marginTop: '10px' }}>
              <li>Target high-signal tools and libraries specific to senior practitioners.</li>
              <li>Combine a primary technology with an architectural responsibility (e.g. <code>Kafka AND "event-driven"</code>).</li>
              <li>Use exclusion filters to prune out bulk keywords from training institute boilerplate.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: DEEP FILTERS ─── */}
      <section id="sec-filters" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiFilter size={14} /> Precision Filtering
        </span>
        <h2 className="gl-section-title">Deep Filtering Parameters</h2>
        <p className="gl-section-lead">
          Refine searches with over 15 granular criteria to narrow a list from thousands to the ideal 20 candidates.
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature">
            <h4>Notice Period Filter</h4>
            <p>Filter candidates by availability: <strong>Immediate Joiners</strong>, 15 days, 30 days, or actively serving notice period.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Freshness / Activity</h4>
            <p>Focus on active candidates who logged in or modified their CV in the last <strong>7, 15, or 30 days</strong>.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Salary & CTC Brackets</h4>
            <p>Set minimum and maximum current CTC to ensure candidates match your hiring budget.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Location & Relocation</h4>
            <p>Filter by current city or candidates who indicated willingness to relocate to your office location.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Education & Pedigree</h4>
            <p>Target specific degrees (e.g. B.Tech, CA, MBA) or filter for Tier-1 engineering & management colleges.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Company Type</h4>
            <p>Filter by candidates currently working in Product companies, Fortune 500, or Top Startups.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: SEARCH RESULTS & CARDS ─── */}
      <section id="sec-results" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiLayers size={14} /> Evaluation Workflow
        </span>
        <h2 className="gl-section-title">Search Results & Candidate Cards</h2>
        <p className="gl-section-lead">
          Resdex presents candidate profiles in scannable, information-dense result cards designed for rapid recruiter evaluation.
        </p>

        <div className="gl-mockup-frame">
          <div className="gl-mockup-bar">
            <div className="gl-mockup-dots">
              <span className="gl-mockup-dot" style={{ backgroundColor: '#ef4444' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#f59e0b' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#10b981' }} />
            </div>
            <div className="gl-mockup-title">Resdex Candidate Card Preview</div>
            <div>Relevance Match: 96%</div>
          </div>
          <div className="gl-mockup-body" style={{ background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '18px', color: '#002366' }}>Siddharth Verma</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', fontWeight: 600 }}>
                  Lead Cloud Infrastructure & DevOps Engineer • Razorpay
                </p>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                Active in Last 4 Days
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
              <div><strong>Experience:</strong> 6.5 Years</div>
              <div><strong>Current CTC:</strong> ₹28.5 LPA</div>
              <div><strong>Location:</strong> Bengaluru</div>
              <div><strong>Notice Period:</strong> 30 Days (Serving)</div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {['Kubernetes', 'AWS', 'Terraform', 'Docker', 'CI/CD', 'Go', 'Python'].map((sk, i) => (
                <span key={i} style={{ background: '#e2e8f0', color: '#1e293b', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                  {sk}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', flexWrap: 'wrap' }}>
              <button type="button" className="gl-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <FiMail size={14} /> <span>Send NVite</span>
              </button>
              <button type="button" className="gl-btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <FiFolder size={14} /> <span>Add to Folder</span>
              </button>
              <button type="button" className="gl-btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <FiDownload size={14} /> <span>Download Resume</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: FOLDERS ─── */}
      <section id="sec-folders" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiFolder size={14} /> Pipeline Management
        </span>
        <h2 className="gl-section-title">Folders & Talent Organization</h2>
        <p className="gl-section-lead">
          Never lose track of high-potential talent. Use collaborative folders to organize candidate pipelines by job mandate, client account, or seniority level.
        </p>

        <ul className="gl-list">
          <li>
            <strong>Organize by Mandate:</strong> Create dedicated folders like <code>"Backend Lead - Q4 Requisition"</code> to pool shortlisted profiles.
          </li>
          <li>
            <strong>Internal Notes & Ratings:</strong> Add interview feedback, salary expectations, and status notes that are visible to your entire recruiting team.
          </li>
          <li>
            <strong>Folder-Based Recommendations:</strong> Resdex automatically analyzes the profiles stored in your active folders and suggests similar candidates from the database.
          </li>
        </ul>
      </section>

      {/* ─── SECTION 8: CANDIDATE OUTREACH ─── */}
      <section id="sec-contact" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiMail size={14} /> Direct Engagement
        </span>
        <h2 className="gl-section-title">Candidate Outreach & NVites</h2>
        <p className="gl-section-lead">
          Reach out to candidates directly from search results using pre-saved message templates or personalized NVites.
        </p>

        <div className="gl-grid-2">
          <div className="gl-card-feature">
            <h4>NVite (Job-Linked Invitation)</h4>
            <p>
              Directly links an active job posting to your message. When candidates click "I'm Interested", they are automatically added to your applicant tracking dashboard.
            </p>
          </div>

          <div className="gl-card-feature">
            <h4>Custom Email & SMS</h4>
            <p>
              Send customized outreach messages with merge tags (such as <code>&#123;Candidate_Name&#125;</code>, <code>&#123;Current_Company&#125;</code>) to maximize open rates and replies.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: RESUME ALERTS ─── */}
      <section id="sec-alerts" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiBell size={14} /> Automated Alerts
        </span>
        <h2 className="gl-section-title">Resume Alerts: First-Mover Advantage</h2>
        <p className="gl-section-lead">
          Set up automated Resume Alerts from your saved Boolean searches to receive email notifications the moment matching talent joins MavenJobs.
        </p>

        <div className="gl-callout tip">
          <FiCheckCircle className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">The First-Contact Advantage</h4>
            <p>
              Recruiters who contact newly updated resumes within <strong>24 hours of alert delivery</strong> experience an <strong>82% response rate</strong>, as candidates are actively reviewing career changes.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: USER ROLES & QUOTAS ─── */}
      <section id="sec-roles" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiUsers size={14} /> Governance & Quotas
        </span>
        <h2 className="gl-section-title">User Roles & Quota Allocation</h2>
        <p className="gl-section-lead">
          Ensure fair credit usage and full data auditability across enterprise talent acquisition teams.
        </p>

        <ul className="gl-list">
          <li>
            <strong>Super-User Admin:</strong> Configures quota ceilings, assigns monthly CV access limits per recruiter, and monitors download history.
          </li>
          <li>
            <strong>Sub-User Recruiter:</strong> Conducts searches and unlocks contact credits within their allocated monthly quota.
          </li>
          <li>
            <strong>Quota Reset Cycle:</strong> Monthly quotas reset automatically at the start of each billing period.
          </li>
        </ul>
      </section>

      {/* ─── SECTION 11: FAQS ─── */}
      <section id="sec-faqs" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#e8eef8', color: '#002366' }}>
          <FiHelpCircle size={14} /> Knowledge Base
        </span>
        <h2 className="gl-section-title">Frequently Asked Questions</h2>
        <p className="gl-section-lead">
          Find answers to common questions about Boolean search, contact credits, and Resdex quotas:
        </p>

        <div className="gl-faq-list">
          {FAQS.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div key={i} className={`gl-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="gl-faq-btn"
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <FiChevronDown className="gl-faq-icon" />
                </button>
                {isOpen && <div className="gl-faq-ans">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </GuideLayout>
  );
}
