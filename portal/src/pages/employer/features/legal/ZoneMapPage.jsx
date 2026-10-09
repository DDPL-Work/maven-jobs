import React, { useState, useEffect } from "react";
import LandingEmployeeHeader from "../../../../layout/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../layout/employer/LandingEmployeeFooter";
import indiaMap from "../../../../../assets/india-zones-map.jpg";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./ZoneMapPage.css";


const INDIAN_STATES_BY_ZONE = {
  North: [
    "Delhi",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Ladakh",
    "Punjab",
    "Rajasthan",
    "Uttar Pradesh",
    "Uttarakhand",
  ],
  South: [
    "Andhra Pradesh",
    "Goa",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",
  ],
  East: [
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Jharkhand",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Sikkim",
    "Tripura",
    "West Bengal",
  ],
  West: ["Chhattisgarh", "Gujarat", "Madhya Pradesh", "Maharashtra"],
};

const ZONE_CONFIG = {
  North: {
    color: "#2563eb",
    light: "#eff6ff",
    border: "#bfdbfe",
    label: "Northern India",
    tagline: "Himalayas, Plains & Capital",
    illustration: (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Sky */}
        <rect width="120" height="80" rx="10" fill="#e0f2fe" />
        {/* Clouds */}
        <ellipse cx="25" cy="18" rx="14" ry="7" fill="white" opacity="0.9" />
        <ellipse cx="35" cy="15" rx="10" ry="6" fill="white" opacity="0.9" />
        <ellipse cx="90" cy="22" rx="10" ry="5" fill="white" opacity="0.8" />
        {/* Mountain Back */}
        <polygon points="10,65 40,25 70,65" fill="#93c5fd" />
        <polygon points="50,65 80,22 110,65" fill="#60a5fa" />
        {/* Snow caps */}
        <polygon points="40,25 33,42 47,42" fill="white" opacity="0.9" />
        <polygon points="80,22 73,40 87,40" fill="white" opacity="0.9" />
        {/* Ground */}
        <rect x="0" y="63" width="120" height="17" rx="0" fill="#86efac" />
        {/* Trees */}
        <polygon points="15,63 20,48 25,63" fill="#16a34a" />
        <polygon points="95,63 100,50 105,63" fill="#16a34a" />
        <polygon points="100,63 104,52 108,63" fill="#15803d" />
        {/* River */}
        <path
          d="M55 65 Q62 68 68 65 Q74 62 80 65"
          stroke="#60a5fa"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  South: {
    color: "#059669",
    light: "#f0fdf4",
    border: "#bbf7d0",
    label: "Southern India",
    tagline: "Coasts, Tech Hubs & Greenery",
    illustration: (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Sky */}
        <rect width="120" height="80" rx="10" fill="#ccfbf1" />
        {/* Sun */}
        <circle cx="90" cy="22" r="12" fill="#fde68a" opacity="0.9" />
        <circle cx="90" cy="22" r="8" fill="#fbbf24" />
        {/* Sea */}
        <rect x="0" y="55" width="120" height="25" rx="0" fill="#0d9488" />
        <path
          d="M0 55 Q15 50 30 55 Q45 60 60 55 Q75 50 90 55 Q105 60 120 55"
          fill="#14b8a6"
        />
        {/* Sand */}
        <rect x="0" y="50" width="120" height="10" fill="#fef3c7" />
        {/* Palm tree 1 */}
        <rect x="28" y="30" width="4" height="25" rx="2" fill="#92400e" />
        <ellipse
          cx="30"
          cy="30"
          rx="16"
          ry="8"
          fill="#16a34a"
          transform="rotate(-20 30 30)"
        />
        <ellipse
          cx="30"
          cy="30"
          rx="16"
          ry="7"
          fill="#15803d"
          transform="rotate(20 30 30)"
        />
        {/* Palm tree 2 */}
        <rect x="72" y="25" width="4" height="28" rx="2" fill="#92400e" />
        <ellipse
          cx="74"
          cy="25"
          rx="14"
          ry="7"
          fill="#16a34a"
          transform="rotate(-15 74 25)"
        />
        <ellipse
          cx="74"
          cy="25"
          rx="14"
          ry="6"
          fill="#15803d"
          transform="rotate(25 74 25)"
        />
        {/* Coconuts */}
        <circle cx="27" cy="35" r="3" fill="#92400e" />
        <circle cx="32" cy="33" r="3" fill="#92400e" />
      </svg>
    ),
  },
  East: {
    color: "#ea580c",
    light: "#fff7ed",
    border: "#fed7aa",
    label: "Eastern India",
    tagline: "Tea Gardens, Sunrise & Rivers",
    illustration: (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Sky gradient */}
        <rect width="120" height="80" rx="10" fill="#fef3c7" />
        <rect width="120" height="50" rx="10" fill="#fed7aa" opacity="0.5" />
        {/* Sunrise glow */}
        <circle cx="60" cy="52" r="30" fill="#fb923c" opacity="0.25" />
        {/* Sun rising */}
        <circle cx="60" cy="52" r="16" fill="#f97316" opacity="0.9" />
        <circle cx="60" cy="52" r="11" fill="#fbbf24" />
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1="60"
            y1="52"
            x2={60 + 22 * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={52 + 22 * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        ))}
        {/* Hills */}
        <ellipse cx="20" cy="68" rx="30" ry="14" fill="#16a34a" />
        <ellipse cx="100" cy="70" rx="30" ry="12" fill="#15803d" />
        {/* Tea bushes */}
        <ellipse cx="20" cy="62" rx="8" ry="5" fill="#4ade80" />
        <ellipse cx="35" cy="60" rx="7" ry="4" fill="#22c55e" />
        <ellipse cx="90" cy="63" rx="7" ry="4" fill="#4ade80" />
        <ellipse cx="105" cy="65" rx="8" ry="5" fill="#22c55e" />
        {/* River */}
        <path
          d="M0 72 Q30 68 60 72 Q90 76 120 72"
          stroke="#7dd3fc"
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
      </svg>
    ),
  },
  West: {
    color: "#7c3aed",
    light: "#f5f3ff",
    border: "#ddd6fe",
    label: "Western India",
    tagline: "Deserts, Coasts & Finance Hub",
    illustration: (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Sky */}
        <rect width="120" height="80" rx="10" fill="#e9d5ff" />
        {/* Setting sun */}
        <circle cx="60" cy="45" r="18" fill="#c026d3" opacity="0.2" />
        <circle cx="60" cy="45" r="12" fill="#a855f7" opacity="0.6" />
        <circle cx="60" cy="45" r="7" fill="#fbbf24" opacity="0.9" />
        {/* Sand dunes */}
        <ellipse cx="30" cy="72" rx="45" ry="16" fill="#fde68a" />
        <ellipse cx="90" cy="76" rx="45" ry="14" fill="#fcd34d" />
        <ellipse cx="60" cy="70" rx="60" ry="13" fill="#fef3c7" />
        {/* Dune shadows */}
        <ellipse cx="25" cy="74" rx="20" ry="6" fill="#f59e0b" opacity="0.3" />
        <ellipse cx="85" cy="76" rx="25" ry="5" fill="#f59e0b" opacity="0.3" />
        {/* Cactus */}
        <rect x="18" y="50" width="5" height="22" rx="2" fill="#15803d" />
        <rect x="10" y="55" width="10" height="4" rx="2" fill="#15803d" />
        <rect x="21" y="52" width="10" height="4" rx="2" fill="#15803d" />
        {/* Stars */}
        <circle cx="15" cy="18" r="1.5" fill="#7c3aed" opacity="0.8" />
        <circle cx="40" cy="12" r="1" fill="#7c3aed" opacity="0.6" />
        <circle cx="80" cy="15" r="1.5" fill="#a78bfa" opacity="0.7" />
        <circle cx="105" cy="10" r="1" fill="#7c3aed" opacity="0.5" />
      </svg>
    ),
  },
};

