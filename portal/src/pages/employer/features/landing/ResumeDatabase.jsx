import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    FiSearch, FiZap, FiMail, FiRefreshCw, FiBarChart2,
    FiShield, FiMapPin, FiBriefcase, FiCheckCircle,
    FiClock, FiUsers, FiTrendingUp, FiArrowRight, FiStar,
    FiLock, FiMessageSquare, FiCode, FiGrid, FiTool,
    FiEye, FiCalendar, FiCpu, FiX, FiDownload
} from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import authService from "../../../../services/authService";
import CandidateResumeModal from "../../../../components/CandidateResumeModal";
import UnlockDatabaseModal from "../../../../components/UnlockDatabaseModal";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";

const AVATAR_COLORS = ["#002366", "#0D9488", "#7C3AED", "#DC2626", "#B45309", "#065F46", "#2563EB", "#9333EA", "#0891B2", "#BE123C"];
const getInitials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(p => p[0] || "").join("").toUpperCase() || "C";
const getAvatarColor = (name = "") => AVATAR_COLORS[name.length % AVATAR_COLORS.length];

const TALENT = [
    { id: "t1", name: "Kavya Sharma", role: "Senior Product Designer", loc: "Bengaluru", exp: "7 yrs", avail: "Immediately", skills: ["Figma", "Prototyping", "UX Research"], match: 97, initials: "KS", color: "#002366" },
    { id: "t2", name: "Arjun Mehta", role: "Full Stack Engineer", loc: "Mumbai", exp: "5 yrs", avail: "2 weeks", skills: ["React", "Node.js", "AWS"], match: 93, initials: "AM", color: "#0D9488" },
    { id: "t3", name: "Sneha Pillai", role: "Data Scientist", loc: "Hyderabad", exp: "4 yrs", avail: "1 month", skills: ["Python", "ML", "SQL"], match: 89, initials: "SP", color: "#7C3AED" },
    { id: "t4", name: "Rohit Nair", role: "DevOps Engineer", loc: "Pune", exp: "6 yrs", avail: "Immediately", skills: ["AWS", "Docker", "K8s"], match: 85, initials: "RN", color: "#DC2626" },
    { id: "t5", name: "Priya Anand", role: "Product Manager", loc: "Delhi NCR", exp: "8 yrs", avail: "3 weeks", skills: ["Agile", "Roadmapping", "Analytics"], match: 91, initials: "PA", color: "#B45309" },
    { id: "t6", name: "Kiran Rao", role: "iOS Developer", loc: "Chennai", exp: "3 yrs", avail: "Immediately", skills: ["Swift", "Xcode", "CoreData"], match: 78, initials: "KR", color: "#065F46" },
];
const FEATURES = [
    { icon: <FiZap size={22} />, title: "AI-Powered Matching", desc: "Proprietary AI scores each profile against your job requirements, surfacing the top 5% instantly.", color: "#002366", bg: "#EEF2FF" },
    { icon: <FiSearch size={22} />, title: "250+ Search Filters", desc: "Filter by skills, location, salary, notice period, education, and 240+ more parameters.", color: "#10b981", bg: "#ecfdf5" },
    { icon: <FiMail size={22} />, title: "Direct Outreach", desc: "Message candidates directly without revealing your company — maintain confidentiality throughout hiring.", color: "#6366f1", bg: "#f5f3ff" },
    { icon: <FiRefreshCw size={22} />, title: "Real-time Updates", desc: "Profiles updated daily. You see candidates actively looking right now, not 6 months ago.", color: "#f59e0b", bg: "#fffbeb" },
    { icon: <FiBarChart2 size={22} />, title: "Talent Analytics", desc: "Benchmark compensation, understand skill availability in your city, and plan hiring quarters ahead.", color: "#0ea5e9", bg: "#f0f9ff" },
    { icon: <FiShield size={22} />, title: "Verified Profiles", desc: "Every candidate is email + phone verified. Employment history cross-checked via our partner network.", color: "#10b981", bg: "#ecfdf5" },
];
const STATS = [
    { val: "10Cr+", label: "Verified Profiles", icon: <FiUsers size={20} /> },
    { val: "250+", label: "Search Filters", icon: <FiSearch size={20} /> },
    { val: "72h", label: "Avg. Time to Shortlist", icon: <FiClock size={20} /> },
    { val: "3.2M", label: "Profiles Updated Weekly", icon: <FiRefreshCw size={20} /> },
];

