import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiMapPin, FiMail, FiEye,
  FiBook, FiAward, FiX, FiCheck, FiFolderPlus,
  FiMoreVertical, FiTrash2, FiFolder, FiPhone, FiPhoneCall,
  FiClock, FiPaperclip, FiSend, FiCreditCard,
  FiDownload,
} from 'react-icons/fi';
import { useVisibility } from '../../hooks/useLazyAI';
import { aiService } from '../../services/aiService';
import authService from '../../services/authService';

const HighlightText = ({ text, keyword, keywords }) => {
  if (!text) return null;
  const terms = [];
  if (keyword) {
    if (typeof keyword === 'string') {
      keyword.split(/[,|\s]+/).map(k => k.trim()).filter(k => k.length > 1).forEach(k => terms.push(k));
    }
  }
  if (Array.isArray(keywords)) {
    keywords.forEach(k => {
      if (typeof k === 'string' && k.trim().length > 1) terms.push(k.trim());
    });
  } else if (typeof keywords === 'string') {
    keywords.split(/[,|\s]+/).map(k => k.trim()).filter(k => k.length > 1).forEach(k => terms.push(k));
  }
  if (terms.length === 0) return <>{text}</>;

  const uniqueTerms = Array.from(new Set(terms.map(t => t.toLowerCase()))).sort((a, b) => b.length - a.length);
  const regexPattern = uniqueTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!regexPattern) return <>{text}</>;

  const parts = String(text).split(new RegExp(`(${regexPattern})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = uniqueTerms.includes(part.toLowerCase());
        return isMatch ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#fef08a',
              color: '#854d0e',
              padding: '0 2px',
              borderRadius: 2,
              fontWeight: 600,
              border: 'none',
            }}
          >
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
};

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
  if (yrs === 0) return `${mos}m`;
  if (mos === 0) return `${yrs}y`;
  return `${yrs}y ${mos}m`;
}

function formatSalary(salary) {
  if (!salary && salary !== 0) return null;
  const num = typeof salary === "string" ? parseInt(salary.replace(/[^0-9.-]/g, ""), 10) : Number(salary);
  if (isNaN(num) || num <= 0) return typeof salary === "string" && salary.trim() ? salary : null;
  if (num >= 100000) return `₹${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)} Lacs`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 24) return "today";
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  return `${Math.round(diffDays / 30)}mo ago`;
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
  const raw = candidate.profilePic || candidate.avatar;
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
  if (!candidate) return false;
  if (candidate.hasResume === true || candidate.hasCv === true) return true;
  if (candidate.resumeUrl && typeof candidate.resumeUrl === "string" && candidate.resumeUrl.trim()) return true;
  if (candidate.resumeFile && typeof candidate.resumeFile === "string" && candidate.resumeFile.trim()) return true;
  if (candidate.cvUrl && typeof candidate.cvUrl === "string" && candidate.cvUrl.trim()) return true;
  if (candidate.cvFile && typeof candidate.cvFile === "string" && candidate.cvFile.trim()) return true;
  if (candidate.cv) {
    if (typeof candidate.cv === "string" && candidate.cv.trim().length > 0) return true;
    if (typeof candidate.cv === "object" && (candidate.cv.url || candidate.cv.path || candidate.cv.file || candidate.cv.filename)) return true;
  }
  const raw = candidate.resume;
  if (!raw) return false;
  if (typeof raw === "string") return raw.trim().length > 0;
  if (typeof raw === "object") {
    return Boolean(raw.url || raw.path || raw.file || raw.filename || raw.key);
  }
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
  searchKeyword = "",
  jobId,
  profileQueryParams = "",
  customFooter = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [cardRef, isVisible] = useVisibility({ threshold: 0, rootMargin: "50px" });
  const [lazyMatchScore, setLazyMatchScore] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [similarCount, setSimilarCount] = useState(() => {
    if (typeof candidate.similarProfilesCount === 'number') return candidate.similarProfilesCount;
    if (typeof candidate.similarCount === 'number') return candidate.similarCount;
    return null;
  });

  useEffect(() => {
    if (!isVisible) return;
    if (candidate.matchScore != null) {
      setLazyMatchScore(candidate.matchScore);
      return;
    }
    if (!jobId) return;
    
    setMatchLoading(true);
    aiService.request('/match-score', {
      profileId: candidate.userId || candidate.id,
      jobId,
      source: context,
    })
      .then((data) => {
        if (data?.overallScore != null) {
          setLazyMatchScore(data.overallScore);
        } else if (data?.matchScore != null) {
          setLazyMatchScore(data.matchScore);
        }
      })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [isVisible, candidate.userId, candidate.id, candidate.matchScore, context, jobId]);

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
  const candidateId = (candidate.userId?._id || candidate.userId?.id || (typeof candidate.userId === "string" ? candidate.userId : null)) || candidate.id || candidate._id || candidate.publicShareId;
  const matchScore = lazyMatchScore ?? candidate.matchScore;

  // Extract all matching basis terms (matching skills, search keywords, URL filters)
  const allHighlightKeywords = useMemo(() => {
    const list = [];
    if (searchKeyword) {
      if (typeof searchKeyword === "string") {
        searchKeyword.split(/[,|\s]+/).map(k => k.trim()).filter(k => k.length > 1).forEach(k => list.push(k));
      } else if (Array.isArray(searchKeyword)) {
        searchKeyword.forEach(k => list.push(String(k).trim()));
      }
    }
    if (Array.isArray(candidate.matchingSkills)) {
      candidate.matchingSkills.forEach(s => {
        if (typeof s === "string" && s.trim().length > 1) {
          list.push(s.trim());
          s.trim().split(/\s+/).filter(w => w.length > 2).forEach(w => list.push(w));
        }
      });
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSkills = urlParams.get("skills");
      if (urlSkills) {
        urlSkills.split(",").map(s => s.trim()).filter(s => s.length > 1).forEach(s => list.push(s));
      }
      const urlKeyword = urlParams.get("keyword");
      if (urlKeyword) {
        urlKeyword.split(/\s+/).map(k => k.trim()).filter(k => k.length > 2).forEach(k => list.push(k));
      }
    } catch (_) {}

    return Array.from(new Set(list.filter(Boolean)));
  }, [searchKeyword, candidate.matchingSkills]);

  const matchingSkillsSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(candidate.matchingSkills)) {
      candidate.matchingSkills.forEach(s => set.add(String(s).trim().toLowerCase()));
    }
    allHighlightKeywords.forEach(k => set.add(k.toLowerCase()));
    return set;
  }, [candidate.matchingSkills, allHighlightKeywords]);

  useEffect(() => {
    if (!isVisible || !candidateId || similarCount !== null) return;
    let active = true;
    authService.getSimilarCandidates(candidateId)
      .then((res) => {
        if (!active) return;
        if (res?.success && typeof res?.total === 'number') {
          setSimilarCount(res.total);
        } else if (Array.isArray(res?.data)) {
          setSimilarCount(res.data.length);
        }
      })
      .catch(() => {
        if (active) setSimilarCount(0);
      });
    return () => { active = false; };
  }, [isVisible, candidateId, similarCount]);

  const similarUrl = useMemo(() => {
    const rawSkills = skills.slice(0, 4);
    const title = candidate.currentTitle || candidate.designation || "";
    const city = candidate.currentCity || candidate.location || "";
    const uniqueId = candidate.publicShareId || candidateId || "";

    const params = new URLSearchParams();
    if (uniqueId) {
      params.set("uniqueId", String(uniqueId));
      params.set("activeIn", "3650");
      params.set("uresid", String(uniqueId));
      params.set("pFlow", "SEARCH_ID");
      if (candidate.id || candidate.userId) {
        params.set("pFlowId", String(candidate.id || candidate.userId));
      }
      params.set("simCvSource", "content");
      if (similarCount !== null) {
        params.set("simCvCount", String(similarCount));
        params.set("contextSimCvCount", String(similarCount));
      }
      params.set("activeSimCvSource", "content");
      params.set("parentSearchType", "adv");
      params.set("pageNo", "1");
      params.set("resPerPage", "40");
      params.set("oneDaySearch", "false");
    }
    if (title) params.set("keyword", title);
    if (rawSkills.length > 0) params.set("skills", rawSkills.join(","));
    if (city) params.set("currentCity", city);

    const queryString = params.toString();
    return `/resume-search/simcv?${queryString}`;
  }, [skills, candidate, similarCount]);

  const currentRoleStr = useMemo(() => {
    const title = candidate.currentTitle || candidate.designation || "";
    const comp = candidate.currentCompany || candidate.company || "";
    if (title && comp) return `${title} at ${comp}`;
    return title || comp || null;
  }, [candidate.currentTitle, candidate.designation, candidate.currentCompany, candidate.company]);

  const previousRoleStr = useMemo(() => {
    const title = candidate.previousRole || "";
    const comp = candidate.previousCompany || "";
    if (title && comp) return `${title} at ${comp}`;
    return title || comp || null;
  }, [candidate.previousRole, candidate.previousCompany]);

  const educationStr = useMemo(() => {
    if (education.length > 0) return education.join(" | ");
    if (typeof candidate.education === "string" && candidate.education.trim()) return candidate.education;
    return null;
  }, [education, candidate.education]);

  const prefLocationsStr = useMemo(() => {
    if (Array.isArray(candidate.preferredLocations) && candidate.preferredLocations.length > 0) {
      const list = candidate.preferredLocations.map(l => typeof l === 'string' ? l : l.city || l.name).filter(Boolean);
      if (list.length <= 4) return list.join(", ");
      return `${list.slice(0, 4).join(", ")} +${list.length - 4} more`;
    }
    if (typeof candidate.preferredLocations === 'string' && candidate.preferredLocations.trim()) {
      return candidate.preferredLocations;
    }
    return null;
  }, [candidate.preferredLocations]);

  const profileUrl = candidateId
    ? `/candidates/${candidateId}${profileQueryParams ? `?${profileQueryParams}` : ''}`
    : null;

  const handleEmail = useCallback((e) => {
    e.stopPropagation();
    if (candidate.email) {
      window.location.href = `mailto:${candidate.email}`;
    }
  }, [candidate.email]);

  const isFolderContext = context === "folder";
  const showFolderCornerCheck = isInFolder || isFolderContext || Boolean(candidate.folderCandidateId) || Boolean(candidate.isInFolder) || Boolean(candidate.inFolder);

  const formattedSalaryVal = formatSalary(candidate.expectedSalary || candidate.currentSalary || candidate.salary);
  const formattedExpVal = formatExperience(candidate.totalExperience || candidate.experience);
  const locationVal = candidate.currentCity || candidate.location || null;
  const modifiedTime = formatTimeAgo(candidate.updatedAt);
  const activeTime = formatTimeAgo(candidate.lastActive || candidate.updatedAt);

  return (
    <>
      <style>{`
        .cc-candidate-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 20px 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.18s ease;
          position: relative;
        }
        .cc-candidate-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        }
        .cc-candidate-card.selected {
          border-color: #002366;
          background: #f8fafc;
        }
        .cc-card-main-grid {
          display: grid;
          grid-template-columns: auto 1fr 240px;
          gap: 16px;
          align-items: start;
        }
        .cc-card-checkbox-col {
          padding-top: 3px;
        }
        .cc-card-profile-col {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }
        .cc-card-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cc-candidate-name {
          font-size: 16.5px;
          font-weight: 800;
          color: #0f172a;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .cc-candidate-name:hover {
          color: #0284c7;
        }
        .cc-badge-applied {
          background: #ecfdf5;
          color: #059669;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .cc-badge-match {
          background: #eef2ff;
          color: #4338ca;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .cc-card-meta-tags {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 12.5px;
          color: #475569;
          font-weight: 500;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }
        .cc-meta-tag-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cc-details-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 2px;
        }
        .cc-similar-profiles-row {
          margin-top: 10px;
          margin-bottom: 2px;
        }
        .cc-similar-link {
          color: #0284c7;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
          cursor: pointer !important;
        }
        .cc-similar-link:hover {
          color: #0369a1;
          text-decoration: underline;
        }
        .cc-detail-row {
          display: grid;
          grid-template-columns: 105px 1fr;
          gap: 10px;
          align-items: start;
        }
        .cc-detail-label {
          color: #64748b;
          font-weight: 500;
          font-size: 12.5px;
        }
        .cc-detail-val {
          color: #1e293b;
          font-weight: 500;
          font-size: 13px;
        }
        .cc-card-right-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding-left: 14px;
          border-left: 1px solid #f1f5f9;
          position: relative;
        }
        .cc-avatar-img {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cc-headline-text {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cc-btn-phone {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0284c7;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
          box-sizing: border-box;
          font-family: inherit;
        }
        .cc-btn-phone:hover {
          background: #f0f9ff;
          border-color: #0284c7;
        }
        .cc-btn-phone.revealed {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
        }
        .cc-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 10px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cc-footer-left {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
          flex-wrap: wrap;
        }
        .cc-footer-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .cc-cv-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 6px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 11px;
          border: 1px solid #dbeafe;
          cursor: pointer;
          transition: all 0.12s;
        }
        .cc-cv-badge:hover {
          background: #dbeafe;
        }
        .cc-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-wrap: wrap;
        }
        .cc-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          text-decoration: none;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .cc-action-btn:hover {
          border-color: #002366;
          color: #002366;
          background: #f8fafc;
        }
        .cc-action-btn.primary {
          background: #002366;
          color: #ffffff;
          border-color: #002366;
        }
        .cc-action-btn.primary:hover {
          background: #001540;
        }
        @media (max-width: 768px) {
          .cc-card-main-grid {
            grid-template-columns: auto 1fr;
            gap: 12px;
          }
          .cc-card-right-col {
            grid-column: 1 / -1;
            border-left: none;
            border-top: 1px solid #f1f5f9;
            padding-top: 12px;
            padding-left: 0;
            flex-direction: row;
            text-align: left;
            flex-wrap: wrap;
          }
          .cc-detail-row {
            grid-template-columns: 85px 1fr;
            gap: 6px;
          }
        }
      `}</style>

      <motion.div ref={cardRef} layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`cc-candidate-card ${isSelected ? 'selected' : ''}`}
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

        <div className="cc-card-main-grid">
          {/* Column 1: Checkbox */}
          {onToggleSelect && (
            <div className="cc-card-checkbox-col">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => onToggleSelect(candidate)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `1.5px solid ${isSelected ? "#002366" : "#94a3b8"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected ? "#002366" : "#ffffff",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <FiCheck size={11} color="#fff" />}
                </span>
              </label>
            </div>
          )}

          {/* Column 2: Candidate Details */}
          <div className="cc-card-profile-col">
            {/* Name & Badges */}
            <div className="cc-card-name-row">
              {profileUrl ? (
                <Link
                  className="cc-candidate-name"
                  to={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={`View profile of ${candidate.name || 'Candidate'}`}
                >
                  <HighlightText text={candidate.name || "Candidate"} keywords={allHighlightKeywords} />
                </Link>
              ) : (
                <span className="cc-candidate-name">
                  <HighlightText text={candidate.name || "Candidate"} keywords={allHighlightKeywords} />
                </span>
              )}

              {candidate.hasApplied && (
                <span className="cc-badge-applied">Applied</span>
              )}
              {matchScore != null && (
                <span className="cc-badge-match">
                  {matchLoading ? "..." : `${matchScore}% Match`}
                </span>
              )}
            </div>

            {/* Meta Tags Row */}
            <div className="cc-card-meta-tags">
              {formattedExpVal && (
                <span className="cc-meta-tag-item">
                  <FiBriefcase size={13} color="#64748b" /> {formattedExpVal}
                </span>
              )}
              {formattedSalaryVal && (
                <span className="cc-meta-tag-item">
                  <FiCreditCard size={13} color="#64748b" /> {formattedSalaryVal}
                </span>
              )}
              {locationVal && (
                <span className="cc-meta-tag-item">
                  <FiMapPin size={13} color="#64748b" /> {locationVal}
                </span>
              )}
              {candidate.noticePeriod && (
                <span className="cc-meta-tag-item">
                  <FiClock size={13} color="#64748b" /> {candidate.noticePeriod}
                </span>
              )}
            </div>

            {/* Structured Details Table */}
            <div className="cc-details-table">
              {currentRoleStr && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Current</span>
                  <span className="cc-detail-val">
                    <HighlightText text={currentRoleStr} keywords={allHighlightKeywords} />
                  </span>
                </div>
              )}

              {previousRoleStr && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Previous</span>
                  <span className="cc-detail-val">
                    <HighlightText text={previousRoleStr} keywords={allHighlightKeywords} />
                  </span>
                </div>
              )}

              {educationStr && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Education</span>
                  <span className="cc-detail-val">
                    <HighlightText text={educationStr} keywords={allHighlightKeywords} />
                  </span>
                </div>
              )}

              {prefLocationsStr && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Pref. locations</span>
                  <span className="cc-detail-val">{prefLocationsStr}</span>
                </div>
              )}

              {skills.length > 0 && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Key skills</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", alignItems: "center" }}>
                    {skills.slice(0, expanded ? skills.length : 12).map((skill, i) => {
                      const lowerSkill = skill.toLowerCase();
                      const isMatchingSkill = matchingSkillsSet.has(lowerSkill) ||
                        allHighlightKeywords.some(k => {
                          const lk = k.toLowerCase();
                          return lowerSkill.includes(lk) || lk.includes(lowerSkill);
                        });
                      return (
                        <span
                          key={i}
                          style={{
                            color: isMatchingSkill ? "#854d0e" : "#1e3a8a",
                            fontWeight: isMatchingSkill ? 600 : 500,
                            fontSize: "0.8rem",
                            background: isMatchingSkill ? "#fef08a" : "#eff6ff",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                        >
                          {skill}
                        </span>
                      );
                    })}
                    {skills.length > 12 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpanded(p => !p); }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0284c7",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "2px 4px",
                          textDecoration: "underline"
                        }}
                      >
                        {expanded ? "less" : `+${skills.length - 12} more`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {candidate.summary && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">Summary</span>
                  <span className="cc-detail-val" style={{
                    color: "#475569",
                    display: "-webkit-box",
                    WebkitLineClamp: expanded ? "unset" : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontSize: "0.82rem",
                    lineHeight: 1.5
                  }}>
                    <HighlightText text={candidate.summary} keywords={allHighlightKeywords} />
                  </span>
                </div>
              )}
            </div>

            {/* Similar profiles link matching reference image */}
            <div className="cc-similar-profiles-row">
              <a
                href={similarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-similar-link"
                onClick={(e) => e.stopPropagation()}
                title="View similar candidate profiles in a new tab"
              >
                <span>
                  {similarCount !== null
                    ? `${similarCount} similar profile${similarCount !== 1 ? 's' : ''}`
                    : 'Similar profiles'}
                </span>
              </a>
            </div>
          </div>

          {/* Column 3: Avatar, Headline, Call / Contact */}
          <div className="cc-card-right-col">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="cc-avatar-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="cc-avatar-img"
              style={{
                display: avatarUrl ? "none" : "flex",
                background: avatarGradient,
                color: avatarColor,
                fontWeight: 800,
                fontSize: "1.2rem",
              }}
            >
              {avatarLetter}
            </div>

            {(candidate.headline || candidate.currentTitle) && (
              <p className="cc-headline-text" title={candidate.headline || candidate.currentTitle}>
                <HighlightText text={candidate.headline || candidate.currentTitle} keywords={allHighlightKeywords} />
              </p>
            )}

            {/* Phone reveal / Call action */}
            {candidate.phone ? (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                {revealedPhone ? (
                  <a
                    href={`tel:${candidate.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="cc-btn-phone revealed"
                    title="Click to call candidate"
                  >
                    <FiPhoneCall size={13} />
                    <span>{candidate.phone}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    className="cc-btn-phone"
                    onClick={(e) => { e.stopPropagation(); setRevealedPhone(true); }}
                  >
                    <FiPhone size={13} />
                    <span>View phone number</span>
                  </button>
                )}
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  Verified phone & email
                </span>
              </div>
            ) : (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {candidate.email ? "Email verified" : "Contact on request"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Meta & Action Bar */}
        <div className="cc-card-footer">
          <div className="cc-footer-left">
            <span className="cc-footer-item" title="Profile views">
              <FiEye size={13} color="#64748b" /> {candidate.profileViews || 0}
            </span>

            <span className="cc-footer-item" title="CV downloads count">
              <FiDownload size={13} color="#64748b" /> {candidate.cvDownloads ?? candidate.resumeDownloads ?? candidate.recruiterActions ?? 0}
            </span>

            {hasResume && (
              <span
                className="cc-footer-item"
                title="CV Uploaded"
                style={{ color: "#0284c7", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}
              >
                <FiPaperclip size={12} /> CV
              </span>
            )}

            {modifiedTime && (
              <span className="cc-footer-item">
                Modified {modifiedTime}
              </span>
            )}

            {activeTime && (
              <span className="cc-footer-item">
                Active {activeTime}
              </span>
            )}
          </div>

          <div className="cc-footer-actions">
            {candidate.email && (
              <button
                type="button"
                className="cc-action-btn"
                onClick={handleEmail}
                title={`Send email to ${candidate.email}`}
              >
                <FiMail size={13} />
                <span>Email</span>
              </button>
            )}

            {isFolderContext ? (
              <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  type="button"
                  className="cc-action-btn"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  title="More actions"
                >
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
              <button
                type="button"
                className="cc-action-btn"
                onClick={(e) => { e.stopPropagation(); onAddToFolder(candidate); }}
                title="Save to folder"
              >
                <FiFolderPlus size={13} />
                <span>Folder</span>
              </button>
            )}

            {profileUrl && (
              <Link
                to={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-action-btn primary"
                onClick={(e) => e.stopPropagation()}
              >
                <FiEye size={13} />
                <span>View Profile</span>
              </Link>
            )}
          </div>
        </div>

        {customFooter && (
          <div style={{ paddingTop: 8 }}>
            {customFooter}
          </div>
        )}
      </motion.div>
    </>
  );
});

export default CandidateCard;