import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import {
  FiArrowLeft, FiChevronRight, FiSearch, FiMapPin,
  FiFilter, FiBookmark, FiBriefcase, FiCheckCircle, FiStar, FiInfo
} from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import LandingFooter from "../../../../components/LandingFooter";

const SECTIONS = [
  {
    icon: FiSearch, title: "Search & Filter",
    items: [
      "Use the search bar to find jobs by title, skill, or company.",
      "Enter a location to narrow results to your preferred city.",
      "Filter by department, work mode, salary, experience, and more using the left sidebar.",
      "Click a category chip at the top to quickly browse by domain.",
    ]
  },
  {
    icon: FiBookmark, title: "Save & Apply",
    items: [
      "Bookmark jobs to review later — your saved list is accessible from your profile.",
      "Click \"Quick Apply\" on any job card to submit your profile instantly.",
      "Featured jobs appear first and are marked with a star badge.",
    ]
  },
  {
    icon: FiBriefcase, title: "Company Insights",
    items: [
      "Click a company name or logo to visit its profile and see all their openings.",
      "The \"Top Companies Hiring\" sidebar shows employers with the most recent postings.",
      "Ratings and review counts help you evaluate each opportunity.",
    ]
  },
  {
    icon: FiStar, title: "Pro Tips",
    items: [
      "Keep your profile updated — employers review it before reaching out.",
      "Use relevant keywords in your search for more accurate results.",
      "Set up alerts for new jobs matching your criteria.",
    ]
  },
];

export default function JobsInfo() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-ji]", { y: 20, opacity: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} style={{ minHeight: "100vh", background: "#f7f9fc", color: "#0a1628", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <header style={{ height: 64, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img src={mavenLogo} alt="Maven Jobs" style={{ height: 32 }} />
          </Link>
          <Link to="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#143f86", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            <FiArrowLeft size={15} /> Back to Jobs
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Breadcrumb */}
        <div data-ji style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 24 }}>
          <Link to="/jobs" style={{ color: "#64748b", textDecoration: "none" }}>Jobs</Link>
          <FiChevronRight size={12} />
          <span style={{ color: "#0f172a" }}>How it Works</span>
        </div>

        {/* Title */}
        <div data-ji style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#143f86" }}>
            <FiInfo size={22} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#071a3d", letterSpacing: "-.02em" }}>Jobs Page Guide</h1>
            <p style={{ fontSize: 14, color: "#52637a", marginTop: 4 }}>Everything you need to know to find your next opportunity.</p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SECTIONS.map((section) => (
            <div key={section.title} data-ji style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px", boxShadow: "0 1px 6px rgba(10,22,40,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#143f86" }}>
                  <section.icon size={18} />
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: "#071a3d" }}>{section.title}</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                    <FiCheckCircle size={14} color="#0dbf7b" style={{ marginTop: 4, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
      </section>
       <LandingFooter />
    </main>
  );
}
