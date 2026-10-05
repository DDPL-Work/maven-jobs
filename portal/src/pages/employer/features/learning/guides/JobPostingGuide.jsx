import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuideLayout from './GuideLayout';
import {
  FiBriefcase, FiEdit3, FiCheckCircle, FiChevronDown,
  FiFilter, FiTrendingUp, FiEye, FiClock, FiFileText,
  FiShare2, FiHelpCircle, FiInfo, FiAlertTriangle,
  FiDollarSign, FiMapPin, FiAward, FiCopy, FiCheck,
  FiLayers, FiRefreshCw, FiZap, FiUsers
} from 'react-icons/fi';
import {
  JOB_POSTING_GUIDE_CONFIG,
  JOB_POSTING_TOC_SECTIONS,
  JOB_POSTING_TYPES,
  JOB_POSTING_SAMPLE_JD,
  JOB_POSTING_FAQS
} from '../learningCenterData';

export default function JobPostingGuide() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [copiedCode, setCopiedCode] = useState(false);

  const sampleJD = JOB_POSTING_SAMPLE_JD;
  const FAQS = JOB_POSTING_FAQS;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleJD);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <GuideLayout
      guideId={JOB_POSTING_GUIDE_CONFIG.id}
      title={JOB_POSTING_GUIDE_CONFIG.title}
      subtitle={JOB_POSTING_GUIDE_CONFIG.subtitle}
      category={JOB_POSTING_GUIDE_CONFIG.category}
      categoryColor={JOB_POSTING_GUIDE_CONFIG.categoryColor}
      badgeText={JOB_POSTING_GUIDE_CONFIG.badgeText}
      readTime={JOB_POSTING_GUIDE_CONFIG.readTime}
      lastUpdated={JOB_POSTING_GUIDE_CONFIG.lastUpdated}
      author={JOB_POSTING_GUIDE_CONFIG.author}
      heroKeyPoints={JOB_POSTING_GUIDE_CONFIG.heroKeyPoints}
      heroAction={{
        label: JOB_POSTING_GUIDE_CONFIG.heroAction.label,
        onClick: () => navigate(JOB_POSTING_GUIDE_CONFIG.heroAction.targetPath)
      }}
      tocSections={JOB_POSTING_TOC_SECTIONS}
      prevGuide={JOB_POSTING_GUIDE_CONFIG.prevGuide}
      nextGuide={JOB_POSTING_GUIDE_CONFIG.nextGuide}
    >
      {/* ─── SECTION 1: OVERVIEW ─── */}
      <section id="sec-intro" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiBriefcase size={14} /> Introduction & Fundamentals
        </span>
        <h2 className="gl-section-title">Job Posting Overview & Lifecycle</h2>
        <p className="gl-section-lead">
          Job Posting is your primary storefront to millions of active job seekers across India. Posting a job on MavenJobs puts your requisition in front of verified talent, matches candidates via automated notification alerts, and channels responses directly into a structured applicant dashboard.
        </p>

        <h3 className="gl-subhead">Posting Types Comparison</h3>
        <div className="gl-table-container">
          <table className="gl-table">
            <thead>
              <tr>
                <th>Posting Type</th>
                <th>Search Ranking</th>
                <th>Target Reach</th>
                <th>Candidate Alerts</th>
                <th>Ideal For</th>
              </tr>
            </thead>
            <tbody>
              {JOB_POSTING_TYPES.map((t, idx) => (
                <tr key={idx}>
                  <td><strong>{t.type}</strong></td>
                  <td>{t.ranking}</td>
                  <td>{t.reach}</td>
                  <td>{t.alerts}</td>
                  <td>{t.idealFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gl-callout tip">
          <FiCheckCircle className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">The First 72 Hours Matter Most</h4>
            <p>
              Over <strong>65% of total high-quality applications</strong> arrive within the first 72 hours of publishing a job. Setting up precise screening filters before going live guarantees you spend time evaluating relevant talent right when candidate enthusiasm is highest.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: THE FORM DEEP DIVE ─── */}
      <section id="sec-form" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiFileText size={14} /> Form Anatomy
        </span>
        <h2 className="gl-section-title">The Job Posting Form: Step-by-Step</h2>
        <p className="gl-section-lead">
          The MavenJobs job posting form is organized into logical functional modules designed to maximize search visibility and candidate conversion.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'details', label: '1. Job Details' },
            { id: 'candidate', label: '2. Preferred Candidate' },
            { id: 'jd', label: '3. Job Description' },
            { id: 'screening', label: '4. Screening & Advanced' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '2px solid #059669' : '1px solid #e2e8f0',
                background: activeTab === tab.id ? '#ecfdf5' : '#ffffff',
                color: activeTab === tab.id ? '#059669' : '#475569',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #059669' }}>
            <h4 style={{ color: '#059669', fontSize: '18px' }}>Module 1: Core Job Details</h4>
            <p className="gl-p">
              This module sets the primary indexing signals used by search engines and recommendation algorithms:
            </p>
            <ul className="gl-list">
              <li>
                <strong>Job Title:</strong> Use industry-standard, recognized titles (e.g. <em>Senior Product Manager</em> instead of <em>Product Ninja / Rockstar</em>). Avoid stuffing keywords, cities, or emojis in the title.
              </li>
              <li>
                <strong>Department & Role:</strong> Select the accurate functional vertical (e.g. Engineering &gt; Backend Development). This dictates which candidate alert cohorts receive your posting.
              </li>
              <li>
                <strong>Workplace Type:</strong> Choose clearly between In-Office, Hybrid (specify days per week), or 100% Remote.
              </li>
              <li>
                <strong>Location:</strong> Enter up to 3 target hiring cities or mark as Pan-India.
              </li>
              <li>
                <strong>Experience Range:</strong> Provide a realistic bracket (e.g., 3 - 6 Years). Overly wide ranges (e.g., 2 - 12 Years) confuse candidates and dilute algorithmic matching.
              </li>
              <li>
                <strong>Salary Range (CTC):</strong> Disclosing salary ranges increases application conversion by up to <strong>42%</strong>. You can choose to hide salary from candidate view while still indexing it for salary-based search filters.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'candidate' && (
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #059669' }}>
            <h4 style={{ color: '#059669', fontSize: '18px' }}>Module 2: Preferred Candidate Details</h4>
            <p className="gl-p">
              Define the exact skill taxonomy and qualification criteria:
            </p>
            <ul className="gl-list">
              <li>
                <strong>Key Skills (Mandatory):</strong> Tag 3 to 7 primary technologies/competencies (e.g., Python, Django, PostgreSQL, Docker). Candidates must possess these skills to be flagged as top matches.
              </li>
              <li>
                <strong>Preferred / Secondary Skills:</strong> Mention auxiliary skills (e.g., Kubernetes, Celery, Redis).
              </li>
              <li>
                <strong>Education Qualification:</strong> Specify required minimum degrees (e.g., B.Tech/B.E., MCA, MBA) and specializations.
              </li>
              <li>
                <strong>Certifications:</strong> Add industry certifications (e.g., AWS Solutions Architect, PMP, CFA Level 2).
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'jd' && (
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #059669' }}>
            <h4 style={{ color: '#059669', fontSize: '18px' }}>Module 3: Job Description & Company Info</h4>
            <p className="gl-p">
              The narrative section where candidates evaluate the mission, responsibilities, culture, and perks:
            </p>
            <ul className="gl-list">
              <li>
                <strong>Role Summary:</strong> A crisp 2-sentence hook explaining why this role exists and its impact on the business.
              </li>
              <li>
                <strong>Key Responsibilities:</strong> Bulleted breakdown of day-to-day duties.
              </li>
              <li>
                <strong>Candidate Profile:</strong> Expected background, problem-solving mindset, and collaboration style.
              </li>
              <li>
                <strong>AI Assist Generator:</strong> Click the "Generate with AI" button in the form to transform basic bullet points into a polished, SEO-optimized JD instantly.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'screening' && (
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #059669' }}>
            <h4 style={{ color: '#059669', fontSize: '18px' }}>Module 4: Screening Questions & Advanced Options</h4>
            <p className="gl-p">
              Pre-qualify candidates automatically as they apply:
            </p>
            <ul className="gl-list">
              <li>
                <strong>Screening Dealbreakers:</strong> Automatically mark candidates who do not meet critical criteria (such as notice period &gt; 60 days) as "Unqualified".
              </li>
              <li>
                <strong>Walk-in Interviews:</strong> Enable walk-in mode with venue address, contact person, and designated interview date slots.
              </li>
              <li>
                <strong>Requisition ID / Reference Code:</strong> Map the posting to your internal ERP or ATS reference code for unified reporting.
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* ─── SECTION 3: WRITING HIGH CONVERTING JDS ─── */}
      <section id="sec-jd-guide" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiEdit3 size={14} /> Copywriting Best Practices
        </span>
        <h2 className="gl-section-title">Writing High-Converting Job Descriptions</h2>
        <p className="gl-section-lead">
          Top-tier talent scans job postings on mobile screens in under 30 seconds. Your JD must be scannable, outcome-driven, and transparent.
        </p>

        <h3 className="gl-subhead">Production-Grade Sample Job Description</h3>
        <p className="gl-p">
          Use this battle-tested template as a foundation for your engineering and product requisitions:
        </p>

        <div className="gl-query-box">
          <pre className="gl-query-content" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {sampleJD}
          </pre>
          <button className="gl-copy-btn" onClick={copyToClipboard}>
            {copiedCode ? <FiCheck /> : <FiCopy />} {copiedCode ? 'Copied!' : 'Copy JD'}
          </button>
        </div>

        <div className="gl-grid-2">
          <div className="gl-card-feature" style={{ borderTop: '4px solid #ef4444' }}>
            <h4 style={{ color: '#dc2626' }}>Common JD Mistakes to Avoid</h4>
            <ul className="gl-list" style={{ marginTop: '12px' }}>
              <li>Wall of unbroken text with zero bullet formatting.</li>
              <li>Listing 25+ mandatory requirements for a mid-level role.</li>
              <li>Hidden or unmentioned compensation ranges.</li>
              <li>Generic buzzwords ("team player", "ninja", "rockstar").</li>
            </ul>
          </div>

          <div className="gl-card-feature" style={{ borderTop: '4px solid #10b981' }}>
            <h4 style={{ color: '#059669' }}>High-Conversion Techniques</h4>
            <ul className="gl-list" style={{ marginTop: '12px' }}>
              <li>Quantified metrics (e.g. "scale engine handling 10M events").</li>
              <li>Explicit transparency on hybrid/remote policy and office days.</li>
              <li>Clear growth path and technical ownership expectations.</li>
              <li>Mentioning concrete perks: wellness allowances, learning budget.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: SCREENING QUESTIONS ─── */}
      <section id="sec-screening" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiFilter size={14} /> Application Filtering
        </span>
        <h2 className="gl-section-title">Screening Questions: Eliminate Noise Early</h2>
        <p className="gl-section-lead">
          Save your recruiting team dozens of hours by attaching targeted questionnaire dealbreakers to your posting.
        </p>

        <h3 className="gl-subhead">Recommended Question Types</h3>
        <div className="gl-grid-3">
          <div className="gl-card-feature">
            <h4>1. Notice Period Check</h4>
            <p><strong>Type:</strong> Multiple Choice</p>
            <p><strong>Question:</strong> "What is your official notice period?"</p>
            <p style={{ color: '#059669', fontSize: '12.5px', marginTop: '6px' }}><strong>Preferred:</strong> Immediate / &le; 30 Days</p>
          </div>

          <div className="gl-card-feature">
            <h4>2. Work Model Agreement</h4>
            <p><strong>Type:</strong> Single Select (Yes / No)</p>
            <p><strong>Question:</strong> "Are you comfortable working 3 days/week from our Bengaluru office?"</p>
            <p style={{ color: '#059669', fontSize: '12.5px', marginTop: '6px' }}><strong>Preferred:</strong> Yes (Dealbreaker)</p>
          </div>

          <div className="gl-card-feature">
            <h4>3. Hands-On Tool Experience</h4>
            <p><strong>Type:</strong> Numeric Years</p>
            <p><strong>Question:</strong> "How many years of professional experience do you have with PostgreSQL & Kafka?"</p>
            <p style={{ color: '#059669', fontSize: '12.5px', marginTop: '6px' }}><strong>Preferred:</strong> &ge; 3.0 Years</p>
          </div>
        </div>

        <div className="gl-callout warning">
          <FiAlertTriangle className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">Keep Questions Under 4</h4>
            <p>
              Adding more than 4 screening questions increases candidate drop-off rates on mobile devices by 35%. Focus strictly on non-negotiable dealbreakers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: ADVANCED OPTIONS ─── */}
      <section id="sec-advanced" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiLayers size={14} /> Enterprise Controls
        </span>
        <h2 className="gl-section-title">Advanced Posting Controls</h2>
        <p className="gl-section-lead">
          Configure enterprise settings for hiring events, collaboration, and ATS integration:
        </p>

        <ul className="gl-list">
          <li>
            <strong>Walk-in Interviews:</strong> Turn your posting into an open drive invitation. Specify dates, time windows (e.g. 10:00 AM - 4:00 PM), venue location maps, and instructions on documents candidates must carry.
          </li>
          <li>
            <strong>Recruiter Collaboration:</strong> Add sub-user email addresses. Assign view-only or full-shortlist rights to hiring managers and interview panel members.
          </li>
          <li>
            <strong>Notification Triggers:</strong> Choose between real-time email alerts for every candidate, daily digest summaries at 9:00 AM, or only receiving alerts when a candidate matches 90%+ of your criteria.
          </li>
          <li>
            <strong>Scheduled Auto-Refresh:</strong> Schedule automated refreshes (e.g. every 7 days) to ensure your job remains perpetually fresh in candidate feeds without manual intervention.
          </li>
        </ul>
      </section>

      {/* ─── SECTION 6: JOB LIFECYCLE ─── */}
      <section id="sec-manage" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiRefreshCw size={14} /> Requisition Management
        </span>
        <h2 className="gl-section-title">Job Management & Lifecycle</h2>
        <p className="gl-section-lead">
          Manage live postings, drafts, renewals, and closures seamlessly from the <strong>Manage Jobs & Responses</strong> page.
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature">
            <h4>Edit Live Job</h4>
            <p>Update job descriptions, salary brackets, or interview locations anytime. Edits reflect across candidate searches within 15 minutes.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Prefill from Previous</h4>
            <p>Save time when posting recurring roles by pre-filling 100% of fields from an earlier vacancy with one click.</p>
          </div>

          <div className="gl-card-feature">
            <h4>Close or Repost</h4>
            <p>Close jobs once the offer is accepted. Repost expired listings whenever headcount reopens without retyping the requirements.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: MANAGING RESPONSES ─── */}
      <section id="sec-responses" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiUsers size={14} /> Applicant Tracking
        </span>
        <h2 className="gl-section-title">Managing Applications & Responses</h2>
        <p className="gl-section-lead">
          Every application received is organized in an intuitive pipeline dashboard with powerful filtering and communication tools.
        </p>

        <h3 className="gl-subhead">Applicant Triage Stages</h3>
        <p className="gl-p">
          Organize candidates systematically to maintain clean audit trails and transparent candidate communication:
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ color: '#2563eb' }}>New & Unviewed</h4>
            <p>Recent applications that require recruiter review. Highlighted with fresh applicant badges.</p>
          </div>

          <div className="gl-card-feature" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 style={{ color: '#059669' }}>Shortlisted</h4>
            <p>Candidates meeting all criteria, ready for interview scheduling and hiring manager review.</p>
          </div>

          <div className="gl-card-feature" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ color: '#dc2626' }}>Rejected</h4>
            <p>Send automated polite rejection emails to keep your employer brand respected and responsive.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: AI MATCHING & INSIGHTS ─── */}
      <section id="sec-ai-insights" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiZap size={14} /> Algorithmic Stack-Ranking
        </span>
        <h2 className="gl-section-title">AI Matching & Response Insights</h2>
        <p className="gl-section-lead">
          When receiving hundreds of applications, MavenJobs AI automatically stack-ranks applicants based on alignment with your stated JD and screening answers.
        </p>

        <ul className="gl-list">
          <li>
            <strong>High-Match Highlighting:</strong> Applicants matching 85%+ of skills and experience are badged with a green <em>Top Match</em> tag.
          </li>
          <li>
            <strong>Applicant Distribution Chart:</strong> Visual breakdown of your applicant pool across experience levels, salary expectations, and top locations.
          </li>
          <li>
            <strong>Match Insights Modal:</strong> Click any applicant to view an instant side-by-side comparison between your JD requirements and the candidate's verified background.
          </li>
        </ul>
      </section>

      {/* ─── SECTION 9: ANALYTICS & REPORTING ─── */}
      <section id="sec-analytics" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiTrendingUp size={14} /> Performance Tracking
        </span>
        <h2 className="gl-section-title">Job Analytics & Reporting</h2>
        <p className="gl-section-lead">
          Track conversion funnels and measure posting performance with real-time analytics.
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <FiEye style={{ fontSize: '32px', color: '#059669', marginBottom: '8px' }} />
            <h4>Total Job Views</h4>
            <p>Measure impression volume and search visibility across web and mobile app feeds.</p>
          </div>

          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <FiFileText style={{ fontSize: '32px', color: '#0284c7', marginBottom: '8px' }} />
            <h4>Application Rate</h4>
            <p>Conversion percentage of job viewers who complete the application flow.</p>
          </div>

          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <FiCheckCircle style={{ fontSize: '32px', color: '#7c3aed', marginBottom: '8px' }} />
            <h4>Shortlist Velocity</h4>
            <p>Average time taken from candidate application to first recruiter contact.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: FAQS ─── */}
      <section id="sec-faqs" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
          <FiHelpCircle size={14} /> Troubleshooting
        </span>
        <h2 className="gl-section-title">Frequently Asked Questions</h2>
        <p className="gl-section-lead">
          Quick answers to common questions about job postings and response management:
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
