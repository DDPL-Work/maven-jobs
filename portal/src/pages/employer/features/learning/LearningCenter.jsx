import { useState, useEffect, useRef } from 'react';
import EmployerFooter from '../../../../components/EmployerFooter';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import heroLearning from '../../../../../assets/heroLearning.png';
import heroLearning2 from '../../../../../assets/heroLearning2.png';
import hero3 from '../../../../../assets/hero3.png';
import hero4 from '../../../../../assets/hero4.png';
import hero5 from '../../../../../assets/hero5.png';
import mentor1 from '../../../../../assets/mentor1.png';
import mentor2 from '../../../../../assets/mentor2.png';
import mentor3 from '../../../../../assets/mentor3.png';
import {
  FiBook, FiVideo, FiAward, FiUsers, FiChevronRight,
  FiChevronLeft, FiPlay, FiCalendar, FiClock, FiStar,
  FiCheckCircle, FiArrowRight, FiZap, FiBriefcase,
  FiSearch, FiTrendingUp, FiShield, FiChevronDown
} from 'react-icons/fi';
import './LearningCenter.css';

/* ─── DATA ─────────────────────────────────────────── */

const ROTATING_WORDS = ['video tutorials', 'step-by-step guides', 'free webinars'];

const PRODUCTS = [
  {
    id: 'resdex',
    label: 'Resdex',
    title: 'Resdex',
    desc: "India's largest resume database, with over 10Cr+ profiles across industries, functions, and experience levels. Search, filter, and reach out to the right candidates - all in one place.",
    tags: ['Read Guide', 'Live Webinar'],
    color: '#002366',
    gradient: 'linear-gradient(135deg, #002366 0%, #0050a0 100%)',
    img: heroLearning
  },
  {
    id: 'ai',
    label: 'AI Sourcing',
    title: 'Maven AI Sourcing',
    desc: "AI-powered talent sourcing that finds, screens, and ranks candidates automatically — cutting sourcing time from days to hours. Let the AI do the heavy lifting so you focus on hiring decisions.",
    tags: ['Read Guide', 'Live Webinar'],
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    img: hero5
  },
  {
    id: 'jobs',
    label: 'Job Posting',
    title: 'Job Posting',
    desc: "List your open jobs in front of India's largest pool of job seekers, where candidates find and apply to your jobs. You can edit, manage, and track your postings all in one place.",
    tags: ['Read Guide', 'Live Webinar'],
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    img: heroLearning2
  },
  {
    id: 'analytics',
    label: 'Talent Analytics',
    title: 'Talent Pulse Analytics',
    desc: "AI-powered workforce intelligence that surfaces talent availability, salary benchmarks, and competitor hiring trends — helping you make smarter, faster, data-driven hiring decisions.",
    tags: ['Live Webinar'],
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
    img: hero4
  },
  {
    id: 'branding',
    label: 'Employer Branding',
    title: 'Employer Branding Hub',
    desc: "Build a compelling employer brand that attracts top talent. Showcase your company culture, benefits, and values with a rich Company Page that makes candidates choose you over competitors.",
    tags: ['Read Guide', 'Live Webinar'],
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    img: hero3
  },
];

const WEBINARS = [
  { id: 1, product: 'Resume Database', title: 'Basics of Resume Search', desc: 'Learn how to search, filter & shortlist candidates that match your hiring brief.', schedule: 'Mon & Wed', duration: '30 mins', seats: 48 },
  { id: 2, product: 'Resume Database', title: 'Advanced Boolean Masterclass', desc: 'Boolean search, proximity search & advanced filters to surface profiles others miss.', schedule: 'Tue & Thu', duration: '45 mins', seats: 32 },
  { id: 3, product: 'AI Sourcing', title: 'Getting Started with AI Sourcing', desc: 'Set up your first AI sourcing campaign and screen hundreds of candidates automatically.', schedule: 'Wed & Fri', duration: '30 mins', seats: 60 },
  { id: 4, product: 'Job Posting', title: 'Writing Jobs That Convert', desc: 'Craft compelling job descriptions that attract quality applicants and reduce drop-offs.', schedule: 'Mon & Thu', duration: '30 mins', seats: 75 },
  { id: 5, product: 'Talent Analytics', title: 'Data-Driven Hiring Decisions', desc: 'Use market intelligence to benchmark salaries and identify talent gaps before they cost you.', schedule: 'Tue & Fri', duration: '45 mins', seats: 28 },
];

