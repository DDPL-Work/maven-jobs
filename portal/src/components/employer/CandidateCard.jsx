import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  FiBriefcase, FiMapPin, FiCalendar, FiMail, FiEye,
  FiBook, FiAward, FiX, FiFileText, FiCheck, FiFolderPlus,
  FiMoreVertical, FiTrash2, FiFolder,
} from 'react-icons/fi';
import ResumeModal from './ResumeModal';
import { useVisibility } from '../../hooks/useLazyAI';

const C = {
  navy: "#002366", navyD: "#001540", navyM: "#1a3a6e",
  green: "#10b981", indigo: "#6366f1",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
};

const PASTEL_GRADIENTS = [
  ['#fce4ec', '#f8bbd0'], ['#f3e5f5', '#e1bee7'], ['#e8eaf6', '#c5cae9'],
  ['#e3f2fd', '#bbdefb'], ['#e0f2f1', '#b2dfdb'], ['#fff3e0', '#ffccbc'],
  ['#fbe9e7', '#d7ccc8'], ['#f1f8e9', '#dcedc8'], ['#fffde7', '#fff9c4'],
  ['#fce4ec', '#f48fb1'], ['#ede7f6', '#d1c4e9'], ['#e0f7fa', '#b2ebf2'],
  ['#f9fbe7', '#f0f4c3'], ['#fce4ec', '#f8bbd0'], ['#e1f5fe', '#b3e5fc'],
];

