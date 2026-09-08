import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiZap,
  FiArrowRight,
  FiClock,
  FiUser,
  FiCalendar,
  FiShare2,
  FiBookmark,
  FiDownload,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiTrendingUp,
  FiCpu,
  FiMessageCircle,
  FiBarChart2,
  FiUsers,
  FiTarget,
  FiMail,
  FiBell,
  FiPhoneCall,
  FiInbox,
  FiPrinter,
  FiX,
  FiMenu,
} from "react-icons/fi";
import { FaWhatsapp, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";

const PremiumPromoCard = ({ className = "" }) => (
  <div
    className={className}
    style={{
      background: "linear-gradient(135deg,#050e24,#002366)",
      borderRadius: 18,
      padding: "24px",
      overflow: "hidden",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "-20%",
        right: "-20%",
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: "rgba(16,185,129,.2)",
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(16,185,129,.15)",
          border: "1px solid rgba(16,185,129,.3)",
          color: "#6ee7b7",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".15em",
          textTransform: "uppercase",
          padding: "5px 12px",
          borderRadius: 100,
          marginBottom: 14,
          fontFamily: "var(--fd)",
        }}
      >
        <FiZap size={10} fill="currentColor" /> Premium
      </div>
      <div
        style={{
          fontFamily: "var(--fd)",
          fontSize: 16,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        Hire India's Top 1% with MavenPremiumX
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,.5)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        AI-powered discovery for senior roles. 85%+ of India's premium talent in one place.
      </div>
      <Link
        to="/premium"
        style={{
          display: "block",
          textAlign: "center",
          padding: "10px",
          background: "#10b981",
          color: "#fff",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 800,
          textDecoration: "none",
          fontFamily: "var(--fd)",
          transition: "all .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0da371")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
      >
        Explore PremiumX →
      </Link>
    </div>
  </div>
);

import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader";

// ─── Section data ────────────────────────────────────────────
const STAGES = [
  {
    num: "01",
    title: "Understanding the Mandate",
    color: "#002366",
    bg: "#EEF2FF",
    accent: "#6366f1",
    icon: <FiTarget size={20} />,
    desc: "AI REX starts by going beyond basic inputs to truly understand the role — capturing not just job details, but the intent, context, and expectations behind the mandate.",
    steps: [
      {
        label: "Mandate Enhancement",
        desc: "Recruiters enter key details and AI REX shares sample candidate profiles for quick validation, calibrating the mandate in real time.",
      },
      {
        label: "Screening & JD Creation",
        desc: "AI REX automatically generates a structured, high-quality job description and a customizable pre-screening questionnaire — go live instantly.",
      },
    ],
  },
  {
    num: "02",
    title: "Multi-Channel Agentic Outreach",
    color: "#10b981",
    bg: "#ecfdf5",
    accent: "#10b981",
    icon: <FiMessageCircle size={20} />,
    desc: "AI REX moves from understanding to action — automating how candidates are discovered and engaged with speed and precision across every channel they use.",
    channels: [
      { icon: <FiBell size={16} />, label: "Notifications", color: "#f59e0b" },
      { icon: <FaWhatsapp size={16} />, label: "WhatsApp", color: "#10b981" },
      {
        icon: <FiPhoneCall size={16} />,
        label: "Automated Call",
        color: "#6366f1",
      },
      { icon: <FiMail size={16} />, label: "Email", color: "#002366" },
      { icon: <FiInbox size={16} />, label: "Naukri Inbox", color: "#ec4899" },
    ],
  },
  {
    num: "03",
    title: "AI-Screened Pipeline & Continuous Calibration",
    color: "#f59e0b",
    bg: "#fffbeb",
    accent: "#f59e0b",
    icon: <FiBarChart2 size={20} />,
    desc: "Every candidate response is evaluated by AI REX's screening agent — filtered by fit and relevance — so recruiters only review candidates who meet the bar.",
    outcomes: [
      "AI-screened applications filtered by fit",
      "Proactive AI recommendations from database",
      "Continuous calibration with every interaction",
      "Real-time pipeline visibility & insights",
    ],
  },
];

const STATS = [
  {
    val: "50%",
    label: "Reduction in time to shortlist candidates",
    icon: <FiClock size={18} />,
    color: "#6366f1",
    bg: "#EEF2FF",
  },
  {
    val: "3×",
    label: "More applications within 2 days of requirement creation",
    icon: <FiTrendingUp size={18} />,
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    val: "75%",
    label: "Reduction in recruiter effort put on sourcing",
    icon: <FiUsers size={18} />,
    color: "#f59e0b",
    bg: "#fffbeb",
  },
];

const RELATED = [
  {
    title: "MavenPremiumX: AI-Powered Premium Talent Discovery",
    excerpt:
      "Hiring premium talent is fundamentally different from hiring at scale. The pool is smaller, the candidates are harder to identify.",
    tag: "Premium Hiring",
    color: "#002366",
  },
  {
    title: "Why Multi-Channel Outreach Triples Recruiter Response Rates",
    excerpt:
      "Candidates are no longer exclusively on job boards. Learn how reaching talent on WhatsApp, email and calls changes everything.",
    tag: "Outreach",
    color: "#10b981",
  },
  {
    title: "The Future of AI in Recruitment: 2026 and Beyond",
    excerpt:
      "From agentic AI to continuous calibration, explore how intelligent systems are reshaping the modern hiring workflow.",
    tag: "AI & Future",
    color: "#6366f1",
  },
];

export default function BlogAIRex() {
  const [saved, setSaved] = useState(false);
  const [showPdfHint, setShowPdfHint] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const printRef = useRef(null);
  const statsScrollRef = useRef(null);

  // Initialize scroll position for infinite carousel
  useEffect(() => {
    if (statsScrollRef.current) {
      setTimeout(() => {
        if (statsScrollRef.current) {
          statsScrollRef.current.style.scrollBehavior = 'auto';
          statsScrollRef.current.scrollLeft = statsScrollRef.current.scrollWidth / 3;
          statsScrollRef.current.style.scrollBehavior = 'smooth';
        }
      }, 150);
    }
  }, []);

  const handleStatsScroll = (e) => {
    const el = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const blockWidth = scrollWidth / 3;
    
    if (scrollLeft <= 5) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = scrollLeft + blockWidth;
      el.style.scrollBehavior = "smooth";
    } else if (scrollLeft + clientWidth >= scrollWidth - 5) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = scrollLeft - blockWidth;
      el.style.scrollBehavior = "smooth";
    }
  };

  const scrollStats = (direction) => {
    if (statsScrollRef.current) {
      const { clientWidth } = statsScrollRef.current;
      statsScrollRef.current.scrollBy({ left: direction === "left" ? -clientWidth : clientWidth, behavior: "smooth" });
    }
  };

  const TOC_ITEMS = [
    ["#intro", "Introducing AI REX"],
    ["#stats", "Key Outcomes"],
    ["#how", "How AI REX Works"],
    ["#stage1", "Stage 1: Mandate"],
    ["#stage2", "Stage 2: Outreach"],
    ["#stage3", "Stage 3: Pipeline"],
    ["#post", "Post-Shortlist"],
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => {
    setShowPdfHint(true);
    setTimeout(() => {
      window.print();
      setShowPdfHint(false);
    }, 300);
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1e293b",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-padding-top: 90px; }
        :root {
          --navy: #002366; --navy-d: #001540;
          --green: #10b981; --gd: #0da371;
          --s50: #f8fafc; --s100: #f1f5f9; --s200: #e2e8f0;
          --s400: #94a3b8; --s500: #64748b; --s600: #475569; --s900: #0f172a;
          --fd: 'Bricolage Grotesque', sans-serif;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .blog-body { max-width: 100%; margin: 0; }
        .blog-h2 { font-family: var(--fd); font-size: clamp(22px,3vw,30px); font-weight: 800; color: var(--s900); letter-spacing: -0.03em; line-height: 1.15; margin: 48px 0 16px; }
        .blog-h3 { font-family: var(--fd); font-size: 18px; font-weight: 800; color: var(--navy); margin: 28px 0 10px; }
        .blog-p { font-size: 16px; color: #334155; line-height: 1.82; margin-bottom: 18px; }
        .blog-italic { font-style: italic; color: #334155; font-size: 16.5px; line-height: 1.82; }
        .stage-card { background: #fff; border: 1px solid var(--s200); border-radius: 20px; padding: 32px 36px; margin: 24px 0; position: relative; overflow: hidden; transition: box-shadow .25s; }
        .stage-card:hover { box-shadow: 0 12px 40px rgba(0,35,102,.08); }
        .channel-pill { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 100px; background: #f8fafc; border: 1.5px solid var(--s200); font-size: 13px; font-weight: 700; color: var(--s600); transition: all .2s; }
        .channel-pill:hover { border-color: var(--navy); color: var(--navy); background: #EEF2FF; }
        .outcome-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--s100); font-size: 14.5px; font-weight: 600; color: var(--s600); }
        .outcome-item:last-child { border-bottom: none; }
        .related-card { background: #fff; border: 1px solid var(--s200); border-radius: 18px; padding: 28px; transition: all .25s; cursor: pointer; }
        .related-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(0,35,102,.08); border-color: rgba(0,35,102,.15); }
        .mobile-only-stat { display: none !important; }
        .toc-link { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; font-size: 13.5px; font-weight: 600; color: var(--s600); text-decoration: none; transition: all .2s; }
        .toc-link:hover { background: #EEF2FF; color: var(--navy); }
        .share-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid var(--s200); background: #fff; cursor: pointer; color: var(--s500); transition: all .2s; }
        .share-btn:hover { background: var(--navy); border-color: var(--navy); color: #fff; }
        .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; border: 1.5px solid var(--s200); background: #fff; cursor: pointer; color: var(--s600); font-family: var(--fd); transition: all .2s; }
        .action-btn:hover { background: var(--navy); border-color: var(--navy); color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 35, 102, 0.15); }
        .pdf-btn { background: var(--navy); color: #fff; border-color: var(--navy); }
        .pdf-btn:hover { background: var(--navy-d) !important; }
        
        .hero-share-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .hero-share-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }

        /* ── Scroll Reveal ── */
        .reveal-on-scroll { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal-on-scroll.active { opacity: 1; transform: translateY(0); }

        /* ── Header / Navigation ── */
        .desktop-nav { display: flex; align-items: center; gap: 28px; }
        .mobile-menu-btn { display: none; background: transparent; border: none; font-size: 24px; color: var(--navy); cursor: pointer; }
        
        .mobile-sidebar { position: fixed; top: 0; right: -100%; width: 280px; height: 100vh; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 9999; padding: 32px 24px; transition: right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: -10px 0 40px rgba(0, 35, 102, 0.1); display: flex; flex-direction: column; }
        .mobile-sidebar.open { right: 0; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0, 35, 102, 0.4); z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        .mobile-overlay.open { opacity: 1; pointer-events: auto; }
        
        .mobile-nav-links { display: flex; flex-direction: column; gap: 24px; margin-top: 48px; }
        .mobile-nav-link { font-family: var(--fd); font-size: 18px; font-weight: 700; color: var(--navy); text-decoration: none; transition: color 0.2s; }
        .hero-author-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 32px; }
        .hero-divider { width: 1px; height: 32px; background: rgba(255,255,255,.12); }
        .hero-date-row { display: flex; align-items: center; gap: 16px; }

        /* ── Horizontal Carousels (Mobile) ── */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        
        .desktop-hidden { display: none; }
        .mobile-hidden { display: block; }
        
        .stat-strip { background: linear-gradient(135deg,#050e24,#002366); border-radius: 22px; padding: 32px 36px; margin: 36px 0; position: relative; overflow: hidden; }
        
        .stage-card-flex { display: flex; gap: 20px; align-items: flex-start; }
        .stage-num { font-family: var(--fd); font-size: 48px; font-weight: 800; color: #f1f5f9; line-height: 1; user-select: none; letter-spacing: -0.04em; }
        
        .closing-cta { padding: 36px 40px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; text-align: left; }
        .closing-cta-btn { width: auto; justify-content: center; }
        .author-card { padding: 28px 32px; display: flex; align-items: center; gap: 20px; }

        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 10px)); }
        }

        /* ── Mobile TOC Dropdown ── */
        .mobile-toc-container { display: none; margin-bottom: 32px; position: relative; z-index: 10; }
        .mobile-toc-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: var(--fd); font-weight: 700; font-size: 14px; color: var(--navy); cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .mobile-toc-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 8px 24px rgba(0, 35, 102, 0.08); }
        
        /* ── Mobile Carousel Nav Buttons ── */
        .mobile-carousel-btn { display: none; position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; align-items: center; justify-content: center; cursor: pointer; z-index: 10; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); transition: background 0.2s; }
        .mobile-carousel-btn:active { background: rgba(255,255,255,0.3); }
        .mobile-carousel-btn.left { left: 4px; }
        .mobile-carousel-btn.right { right: 4px; }

        @media (max-width: 1024px) {
          .blog-layout { grid-template-columns: 1fr 240px !important; gap: 32px !important; }
          .stats-grid { gap: 12px; }
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
          .blog-layout { grid-template-columns: 1fr !important; display: flex !important; flex-direction: column !important; min-width: 0; width: 100%; }
          .blog-layout > * { min-width: 0; width: 100%; }
          .stage-card { padding: 24px 20px !important; border-radius: 16px !important; }
          .stat-strip { padding: 32px 24px !important; margin: 24px 0 !important; }
          
          .desktop-hidden { display: block; }
          .mobile-hidden { display: none; }
          .mobile-only-stat { display: block !important; }
          
          /* Carousel conversions */
          .stats-grid, .related-grid {
            display: flex !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-bottom: 16px;
            margin: 0 -24px;
            padding: 0 24px 16px 24px;
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .stats-grid::-webkit-scrollbar { display: none; }
          
          .stat-card-inner { flex: 0 0 100% !important; scroll-snap-align: center; }
          
          .stage-card-flex { flex-direction: column; gap: 12px; }
          .stage-num { font-size: 40px; }
          
          .closing-cta { padding: 28px 24px; flex-direction: column; text-align: center; }
          .closing-cta-btn { width: 100%; display: flex; }
          .author-card { padding: 24px; flex-direction: column; text-align: center; gap: 16px; }
          
          /* Marquee for Related Articles */
          .related-section-wrapper { overflow: hidden; margin: 0 -24px; padding: 0; }
          .related-grid {
            display: flex !important;
            width: max-content;
            gap: 20px;
            padding: 0 24px 16px 24px;
            animation: scrollMarquee 20s linear infinite;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
          }
          .related-card {
            width: 280px;
            flex: 0 0 auto !important;
            scroll-snap-align: none !important;
          }
          .desktop-hidden { display: block !important; }
          
          .mobile-carousel-btn { display: flex !important; }
          
          /* Responsive sizing & layouts */
          .blog-body { max-width: 100% !important; }
          .hero-author-row { flex-direction: column; align-items: flex-start; gap: 16px; }
          .hero-date-row { font-size: 13px; }
          .hero-divider { display: none; }
          
          .main-content-container { padding: 32px 20px !important; }    /* Responsive sizing & layouts */
          .blog-body { max-width: 100% !important; }
          .stat-strip { padding: 24px 20px !important; }
          .stage-card { padding: 24px 20px !important; margin: 16px 0 !important; }
          .blog-h2 { font-size: 26px !important; margin-top: 36px !important; }
          .hero-banner-content { padding: 48px 24px 40px !important; }
          .hero-banner-content h1 { font-size: 34px !important; margin-bottom: 16px !important; }
          
          .hero-author-row { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
          .hero-divider { display: none; }
          .hero-date-row { width: 100%; gap: 24px; }

          .action-row { flex-wrap: wrap !important; }
          .desktop-only-btn { display: none !important; }
          
          .mobile-toc-container { display: block !important; }
          
          .sidebar-col { display: none !important; } /* Hide sidebar on mobile */
          .related-section { margin-top: 48px !important; }
          .main-content-container { padding: 32px 24px !important; }
          .stat-strip-title { font-size: 22px !important; }
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
          .blog-article { padding: 0 !important; }
          .stage-card { break-inside: avoid; page-break-inside: avoid; }
          .stat-strip { break-inside: avoid; }
          .print-header { display: flex !important; }
          .print-footer { display: flex !important; }
          header, footer { display: none !important; }
          .sticky-toc { display: none !important; }
          .sidebar-col { display: none !important; }
          .blog-layout { grid-template-columns: 1fr !important; }
          .blog-body { max-width: 100% !important; }
          @page { margin: 18mm 20mm; size: A4; }
          /* Force background colors in print */
          .stat-card-inner { background-color: inherit !important; }
        }
      `}</style>
{/* <CandidateHeader /> */}
      {/* ── PRINT-ONLY HEADER (shows only in PDF) ── */}
      <div
        className="print-header"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0 18px 0",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: 28,
        }}
      >
        <img src={mavenLogo} alt="MavenJobs" style={{ height: 28 }} />
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          mavenjobs.in · AI REX Blog · May 2026
        </span>
      </div>

      {/* ── SITE HEADER ── */}
      <header
        className="no-print"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg,#001540,#002b7a,#001540)",
            backgroundSize: "200% 100%",
            animation: "shimmer 5s linear infinite",
            padding: "9px 0",
            textAlign: "center",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".15em",
            color: "#fff",
            textTransform: "uppercase",
            fontFamily: "var(--fd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <FiZap size={11} fill="#6ee7b7" color="#6ee7b7" />
          Introducing AI REX — Maven's Agentic AI Talent Sourcing Platform
          <FiZap size={11} fill="#6ee7b7" color="#6ee7b7" />
        </div>
        <nav
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 44px",
            height: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <img src={mavenLogo} alt="MavenJobs" style={{ height: 28 }} />
          </Link>
          
          <div className="desktop-nav">
            <Link
              to="/blogs"
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#64748b",
                textDecoration: "none",
                fontFamily: "var(--fd)",
                transition: "color .2s",
              }}
            >
              Blog
            </Link>
            {["Premium Hiring", "AI Sourcing", "Resources"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#64748b",
                  textDecoration: "none",
                  fontFamily: "var(--fd)",
                  transition: "color .2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#002366")}
                onMouseLeave={(e) => (e.target.style.color = "#64748b")}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="desktop-nav">
            <Link
              to="/premium"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 22px",
                background: "#002366",
                color: "#fff",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                fontFamily: "var(--fd)",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#001540")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#002366")}
            >
              Explore PremiumX <FiArrowRight size={13} />
            </Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <FiMenu />
          </button>
        </nav>
      </header>

      {/* ── MOBILE SIDEBAR ── */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)} />
      <div className={`mobile-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
          <FiX />
        </button>
        <div className="mobile-nav-links">
          <Link to="/blogs" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
          {["Premium Hiring", "AI Sourcing", "Resources"].map((l) => (
            <a key={l} href="#" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>{l}</a>
          ))}
          <Link to="/premium" className="mobile-nav-link" style={{ color: "#10b981" }} onClick={() => setIsMobileMenuOpen(false)}>Explore PremiumX →</Link>
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg,#050e24 0%,#002366 50%,#1a0a4a 100%)",
          padding: "72px 0 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage: "radial-gradient(#fff 1px,transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(99,102,241,.35) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(16,185,129,.2) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="hero-banner-content reveal-on-scroll"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 44px",
            position: "relative",
            zIndex: 2,
            animation: "fadeUp .6s ease both",
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 24,
              fontSize: 12,
              color: "rgba(255,255,255,.45)",
              fontWeight: 600,
            }}
          >
            <Link
              to="/blogs"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Blog
            </Link>
            <FiChevronRight size={12} style={{ opacity: 0.4 }} />
            <span style={{ color: "inherit" }}>AI Sourcing</span>
            <FiChevronRight size={12} style={{ opacity: 0.4 }} />
            <span style={{ color: "#6ee7b7", fontWeight: 800 }}>AI REX</span>
          </div>

          {/* Category badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(16,185,129,.12)",
              border: "1px solid rgba(16,185,129,.3)",
              color: "#6ee7b7",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              padding: "6px 16px",
              borderRadius: 100,
              marginBottom: 24,
              fontFamily: "var(--fd)",
              backdropFilter: "blur(8px)",
            }}
          >
            <FiCpu size={11} fill="currentColor" /> Agentic AI · Product Launch
          </div>

          <h1
            style={{
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontSize: "clamp(32px,5vw,56px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.06,
              letterSpacing: "-0.04em",
              marginBottom: 20,
            }}
          >
            Introducing AI REX —<br />
            <span style={{ color: "#10b981" }}>Maven's Agentic AI</span>
            <br />
            Talent Sourcing Platform
          </h1>

          <div className="hero-author-row">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#002366)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--fd)",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
                  Mann Gupta
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)" }}>
                  Product Marketing Manager · MavenJobs
                </div>
              </div>
            </div>
            
            <div className="hero-divider" />
            
            <div className="hero-date-row">
              {[
                { icon: <FiCalendar size={13} />, text: "27 Apr 2026" },
                { icon: <FiClock size={13} />, text: "8 min read" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "rgba(255,255,255,.5)",
                    fontWeight: 600,
                  }}
                >
                  {m.icon}
                  {m.text}
                </div>
              ))}
            </div>

            <div className="hero-divider" />

            
          </div>

          {/* Action row */}
          <div
            className="no-print action-row"
            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
          >
            <button className="action-btn pdf-btn" onClick={handlePrint}>
              <FiDownload size={14} /> Export PDF
            </button>
            <button
              className="action-btn"
              style={{
                background: "rgba(255,255,255,.08)",
                border: "1.5px solid rgba(255,255,255,.15)",
                color: "#fff",
              }}
              onClick={() => setSaved(!saved)}
            >
              <FiBookmark size={14} fill={saved ? "#fff" : "none"} />
              {saved ? "Saved" : "Save Article"}
            </button>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {[
                {
                  icon: <FiShare2 size={14} />,
                  action: async () => {
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: document.title,
                          url: window.location.href
                        });
                      } else {
                        throw new Error("Web Share not supported");
                      }
                    } catch (err) {
                      console.log("Share API error/abort:", err);
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      } catch (clipErr) {
                        alert("Share failed and clipboard access denied.");
                      }
                    }
                  }
                },
              ].map((s, i) => (
                <button key={i} className="hero-share-btn" onClick={s.action}>
                  {s.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="main-content-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 44px" }}>
        
        {/* Mobile TOC Dropdown */}
        <div className="mobile-toc-container no-print">
          <button 
            className="mobile-toc-btn" 
            onClick={() => setIsTocOpen(!isTocOpen)}
          >
            <span style={{ letterSpacing: ".1em", textTransform: "uppercase" }}>In This Article</span>
            <FiChevronRight size={18} style={{ transform: isTocOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {isTocOpen && (
            <div className="mobile-toc-dropdown">
              {TOC_ITEMS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="toc-link"
                  style={{ paddingLeft: href.includes("stage") ? 22 : 14, textDecoration: "none" }}
                  onClick={() => setIsTocOpen(false)}
                >
                  <FiChevronRight size={12} style={{ opacity: 0.4 }} /> {label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          className="blog-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 48,
            alignItems: "flex-start",
          }}
        >
          {/* ── ARTICLE BODY ── */}
          <article className="blog-article" ref={printRef}>
            <div className="blog-body">
              {/* Lead quote */}
              <div
                style={{
                  borderLeft: "4px solid #10b981",
                  padding: "20px 28px",
                  background:
                    "linear-gradient(90deg,rgba(16,185,129,.06),transparent)",
                  borderRadius: "0 14px 14px 0",
                  marginBottom: 36,
                }}
              >
                <p className="blog-italic">
                  AI is reshaping how every industry works — from healthcare to
                  finance, logistics to legal. Recruitment is no exception. The
                  next generation of recruiters will be defined by how well they
                  use AI, to work faster and smarter. The edge today does not
                  come from effort alone — it comes from how you leverage AI in
                  your recruitment.
                </p>
              </div>

              <div
                style={{
                  width: 44,
                  height: 3,
                  background: "linear-gradient(90deg,#002366,#10b981)",
                  borderRadius: 3,
                  marginBottom: 36,
                }}
              />

              {/* Intro */}
              <h2 id="intro" className="blog-h2" style={{ marginTop: 0 }}>
                Introducing AI REX
              </h2>
              <p className="blog-p">
                AI REX is Maven's agentic AI talent-sourcing platform —
                purpose-built to transform recruiters into super recruiters.
                Powered by a suite of specialised AI agents, AI REX automates
                the most time-consuming steps in the hiring workflow, so you can
                focus on the decisions that matter. AI REX acts like your
                co-pilot: taking care of the heavy lifting from job opening to
                shortlist, accelerating your sourcing time from days to hours.
              </p>
              <p className="blog-p">
                Organisations using AI REX are already transforming how hiring
                gets done — moving faster from requirement to results, improving
                the quality of candidates they engage, and significantly
                reducing the manual effort involved in sourcing and screening.
              </p>

              {/* Stats strip */}
              <div id="stats" className="stat-strip reveal-on-scroll">
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.05,
                    backgroundImage:
                      "radial-gradient(#fff 1px,transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div
                      className="stat-strip-title"
                      style={{
                        fontFamily: "var(--fd)",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,.5)",
                        marginBottom: 6,
                      }}
                    >
                      AI REX is designed to help organisations hire
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {["Faster", "Better", "Efficiently"].map((w, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 16px",
                            borderRadius: 100,
                            background: [
                              "rgba(99,102,241,.25)",
                              "rgba(16,185,129,.25)",
                              "rgba(245,158,11,.25)",
                            ][i],
                            border: `1px solid ${["rgba(99,102,241,.4)", "rgba(16,185,129,.4)", "rgba(245,158,11,.4)"][i]}`,
                            fontSize: 12,
                            fontWeight: 800,
                            color: ["#a5b4fc", "#6ee7b7", "#fcd34d"][i],
                            fontFamily: "var(--fd)",
                          }}
                        >
                          {
                            [
                              <FiZap size={11} />,
                              <FiCheck size={11} />,
                              <FiTarget size={11} />,
                            ][i]
                          }{" "}
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div className="stats-grid" ref={statsScrollRef} onScroll={handleStatsScroll}>
                      {[...STATS, ...STATS, ...STATS].map((s, i) => (
                        <div
                          key={i}
                          className={`stat-card-inner ${i >= STATS.length ? 'mobile-only-stat' : ''}`}
                          style={{
                            textAlign: "center",
                            padding: "22px 16px",
                            borderRadius: 16,
                            background: "rgba(255,255,255,.07)",
                            border: "1px solid rgba(255,255,255,.1)",
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 11,
                              background: s.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 12px",
                              color: s.color,
                            }}
                          >
                            {s.icon}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--fd)",
                              fontSize: 38,
                              fontWeight: 800,
                              color: "#fff",
                              letterSpacing: "-0.04em",
                              lineHeight: 1,
                              marginBottom: 8,
                            }}
                          >
                            Up to
                            <br />
                            <span
                              style={{ color: [s.color, s.color, s.color][i % STATS.length] }}
                            >
                              {s.val}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,.5)",
                              lineHeight: 1.5,
                              fontWeight: 600,
                            }}
                          >
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mobile-carousel-btn left" onClick={() => scrollStats("left")}>
                      <FiChevronLeft size={20} />
                    </button>
                    <button className="mobile-carousel-btn right" onClick={() => scrollStats("right")}>
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <h2 id="how" className="blog-h2">How AI REX Works</h2>
              <p className="blog-p">
                AI REX simplifies hiring into three simple stages — helping you
                move from requirement to shortlist faster, with better outcomes
                and far less manual effort. Each requirement on AI REX provides
                access to 50 AI Rex CVs (AI Rex recommended and AI Rex screened
                applications), optimal to fulfil one position.
              </p>

              {/* Stage cards */}
              {STAGES.map((stage, si) => (
                <div key={si} id={`stage${si + 1}`} className="stage-card reveal-on-scroll">
                  {/* top accent bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg,${stage.color},${stage.accent})`,
                    }}
                  />

                  <div className="stage-card-flex">
                    {/* Number */}
                    <div style={{ flexShrink: 0 }}>
                      <div className="stage-num">
                        {stage.num}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: stage.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: stage.color,
                            flexShrink: 0,
                          }}
                        >
                          {stage.icon}
                        </div>
                        <h3
                          style={{
                            fontFamily: "var(--fd)",
                            fontSize: 19,
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {stage.title}
                        </h3>
                      </div>
                      <p className="blog-p" style={{ marginBottom: 20 }}>
                        {stage.desc}
                      </p>

                      {/* Sub-steps */}
                      {stage.steps && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                          }}
                        >
                          {stage.steps.map((step, pi) => (
                            <div
                              key={pi}
                              style={{
                                padding: "16px 20px",
                                background: stage.bg,
                                borderRadius: 14,
                                border: `1px solid ${stage.color}22`,
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "var(--fd)",
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: stage.color,
                                  marginBottom: 6,
                                }}
                              >
                                · {step.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#475569",
                                  lineHeight: 1.65,
                                }}
                              >
                                {step.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Channels */}
                      {stage.channels && (
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#64748b",
                              marginBottom: 12,
                              textTransform: "uppercase",
                              letterSpacing: ".1em",
                            }}
                          >
                            Outreach Channels
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            {stage.channels.map((ch, ci) => (
                              <div key={ci} className="channel-pill">
                                <span style={{ color: ch.color }}>
                                  {ch.icon}
                                </span>{" "}
                                {ch.label}
                              </div>
                            ))}
                          </div>
                          <div
                            style={{
                              marginTop: 16,
                              padding: "14px 18px",
                              background: "#f8fafc",
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                              fontSize: 13.5,
                              color: "#475569",
                              fontStyle: "italic",
                              lineHeight: 1.65,
                            }}
                          >
                            AI REX's adaptive approach ensures every outreach
                            happens on the right channel, at the right time —
                            driving higher response rates without any manual
                            follow-up.
                          </div>
                        </div>
                      )}

                      {/* Outcomes */}
                      {stage.outcomes && (
                        <div
                          style={{
                            background: stage.bg,
                            borderRadius: 14,
                            padding: "18px 20px",
                            border: `1px solid ${stage.color}22`,
                          }}
                        >
                          {stage.outcomes.map((o, oi) => (
                            <div key={oi} className="outcome-item">
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  background: "#fff",
                                  border: `1.5px solid ${stage.color}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <FiCheck
                                  size={12}
                                  color={stage.color}
                                  strokeWidth={3}
                                />
                              </div>
                              {o}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Post-shortlist */}
              <h2 id="post" className="blog-h2">
                Beyond Sourcing: Post-Shortlist Workflows
              </h2>
              <p className="blog-p">
                AI REX doesn't stop at sourcing. It also enables post-shortlist
                workflows — including seamless collaboration with hiring
                managers and automated interview scheduling — making the entire
                pre-interview journey faster and more coordinated.
              </p>

              <h3 className="blog-h3">AI REX Insights</h3>
              <p className="blog-p">
                AI REX goes beyond execution to give you complete visibility
                into your hiring performance. It tracks key outcomes across
                every stage — helping you understand what's working, where
                candidates are dropping off, and how your efforts are
                translating into results. With clear performance metrics,
                detailed activity tracking, and shareable reports, it enables
                smarter decision-making and better alignment across teams.
              </p>

              {/* Closing CTA */}
              <div
                className="reveal-on-scroll closing-cta"
                style={{
                  background: "linear-gradient(135deg,#050e24,#002366)",
                  borderRadius: 22,
                  margin: "44px 0 0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--fd)",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Don't get left behind.
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "rgba(255,255,255,.55)",
                      lineHeight: 1.6,
                      maxWidth: 380,
                    }}
                  >
                    Leading organisations are already hiring differently.
                    Experience the AI REX difference now.
                  </div>
                </div>
                <a
                  href="#"
                  className="closing-cta-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "14px 28px",
                    background: "#10b981",
                    color: "#fff",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: "none",
                    fontFamily: "var(--fd)",
                    boxShadow: "0 8px 24px rgba(16,185,129,.35)",
                    transition: "all .25s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#0da371";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#10b981";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Explore AI REX Today <FiArrowRight size={16} />
                </a>
              </div>

              {/* Author card */}
              <div
                className="reveal-on-scroll author-card"
                style={{
                  marginTop: 44,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#002366)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--fd)",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  M
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--fd)",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 3,
                    }}
                  >
                    Mann Gupta
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}
                  >
                    Product Marketing Manager @ MavenJobs · B2B Marketing
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    Writes about AI in recruitment, premium talent sourcing, and
                    the future of hiring technology.
                  </div>
                </div>
                <button
                  className="action-btn no-print"
                  style={{ flexShrink: 0 }}
                >
                  Read More
                </button>
              </div>
            </div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside
            className="sidebar-col no-print"
            style={{ position: "sticky", top: 110 }}
          >
            {/* Table of contents */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: "24px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 14,
                }}
              >
                In This Article
              </div>
              <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {TOC_ITEMS.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className="toc-link"
                    style={{ paddingLeft: href.includes("stage") ? 22 : 14 }}
                  >
                    <FiChevronRight size={12} style={{ opacity: 0.4 }} />{" "}
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* PremiumX promo */}
            <PremiumPromoCard className="mobile-hidden" />
          </aside>
        </div>

        {/* ── RELATED ARTICLES ── */}
        <div className="no-print related-section reveal-on-scroll" style={{ marginTop: 64 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--fd)",
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              People Also Viewed
            </h2>
            <span style={{ fontSize: 20 }}>👀</span>
          </div>
          <div className="related-section-wrapper">
            <div className="related-grid">
              {[...RELATED, ...RELATED].map((r, i) => {
                const isDup = i >= RELATED.length;
                return (
                  <div key={i} className={`related-card ${isDup ? "desktop-hidden" : ""}`}>
                    <div
                      style={{
                    height: 140,
                    borderRadius: 12,
                    background: `linear-gradient(135deg,${r.color}22,${r.color}44)`,
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0.06,
                      backgroundImage:
                        "radial-gradient(#000 1px,transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--fd)",
                      fontSize: 22,
                      fontWeight: 800,
                      color: r.color,
                      opacity: 0.6,
                      textAlign: "center",
                      padding: "0 20px",
                      lineHeight: 1.2,
                    }}
                  >
                    MavenJobs
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "3px 12px",
                    borderRadius: 100,
                    background: `${r.color}14`,
                    border: `1px solid ${r.color}30`,
                    fontSize: 11,
                    fontWeight: 800,
                    color: r.color,
                    fontFamily: "var(--fd)",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  {r.tag}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--fd)",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}
                >
                  {r.excerpt}
                </p>
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: r.color,
                  }}
                >
                  Read More <FiArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
        {/* PremiumX Promo for Mobile */}
        <div className="desktop-hidden no-print" style={{ marginTop: 24, padding: "0 20px" }}>
          <PremiumPromoCard />
        </div>
      </div>
    </div>
  </div>

      {/* ── SITE FOOTER ── */}
     <LandingFooter />

      {/* ── PDF hint toast ── */}
      {showPdfHint && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: "0 20px 48px rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiPrinter size={16} color="#10b981" />
          In the print dialog, select{" "}
          <strong style={{ color: "#10b981" }}>"Save as PDF"</strong> as
          destination
        </div>
      )}
    </div>
  );
}
