import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiArrowRight, FiZap, FiPlay, FiCheck, FiChevronRight,
    FiUsers, FiTarget, FiBarChart2, FiTrendingUp,
    FiCheckCircle, FiMail, FiPhone, FiStar, FiShield, FiCpu
} from 'react-icons/fi';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import EmployerFooter from '../../../../components/EmployerFooter';
import LandingEmployeeHeader from '../../../../components/employer/LandingEmployeeHeader';

/* ─────────────────────────────── DATA ─────────────────────────────── */
const NAV_TABS = [
    'Talent Sourcing', 'Talent Planning', 'Screening & Evaluation',
    'Employer Branding', 'Hiring Automation', 'Assisted Hiring'
];

const SOLUTIONS = {
    'Talent Sourcing': [
        { tag: 'Talent Sourcing', name: 'Naukri Resdex', sub: "India's largest resume database", desc: 'Access 10Cr+ verified profiles with AI-powered matching and advanced Boolean search across every domain.', color: '#002366', bg: '#EEF2FF' },
        { tag: 'Talent Sourcing', name: 'AI Recommendations', sub: 'Smart candidate discovery', desc: 'Get AI-curated shortlists ranked by fit score — reducing sourcing time by 70% with zero manual filtering.', color: '#10b981', bg: '#ecfdf5' },
        { tag: 'Talent Sourcing', name: 'Talent Pulse', sub: 'Real-time market intelligence', desc: 'Analyze talent supply & demand, benchmark salaries, and track competitor hiring movements in real time.', color: '#6366f1', bg: '#f5f3ff' },
    ],
    'Talent Planning': [
        { tag: 'Talent Planning', name: 'Workforce Insights', sub: 'Plan before you hire', desc: 'Understand talent availability by role, location, and seniority before creating a single JD.', color: '#002366', bg: '#EEF2FF' },
        { tag: 'Talent Planning', name: 'Salary Benchmarking', sub: 'Compete on compensation', desc: 'Real-time CTC data across 500+ roles, industries, and geographies — offer the right number every time.', color: '#f59e0b', bg: '#fffbeb' },
    ],
    'Screening & Evaluation': [
        { tag: 'Screening & Evaluation', name: 'DoSelect Assessments', sub: 'Skills-first screening', desc: 'Run AI-proctored coding tests, psychometric assessments, and custom skill evaluations at scale.', color: '#6366f1', bg: '#f5f3ff' },
        { tag: 'Screening & Evaluation', name: 'Video Screening', sub: 'One-way AI video', desc: 'Async video interviews with AI transcription and sentiment analysis — screen 10× faster.', color: '#10b981', bg: '#ecfdf5' },
        { tag: 'Screening & Evaluation', name: 'NChecked Profiles', sub: 'Verified talent only', desc: '14+ critical details cross-verified by our team — CTC, notice period, skills — before you engage.', color: '#002366', bg: '#EEF2FF' },
    ],
    'Employer Branding': [
        { tag: 'Employer Branding', name: 'Employer Branding Edge', sub: 'Build your brand story', desc: 'Showcase your culture with rich media, employee videos, and customized career pages to millions of jobseekers.', color: '#f59e0b', bg: '#fffbeb' },
        { tag: 'Employer Branding', name: 'Diversity Solutions', sub: 'Inclusive hiring', desc: 'Promote inclusive work culture and reach underrepresented talent pools to meet your diversity goals.', color: '#10b981', bg: '#ecfdf5' },
        { tag: 'Employer Branding', name: 'AmbitionBox', sub: 'Company reviews decoded', desc: "Build credibility on India's No.1 platform for company reviews, salary insights, and interview experiences.", color: '#6366f1', bg: '#f5f3ff' },
    ],
    'Hiring Automation': [
        { tag: 'Hiring Automation', name: 'Zwayam ATS', sub: 'End-to-end automation', desc: 'Decode recruitment automation with an intelligent hiring suite — from JD to offer letter in one workflow.', color: '#002366', bg: '#EEF2FF' },
        { tag: 'Hiring Automation', name: 'AI Interview Scheduler', sub: 'Zero-touch scheduling', desc: 'Automated interview coordination across candidates, panels, and calendars — no manual follow-up needed.', color: '#10b981', bg: '#ecfdf5' },
    ],
    'Assisted Hiring': [
        { tag: 'Assisted Hiring', name: 'Expert Assist', sub: 'Leave sourcing to us', desc: 'Our 200+ domain experts handle sourcing, shortlisting & scheduling — you only interview the best.', color: '#6366f1', bg: '#f5f3ff' },
        { tag: 'Assisted Hiring', name: 'PremiumX', sub: "India's top 1% talent", desc: 'AI-powered discovery for senior roles above ₹30L CTC with NChecked verification and multi-channel outreach.', color: '#002366', bg: '#EEF2FF' },
    ],
};

