import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployerFooter from '../../../../components/EmployerFooter';
import {
  FiCheck, FiX, FiUsers, FiChevronDown, FiArrowRight,
  FiBriefcase, FiPhoneCall, FiSearch, FiZap, FiShield,
  FiTrendingUp, FiStar, FiAward, FiBarChart2, FiMessageCircle, FiHeart,
} from 'react-icons/fi';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import { useAuth } from '../../../../AuthContext';
import paymentService from '../../../../services/paymentService';
import LandingEmployeeHeader from '../../../../components/employer/LandingEmployeeHeader';

/* ── Helpers ── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return y;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Data ── */
const JOB_PLANS = [
  {
    name: 'Hot Vacancy',
    price: '₹1,650',
    accent: '#002366',
    badge: 'Most Popular',
    validity: '30 days',
    hot: true,
    features: [
      { text: 'Full detailed job description', included: true },
      { text: '3 job locations', included: true },
      { text: 'Unlimited applications', included: true },
      { text: 'Applications valid 90 days', included: true },
      { text: 'Jobseeker contact details', included: true },
      { text: 'Boosted on search page', included: true },
      { text: 'Job branding & logo', included: true },
    ],
  },
  {
    name: 'Classified',
    price: '₹850',
    accent: '#002366',
    badge: null,
    validity: '30 days',
    hot: false,
    features: [
      { text: 'Up to 250 char description', included: true },
      { text: '3 job locations', included: true },
      { text: 'Unlimited applications', included: true },
      { text: 'Applications valid 90 days', included: true },
      { text: 'Jobseeker contact details', included: true },
      { text: 'Boosted on search page', included: false },
      { text: 'Job branding & logo', included: false },
    ],
  },
  {
    name: 'Standard',
    price: '₹400',
    accent: '#002366',
    badge: null,
    validity: '15 days',
    hot: false,
    features: [
      { text: 'Up to 250 char description', included: true },
      { text: '1 job location', included: true },
      { text: '200 applications', included: true },
      { text: 'Applications valid 30 days', included: true },
      { text: 'Jobseeker contact details', included: false },
      { text: 'Boosted on search page', included: false },
      { text: 'Job branding & logo', included: false },
    ],
  },
  {
    name: 'Free',
    price: 'Free',
    accent: '#10b981',
    badge: null,
    validity: '7 days',
    hot: false,
    isFree: true,
    features: [
      { text: 'Up to 250 char description', included: true },
      { text: '1 job location', included: true },
      { text: '50 applications', included: true },
      { text: 'Applications valid 15 days', included: true },
      { text: 'Jobseeker contact details', included: false },
      { text: 'Boosted on search page', included: false },
      { text: 'Job branding & logo', included: false },
    ],
  },
];

const FAQS = [
  { question: 'How long is a job posting active?', answer: 'Validity depends on your chosen plan — Free (7 days), Standard (15 days), Classified & Hot Vacancy (30 days). You can extend anytime by purchasing additional validity credits from your dashboard.' },
  { question: 'What is Resdex and how does it work?', answer: 'Resdex is MavenJobs\' exclusive resume database with 8Cr+ active profiles. You search by skills, experience, location, salary band, and industry — then contact candidates directly without waiting for applications.' },
  { question: 'Can I upgrade my plan later?', answer: 'Yes. Upgrades are seamless and pro-rated — the remaining value of your current plan is automatically credited against the new plan cost at checkout.' },
  { question: 'Are there any hidden charges?', answer: 'None. All pricing shown is transparent and exclusive of GST, which is added at checkout as applicable. No setup fees, no auto-renewals without consent.' },
  { question: 'What industries does MavenJobs cover?', answer: 'MavenJobs covers 60+ industry verticals — IT, Finance, Healthcare, Manufacturing, Retail, Logistics, Education, and more. Our candidate pool spans metro cities as well as Tier-2 and Tier-3 markets across India.' },
  { question: 'How quickly will I receive applications?', answer: 'Hot Vacancy postings typically receive applications within hours of publishing, thanks to our boosted placement on the job search page and automated alerts sent to matched candidates.' },
];

const STATS = [
  { value: '8 Cr+', label: 'Active Job Seekers' },
  { value: '1.5L+', label: 'Partner Companies' },
  { value: '50L+', label: 'Jobs Posted' },
  { value: '98%', label: 'Employer Satisfaction' },
];

const HIGHLIGHTS = [
  { Icon: FiUsers, color: '#002366', bg: '#EEF2FF', title: 'Verified Candidate Pool', desc: 'Every profile is screened for authenticity — you only see serious, active job seekers across all industries.' },
  { Icon: FiBriefcase, color: '#10b981', bg: '#ECFDF5', title: 'Industry-Matched Hiring', desc: 'Our matching algorithm surfaces candidates with directly relevant experience, cutting your screening time in half.' },
  { Icon: FiBarChart2, color: '#6366f1', bg: '#F0F0FF', title: 'SMB-First Pricing', desc: 'Plans from ₹400 — built so growing businesses can hire professionally without enterprise budgets.' },
];

