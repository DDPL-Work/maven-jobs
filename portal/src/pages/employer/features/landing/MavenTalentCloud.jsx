import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiCheck, 
  FiArrowRight, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiPlay, 
  FiUsers, 
  FiBriefcase, 
  FiLayers, 
  FiShield, 
  FiCpu, 
  FiTrendingUp, 
  FiCheckCircle 
} from 'react-icons/fi';
import TalentCloudHeader from '../../../../layout/employer/TalentCloudHeader';
import TalentCloudFooter from '../../../../layout/employer/TalentCloudFooter';
import TalentCloudDemoForm from '../../../../components/employer/TalentCloudDemoForm';
import heroImg from '../../../../../assets/maven-talent-cloud-hero.jpg';
import showcaseVideo from '../../../../../assets/showcase.mp4';
import './MavenTalentCloud.css';

export default function MavenTalentCloud() {
  const [activeTab, setActiveTab] = useState('sourcing');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const validTabs = ['sourcing', 'planning', 'screening', 'branding', 'automation', 'assisted'];

    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
      // Wait for DOM to be ready before scrolling
      setTimeout(() => {
        const el = document.getElementById('solutions-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else if (location.hash === '#solutions-section') {
      setTimeout(() => {
        const el = document.getElementById('solutions-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.search, location.hash]);
  
  const scrollToDemo = (e) => {
    e?.preventDefault();
    const el = document.getElementById('demo-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToShowcase = (e) => {
    e?.preventDefault();
    const el = document.getElementById('showcase-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectTabAndScroll = (tabId) => {
    setActiveTab(tabId);
    const el = document.getElementById('solutions-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Tabs Data matching Naukri Talent Cloud copy, branded for Maven Jobs
  const solutionsTabs = [
    { id: 'sourcing', label: 'Talent Sourcing' },
    { id: 'planning', label: 'Talent Planning' },
    { id: 'screening', label: 'Screening & Evaluation' },
    { id: 'branding', label: 'Employer Branding' },
    { id: 'automation', label: 'Hiring Automation' },
    { id: 'assisted', label: 'Assisted Hiring' },
  ];

  const tabContent = {
    sourcing: {
      summary: {
        title: 'Largest recruitment AI. Talent decoded.',
        desc: 'Unmatched scale and deep matching algorithms connect you to active, high-intent jobseekers and passive industry leaders across India.',
      },
      cards: [
        {
          badge: 'Core Database & Job Boards',
          title: 'Maven Jobs (Resdex & Job Posting)',
          desc: 'Tap into 10Cr+ verified resumes with AI semantic search, predictive filters, and fast candidate outreach.',
          bullets: [
            'Instant access to India’s largest active talent network',
            'AI-matched recommendations based on job requisitions',
            'Automated response management & candidate shortlisting'
          ],
          brand: 'Maven Jobs'
        },
        {
          badge: 'Executive & CXO',
          title: 'Executive & Leadership Talent',
          desc: 'Discreet, high-touch executive sourcing connecting you with boardroom leaders, VPs, and seasoned directors.',
          bullets: [
            'Exclusive database of senior leaders and CXO profiles',
            'Confidential posting options with strict privacy controls',
            'Curated talent pipelines for strategic leadership roles'
          ],
          brand: 'Executive Search'
        },
        {
          badge: 'Niche Engineering',
          title: 'Tech Talent Hub',
          desc: 'Targeted tech talent pool with verified technical capabilities in AI, Cloud, FullStack, and DevOps architectures.',
          bullets: [
            'Deep tech taxonomy matching specific frameworks & skills',
            'Repository-based insights and skill badge validations',
            'Fast-track hiring for tech startups, GCCs, and IT giants'
          ],
          brand: 'Tech Talent Hub'
        }
      ]
    },
    planning: {
      summary: {
        title: 'Make smarter, data-driven hiring decisions upfront',
        desc: 'Real-time talent market intelligence, salary benchmarks, and supply-demand analytics to shape your hiring roadmap.',
      },
      cards: [
        {
          badge: 'Market Intelligence',
          title: 'Talent Pulse',
          desc: 'Comprehensive talent market analytics covering talent availability, attrition velocity, and competitor movements.',
          bullets: [
            'Real-time supply and demand indexes across sectors',
            'City-wise salary distributions and candidate mobility',
            'Benchmarking your brand against peers in hiring speed'
          ],
          brand: 'Talent Pulse'
        },
        {
          badge: 'Executive Insights',
          title: 'Executive Planning (Calculus)',
          desc: 'Actionable executive-level compensation data and talent availability trends across leadership functions.',
          bullets: [
            'Industry-wide CXO compensation percentiles',
            'Leadership migration and career transition patterns',
            'Succession planning datasets for strategic functions'
          ],
          brand: 'Calculus'
        },
        {
          badge: 'Tech Benchmarks',
          title: 'Tech Planning (Calculus Tech)',
          desc: 'Granular engineering compensation, emerging tech adoption rates, and geographic tech hub density.',
          bullets: [
            'Technology stack salary percentiles across experience tiers',
            'Talent density in Tier 1, 2, and emerging tech clusters',
            'Predictive insights on engineering hiring difficulty'
          ],
          brand: 'Calculus Tech'
        }
      ]
    },
    screening: {
      summary: {
        title: 'Evaluate faster with automated assessments & AI interviews',
        desc: 'Eliminate scheduling friction and interview fatigue. Standardize your evaluation with scientific rigor.',
      },
      cards: [
        {
          badge: 'Skill Testing',
          title: 'Maven Assessment',
          desc: 'Comprehensive library of 2,000+ pre-built technical, cognitive, and domain-specific assessments.',
          bullets: [
            'Coding environments supporting 40+ programming languages',
            'Advanced anti-cheating & AI proctoring mechanisms',
            'Instant standardized scorecards and candidate ranking'
          ],
          brand: 'Maven Assessment'
        },
        {
          badge: 'Language & Fluency',
          title: 'SpeechSense & Communication AI',
          desc: 'Automated evaluation of spoken English, listening comprehension, grammar, and pronunciation.',
          bullets: [
            'Objective scoring calibrated to CEFR international standards',
            'Ideal for customer support, sales, and client-facing roles',
            'Unbiased acoustic analysis delivering instant reports'
          ],
          brand: 'SpeechSense'
        },
        {
          badge: 'Video Evaluation',
          title: 'Collaborative Video Interviews',
          desc: 'Integrated one-way asynchronous or live panel video interviews with shared code editors and notes.',
          bullets: [
            'Screen anytime, anywhere with on-demand video questions',
            'Multi-evaluator rating rubrics with centralized feedback',
            'Seamless calendar sync with Google Meet and Microsoft Teams'
          ],
          brand: 'Video Interviews'
        }
      ]
    },
    branding: {
      summary: {
        title: 'Showcase your company culture and attract dream talent',
        desc: 'Transform your employer reputation into a talent magnet with high-visibility branded company spaces.',
      },
      cards: [
        {
          badge: 'Brand Spotlight',
          title: 'Employer Branding Edge',
          desc: 'Dedicated enterprise microsite showcasing your work culture, leadership vision, office perks, and job openings.',
          bullets: [
            'Immersive media galleries with video testimonials',
            'Targeted banner placements on high-traffic seeker journeys',
            'Direct boost to organic job applications and candidate interest'
          ],
          brand: 'Branding Edge'
        },
        {
          badge: 'D&I Focus',
          title: 'Diversity & Inclusion Solutions',
          desc: 'Promote an inclusive workplace with curated campaigns targeted towards women in tech, PwD, and returning leaders.',
          bullets: [
            'Dedicated diversity hiring fairs and featured job spotlights',
            'Customizable DEI story hubs to showcase women leadership',
            'Measurable engagement metrics among diverse talent pools'
          ],
          brand: 'Diversity Hub'
        },
        {
          badge: 'Amplification',
          title: 'Targeted Job Marketing',
          desc: 'Algorithmic job advertising that puts your urgent mandates in front of the most relevant candidate cohorts.',
          bullets: [
            'Dynamic job alerts sent via Email, SMS, and WhatsApp',
            'Retargeting interested candidates who viewed your job post',
            'Cost-effective applicant generation for hard-to-fill positions'
          ],
          brand: 'Job Marketing'
        }
      ]
    },
    automation: {
      summary: {
        title: 'Streamline the recruitment lifecycle from sourcing to offer',
        desc: 'Supercharge recruiter productivity, eliminate manual coordination, and integrate seamlessly with your existing HR tools.',
      },
      cards: [
        {
          badge: 'Recruitment Suite',
          title: 'Maven Hire (Workflow Suite)',
          desc: 'Complete applicant tracking system designed for collaborative hiring teams, recruiters, and hiring managers.',
          bullets: [
            'Customizable recruitment pipelines & stage tracking',
            'Automated candidate messaging via WhatsApp and email',
            'Offer letter generation with digital signature integration'
          ],
          brand: 'Maven Hire'
        },
        {
          badge: 'Ecosystem Connect',
          title: 'ATS & HRIS Integrations',
          desc: 'Two-way real-time data sync with leading enterprise HR software platforms.',
          bullets: [
            'Certified connectors for SAP SuccessFactors, Workday & Darwinbox',
            'Bi-directional sync for jobs and candidate applications',
            'Zero data duplication and automated candidate stage updates'
          ],
          brand: 'Integrations'
        }
      ]
    },
    assisted: {
      summary: {
        title: 'Scale quickly with specialized talent partners on-demand',
        desc: 'When internal bandwidth is limited or mandates are urgent, leverage Maven’s recruitment specialists.',
      },
      cards: [
        {
          badge: 'Managed Sourcing',
          title: 'Talent Campaigns',
          desc: 'Turnkey hiring campaigns managed end-to-end by Maven experts with guaranteed shortlisted profiles.',
          bullets: [
            'Dedicated recruitment managers assigned to your mandates',
            'Pre-screened, interview-ready candidate shortlists delivered',
            'Pay-for-performance models tailored to your hiring goals'
          ],
          brand: 'Talent Campaigns'
        },
        {
          badge: 'Sourcing Specialist',
          title: 'Maven Assist Pro',
          desc: 'Recruiter-on-demand support delivering calibrated profiles directly into your ATS within 48 hours.',
          bullets: [
            'Deep candidate engagement and availability verification',
            'Notice period and compensation pre-negotiations',
            'Ideal for high-volume hiring sprints and rapid team scale-ups'
          ],
          brand: 'Maven Assist Pro'
        },
        {
          badge: 'Executive Partner',
          title: 'Maven Assist Pro Plus',
          desc: 'Comprehensive white-glove executive recruitment service for crucial leadership appointments.',
          bullets: [
            'Rigorous reference checks and cultural fitment interviews',
            'Advisory support on compensation packaging and offer rollout',
            'Replacement guarantee on all leadership placements'
          ],
          brand: 'Assist Pro Plus'
        }
      ]
    }
  };

  const ecosystemItems = [
    {
      logo: 'MJ',
      color: '#2563eb',
      name: 'Maven Jobs (Resdex)',
      tagline: 'Database & Search',
      desc: 'Access India’s largest repository of active talent with AI-assisted filters, boolean queries, and automated outreach.'
    },
    {
      logo: 'ES',
      color: '#7c3aed',
      name: 'Executive Search',
      tagline: 'Leadership Hiring',
      desc: 'Confidential sourcing and advisory services for senior vice presidents, CXOs, and strategic business heads.'
    },
    {
      logo: 'TH',
      color: '#0284c7',
      name: 'Tech Talent Hub',
      tagline: 'Verified Developers',
      desc: 'Find pre-vetted engineers across full-stack, cloud architecture, data science, and modern framework skills.'
    },
    {
      logo: 'MC',
      color: '#059669',
      name: 'Maven Campus',
      tagline: 'Graduate Recruitment',
      desc: 'Seamlessly engage with top engineering, management, and arts institutions across India for fresh graduates.'
    },
    {
      logo: 'CR',
      color: '#ea580c',
      name: 'Company Reviews & Insights',
      tagline: 'Brand Reputation',
      desc: 'Showcase authentic employee ratings, workplace culture, and employee satisfaction to inspire applicant trust.'
    },
    {
      logo: 'SA',
      color: '#4f46e5',
      name: 'Skill Assessment',
      tagline: 'Pre-hire Testing',
      desc: 'Evaluate candidate aptitude, programming depth, and communication skills with proctored AI assessments.'
    },
    {
      logo: 'EB',
      color: '#db2777',
      name: 'Employer Branding Edge',
      tagline: 'Talent Magnet',
      desc: 'Craft an unforgettable digital workplace presence to attract top-tier professionals organically.'
    },
    {
      logo: 'MA',
      color: '#0891b2',
      name: 'Maven Assist',
      tagline: 'Assisted Sourcing',
      desc: 'On-demand recruitment specialists sourcing, screening, and scheduling interviews on your behalf.'
    },
    {
      logo: 'MH',
      color: '#4338ca',
      name: 'Hiring Automation Suite',
      tagline: 'Workflow & ATS',
      desc: 'Automate repetitive recruiter tasks, schedule rounds effortlessly, and close candidates faster than ever.'
    }
  ];

  return (
    <div className="mtc-page">
      {/* Top Header */}
      <TalentCloudHeader onSelectTab={selectTabAndScroll} onRequestDemo={scrollToDemo} />

      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="mtc-hero">
        <div className="mtc-hero-bg">
          <img 
            src={heroImg} 
            alt="Maven Talent Cloud AI" 
            className="mtc-hero-img-overlay"
          />
          <div className="mtc-hero-gradient"></div>
        </div>

        <div className="mtc-hero-inner">
          <div className="mtc-hero-content">
            <div className="mtc-hero-badge">
              <FiCpu size={14} /> AI-Powered Talent Ecosystem
            </div>
            
            <h1 className="mtc-hero-title">
              One-Stop Solution.<br />Talent Decoded.
            </h1>
            
            <p className="mtc-hero-desc">
              One-stop solution for planning, sourcing, screening, employer branding, 
              and hiring automation, powered by Maven AI to help you decode top talent.
            </p>

            <div className="mtc-hero-actions">
              <button onClick={scrollToDemo} className="mtc-btn-primary">
                Book a Demo <FiArrowRight size={18} />
              </button>
              <button onClick={scrollToShowcase} className="mtc-btn-outline">
                <FiPlay size={16} /> Watch Showcase
              </button>
            </div>

            <div className="mtc-brand-strip">
              <span className="mtc-brand-strip-label">Enterprise Suite:</span>
              <button type="button" onClick={() => selectTabAndScroll('sourcing')} className="mtc-brand-pill" style={{ cursor: 'pointer', background: 'transparent' }}>Maven Jobs</button>
              <button type="button" onClick={() => selectTabAndScroll('planning')} className="mtc-brand-pill" style={{ cursor: 'pointer', background: 'transparent' }}>Talent Pulse</button>
              <button type="button" onClick={() => selectTabAndScroll('screening')} className="mtc-brand-pill" style={{ cursor: 'pointer', background: 'transparent' }}>Maven Assessment</button>
              <button type="button" onClick={() => selectTabAndScroll('automation')} className="mtc-brand-pill" style={{ cursor: 'pointer', background: 'transparent' }}>Maven Hire ATS</button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Showcase Video / Billboard Section ───────────────────── */}
      <section className="mtc-showcase-section" id="showcase-section">
        <div className="mtc-showcase-container">
          <div className="mtc-showcase-frame">
            <video
              src={showcaseVideo} 
              className="mtc-showcase-video"
              controls
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* ─── Explore All Solutions Section ────────────────────────── */}
      <section className="mtc-solutions-section" id="solutions-section">
        <div className="mtc-section-header">
          <div className="mtc-section-kicker">Solutions Decoded</div>
          <h2 className="mtc-section-title">Explore all solutions</h2>
        </div>

        {/* Tab Selector Buttons */}
        <div className="mtc-tabs-nav">
          {solutionsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mtc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Intro Subtitle & Description */}
        <div className="mtc-tab-intro-wrap">
          <h3 className="mtc-tab-intro-heading">
            {tabContent[activeTab].summary.title}
          </h3>
          <p className="mtc-tab-intro-sub">
            {tabContent[activeTab].summary.desc}
          </p>
        </div>

        {/* Tab Cards Row - All Cards in One Line */}
        <div className={`mtc-solutions-cards-row cards-${tabContent[activeTab].cards.length}`}>
          {tabContent[activeTab].cards.map((card, idx) => (
            <div key={idx} className="mtc-sol-card">
              <div className="mtc-sol-card-body">
                <div className="mtc-sol-card-header">
                  <span className="mtc-sol-card-badge">{card.badge}</span>
                  <h4 className="mtc-sol-card-title">{card.title}</h4>
                </div>
                <p className="mtc-sol-card-desc">{card.desc}</p>
                <ul className="mtc-sol-card-bullets">
                  {card.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              <div className="mtc-sol-card-footer">
                <span className="mtc-sol-card-brand-logo">
                  <FiBriefcase size={14} color="#2563eb" /> {card.brand}
                </span>
                <button 
                  onClick={scrollToDemo} 
                  className="mtc-sol-card-btn"
                >
                  Explore <FiArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mtc-solutions-cta-wrap">
          <button onClick={scrollToDemo} className="mtc-btn-accent">
            Request Custom Consultation
          </button>
        </div>
      </section>

      {/* ─── Maven AI Edge Section ─────────────────────────────────── */}
      <section className="mtc-ai-section">
        <div className="mtc-ai-bg-lines"></div>
        <div className="mtc-ai-container">
          <div>
            <div className="mtc-ai-tag">Unparalleled Intelligence</div>
            <h2 className="mtc-ai-title">
              <span className="mtc-ai-pill-badge">Maven AI</span> has an unparalleled edge
            </h2>
            <div className="mtc-ai-features">
              <div className="mtc-ai-feature-item">
                <div className="mtc-ai-check-icon"><FiCheck size={14} /></div>
                <span>Decodes candidate intent, tenure probability, and search urgency</span>
              </div>
              <div className="mtc-ai-feature-item">
                <div className="mtc-ai-check-icon"><FiCheck size={14} /></div>
                <span>Understands deep semantic context beyond exact keyword matching</span>
              </div>
              <div className="mtc-ai-feature-item">
                <div className="mtc-ai-check-icon"><FiCheck size={14} /></div>
                <span>Personalized job-to-candidate recommendation graph</span>
              </div>
              <div className="mtc-ai-feature-item">
                <div className="mtc-ai-check-icon"><FiCheck size={14} /></div>
                <span>Real-time profile enrichment with verified tech stacks & skills</span>
              </div>
            </div>
          </div>

          <div className="mtc-metrics-col">
            <div className="mtc-metrics-kicker">Powered by Massive Scale</div>
            
            <div className="mtc-metric-item">
              <div className="mtc-metric-number">50 Cr+</div>
              <div className="mtc-metric-label">Profile views annually across Maven network</div>
            </div>

            <div className="mtc-metric-item">
              <div className="mtc-metric-number">10 Cr+</div>
              <div className="mtc-metric-label">Candidate applications processed seamlessly</div>
            </div>

            <div className="mtc-metric-item">
              <div className="mtc-metric-number">50 Lac+</div>
              <div className="mtc-metric-label">Profile updates refreshed every single month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Experience One-Stop Solution Section ──────────────────── */}
      <section className="mtc-experience-section">
        <div className="mtc-experience-container">
          <div className="mtc-exp-left">
            <h2 className="mtc-exp-title">
              Experience the one-stop solution for all your hiring needs
            </h2>
            
            <div className="mtc-exp-bullets">
              <div className="mtc-exp-bullet-item">
                <div className="mtc-exp-bullet-icon"><FiCheck size={12} /></div>
                <span>End-to-end recruitment lifecycle</span>
              </div>
              <div className="mtc-exp-bullet-item">
                <div className="mtc-exp-bullet-icon"><FiCheck size={12} /></div>
                <span>Deep integration across all tools</span>
              </div>
              <div className="mtc-exp-bullet-item">
                <div className="mtc-exp-bullet-icon"><FiCheck size={12} /></div>
                <span>Enterprise-grade security & compliance</span>
              </div>
              <div className="mtc-exp-bullet-item">
                <div className="mtc-exp-bullet-icon"><FiCheck size={12} /></div>
                <span>Dedicated customer success partner</span>
              </div>
            </div>

            <button onClick={scrollToDemo} className="mtc-btn-primary" style={{ background: '#0f172a', color: '#ffffff' }}>
              Book a Demo <FiArrowRight size={16} />
            </button>
          </div>

          {/* 9-Card Ecosystem Grid */}
          <div className="mtc-ecosystem-grid">
            {ecosystemItems.map((item, idx) => (
              <div key={idx} className="mtc-eco-card">
                <div className="mtc-eco-card-top">
                  <div className="mtc-eco-logo-box" style={{ background: `${item.color}15`, color: item.color }}>
                    {item.logo}
                  </div>
                  <div className="mtc-eco-name">{item.name}</div>
                  <div className="mtc-eco-tagline">{item.tagline}</div>
                  <p className="mtc-eco-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Demo Booking Form Section ─────────────────────────────── */}
      <section className="mtc-demo-section" id="demo-section">
        <div className="mtc-demo-container">
          <div>
            <div className="mtc-demo-left-kicker">Let's Connect</div>
            <h2 className="mtc-demo-left-title">
              Know more about <span>Maven Talent Cloud</span>
            </h2>
            
            <div className="mtc-demo-left-bullets">
              <div className="mtc-demo-left-bullet">
                <FiCheckCircle size={20} color="#2563eb" />
                <span>Personalized 1-on-1 walkthrough with talent advisors</span>
              </div>
              <div className="mtc-demo-left-bullet">
                <FiCheckCircle size={20} color="#2563eb" />
                <span>Custom ROI and hiring velocity forecast for your team</span>
              </div>
              <div className="mtc-demo-left-bullet">
                <FiCheckCircle size={20} color="#2563eb" />
                <span>Exclusive pilot access to Maven AI matching algorithms</span>
              </div>
            </div>
          </div>

          {/* Modular Reusable Demo Form Component */}
          <TalentCloudDemoForm 
            title="Book your personalized demo!"
            buttonText="Continue"
          />
        </div>
      </section>

      {/* Footer */}
      <TalentCloudFooter onSelectTab={selectTabAndScroll} />
    </div>
  );
}
