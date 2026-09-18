import { useState, useRef, useEffect } from "react";
import { 
  FiX, FiCheck, FiChevronDown, FiMessageCircle, FiStar, 
  FiSearch, FiBriefcase, FiLifeBuoy, FiUserPlus, 
  FiMail, FiDollarSign, FiMoreHorizontal
} from "react-icons/fi";
import api from "../../services/api";

const C = {
  navy: "#002366",
  s50: "#f8fafc",
  s100: "#f1f5f9",
  s200: "#e2e8f0",
  s300: "#cbd5e1",
  s400: "#94a3b8",
  s500: "#64748b",
  s600: "#475569",
  s700: "#334155",
  s800: "#1e293b",
  dm: "'DM Sans',sans-serif",
  fd: "'Bricolage Grotesque',sans-serif",
};

const FEEDBACK_OPTIONS = [
  { value: "General", label: "General", icon: FiMessageCircle },
  { value: "Feature Request", label: "Feature Request", icon: FiStar },
  { value: "Resdex Search & Email", label: "Resdex Search & Email", icon: FiSearch },
  { value: "Job Postings & Response Manager", label: "Job Postings & Response Manager", icon: FiBriefcase },
  { value: "Support & Training", label: "Support & Training", icon: FiLifeBuoy },
  { value: "Onboarding", label: "Onboarding", icon: FiUserPlus },
  { value: "Marketing Communications", label: "Marketing Communications", icon: FiMail },
  { value: "Sales processes", label: "Sales processes", icon: FiDollarSign },
  { value: "others", label: "Others", icon: FiMoreHorizontal },
];

export default function FeedbackModal({ isOpen, onClose }) {
  const [feedbackType, setFeedbackType] = useState("General");
  const [suggestions, setSuggestions] = useState("");
  const [canContact, setCanContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suggestions.trim()) {
      setMessage({ type: "error", text: "Please enter your suggestions." });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const { data } = await api.post("/feedback", {
        feedbackType,
        suggestions,
        canContact,
      });
      if (data.success) {
        setMessage({ type: "success", text: "Feedback submitted successfully!" });
        setTimeout(() => {
          onClose();
          setFeedbackType("General");
          setSuggestions("");
          setCanContact(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to submit feedback." });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "An error occurred. Please try again.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = FEEDBACK_OPTIONS.find(opt => opt.value === feedbackType) || FEEDBACK_OPTIONS[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 18,
          maxWidth: 480,
          width: "100%",
          padding: "24px 24px 22px",
          boxShadow: "0 20px 48px rgba(15, 23, 42, 0.2)",
          position: "relative",
          fontFamily: C.dm,
        }}
      >
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "#f1f5f9",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <FiX size={16} />
        </button>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", fontFamily: C.fd }}>
          Share Your Feedback
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.4 }}>
          We're always looking to improve. Let us know how we can make Maven Jobs better for you.
        </p>

        {message && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              background: message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#15803d" : "#b91c1c",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Feedback Type
            </label>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${dropdownOpen ? C.navy : C.s300}`,
                fontSize: 14,
                fontFamily: C.dm,
                color: "#1e293b",
                backgroundColor: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s",
                boxShadow: dropdownOpen ? `0 0 0 3px ${C.navy}20` : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <selectedOption.icon size={16} color={C.s500} />
                <span style={{ fontWeight: 500 }}>{selectedOption.label}</span>
              </div>
              <FiChevronDown size={16} color={C.s400} style={{
                transition: "transform 0.2s",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
              }} />
            </div>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: "#fff",
                  border: `1px solid ${C.s200}`,
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: "6px"
                }}
              >
                {FEEDBACK_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setFeedbackType(opt.value);
                      setDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.s50;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13.5,
                      color: feedbackType === opt.value ? C.navy : "#334155",
                      fontWeight: feedbackType === opt.value ? 700 : 500,
                      backgroundColor: feedbackType === opt.value ? C.s50 : "transparent",
                      transition: "background 0.15s"
                    }}
                  >
                    <opt.icon size={16} color={feedbackType === opt.value ? C.navy : C.s400} />
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Suggestions
            </label>
            <textarea
              required
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Tell us what's on your mind..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.s300}`,
                fontSize: 14,
                outline: "none",
                fontFamily: C.dm,
                resize: "vertical",
                minHeight: 100,
                boxSizing: "border-box",
                color: "#1e293b",
                transition: "all 0.2s"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.navy;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${C.navy}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.s300;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `2px solid ${canContact ? C.navy : C.s300}`,
                background: canContact ? C.navy : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
                transition: "all 0.15s",
              }}
              onClick={() => setCanContact(!canContact)}
            >
              {canContact && <FiCheck size={12} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, fontWeight: 500 }}>
              Maven Jobs can contact me for this feedback
            </span>
          </label>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: `1px solid ${C.s300}`,
                background: "#ffffff",
                color: "#475569",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: C.dm,
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = C.s50)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#ffffff")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: C.navy,
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontFamily: C.dm,
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
