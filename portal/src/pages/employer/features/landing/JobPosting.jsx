import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiCheckCircle, FiArrowRight, FiZap, FiClock, FiUsers, FiTrendingUp, FiChevronDown } from "react-icons/fi";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../components/EmployerFooter";
import "./JobPosting.css";

const PLANS = [
    { name: "Starter", price: "₹4,999", period: "/month", tag: "Best for SMBs", feats: ["5 Active Job Postings", "500 Applications/month", "Basic Candidate Filters", "Email Notifications", "7-day Free Trial"], cta: "Start Free Trial" },
    { name: "Growth", price: "₹14,999", period: "/month", tag: "Most Popular", feats: ["25 Active Job Postings", "Unlimited Applications", "Advanced AI Filters", "Priority Listing Boost", "Dedicated Account Manager", "Analytics Dashboard"], cta: "Get Started", popular: true },
    { name: "Enterprise", price: "Custom", period: "", tag: "For Large Teams", feats: ["Unlimited Postings", "Custom Integrations (ATS/HRMS)", "White-label Career Page", "SLA-backed Support", "Bulk Import/Export", "Dedicated CSM"], cta: "Contact Sales" },
];
const STATS = [
    { val: "10Cr+", label: "Active Jobseekers", icon: <FiUsers size={20} /> },
    { val: "48h", label: "Avg. Time to First Apply", icon: <FiClock size={20} /> },
    { val: "4.8×", label: "Faster Hiring", icon: <FiTrendingUp size={20} /> },
    { val: "98%", label: "Employer Satisfaction", icon: <FiZap size={20} /> },
];
const HOW = [
    { n: "01", title: "Create your posting", desc: "Fill in job details, requirements, and culture. Our AI suggests missing fields to maximise visibility and search ranking." },
    { n: "02", title: "Reach qualified talent", desc: "Your listing is promoted across MavenJobs feed, email digests, and partner job boards — reaching the right candidates instantly." },
    { n: "03", title: "Screen & shortlist", desc: "Smart filters and AI ranking surface the top 10% of applicants in your dashboard automatically — no manual sifting." },
    { n: "04", title: "Interview & hire", desc: "Schedule directly, share feedback with your team, and extend offers — all inside one streamlined platform." },
];
const FAQS = [
    { q: "How quickly does my job go live?", a: "Within 60 seconds of submission. No manual review required for standard postings." },
    { q: "Can I edit a live posting?", a: "Yes, all changes reflect immediately. You can pause, edit, or close postings at any time from your dashboard." },
    { q: "Do you integrate with our ATS?", a: "We support 40+ ATS integrations including Greenhouse, Lever, Workday, and SAP SuccessFactors." },
    { q: "What happens after my plan expires?", a: "Your postings are paused (not deleted). Upgrade anytime to reactivate with full history intact." },
];
const CANDS = [
    { initials: "AK", color: "#002366", name: "Ananya K.", role: "Sr. Product Designer", exp: "6 yrs", score: 94, scoreColor: "#10b981", scoreBg: "#ecfdf5" },
    { initials: "PS", color: "#0D9488", name: "Priya S.", role: "React Developer", exp: "4 yrs", score: 88, scoreColor: "#059669", scoreBg: "#ecfdf5" },
    { initials: "RV", color: "#7C3AED", name: "Rahul V.", role: "Data Analyst", exp: "3 yrs", score: 81, scoreColor: "#6366f1", scoreBg: "#f5f3ff" },
];

