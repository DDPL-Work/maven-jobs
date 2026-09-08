import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCpu,
  FiFileText,
  FiAward,
  FiTarget,
  FiPenTool,
  FiZap,
  FiStar,
  FiSearch,
  FiBell,
  FiArrowRight,
  FiChevronRight,
} from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import { useAuth } from "../../../../AuthContext";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import LandingFooter from "../../../../components/LandingFooter";

function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("sv");
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

function ServiceCard({ service, delay = 0 }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className="fc" style={{ "--d": `${delay}ms` }}>
      <div className="ci">
        <div className="cg" style={{ background: service.color }} />
        <span className="ct">{service.tag}</span>
        <div
          className="cion"
          style={{
            color: service.color,
            borderColor: `${service.color}35`,
            background: `${service.color}0e`,
          }}
        >
          {service.icon}
        </div>
        <h3 className="ctitle">{service.name}</h3>
        <div className="cprice">
          <span className="pcur">₹</span>
          <span className="pamt">{service.price}</span>
          <span className="pper">{service.period}</span>
        </div>
        <ul className="cfeats">
          {service.features.map((f, i) => (
            <li key={i}>
              <span
                style={{
                  color: service.color,
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <FiCheck strokeWidth={3} size={12} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <button className="cbtn" style={{ "--acc": service.color }}>
          Know More <FiChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

const Services = () => {
  const { user, openLogin, openRegister } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const serviceCategories = [
    {
      title: "Resume Services",
      sub: "DOCUMENT EXCELLENCE",
      desc: "Beat ATS systems and land on the recruiter's shortlist. Every word precision-crafted.",
      services: [
        {
          name: "Text Resume",
          price: "1,653",
          period: "one-time",
          icon: <FiFileText size={22} />,
          features: [
            "ATS Friendly Format",
            "Keyword Optimized",
            "Expert Consultation",
            "2 Revision Rounds",
          ],
          tag: "MOST POPULAR",
          color: "#002366",
        },
        {
          name: "Visual Resume",
          price: "2,499",
          period: "one-time",
          icon: <FiPenTool size={22} />,
          features: [
            "Modern Design",
            "Portfolio Link Included",
            "High Impact Visuals",
            "Print-Ready PDF",
          ],
          tag: "CREATIVE CHOICE",
          color: "#10b981",
        },
        {
          name: "Resume Critique",
          price: "1,017",
          period: "one-time",
          icon: <FiSearch size={22} />,
          features: [
            "Gap Analysis Report",
            "Actionable Feedback",
            "Score Breakdown",
            "15-min Expert Call",
          ],
          tag: "FREE TRIAL",
          color: "#6366f1",
        },
      ],
    },
    {
      title: "Recruiter Attention",
      sub: "VISIBILITY BOOST",
      desc: "Get noticed by the top 1% of recruiters and hiring managers across leading companies.",
      services: [
        {
          name: "Priority Applicant",
          price: "971",
          period: "/ 3 months",
          icon: <FiAward size={22} />,
          features: [
            "Early Job Access",
            "Top Search Placement",
            "Direct Recruiter Messaging",
            "Application Tracking",
          ],
          tag: "RECOMMENDED",
          color: "#10b981",
        },
        {
          name: "Resume Display",
          price: "890",
          period: "/ month",
          icon: <FiTarget size={22} />,
          features: [
            "3× Profile Visibility",
            "Featured Profile Badge",
            "Recruiter Analytics",
            "InMail Unlocked",
          ],
          tag: "HIGH ROI",
          color: "#002366",
        },
        {
          name: "AI Mock Interview",
          price: "296",
          period: "/ 3 months",
          icon: <FiCpu size={22} />,
          features: [
            "Real-time AI Feedback",
            "Industry Questions Bank",
            "Performance Analytics",
            "Confidence Score",
          ],
          tag: "NEW",
          color: "#f59e0b",
        },
      ],
    },
  ];

  const r1 = useFadeIn(),
    r2 = useFadeIn(),
    r3 = useFadeIn(),
    r4 = useFadeIn();

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




        .pa{color:#6ee7b7}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* NAVBAR */
        .nb{
          background:transparent !important;border-bottom:1px solid transparent !important;position:fixed;top:0;left:0;right:0;z-index:90;transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .nb.sc{
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--s200) !important;
          box-shadow: 0 10px 40px rgba(0, 35, 102, 0.08);
        }
        .nbi{max-width:1280px;margin:0 auto;padding:0 28px;height:74px;display:flex;align-items:center;justify-content:space-between}
        
        .nl{display:flex;align-items:center;gap:32px}
        
        .nla{font-size:13px;font-weight:700;color:rgba(255, 255, 255, 0.85);text-decoration:none;
             letter-spacing:.02em;transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .nla{color:var(--s500)}
        
        .nla:hover{color:#ffffff}
        .nb.sc .nla:hover{color:var(--navy)}
        
        .nla.ac{color:#ffffff;position:relative}
        .nb.sc .nla.ac{color:var(--navy)}
        
        .nla.ac::after{content:'';position:absolute;bottom:-28px;left:0;right:0;height:2.5px;background:var(--green);border-radius:2px}
        
        .btnl{padding:8px 18px;font-size:13px;font-weight:800;color:#ffffff;
              background:none;border:none;cursor:pointer;border-radius:10px;
              transition:all 0.3s;font-family:var(--fd)}
        .nb.sc .btnl{color:var(--navy)}
        .btnl:hover{background:rgba(255, 255, 255, 0.15)}
        .nb.sc .btnl:hover{background:var(--s100)}
        
        .logo-img{height:34px;transition:all .4s ease;display:block}
        .nb:not(.sc) .logo-img{filter: invert(1) brightness(2) contrast(1.2)}
        .btnr{padding:10px 24px;font-size:13px;font-weight:800;color:#fff;
              background:var(--navy);border:none;border-radius:11px;cursor:pointer;
              transition:all .2s;font-family:var(--fd);
              box-shadow:0 4px 14px rgba(0,35,102,.2)}
        .btnr:hover{background:var(--navy-d);transform:translateY(-1px)}

        /* HERO */
        .hero{
          position:relative;height:100vh;min-height:700px;
          overflow:hidden;background:#050e24;
        }

        /* Spline — full bleed, NO pointer blocking so sphere stays visible */
        .sw{position:absolute;top:0;right:-15%;bottom:0;width:70%;overflow:hidden}
        .sw iframe{
          width:100%;
          height:calc(100% + 56px); /* push badge out of viewport */
          border:none;display:block;
          pointer-events:none; /* visual only */
        }

        /* Dark vignette only on LEFT side — right side stays clear for sphere */
        .ho-left{
          position:absolute;top:0;left:0;bottom:0;width:55%;
          background:linear-gradient(to right, rgba(2,8,30,.92) 0%, rgba(2,8,30,.75) 60%, transparent 100%);
          z-index:2;pointer-events:none;
        }
        /* Top edge fade */
        .ho-top{
          position:absolute;top:0;left:0;right:0;height:180px;
          background:linear-gradient(to bottom,rgba(2,8,30,.88),transparent);
          z-index:2;pointer-events:none;
        }
        /* Bottom edge — fade into page bg */
        .ho-bot{
          position:absolute;bottom:0;left:0;right:0;height:220px;
          background:linear-gradient(to top,#f0f4fb 0%,transparent 100%);
          z-index:2;pointer-events:none;
        }

        /* Hero text — left-aligned, left half */
        .hc{
          position:relative;z-index:10;
          max-width:1280px;margin:0 auto;padding:0 28px;
          height:100%;display:flex;align-items:center;
        }
        .htext{max-width:560px}
        .heb{
          display:inline-flex;align-items:center;gap:8px;
          padding:7px 18px;background:rgba(16,185,129,.14);
          border:1px solid rgba(16,185,129,.35);border-radius:100px;
          color:#6ee7b7;font-size:10px;font-weight:800;
          letter-spacing:.2em;text-transform:uppercase;
          margin-bottom:28px;font-family:var(--fd);backdrop-filter:blur(8px);
        }
        .hh1{
          font-family:var(--fd);font-size:clamp(44px,5.5vw,80px);
          font-weight:800;line-height:1.04;color:#ffffff !important;
          letter-spacing:-.03em;margin-bottom:22px;
        }
        .hh1 .acc{color:#10b981 !important}
        .hsub{
          font-size:16px;color:rgba(255,255,255,.6);font-weight:500;
          max-width:440px;margin-bottom:44px;line-height:1.7;
        }
        .hbtns{display:flex;gap:14px;flex-wrap:wrap}
        .hbp{
          padding:15px 34px;background:var(--green);color:#fff;
          font-weight:800;font-size:14px;border-radius:100px;border:none;
          cursor:pointer;font-family:var(--fd);letter-spacing:.02em;
          display:flex;align-items:center;gap:8px;transition:all .25s;
          text-decoration:none;box-shadow:0 8px 28px rgba(16,185,129,.35);
        }
        .hbp:hover{background:var(--gd);transform:translateY(-2px);box-shadow:0 12px 36px rgba(16,185,129,.45)}
        .hbg{
          padding:14px 32px;background:rgba(255,255,255,.07);color:#fff;
          font-weight:700;font-size:14px;border-radius:100px;
          border:1px solid rgba(255,255,255,.18);cursor:pointer;
          font-family:var(--fd);transition:all .25s;text-decoration:none;
          backdrop-filter:blur(8px);
        }
        .hbg:hover{background:rgba(255,255,255,.13)}

        /* Scroll indicator */
        .si{
          position:absolute;bottom:36px;left:56px;z-index:10;
          display:flex;flex-direction:column;align-items:center;gap:7px;
          color:rgba(255,255,255,.25);font-size:9px;font-weight:800;
          letter-spacing:.18em;font-family:var(--fd);text-transform:uppercase;
        }
        .sl{width:1px;height:40px;background:linear-gradient(to bottom,rgba(255,255,255,.3),transparent);animation:sp 2.2s ease-in-out infinite}
        @keyframes sp{0%,100%{opacity:.25}50%{opacity:.7}}

        /* STATS */
        .ss{background:#fff;border-bottom:1px solid var(--s100);position:relative;overflow:hidden}
        .ss::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--green),transparent);opacity:.25}
        .ssi{max-width:1280px;margin:0 auto;padding:0 28px;display:grid;grid-template-columns:repeat(4,1fr)}
        .sti{padding:36px 20px;text-align:center;border-right:1px solid var(--s100);transition:all .35s cubic-bezier(.4,0,.2,1);position:relative}
        .sti:last-child{border-right:none}
        .sti:hover{background:var(--s50);box-shadow:inset 0 -2px 0 var(--green)}
        .stn{font-family:var(--fd);font-size:38px;font-weight:800;color:var(--navy);
             letter-spacing:-.04em;line-height:1;margin-bottom:7px;transition:color .3s}
        .sti:hover .stn{color:var(--green)}
        .stl{font-size:10px;font-weight:700;color:var(--s400);letter-spacing:.12em;text-transform:uppercase}

        /* SECTION WRAPPER */
        .sw2{max-width:1280px;margin:0 auto;padding:0 28px}

        /* CAT SECTION */
        .cs{padding:88px 0 80px}
        .ch{text-align:center;margin-bottom:60px}
        .ce{display:inline-block;font-size:10px;font-weight:800;
            letter-spacing:.22em;text-transform:uppercase;color:var(--green);
            font-family:var(--fd);margin-bottom:14px}
        .ctt{font-family:var(--fd);font-size:clamp(30px,3.8vw,50px);
             font-weight:800;color:var(--navy);letter-spacing:-.03em;
             margin-bottom:14px;line-height:1.08}
        .cd{color:var(--s500);font-size:16px;max-width:520px;margin:0 auto;line-height:1.75}
        .cdiv{width:44px;height:3px;background:linear-gradient(90deg,var(--green),#6ee7b7);border-radius:3px;margin:18px auto}

        /* CARDS GRID */
        .cg2{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}

        /* FADE CARD */
        .fc{opacity:0;transform:translateY(28px);
            transition:opacity .55s ease var(--d,0ms),transform .55s ease var(--d,0ms)}
        .fc.sv{opacity:1;transform:translateY(0)}

        /* CARD INNER */
        .ci{
          position:relative;background:#fff;border-radius:22px;
          border:1px solid var(--s200);padding:34px 30px 30px;
          display:flex;flex-direction:column;overflow:hidden;
          transition:box-shadow .4s cubic-bezier(.4,0,.2,1),transform .4s cubic-bezier(.4,0,.2,1),border-color .3s;height:100%;
        }
        .ci::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--acc,var(--navy)),rgba(0,35,102,.15));opacity:0;transition:opacity .35s}
        .ci:hover::before{opacity:1}
        .ci:hover{box-shadow:0 24px 60px rgba(0,35,102,.12);transform:translateY(-6px);border-color:transparent}
        .cg{position:absolute;top:-60px;right:-60px;width:160px;height:160px;
            border-radius:50%;opacity:.04;filter:blur(44px);transition:opacity .4s;pointer-events:none}
        .ci:hover .cg{opacity:.1}
        .ct{
          position:absolute;top:22px;right:22px;font-size:9px;font-weight:800;
          letter-spacing:.16em;color:var(--s400);font-family:var(--fd);
          background:var(--s50);border:1px solid var(--s100);padding:4px 9px;border-radius:6px;
          transition:all .3s;
        }
        .ci:hover .ct{background:var(--acc,var(--navy));color:#fff;border-color:var(--acc,var(--navy))}
        .cion{
          width:54px;height:54px;border-radius:15px;border:1px solid;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:22px;transition:all .35s cubic-bezier(.34,1.56,.64,1);flex-shrink:0;
        }
        .ci:hover .cion{transform:scale(1.12) rotate(-6deg);box-shadow:0 8px 24px rgba(0,35,102,.12)}
        .ctitle{font-family:var(--fd);font-size:21px;font-weight:800;
                color:var(--navy);margin-bottom:6px;letter-spacing:-.02em}
        .cprice{display:flex;align-items:baseline;gap:3px;margin-bottom:22px;
                padding-bottom:20px;border-bottom:1px solid var(--s100)}
        .pcur{font-size:16px;font-weight:700;color:var(--s300);font-family:var(--fd)}
        .pamt{font-family:var(--fd);font-size:38px;font-weight:800;color:var(--navy);
              letter-spacing:-.04em;line-height:1}
        .pper{font-size:12px;font-weight:600;color:var(--s400);margin-left:4px}
        .cfeats{list-style:none;display:flex;flex-direction:column;gap:11px;flex:1;margin-bottom:24px}
        .cfeats li{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:var(--s600);transition:color .2s}
        .ci:hover .cfeats li{color:var(--s900)}
        .cbtn{
          width:100%;padding:13px;background:#fff;border:1.5px solid var(--s200);
          color:var(--navy);font-size:13px;font-weight:800;font-family:var(--fd);
          border-radius:13px;cursor:pointer;display:flex;align-items:center;
          justify-content:center;gap:6px;transition:all .25s cubic-bezier(.4,0,.2,1);letter-spacing:.01em;
        }
        .cbtn:hover{background:var(--acc,var(--navy));color:#fff;border-color:var(--acc,var(--navy));transform:scale(1.02)}

        /* PREMIUM */
        .ps{padding:0 0 88px}
        .pb2{
          background:linear-gradient(135deg,#010e2a 0%,#002b7a 50%,#010e2a 100%);
          border-radius:28px;padding:68px;display:grid;
          grid-template-columns:1fr auto;gap:60px;align-items:center;
          position:relative;overflow:hidden;
        }
        .po1{position:absolute;top:-80px;right:220px;width:280px;height:280px;
             background:radial-gradient(circle,rgba(16,185,129,.18),transparent);
             border-radius:50%;pointer-events:none;animation:pp 8s ease-in-out infinite}
        .po2{position:absolute;bottom:-60px;left:40px;width:180px;height:180px;
             background:radial-gradient(circle,rgba(99,102,241,.12),transparent);
             border-radius:50%;pointer-events:none;animation:pp 10s ease-in-out infinite reverse}
        @keyframes pp{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        .pgrid{position:absolute;inset:0;opacity:.035;
               background-image:radial-gradient(#fff 1px,transparent 1px);
               background-size:30px 30px;pointer-events:none}
        .pl{position:relative;z-index:2}
        .pbadge{
          display:inline-flex;align-items:center;gap:8px;padding:6px 16px;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
          border-radius:100px;color:rgba(255,255,255,.65);font-size:10px;
          font-weight:800;letter-spacing:.2em;text-transform:uppercase;
          font-family:var(--fd);margin-bottom:22px;backdrop-filter:blur(8px);
        }
        .ph2{font-family:var(--fd);font-size:clamp(26px,3.2vw,42px);
             font-weight:800;color:#fff;letter-spacing:-.03em;
             line-height:1.1;margin-bottom:32px}
        .pf{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .pfi{display:flex;align-items:center;gap:11px;font-size:13px;
             font-weight:500;color:rgba(255,255,255,.65);transition:color .25s}
        .pfi:hover{color:rgba(255,255,255,.9)}
        .pck{width:24px;height:24px;background:rgba(16,185,129,.18);
             border:1px solid rgba(16,185,129,.35);border-radius:7px;
             display:flex;align-items:center;justify-content:center;
             color:#6ee7b7;flex-shrink:0;transition:all .25s}
        .pfi:hover .pck{background:rgba(16,185,129,.28);border-color:rgba(16,185,129,.5);transform:scale(1.08)}
        .pcard{
          width:340px;background:#fff;border-radius:22px;padding:44px 36px;
          position:relative;z-index:2;box-shadow:0 36px 72px rgba(0,0,0,.32);
          transition:transform .35s cubic-bezier(.4,0,.2,1);
        }
        .pcard:hover{transform:translateY(-4px)}
        .pce{font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;
             color:var(--s400);font-family:var(--fd);text-align:center;margin-bottom:10px}
        .ppr{display:flex;align-items:baseline;justify-content:center;gap:4px;margin-bottom:6px}
        .ppc{font-size:20px;font-weight:700;color:var(--s300);font-family:var(--fd)}
        .ppa{font-family:var(--fd);font-size:60px;font-weight:800;color:var(--navy);
             letter-spacing:-.05em;line-height:1}
        .ppd{font-size:14px;font-weight:600;color:var(--s400)}
        .ppn{text-align:center;font-size:11px;color:var(--s400);margin-bottom:28px;font-weight:500}
        .bsub{
          width:100%;padding:17px;background:var(--green);color:#fff;
          font-family:var(--fd);font-weight:800;font-size:15px;border:none;
          border-radius:14px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);margin-bottom:14px;
          box-shadow:0 8px 22px rgba(16,185,129,.3);position:relative;overflow:hidden;
        }
        .bsub::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:translateX(-100%);transition:transform .5s}
        .bsub:hover::after{transform:translateX(100%)}
        .bsub:hover{background:var(--gd);transform:translateY(-3px);box-shadow:0 14px 34px rgba(16,185,129,.45)}
        .pcn{text-align:center;font-size:10px;font-weight:800;color:var(--s400);
             letter-spacing:.1em;text-transform:uppercase;font-family:var(--fd)}

        /* CONTACT */
        .con{background:#fff;padding:88px 0;border-top:1px solid var(--s100)}
        .cong{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start}
        .conh2{font-family:var(--fd);font-size:clamp(26px,3.2vw,42px);
               font-weight:800;color:var(--navy);letter-spacing:-.03em;
               line-height:1.1;margin-bottom:14px}
        .cons{color:var(--s500);font-size:15px;line-height:1.75;margin-bottom:48px}
        .coni{display:flex;gap:18px;margin-bottom:32px;cursor:default;padding:18px 20px;border-radius:16px;transition:all .3s}
        .coni:hover{background:var(--s50)}
        .conico{
          width:50px;height:50px;border-radius:15px;display:flex;
          align-items:center;justify-content:center;flex-shrink:0;transition:all .35s cubic-bezier(.34,1.56,.64,1);
        }
        .coni:hover .conico{transform:scale(1.12) rotate(-5deg);box-shadow:0 8px 20px rgba(0,35,102,.1)}
        .conit{font-family:var(--fd);font-weight:800;color:var(--navy);font-size:15px;margin-bottom:3px}
        .conii{font-weight:600;color:var(--s600);font-size:13px;margin-bottom:2px}
        .conis{font-size:10px;font-weight:700;color:var(--s400);letter-spacing:.08em;text-transform:uppercase}

        /* FORM */
        .fw{background:var(--s50);border-radius:22px;padding:40px;border:1px solid var(--s100);transition:box-shadow .3s}
        .fw:hover{box-shadow:0 12px 40px rgba(0,35,102,.06)}
        .fr{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
        .fg{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}
        .fl{font-size:9px;font-weight:800;color:var(--s400);letter-spacing:.18em;
            text-transform:uppercase;font-family:var(--fd)}
        .fi,.fta{
          background:#fff;border:1.5px solid var(--s200);border-radius:11px;
          padding:13px 16px;font-size:14px;font-weight:500;color:var(--s900);
          font-family:var(--fb);outline:none;transition:all .25s cubic-bezier(.4,0,.2,1);width:100%;
        }
        .fi:focus,.fta:focus{border-color:var(--green);box-shadow:0 0 0 4px rgba(16,185,129,.12);background:#fff}
        .fta{resize:none}
        .pg{display:flex}
        .pp{
          padding:13px 14px;background:var(--s100);border:1.5px solid var(--s200);
          border-right:none;border-radius:11px 0 0 11px;font-size:12px;
          font-weight:800;color:var(--s400);font-family:var(--fd);white-space:nowrap;
        }
        .pi{border-radius:0 11px 11px 0}
        .bsmt{
          width:100%;padding:16px;background:var(--navy);color:#fff;
          font-family:var(--fd);font-weight:800;font-size:15px;border:none;
          border-radius:13px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);margin-top:6px;
          box-shadow:0 8px 22px rgba(0,35,102,.18);position:relative;overflow:hidden;
        }
        .bsmt::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);transform:translateX(-100%);transition:transform .5s}
        .bsmt:hover::after{transform:translateX(100%)}
        .bsmt:hover{background:var(--navy-d);transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,35,102,.3)}

        /* FOOTER (from Landing Page) */
        .lp-footer { background:var(--navy-d); margin-top:80px; }
        .lp-footer__inner { max-width:1280px; margin:0 auto; padding:60px 4% 44px; display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1.3fr; gap:44px; }
        .lp-footer__brand p { font-size:.84rem; line-height:1.65; color:rgba(255,255,255,.52); margin:12px 0 18px; max-width:250px; }
        .lp-footer__logo { width:145px; height:auto; display:block; }
        .lp-footer__socials { display:flex; gap:9px; }
        .lp-footer__socials a { width:34px; height:34px; border-radius:8px; border:1px solid rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.55); font-size:.84rem; transition:all .25s; }
        .lp-footer__socials a:hover { background:rgba(255,255,255,.1); color:#fff; border-color:rgba(255,255,255,.25); }
        .lp-footer__col { display:flex; flex-direction:column; gap:0; }
        .lp-footer__col h4 { font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.9); margin-bottom:13px; font-family:var(--fd); }
        .lp-footer__col a { color:rgba(255,255,255,.48); font-size:.855rem; font-weight:500; padding:4px 0; transition:color .25s; text-decoration:none; }
        .lp-footer__col a:hover { color:#fff; }
        .lp-footer__app { display:flex; flex-direction:column; gap:9px; }
        .lp-footer__app h4 { font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.9); margin-bottom:4px; font-family:var(--fd); }
        .lp-app-btn { display:flex; align-items:center; gap:7px; padding:9px 14px; border-radius:9px; border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.6); font-size:.78rem; font-weight:600; text-decoration:none; transition:all .25s; }
        .lp-app-btn:hover { background:rgba(255,255,255,.08); color:#fff; border-color:rgba(255,255,255,.25); }
        .lp-footer__qr { display:flex; align-items:center; gap:9px; margin-top:4px; color:rgba(255,255,255,.4); font-size:.74rem; font-weight:500; }
        .lp-footer__qr img { width:50px; height:50px; border-radius:7px; }
        .lp-footer__bottom { max-width:1280px; margin:0 auto; padding:18px 4%; border-top:1px solid rgba(255,255,255,.08); display:flex; align-items:center; justify-content:space-between; gap:14px; font-size:.78rem; color:rgba(255,255,255,.32); flex-wrap:wrap; }
        .lp-footer__bottom div { display:flex; gap:18px; }
        .lp-footer__bottom a { color:rgba(255,255,255,.32); transition:color .25s; text-decoration:none; }
        .lp-footer__bottom a:hover { color:rgba(255,255,255,.7); }
        @media(max-width:900px){
          .lp-footer__inner { grid-template-columns:1fr 1fr 1fr; }
          .lp-footer__brand { grid-column:1/-1; }
        }
        @media(max-width:640px){
          .lp-footer__inner { grid-template-columns:1fr 1fr; }
          .lp-footer__brand { grid-column:1/-1; }
          .lp-footer__bottom { flex-direction:column; text-align:center; }
        }
        @media(max-width:480px){
          .lp-footer__inner { grid-template-columns:1fr; }
        }

        /* FADE SECTIONS */
        .sf{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s ease}
        .sf.sv{opacity:1;transform:translateY(0)}

        /* RESPONSIVE */
        /* TABLET HERO FIXES (includes iPad Pro) */
        @media(max-width:1024px){
          .hero{height:500px; min-height:500px;}
          .htext{max-width:440px}
          .hh1{font-size:46px}
          .sw{width:55%; right: -15%;}
          .ho-left{width:60%; background:linear-gradient(to right, rgba(2,8,30,.92) 0%, rgba(2,8,30,.8) 75%, transparent 100%);}
        }

        /* RESPONSIVE */
        @media(max-width:900px){
          .cg2{grid-template-columns:1fr}
          .pb2{grid-template-columns:1fr;padding:40px 28px}
          .pcard{width:100%}
          .pf{grid-template-columns:1fr}
          .cong{grid-template-columns:1fr;gap:44px}
          .fr{grid-template-columns:1fr}
          .ssi{grid-template-columns:1fr 1fr}
          .sti{border-right:none;border-bottom:1px solid var(--s100)}
          .hc{padding:0 28px}
          .nl{display:none}
          .si{left:28px}
        }

        /* MOBILE HERO LAYOUT */
        @media(max-width:768px){
          .hero {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: 0;
            padding-top: 110px;
            padding-bottom: 30px;
          }
          .hc {
            order: 1;
            padding: 0 20px;
            height: auto;
            align-items: flex-start;
          }
          .sw {
            order: 2;
            position: relative;
            top: auto;
            right: -30%;
            bottom: auto;
            width: 100%;
            height: 280px;
            align-self: flex-end;
            margin-top: -140px;
            z-index: 20;
            overflow: hidden;
          }
          .sw iframe {
            height: calc(100% + 72px);
          }
          .hbtns {
            width: 48%;
            flex-direction: column;
            position: relative;
            z-index: 10;
          }
          .hbp, .hbg {
            padding: 12px;
            font-size: 13px;
            justify-content: center;
          }
          .hh1 {
            font-size: 34px;
            margin-bottom: 12px;
          }
          .hsub {
            font-size: 14px;
            margin-bottom: 24px;
          }
          .ho-left, .ho-top, .ho-bot, .si {
            display: none !important;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header className={`nb${isScrolled ? " sc" : ""}`}>
        <div className="nbi">
          <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
            <Link to="/">
              <img src={mavenLogo} alt="MavenJobs" className="logo-img" />
            </Link>
            <nav className="nl">
              <Link to="/jobs" className="nla">
                Jobs
              </Link>
              <Link to="/companies" className="nla">
                Companies
              </Link>
              <Link to="/services" className="nla ac">
                Services
              </Link>
            </nav>
          </div>

          <div
            className="na"
            style={{ display: "flex", alignItems: "center", gap: "14px" }}
          >
            {!user ? (
              <>
                <button className="btnl" onClick={openLogin}>
                  Login
                </button>
                <button className="btnr" onClick={openRegister}>
                  Get Started
                </button>
              </>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  className="nav-icon-btn"
                  title="Notifications"
                  style={{
                    position: "relative",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isScrolled
                      ? "#f8fafc"
                      : "rgba(255,255,255,0.1)",
                    border: isScrolled
                      ? "1.5px solid #e2e8f0"
                      : "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    color: isScrolled ? "#002366" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = isScrolled
                      ? "#f1f5f9"
                      : "rgba(255,255,255,0.2)";
                    if (isScrolled)
                      e.currentTarget.style.borderColor = "#002366";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = isScrolled
                      ? "#f8fafc"
                      : "rgba(255,255,255,0.1)";
                    if (isScrolled)
                      e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <FiBell size={20} />
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "8px",
                      height: "8px",
                      background: "#0DBF7B",
                      borderRadius: "50%",
                      border: `2px solid ${isScrolled ? "white" : "#002366"}`,
                      boxShadow: "0 0 10px rgba(13, 191, 123, 0.5)",
                    }}
                  ></span>
                </button>

                <Link
                  to="/profile"
                  className="nav-profile-link"
                  style={{ textDecoration: "none" }}
                >
                  <AvatarDropdown />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO — text LEFT, sphere FREE on RIGHT */}
      <section className="hero" id="hero">
        {/* Spline full-bleed */}
        <div className="sw">
          <iframe
            src="https://my.spline.design/genkubgreetingrobot-UiYXVqKhoJWzdmfEGPLgLMWD/"
            title="3D AI Assistant"
            allowFullScreen
          />
        </div>

        {/* Overlays — only darken left & edges, not center-right */}
        <div className="ho-top" />
        <div className="ho-left" />
        <div className="ho-bot" />

        {/* Hero text — left side */}
        <div className="hc">
          <div className="htext">
            <div className="heb">
              <FiZap size={11} fill="currentColor" />
              India's #1 Career Acceleration Platform
            </div>
            <h1 className="hh1">
              Move Ahead in
              <br />
              Career, <span className="acc">Faster</span>
            </h1>
            <p className="hsub">
              Premium tools, expert guidance, and AI-powered services —
              everything you need to land your dream role.
            </p>
            <div className="hbtns">
              <a href="#plans" className="hbp">
                Explore Plans <FiArrowRight size={15} />
              </a>
              <a href="#contact" className="hbg">
                Talk to Experts
              </a>
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
            { num: "2.8M+", label: "Job Seekers Served" },
            { num: "94%", label: "Interview Success Rate" },
            { num: "1,200+", label: "Partner Companies" },
            { num: "4.9★", label: "Average Rating" },
          ].map((s, i) => (
            <div key={i} className="sti">
              <div className="stn">{s.num}</div>
              <div className="stl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div id="plans">
        {serviceCategories.map((cat, idx) => (
          <div
            key={idx}
            style={{ background: idx % 2 === 1 ? "#fff" : "#f0f4fb" }}
          >
            <div className="sw2">
              <div className="cs sf" ref={idx === 0 ? r1 : r2}>
                <div className="ch">
                  <span className="ce">{cat.sub}</span>
                  <h2 className="ctt">{cat.title}</h2>
                  <div className="cdiv" />
                  <p className="cd">{cat.desc}</p>
                </div>
                <div className="cg2">
                  {cat.services.map((svc, si) => (
                    <ServiceCard key={si} service={svc} delay={si * 110} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PREMIUM */}
      <div style={{ background: "#f0f4fb" }}>
        <div className="sw2">
          <div className="ps">
            <div className="pb2 sf" ref={r3}>
              <div className="pgrid" />
              <div className="po1" />
              <div className="po2" />
              <div className="pl">
                <div className="pbadge">
                  <FiStar size={11} fill="#f59e0b" color="#f59e0b" />
                  Premium Subscriptions
                </div>
                <h2 className="ph2">
                  Subscribe to our Monthly
                  <br />
                  Job Search Plan
                </h2>
                <div className="pf">
                  {[
                    "Rank Higher in Recruiter Searches",
                    "Priority Access to New Jobs",
                    "Message Recruiters Directly",
                    "Daily Job Alerts on WhatsApp",
                  ].map((item, i) => (
                    <div key={i} className="pfi">
                      <div className="pck">
                        <FiCheck size={12} strokeWidth={3} />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pcard">
                <div className="pce">MONTHLY PLAN</div>
                <div className="ppr">
                  <span className="ppc">₹</span>
                  <span className="ppa">999</span>
                  <span className="ppd">/month</span>
                </div>
                <p className="ppn">Cancel anytime · No lock-in</p>
                <button className="bsub">Subscribe Now</button>
                <div className="pcn">30-day money-back guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <section id="contact" className="con">
        <div className="sw2">
          <div className="cong sf" ref={r4}>
            <div>
              <h2 className="conh2">Talk to Our Career Experts</h2>
              <p className="cons">
                Have questions? We'll help you pick the right plan and strategy
                for your goals.
              </p>
              {[
                {
                  icon: <FiPhone size={20} />,
                  title: "Call Us",
                  info: "Toll Free: 1800-102-5557",
                  sub: "9:00 AM – 9:00 PM IST",
                  color: "#10b981",
                },
                {
                  icon: <FiMail size={20} />,
                  title: "Email Support",
                  info: "support@mavenjobs.com",
                  sub: "Replies in 2–4 hours",
                  color: "#002366",
                },
                {
                  icon: <FiMapPin size={20} />,
                  title: "Corporate Office",
                  info: "Level 4, Maven Tower, Bangalore",
                  sub: "Karnataka · 560103",
                  color: "#6366f1",
                },
              ].map((item, i) => (
                <div key={i} className="coni">
                  <div
                    className="conico"
                    style={{ background: `${item.color}0f`, color: item.color }}
                  >
                    {item.icon}
                  </div>
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
                  <input className="fi" type="text" placeholder="John Doe" />
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label className="fl">Email Address</label>
                  <input
                    className="fi"
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Phone Number</label>
                <div className="pg">
                  <div className="pp">+91</div>
                  <input
                    className="fi pi"
                    type="tel"
                    placeholder="98765 43210"
                  />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Message</label>
                <textarea
                  className="fi fta"
                  rows={4}
                  placeholder="I'm interested in the Monthly Job Search plan..."
                />
              </div>
              <button className="bsmt">Request a Callback</button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </>
  );
};

export default Services;
