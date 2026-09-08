import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FiArrowLeft, FiArrowRight, FiBarChart2, FiTrendingUp, FiDollarSign,
  FiMapPin, FiBriefcase, FiCheckCircle, FiAward, FiChevronRight,
  FiStar, FiX, FiTrendingDown
} from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";

gsap.registerPlugin(ScrollTrigger);

const INDUSTRY_DATA = [
  { role: "Software Engineer", entry: "4–8 LPA", mid: "12–22 LPA", senior: "28–50 LPA", growth: "High", bar: 72, color: "#6366f1" },
  { role: "Data Scientist", entry: "5–9 LPA", mid: "14–25 LPA", senior: "30–55 LPA", growth: "Very High", bar: 85, color: "#0dbf7b" },
  { role: "Product Manager", entry: "8–14 LPA", mid: "20–35 LPA", senior: "45–75 LPA", growth: "High", bar: 78, color: "#f59e0b" },
  { role: "UX Designer", entry: "4–7 LPA", mid: "10–18 LPA", senior: "22–40 LPA", growth: "Moderate", bar: 55, color: "#ec4899" },
  { role: "Marketing Manager", entry: "3–6 LPA", mid: "8–15 LPA", senior: "18–30 LPA", growth: "Moderate", bar: 50, color: "#0ea5e9" },
  { role: "Business Analyst", entry: "3.5–6 LPA", mid: "8–14 LPA", senior: "18–28 LPA", growth: "Moderate", bar: 52, color: "#8b5cf6" },
];

const TOP_CITIES = [
  { city: "Bengaluru", avgSalary: "14.2 LPA", premium: "28 LPA", jobs: "Very High", color: "#0dbf7b" },
  { city: "Hyderabad", avgSalary: "12.8 LPA", premium: "24 LPA", jobs: "Very High", color: "#6366f1" },
  { city: "Mumbai", avgSalary: "13.5 LPA", premium: "26 LPA", jobs: "Very High", color: "#f59e0b" },
  { city: "Delhi NCR", avgSalary: "11.6 LPA", premium: "22 LPA", jobs: "High", color: "#ec4899" },
  { city: "Pune", avgSalary: "10.4 LPA", premium: "20 LPA", jobs: "High", color: "#0ea5e9" },
  { city: "Chennai", avgSalary: "10.1 LPA", premium: "19 LPA", jobs: "High", color: "#8b5cf6" },
];

const TRENDING_INSIGHTS = [
  { label: "Remote roles pay 12% less on average vs in-office", icon: FiTrendingDown, color: "#6366f1" },
  { label: "AI/ML skills command a 22% salary premium", icon: FiStar, color: "#0dbf7b" },
  { label: "Bengaluru has 3x more tech jobs than any other city", icon: FiMapPin, color: "#f59e0b" },
  { label: "Startups offer 18% higher equity upside vs MNCs", icon: FiBriefcase, color: "#ec4899" },
];

const SALARY_GROWTH = [
  { level: "0–2 yrs", pct: 8, color: "#6366f1" },
  { level: "3–5 yrs", pct: 22, color: "#0dbf7b" },
  { level: "6–9 yrs", pct: 35, color: "#f59e0b" },
  { level: "10+ yrs", pct: 42, color: "#ec4899" },
];

function Counter({ end, suffix = "" }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo({ val: 0 }, {
      val: 0, duration: 2, ease: "power2.out",
      onUpdate: function () { setVal(Math.round(this.targets()[0].val)); }
    }, {
      val: end, duration: 2, ease: "power2.out",
      onUpdate: function () { setVal(Math.round(this.targets()[0].val)); },
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  }, [end]);

  return <span ref={ref}>{val}{suffix}</span>;
}