export default function ResumeDatabase() {
    const [scrolled, setScrolled] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicCandidates, setDynamicCandidates] = useState(null);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [employerPlan, setEmployerPlan] = useState("");
    const [chatCandidate, setChatCandidate] = useState(null);
    const [showAllProfiles, setShowAllProfiles] = useState(false);

    const isEmployerLoggedIn = useMemo(() => {
        try { return !!localStorage.getItem("employerToken"); } catch { return false; }
    }, []);

    const isProMember = useMemo(() => employerPlan.toLowerCase().includes("pro"), [employerPlan]);

    const handleCandidateChat = (candidate) => {
        if (isProMember) {
            setChatCandidate(candidate);
        } else {
            setIsUnlockOpen(true);
        }
    };

    const displayedTalent = useMemo(() => {
        if (dynamicCandidates) return dynamicCandidates;
        return TALENT;
    }, [dynamicCandidates]);

    useEffect(() => {
        if (!isEmployerLoggedIn) {
            setLoading(false);
            return;
        }
        const fetchApplicants = async () => {
            setCandidatesLoading(true);
            try {
                const [resp, profileResp] = await Promise.all([
                    authService.getEmployerApplications(),
                    authService.getEmployerProfile().catch(() => null),
                ]);
                const items = resp?.data?.items || [];
                const plan = profileResp?.data?.company?.packageType || profileResp?.data?.packageType || "";
                setEmployerPlan(plan);
                const mapped = items.map((app, i) => ({
                    id: app.candidateId || i,
                    name: app.candidateName || "Candidate",
                    email: app.candidateEmail || "",
                    role: app.candidateCurrentTitle || "Applicant",
                    loc: [app.candidateCity, app.candidateState].filter(Boolean).join(", ") || "India",
                    exp: app.candidateExperience ? `${app.candidateExperience} yrs` : "N/A",
                    avail: "Applied",
                    skills: app.jobTitle ? [app.jobTitle] : ["Job Applicant"],
                    jobTitle: app.jobTitle || "",
                    appliedAt: app.appliedAt || app.createdAt || null,
                    status: app.status || "APPLIED",
                    match: 85 + (i % 11),
                    initials: getInitials(app.candidateName),
                    color: getAvatarColor(app.candidateName),
                    answers: app.answers || app.screeningAnswers || [],
                }));
                setDynamicCandidates(mapped);
            } catch {
                setDynamicCandidates(null);
            } finally {
                setCandidatesLoading(false);
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [isEmployerLoggedIn]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        (async () => {
            if (typeof window.gsap !== "undefined") return;
            const loadScript = (src) => new Promise((resolve, reject) => {
                if (typeof window === 'undefined') return resolve();
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const s = document.createElement('script');
                s.src = src;
                s.async = true;
                s.onload = () => resolve();
                s.onerror = (e) => reject(e);
                document.head.appendChild(s);
            });

            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js');
                const { gsap } = window;
                const { ScrollTrigger } = window || {};
                if (!gsap) return;
                try { gsap.registerPlugin && gsap.registerPlugin(ScrollTrigger); } catch { }

                gsap.timeline({ defaults: { ease: "power3.out" } })
                    .to(".rd-tag", { opacity: 1, y: 0, duration: 0.6 })
                    .to(".rd-word", { opacity: 1, y: 0, stagger: 0.07, duration: 0.85 }, "-=0.2")
                    .to(".rd-sub", { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
                    .to(".rd-pool", { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.55 }, "-=0.25")
                    .to(".rd-trust", { opacity: 1, y: 0, duration: 0.45 }, "-=0.15");

                gsap.to(".rd-stat", { scrollTrigger: { trigger: ".rd-stats", start: "top 80%" }, opacity: 1, y: 0, stagger: 0.12, duration: 0.7 });
                gsap.to(".rd-fc", { scrollTrigger: { trigger: ".rd-feats", start: "top 78%" }, opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "back.out(1.2)" });
                gsap.to(".rd-tc", { scrollTrigger: { trigger: ".rd-talent", start: "top 78%" }, opacity: 1, x: 0, stagger: 0.09, duration: 0.6 });
            } catch (err) {
                // ignore
            }
        })();
        return () => { window.removeEventListener("scroll", onScroll); };
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#002366;--green:#10b981;--fd:'Bricolage Grotesque',sans-serif}
        body{font-family:'DM Sans',system-ui,sans-serif}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes rdFadeIn{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
        .rd-tag,.rd-word,.rd-sub,.rd-pool,.rd-trust{animation:rdFadeIn .8s ease forwards}
        .rd-tag{animation-delay:0s}.rd-word{animation-delay:.12s}.rd-sub{animation-delay:.3s}.rd-pool{animation-delay:.45s}.rd-trust{animation-delay:.7s}
        .rd-stat,.rd-fc{opacity:0;animation:rdFadeIn .7s ease forwards}
        .rd-stat{animation-delay:.3s}.rd-fc{animation-delay:.5s}
        .rd-tc:hover{transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,35,102,.12)!important;border-color:rgba(0,35,102,.2)!important}
        .rd-fc:hover{transform:translateY(-4px)!important;box-shadow:0 14px 36px rgba(0,35,102,.08)!important;border-color:rgba(0,35,102,.15)!important}
        .cta-green{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;background:#10b981;color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fd);box-shadow:0 8px 24px rgba(16,185,129,.35);transition:all .25s}
        .cta-green:hover{background:#0da371;transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,185,129,.45)}
        .cta-navy{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:transparent;color:#002366;font-weight:800;font-size:14px;border-radius:100px;border:2px solid #002366;cursor:pointer;font-family:var(--fd);transition:all .25s}
        .cta-navy:hover{background:#002366;color:#fff}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
      `}</style>

            <div style={{ background: "#f8fafc", color: "#1e293b", overflowX: "hidden" }}>

                {/* ── NAV ── */}
               <LandingEmployeeHeader />

                {/* ── HERO ── */}
                <section style={{ background: "linear-gradient(135deg,#050e24 0%,#002366 58%,#1a0a4a 100%)", minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 44px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "26px 26px" }} />
                    <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 65%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "-18%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.16) 0%,transparent 65%)", pointerEvents: "none" }} />

                    <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "110px 0 80px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 2 }}>
                        <div className="rd-tag" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.28)", color: "#6ee7b7", fontSize: 10.5, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 26, fontFamily: "var(--fd)", backdropFilter: "blur(8px)" }}>
                            <div style={{ position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} /><div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "#10b981", animation: "ping 1.5s infinite" }} /></div>
                            India's Largest Verified Profile Database
                        </div>

                        <h1 style={{ fontFamily: "var(--fd)", fontSize: "clamp(40px,5.5vw,72px)", fontWeight: 800, color: "#fff", lineHeight: 1.04, letterSpacing: "-0.04em", marginBottom: 22, maxWidth: 860 }}>
                            {["Find", "the", "right", "talent,"].map(w => <span key={w} className="rd-word" style={{ display: "inline-block", marginRight: "0.18em" }}>{w}</span>)}
                            <br />
                            <span className="rd-word" style={{ display: "inline-block", color: "#10b981", marginRight: "0.18em" }}>before</span>
                            <span className="rd-word" style={{ display: "inline-block", marginRight: "0.18em" }}>they</span>
                            <span className="rd-word" style={{ display: "inline-block" }}>apply.</span>
                        </h1>

                        <p className="rd-sub" style={{ fontSize: 17, color: "rgba(255,255,255,.55)", lineHeight: 1.78, marginBottom: 44, maxWidth: 560 }}>
                            Access 10 crore+ verified, actively-looking professionals across every role, city, and skill set in India.
                        </p>

                        {/* Talent Pool Quick Access */}
                        <div className="rd-pool" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 720, width: "100%", marginBottom: 26 }}>
                            {[
                                { label: "Engineering", sub: "3.2M profiles", icon: <FiCode size={18} />, color: "#10b981" },
                                { label: "Design", sub: "1.1M profiles", icon: <FiGrid size={18} />, color: "#6366f1" },
                                { label: "Data & AI", sub: "980K profiles", icon: <FiCpu size={18} />, color: "#f59e0b" },
                                { label: "Product", sub: "740K profiles", icon: <FiTrendingUp size={18} />, color: "#ec4899" },
                                { label: "Marketing", sub: "620K profiles", icon: <FiBarChart2 size={18} />, color: "#06b6d4" },
                                { label: "Operations", sub: "510K profiles", icon: <FiTool size={18} />, color: "#8b5cf6" },
                            ].map((pool, i) => (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "14px 16px", borderRadius: 14,
                                    background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
                                    cursor: "default", transition: "all .2s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: pool.color }}>{pool.icon}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "var(--fd)" }}>{pool.label}</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>{pool.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust row */}
                        <div className="rd-trust" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ display: "flex" }}>
                                    {["#002366", "#10b981", "#6366f1", "#f59e0b", "#ec4899"].map((c, i) => (
                                        <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid rgba(255,255,255,.15)", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>{["M", "K", "P", "R", "S"][i]}</div>
                                    ))}
                                </div>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>Trusted by <strong style={{ color: "#10b981" }}>50,000+</strong> recruiters</span>
                            </div>
                            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.1)" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}><FiCheckCircle size={14} color="#10b981" /> <strong style={{ color: "#10b981" }}>98%</strong> response rate</div>
                            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.1)" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}><FiShield size={14} color="#10b981" /> All profiles verified</div>
                        </div>
                    </div>
                </section>

                {/* ── STATS ── */}
                <div className="rd-stats" style={{ background: "linear-gradient(135deg,#050e24,#002366)", padding: "60px 44px" }}>
                    <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28 }}>
                        {STATS.map((s, i) => (
                            <div key={i} className="rd-stat" style={{ textAlign: "center", padding: "24px 20px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", margin: "0 auto 14px" }}>{s.icon}</div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 800, color: "#10b981", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FEATURES ── */}
                <section className="rd-feats" style={{ background: "#fff", padding: "96px 44px" }}>
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 56 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ What You Get</div>
                            <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 12 }}>Everything you need to find<br />and win top talent</h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto 16px" }} />
                            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>Tools built for speed, precision, and confidentiality — because great candidates don't wait.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
                            {FEATURES.map((f, i) => (
                                <div key={i} className="rd-fc" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 22, padding: "32px 28px", transition: "all .25s" }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: f.bg, border: `1px solid ${f.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 20 }}>{f.icon}</div>
                                    <h3 style={{ fontFamily: "var(--fd)", fontSize: 19, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{f.title}</h3>
                                    <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.72 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── LIVE DATABASE ── */}
                <section className="rd-talent" style={{ background: "linear-gradient(135deg,#050e24,#001a52)", padding: "96px 44px" }}>
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div style={{ marginBottom: 48 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.22)", padding: "5px 14px", borderRadius: 100 }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} /> {isEmployerLoggedIn && dynamicCandidates ? "Your Applicants" : "Live Database Preview"}
                            </div>
                            <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
                                {isEmployerLoggedIn && dynamicCandidates ? "Candidates who applied" : "Profiles actively<br />searching right now"}
                            </h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#10b981,#6ee7b7)", borderRadius: 3, marginBottom: 14 }} />
                            {isEmployerLoggedIn && dynamicCandidates ? (
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", maxWidth: 520, lineHeight: 1.75 }}>
                                    Showing {dynamicCandidates.length} candidate{dynamicCandidates.length !== 1 ? "s" : ""} who applied to your jobs.
                                </p>
                            ) : !isEmployerLoggedIn ? (
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", maxWidth: 520, lineHeight: 1.75 }}>
                                    A live snapshot of talent available today. Unlock full access to contact details and connect directly.
                                </p>
                            ) : candidatesLoading ? (
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", maxWidth: 520, lineHeight: 1.75 }}>Loading your applicants…</p>
                            ) : null}
                        </div>

                        {!isEmployerLoggedIn && (
                            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, marginBottom: 40 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#10b981" }}>
                                    <FiLock size={26} />
                                </div>
                                <h3 style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>See who applied to your jobs</h3>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.7 }}>
                                    Log in to view candidates who applied to your company's job postings — with profile details, experience, and contact information.
                                </p>
                                <button onClick={() => window.location.href = "/employer-login"}
                                    style={{ padding: "13px 32px", borderRadius: 100, border: "none", background: "#10b981", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "var(--fd)", boxShadow: "0 6px 20px rgba(16,185,129,.3)", transition: "all .2s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#0da371"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#10b981"}>
                                    Check Your Candidates — Login <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                                </button>
                            </div>
                        )}

                        {isEmployerLoggedIn && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 40 }}>
                                    {displayedTalent.slice(0, 3).length > 0 ? displayedTalent.slice(0, 3).map((t, i) => (
                                        <div key={t.id || i} className="rd-tc" style={{ background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "24px 22px", cursor: "pointer", transition: "all .25s" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2 }}>{t.name}</div>
                                                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)" }}>{t.role}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                                                {[[<FiMapPin size={12} />, t.loc], [<FiBriefcase size={12} />, t.exp], [<FiCheckCircle size={12} />, t.avail]].map(([ic, txt], j) => (
                                                    <span key={j} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 500 }}>{ic}{txt}</span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                                {t.skills.map((sk) => <span key={sk} style={{ fontSize: 11.5, fontWeight: 700, background: "rgba(16,185,129,.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,.2)", borderRadius: 6, padding: "3px 9px" }}>{sk}</span>)}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#10b981" }}><FiZap size={12} fill="#10b981" />{t.match}% match</span>
                                                <button onClick={() => handleCandidateChat(t)}
                                                    aria-label={`Message ${t.name}`}
                                                    title={isProMember ? `Message ${t.name}` : "Upgrade to message candidates"}
                                                    style={{
                                                        width: 36, height: 36, borderRadius: 10, background: isProMember ? "rgba(16,185,129,.15)" : "rgba(255,255,255,.06)",
                                                        border: `1px solid ${isProMember ? "rgba(16,185,129,.3)" : "rgba(255,255,255,.1)"}`,
                                                        display: "flex", alignItems: "center",
                                                        justifyContent: "center", cursor: "pointer", color: isProMember ? "#10b981" : "rgba(255,255,255,.3)", flexShrink: 0,
                                                        transition: "all .2s"
                                                    }}
                                                    onMouseEnter={e => { if (isProMember) { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#fff" } }}
                                                    onMouseLeave={e => { if (isProMember) { e.currentTarget.style.background = "rgba(16,185,129,.15)"; e.currentTarget.style.color = "#10b981" } }}>
                                                    <FiMessageSquare size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                                            <div style={{ fontSize: 14, color: "rgba(255,255,255,.45)" }}>
                                                {candidatesLoading ? "Loading applicants…" : "No applicants yet. Post a job to start receiving applications."}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {displayedTalent.length > 0 && (
                                    <div style={{ textAlign: "center" }}>
                                        <button style={{ padding: "14px 34px", borderRadius: 100, border: "1.5px solid rgba(16,185,129,.4)", background: isProMember ? "rgba(16,185,129,.1)" : "transparent", color: "#10b981", fontWeight: 800, fontSize: 14.5, cursor: "pointer", fontFamily: "var(--fd)", transition: "all .2s" }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,.15)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isProMember ? "rgba(16,185,129,.1)" : "transparent" }}
                                            onClick={() => isProMember ? setShowAllProfiles(true) : setIsUnlockOpen(true)}>
                                            {isProMember ? "View All Applicants" : "Unlock Full Database Access"} <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {!isEmployerLoggedIn && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 40 }}>
                                    {displayedTalent.slice(0, 6).map((t, i) => (
                                        <div key={t.id} className="rd-tc" style={{ background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "24px 22px", cursor: "pointer", transition: "all .25s" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 14, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2 }}>{t.name}</div>
                                                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)" }}>{t.role}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                                                {[[<FiMapPin size={12} />, t.loc], [<FiBriefcase size={12} />, t.exp], [<FiCheckCircle size={12} />, t.avail]].map(([ic, txt], j) => (
                                                    <span key={j} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 500 }}>{ic}{txt}</span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                                {t.skills.map((sk) => <span key={sk} style={{ fontSize: 11.5, fontWeight: 700, background: "rgba(16,185,129,.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,.2)", borderRadius: 6, padding: "3px 9px" }}>{sk}</span>)}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#10b981" }}><FiZap size={12} fill="#10b981" />{t.match}% match</span>
                                                <button style={{ fontSize: 12.5, fontWeight: 700, background: "rgba(0,35,102,.5)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontFamily: "var(--fd)", transition: "all .2s" }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "#002366"; e.currentTarget.style.borderColor = "#002366" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,35,102,.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)" }}
                                                    onClick={() => setSelectedCandidate(t)}>
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <button style={{ padding: "14px 34px", borderRadius: 100, border: "1.5px solid rgba(16,185,129,.4)", background: "transparent", color: "#10b981", fontWeight: 800, fontSize: 14.5, cursor: "pointer", fontFamily: "var(--fd)", transition: "all .2s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,.1)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                        onClick={() => setIsUnlockOpen(true)}>
                                        Unlock Full Database Access <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* ── PRO PLAN ── */}
                <section style={{ background: "linear-gradient(135deg,#050e24,#001a52)", padding: "96px 44px" }}>
                    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 48 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.22)", padding: "5px 14px", borderRadius: 100 }}>
                                <FiZap size={12} /> Pro Plan
                            </div>
                            <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
                                Everything you need to hire faster
                            </h2>
                            <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#10b981,#6ee7b7)", borderRadius: 3, margin: "0 auto 16px" }} />
                            <p style={{ fontSize: 16, color: "rgba(255,255,255,.5)", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>
                                One plan. Full access. No hidden fees.
                            </p>
                        </div>

                        <div style={{
                            maxWidth: 480, margin: "0 auto",
                            background: "rgba(255,255,255,.04)", border: "1.5px solid rgba(16,185,129,.25)",
                            borderRadius: 24, padding: "40px 36px", position: "relative", overflow: "hidden",
                            transition: "all .3s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,.5)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,.2)" }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,.25)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#6ee7b7)" }} />
                            <div style={{ position: "absolute", top: -60, right: -60, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 65%)", pointerEvents: "none" }} />

                            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                                <span style={{ fontFamily: "var(--fd)", fontSize: 42, fontWeight: 800, color: "#10b981", letterSpacing: "-.03em" }}>Pro</span>
                            </div>
                            <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.6 }}>
                                Unlock full access to candidate profiles, chat with applicants, and manage your hiring pipeline with detailed insights.
                            </div>
                            <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 24 }} />

                            {[
                                { icon: <FiMessageSquare size={16} />, text: "Chat directly with candidates — no intermediaries" },
                                { icon: <FiUsers size={16} />, text: "View tabular data of who applied to which job" },
                                { icon: <FiMail size={16} />, text: "Access candidate email and contact details" },
                                { icon: <FiBarChart2 size={16} />, text: "Analytics dashboard with hiring funnel insights" },
                                { icon: <FiDownload size={16} />, text: "Export applicant data for your records" },
                                { icon: <FiShield size={16} />, text: "All profiles verified — email, phone & employment" },
                            ].map((f, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontSize: 14, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#10b981" }}>{f.icon}</div>
                                    {f.text}
                                </div>
                            ))}

                            <button onClick={() => setIsUnlockOpen(true)} style={{
                                marginTop: 28, width: "100%", padding: "14px",
                                background: "#10b981", color: "#fff", border: "none",
                                borderRadius: 12, fontSize: 15, fontWeight: 800,
                                cursor: "pointer", fontFamily: "var(--fd)",
                                boxShadow: "0 8px 24px rgba(16,185,129,.3)",
                                transition: "all .25s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#0da371"; e.currentTarget.style.transform = "translateY(-2px)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "translateY(0)" }}>
                                Upgrade to Pro <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section style={{ background: "linear-gradient(135deg,#f0f4fb,#e8f0fe)", padding: "48px 44px 88px" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <div style={{ background: "linear-gradient(135deg,#050e24,#002366)", borderRadius: 28, padding: "72px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
                            <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                            <div style={{ position: "absolute", top: "50%", left: "10%", transform: "translateY(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                                <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>
                                    Stop waiting for<br /><span style={{ color: "#10b981" }}>candidates to find you.</span>
                                </h2>
                                <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.72 }}>Access India's freshest talent pool. Start searching with a free trial — no credit card needed.</p>
                            </div>
                            <button style={{ position: "relative", zIndex: 1, padding: "16px 38px", borderRadius: 100, border: "none", background: "#10b981", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "var(--fd)", boxShadow: "0 8px 28px rgba(16,185,129,.35)", transition: "all .25s", flexShrink: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#0da371"; e.currentTarget.style.transform = "translateY(-2px)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "" }}
                                onClick={() => setIsUnlockOpen(true)}>
                                Start Free Access Now <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer style={{ background: "#050e24", borderTop: "1px solid rgba(255,255,255,.05)", padding: "28px 44px" }}>
                    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <img src={mavenLogo} alt="MavenJobs" style={{ height: 24, filter: "invert(1) brightness(2)", opacity: .6 }} />
                        <div style={{ display: "flex", gap: 24 }}>
                            {["Privacy", "Terms", "Support", "Sitemap"].map(l => <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,.35)", textDecoration: "none", fontWeight: 600, transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.35)"}>{l}</a>)}
                        </div>
                        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.25)" }}>© 2026 MavenJobs Private Limited. All rights reserved.</p>
                    </div>
                </footer>
            </div>

            {/* ── ALL PROFILES TABLE MODAL (Pro) ── */}
            {showAllProfiles && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 10000,
                    background: "rgba(0,10,30,.8)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "20px",
                }} onClick={() => setShowAllProfiles(false)}>
                    <div style={{
                        background: "#fff", borderRadius: 20, width: "100%",
                        maxWidth: 960, maxHeight: "85vh", overflow: "hidden",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,.3)",
                        display: "flex", flexDirection: "column",
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                        }}>
                            <div>
                                <h3 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>All Applicants</h3>
                                <p style={{ fontSize: 13, color: "#64748b" }}>{displayedTalent.length} candidate{displayedTalent.length !== 1 ? "s" : ""} who applied to your jobs</p>
                            </div>
                            <button onClick={() => setShowAllProfiles(false)} style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: "#f1f5f9", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#64748b", transition: "all .2s", flexShrink: 0,
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b" }}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div style={{ overflow: "auto", flex: 1 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                        {["Candidate", "Email", "Job Applied", "Applied On", "Status"].map(h => (
                                            <th key={h} style={{
                                                textAlign: "left", padding: "14px 16px",
                                                fontWeight: 700, color: "#475569", fontSize: 12,
                                                textTransform: "uppercase", letterSpacing: ".06em",
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedTalent.map((t, i) => (
                                        <tr key={t.id || i} style={{
                                            background: i % 2 === 0 ? "#fff" : "#fafafa",
                                            borderBottom: "1px solid #f1f5f9",
                                            transition: "background .15s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: t.color, display: "flex",
                                                        alignItems: "center", justifyContent: "center",
                                                        fontSize: 12, fontWeight: 800, color: "#fff",
                                                        flexShrink: 0,
                                                    }}>{t.initials}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                                                        <div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "#475569" }}>{t.email || "—"}</td>
                                            <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>{t.jobTitle || "—"}</td>
                                            <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                                                {t.appliedAt ? new Date(t.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span style={{
                                                    display: "inline-block", padding: "3px 10px",
                                                    borderRadius: 100, fontSize: 11, fontWeight: 700,
                                                    background: t.status === "APPLIED" ? "#eef2ff" :
                                                        t.status === "SHORTLISTED" ? "#ecfdf5" :
                                                            t.status === "REJECTED" ? "#fef2f2" : "#f8fafc",
                                                    color: t.status === "APPLIED" ? "#6366f1" :
                                                        t.status === "SHORTLISTED" ? "#10b981" :
                                                            t.status === "REJECTED" ? "#ef4444" : "#64748b",
                                                }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{
                            padding: "16px 24px", borderTop: "1px solid #e2e8f0",
                            display: "flex", justifyContent: "flex-end",
                        }}>
                            <button onClick={() => setShowAllProfiles(false)} style={{
                                padding: "10px 24px", borderRadius: 10, border: "none",
                                background: "#002366", color: "#fff", fontWeight: 700,
                                fontSize: 13, cursor: "pointer", fontFamily: "var(--fd)",
                            }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <CandidateResumeModal 
                isOpen={!!selectedCandidate} 
                onClose={() => setSelectedCandidate(null)} 
                candidate={selectedCandidate} 
            />
            <UnlockDatabaseModal
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
            />
        </>
    );
}