const PLATFORMS = [
    { name: 'Naukri', sub: 'Talent decoded', desc: "Decode India's largest talent pool with the power of AI", color: '#002366', bg: '#EEF2FF', icon: <FiCpu size={22} /> },
    { name: 'iimjobs', sub: 'Premium management talent', desc: "Decode the complexities of hiring India's premium management talent", color: '#10b981', bg: '#ecfdf5', icon: <FiTarget size={22} /> },
    { name: 'hirist.tech', sub: 'Premium tech talent', desc: 'Decode modern tech hiring challenges with precision', color: '#f97316', bg: '#fff7ed', icon: <FiZap size={22} /> },
    { name: 'Naukri Campus', sub: 'Campus hiring decoded', desc: 'Plan, brand and hire from campuses across India', color: '#6366f1', bg: '#f5f3ff', icon: <FiUsers size={22} /> },
    { name: 'AmbitionBox', sub: 'Company reviews decoded', desc: "Build your employer brand on India's No.1 reviews platform", color: '#0ea5e9', bg: '#f0f9ff', icon: <FiShield size={22} /> },
    { name: 'DoSelect', sub: 'Talent evaluation decoded', desc: 'Make smarter people decisions using skill data and AI assessments', color: '#059669', bg: '#ecfdf5', icon: <FiCheckCircle size={22} /> },
    { name: 'Employer Branding Edge', sub: 'Employer branding decoded', desc: 'Showcase your employer brand story to millions of job seekers', color: '#d97706', bg: '#fffbeb', icon: <FiStar size={22} /> },
    { name: 'Expert Assist', sub: 'Assisted hiring decoded', desc: 'Leave sourcing, shortlisting and scheduling to our hiring experts', color: '#7c3aed', bg: '#f5f3ff', icon: <FiUsers size={22} /> },
    { name: 'Zwayam', sub: 'Hiring automation decoded', desc: 'Decode recruitment automation with an intelligent hiring suite', color: '#0284c7', bg: '#f0f9ff', icon: <FiZap size={22} /> },
];

const AI_STATS = [
    { val: '50Cr+', label: 'Profile views per year', icon: <FiUsers size={22} /> },
    { val: '10Cr+', label: 'Applies processed', icon: <FiTarget size={22} /> },
    { val: '50L+', label: 'Profile updates tracked', icon: <FiTrendingUp size={22} /> },
    { val: '700Cr+', label: 'Annual actions trained on', icon: <FiBarChart2 size={22} /> },
];

const CLIENTS = [
    'Adobe', 'Goldman Sachs', 'EY', 'PwC', 'Adani', 'Zomato',
    'Royal Enfield', 'Tata Motors', 'Deloitte', 'HDFC', 'Infosys',
    'Wipro', 'Microsoft', 'Amazon'
];

