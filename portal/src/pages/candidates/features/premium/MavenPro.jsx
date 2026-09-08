import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheck, FiX, FiPhone, FiMail, FiMapPin, FiCpu,
  FiFileText, FiAward, FiTarget, FiPenTool, FiZap, FiStar,
  FiSearch, FiBell, FiLogOut, FiArrowRight, FiChevronRight,
  FiTrendingUp, FiShield, FiUsers, FiBarChart2, FiChevronDown,
  FiPlay, FiMessageCircle, FiLock, FiMenu, FiCheckCircle,
  FiClock, FiInfo
} from 'react-icons/fi';
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaQuoteLeft } from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6";
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import { useAuth } from "../../../../AuthContext";
import paymentService from "../../../../services/paymentService";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import LandingFooter from '../../../../components/LandingFooter';

function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('sv'); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

function FAQItem({ q, a, idx }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div className={`faq-item${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-q">
        <span className="faq-num">Q{idx + 1}</span>
        <span className="faq-qtxt">{q}</span>
        <FiChevronDown size={18} className="faq-icon" />
      </div>
      {open && <p className="faq-a">{a}</p>}
    </div>
  );
}

const BASIC_FEATURES = [
  { label: 'Apply to jobs', desc: 'Apply to any job on the platform for free' },
  { label: 'AI job recommendations', desc: 'Get AI-matched job suggestions daily' },
  { label: 'AI ChatBot', desc: '50 texts/day in career assistant chat' },
  { label: 'Resume Builder', desc: 'Build professional resumes for free' },
];

const ELITE_FEATURES = [
  { label: 'Apply to jobs', desc: 'Unrestricted applications' },
  { label: 'Top 5 AI job recommendations', desc: '5 curated premium picks daily' },
  { label: 'AI ChatBot', desc: '100 texts/day with advanced context' },
  { label: 'Resume Builder + ATS Checker', desc: 'Build resumes & check ATS score' },
  { label: 'Profile visibility for AI matching', desc: 'Recruiters discover you via AI' },
  { label: 'Recruiter Spotlight', desc: 'Get featured to top recruiters' },
];

function useDaysLeft(expiresAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return useMemo(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86400000);
  }, [expiresAt, now]);
}

const MavenPro = () => {
  const { user, openLogin, openRegister, updateUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  const isElite = user?.membership?.active && user?.membership?.plan === 'ELITE';
  const daysLeft = useDaysLeft(isElite ? user?.membership?.expiresAt : null);

  const handlePayment = async (planType) => {
    setPaymentError("");
    setPaymentSuccess("");

    if (!user) { openLogin(); return; }

    try {
      setPaymentLoading(true);
      const orderRes = await paymentService.createOrder(planType);
      const { orderId, amount, currency, keyId, planLabel, durationDays } = orderRes.data;

      await paymentService.openCheckout({
        order: { orderId, amount, currency, planLabel, durationDays },
        keyId,
        user,
        onSuccess: (result) => {
          const expiresAt = result?.data?.expiresAt || result?.expiresAt;
          updateUser({
            membership: {
              plan: planType === 'ELITE_QUARTERLY' ? 'ELITE' : planType,
              active: true,
              startedAt: new Date().toISOString(),
              expiresAt,
            },
          });
          setPaymentSuccess(planType === 'ELITE_QUARTERLY' ? 'ELITE plan activated successfully!' : `${planType} plan activated successfully!`);
          setPaymentLoading(false);
        },
        onError: (msg) => {
          setPaymentError(msg || "Payment failed");
          setPaymentLoading(false);
        },
      });
    } catch (err) {
      setPaymentError(err?.response?.data?.message || err.message || "Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const features = [
    { icon: <FiCpu size={26} />, title: "AI-Powered Resume Engine", desc: "Our proprietary NLP scans thousands of job descriptions and rebuilds your resume with the exact keywords hiring managers search for.", color: "#002366" },
    { icon: <FiTrendingUp size={26} />, title: "Live Career Analytics", desc: "Track profile views, shortlisting rates, and application outcomes in a real-time dashboard built to keep you one step ahead.", color: "#10b981" },
    { icon: <FiShield size={26} />, title: "ATS Pass Guarantee", desc: "Every document we craft clears 50+ applicant-tracking systems. Not shortlisted in 60 days? We rewrite it — at zero cost.", color: "#6366f1" },
    { icon: <FiUsers size={26} />, title: "FAANG-Verified Coaches", desc: "Work directly with ex-Google, Amazon, and McKinsey hiring professionals who know what the shortlist looks like from the inside.", color: "#f59e0b" },
    { icon: <FiBarChart2 size={26} />, title: "Market Intelligence Hub", desc: "Access real-time salary benchmarks, in-demand skill trends, and sector-specific hiring forecasts across 60+ verticals.", color: "#ec4899" },
    { icon: <FiMessageCircle size={26} />, title: "Always-On Support", desc: "Dedicated career advisors reachable via live chat, phone, and email — no queues, no bots, no waiting rooms.", color: "#14b8a6" },
  ];

  const testimonials = [
    { name: "Priya Sharma", role: "Product Manager · Microsoft India", initials: "PS", color: "#002366", text: "Maven's AI resume engine transformed my search completely. Within 3 weeks I had 8 interview calls — including Microsoft and Flipkart. The ROI is simply unmatched.", stars: 5 },
    { name: "Arjun Mehta", role: "Software Engineer · Google", initials: "AM", color: "#10b981", text: "The AI mock interview platform mirrored my actual Google rounds almost exactly. The confidence-score tracking showed me where to improve, and it worked.", stars: 5 },
    { name: "Sneha Kulkarni", role: "Senior Analyst · Deloitte", initials: "SK", color: "#6366f1", text: "Priority Applicant placed me at the top of every recruiter search. Three-times the profile views meant three-times the callbacks. Best ₹971 I've ever invested.", stars: 5 },
    { name: "Rohit Bansal", role: "Growth Lead · Zomato", initials: "RB", color: "#f59e0b", text: "Recruiters literally commented on how polished my Visual Resume looked. I landed my Zomato role within 45 days — faster than I ever imagined possible.", stars: 5 },
  ];

  const faqs = [
    { q: "What exactly is MavenPro?", a: "MavenPro is India's most comprehensive career acceleration platform. It combines AI-powered resume tools, expert human coaching, recruiter visibility boosts, real-time market intelligence, and interview preparation — all under one roof." },
    { q: "Who is MavenPro designed for?", a: "From fresh graduates targeting their first role to senior leaders making a lateral switch — every plan is calibrated to your experience level, target industry, and salary band." },
    { q: "How long does it take to see results?", a: "Most users report 3× more recruiter profile views within the first week of activating a visibility plan. Resume rewrites typically generate interview calls within 2–3 weeks of submission." },
    { q: "What types of mock interviews are available?", a: "We offer unlimited AI video interviews with real-time feedback, role-specific question banks spanning 200+ job categories, and live 1-on-1 sessions with FAANG-verified coaches for Elite members." },
    { q: "Can I practise for multiple job roles simultaneously?", a: "Yes. Our platform supports parallel preparation for up to 3 different target roles, with separate question sets, feedback profiles, and coaching notes for each." },
    { q: "Can I edit and re-download my resume after delivery?", a: "Absolutely. All resume plans include lifetime document access. Pro members get 3 free revision rounds; Elite members get unlimited revisions with priority turnaround." },
    { q: "Is there a free trial available?", a: "Yes — our Free plan gives you access to the basic resume builder, ATS score checker, and one resume revision so you can experience the platform before committing to a paid tier." },
    { q: "How do I get in touch if I need help?", a: "Reach us on Toll Free 1800-102-5557, email support@mavenjobs.com, or via the live chat widget inside the platform. Elite members receive a dedicated career manager with a direct WhatsApp line." },
  ];

  const galleryImages = [
    { src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=700&q=80", label: "Expert Coaching Sessions" },
    { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80", label: "Collaborative Growth" },
    { src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=700&q=80", label: "Career Analytics Dashboard" },
    { src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&q=80", label: "Interview Preparation" },
    { src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80", label: "Remote-Ready Professionals" },
    // { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&q=80", label: "Success Stories" },
  ];

  const r1 = useFadeIn(), r2 = useFadeIn(), r4 = useFadeIn(),
    r5 = useFadeIn(), r6 = useFadeIn(), r7 = useFadeIn(), r8 = useFadeIn();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --navy:#002366;--navy-d:#001540;--green:#10b981;--gd:#0da371;
          --s50:#f8fafc;--s100:#f1f5f9;--s200:#e2e8f0;--s300:#cbd5e1;
          --s400:#94a3b8;--s500:#64748b;--s600:#475569;--s900:#0f172a;
          --fd:'Bricolage Grotesque',sans-serif;--fb:'DM Sans',sans-serif;
        }
        html{scroll-behavior:smooth}
        body{font-family:var(--fb);background:#f0f4fb;color:var(--s900)}

        /* PROMO */
        .pb{background:linear-gradient(90deg,var(--navy-d),#003db5,var(--navy-d));background-size:200% 100%;animation:sh 5s linear infinite;color:#fff;padding:11px 0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:14px;font-family:var(--fd)}
        .pa{color:#6ee7b7}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* NAVBAR */
        .nb{background:transparent !important;border-bottom:1px solid transparent !important;position:fixed;top:37px;left:0;right:0;z-index:90;transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
        .nb.sc{background:rgba(255,255,255,.98) !important;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--s200) !important;box-shadow:0 10px 40px rgba(0,35,102,.08)}
        .nbi{max-width:1280px;margin:0 auto;padding:0 28px;height:74px;display:flex;align-items:center;justify-content:space-between}
        .nl{display:flex;align-items:center;gap:32px}
        .nla{font-size:13px;font-weight:700;color:rgba(255,255,255,.85);text-decoration:none;letter-spacing:.02em;transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .nla{color:var(--s500)}
        .nla:hover{color:#fff}
        .nb.sc .nla:hover{color:var(--navy)}
        .nla.ac{color:#fff;position:relative}
        .nb.sc .nla.ac{color:var(--navy)}
        .nla.ac::after{content:'';position:absolute;bottom:-28px;left:0;right:0;height:2.5px;background:var(--green);border-radius:2px}
        .btnl{padding:8px 18px;font-size:13px;font-weight:800;color:#fff;background:none;border:none;cursor:pointer;border-radius:10px;transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .btnl{color:var(--navy)}
        .btnl:hover{background:rgba(255,255,255,.15)}
        .nb.sc .btnl:hover{background:var(--s100)}
        .logo-img{height:34px;transition:all .4s ease;display:block}
        .nb:not(.sc) .logo-img{filter:invert(1) brightness(2) contrast(1.2)}
        .btnr{padding:10px 24px;font-size:13px;font-weight:800;color:#fff;background:var(--navy);border:none;border-radius:11px;cursor:pointer;transition:all .2s;font-family:var(--fd);box-shadow:0 4px 14px rgba(0,35,102,.2)}
        .btnr:hover{background:var(--navy-d);transform:translateY(-1px)}

        /* HERO — REVERSED */
        .hero{position:relative;height:100vh;min-height:700px;overflow:hidden;background:#050e24}
        .spline-wrap{position:absolute;top:0;left:-8%;bottom:0;width:68%;overflow:hidden}
        .spline-wrap iframe{width:100%;height:calc(100% + 80px);border:none;display:block;pointer-events:none;margin-bottom:-80px}
        .ho-right{position:absolute;top:0;right:0;bottom:0;width:60%;background:linear-gradient(to left,rgba(2,8,30,.94) 0%,rgba(2,8,30,.78) 55%,transparent 100%);z-index:2;pointer-events:none}
        .ho-top{position:absolute;top:0;left:0;right:0;height:180px;background:linear-gradient(to bottom,rgba(2,8,30,.88),transparent);z-index:2;pointer-events:none}
        .ho-bot{position:absolute;bottom:0;left:0;right:0;height:220px;background:linear-gradient(to top,#f0f4fb 0%,transparent 100%);z-index:2;pointer-events:none}
        .hc{position:relative;z-index:10;max-width:1280px;margin:0 auto;padding:0 28px;height:100%;display:flex;align-items:center;justify-content:flex-end}
        .htext{max-width:560px;text-align:left}
        .heb{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.35);border-radius:100px;color:#6ee7b7;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:28px;font-family:var(--fd);backdrop-filter:blur(8px)}
        .hh1{font-family:var(--fd);font-size:clamp(42px,5vw,76px);font-weight:800;line-height:1.05;color:#fff !important;letter-spacing:-.03em;margin-bottom:20px}
        .hh1 .acc{color:#10b981 !important}
        .hsub{font-size:15.5px;color:rgba(255,255,255,.6);font-weight:500;max-width:440px;margin-bottom:40px;line-height:1.75}
        .hbtns{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:48px}
        .hbp{padding:15px 34px;background:var(--green);color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fd);letter-spacing:.02em;display:flex;align-items:center;gap:8px;transition:all .25s;text-decoration:none;box-shadow:0 8px 28px rgba(16,185,129,.35)}
        .hbp:hover{background:var(--gd);transform:translateY(-2px);box-shadow:0 12px 36px rgba(16,185,129,.45)}
        .hbg{padding:14px 32px;background:rgba(255,255,255,.07);color:#fff;font-weight:700;font-size:14px;border-radius:100px;border:1px solid rgba(255,255,255,.18);cursor:pointer;font-family:var(--fd);transition:all .25s;text-decoration:none;backdrop-filter:blur(8px);display:flex;align-items:center;gap:8px}
        .hbg:hover{background:rgba(255,255,255,.13)}
        .htrust{display:flex;gap:22px;flex-wrap:wrap}
        .htp{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:rgba(255,255,255,.4)}
        .htpdot{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0}
        .si{position:absolute;bottom:36px;right:56px;z-index:10;display:flex;flex-direction:column;align-items:center;gap:7px;color:rgba(255,255,255,.22);font-size:9px;font-weight:800;letter-spacing:.18em;font-family:var(--fd);text-transform:uppercase}
        .sl{width:1px;height:40px;background:linear-gradient(to bottom,rgba(255,255,255,.28),transparent);animation:sp 2.2s ease-in-out infinite}
        @keyframes sp{0%,100%{opacity:.22}50%{opacity:.65}}

        /* STATS */
        .ss{background:#fff;border-bottom:1px solid var(--s100)}
        .ssi{max-width:1280px;margin:0 auto;padding:0 28px;display:grid;grid-template-columns:repeat(4,1fr)}
        .sti{padding:36px 20px;text-align:center;border-right:1px solid var(--s100);transition:background .2s}
        .sti:last-child{border-right:none}
        .sti:hover{background:var(--s50)}
        .stn{font-family:var(--fd);font-size:38px;font-weight:800;color:var(--navy);letter-spacing:-.04em;line-height:1;margin-bottom:7px}
        .stl{font-size:10px;font-weight:700;color:var(--s400);letter-spacing:.12em;text-transform:uppercase}

        /* PARTNERS */
        .partners-sec{background:var(--s50);border-top:1px solid var(--s100);border-bottom:1px solid var(--s100);padding:26px 0;overflow:hidden}
        .partners-track{display:flex;gap:52px;animation:marquee 24s linear infinite;width:max-content;align-items:center}
        .partners-track:hover{animation-play-state:paused}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .partner-logo{font-family:var(--fd);font-size:12px;font-weight:800;color:var(--s300);letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;transition:color .2s;cursor:default}
        .partner-logo:hover{color:var(--navy)}

        /* SW */
        .sw2{max-width:1280px;margin:0 auto;padding:0 28px}

        /* SECTION HEAD */
        .sh2{text-align:center;margin-bottom:60px}
        .se{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--green);font-family:var(--fd);margin-bottom:14px}
        .stt{font-family:var(--fd);font-size:clamp(28px,3.6vw,48px);font-weight:800;color:var(--navy);letter-spacing:-.03em;margin-bottom:14px;line-height:1.08}
        .sd{color:var(--s500);font-size:15.5px;max-width:520px;margin:0 auto;line-height:1.8}
        .sdiv{width:44px;height:3px;background:linear-gradient(90deg,var(--green),#6ee7b7);border-radius:3px;margin:16px auto}

        /* FEATURES */
        .feat-sec{padding:88px 0;background:#fff}
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .feat-card{padding:36px 30px;border-radius:20px;border:1px solid var(--s100);background:var(--s50);transition:all .3s;position:relative;overflow:hidden}
        .feat-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent 60%,rgba(0,35,102,.02));pointer-events:none}
        .feat-card:hover{border-color:rgba(0,35,102,.12);box-shadow:0 16px 48px rgba(0,35,102,.08);transform:translateY(-4px);background:#fff}
        .feat-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;transition:transform .3s}
        .feat-card:hover .feat-icon{transform:scale(1.08) rotate(-4deg)}
        .feat-title{font-family:var(--fd);font-size:18px;font-weight:800;color:var(--navy);margin-bottom:10px;letter-spacing:-.01em}
        .feat-desc{font-size:13.5px;color:var(--s500);line-height:1.75;font-weight:500}

        /* CARDS */
        .cs{padding:88px 0 80px}
        .cg2{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .fc{opacity:0;transform:translateY(28px);transition:opacity .55s ease var(--d,0ms),transform .55s ease var(--d,0ms)}
        .fc.sv, .sf.sv .fc{opacity:1;transform:translateY(0)}
        .sf{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s ease}
        .sf.sv{opacity:1;transform:translateY(0)}
        .ci{position:relative;background:#fff;border-radius:22px;border:1px solid var(--s200);padding:34px 30px;display:flex;flex-direction:column;overflow:hidden;transition:box-shadow .28s,transform .28s,border-color .28s;height:100%}
        .ci:hover{box-shadow:0 20px 56px rgba(0,35,102,.11);transform:translateY(-5px);border-color:rgba(0,35,102,.14)}
        .cg{position:absolute;top:-70px;right:-70px;width:180px;height:180px;border-radius:50%;opacity:.055;filter:blur(44px);transition:opacity .3s;pointer-events:none}
        .ci:hover .cg{opacity:.11}
        .ct{position:absolute;top:22px;right:22px;font-size:9px;font-weight:800;letter-spacing:.16em;color:var(--s400);font-family:var(--fd);background:var(--s50);border:1px solid var(--s100);padding:4px 9px;border-radius:6px}
        .cion{width:54px;height:54px;border-radius:15px;border:1px solid;display:flex;align-items:center;justify-content:center;margin-bottom:22px;transition:transform .28s;flex-shrink:0}
        .ci:hover .cion{transform:scale(1.1) rotate(-5deg)}
        .ctitle{font-family:var(--fd);font-size:21px;font-weight:800;color:var(--navy);margin-bottom:6px;letter-spacing:-.02em}
        .cprice{display:flex;align-items:baseline;gap:3px;margin-bottom:22px;padding-bottom:20px;border-bottom:1px solid var(--s100)}
        .pcur{font-size:16px;font-weight:700;color:var(--s300);font-family:var(--fd)}
        .pamt{font-family:var(--fd);font-size:38px;font-weight:800;color:var(--navy);letter-spacing:-.04em;line-height:1}
        .pper{font-size:12px;font-weight:600;color:var(--s400);margin-left:4px}
        .cfeats{list-style:none;display:flex;flex-direction:column;gap:11px;flex:1;margin-bottom:24px}
        .cfeats li{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--s600)}
        .cbtn{width:100%;padding:13px;background:#fff;border:1.5px solid var(--s200);color:var(--navy);font-size:13px;font-weight:800;font-family:var(--fd);border-radius:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .22s;letter-spacing:.01em}
        .cbtn:hover{background:var(--acc,var(--navy));color:#fff;border-color:var(--acc,var(--navy))}

        /* PLAN COMPARISON TABLE */
        .plan-sec{padding:88px 0;background:#fff}
        .plan-wrap{overflow-x:auto;border-radius:20px;border:1px solid var(--s200);background:#fff;box-shadow:0 4px 32px rgba(0,35,102,.06)}
        table.plan-table{width:100%;border-collapse:collapse;font-family:var(--fb)}
        .plan-table th{padding:28px 24px;font-family:var(--fd);font-size:13px;font-weight:800;text-align:center;border-bottom:2px solid var(--s100);position:relative;min-width:150px}
        .plan-table th:first-child{text-align:left;min-width:240px}
        .plan-table td{padding:15px 24px;font-size:13px;font-weight:500;color:var(--s600);border-bottom:1px solid var(--s100);text-align:center;transition:background .15s}
        .plan-table td:first-child{text-align:left;color:var(--s700);font-weight:600;font-size:13px}
        .plan-table tr:hover td{background:var(--s50)}
        .plan-table tr:last-child td{border-bottom:none}
        .th-free{color:var(--s500)}
        .th-pro{color:var(--navy)}
        .th-elite{color:var(--green)}
        .th-price{font-family:var(--fd);font-size:24px;font-weight:800;display:block;margin-top:4px}
        .th-period{font-size:11px;font-weight:600;color:var(--s400);display:block;margin-bottom:12px}
        .th-badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-family:var(--fd)}
        .badge-pro{background:rgba(0,35,102,.08);color:var(--navy)}
        .badge-elite{background:rgba(16,185,129,.1);color:var(--green)}
        .col-highlight{background:rgba(0,35,102,.025)}
        .tck{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:rgba(16,185,129,.1);color:var(--green)}
        .tcross{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:rgba(148,163,184,.1);color:var(--s300)}
        .tval{display:inline-block;padding:4px 10px;background:var(--s50);border:1px solid var(--s200);border-radius:6px;font-size:11.5px;font-weight:700;color:var(--navy);font-family:var(--fd)}
        .plan-cta-row td{padding:24px 24px;background:var(--s50) !important}
        .plan-btn{width:100%;padding:11px 0;border-radius:11px;font-family:var(--fd);font-size:13px;font-weight:800;cursor:pointer;border:none;transition:all .22s}
        .plan-btn-free{background:#fff;border:1.5px solid var(--s200);color:var(--s500)}
        .plan-btn-free:hover{background:var(--s100)}
        .plan-btn-pro{background:var(--navy);color:#fff;box-shadow:0 6px 20px rgba(0,35,102,.22)}
        .plan-btn-pro:hover{background:var(--navy-d);transform:translateY(-1px)}
        .plan-btn-elite{background:var(--green);color:#fff;box-shadow:0 6px 20px rgba(16,185,129,.28)}
        .plan-btn-elite:hover{background:var(--gd);transform:translateY(-1px)}

        /* GALLERY */
        .gal-sec{padding:88px 0 80px;background:#f0f4fb}
        .gal-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,220px);gap:16px}
        .gal-item{border-radius:18px;overflow:hidden;position:relative;cursor:pointer}
        .gal-item:first-child{grid-row:span 2;border-radius:22px}
        .gal-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.4,0,.2,1)}
        .gal-item:hover img{transform:scale(1.06)}
        .gal-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,12,40,.72) 0%,transparent 52%);opacity:0;transition:opacity .3s;display:flex;align-items:flex-end;padding:20px}
        .gal-item:hover .gal-overlay{opacity:1}
        .gal-label{font-family:var(--fd);font-size:12px;font-weight:800;color:#fff;letter-spacing:.06em;text-transform:uppercase}

        /* TESTIMONIALS */
        .test-sec{padding:88px 0;background:#fff}
        .test-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
        .test-card{padding:36px 32px;border-radius:22px;border:1px solid var(--s100);background:var(--s50);transition:all .3s;position:relative}
        .test-card:hover{border-color:rgba(0,35,102,.12);box-shadow:0 16px 48px rgba(0,35,102,.07);transform:translateY(-3px);background:#fff}
        .test-quote-ico{position:absolute;top:28px;right:28px;color:var(--s200);pointer-events:none}
        .test-stars{display:flex;gap:3px;margin-bottom:18px}
        .test-text{font-size:14px;color:var(--s600);line-height:1.82;margin-bottom:24px;font-weight:500;font-style:italic}
        .test-author{display:flex;align-items:center;gap:14px}
        .test-initials{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:13px;font-weight:800;flex-shrink:0}
        .test-name{font-family:var(--fd);font-size:14px;font-weight:800;color:var(--navy)}
        .test-role{font-size:11.5px;color:var(--s400);font-weight:600;margin-top:2px}

        /* PREMIUM */
        .ps{padding:0 0 88px}
        .pb2{background:linear-gradient(135deg,#010e2a 0%,#002b7a 50%,#010e2a 100%);border-radius:28px;padding:68px;display:grid;grid-template-columns:1fr auto;gap:60px;align-items:center;position:relative;overflow:hidden}
        .po1{position:absolute;top:-80px;right:220px;width:280px;height:280px;background:radial-gradient(circle,rgba(16,185,129,.18),transparent);border-radius:50%;pointer-events:none}
        .po2{position:absolute;bottom:-60px;left:40px;width:180px;height:180px;background:radial-gradient(circle,rgba(99,102,241,.12),transparent);border-radius:50%;pointer-events:none}
        .pgrid{position:absolute;inset:0;opacity:.035;background-image:radial-gradient(#fff 1px,transparent 1px);background-size:30px 30px;pointer-events:none}
        .pl{position:relative;z-index:2}
        .pbadge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:100px;color:rgba(255,255,255,.65);font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-family:var(--fd);margin-bottom:22px}
        .ph2{font-family:var(--fd);font-size:clamp(26px,3.2vw,42px);font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.1;margin-bottom:32px}
        .pf{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .pfi{display:flex;align-items:center;gap:11px;font-size:13px;font-weight:500;color:rgba(255,255,255,.65)}
        .pck{width:24px;height:24px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.35);border-radius:7px;display:flex;align-items:center;justify-content:center;color:#6ee7b7;flex-shrink:0}
        .pcard{width:340px;background:#fff;border-radius:22px;padding:44px 36px;position:relative;z-index:2;box-shadow:0 36px 72px rgba(0,0,0,.32)}
        .pce{font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--s400);font-family:var(--fd);text-align:center;margin-bottom:10px}
        .ppr{display:flex;align-items:baseline;justify-content:center;gap:4px;margin-bottom:6px}
        .ppc{font-size:20px;font-weight:700;color:var(--s300);font-family:var(--fd)}
        .ppa{font-family:var(--fd);font-size:60px;font-weight:800;color:var(--navy);letter-spacing:-.05em;line-height:1}
        .ppd{font-size:14px;font-weight:600;color:var(--s400)}
        .ppn{text-align:center;font-size:11px;color:var(--s400);margin-bottom:28px;font-weight:500}
        .bsub{width:100%;padding:17px;background:var(--green);color:#fff;font-family:var(--fd);font-weight:800;font-size:15px;border:none;border-radius:14px;cursor:pointer;transition:all .25s;margin-bottom:14px;box-shadow:0 8px 22px rgba(16,185,129,.3)}
        .bsub:hover{background:var(--gd);transform:translateY(-2px);box-shadow:0 12px 30px rgba(16,185,129,.4)}
        .pcn{text-align:center;font-size:10px;font-weight:800;color:var(--s400);letter-spacing:.1em;text-transform:uppercase;font-family:var(--fd)}

        /* FAQ */
        .faq-sec{padding:88px 0;background:#f0f4fb}
        .faq-wrap{max-width:780px;margin:0 auto}
        .faq-item{border-radius:16px;border:1px solid var(--s200);background:#fff;margin-bottom:10px;cursor:pointer;overflow:hidden;transition:border-color .2s,box-shadow .2s}
        .faq-item:hover,.faq-item.open{border-color:rgba(0,35,102,.15);box-shadow:0 8px 28px rgba(0,35,102,.06)}
        .faq-q{display:flex;align-items:center;gap:14px;padding:20px 24px}
        .faq-num{font-family:var(--fd);font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--green);min-width:28px}
        .faq-qtxt{font-family:var(--fd);font-size:15px;font-weight:700;color:var(--navy);flex:1}
        .faq-icon{color:var(--s400);transition:transform .3s;flex-shrink:0}
        .faq-item.open .faq-icon{transform:rotate(180deg);color:var(--green)}
        .faq-a{padding:0 24px 20px 56px;font-size:13.5px;color:var(--s500);line-height:1.78;font-weight:500}

        /* CONTACT */
        .con{background:#fff;padding:88px 0;border-top:1px solid var(--s100)}
        .cong{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start}
        .conh2{font-family:var(--fd);font-size:clamp(26px,3.2vw,42px);font-weight:800;color:var(--navy);letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .cons{color:var(--s500);font-size:14.5px;line-height:1.8;margin-bottom:44px}
        .coni{display:flex;gap:18px;margin-bottom:28px;cursor:default}
        .conico{width:50px;height:50px;border-radius:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .28s}
        .coni:hover .conico{transform:scale(1.08) rotate(-5deg)}
        .conit{font-family:var(--fd);font-weight:800;color:var(--navy);font-size:15px;margin-bottom:3px}
        .conii{font-weight:600;color:var(--s600);font-size:13px;margin-bottom:2px}
        .conis{font-size:10px;font-weight:700;color:var(--s400);letter-spacing:.08em;text-transform:uppercase}
        
        /* FEATURE TABLE */
        .ftr { display: grid; grid-template-columns: 1fr 120px 120px; gap: 16px; padding: 14px 20px; align-items: center; }
        .ftr-f { font-size: 14px; font-weight: 600; color: #1e293b; }
        .ftr-v { text-align: center; font-size: 13px; font-weight: 600; color: #64748b; }
        .ftr-ve { text-align: center; font-size: 13px; font-weight: 600; color: #0f172a; }
        .fw{background:var(--s50);border-radius:22px;padding:40px;border:1px solid var(--s100)}
        .fr{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
        .fg{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}
        .fl{font-size:9px;font-weight:800;color:var(--s400);letter-spacing:.18em;text-transform:uppercase;font-family:var(--fd)}
        .fi,.fta{background:#fff;border:1.5px solid var(--s200);border-radius:11px;padding:13px 16px;font-size:14px;font-weight:500;color:var(--s900);font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
        .fi:focus,.fta:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(16,185,129,.1)}
        .fta{resize:none}
        .pg{display:flex}
        .pp{padding:13px 14px;background:var(--s100);border:1.5px solid var(--s200);border-right:none;border-radius:11px 0 0 11px;font-size:12px;font-weight:800;color:var(--s400);font-family:var(--fd);white-space:nowrap}
        .pi{border-radius:0 11px 11px 0}
        .bsmt{width:100%;padding:16px;background:var(--navy);color:#fff;font-family:var(--fd);font-weight:800;font-size:15px;border:none;border-radius:13px;cursor:pointer;transition:all .25s;margin-top:6px;box-shadow:0 8px 22px rgba(0,35,102,.18)}
        .bsmt:hover{background:var(--navy-d);transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,35,102,.26)}

        /* FOOTER */
        .ft{background:var(--navy-d);padding:60px 0;text-align:center;border-top:1px solid rgba(255,255,255,.04)}
        .fts{display:flex;justify-content:center;gap:11px;margin-bottom:36px}
        .ftsl{width:42px;height:42px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.22);text-decoration:none;transition:all .25s}
        .ftsl:hover{background:var(--green);color:#fff;border-color:var(--green);transform:translateY(-2px)}
        .ftl{display:flex;justify-content:center;gap:24px;margin-bottom:28px;flex-wrap:wrap}
        .ftla{font-size:11px;font-weight:700;color:rgba(255,255,255,.18);text-decoration:none;font-family:var(--fd);letter-spacing:.06em;transition:color .2s}
        .ftla:hover{color:rgba(255,255,255,.45)}
        .ftc{font-size:10px;font-weight:700;color:rgba(255,255,255,.1);letter-spacing:.22em;text-transform:uppercase;font-family:var(--fd)}

        /* RESPONSIVE */
        @media(max-width:1024px){
          .feat-grid{grid-template-columns:repeat(2,1fr)}
          .pb2{grid-template-columns:1fr;padding:44px 32px}
          .pcard{width:100%}
          .pf{grid-template-columns:1fr}
        }
        @media(max-width:900px){
          .cg2,.test-grid{grid-template-columns:1fr}
          .cong{grid-template-columns:1fr;gap:44px}
          .fr{grid-template-columns:1fr}
          .ssi{grid-template-columns:1fr 1fr}
          .sti{border-right:none;border-bottom:1px solid var(--s100)}
          .nl{display:none}
          .hh1{font-size:36px}
          .ho-right{width:100%;background:rgba(2,8,30,.62)}
          .si{right:28px}
          .gal-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto}
          .gal-item:first-child{grid-row:span 1}
          .feat-grid{grid-template-columns:1fr}
        }
          .mobile-menu-btn { display: none; background: var(--navy); border: none; cursor: pointer; color: #fff; padding: 6px; border-radius: 8px; align-items: center; justify-content: center; transition: all 0.2s; }
          .nav-menu-wrapper { display: flex; align-items: center; justify-content: space-between; flex: 1; gap: 36px; }
          @media (max-width: 1024px) {
            .mobile-menu-btn { display: flex; z-index: 1000; position: relative; }
            .nav-menu-wrapper { display: flex; flex-direction: column; justify-content: flex-start; position: fixed !important; top: 0 !important; bottom: 0 !important; right: 0 !important; left: auto !important; width: 280px; height: 100vh; background: #050e24; padding: 80px 24px 30px; box-shadow: -10px 0 40px rgba(0,0,0,0.5); border-top: none; transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); z-index: 999; }
            .nb.sc .nav-menu-wrapper { background: #fff; box-shadow: -10px 0 50px rgba(0,35,102,0.15); border-top: none; }
            .nav-menu-wrapper.mobile-open { transform: translateX(0); }
            .nl { display: flex !important; flex-direction: column; width: 100%; align-items: flex-start; margin-bottom: 24px; gap: 12px !important; }
            .nla { margin-bottom: 0; font-size: 16px; width: 100%; text-align: left; }
            .na { flex-direction: column !important; width: 100%; align-items: stretch !important; gap: 14px !important; }
            .btnl, .btnr { width: 100%; text-align: center; font-size: 15px; padding: 12px; }
          }
          @media (max-width: 768px) {
            .hero { min-height: 100vh; height: auto; padding: 120px 0 80px; display: block; }
            .spline-wrap { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 1; z-index: 1; }
            .spline-wrap iframe { height: 100%; margin-bottom: 0; }
            .ho-right { width: 100%; background: linear-gradient(to top, rgba(2,8,30,.96) 0%, rgba(2,8,30,.7) 100%); display: block; z-index: 2; }
            .hc { justify-content: center; height: 100%; position: relative; z-index: 10; padding-top: 60px; }
            .htext { text-align: center; }
            .htrust { justify-content: center; }
            .hbtns { justify-content: center; }
            .stt { font-size: 32px; }
            .gal-grid { grid-template-columns: 1fr; }
            .pb2 { padding: 40px 24px; }
            .pcard { padding: 30px 24px; }
            .ppa { font-size: 48px; }
            .sh2 { margin-bottom: 40px; }
            .ps { padding: 0 0 60px; }
            .ftr { grid-template-columns: 1fr 90px 90px; gap: 12px; }
          }
          @media (max-width: 480px) {
            .ssi { grid-template-columns: 1fr 1fr; }
            .sti { border-bottom: 1px solid var(--s100); padding: 24px 10px; }
            .sti:nth-child(odd) { border-right: 1px solid var(--s100); }
            .sti:nth-child(even) { border-right: none; }
            .stn { font-size: 28px; }
            .stl { font-size: 9px; letter-spacing: 0.08em; }
            .hh1 { font-size: 32px; }
            .hsub { font-size: 14.5px; margin-bottom: 28px; }
            .hbtns { flex-direction: column; width: 100%; }
            .hbp, .hbg { width: 100%; justify-content: center; }
            .hero { padding-bottom: 20px; padding-top: 100px; min-height: 80vh; }
            .si { display: none; }
            .ho-bot { height: 120px; opacity: 0.4; }
            .htrust { flex-direction: row; gap: 10px; align-items: center; justify-content: center; flex-wrap: nowrap; white-space: nowrap; }
            .htp { font-size: 10px; gap: 4px; }
            .sw2 { padding: 0 20px; }
            .stt { font-size: 26px; }
            .pcard { padding: 24px 20px; }
            .pb2 { padding: 30px 16px; }
            .faq-qtxt { font-size: 14px; }
            .faq-a { padding: 0 16px 16px 44px; font-size: 13.5px; }
            .faq-num { min-width: 24px; }
            .faq-q { padding: 16px; }
            .conh2 { font-size: 28px; }
            .fw { padding: 24px 20px; }
            .feat-card { padding: 28px 20px; }
            .plan-sec, .feat-sec, .faq-sec, .gal-sec, .con { padding: 60px 0; }
            .pfi { font-size: 12px; }
            .ftr { grid-template-columns: 1fr 70px 70px; gap: 8px; padding: 12px 14px; }
            .ftr-f { font-size: 12px; }
            .ftr-v, .ftr-ve { font-size: 12px; }
          }
      `}</style>

      {/* PROMO */}
      <div className="pb">
        <FiZap fill="currentColor" size={11} />
        <span>Flat 20% OFF on all plans · Use code <span className="pa">MAVEN20</span> · Limited Seats</span>
        <FiZap fill="currentColor" size={11} />
      </div>

      {/* NAVBAR */}
      <header className={`nb${isScrolled ? ' sc' : ''}`}>
        <div className="nbi">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginRight: '24px' }}>
            <img src={mavenLogo} alt="MavenJobs" className="logo-img" />
            <div style={{ background: 'linear-gradient(135deg, #10b981, #0da371)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.12em', fontFamily: 'var(--fd)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>PRO</div>
          </Link>

          <div className={`nav-menu-wrapper ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            <nav className="nl">
              <a href="#features" className="nla">Features</a>
              <a href="#plans" className="nla">Pricing</a>
              <a href="#testimonials" className="nla">Stories</a>
              <a href="#faq" className="nla">FAQ</a>
            </nav>
            <div className="na" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!user ? (
                <>
                  <button className="btnl" onClick={openLogin}>Login</button>
                  <button className="btnr" onClick={openRegister}>Get Started Free</button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button title="Notifications" style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isScrolled ? '#f8fafc' : 'rgba(255,255,255,0.1)', border: isScrolled ? '1.5px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: isScrolled ? '#002366' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <FiBell size={20} />
                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#0DBF7B', borderRadius: '50%', border: `2px solid ${isScrolled ? 'white' : '#002366'}` }}></span>
                  </button>
                  <AvatarDropdown />
                </div>
              )}
            </div>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>

      {/* HERO — BOT LEFT, CONTENT RIGHT */}
      <section className="hero" id="hero">
        <div className="spline-wrap">
          <iframe
            src="https://my.spline.design/robotfollowcursorforlandingpage-hS0YvCWqGXh7qtQLoI7hRBJR/"
            title="3D AI Robot"
            allowFullScreen
          />
        </div>
        <div className="ho-top" />
        <div className="ho-right" />
        <div className="ho-bot" />
        <div className="hc">
          <div className="htext">
            <div className="heb">
              <FiZap size={11} fill="currentColor" />
              India's #1 Career Acceleration Platform
            </div>
            <h1 className="hh1">
              Your Dream Job<br />Is One Step <span className="acc">Closer</span>
            </h1>
            <p className="hsub">
              AI-crafted resumes, expert career coaches, and recruiter-boosting tools — built to get you hired faster at India's top companies.
            </p>
            <div className="hbtns">
              <a href="#plans" className="hbp">View Plans & Pricing <FiArrowRight size={15} /></a>
              <a href="#contact" className="hbg"><FiPlay size={12} fill="currentColor" /> Speak to a Coach</a>
            </div>
            <div className="htrust">
              <div className="htp"><div className="htpdot" />2.8M+ Professionals</div>
              <div className="htp"><div className="htpdot" />94% Interview Rate</div>
              <div className="htp"><div className="htpdot" />4.9★ on Google</div>
            </div>
          </div>
        </div>
        <div className="si">
          <div className="sl" />
          <span>Scroll</span>
        </div>
      </section>

      {/* STATS */}
      <div className="ss">
        <div className="ssi">
          {[
            { num: '2.8M+', label: 'Careers Accelerated' },
            { num: '94%', label: 'Interview Success Rate' },
            { num: '1,200+', label: 'Hiring Partners' },
            { num: '4.9★', label: 'Avg. User Rating' },
          ].map((s, i) => (
            <div key={i} className="sti">
              <div className="stn">{s.num}</div>
              <div className="stl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PARTNERS MARQUEE */}
      <div className="partners-sec">
        <div className="partners-track">
          {['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Infosys', 'Wipro', 'TCS', 'Zomato', 'Swiggy', "Byju's", 'Razorpay', 'CRED', 'Meesho', 'PhonePe', 'Paytm', 'Ola', 'Freshworks', 'Zoho',
            'Google', 'Microsoft', 'Amazon', 'Flipkart', 'Infosys', 'Wipro', 'TCS', 'Zomato', 'Swiggy', "Byju's", 'Razorpay', 'CRED', 'Meesho', 'PhonePe', 'Paytm', 'Ola', 'Freshworks', 'Zoho'
          ].map((name, i) => (
            <span key={i} className="partner-logo">{name}</span>
          ))}
        </div>
      </div>

      {/* WHY MAVEN */}
      <div className="feat-sec" id="features">
        <div className="sw2">
          <div className="sf" ref={r5}>
            <div className="sh2">
              <span className="se">WHY MAVENPRO</span>
              <h2 className="stt">Six Pillars of Career<br />Acceleration</h2>
              <div className="sdiv" />
              <p className="sd">Every feature is engineered around one goal — getting you into the interview room faster than the competition.</p>
            </div>
            <div className="feat-grid">
              {features.map((f, i) => (
                <div key={i} className="feat-card fc" style={{ '--d': `${i * 85}ms` }}>
                  <div className="feat-icon" style={{ background: `${f.color}12`, color: f.color }}>{f.icon}</div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="plan-sec" id="plans" style={{ background: '#f0f4fb' }}>
        <div className="sw2">
          <div className="sf" ref={r8}>
            <div className="sh2">
              <span className="se">PRICING</span>
              <h2 className="stt">Choose your plan</h2>
              <div className="sdiv" />
              <p className="sd">{isElite ? 'You are currently on the ELITE plan.' : 'Start free, upgrade when you need more power.'}</p>
              {paymentError && (
                <div style={{ margin: '14px auto 0', maxWidth: 420, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                  {paymentError}
                </div>
              )}
              {paymentSuccess && (
                <div style={{ margin: '14px auto 0', maxWidth: 420, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, color: '#059669', fontSize: 12, fontWeight: 700 }}>
                  {paymentSuccess}
                </div>
              )}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              gap: 24, alignItems: 'stretch', maxWidth: 960, margin: '0 auto',
            }}>
              {/* BASIC */}
              <div style={{
                background: '#fff', borderRadius: 24, padding: '40px 32px',
                border: '1.5px solid #e2e8f0', transition: 'all .3s',
                opacity: isElite ? .7 : 1,
              }}>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, color: '#64748b', marginBottom: 6, letterSpacing: '.05em', textTransform: 'uppercase' }}>BASIC</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#0f172a' }}>Free</span>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.5 }}>
                  Everything you need to get started on your career journey.
                </p>
                <div style={{ marginBottom: 32 }}>
                  {BASIC_FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <FiCheck size={11} color="#10b981" strokeWidth={3} />
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{f.label}</span>
                        <span style={{ fontSize: 12.5, color: '#94a3b8', display: 'block', marginTop: 1 }}>{f.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button disabled style={{
                  width: '100%', padding: '14px', background: isElite ? '#f0fdf4' : '#f1f5f9',
                  color: isElite ? '#16a34a' : '#94a3b8',
                  border: isElite ? '1.5px solid #bbf7d0' : 'none',
                  borderRadius: 12, fontSize: 14, fontWeight: 800,
                  cursor: 'not-allowed', fontFamily: 'var(--fd)',
                }}>
                  {isElite ? <><FiCheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Included in ELITE</> : 'Your Current Plan'}
                </button>
              </div>

              {/* ELITE */}
              <div style={{
                background: 'linear-gradient(145deg, #002a6e, #001a4d)',
                borderRadius: 24, padding: '44px 32px',
                position: 'relative', overflow: 'hidden',
                transform: 'translateY(-8px)',
                border: isElite ? '1.5px solid rgba(251,191,36,.3)' : '1.5px solid transparent',
              }}>
                <div style={{
                  position: 'absolute', top: -80, right: -80, width: 240, height: 240,
                  borderRadius: '50%',
                  background: isElite
                    ? 'radial-gradient(circle, rgba(251,191,36,.08) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(255,255,255,.03) 0%, transparent 70%)',
                }} />

                {isElite ? (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#002366', fontSize: 10.5, fontWeight: 800,
                    padding: '5px 14px', borderRadius: 100,
                    fontFamily: 'var(--fd)', letterSpacing: '.04em',
                  }}>
                    <FiAward size={12} /> ACTIVE
                  </div>
                ) : (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '4px 12px', borderRadius: 100, textTransform: 'uppercase',
                    fontFamily: 'var(--fd)', letterSpacing: '.05em',
                  }}>BEST VALUE</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    fontFamily: 'var(--fd)', fontSize: 15, fontWeight: 800,
                    color: '#fbbf24', letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>{isElite ? 'YOUR PLAN' : 'ELITE'}</div>
                  {isElite && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)',
                      padding: '4px 10px', borderRadius: 6,
                    }}>
                      <FiStar size={11} color="#fbbf24" />
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--fd)' }}>
                        PREMIUM
                      </span>
                    </div>
                  )}
                </div>

                {isElite ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)',
                        padding: '8px 18px', borderRadius: 12,
                      }}>
                        <FiClock size={18} color="#fbbf24" />
                        <div>
                          <div style={{
                            fontSize: 28, fontWeight: 800, color: '#fbbf24',
                            fontFamily: 'var(--fd)', lineHeight: 1, letterSpacing: '-.02em',
                          }}>{daysLeft !== null ? daysLeft : '—'}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 600, marginTop: 1 }}>
                            days left
                          </div>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>
                      Your ELITE membership renews automatically.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>₹999</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>/3 months</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>
                      ₹333/month — cancel anytime
                    </p>
                  </>
                )}

                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', marginBottom: 28, lineHeight: 1.5 }}>
                  {isElite
                    ? 'All premium features are active on your account. Continue enjoying AI tools, recruiter visibility, and more.'
                    : 'Unlock the full power of MavenJobs with AI tools, recruiter visibility, and premium features.'}
                </p>

                <div style={{ marginBottom: 32 }}>
                  {ELITE_FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: isElite ? 'rgba(251,191,36,.15)' : 'rgba(16,185,129,.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        <FiCheck size={11} color={isElite ? '#fbbf24' : '#10b981'} strokeWidth={3} />
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{f.label}</span>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', display: 'block', marginTop: 1 }}>{f.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {isElite ? (
                  <div style={{
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, rgba(251,191,36,.1), rgba(245,158,11,.05))',
                    border: '1.5px solid rgba(251,191,36,.25)',
                    borderRadius: 14, textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#fbbf24',
                      fontFamily: 'var(--fd)', letterSpacing: '.02em',
                    }}>
                      <FiCheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      ELITE Active
                      {daysLeft !== null && (
                        <span style={{ color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
                          {' '}— {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handlePayment('ELITE_QUARTERLY')} disabled={paymentLoading} style={{
                    width: '100%', padding: '16px', background: '#fff', color: '#002366',
                    border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    cursor: paymentLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--fd)',
                    letterSpacing: '.01em',
                  }}>
                    {paymentLoading ? 'Processing…' : 'Upgrade to ELITE — ₹999/3 months'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE COMPARISON */}
      <div className="plan-sec">
        <div className="sw2">
          <div className="sf" ref={r1}>
            <div className="sh2">
              <span className="se">COMPARE PLANS</span>
              <h2 className="stt">Feature comparison</h2>
              <div className="sdiv" />
              <p className="sd">Every feature, every limit, every advantage — transparently laid out so you can choose with complete confidence.</p>
            </div>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {[
                { feat: 'Apply to jobs', basic: <FiCheck size={16} color="#10b981" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'AI job recommendations', basic: '3/day', elite: '5/day' },
                { feat: 'AI ChatBot texts', basic: '50/day', elite: '100/day' },
                { feat: 'Resume Builder', basic: <FiCheck size={16} color="#10b981" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'ATS Score Checker', basic: <FiX size={16} color="#94a3b8" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'Profile visibility for AI matching', basic: <FiX size={16} color="#94a3b8" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'Recruiter Spotlight', basic: <FiX size={16} color="#94a3b8" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'ELITE badge on profile', basic: <FiX size={16} color="#94a3b8" />, elite: <FiCheck size={16} color="#10b981" /> },
                { feat: 'Priority support', basic: <FiX size={16} color="#94a3b8" />, elite: <FiCheck size={16} color="#10b981" /> },
              ].map((row, i) => (
                <div key={i} className="ftr" style={{
                  borderBottom: i < 8 ? '1px solid #f1f5f9' : 'none',
                  background: i % 2 === 0 ? '#f8fafc' : '#fff',
                  borderRadius: i === 0 ? '12px 12px 0 0' : i === 8 ? '0 0 12px 12px' : 0,
                }}>
                  <span className="ftr-f">{row.feat}</span>
                  <div className="ftr-v">{row.basic}</div>
                  <div className="ftr-ve">{row.elite}</div>
                </div>
              ))}
              <div className="ftr" style={{ padding: '4px 20px 0', borderBottom: 'none', background: 'transparent' }}>
                <div></div>
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--fd)' }}>BASIC</div>
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#002366', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--fd)' }}>ELITE</div>
              </div>

              {isElite && (
                <div style={{
                  marginTop: 32, padding: '18px 24px',
                  background: 'linear-gradient(135deg, rgba(251,191,36,.06), rgba(245,158,11,.03))',
                  border: '1px solid rgba(251,191,36,.15)',
                  borderRadius: 16, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiAward size={18} color="#002366" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', fontFamily: 'var(--fd)' }}>
                        You're on ELITE
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 1 }}>
                        {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining in your billing cycle` : 'Enjoying all premium features'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { if (!user) openLogin(); else window.location.href = '/dashboard'; }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 22px', background: '#002366', color: '#fff',
                    borderRadius: 10, fontSize: 13, fontWeight: 800,
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--fd)',
                  }}>Go to Dashboard <FiArrowRight size={14} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <div className="gal-sec">
        <div className="sw2">
          <div className="sf" ref={r6}>
            <div className="sh2">
              <span className="se">MAVEN IN ACTION</span>
              <h2 className="stt">Where Ambition Meets<br />Opportunity</h2>
              <div className="sdiv" />
              <p className="sd">From live coaching sessions to AI-driven dashboards — MavenPro is the platform serious professionals trust.</p>
            </div>
            <div className="gal-grid">
              {galleryImages.map((img, i) => (
                <div key={i} className="gal-item">
                  <img src={img.src} alt={img.label} loading="lazy" />
                  <div className="gal-overlay">
                    <span className="gal-label">{img.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS — initials only, no photos */}
      <div className="test-sec">
        <div className="sw2">
          <div className="sf" ref={r7}>
            <div className="sh2">
              <span className="se">SUCCESS STORIES</span>
              <h2 className="stt">Trusted by 2.8M+<br />Ambitious Professionals</h2>
              <div className="sdiv" />
              <p className="sd">Hear directly from the people whose careers were transformed — in their own words, unedited.</p>
            </div>
            <div className="test-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="test-card fc" style={{ '--d': `${i * 100}ms` }}>
                  <div className="test-quote-ico"><FaQuoteLeft size={30} /></div>
                  <div className="test-stars">
                    {Array(t.stars).fill(0).map((_, j) => (
                      <FiStar key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <p className="test-text">"{t.text}"</p>
                  <div className="test-author">
                    <div className="test-initials" style={{ background: `${t.color}14`, color: t.color }}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="test-name">{t.name}</div>
                      <div className="test-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <section style={{
        background: isElite
          ? 'linear-gradient(135deg, #002a6e 0%, #001a4d 100%)'
          : 'linear-gradient(135deg,#000e24 0%,#002366 100%)',
        padding: '80px 0', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: isElite
            ? 'radial-gradient(circle at 50% 50%, rgba(251,191,36,.04) 0%, transparent 60%)'
            : 'none',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          {isElite ? (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(251,191,36,.25)',
              }}>
                <FiAward size={36} color="#002366" />
              </div>
              <h2 style={{
                fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.6vw,44px)',
                fontWeight: 800, color: '#fff', lineHeight: 1.12, marginBottom: 16,
              }}>
                Your ELITE membership<br />
                <span style={{ color: '#fbbf24' }}>is active</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 36, lineHeight: 1.65 }}>
                You have full access to AI job matching, advanced ChatBot, resume tools,
                and recruiter visibility features.
                {daysLeft !== null && (
                  <> <strong style={{ color: '#fbbf24', fontWeight: 700 }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> remaining.</>
                )}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '15px 34px', background: '#10b981', color: '#fff',
                  fontWeight: 800, fontSize: 14.5, borderRadius: 100,
                  textDecoration: 'none', fontFamily: 'var(--fd)',
                  boxShadow: '0 8px 28px rgba(16,185,129,.35)', transition: 'all .25s',
                }} onMouseEnter={e => { e.target.style.background = '#0da371'; e.target.style.transform = 'translateY(-2px)'; }}
                   onMouseLeave={e => { e.target.style.background = '#10b981'; e.target.style.transform = 'none'; }}>
                  Go to Dashboard <FiArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <FiAward size={40} color="#fbbf24" style={{ marginBottom: 20 }} />
              <h2 style={{
                fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.6vw,44px)',
                fontWeight: 800, color: '#fff', lineHeight: 1.08, marginBottom: 16,
              }}>
                Ready to go ELITE?
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 36, lineHeight: 1.65 }}>
                Join thousands of professionals who have upgraded their career with
                AI-powered tools and recruiter visibility.
              </p>
              <button onClick={() => { if (!user) { openLogin(); return; } handlePayment('ELITE_QUARTERLY'); }} disabled={paymentLoading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '15px 34px', background: '#10b981', color: '#fff',
                fontWeight: 800, fontSize: 14.5, borderRadius: 100,
                border: 'none', cursor: paymentLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--fd)', opacity: paymentLoading ? .7 : 1,
                boxShadow: '0 8px 28px rgba(16,185,129,.35)', transition: 'all .25s',
              }} onMouseEnter={e => { if (!paymentLoading) { e.target.style.background = '#0da371'; e.target.style.transform = 'translateY(-2px)'; } }}
                 onMouseLeave={e => { if (!paymentLoading) { e.target.style.background = '#10b981'; e.target.style.transform = 'none'; } }}>
                {paymentLoading ? 'Processing…' : 'Upgrade Now — ₹999/3 months'} <FiArrowRight size={16} />
              </button>
              {paymentError && (
                <p style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700, marginTop: 16 }}>{paymentError}</p>
              )}
            </>
          )}
        </div>
      </section>

      {/* FAQ */}
      <div className="faq-sec" id="faq">        <div className="sw2">
        <div className="sh2">
          <span className="se">GOT QUESTIONS?</span>
          <h2 className="stt">Frequently Asked Questions</h2>
          <div className="sdiv" />
          <p className="sd">Everything you need to know about MavenPro plans, delivery timelines, and how we help you get hired.</p>
        </div>
        <div className="faq-wrap">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} idx={i} />
          ))}
        </div>
      </div>
      </div>

      {/* CONTACT */}
      <section id="contact" className="con">
        <div className="sw2">
          <div className="cong sf" ref={r4}>
            <div>
              <h2 className="conh2">Talk to a Career Expert — Free</h2>
              <p className="cons">Not sure which plan is right for you? Our experts will analyse your profile, understand your goals, and recommend the fastest path to your next offer.</p>
              {[
                { icon: <FiPhone size={20} />, title: 'Call Us Anytime', info: 'Toll Free: 1800-102-5557', sub: 'MON – SAT · 9:00 AM – 9:00 PM IST', color: '#10b981' },
                { icon: <FiMail size={20} />, title: 'Email Support', info: 'support@mavenjobs.com', sub: 'Average reply time: under 2 hours', color: '#002366' },
                { icon: <FiMapPin size={20} />, title: 'Corporate Headquarters', info: 'Level 4, Maven Tower, Bangalore', sub: 'Karnataka · 560 103', color: '#6366f1' },
              ].map((item, i) => (
                <div key={i} className="coni">
                  <div className="conico" style={{ background: `${item.color}0f`, color: item.color }}>{item.icon}</div>
                  <div>
                    <div className="conit">{item.title}</div>
                    <div className="conii">{item.info}</div>
                    <div className="conis">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fw">
              <div className="fr">
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Full Name</label>
                  <input className="fi" type="text" placeholder="Rahul Sharma" />
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Work Email</label>
                  <input className="fi" type="email" placeholder="rahul@company.com" />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Phone Number</label>
                <div className="pg">
                  <div className="pp">+91</div>
                  <input className="fi pi" type="tel" placeholder="98765 43210" />
                </div>
              </div>
              <div className="fg">
                <label className="fl">How Can We Help?</label>
                <textarea className="fi fta" rows={4} placeholder="I'm looking to switch from finance to product management and need help with my resume and interview prep..." />
              </div>
              <button className="bsmt">Request a Free Callback →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <LandingFooter />
    </>
  );
};

export default MavenPro;