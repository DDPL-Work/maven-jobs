import React, { useState, useEffect } from "react";
import { FiCpu, FiZap, FiStar, FiPenTool, FiCheck, FiX } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import resumeService from "../../../../../../services/resumeService";

/* 
   PRO UPSELL MODAL — Swiss-style premium alert*/
export function PROUpsellModal({ templateName, onClose, onUpgrade }) {
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
                  ✓
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
   ATS Score Circle indicator */
export function CircularScore({ score, size = 110, stroke = 8 }) {
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

export function AnalysisModal({ resume, mode, onClose }) {
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
                              {"•"} {ht}
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
                              {"•"} {obs}
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

export function GrammarModal({ resume, source, onClose }) {
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
