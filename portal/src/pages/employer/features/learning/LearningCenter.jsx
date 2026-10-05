import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployerFooter from '../../../../layout/employer/LandingEmployeeFooter';
import mavenVideo from '../../../../../assets/Maven.mp4';
import {
  FiBook, FiVideo, FiAward, FiUsers, FiChevronRight,
  FiChevronLeft, FiPlay, FiCalendar, FiClock, FiStar,
  FiCheckCircle, FiArrowRight, FiZap, FiBriefcase,
  FiSearch, FiTrendingUp, FiShield, FiChevronDown
} from 'react-icons/fi';
import './LearningCenter.css';
import LcHeader from './LcHeader';
import {
  ROTATING_WORDS,
  PRODUCTS,
  WEBINARS,
  EXPERTS,
  GUIDES,
  COMPANY_LOGOS,
  FAQ_CATEGORIES
} from './learningCenterData';

/* ─── MAIN COMPONENT ───────────────────────────────── */
export default function LearningCenter() {
  const navigate = useNavigate();
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
  const [faqDropdownOpen, setFaqDropdownOpen] = useState(false);
  const faqDropdownRef = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (faqDropdownRef.current && !faqDropdownRef.current.contains(event.target)) {
        setFaqDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
            <span className="lc-hero-title-static">Get more out of MavenJobs products with</span>{' '}
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
                  prod.guidePath ? (
                    <Link
                      to={prod.guidePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lc-btn-outline-blue"
                      style={{ textDecoration: 'none' }}
                    >
                      <FiBook size={15} /> Read guide
                    </Link>
                  ) : (
                    <button
                      className="lc-btn-outline-blue"
                      onClick={() => scrollToSection('guides')}
                    >
                      <FiBook size={15} /> Read guide
                    </button>
                  )
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
          <div className="lc-cert-visual" style={{ cursor: 'pointer', padding: 0, position: 'relative', overflow: 'hidden', borderRadius: 16 }} onClick={() => setShowVideoModal(true)}>
            <video 
              src={mavenVideo} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,35,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="lc-play-btn" style={{ position: 'relative', margin: 0, transform: 'none', top: 'auto', left: 'auto' }}>
                <FiPlay size={20} color="#002366" style={{ marginLeft: 3 }} />
              </div>
            </div>
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
            <h2 className="lc-section-title">Product webinars with experts</h2>
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
            <h2 className="lc-section-title">Step-by-step guides for every product</h2>
          </div>
          {/* <div className="lc-carousel-nav">
            <button className="lc-nav-btn" onClick={() => setGuideIdx(i => Math.max(0, i - 1))} disabled={guideIdx === 0}><FiChevronLeft /></button>
            <button className="lc-nav-btn" onClick={() => setGuideIdx(i => Math.min(GUIDES.length - 3, i + 1))} disabled={guideIdx >= GUIDES.length - 3}><FiChevronRight /></button>
          </div> */}
        </div>
        <div className="lc-guides-grid">
          {GUIDES.slice(guideIdx, guideIdx + 3).map(g => (
            <div
              key={g.id}
              className="lc-guide-card-premium"
              style={{ '--guide-color': g.color, cursor: g.path ? 'pointer' : 'default' }}
              onClick={() => g.path && window.open(g.path, '_blank', 'noopener,noreferrer')}
            >
              <img src={g.img} alt={g.title} className="lc-guide-bg-img" />
              <div className="lc-guide-overlay" style={{ background: `linear-gradient(to top, ${g.color} 0%, ${g.color}e6 30%, transparent 100%)` }} />
              
              <div className="lc-guide-content">
                <div></div>
                <div className="lc-guide-bottom">
                  <div className="lc-guide-product">{g.product}</div>
                  <h4 className="lc-guide-title">{g.title}</h4>
                  <div className="lc-guide-meta"><FiClock size={12} /> {g.readTime}</div>
                  {g.path ? (
                    <Link
                      to={g.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lc-guide-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read guide <FiArrowRight size={13} />
                    </Link>
                  ) : (
                    <button
                      className="lc-guide-cta"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Read guide <FiArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECRUITERS FROM THESE COMPANIES LEARN HERE ── */}
      <section className="lc-logos-section">
        <div className="lc-logos-header">
          <div className="lc-section-eyebrow">
            <FiUsers size={14} /> Enterprise Network
          </div>
          <h2 className="lc-logos-title">Recruiters from these companies learn here</h2>
          <p className="lc-logos-sub">
            Over 45,000+ recruiters and talent leaders from India's foremost technology enterprises, global capability centers, and fast-growing organizations upscale their hiring skills with MavenJobs.
          </p>
        </div>

        <div className="lc-logos-ticker-wrap">
          <div className="lc-logos-ticker">
            {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((company, idx) => (
              <div key={`${company.name}-${idx}`} className="lc-logo-card">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="lc-logo-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="lc-logo-fallback" style={{ display: 'none' }}>
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lc-section lc-faq-section">
        <div className="lc-faq-inner">
          <div className="lc-section-eyebrow"><FiStar size={14} /> FAQs</div>
          <h2 className="lc-section-title">Frequently asked questions</h2>
          
          <div className="lc-faq-container">
            {/* Desktop Sidebar (visible on desktop) */}
            <div className="lc-faq-sidebar">
              {FAQ_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  type="button"
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

            {/* Mobile / Tablet Dropdown Category Selector */}
            <div className="lc-faq-mobile-dropdown-wrap" ref={faqDropdownRef}>
              <div 
                className={`lc-faq-dropdown-trigger ${faqDropdownOpen ? 'active' : ''}`}
                onClick={() => setFaqDropdownOpen(prev => !prev)}
                role="button"
                tabIndex={0}
              >
                <div className="lc-faq-dropdown-value">
                  <span className="lc-faq-dropdown-label">Category:</span>
                  <span className="lc-faq-dropdown-selected">
                    {FAQ_CATEGORIES.find(c => c.id === activeFaqTab)?.title}
                  </span>
                </div>
                <FiChevronDown className={`lc-faq-dropdown-arrow ${faqDropdownOpen ? 'rotate' : ''}`} size={18} />
              </div>

              {faqDropdownOpen && (
                <div className="lc-faq-dropdown-menu">
                  {FAQ_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`lc-faq-dropdown-item ${activeFaqTab === cat.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFaqTab(cat.id);
                        setOpenFaq(null);
                        setFaqDropdownOpen(false);
                      }}
                    >
                      <span>{cat.title}</span>
                      {activeFaqTab === cat.id && (
                        <FiCheckCircle size={16} color="#002366" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="lc-faq-content" key={activeFaqTab}>
              <div className="lc-faq-list">
                {FAQ_CATEGORIES.find(c => c.id === activeFaqTab)?.faqs.map((faq, i) => (
                  <div key={i} className={`lc-faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button 
                      type="button"
                      className="lc-faq-q" 
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
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

          {showVideoModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 16, boxSizing: 'border-box' }}>
              <div style={{ position: 'absolute', inset: 0 }} onClick={() => setShowVideoModal(false)} />
              <div style={{ position: 'relative', width: '90%', maxWidth: 800, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <button 
                  onClick={() => setShowVideoModal(false)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
                <video 
                  src={mavenVideo} 
                  autoPlay 
                  controls 
                  style={{ width: '100%', display: 'block' }} 
                />
              </div>
            </div>
          )}
    </div>
  );
}
