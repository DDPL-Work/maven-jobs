import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiGlobe,
  FiDownload,
  FiClock,
  FiUser,
  FiPrinter,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiSend,
  FiShare2,
  FiVideo,
  FiBookmark,
  FiCheckCircle,
  FiPaperclip,
  FiEye,
  FiDollarSign,
} from "react-icons/fi";
import { FaWhatsapp, FaLinkedinIn } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import authService from "../../../../services/authService";
import EmployerHeader from "../../../../components/employer/EmployerHeader";
import "./PublicCandidateProfile.css";

const parseJSON = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const p = JSON.parse(str);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

export default function PublicCandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile_detail"); // 'profile_detail' | 'attached_cv'
  const [similarTab, setSimilarTab] = useState("profile_details"); // 'profile_details' | 'recruiters_viewed'
  const [similarCandidates, setSimilarCandidates] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  // List Context State
  const [listIds, setListIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [totalSearchCount, setTotalSearchCount] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Load Profile & AI Similar Profiles
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!candidateId) {
          setError("Invalid candidate ID");
          return;
        }

        const res = await authService.getPublicCandidateById(candidateId);
        if (!active) return;
        const p = res?.data?.profile;
        if (!p) {
          setError("Candidate not found");
          return;
        }
        setProfile(p);

        // Fetch List Context from Session
        const storedList = sessionStorage.getItem("maven_candidate_list");
        const storedSearch = sessionStorage.getItem("maven_search_text");
        const storedTotal = sessionStorage.getItem("maven_search_total");
        let activeSearch = "";
        
        if (storedList) {
          try {
            const parsed = JSON.parse(storedList);
            setListIds(parsed);
            setCurrentIndex(parsed.indexOf(candidateId));
          } catch (e) { }
        }
        if (storedSearch) {
          activeSearch = storedSearch;
          setSearchText(storedSearch);
        }
        if (storedTotal) {
          setTotalSearchCount(parseInt(storedTotal, 10));
        }

        // Fetch AI matched similar profiles
        setSimilarLoading(true);
        try {
          const simRes = await authService.getSimilarCandidates(candidateId, activeSearch);
          if (active && simRes?.data) {
            setSimilarCandidates(simRes.data);
          }
        } catch (simErr) {
          console.error("Failed to load similar candidates:", simErr);
        } finally {
          if (active) setSimilarLoading(false);
        }
      } catch (e) {
        if (!active) return;
        setError("Failed to load profile. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [candidateId]);

  const handleDownloadResume = useCallback(async () => {
    if (!candidateId || !profile?.resume?.url) return;
    setResumeLoading(true);
    try {
      const res = await authService.getCandidateResume(candidateId);
      if (res?.success && res?.data?.url) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } else {
        window.open(profile.resume.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      if (profile?.resume?.url) {
        window.open(profile.resume.url, "_blank", "noopener,noreferrer");
      }
    }
    setResumeLoading(false);
  }, [candidateId, profile]);

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        text: commentInput.trim(),
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      },
    ]);
    setCommentInput("");
    setShowCommentBox(false);
  };

  if (loading) return <ProfileSkeleton />;
  if (error || !profile) return <ErrorState message={error || "Candidate not found"} />;

  const workExperiences = parseJSON(profile.workExperiences);
  const educations = parseJSON(profile.educations);
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const candidateName = profile.user?.name || "Candidate";
  const avatarUrl = profile.profilePic?.url || profile.user?.avatar || "";

  // Dynamic counts
  const totalCount = totalSearchCount > 1 
    ? totalSearchCount.toLocaleString() 
    : (listIds.length > 0 ? listIds.length.toLocaleString() : "1");

  const searchKeywords = searchText.toLowerCase().split(/\s+/).filter(Boolean);
  const displayedSimilar = similarCandidates;

  const HighlightMatch = ({ text }) => {
    if (!text) return null;
    if (!searchKeywords.length) return <span>{text}</span>;
    // escape regex characters
    const escapedKeywords = searchKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escapedKeywords.join("|")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          searchKeywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
            <span key={i} className="pcp-highlight-text">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <>
      {/* 0. Employer Navigation Header */}
      <EmployerHeader activeTab="resdex" />

      <div className="pcp-page-wrapper">
        {/* 1. Top Breadcrumb & Profile Navigation Bar */}
        <div className="pcp-topbar">
          <div className="pcp-topbar-left">
            <Link to="/resdex" className="pcp-crumb-link">
              <FiUser size={14} />
              <span>View more</span>
            </Link>
            <span className="pcp-crumb-sep">&gt;</span>
          <span className="pcp-crumb-name">{candidateName}</span>
        </div>

        <div className="pcp-topbar-right">
          <button
            type="button"
            className="pcp-topbar-action-btn"
            onClick={() => window.print()}
          >
            <FiPrinter size={14} /> Print
          </button>
          <button
            type="button"
            className="pcp-topbar-action-btn"
            onClick={() => alert("Profile reported for review.")}
          >
            <FiFlag size={14} /> Report profile
          </button>
          <div className="pcp-nav-arrows">
            <button
              type="button"
              className="pcp-nav-btn"
              onClick={() => {
                if (currentIndex > 0) {
                  navigate(`/candidates/${listIds[currentIndex - 1]}`);
                } else {
                  navigate(-1);
                }
              }}
              disabled={currentIndex === 0}
              title="Previous Profile"
            >
              <FiChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              className="pcp-nav-btn"
              onClick={() => {
                if (currentIndex !== -1 && currentIndex < listIds.length - 1) {
                  navigate(`/candidates/${listIds[currentIndex + 1]}`);
                } else if (similarCandidates.length > 0) {
                  navigate(`/candidates/${similarCandidates[0].id}`);
                }
              }}
              disabled={currentIndex === listIds.length - 1 && similarCandidates.length === 0}
              title="Next Profile"
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Action Toolbar (Add to, NVite, Reminder, Forward, etc.) */}
      <div className="pcp-action-bar">
        <button
          type="button"
          className="pcp-act-btn"
          onClick={() => alert("Added to candidate folder.")}
        >
          <FiPlus size={14} /> Add to
        </button>

        <button
          type="button"
          className="pcp-act-btn"
          onClick={() => navigate("/resdex?tab=mivites", { state: { preSelectedCandidate: profile, startAtJobStep: true } })}
        >
          <FiSend size={14} /> Send MIvites
        </button>

        <button
          type="button"
          className="pcp-act-btn"
          onClick={() => alert("Reminder scheduled.")}
        >
          <FiClock size={14} /> Set reminder
        </button>

        <button
          type="button"
          className="pcp-act-btn"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            alert("Profile link copied to clipboard!");
          }}
        >
          <FiShare2 size={14} /> Forward
        </button>

        <button
          type="button"
          className="pcp-act-btn"
          onClick={() => alert("Video interview link generated.")}
        >
          <FiVideo size={14} /> Schedule video call
        </button>
      </div>

      {/* 3. Main Grid Body */}
      <div className="pcp-main-content">
        {/* Left Column: Candidate Main Profile Data */}
        <div className="pcp-left-col">
          {/* Hero Header Card */}
          <div className="pcp-card pcp-hero-card">
            <div className="pcp-avatar-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={candidateName}
                  className="pcp-avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=e2e8f0&color=475569`;
                  }}
                />
              ) : (
                <div className="pcp-avatar-placeholder">
                  {candidateName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="pcp-hero-details">
              <div className="pcp-name-row">
                <div>
                  <h1 className="pcp-candidate-name" style={{ margin: 0 }}>{candidateName}</h1>
                  {profile.headline && (
                    <div style={{ fontSize: 14, color: "#475569", marginTop: 4, fontWeight: 500 }}>
                      {profile.headline}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="pcp-save-btn"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <FiBookmark
                    size={14}
                    fill={isSaved ? "#0073e6" : "transparent"}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div className="pcp-meta-inline-row">
                {(profile.totalExperience || profile.experienceMonths) ? (
                  <span className="pcp-meta-inline-item">
                    <FiBriefcase size={14} />
                    <strong>
                      {profile.totalExperience ? `${profile.totalExperience}y ` : ""}
                      {profile.experienceMonths ? `${profile.experienceMonths}m` : ""}
                    </strong>
                  </span>
                ) : null}

                {(profile.currentSalary || profile.expectedSalary) && (
                  <span className="pcp-meta-inline-item">
                    ₹ {profile.currentSalary || "N/A"} {profile.expectedSalary && `(expects: ₹ ${profile.expectedSalary})`}
                  </span>
                )}

                {profile.currentCity && (
                  <span className="pcp-meta-inline-item">
                    <FiMapPin size={14} />
                    {profile.currentCity}
                  </span>
                )}
              </div>

              <div className="pcp-info-grid">
                {(profile.currentTitle || profile.currentCompany) && (
                  <div className="pcp-info-row">
                    <span className="pcp-info-label">Previous</span>
                    <span className="pcp-info-val">
                      {profile.currentTitle && <HighlightMatch text={profile.currentTitle} />}
                      {profile.currentTitle && profile.currentCompany && " at "}
                      {profile.currentCompany && profile.currentCompany}
                      {profile.noticePeriod ? ` • Notice: ${profile.noticePeriod}` : ""}
                    </span>
                  </div>
                )}

                {(educations?.[0] || profile.education) && (
                  <div className="pcp-info-row">
                    <span className="pcp-info-label">Highest degree</span>
                    <span className="pcp-info-val">
                      {educations?.[0]?.degree || profile.education}
                      {educations?.[0]?.school ? `, ${educations[0].school}` : (educations?.[0]?.institution ? `, ${educations[0].institution}` : "")}
                    </span>
                  </div>
                )}

                {profile.preferredLocations?.length > 0 && (
                  <div className="pcp-info-row">
                    <span className="pcp-info-label">Pref. locations</span>
                    <span className="pcp-info-val">
                      {profile.preferredLocations.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Contact Buttons */}
              <div className="pcp-contact-cta-row">
                <button
                  type="button"
                  className="pcp-btn-view-phone"
                  onClick={() => setShowFullPhone(!showFullPhone)}
                >
                  <FiPhone size={14} />
                  <span>
                    {showFullPhone && profile.phone
                      ? `${profile.phone}${profile.altPhone ? ` / ${profile.altPhone}` : ""}`
                      : "View phone number"}
                  </span>
                </button>

                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="pcp-btn-call"
                    style={{ textDecoration: "none" }}
                  >
                    <FiPhone size={14} /> Call candidate
                  </a>
                )}

                {profile.phone && (
                  <a
                    href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pcp-btn-whatsapp"
                    style={{ textDecoration: "none" }}
                  >
                    <FaWhatsapp size={15} /> WhatsApp
                  </a>
                )}

                {profile.linkedInUrl && (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pcp-icon-link"
                    title="LinkedIn profile"
                  >
                    <FaLinkedinIn size={15} />
                  </a>
                )}

                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pcp-icon-link"
                    title="Portfolio website"
                  >
                    <FiGlobe size={15} />
                  </a>
                )}
              </div>

              {/* Email & Verified status */}
              <div className="pcp-email-row">
                <FiMail size={14} color="#64748b" />
                <span>{profile.user?.email || "N/A"}</span>
                <span className="pcp-verified-badge">
                  <FiCheckCircle size={13} /> Verified
                </span>
              </div>

              {/* Timeline bar */}
              <div className="pcp-exp-bar-wrap">
                <div className="pcp-exp-bar-track">
                  <div className="pcp-exp-bar-fill" style={{ width: "85%" }} />
                </div>
                <div className="pcp-exp-bar-labels">
                  <span>Start</span>
                  <span></span>
                  <span>Present</span>
                </div>
              </div>

              {/* Footer Meta Row (Views, Downloads, Activity) */}
              <div className="pcp-hero-foot-row">
                <div className="pcp-hero-foot-left">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <FiEye size={13} /> {profile.profileViews || 0}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <FiDownload size={13} /> {profile.recruiterActions || 0}
                  </span>
                </div>

                <div className="pcp-hero-foot-right">
                  {profile.resume?.url && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <FiPaperclip size={13} /> CV Attached
                    </span>
                  )}
                  {profile.lastUpdated && <span>Modified {profile.lastUpdated}</span>}
                  <span style={{ color: "#10b981", fontWeight: 600 }}>Active status: {profile.activeStatus || "Unknown"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Profile detail vs Attached CV */}
          <div className="pcp-card" style={{ padding: "18px 24px 28px" }}>
            <div className="pcp-tab-nav">
              <button
                type="button"
                className={`pcp-tab-btn ${activeTab === "profile_detail" ? "active" : ""}`}
                onClick={() => setActiveTab("profile_detail")}
              >
                Profile detail
              </button>
              <button
                type="button"
                className={`pcp-tab-btn ${activeTab === "attached_cv" ? "active" : ""}`}
                onClick={() => setActiveTab("attached_cv")}
              >
                Attached CV
              </button>
            </div>

            {activeTab === "profile_detail" ? (
              <>
                {/* Summary / Headline Quote Box */}
                {profile.summary && (
                  <div className="pcp-quote-box">
                    {profile.summary}
                  </div>
                )}

                {/* Key Skills Section */}
                <div className="pcp-detail-section">
                  <h3 className="pcp-detail-title">Key skills</h3>
                  <div className="pcp-skills-cloud">
                    {skills.map((s, i) => {
                      const isMatch = searchKeywords.length > 0 && searchKeywords.some((k) => s.toLowerCase().includes(k));
                      return (
                        <span key={i} className={`pcp-skill-tag ${isMatch ? "highlight" : ""}`}>
                          {s}
                        </span>
                      );
                    })}
                  </div>

                  {profile.itSkills && (
                    <>
                      <div className="pcp-detail-subtitle">May also know</div>
                      <div className="pcp-skills-cloud">
                        {profile.itSkills.split(/[,|]/).map((item, idx) => {
                          const s = item.trim();
                          const isMatch = searchKeywords.length > 0 && searchKeywords.some((k) => s.toLowerCase().includes(k));
                          return (
                            <span key={idx} className={`pcp-skill-tag ${isMatch ? "highlight" : ""}`}>
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Work Summary */}
                <div className="pcp-detail-section">
                  <h3 className="pcp-detail-title">Work summary</h3>
                  {profile.summary && (
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "#475569", margin: "0 0 16px 0" }}>
                      {profile.summary}
                    </p>
                  )}

                  <div className="pcp-spec-grid">
                    {profile.industry && (
                      <div className="pcp-spec-item">
                        <label>Industry</label>
                        <span>{profile.industry}</span>
                      </div>
                    )}
                    {profile.department && (
                      <div className="pcp-spec-item">
                        <label>Department</label>
                        <span>{profile.department}</span>
                      </div>
                    )}
                    {profile.currentTitle && (
                      <div className="pcp-spec-item">
                        <label>Role</label>
                        <span>{profile.currentTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Experience */}
                {workExperiences.length > 0 && (
                  <div className="pcp-detail-section">
                    <h3 className="pcp-detail-title">Work experience</h3>
                    {workExperiences.map((exp, i) => (
                      <div key={i} className="pcp-work-exp-item">
                        <div className="pcp-work-exp-title">
                          {exp.title || exp.designation || exp.role}
                        </div>
                        <div className="pcp-work-exp-company">
                          {exp.company || exp.organization}
                          {exp.location ? ` - ${exp.location}` : ""}
                        </div>
                        <div className="pcp-work-exp-date">
                          {exp.startDate ? exp.startDate : "N/A"} to {exp.currentlyWorking ? "Present" : (exp.endDate ? exp.endDate : "N/A")}
                        </div>
                        {exp.description && (
                          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Educations */}
                {educations.length > 0 && (
                  <div className="pcp-detail-section">
                    <h3 className="pcp-detail-title">Education</h3>
                    {educations.map((edu, i) => (
                      <div key={i} className="pcp-work-exp-item">
                        <div className="pcp-work-exp-title">
                          {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                        </div>
                        <div className="pcp-work-exp-company">
                          {edu.school || edu.institution}
                        </div>
                        <div className="pcp-work-exp-date">
                          {edu.startYear ? edu.startYear : "N/A"} to {edu.currentlyStudying ? "Present" : (edu.endYear ? edu.endYear : "N/A")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {(profile.projects?.length > 0 || profile.projectTitle) && (
                  <div className="pcp-detail-section">
                    <h3 className="pcp-detail-title">Projects</h3>
                    {profile.projects?.map((proj, i) => (
                      <div key={i} className="pcp-work-exp-item">
                        <div className="pcp-work-exp-title">
                          {proj.title}
                        </div>
                        {proj.link && (
                          <div className="pcp-work-exp-company">
                            <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.link}</a>
                          </div>
                        )}
                        {proj.description && (
                          <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 0" }}>
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                    {profile.projectTitle && (
                      <div className="pcp-work-exp-item">
                        <div className="pcp-work-exp-title">
                          {profile.projectTitle}
                        </div>
                        {profile.projectLink && (
                          <div className="pcp-work-exp-company">
                            <a href={profile.projectLink} target="_blank" rel="noopener noreferrer">{profile.projectLink}</a>
                          </div>
                        )}
                        {profile.projectDescription && (
                          <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 0" }}>
                            {profile.projectDescription}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Other details (Languages, Personal details, Desired job, Work authorization) */}
                <div className="pcp-detail-section">
                  <h3 className="pcp-detail-title">Other details</h3>

                  {/* Preferred Roles */}
                  {profile.preferredRoles?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div className="pcp-detail-subtitle">Preferred Roles</div>
                      <div style={{ fontSize: 13, color: "#334155" }}>
                        {profile.preferredRoles.join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Languages known */}
                  {profile.languages && (
                    <div style={{ marginBottom: 18 }}>
                      <div className="pcp-detail-subtitle">Languages known</div>
                      <div style={{ fontSize: 13, color: "#334155" }}>
                        {profile.languages}
                      </div>
                    </div>
                  )}

                  {/* Personal details */}
                  <div style={{ marginBottom: 18 }}>
                    <div className="pcp-detail-subtitle">Personal details</div>
                    <div className="pcp-spec-grid">
                      {profile.dateOfBirth && (
                        <div className="pcp-spec-item">
                          <label>Date of Birth</label>
                          <span>{profile.dateOfBirth}</span>
                        </div>
                      )}
                      {profile.gender && (
                        <div className="pcp-spec-item">
                          <label>Gender</label>
                          <span>{profile.gender}</span>
                        </div>
                      )}
                      {profile.maritalStatus && (
                        <div className="pcp-spec-item">
                          <label>Marital status</label>
                          <span>{profile.maritalStatus}</span>
                        </div>
                      )}
                      {profile.category && (
                        <div className="pcp-spec-item">
                          <label>Category</label>
                          <span>{profile.category}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desired job detail */}
                  {(profile.desiredJobType || profile.employmentStatus) && (
                    <div style={{ marginBottom: 18 }}>
                      <div className="pcp-detail-subtitle">Desired job detail</div>
                      <div className="pcp-spec-grid">
                        {profile.desiredJobType && (
                          <div className="pcp-spec-item">
                            <label>Job Type</label>
                            <span>{profile.desiredJobType}</span>
                          </div>
                        )}
                        {profile.employmentStatus && (
                          <div className="pcp-spec-item">
                            <label>Employment status</label>
                            <span>{profile.employmentStatus}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attached CV preview row */}
                <div className="pcp-detail-section" style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                        Attached CV
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                        Last updated {profile.lastUpdated || "recently"}
                      </p>
                    </div>

                    {profile.resume?.url && (
                      <button
                        type="button"
                        className="pcp-btn-view-phone"
                        onClick={handleDownloadResume}
                        disabled={resumeLoading}
                      >
                        <FiDownload size={14} />
                        <span>{resumeLoading ? "Downloading..." : "Download CV"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Attached CV tab content */
              <div style={{ padding: "20px 0" }}>
                {profile.resume?.url ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                        {profile.resume.fileName || "Resume.pdf"}
                      </span>
                      <button
                        type="button"
                        className="pcp-btn-view-phone"
                        onClick={handleDownloadResume}
                        disabled={resumeLoading}
                      >
                        <FiDownload size={14} /> Download CV
                      </button>
                    </div>
                    <iframe
                      src={profile.resume.url}
                      title="Candidate CV"
                      style={{ width: "100%", height: 700, border: "1px solid #e2e8f0", borderRadius: 8 }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                    No CV attached by the candidate.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comments & AI Matched Similar Profiles */}
        <div className="pcp-right-col">
          {/* Comments Card */}
          <div className="pcp-card pcp-comments-card">
            <h4 className="pcp-comments-title">
              {comments.length ? `${comments.length} Comments` : "No comments"}
            </h4>
            <button
              type="button"
              className="pcp-add-comments-link"
              onClick={() => setShowCommentBox(!showCommentBox)}
            >
              Add comments
            </button>
          </div>

          {/* Expandable Comment Input */}
          {showCommentBox && (
            <div className="pcp-card" style={{ padding: 14 }}>
              <textarea
                rows={3}
                className="rxr-date-input"
                style={{ width: "100%", resize: "vertical", boxSizing: "border-box", fontSize: 13 }}
                placeholder="Write your recruiter notes/comments..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="rxr-btn-outline"
                  onClick={() => setShowCommentBox(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rxr-btn-primary"
                  onClick={handleAddComment}
                >
                  Save Comment
                </button>
              </div>
            </div>
          )}

          {/* Render comments if any */}
          {comments.map((c, i) => (
            <div key={i} className="pcp-card" style={{ padding: 12, fontSize: 13, color: "#334155" }}>
              <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Recruiter Note:</div>
              <p style={{ margin: "0 0 6px" }}>{c.text}</p>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{c.date}</span>
            </div>
          ))}

          {/* AI Matched Similar Profiles Card */}
          <div className="pcp-card pcp-similar-card">
            <div className="pcp-similar-header">
              <h3 className="pcp-ai-title">
                <HiSparkles className="pcp-ai-sparkle" size={16} />
                <span>AI matched</span> similar profiles
              </h3>
              
            </div>

            {/* Tabs for similar profiles */}
            <div className="pcp-similar-tabs">
              <button
                type="button"
                className={`pcp-similar-tab ${similarTab === "profile_details" ? "active" : ""}`}
                onClick={() => setSimilarTab("profile_details")}
              >
                Profile details ({similarCandidates.length})
              </button>

              <button
                type="button"
                className={`pcp-similar-tab ${similarTab === "recruiters_viewed" ? "active" : ""}`}
                onClick={() => setSimilarTab("recruiters_viewed")}
              >
                Recruiters also viewed (0)
              </button>
            </div>

            {/* List of Similar Candidate Profiles */}
            <div className="pcp-similar-list-container">
              {similarLoading ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b", fontSize: 13 }}>
                  <FiSparkles size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <div style={{ marginTop: 8 }}>AI matching similar profiles...</div>
                </div>
              ) : similarTab === "recruiters_viewed" ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                  No recent team views found for this candidate.
                </div>
              ) : displayedSimilar.length > 0 ? (
                displayedSimilar.map((c) => (
                  <Link
                    key={c.id}
                    to={`/candidate/${c.id}`}
                    className="pcp-similar-item"
                  >
                    <div className="pcp-sim-head">
                      <div className="pcp-sim-avatar">
                        {(c.avatar || c.profilePic?.url) ? (
                          <img
                            src={c.avatar || c.profilePic?.url}
                            alt={c.name || c.user?.name || "Candidate"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.user?.name || "Candidate")}&background=e2e8f0&color=475569`;
                            }}
                          />
                        ) : (
                          (c.name || c.user?.name || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="pcp-sim-info">
                        <div className="pcp-sim-name">{c.name || c.user?.name || "Candidate"}</div>
                        <div className="pcp-sim-role">
                          <HighlightMatch text={c.title || c.currentTitle || c.headline || "Professional"} />
                        </div>
                      </div>
                    </div>

                    <div className="pcp-sim-meta">
                      <span>
                        <FiBriefcase size={12} /> {c.experience || (c.totalExperience ? `${c.totalExperience}y` : "Exp N/A")}
                      </span>
                      <span>
                        <FiDollarSign size={12} /> {c.salary || c.currentSalary || c.expectedSalary || "Salary N/A"}
                      </span>
                    </div>

                    <div className="pcp-sim-loc">
                      <FiMapPin size={12} /> {c.location || c.currentCity || "Location N/A"} {c.preferredLocations?.length > 0 ? `(${Array.isArray(c.preferredLocations) ? c.preferredLocations.slice(0, 2).join(", ") : c.preferredLocations})` : ""}
                    </div>

                    {/* Skills tags */}
                    {c.skills?.length > 0 && (
                      <div className="pcp-sim-skills">
                        {c.skills.slice(0, 5).map((sk, idx) => {
                          const isMatch = searchKeywords.length > 0 && searchKeywords.some((k) => sk.toLowerCase().includes(k));
                          return (
                            <span
                              key={idx}
                              className={`pcp-sim-skill ${isMatch ? "highlight" : ""}`}
                            >
                              {sk}
                            </span>
                          );
                        })}
                        
                      </div>
                    )}

                    <div className="pcp-sim-footer">
                      <span>
                        <FiPaperclip size={11} /> {c.hasCv ? "CV" : "Profile"}
                      </span>
                      <span>{c.activeStatus || "Active recently"}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                  No similar candidates found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ height: 40, background: "#e2e8f0", borderRadius: 8, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div style={{ height: 360, background: "#ffffff", borderRadius: 12 }} />
          <div style={{ height: 360, background: "#ffffff", borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: 16,
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <FiUser size={30} color="#ef4444" />
      </div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
        Candidate Not Found
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 8 }}>{message}</p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#002366",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  );
}

