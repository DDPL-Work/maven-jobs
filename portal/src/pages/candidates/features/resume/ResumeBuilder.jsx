// ResumeBuilder.jsx
// Drop-in replacement Ã¢â‚¬â€ requires Tailwind CSS configured in your project
// Uses Google Fonts via a style tag injection (works in all setups)

import React, { useState, useRef, useEffect } from "react";
import {
  FiEdit3,
  FiLayout,
  FiSliders,
  FiZap,
  FiDownload,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiUser,
  FiGlobe,
  FiBriefcase,
  FiBook,
  FiCode,
  FiAward,
  FiMoreVertical,
  FiEye,
  FiPenTool,
  FiCpu,
  FiStar,
  FiSearch,
  FiLoader,
  FiLink,
  FiUpload,
  FiMenu,
} from "react-icons/fi";
import { FaCrown, FaMagic } from "react-icons/fa";
import { useAuth } from "../../../../AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TEMPLATES,
  getTemplate,
  isProTemplate,
  TemplateCardPreview,
} from "./ResumeTemplates";
import resumeService from "../../../../services/resumeService";
import paymentService from "../../../../services/paymentService";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import { usePdfExport } from "../../../../utils/usePdfExport";
import LandingFooter from "../../../../components/LandingFooter";

/*
   CSS injected into <head> Ã¢â‚¬â€ avoids Tailwind purge issues
   for animations, scrollbars, and print styles
 */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Roboto:wght@400;500;700;900&family=Playfair+Display:wght@400;500;600;700;800&display=swap');

  .rb-root, .rb-root * { box-sizing: border-box; }

  /* Hide scrollbar but keep functionality */
  .rb-scroll::-webkit-scrollbar { width: 4px; }
  .rb-scroll::-webkit-scrollbar-track { background: transparent; }
  .rb-scroll::-webkit-scrollbar-thumb { background: #dde6f8; border-radius: 99px; }
  .rb-scroll::-webkit-scrollbar-thumb:hover { background: #143f86; }
  .rb-scroll { scrollbar-width: thin; scrollbar-color: #dde6f8 transparent; }

  /* Animations */
  @keyframes rb-slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rb-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rb-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes rb-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes rb-dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.5); opacity: 0.6; }
  }

  .rb-slide-down  { animation: rb-slideDown 0.2s cubic-bezier(0.4,0,0.2,1) both; }
  .rb-fade-in     { animation: rb-fadeIn 0.25s ease both; }
  .rb-spinner     { animation: rb-spin 0.7s linear infinite; }
  .rb-dot-pulse   { animation: rb-dotPulse 2s ease-in-out infinite; }

  .rb-shimmer-badge {
    background: linear-gradient(90deg, #d6f33d 0%, #b8e020 40%, #d6f33d 100%);
    background-size: 300% auto;
    animation: rb-shimmer 2.5s linear infinite;
  }

  /* Tab hover */
  .rb-tab:hover:not(.rb-tab-active) { background: rgba(20,63,134,0.06); }

  /* Section rows */
  .rb-section-row:hover { background: #f7f9ff; }

  /* Card hover */
  .rb-card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .rb-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(20,63,134,0.12); border-color: rgba(20,63,134,0.2); }

  /* Input focus */
  .rb-input:focus { border-color: #143f86 !important; box-shadow: 0 0 0 3px rgba(20,63,134,0.1) !important; outline: none; }

  /* Template card */
  .rb-tpl-card { transition: transform 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
  .rb-tpl-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(20,63,134,0.1); }

  /* Enhance card */
  .rb-enhance-row { transition: background 0.15s ease, border-color 0.15s ease; cursor: pointer; }
  .rb-enhance-row:hover { background: #f7f9ff; border-color: rgba(20,63,134,0.18); }

  /* Color swatch */
  .rb-swatch { transition: transform 0.15s ease; cursor: pointer; }
  .rb-swatch:hover { transform: scale(1.15); }

  /* Skill tag */
  .rb-skill-tag { transition: background 0.15s ease; }
  .rb-skill-tag:hover { background: #e0e8f8; }

  /* CTA button */
  .rb-cta-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .rb-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(20,63,134,0.28); }

  /* Print — enterprise-grade isolation: only #resume-print content is visible */
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden !important; }
    #resume-print, #resume-print * { visibility: visible !important; }
    #resume-print {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      z-index: 99999 !important;
    }
    .rb-print-page {
      width: 210mm !important;
      height: 297mm !important;
      overflow: hidden !important;
      page-break-after: always !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
    .rb-print-page:last-child { page-break-after: avoid !important; }
    @page { size: A4 portrait; margin: 0 !important; }
  }

  /* Hide mobile elements on desktop */
  .rb-mobile-sidebar, .rb-mobile-overlay {
    display: none !important;
  }

  /* --- Mobile Responsive layout --- */
  @media (max-width: 768px) {
    .rb-desktop-header {
      display: none !important;
    }
    .rb-desktop-sidebar {
      display: none !important;
    }
    
    .rb-mobile-header {
      display: flex !important;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .rb-mobile-bottom-nav {
      display: flex !important;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: white;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      border-top: 1px solid #e8eef8;
    }
    
    .rb-root {
      padding-bottom: 60px !important; /* Make room for bottom nav */
    }
    
    .rb-mobile-sidebar {
      display: flex !important;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      background: white;
      z-index: 1001;
      box-shadow: -4px 0 15px rgba(0,0,0,0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    
    .rb-mobile-sidebar.open {
      transform: translateX(0);
    }
    
    .rb-mobile-overlay {
      display: block !important;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    
    .rb-mobile-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    
    .rb-main-content {
      flex-direction: column !important;
    }
    
    /* Ensure the visible pane takes full width and height */
    .rb-editor-pane, .rb-preview-pane {
      width: 100% !important;
      flex: 1 !important;
      max-width: none !important;
      border: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    
    .rb-editor-pane.hidden-on-mobile,
    .rb-preview-pane.hidden-on-mobile {
      display: none !important;
    }
  }
`;

/* 
   Data*/
const INITIAL_RESUME = {
  name: "Pranjal Kundliya",
  title: "Fullstack Web Developer",
  phone: "+91-8126977256",
  email: "rohankundliyal@gmail.com",
  location: "Dehradun, INDIA",
  experience_label: "0 Year of experience",
  photo: "",
  github: "",
  linkedin: "",
  mavenjobs: "",
  website: "",
  summary:
    "Software Developer skilled in front-end and actively growing in back-end development, specializing in React, JavaScript, Node.js, and modern web technologies. I focused on building fast, scalable, and user-centric applications while contributing effectively in dynamic, growth-driven tech environments.",
  workExperience: [
    {
      id: 1,
      role: "Fullstack Web Developer",
      company: "Unified Mentor",
      start: "Jun 2025",
      end: "Sep 2025",
      desc: "Enhanced my skills in frontend technologies and also explored indepth knowledge about backend technologies.",
    },
  ],
  projects: [
    {
      id: 1,
      name: "Web Development",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Learning more about Web Development technologies and **executing projects** which helped me grow outside my own environment.",
    },
    {
      id: 2,
      name: "Wanderer Wise – Your Travelling Companion",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Gained valuable experience in **real-world software development**—from building clean, responsive UIs to integrating AI for smart recommendations.",
    },
    {
      id: 3,
      name: "Machine Learning with Python",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Developed skills about **Machine Learning** using Python language.",
    },
  ],
  internships: [
    {
      id: 1,
      company: "Cognitive Classes",
      duration: "31 Days",
      role: "AI Intern",
    },
  ],
  education: [
    {
      id: 1,
      degree: "B.Tech/B.E. | Computers",
      institution: "Graphic Era University, Dehradun",
      year: "2025",
      grade: "7.4/10",
    },
    {
      id: 2,
      degree: "12th (CBSE)",
      institution: "English Medium",
      year: "2020",
      grade: "",
    },
  ],
  skills: [
    "UI/UX",
    "Redux",
    "NoSQL",
    "Figma",
    "MongoDB",
    "Alpha Testing",
    "API",
    "Express",
    "MERN Stack",
    "Node.js",
    "Front End Engineer",
    "JavaScript",
    "React.js",
  ],
  languages: ["English", "Hindi"],
  certifications: [],
  hobbies: [],
  extraCurricular: [],
  customSections: [],
};

const FONTS = [
  "DM Sans",
  "Georgia",
  "Roboto",
  "Playfair Display",
  "Courier New",
];
const FONT_SIZES = ["Small", "Medium", "Large"];
const SPACINGS = ["Compact", "Medium", "Comfortable"];
const THEME_COLORS = [
  "#143f86",
  "#1e40af",
  "#0d9488",
  "#16a34a",
  "#a0845c",
  "#7c3aed",
  "#475569",
];

const TABS = [
  { id: "editor", label: "AI editor", Icon: FiEdit3 },
  { id: "templates", label: "Templates", Icon: FiLayout },
  { id: "formatting", label: "Formatting", Icon: FiSliders },
  { id: "enhance", label: "Enhance with AI", Icon: FiZap },
];

/* 
   Tiny shared primitives*/
function RBInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#4c6488",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rb-input"
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          color: "#0a244d",
          border: "1.5px solid #dde6f8",
          borderRadius: 10,
          background: "white",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function RBTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  const taRef = useRef(null);
  const wrapBold = () => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.substring(start, end);
    if (!sel) return;
    const wrapped = "**" + sel + "**";
    const newVal = value.substring(0, start) + wrapped + value.substring(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + 2, start + 2 + sel.length);
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {label && (
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#4c6488",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {label}
          </label>
        )}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            onClick={wrapBold}
            title="Bold (** text **)"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #dde6f8",
              borderRadius: 6,
              background: "white",
              cursor: "pointer",
              color: "#0a244d",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <b>B</b>
          </button>
        </div>
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rb-input"
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          color: "#0a244d",
          border: "1.5px solid #dde6f8",
          borderRadius: 10,
          background: "white",
          resize: "none",
          lineHeight: 1.6,
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function RBAccordion({ title, Icon, ai, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #eef2fb" }}>
      <button
        onClick={() => setOpen(!open)}
        className="rb-section-row"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon && (
            <Icon style={{ color: "#143f86", fontSize: 15, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0a244d" }}>
            {title}
          </span>
          {ai && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#7c3aed",
                background: "#f5f3ff",
                border: "1px solid #e0d9fc",
                padding: "2px 7px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <FaMagic style={{ fontSize: 8 }} /> AI-powered
            </span>
          )}
        </span>
        {open ? (
          <FiChevronUp
            style={{ color: "#8ca2c0", fontSize: 16, flexShrink: 0 }}
          />
        ) : (
          <FiChevronDown
            style={{ color: "#8ca2c0", fontSize: 16, flexShrink: 0 }}
          />
        )}
      </button>
      {open && (
        <div className="rb-slide-down" style={{ padding: "4px 20px 18px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RBCard({ children }) {
  return (
    <div
      style={{
        border: "1.5px solid #dde6f8",
        borderRadius: 12,
        padding: "14px 14px 14px 14px",
        background: "#fafbff",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

function RBAddBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        border: "1.5px dashed #c8d8ea",
        borderRadius: 10,
        background: "none",
        color: "#8ca2c0",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#143f86";
        e.currentTarget.style.color = "#143f86";
        e.currentTarget.style.background = "#f0f5ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#c8d8ea";
        e.currentTarget.style.color = "#8ca2c0";
        e.currentTarget.style.background = "none";
      }}
    >
      <FiPlus style={{ fontSize: 13 }} /> {label}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#c8d8ea",
        padding: 4,
        borderRadius: 6,
        transition: "color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#ef4444";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#c8d8ea";
      }}
    >
      <FiTrash2 style={{ fontSize: 14 }} />
    </button>
  );
}

/* 
   Skills Modal*/
function SkillsModal({ open, existing, onSave, onClose }) {
  const [input, setInput] = useState("");
  const [list, setList] = useState([...existing]);
  useEffect(() => {
    if (open) setList([...existing]);
  }, [open, existing]);
  const add = () => {
    const val = input.trim();
    if (val && !list.includes(val)) {
      setList([...list, val]);
      setInput("");
    }
  };
  const remove = (s) => setList(list.filter((x) => x !== s));
  if (!open) return null;
  return (
    <div
      className="rb-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0a244d",
              margin: 0,
            }}
          >
            Add Skills
          </p>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8ca2c0",
              padding: 4,
              display: "flex",
            }}
          >
            <FiX style={{ fontSize: 18 }} />
          </button>
        </div>
        <div style={{ padding: "14px 24px", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Type a skill and press Enter..."
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1.5px solid #dde6f8",
              borderRadius: 10,
              fontSize: 13,
              color: "#0a244d",
              outline: "none",
            }}
          />
          <button
            onClick={add}
            style={{
              padding: "10px 18px",
              background: "#143f86",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Add
          </button>
        </div>
        <div
          style={{
            padding: "0 24px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {list.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: "#8ca2c0",
                width: "100%",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No skills added yet. Type above to add.
            </p>
          )}
          {list.map((s) => (
            <span
              key={s}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#eef2ff",
                border: "1px solid #dde6f8",
                color: "#143f86",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 999,
              }}
            >
              {s}
              <button
                onClick={() => remove(s)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#8ca2c0",
                  display: "flex",
                  fontSize: 11,
                }}
              >
                <FiX />
              </button>
            </span>
          ))}
        </div>
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid #eef2fb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              background: "none",
              border: "1.5px solid #dde6f8",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: "#4c6488",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(list);
              onClose();
            }}
            style={{
              padding: "9px 24px",
              background: "#143f86",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save Skills
          </button>
        </div>
      </div>
    </div>
  );
}

/* 
   LEFT PANEL Ã¢â‚¬â€ AI Editor*/
function EditorPanel({ resume, setResume }) {
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const set = (key, val) => setResume((r) => ({ ...r, [key]: val }));

  const updateArr = (key, id, field, val) =>
    setResume((r) => ({
      ...r,
      [key]: r[key].map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    }));
  const addItem = (key, blank) =>
    setResume((r) => ({
      ...r,
      [key]: [...r[key], { id: Date.now(), ...blank }],
    }));
  const removeItem = (key, id) =>
    setResume((r) => ({ ...r, [key]: r[key].filter((i) => i.id !== id) }));

  const photoRef = useRef(null);
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photo", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="rb-scroll" style={{ flex: 1, overflowY: "auto" }}>
      {/* Personal details Ã¢â‚¬â€ always open */}
      <RBAccordion title="Personal details" Icon={FiUser} defaultOpen>
        {/* Photo upload */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 4,
          }}
        >
          <div
            onClick={() => photoRef.current?.click()}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              border: "2px dashed #dde6f8",
              cursor: "pointer",
              flexShrink: 0,
              background: "#f7f9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {resume.photo ? (
              <img
                src={resume.photo}
                alt="photo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <FiUser style={{ color: "#c8d8ea", fontSize: 22 }} />
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: "none" }}
            />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0a244d" }}>
              Profile photo
            </p>
            <p style={{ fontSize: 11, color: "#8ca2c0", marginTop: 2 }}>
              Click to upload Ã‚Â· PNG, JPG
            </p>
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <RBInput
            label="Full name"
            value={resume.name}
            onChange={(v) => set("name", v)}
            placeholder="Your full name"
          />
          <RBInput
            label="Job title"
            value={resume.title}
            onChange={(v) => set("title", v)}
            placeholder="e.g. Fullstack Developer"
          />
          <RBInput
            label="Phone"
            value={resume.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+91 XXXXX XXXXX"
          />
          <RBInput
            label="Email"
            type="email"
            value={resume.email}
            onChange={(v) => set("email", v)}
            placeholder="you@email.com"
          />
          <RBInput
            label="Location"
            value={resume.location}
            onChange={(v) => set("location", v)}
            placeholder="City, Country"
          />
          <RBInput
            label="Experience"
            value={resume.experience_label}
            onChange={(v) => set("experience_label", v)}
            placeholder="e.g. 2 years"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#4c6488",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Links (optional)
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <RBInput
              label="Website / Portfolio"
              value={resume.website}
              onChange={(v) => set("website", v)}
              placeholder="https://yourwebsite.com"
            />
            <RBInput
              label="GitHub"
              value={resume.github}
              onChange={(v) => set("github", v)}
              placeholder="https://github.com/username"
            />
            <RBInput
              label="LinkedIn"
              value={resume.linkedin}
              onChange={(v) => set("linkedin", v)}
              placeholder="https://linkedin.com/in/username"
            />
            <RBInput
              label="MavenJobs"
              value={resume.mavenjobs}
              onChange={(v) => set("mavenjobs", v)}
              placeholder="https://mavenjobs.com/profile"
            />
          </div>
        </div>
      </RBAccordion>

      {/* Profile summary */}
      <RBAccordion title="Profile summary" Icon={FiUser} ai>
        <RBTextarea
          label="Summary"
          value={resume.summary}
          onChange={(v) => set("summary", v)}
          placeholder="Write a compelling professional summary..."
          rows={4}
        />
        <button
          onClick={() =>
            set(
              "summary",
              "Passionate MERN stack developer with hands-on experience building scalable, production-grade applications. Skilled in React.js, Node.js, Express and MongoDB, with a strong eye for UI/UX and clean code architecture.",
            )
          }
          style={{
            width: "100%",
            padding: "9px",
            border: "1.5px dashed rgba(124,58,237,0.3)",
            borderRadius: 10,
            background: "#fdf9ff",
            color: "#7c3aed",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <FaMagic style={{ fontSize: 10 }} /> Generate with AI
        </button>
      </RBAccordion>

      {/* Education */}
      <RBAccordion title="Education" Icon={FiBook}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.education.map((edu) => (
            <RBCard key={edu.id}>
              <RemoveBtn onClick={() => removeItem("education", edu.id)} />
              <RBInput
                label="Degree / Course"
                value={edu.degree}
                onChange={(v) => updateArr("education", edu.id, "degree", v)}
                placeholder="e.g. B.Tech Computers"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Institution"
                  value={edu.institution}
                  onChange={(v) =>
                    updateArr("education", edu.id, "institution", v)
                  }
                  placeholder="University name"
                />
                <RBInput
                  label="Year"
                  value={edu.year}
                  onChange={(v) => updateArr("education", edu.id, "year", v)}
                  placeholder="2025"
                />
              </div>
              <RBInput
                label="Grade / CGPA"
                value={edu.grade}
                onChange={(v) => updateArr("education", edu.id, "grade", v)}
                placeholder="e.g. 8.5/10"
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add education"
            onClick={() =>
              addItem("education", {
                degree: "",
                institution: "",
                year: "",
                grade: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Work experience */}
      <RBAccordion title="Work experience" Icon={FiBriefcase} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.workExperience.map((exp) => (
            <RBCard key={exp.id}>
              <RemoveBtn onClick={() => removeItem("workExperience", exp.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Job title"
                  value={exp.role}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "role", v)
                  }
                  placeholder="e.g. Frontend Developer"
                />
                <RBInput
                  label="Company"
                  value={exp.company}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "company", v)
                  }
                  placeholder="Company name"
                />
                <RBInput
                  label="Start date"
                  value={exp.start}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "start", v)
                  }
                  placeholder="Jan 2024"
                />
                <RBInput
                  label="End date"
                  value={exp.end}
                  onChange={(v) =>
                    updateArr("workExperience", exp.id, "end", v)
                  }
                  placeholder="Present"
                />
              </div>
              <RBTextarea
                label="Description"
                value={exp.desc}
                onChange={(v) => updateArr("workExperience", exp.id, "desc", v)}
                placeholder="Describe your role and achievements..."
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add work experience"
            onClick={() =>
              addItem("workExperience", {
                role: "",
                company: "",
                start: "",
                end: "",
                desc: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Key skills */}
      <RBAccordion title="Key skills" Icon={FiCode}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {resume.skills.map((skill) => (
            <span
              key={skill}
              className="rb-skill-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#eef2ff",
                border: "1px solid #dde6f8",
                color: "#143f86",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: 999,
              }}
            >
              {skill}
              <button
                onClick={() =>
                  set(
                    "skills",
                    resume.skills.filter((s) => s !== skill),
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#8ca2c0",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#8ca2c0";
                }}
              >
                <FiX style={{ fontSize: 11 }} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setShowSkillsModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1.5px dashed #c8d8ea",
              borderRadius: 999,
              background: "none",
              color: "#8ca2c0",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            <FiPlus style={{ fontSize: 11 }} /> Add skill
          </button>
        </div>
        <SkillsModal
          open={showSkillsModal}
          existing={resume.skills}
          onSave={(list) => set("skills", list)}
          onClose={() => setShowSkillsModal(false)}
        />
      </RBAccordion>

      {/* Projects */}
      <RBAccordion title="Projects" Icon={FiStar} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.projects.map((proj) => (
            <RBCard key={proj.id}>
              <RemoveBtn onClick={() => removeItem("projects", proj.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Project name"
                  value={proj.name}
                  onChange={(v) => updateArr("projects", proj.id, "name", v)}
                  placeholder="Project title"
                />
                <RBInput
                  label="Link (optional)"
                  value={proj.link}
                  onChange={(v) => updateArr("projects", proj.id, "link", v)}
                  placeholder="https://github.com/..."
                />
                <RBInput
                  label="Duration"
                  value={proj.duration}
                  onChange={(v) =>
                    updateArr("projects", proj.id, "duration", v)
                  }
                  placeholder="e.g. 40 Days"
                />
                <RBInput
                  label="Year"
                  value={proj.year}
                  onChange={(v) => updateArr("projects", proj.id, "year", v)}
                  placeholder="e.g. 2026"
                />
              </div>
              <RBTextarea
                label="Description (one bullet per line, **bold** with **)"
                value={proj.desc}
                onChange={(v) => updateArr("projects", proj.id, "desc", v)}
                placeholder={
                  "• Built the core React component library\n• Integrated REST APIs with Express\n• Deployed on AWS with CI/CD pipeline"
                }
                rows={4}
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add project"
            onClick={() =>
              addItem("projects", {
                name: "",
                duration: "",
                year: "",
                link: "",
                desc: "",
              })
            }
          />
        </div>
      </RBAccordion>

      {/* Internships */}
      <RBAccordion title="Internships" Icon={FiBriefcase} ai>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {resume.internships.map((i) => (
            <RBCard key={i.id}>
              <RemoveBtn onClick={() => removeItem("internships", i.id)} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <RBInput
                  label="Company"
                  value={i.company}
                  onChange={(v) => updateArr("internships", i.id, "company", v)}
                  placeholder="Company name"
                />
                <RBInput
                  label="Duration"
                  value={i.duration}
                  onChange={(v) =>
                    updateArr("internships", i.id, "duration", v)
                  }
                  placeholder="e.g. 3 months"
                />
              </div>
              <RBInput
                label="Role"
                value={i.role}
                onChange={(v) => updateArr("internships", i.id, "role", v)}
                placeholder="e.g. Frontend Intern"
              />
            </RBCard>
          ))}
          <RBAddBtn
            label="Add internship"
            onClick={() =>
              addItem("internships", { company: "", duration: "", role: "" })
            }
          />
        </div>
      </RBAccordion>

      {/* Certifications */}
      <RBAccordion title="Certifications" Icon={FiAward}>
        {resume.certifications.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "#8ca2c0",
              textAlign: "center",
              padding: "6px 0",
            }}
          >
            No certifications added yet.
          </p>
        )}
        <RBAddBtn
          label="Add certification"
          onClick={() =>
            addItem("certifications", { name: "", issuer: "", year: "" })
          }
        />
      </RBAccordion>

      {/* Languages */}
      <RBAccordion title="Languages" Icon={FiGlobe}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {resume.languages.map((lang) => (
            <span
              key={lang}
              className="rb-skill-tag"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f7f9ff",
                border: "1px solid #dde6f8",
                color: "#3e587a",
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 999,
              }}
            >
              {lang}
              <button
                onClick={() =>
                  set(
                    "languages",
                    resume.languages.filter((l) => l !== lang),
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#c8d8ea",
                  display: "flex",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#c8d8ea";
                }}
              >
                <FiX style={{ fontSize: 11 }} />
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              const l = window.prompt("Add a language:");
              if (l?.trim()) set("languages", [...resume.languages, l.trim()]);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1.5px dashed #c8d8ea",
              borderRadius: 999,
              background: "none",
              color: "#8ca2c0",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            <FiPlus style={{ fontSize: 11 }} /> Add language
          </button>
        </div>
      </RBAccordion>

      {/* Add sections — buttons first, then dynamic sections appear below */}
      <div style={{ padding: "16px 20px 20px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#4c6488",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Add sections
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            onClick={() => {
              setResume((r) => ({
                ...r,
                customSections: [
                  ...r.customSections,
                  { title: "New Section", items: [] },
                ],
              }));
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Custom section
          </button>
          <button
            onClick={() => {
              const h = window.prompt("Add a hobby:");
              if (h?.trim()) set("hobbies", [...resume.hobbies, h.trim()]);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Hobbies
          </button>
          <button
            onClick={() => {
              setResume((r) => ({
                ...r,
                extraCurricular: [
                  ...r.extraCurricular,
                  { id: Date.now(), title: "", desc: "" },
                ],
              }));
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid #dde6f8",
              borderRadius: 999,
              background: "white",
              color: "#4c6488",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#dde6f8";
              e.currentTarget.style.color = "#4c6488";
            }}
          >
            <FiPlus style={{ fontSize: 10 }} /> Extra-curricular activities
          </button>
        </div>
      </div>

      {/* Hobbies — dynamic, appears below the Add sections buttons */}
      {resume.hobbies.length > 0 && (
        <RBAccordion title="Hobbies" Icon={FiStar}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {resume.hobbies.map((h) => (
              <span
                key={h}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#eef2ff",
                  border: "1px solid #dde6f8",
                  color: "#143f86",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 999,
                }}
              >
                {h}
                <button
                  onClick={() =>
                    set(
                      "hobbies",
                      resume.hobbies.filter((x) => x !== h),
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#8ca2c0",
                    display: "flex",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8ca2c0";
                  }}
                >
                  <FiX style={{ fontSize: 11 }} />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                const h = window.prompt("Add a hobby:");
                if (h?.trim()) set("hobbies", [...resume.hobbies, h.trim()]);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                border: "1.5px dashed #c8d8ea",
                borderRadius: 999,
                background: "none",
                color: "#8ca2c0",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 12px",
                cursor: "pointer",
              }}
            >
              <FiPlus style={{ fontSize: 11 }} /> Add hobby
            </button>
          </div>
        </RBAccordion>
      )}

      {/* Extra-curricular — dynamic, appears below the Add sections buttons */}
      {resume.extraCurricular.length > 0 && (
        <RBAccordion title="Extra-curricular" Icon={FiAward}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resume.extraCurricular.map((act) => (
              <RBCard key={act.id}>
                <RemoveBtn
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.filter(
                        (x) => x.id !== act.id,
                      ),
                    }))
                  }
                />
                <RBInput
                  label="Activity"
                  value={act.title}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.map((x) =>
                        x.id === act.id ? { ...x, title: v } : x,
                      ),
                    }))
                  }
                  placeholder="e.g. Debate Club Captain"
                />
                <RBInput
                  label="Description (optional)"
                  value={act.desc || ""}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      extraCurricular: r.extraCurricular.map((x) =>
                        x.id === act.id ? { ...x, desc: v } : x,
                      ),
                    }))
                  }
                  placeholder="Brief description of the activity"
                />
              </RBCard>
            ))}
            <RBAddBtn
              label="Add activity"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  extraCurricular: [
                    ...r.extraCurricular,
                    { id: Date.now(), title: "", desc: "" },
                  ],
                }))
              }
            />
          </div>
        </RBAccordion>
      )}

      {/* Custom sections — dynamic, appears below the Add sections buttons */}
      {resume.customSections.length > 0 && (
        <RBAccordion title="Custom sections" Icon={FiBook}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resume.customSections.map((cs, ci) => (
              <RBCard key={ci}>
                <RemoveBtn
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      customSections: r.customSections.filter(
                        (_, i) => i !== ci,
                      ),
                    }))
                  }
                />
                <RBInput
                  label="Section title"
                  value={cs.title}
                  onChange={(v) =>
                    setResume((r) => ({
                      ...r,
                      customSections: r.customSections.map((x, i) =>
                        i === ci ? { ...x, title: v } : x,
                      ),
                    }))
                  }
                  placeholder="e.g. Certifications"
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4c6488",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      margin: 0,
                    }}
                  >
                    Items
                  </p>
                  {cs.items?.map((item, ii) => (
                    <div
                      key={ii}
                      style={{
                        border: "1px solid #e8eef8",
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: "#f7f9ff",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            customSections: r.customSections.map((x, i) =>
                              i === ci
                                ? {
                                    ...x,
                                    items: x.items.filter((_, j) => j !== ii),
                                  }
                                : x,
                            ),
                          }))
                        }
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#c8d8ea",
                          padding: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#c8d8ea";
                        }}
                      >
                        <FiX style={{ fontSize: 12 }} />
                      </button>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <input
                          value={item.title || ""}
                          onChange={(e) =>
                            setResume((r) => ({
                              ...r,
                              customSections: r.customSections.map((x, i) =>
                                i === ci
                                  ? {
                                      ...x,
                                      items: x.items.map((y, j) =>
                                        j === ii
                                          ? { ...y, title: e.target.value }
                                          : y,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Item title"
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            border: "1px solid #dde6f8",
                            borderRadius: 8,
                            background: "white",
                          }}
                        />
                        <input
                          value={item.desc || ""}
                          onChange={(e) =>
                            setResume((r) => ({
                              ...r,
                              customSections: r.customSections.map((x, i) =>
                                i === ci
                                  ? {
                                      ...x,
                                      items: x.items.map((y, j) =>
                                        j === ii
                                          ? { ...y, desc: e.target.value }
                                          : y,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                          placeholder="Description"
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            border: "1px solid #dde6f8",
                            borderRadius: 8,
                            background: "white",
                          }}
                        />
                      </div>
                      <RBTextarea
                        label="Bullet points (one per line)"
                        value={(item.bullets || []).join("\n")}
                        onChange={(v) =>
                          setResume((r) => ({
                            ...r,
                            customSections: r.customSections.map((x, i) =>
                              i === ci
                                ? {
                                    ...x,
                                    items: x.items.map((y, j) =>
                                      j === ii
                                        ? { ...y, bullets: v.split("\n") }
                                        : y,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                        placeholder={
                          "• Achievement or detail\n• Another bullet point"
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                  <RBAddBtn
                    label="Add item"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        customSections: r.customSections.map((x, i) =>
                          i === ci
                            ? {
                                ...x,
                                items: [
                                  ...(x.items || []),
                                  { title: "", desc: "", bullets: [] },
                                ],
                              }
                            : x,
                        ),
                      }))
                    }
                  />
                </div>
              </RBCard>
            ))}
            <RBAddBtn
              label="Add custom section"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  customSections: [
                    ...r.customSections,
                    { title: "New Section", items: [] },
                  ],
                }))
              }
            />
          </div>
        </RBAccordion>
      )}
    </div>
  );
}

/* 
   LEFT PANEL Ã¢â‚¬â€ Templates*/
function TemplatesPanel({ selectedTemplate, setSelectedTemplate }) {
  const [filter, setFilter] = useState("All");
  const shown =
    filter === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.tag === filter);

  return (
    <div
      className="rb-scroll"
      style={{ flex: 1, overflowY: "auto", padding: 16 }}
    >
      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["All", "Free", "PRO"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              border: filter === f ? "none" : "1.5px solid #dde6f8",
              background: filter === f ? "#143f86" : "white",
              color: filter === f ? "white" : "#4c6488",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow:
                filter === f ? "0 2px 8px rgba(20,63,134,0.18)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {shown.map((tpl) => {
          const active = selectedTemplate === tpl.id;
          return (
            <div
              key={tpl.id}
              className="rb-tpl-card"
              onClick={() => setSelectedTemplate(tpl.id)}
              style={{
                border: `2px solid ${active ? "#143f86" : "#e8eef8"}`,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: active ? "0 0 0 3px rgba(20,63,134,0.12)" : "none",
              }}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "3/4",
                  background: "#f0f4fb",
                }}
              >
                <TemplateCardPreview
                  accent={tpl.accent}
                  name={tpl.name}
                  tag={tpl.tag}
                  isDark={tpl.isDark}
                />
                {/* Tag */}
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: tpl.tag === "PRO" ? "#fff7ed" : "#f0fdf4",
                    color: tpl.tag === "PRO" ? "#ea580c" : "#16a34a",
                    border: `1px solid ${tpl.tag === "PRO" ? "#fed7aa" : "#bbf7d0"}`,
                  }}
                >
                  {tpl.tag}
                </span>
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#143f86",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(20,63,134,0.3)",
                    }}
                  >
                    <FiCheck
                      style={{ color: "white", fontSize: 11, strokeWidth: 3 }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  background: "white",
                  borderTop: "1px solid #e8eef8",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0a244d",
                    marginBottom: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tpl.name}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(tpl.id);
                  }}
                  onMouseEnter={(e) => {
                    if (tpl.tag === "PRO") {
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(245,158,11,0.35)";
                    } else {
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(214,243,61,0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      tpl.tag === "PRO"
                        ? "0 2px 8px rgba(245,158,11,0.2)"
                        : "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 0",
                    borderRadius: 10,
                    border: "none",
                    background:
                      tpl.tag === "PRO"
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                        : "#d6f33d",
                    color: tpl.tag === "PRO" ? "#fff" : "#143f86",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      tpl.tag === "PRO"
                        ? "0 2px 8px rgba(245,158,11,0.2)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {tpl.tag === "PRO" ? (
                    <>
                      <FaCrown size={11} style={{ marginRight: 5 }} /> Unlock
                      with Pro
                    </>
                  ) : (
                    "Choose template"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 
   LEFT PANEL Ã¢â‚¬â€ Formatting*/
function FormattingPanel({ formatting, setFormatting }) {
  const set = (key, val) => setFormatting((f) => ({ ...f, [key]: val }));

  const SelectField = ({ label, value, onChange, options }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#0a244d" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rb-input"
          style={{
            width: "100%",
            padding: "11px 38px 11px 14px",
            fontSize: 13,
            color: "#0a244d",
            border: "1.5px solid #dde6f8",
            borderRadius: 10,
            background: "white",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <FiChevronDown
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8ca2c0",
            pointerEvents: "none",
            fontSize: 15,
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="rb-scroll"
      style={{ flex: 1, overflowY: "auto", padding: "20px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <SelectField
          label="Section spacing"
          value={formatting.spacing}
          onChange={(v) => set("spacing", v)}
          options={SPACINGS}
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <SelectField
            label="Font family"
            value={formatting.font}
            onChange={(v) => set("font", v)}
            options={FONTS}
          />
          <SelectField
            label="Font size"
            value={formatting.fontSize}
            onChange={(v) => set("fontSize", v)}
            options={FONT_SIZES}
          />
        </div>

        {/* Accent colour */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0a244d",
              display: "block",
              marginBottom: 12,
            }}
          >
            Accent colour
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {THEME_COLORS.map((color) => {
              const active = formatting.accentColor === color;
              return (
                <button
                  key={color}
                  className="rb-swatch"
                  onClick={() => set("accentColor", color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: color,
                    cursor: "pointer",
                    outline: active ? `3px solid ${color}` : "none",
                    outlineOffset: 2,
                    boxShadow: active
                      ? `0 0 0 2px white, 0 0 0 4px ${color}`
                      : "0 2px 6px rgba(0,0,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <FiCheck
                      style={{ color: "white", fontSize: 14, strokeWidth: 3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() =>
              setFormatting({
                spacing: "Medium",
                font: "DM Sans",
                fontSize: "Medium",
                accentColor: "#143f86",
              })
            }
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "11px",
              border: "1.5px solid #dde6f8",
              borderRadius: 10,
              background: "white",
              color: "#4c6488",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <FiRefreshCw style={{ fontSize: 13 }} /> Reset
          </button>
          <button
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "11px",
              border: "none",
              borderRadius: 10,
              background: "#143f86",
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(20,63,134,0.22)",
            }}
          >
            <FiCheck style={{ fontSize: 13 }} /> Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* 
   LEFT PANEL Ã¢â‚¬â€ Enhance with AI*/
function EnhancePanel({ onOpen }) {
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

/* 
   TEMPLATE PREVIEW Ã¢â‚¬â€ delegates to selected template*/
function TemplatePreview({ resume, formatting, selectedTemplate }) {
  const tpl = getTemplate(selectedTemplate);
  const Comp = tpl?.component;
  if (!Comp) return null;
  return <Comp resume={resume} formatting={formatting} />;
}

/* 
   PRO UPSELL MODAL Ã¢â‚¬â€ Swiss-style premium alert*/
function PROUpsellModal({ templateName, onClose, onUpgrade }) {
  return (
    <div
      className="rb-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Thin accent bar */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, #000, #333)",
          }}
        />

        <div style={{ padding: "24px 24px 20px", textAlign: "center" }}>
          {/* Icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <FaCrown style={{ color: "#facc15", fontSize: 24 }} />
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#000",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            Premium Template
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "0 0 16px",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: "#000", fontWeight: 700 }}>
              "{templateName}"
            </strong>{" "}
            is a PRO feature. Upgrade to unlock this template, all AI
            enhancements, and more.
          </p>

          {/* Feature list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 18,
              textAlign: "left",
            }}
          >
            {[
              "5 exclusive PRO resume templates",
              "AI-powered content enhancement",
              "ATS score checker & optimizer",
              "Priority support & unlimited downloads",
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: "#334155",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#000",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Ã¢Å“â€œ
                </span>
                {f}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onUpgrade}
            style={{
              width: "100%",
              padding: "13px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            Buy Pro at 999/month
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Go back to free template
          </button>
        </div>
      </div>
    </div>
  );
}

/* 
   ATS Modal*/
function CircularScore({ score, size = 110, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e8eef8"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
        fill={color}
        fontSize={28}
        fontWeight={900}
        fontFamily="'DM Sans',sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function AnalysisModal({ resume, mode, onClose }) {
  const [step, setStep] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const configs = {
    ats: {
      icon: FiCpu,
      title: "ATS Score Checker",
      loading: "AI is analyzing ATS compatibility...",
      color: "#143f86",
    },
    roast: {
      icon: FiZap,
      title: "Roast Mode",
      loading: "AI is preparing your roast...",
      color: "#dc2626",
    },
    recruiter: {
      icon: FiStar,
      title: "60+ Year Recruiter",
      loading: "The veteran recruiter is reviewing your resume...",
      color: "#d97706",
    },
  };
  const cfg = configs[mode] || configs.ats;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await resumeService.analyzeResume({ mode, resume });
        if (cancelled) return;
        if (res?.success && res?.data) {
          setResult(res.data);
          setStep("done");
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Analysis failed");
        setStep("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resume, mode]);

  const Icon = cfg.icon;

  return (
    <div
      className="rb-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          maxHeight: "88vh",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}dd 100%)`,
            padding: "20px 24px 16px",
            textAlign: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
          >
            <FiX style={{ fontSize: 14 }} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
            }}
          >
            {step === "loading" ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "rb-spin 0.7s linear infinite",
                }}
              />
            ) : (
              <Icon style={{ color: "white", fontSize: 18 }} />
            )}
          </div>
          <h3
            style={{ color: "white", fontWeight: 900, fontSize: 16, margin: 0 }}
          >
            {step === "loading" ? cfg.loading : cfg.title}
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 11,
              marginTop: 3,
            }}
          >
            {step === "loading"
              ? "Please wait while AI processes your resume"
              : "Analysis complete"}
          </p>
        </div>

        <div
          className="rb-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "18px 22px 22px" }}
        >
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: "3px solid #e8eef8",
                  borderTopColor: cfg.color,
                  borderRadius: "50%",
                  animation: "rb-spin 0.8s linear infinite",
                  margin: "0 auto 14px",
                }}
              />
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                Analyzing your resume content and structure...
              </p>
            </div>
          )}

          {step === "done" && result && (
            <>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: "16px",
                  marginBottom: 14,
                  textAlign: "center",
                  border: "1px solid #e8eef8",
                }}
              >
                <CircularScore score={result.score} size={96} stroke={7} />
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      result.score >= 80
                        ? "#16a34a"
                        : result.score >= 60
                          ? "#d97706"
                          : "#dc2626",
                    marginTop: 4,
                  }}
                >
                  {result.score >= 80
                    ? "Excellent"
                    : result.score >= 60
                      ? "Good — needs work"
                      : "Needs major improvement"}
                </p>
              </div>

              {mode === "roast" && result.roast && (
                <div
                  style={{
                    background: "#fef2f2",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 14,
                    border: "1px solid #fecaca",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#dc2626",
                      fontStyle: "italic",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    "{result.roast}"
                  </p>
                </div>
              )}

              {mode === "recruiter" && result.verdict && (
                <div
                  style={{
                    background: "#fffbeb",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 14,
                    border: "1px solid #fde68a",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "#92400e",
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    "{result.verdict}"
                  </p>
                </div>
              )}

              {mode === "recruiter" && result.wisdom && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #143f86 0%, #1d55b3 100%)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 14,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#d6f33d",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    Wisdom from the veteran
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    "{result.wisdom}"
                  </p>
                </div>
              )}

              {mode === "ats" && (
                <>
                  {result.strongPoints?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#16a34a",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiCheck style={{ fontSize: 12 }} /> Strong Points
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.strongPoints.map((pt, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#f0fdf4",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#166534",
                                lineHeight: 1.5,
                              }}
                            >
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.weakPoints?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#dc2626",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiX style={{ fontSize: 12 }} /> Weak Points
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.weakPoints.map((pt, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#fef2f2",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #fecaca",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#991b1b",
                                lineHeight: 1.5,
                              }}
                            >
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode === "roast" && (
                <>
                  {result.mainIssues?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#dc2626",
                          marginBottom: 6,
                        }}
                      >
                        Main Issues
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.mainIssues.map((issue, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#fef2f2",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #fecaca",
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                color: "#dc2626",
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {i + 1}.
                            </span>
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#991b1b",
                                lineHeight: 1.5,
                              }}
                            >
                              {issue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.harshTruths?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#ea580c",
                          marginBottom: 6,
                        }}
                      >
                        Harsh Truths
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.harshTruths.map((ht, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#fff7ed",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#9a3412",
                                lineHeight: 1.5,
                              }}
                            >
                              {"\u2022"} {ht}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode === "recruiter" && (
                <>
                  {result.observations?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#92400e",
                          marginBottom: 6,
                        }}
                      >
                        Observations
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.observations.map((obs, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#fffbeb",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#78350f",
                                lineHeight: 1.5,
                              }}
                            >
                              {"\u2022"} {obs}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.advice?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#143f86",
                          marginBottom: 6,
                        }}
                      >
                        Advice
                      </p>
                      <div style={{ display: "grid", gap: 4 }}>
                        {result.advice.map((adv, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#eef2ff",
                              borderRadius: 8,
                              padding: "7px 10px",
                              border: "1px solid #dde6f8",
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                color: "#143f86",
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {i + 1}.
                            </span>
                            <span
                              style={{
                                fontSize: 11.5,
                                color: "#1e293b",
                                lineHeight: 1.5,
                              }}
                            >
                              {adv}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode === "ats" && result.recommendations?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#143f86",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiStar style={{ fontSize: 12 }} /> Recommendations
                  </p>
                  <div style={{ display: "grid", gap: 4 }}>
                    {result.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#eef2ff",
                          borderRadius: 8,
                          padding: "7px 10px",
                          border: "1px solid #dde6f8",
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            color: "#143f86",
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {i + 1}.
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "#1e293b",
                            lineHeight: 1.5,
                          }}
                        >
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 14,
                    fontSize: 11,
                    color: "#dc2626",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: cfg.color,
                  color: "white",
                  fontWeight: 800,
                  fontSize: 12,
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${cfg.color}44`,
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GrammarModal({ resume, source, onClose }) {
  const [step, setStep] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const readOnly = source === "uploaded";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const content = [
          resume.summary,
          ...(resume.workExperience || []).map((e) => e.desc).filter(Boolean),
          ...(resume.projects || []).map((p) => p.desc).filter(Boolean),
          ...(resume.internships || []).map((i) => i.desc).filter(Boolean),
        ]
          .filter(Boolean)
          .join("\n\n");
        const res = await resumeService.analyzeResume({
          mode: "grammar",
          resume,
          content,
        });
        if (cancelled) return;
        if (res?.success && res?.data) {
          setResult(res.data);
          setStep("done");
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Grammar check failed");
        setStep("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resume]);

  return (
    <div
      className="rb-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
            padding: "20px 24px 16px",
            textAlign: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
          >
            <FiX style={{ fontSize: 14 }} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 8px",
            }}
          >
            {step === "loading" ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "rb-spin 0.7s linear infinite",
                }}
              />
            ) : (
              <FiPenTool style={{ color: "white", fontSize: 18 }} />
            )}
          </div>
          <h3
            style={{ color: "white", fontWeight: 900, fontSize: 16, margin: 0 }}
          >
            {step === "loading"
              ? "AI is checking grammar..."
              : "Grammar & Style Check"}
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 11,
              marginTop: 3,
            }}
          >
            {step === "loading"
              ? "Reviewing every sentence for errors"
              : readOnly
                ? "Recommendations only — uploaded resume cannot be edited"
                : "Review and apply corrections below"}
          </p>
        </div>

        <div
          className="rb-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "18px 22px 22px" }}
        >
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: "3px solid #e8eef8",
                  borderTopColor: "#db2777",
                  borderRadius: "50%",
                  animation: "rb-spin 0.8s linear infinite",
                  margin: "0 auto 14px",
                }}
              />
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                Scanning for grammar, spelling, punctuation, and style issues...
              </p>
            </div>
          )}

          {step === "done" && result && (
            <>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: "14px",
                  marginBottom: 14,
                  textAlign: "center",
                  border: "1px solid #e8eef8",
                }}
              >
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color:
                      result.score >= 80
                        ? "#16a34a"
                        : result.score >= 60
                          ? "#d97706"
                          : "#dc2626",
                    margin: 0,
                  }}
                >
                  {result.score}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Grammar Score
                </p>
                {result.summary && (
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "#475569",
                      lineHeight: 1.5,
                      marginTop: 6,
                      fontStyle: "italic",
                    }}
                  >
                    {result.summary}
                  </p>
                )}
              </div>

              {result.corrections?.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#1e293b",
                      marginBottom: 6,
                    }}
                  >
                    Found {result.corrections.length} issue
                    {result.corrections.length > 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "grid", gap: 6 }}>
                    {result.corrections.map((corr, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#fdf2f8",
                          borderRadius: 10,
                          padding: "10px 12px",
                          border: "1px solid #fbcfe8",
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#be185d",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Original
                          </span>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "#9d174d",
                              lineHeight: 1.5,
                              margin: "2px 0 0",
                              background: "#fff",
                              borderRadius: 6,
                              padding: "4px 8px",
                              textDecoration: "line-through",
                            }}
                          >
                            {corr.original}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#16a34a",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Suggestion
                          </span>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "#166534",
                              lineHeight: 1.5,
                              margin: "2px 0 0",
                              background: "#f0fdf4",
                              borderRadius: 6,
                              padding: "4px 8px",
                            }}
                          >
                            {corr.suggestion}
                          </p>
                        </div>
                        {corr.explanation && (
                          <p
                            style={{
                              fontSize: 10.5,
                              color: "#64748b",
                              lineHeight: 1.4,
                              marginTop: 4,
                              fontStyle: "italic",
                            }}
                          >
                            {corr.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    borderRadius: 12,
                    padding: "14px",
                    marginBottom: 14,
                    textAlign: "center",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <FiCheck style={{ color: "#16a34a", fontSize: 20 }} />
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#166534",
                      marginTop: 4,
                    }}
                  >
                    No grammar issues found!
                  </p>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Your resume looks well-polished.
                  </p>
                </div>
              )}

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 14,
                    fontSize: 11,
                    color: "#dc2626",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#db2777",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 12,
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(219,39,119,0.25)",
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   ROOT COMPONENT

/*  ROOT COMPONENT*/
export default function ResumeBuilder() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("editor");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobilePreviewActive, setIsMobilePreviewActive] = useState(false);
  const [resume, setResume] = useState(INITIAL_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState("classic-blue");
  const [formatting, setFormatting] = useState(() => {
    try {
      const saved = sessionStorage.getItem("rb_formatting");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      /* ignore */
    }
    return {
      spacing: "Medium",
      font: "DM Sans",
      fontSize: "Medium",
      accentColor: "#143f86",
    };
  });
  const [resumeName, setResumeName] = useState("Resume_Pranjal");
  const [editingName, setEditingName] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  const [showRoastModal, setShowRoastModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [showGrammarModal, setShowGrammarModal] = useState(false);
  const [grammarSource, setGrammarSource] = useState("built");
  const [showPROModal, setShowPROModal] = useState(false);
  const [scale, setScale] = useState(1);
  const [saveStatus, setSaveStatus] = useState("saved");
  const autoSaveTimer = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const previewContainerRef = useRef(null);
  const nameRef = useRef(null);
  const pdfSourceRef = useRef(null);
  const uploadRef = useRef(null);
  const [uploadedResumePdf, setUploadedResumePdf] = useState(null);

  // Initialize scale at 100%; user can zoom via +/- buttons or Ctrl+scroll
  // On mobile, auto-scale to fit window width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        const newScale = (window.innerWidth - 40) / 595;
        setScale(newScale > 0.1 ? newScale : 0.5);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Call once on mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure template content height for pagination (uses pdfSourceRef for consistent rendering)
  useEffect(() => {
    if (pdfSourceRef.current) {
      const h = pdfSourceRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(h / 842));
      if (pages !== pageCount) setPageCount(pages);
    }
  }, [resume, selectedTemplate, formatting]);

  // Auto-save resume to sessionStorage with debounce
  useEffect(() => {
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem("rb_resume", JSON.stringify(resume));
        sessionStorage.setItem("rb_selectedTemplate", selectedTemplate);
        sessionStorage.setItem("rb_formatting", JSON.stringify(formatting));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("saved");
      }
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [resume, selectedTemplate, formatting]);

  const {
    exportPdf,
    isExporting: pdfExporting,
    error: pdfError,
  } = usePdfExport();
  const isDownloading = pdfExporting;

  const handleDownload = async () => {
    const plan = user?.membership?.plan || "FREE";
    const isProUser = plan === "PRO" || plan === "ELITE";
    if (isProTemplate(selectedTemplate) && !isProUser) {
      setShowPROModal(true);
      return;
    }
    const pages = document.querySelectorAll("#resume-print .rb-print-page");
    if (!pages.length) return;
    try {
      await exportPdf(pages, `${resumeName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("[PDF Export] Failed:", err);
    }
  };

  const handleModalOpen = (key) => {
    if (key === "ats") setShowATSModal(true);
    else if (key === "roast") setShowRoastModal(true);
    else if (key === "recruiter") setShowRecruiterModal(true);
    else if (key === "grammar") {
      setGrammarSource("built");
      setShowGrammarModal(true);
    }
  };

  const handleProUpgrade = async () => {
    try {
      const orderRes = await paymentService.createOrder("PRO");
      if (!orderRes?.success || !orderRes?.data)
        throw new Error("Failed to create order");
      await paymentService.openCheckout({
        order: orderRes.data,
        keyId: orderRes.data.keyId,
        user,
        onSuccess: async (result) => {
          if (result?.success) {
            updateUser?.({
              ...user,
              membership: { plan: "PRO", active: true },
            });
            setShowPROModal(false);
          }
        },
        onError: (msg) => {
          console.error("[Upgrade] Payment error:", msg);
        },
      });
    } catch (err) {
      console.error("[Upgrade] Failed:", err.message);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedResumePdf(ev.target?.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const clearUploadedPdf = () => setUploadedResumePdf(null);

  // Inject CSS once
  useEffect(() => {
    const id = "rb-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    return () => {}; // keep on unmount so re-renders don't flicker
  }, []);

  return (
    <div
      className="rb-root"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f0f4fb",
        overflow: "hidden",
      }}
    >
      {/* 
          TOP NAVIGATION BAR
       */}
      <header
        className="rb-no-print rb-desktop-header"
        style={{
          height: 60,
          background: "white",
          borderBottom: "1px solid #e8eef8",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
          boxShadow: "0 1px 8px rgba(20,63,134,0.06)",
          zIndex: 30,
        }}
      >
        {/* Logo */}
        <img
          src={mavenLogo}
          alt="Maven Jobs"
          onClick={() => navigate("/profile")}
          style={{
            height: 28,
            width: "auto",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />
        <div
          style={{ width: 1, height: 28, background: "#e8eef8", flexShrink: 0 }}
        />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={active ? "" : "rb-tab"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: active ? "#0a244d" : "transparent",
                  color: active ? "white" : "#4c6488",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 8px rgba(10,36,77,0.2)" : "none",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon
                  style={{
                    fontSize: 13,
                    color: active
                      ? "white"
                      : id === "editor"
                        ? "#8b5cf6"
                        : id === "templates"
                          ? "#16a34a"
                          : id === "formatting"
                            ? "#ea580c"
                            : "#ea580c",
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* Resume name */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {editingName ? (
            <input
              ref={nameRef}
              autoFocus
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0a244d",
                border: "none",
                borderBottom: "2px solid #143f86",
                background: "transparent",
                padding: "2px 4px",
                textAlign: "center",
                outline: "none",
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#0a244d",
                padding: "6px 10px",
                borderRadius: 8,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#143f86";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#0a244d";
              }}
            >
              {resumeName}
              <FiEdit3 style={{ fontSize: 13, color: "#c8d8ea" }} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              background: isDownloading ? "#94a3b8" : "white",
              color: isDownloading ? "#fff" : "#143f86",
              border: `2px solid ${isDownloading ? "#94a3b8" : "#143f86"}`,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: isDownloading ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = "#eef2ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.background = "white";
              }
            }}
          >
            {isDownloading ? (
              <FiLoader
                style={{
                  fontSize: 13,
                  animation: "rb-spin 0.7s linear infinite",
                }}
              />
            ) : (
              <FiDownload style={{ fontSize: 13 }} />
            )}
            {isDownloading ? "Generating PDFÃ¢â‚¬Â¦" : "Download"}
          </button>
          <input
            type="file"
            ref={uploadRef}
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          {uploadedResumePdf ? (
            <>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#16a34a",
                  background: "#f0fdf4",
                  borderRadius: 999,
                  border: "1.5px solid #bbf7d0",
                }}
              >
                <FiCheck style={{ fontSize: 13 }} /> PDF loaded
              </span>
              <button
                onClick={clearUploadedPdf}
                title="Remove uploaded PDF"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 12px",
                  background: "white",
                  color: "#dc2626",
                  border: "1.5px solid #fecaca",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.borderColor = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#fecaca";
                }}
              >
                <FiX style={{ fontSize: 13 }} /> Clear
              </button>
            </>
          ) : (
            <button
              onClick={() => uploadRef.current?.click()}
              title="Upload Custom Resume"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                background: "white",
                color: "#475569",
                border: "1.5px solid #dde6f8",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#143f86";
                e.currentTarget.style.color = "#143f86";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#dde6f8";
                e.currentTarget.style.color = "#475569";
              }}
            >
              <FiUpload style={{ fontSize: 13 }} /> Upload
            </button>
          )}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "white",
              border: "1.5px solid #e8eef8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#8ca2c0",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#143f86";
              e.currentTarget.style.color = "#143f86";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e8eef8";
              e.currentTarget.style.color = "#8ca2c0";
            }}
          >
            <FiMoreVertical style={{ fontSize: 15 }} />
          </button>
        </div>
      </header>

      {/* MOBILE ONLY HEADER */}
      <header
        className="rb-no-print rb-mobile-header"
        style={{
          display: "none", // Hidden by default, shown by CSS media query
          height: 60,
          background: "white",
          borderBottom: "1px solid #e8eef8",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          boxShadow: "0 1px 8px rgba(20,63,134,0.06)",
        }}
      >
        <img
          src={mavenLogo}
          alt="Maven Jobs"
          onClick={() => navigate("/profile")}
          style={{ height: 28, width: "auto", cursor: "pointer" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setIsMobilePreviewActive(!isMobilePreviewActive)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#143f86"
            }}
          >
            {isMobilePreviewActive ? <FiEdit3 size={20} /> : <FiEye size={20} />} 
            {isMobilePreviewActive ? "Edit" : "Preview"}
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0a244d", display: "flex", alignItems: "center" }}
          >
            <FiMenu size={24} />
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div 
        className={`rb-mobile-overlay ${isMobileSidebarOpen ? 'open' : ''} rb-no-print`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* MOBILE SIDEBAR */}
      <div className={`rb-mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''} rb-no-print`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "1px solid #e8eef8" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a244d", margin: 0 }}>Menu</h2>
          <button onClick={() => setIsMobileSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0a244d" }}>
            <FiX size={24} />
          </button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Resume Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingName ? (
              <input
                autoFocus
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0a244d",
                  border: "none",
                  borderBottom: "2px solid #143f86",
                  background: "transparent",
                  padding: "4px 8px",
                  outline: "none",
                }}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#f0f4fb",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0a244d",
                  padding: "8px 12px",
                  borderRadius: 8,
                  width: "100%",
                }}
              >
                {resumeName}
                <FiEdit3 style={{ fontSize: 14, color: "#4c6488", marginLeft: "auto" }} />
              </button>
            )}
          </div>
          


          <button
            onClick={() => {
              handleDownload();
              setIsMobileSidebarOpen(false);
            }}
            disabled={isDownloading}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "#0a244d", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "white"
            }}
          >
            {isDownloading ? <FiLoader className="rb-spin" size={18} /> : <FiDownload size={18} />}
            {isDownloading ? "Generating..." : "Download"}
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
              setIsMobileSidebarOpen(false);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "white", border: "1px solid #c8d8ea", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#4c6488"
            }}
          >
            <FiUpload size={18} /> Upload Data
          </button>
        </div>
      </div>

      {/* 
          MAIN BODY
       */}
      <div className="rb-main-content" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT PANEL */}
        <div
          className={`rb-no-print rb-editor-pane ${isMobilePreviewActive ? 'hidden-on-mobile' : ''}`}
          style={{
            width: 380,
            flexShrink: 0,
            background: "white",
            borderRight: "1px solid #e8eef8",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "1px 0 8px rgba(20,63,134,0.04)",
          }}
        >
          {activeTab === "editor" && (
            <EditorPanel resume={resume} setResume={setResume} />
          )}
          {activeTab === "templates" && (
            <TemplatesPanel
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          )}
          {activeTab === "formatting" && (
            <FormattingPanel
              formatting={formatting}
              setFormatting={setFormatting}
            />
          )}
          {activeTab === "enhance" && <EnhancePanel onOpen={handleModalOpen} />}
        </div>

        {/* RIGHT — Preview canvas */}
        <div
          className={`rb-preview-pane ${!isMobilePreviewActive ? 'hidden-on-mobile' : ''}`}
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#e8edf5",
          }}
        >
          {/* Preview toolbar */}
          <div
            className="rb-no-print"
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: "1px solid #dde6f8",
              background: "#e8edf5",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() =>
                  setScale((s) =>
                    Math.max(0.3, Math.round((s - 0.1) * 100) / 100),
                  )
                }
                title="Zoom out"
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #dde6f8",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                  color: "#143f86",
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0a244d",
                  minWidth: 36,
                  textAlign: "center",
                }}
              >
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() =>
                  setScale((s) =>
                    Math.min(1.5, Math.round((s + 0.1) * 100) / 100),
                  )
                }
                title="Zoom in"
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #dde6f8",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                  color: "#143f86",
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                +
              </button>
              <div style={{ width: 1, height: 20, background: "#dde6f8" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8ca2c0" }}>
                A4 · PDF
              </span>
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#c8d8ea",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color:
                    saveStatus === "saved"
                      ? "#16a34a"
                      : saveStatus === "saving"
                        ? "#ea580c"
                        : "#8ca2c0",
                  transition: "color 0.3s",
                }}
              >
                {saveStatus === "saved"
                  ? "✓ Auto-saved"
                  : saveStatus === "saving"
                    ? "Saving..."
                    : "Unsaved"}
              </span>
            </div>
          </div>

          {/* Scrollable area Ã¢â‚¬â€ auto-scaled A4 preview */}
          <div
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setScale((s) =>
                  Math.min(1.5, Math.max(0.3, s - e.deltaY * 0.002)),
                );
              }
            }}
            ref={previewContainerRef}
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "20px",
            }}
          >
            {uploadedResumePdf ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: 800,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  background: "white",
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 4px 40px rgba(20,63,134,0.14)",
                }}
              >
                <div
                  className="rb-no-print"
                  style={{
                    padding: "8px 12px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: "#4c6488" }}
                  >
                    Uploaded Resume
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        setGrammarSource("uploaded");
                        setShowGrammarModal(true);
                      }}
                      style={{
                        padding: "5px 10px",
                        background: "#eef2ff",
                        color: "#143f86",
                        border: "1px solid #dde6f8",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Fix Grammar
                    </button>
                    <button
                      onClick={() => setUploadedResumePdf(null)}
                      style={{
                        padding: "5px 10px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <iframe
                  src={uploadedResumePdf}
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  title="Uploaded Resume"
                />
              </div>
            ) : (
              <div
                className="rb-scale-wrapper"
                style={{
                  transformOrigin: "top center",
                  transform: `scale(${scale})`,
                  position: "relative",
                }}
              >
                {/* Hidden PDF source - inside transform for consistent rendering context */}
                <div
                  ref={pdfSourceRef}
                  className="rb-pdf-source rb-no-print"
                  style={{
                    position: "absolute",
                    visibility: "hidden",
                    width: 595,
                    left: "-9999px",
                  }}
                >
                  <TemplatePreview
                    resume={resume}
                    formatting={formatting}
                    selectedTemplate={selectedTemplate}
                  />
                </div>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div
                    key={i}
                    style={{ marginBottom: i < pageCount - 1 ? 24 : 0 }}
                  >
                    <div
                      className="rb-page-wrapper"
                      style={{
                        width: 595,
                        height: 842,
                        overflow: "hidden",
                        background: "white",
                        boxShadow: "0 4px 40px rgba(20,63,134,0.14)",
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <div style={{ marginTop: -i * 842 }}>
                        <TemplatePreview
                          resume={resume}
                          formatting={formatting}
                          selectedTemplate={selectedTemplate}
                        />
                      </div>
                    </div>
                    <div
                      className="rb-no-print"
                      style={{ textAlign: "center", marginTop: 6 }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#8ca2c0",
                          fontWeight: 600,
                        }}
                      >
                        Page {i + 1} of {pageCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden print container — 1:1 scale, no transforms, used by html2canvas */}
            <div
              id="resume-print"
              style={{
                position: "absolute",
                left: "-9999px",
                top: 0,
                zIndex: -1,
                width: 595,
                background: "white",
              }}
            >
              {Array.from({ length: pageCount }).map((_, i) => (
                <div
                  key={i}
                  className="rb-print-page"
                  style={{
                    width: 595,
                    height: 842,
                    overflow: "hidden",
                    background: "white",
                  }}
                >
                  <div style={{ marginTop: -i * 842 }}>
                    <TemplatePreview
                      resume={resume}
                      formatting={formatting}
                      selectedTemplate={selectedTemplate}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Modals */}
      {showATSModal && (
        <AnalysisModal
          resume={resume}
          mode="ats"
          onClose={() => setShowATSModal(false)}
        />
      )}
      {showRoastModal && (
        <AnalysisModal
          resume={resume}
          mode="roast"
          onClose={() => setShowRoastModal(false)}
        />
      )}
      {showRecruiterModal && (
        <AnalysisModal
          resume={resume}
          mode="recruiter"
          onClose={() => setShowRecruiterModal(false)}
        />
      )}
      {showGrammarModal && (
        <GrammarModal
          resume={resume}
          source={grammarSource}
          onClose={() => setShowGrammarModal(false)}
        />
      )}

      {/* PRO Upsell Modal */}
      {showPROModal && (
        <PROUpsellModal
          templateName={getTemplate(selectedTemplate)?.name || "PRO"}
          onClose={() => setShowPROModal(false)}
          onUpgrade={handleProUpgrade}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="rb-no-print rb-mobile-bottom-nav"
        style={{
          display: "none", // Hidden by default, shown by CSS media query
          justifyContent: "space-around",
          alignItems: "center",
          padding: "8px 0",
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id && !isMobilePreviewActive;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setIsMobilePreviewActive(false);
                setIsMobileSidebarOpen(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                color: active ? "#0a244d" : "#8ba3c7",
              }}
            >
              <Icon
                style={{
                  fontSize: 20,
                  color: active
                    ? "#0a244d"
                    : id === "editor"
                      ? "#8b5cf6"
                      : id === "templates"
                        ? "#16a34a"
                        : id === "formatting"
                          ? "#ea580c"
                          : "#ea580c",
                }}
              />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* <LandingFooter /> */}
    </div>
  );
}
