import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiSearch, FiPhone, FiMail, FiMapPin, FiMessageCircle,
    FiChevronRight, FiChevronDown, FiArrowLeft, FiClock,
    FiShield, FiZap, FiAward, FiInfo, FiActivity,
    FiX, FiExternalLink, FiHeadphones, FiBookOpen,
    FiCopy, FiCheck
} from 'react-icons/fi';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import LandingEmployeeHeader from '../../../../components/employer/LandingEmployeeHeader';
import EmployerFooter from '../../../../components/EmployerFooter';

/* ─── Data ──────────────────────────────────────────────── */
const HELPLINES = [
    { state: 'Andaman & Nicobar', code: 'AN', number: '03192-232742', email: 'help.an@mavenjobs.in', region: 'East' },
    { state: 'Andhra Pradesh', code: 'AP', number: '0863-2345678', email: 'help.ap@mavenjobs.in', region: 'South' },
    { state: 'Arunachal Pradesh', code: 'AR', number: '0360-2212345', email: 'help.ar@mavenjobs.in', region: 'North-East' },
    { state: 'Assam', code: 'AS', number: '0361-2345678', email: 'help.as@mavenjobs.in', region: 'North-East' },
    { state: 'Bihar', code: 'BR', number: '0612-2345678', email: 'help.br@mavenjobs.in', region: 'East' },
    { state: 'Chandigarh', code: 'CH', number: '0172-2345678', email: 'help.ch@mavenjobs.in', region: 'North' },
    { state: 'Chhattisgarh', code: 'CG', number: '0771-2345678', email: 'help.cg@mavenjobs.in', region: 'Central' },
    { state: 'Dadra & Nagar Haveli', code: 'DN', number: '0260-2345678', email: 'help.dn@mavenjobs.in', region: 'West' },
    { state: 'Daman & Diu', code: 'DD', number: '02636-234567', email: 'help.dd@mavenjobs.in', region: 'West' },
    { state: 'Delhi NCR', code: 'DL', number: '011-45678900', email: 'help.dl@mavenjobs.in', region: 'North' },
    { state: 'Goa', code: 'GA', number: '0832-2345678', email: 'help.ga@mavenjobs.in', region: 'West' },
    { state: 'Gujarat', code: 'GJ', number: '079-23456789', email: 'help.gj@mavenjobs.in', region: 'West' },
    { state: 'Haryana', code: 'HR', number: '0172-2345678', email: 'help.hr@mavenjobs.in', region: 'North' },
    { state: 'Himachal Pradesh', code: 'HP', number: '0177-2345678', email: 'help.hp@mavenjobs.in', region: 'North' },
    { state: 'Jammu & Kashmir', code: 'JK', number: '0194-2345678', email: 'help.jk@mavenjobs.in', region: 'North' },
    { state: 'Jharkhand', code: 'JH', number: '0651-2345678', email: 'help.jh@mavenjobs.in', region: 'East' },
    { state: 'Karnataka', code: 'KA', number: '080-67890123', email: 'help.ka@mavenjobs.in', region: 'South' },
    { state: 'Kerala', code: 'KL', number: '0471-2345678', email: 'help.kl@mavenjobs.in', region: 'South' },
    { state: 'Ladakh', code: 'LA', number: '01982-234567', email: 'help.la@mavenjobs.in', region: 'North' },
    { state: 'Lakshadweep', code: 'LD', number: '04896-234567', email: 'help.ld@mavenjobs.in', region: 'South' },
    { state: 'Madhya Pradesh', code: 'MP', number: '0755-2345678', email: 'help.mp@mavenjobs.in', region: 'Central' },
    { state: 'Maharashtra', code: 'MH', number: '022-67890123', email: 'help.mh@mavenjobs.in', region: 'West' },
    { state: 'Manipur', code: 'MN', number: '0385-2345678', email: 'help.mn@mavenjobs.in', region: 'North-East' },
    { state: 'Meghalaya', code: 'ML', number: '0364-2345678', email: 'help.ml@mavenjobs.in', region: 'North-East' },
    { state: 'Mizoram', code: 'MZ', number: '0389-2345678', email: 'help.mz@mavenjobs.in', region: 'North-East' },
    { state: 'Nagaland', code: 'NL', number: '0370-2345678', email: 'help.nl@mavenjobs.in', region: 'North-East' },
    { state: 'Odisha', code: 'OR', number: '0674-2345678', email: 'help.or@mavenjobs.in', region: 'East' },
    { state: 'Puducherry', code: 'PY', number: '0413-2345678', email: 'help.py@mavenjobs.in', region: 'South' },
    { state: 'Punjab', code: 'PB', number: '0172-2345678', email: 'help.pb@mavenjobs.in', region: 'North' },
    { state: 'Rajasthan', code: 'RJ', number: '0141-2345678', email: 'help.rj@mavenjobs.in', region: 'North' },
    { state: 'Sikkim', code: 'SK', number: '03592-234567', email: 'help.sk@mavenjobs.in', region: 'North-East' },
    { state: 'Tamil Nadu', code: 'TN', number: '044-67890123', email: 'help.tn@mavenjobs.in', region: 'South' },
    { state: 'Telangana', code: 'TG', number: '040-67890123', email: 'help.tg@mavenjobs.in', region: 'South' },
    { state: 'Tripura', code: 'TR', number: '0381-2345678', email: 'help.tr@mavenjobs.in', region: 'North-East' },
    { state: 'Uttar Pradesh', code: 'UP', number: '0522-2345678', email: 'help.up@mavenjobs.in', region: 'North' },
    { state: 'Uttarakhand', code: 'UK', number: '0135-2345678', email: 'help.uk@mavenjobs.in', region: 'North' },
    { state: 'West Bengal', code: 'WB', number: '033-67890123', email: 'help.wb@mavenjobs.in', region: 'East' },
];