function seedFromName(name) {
  let hash = 0;
  const s = String(name || "C");
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function getAvatarGradient(name) {
  const idx = seedFromName(name) % PASTEL_GRADIENTS.length;
  const [c1, c2] = PASTEL_GRADIENTS[idx];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

function getAvatarLetter(name) {
  return (name || "C").trim()[0].toUpperCase();
}

function getAvatarLetterColor(name) {
  const darkColors = ['#c62828','#6a1b9a','#283593','#1565c0','#00695c','#2e7d32',
    '#ef6c00','#4e342e','#37474f','#00838f','#4527a0','#ad1457','#558b2f','#bf360c','#0d47a1'];
  return darkColors[seedFromName(name) % darkColors.length];
}

export function formatExperience(exp) {
  if (!exp || exp === "0" || exp === "Fresher") return "Fresher";
  const n = parseFloat(exp);
  if (isNaN(n)) return exp;
  const yrs = Math.floor(n);
  const mos = Math.round((n - yrs) * 12);
  if (yrs === 0) return `${mos} mos`;
  if (mos === 0) return `${yrs} yr${yrs > 1 ? "s" : ""}`;
  return `${yrs} yr${yrs > 1 ? "s" : ""} ${mos} mos`;
}

function formatSalary(salary) {
  if (!salary && salary !== 0) return null;
  const num = typeof salary === "string" ? parseInt(salary.replace(/[^0-9.-]/g, ""), 10) : Number(salary);
  if (isNaN(num)) return salary;
  if (num >= 100000) return `\u20B9${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `\u20B9${(num / 1000).toFixed(0)}K`;
  return `\u20B9${num}`;
}

function parseSkills(skills) {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") return skills.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function parseEducation(candidate) {
  const parts = [];
  if (candidate.ug) parts.push(candidate.ug);
  if (candidate.pg) parts.push(candidate.pg);
  if (candidate.doctorate) parts.push(candidate.doctorate);
  if (candidate.institute) parts.push(candidate.institute);
  if (candidate.education) {
    if (typeof candidate.education === "string") parts.push(candidate.education);
    else if (Array.isArray(candidate.education)) {
      candidate.education.forEach(e => {
        if (typeof e === "string") parts.push(e);
        else if (e?.degree) parts.push(e.degree);
      });
    }
  }
  return parts.slice(0, 2);
}

function getProfilePicUrl(candidate) {
  const raw = candidate.profilePic;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw?.url) return raw.url;
  return "";
}

function getResumeUrl(candidate) {
  if (candidate.resume?.url && typeof candidate.resume.url === "string") return candidate.resume.url;
  if (candidate.resumeUrl && typeof candidate.resumeUrl === "string") return candidate.resumeUrl;
  if (typeof candidate.resume === "string") return candidate.resume;
  if (candidate.resumeFile && typeof candidate.resumeFile === "string") return candidate.resumeFile;
  return null;
}

function hasResumeData(candidate) {
  const raw = candidate.resume;
  if (!raw) return false;
  if (typeof raw === "string") return raw.length > 0;
  if (typeof raw === "object" && raw?.url) return true;
  return false;
}

const CandidateCard = memo(function CandidateCard({
  candidate,
  onSelect,
  isSelected,
  onToggleSelect,
  onAddToFolder,
  context = "search",
  onRemoveFromFolder,
  onMoveFolder,
  isInFolder,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [cardRef, isVisible] = useVisibility({ threshold: 0, rootMargin: "50px" });
  const [lazyMatchScore, setLazyMatchScore] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    if (candidate.matchScore != null) {
      setLazyMatchScore(candidate.matchScore);
      return;
    }
    setMatchLoading(true);
    fetch(`/api/v1/ai/match-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        profileId: candidate.userId || candidate.id,
        source: context,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data?.overallScore != null) {
          setLazyMatchScore(data.data.overallScore);
        } else if (data?.matchScore != null) {
          setLazyMatchScore(data.matchScore);
        }
      })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [isVisible, candidate.userId, candidate.id, candidate.matchScore, context]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const skills = useMemo(() => parseSkills(candidate.skills), [candidate.skills]);
  const education = useMemo(() => parseEducation(candidate), [candidate]);
  const avatarUrl = useMemo(() => getProfilePicUrl(candidate), [candidate]);
  const resumeUrl = useMemo(() => getResumeUrl(candidate), [candidate]);
  const hasResume = useMemo(() => hasResumeData(candidate), [candidate]);
  const avatarLetter = useMemo(() => getAvatarLetter(candidate.name), [candidate.name]);
  const avatarGradient = useMemo(() => getAvatarGradient(candidate.name), [candidate.name]);
  const avatarColor = useMemo(() => getAvatarLetterColor(candidate.name), [candidate.name]);
  const candidateId = candidate.userId || candidate.id;
  const matchScore = lazyMatchScore ?? candidate.matchScore;

  const handleResume = useCallback((e) => {
    e.stopPropagation();
    if (!hasResume) return;
    setShowResume(true);
  }, [hasResume]);

  const handleViewProfile = useCallback(() => {
    if (!candidateId) return;
    setProfileLoading(true);
    window.open(`/candidates/${candidateId}`, "_blank", "noopener,noreferrer");
    setTimeout(() => setProfileLoading(false), 1000);
  }, [candidateId]);

  const handleEmail = useCallback(() => {
    if (candidate.email) {
      window.location.href = `mailto:${candidate.email}`;
    }
  }, [candidate.email]);

  const isFolderContext = context === "folder";
  const showFolderCornerCheck = isInFolder || isFolderContext || Boolean(candidate.folderCandidateId) || Boolean(candidate.isInFolder) || Boolean(candidate.inFolder);

  return (
    <motion.div ref={cardRef} layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#fff", borderRadius: 16, border: `1px solid ${C.s200}`,
        overflow: "hidden", transition: "box-shadow 0.2s", position: "relative",
      }}
      whileHover={{ boxShadow: "0 4px 20px rgba(10,22,40,0.07)" }}
    >
      {/* Top-left corner checkmark ribbon when added to folder */}
      {showFolderCornerCheck && (
        <div
          title="Added to folder"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 28,
            height: 28,
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M0 0H28L0 28V0Z" fill="#1d68bd" />
            <path
              d="M4.5 10.5L8.5 14.5L16 6.5"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", gap: 14 }}>
          {onToggleSelect && (
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, position: "relative",
            }} onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={!!isSelected}
                onChange={() => onToggleSelect(candidate)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
              <span style={{
                width: 20, height: 20, borderRadius: 5, border: `2px solid ${isSelected ? "#002366" : "#cbd5e1"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isSelected ? "#002366" : "transparent",
                transition: "all 0.15s", flexShrink: 0,
              }}>
                {isSelected && <FiCheck size={11} color="#fff" />}
              </span>
            </label>
          )}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: "hidden",
            background: avatarUrl ? "transparent" : avatarGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: avatarUrl ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.style.display = "none"; e.target.parentElement.style.background = avatarGradient; }}
              />
            ) : (
              <span style={{ color: avatarColor, fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>{avatarLetter}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: C.s900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {candidate.name || "Candidate"}
                </div>
                <div style={{ fontSize: "0.82rem", color: C.s600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {candidate.currentTitle || candidate.headline || ""}
                  {candidate.currentTitle && candidate.currentCompany ? " at " : ""}
                  {candidate.currentCompany || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                {candidate.hasApplied && (
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 700, background: "#ecfdf5", color: "#059669",
                    whiteSpace: "nowrap",
                  }}>Applied</span>
                )}
                {matchScore != null && (
                  <span style={{
                    padding: "3px 8px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 700, background: "#eef2ff", color: "#4338ca",
                  }}>
                    {matchLoading ? "..." : `${matchScore}%`}
                  </span>
                )}
                {matchLoading && matchScore == null && (
                  <span style={{
                    padding: "3px 8px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 700, background: "#f1f5f9", color: "#94a3b8",
                  }}>...</span>
                )}
              </div>
            </div>

            <div style={{
              display: "flex", flexWrap: "wrap", gap: "6px 16px",
              marginTop: 10, fontSize: "0.78rem", color: C.s500,
            }}>
              {candidate.totalExperience != null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiBriefcase size={12} /> {formatExperience(candidate.totalExperience)}
                </span>
              )}
              {candidate.currentCity && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiMapPin size={12} /> {candidate.currentCity}
                </span>
              )}
              {candidate.noticePeriod && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiCalendar size={12} /> {candidate.noticePeriod}
                </span>
              )}
              {(candidate.expectedSalary || candidate.currentSalary) && (
                <span>{formatSalary(candidate.expectedSalary || candidate.currentSalary)}</span>
              )}
            </div>

            {skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                {skills.slice(0, expanded ? skills.length : 6).map((skill, i) => (
                  <span key={i} style={{
                    padding: "2px 10px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 600, background: "#eef2ff", color: "#4338ca",
                  }}>{skill}</span>
                ))}
                {skills.length > 6 && !expanded && (
                  <button onClick={() => setExpanded(true)} style={{
                    padding: "2px 10px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 700, border: "none", background: "#f1f5f9",
                    color: C.s600, cursor: "pointer",
                  }}>+{skills.length - 6}</button>
                )}
                {expanded && skills.length > 6 && (
                  <button onClick={() => setExpanded(false)} style={{
                    padding: "2px 10px", borderRadius: 99, fontSize: "0.7rem",
                    fontWeight: 700, border: "none", background: "#f1f5f9",
                    color: C.s600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2,
                  }}><FiX size={10} /> less</button>
                )}
              </div>
            )}

            {education.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "6px 16px",
                marginTop: 8, fontSize: "0.78rem", color: C.s500,
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiBook size={12} /> {education.join(" | ")}
                </span>
              </div>
            )}

            {candidate.certifications && Array.isArray(candidate.certifications) && candidate.certifications.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "6px 16px",
                marginTop: 6, fontSize: "0.78rem", color: C.s500,
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <FiAward size={12} /> {candidate.certifications.slice(0, 3).join(", ")}
                  {candidate.certifications.length > 3 && ` +${candidate.certifications.length - 3}`}
                </span>
              </div>
            )}

            {candidate.summary && (
              <div style={{
                fontSize: "0.78rem", color: C.s600, marginTop: 8, lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{candidate.summary}</div>
            )}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.s100}`,
        }}>
          {candidate.email && (
            <button className="sr-btn" onClick={handleEmail}>
              <FiMail size={13} /> Email
            </button>
          )}
          {onSelect && (
            <button className="sr-btn" onClick={(e) => { e.stopPropagation(); onSelect(candidate); }}>
              <FiEye size={13} /> Select
            </button>
          )}
          {onToggleSelect && (
            <button className={`sr-btn ${isSelected ? 'sr-btn-primary' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleSelect(candidate); }}>
              <FiCheck size={13} /> {isSelected ? 'Selected' : 'Select'}
            </button>
          )}

          {isFolderContext ? (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button className="sr-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                title="More actions">
                <FiMoreVertical size={13} />
              </button>
              {menuOpen && (
                <div style={{
                  position: "absolute", bottom: "100%", right: 0, marginBottom: 4,
                  background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  border: `1px solid ${C.s200}`, minWidth: 170, padding: "4px", zIndex: 50,
                }} onClick={(e) => e.stopPropagation()}>
                  {onRemoveFromFolder && (
                    <button onClick={() => { onRemoveFromFolder(candidate); setMenuOpen(false); }} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                      fontSize: "0.82rem", color: "#dc2626", fontWeight: 500, width: "100%",
                      textAlign: "left", transition: "background 0.1s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                      <FiTrash2 size={13} /> Remove from Folder
                    </button>
                  )}
                  {onMoveFolder && (
                    <button onClick={() => { onMoveFolder(candidate); setMenuOpen(false); }} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                      fontSize: "0.82rem", color: C.s700, fontWeight: 500, width: "100%",
                      textAlign: "left", transition: "background 0.1s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                      <FiFolder size={13} /> Move to Folder
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : onAddToFolder && (
            <button className="sr-btn" onClick={(e) => { e.stopPropagation(); onAddToFolder(candidate); }}
              title="Save to Folder">
              <FiFolderPlus size={13} /> Folder
            </button>
          )}

          <button
            className={`sr-btn ${!hasResume ? "sr-btn-disabled" : ""}`}
            disabled={!hasResume}
            onClick={handleResume}
            title={hasResume ? "View Resume" : "No Resume Available"}
            style={!hasResume ? {
              opacity: 0.4, cursor: "not-allowed",
              color: C.s400, background: "#f1f5f9", borderColor: C.s200,
            } : {}}
          >
            <FiFileText size={13} /> {hasResume ? "Resume" : "No Resume"}
          </button>
          <button
            className="sr-btn"
            onClick={handleViewProfile}
            disabled={profileLoading}
            style={{ marginLeft: "auto", ...(profileLoading ? { opacity: 0.7 } : {}) }}
          >
            <FiEye size={13} /> {profileLoading ? "Opening..." : "View Profile"}
          </button>
        </div>
      </div>

      {showResume && (
        <ResumeModal
          candidateId={candidateId}
          resumeUrl={resumeUrl}
          onClose={() => setShowResume(false)}
        />
      )}
    </motion.div>
  );
});

export default CandidateCard;