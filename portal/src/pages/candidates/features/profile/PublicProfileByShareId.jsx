import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import authService from "../../../../services/authService";
import SkeletonPage from "../../../../components/Skeleton";
import ResumeModal from "../../../../components/employer/ResumeModal";

import {
  FiMapPin, FiMail, FiPhone, FiBriefcase, FiCheckCircle,
  FiArrowRight, FiEye, FiGlobe, FiDownload,
  FiExternalLink, FiBookOpen, FiCode, FiAward, FiClock,
  FiSend, FiCopy, FiStar, FiGithub,
} from "react-icons/fi";
import { FaLinkedinIn, FaGraduationCap, FaBriefcase } from "react-icons/fa";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import "./PublicProfileByShareId.css";

gsap.registerPlugin(ScrollTrigger);

/* ── helpers ── */
const safeUrl = (v) => {
  const u = String(v || "").trim();
  return (u.startsWith("http://") || u.startsWith("https://")) ? u : "";
};

const getInitials = (name) =>
  String(name || "C").trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]).join("").toUpperCase();

const formatDuration = (start, end) => {
  if (!start) return "";
  const fmt = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  const s = fmt(start);
  const e = end ? fmt(end) : "Present";
  if (!s) return "";
  return `${s} — ${e}`;
};

const expInYears = (totalExp) => {
  const n = parseInt(totalExp, 10);
  return isNaN(n) ? 0 : n;
};

