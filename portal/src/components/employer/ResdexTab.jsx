import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUsers,
  FiBriefcase,
  FiStar,
  FiTrendingUp,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiMail,
  FiUserPlus,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiRefreshCw,
  FiBookmark,
  FiAward,
  FiZap,
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiFolder,
} from "react-icons/fi";
import { FaUserTie, FaGraduationCap, FaDollarSign } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../../services/authService";
import api from "../../services/api";

const HERO_SLIDES = [
  {
    bg: "linear-gradient(135deg, #002366 0%, #1E5EFF 100%)",
    title: "Find Top Talent Faster",
    desc: "Access 50K+ verified profiles with AI-powered search filters.",
    cta: "Start Searching",
    icon: "search",
  },
  {
    bg: "linear-gradient(135deg, #0DBF7B 0%, #059669 100%)",
    title: "Resdex Insights Dashboard",
    desc: "Track your recruitment performance and optimize your hiring pipeline.",
    cta: "View Insights",
    icon: "trending",
  },
  {
    bg: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
    title: "AI Matching Engine",
    desc: "Get candidate suggestions based on your job requirements automatically.",
    cta: "Try AI Match",
    icon: "zap",
  },
];

const HERO_ICONS = { search: FiSearch, trending: FiTrendingUp, zap: FiZap };

const ACTIVITY_META = {
  SEARCH: { color: "#1E5EFF", icon: FiSearch },
  NVITE_SENT: { color: "#EC4899", icon: FiMail },
  RESUME_VIEW: { color: "#F59E0B", icon: FiEye },
  RESUME_DOWNLOAD: { color: "#0DBF7B", icon: FiDownload },
  FOLDER_CREATED: { color: "#8B5CF6", icon: FiFolder },
  CANDIDATE_ADDED: { color: "#0EA5E9", icon: FiUserPlus },
  JOB_POSTED: { color: "#059669", icon: FiBriefcase },
  CANDIDATE_APPLIED: { color: "#6366F1", icon: FiUsers },
};

const DEFAULT_ACTIVITY_COLOR = "#94a3b8";
const ACTIVITY_PAGE_SIZE = 5;

const timeAgo = (date) => {
  if (!date) return "Just now";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const renderActivityText = (text = "") => {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    return idx % 2 === 1 ? (
      <strong key={idx} style={{ color: "#0a1628", fontWeight: 700 }}>
        {part}
      </strong>
    ) : (
      <span key={idx}>{part}</span>
    );
  });
};

const formatCompact = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
};