/* ── Sub-components ── */
function PlanCard({ plan, index, onBuy }) {
  const [ref, visible] = useInView(0.08);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? 'translateY(-6px)' : 'translateY(0)'
          : 'translateY(32px)',
        transition: `opacity 0.55s ease ${index * 0.1}s, transform 0.3s ease`,
        position: 'relative',
        borderRadius: 22,
        background: plan.hot ? '#001540' : '#FFFFFF',
        border: plan.hot ? 'none' : '1.5px solid #E2E8F0',
        padding: '32px 26px 28px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: plan.hot
          ? '0 28px 64px rgba(0,35,102,0.28), 0 8px 20px rgba(0,0,0,0.14)'
          : hovered
            ? '0 16px 48px rgba(0,35,102,0.10)'
            : '0 2px 10px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {plan.hot && (
        <>
          <div style={{ position: 'absolute', top: -70, right: -70, width: 200, height: 200, background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 160, height: 160, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </>
      )}

      {plan.badge && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: 100, marginBottom: 18, width: 'fit-content',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <FiStar size={9} /> {plan.badge}
        </span>
      )}

      <h4 style={{ fontSize: 19, fontWeight: 800, color: plan.hot ? '#F1F5F9' : '#0f172a', marginBottom: 6, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {plan.name}
      </h4>

      <div style={{ marginBottom: 4 }}>
        {plan.isFree
          ? <span style={{ fontSize: 30, fontWeight: 800, color: '#10b981', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Free</span>
          : <>
            <span style={{ fontSize: 30, fontWeight: 800, color: plan.hot ? '#FFFFFF' : '#002366', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{plan.price}</span>
            <span style={{ fontSize: 11.5, color: plan.hot ? '#64748b' : '#94a3b8', marginLeft: 5 }}>+GST</span>
          </>
        }
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 700,
        color: plan.hot ? '#60a5fa' : '#64748b',
        background: plan.hot ? 'rgba(96,165,250,0.1)' : '#f1f5f9',
        padding: '3px 10px', borderRadius: 100, marginBottom: 24, width: 'fit-content',
      }}>Valid {plan.validity}</div>

      <div style={{ borderTop: plan.hot ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9', paddingTop: 18, marginBottom: 24, flex: 1 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: f.included ? (plan.hot ? '#cbd5e1' : '#334155') : (plan.hot ? '#374151' : '#c4cdd8'), textDecoration: f.included ? 'none' : 'line-through' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.included ? (plan.hot ? 'rgba(16,185,129,0.14)' : '#dcfce7') : (plan.hot ? 'rgba(255,255,255,0.04)' : '#f8fafc') }}>
                {f.included
                  ? <FiCheck size={10} color={plan.hot ? '#4ade80' : '#16a34a'} strokeWidth={3} />
                  : <FiX size={9} color={plan.hot ? '#374151' : '#cbd5e1'} strokeWidth={2.5} />}
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <button style={{
        width: '100%', padding: '13px 0', borderRadius: 13,
        border: plan.hot ? 'none' : `1.5px solid ${plan.isFree ? '#10b981' : '#002366'}`,
        background: plan.hot ? 'linear-gradient(135deg, #002366 0%, #003db5 100%)' : 'transparent',
        color: plan.hot ? '#fff' : plan.isFree ? '#10b981' : '#002366',
        fontSize: 13.5, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        boxShadow: plan.hot ? '0 6px 20px rgba(0,35,102,0.35)' : 'none',
        transition: 'all 0.2s ease',
      }}
        onMouseEnter={e => {
          if (!plan.hot) e.currentTarget.style.background = plan.isFree ? '#ecfdf5' : '#EEF2FF';
        }}
        onMouseLeave={e => {
          if (!plan.hot) e.currentTarget.style.background = 'transparent';
        }}
        onClick={() => onBuy(plan)}
      >
        {plan.isFree ? 'Post a free job' : 'Buy now →'}
      </button>
    </div>
  );
}

function StatCard({ value, label, index }) {
  const [ref, visible] = useInView(0.2);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
      textAlign: 'center', padding: '28px 16px',
      borderRight: index < 3 ? '1px solid #e2e8f0' : 'none',
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#002366', lineHeight: 1, marginBottom: 5, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1.5px solid ${isOpen ? '#bfdbfe' : '#e2e8f0'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'border-color 0.25s, box-shadow 0.25s',
      boxShadow: isOpen ? '0 4px 24px rgba(0,35,102,0.08)' : 'none',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.4, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{faq.question}</span>
        <span style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginLeft: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOpen ? '#EEF2FF' : '#f8fafc',
          border: `1px solid ${isOpen ? '#c7d2fe' : '#e2e8f0'}`,
          transition: 'all 0.2s',
        }}>
          <FiChevronDown size={15} color={isOpen ? '#002366' : '#94a3b8'} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
        </span>
      </button>
      <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
        <p style={{ padding: '0 24px 20px', margin: 0, fontSize: 14.5, color: '#475569', lineHeight: 1.75, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>{faq.answer}</p>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Buyonline() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeModalPlan, setActiveModalPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  const handlePremiumUpgrade = async () => {
    setPaymentError("");
    setPaymentSuccess("");
    if (!user) { alert("Please log in to upgrade."); return; }

    try {
      setPaymentLoading(true);
      const orderRes = await paymentService.createOrder("PREMIUM");
      const { orderId, amount, currency, keyId, planLabel, durationDays } = orderRes.data;

      await paymentService.openCheckout({
        order: { orderId, amount, currency, planLabel, durationDays },
        keyId,
        user,
        onSuccess: () => {
          setPaymentSuccess("PREMIUM package activated! Your job limit has been increased.");
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

  const handleJobPostPayment = async (plan) => {
    setPaymentError("");
    setPaymentSuccess("");
    if (!user) { alert("Please log in to continue."); return; }

    const priceNum = parseInt(plan.price.replace(/[^\d]/g, ""));
    if (!priceNum) { setActiveModalPlan(null); return; }

    try {
      setPaymentLoading(true);
      const orderRes = await paymentService.createOrder("JOB_POST", priceNum * 100);
      const { orderId, amount, currency, keyId, planLabel, durationDays } = orderRes.data;

      await paymentService.openCheckout({
        order: { orderId, amount, currency, planLabel, durationDays },
        keyId,
        user,
        onSuccess: () => {
          setPaymentSuccess(`${plan.name} purchased successfully!`);
          setActiveModalPlan(null);
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

  const scrollY = useScrollY();
  const [heroRef, heroVisible] = useInView(0.05);
  const navScrolled = scrollY > 50;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1e293b', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#bfdbfe}
        html{scroll-behavior:smooth}
        .nav-link{font-size:13.5px;font-weight:600;color:#475569;text-decoration:none;padding:6px 2px;position:relative;transition:color .2s}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:#002366;border-radius:2px;transition:width .22s}
        .nav-link:hover{color:#002366}
        .nav-link:hover::after{width:100%}
        .badge-new{display:inline-flex;align-items:center;background:linear-gradient(90deg,#002366,#0038a0,#002366);background-size:200% 100%;animation:shim 2.8s linear infinite;color:white;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:100px;margin-left:7px}
        @keyframes shim{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .plan-table td,.plan-table th{transition:background .15s}
        .plan-table tr:hover td{background:#f8fafc}
        @media(max-width:900px){
          .hero-img{display:none!important}
          .plans-grid{grid-template-columns:1fr 1fr!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .hl-grid{flex-direction:column!important}
          .rd-grid{grid-template-columns:1fr!important}
          .nav-ctr{display:none!important}
        }
        @media(max-width:600px){
          .plans-grid{grid-template-columns:1fr!important}
          .assist-grid{grid-template-columns:1fr!important}
        }

        /* Purchase Modal Styles */
        .pm-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: kmFadeIn 0.3s ease;
        }
        .pm-box {
          background: #ffffff; width: 100%; max-width: 860px;
          border-radius: 28px; position: relative; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.3);
          animation: kmSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pm-close {
          position: absolute; top: 24px; right: 24px;
          background: #f1f5f9; border: none; color: #64748b;
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; z-index: 10;
        }
        .pm-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }

        .pm-container { display: flex; min-height: 520px; }
        
        .pm-left {
          flex: 0.9; background: #001540; padding: 48px;
          color: #fff; position: relative; display: flex; flex-direction: column;
        }
        .pm-tag { font-size: 10px; font-weight: 800; color: #10b981; letter-spacing: .2em; margin-bottom: 12px; display: block; }
        .pm-left h3 { font-family: 'Bricolage Grotesque', sans-serif; fontSize: 28px; margin-bottom: 16px; }
        .pm-price-block { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
        .pm-amt { font-size: 32px; font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; }
        .pm-gst { font-size: 13px; color: rgba(255,255,255,0.4); }
        .pm-validity { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 40px; }

        .pm-feat-list { flex: 1; }
        .pm-feat-title { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.3); letter-spacing: .1em; margin-bottom: 16px; }
        .pm-feat-item { display: flex; gap: 12px; margin-bottom: 14px; font-size: 14px; color: rgba(255,255,255,0.8); }

        .pm-badge-trust {
          margin-top: auto; display: flex; gap: 10px; align-items: center;
          background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 12px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6);
        }

        .pm-right { flex: 1.1; padding: 48px; background: #fff; }
        .pm-right h4 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; color: #0f172a; margin-bottom: 8px; }
        .pm-right p { font-size: 14px; color: #64748b; margin-bottom: 32px; }

        .pm-bill-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
        .pm-bill-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; color: #475569; }
        .pm-bill-divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
        .pm-bill-row.pm-total { font-size: 18px; font-weight: 800; color: #002366; margin-bottom: 0; }

        .pm-promo-apply { display: flex; gap: 12px; margin-bottom: 32px; }
        .pm-promo-apply input { flex: 1; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none; font-size: 14px; }
        .pm-promo-apply input:focus { border-color: #002366; }
        .pm-promo-apply button { background: #EEF2FF; color: #002366; border: 1px solid #c7d2fe; padding: 0 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }

        .pm-main-btn {
          width: 100%; background: #002366; color: #fff; border: none;
          padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 800;
          cursor: pointer; transition: all 0.2s; font-family: 'Bricolage Grotesque', sans-serif;
        }
        .pm-main-btn:hover { background: #001540; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,35,102,0.2); }
        .pm-secure-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px; font-size: 11px; color: #94a3b8; font-weight: 600; }

        .pm-input-group { margin-bottom: 15px; }
        .pm-input-group label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; }
        .pm-input-group input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; outline: none; }
        .pm-input-group input:focus { border-color: #10b981; }

        @media(max-width: 800px) {
          .pm-container { flex-direction: column; }
          .pm-left { padding: 32px; }
          .pm-right { padding: 32px; }
          .pm-box { max-height: 90vh; overflow-y: auto; }
        }
      `}</style>

      {/* ── PROMO BAR ── */}
      {/* <div style={{ background: 'linear-gradient(90deg,#001540,#002b7a,#001540)', backgroundSize: '200% 100%', animation: 'shim 5s linear infinite', color: '#fff', padding: '10px 0', textAlign: 'center', fontSize: 11.5, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: "'Bricolage Grotesque',sans-serif", position: 'sticky', top: 0, zIndex: 200 }}>
        <FiZap size={11} fill="currentColor" />
        <span>20% off all paid plans · Code <span style={{ color: '#6ee7b7' }}>MAVEN20</span> · Offer ends Friday</span>
        <FiZap size={11} fill="currentColor" />
      </div> */}

      {/* ── NAV ── */}
      {/* <nav style={{ position: 'sticky', top: 42, left: 0, right: 0, zIndex: 100, padding: navScrolled ? '14px 40px' : '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: navScrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(18px)', borderBottom: navScrolled ? '1px solid #e2e8f0' : '1px solid rgba(226,232,240,0.5)', boxShadow: navScrolled ? '0 4px 24px rgba(0,35,102,0.07)' : 'none', transition: 'all 0.3s ease' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={mavenLogo} alt="MavenJobs" style={{ height: 30 }} />
        </Link>
        <div className="nav-ctr" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link to="/employer-login" className="nav-link">Our Offerings</Link>
          <a href="#" className="nav-link" style={{ display: 'flex', alignItems: 'center' }}>
            Maven Talent Cloud <span className="badge-new">NEW</span>
          </a>
          <a href="#job-plans" className="nav-link">Job Posting</a>
          <a href="#resdex-plans" className="nav-link">Resdex</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
              <FiPhoneCall size={13} color="#002366" />
            </div>
            <span style={{ display: window.innerWidth < 900 ? 'none' : 'inline' }}>1800-102-5557</span>
          </div>
          {!user && (
            <Link to="/employer-login" style={{ fontSize: 13.5, fontWeight: 800, color: '#002366', textDecoration: 'none', padding: '9px 20px', border: '1.5px solid #c7d2fe', borderRadius: 11, background: '#EEF2FF', transition: 'all 0.2s', fontFamily: "'Bricolage Grotesque',sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#c7d2fe'; }}>
              Employer Login
            </Link>
          )}

        </div>
      </nav> */}

      <div>

        <LandingEmployeeHeader />
      </div>

      {/* ── HERO ── */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: '80px 40px 60px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 60, left: -120, width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,35,102,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: -60, width: 380, height: 380, background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div ref={heroRef} style={{ display: 'flex', alignItems: 'center', gap: 72, width: '100%' }}>
          {/* Left */}
          <div style={{ flex: '0 0 50%', maxWidth: 580 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', border: '1px solid #c7d2fe', color: '#002366', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 100, marginBottom: 24, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s' }}>
              <FiZap size={11} /> India's #1 Employer Platform
            </div>

            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(34px,4.5vw,54px)', fontWeight: 800, lineHeight: 1.08, color: '#0f172a', marginBottom: 18, letterSpacing: '-0.03em', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(28px)', transition: 'opacity 0.55s ease 0.2s, transform 0.55s ease 0.2s' }}>
              Find, Attract &amp;<br /><span style={{ color: '#002366' }}>Hire</span> <span style={{ color: '#10b981' }}>Exceptional</span><br />Talent — Fast
            </h1>

            <p style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.72, marginBottom: 34, maxWidth: 460, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.55s ease 0.3s, transform 0.55s ease 0.3s' }}>
              Connect with 8 crore+ active job seekers on MavenJobs. Post jobs, search resumes, and build your dream team — all in one platform built for Indian businesses.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.55s ease 0.4s, transform 0.55s ease 0.4s' }}>
              <button style={{ background: '#002366', color: '#fff', border: 'none', padding: '14px 30px', borderRadius: 13, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(0,35,102,0.28)', transition: 'all 0.2s', fontFamily: "'Bricolage Grotesque',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = '#001540'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,35,102,0.36)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#002366'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,35,102,0.28)'; }}>
                Post a Free Job <FiArrowRight size={16} />
              </button>
              <button style={{ background: '#fff', color: '#002366', border: '1.5px solid #c7d2fe', padding: '14px 28px', borderRadius: 13, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}>
                View all plans
              </button>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', opacity: heroVisible ? 1 : 0, transition: 'opacity 0.55s ease 0.5s' }}>
              {[{ icon: FiShield, text: 'Verified Candidates' }, { icon: FiTrendingUp, text: 'Fast Shortlisting' }, { icon: FiAward, text: 'SMB-Friendly Plans' }].map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon size={13} color="#10b981" />
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="hero-img" style={{ flex: 1, position: 'relative', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'scale(1)' : 'scale(0.96)', transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s' }}>
            <div style={{ position: 'absolute', inset: -20, background: 'linear-gradient(135deg, rgba(0,35,102,0.08) 0%, rgba(16,185,129,0.05) 100%)', borderRadius: 32, filter: 'blur(36px)' }} />
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80"
              alt="Team hiring"
              style={{ width: '100%', height: 480, objectFit: 'cover', borderRadius: 26, position: 'relative', zIndex: 1, border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 36px 80px rgba(0,35,102,0.14)' }}
            />
            {/* Floating stat card */}
            <div style={{ position: 'absolute', bottom: -18, left: -22, zIndex: 2, background: '#fff', borderRadius: 18, padding: '16px 22px', boxShadow: '0 16px 48px rgba(0,35,102,0.13)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14, animation: 'float 4s ease-in-out infinite' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUsers size={20} color="#002366" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', fontFamily: "'Bricolage Grotesque',sans-serif" }}>2,340+</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Hires this week</div>
              </div>
            </div>
            {/* Top badge */}
            <div style={{ position: 'absolute', top: 20, right: -14, zIndex: 2, background: '#fff', borderRadius: 14, padding: '12px 18px', boxShadow: '0 8px 32px rgba(16,185,129,0.15)', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiTrendingUp size={17} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: "'Bricolage Grotesque',sans-serif" }}>94%</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Hire success rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 960, margin: '0 auto', padding: '0 40px' }}>
          {STATS.map((s, i) => <StatCard key={i} {...s} index={i} />)}
        </div>
      </div>

      {/* ── PARTNERS MARQUEE ── */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '22px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 56, animation: 'shim 0s, marquee 22s linear infinite', width: 'max-content', alignItems: 'center' }}>
          <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
          {['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Infosys', 'Wipro', 'TCS', 'Zomato', 'Swiggy', 'Razorpay', 'CRED', 'Meesho', 'PhonePe', 'Ola', 'Freshworks', 'Zoho',
            'Google', 'Microsoft', 'Amazon', 'Flipkart', 'Infosys', 'Wipro', 'TCS', 'Zomato', 'Swiggy', 'Razorpay', 'CRED', 'Meesho', 'PhonePe', 'Ola', 'Freshworks', 'Zoho'
          ].map((name, i) => (
            <span key={i} style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 12, fontWeight: 800, color: '#cbd5e1', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'default' }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── HIRING MADE EASY ── */}
      <section style={{ padding: '88px 40px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', fontFamily: "'Bricolage Grotesque',sans-serif", marginBottom: 14 }}>THREE WAYS TO HIRE</span>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>Hiring Made Easy</h2>
          <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>Choose the approach that fits your business — from self-serve to fully managed.</p>
        </div>

        <div className="rd-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { tag: 'JOB POSTING', title: 'Post a job, receive quality applications', features: ['Attract verified candidates', 'Customise description & requirements', 'Boost visibility on search'], target: '#job-plans', icon: FiBriefcase, color: '#002366', bg: '#EEF2FF' },
            { tag: 'RESDEX', title: 'Search India\'s largest resume database', features: ['8Cr+ profiles available now', 'Filter by 20 + parameters', 'Contact candidates directly'], target: '#resdex - plans', icon: FiSearch, color: '#10b981', bg: '#ecfdf5', badge: true },
            { tag: 'EXPERT ASSIST', title: 'Let our hiring experts do it for you', features: ['Dedicated recruitment specialist', 'Profiles screened & shortlisted', 'You only see the best matches'], target: '#expert-plans', icon: FiUsers, color: '#6366f1', bg: '#f0f0ff' },
          ].map((item, i) => {
            const [ref, vis] = useInView(0.1);
            return (
              <div key={i} ref={ref} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 24, padding: '36px 32px', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,35,102,0.09)'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {item.badge && <div style={{ position: 'absolute', top: 0, right: 0, background: '#002366', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '4px 14px', borderRadius: '0 22px 0 12px', letterSpacing: '.08em' }}>MOST SEARCHED</div>}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <item.icon size={22} color={item.color} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', color: item.color, marginBottom: 10, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{item.tag}</span>
                <h3 style={{ fontSize: 17.5, fontWeight: 800, color: '#1e293b', marginBottom: 20, lineHeight: 1.4, flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{item.title}</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 30 }}>
                  {item.features.map((f, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#64748b' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiCheck size={10} color={item.color} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={item.target} style={{ fontSize: 13.5, fontWeight: 800, color: item.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Bricolage Grotesque',sans-serif", transition: 'gap 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.gap = '10px'}
                  onMouseLeave={e => e.currentTarget.style.gap = '6px'}>
                  View plans <FiArrowRight size={14} />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HIGHLIGHTS ── */}
      <div style={{ background: '#fff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ padding: '60px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div className="hl-grid" style={{ display: 'flex', gap: 20 }}>
            {HIGHLIGHTS.map(({ Icon, color, bg, title, desc }, i) => {
              const [ref, vis] = useInView(0.1);
              return (
                <div key={i} ref={ref} style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '28px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s` }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={21} color={color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#1e293b', marginBottom: 6, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{title}</h3>
                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── JOB POSTING PLANS ── */}
      <section id="job-plans" style={{ padding: '88px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#002366', background: '#EEF2FF', border: '1px solid #c7d2fe', padding: '5px 16px', borderRadius: 100, marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Job Posting Plans</span>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>
            Attract the <span style={{ color: '#002366' }}>Right Candidates</span>
          </h2>
          <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>Quick, flexible plans on India's most-trusted job portal — built specifically for small and medium businesses.</p>
        </div>

        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {JOB_PLANS.map((plan, i) => <PlanCard key={i} plan={plan} index={i} onBuy={setActiveModalPlan} />)}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>* All prices are exclusive of GST as applicable</p>
      </section>

      {/* ── RESDEX ── */}
      <section id="resdex-plans" style={{ padding: '0 40px 88px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: '#001540', borderRadius: 28, overflow: 'hidden', position: 'relative', padding: '64px 60px' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 16px', borderRadius: 100, marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Resume Database</span>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 800, color: '#f8fafc', marginBottom: 12, letterSpacing: '-0.03em' }}>
                India's Largest <span style={{ color: '#6ee7b7' }}>Resume Database</span>
              </h2>
              <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#10b981,#6ee7b7)', borderRadius: 3, margin: '0 auto 14px' }} />
              <p style={{ fontSize: 15.5, color: '#94a3b8', maxWidth: 460, margin: '0 auto' }}>Search by location, industry, skills, salary, and 20+ filters to find exactly the right fit.</p>
            </div>

            <div className="rd-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Resdex Lite */}
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '40px 36px', backdropFilter: 'blur(16px)' }}>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Resdex Lite</h4>
                <p style={{ fontSize: 13.5, color: '#94a3b8', marginBottom: 26, lineHeight: 1.65 }}>Best for SMBs with focused, role-specific hiring needs.</p>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: "'Bricolage Grotesque',sans-serif" }}>₹4,000</span>
                  <span style={{ fontSize: 13, color: '#64748b', marginLeft: 6 }}>+GST</span>
                </div>
                <p style={{ fontSize: 12, color: '#475569', marginBottom: 30 }}>per requirement</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {['100 CV views per requirement', 'Up to 500 search results', 'Candidates active in last 6 months', '10+ advanced filters', 'Single user access'].map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#cbd5e1' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiCheck size={10} color="#4ade80" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button style={{ width: '100%', padding: '14px 0', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #002366, #003db5)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,35,102,0.4)', fontFamily: "'Bricolage Grotesque',sans-serif", transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,35,102,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,35,102,0.4)'; }}
                  onClick={() => setActiveModalPlan({ name: 'Resdex Lite', price: '₹4,000', validity: '30 days', type: 'resdex', features: ['100 CV views', '500 search results', 'Single user access'] })}
                >
                  Buy now →
                </button>
              </div>

              {/* Resdex Pro */}
              <div style={{ background: '#ffffff', borderRadius: 22, padding: '40px 36px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h4 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', fontFamily: "'Bricolage Grotesque',sans-serif" }}>Resdex Pro</h4>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: '#EEF2FF', color: '#002366', border: '1px solid #c7d2fe', padding: '4px 12px', borderRadius: 100, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Enterprise</span>
                </div>
                <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 26, lineHeight: 1.65 }}>Custom solutions and dedicated support for large-scale, continuous hiring needs.</p>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', fontFamily: "'Bricolage Grotesque',sans-serif" }}>Custom</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 30 }}>Tailored to your plan, headcount & requirements</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {['CV views as per your plan', 'Unlimited search results', 'All candidate pools including passive', '20+ advanced search filters', 'Multi-user team access', 'Bulk CV downloads'].map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#334155' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiCheck size={10} color="#16a34a" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button style={{ width: '100%', padding: '14px 0', borderRadius: 13, border: '2px solid #002366', background: 'transparent', color: '#002366', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Bricolage Grotesque',sans-serif", transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setActiveModalPlan({ name: 'Resdex Pro', price: 'Custom', type: 'enterprise', features: ['Unlimited searches', 'Multi-user access', 'Dedicated Support'] })}
                >
                  Contact Sales →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERT ASSIST ── */}
      <section id="expert-plans" style={{ padding: '0 40px 88px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '5px 16px', borderRadius: 100, marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Expert Assist</span>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>
            Let Our Hiring Experts <span style={{ color: '#10b981' }}>Do It For You</span>
          </h2>
          <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15.5, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>Source, screen, and handpick top talent with dedicated Maven recruitment specialists — you only review the best.</p>
        </div>

        <div className="assist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { title: 'Assisted Hiring for Job Posting', price: '₹4,000', validity: '90 days', steps: ['Dedicated hiring expert consultation', 'Job posting on MavenJobs for maximum reach', 'Shortlisting of the most relevant applicants', 'Screened profiles delivered for final selection'] },
            { title: 'Assisted Hiring for Resdex', price: '₹5,000', validity: '15 days', steps: ['Personalised consultation with recruitment expert', 'Tailored Resdex search matching your exact criteria', 'Direct access to 8Cr+ verified candidate profiles', '100 shortlisted CV views per requirement'] },
          ].map((item, i) => {
            const [ref, vis] = useInView(0.1);
            return (
              <div key={i} ref={ref} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 24, padding: '44px', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 140, height: 140, background: 'radial-gradient(circle at top right, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <h4 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 14, lineHeight: 1.35, fontFamily: "'Bricolage Grotesque',sans-serif" }}>{item.title}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#002366', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{item.price}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>+GST</span>
                </div>
                <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 12px', borderRadius: 100, marginBottom: 34 }}>Valid: {item.validity}</span>

                <p style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>How It Works</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 38 }}>
                  {item.steps.map((step, si) => (
                    <li key={si} style={{ display: 'flex', gap: 12, fontSize: 14, color: '#475569', lineHeight: 1.55 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <FiCheck size={11} color="#10b981" strokeWidth={3} />
                      </div>
                      {step}
                    </li>
                  ))}
                </ul>

                <button style={{ width: '100%', padding: '14px 0', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #002366, #003db5)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,35,102,0.22)', fontFamily: "'Bricolage Grotesque',sans-serif", transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 26px rgba(0,35,102,0.32)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,35,102,0.22)'; }}
                  onClick={() => setActiveModalPlan({ ...item, type: 'expert' })}
                >
                  Request Assistance →
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <section style={{ padding: '0 40px 88px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#002366', background: '#EEF2FF', border: '1px solid #c7d2fe', padding: '5px 16px', borderRadius: 100, marginBottom: 16, fontFamily: "'Bricolage Grotesque',sans-serif" }}>Compare Plans</span>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>
            Job Posting — <span style={{ color: '#002366' }}>Full Feature Breakdown</span>
          </h2>
          <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15.5, color: '#64748b' }}>Every limit, every feature — transparent and side by side.</p>
        </div>

        <div style={{ borderRadius: 22, border: '1.5px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 32px rgba(0,35,102,0.06)' }}>
          <table className="plan-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans',sans-serif" }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '24px 28px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', fontFamily: "'Bricolage Grotesque',sans-serif" }}>Feature</th>
                {[
                  { name: 'Hot Vacancy', price: '₹1,650', highlight: true, badge: 'Most Popular' },
                  { name: 'Classified', price: '₹850', highlight: false },
                  { name: 'Standard', price: '₹400', highlight: false },
                  { name: 'Free', price: 'Free', highlight: false, green: true },
                ].map((p, i) => (
                  <th key={i} style={{ padding: '24px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: p.highlight ? 'rgba(0,35,102,0.035)' : undefined, minWidth: 130 }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 15, fontWeight: 800, color: p.green ? '#10b981' : '#002366', marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: p.green ? '#10b981' : '#0f172a', marginBottom: 6 }}>{p.price}</div>
                    {p.badge && <span style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 800, color: '#002366', background: '#EEF2FF', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{p.badge}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Job description length', vals: ['Full detailed', '250 chars', '250 chars', '250 chars'] },
                { label: 'Job locations', vals: ['3', '3', '1', '1'] },
                { label: 'Applications allowed', vals: ['Unlimited', 'Unlimited', '200', '50'] },
                { label: 'Application validity', vals: ['90 days', '90 days', '30 days', '15 days'] },
                { label: 'Posting validity', vals: ['30 days', '30 days', '15 days', '7 days'] },
                { label: 'Jobseeker contact details', vals: [true, true, false, false] },
                { label: 'Boosted on search page', vals: [true, false, false, false] },
                { label: 'Job branding & logo', vals: [true, false, false, false] },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: ri < 7 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '14px 28px', fontSize: 13.5, fontWeight: 600, color: '#334155' }}>{row.label}</td>
                  {row.vals.map((v, vi) => (
                    <td key={vi} style={{ padding: '14px 16px', textAlign: 'center', background: vi === 0 ? 'rgba(0,35,102,0.025)' : undefined }}>
                      {v === true
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#dcfce7' }}><FiCheck size={13} color="#16a34a" strokeWidth={3} /></span>
                        : v === false
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#f8fafc' }}><FiX size={12} color="#cbd5e1" strokeWidth={2.5} /></span>
                          : <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontWeight: 800, color: '#002366', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{v}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '20px 28px', fontSize: 13.5, fontWeight: 800, color: '#0f172a', fontFamily: "'Bricolage Grotesque',sans-serif" }}>Get started</td>
                {[
                  { label: 'Buy now →', style: { background: 'linear-gradient(135deg,#002366,#003db5)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(0,35,102,0.28)' } },
                  { label: 'Buy now →', style: { background: 'transparent', color: '#002366', border: '1.5px solid #c7d2fe' } },
                  { label: 'Buy now →', style: { background: 'transparent', color: '#002366', border: '1.5px solid #c7d2fe' } },
                  { label: 'Post free →', style: { background: 'transparent', color: '#10b981', border: '1.5px solid #a7f3d0' } },
                ].map((btn, bi) => (
                  <td key={bi} style={{ padding: '20px 16px', background: bi === 0 ? 'rgba(0,35,102,0.025)' : undefined }}>
                    <button style={{ width: '100%', padding: '10px 0', borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Bricolage Grotesque',sans-serif", ...btn.style }}>
                      {btn.label}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── PREMIUM UPGRADE ── */}
      <section style={{ padding: '0 40px 88px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg,#010e2a 0%,#002b7a 50%,#010e2a 100%)',
          borderRadius: 28, padding: '56px 48px', position: 'relative', overflow: 'hidden', display: 'grid', gap: 40,
          gridTemplateColumns: '1fr auto', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
              background: 'rgba(16,185,129,.14)', border: '1px solid rgba(16,185,129,.35)',
              borderRadius: 100, color: '#6ee7b7', fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', fontFamily: "'Bricolage Grotesque',sans-serif", marginBottom: 18,
            }}>Premium Account</div>
            <h3 style={{
              fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800,
              color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14,
            }}>Upgrade to Premium &<br />Unlock 10 Active Jobs</h3>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
              {[
                '10 active job postings', 'Unlimited applications',
                'Jobseeker contact details', 'Priority recruiter search rank',
                'Dedicated account manager', '30-day validity',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>
                  <FiCheck size={12} color="#10b981" strokeWidth={3} /> {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background: '#fff', borderRadius: 22, padding: '36px 32px', minWidth: 280,
            position: 'relative', zIndex: 2, textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: "'Bricolage Grotesque',sans-serif", marginBottom: 8 }}>Premium — Starting at</p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#CBD5E1', fontFamily: "'Bricolage Grotesque',sans-serif" }}>₹</span>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 52, fontWeight: 800, color: '#002366', letterSpacing: '-.05em', lineHeight: 1 }}>9,999</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>/mo</span>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 22, fontWeight: 500 }}>Billed monthly · Cancel anytime</p>
            {(paymentError || paymentSuccess) && (
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: paymentError ? '#dc2626' : '#059669' }}>
                {paymentError || paymentSuccess}
              </p>
            )}
            <button onClick={handlePremiumUpgrade} disabled={paymentLoading} style={{
              width: '100%', padding: 15, background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 12, fontFamily: "'Bricolage Grotesque',sans-serif",
              fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .25s',
              opacity: paymentLoading ? 0.7 : 1,
              boxShadow: '0 8px 24px rgba(16,185,129,.3)',
            }}
              onMouseEnter={e => { if (!paymentLoading) { e.currentTarget.style.background = '#0da371'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { if (!paymentLoading) { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'translateY(0)' } }}
            >
              {paymentLoading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Bricolage Grotesque',sans-serif", marginTop: 12 }}>
              Secure Checkout · Instant Activation
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 40px 88px', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', fontFamily: "'Bricolage Grotesque',sans-serif", marginBottom: 14 }}>GOT QUESTIONS?</span>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.03em' }}>Frequently Asked Questions</h2>
          <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, color: '#64748b' }}>Everything you need to know about plans, billing, and hiring on MavenJobs.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} isOpen={activeFaq === i} onToggle={() => setActiveFaq(activeFaq === i ? null : i)} />
          ))}
        </div>
      </section>

      {/* ── PURCHASE MODAL ── */}
      {activeModalPlan && (
        <div className="pm-overlay" onClick={() => setActiveModalPlan(null)}>
          <div className="pm-box" onClick={e => e.stopPropagation()}>
            <button className="pm-close" onClick={() => setActiveModalPlan(null)}><FiX size={20} /></button>

            <div className="pm-container">
              {/* Left Column: Summary */}
              <div className="pm-left">
                <div className="pm-summary-header">
                  <span className="pm-tag">{activeModalPlan.type === 'resdex' ? 'RESDEX' : activeModalPlan.type === 'expert' ? 'EXPERT ASSIST' : 'JOB POSTING'}</span>
                  <h3>{activeModalPlan.name}</h3>
                  <div className="pm-price-block">
                    <span className="pm-amt">{activeModalPlan.price}</span>
                    {activeModalPlan.price !== 'Free' && activeModalPlan.price !== 'Custom' && <span className="pm-gst">+GST</span>}
                  </div>
                  <p className="pm-validity">Valid for {activeModalPlan.validity || 'as per agreement'}</p>
                </div>

                <div className="pm-feat-list">
                  <p className="pm-feat-title">Plan Highlights</p>
                  {(activeModalPlan.features || []).slice(0, 4).map((f, i) => (
                    <div className="pm-feat-item" key={i}>
                      <FiCheck size={14} color="#10b981" />
                      <span>{typeof f === 'string' ? f : f.text}</span>
                    </div>
                  ))}
                </div>

                <div className="pm-badge-trust">
                  <FiAward size={18} />
                  <span>Trusted by 1.5L+ Indian Businesses</span>
                </div>
              </div>

              {/* Right Column: Form/Action */}
              <div className="pm-right">
                {activeModalPlan.type === 'enterprise' || activeModalPlan.type === 'expert' ? (
                  <div className="pm-form-mode">
                    <h4>Request Details</h4>
                    <p>Enter your details and our expert will contact you within 2 hours.</p>
                    <div className="pm-input-group">
                      <label>Full Name</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" />
                    </div>
                    <div className="pm-input-group">
                      <label>Company Name</label>
                      <input type="text" placeholder="e.g. Acme Corp" />
                    </div>
                    <div className="pm-input-group">
                      <label>Phone Number</label>
                      <input type="tel" placeholder="e.g. +91 98765 43210" />
                    </div>
                    <button className="pm-main-btn">Send Request</button>
                  </div>
                ) : (
                  <div className="pm-checkout-mode">
                    <h4>Checkout Summary</h4>
                    <div className="pm-bill-card">
                      <div className="pm-bill-row">
                        <span>Base Price</span>
                        <span>{activeModalPlan.price}</span>
                      </div>
                      <div className="pm-bill-row">
                        <span>GST (18%)</span>
                        <span>{activeModalPlan.price === 'Free' ? '₹0' : '₹' + (parseInt(activeModalPlan.price.replace(/[^\d]/g, '')) * 0.18).toFixed(0)}</span>
                      </div>
                      <div className="pm-bill-divider" />
                      <div className="pm-bill-row pm-total">
                        <span>Total Payable</span>
                        <span>{activeModalPlan.price === 'Free' ? 'Free' : '₹' + (parseInt(activeModalPlan.price.replace(/[^\d]/g, '')) * 1.18).toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="pm-promo-apply">
                      <input type="text" placeholder="Enter Coupon Code" />
                      <button>Apply</button>
                    </div>

                    <button className="pm-main-btn" disabled={paymentLoading} onClick={() => activeModalPlan.price === 'Free' ? setActiveModalPlan(null) : handleJobPostPayment(activeModalPlan)}>
                      {activeModalPlan.price === 'Free' ? 'Post Free Job Now' : paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                    <p className="pm-secure-note"><FiShield size={12} /> Secure 256-bit SSL encrypted payment</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── FOOTER ── */}
      <EmployerFooter />
    </div>
  );
}