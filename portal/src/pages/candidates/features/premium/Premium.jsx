import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCheck, FiZap, FiStar, FiMessageCircle, FiFileText,
  FiSearch, FiUsers, FiAward, FiArrowRight, FiShield,
  FiChevronRight, FiX, FiCheckCircle, FiTrendingUp, FiInfo, FiSend,
  FiClock, FiMenu, FiBell,
} from 'react-icons/fi';
import { useAuth } from '../../../../AuthContext';
import paymentService from '../../../../services/paymentService';
import AvatarDropdown from '../../../../components/common/AvatarDropdown';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import LandingFooter from '../../../../components/LandingFooter';

const NAV_H = 72;

const BASIC_FEATURES = [
  { icon: <FiSend size={16} />, label: 'Apply to jobs', desc: 'Apply to any job on the platform for free' },
  { icon: <FiTrendingUp size={16} />, label: 'AI job recommendations', desc: 'Get AI-matched job suggestions daily' },
  { icon: <FiMessageCircle size={16} />, label: 'AI ChatBot', desc: '50 texts/day in career assistant chat' },
  { icon: <FiFileText size={16} />, label: 'Resume Builder', desc: 'Build professional resumes for free' },
];

const ELITE_FEATURES = [
  { icon: <FiSend size={16} />, label: 'Apply to jobs', desc: 'Unrestricted applications' },
  { icon: <FiTrendingUp size={16} />, label: 'Top 5 AI job recommendations', desc: '5 curated premium picks daily' },
  { icon: <FiMessageCircle size={16} />, label: 'AI ChatBot', desc: '100 texts/day with advanced context' },
  { icon: <FiFileText size={16} />, label: 'Resume Builder + ATS Checker', desc: 'Build resumes & check ATS score' },
  { icon: <FiUsers size={16} />, label: 'Profile visibility for AI matching', desc: 'Recruiters discover you via AI' },
  { icon: <FiStar size={16} />, label: 'Recruiter Spotlight', desc: 'Get featured to top recruiters' },
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

export default function Premium() {
  const { user, openLogin, openRegister, updateUser } = useAuth();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isElite = user?.membership?.active && user?.membership?.plan === 'ELITE';
  const daysLeft = useDaysLeft(isElite ? user.membership.expiresAt : null);

  const handleElitePurchase = useCallback(async () => {
    if (!user) { openLogin(); return; }
    setPaying(true);
    setPayError('');
    try {
      const orderRes = await paymentService.createOrder('ELITE_QUARTERLY');
      if (!orderRes?.success || !orderRes?.data) throw new Error(orderRes?.message || 'Failed to create order');
      const { orderId, amount, currency, keyId, planLabel } = orderRes.data;
      await paymentService.openCheckout({
        order: { orderId, amount, currency, planLabel },
        keyId,
        user,
        onSuccess: (result) => {
          updateUser({
            membership: {
              plan: 'ELITE',
              active: true,
              expiresAt: result?.data?.expiresAt || new Date(Date.now() + 90 * 86400000).toISOString(),
              startedAt: new Date().toISOString(),
            },
          });
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            navigate('/dashboard');
          }, 2500);
        },
        onError: (msg) => setPayError(msg || 'Payment failed'),
      });
    } catch (err) {
      setPayError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  }, [user, openLogin, navigate, updateUser]);

  return (
    <div style={{
      background: '#f8fafc', minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1e293b',
    }}>
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
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }

        /* PROMO */
        .pb{background:linear-gradient(90deg,var(--navy-d),#003db5,var(--navy-d));background-size:200% 100%;animation:sh 5s linear infinite;color:#fff;padding:11px 0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:14px;font-family:var(--fd)}
        .pa{color:#6ee7b7}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* NAVBAR */
        .nb{background:transparent !important;border-bottom:1px solid transparent !important;position:fixed;top:0;left:0;right:0;z-index:90;transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
        .nb.sc{background:rgba(255,255,255,.98) !important;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--s200) !important;box-shadow:0 10px 40px rgba(0,35,102,.08)}
        .nbi{max-width:1280px;margin:0 auto;padding:0 28px;height:74px;display:flex;align-items:center;justify-content:space-between}
        .nl{display:flex;align-items:center;gap:32px}
        .nla{font-size:13px;font-weight:700;color:rgba(255,255,255,.85);text-decoration:none;letter-spacing:.02em;transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .nla{color:var(--s500)}
        .nla:hover{color:#fff}
        .nb.sc .nla:hover{color:var(--navy)}
        .btnl{padding:8px 18px;font-size:13px;font-weight:800;color:#fff;background:none;border:none;cursor:pointer;border-radius:10px;transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .btnl{color:var(--navy)}
        .btnl:hover{background:rgba(255,255,255,.15)}
        .nb.sc .btnl:hover{background:var(--s100)}
        .logo-img{height:34px;transition:all .4s ease;display:block}
        .nb:not(.sc) .logo-img{filter:invert(1) brightness(2) contrast(1.2)}
        .btnr{padding:10px 24px;font-size:13px;font-weight:800;color:#fff;background:var(--navy);border:none;border-radius:11px;cursor:pointer;transition:all .2s;font-family:var(--fd);box-shadow:0 4px 14px rgba(0,35,102,.2)}
        .btnr:hover{background:var(--navy-d);transform:translateY(-1px)}

        /* HERO */
        .hero{position:relative;height:100vh;min-height:700px;overflow:hidden;background:#050e24}
        .spline-wrap{position:absolute;top:0;right:-8%;left:auto;bottom:0;width:68%;overflow:hidden}
        .spline-wrap iframe{width:100%;height:calc(100% + 80px);border:none;display:block;pointer-events:none;margin-bottom:-80px}
        .ho-left{position:absolute;top:0;left:0;right:auto;bottom:0;width:60%;background:linear-gradient(to right,rgba(2,8,30,.94) 0%,rgba(2,8,30,.78) 55%,transparent 100%);z-index:2;pointer-events:none}
        .ho-top{position:absolute;top:0;left:0;right:0;height:180px;background:linear-gradient(to bottom,rgba(2,8,30,.88),transparent);z-index:2;pointer-events:none}
        .ho-bot{position:absolute;bottom:0;left:0;right:0;height:220px;background:linear-gradient(to top,#f0f4fb 0%,transparent 100%);z-index:2;pointer-events:none}
        .hc{position:relative;z-index:10;max-width:1280px;margin:0 auto;padding:0 28px;height:100%;display:flex;align-items:center;justify-content:flex-start}
        .htext{max-width:600px;text-align:left}
        .heb{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.35);border-radius:100px;color:#6ee7b7;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:28px;font-family:var(--fd);backdrop-filter:blur(8px)}
        .hh1{font-family:var(--fd);font-size:clamp(42px,5vw,76px);font-weight:800;line-height:1.05;color:#fff !important;letter-spacing:-.03em;margin-bottom:20px}
        .hh1 .acc{color:#10b981 !important}
        .hsub{font-size:15.5px;color:rgba(255,255,255,.6);font-weight:500;max-width:500px;margin-bottom:40px;line-height:1.75}
        .hbtns{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:48px}
        .hbp{padding:15px 34px;background:var(--green);color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fd);letter-spacing:.02em;display:flex;align-items:center;gap:8px;transition:all .25s;text-decoration:none;box-shadow:0 8px 28px rgba(16,185,129,.35)}
        .hbp:hover{background:var(--gd);transform:translateY(-2px);box-shadow:0 12px 36px rgba(16,185,129,.45)}
        .hbg{padding:14px 32px;background:rgba(255,255,255,.07);color:#fff;font-weight:700;font-size:14px;border-radius:100px;border:1px solid rgba(255,255,255,.18);cursor:pointer;font-family:var(--fd);transition:all .25s;text-decoration:none;backdrop-filter:blur(8px);display:flex;align-items:center;gap:8px}
        .hbg:hover{background:rgba(255,255,255,.13)}

        .elite-glow { box-shadow: 0 0 40px rgba(251,191,36,.08), 0 0 80px rgba(251,191,36,.04); }
        .countdown-pulse { animation: pulse 2s ease-in-out infinite; }

        /* FEATURE TABLE */
        .ftr { display: grid; grid-template-columns: 1fr 120px 120px; gap: 16px; padding: 14px 20px; align-items: center; }
        .ftr-f { font-size: 14px; font-weight: 600; color: #1e293b; }
        .ftr-v { text-align: center; font-size: 13px; font-weight: 600; color: #64748b; }
        .ftr-ve { text-align: center; font-size: 13px; font-weight: 600; color: #0f172a; }

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
          .ftr { grid-template-columns: 1fr 90px 90px; gap: 12px; }
        }
        @media (max-width: 768px) {
          .hero { min-height: 100vh; height: auto; padding: 120px 0 80px; display: block; }
          .spline-wrap { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 1; z-index: 1; left: 0; right: 0; }
          .spline-wrap iframe { height: 100%; margin-bottom: 0; }
          .ho-left { width: 100%; background: linear-gradient(to top, rgba(2,8,30,.96) 0%, rgba(2,8,30,.7) 100%); display: block; z-index: 2; }
          .hc { justify-content: center; height: 100%; position: relative; z-index: 10; padding-top: 60px; }
          .htext { text-align: center; }
          .hbtns { justify-content: center; }
        }
        @media (max-width: 480px) {
          .hh1 { font-size: 32px; }
          .hsub { font-size: 14.5px; margin-bottom: 28px; }
          .hbtns { flex-direction: column; width: 100%; }
          .hbp, .hbg { width: 100%; justify-content: center; }
          .hero { padding-bottom: 20px; padding-top: 100px; min-height: 80vh; }
          .ho-bot { height: 120px; opacity: 0.4; }
          .ftr { grid-template-columns: 1fr 70px 70px; gap: 8px; padding: 12px 14px; }
          .ftr-f { font-size: 12px; }
          .ftr-v, .ftr-ve { font-size: 12px; }
        }
      `}</style>



      {/* NAVBAR */}
      <header className={`nb${scrolled ? ' sc' : ''}`}>
        <div className="nbi">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginRight: '24px' }}>
            <img src={mavenLogo} alt="MavenJobs" className="logo-img" />
            <div style={{ background: 'linear-gradient(135deg, #10b981, #0da371)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.12em', fontFamily: 'var(--fd)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>ELITE</div>
          </Link>

          <div className={`nav-menu-wrapper ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            <nav className="nl">
              <a href="#features" className="nla">Features</a>
              <a href="#plans" className="nla">Pricing</a>
            </nav>
            <div className="na" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!user ? (
                <>
                  <button className="btnl" onClick={openLogin}>Login</button>
                  <button className="btnr" onClick={openRegister}>Get Started Free</button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button title="Notifications" style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: scrolled ? '#f8fafc' : 'rgba(255,255,255,0.1)', border: scrolled ? '1.5px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: scrolled ? '#002366' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <FiBell size={20} />
                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#0DBF7B', borderRadius: '50%', border: `2px solid ${scrolled ? 'white' : '#002366'}` }}></span>
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

      {/* ═══ HERO ═══ */}
      <section className="hero" id="hero">
        <div className="ho-top" />
        <div className="ho-left" />
        <div className="ho-bot" />
        <div className="spline-wrap">
          <iframe src="https://my.spline.design/cubeandballs-D3RUkVGuU3utMSRsowveR7I7/" title="3D Abstract Visual" />
        </div>

        <div className="hc">
          <div className="htext" style={{ animation: 'fadeUp .6s ease-out' }}>
            {isElite && (
              <div className="heb">
                <FiAward size={13} color="#10b981" />
                <span className="elite-text">
                  ELITE — {daysLeft !== null && `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                </span>
              </div>
            )}
            
            <h1 className="hh1">
              Supercharge your<br />
              <span className="acc">career with Premium</span>
            </h1>
            
            <p className="hsub">
              Unlock AI-powered tools, unlimited career insights, and get discovered by India's top recruiters. Choose the plan that fits your journey.
            </p>
            
            <div className="hbtns">
              <a href="#plans" className="hbp">
                Compare plans <FiArrowRight size={16} />
              </a>
              <a href="#features" className="hbg">
                View features
              </a>
            </div>
            
            <div className="htrust">
              <div className="htp"><div className="htpdot"/> 3× more profile views</div>
              <div className="htp"><div className="htpdot"/> Dedicated support</div>
            </div>
          </div>
        </div>

        <div className="si">
          <span>Scroll</span>
          <div className="sl" />
        </div>
      </section>

      {/* ═══ FEATURES OVERVIEW ═══ */}
      <section id="features" style={{ padding: '100px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              letterSpacing: '.22em', textTransform: 'uppercase',
              color: '#10b981', fontFamily: 'var(--fd)', marginBottom: 12,
            }}>WHAT YOU GET</span>
            <h2 style={{
              fontFamily: 'var(--fd)', fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em', lineHeight: 1.06,
              fontSize: 'clamp(30px,3.6vw,48px)',
            }}>Everything you need to grow</h2>
            <div style={{
              width: 44, height: 3, borderRadius: 3,
              background: 'linear-gradient(90deg,#002366,#10b981)',
              margin: '16px auto 0',
            }} />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20,
          }}>
            {[
              { icon: <FiSearch size={22} />, title: 'AI Job Matching', desc: 'Smart algorithms find roles that match your skills, experience, and preferences.', color: '#002366' },
              { icon: <FiMessageCircle size={22} />, title: 'Career AI ChatBot', desc: 'Get resume tips, interview prep, and career guidance from our AI assistant.', color: '#10b981' },
              { icon: <FiFileText size={22} />, title: 'Resume Builder & ATS', desc: 'Build ATS-optimized resumes and check your score against real recruiter filters.', color: '#6366f1' },
              { icon: <FiUsers size={22} />, title: 'Recruiter Discovery', desc: 'Get noticed by top recruiters with AI-powered profile recommendations.', color: '#f59e0b' },
              { icon: <FiAward size={22} />, title: 'ELITE Badge', desc: 'Stand out with a verified ELITE badge on your profile and applications.', color: '#f59e0b' },
              { icon: <FiShield size={22} />, title: 'Priority Support', desc: 'Get faster responses and dedicated support for your career queries.', color: '#002366' },
            ].map((f, i) => (
              <div key={i} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20,
                padding: '36px 28px', transition: 'all .3s', cursor: 'default',
              }} onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}30`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${f.color}10`; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${f.color}12`, border: `1px solid ${f.color}28`,
                  color: f.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 18,
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="plans" style={{ padding: '100px 0', background: '#f0f4fb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 56px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              letterSpacing: '.22em', textTransform: 'uppercase',
              color: '#10b981', fontFamily: 'var(--fd)', marginBottom: 12,
            }}>PRICING</span>
            <h2 style={{
              fontFamily: 'var(--fd)', fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em', lineHeight: 1.06,
              fontSize: 'clamp(30px,3.6vw,48px)',
            }}>Choose your plan</h2>
            <p style={{ color: '#64748b', marginTop: 14, fontSize: 16, lineHeight: 1.6 }}>
              {isElite ? 'You are currently on the ELITE plan.' : 'Start free, upgrade when you need more power.'}
            </p>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 32, alignItems: 'start', maxWidth: 900, margin: '0 auto'
          }}>
            {/* BASIC */}
            <div style={{
              flex: '1 1 320px', maxWidth: 420,
              background: '#fff', borderRadius: 24, padding: '40px 32px',
              border: '1.5px solid #e2e8f0', transition: 'all .3s',
              opacity: isElite ? .7 : 1,
            }} onMouseEnter={e => { if (!isElite) { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,.06)'; } }}
               onMouseLeave={e => { if (!isElite) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}>
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
              flex: '1 1 320px', maxWidth: 420,
              background: 'linear-gradient(145deg, #002a6e, #001a4d)',
              borderRadius: 24, padding: '44px 32px',
              position: 'relative', overflow: 'hidden', transition: 'all .4s',
              transform: 'translateY(-8px)',
              border: isElite ? '1.5px solid rgba(251,191,36,.3)' : '1.5px solid transparent',
            }} className={isElite ? 'elite-glow' : ''}
               onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-14px)'; e.currentTarget.style.boxShadow = '0 32px 64px rgba(0,35,102,.3)'; }}
               onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {/* Gold accent circle */}
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
                  boxShadow: '0 4px 16px rgba(251,191,36,.3)',
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
                }}>
                  {isElite ? 'YOUR PLAN' : 'ELITE'}
                </div>
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
                        }}>
                          {daysLeft !== null ? daysLeft : '—'}
                        </div>
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
                <div style={{
                  marginTop: 16, padding: '14px 16px',
                  background: isElite ? 'rgba(251,191,36,.06)' : 'rgba(251,191,36,.08)',
                  borderRadius: 12,
                  border: isElite ? '1px solid rgba(251,191,36,.15)' : '1px solid rgba(251,191,36,.2)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <FiInfo size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#fde68a', lineHeight: 1.4 }}>
                    Know more about{' '}
                    <Link to="/premium" style={{ color: '#fbbf24', fontWeight: 700, textDecoration: 'underline' }}>
                      RECRUITER SPOTLIGHT
                    </Link>
                  </span>
                </div>
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
                <button onClick={handleElitePurchase} disabled={paying} style={{
                  width: '100%', padding: '16px', background: '#fff', color: '#002366',
                  border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
                  cursor: paying ? 'not-allowed' : 'pointer', fontFamily: 'var(--fd)',
                  transition: 'all .2s', opacity: paying ? .7 : 1,
                  letterSpacing: '.01em',
                }} onMouseEnter={e => { if (!paying) e.currentTarget.style.background = '#f1f5f9'; }}
                   onMouseLeave={e => { if (!paying) e.currentTarget.style.background = '#fff'; }}>
                  {paying ? 'Processing…' : 'Upgrade to ELITE — ₹999/3 months'}
                </button>
              )}
              {payError && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,.12)', borderRadius: 10, fontSize: 12.5, color: '#fca5a5', textAlign: 'center' }}>
                  {payError}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 56px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              letterSpacing: '.22em', textTransform: 'uppercase',
              color: '#10b981', fontFamily: 'var(--fd)', marginBottom: 12,
            }}>COMPARE PLANS</span>
            <h2 style={{
              fontFamily: 'var(--fd)', fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em', lineHeight: 1.06,
              fontSize: 'clamp(26px,3vw,40px)',
            }}>Feature comparison</h2>
          </div>

          <div className="ftr" style={{ padding: '0 20px 12px', borderBottom: 'none', background: 'transparent' }}>
            <div></div>
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--fd)' }}>BASIC</div>
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#002366', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--fd)' }}>ELITE</div>
          </div>
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
              <Link to="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', background: '#002366', color: '#fff',
                borderRadius: 10, fontSize: 13, fontWeight: 800,
                textDecoration: 'none', fontFamily: 'var(--fd)',
                transition: 'all .2s',
              }} onMouseEnter={e => { e.target.style.background = '#003da8'; }}
                 onMouseLeave={e => { e.target.style.background = '#002366'; }}>
                Go to Dashboard <FiArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

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
                Your ELITE membership< br />
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
              <button onClick={handleElitePurchase} disabled={paying} style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '15px 34px', background: '#10b981', color: '#fff',
                fontWeight: 800, fontSize: 14.5, borderRadius: 100,
                border: 'none', cursor: paying ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--fd)', opacity: paying ? .7 : 1,
                boxShadow: '0 8px 28px rgba(16,185,129,.35)', transition: 'all .25s',
              }} onMouseEnter={e => { if (!paying) { e.target.style.background = '#0da371'; e.target.style.transform = 'translateY(-2px)'; } }}
                 onMouseLeave={e => { if (!paying) { e.target.style.background = '#10b981'; e.target.style.transform = 'none'; } }}>
                {paying ? 'Processing…' : 'Upgrade Now — ₹999/3 months'} <FiArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </section>

      {/* ═══ SUCCESS MODAL ═══ */}
      {showSuccess && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,15,40,.6)', backdropFilter: 'blur(10px)' }}
               onClick={() => { setShowSuccess(false); navigate('/dashboard'); }} />
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 24,
            padding: '48px 40px', maxWidth: 400, width: '100%',
            textAlign: 'center', animation: 'fadeUp .4s ease-out',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(251,191,36,.2)',
            }}>
              <FiAward size={32} color="#002366" />
            </div>
            <h3 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Welcome to ELITE!
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Your ELITE membership is active. You now have access to all premium features.
            </p>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <LandingFooter />
    </div>
  );
}
