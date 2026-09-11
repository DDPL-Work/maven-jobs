import React, { useState, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from "react-icons/fi";
import { FaMagic } from "react-icons/fa";

export function RBInput({ label, value, onChange, placeholder, type = "text" }) {
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

export function RBTextarea({ label, value, onChange, placeholder, rows = 3 }) {
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

export function RBAccordion({ title, Icon, ai, children, defaultOpen = false }) {
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

export function RBCard({ children }) {
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

export function RBAddBtn({ label, onClick }) {
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

export function RemoveBtn({ onClick }) {
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