const EXPERTS = [
  { name: 'Sahil Manoj', role: 'Senior Talent Coach', sessions: '900+', trained: '5850+', initials: 'SM', color: '#002366', img: mentor1 },
  { name: 'Nancy', role: 'AI Hiring Specialist', sessions: '800+', trained: '6000+', initials: 'N', color: '#7c3aed', img: mentor2 },
  { name: 'Anannya Kulshrestha', role: 'Resume Search Expert', sessions: '1200+', trained: '7800+', initials: 'AK', color: '#059669', img: mentor3 },
  { name: 'Rahul Mehta', role: 'Job Posting Strategist', sessions: '850+', trained: '5900+', initials: 'RM', color: '#002366', img: mentor1 },
  { name: 'Meera Iyer', role: 'Employer Branding Lead', sessions: '650+', trained: '4400+', initials: 'MI', color: '#7c3aed', img: mentor2 },
  { name: 'Vikram Bose', role: 'Talent Acquisition Expert', sessions: '1100+', trained: '7200+', initials: 'VB', color: '#059669', img: mentor3 },
  { name: 'Priya Sharma', role: 'Senior Talent Coach', sessions: '950+', trained: '6100+', initials: 'PS', color: '#002366', img: mentor1 },
  { name: 'Amit Desai', role: 'AI Hiring Specialist', sessions: '720+', trained: '4800+', initials: 'AD', color: '#7c3aed', img: mentor2 },
  { name: 'Kavya Singh', role: 'Resume Search Expert', sessions: '1300+', trained: '8100+', initials: 'KS', color: '#059669', img: mentor3 },
  { name: 'Rohan Gupta', role: 'Job Posting Strategist', sessions: '880+', trained: '6000+', initials: 'RG', color: '#002366', img: mentor1 },
];

