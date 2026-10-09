import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuideLayout from './GuideLayout';
import {
  FiZap, FiCpu, FiMessageSquare, FiSliders, FiUsers,
  FiCheckCircle, FiChevronDown, FiArrowRight, FiInfo,
  FiAlertTriangle, FiPhoneCall, FiAward, FiSearch,
  FiCheck, FiClock, FiTarget, FiRefreshCw, FiLayers,
  FiHelpCircle
} from 'react-icons/fi';
import {
  AI_REX_GUIDE_CONFIG,
  AI_REX_TOC_SECTIONS,
  AI_REX_SAMPLE_MANDATES,
  AI_REX_SCORE_FACTORS,
  AI_REX_FAQS
} from '../learningCenterData';

export default function AiRexGuide() {
  const navigate = useNavigate();
  const [selectedMandateIdx, setSelectedMandateIdx] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [simFeedback, setSimFeedback] = useState('good');
  const [simStep, setSimStep] = useState(1);

  const mandate = AI_REX_SAMPLE_MANDATES[selectedMandateIdx];
  const FAQS = AI_REX_FAQS;

  return (
    <GuideLayout
      guideId={AI_REX_GUIDE_CONFIG.id}
      title={AI_REX_GUIDE_CONFIG.title}
      subtitle={AI_REX_GUIDE_CONFIG.subtitle}
      category={AI_REX_GUIDE_CONFIG.category}
      categoryColor={AI_REX_GUIDE_CONFIG.categoryColor}
      badgeText={AI_REX_GUIDE_CONFIG.badgeText}
      readTime={AI_REX_GUIDE_CONFIG.readTime}
      lastUpdated={AI_REX_GUIDE_CONFIG.lastUpdated}
      author={AI_REX_GUIDE_CONFIG.author}
      heroKeyPoints={AI_REX_GUIDE_CONFIG.heroKeyPoints}
      heroAction={{
        label: AI_REX_GUIDE_CONFIG.heroAction.label,
        onClick: () => navigate(AI_REX_GUIDE_CONFIG.heroAction.targetPath)
      }}
      tocSections={AI_REX_TOC_SECTIONS}
      prevGuide={AI_REX_GUIDE_CONFIG.prevGuide}
      nextGuide={AI_REX_GUIDE_CONFIG.nextGuide}
    >
      {/* ─── SECTION 1: WHAT IS AI REX ─── */}
      <section id="sec-intro" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiCpu size={14} /> Introduction & Architecture
        </span>
        <h2 className="gl-section-title">What is AI REX?</h2>
        <p className="gl-section-lead">
          AI REX is an agentic recruitment co-pilot designed from the ground up to solve the three biggest bottlenecks in modern talent acquisition: manual boolean string writing, endless CV screening fatigue, and delayed candidate engagement.
        </p>

        <p className="gl-p">
          In high-volume or specialized recruitment, recruiters spend up to 70% of their day performing administrative triage: scrolling through search results, manually checking whether candidates meet notice period requirements, and chasing unresponsive applicants. AI REX flips this dynamic by acting as an autonomous hiring partner that operates 24/7 on your behalf.
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
              <FiZap />
            </div>
            <h4>Autonomous Discovery</h4>
            <p>
              Scans over 10Cr+ resume profiles with contextual deep-learning models, finding candidates based on skill adjacency and real capabilities.
            </p>
          </div>

          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <FiMessageSquare />
            </div>
            <h4>Two-Way Pre-Screening</h4>
            <p>
              Autonomous conversational agents reach out through WhatsApp and smart voice calls to confirm availability, notice period, and expected compensation.
            </p>
          </div>

          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#eff6ff', color: '#002366' }}>
              <FiSliders />
            </div>
            <h4>Active Learning Co-Pilot</h4>
            <p>
              Continuously adapts to your preferences. As you approve or reject candidate recommendations, AI REX refines its matching weights in real time.
            </p>
          </div>
        </div>

        <div className="gl-callout tip">
          <FiCheckCircle className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">The Recruiter Advantage</h4>
            <p>
              Recruiters using AI REX report receiving their first batch of pre-qualified, interested candidates within <strong>3 hours</strong> of posting a mandate, compared to an industry average of 4.5 days for traditional outbound sourcing.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: MANDATE UNDERSTANDING ─── */}
      <section id="sec-mandate" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiTarget size={14} /> Cognitive Sourcing Intelligence
        </span>
        <h2 className="gl-section-title">How AI REX Understands Your Mandate</h2>
        <p className="gl-section-lead">
          Unlike legacy database tools that rely strictly on boolean keywords, AI REX parses your job requirement using natural language understanding (NLU) to identify implicit qualifications and real competencies.
        </p>

        <h3 className="gl-subhead">Beyond Keyword Matching: The Semantic Dimension</h3>
        <p className="gl-p">
          When a recruiter searches for <code>"Senior React Developer"</code>, a keyword search simply checks for the word "React" in the CV text. AI REX goes multiple layers deeper:
        </p>

        <ul className="gl-list">
          <li>
            <strong>Skill Recency & Depth:</strong> It evaluates whether the candidate used React in their current role or 5 years ago, checking project duration and architectural complexity.
          </li>
          <li>
            <strong>Skill Adjacency & Ecosystem Knowledge:</strong> A candidate who excels in TypeScript, Redux Toolkit, Webpack, and Next.js is recognized as a senior frontend engineer even if they didn’t write "React.js" in every single job entry.
          </li>
          <li>
            <strong>Career Trajectory & Promotion Velocity:</strong> Evaluates past promotions, tenure stability, and company tier to predict job readiness and likelihood of acceptance.
          </li>
          <li>
            <strong>Compensation & Location Realism:</strong> Automatically checks current industry compensation benchmarks for the candidate’s city and experience level, alerting you if your budget is mismatched with market expectations.
          </li>
        </ul>

        <div className="gl-callout purple">
          <FiInfo className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">Pro-Tip on Inputting Mandates</h4>
            <p>
              When setting up an AI REX campaign, specify clear <strong>Must-Have</strong> versus <strong>Good-to-Have</strong> criteria. Differentiating hard requirements (e.g. valid visa, immediate notice period) from flexible skills allows the AI to broaden the talent pool without compromising quality.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: CANDIDATE DISCOVERY & MATCHING ─── */}
      <section id="sec-matching" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiSearch size={14} /> Precision Talent Discovery
        </span>
        <h2 className="gl-section-title">Candidate Discovery & Relevance Scoring</h2>
        <p className="gl-section-lead">
          AI REX evaluates millions of profiles to construct a dynamic Relevance Score (0-100%) for each candidate.
        </p>

        <h3 className="gl-subhead">Anatomy of the AI Relevance Score</h3>
        <div className="gl-table-container">
          <table className="gl-table">
            <thead>
              <tr>
                <th>Factor</th>
                <th>Weight</th>
                <th>What AI REX Evaluates</th>
                <th>Sample High-Signal Metric</th>
              </tr>
            </thead>
            <tbody>
              {AI_REX_SCORE_FACTORS.map((f, i) => (
                <tr key={i}>
                  <td><strong>{f.factor}</strong></td>
                  <td>{f.weight}</td>
                  <td>{f.eval}</td>
                  <td>{f.sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gl-callout warning">
          <FiAlertTriangle className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">Avoid False Negatives</h4>
            <p>
              Do not disqualify candidates solely on rigid title matches. For instance, a "Member of Technical Staff" at a top product firm often possesses stronger systems expertise than a "Lead Architect" at an IT consultancy. AI REX normalizes titles across 25,000+ companies.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: AUTOMATED MULTI-CHANNEL OUTREACH ─── */}
      <section id="sec-screening" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiPhoneCall size={14} /> Automated Engagement Engine
        </span>
        <h2 className="gl-section-title">Automated Multi-Channel Outreach & Screening</h2>
        <p className="gl-section-lead">
          Finding the right candidate is only half the battle. Reaching them before competitors do is where AI REX delivers unprecedented speed.
        </p>

        <div className="gl-grid-2">
          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <FiMessageSquare />
            </div>
            <h4>Conversational WhatsApp Agents</h4>
            <p>
              Sends official, verified WhatsApp notifications introducing the opportunity. The AI engages in a two-way chat to answer candidate questions regarding role, work model, and benefits, while gathering their availability.
            </p>
          </div>

          <div className="gl-card-feature">
            <div className="gl-card-feature-icon" style={{ backgroundColor: '#eff6ff', color: '#002366' }}>
              <FiPhoneCall />
            </div>
            <h4>AI Voice Pre-Screening Calls</h4>
            <p>
              Autonomous, human-like voice agents place pre-scheduled screening calls to verify communication skills, current location, willingness to relocate, and primary technical strengths in under 3 minutes.
            </p>
          </div>
        </div>

        <h3 className="gl-subhead">Simulated Pre-Screening Chat Flow</h3>
        <div className="gl-mockup-frame">
          <div className="gl-mockup-bar">
            <div className="gl-mockup-dots">
              <span className="gl-mockup-dot" style={{ backgroundColor: '#ef4444' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#f59e0b' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#10b981' }} />
            </div>
            <div className="gl-mockup-title">AI REX Conversational Pre-Screening Simulator</div>
            <div>WhatsApp Verified Channel</div>
          </div>
          <div className="gl-mockup-body" style={{ background: '#f0fdf4', padding: '24px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px 12px 12px 0', border: '1px solid #dcfce7', fontSize: '13.5px', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <strong>AI REX:</strong> "Hi Amit! I noticed your extensive experience in React & TypeScript at Acme Corp. We have an open Senior Staff Engineer role at TechNova (Hybrid Bengaluru, ₹28-34L). Are you open to exploring new career opportunities?"
              </div>

              <div style={{ background: '#dcfce7', padding: '12px 16px', borderRadius: '12px 12px 0 12px', fontSize: '13.5px', color: '#065f46', alignSelf: 'flex-end', maxWidth: '85%' }}>
                <strong>Candidate:</strong> "Hi! Yes, I am open to discussing. I am currently serving notice and my last working day is next month."
              </div>

              <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px 12px 12px 0', border: '1px solid #dcfce7', fontSize: '13.5px', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <strong>AI REX:</strong> "That timing aligns perfectly! The team works 3 days from the Indiranagar office. Would that hybrid arrangement suit you, and what is your expected compensation range?"
              </div>

              <div style={{ background: '#dcfce7', padding: '12px 16px', borderRadius: '12px 12px 0 12px', fontSize: '13.5px', color: '#065f46', alignSelf: 'flex-end', maxWidth: '85%' }}>
                <strong>Candidate:</strong> "Yes, hybrid Indiranagar works. My expected CTC is ₹30 LPA."
              </div>

              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#6b21a8', textAlign: 'center', fontWeight: '600' }}>
                <FiCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Candidate Passed Pre-Screening: Available in 30 Days | Expected CTC ₹30 LPA | Hybrid Compatible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: RECRUITER FEEDBACK LOOP ─── */}
      <section id="sec-feedback" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiRefreshCw size={14} /> Reinforcement Learning
        </span>
        <h2 className="gl-section-title">The Recruiter Feedback Loop</h2>
        <p className="gl-section-lead">
          AI REX gets smarter with every single interaction. As you review recommendations, your feedback trains the model to replicate your hiring preferences.
        </p>

        <p className="gl-p">
          When candidates are delivered to your shortlist dashboard, you have three immediate triage actions:
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature" style={{ borderLeft: '4px solid #10b981' }}>
            <h4 style={{ color: '#059669' }}>1. Good Fit</h4>
            <p>
              Signals to AI REX that this candidate represents your ideal benchmark. The model increases weighting for similar educational backgrounds, company tiers, and skill profiles.
            </p>
          </div>

          <div className="gl-card-feature" style={{ borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ color: '#d97706' }}>2. Maybe</h4>
            <p>
              Indicates the candidate meets basic qualifications but lacks specific standout traits. Kept in a secondary pipeline without heavily shifting model weights.
            </p>
          </div>

          <div className="gl-card-feature" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ color: '#dc2626' }}>3. Not a Fit</h4>
            <p>
              Prompts a quick 1-click reason (e.g. "Over budget", "Too frequent job hops", "Missing AWS"). AI REX immediately suppresses similar profiles across the campaign.
            </p>
          </div>
        </div>

        <div className="gl-callout info">
          <FiInfo className="gl-callout-icon" />
          <div className="gl-callout-content">
            <h4 className="gl-callout-title">Calibrating After 5 Reviews</h4>
            <p>
              Research across 10,000+ sourcing campaigns shows that after a recruiter evaluates just <strong>5 candidate profiles</strong>, AI REX achieves a 94% recommendation accuracy for the remainder of the requisition.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: END-TO-END WORKFLOW ─── */}
      <section id="sec-workflow" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiLayers size={14} /> Step-by-Step Playbook
        </span>
        <h2 className="gl-section-title">End-to-End AI REX Workflow</h2>
        <p className="gl-section-lead">
          Here is how to set up, launch, and monitor an AI REX campaign from your MavenJobs Recruiter Dashboard:
        </p>

        <div className="gl-steps-flow">
          <div className="gl-step-card">
            <div className="gl-step-num" style={{ background: '#7c3aed' }}>1</div>
            <div className="gl-step-content">
              <h4>Define the Hiring Mandate</h4>
              <p>
                Navigate to <strong>Hiring Automation &gt; AI REX</strong>. Enter your target job title, experience brackets, budget ceiling, location parameters, and upload or paste the full job description.
              </p>
              <div className="gl-step-tags">
                <span className="gl-step-tag">Mandate Parser</span>
                <span className="gl-step-tag">Location Tiers</span>
                <span className="gl-step-tag">Budget Guardrails</span>
              </div>
            </div>
          </div>

          <div className="gl-step-card">
            <div className="gl-step-num" style={{ background: '#7c3aed' }}>2</div>
            <div className="gl-step-content">
              <h4>Configure Screening Guardrails</h4>
              <p>
                Set up 2 to 4 mandatory pre-screening questions (e.g., "Are you comfortable with 3 days in-office in Gurgaon?", "What is your official notice period in days?"). Choose whether to engage via WhatsApp, Voice calls, or both.
              </p>
              <div className="gl-step-tags">
                <span className="gl-step-tag">WhatsApp Agent</span>
                <span className="gl-step-tag">Voice Verification</span>
                <span className="gl-step-tag">Dealbreaker Filters</span>
              </div>
            </div>
          </div>

          <div className="gl-step-card">
            <div className="gl-step-num" style={{ background: '#7c3aed' }}>3</div>
            <div className="gl-step-content">
              <h4>Review Initial AI Batch & Calibrate</h4>
              <p>
                AI REX presents an initial cohort of 10 recommended talent matches. Spend 2 minutes marking each as "Good Fit" or "Not a Fit". Watch the model instantly update its matching parameters.
              </p>
              <div className="gl-step-tags">
                <span className="gl-step-tag">1-Click Calibration</span>
                <span className="gl-step-tag">Live Weight Tuning</span>
              </div>
            </div>
          </div>

          <div className="gl-step-card">
            <div className="gl-step-num" style={{ background: '#7c3aed' }}>4</div>
            <div className="gl-step-content">
              <h4>Activate Autonomous Outreach</h4>
              <p>
                Click <strong>"Start AI Sourcing"</strong>. The automated agent begins reaching out to verified candidates in staggered cohorts to maintain high deliverability and response rates.
              </p>
              <div className="gl-step-tags">
                <span className="gl-step-tag">Autonomous Execution</span>
                <span className="gl-step-tag">Smart Throttling</span>
              </div>
            </div>
          </div>

          <div className="gl-step-card">
            <div className="gl-step-num" style={{ background: '#7c3aed' }}>5</div>
            <div className="gl-step-content">
              <h4>Receive Pre-Screened Candidates & Schedule</h4>
              <p>
                As candidates pass pre-screening, they populate your "Ready for Interview" tab complete with audio call recordings, WhatsApp transcripts, verified notice periods, and resume links.
              </p>
              <div className="gl-step-tags">
                <span className="gl-step-tag">Verified Shortlist</span>
                <span className="gl-step-tag">Direct Calendar Booking</span>
                <span className="gl-step-tag">ATS Export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: INTERACTIVE SIMULATOR ─── */}
      <section id="sec-simulation" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiSliders size={14} /> Interactive Playground
        </span>
        <h2 className="gl-section-title">Interactive AI REX Mandate Simulator</h2>
        <p className="gl-section-lead">
          Test how AI REX extracts intent, skills, and parameters from different recruitment mandates:
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {AI_REX_SAMPLE_MANDATES.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedMandateIdx(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedMandateIdx === idx ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                background: selectedMandateIdx === idx ? '#f5f3ff' : '#ffffff',
                color: selectedMandateIdx === idx ? '#7c3aed' : '#334155',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              {m.role}
            </button>
          ))}
        </div>

        <div className="gl-mockup-frame">
          <div className="gl-mockup-bar">
            <div className="gl-mockup-dots">
              <span className="gl-mockup-dot" style={{ backgroundColor: '#ef4444' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#f59e0b' }} />
              <span className="gl-mockup-dot" style={{ backgroundColor: '#10b981' }} />
            </div>
            <div className="gl-mockup-title">AI REX Mandate Analyzer Engine</div>
            <div>Status: Operational</div>
          </div>
          <div className="gl-mockup-body" style={{ background: '#ffffff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Role & Experience</span>
                <h4 style={{ margin: '4px 0', fontSize: '16px', color: '#0f172a' }}>{mandate.role}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>{mandate.exp} • {mandate.budget}</p>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Location & Model</span>
                <h4 style={{ margin: '4px 0', fontSize: '16px', color: '#0f172a' }}>{mandate.location}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#059669', fontWeight: 600 }}>Optimal Talent Density: High</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                AI-Extracted Core Competencies (Must-Have):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mandate.mustHave.map((sk, i) => (
                  <span key={i} style={{ background: '#7c3aed15', color: '#7c3aed', padding: '4px 10px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, border: '1px solid #7c3aed30' }}>
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                Secondary & Adjacent Skills (Good-to-Have):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mandate.goodToHave.map((sk, i) => (
                  <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500 }}>
                    + {sk}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#5b21b6' }}>
              <strong>AI REX Semantic Context:</strong> "{mandate.extractedIntent}"
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: RECRUITER EFFICIENCY & ROI ─── */}
      <section id="sec-metrics" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiAward size={14} /> Measurable Impact
        </span>
        <h2 className="gl-section-title">Recruiter Efficiency & ROI Benchmarks</h2>
        <p className="gl-section-lead">
          How enterprise recruiting teams scale their productivity with AI REX:
        </p>

        <div className="gl-grid-3">
          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#7c3aed', marginBottom: '8px' }}>70%</div>
            <h4>Reduction in Time-to-Hire</h4>
            <p>From initial job brief to final candidate shortlist down from 14 days to under 4 days.</p>
          </div>

          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#059669', marginBottom: '8px' }}>3.4x</div>
            <h4>Higher Candidate Response</h4>
            <p>Conversational WhatsApp outreach yields over 62% engagement vs. 18% for cold email.</p>
          </div>

          <div className="gl-card-feature" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#002366', marginBottom: '8px' }}>15+ hrs</div>
            <h4>Saved per Recruiter / Week</h4>
            <p>Automating resume pre-screening and scheduling allows recruiters to focus on closing offers.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: FAQS ─── */}
      <section id="sec-faqs" className="gl-section">
        <span className="gl-section-eyebrow" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
          <FiHelpCircle size={14} /> Knowledge Base
        </span>
        <h2 className="gl-section-title">Frequently Asked Questions</h2>
        <p className="gl-section-lead">
          Find answers to common questions about setting up and mastering AI REX:
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