const REGIONS = ['All', 'North', 'South', 'East', 'West', 'Central', 'North-East'];

const REGION_COLORS = {
    North: { bg: '#EEF2FF', color: '#4338ca', dot: '#6366f1' },
    South: { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
    East: { bg: '#fff7ed', color: '#9a3412', dot: '#f97316' },
    West: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7' },
    Central: { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
    'North-East': { bg: '#f0f9ff', color: '#075985', dot: '#0ea5e9' },
};

const FAQS = [
    { q: 'How do I post a job on MavenJobs?', a: 'Log in to your employer dashboard, click "Post a Job", fill in the role details, and choose your preferred plan to go live. Jobs are typically reviewed and published within 2 hours.' },
    { q: 'What is the NChecked Profile feature?', a: "NChecked Profiles are candidate profiles cross-verified by Maven's team across 14+ critical details — including current CTC, notice period, company duration, and skills — so you only engage with reliable, accurate candidates." },
    { q: 'How can I reset my employer account password?', a: 'Click "Forgot Password" on the employer login page, enter your registered email address, and follow the reset instructions sent to your inbox. If you don\'t receive the email within 5 minutes, check your spam folder or contact support.' },
    { q: 'Can I post a job for free on MavenJobs?', a: 'Yes! MavenJobs offers a Free Job Posting tier that allows one active job at a time with up to 50 candidate applications. Upgrade to a paid plan for unlimited postings, Resdex access, and AI-powered candidate recommendations.' },
    { q: 'How does MavenPremiumX differ from standard postings?', a: 'MavenPremiumX is built for roles above ₹30L CTC. It gives you access to India\'s top 1% of white-collar talent, NChecked verification, multi-channel outreach (WhatsApp + email + calls), and priority placement in recruiter search results.' },
    { q: 'What SLA can I expect from Expert Assist?', a: 'Expert Assist operates on a fixed-fee model with clear SLAs. Shortlisting begins within 48 hours of mandate creation. You receive 5 interview-ready candidates per mandate, with a replacement guarantee if any candidate drops out within 30 days.' },
];

const QUICK_LINKS = [
    { icon: <FiBookOpen size={18} />, title: 'Employer Docs', desc: 'Full documentation and guides', color: '#002366', bg: '#EEF2FF' },
    { icon: <FiHeadphones size={18} />, title: 'Priority Support', desc: '24/7 dedicated helpline', color: '#10b981', bg: '#ecfdf5' },
    { icon: <FiShield size={18} />, title: 'Account Security', desc: 'Password & access settings', color: '#6366f1', bg: '#f5f3ff' },
    { icon: <FiZap size={18} />, title: 'API & Integrations', desc: 'ATS & HRMS integrations', color: '#f59e0b', bg: '#fffbeb' },
];

/* ─── Sub-components ─────────────────────────────────────── */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };
    return (
        <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 7, color: copied ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', transition: 'color .2s', flexShrink: 0 }} title="Copy">
            {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
        </button>
    );
}

function FaqItem({ faq, idx, expanded, onToggle }) {
    const bodyRef = useRef(null);
    return (
        <div style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={() => onToggle(idx)} style={{ width: '100%', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: expanded ? '#002366' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .25s' }}>
                        <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 11, fontWeight: 800, color: expanded ? '#fff' : '#94a3b8', lineHeight: 1 }}>
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: expanded ? '#002366' : '#0f172a', lineHeight: 1.4, transition: 'color .2s' }}>{faq.q}</span>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: expanded ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: expanded ? '#10b981' : '#94a3b8', transition: 'all .25s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
                    <FiChevronDown size={15} />
                </div>
            </button>
            <div ref={bodyRef} style={{ maxHeight: expanded ? 300 : 0, overflow: 'hidden', transition: 'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
                <div style={{ padding: '0 32px 24px 74px', fontSize: 14, color: '#475569', lineHeight: 1.82 }}>{faq.a}</div>
            </div>
        </div>
    );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function EmployerHelp() {
    const [search, setSearch] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [activeRegion, setActiveRegion] = useState('All');
    const [selectedCard, setSelectedCard] = useState(null);
    const heroRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const filtered = HELPLINES.filter(h => {
        const matchSearch = h.state.toLowerCase().includes(search.toLowerCase());
        const matchRegion = activeRegion === 'All' || h.region === activeRegion;
        return matchSearch && matchRegion;
    });

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#0f172a', overflowX: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
                :root{--navy:#002366;--green:#10b981;--fd:'Bricolage Grotesque',sans-serif}
                @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
                @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
                .eh-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;transition:all .25s cubic-bezier(.4,0,.2,1);cursor:pointer;}
                .eh-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,35,102,.09);border-color:rgba(0,35,102,.18);}
                .eh-card.selected{border-color:#002366;box-shadow:0 0 0 4px rgba(0,35,102,.08),0 16px 40px rgba(0,35,102,.12);}
                .region-btn{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all .2s;font-family:var(--fd);white-space:nowrap;}
                .region-btn:hover{border-color:rgba(0,35,102,.25);color:#002366;}
                .region-btn.active{background:#002366;color:#fff;border-color:#002366;}
                .ql-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .2s;}
                .ql-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,35,102,.07);border-color:rgba(0,35,102,.15);}
                .search-glow:focus-within{box-shadow:0 0 0 4px rgba(0,35,102,.08);}
                ::-webkit-scrollbar{width:4px}
                ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
            `}</style>

            {/* ── PROMO STRIP ── */}
            {/* <div style={{ background: 'linear-gradient(90deg,#001540,#002b7a,#001540)', backgroundSize: '200% 100%', animation: 'shimmer 5s linear infinite', padding: '9px 0', textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '.15em', color: '#fff', textTransform: 'uppercase', fontFamily: 'var(--fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <FiZap size={11} fill="#6ee7b7" color="#6ee7b7" />
                24/7 Employer Support Across All 28 States & 8 Union Territories
                <FiZap size={11} fill="#6ee7b7" color="#6ee7b7" />
            </div> */}

            {/* ── HEADER ── */}
            {/* <header style={{ background: scrolled ? 'rgba(255,255,255,.97)' : 'transparent', position: 'sticky', top: 0, zIndex: 1000, height: 68, display: 'flex', alignItems: 'center', padding: '0 44px', borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', transition: 'all .35s' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <Link to="/employer-login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: scrolled ? '#f1f5f9' : 'rgba(255,255,255,.1)', borderRadius: 10, textDecoration: 'none', color: scrolled ? '#475569' : 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, transition: 'all .2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = scrolled ? '#e2e8f0' : 'rgba(255,255,255,.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = scrolled ? '#f1f5f9' : 'rgba(255,255,255,.1)'; }}>
                            <FiArrowLeft size={14} /> Back
                        </Link>
                        <div style={{ width: 1, height: 22, background: scrolled ? '#e2e8f0' : 'rgba(255,255,255,.15)' }} />
                        <Link to="/"><img src={mavenLogo} alt="MavenJobs" style={{ height: 26, filter: scrolled ? 'none' : 'invert(1) brightness(2)' }} /></Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', animation: 'ping 1.5s cubic-bezier(0,0,.2,1) infinite' }} />
                            </div>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: scrolled ? '#ecfdf5' : 'rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: scrolled ? '#10b981' : '#6ee7b7' }}>
                                <FiActivity size={18} />
                            </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: scrolled ? '#94a3b8' : 'rgba(255,255,255,.45)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Available Now</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: scrolled ? '#002366' : '#fff' }}>Corporate Support</div>
                        </div>
                    </div>
                </div>
            </header> */}
            <LandingEmployeeHeader />

            {/* ── HERO ── */}
            <section ref={heroRef} style={{ background: 'linear-gradient(135deg,#050e24 0%,#002366 60%,#1a0a4a 100%)', padding: '72px 44px 120px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 65%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-25%', left: '-6%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 65%)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'fadeUp .8s ease both' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.28)', color: '#6ee7b7', fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 100, marginBottom: 24, fontFamily: 'var(--fd)', backdropFilter: 'blur(8px)' }}>
                        <FiHeadphones size={11} /> Employer Help Center
                    </div>
                    <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(32px,5vw,54px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 16 }}>
                        How can we<br /><span style={{ color: '#10b981' }}>help you today?</span>
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 40, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 40px' }}>
                        Find regional helpline numbers, technical documentation, and answers to common recruitment questions — all in one place.
                    </p>

                    {/* Search */}
                    <div className="search-glow" style={{ position: 'relative', maxWidth: 580, margin: '0 auto 28px', borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
                        <FiSearch style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input ref={searchRef} type="text" placeholder="Search your state or union territory…" value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '18px 56px 18px 54px', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 500, outline: 'none', color: '#0f172a', fontFamily: "'DM Sans',sans-serif" }} />
                        {search && (
                            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                                <FiX size={14} />
                            </button>
                        )}
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[{ v: '37', l: 'States & UTs' }, { v: '24/7', l: 'Support Hours' }, { v: '<2hr', l: 'Response Time' }].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 100, backdropFilter: 'blur(8px)' }}>
                                <span style={{ fontFamily: 'var(--fd)', fontSize: 15, fontWeight: 800, color: '#fff' }}>{s.v}</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{s.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── QUICK LINKS ── */}
            <div style={{ maxWidth: 1280, margin: '-28px auto 0', padding: '0 44px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                    {QUICK_LINKS.map((ql, i) => (
                        <div key={i} className="ql-card" style={{ animationDelay: `${i * .08}s`, animation: 'fadeUp .7s ease both' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: ql.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ql.color, flexShrink: 0 }}>{ql.icon}</div>
                            <div>
                                <div style={{ fontFamily: 'var(--fd)', fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{ql.title}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{ql.desc}</div>
                            </div>
                            <FiChevronRight size={16} color="#cbd5e1" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HELPLINE GRID ── */}
            <section style={{ maxWidth: 1280, margin: '48px auto 80px', padding: '0 44px' }}>
                {/* Header + filters */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(22px,2.8vw,30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 5 }}>
                            {search ? `Results for "${search}"` : 'State-wise Helplines'}
                        </h2>
                        <p style={{ fontSize: 13.5, color: '#64748b', fontWeight: 500 }}>
                            {filtered.length} helpline{filtered.length !== 1 ? 's' : ''} {activeRegion !== 'All' ? `in ${activeRegion} India` : 'across India'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {REGIONS.map(r => (
                            <button key={r} className={`region-btn${activeRegion === r ? ' active' : ''}`}
                                onClick={() => setActiveRegion(r)}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filtered.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(288px,1fr))', gap: 18 }}>
                        {filtered.map((item, i) => {
                            const rc = REGION_COLORS[item.region] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
                            const isSelected = selectedCard === item.state;
                            return (
                                <div key={item.state} className={`eh-card${isSelected ? ' selected' : ''}`}
                                    onClick={() => setSelectedCard(isSelected ? null : item.state)}
                                    style={{ animation: `fadeUp .55s ease ${Math.min(i, 8) * .04}s both`, padding: '24px 22px' }}>

                                    {/* Top row */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 13, background: rc.bg, border: `1px solid ${rc.dot}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 800, color: rc.color, letterSpacing: '.04em' }}>
                                                {item.code}
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'var(--fd)', fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 2 }}>{item.state}</div>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 17, padding: '0 7px', borderRadius: 100, background: rc.bg, fontSize: 9.5, fontWeight: 800, color: rc.color, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: rc.dot }} />
                                                    {item.region}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 9px', borderRadius: 100, background: '#ecfdf5', border: '1px solid rgba(16,185,129,.2)', fontSize: 9.5, fontWeight: 800, color: '#059669', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                                            Live
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: 1, background: '#f1f5f9', marginBottom: 14 }} />

                                    {/* Phone */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                                        <a href={`tel:${item.number}`} onClick={e => e.stopPropagation()}
                                            style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 1 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002366', flexShrink: 0 }}>
                                                <FiPhone size={13} />
                                            </div>
                                            <span style={{ fontFamily: 'var(--fd)', fontSize: 14, fontWeight: 800, color: '#002366', letterSpacing: '.02em' }}>{item.number}</span>
                                        </a>
                                        <CopyButton text={item.number} />
                                    </div>

                                    {/* Email */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <a href={`mailto:${item.email}`} onClick={e => e.stopPropagation()}
                                            style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 1, overflow: 'hidden' }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                                                <FiMail size={13} />
                                            </div>
                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.email}</span>
                                        </a>
                                        <CopyButton text={item.email} />
                                    </div>

                                    {/* Expanded details */}
                                    <div style={{ maxHeight: isSelected ? 72 : 0, overflow: 'hidden', transition: 'max-height .3s ease' }}>
                                        <div style={{ marginTop: 14, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                {[{ l: 'Hours', v: 'Mon–Sat 9AM–7PM' }, { l: 'Language', v: 'Hindi, English' }].map((d, i) => (
                                                    <div key={i}>
                                                        <div style={{ fontSize: 9.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{d.l}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{d.v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', borderRadius: 24, border: '1.5px dashed #e2e8f0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FiSearch size={24} color="#94a3b8" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 800, color: '#475569', marginBottom: 8 }}>No results for "{search}"</h3>
                        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Try a different spelling or browse by region above.</p>
                        <button onClick={() => { setSearch(''); setActiveRegion('All'); }} style={{ padding: '10px 22px', background: '#002366', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Clear Filters</button>
                    </div>
                )}
            </section>

            {/* ── FAQ ── */}
            <section style={{ maxWidth: 860, margin: '0 auto 88px', padding: '0 44px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 10, fontFamily: 'var(--fd)' }}>✦ Common Questions</div>
                    <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(24px,3.2vw,36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 10 }}>General Support FAQs</h2>
                    <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                </div>
                <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                    {FAQS.map((faq, i) => (
                        <FaqItem key={i} faq={faq} idx={i} expanded={expandedFaq === i} onToggle={idx => setExpandedFaq(expandedFaq === idx ? null : idx)} />
                    ))}
                </div>
            </section>

            {/* ── CONTACT BANNER ── */}
            <section style={{ maxWidth: 1280, margin: '0 auto 88px', padding: '0 44px' }}>
                <div style={{ background: 'linear-gradient(135deg,#050e24 0%,#002366 100%)', borderRadius: 28, padding: '64px 56px', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
                    <div style={{ position: 'absolute', top: '-30%', right: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.12) 0%,transparent 65%)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 14, fontFamily: 'var(--fd)' }}>✦ Still Need Help?</div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1 }}>Our team is ready to assist</h2>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', marginBottom: 32, lineHeight: 1.72, maxWidth: 460 }}>Corporate support available 24/7. For enterprise accounts, a dedicated account manager is always on call.</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--fd)', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,.35)', transition: 'all .2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#0da371'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = ''; }}>
                                <FiMessageCircle size={16} /> Chat with MavenAI
                            </button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,.18)', borderRadius: 12, fontFamily: 'var(--fd)', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.13)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}>
                                <FiBookOpen size={16} /> View Resources
                            </button>
                        </div>
                    </div>

                    {/* Contact card */}
                    <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '28px 32px', backdropFilter: 'blur(12px)', minWidth: 280 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 18, fontFamily: 'var(--fd)' }}>Direct Lines</div>
                        {[
                            { icon: <FiPhone size={15} />, label: 'Priority Helpline', val: '1800-102-5557', href: 'tel:18001025557', color: '#10b981', bg: 'rgba(16,185,129,.15)' },
                            { icon: <FiMail size={15} />, label: 'Enterprise Email', val: 'corporate@mavenjobs.in', href: 'mailto:corporate@mavenjobs.in', color: '#6ee7b7', bg: 'rgba(110,231,183,.12)' },
                        ].map((c, i) => (
                            <a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: i < 1 ? 16 : 0 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{c.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.val}</div>
                                </div>
                                <CopyButton text={c.val} />
                            </a>
                        ))}
                        <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#6ee7b7' }}>Avg. response time: &lt; 2 hours</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <EmployerFooter />
        </div>
    );
}