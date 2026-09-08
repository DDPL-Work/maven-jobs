import React from "react";
import { FiChevronDown, FiCheck, FiRefreshCw } from "react-icons/fi";
import { loadGoogleFont, ALL_GOOGLE_FONTS } from "../templates/fontUtils";
import { FONT_SIZES, SPACINGS, THEME_COLORS } from "./builderData";

export function FormattingPanel({ formatting, setFormatting }) {
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
            onChange={(v) => {
              loadGoogleFont(v);
              set("font", v);
            }}
            options={ALL_GOOGLE_FONTS}
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
