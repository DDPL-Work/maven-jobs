import React, { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { TEMPLATES, TemplateCardPreview } from "../templates/templateRegistry";

export function TemplatesPanel({ selectedTemplate, setSelectedTemplate }) {
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
