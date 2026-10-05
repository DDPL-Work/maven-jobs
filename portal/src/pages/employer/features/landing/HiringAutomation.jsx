import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiFileText, FiShare2, FiCpu, FiCalendar, FiMail, FiAward,
    FiDatabase, FiBarChart2, FiLink, FiShield, FiCheckCircle,
    FiZap, FiArrowRight, FiClock
} from "react-icons/fi";
import LandingEmployeeHeader from "../../../../layout/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../layout/employer/LandingEmployeeFooter";
import "./HiringAutomation.css";

const WORKFLOW = [
    { id: 1, icon: <FiFileText size={20} />, title: "Job Requisition", sub: "Auto-created from HRMS", status: "complete", color: "#10b981" },
    { id: 2, icon: <FiShare2 size={20} />, title: "Multi-board Posting", sub: "Published to 30+ boards", status: "complete", color: "#10b981" },
    { id: 3, icon: <FiCpu size={20} />, title: "AI Resume Screening", sub: "Scoring 1,240 applicants", status: "active", color: "#002366" },
    { id: 4, icon: <FiCalendar size={20} />, title: "Auto-Scheduling", sub: "Calendars synced", status: "pending", color: "#94a3b8" },
    { id: 5, icon: <FiMail size={20} />, title: "Offer Generation", sub: "Template ready", status: "pending", color: "#94a3b8" },
    { id: 6, icon: <FiAward size={20} />, title: "Onboarding Kick-off", sub: "Day-1 kit auto-sent", status: "pending", color: "#94a3b8" },
];
const WF_DETAILS = [
    "When a new role opens in your HRMS, MavenJobs automatically drafts a job description, pre-fills requirements, and routes it for manager approval — in under 2 minutes.",
    "Your approved JD is pushed to MavenJobs, LinkedIn, Indeed, Naukri, and 26 other boards simultaneously. One click. Maximum reach.",
    "Our AI reads every resume, scores candidates against 60+ criteria, flags red/green signals, and ranks the top 10% to the front of your queue. Currently processing 1,240 applicants.",
    "Shortlisted candidates receive a branded invite and pick from your interviewers' real-time calendar slots. Average time from shortlist to scheduled: 4 minutes.",
    "Generate compliant, personalised offer letters with a single click. Pre-loaded with salary, benefits, and start date. Sent and tracked automatically.",
    "On day one, the new hire receives their equipment requests, system access checklist, and welcome kit — all triggered the moment they accept the offer.",
];
const METRICS = [
    { label: "Time saved per hire", val: "18h", change: "↓ 74%", color: "#002366", bg: "#EEF2FF" },
    { label: "Cost per hire", val: "₹8.2K", change: "↓ 61%", color: "#10b981", bg: "#ecfdf5" },
    { label: "Screening accuracy", val: "97.3%", change: "↑ from 71%", color: "#6366f1", bg: "#f5f3ff" },
    { label: "Avg. days to offer", val: "6.4d", change: "↓ from 28d", color: "#f59e0b", bg: "#fffbeb" },
];
const FEATURES = [
    { icon: <FiDatabase size={20} />, title: "AI-Powered CV Parsing", desc: "Extract structured data from any resume format. Skills, experience, education — all tagged and searchable in milliseconds.", color: "#002366", bg: "#EEF2FF" },
    { icon: <FiMail size={20} />, title: "Automated Candidate Comms", desc: "Personalised emails at every stage. Acknowledgements, rejections, interview invites — all sent on autopilot with your brand voice.", color: "#10b981", bg: "#ecfdf5" },
    { icon: <FiCalendar size={20} />, title: "Interview Scheduling Engine", desc: "Candidates self-schedule from real-time interviewer availability. No back-and-forth. Average booking time: 4 minutes.", color: "#6366f1", bg: "#f5f3ff" },
    { icon: <FiBarChart2 size={20} />, title: "Hiring Analytics & Reports", desc: "Pipeline health, funnel drop-off, diversity metrics, and time-to-hire — all in a single live dashboard your CFO will love.", color: "#f59e0b", bg: "#fffbeb" },
    { icon: <FiLink size={20} />, title: "40+ ATS / HRMS Integrations", desc: "Plug straight into Greenhouse, Workday, SAP, BambooHR, Zoho, and 35+ more. Your data flows, nothing breaks.", color: "#0ea5e9", bg: "#f0f9ff" },
    { icon: <FiShield size={20} />, title: "Compliance Automation", desc: "GDPR-compliant candidate data handling, auto-deletion schedules, and audit trails — so your legal team sleeps well.", color: "#10b981", bg: "#ecfdf5" },
];
const PLANS = [
    { name: "Scale", price: "₹24,999", desc: "For growing teams", feats: ["Up to 50 active roles", "AI screening + scoring", "Email automation", "Basic analytics", "Email support"] },
    { name: "Enterprise", price: "Custom", desc: "For large organisations", feats: ["Unlimited roles", "Full workflow automation", "Custom integrations", "Advanced analytics", "Dedicated CSM + SLA"], popular: true },
];

