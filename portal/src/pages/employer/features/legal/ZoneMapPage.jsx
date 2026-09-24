import React, { useState, useEffect } from "react";
import LandingEmployeeHeader from "../../../../components/employer/LandingEmployeeHeader";
import EmployerFooter from "../../../../components/EmployerFooter";
import indiaMap from "../../../../../assets/india-zones-map.jpg";
import { useLocation } from "react-router-dom";

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
    toll: "1800 102 2558",
    contact: "+91 - 9818882211",
    email: "north@mavenjobs.com",
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
    toll: "1800 102 2559",
    contact: "+91 - 9818882212",
    email: "south@mavenjobs.com",
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
    toll: "1800 102 2560",
    contact: "+91 - 9818882213",
    email: "east@mavenjobs.com",
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
    toll: "1800 102 2561",
    contact: "+91 - 9818882214",
    email: "west@mavenjobs.com",
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
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}
    >
      <LandingEmployeeHeader solid />

      {/* Page Header — matches website navy style */}
      <div
        style={{
          background: "#002366",
          padding: "80px 5% 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 99,
              padding: "5px 14px",
              marginBottom: 18,
            }}
          >
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
            <span
              style={{
                color: "#93c5fd",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Sales Territories
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 900,
              color: "#fff",
              margin: "0 0 14px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            India Sales Zones
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 16,
              maxWidth: 520,
              margin: "0",
              lineHeight: 1.7,
            }}
          >
            MavenJobs serves all of India through 4 dedicated regional teams.
            Select a zone below to view its states and get in touch.
          </p>
        </div>
      </div>

      {/* Main Body */}
      <div
        style={{
          flex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          padding: "44px 5% 64px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 430px",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* Left — Map */}
          <div style={{ position: "sticky", top: 80 }}>
            <div
              style={{
                background: "white",
                borderRadius: 16,
                boxShadow: "0 1px 8px rgba(0,35,102,0.08)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 16 }}>
                <img
                  src={indiaMap}
                  alt="India Sales Zones Map — states labeled"
                  style={{ width: "100%", borderRadius: 10, display: "block" }}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    textAlign: "center",
                    margin: "10px 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  State names are shown directly on the map
                </p>
              </div>
            </div>
          </div>

          {/* Right — Zone Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(INDIAN_STATES_BY_ZONE).map(([zone, states]) => {
              const cfg = ZONE_CONFIG[zone];
              const isActive = activeZone === zone;
              return (
                <div
                  key={zone}
                  id={zone.toLowerCase()}
                  onClick={() => setActiveZone(isActive ? null : zone)}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    border: `1.5px solid ${isActive ? cfg.color : "#e2e8f0"}`,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
                    boxShadow: isActive
                      ? `0 6px 28px ${cfg.color}20`
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    transform: isActive ? "translateY(-2px)" : "none",
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{ display: "flex", alignItems: "stretch", gap: 0 }}
                  >
                    {/* Illustration block */}
                    <div
                      style={{
                        width: 110,
                        flexShrink: 0,
                        background: cfg.light,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "14px 12px",
                      }}
                    >
                      <div style={{ width: 86, height: 58 }}>
                        {cfg.illustration}
                      </div>
                    </div>
                    {/* Title block */}
                    <div
                      style={{
                        flex: 1,
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: "#0f172a",
                              fontFamily: "'Bricolage Grotesque', sans-serif",
                              lineHeight: 1.2,
                            }}
                          >
                            {zone} Zone
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              marginTop: 3,
                            }}
                          >
                            {cfg.label} · {states.length} states
                          </div>
                        </div>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: cfg.light,
                            border: `1px solid ${cfg.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
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
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                          marginTop: 10,
                        }}
                      >
                        {states.map((s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: cfg.color,
                              background: cfg.light,
                              border: `1px solid ${cfg.border}`,
                              borderRadius: 99,
                              padding: "2px 9px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Contact — only when active */}
                  {isActive && (
                    <div
                      style={{
                        borderTop: `1px solid ${cfg.border}`,
                        background: cfg.light,
                        padding: "14px 20px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 20,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 3,
                          }}
                        >
                          Toll Free
                        </div>
                        <a
                          href={`tel:${cfg.toll.replace(/\s/g, "")}`}
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            textDecoration: "none",
                          }}
                        >
                          {cfg.toll}
                        </a>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 3,
                          }}
                        >
                          Direct Line
                        </div>
                        <a
                          href={`tel:${cfg.contact.replace(/\s/g, "")}`}
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            textDecoration: "none",
                          }}
                        >
                          {cfg.contact}
                        </a>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 3,
                          }}
                        >
                          Email
                        </div>
                        <a
                          href={`mailto:${cfg.email}`}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: cfg.color,
                            textDecoration: "none",
                          }}
                        >
                          {cfg.email}
                        </a>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <a
                          href={`mailto:${cfg.email}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: cfg.color,
                            color: "white",
                            borderRadius: 99,
                            padding: "7px 16px",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Contact
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EmployerFooter />
    </div>
  );
}