/* ─────────────────────────── STICKY PLATFORMS ─────────────────────── */
function StickyPlatformsSection() {
    return (
        <section style={{ background: 'transparent', padding: '96px 0', position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,35,102,.12) 0%,transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 5 }}>
                {/* Section header */}
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        fontSize: 10.5, fontWeight: 800, letterSpacing: '.22em',
                        textTransform: 'uppercase', color: '#10b981', marginBottom: 14,
                        fontFamily: "'Bricolage Grotesque',sans-serif"
                    }}>
                        <FiStar size={10} fill="currentColor" /> One-Stop Solution
                    </div>
                    <h2 style={{
                        fontFamily: "'Bricolage Grotesque',sans-serif",
                        fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 800,
                        color: '#fff', letterSpacing: '-0.03em', marginBottom: 14
                    }}>Experience the one-stop solution</h2>
                    <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', maxWidth: 520, margin: '18px auto 0', lineHeight: 1.75 }}>
                        Nine fully integrated platforms. One login. One unified talent intelligence layer.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 60, alignItems: 'flex-start' }}>
                    {/* LEFT — sticky panel column */}
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                position: 'sticky',
                                top: 140, // Header (70) + Tabs (~50) + 20 gap
                                zIndex: 1000,
                            }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg,#050e24 0%,#002366 55%,#003db5 100%)',
                                borderRadius: 26, padding: '44px 36px',
                                position: 'relative', overflow: 'hidden',
                                boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
                            }}>
                                {/* Dot grid */}
                                <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
                                {/* Glows */}
                                <div style={{ position: 'absolute', bottom: '-30%', right: '-20%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.22) 0%,transparent 65%)', pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.14) 0%,transparent 65%)', pointerEvents: 'none' }} />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
                                        textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 20,
                                        fontFamily: "'Bricolage Grotesque',sans-serif",
                                        background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
                                        padding: '5px 12px', borderRadius: 100
                                    }}>
                                        ✦ Unified Platform
                                    </div>

                                    <h3 style={{
                                        fontFamily: "'Bricolage Grotesque',sans-serif",
                                        fontSize: 24, fontWeight: 800, color: '#fff',
                                        letterSpacing: '-0.03em', lineHeight: 1.18, marginBottom: 22
                                    }}>
                                        The complete<br /><span style={{ color: '#10b981' }}>talent ecosystem</span>
                                    </h3>

                                    {[
                                        'Single sign-on across all platforms',
                                        'Smart AI recommendations',
                                        'Unified analytics dashboard',
                                        'Seamless ATS integrations',
                                    ].map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                background: 'rgba(16,185,129,.18)', border: '1px solid rgba(16,185,129,.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <FiCheck size={11} color="#10b981" strokeWidth={3} />
                                            </div>
                                            <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,.72)', fontWeight: 500 }}>{p}</span>
                                        </div>
                                    ))}

                                    <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '24px 0' }} />

                                    {/* Mini stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                                        {[
                                            { v: '9', l: 'Platforms' },
                                            { v: '100%', l: 'Integrated' },
                                            { v: '10Cr+', l: 'Candidates' },
                                            { v: '30K+', l: 'Employers' },
                                        ].map((s, i) => (
                                            <div key={i} style={{
                                                textAlign: 'center', padding: '12px 8px',
                                                background: 'rgba(255,255,255,.06)',
                                                border: '1px solid rgba(255,255,255,.08)', borderRadius: 12
                                            }}>
                                                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                                                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.38)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.l}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        style={{
                                            width: '100%', padding: '13px', background: '#10b981', color: '#fff',
                                            border: 'none', borderRadius: 14,
                                            fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13.5, fontWeight: 800,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                            transition: 'all .2s', boxShadow: '0 6px 20px rgba(16,185,129,.35)'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#0da371'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(16,185,129,.45)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,.35)'; }}
                                    >
                                        Request Demo <FiArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — platform cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {PLATFORMS.map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.07)',
                                    borderRadius: 20, padding: '26px 24px',
                                    cursor: 'pointer', transition: 'all .25s',
                                    position: 'relative', overflow: 'hidden'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.4)';
                                    e.currentTarget.style.borderColor = `${p.color}80`;
                                    e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,.03)';
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 13,
                                    background: 'rgba(255,255,255,.05)', border: `1px solid ${p.color}44`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: p.color, marginBottom: 16
                                }}>
                                    {p.icon}
                                </div>
                                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 15.5, fontWeight: 800, color: '#fff', marginBottom: 5 }}>{p.name}</div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 8px',
                                    borderRadius: 5, background: 'rgba(255,255,255,.06)', color: p.color,
                                    fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '.06em', marginBottom: 12, border: `1px solid ${p.color}44`
                                }}>{p.sub}</div>
                                <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 12 }} />
                                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.65, marginBottom: 14 }}>{p.desc}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: p.color, transition: 'gap .2s' }}>
                                    Explore <FiArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────── MAIN ─────────────────────────────── */
export default function Branding() {
    const [activeTab, setActiveTab] = useState('Talent Sourcing');
    const [scrolled, setScrolled] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', company: '', consultancy: '' });
    const [playing, setPlaying] = useState(false);
    const tabsRef = useRef(null);
    const heroRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const currentSolutions = SOLUTIONS[activeTab] || [];

    return (
        <div style={{ background: '#0a0a0f', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#1e293b', overflowX: 'hidden' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --navy:#002366;--navy-d:#001540;
          --green:#10b981;--gd:#0da371;
          --fd:'Bricolage Grotesque',sans-serif;
        }
        html{scroll-behavior:smooth}
        ::selection{background:#bfdbfe}

        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

        /* ── TAB BUTTONS ── */
        .tab-btn{
          padding:9px 18px; border-radius:100px;
          font-size:13px; font-weight:700;
          border:1.5px solid transparent;
          cursor:pointer; transition:all .22s;
          white-space:nowrap;
          font-family:var(--fd);
          letter-spacing:.01em;
        }
        .tab-btn.active{
          background:#fff; color:#002366;
          border-color:rgba(0,35,102,.18);
          box-shadow:0 4px 18px rgba(0,35,102,.1);
        }
        .tab-btn:not(.active){
          background:transparent; color:#64748b;
        }
        .tab-btn:not(.active):hover{
          background:#f8fafc; color:#002366;
        }

        /* ── SOLUTION CARDS ── */
        .sol-card{
          background:#fff; border:1.5px solid #e2e8f0;
          border-radius:22px; padding:30px;
          transition:all .28s; cursor:pointer;
          position:relative; overflow:hidden;
        }
        .sol-card::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,transparent 70%,rgba(0,35,102,.02));
          pointer-events:none;
        }
        .sol-card:hover{
          transform:translateY(-6px);
          box-shadow:0 22px 48px rgba(0,35,102,.1);
          border-color:rgba(0,35,102,.18);
        }

        /* ── CTA BUTTONS ── */
        .cta-btn{
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 30px; background:var(--green); color:#fff;
          font-weight:800; font-size:14px; border-radius:100px;
          border:none; cursor:pointer; font-family:var(--fd);
          text-decoration:none;
          box-shadow:0 8px 24px rgba(16,185,129,.35);
          transition:all .25s; letter-spacing:.01em;
        }
        .cta-btn:hover{
          background:var(--gd); transform:translateY(-2px);
          box-shadow:0 14px 36px rgba(16,185,129,.48);
        }
        .cta-btn-ghost{
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 28px; background:rgba(255,255,255,.08); color:#fff;
          font-weight:800; font-size:14px; border-radius:100px;
          border:1.5px solid rgba(255,255,255,.22);
          cursor:pointer; font-family:var(--fd);
          text-decoration:none; backdrop-filter:blur(10px);
          transition:all .25s;
        }
        .cta-btn-ghost:hover{background:rgba(255,255,255,.16);}

        /* ── FORM FIELDS ── */
        .sf-field{
          width:100%; padding:12px 16px;
          background:#f8fafc; border:1.5px solid #e2e8f0;
          border-radius:12px; outline:none;
          font-size:14px; font-weight:500; color:#0f172a;
          font-family:'DM Sans',sans-serif;
          transition:border-color .2s, box-shadow .2s;
        }
        .sf-field:focus{
          border-color:rgba(0,35,102,.35);
          box-shadow:0 0 0 3px rgba(0,35,102,.07);
          background:#fff;
        }
        .sf-field::placeholder{color:#94a3b8;}

        /* ── STAT NUMS ── */
        .stat-num{
          font-family:var(--fd);
          font-size:clamp(40px,4.5vw,58px);
          font-weight:800; color:#fff;
          letter-spacing:-0.04em; line-height:1;
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:8px}

        /* ── HERO ANIM DELAYS ── */
        .hero-badge{animation:fadeUp .6s ease .1s both}
        .hero-h1{animation:fadeUp .65s ease .2s both}
        .hero-p{animation:fadeUp .65s ease .32s both}
        .hero-btns{animation:fadeUp .65s ease .44s both}
        .hero-strip{animation:fadeUp .65s ease .56s both}

        /* ── SPLINE CONTAINER — badge hidden via clip ── */
        .spline-outer{
          position:relative;
          border-radius:24px;
          overflow:hidden;
          /* extra bottom padding consumed to hide the Spline badge */
        }
        .spline-clip{
          position:absolute;
          /* Clip away the Spline watermark at bottom-right */
          inset:0 0 0 0;
          overflow:hidden;
          border-radius:24px;
          pointer-events:none;
          z-index:2;
        }
        /* Badge killer: covers the bottom-right corner */
        .spline-badge-killer{
          position:absolute;
          bottom:0; right:0;
          width:160px; height:44px;
          background: linear-gradient(135deg,rgba(10,10,15,.0),rgba(10,10,15,.0));
          z-index:5;
          pointer-events:none;
        }
        /* Dim mask over badge area matching page bg */
        .spline-badge-mask{
          position:absolute;
          bottom:0; right:0;
          width:200px; height:52px;
          background:rgba(10,10,15,1);
          z-index:6;
          pointer-events:none;
          border-radius:0 0 22px 0;
        }

        @media(max-width:1024px){
          .hero-cols{flex-direction:column!important}
          .hero-spline{width:100%!important;height:400px!important}
          .hero-left{width:100%!important}
          .ai-grid{grid-template-columns:1fr!important}
          .demo-grid{grid-template-columns:1fr!important}
          .sticky-grid{grid-template-columns:1fr!important}
          .plat-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:640px){
          .plat-grid{grid-template-columns:1fr!important}
          .sol-grid{grid-template-columns:1fr!important}
        }
      `}</style>

            {/* ══════════════════════════ NAV ══════════════════════════ */}
            {/* <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
                height: 70, display: 'flex', alignItems: 'center', padding: '0 48px',
                background: scrolled ? 'rgba(8,8,14,0.97)' : 'transparent',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
                backdropFilter: scrolled ? 'blur(22px)' : 'none',
                transition: 'all .35s ease',
            }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={mavenLogo} alt="MavenJobs" style={{ height: 26, filter: 'invert(1) brightness(2)', display: 'block' }} />
                        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,.14)' }} />
                        <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,.75)', letterSpacing: '.04em' }}>talent cloud</span>
                    </Link>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
                        {['Hiring Needs', 'Solutions', 'Platforms', 'Insights'].map(l => (
                            <a key={l} href="#" style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', textDecoration: 'none', fontFamily: "'Bricolage Grotesque',sans-serif", transition: 'color .2s', letterSpacing: '.01em' }}
                                onMouseEnter={e => e.target.style.color = '#fff'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.55)'}>{l}</a>
                        ))}
                    </nav>

                    <a href="#demo" className="cta-btn" style={{ padding: '10px 22px', fontSize: 13, boxShadow: 'none' }}>Request Demo</a>
                </div>
            </header> */}

            <LandingEmployeeHeader />

            {/* ══════════════════════════ HERO ══════════════════════════ */}
            <section
                ref={heroRef}
                style={{
                    background: '#0a0a0f',
                    minHeight: '100vh',
                    display: 'flex', alignItems: 'center',
                    position: 'relative', overflow: 'hidden',
                    padding: '0 48px',
                }}
            >
                {/* Background Texture & Glows */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&q=55)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: .08 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,15,1) 0%, transparent 20%, transparent 80%, rgba(10,10,15,1) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,15,1) 0%, rgba(10,10,15,.8) 40%, transparent 100%)' }} />

                {/* Large Atmospheric Glows - matching the Spline aesthetic */}
                <div style={{ position: 'absolute', top: '10%', right: '0%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,35,102,.25) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '20%', left: '-5%', width: '30vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,35,102,.15) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, opacity: .035, backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2, paddingTop: 100, paddingBottom: 80 }}>
                    <div className="hero-cols" style={{ display: 'flex', alignItems: 'center', gap: 48 }}>

                        {/* ── LEFT: Content ── */}
                        <div className="hero-left" style={{ width: '50%', flexShrink: 0 }}>

                            {/* Badge */}
                            <div className="hero-badge" style={{ marginBottom: 30 }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '7px 16px',
                                    background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.28)',
                                    borderRadius: 100, color: 'rgba(16,185,129,.92)',
                                    fontSize: 11, fontWeight: 800, letterSpacing: '.12em',
                                    textTransform: 'uppercase', fontFamily: "'Bricolage Grotesque',sans-serif",
                                    backdropFilter: 'blur(8px)'
                                }}>
                                    <FiZap size={12} fill="currentColor" /> MavenJobs Talent Cloud
                                </div>
                            </div>

                            {/* Headline */}
                            <h1 className="hero-h1" style={{
                                fontFamily: "'Bricolage Grotesque',sans-serif",
                                fontSize: 'clamp(44px,4.8vw,70px)',
                                fontWeight: 800, color: '#fff',
                                lineHeight: 1.04, letterSpacing: '-0.04em',
                                marginBottom: 22
                            }}>
                                One-Stop Solution.<br />
                                <span style={{ color: '#10b981' }}>Talent Decoded.</span>
                            </h1>

                            {/* Sub */}
                            <p className="hero-p" style={{
                                fontSize: 17.5, color: 'rgba(255,255,255,.48)',
                                lineHeight: 1.75, marginBottom: 44, maxWidth: 480, fontWeight: 400
                            }}>
                                The complete suite for planning, sourcing, screening, branding, and automation — powered by AI to decode Indian talent at scale.
                            </p>

                            {/* CTAs */}
                            <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 60 }}>
                                <a href="#demo" className="cta-btn">Request a Demo <FiArrowRight size={15} /></a>
                                <a href="#video" className="cta-btn-ghost"><FiPlay size={14} /> Watch Video</a>
                            </div>

                            {/* Platform strip */}
                            <div className="hero-strip" style={{ paddingTop: 28, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.18)', marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                                    9 platforms · one login
                                </div>
                                <div style={{ display: 'flex', gap: 0, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                                    {[0, 1].map(k => (
                                        <div key={k} style={{ display: 'flex', gap: 36, alignItems: 'center', animation: 'marquee 26s linear infinite', flexShrink: 0, paddingRight: 36 }}>
                                            {['Naukri', 'iimjobs', 'hirist.tech', 'Zwayam', 'DoSelect', 'AmbitionBox', 'Expert Assist', 'Naukri Campus'].map((b, i) => (
                                                <span key={i} style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.22)', letterSpacing: '.05em', whiteSpace: 'nowrap', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{b}</span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Spline 3D — integrated seamlessly ── */}
                        <div className="hero-spline" style={{ width: '50%', height: 600, flexShrink: 0, position: 'relative' }}>
                            {/* Main container — borderless for integration */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'transparent',
                                zIndex: 1,
                                overflow: 'hidden',
                            }}>
                                {/*
          BADGE KILL STRATEGY:
          1. iframe shifted UP by 52px, height += 52px → badge scrolls off bottom
          2. A solid cover div sits at z-index:10 over exact badge position
          3. iframe has allowtransparency + bg:transparent for see-through canvas
        */}
                                <iframe
                                    src="https://my.spline.design/rememberallrobot-XIrNzIJQZCDc2rFRbGfjOStk/"
                                    frameBorder="0"
                                    allowTransparency={true}
                                    style={{
                                        position: 'absolute',
                                        top: '-52px',
                                        left: 0,
                                        width: '100%',
                                        height: 'calc(100% + 52px)',
                                        border: 'none',
                                        pointerEvents: 'auto',
                                        background: 'transparent',
                                    }}
                                    title="MavenJobs 3D"
                                />

                                {/* Corner fades */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom,rgba(10,10,15,.55),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top,rgba(10,10,15,.4),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 32, background: 'linear-gradient(to right,rgba(10,10,15,.3),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 32, background: 'linear-gradient(to left,rgba(10,10,15,.3),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                            </div>

                            {/* ── BADGE KILLER ── covers the Spline watermark */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 180,
                                height: 48,
                                background: '#0a0a0f',
                                zIndex: 20,
                                pointerEvents: 'none',
                            }} />

                            {/* Floating info badge — top-left */}
                            <div style={{
                                position: 'absolute', top: 18, left: 18, zIndex: 10,
                                background: 'rgba(10,10,15,0.72)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: 14, padding: '10px 16px',
                                display: 'flex', alignItems: 'center', gap: 9,
                                pointerEvents: 'none'
                            }}>
                            </div>

                            {/* Floating stat — bottom-left */}
                            <div style={{
                                position: 'absolute', bottom: 22, left: 18, zIndex: 10,
                                background: 'rgba(10,10,15,0.8)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: 16, padding: '14px 20px',
                                display: 'flex', alignItems: 'center', gap: 14,
                                animation: 'float 3.5s ease-in-out 0.5s infinite',
                                pointerEvents: 'none'
                            }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiUsers size={18} color="#002366" />
                                </div>
                                <div>
                                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>10Cr+</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600, marginTop: 2 }}>Verified profiles</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════ VIDEO ══════════════════════════ */}
            <section id="video" style={{ background: '#0a0a0f', padding: '0 48px 80px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{
                        borderRadius: 24, overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,.07)',
                        position: 'relative', aspectRatio: '16/9', background: '#000',
                        boxShadow: '0 40px 100px rgba(0,0,0,.5)'
                    }}>
                        {!playing ? (
                            <>
                                <img
                                    src="https://img.youtube.com/vi/0siE31sqz0Q/maxresdefault.jpg"
                                    alt="Talent Cloud"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .65 }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 55%,rgba(0,0,0,.85))' }} />

                                {/* Play button */}
                                <button
                                    onClick={() => setPlaying(true)}
                                    style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        transform: 'translate(-50%,-50%)',
                                        width: 84, height: 84, borderRadius: '50%',
                                        background: 'rgba(255,255,255,.96)',
                                        border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 0 0 16px rgba(255,255,255,0.08), 0 0 48px rgba(16,185,129,.5)',
                                        transition: 'all .3s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 0 20px rgba(255,255,255,0.12), 0 0 60px rgba(16,185,129,.65)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1)'; e.currentTarget.style.boxShadow = '0 0 0 16px rgba(255,255,255,0.08), 0 0 48px rgba(16,185,129,.5)'; }}
                                >
                                    <FiPlay size={30} color="#002366" fill="#002366" style={{ marginLeft: 4 }} />
                                </button>

                                <div style={{ position: 'absolute', bottom: 36, left: 40 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
                                        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Featured Video</span>
                                    </div>
                                    <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: '-0.02em' }}>
                                        Decoding India's Largest Talent Cloud
                                    </h3>
                                </div>
                            </>
                        ) : (
                            <iframe
                                width="100%" height="100%"
                                src="https://www.youtube.com/embed/0siE31sqz0Q?autoplay=1"
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ border: 'none' }}
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* ══════════════════════ UNIFIED CONTENT AREA ══════════════════════ */}
            <div style={{ background: '#0a0a0f' }}>

                {/* ── SOLUTIONS TABS ── */}
                <section style={{ background: 'transparent', padding: '96px 0 80px', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 2 }}>
                        <div style={{ textAlign: 'center', marginBottom: 52 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#10b981', marginBottom: 14, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                                <FiStar size={10} fill="currentColor" /> For Your Hiring Needs
                            </div>
                            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 14 }}>
                                Explore all solutions
                            </h2>
                            <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 16px' }} />
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.75 }}>
                                Six categories of hiring solutions, each powered by AI and market-tested across India's top employers.
                            </p>
                        </div>

                        {/* Tab bar — Sticky */}
                        <div
                            ref={tabsRef}
                            style={{
                                display: 'flex', gap: 8, marginBottom: 36,
                                overflowX: 'auto', paddingBottom: 4,
                                background: scrolled ? 'rgba(8,8,14,0.85)' : 'rgba(255,255,255,.03)',
                                backdropFilter: scrolled ? 'blur(16px)' : 'none',
                                borderRadius: 18,
                                padding: '8px 10px',
                                border: '1px solid rgba(255,255,255,.08)',
                                position: 'sticky',
                                top: 70,
                                zIndex: 1500,
                                transition: 'all .3s ease'
                            }}
                        >
                            {NAV_TABS.map(tab => (
                                <button
                                    key={tab}
                                    className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        background: activeTab === tab ? '#10b981' : 'transparent',
                                        color: activeTab === tab ? '#fff' : 'rgba(255,255,255,.5)',
                                        border: 'none', padding: '10px 20px', borderRadius: 12,
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        transition: 'all .2s'
                                    }}
                                >{tab}</button>
                            ))}
                        </div>

                        {/* Solution cards */}
                        <div
                            className="sol-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(currentSolutions.length, 3)}, 1fr)`,
                                gap: 22, marginBottom: 44
                            }}
                        >
                            {currentSolutions.map((s, i) => (
                                <div key={`${activeTab}-${i}`} className="sol-card" style={{
                                    animation: 'scaleIn .35s ease both',
                                    animationDelay: `${i * 80}ms`,
                                    background: 'rgba(255,255,255,.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 24, padding: 32
                                }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px',
                                        borderRadius: 5, background: 'rgba(16,185,129,.1)', color: '#10b981',
                                        fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '.08em', marginBottom: 16, border: `1px solid rgba(16,185,129,.2)`
                                    }}>{s.tag}</div>
                                    <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 5 }}>{s.name}</h3>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>{s.sub}</div>
                                    <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 16 }} />
                                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: 20 }}>{s.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                                        Learn more <FiArrowRight size={13} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <a href="#demo" className="cta-btn">Request Demo <FiArrowRight size={15} /></a>
                        </div>
                    </div>
                </section>

                {/* ── AI SECTION ── */}
                <section style={{
                    background: 'linear-gradient(135deg,#040d1e 0%,#001a52 60%,#040d1e 100%)',
                    padding: '96px 48px', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '-25%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 65%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 65%)', pointerEvents: 'none' }} />

                    <div className="ai-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 88, alignItems: 'center', position: 'relative', zIndex: 2 }}>
                        {/* Left */}
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10.5,
                                fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase',
                                color: '#6ee7b7', marginBottom: 20,
                                fontFamily: "'Bricolage Grotesque',sans-serif",
                                background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.22)',
                                padding: '5px 16px', borderRadius: 100
                            }}>
                                <FiCpu size={12} /> Largest Recruitment AI
                            </div>
                            <h2 style={{
                                fontFamily: "'Bricolage Grotesque',sans-serif",
                                fontSize: 'clamp(32px,4.2vw,54px)', fontWeight: 800,
                                color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.07, marginBottom: 28
                            }}>
                                Maven<span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '2px 14px',
                                    background: 'rgba(99,102,241,.28)', border: '1.5px solid rgba(99,102,241,.45)',
                                    borderRadius: 10, margin: '0 8px'
                                }}><FiZap size={18} fill="#818cf8" color="#818cf8" />AI</span>has an unparalleled edge
                            </h2>
                            {[
                                "Deeply understands India's talent language",
                                'Personalises talent discovery at scale',
                                'Learns from 700Cr+ annual behavioural signals',
                                'Predicts candidate interest & joinability',
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 15 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,.18)', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FiCheck size={12} color="#10b981" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 15.5, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{p}</span>
                                </div>
                            ))}
                        </div>

                        {/* Right — stats */}
                        <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 30, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                                Powering billions of actions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {AI_STATS.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 22,
                                        padding: '24px 0',
                                        borderBottom: i < AI_STATS.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none'
                                    }}>
                                        <div style={{
                                            width: 52, height: 52, borderRadius: 15,
                                            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#10b981', flexShrink: 0
                                        }}>{s.icon}</div>
                                        <div>
                                            <div className="stat-num">{s.val}</div>
                                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── STICKY PLATFORMS ── */}
                <StickyPlatformsSection />

                {/* ── TRUSTED BY ── */}
                <section style={{ background: 'rgba(255,255,255,.02)', padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#10b981', marginBottom: 14, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                                <FiShield size={11} /> Industry Leaders Trust Us
                            </div>
                            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(26px,3.2vw,40px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                                Trusted by India's top employers
                            </h2>
                        </div>
                        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
                            <div style={{ display: 'flex', gap: 0 }}>
                                {[0, 1].map(k => (
                                    <div key={k} style={{ display: 'flex', gap: 52, alignItems: 'center', animation: 'marquee 24s linear infinite', flexShrink: 0, paddingRight: 52 }}>
                                        {CLIENTS.map((c, i) => (
                                            <div key={i} style={{
                                                padding: '12px 26px', background: 'rgba(255,255,255,.04)',
                                                border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 14,
                                                fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,.6)',
                                                letterSpacing: '.03em', whiteSpace: 'nowrap',
                                                fontFamily: "'Bricolage Grotesque',sans-serif",
                                                transition: 'all .2s'
                                            }}>{c}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── DEMO CTA ── */}
                <section id="demo" style={{ background: 'transparent', padding: '96px 48px', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                        <div style={{
                            background: 'rgba(255,255,255,.02)',
                            border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 32,
                            overflow: 'hidden', display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(20px)'
                        }} className="demo-grid">
                            {/* Left info */}
                            <div style={{ padding: '60px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#10b981', marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                                    <FiStar size={10} fill="currentColor" /> Get Started
                                </div>
                                <h2 style={{
                                    fontFamily: "'Bricolage Grotesque',sans-serif",
                                    fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800,
                                    color: '#fff', letterSpacing: '-0.03em',
                                    marginBottom: 12, lineHeight: 1.12
                                }}>
                                    Know more about<br />
                                    <span style={{ color: '#818cf8' }}>MavenJobs Talent Cloud</span>
                                    <span style={{ color: '#10b981' }}> »</span>
                                </h2>
                                <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#818cf8,#10b981)', borderRadius: 3, marginBottom: 24 }} />
                                {[
                                    'Request a personalized demo',
                                    'Learn how it will help you hire better',
                                    'Get onboarded in 24 hours',
                                ].map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <FiCheckCircle size={16} color="#10b981" />
                                        <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{p}</span>
                                    </div>
                                ))}
                                {/* Contact */}
                                <div style={{ marginTop: 24, padding: '18px 22px', background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 16 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 14, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Direct Support</div>
                                    {[
                                        { icon: <FiPhone size={14} />, val: '1800-102-5557' },
                                        { icon: <FiMail size={14} />, val: 'cloud@mavenjobs.in' },
                                    ].map((c, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: i < 1 ? 10 : 0, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>
                                            <div style={{ color: '#818cf8', flexShrink: 0 }}>{c.icon}</div>
                                            {c.val}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right form */}
                            <div style={{ background: 'rgba(255,255,255,.01)', padding: '52px 48px', borderLeft: '1.5px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ height: 3, background: 'linear-gradient(90deg,#818cf8,#10b981)', borderRadius: 3, marginBottom: 28 }} />
                                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 21, fontWeight: 800, color: '#fff', marginBottom: 24 }}>
                                    Book your personalized demo!
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <input className="sf-field" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} type="text" placeholder="Full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                    <input className="sf-field" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} type="tel" placeholder="10 digit mobile number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                                    <input className="sf-field" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} type="email" placeholder="Work email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <input className="sf-field" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} type="text" placeholder="Your company" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} />
                                        <input className="sf-field" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} type="text" placeholder="Your consultancy" value={formData.consultancy} onChange={e => setFormData(p => ({ ...p, consultancy: e.target.value }))} />
                                    </div>
                                    <button className="cta-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 13, marginTop: 4 }}>
                                        Continue <FiArrowRight size={15} />
                                    </button>
                                </div>
                                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                                    By clicking Continue, you agree to be contacted via Email, Phone, or WhatsApp.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
               <EmployerFooter />
            </div>
        </div>
    );
}