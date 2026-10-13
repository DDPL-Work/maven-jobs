import React, { useState, useEffect } from "react";
import {
  FiMapPin,
  FiBriefcase,
  FiUsers,
  FiStar,
  FiGlobe,
  FiCalendar,
  FiArrowLeft,
  FiHeart,
  FiExternalLink,
  FiSearch,
  FiChevronRight,
  FiClock,
  FiPlus,
  FiCheckCircle,
  FiInfo,
  FiSend,
  FiBookmark,
  FiArrowRight,
  FiLogOut,
  FiX,
  FiAward,
  FiTrendingUp,
  FiZap,
  FiShield,
  FiCoffee,
  FiDollarSign,
  FiMonitor,
  FiSun,
  FiGift,
  FiHeadphones,
  FiThumbsUp,
} from "react-icons/fi";
import { FaRupeeSign, FaStar, FaRegStar } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import authService from "../../../../services/authService";
import SkeletonPage from "../../../../components/Skeleton";
import LandingHeader from "../../../../layout/candidate/LandingHeader";
import LandingFooter from "../../../../layout/candidate/LandingFooter";
import ReviewModal from "../../../../components/ReviewModal";
import "./Jobprofile.css";

const PERK_MAP = {
  "Health Insurance": { icon: FiShield, color: "#10b981", bg: "#ECFDF5" },
  Gym: { icon: FiHeart, color: "#ef4444", bg: "#FEF2F2" },
  Food: { icon: FiCoffee, color: "#f59e0b", bg: "#FFFBEB" },
  Cab: { icon: FiMapPin, color: "#6366f1", bg: "#EEF2FF" },
  Bonus: { icon: FiDollarSign, color: "#10b981", bg: "#ECFDF5" },
  "Flexible Hours": { icon: FiClock, color: "#0ea5e9", bg: "#F0F9FF" },
  Remote: { icon: FiMonitor, color: "#8b5cf6", bg: "#F5F3FF" },
  "Stock Options": { icon: FiTrendingUp, color: "#002366", bg: "#F8FAFC" },
  Learning: { icon: FiBookmark, color: "#f59e0b", bg: "#FFFBEB" },
  Vacation: { icon: FiSun, color: "#0ea5e9", bg: "#F0F9FF" },
  Gifts: { icon: FiGift, color: "#ef4444", bg: "#FEF2F2" },
  Headphones: { icon: FiHeadphones, color: "#6366f1", bg: "#EEF2FF" },
  Wellness: { icon: FiThumbsUp, color: "#10b981", bg: "#ECFDF5" },
};

const normalizeUrl = (url) => {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
};

