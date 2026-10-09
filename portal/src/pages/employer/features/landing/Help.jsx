import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    FiSearch, FiPhone, FiMail,
    FiChevronRight, FiChevronDown,
    FiX, FiHeadphones, FiBookOpen,
    FiShield, FiZap, FiCopy, FiCheck, FiMessageCircle
} from 'react-icons/fi';
import LandingEmployeeHeader from '../../../../layout/employer/LandingEmployeeHeader';
import EmployerFooter from '../../../../layout/employer/LandingEmployeeFooter';
import './Help.css';

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

const POPULAR_SEARCHES = ['Delhi NCR', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Telangana', 'West Bengal'];

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
    { id: 'docs', icon: <FiBookOpen size={20} />, title: 'Employer Docs', desc: 'Guides, walkthroughs & FAQs', color: '#002366', bg: '#EEF2FF', to: '/employers/learning-center' },
    { id: 'support', icon: <FiHeadphones size={20} />, title: 'Priority Support', desc: 'Browse regional helplines', color: '#10b981', bg: '#ecfdf5', scrollId: 'helplines' },
    { id: 'security', icon: <FiShield size={20} />, title: 'Account Access', desc: 'Password & login settings', color: '#6366f1', bg: '#f5f3ff', to: '/employer-login' },
    { id: 'faq', icon: <FiZap size={20} />, title: 'Common Questions', desc: 'Pricing, SLAs & verification', color: '#f59e0b', bg: '#fffbeb', scrollId: 'faqs' },
];

/* ─── Sub-components ─────────────────────────────────────── */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };
    return (
        <button
            onClick={handleCopy}
            className={`eh-copy-btn ${copied ? 'copied' : ''}`}
            title={copied ? "Copied!" : "Copy to clipboard"}
            aria-label="Copy"
        >
            {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
        </button>
    );
}