export default function ZoneMapPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState(null);

  useEffect(() => {
    if (hash) {
      const zoneName = hash.replace("#", "");
      const key = Object.keys(ZONE_CONFIG).find(
        (z) => z.toLowerCase() === zoneName,
      );
      if (key) setActiveZone(key);
      const el = document.getElementById(zoneName);
      if (el)
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          100,
        );
    }
  }, [hash]);

  return (
    <div className="zmp-page-root">
      <LandingEmployeeHeader solid />

      {/* Page Header */}
      <div className="zmp-hero">
        <div className="zmp-hero-container">
          <div className="zmp-badge-row">
            <div className="zmp-badge">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2C8.13 2 5 5.13 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7z" />
              </svg>
              <span className="zmp-badge-text">
                Sales Territories
              </span>
            </div>

            <Link to="/employer-help" className="zmp-help-link-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Employer Help Center</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>

          <h1 className="zmp-title">
            India Sales Zones
          </h1>
          <p className="zmp-subtitle">
            MavenJobs serves all of India through 4 dedicated regional zones.
            Select a zone below to explore states and connect directly with the Employer Help Center.
          </p>

          {/* Quick Zone Filter / Jump Pills */}
          <div className="zmp-filter-bar" role="tablist" aria-label="Zone filter">
            <button
              type="button"
              className={`zmp-filter-pill ${activeZone === null ? "active" : ""}`}
              onClick={() => setActiveZone(null)}
            >
              All Zones
            </button>
            {Object.keys(INDIAN_STATES_BY_ZONE).map((zone) => (
              <button
                key={zone}
                type="button"
                className={`zmp-filter-pill ${activeZone === zone ? "active" : ""}`}
                onClick={() => {
                  setActiveZone(zone);
                  const el = document.getElementById(zone.toLowerCase());
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              >
                {zone} Zone
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="zmp-content-wrapper">
        <div className="zmp-grid-layout">
          {/* Left — Map */}
          <div className="zmp-map-column">
            <div className="zmp-map-card">
              <div className="zmp-map-inner">
                <img
                  src={indiaMap}
                  alt="India Sales Zones Map — states labeled"
                  className="zmp-map-img"
                  loading="lazy"
                />
                <p className="zmp-map-caption">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  State names are shown directly on the map
                </p>
              </div>
            </div>
          </div>

          {/* Right — Zone Cards */}
          <div className="zmp-cards-column">
            {Object.entries(INDIAN_STATES_BY_ZONE).map(([zone, states]) => {
              const cfg = ZONE_CONFIG[zone];
              const isActive = activeZone === zone;
              return (
                <div
                  key={zone}
                  id={zone.toLowerCase()}
                  onClick={() => setActiveZone(isActive ? null : zone)}
                  className={`zmp-zone-card ${isActive ? "active" : ""}`}
                  style={{
                    borderColor: isActive ? cfg.color : undefined,
                    boxShadow: isActive ? `0 6px 24px ${cfg.color}26` : undefined,
                  }}
                >
                  {/* Card Header */}
                  <div className="zmp-card-header">
                    {/* Illustration block */}
                    <div
                      className="zmp-illustration-wrapper"
                      style={{ background: cfg.light }}
                    >
                      <div className="zmp-illustration-box">
                        {cfg.illustration}
                      </div>
                    </div>
                    {/* Title block */}
                    <div className="zmp-card-info">
                      <div className="zmp-card-title-row">
                        <div>
                          <div className="zmp-zone-title">
                            {zone} Zone
                          </div>
                          <div className="zmp-zone-meta">
                            {cfg.label} · {states.length} states
                          </div>
                        </div>
                        <div
                          className="zmp-chevron-btn"
                          style={{
                            background: cfg.light,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth="2.5"
                            style={{
                              transform: isActive
                                ? "rotate(180deg)"
                                : "rotate(0)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                      {/* State pills — always visible */}
                      <div className="zmp-states-container">
                        {states.map((s) => (
                          <span
                            key={s}
                            className="zmp-state-pill"
                            style={{
                              color: cfg.color,
                              background: cfg.light,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Support Drawer — connects to Employer Help */}
                  {isActive && (
                    <div
                      className="zmp-help-drawer"
                      style={{
                        borderTop: `1px solid ${cfg.border}`,
                        background: cfg.light,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="zmp-help-drawer-content">
                        <div className="zmp-help-drawer-text">
                          <div className="zmp-help-drawer-title" style={{ color: cfg.color }}>
                            {zone} Zone Support &amp; Hiring Desk
                          </div>
                          <div className="zmp-help-drawer-desc">
                            For dedicated recruiter guidance, state-level assistance, or candidate verification in {cfg.label}, connect directly with the Employer Help Center.
                          </div>
                        </div>
                        <button
                          type="button"
                          className="zmp-help-drawer-btn"
                          style={{ background: cfg.color }}
                          onClick={() => navigate(`/employer-help?region=${zone}#helplines`)}
                        >
                          <span>Visit {zone} Help Desk</span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Employer Help Connection Banner */}
        <div className="zmp-help-banner">
          <div className="zmp-help-banner-content">
            <div className="zmp-help-banner-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#002366" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div className="zmp-help-banner-text">
              <h3 className="zmp-help-banner-title">Need Dedicated Employer Support?</h3>
              <p className="zmp-help-banner-desc">
                Access regional helplines, recruiter documentation, pricing FAQs, and priority escalation on the MavenJobs Employer Help Center.
              </p>
            </div>
          </div>
          <Link to="/employer-help" className="zmp-help-banner-btn">
            Open Help Center
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      <EmployerFooter />
    </div>
  );
}