function RoleModal({ role, onClose }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const row = INDUSTRY_DATA.find(r => r.role === role);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(modalRef.current, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out", delay: 0.08 });
    });
    return () => ctx.revert();
  }, []);

  const handleClose = useCallback(() => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.15 });
    gsap.to(modalRef.current, { y: 20, opacity: 0, scale: 0.96, duration: 0.15, onComplete: onClose });
  }, [onClose]);

  if (!row) return null;

  const levelColor = row.growth === "Very High" ? "#0dbf7b" : row.growth === "High" ? "#6366f1" : "#f59e0b";

  return (
    <div ref={overlayRef} onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,22,40,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
      <div ref={modalRef} onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", boxShadow: "0 32px 64px rgba(10,22,40,.2)", border: "1px solid #e8edf4" }}>
        {/* Accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${row.color}, ${levelColor})` }} />

        <div style={{ padding: "24px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${row.color}14`, border: `2px solid ${row.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: row.color }}>
              {row.role.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: "#071a3d", letterSpacing: "-.02em" }}>{row.role}</h3>
              <span style={{ fontSize: 12.5, color: "#52637a", fontWeight: 600 }}>Salary benchmark & growth</span>
            </div>
          </div>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#f7f9fc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#143f86"; e.currentTarget.style.color = "#143f86"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}>
            <FiX size={16} />
          </button>
        </div>

        <div className="si-modal-grid" style={{ padding: "0 28px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Entry Level", value: row.entry },
            { label: "Mid Level", value: row.mid },
            { label: "Senior", value: row.senior },
          ].map((tier) => (
            <div key={tier.label} style={{ background: "#f7f9fc", borderRadius: 12, padding: "14px 12px", textAlign: "center", border: "1px solid #e8edf4" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#52637a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{tier.label}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: "#071a3d" }}>{tier.value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 28px 24px", borderTop: "1px solid #eef2f7" }}>
          <div style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: levelColor }} />
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                Demand: <strong style={{ color: "#071a3d" }}>{row.growth}</strong>
              </span>
              <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                YoY Growth: <strong style={{ color: "#0dbf7b" }}>+{row.bar}%</strong>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#52637a", fontWeight: 600 }}>Salary data: indicative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalaryInsights() {
  const pageRef = useRef(null);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-si-fade]", {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out"
      });
      gsap.utils.toArray("[data-si-card-group]").forEach((group) => {
        gsap.from(group.querySelectorAll("[data-si-card]"), {
          y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 85%" }
        });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} style={{ minHeight: "100vh", background: "#f7f9fc", color: "#0a1628", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .si-table-row { transition: background .15s; }
        .si-table-row:hover { background: #f0f5fe; }
        .si-city-card { transition: all .3s cubic-bezier(.4,0,.2,1); cursor: default; }
        .si-city-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(10,22,40,.07); }
        .si-insight-card { transition: all .25s; cursor: default; }
        .si-insight-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(10,22,40,.05); }

        .si-city-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16; }
        .si-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28; }

        @media (max-width: 900px) {
          .si-city-grid { grid-template-columns: repeat(2, 1fr); }
          .si-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 540px) {
          .si-city-grid { grid-template-columns: 1fr; }
          .si-modal-grid { grid-template-columns: 1fr !important; }
          .si-hero-stats { grid-template-columns: 1fr 1fr !important; width: 100% !important; }
          .si-hero-stats > div { min-width: 0 !important; padding: 16px 12px !important; }
          .si-pad-hero { padding: 96px 16px 48px !important; }
          .si-hero-btns { flex-direction: column; width: 100%; }
          .si-hero-btns > * { width: 100%; justify-content: center; }
          .si-pad-insights { padding: 24px 16px 0 !important; }
          .si-pad-section { padding: 40px 16px !important; }
          .si-pad-cities { padding: 40px 0 !important; }
          .si-pad-roles { padding: 0 16px 40px !important; }
          .si-cta-wrapper { flex-direction: column !important; text-align: center !important; }
          .si-cta-wrapper > div { width: 100% !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      {/* <header style={{ height: 72, background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8edf4", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img src={mavenLogo} alt="Maven Jobs" style={{ height: 38 }} />
          </Link>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#143f86", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            <FiArrowLeft size={15} /> Back to Home
          </Link>
        </div>
      </header> */}
      <LandingHeader />

      {/* ── HERO ── */}
      <section style={{ position: "relative", background: "linear-gradient(135deg, #f7f9fc 0%, #eef2f7 100%)", borderBottom: "1px solid #e8edf4", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,191,123,.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="si-pad-hero" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 28px 72px", position: "relative", zIndex: 1 }}>
          <div data-si-fade style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(13,191,123,.1)", border: "1px solid rgba(13,191,123,.2)", borderRadius: 100, padding: "6px 14px 6px 10px", color: "#0d804f", fontWeight: 700, fontSize: 12.5, letterSpacing: ".02em", marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0dbf7b", display: "inline-block" }} />
            Powered by real-time market data
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 data-si-fade style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.1, letterSpacing: "-.03em", color: "#071a3d", maxWidth: 640 }}>
                Know your worth in{" "}
                <span style={{ background: "linear-gradient(135deg, #143f86, #0dbf7b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  today's market
                </span>
              </h1>
              <p data-si-fade style={{ marginTop: 20, fontSize: 16, lineHeight: 1.8, color: "#52637a", maxWidth: 520 }}>
                Real compensation data crowdsourced from thousands of professionals across India.
                Compare roles, locations, and experience to make informed career decisions.
              </p>
              <div className="si-hero-btns" data-si-fade style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                <Link to="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "#143f86", color: "#fff", borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: "none", transition: "all .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a4d9e"}
                  onMouseLeave={e => e.currentTarget.style.background = "#143f86"}>
                  Browse jobs <FiArrowRight size={15} />
                </Link>
                <a href="#roles" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", background: "#fff", color: "#143f86", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", border: "1.5px solid #dbe5f2", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#143f86"; e.currentTarget.style.background = "#f7f9fc"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#dbe5f2"; e.currentTarget.style.background = "#fff"; }}>
                  See salaries <FiChevronRight size={15} />
                </a>
              </div>
            </div>

            <div className="si-hero-stats" data-si-fade style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
              {[
                { val: 50, suffix: "K+", label: "Data points" },
                { val: 200, suffix: "+", label: "Roles" },
                { val: 40, suffix: "+", label: "Cities" },
                { val: 98, suffix: "%", label: "Confidence" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", textAlign: "center", border: "1px solid #e8edf4", minWidth: 120 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#071a3d", lineHeight: 1.2 }}>
                    <Counter end={s.val} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 12, color: "#52637a", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRENDING INSIGHTS ── */}
      <div className="si-pad-insights" data-si-card-group style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 0" }}>
        <div data-si-card style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 56 }}>
          {TRENDING_INSIGHTS.map((insight, i) => (
            <div key={i} className="si-insight-card" style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf4" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${insight.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <insight.icon size={16} color={insight.color} />
              </div>
              <div style={{ fontSize: 13.5, color: "#1e293b", fontWeight: 600, lineHeight: 1.5 }}>{insight.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SALARY TABLE ── */}
      <section id="roles" className="si-pad-roles" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px 56px" }}>
        <div data-si-fade style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.5rem", color: "#071a3d", letterSpacing: "-.02em" }}>Salary by role</h2>
          <p style={{ color: "#52637a", fontSize: 14.5, marginTop: 6 }}>Click a row to view detailed salary benchmarks.</p>
        </div>

        <div data-si-fade style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8edf4", overflow: "hidden", boxShadow: "0 2px 12px rgba(10,22,40,.04)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#f4f7fc" }}>
                  {["Role", "Entry Level", "Mid Level", "Senior", "Demand", "Growth"].map(h => (
                    <th key={h} style={{ padding: "14px 20px", fontWeight: 800, color: "#071a3d", fontSize: 12.5, letterSpacing: ".03em", textTransform: "uppercase", borderBottom: "1px solid #e8edf4", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INDUSTRY_DATA.map((row, i) => {
                  const barColor = row.growth === "Very High" ? "#0dbf7b" : row.growth === "High" ? "#6366f1" : "#f59e0b";
                  return (
                    <tr key={row.role} className="si-table-row" onClick={() => setActiveRole(row.role)}
                      style={{ cursor: "pointer", borderBottom: i < INDUSTRY_DATA.length - 1 ? "1px solid #eef2f7" : "none" }}>
                      <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0a1628" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: barColor, display: "inline-block" }} />
                          {row.role}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#475569", fontWeight: 600 }}>{row.entry}</td>
                      <td style={{ padding: "16px 20px", color: "#475569", fontWeight: 600 }}>{row.mid}</td>
                      <td style={{ padding: "16px 20px", color: "#071a3d", fontWeight: 800 }}>{row.senior}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          background: row.growth === "Very High" ? "#d1fae5" : row.growth === "High" ? "#eef2ff" : "#fef9e7",
                          color: row.growth === "Very High" ? "#065f46" : row.growth === "High" ? "#3730a3" : "#92400e",
                          padding: "4px 12px", borderRadius: 100, fontWeight: 700, fontSize: 12
                        }}>
                          {row.growth}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", minWidth: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 6, background: "#eef2f7", overflow: "hidden" }}>
                            <div style={{ width: `${row.bar}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`, transition: "width .6s" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>{row.bar}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CITIES ── */}
      <section className="si-pad-cities" style={{ background: "#fff", borderTop: "1px solid #e8edf4", borderBottom: "1px solid #e8edf4", padding: "56px 0" }}>
        <div className="si-pad-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          <div data-si-fade style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.5rem", color: "#071a3d", letterSpacing: "-.02em" }}>Top paying cities</h2>
            <p style={{ color: "#52637a", fontSize: 14.5, marginTop: 6 }}>Average and premium compensation across major tech hubs in India.</p>
          </div>

          <div data-si-card-group className="si-city-grid">
            {TOP_CITIES.map((city) => (
              <div key={city.city} data-si-card className="si-city-card" style={{ background: "#f7f9fc", borderRadius: 14, padding: 22, border: "1px solid #e8edf4" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: city.color }} />
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#071a3d" }}>{city.city}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                    background: city.jobs === "Very High" ? "#d1fae5" : "#eef2ff",
                    color: city.jobs === "Very High" ? "#065f46" : "#3730a3"
                  }}>
                    {city.jobs}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #e8edf4" }}>
                    <div style={{ fontSize: 12, color: "#52637a", fontWeight: 600, marginBottom: 4 }}>Average</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: "#0dbf7b" }}>{city.avgSalary}</div>
                  </div>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #e8edf4" }}>
                    <div style={{ fontSize: 12, color: "#52637a", fontWeight: 600, marginBottom: 4 }}>Top 10%</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: "#143f86" }}>{city.premium}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GROWTH + TIPS ── */}
      <section className="si-pad-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px" }}>
        <div data-si-card-group className="si-bottom-grid">
          <div data-si-card style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8edf4", padding: "28px 24px", boxShadow: "0 2px 12px rgba(10,22,40,.04)" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.1rem", color: "#071a3d", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <FiTrendingUp color="#0dbf7b" /> Salary growth by experience
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SALARY_GROWTH.map((item) => (
                <div key={item.level}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{item.level}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#071a3d" }}>+{item.pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 8, background: "#eef2f7", overflow: "hidden" }}>
                    <div style={{ width: `${item.pct * 2}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`, transition: "width 1s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-si-card style={{ background: "linear-gradient(135deg, #f7f9fc 0%, #fff 100%)", borderRadius: 16, border: "1px solid #e8edf4", padding: "28px 24px", boxShadow: "0 2px 12px rgba(10,22,40,.04)" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.1rem", color: "#071a3d", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <FiAward color="#143f86" /> Maximize your compensation
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                "Research industry benchmarks before negotiating.",
                "Highlight measurable impact in your current role.",
                "Consider total comp — bonus, equity, and benefits.",
                "Upskill in high-demand areas to boost your bracket.",
                "Network within your industry for insider data.",
                "Time negotiations during performance reviews.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#143f86", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="si-pad-section" style={{ background: "#143f86", padding: "56px 28px" }}>
        <div className="si-cta-wrapper" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.6rem", color: "#fff", letterSpacing: "-.02em" }}>Ready to find your next role?</h2>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, marginTop: 8 }}>Browse thousands of verified jobs with transparent salary ranges.</p>
          </div>
          <Link to="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", background: "#fff", color: "#143f86", borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: "none", transition: "all .2s", whiteSpace: "nowrap" }}
            onMouseEnter={e => e.currentTarget.style.background = "#eef2f7"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            Explore jobs <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      {/* <footer style={{ background: "#0a1628", padding: "24px 28px", textAlign: "center" }}>
        <Link to="/" style={{ display: "inline-block", marginBottom: 12 }}>
          <img src={mavenLogo} alt="Maven Jobs" style={{ height: 32, filter: "brightness(0) invert(1)" }} />
        </Link>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12.5, fontWeight: 500 }}>
          &copy; {new Date().getFullYear()} Maven Jobs. All rights reserved. Salary data is crowdsourced and indicative.
        </p>
      </footer> */}

      <LandingFooter />

      {/* ── ROLE MODAL ── */}
      {activeRole && <RoleModal role={activeRole} onClose={() => setActiveRole(null)} />}
    </main>
  );
}