const GUIDES = [
  { id: 1, product: 'Resume Database', title: 'The Complete Guide to Resume Search: Find Talent Faster', badge: 'Beginner Friendly', color: '#002366', readTime: '12 min read', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600' },
  { id: 2, product: 'Job Posting', title: 'Post & Manage Jobs Like a Pro: A Step-by-Step Playbook', badge: 'Most Popular', color: '#059669', readTime: '8 min read', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600' },
  { id: 3, product: 'AI Sourcing', title: 'Getting Started with AI-Powered Candidate Sourcing', badge: 'New', color: '#7c3aed', readTime: '10 min read', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600' },
  { id: 4, product: 'Talent Analytics', title: 'Mastering Talent Pulse: Data-Driven Workforce Planning', badge: 'Advanced', color: '#dc2626', readTime: '15 min read', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600' },
  { id: 5, product: 'Employer Branding', title: 'Build Your Employer Brand: Attract the Best Candidates', badge: 'Strategy', color: '#0284c7', readTime: '11 min read', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600' },
];

const COMPANIES = ['Tata Consultancy', 'Infosys', 'Wipro', 'HCL', 'Accenture', 'Deloitte', 'IBM', 'Cognizant', 'Tech Mahindra', 'Capgemini'];

const FAQ_CATEGORIES = [
  {
    id: 'general',
    title: 'General & Account',
    faqs: [
      { q: 'Is the Maven Learning Center free to use?', a: 'Yes! All guides, webinars, and the certification programme are completely free for all registered employers on MavenJobs.' },
      { q: 'How do I create or update my employer profile?', a: 'Log into your MavenJobs account, click on your profile avatar in the top right, and select "Company Profile" to update details.' },
      { q: 'What happens if I forget my password?', a: 'Click on "Forgot Password" on the login page. An email with a reset link will be sent to your registered email address.' },
      { q: 'Can I add multiple recruiters to the same company account?', a: 'Yes. Account administrators can invite team members from the Settings > Manage Team page.' },
      { q: 'Where can I see my current plan or subscription details?', a: 'Go to Settings > Billing & Subscriptions to view your active plans, remaining credits, and next renewal date.' },
    ]
  },
  {
    id: 'resdex',
    title: 'Resume Database (Resdex)',
    faqs: [
      { q: 'How do I run a basic search in Resdex?', a: 'Enter skills, designations, or keywords in the main search bar on the Resdex dashboard and click Search.' },
      { q: 'What is a Boolean search?', a: 'Boolean search uses operators like AND, OR, and NOT to combine keywords, making your search highly specific and targeted.' },
      { q: 'How do I save a search query for later?', a: 'After running a search, click the "Save Search" button at the top of the results page and give it a name.' },
      { q: 'How do candidate contact credits work?', a: 'One credit is deducted when you unlock a candidate\'s email or phone number. Viewing their profile does not consume credits.' },
      { q: 'Can I download resumes in bulk?', a: 'Yes, select multiple candidates using the checkboxes and click "Download Resumes". Bulk downloads are subject to your plan limits.' },
    ]
  },
  {
    id: 'jobs',
    title: 'Job Posting',
    faqs: [
      { q: 'How do I post a new job?', a: 'Click the "Post a Job" button on your dashboard. Fill in the title, description, requirements, and click Publish.' },
      { q: 'What is the difference between Hot Vacancy and Standard Job?', a: 'Hot Vacancies receive premium placement and visibility in search results for faster hiring compared to Standard Jobs.' },
      { q: 'How long does a job posting stay active?', a: 'Standard jobs usually remain active for 30 days unless closed manually. Hot Vacancies can have custom durations.' },
      { q: 'Can I edit a job after it has been published?', a: 'Yes, go to Manage Jobs, click the three dots next to the active job, and select Edit.' },
      { q: 'How do I close a job if I have hired a candidate?', a: 'In the Manage Jobs section, select the job and change its status to "Closed". This stops new applications from coming in.' },
    ]
  },
  {
    id: 'webinars',
    title: 'Webinars & Certifications',
    faqs: [
      { q: 'How do I register for a live webinar?', a: 'Click "Book a Seat" on any upcoming webinar card. You will receive a calendar invite and reminder email with the joining link.' },
      { q: 'Can I access recorded sessions after the live webinar?', a: 'Yes, all webinar recordings are available in your Learning Center dashboard within 24 hours of the live session.' },
      { q: 'What is the Maven Maestro Recruiter Certification?', a: 'A structured training programme with modules and assessments. Complete it to earn an industry-recognised digital certificate.' },
      { q: 'How long does the certification programme take?', a: 'Most recruiters complete it in 4-6 hours spread across a week. It is entirely self-paced and on-demand.' },
      { q: 'Do I get a badge for completing the certification?', a: 'Yes! You will receive a digital badge that you can add to your LinkedIn profile and email signature to showcase your skills.' },
    ]
  }
];


/* ─── CUSTOM HEADER ────────────────────────────────── */
function LcHeader({ activeSection, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`lc-header ${scrolled ? 'lc-header--scrolled' : ''}`}>
      <div className="lc-header-inner">
        <div className="lc-header-brand">
          <img src={mavenLogo} alt="MavenJobs" className="lc-header-logo" />
          <span className="lc-header-title">Learning Center</span>
        </div>
        <nav className="lc-header-nav">
          <button
            className={`lc-header-nav-btn ${activeSection === 'cert' ? 'active' : ''}`}
            onClick={() => onNav('cert')}
          >
            Certification Programme
            <span className="lc-header-free-pill">Free</span>
          </button>
          <button
            className={`lc-header-nav-btn ${activeSection === 'webinars' ? 'active' : ''}`}
            onClick={() => onNav('webinars')}
          >
            Webinars
          </button>
          <button
            className={`lc-header-nav-btn ${activeSection === 'guides' ? 'active' : ''}`}
            onClick={() => onNav('guides')}
          >
            Guides 
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────── */
export default function LearningCenter() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [webinarIdx, setWebinarIdx] = useState(0);
  const [guideIdx, setGuideIdx] = useState(0);
  const [expertIdx, setExpertIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeFaqTab, setActiveFaqTab] = useState(FAQ_CATEGORIES[0].id);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Drag to scroll for experts
  const expertsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - expertsRef.current.offsetLeft);
    setScrollLeft(expertsRef.current.scrollLeft);
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - expertsRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    expertsRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    if (!expertsRef.current || isDragging || isHovered) return;
    let animationFrameId;

    const scroll = () => {
      if (expertsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = expertsRef.current;
        // If reached the end, reset to beginning
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          expertsRef.current.scrollLeft = 0;
        } else {
          // Increment by a small amount for smooth continuous scroll
          expertsRef.current.scrollLeft += 1;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging, isHovered]);

  const isLoggedIn = !!localStorage.getItem('employerUser');

  // Section refs for scrolling
  const certRef = { cert: null, webinars: null, guides: null };
  const sectionRefs = {
    cert: null,
    webinars: null,
    guides: null,
  };

  useEffect(() => {
    const currentWord = ROTATING_WORDS[wordIdx];
    let timeout;
    
    if (isDeleting) {
      setTypingSpeed(40);
      timeout = setTimeout(() => {
        setTypedText(currentWord.substring(0, typedText.length - 1));
      }, typingSpeed);
    } else {
      setTypingSpeed(80);
      timeout = setTimeout(() => {
        setTypedText(currentWord.substring(0, typedText.length + 1));
      }, typingSpeed);
    }

    if (!isDeleting && typedText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), 1500); // Wait before backspacing
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
      timeout = setTimeout(() => {}, 500); // Wait before typing next word
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, wordIdx, typingSpeed]);

  useEffect(() => {
    const timeout = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(`lc-section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const prod = PRODUCTS[activeProduct];

  return (
    <div className="lc-page">
      <LcHeader activeSection={activeSection} onNav={scrollToSection} />

      {/* ── HERO ── */}
      <section className={`lc-hero ${heroVisible ? 'lc-hero--visible' : ''}`}>
        <div className="lc-hero-main-title-wrap">
          <h1 className="lc-hero-main-title">
            Get more out of MavenJobs products with{' '}
            <span className="lc-rotating-word">
              {typedText}<span className="lc-cursor">|</span>
            </span>
          </h1>
        </div>
        <div className="lc-hero-container">
          <div className="lc-tabs-wrapper">
            <div className="lc-tabs">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.id}
                  className={`lc-tab ${i === activeProduct ? 'active' : ''}`}
                  onClick={() => setActiveProduct(i)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lc-product-panel" key={prod.id}>
            <div className="lc-product-text">
              <h1 className="lc-product-title-large">{prod.title}</h1>
              <p className="lc-product-desc-large">{prod.desc}</p>
              <div className="lc-product-ctas">
                {prod.tags.includes('Read Guide') && (
                  <button className="lc-btn-outline-blue">
                    <FiBook size={15} /> Read guide
                  </button>
                )}
                {prod.tags.includes('Live Webinar') && (
                  <button className="lc-btn-outline-blue">
                    <FiVideo size={15} /> Webinar
                  </button>
                )}
              </div>
            </div>
            <div className="lc-product-graphic">
              {prod.img ? (
                <img src={prod.img} alt={prod.title} className="lc-product-hero-img" />
              ) : (
                <div className="lc-product-visual-box" style={{ background: `${prod.color}12`, borderColor: `${prod.color}30` }}>
                  <div className="lc-pv-icon" style={{ color: prod.color, fontSize: 40 }}>
                    {prod.id === 'resdex' && <FiSearch />}
                    {prod.id === 'ai' && <FiZap />}
                    {prod.id === 'jobs' && <FiBriefcase />}
                    {prod.id === 'analytics' && <FiTrendingUp />}
                    {prod.id === 'branding' && <FiShield />}
                  </div>
                  <div className="lc-pv-title">{prod.title}</div>
                  <div className="lc-pv-pulse" style={{ background: prod.color }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CERTIFICATION ── */}
      <section id="lc-section-cert" className="lc-section lc-cert-section">
        <div className="lc-cert-card">
          <div className="lc-cert-visual">
            <div className="lc-cert-badge-wrap">
              <div className="lc-cert-badge">
                <FiAward size={48} color="#fff" />
                <div className="lc-cert-shine" />
              </div>
              <div className="lc-cert-label-top">MAVEN MAESTRO</div>
              <div className="lc-cert-label-bot">RECRUITER CERTIFIED</div>
            </div>
            <div className="lc-play-btn"><FiPlay size={20} color="#002366" /></div>
          </div>
          <div className="lc-cert-content">
            <div className="lc-free-badge">FREE</div>
            <h2 className="lc-cert-title">Maven Maestro Recruiter<br />Certification Programme</h2>
            <ul className="lc-cert-bullets">
              <li><FiCheckCircle size={16} color="#10b981" /> Earn an industry-recognised digital certificate</li>
              <li><FiCheckCircle size={16} color="#10b981" /> Master proven sourcing, screening and ATS techniques</li>
              <li><FiCheckCircle size={16} color="#10b981" /> Access expert-level training, completely free</li>
              <li><FiCheckCircle size={16} color="#10b981" /> Go at your own pace with on-demand modules</li>
            </ul>
            <button className="lc-btn-primary lc-btn-cert">Explore Programme <FiArrowRight size={15} /></button>
          </div>
        </div>
      </section>

      {/* ── WEBINARS ── */}
      <section id="lc-section-webinars" className="lc-section lc-webinar-section">
        <div className="lc-split-layout">
          <div className="lc-split-left">
            <div className="lc-section-eyebrow"><FiVideo size={14} /> Live Webinars</div>
            <h2 className="lc-section-title">Product webinars<br />with experts</h2>
            <ul className="lc-feature-list">
              <li><FiCheckCircle size={14} color="#10b981" /> Free live sessions, every weekday</li>
              <li><FiCheckCircle size={14} color="#10b981" /> Ask questions directly to product experts</li>
              <li><FiCheckCircle size={14} color="#10b981" /> Walk away with tips you can use right away</li>
            </ul>
            
          </div>
          <div className="lc-split-right">
            <div className="lc-carousel-header">
              <span className="lc-carousel-label">Upcoming sessions</span>
              <div className="lc-carousel-nav">
                <button className="lc-nav-btn" onClick={() => setWebinarIdx(i => Math.max(0, i - 1))} disabled={webinarIdx === 0}><FiChevronLeft /></button>
                <button className="lc-nav-btn" onClick={() => setWebinarIdx(i => Math.min(WEBINARS.length - 2, i + 1))} disabled={webinarIdx >= WEBINARS.length - 2}><FiChevronRight /></button>
              </div>
            </div>
            <div className="lc-carousel">
              {WEBINARS.slice(webinarIdx, webinarIdx + 2).map(w => (
                <div key={w.id} className="lc-webinar-card">
                  <div className="lc-wc-product-tag">{w.product}</div>
                  <h4 className="lc-wc-title">{w.title}</h4>
                  <p className="lc-wc-desc">{w.desc}</p>
                  <div className="lc-wc-meta">
                    <span><FiCalendar size={12} /> {w.schedule}</span>
                    <span><FiClock size={12} /> {w.duration}</span>
                    <span><FiUsers size={12} /> {w.seats} seats left</span>
                  </div>
                  <button className="lc-btn-book">Book a seat <FiArrowRight size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lc-experts-wrap">
          <div className="lc-experts-header-alt">
            <h3 className="lc-experts-title-alt">Meet our product experts</h3>
            <div className="lc-experts-line"></div>
          </div>
          <div 
            className={`lc-experts-row ${isDragging ? 'dragging' : ''}`}
            ref={expertsRef}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {EXPERTS.map((e, index) => (
              <div key={`${e.name}-${index}`} className="lc-expert-card">
                <div className="lc-expert-content">
                  <div className="lc-expert-name">
                    {e.name.split(' ').map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                </div>
                {e.img ? (
                  <img src={e.img} alt={e.name} className="lc-expert-avatar-img" draggable="false" />
                ) : (
                  <div className="lc-expert-avatar" style={{ background: e.color }}>{e.initials}</div>
                )}
                <div className="lc-expert-stats-pill">
                  <span className="lc-stat-blue">{e.sessions}</span> <span className="lc-stat-gray">sessions</span>
                  <span className="lc-stat-blue" style={{marginLeft: '12px'}}>{e.trained}</span> <span className="lc-stat-gray">recruiters trained</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUIDES ── */}
      <section id="lc-section-guides" className="lc-section lc-guides-section">
        <div className="lc-guides-header-row">
          <div>
            <div className="lc-section-eyebrow"><FiBook size={14} /> Product Guides</div>
            <h2 className="lc-section-title">Step-by-step guides<br />for every product</h2>
          </div>
          <div className="lc-carousel-nav">
            <button className="lc-nav-btn" onClick={() => setGuideIdx(i => Math.max(0, i - 1))} disabled={guideIdx === 0}><FiChevronLeft /></button>
            <button className="lc-nav-btn" onClick={() => setGuideIdx(i => Math.min(GUIDES.length - 3, i + 1))} disabled={guideIdx >= GUIDES.length - 3}><FiChevronRight /></button>
          </div>
        </div>
        <div className="lc-guides-grid">
          {GUIDES.slice(guideIdx, guideIdx + 3).map(g => (
            <div key={g.id} className="lc-guide-card-premium" style={{ '--guide-color': g.color }}>
              <img src={g.img} alt={g.title} className="lc-guide-bg-img" />
              <div className="lc-guide-overlay" style={{ background: `linear-gradient(to top, ${g.color} 0%, ${g.color}e6 30%, transparent 100%)` }} />
              
              <div className="lc-guide-content">
                <div className="lc-guide-badge" style={{ color: g.color }}>{g.badge}</div>
                <div className="lc-guide-bottom">
                  <div className="lc-guide-product">{g.product}</div>
                  <h4 className="lc-guide-title">{g.title}</h4>
                  <div className="lc-guide-meta"><FiClock size={12} /> {g.readTime}</div>
                  <button className="lc-guide-cta">Read guide <FiArrowRight size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ── FAQ ── */}
      <section className="lc-section lc-faq-section">
        <div className="lc-faq-inner">
          <div className="lc-section-eyebrow"><FiStar size={14} /> FAQs</div>
          <h2 className="lc-section-title">Frequently asked questions</h2>
          
          <div className="lc-faq-container">
            <div className="lc-faq-sidebar">
              {FAQ_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  className={`lc-faq-sidebar-btn ${activeFaqTab === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFaqTab(cat.id);
                    setOpenFaq(null);
                  }}
                >
                  {cat.title}
                  <FiChevronRight className="lc-faq-sidebar-arrow" size={16} />
                </button>
              ))}
            </div>
            
            <div className="lc-faq-content" key={activeFaqTab}>
              <div className="lc-faq-list">
                {FAQ_CATEGORIES.find(c => c.id === activeFaqTab)?.faqs.map((faq, i) => (
                  <div key={i} className={`lc-faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button className="lc-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{faq.q}</span>
                      <FiChevronDown className="lc-faq-icon" size={18} />
                    </button>
                    <div className="lc-faq-a">{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
              </div>
            </div>
          </section>

          <EmployerFooter />
    </div>
  );
}