export default function JobPosting() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    return (
        <div className="jp-page-root">
            {/* ── NAV ── */}
            <LandingEmployeeHeader solid={true} />

                {/* ── HERO ── */}
                <section className="jp-hero-sec">
                    <div className="jp-hero-inner">
                        <div className="jp-hero-content">
                            <div className="jp-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#EEF2FF", color: "#002366", borderRadius: 100, padding: "7px 16px", fontSize: 12, fontWeight: 800, marginBottom: 20, letterSpacing: ".05em", textTransform: "uppercase", fontFamily: "var(--fd)" }}>
                                <div style={{ position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#002366" }} /><div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "#002366", animation: "ping 1.5s infinite" }} /></div>
                                India's #1 Job Posting Platform
                            </div>
                            <h1 className="jp-hero-title">
                                {["Post.", "Attract.", "Hire."].map(w => <span key={w} className="jp-word" style={{ display: "inline-block", marginRight: "0.22em" }}>{w}</span>)}
                                <br />
                                <span className="jp-word" style={{ display: "inline-block", color: "#002366", marginRight: "0.16em" }}>Repeat</span>
                                <span className="jp-word" style={{ display: "inline-block", color: "#10b981" }}>.</span>
                            </h1>
                            <p className="jp-sub jp-hero-sub">
                                Reach 10 crore+ active jobseekers across India. Get quality applications within 48 hours of posting — guaranteed.
                            </p>
                            <div className="jp-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
                                <button
                                    className="jp-btn-primary"
                                    onClick={() => navigate("/recruit/client-registration-form")}
                                >
                                    Post a Job — Free Trial
                                </button>
                                <button
                                    className="jp-btn-secondary"
                                    onClick={() => {
                                        const el = document.getElementById("pricing");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    See Pricing
                                </button>
                            </div>
                            <div className="jp-badges-wrap" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {["✓ No credit card required", "✓ Go live in 60 seconds", "✓ 40+ ATS integrations"].map(b => (
                                    <span key={b} className="jp-badge" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, color: "#475569" }}>{b}</span>
                                ))}
                            </div>
                        </div>

                        {/* Mockup */}
                        <div className="jp-mockup jp-mockup-card">
                            <div className="jp-mockup-header" style={{ background: "linear-gradient(135deg,#002366,#003da8)", borderRadius: 14, padding: "18px 20px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <div className="jp-mockup-header-title" style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 15, color: "#fff" }}>Applicant Inbox · Senior UX Designer</div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,.2)", color: "#10b981", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 100, border: "1px solid rgba(16,185,129,.3)", flexShrink: 0 }}>
                                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} /> LIVE
                                </div>
                            </div>
                            {CANDS.map((c, i) => (
                                <div key={i} className="jp-cand-row" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 4px", borderBottom: i < CANDS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                    <div className="jp-cand-avatar" style={{ width: 42, height: 42, borderRadius: 12, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.initials}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="jp-cand-name" style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                                        <div className="jp-cand-role" style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.role} · {c.exp} exp</div>
                                    </div>
                                    <div className="jp-cand-score" style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 100, background: c.scoreBg, color: c.scoreColor, flexShrink: 0, whiteSpace: "nowrap" }}>{c.score}% match</div>
                                </div>
                            ))}
                            <div className="jp-mockup-footer" style={{ marginTop: 16, background: "#f8fafc", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                                    <FiBarChart2 size={14} style={{ flexShrink: 0 }} /> 247 total applicants · Posted 2h ago
                                </span>
                                <span
                                    onClick={() => navigate("/recruit/client-registration-form")}
                                    style={{ fontSize: 12, fontWeight: 800, color: "#002366", cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                    View all →
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── STATS ── */}
                <div className="jp-stats jp-stats-sec">
                    <div className="jp-stats-grid">
                        {STATS.map((s, i) => (
                            <div key={i} className="jp-stat jp-stat-card">
                                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", margin: "0 auto 12px" }}>{s.icon}</div>
                                <div className="jp-stat-num">{s.val}</div>
                                <div className="jp-stat-label" style={{ fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── HOW IT WORKS ── */}
                <section className="jp-how jp-how-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="jp-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ How It Works</div>
                            <h2 className="jp-sec-title">From post to hire<br />in four steps</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto" }} />
                        </div>
                        <div className="jp-how-grid">
                            {HOW.map((h, i) => (
                                <div key={i} className="jp-step">
                                    <div className="jp-step-card" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "32px 28px", position: "relative", overflow: "hidden", transition: "all .25s", height: "100%" }}>
                                        <div className="jp-step-number" style={{ position: "absolute", top: 16, right: 20, fontFamily: "var(--fd)", fontSize: 72, fontWeight: 800, color: "#f1f5f9", lineHeight: 1, userSelect: "none" }}>{h.n}</div>
                                        <div style={{ width: 40, height: 4, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 2, marginBottom: 18 }} />
                                        <h3 style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{h.title}</h3>
                                        <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.72 }}>{h.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PLANS ── */}
                <section id="pricing" className="jp-plans jp-plans-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="jp-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ Pricing</div>
                            <h2 className="jp-sec-title">Transparent plans,<br />zero hidden fees</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto" }} />
                        </div>
                        <div className="jp-plans-grid">
                            {PLANS.map((p, i) => (
                                <div key={i} className="jp-plan" style={{ display: "flex" }}>
                                    <div className="jp-plan-card" style={{ position: "relative", padding: "36px 28px", background: p.popular ? "linear-gradient(135deg,#002366,#003da8)" : "#fff", border: p.popular ? "none" : "1.5px solid #e2e8f0", borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden", transition: "all .28s", flex: 1, width: "100%" }}>
                                        {p.popular && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#6ee7b7)" }} />}
                                        {!p.popular && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#002366,#10b981)" }} />}
                                        {p.popular && <div style={{ position: "absolute", top: 18, right: 18, background: "#10b981", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: "var(--fd)" }}>Most Popular</div>}
                                        <div style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 9px", borderRadius: 4, background: p.popular ? "rgba(16,185,129,.2)" : "#EEF2FF", color: p.popular ? "#10b981" : "#002366", fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16, alignSelf: "flex-start" }}>{p.tag}</div>
                                        <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800, color: p.popular ? "#fff" : "#0f172a", marginBottom: 8 }}>{p.name}</div>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
                                            <span style={{ fontFamily: "var(--fd)", fontSize: 40, fontWeight: 800, color: p.popular ? "#10b981" : "#002366", letterSpacing: "-0.04em", lineHeight: 1 }}>{p.price}</span>
                                            <span style={{ fontSize: 14, color: p.popular ? "rgba(255,255,255,.45)" : "#94a3b8" }}>{p.period}</span>
                                        </div>
                                        <div style={{ height: 1, background: p.popular ? "rgba(255,255,255,.1)" : "#f1f5f9", marginBottom: 20 }} />
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                                            {p.feats.map((f, j) => (
                                                <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: p.popular ? "rgba(255,255,255,.8)" : "#334155", fontWeight: 500 }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: p.popular ? "rgba(16,185,129,.2)" : "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <FiCheckCircle size={11} color="#10b981" />
                                                    </div>
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            style={{ padding: "13px", background: p.popular ? "#fff" : "#002366", color: p.popular ? "#002366" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--fd)", transition: "all .2s" }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = ".9"}
                                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                            onClick={() => navigate(p.cta === "Contact Sales" ? "/recruit/client-registration-form" : p.cta === "Get Started" ? "/buy-online" : "/recruit/client-registration-form")}
                                        >
                                            {p.cta}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="jp-faqs jp-faqs-sec">
                    <div className="jp-faqs-wrap">
                        <div className="jp-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ FAQ</div>
                            <h2 className="jp-sec-title">Common questions</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto" }} />
                        </div>
                        <div style={{ background: "#fff", borderRadius: 22, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                            {FAQS.map((f, i) => (
                                <div key={i} className="jp-faq" style={{ borderBottom: i < FAQS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                    <button
                                        className="jp-faq-btn"
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                                            <div style={{ width: 26, height: 26, borderRadius: 8, background: openFaq === i ? "#002366" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .25s" }}>
                                                <span style={{ fontFamily: "var(--fd)", fontSize: 10.5, fontWeight: 800, color: openFaq === i ? "#fff" : "#94a3b8" }}>{String(i + 1).padStart(2, "0")}</span>
                                            </div>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: openFaq === i ? "#002366" : "#0f172a", transition: "color .2s" }}>{f.q}</span>
                                        </div>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: openFaq === i ? "#ecfdf5" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: openFaq === i ? "#10b981" : "#94a3b8", transform: openFaq === i ? "rotate(180deg)" : "none", transition: "all .25s" }}>
                                            <FiChevronDown size={15} />
                                        </div>
                                    </button>
                                    <div style={{ maxHeight: openFaq === i ? 400 : 0, overflow: "hidden", transition: "max-height .35s cubic-bezier(.4,0,.2,1)" }}>
                                        <div className="jp-faq-answer">{f.a}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="jp-cta-sec">
                    <div className="jp-cta-inner">
                        <div className="jp-cta-box">
                            <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                            <div style={{ position: "absolute", top: "-30%", right: "30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.12) 0%,transparent 65%)", pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                                <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>
                                    Start posting jobs<br /><span style={{ color: "#10b981" }}>in 60 seconds.</span>
                                </h2>
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>Join 40,000+ companies who trust MavenJobs to find their next great hire.</p>
                            </div>
                            <button
                                className="jp-cta-btn"
                                onClick={() => navigate("/recruit/client-registration-form")}
                            >
                                Post Your First Job — Free <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <EmployerFooter />
            </div>
    );
}