/* ── Animated counter ── */
function Counter({ value, suffix = "", duration = 1.2 }) {
  const ref = useRef(null);
  const [disp, setDisp] = useState("0");
  const animated = useRef(false);

  useEffect(() => {
    const num = parseInt(value, 10);
    if (isNaN(num)) { setDisp(String(value)); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        const o = { v: 0 };
        gsap.to(o, {
          v: num, duration, ease: "power3.out",
          onUpdate: () => setDisp(Math.round(o.v).toString()),
          onComplete: () => setDisp(num.toString()),
        });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{disp}{suffix}</span>;
}

/* ── Section wrapper ── */
function Section({ title, icon, children, empty = false, addRef }) {
  if (empty) return null;
  return (
    <div className="pp-section" ref={addRef}>
      <div className="pp-section__hd">
        {icon && <span className="pp-section__icon">{icon}</span>}
        <h2 className="pp-section__title">{title}</h2>
        <div className="pp-section__line" />
      </div>
      {children}
    </div>
  );
}

/* ── Skill pill ── */
const SkillPill = React.memo(({ name }) => (
  <span className="pp-skill-pill">{name}</span>
));

/* ── Experience card ── */
function ExpCard({ exp, icon }) {
  const title = exp?.title || exp?.role || "";
  const company = exp?.company || "";
  const location = exp?.location || "";
  const duration = formatDuration(exp?.startDate, exp?.endDate);
  const achievements = Array.isArray(exp?.achievements) ? exp.achievements : [];
  return (
    <div className="pp-exp-card">
      <div className="pp-exp-icon pp-exp-icon--work">
        {icon || <FaBriefcase size={18} />}
      </div>
      <div className="pp-exp-body">
        <h3 className="pp-exp-title">{title}</h3>
        {company && <div className="pp-exp-company">{company}</div>}
        <div className="pp-exp-meta">
          {duration && <span className="pp-exp-period">{duration}</span>}
          {location && <span className="pp-exp-location"><FiMapPin size={11} /> {location}</span>}
        </div>
        {achievements.length > 0 && (
          <ul className="pp-exp-achievements">
            {achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Education card ── */
function EduCard({ edu }) {
  const institution = edu?.institution || edu?.school || edu?.college || "";
  const degree = edu?.degree || edu?.qualification || "";
  const field = edu?.field || edu?.major || "";
  const year = edu?.year || edu?.graduationYear || edu?.endYear || "";
  const cgpa = edu?.cgpa || edu?.gpa || edu?.percentage || "";
  const duration = formatDuration(edu?.startDate, edu?.endDate || edu?.year);
  return (
    <div className="pp-exp-card">
      <div className="pp-exp-icon pp-exp-icon--edu">
        <FaGraduationCap size={18} />
      </div>
      <div className="pp-exp-body">
        <h3 className="pp-exp-title">{degree || field || "Education"}</h3>
        {institution && <div className="pp-exp-company">{institution}</div>}
        <div className="pp-exp-meta">
          {(duration || year) && <span className="pp-exp-period">{duration || year}</span>}
          {cgpa && <span className="pp-exp-cgpa">CGPA: {cgpa}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Project card ── */
function ProjectCard({ project }) {
  const name = project?.name || project?.title || "";
  const desc = project?.description || project?.desc || "";
  const link = safeUrl(project?.link || project?.url || project?.liveUrl || "");
  const github = safeUrl(project?.github || project?.repoUrl || "");
  const techStack = Array.isArray(project?.techStack || project?.technologies || project?.skills) 
    ? (project?.techStack || project?.technologies || project?.skills) : [];
  const image = safeUrl(project?.image || project?.imageUrl || project?.thumbnail || "");

  return (
    <div className="pp-project-card">
      <div className="pp-project-card__img-wrap">
        {image ? (
          <img src={image} alt={name} className="pp-project-card__img" loading="lazy" />
        ) : (
          <div className="pp-project-card__placeholder">
            <FiBookOpen size={32} />
          </div>
        )}
      </div>
      <div className="pp-project-card__body">
        <h3 className="pp-project-card__title">{name || "Project"}</h3>
        {desc && <p className="pp-project-card__desc">{desc}</p>}
        {techStack.length > 0 && (
          <div className="pp-project-card__tech">
            {techStack.map((t, i) => <span key={i} className="pp-tech-pill">{t}</span>)}
          </div>
        )}
        <div className="pp-project-card__actions">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="pp-project-card__link">
              <FiExternalLink size={13} /> Live
            </a>
          )}
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="pp-project-card__link pp-project-card__link--gh">
              <FiGithub size={13} /> Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function PublicProfileByShareId() {
  const { shareId } = useParams();
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const sectionsRef = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const isValidId = useMemo(() =>
    typeof shareId === "string" && shareId.trim().length > 0,
    [shareId]);

  /* ── Dynamic document title ── */
  useEffect(() => {
    if (profile?.user?.name) {
      document.title = `${profile.user.name} — ${profile.headline || "Candidate Profile"} | MavenJobs`;
    } else {
      document.title = "Candidate Profile | MavenJobs";
    }
    return () => { document.title = "MavenJobs"; };
  }, [profile]);

  /* ── Fetch ── */
  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true); setError(""); setProfile(null);
      try {
        if (!isValidId) { setError("Invalid share link."); return; }
        const res = await authService.getPublicCandidateProfileByShareId(shareId);
        if (!active) return;
        const p = res?.data?.profile;
        if (!p) { setError("Profile not found or unavailable."); return; }
        setProfile(p);
        setLoaded(true);
      } catch (e) {
        if (!active) return;
        setError(e?.statusCode === 404
          ? "Profile not found or unavailable."
          : "Failed to load profile.");
      } finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, [shareId, isValidId]);

  /* ── GSAP entrance ── */
  useEffect(() => {
    if (!loaded || !profile) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(navRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 }
      ).fromTo(heroRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 }, "-=0.15"
      ).fromTo(heroRef.current.querySelectorAll(".pp-anim > *"),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.07 }, "-=0.25"
      );

      sectionsRef.current.filter(Boolean).forEach((el) => {
        gsap.fromTo(el,
          { y: 36, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          }
        );
      });

      gsap.fromTo(heroRef.current?.querySelectorAll(".pp-stat"),
        { scale: 0.75, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.09, ease: "back.out(1.8)", delay: 0.4 }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [loaded, profile]);

  const addRef = useCallback((el) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  /* ── Data extraction (safe for null profile) ── */
  const pname = profile?.user?.name || "Candidate";
  const candidateId = profile?.user?.id || "";
  const initials = getInitials(pname);
  const headline = profile?.headline || "";
  const location = [profile?.currentCity, profile?.currentState].filter(Boolean).join(", ");
  const phone = profile?.phone || profile?.altPhone || "";
  const email = profile?.user?.email || "";
  const totalExp = profile?.totalExperience || "";
  const currentTitle = profile?.currentTitle || "";
  const currentCompany = profile?.currentCompany || "";
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const summary = profile?.summary || "";
  const linkedInUrl = safeUrl(profile?.linkedInUrl);
  const portfolioUrl = safeUrl(profile?.portfolioUrl);
  const resumeUrl = safeUrl(profile?.resume?.url);
  const profilePicUrl = safeUrl(profile?.profilePic?.url);
  const coverPicUrl = safeUrl(profile?.coverPic?.url);
  const itSkills = profile?.itSkills || "";
  const updatedAt = profile?.lastUpdated || profile?.updatedAt || "";
  const expNum = expInYears(totalExp);

  /* ── Work experiences (parsed array, safe when profile is null) ── */
  const workExperiences = useMemo(() => {
    if (!profile) return [];
    const raw = profile?.workExperiences;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const title = profile?.currentTitle || "";
    const company = profile?.currentCompany || "";
    if (title || company) return [{ title, company }];
    return [];
  }, [profile]);

  /* ── Educations (parsed array) ── */
  const educations = useMemo(() => {
    if (!profile) return [];
    const raw = profile?.educations;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const eduStr = profile?.education;
    if (eduStr) return [{ institution: eduStr }];
    return [];
  }, [profile]);

  /* ── Projects (parsed array) ── */
  const projects = useMemo(() => {
    if (!profile) return [];
    const raw = profile?.projects;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (profile?.projectTitle) {
      return [{
        name: profile.projectTitle,
        description: profile.projectDescription,
        link: profile.projectLink,
      }];
    }
    return [];
  }, [profile]);

  const has = {
    summary: summary.length > 0,
    experience: workExperiences.length > 0,
    education: educations.length > 0,
    skills: skills.length > 0,
    itSkills: itSkills.length > 0,
    projects: projects.length > 0,
    links: !!(linkedInUrl || portfolioUrl || resumeUrl),
    contact: !!(email || phone),
  };

  if (isLoading) {
    return <SkeletonPage variant="detail" />;
  }

  if (error) {
    return (
      <div className="pp-root" ref={rootRef}>
        <nav className="pp-nav" ref={navRef}>
          <div className="pp-nav__inner">
            <div className="pp-nav__brand">
              <img src={mavenLogo} alt="MavenJobs" className="pp-nav__logo" />
            </div>
          </div>
        </nav>
        <div className="pp-container">
          <div className="pp-error">
            <div className="pp-error__code">404</div>
            <div className="pp-error__title">{error}</div>
            <div className="pp-error__sub">
              The link may be invalid or the profile is no longer available.
            </div>
            <button className="pp-btn pp-btn--primary" onClick={() => navigate("/")}>
              Browse Jobs <FiArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pp-root" ref={rootRef}>

      {/* ── SEO Meta ── */}
      <div className="pp-seo-meta" style={{ display: 'none' }}>
        <div itemScope itemType="https://schema.org/Person">
          <meta itemProp="name" content={pname} />
          {headline && <meta itemProp="description" content={headline} />}
          {email && <meta itemProp="email" content={email} />}
          {phone && <meta itemProp="telephone" content={phone} />}
          {profilePicUrl && <meta itemProp="image" content={profilePicUrl} />}
          {linkedInUrl && <meta itemProp="url" content={linkedInUrl} />}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="pp-nav" ref={navRef}>
        <div className="pp-nav__inner">
          <div className="pp-nav__brand">
            <img src={mavenLogo} alt="MavenJobs" className="pp-nav__logo" />
            <span className="pp-nav__divider" />
            <span className="pp-nav__tag">Candidate Profile</span>
          </div>
          <div className="pp-nav__actions">
            <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={handleCopy}>
              {copied
                ? <><FiCheckCircle size={14} /> Copied!</>
                : <><FiCopy size={14} /> Share</>}
            </button>
          </div>
        </div>
      </nav>

      <div className="pp-container">

        {/* ── HERO ── */}
        <div className="pp-hero" ref={heroRef}>

          {/* Cover */}
          <div
            className="pp-cover"
            style={{
              background: coverPicUrl
                ? `url(${coverPicUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #0a244d 0%, #143f86 50%, #1d55b3 80%, #2ea9c4 100%)",
            }}
          >
            <div className="pp-cover__overlay" />
          </div>

          {/* Body */}
          <div className="pp-hero__body">

            {/* Avatar — overlaps cover independently */}
            <div className="pp-hero__avatar-standalone pp-anim">
              <div className="pp-avatar-wrap">
                <div className="pp-avatar-ring">
                  {profilePicUrl
                    ? <img src={profilePicUrl} alt={pname} className="pp-avatar" />
                    : <div className="pp-avatar pp-avatar--initials">{initials}</div>
                  }
                </div>
                <div className="pp-avatar__badge" aria-label="Verified Profile">
                  <FiCheckCircle size={16} />
                </div>
              </div>
            </div>

            {/* Info — always below cover */}
            <div className="pp-hero__below">
              <div className="pp-hero__info pp-anim">
                <h1 className="pp-hero__name">{pname}</h1>
                {headline && <p className="pp-hero__headline">{headline}</p>}
                <div className="pp-hero__meta">
                  {location && (
                    <span className="pp-meta-item">
                      <FiMapPin size={13} /> {location}
                    </span>
                  )}
                  {totalExp && (
                    <span className="pp-meta-item">
                      <FiBriefcase size={13} /> {totalExp} {parseInt(totalExp, 10) === 1 ? "yr" : "yrs"} exp.
                    </span>
                  )}
                  {updatedAt && (
                    <span className="pp-meta-item">
                      <FiClock size={13} /> Updated {updatedAt}
                    </span>
                  )}
                  <span className="pp-verified-badge">
                    <FiCheckCircle size={12} /> Profile Verified
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="pp-hero__stats pp-anim">
                <div className="pp-stat">
                  <span className="pp-stat__val">
                    {totalExp ? <Counter value={expNum} suffix="+" /> : "—"}
                  </span>
                  <span className="pp-stat__label">Years Exp.</span>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat__val">
                    <Counter value={skills.length} />
                  </span>
                  <span className="pp-stat__label">Skills</span>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat__val">
                    <Counter value={educations.length} />
                  </span>
                  <span className="pp-stat__label">{educations.length === 1 ? "Degree" : "Degrees"}</span>
                </div>
                <div className="pp-stat">
                  <span className="pp-stat__val pp-stat__val--star">
                    <FiStar size={20} />
                </span>
                <span className="pp-stat__label">Verified</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pp-hero__actions pp-anim">
              {email && (
                <a href={`mailto:${email}`} className="pp-btn pp-btn--primary">
                  <FiSend size={14} /> Email
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="pp-btn pp-btn--outline">
                  <FiPhone size={14} /> Call
                </a>
              )}
              {resumeUrl && (
                <button onClick={() => setShowResumeModal(true)}
                  className="pp-btn pp-btn--outline">
                  <FiDownload size={14} /> Resume
                </button>
              )}
              {linkedInUrl && (
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                  className="pp-btn pp-btn--outline">
                  <FaLinkedinIn size={13} /> LinkedIn
                </a>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* ── LAYOUT ── */}
        <div className="pp-layout">

          {/* Main */}
          <div className="pp-main">

            <Section title="About" icon={<FiEye size={15} />}
              empty={!has.summary} addRef={addRef}>
              <p className="pp-summary">{summary}</p>
            </Section>

            <Section title="Experience" icon={<FaBriefcase size={15} />}
              empty={!has.experience} addRef={addRef}>
              <div className="pp-timeline">
                {workExperiences.map((exp, i) => (
                  <div key={i} className="pp-timeline__item">
                    {i > 0 && <div className="pp-timeline__line" />}
                    <div className="pp-timeline__dot" />
                    <ExpCard exp={exp} />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Education" icon={<FaGraduationCap size={15} />}
              empty={!has.education} addRef={addRef}>
              <div className="pp-timeline">
                {educations.map((edu, i) => (
                  <div key={i} className="pp-timeline__item">
                    {i > 0 && <div className="pp-timeline__line" />}
                    <div className="pp-timeline__dot" />
                    <EduCard edu={edu} />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Skills" icon={<FiAward size={15} />}
              empty={!has.skills} addRef={addRef}>
              <div className="pp-skills-wrap">
                {skills.map((s, i) => (
                  <SkillPill key={String(s) + i} name={s} />
                ))}
              </div>
            </Section>

            {itSkills && (
              <Section title="IT Skills" icon={<FiCode size={15} />}
                empty={!has.itSkills} addRef={addRef}>
                <div className="pp-it-skills">{itSkills}</div>
              </Section>
            )}

            <Section title="Projects" icon={<FiBookOpen size={15} />}
              empty={!has.projects} addRef={addRef}>
              <div className="pp-projects-grid">
                {projects.map((proj, i) => (
                  <ProjectCard key={i} project={proj} />
                ))}
              </div>
            </Section>

          </div>

          {/* Sidebar */}
          <aside className="pp-sidebar">

            {/* Contact */}
            {has.contact && (
              <div className="pp-sidebar-card" ref={addRef}>
                <p className="pp-sidebar-card__title">Contact</p>
                <div className="pp-contact-list">
                  {email && (
                    <a href={`mailto:${email}`} className="pp-contact-row">
                      <div className="pp-contact-icon"><FiMail size={14} /></div>
                      <span>{email}</span>
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} className="pp-contact-row">
                      <div className="pp-contact-icon"><FiPhone size={14} /></div>
                      <span>{phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            {has.links && (
              <div className="pp-sidebar-card" ref={addRef}>
                <p className="pp-sidebar-card__title">Links</p>
                <div className="pp-links-list">
                  {linkedInUrl && (
                    <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                      className="pp-link-row">
                      <div className="pp-link-icon pp-link-icon--li">
                        <FaLinkedinIn size={14} />
                      </div>
                      <span>LinkedIn</span>
                      <FiExternalLink size={11} className="pp-link-ext" />
                    </a>
                  )}
                  {portfolioUrl && (
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="pp-link-row">
                      <div className="pp-link-icon pp-link-icon--web">
                        <FiGlobe size={14} />
                      </div>
                      <span>Portfolio</span>
                      <FiExternalLink size={11} className="pp-link-ext" />
                    </a>
                  )}
                  {resumeUrl && (
                    <button onClick={() => setShowResumeModal(true)}
                      className="pp-link-row pp-link-row--btn">
                      <div className="pp-link-icon pp-link-icon--file">
                        <FiDownload size={14} />
                      </div>
                      <span>Resume / CV</span>
                      <FiExternalLink size={11} className="pp-link-ext" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Currently working */}
            {(currentTitle || currentCompany) && (
              <div className="pp-sidebar-card pp-currently-card" ref={addRef}>
                <div className="pp-currently-badge">Currently</div>
                <div className="pp-currently-title">
                  {currentTitle || "Professional"}
                </div>
                {currentCompany && (
                  <div className="pp-currently-sub">at {currentCompany}</div>
                )}
              </div>
            )}

          </aside>
        </div>

        {/* ── FOOTER ── */}
        <footer className="pp-footer">
          <div className="pp-footer__dot" />
          <img src={mavenLogo} alt="MavenJobs" className="pp-footer__logo" />
          <span className="pp-footer__text">
            Powered by MavenJobs — Professional Candidate Profiles
          </span>
          <div className="pp-footer__dot" />
        </footer>

      </div>

      {/* ── Resume Modal ── */}
      {showResumeModal && (
        <ResumeModal
          candidateId={candidateId}
          resumeUrl={resumeUrl}
          creditFree
          onClose={() => setShowResumeModal(false)}
        />
      )}

    </div>
  );
}