export default function HiringAutomation() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(3);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    const activeWf = WORKFLOW.find(s => s.id === activeStep) || WORKFLOW[0];

    return (
        <div className="ha-page-root">
            {/* ── NAV ── */}
            <LandingEmployeeHeader solid={true} />

                {/* ── HERO ── */}
                <section className="ha-hero-sec">
                    <div className="ha-hero-inner">
                        <div>
                            <div className="ha-tag" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#002366", color: "#10b981", borderRadius: 100, padding: "7px 16px", fontSize: 12, fontWeight: 800, marginBottom: 22, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: "var(--fd)" }}>
                                <FiCpu size={13} /> AI-Powered Hiring Automation
                            </div>
                            <h1 className="ha-hero-title">
                                {["Hire", "smarter."].map(w => <span key={w} className="ha-word" style={{ display: "inline-block", marginRight: "0.2em" }}>{w}</span>)}
                                <br />
                                {["Work", "less."].map(w => <span key={w} className="ha-word" style={{ display: "inline-block", marginRight: "0.2em", color: w === "less." ? "#002366" : "#0f172a" }}>{w}</span>)}
                                <br />
                                <span className="ha-word" style={{ display: "inline-block", position: "relative", marginRight: "0.1em" }}>
                                    <span>Hire faster</span>
                                    <span style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 4, background: "#10b981", borderRadius: 2 }} />
                                </span>
                                <span className="ha-word" style={{ display: "inline-block", color: "#10b981", marginLeft: "0.1em" }}>.</span>
                            </h1>
                            <p className="ha-sub ha-hero-sub">
                                Automate every step of recruitment — from posting to onboarding. Reduce time-to-hire by 74% and cost-per-hire by 61%.
                            </p>
                            <div className="ha-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                                <button
                                    className="ha-btn-primary"
                                    onClick={() => navigate("/recruit/client-registration-form")}
                                >
                                    Start Automating — Free
                                </button>
                                <button
                                    className="ha-btn-secondary"
                                    onClick={() => navigate("/recruit/client-registration-form")}
                                >
                                    Book a Demo
                                </button>
                            </div>
                        </div>

                        {/* Metric cards */}
                        <div className="ha-metrics-grid">
                            {METRICS.map((m, i) => (
                                <div key={i} className="ha-mcard" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,35,102,.06)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 6 }}>
                                        <div className="ha-mcard-val" style={{ fontFamily: "var(--fd)", fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>{m.val}</div>
                                        <span className="ha-mcard-change" style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 100, background: m.bg, color: m.color, fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>{m.change}</span>
                                    </div>
                                    <div className="ha-mcard-label" style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{m.label}</div>
                                    <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: `linear-gradient(90deg,${m.color},${m.bg})` }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── WORKFLOW ── */}
                <section className="ha-wf-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="ha-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.22)", padding: "5px 14px", borderRadius: 100 }}>✦ Automation Workflow</div>
                            <h2 className="ha-sec-title">Your entire pipeline,<br />on autopilot</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#10b981,#6ee7b7)", borderRadius: 3, margin: "0 auto" }} />
                        </div>

                        <div className="ha-wf-wrap">
                            {/* Steps list */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {WORKFLOW.map((s, i) => (
                                    <div key={s.id}>
                                        <div className="ha-wf ha-wf-row" onClick={() => setActiveStep(s.id)} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 16px", borderRadius: 14, cursor: "pointer", background: activeStep === s.id ? "rgba(255,255,255,.06)" : "transparent", transition: "all .2s" }}>
                                            {/* Icon */}
                                            <div className="ha-wf-row-icon" style={{ position: "relative", width: 50, height: 50, borderRadius: 14, background: s.status === "complete" ? "rgba(16,185,129,.15)" : s.status === "active" ? "rgba(0,35,102,.5)" : "rgba(255,255,255,.05)", border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: s.status === "pending" ? "#94a3b8" : "#fff" }}>
                                                {s.icon}
                                                {s.status === "active" && <div className="ha-pulse" style={{ position: "absolute", inset: -5, borderRadius: 18, background: "rgba(16,185,129,.15)", zIndex: -1 }} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="ha-wf-row-title" style={{ fontSize: 15.5, fontWeight: 800, color: s.status === "pending" ? "rgba(255,255,255,.35)" : "#fff", marginBottom: 2, fontFamily: "var(--fd)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                                                <div className="ha-wf-row-sub" style={{ fontSize: 13, fontWeight: 500, color: s.status === "active" ? "#10b981" : "rgba(255,255,255,.38)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.sub}</div>
                                            </div>
                                            <div style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 9px", borderRadius: 100, fontSize: 10, fontWeight: 800, fontFamily: "var(--fd)", background: s.status === "complete" ? "rgba(16,185,129,.12)" : s.status === "active" ? "rgba(0,35,102,.6)" : "rgba(255,255,255,.06)", color: s.status === "complete" ? "#10b981" : s.status === "active" ? "#fff" : "rgba(255,255,255,.25)", border: s.status === "active" ? "1px solid rgba(16,185,129,.3)" : "1px solid transparent", textTransform: "uppercase", letterSpacing: ".08em", flexShrink: 0 }}>
                                                {s.status === "complete" ? "Done" : s.status === "active" ? "Running" : "Pending"}
                                            </div>
                                        </div>
                                        {i < WORKFLOW.length - 1 && <div className="ha-wf-line" style={{ width: 2, height: 18, background: "rgba(255,255,255,.06)", marginLeft: 41 }} />}
                                    </div>
                                ))}
                            </div>

                            {/* Detail panel */}
                            <div className="ha-detail-panel">
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${activeWf.color},#10b981)`, borderRadius: "24px 24px 0 0" }} />
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${activeWf.color}22`, border: `2px solid ${activeWf.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: activeWf.color, marginBottom: 20, fontSize: 24 }}>{activeWf.icon}</div>
                                <h3 style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>{activeWf.title}</h3>
                                <div style={{ width: 40, height: 3, background: activeWf.color, borderRadius: 2, marginBottom: 18 }} />
                                <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)", lineHeight: 1.78, marginBottom: 24 }}>{WF_DETAILS[activeStep - 1]}</p>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 12, background: `${activeWf.color}22`, border: `1px solid ${activeWf.color}44`, fontSize: 13, fontWeight: 700, color: activeWf.color, fontFamily: "var(--fd)" }}>
                                    {activeWf.status === "complete" ? <><FiCheckCircle size={14} /> Complete</> : activeWf.status === "active" ? <><FiZap size={14} /> Running Now</> : <><FiClock size={14} /> Pending</>}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FEATURES ── */}
                <section className="ha-feats ha-feats-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="ha-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ Platform Features</div>
                            <h2 className="ha-sec-title" style={{ color: "#0f172a" }}>Every tool your recruiters<br />never knew they needed</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto 16px" }} />
                            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>Purpose-built automation that works with your existing stack — not against it.</p>
                        </div>
                        <div className="ha-feats-grid">
                            {FEATURES.map((f, i) => (
                                <div key={i} className="ha-fc" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 22, padding: "32px 28px", transition: "all .25s" }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: f.bg, border: `1px solid ${f.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 20 }}>{f.icon}</div>
                                    <h3 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.72 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PLANS ── */}
                <section className="ha-plans ha-plans-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="ha-sec-header">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ Pricing</div>
                            <h2 className="ha-sec-title" style={{ color: "#0f172a" }}>Choose your level<br />of automation</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto" }} />
                        </div>
                        <div className="ha-plans-grid">
                            {PLANS.map((p, i) => (
                                <div key={i} className="ha-plan" style={{ position: "relative", padding: "36px 32px", background: p.popular ? "linear-gradient(135deg,#002366,#003da8)" : "#f8fafc", border: p.popular ? "none" : "1.5px solid #e2e8f0", borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden", transition: "all .28s" }}>
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.popular ? "linear-gradient(90deg,#10b981,#6ee7b7)" : "linear-gradient(90deg,#002366,#10b981)" }} />
                                    {p.popular && <div style={{ position: "absolute", top: 16, right: 16, background: "#10b981", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: "var(--fd)" }}>Enterprise</div>}
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800, color: p.popular ? "#fff" : "#0f172a", marginBottom: 6 }}>{p.name}</div>
                                    <div className="ha-plan-price" style={{ fontFamily: "var(--fd)", fontSize: 40, fontWeight: 800, color: p.popular ? "#10b981" : "#002366", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{p.price}</div>
                                    <div style={{ fontSize: 13.5, color: p.popular ? "rgba(255,255,255,.5)" : "#94a3b8", marginBottom: 22 }}>{p.desc}</div>
                                    <div style={{ height: 1, background: p.popular ? "rgba(255,255,255,.1)" : "#e2e8f0", marginBottom: 20 }} />
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                                        {p.feats.map((f, j) => (
                                            <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: p.popular ? "rgba(255,255,255,.8)" : "#334155", fontWeight: 500 }}>
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
                                        onClick={() => navigate(p.popular ? "/recruit/client-registration-form" : "/buy-online")}
                                    >
                                        {p.popular ? "Contact Sales" : "Start Free Trial"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="ha-cta-sec">
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div className="ha-cta-box">
                            <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                            <div style={{ position: "absolute", top: "50%", left: "8%", transform: "translateY(-50%)", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                                <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>
                                    Your next hire is<br /><span style={{ color: "#10b981" }}>already waiting.</span>
                                </h2>
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>Join 40,000+ companies using MavenJobs to automate their recruitment and hire 3× faster.</p>
                            </div>
                            <button
                                className="ha-cta-btn"
                                onClick={() => navigate("/recruit/client-registration-form")}
                            >
                                Start Free — No Credit Card <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <EmployerFooter />
            </div>
    );
}