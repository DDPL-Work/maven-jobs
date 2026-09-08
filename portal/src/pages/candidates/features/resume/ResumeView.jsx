import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import LandingFooter from "../../../../components/LandingFooter";
import { getTemplate, getFontFamily } from "./ResumeTemplates";

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Roboto:wght@400;500;700;900&family=Playfair+Display:wght@400;500;600;700;800&display=swap');

@media (max-width: 640px) {
  .rv-header {
    flex-direction: column;
    gap: 12px;
    padding: 16px !important;
  }
  .rv-header-left {
    width: 100%;
    justify-content: space-between;
  }
  .rv-header-download {
    width: 100%;
    justify-content: center;
  }
}
`;


export default function ResumeView() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [templateId, setTemplateId] = useState("classic-blue");
  const [formatting, setFormatting] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const measureRef = useRef(null);

  // Auto-scale on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        const newScale = (window.innerWidth - 32) / 595;
        setScale(newScale > 0.1 ? newScale : 0.5);
      } else {
        setScale(1);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!document.getElementById("rb-view-fonts")) {
      const style = document.createElement("style");
      style.id = "rb-view-fonts";
      style.textContent = FONT_CSS;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rb_resume");
      const savedTpl = sessionStorage.getItem("rb_selectedTemplate");
      const savedFmt = sessionStorage.getItem("rb_formatting");
      if (saved) setResume(JSON.parse(saved));
      if (savedTpl) setTemplateId(savedTpl);
      if (savedFmt) setFormatting(JSON.parse(savedFmt));
    } catch { /* ignore */ }
  }, []);

  // Measure template height for pagination
  useEffect(() => {
    if (measureRef.current) {
      const h = measureRef.current.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / 842)));
    }
  }, [resume, templateId]);

  const tpl = getTemplate(templateId);
  const Template = tpl?.component;

  if (!resume || !Template) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <div className="rv-header" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div className="rv-header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "none", cursor: "pointer", color: "#475569", fontSize: 14,
              fontWeight: 600, padding: "6px 12px", borderRadius: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <FiArrowLeft /> Back
          </button>
          <img src={mavenLogo} alt="Maven" style={{ height: 28 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{tpl.name}</span>
        </div>
        <button
          className="rv-header-download"
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#000", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          <FiDownload /> Download PDF
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px", overflowX: "hidden" }}>
        {/* Hidden measurement div */}
        <div
          ref={measureRef}
          style={{ position: "absolute", visibility: "hidden", width: 595, left: "-9999px" }}
        >
          <Template resume={resume} formatting={formatting || {}} />
        </div>

        {Array.from({ length: pageCount }).map((_, i) => (
          <div key={i} style={{ marginBottom: i < pageCount - 1 ? 24 : 0 }}>
            <div style={{ width: 595 * scale, height: 842 * scale }}>
              <div
                style={{
                  width: 595, height: 842, overflow: "hidden", background: "#fff",
                  boxShadow: "0 4px 40px rgba(0,0,0,0.1)", borderRadius: 2,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <div style={{ marginTop: -i * 842 }}>
                  <Template resume={resume} formatting={formatting || {}} />
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                Page {i + 1} of {pageCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      <LandingFooter />
    </div>
  );
}