import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

export function SkillsModal({ open, existing, onSave, onClose }) {
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
