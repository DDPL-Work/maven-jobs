import React from "react";
import {
  TemplateClassicBlue,
  TemplateCorporate,
  TemplateMinimalClean,
  TemplateElegant,
  TemplateModernLight,
  TemplateSidebar,
  TemplateTimeline,
  TemplateCompact,
  TemplateFocus,
  TemplateGrid,
  TemplateExecutive,
  TemplateCreative,
  TemplateProfessionalDark,
  TemplateContemporary,
  TemplateBold,
  TemplateCardinal,
  TemplateObsidian,
  TemplateLuxury,
  TemplateNature,
  TemplateSlate,
} from "./AllTemplateDefinitions";

/* ═════════════════════════════════════════════════════════════
   Template definition metadata
═════════════════════════════════════════════════════════════ */
export function TemplateCardPreview({ accent, name, tag, isDark }) {
  const bg = isDark ? "#1e293b" : "#fff";
  const textColor = isDark ? "#fff" : "#0f172a";
  const labelColor = isDark ? "rgba(255,255,255,0.5)" : "#64748b";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Header line */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <div
          style={{ width: 20, height: 20, borderRadius: 4, background: accent }}
        />
        <div
          style={{
            height: 6,
            width: "60%",
            borderRadius: 2,
            background: labelColor,
            opacity: 0.4,
          }}
        />
      </div>
      {/* Title lines */}
      <div
        style={{
          height: 8,
          width: "80%",
          borderRadius: 2,
          background: textColor,
          opacity: 0.15,
          marginTop: 6,
        }}
      />
      <div
        style={{
          height: 6,
          width: "50%",
          borderRadius: 2,
          background: textColor,
          opacity: 0.1,
          marginTop: 2,
        }}
      />
      {/* Content blocks */}
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <div
            style={{
              height: 4,
              width: "100%",
              borderRadius: 1,
              background: accent,
              opacity: 0.3,
            }}
          />
          <div
            style={{
              height: 4,
              width: "85%",
              borderRadius: 1,
              background: textColor,
              opacity: 0.08,
            }}
          />
          <div
            style={{
              height: 4,
              width: "70%",
              borderRadius: 1,
              background: textColor,
              opacity: 0.08,
            }}
          />
        </div>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            background: accent,
            opacity: 0.15,
          }}
        />
      </div>
      {/* More lines */}
      <div
        style={{
          height: 4,
          width: "90%",
          borderRadius: 1,
          background: textColor,
          opacity: 0.06,
          marginTop: 2,
        }}
      />
      <div
        style={{
          height: 4,
          width: "60%",
          borderRadius: 1,
          background: textColor,
          opacity: 0.06,
        }}
      />
      {/* Tag */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            fontSize: 7,
            fontWeight: 800,
            padding: "1px 6px",
            borderRadius: 3,
            background: tag === "PRO" ? accent : "transparent",
            color: tag === "PRO" ? "#fff" : accent,
            border: tag === "PRO" ? "none" : `1px solid ${accent}`,
          }}
        >
          {tag === "PRO" ? "PRO" : "FREE"}
        </div>
      </div>
    </div>
  );
}

export const TEMPLATES = [
  {
    id: "classic-blue",
    name: "Classic Blue",
    tag: "Free",
    accent: "#002366",
    component: TemplateClassicBlue,
    isDark: true,
  },
  {
    id: "corporate",
    name: "Corporate",
    tag: "Free",
    accent: "#143f86",
    component: TemplateCorporate,
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    tag: "Free",
    accent: "#94a3b8",
    component: TemplateMinimalClean,
  },
  {
    id: "elegant",
    name: "Elegant",
    tag: "Free",
    accent: "#b8860b",
    component: TemplateElegant,
  },
  {
    id: "modern-light",
    name: "Modern Light",
    tag: "Free",
    accent: "#667eea",
    component: TemplateModernLight,
  },
  {
    id: "sidebar",
    name: "Sidebar",
    tag: "Free",
    accent: "#6366f1",
    component: TemplateSidebar,
  },
  {
    id: "timeline",
    name: "Timeline",
    tag: "Free",
    accent: "#0891b2",
    component: TemplateTimeline,
  },
  {
    id: "compact",
    name: "Compact",
    tag: "Free",
    accent: "#94a3b8",
    component: TemplateCompact,
  },
  {
    id: "focus",
    name: "Focus",
    tag: "Free",
    accent: "#0f172a",
    component: TemplateFocus,
  },
  {
    id: "grid",
    name: "Grid",
    tag: "Free",
    accent: "#7c3aed",
    component: TemplateGrid,
  },
  {
    id: "executive",
    name: "Executive",
    tag: "PRO",
    accent: "#d4af37",
    component: TemplateExecutive,
    isDark: true,
  },
  {
    id: "creative",
    name: "Creative",
    tag: "PRO",
    accent: "#ff6b6b",
    component: TemplateCreative,
  },
  {
    id: "professional-dark",
    name: "Professional Dark",
    tag: "PRO",
    accent: "#06b6d4",
    component: TemplateProfessionalDark,
    isDark: true,
  },
  {
    id: "contemporary",
    name: "Contemporary",
    tag: "PRO",
    accent: "#059669",
    component: TemplateContemporary,
  },
  {
    id: "bold",
    name: "Bold",
    tag: "PRO",
    accent: "#000000",
    component: TemplateBold,
    isDark: true,
  },
  {
    id: "cardinal",
    name: "Cardinal",
    tag: "PRO",
    accent: "#dc2626",
    component: TemplateCardinal,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    tag: "PRO",
    accent: "#a855f7",
    component: TemplateObsidian,
    isDark: true,
  },
  {
    id: "luxury",
    name: "Luxury",
    tag: "PRO",
    accent: "#b8860b",
    component: TemplateLuxury,
    isDark: true,
  },
  {
    id: "nature",
    name: "Nature",
    tag: "PRO",
    accent: "#059669",
    component: TemplateNature,
  },
  {
    id: "slate",
    name: "Slate",
    tag: "PRO",
    accent: "#475569",
    component: TemplateSlate,
  },
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function isProTemplate(id) {
  const t = getTemplate(id);
  return t?.tag === "PRO";
}