function FaqItem({ faq, idx, expanded, onToggle }) {
    return (
        <div style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button
                onClick={() => onToggle(idx)}
                className="eh-faq-btn"
                aria-expanded={expanded}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                        className="eh-faq-num-box"
                        style={{
                            background: expanded ? '#002366' : '#f1f5f9',
                            color: expanded ? '#ffffff' : '#94a3b8'
                        }}
                    >
                        <span style={{ fontFamily: 'var(--fd)', fontSize: 11.5, fontWeight: 800 }}>
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: expanded ? '#002366' : '#0f172a', lineHeight: 1.4 }}>
                        {faq.q}
                    </span>
                </div>
                <div
                    className="eh-faq-chevron-box"
                    style={{
                        background: expanded ? '#ecfdf5' : '#f1f5f9',
                        color: expanded ? '#10b981' : '#94a3b8',
                        transform: expanded ? 'rotate(180deg)' : 'none'
                    }}
                >
                    <FiChevronDown size={16} />
                </div>
            </button>
            <div style={{ maxHeight: expanded ? 320 : 0, overflow: 'hidden', transition: 'max-height .35s cubic-bezier(.16,1,.3,1)' }}>
                <div className="eh-faq-answer">{faq.a}</div>
            </div>
        </div>
    );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function EmployerHelp() {
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [activeRegion, setActiveRegion] = useState('All');
    const [selectedCard, setSelectedCard] = useState(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const regionParam = params.get('region');
        if (regionParam && REGIONS.includes(regionParam)) {
            setActiveRegion(regionParam);
        }
        if (location.hash) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [location.search, location.hash]);


    // Enhanced multi-field search (state name, state code, region, number)
    const filtered = HELPLINES.filter(h => {
        const q = search.trim().toLowerCase();
        const matchSearch = !q ||
            h.state.toLowerCase().includes(q) ||
            h.code.toLowerCase().includes(q) ||
            h.number.includes(q) ||
            h.region.toLowerCase().includes(q);
        const matchRegion = activeRegion === 'All' || h.region === activeRegion;
        return matchSearch && matchRegion;
    });

    const regionCounts = {
        All: HELPLINES.length,
        ...REGIONS.filter(r => r !== 'All').reduce((acc, r) => {
            acc[r] = HELPLINES.filter(h => h.region === r).length;
            return acc;
        }, {})
    };

    const handleQuickAction = (item) => {
        if (item.to) {
            navigate(item.to);
        } else if (item.scrollId) {
            const el = document.getElementById(item.scrollId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="eh-page-root">
            {/* ── HEADER ── */}
            <LandingEmployeeHeader solid={true} />

            {/* ── HERO ── */}
            <section className="eh-hero-sec">
                <div className="eh-hero-bg-grid" />
                <div className="eh-hero-glow-1" />
                <div className="eh-hero-glow-2" />

                <div className="eh-hero-inner">
                    <div className="eh-hero-badge">
                        <FiHeadphones size={12} /> Employer Help & Support Center
                    </div>
                    <h1 className="eh-hero-title">
                        How can we<br /><span>help you today?</span>
                    </h1>
                    <p className="eh-hero-sub">
                        Direct regional helplines, technical documentation, and answers to common recruitment questions — all in one unified portal.
                    </p>

                    {/* Search */}
                    <div className="eh-search-box">
                        <FiSearch className="eh-search-icon" size={19} />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search by state, UT, code (e.g. MH, DL), or region…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="eh-search-input"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="eh-search-clear"
                                title="Clear search"
                            >
                                <FiX size={15} />
                            </button>
                        )}
                    </div>

                    {/* Popular search tags */}
                    <div className="eh-search-tags">
                        <span>Popular:</span>
                        {POPULAR_SEARCHES.map(s => (
                            <button
                                key={s}
                                className="eh-search-tag-btn"
                                onClick={() => {
                                    setSearch(s);
                                    setActiveRegion('All');
                                    const el = document.getElementById('helplines');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Quick stats pills */}
                    <div className="eh-hero-stats">
                        {[
                            { v: '37', l: 'States & UTs Covered' },
                            { v: '24/7', l: 'Helpline Availability' },
                            { v: '<2hr', l: 'Avg. Response Time' }
                        ].map((s, i) => (
                            <div key={i} className="eh-stat-pill">
                                <span className="eh-stat-pill-val">{s.v}</span>
                                <span className="eh-stat-pill-label">{s.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── QUICK LINKS ── */}
            <div className="eh-quick-links-wrap">
                <div className="eh-quick-links-grid">
                    {QUICK_LINKS.map((ql, i) => (
                        <div
                            key={ql.id || i}
                            className="eh-quick-card"
                            onClick={() => handleQuickAction(ql)}
                        >
                            <div className="eh-quick-card-icon" style={{ background: ql.bg, color: ql.color }}>
                                {ql.icon}
                            </div>
                            <div>
                                <div className="eh-quick-card-title">{ql.title}</div>
                                <div className="eh-quick-card-desc">{ql.desc}</div>
                            </div>
                            <FiChevronRight size={17} className="eh-quick-card-arrow" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HELPLINE GRID ── */}
            <section id="helplines" className="eh-helpline-sec">
                {/* Header + filters */}
                <div className="eh-sec-header-row">
                    <div>
                        <h2 className="eh-sec-title">
                            {search ? `Results for "${search}"` : 'State-wise Helplines'}
                        </h2>
                        <p className="eh-sec-sub">
                            {filtered.length} helpline{filtered.length !== 1 ? 's' : ''} {activeRegion !== 'All' ? `in ${activeRegion} India` : 'across all Indian States & Union Territories'}
                        </p>
                    </div>
                    <div className="eh-region-tabs">
                        {REGIONS.map(r => (
                            <button
                                key={r}
                                className={`eh-region-btn ${activeRegion === r ? 'active' : ''}`}
                                onClick={() => setActiveRegion(r)}
                            >
                                <span>{r}</span>
                                <span className="eh-region-count">({regionCounts[r] || 0})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filtered.length > 0 ? (
                    <div className="eh-cards-grid">
                        {filtered.map((item) => {
                            const rc = REGION_COLORS[item.region] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
                            const isSelected = selectedCard === item.state;
                            return (
                                <div
                                    key={item.state}
                                    className={`eh-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedCard(isSelected ? null : item.state)}
                                >
                                    {/* Top row */}
                                    <div className="eh-card-header">
                                        <div className="eh-card-state-group">
                                            <div
                                                className="eh-code-badge"
                                                style={{
                                                    background: rc.bg,
                                                    border: `1px solid ${rc.dot}25`,
                                                    color: rc.color
                                                }}
                                            >
                                                {item.code}
                                            </div>
                                            <div>
                                                <div className="eh-card-state-name">{item.state}</div>
                                                <div
                                                    className="eh-region-pill"
                                                    style={{ background: rc.bg, color: rc.color }}
                                                >
                                                    <div style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: rc.dot }} />
                                                    {item.region}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="eh-live-badge">
                                            <div className="eh-live-dot" />
                                            Live
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="eh-card-divider" />

                                    {/* Phone */}
                                    <div className="eh-contact-row">
                                        <a
                                            href={`tel:${item.number}`}
                                            onClick={e => e.stopPropagation()}
                                            className="eh-contact-link"
                                            title={`Call ${item.state} helpline`}
                                        >
                                            <div className="eh-contact-icon-box" style={{ background: '#EEF2FF', color: '#002366' }}>
                                                <FiPhone size={14} />
                                            </div>
                                            <span className="eh-contact-phone-text">{item.number}</span>
                                        </a>
                                        <CopyButton text={item.number} />
                                    </div>

                                    {/* Email */}
                                    <div className="eh-contact-row">
                                        <a
                                            href={`mailto:${item.email}`}
                                            onClick={e => e.stopPropagation()}
                                            className="eh-contact-link"
                                            title={`Email ${item.state} support`}
                                        >
                                            <div className="eh-contact-icon-box" style={{ background: '#f8fafc', color: '#64748b' }}>
                                                <FiMail size={14} />
                                            </div>
                                            <span className="eh-contact-email-text">{item.email}</span>
                                        </a>
                                        <CopyButton text={item.email} />
                                    </div>

                                    {/* Expanded details */}
                                    <div className="eh-card-drawer" style={{ maxHeight: isSelected ? 80 : 0 }}>
                                        <div className="eh-drawer-content">
                                            {[
                                                { l: 'Working Hours', v: 'Mon–Sat 9AM–7PM' },
                                                { l: 'Languages', v: 'Hindi, English & Regional' }
                                            ].map((d, idx) => (
                                                <div key={idx}>
                                                    <div className="eh-drawer-item-label">{d.l}</div>
                                                    <div className="eh-drawer-item-val">{d.v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="eh-empty-box">
                        <div className="eh-empty-icon">
                            <FiSearch size={26} color="#94a3b8" />
                        </div>
                        <h3 className="eh-empty-title">No results found for "{search}"</h3>
                        <p className="eh-empty-sub">
                            Try checking for spelling errors, searching by state code (e.g. DL, MH), or browse by region.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setActiveRegion('All'); }}
                            className="eh-empty-btn"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </section>

            {/* ── FAQ ── */}
            <section id="faqs" className="eh-faq-sec">
                <div className="eh-faq-header">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: 'var(--fd)' }}>
                        ✦ Common Questions
                    </div>
                    <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>
                        Employer Support FAQs
                    </h2>
                    <div style={{ width: 48, height: 3.5, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                </div>
                <div className="eh-faq-card-wrap">
                    {FAQS.map((faq, i) => (
                        <FaqItem
                            key={i}
                            faq={faq}
                            idx={i}
                            expanded={expandedFaq === i}
                            onToggle={idx => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        />
                    ))}
                </div>
            </section>

            {/* ── CONTACT BANNER ── */}
            <section className="eh-cta-sec">
                <div className="eh-cta-box">
                    <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '-30%', right: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.14) 0%,transparent 65%)', pointerEvents: 'none' }} />

                    <div className="eh-cta-left">
                        <div className="eh-cta-badge">✦ Still Need Help?</div>
                        <h2 className="eh-cta-title">Our dedicated team is ready to assist</h2>
                        <p className="eh-cta-sub">
                            Corporate support available 24/7 across India. For enterprise accounts, a dedicated relationship manager is always on call.
                        </p>
                        <div className="eh-cta-actions">
                            <button
                                className="eh-btn-green"
                                onClick={() => navigate('/recruit/client-registration-form')}
                            >
                                <FiMessageCircle size={16} /> Contact Sales & Support
                            </button>
                            <button
                                className="eh-btn-outline"
                                onClick={() => navigate('/employers/learning-center')}
                            >
                                <FiBookOpen size={16} /> View Documentation
                            </button>
                        </div>
                    </div>

                    {/* Contact card */}
                    <div className="eh-cta-card">
                        <div className="eh-cta-card-label">Direct Corporate Lines</div>
                        {[
                            { icon: <FiPhone size={15} />, label: 'Toll-Free Helpline', val: '1800-102-5557', href: 'tel:18001025557', color: '#10b981', bg: 'rgba(16,185,129,.18)' },
                            { icon: <FiMail size={15} />, label: 'Enterprise Email', val: 'corporate@mavenjobs.in', href: 'mailto:corporate@mavenjobs.in', color: '#6ee7b7', bg: 'rgba(110,231,183,.15)' },
                        ].map((c, i) => (
                            <a
                                key={i}
                                href={c.href}
                                className="eh-direct-line"
                                style={{ marginBottom: i < 1 ? 12 : 0 }}
                            >
                                <div className="eh-direct-line-icon" style={{ background: c.bg, color: c.color }}>
                                    {c.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="eh-direct-line-sub">{c.label}</div>
                                    <div className="eh-direct-line-val">{c.val}</div>
                                </div>
                                <CopyButton text={c.val} />
                            </a>
                        ))}
                        <div className="eh-sla-pill">
                            <div className="eh-sla-dot" />
                            <span className="eh-sla-text">Average response time: &lt; 2 hours</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <EmployerFooter />
        </div>
    );
}