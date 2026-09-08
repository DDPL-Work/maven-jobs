import React, { useState } from "react";
import { FiCpu, FiZap, FiStar, FiPenTool, FiChevronDown } from "react-icons/fi";
import { FaMagic } from "react-icons/fa";

export function EnhancePanel({ onOpen }) {
  const [enhancing, setEnhancing] = useState(null);

  const features = [
    {
      key: "ats",
      Icon: FiCpu,
      title: "ATS Score Checker",
      desc: "Analyse your resume against ATS filters and get a compatibility score.",
      iconBg: "#eef2ff",
      iconColor: "#143f86",
    },
    {
      key: "roast",
      Icon: FiZap,
      title: "Roast Mode",
      desc: "Brutally honest AI roasts your resume to motivate real improvement.",
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
    {
      key: "recruiter",
      Icon: FiStar,
      title: "60+ Year Recruiter",
      desc: "A veteran recruiter with 50k+ resumes reviewed judges yours.",
      iconBg: "#fffbeb",
      iconColor: "#d97706",
    },
    {
      key: "grammar",
      Icon: FiPenTool,
      title: "Fix Grammar & Tone",
      desc: "Polish every sentence for clarity, consistency, and professionalism.",
      iconBg: "#fdf2f8",
      iconColor: "#db2777",
    },
  ];

  const run = (key) => {
    setEnhancing(key);
    setTimeout(() => {
      setEnhancing(null);
    }, 300);
    onOpen?.(key);
  };

  return (
    <div
      className="rb-scroll"
      style={{ flex: 1, overflowY: "auto", padding: 16 }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #143f86 0%, #1d55b3 100%)",
          borderRadius: 16,
          padding: "18px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <FaMagic style={{ color: "#d6f33d", fontSize: 13 }} />
          <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
            AI Resume Analysis
          </span>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          Let AI analyze and enhance your resume from every angle.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map(({ key, Icon, title, desc, iconBg, iconColor }) => (
          <button
            key={key}
            className="rb-enhance-row"
            onClick={() => run(key)}
            disabled={enhancing === key}
            style={{
              width: "100%",
              textAlign: "left",
              border: "1.5px solid #e8eef8",
              borderRadius: 14,
              padding: "13px",
              background: "white",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = iconColor;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${iconBg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e8eef8";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {enhancing === key ? (
                <div
                  className="rb-spinner"
                  style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${iconColor}`,
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "rb-spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <Icon style={{ color: iconColor, fontSize: 16 }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0a244d",
                  marginBottom: 2,
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: 11.5, color: "#4c6488", lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
            {enhancing !== key && (
              <FiChevronDown
                style={{
                  color: "#c8d8ea",
                  fontSize: 14,
                  flexShrink: 0,
                  marginTop: 2,
                  transform: "rotate(-90deg)",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