export default function ResdexTab({ isRecruiter = false, overview = null }) {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const searchPerPage = 3;
  const folderPerPage = 3;
  const recentPerPage = 4;

  // Real data states
  const [quotaUsage, setQuotaUsage] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [folders, setFolders] = useState([]);

  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalItems, setActivityTotalItems] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);
  const [copiedSearchId, setCopiedSearchId] = useState(null);
  const [modal, setModal] = useState({
    open: false,
    type: null,
    search: null,
    value: "",
  });

  const fetchActivities = useCallback(async (page = 1) => {
    setActivityLoading(true);
    setActivityError(false);
    try {
      const res = await authService.getRecruiterActivity(
        page,
        ACTIVITY_PAGE_SIZE,
      );
      if (res?.success) {
        setActivities(res.data?.items || []);
        setActivityPage(res.data?.pagination?.page || page);
        setActivityTotalPages(res.data?.pagination?.totalPages || 1);
        setActivityTotalItems(res.data?.pagination?.totalItems || 0);
      } else {
        setActivities([]);
        setActivityError(true);
      }
    } catch {
      setActivities([]);
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Fetch quota data
  const fetchQuota = useCallback(async () => {
    try {
      const res = await authService.getQuotaUsage();
      if (res?.success) setQuotaUsage(res.data);
    } catch {}
  }, []);

  // Fetch saved searches
  const fetchSavedSearches = useCallback(async () => {
    try {
      const res = await api.get("/company-panel/resdex/searches");
      const items = res?.data?.data || res?.data?.searches || [];
      setSavedSearches(Array.isArray(items) ? items : []);
    } catch {}
  }, []);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const res = await api.get("/company-panel/folders");
      const items = res?.data?.data || res?.data?.folders || [];
      setFolders(Array.isArray(items) ? items : []);
    } catch {}
  }, []);

  const handleRunSearch = useCallback(
    (s) => {
      navigate("/resume-search", {
        state: { savedFilters: s.filters, searchName: s.name || s.searchName },
      });
    },
    [navigate],
  );

  const handleRenameSearch = useCallback(
    async (s) => {
      const newName = window.prompt(
        "Enter new name for this search:",
        s.name || s.searchName,
      );
      if (!newName || !newName.trim()) return;
      try {
        await authService.updateResdexSearch(s._id || s.id, {
          name: newName.trim(),
        });
        fetchSavedSearches();
      } catch (err) {
        console.error("Failed to rename search:", err);
      }
    },
    [fetchSavedSearches],
  );

  const handleDuplicateSearch = useCallback(
    async (s) => {
      const newName = (s.name || s.searchName) + " (Copy)";
      try {
        await authService.saveResdexSearch({
          name: newName,
          filters: s.filters,
          isPinned: false,
        });
        fetchSavedSearches();
      } catch (err) {
        console.error("Failed to duplicate search:", err);
      }
    },
    [fetchSavedSearches],
  );

  const handleDeleteSearch = useCallback((s) => {
    setModal({
      open: true,
      type: "delete",
      search: s,
      value: "",
    });
  }, []);

  const handleCopySearchName = useCallback(async (s) => {
    const searchName = s.name || s.searchName || "";
    const searchId = s._id || s.id;

    if (!searchName) return;

    try {
      await navigator.clipboard.writeText(searchName);

      setCopiedSearchId(searchId);

      setTimeout(() => {
        setCopiedSearchId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy search name:", err);
    }
  }, []);

  useEffect(() => {
    fetchActivities(1);
    fetchQuota();
    fetchSavedSearches();
    fetchFolders();
  }, [fetchActivities, fetchQuota, fetchSavedSearches, fetchFolders]);

  // Derive recently viewed from activity feed (RESUME_VIEW events)
  const recentlyViewed = useMemo(() => {
    return activities
      .filter((a) => a.action === "RESUME_VIEW")
      .slice(0, recentPerPage)
      .map((a) => ({
        name: a.candidateName || a.meta?.candidateName || "Candidate",
        role: a.meta?.role || a.meta?.title || "",
        exp: a.meta?.experience || "",
        skills: a.meta?.skills || [],
        viewed: timeAgo(a.createdAt),
        avatar: (a.candidateName || "CA")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }));
  }, [activities, recentPerPage]);

  useEffect(() => {
    const t = setInterval(
      () => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  const handleModalSubmit = async () => {
    const { type, search, value } = modal;

    if (!search) return;

    try {
      if (type === "rename") {
        const newName = value.trim();

        if (!newName) return;

        await authService.updateResdexSearch(search._id || search.id, {
          name: newName,
        });
      }

      if (type === "delete") {
        await authService.deleteResdexSearch(search._id || search.id);
      }

      setModal({
        open: false,
        type: null,
        search: null,
        value: "",
      });

      fetchSavedSearches();
    } catch (err) {
      console.error(
        type === "rename"
          ? "Failed to rename search:"
          : "Failed to delete search:",
        err,
      );
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="ap-hero">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            className="ap-hero-slide"
            style={{ background: HERO_SLIDES[heroIdx].bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="ap-hero-content">
              <h2>{HERO_SLIDES[heroIdx].title}</h2>
              <p>{HERO_SLIDES[heroIdx].desc}</p>
              <button className="ap-hero-btn">
                {React.createElement(
                  HERO_ICONS[HERO_SLIDES[heroIdx].icon] || FiSearch,
                  { size: 16 },
                )}{" "}
                {HERO_SLIDES[heroIdx].cta}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        <button
          className="ap-hero-arrow left"
          onClick={() =>
            setHeroIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
          }
        >
          <FiChevronLeft size={18} />
        </button>
        <button
          className="ap-hero-arrow right"
          onClick={() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length)}
        >
          <FiChevronRight size={18} />
        </button>
        <div className="ap-hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ap-hero-dot${i === heroIdx ? " active" : ""}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </div>

      {/* Welcome */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 12,
            textAlign: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#0a1628",
                margin: "0 0 4px",
              }}
            >
              Welcome back,{" "}
              {
                (
                  JSON.parse(localStorage.getItem("employerUser") || "{}")
                    ?.companyName ||
                  JSON.parse(localStorage.getItem("employerUser") || "{}")
                    ?.name ||
                  "User"
                ).split(" ")[0]
              }{" "}
              <span style={{ color: "#1E5EFF" }}>👋</span>
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
              {overview ? (
                <>
                  {overview.activeJobs ?? 0} active jobs.{" "}
                  <strong style={{ color: "#0DBF7B" }}>
                    {overview.shortlisted ?? 0}
                  </strong>{" "}
                  shortlisted.{" "}
                  <strong style={{ color: "#1E5EFF" }}>
                    {overview.totalApplications ?? 0}
                  </strong>{" "}
                  total applications.
                </>
              ) : (
                "Loading your stats..."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quota */}
      <h3 className="ap-section-title" style={{ marginBottom: 4 }}>
        Quota usage
      </h3>
      <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 20 }}>
        Track your and your company's quota
      </p>

      {!quotaUsage ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
          Loading quota...
        </div>
      ) : (
        <>
          {isRecruiter ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[
                {
                  type: "RESDEX",
                  label: "CV Access",
                  data: quotaUsage?.cvAccess,
                  icon: FiDownload,
                  color: "#1E5EFF",
                },
                {
                  type: "RESDEX",
                  label: "NVite",
                  data: quotaUsage?.nvite,
                  icon: FiDownload,
                  color: "#1E5EFF",
                },
                {
                  type: "JOB POSTING",
                  label: "",
                  data: quotaUsage?.jobPosting,
                  icon: FiBriefcase,
                  color: "#1E5EFF",
                },
              ].map((q, i) => {
                const data = q.data || {
                  total: 0,
                  usedByAll: 0,
                  left: 0,
                  usedByYou: null,
                };
                const pct =
                  data.total > 0
                    ? Math.min(100, (data.usedByAll / data.total) * 100)
                    : 0;
                return (
                  <motion.div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{
                          color: q.color,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {q.type}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {q.data?.badge || "OVERALL"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 24,
                      }}
                    >
                      <q.icon size={20} color="#64748b" />
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {data.total.toLocaleString("en-IN")} {q.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: "#475569" }}>
                        {data.usedByAll.toLocaleString("en-IN")} used by all
                      </span>
                      <span style={{ color: "#64748b" }}>
                        {data.left.toLocaleString("en-IN")} left
                      </span>
                    </div>

                    <div
                      style={{
                        height: 6,
                        background: "#e2e8f0",
                        borderRadius: 3,
                        marginBottom: 16,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "#38bdf8",
                          width: `${pct}%`,
                          borderRadius: 3,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.85rem",
                        color: "#475569",
                      }}
                    >
                      <FaUserTie size={13} color="#94a3b8" />
                      <span>
                        {data.usedByYou === null
                          ? "None used by you"
                          : data.usedByYou === 0
                            ? "None used by you"
                            : `${data.usedByYou.toLocaleString("en-IN")} used by you`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                marginBottom: 24,
                margin: "0 -10px",
              }}
            >
              {/* <button
                onClick={() =>
                  document
                    .getElementById("client-quota-scroll")
                    ?.scrollBy({ left: -320, behavior: "smooth" })
                }
                style={{
                  position: "absolute",
                  left: -5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
              >
                <FiChevronLeft size={22} color="#475569" />
              </button> */}

              <div
                id="client-quota-scroll"
                style={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 16,
                  scrollBehavior: "smooth",
                  padding: "10px 10px",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                <style>{`#client-quota-scroll::-webkit-scrollbar { display: none; }`}</style>
                {[
                  {
                    type: "RESDEX",
                    label: "CV Access",
                    data: quotaUsage?.cvAccess,
                    icon: FiFolder,
                    color: "#1E5EFF",
                    badge: quotaUsage?.cvAccess?.badge || "OVERALL",
                    licensesAssigned:
                      quotaUsage?.cvAccess?.licensesAssigned ||
                      "0/1 users assigned",
                  },
                  {
                    type: "RESDEX",
                    label: "NVite",
                    data: quotaUsage?.nvite,
                    icon: FiFolder,
                    color: "#1E5EFF",
                    badge: quotaUsage?.nvite?.badge || "OVERALL",
                    licensesAssigned:
                      quotaUsage?.nvite?.licensesAssigned ||
                      "0/1 users assigned",
                  },
                  {
                    type: "JOB POSTING",
                    label: "Hot Vacancy",
                    data: quotaUsage?.jobPosting,
                    icon: FiFolder,
                    color: "#1E5EFF",
                    badge: quotaUsage?.jobPosting?.badge || "OVERALL",
                    licensesAssigned:
                      quotaUsage?.jobPosting?.licensesAssigned ||
                      "0/1 users assigned",
                  },
                ].map((q, i) => {
                  const data = q.data || {
                    total: 0,
                    usedByAll: 0,
                    left: 0,
                    usedByYou: null,
                  };
                  const pct =
                    data.total > 0
                      ? Math.min(100, (data.usedByAll / data.total) * 100)
                      : 0;
                  return (
                    <motion.div
                      key={i}
                      style={{
                        flex: "0 0 340px",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "24px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 24,
                        }}
                      >
                        <span
                          style={{
                            color: q.color,
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                        >
                          {q.type}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            padding: "3px 8px",
                            borderRadius: 4,
                          }}
                        >
                          {q.badge}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 32,
                        }}
                      >
                        <q.icon size={22} color="#64748b" />
                        <span
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {data.total.toLocaleString("en-IN")} {q.label}
                        </span>
                        <FiCheckCircle
                          size={15}
                          color="#94a3b8"
                          style={{ marginTop: 2 }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.9rem",
                          marginBottom: 12,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ color: "#0f172a" }}>
                          {data.usedByAll.toLocaleString("en-IN")} used
                        </span>
                        <span style={{ color: "#64748b" }}>
                          {data.left.toLocaleString("en-IN")} left
                        </span>
                      </div>

                      <div
                        style={{
                          height: 6,
                          background: "#e0f2fe",
                          borderRadius: 3,
                          marginBottom: 20,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "#3b82f6",
                            width: `${pct}%`,
                            borderRadius: 3,
                          }}
                        />
                      </div>

                      <div
                        onClick={() =>
                          navigate("/employer-dashboard/manage-users")
                        }
                        style={{
                          background: "#f0f9ff",
                          color: "#0369a1",
                          padding: "10px 14px",
                          borderRadius: 8,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <span>{q.licensesAssigned}</span>
                        <FiChevronRight size={18} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* <button
                onClick={() =>
                  document
                    .getElementById("client-quota-scroll")
                    ?.scrollBy({ left: 320, behavior: "smooth" })
                }
                style={{
                  position: "absolute",
                  right: -5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
              >
                <FiChevronRight size={22} color="#475569" />
              </button> */}
            </div>
          )}
        </>
      )}

      {/* Saved Searches */}
      <h3 className="ap-section-title">Saved Searches</h3>
      <p className="ap-section-sub">
        Quick access to your most important candidate searches.
      </p>
      <div
        className="ap-card"
        style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}
      >
        <div className="ap-table-wrap" style={{ border: "none" }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>Search Name</th>
                <th>Created</th>
                <th>Profiles Found</th>
                <th>Last Used</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedSearches.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    No saved searches yet
                  </td>
                </tr>
              ) : (
                savedSearches
                  .slice(
                    (searchPage - 1) * searchPerPage,
                    searchPage * searchPerPage,
                  )
                  .map((s, i) => (
                    <motion.tr
                      key={s._id || s.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td style={{ fontWeight: 700, color: "#0a1628" }}>
                        {s.name || s.searchName || "Search"}
                      </td>
                      <td style={{ color: "#64748b" }}>
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <span className="ap-pill ap-pill-blue">
                          {s.resultCount ?? s.profileCount ?? s.profiles ?? "—"}{" "}
                          profiles
                        </span>
                      </td>
                      <td style={{ color: "#94a3b8" }}>
                        {s.lastRunAt
                          ? timeAgo(s.lastRunAt)
                          : s.updatedAt
                            ? timeAgo(s.updatedAt)
                            : "—"}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="ap-btn"
                            style={{
                              padding: "5px 7px",
                              border: "none",
                              background: "#f8fafc",
                            }}
                            title="Open"
                            onClick={() => handleRunSearch(s)}
                          >
                            <FiEye size={13} />
                          </button>
                          <button
                            className="ap-btn"
                            style={{
                              padding: "5px 7px",
                              border: "none",
                              background:
                                copiedSearchId === (s._id || s.id)
                                  ? "#ecfdf5"
                                  : "#f8fafc",
                              color:
                                copiedSearchId === (s._id || s.id)
                                  ? "#059669"
                                  : "#475569",
                              transition: "all 0.2s ease",
                            }}
                            title={
                              copiedSearchId === (s._id || s.id)
                                ? "Copied!"
                                : "Copy search name"
                            }
                            onClick={() => handleCopySearchName(s)}
                          >
                            {copiedSearchId === (s._id || s.id) ? (
                              <FiCheckCircle size={13} />
                            ) : (
                              <FiCopy size={13} />
                            )}
                          </button>
                          <button
                            className="ap-btn"
                            style={{
                              padding: "5px 7px",
                              border: "none",
                              background: "#f8fafc",
                            }}
                            title="Delete"
                            onClick={() => handleDeleteSearch(s)}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            className="ap-btn"
            style={{
              gap: 6,
              color: "#1E5EFF",
              borderColor: "#ccdaff",
              background: "#EEF4FF",
            }}
            onClick={() => navigate("/resume-search")}
          >
            <FiSearch size={14} /> Search Again
          </button>
        </div>
      </div>

      {/* Recruiter Folders & Recently Viewed */}
      <div className="ap-grid-2" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">
              {isRecruiter ? "My Folders" : "Recruiter Folders"}
            </span>
          </div>
          <div className="ap-table-wrap" style={{ border: "none" }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Folder Name</th>
                  <th>Profiles</th>
                  <th>Owner</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {folders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      No folders yet
                    </td>
                  </tr>
                ) : (
                  folders
                    .slice(
                      (folderPage - 1) * folderPerPage,
                      folderPage * folderPerPage,
                    )
                    .map((f, i) => (
                      <tr key={f._id || f.id || i}>
                        <td style={{ fontWeight: 700, color: "#0a1628" }}>
                          {f.name}
                        </td>
                        <td>
                          <span className="ap-pill ap-pill-blue">
                            {f.candidateCount ?? f.candidates?.length ?? 0}
                          </span>
                        </td>
                        <td style={{ color: "#64748b" }}>
                          {f.ownerName || (typeof f.owner === 'object' ? f.owner?.name : f.owner) || (typeof f.createdBy === 'object' ? f.createdBy?.name : f.createdBy) || "—"}
                        </td>
                        <td style={{ color: "#94a3b8" }}>
                          {f.updatedAt ? timeAgo(f.updatedAt) : "—"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Recently Viewed Profiles</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentlyViewed.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 12px",
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                No recent profile views yet
              </div>
            ) : (
              recentlyViewed.map((p, i) => (
                <motion.div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    cursor: "pointer",
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ background: "#f1f5f9", x: 2 }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1E5EFF",
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {p.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#0a1628",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {p.role} · {p.exp}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      {p.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            color: "#1E5EFF",
                            background: "#EEF4FF",
                            padding: "1px 6px",
                            borderRadius: 99,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {p.viewed}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">Recent Recruiter Activity</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {activityTotalItems > 0 && !activityLoading && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                }}
              >
                {activityTotalItems > 1
                  ? `${activityTotalItems} activities`
                  : "1 activity"}
              </span>
            )}
            <button
              className="ap-btn"
              style={{ padding: "6px 12px" }}
              disabled={activityLoading}
              onClick={() => fetchActivities(activityPage)}
            >
              <FiRefreshCw
                size={13}
                className={activityLoading ? "ap-spin" : ""}
                style={activityLoading ? { marginRight: 4 } : {}}
              />{" "}
              Refresh
            </button>
          </div>
        </div>

        {activityLoading ? (
          <div className="ap-timeline" style={{ padding: "4px 0" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="ap-tl-item"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 12,
                      width: "65%",
                      background: "#f1f5f9",
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      width: "35%",
                      background: "#f8fafc",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activityError ? (
          <div
            style={{
              textAlign: "center",
              padding: "28px 12px",
              color: "#64748b",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: "0.85rem" }}>
              Could not load recruiter activity.
            </p>
            <button
              className="ap-btn"
              style={{ padding: "6px 14px", gap: 6 }}
              onClick={() => fetchActivities(activityPage)}
            >
              <FiRefreshCw size={13} /> Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 12px",
              color: "#94a3b8",
            }}
          >
            <FiClock size={22} style={{ marginBottom: 8, opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              No activity yet — searches, invites, resume downloads, folders,
              job posts and candidate applications will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="ap-timeline">
              {activities.map((a, i) => {
                const meta = ACTIVITY_META[a.action] || {
                  color: DEFAULT_ACTIVITY_COLOR,
                  icon: null,
                };
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={a._id || i}
                    className="ap-tl-item"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <div
                      className="ap-tl-dot"
                      style={{ background: meta.color }}
                    >
                      {Icon && (
                        <span
                          style={{
                            position: "absolute",
                            right: -6,
                            bottom: -6,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#fff",
                            border: `1.5px solid ${meta.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={9} color={meta.color} />
                        </span>
                      )}
                    </div>
                    <div className="ap-tl-time">{timeAgo(a.createdAt)}</div>
                    <p className="ap-tl-text">{renderActivityText(a.text)}</p>
                  </motion.div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                padding: "14px 16px 4px",
                borderTop: "1px solid #f1f5f9",
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                Page {activityPage} of {activityTotalPages}
                {activityTotalItems > 0 &&
                  ` · ${Math.min((activityPage - 1) * ACTIVITY_PAGE_SIZE + 1, activityTotalItems)}–${Math.min(activityPage * ACTIVITY_PAGE_SIZE, activityTotalItems)} of ${activityTotalItems}`}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  className="ap-btn"
                  style={{ padding: "5px 10px", gap: 4 }}
                  disabled={activityPage <= 1}
                  onClick={() => fetchActivities(activityPage - 1)}
                >
                  <FiChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: activityTotalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === activityTotalPages ||
                      Math.abs(p - activityPage) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`gap-${idx}`}
                        style={{
                          fontSize: "0.72rem",
                          color: "#94a3b8",
                          padding: "0 2px",
                        }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className="ap-btn"
                        style={
                          p === activityPage
                            ? {
                                padding: "5px 10px",
                                background: "#1E5EFF",
                                color: "#fff",
                                borderColor: "#1E5EFF",
                                fontWeight: 700,
                              }
                            : { padding: "5px 10px" }
                        }
                        onClick={() => fetchActivities(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  className="ap-btn"
                  style={{ padding: "5px 10px", gap: 4 }}
                  disabled={activityPage >= activityTotalPages}
                  onClick={() => fetchActivities(activityPage + 1)}
                >
                  Next <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() =>
              setModal({
                open: false,
                type: null,
                search: null,
                value: "",
              })
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 500,
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    lineHeight: 1.3,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {modal.type === "rename" ? "Rename Search" : "Delete Search"}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setModal({
                      open: false,
                      type: null,
                      search: null,
                      value: "",
                    })
                  }
                  style={{
                    width: 38,
                    height: 38,
                    padding: 0,
                    border: "none",
                    background: "#f8fafc",
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    flexShrink: 0,
                  }}
                >
                  <FiX size={19} />
                </button>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "26px 24px 28px",
                }}
              >
                {modal.type === "rename" ? (
                  <>
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "0.88rem",
                        lineHeight: 1.5,
                        color: "#64748b",
                      }}
                    >
                      Enter a new name for this saved search.
                    </p>

                    <input
                      autoFocus
                      value={modal.value}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleModalSubmit();
                        }

                        if (e.key === "Escape") {
                          setModal({
                            open: false,
                            type: null,
                            search: null,
                            value: "",
                          });
                        }
                      }}
                      placeholder="Search name"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        height: 44,
                        padding: "0 13px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 9,
                        outline: "none",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                      }}
                    />
                  </>
                ) : (
                  <>
                    {/* Delete Icon */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#fef2f2",
                        color: "#ef1f2f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                      }}
                    >
                      <FiTrash2 size={23} strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        margin: "0 0 8px",
                        fontSize: "1rem",
                        lineHeight: 1.4,
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Delete this saved search?
                    </h4>

                    {/* Description */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        lineHeight: 1.6,
                        color: "#64748b",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Are you sure you want to delete{" "}
                      <strong
                        style={{
                          color: "#0f172a",
                          fontWeight: 700,
                        }}
                      >
                        "{modal.search?.name || modal.search?.searchName}"
                      </strong>
                      ? This action cannot be undone.
                    </p>
                  </>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  padding: "16px 24px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#f8fafc",
                }}
              >
                <button
                  type="button"
                  className="ap-btn"
                  onClick={() =>
                    setModal({
                      open: false,
                      type: null,
                      search: null,
                      value: "",
                    })
                  }
                  style={{
                    minWidth: 90,
                    height: 44,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9,
                    background: "#fff",
                    border: "1px solid #dbe3ef",
                    color: "#475569",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="ap-btn"
                  onClick={handleModalSubmit}
                  style={{
                    minWidth: 88,
                    height: 44,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9,
                    background: modal.type === "delete" ? "#ef1f2f" : "#1E5EFF",
                    color: "#fff",
                    border: "1px solid",
                    borderColor:
                      modal.type === "delete" ? "#ef1f2f" : "#1E5EFF",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {modal.type === "delete" ? "Delete" : "Rename"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