const Jobprofile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [jobSearch, setJobSearch] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState({});
  const [saveLoading, setSaveLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fallbackCoverImage =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200";

  const [company, setCompany] = useState({
    name: "",
    fullName: "",
    logo: "",
    bg: "#002366",
    accent: "#10b981",
    industry: "",
    type: "",
    size: "",
    founded: "",
    website: "",
    location: "",
    followers: "—",
    rating: 0,
    reviews: "0",
    reviewsList: [],
    coverImage: fallbackCoverImage,
    tags: [],
    about: "",
    departments: [],
    benefits: [],
    jobs: [],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = user
          ? await authService
            .getCompanyDetail(id)
            .catch(() => authService.getPublicCompanyDetail(id))
          : await authService.getPublicCompanyDetail(id);
        if (res?.success && res?.data) {
          const c = res.data.company;
          const jobs = res.data.jobs || [];

          // Build departments from jobs
          const deptMap = {};
          jobs.forEach((j) => {
            const d = j.department || "General";
            deptMap[d] = (deptMap[d] || 0) + 1;
          });
          const departments = Object.entries(deptMap).map(
            ([name, openings]) => ({ name, openings }),
          );

          // Set follow state from API
          setIsFollowing(c.isFollowing || false);
          setFollowersCount(c.followersCount || 0);

          const reviews = res.data.reviews || [];
          const totalRatings = reviews.reduce(
            (sum, r) => sum + Number(r.rating || 0),
            0,
          );
          const avgRating =
            reviews.length > 0
              ? Math.round((totalRatings / reviews.length) * 10) / 10
              : 0;

          setCompany({
            name: c.name || "",
            fullName: c.fullName || c.name || "",
            logo: c.logoUrl || c.logo || (c.name || "M")[0].toUpperCase(),
            bg: c.color || "#002366",
            accent: "#10b981",
            industry: c.industry || "General",
            type: c.type || "Private",
            size: c.size || "10–50",
            founded: c.founded || "",
            website: normalizeUrl(c.website || ""),
            location: c.locationFull || c.location || "",
            rating: avgRating,
            reviews: reviews.length,
            reviewsList: reviews,
            coverImage: c.coverImageUrl || c.coverImage || fallbackCoverImage,
            tags: [c.type || "Private", c.industry || "Corporate"].filter(
              Boolean,
            ),
            about:
              c.about ||
              `${c.name} is a leading company in the ${c.industry || "technology"} industry, committed to excellence and innovation.`,
            mission: c.mission || "",
            vision: c.vision || "",
            whyJoinUs: c.whyJoinUs || [],
            activelyHiring: c.activelyHiring !== false,
            activeJobCount: c.activeJobCount || jobs.length,
            departments,
            benefits: (c.perks || []).map((p) => {
              const match = PERK_MAP[p.label || p];
              const IconComp = match?.icon || FiStar;
              return {
                name: p.label || p,
                icon: <IconComp size={24} />,
                color: match?.color || "#64748B",
                bg: match?.bg || "#F1F5F9",
              };
            }),
            jobs: jobs.map((j) => ({
              id: j.id,
              title: j.title,
              exp: j.experience || "0–3 Yrs",
              loc: j.location || c.location || "",
              posted: j.postedAt || "Recently",
              salary: j.salary || "Not disclosed",
              desc:
                j.summary ||
                j.description ||
                "Join our team and work on exciting projects.",
              tags: j.skills?.length > 0 ? j.skills : ["General"],
              hasApplied: j.hasApplied || false,
            })),
          });
        }
      } catch (err) {
        console.error("Failed to fetch company:", err);
        setError("Failed to load company details");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  // Production-ready: toggle follow via backend API
  const handleFollowToggle = async () => {
    if (!user) return;
    if (followLoading) return;
    setFollowLoading(true);
    const newFollow = !isFollowing;
    // Optimistic update
    setIsFollowing(newFollow);
    setFollowersCount((prev) => (newFollow ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await authService.followCompany(id, newFollow);
    } catch (err) {
      console.error("Follow toggle failed:", err);
      // Rollback on error
      setIsFollowing(!newFollow);
      setFollowersCount((prev) =>
        newFollow ? Math.max(0, prev - 1) : prev + 1,
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // Production-ready: save job via backend API
  const toggleSave = async (jobId) => {
    if (!user) return;
    if (saveLoading[jobId]) return;
    setSaveLoading((prev) => ({ ...prev, [jobId]: true }));
    const isCurrentlySaved = !!savedJobs[jobId];
    // Optimistic update
    setSavedJobs((prev) => ({ ...prev, [jobId]: !isCurrentlySaved }));
    try {
      const res = await authService.saveJob(jobId, !isCurrentlySaved);
      if (res?.success && res?.data?.savedJobIds) {
        const newMap = {};
        res.data.savedJobIds.forEach((sid) => (newMap[sid] = true));
        setSavedJobs(newMap);
      }
    } catch (err) {
      console.error("Save job failed:", err);
      // Rollback on error
      setSavedJobs((prev) => ({ ...prev, [jobId]: isCurrentlySaved }));
    } finally {
      setSaveLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const starCounts = [0, 0, 0, 0, 0];
  const reviewsCount = company.reviewsList.length;
  reviewsCount > 0 &&
    company.reviewsList.forEach((r) => {
      const s = Math.round(r.rating || 0);
      if (s >= 1 && s <= 5) starCounts[s - 1]++;
    });
  const ratingLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];
  const isLogoUrl = String(company.logo || "").startsWith("http");

  if (loading) {
    return <SkeletonPage variant="detail" />;
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#EEF2F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#EF4444" }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>
            {error}
          </div>
          <button
            onClick={() => navigate("/companies")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#002366",
              color: "white",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="jp-root"
      style={{
        minHeight: "100vh",
        background: "#EEF2F9",
        fontFamily: "'DM Sans', sans-serif",
        color: "#0A1628",
        paddingTop: 72,
      }}
    >
      {/* ─── Navbar ─────────────────────────────────────── */}
      <LandingHeader />

      <div className="jp-container">
        {/* ─── Profile Card ─────────────────────────────── */}
        <div className="jp-profile-card">
          {/* Cover */}
          <div className="jp-cover-wrap">
            <img
              src={company.coverImage}
              alt="Cover"
              className="jp-cover-img"
            />
            <div className="jp-cover-overlay" />
            <button
              onClick={() => navigate(-1)}
              className="jp-cover-back-btn"
              aria-label="Go back"
            >
              <FiArrowLeft size={18} />
            </button>
            {/* Tags on cover */}
            <div className="jp-cover-tags">
              {company.tags.map((tag) => (
                <span
                  key={tag}
                  className="jp-cover-tag"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Logo + Info Row */}
          <div className="jp-profile-info">
            {/* Logo */}
            <div className="jp-profile-logo">
              <div
                className="jp-profile-logo-inner"
                style={{ background: company.bg }}
              >
                {isLogoUrl ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="jp-profile-logo-img"
                  />
                ) : (
                  company.logo
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="jp-action-btns">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading || !user}
                className="jp-follow-btn"
                style={{
                  background: isFollowing ? "#E8FBF3" : "#002366",
                  color: isFollowing ? "#0DBF7B" : "white",
                  border: isFollowing
                    ? "1.5px solid #0DBF7B"
                    : "1.5px solid #002366",
                  cursor: followLoading ? "wait" : "pointer",
                  opacity: followLoading ? 0.7 : 1,
                }}
              >
                {isFollowing ? (
                  <FiCheckCircle size={15} />
                ) : (
                  <FiPlus size={15} />
                )}
                {isFollowing ? "Following" : "Follow"}
              </button>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jp-website-link"
                >
                  <FiGlobe size={15} /> Website <FiExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Company Name & Meta */}
            <div className="jp-header-text">
              <div className="jp-name-row">
                <h1 className="jp-company-title">
                  {company.name}
                </h1>
                <span className="jp-hiring-badge">
                  Actively Hiring
                </span>
              </div>
              <p className="jp-company-subtitle">
                {company.fullName} · {company.industry}
              </p>

              {/* Meta Pills */}
              <div className="jp-meta-pills">
                {[
                  { icon: <FiMapPin size={13} />, text: company.location },
                  {
                    icon: <FiUsers size={13} />,
                    text: `${company.size} employees`,
                  },
                  {
                    icon: <FiCalendar size={13} />,
                    text: `Founded ${company.founded}`,
                  },
                  {
                    icon: <FiCheckCircle size={13} />,
                    text: `${followersCount} followers`,
                    highlight: true,
                  },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`jp-meta-pill${m.highlight ? " jp-meta-pill--highlight" : ""}`}
                  >
                    {m.icon} {m.text}
                  </div>
                ))}
                {/* Rating pill */}
                <div className="jp-meta-pill jp-meta-pill--rating">
                  <FaStar size={11} color="#F59E0B" />
                  {company.rating} · {company.reviews} reviews
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="jp-tabs-bar">
              {["Overview", "About", "Jobs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`jp-tab-btn${activeTab === tab ? " active" : ""}`}
                >
                  {tab}
                  {tab === "Jobs" && (
                    <span className="jp-tab-badge">
                      {company.jobs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Main Grid ──────────────────────────────────── */}
        <div className="jp-main-grid">
          {/* Left Column */}
          <div className="jp-left-col">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "Overview" && (
              <>
                {/* About */}
                <div className="jp-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#EEF4FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FiInfo size={16} color="#1E5EFF" />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "#0A1628",
                      }}
                    >
                      About {company.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      color: "#475569",
                      lineHeight: 1.75,
                      fontWeight: 500,
                      fontSize: "0.9rem",
                    }}
                  >
                    {company.about}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 20,
                    }}
                  >
                    {[
                      "Healthcare Planning",
                      "Hospital Architecture",
                      "MEP Design",
                      "Clinical Strategy",
                      "Operations Mgmt",
                    ].map((spec) => (
                      <span
                        key={spec}
                        style={{
                          background: "#EEF4FF",
                          color: "#1E5EFF",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "5px 12px",
                          borderRadius: 7,
                          border: "1px solid #CCDAFF",
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="jp-card">
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#0A1628",
                      marginBottom: 20,
                    }}
                  >
                    Employee Benefits
                  </h3>
                  <div className="jp-benefits-grid">
                    {company.benefits.map((ben) => (
                      <div key={ben.name} className="jp-benefit-card">
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: ben.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: ben.color,
                            marginBottom: 14,
                          }}
                        >
                          {ben.icon}
                        </div>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            color: "#0A1628",
                            lineHeight: 1.4,
                          }}
                        >
                          {ben.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Departments */}
                <div className="jp-card">
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#0A1628",
                      marginBottom: 16,
                    }}
                  >
                    Hiring Departments
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {company.departments.map((dept, i) => (
                      <div
                        key={i}
                        className="jp-dept-item"
                        onClick={() => setActiveTab("Jobs")}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#1E5EFF",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "#334155",
                            }}
                          >
                            {dept.name}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              background: "#EEF4FF",
                              color: "#1E5EFF",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "3px 10px",
                              borderRadius: 6,
                              border: "1px solid #CCDAFF",
                            }}
                          >
                            {dept.openings} open
                          </span>
                          <FiChevronRight size={15} color="#94A3B8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── JOBS TAB ── */}
            {activeTab === "Jobs" && (
              <>
                <div className="jp-jobs-header">
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      color: "#0A1628",
                      margin: 0,
                    }}
                  >
                    Active Openings
                    <span
                      style={{
                        marginLeft: 10,
                        background: "#002366",
                        color: "white",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      {company.jobs.length}
                    </span>
                  </h3>
                  <div className="jp-jobs-search-wrap">
                    <FiSearch
                      size={13}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94A3B8",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search Jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="jp-jobs-search-input"
                    />
                  </div>
                </div>

                {company.jobs
                  .filter((job) => {
                    if (!jobSearch.trim()) return true;
                    return job.title
                      .toLowerCase()
                      .includes(jobSearch.toLowerCase().trim());
                  })
                  .map((job) => (
                    <div
                      key={job.id}
                      className="jp-job-card"
                    >
                      {/* Top row */}
                      <div className="jp-job-top">
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            flexShrink: 0,
                            background: company.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 900,
                            fontSize: "1.3rem",
                            color: "white",
                            boxShadow: "0 4px 12px rgba(0,35,102,0.25)",
                          }}
                        >
                          {isLogoUrl ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            company.logo
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              fontWeight: 800,
                              fontSize: "1.05rem",
                              color: "#0A1628",
                              marginBottom: 5,
                              letterSpacing: "-0.02em",
                              wordBreak: "break-word",
                            }}
                          >
                            {job.title}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: "#64748B",
                              }}
                            >
                              {company.name}
                            </span>
                            <span
                              style={{
                                background: "#F0FDF4",
                                border: "1px solid #BBF7D0",
                                color: "#166534",
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <FaStar size={9} color="#16A34A" />{" "}
                              {company.rating}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94A3B8",
                                fontWeight: 600,
                              }}
                            >
                              ({company.reviews} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="jp-job-meta">
                        {[
                          { icon: <FiBriefcase size={13} />, text: job.exp },
                          { icon: <FaRupeeSign size={11} />, text: job.salary },
                          { icon: <FiMapPin size={13} />, text: job.loc },
                          { icon: <FiClock size={13} />, text: job.posted },
                        ].map((m, i) => (
                          <div
                            key={i}
                            className="jp-job-meta-item"
                          >
                            <span style={{ color: "#94A3B8", flexShrink: 0 }}>
                              {m.icon}
                            </span>
                            <span className="jp-job-meta-text">
                              {m.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      <div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748B",
                            lineHeight: 1.7,
                            fontWeight: 500,
                            marginBottom: expandedJobs[job.id] ? 8 : (job.desc && job.desc.length > 150 ? 4 : 18),
                            display: expandedJobs[job.id] ? "block" : "-webkit-box",
                            WebkitLineClamp: expandedJobs[job.id] ? "unset" : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {job.desc}
                        </p>
                        {job.desc && job.desc.length > 150 && (
                          <button
                            onClick={() => setExpandedJobs(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                            style={{
                              background: "none", border: "none", color: "#1E5EFF",
                              fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                              padding: 0, marginBottom: 18
                            }}
                          >
                            {expandedJobs[job.id] ? "Read Less" : "Read More"}
                          </button>
                        )}
                      </div>

                      {/* Tags + Actions */}
                      <div className="jp-job-tags-actions">
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {job.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: "0.75rem",
                                letterSpacing: "0.01em",
                                background: "#1e3a8a",
                                color: "white",
                                padding: "2px 6px",
                                borderRadius: "20px",
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div
                          className="jp-job-actions"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() => toggleSave(job.id)}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              border: "1.5px solid #E2E8F0",
                              background: savedJobs[job.id]
                                ? "#EEF4FF"
                                : "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: savedJobs[job.id] ? "#1E5EFF" : "#94A3B8",
                              cursor: "pointer",
                              transition: "all 0.18s",
                            }}
                          >
                            <FiBookmark
                              size={15}
                              style={{
                                fill: savedJobs[job.id] ? "#1E5EFF" : "none",
                              }}
                            />
                          </button>
                          <button
                            onClick={() => navigate(`/job/${job.id}`)}
                            style={{
                              padding: "9px 20px",
                              borderRadius: 10,
                              background: "#002366",
                              color: "white",
                              border: "none",
                              fontFamily: "'Sora', sans-serif",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              boxShadow: "0 4px 14px rgba(0,35,102,0.25)",
                              transition: "all 0.18s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#1E3A8A";
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#002366";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            Quick Apply <FiArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            )}

            {/* ── ABOUT TAB ── */}
            {activeTab === "About" && (
              <>
                <div className="jp-card">
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      color: "#0A1628",
                      marginBottom: 16,
                    }}
                  >
                    About {company.name}
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      lineHeight: 1.8,
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      marginBottom: 16,
                    }}
                  >
                    {company.about}
                  </p>
                  <p
                    style={{
                      color: "#475569",
                      lineHeight: 1.8,
                      fontWeight: 500,
                      fontSize: "0.9rem",
                    }}
                  >
                    Over the decades, Hosmac has successfully managed over 500+
                    projects across the globe, bringing together architectural
                    excellence and medical operational efficiency. Our team
                    consists of seasoned professionals dedicated to transforming
                    healthcare delivery.
                  </p>
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 24,
                      borderTop: "1px solid #F1F5F9",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 12,
                      }}
                    >
                      Specialties
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {[
                        "Healthcare Planning",
                        "Hospital Architecture",
                        "MEP Design",
                        "Clinical Strategy",
                        "Operations Management",
                        "Medical Equipment Planning",
                      ].map((spec) => (
                        <span
                          key={spec}
                          style={{
                            background: "#EEF4FF",
                            color: "#1E5EFF",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid #CCDAFF",
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="jp-highlights-grid">
                  {[
                    {
                      icon: <FiGlobe size={20} />,
                      title: "Global Presence",
                      desc: "Headquartered in Mumbai with operational footprints in Middle East and Africa.",
                      color: "#4F46E5",
                      bg: "#EEF2FF",
                      border: "#C7D2FE",
                    },
                    {
                      icon: <FiAward size={20} />,
                      title: "Quality Standards",
                      desc: "ISO 9001:2015 certified consulting firm ensuring top-tier medical excellence.",
                      color: "#059669",
                      bg: "#ECFDF5",
                      border: "#A7F3D0",
                    },
                    {
                      icon: <FiTrendingUp size={20} />,
                      title: "500+ Projects",
                      desc: "Successfully delivered projects across healthcare infrastructure globally.",
                      color: "#D97706",
                      bg: "#FFFBEB",
                      border: "#FDE68A",
                    },
                    {
                      icon: <FiZap size={20} />,
                      title: "Fast-Growing",
                      desc: "Rapidly expanding team with consistent year-on-year growth since 1996.",
                      color: "#DB2777",
                      bg: "#FDF2F8",
                      border: "#FBCFE8",
                    },
                  ].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        background: h.bg,
                        border: `1px solid ${h.border}`,
                        borderRadius: 18,
                        padding: "22px 24px",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: h.color,
                          marginBottom: 14,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                        }}
                      >
                        {h.icon}
                      </div>
                      <h4
                        style={{
                          fontFamily: "'Sora', sans-serif",
                          fontWeight: 800,
                          fontSize: "0.92rem",
                          color: "#0A1628",
                          marginBottom: 6,
                        }}
                      >
                        {h.title}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "#64748B",
                          fontWeight: 500,
                          lineHeight: 1.6,
                        }}
                      >
                        {h.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Company Info Table */}
                <div className="jp-card">
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#0A1628",
                      marginBottom: 20,
                    }}
                  >
                    Company Information
                  </h3>
                  <div className="jp-info-grid">
                    {[
                      { label: "Company Type", value: company.type },
                      { label: "Founded", value: company.founded },
                      { label: "Employees", value: company.size },
                      { label: "Industry", value: company.industry },
                      { label: "Headquarters", value: company.location },
                      {
                        label: "Website",
                        value: normalizeUrl(company.website),
                        isLink: true,
                      },
                    ].map((info) => (
                      <div
                        key={info.label}
                        style={{
                          padding: "14px 0",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.67rem",
                            fontWeight: 800,
                            color: "#94A3B8",
                            textTransform: "uppercase",
                            letterSpacing: "0.09em",
                            marginBottom: 5,
                          }}
                        >
                          {info.label}
                        </div>
                        {info.isLink && info.value ? (
                          <a
                            href={info.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "#1E5EFF",
                              textDecoration: "none",
                              wordBreak: "break-all",
                            }}
                          >
                            {info.value}
                          </a>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "#334155",
                            }}
                          >
                            {info.value || "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─── Right Sidebar ─────────────────────────── */}
          <div
            className="jp-sidebar"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "sticky",
              top: 88,
            }}
          >
            {/* Rating Widget */}
            <div className="jp-card">
              <h3
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#0A1628",
                  marginBottom: 20,
                }}
              >
                Reviews & Rating
              </h3>

              {/* Big Rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: "3rem",
                      fontWeight: 800,
                      color: "#0A1628",
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {company.rating}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    out of 5
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        size={16}
                        color={
                          s <= Math.round(company.rating)
                            ? "#F59E0B"
                            : "#E2E8F0"
                        }
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Based on {company.reviews} reviews
                  </div>
                </div>
              </div>

              {/* Star Distribution */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = starCounts[s - 1];
                  const pct =
                    reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                  return (
                    <div
                      key={s}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 2,
                          width: 64,
                          flexShrink: 0,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <FaStar
                            key={i}
                            size={11}
                            color={i <= s ? "#F59E0B" : "#E2E8F0"}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#F1F5F9",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#F59E0B",
                            borderRadius: 99,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#64748B",
                          width: 28,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 11,
                  border: "1.5px solid #CCDAFF",
                  background: "#EEF4FF",
                  color: "#1E5EFF",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#CCDAFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#EEF4FF";
                }}
              >
                <FiStar size={14} /> Write a Review
              </button>
            </div>

            {/* CTA Widget */}
            <div
              style={{
                borderRadius: 20,
                padding: "28px 24px",
                background: "#002366",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,35,102,0.28)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -20,
                  left: -20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(13,191,123,0.15)",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <FiZap size={18} color="white" />
                </div>
                <h3
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "white",
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Work at {company.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 500,
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Explore all openings and apply with your Maven profile
                  instantly.
                </p>
                <button
                  onClick={() => {
                    setActiveTab("Jobs");
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 11,
                    background: "#0DBF7B",
                    color: "white",
                    border: "none",
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 16px rgba(13,191,123,0.35)",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#059669";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#0DBF7B";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <FiSend size={15} /> View All Openings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────── */}
      <LandingFooter />

      {/* ─── Review Modal ──────────────────────────────── */}
      {showReviewModal && (
        <ReviewModal
          companyId={id}
          companyName={company.name}
          onClose={() => setShowReviewModal(false)}
          onSuccess={(nextReview) => {
            setCompany((current) => ({
              ...current,
              reviewsList: [nextReview, ...(current.reviewsList || [])],
              reviews: String(Number(current.reviews || 0) + 1),
            }));
          }}
        />
      )}
    </div>
  );
};

export default Jobprofile;
