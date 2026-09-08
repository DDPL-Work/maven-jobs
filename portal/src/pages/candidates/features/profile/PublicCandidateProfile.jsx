import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiCalendar,
  FiGlobe,
  FiDownload,
  FiExternalLink,
  FiBookOpen,
  FiCode,
  FiAward,
  FiClock,
  FiArrowLeft,
  FiUser,
} from "react-icons/fi";
import { FaLinkedinIn, FaGraduationCap } from "react-icons/fa";
import authService from "../../../../services/authService";
import LandingFooter from "../../../../components/LandingFooter";


const safeUrl = (v) => {
  const u = String(v || "").trim();
  return u.startsWith("http://") || u.startsWith("https://") ? u : "";
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "";

const diffMonths = (start, end) => {
  const s = new Date(start),
    e = end ? new Date(end) : new Date();
  return (
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
};

const formatDuration = (start, end) => {
  const m = diffMonths(start, end);
  const yrs = Math.floor(m / 12);
  const mos = m % 12;
  const parts = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
  if (mos > 0) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
  return parts.length ? parts.join(" ") : "0 mos";
};

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

const SkeletonBlock = ({ h = 20, w = "100%", mb = 12, br = 8 }) => (
  <div
    style={{
      height: h,
      width: w,
      borderRadius: br,
      background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      marginBottom: mb,
      animation: "ppShimmer 1.4s ease-in-out infinite",
    }}
  />
);

export default function PublicCandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);

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
      } catch (e) {
        if (!active) return;
        if (
          e?.statusCode === 404 ||
          e?.message?.includes("404") ||
          e?.message?.includes("not found")
        ) {
          setError("Candidate not found");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [candidateId]);

  const handleResume = useCallback(async () => {
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
      if (profile?.resume?.url)
        window.open(profile.resume.url, "_blank", "noopener,noreferrer");
    }
    setResumeLoading(false);
  }, [candidateId, profile]);

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return <ErrorState message="Candidate not found" />;

  const workExperiences = parseJSON(profile.workExperiences);
  const educations = parseJSON(profile.educations);
  const projects = parseJSON(profile.projects);
  const skills = profile.skills || [];
  const picUrl = profile.profilePic?.url || "";
  const coverUrl = profile.coverPic?.url || "";
  const hasResume = !!profile.resume?.url;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1e293b",
      }}
    >
      <style>{`
        @keyframes ppShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .pcp-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
        .pcp-section { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px 32px; margin-bottom: 20px; transition: box-shadow 0.2s; }
        .pcp-section:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .pcp-section-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .pcp-exp-item { padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
        .pcp-exp-item:last-child { border-bottom: none; padding-bottom: 0; }
        .pcp-skill-pill { display: inline-flex; padding: 5px 14px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; background: #eef2ff; color: #4338ca; }
        .pcp-edu-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .pcp-edu-item:last-child { border-bottom: none; }
        .pcp-project-card { background: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #f1f5f9; margin-bottom: 12px; transition: all 0.2s; }
        .pcp-project-card:hover { border-color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        @media (max-width: 768px) {
          .pcp-container { padding: 0 12px; }
          .pcp-section { padding: 20px 16px; }
          .pcp-hero { flex-direction: column; align-items: center; text-align: center; }
          .pcp-hero-info { align-items: center; }
        }
      `}</style>

      {/* Navigation */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="pcp-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#e2e8f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f1f5f9")
              }
            >
              <FiArrowLeft size={14} /> Back
            </button>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              Candidate Profile
            </span>
          </div>
          <a
            href="/employer-dashboard"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#002366",
              textDecoration: "none",
            }}
          >
            Employer Dashboard
          </a>
        </div>
      </div>

      <div
        className="pcp-container"
        style={{ paddingTop: 24, paddingBottom: 60 }}
      >
        {/* Hero Section */}
        <div className="pcp-section" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              height: 140,
              background: coverUrl
                ? `url(${coverUrl}) center/cover`
                : "linear-gradient(135deg, #002366, #1a3a6e)",
              position: "relative",
            }}
          />
          <div
            className="pcp-hero"
            style={{
              display: "flex",
              gap: 24,
              padding: "0 32px 28px",
              marginTop: -40,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 20,
                overflow: "hidden",
                flexShrink: 0,
                border: "4px solid #fff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                background: picUrl
                  ? "transparent"
                  : "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {picUrl ? (
                <img
                  src={picUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.style.background =
                      "linear-gradient(135deg, #e0e7ff, #c7d2fe)";
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#4338ca",
                  }}
                >
                  {(profile.user?.name || "C")[0]}
                </span>
              )}
            </div>
            <div
              className="pcp-hero-info"
              style={{
                flex: 1,
                paddingTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <h1
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {profile.user?.name || "Candidate"}
              </h1>
              <p style={{ fontSize: "0.95rem", color: "#475569", margin: 0 }}>
                {profile.currentTitle || profile.headline || "Professional"}
                {profile.currentCompany ? ` at ${profile.currentCompany}` : ""}
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  marginTop: 4,
                  fontSize: "0.82rem",
                  color: "#64748b",
                }}
              >
                {profile.currentCity && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiMapPin size={13} /> {profile.currentCity}
                    {profile.currentCountry
                      ? `, ${profile.currentCountry}`
                      : ""}
                  </span>
                )}
                {profile.totalExperience && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiBriefcase size={13} /> {profile.totalExperience}
                    {isNaN(profile.totalExperience) ? "" : " yrs"}
                  </span>
                )}
                {profile.expectedSalary && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiClock size={13} /> {profile.expectedSalary}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#002366";
                      e.currentTarget.style.color = "#002366";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#475569";
                    }}
                  >
                    <FiMail size={14} /> Email
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#002366";
                      e.currentTarget.style.color = "#002366";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#475569";
                    }}
                  >
                    <FiPhone size={14} /> Call
                  </a>
                )}
                {hasResume && (
                  <button
                    onClick={handleResume}
                    disabled={resumeLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      border: "none",
                      color: "#fff",
                      cursor: resumeLoading ? "wait" : "pointer",
                      transition: "all 0.15s",
                      background: resumeLoading ? "#6366f1" : "#002366",
                      opacity: resumeLoading ? 0.8 : 1,
                    }}
                  >
                    {resumeLoading ? (
                      "Opening..."
                    ) : (
                      <>
                        <FiDownload size={14} /> Resume
                      </>
                    )}
                  </button>
                )}
                {safeUrl(profile.linkedInUrl) && (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      border: "1px solid #e2e8f0",
                      color: "#0a66c2",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0f7ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
                  >
                    <FaLinkedinIn size={14} /> LinkedIn
                  </a>
                )}
                {safeUrl(profile.portfolioUrl) && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#002366";
                      e.currentTarget.style.color = "#002366";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#475569";
                    }}
                  >
                    <FiGlobe size={14} /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {profile.summary && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FiBookOpen size={16} /> About
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.7,
                color: "#475569",
                margin: 0,
              }}
            >
              {profile.summary}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FiBriefcase size={16} /> Experience
            </div>
            {workExperiences.map((exp, i) => (
              <div key={i} className="pcp-exp-item">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      {exp.title || exp.role || "Role"}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#475569",
                        margin: "3px 0",
                      }}
                    >
                      {exp.company || exp.organization || ""}
                      {exp.location ? ` - ${exp.location}` : ""}
                    </p>
                  </div>
                  {exp.startDate && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(exp.startDate)} -{" "}
                      {formatDate(exp.endDate) || "Present"}
                      <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                        ({formatDuration(exp.startDate, exp.endDate)})
                      </span>
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#64748b",
                      lineHeight: 1.6,
                      margin: "8px 0 0",
                    }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FaGraduationCap size={16} /> Education
            </div>
            {educations.map((edu, i) => (
              <div key={i} className="pcp-edu-item">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#eef2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4338ca",
                    flexShrink: 0,
                  }}
                >
                  <FaGraduationCap size={18} />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {edu.degree || edu.course || "Education"}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#475569",
                      margin: "2px 0",
                    }}
                  >
                    {edu.institution || edu.college || edu.school || ""}
                    {edu.field ? ` - ${edu.field}` : ""}
                  </p>
                  {edu.startDate && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#64748b",
                        margin: "2px 0 0",
                      }}
                    >
                      {formatDate(edu.startDate)} -{" "}
                      {formatDate(edu.endDate) || "Present"}
                    </p>
                  )}
                  {edu.percentage && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#64748b",
                        margin: "2px 0 0",
                      }}
                    >
                      {edu.percentage}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FiCode size={16} /> Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skills.map((skill, i) => (
                <span key={i} className="pcp-skill-pill">
                  {skill}
                </span>
              ))}
            </div>
            {profile.itSkills && (
              <div
                style={{
                  marginTop: 16,
                  fontSize: "0.82rem",
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                {profile.itSkills}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FiCode size={16} /> Projects
            </div>
            {projects.map((proj, i) => (
              <div key={i} className="pcp-project-card">
                <h4
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {proj.title || proj.name || `Project ${i + 1}`}
                </h4>
                {(proj.link || proj.url) && (
                  <a
                    href={proj.link || proj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.78rem",
                      color: "#6366f1",
                      fontWeight: 600,
                      textDecoration: "none",
                      marginTop: 4,
                    }}
                  >
                    <FiExternalLink size={12} /> {proj.link || proj.url}
                  </a>
                )}
                {proj.description && (
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#64748b",
                      lineHeight: 1.6,
                      margin: "8px 0 0",
                    }}
                  >
                    {proj.description}
                  </p>
                )}
                {proj.techStack &&
                  Array.isArray(proj.techStack) &&
                  proj.techStack.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 10,
                      }}
                    >
                      {proj.techStack.map((tech, j) => (
                        <span
                          key={j}
                          className="pcp-skill-pill"
                          style={{ fontSize: "0.7rem", padding: "3px 10px" }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications / Additional Info */}
        {(profile.certifications ||
          profile.languages ||
          profile.preferredLocations?.length > 0) && (
          <div className="pcp-section">
            <div className="pcp-section-title">
              <FiAward size={16} /> Additional Information
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                fontSize: "0.85rem",
              }}
            >
              {profile.certifications && (
                <div>
                  <span style={{ fontWeight: 600, color: "#475569" }}>
                    Certifications:
                  </span>
                  <span style={{ color: "#64748b", marginLeft: 6 }}>
                    {profile.certifications}
                  </span>
                </div>
              )}
              {profile.languages && (
                <div>
                  <span style={{ fontWeight: 600, color: "#475569" }}>
                    Languages:
                  </span>
                  <span style={{ color: "#64748b", marginLeft: 6 }}>
                    {profile.languages}
                  </span>
                </div>
              )}
              {profile.preferredLocations?.length > 0 && (
                <div>
                  <span style={{ fontWeight: 600, color: "#475569" }}>
                    Preferred Locations:
                  </span>
                  <span style={{ color: "#64748b", marginLeft: 6 }}>
                    {profile.preferredLocations.join(", ")}
                  </span>
                </div>
              )}
              {profile.noticePeriod && (
                <div>
                  <span style={{ fontWeight: 600, color: "#475569" }}>
                    Notice Period:
                  </span>
                  <span style={{ color: "#64748b", marginLeft: 6 }}>
                    {profile.noticePeriod}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Card */}
        <div
          className="pcp-section"
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            border: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                }}
              >
                Interested in this candidate?
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  margin: "6px 0 0",
                }}
              >
                Connect with them directly through your employer dashboard.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 20px",
                    borderRadius: 10,
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    border: "none",
                    color: "#fff",
                    background: "#002366",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#003080")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#002366")
                  }
                >
                  <FiMail size={14} /> Send Email
                </a>
              )}
              <Link
                to="/employer-dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  border: "none",
                  color: "#0f172a",
                  background: "#fff",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <FiUser size={14} /> Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* <LandingFooter /> */}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 20px",
      }}
    >
      <style>{`@keyframes ppShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SkeletonBlock h={50} mb={20} />
        <SkeletonBlock h={140} mb={20} br={16} />
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: -60,
            paddingLeft: 32,
            marginBottom: 20,
          }}
        >
          <SkeletonBlock h={100} w={100} br={20} />
          <div style={{ flex: 1, paddingTop: 50 }}>
            <SkeletonBlock h={28} w="40%" />
            <SkeletonBlock h={18} w="60%" />
            <SkeletonBlock h={16} w="30%" />
          </div>
        </div>
        <SkeletonBlock h={120} br={16} />
        <div style={{ marginTop: 20 }}>
          <SkeletonBlock h={200} br={16} />
        </div>
        <div style={{ marginTop: 20 }}>
          <SkeletonBlock h={160} br={16} />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <FiUser size={32} color="#ef4444" />
      </div>
      <h2
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#0f172a",
          margin: 0,
        }}
      >
        Candidate Not Found
      </h2>
      <p
        style={{
          fontSize: "0.9rem",
          color: "#64748b",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {message}
      </p>
      <a
        href="/employer-dashboard"
        style={{
          marginTop: 24,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 24px",
          borderRadius: 10,
          fontSize: "0.875rem",
          fontWeight: 700,
          border: "none",
          color: "#fff",
          background: "#002366",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <FiArrowLeft size={14} /> Back to Dashboard
      </a>
    </div>
  );
}
