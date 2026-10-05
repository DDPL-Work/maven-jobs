import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch, FiZap, FiMail, FiRefreshCw, FiBarChart2,
  FiShield, FiMapPin, FiBriefcase, FiCheckCircle,
  FiClock, FiUsers, FiTrendingUp, FiArrowRight, FiStar,
  FiLock, FiMessageSquare, FiCode, FiGrid, FiTool,
  FiEye, FiCalendar, FiCpu, FiX, FiDownload
} from "react-icons/fi";
import authService from "../../../../services/authService";
import CandidateResumeModal from "../../../../components/CandidateResumeModal";
import LandingEmployeeHeader from "../../../../layout/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../layout/employer/LandingEmployeeFooter";

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
  const navigate = useNavigate();

  const isEmployerLoggedIn = useMemo(() => {
    try { return !!localStorage.getItem("employerUser"); } catch { return false; }
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
        gsap.to(".rd-tc", { scrollTrigger: { trigger: ".rd-talent", start: "top 78%" }, opacity: 1, y: 0, stagger: 0.09, duration: 0.6 });
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
        .cta-green{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 30px;background:#10b981;color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fd);box-shadow:0 8px 24px rgba(16,185,129,.35);transition:all .25s;text-decoration:none}
        .cta-green:hover{background:#0da371;transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,185,129,.45)}
        .cta-navy{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;background:transparent;color:#002366;font-weight:800;font-size:14px;border-radius:100px;border:2px solid #002366;cursor:pointer;font-family:var(--fd);transition:all .25s;text-decoration:none}
        .cta-navy:hover{background:#002366;color:#fff}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}

        /* ── Core Layout & Responsive Classes ── */
        .rd-page-root {
          background: #f8fafc;
          color: #1e293b;
          overflow-x: hidden;
          width: 100%;
        }

        /* ── Hero Section ── */
        .rd-hero-sec {
          background: linear-gradient(135deg,#050e24 0%,#002366 58%,#1a0a4a 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 0 44px;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        .rd-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 110px 0 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .rd-hero-title {
          font-family: var(--fd);
          font-size: clamp(34px, 5.5vw, 72px);
          font-weight: 800;
          color: #fff;
          line-height: 1.05;
          letter-spacing: -0.04em;
          margin-bottom: 22px;
          max-width: 860px;
        }
        .rd-hero-sub {
          font-size: 17px;
          color: rgba(255,255,255,.55);
          line-height: 1.78;
          margin-bottom: 44px;
          max-width: 560px;
        }
        .rd-pool-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          max-width: 640px;
          width: 100%;
          margin-bottom: 26px;
        }
        .rd-pool-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
          cursor: default;
          transition: all .2s;
          box-sizing: border-box;
          min-width: 0;
        }
        .rd-pool-card:hover {
          background: rgba(255,255,255,.1);
          border-color: rgba(255,255,255,.18);
          transform: translateY(-2px);
        }
        .rd-trust-row {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .rd-trust-divider {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,.1);
        }

        /* ── Stats Section ── */
        .rd-stats-sec {
          background: linear-gradient(135deg,#050e24,#002366);
          padding: 60px 44px;
          width: 100%;
        }
        .rd-stats-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }
        .rd-stat-card {
          text-align: center;
          padding: 24px 20px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .rd-stat-num {
          font-family: var(--fd);
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          color: #10b981;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 6px;
        }

        /* ── Features Section ── */
        .rd-feats-sec {
          background: #fff;
          padding: 96px 44px;
          width: 100%;
        }
        .rd-sec-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .rd-sec-title {
          font-family: var(--fd);
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }
        .rd-feats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        /* ── Live Database Section ── */
        .rd-talent-sec {
          background: linear-gradient(135deg,#050e24,#001a52);
          padding: 96px 44px;
          width: 100%;
        }
        .rd-talent-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 40px;
        }
        .rd-talent-card {
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 24px 22px;
          cursor: pointer;
          transition: all .25s;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* ── Pro Section ── */
        .rd-pro-sec {
          background: linear-gradient(135deg,#050e24,#001a52);
          padding: 96px 44px;
          width: 100%;
        }
        .rd-pro-card {
          max-width: 480px;
          margin: 0 auto;
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(16,185,129,.25);
          border-radius: 24px;
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
          transition: all .3s;
          box-sizing: border-box;
        }
        .rd-pro-card:hover {
          border-color: rgba(16,185,129,.5);
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,.2);
        }

        /* ── CTA Banner Section ── */
        .rd-cta-sec {
          background: linear-gradient(135deg,#f0f4fb,#e8f0fe);
          padding: 48px 44px 88px;
          width: 100%;
          box-sizing: border-box;
        }
        .rd-cta-box {
          background: linear-gradient(135deg,#050e24,#002366);
          border-radius: 28px;
          padding: 72px 64px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
          box-sizing: border-box;
        }
        .rd-cta-btn {
          position: relative;
          z-index: 1;
          padding: 16px 38px;
          border-radius: 100px;
          border: none;
          background: #10b981;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          font-family: var(--fd);
          box-shadow: 0 8px 28px rgba(16,185,129,.35);
          transition: all .25s;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .rd-cta-btn:hover {
          background: #0da371;
          transform: translateY(-2px);
        }

        /* ── Footer ── */
        .rd-footer {
          background: #050e24;
          border-top: 1px solid rgba(255,255,255,.05);
          padding: 28px 44px;
          width: 100%;
        }

        /* ══════════════════════════════════════════════════════════
           RESPONSIVE BREAKPOINTS
           ══════════════════════════════════════════════════════════ */

        /* ── Tablet / Small Laptop (max-width: 1024px) ── */
        @media (max-width: 1024px) {
          .rd-hero-sec {
            padding: 0 32px;
          }
          .rd-hero-inner {
            padding: 95px 0 60px;
          }
          .rd-pool-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 580px;
            gap: 12px;
          }
          .rd-stats-sec {
            padding: 50px 32px;
          }
          .rd-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
            max-width: 680px;
          }
          .rd-feats-sec, .rd-talent-sec, .rd-pro-sec {
            padding: 72px 32px;
          }
          .rd-feats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .rd-talent-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .rd-cta-sec {
            padding: 40px 32px 72px;
          }
          .rd-cta-box {
            padding: 54px 40px;
            gap: 32px;
          }
          .rd-footer {
            padding: 28px 32px;
          }
        }

        /* ── Mobile Landscape & Tablets (max-width: 768px) ── */
        @media (max-width: 768px) {
          .rd-hero-sec {
            min-height: auto;
            padding: 0 20px;
          }
          .rd-hero-inner {
            padding: 85px 0 48px;
          }
          .rd-hero-title {
            font-size: clamp(28px, 7vw, 42px);
            margin-bottom: 16px;
          }
          .rd-hero-sub {
            font-size: 15px;
            line-height: 1.65;
            margin-bottom: 28px;
          }
          .rd-pool-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            max-width: 100%;
            margin-bottom: 22px;
          }
          .rd-pool-card {
            padding: 12px 14px;
            gap: 10px;
          }
          .rd-trust-row {
            gap: 14px;
          }
          .rd-trust-divider {
            display: none;
          }
          .rd-stats-sec {
            padding: 40px 20px;
          }
          .rd-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .rd-stat-card {
            padding: 18px 12px;
            border-radius: 14px;
          }
          .rd-stat-num {
            font-size: 32px;
          }
          .rd-feats-sec, .rd-talent-sec, .rd-pro-sec {
            padding: 56px 20px;
          }
          .rd-sec-header {
            margin-bottom: 36px;
          }
          .rd-sec-title {
            font-size: clamp(24px, 6vw, 34px);
          }
          .rd-feats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .rd-talent-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .rd-talent-card {
            padding: 20px 18px;
            border-radius: 16px;
          }
          .rd-pro-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
          .rd-cta-sec {
            padding: 24px 20px 56px;
          }
          .rd-cta-box {
            padding: 40px 24px;
            border-radius: 22px;
            flex-direction: column;
            align-items: stretch;
            text-align: left;
            gap: 24px;
          }
          .rd-cta-btn {
            width: 100%;
            padding: 15px 24px;
            font-size: 14.5px;
          }
          .rd-footer {
            padding: 24px 20px;
          }
          .rd-footer-inner {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }
        }

        /* ── Small Mobile (max-width: 480px) ── */
        @media (max-width: 480px) {
          .rd-hero-sec {
            padding: 0 16px;
          }
          .rd-hero-inner {
            padding: 75px 0 40px;
          }
          .rd-tag {
            font-size: 10px !important;
            padding: 5px 12px !important;
            margin-bottom: 18px !important;
            white-space: normal !important;
            text-align: center;
          }
          .rd-hero-title {
            font-size: 27px;
            line-height: 1.12;
          }
          .rd-hero-sub {
            font-size: 14px;
            line-height: 1.6;
          }
          .rd-pool-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px;
            max-width: 100%;
          }
          .rd-pool-card {
            padding: 10px 10px !important;
            gap: 8px !important;
            border-radius: 12px !important;
          }
          .rd-pool-icon {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
          }
          .rd-pool-title {
            font-size: 12.5px !important;
          }
          .rd-pool-sub {
            font-size: 10.5px !important;
          }
          .rd-trust-row {
            flex-direction: column;
            gap: 10px;
          }
          .rd-stats-sec {
            padding: 32px 14px;
          }
          .rd-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .rd-stat-card {
            padding: 14px 8px;
          }
          .rd-stat-num {
            font-size: 26px;
          }
          .rd-stat-card div:last-child {
            font-size: 11px !important;
          }
          .rd-feats-sec, .rd-talent-sec, .rd-pro-sec {
            padding: 44px 16px;
          }
          .rd-fc {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .rd-fc h3 {
            font-size: 17px !important;
          }
          .rd-fc p {
            font-size: 13.5px !important;
          }
          .rd-talent-card {
            padding: 16px 14px !important;
          }
          .rd-pro-card {
            padding: 24px 16px !important;
            border-radius: 16px !important;
          }
          .rd-cta-sec {
            padding: 16px 14px 44px;
          }
          .rd-cta-box {
            padding: 32px 18px;
            border-radius: 18px;
          }
          .rd-cta-box h2 {
            font-size: 23px !important;
          }
          .rd-cta-box p {
            font-size: 13.5px !important;
          }
        }

        /* ── Extra narrow devices (max-width: 340px) ── */
        @media (max-width: 340px) {
          .rd-pool-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px;
          }
          .rd-pool-card {
            padding: 8px 6px !important;
            gap: 6px !important;
          }
          .rd-pool-icon {
            width: 26px !important;
            height: 26px !important;
          }
          .rd-pool-title {
            font-size: 11px !important;
          }
          .rd-pool-sub {
            font-size: 9.5px !important;
          }
          .rd-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="rd-page-root">

        {/* ── NAV ── */}
        <LandingEmployeeHeader />

        {/* ── HERO ── */}
        <section className="rd-hero-sec">
          <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "26px 26px" }} />
          <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-18%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.16) 0%,transparent 65%)", pointerEvents: "none" }} />

          <div className="rd-hero-inner">
            <div className="rd-tag" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.28)", color: "#6ee7b7", fontSize: 10.5, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, marginBottom: 26, fontFamily: "var(--fd)", backdropFilter: "blur(8px)" }}>
              <div style={{ position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} /><div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: "#10b981", animation: "ping 1.5s infinite" }} /></div>
              India's Largest Verified Profile Database
            </div>

            <h1 className="rd-hero-title">
              {["Find", "the", "right", "talent,"].map(w => <span key={w} className="rd-word" style={{ display: "inline-block", marginRight: "0.18em" }}>{w}</span>)}
              <br />
              <span className="rd-word" style={{ display: "inline-block", color: "#10b981", marginRight: "0.18em" }}>before</span>
              <span className="rd-word" style={{ display: "inline-block", marginRight: "0.18em" }}>they</span>
              <span className="rd-word" style={{ display: "inline-block" }}>apply.</span>
            </h1>

            <p className="rd-sub rd-hero-sub">
              Access 10 crore+ verified, actively-looking professionals across every role, city, and skill set in India.
            </p>

            {/* Talent Pool Quick Access */}
            <div className="rd-pool rd-pool-grid">
              {[
                { label: "Engineering", sub: "3.2M profiles", icon: <FiCode size={18} />, color: "#10b981" },
                { label: "Design", sub: "1.1M profiles", icon: <FiGrid size={18} />, color: "#6366f1" },
                { label: "Data & AI", sub: "980K profiles", icon: <FiCpu size={18} />, color: "#f59e0b" },
                { label: "Product", sub: "740K profiles", icon: <FiTrendingUp size={18} />, color: "#ec4899" },
                { label: "Marketing", sub: "620K profiles", icon: <FiBarChart2 size={18} />, color: "#06b6d4" },
                { label: "Operations", sub: "510K profiles", icon: <FiTool size={18} />, color: "#8b5cf6" },
              ].map((pool, i) => (
                <div key={i} className="rd-pool-card">
                  <div className="rd-pool-icon" style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: pool.color }}>{pool.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="rd-pool-title" style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "var(--fd)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pool.label}</div>
                    <div className="rd-pool-sub" style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pool.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust row */}
            <div className="rd-trust rd-trust-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {["#002366", "#10b981", "#6366f1", "#f59e0b", "#ec4899"].map((c, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid rgba(255,255,255,.15)", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>{["M", "K", "P", "R", "S"][i]}</div>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>Trusted by <strong style={{ color: "#10b981" }}>50,000+</strong> recruiters</span>
              </div>
              <div className="rd-trust-divider" />
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}><FiCheckCircle size={14} color="#10b981" /> <strong style={{ color: "#10b981" }}>98%</strong> response rate</div>
              <div className="rd-trust-divider" />
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,.5)", fontWeight: 600 }}><FiShield size={14} color="#10b981" /> All profiles verified</div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="rd-stats rd-stats-sec">
          <div className="rd-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="rd-stat rd-stat-card">
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", margin: "0 auto 14px" }}>{s.icon}</div>
                <div className="rd-stat-num">{s.val}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="rd-feats rd-feats-sec">
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="rd-sec-header">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#10b981", marginBottom: 12, fontFamily: "var(--fd)" }}>✦ What You Get</div>
              <h2 className="rd-sec-title">Everything you need to find<br />and win top talent</h2>
              <div style={{ width: 44, height: 3, background: "linear-gradient(90deg,#002366,#10b981)", borderRadius: 3, margin: "0 auto 16px" }} />
              <p style={{ fontSize: 16, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>Tools built for speed, precision, and confidentiality — because great candidates don't wait.</p>
            </div>
            <div className="rd-feats-grid">
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

        {/* ── CTA ── */}
        <section className="rd-cta-sec">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="rd-cta-box">
              <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
              <div style={{ position: "absolute", top: "50%", left: "10%", transform: "translateY(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                <h2 style={{ fontFamily: "var(--fd)", fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.1 }}>
                  Stop waiting for<br /><span style={{ color: "#10b981" }}>candidates to find you.</span>
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.72 }}>Access India's freshest talent pool. Start searching with a free trial — no credit card needed.</p>
              </div>
              <button
                className="rd-cta-btn"
                onClick={() => navigate("/recruit/client-registration-form")}
              >
                Start Free Access Now <FiArrowRight size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <EmployerFooter />
      </div>

      {/* ── ALL PROFILES TABLE MODAL (Pro) ── */}
      {showAllProfiles && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,10,30,.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }} onClick={() => setShowAllProfiles(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%",
            maxWidth: 960, maxHeight: "85vh", overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,.3)",
            display: "flex", flexDirection: "column",
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
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
            <div style={{ overflow: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
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
              padding: "14px 20px", borderTop: "1px solid #e2e8f0",
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

    </>
  );
}