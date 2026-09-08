/* ResumeBuilder styles injected into head */
export const BUILDER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Roboto:wght@400;500;700;900&family=Playfair+Display:wght@400;500;600;700;800&display=swap');

  .rb-root, .rb-root * { box-sizing: border-box; }

  /* Hide scrollbar but keep functionality */
  .rb-scroll::-webkit-scrollbar { width: 4px; }
  .rb-scroll::-webkit-scrollbar-track { background: transparent; }
  .rb-scroll::-webkit-scrollbar-thumb { background: #dde6f8; border-radius: 99px; }
  .rb-scroll::-webkit-scrollbar-thumb:hover { background: #143f86; }
  .rb-scroll { scrollbar-width: thin; scrollbar-color: #dde6f8 transparent; }

  /* Animations */
  @keyframes rb-slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rb-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rb-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes rb-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes rb-dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.5); opacity: 0.6; }
  }

  .rb-slide-down  { animation: rb-slideDown 0.2s cubic-bezier(0.4,0,0.2,1) both; }
  .rb-fade-in     { animation: rb-fadeIn 0.25s ease both; }
  .rb-spinner     { animation: rb-spin 0.7s linear infinite; }
  .rb-dot-pulse   { animation: rb-dotPulse 2s ease-in-out infinite; }

  .rb-shimmer-badge {
    background: linear-gradient(90deg, #d6f33d 0%, #b8e020 40%, #d6f33d 100%);
    background-size: 300% auto;
    animation: rb-shimmer 2.5s linear infinite;
  }

  /* Tab hover */
  .rb-tab:hover:not(.rb-tab-active) { background: rgba(20,63,134,0.06); }

  /* Section rows */
  .rb-section-row:hover { background: #f7f9ff; }

  /* Card hover */
  .rb-card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .rb-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(20,63,134,0.12); border-color: rgba(20,63,134,0.2); }

  /* Input focus */
  .rb-input:focus { border-color: #143f86 !important; box-shadow: 0 0 0 3px rgba(20,63,134,0.1) !important; outline: none; }

  /* Template card */
  .rb-tpl-card { transition: transform 0.18s ease, box-shadow 0.18s ease; cursor: pointer; }
  .rb-tpl-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(20,63,134,0.1); }

  /* Enhance card */
  .rb-enhance-row { transition: background 0.15s ease, border-color 0.15s ease; cursor: pointer; }
  .rb-enhance-row:hover { background: #f7f9ff; border-color: rgba(20,63,134,0.18); }

  /* Color swatch */
  .rb-swatch { transition: transform 0.15s ease; cursor: pointer; }
  .rb-swatch:hover { transform: scale(1.15); }

  /* Skill tag */
  .rb-skill-tag { transition: background 0.15s ease; }
  .rb-skill-tag:hover { background: #e0e8f8; }

  /* CTA button */
  .rb-cta-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .rb-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(20,63,134,0.28); }

  /* Print — enterprise-grade isolation: only #resume-print content is visible */
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden !important; }
    #resume-print, #resume-print * { visibility: visible !important; }
    #resume-print {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      z-index: 99999 !important;
    }
    .rb-print-page {
      width: 210mm !important;
      height: 297mm !important;
      overflow: hidden !important;
      page-break-after: always !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
    .rb-print-page:last-child { page-break-after: avoid !important; }
    @page { size: A4 portrait; margin: 0 !important; }
  }

  /* Hide mobile elements on desktop */
  .rb-mobile-sidebar, .rb-mobile-overlay {
    display: none !important;
  }

  /* --- Mobile Responsive layout --- */
  @media (max-width: 768px) {
    .rb-desktop-header {
      display: none !important;
    }
    .rb-desktop-sidebar {
      display: none !important;
    }
    
    .rb-mobile-header {
      display: flex !important;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .rb-mobile-bottom-nav {
      display: flex !important;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: white;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      border-top: 1px solid #e8eef8;
    }
    
    .rb-root {
      padding-bottom: 60px !important; /* Make room for bottom nav */
    }
    
    .rb-mobile-sidebar {
      display: flex !important;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      background: white;
      z-index: 1001;
      box-shadow: -4px 0 15px rgba(0,0,0,0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    
    .rb-mobile-sidebar.open {
      transform: translateX(0);
    }
    
    .rb-mobile-overlay {
      display: block !important;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    
    .rb-mobile-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    
    .rb-main-content {
      flex-direction: column !important;
    }
    
    /* Ensure the visible pane takes full width and height */
    .rb-editor-pane, .rb-preview-pane {
      width: 100% !important;
      flex: 1 !important;
      max-width: none !important;
      border: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    
    .rb-editor-pane.hidden-on-mobile,
    .rb-preview-pane.hidden-on-mobile {
      display: none !important;
    }
  }
`;

export const INITIAL_RESUME = {
  name: "John Doe",
  title: "Fullstack Web Developer",
  phone: "+91-9876543210",
  email: "john.doe@gmail.com",
  location: "New York, USA",
  experience_label: "2 Year of experience",
  photo: "",
  github: "",
  linkedin: "",
  mavenjobs: "",
  website: "",
  summary:
    "Software Developer skilled in front-end and actively growing in back-end development, specializing in React, JavaScript, Node.js, and modern web technologies. I focused on building fast, scalable, and user-centric applications while contributing effectively in dynamic, growth-driven tech environments.",
  workExperience: [
    {
      id: 1,
      role: "Fullstack Web Developer",
      company: "Unified Mentor",
      start: "Jun 2025",
      end: "Sep 2025",
      desc: "Enhanced my skills in frontend technologies and also explored indepth knowledge about backend technologies.",
    },
  ],
  projects: [
    {
      id: 1,
      name: "Web Development",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Learning more about Web Development technologies and **executing projects** which helped me grow outside my own environment.",
    },
    {
      id: 2,
      name: "Wanderer Wise – Your Travelling Companion",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Gained valuable experience in **real-world software development**—from building clean, responsive UIs to integrating AI for smart recommendations.",
    },
    {
      id: 3,
      name: "Machine Learning with Python",
      duration: "31 Days",
      year: "2025",
      link: "",
      desc: "Developed skills about **Machine Learning** using Python language.",
    },
  ],
  internships: [
    {
      id: 1,
      company: "Cognitive Classes",
      duration: "31 Days",
      role: "AI Intern",
    },
  ],
  education: [
    {
      id: 1,
      degree: "B.Tech/B.E. | Computers",
      institution: "Graphic Era University, Dehradun",
      year: "2025",
      grade: "7.4/10",
    },
    {
      id: 2,
      degree: "12th (CBSE)",
      institution: "English Medium",
      year: "2020",
      grade: "",
    },
  ],
  skills: [
    "UI/UX",
    "Redux",
    "NoSQL",
    "Figma",
    "MongoDB",
    "Alpha Testing",
    "API",
    "Express",
    "MERN Stack",
    "Node.js",
    "Front End Engineer",
    "JavaScript",
    "React.js",
  ],
  languages: ["English", "Hindi"],
  certifications: [],
  hobbies: [],
  extraCurricular: [],
  customSections: [],
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatYear = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return String(d.getFullYear());
};

export const generateResumeName = (name) => {
  if (!name || name === "John Doe" || name === "John")
    return "Resume_Candidate";
  return `Resume_${name.trim().replace(/\s+/g, "_")}`;
};

export const mapProfileToResume = (profile = {}, authUser = {}) => {
  const p = profile || {};
  const u = authUser || {};
  const innerUser = p.user || {};

  // 1. Personal Details
  const name = innerUser.name || u.name || p.name || INITIAL_RESUME.name;
  const title =
    p.headline ||
    p.currentTitle ||
    u.headline ||
    u.currentTitle ||
    u.department ||
    INITIAL_RESUME.title;
  const phone =
    p.phone || p.altPhone || u.phone || u.mobile || INITIAL_RESUME.phone;
  const email = innerUser.email || u.email || p.email || INITIAL_RESUME.email;

  const locParts = [
    p.currentCity || u.currentCity,
    p.currentState || u.currentState,
    p.currentCountry ||
      u.currentCountry ||
      (p.currentCity || u.currentCity ? "INDIA" : ""),
  ].filter(Boolean);
  const location =
    locParts.length > 0
      ? locParts.join(", ")
      : p.currentCity || u.currentCity || u.location || INITIAL_RESUME.location;

  const rawExp = p.totalExperience || u.totalExperience;
  const experience_label = rawExp
    ? String(rawExp).toLowerCase().includes("experience")
      ? rawExp
      : `${rawExp} of experience`
    : INITIAL_RESUME.experience_label;

  // Photo
  const photo =
    (typeof p.profilePic === "string" ? p.profilePic : p.profilePic?.url) ||
    u.avatar ||
    (typeof u.profilePic === "string" ? u.profilePic : u.profilePic?.url) ||
    "";

  // Links
  const github =
    p.github ||
    u.github ||
    (p.portfolioUrl?.includes("github.com") ? p.portfolioUrl : "") ||
    "";
  const linkedin = p.linkedInUrl || u.linkedInUrl || u.linkedin || "";
  const shareId = p.publicShareId || u.publicShareId;
  const mavenjobs = shareId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${shareId}`
    : "";
  const website = p.portfolioUrl || u.portfolioUrl || u.website || "";

  // Summary
  const summary =
    p.summary || p.about || u.summary || u.about || INITIAL_RESUME.summary;

  // 2. Work Experience
  let rawWork = p.workExperiences || u.workExperiences;
  if (typeof rawWork === "string") {
    try {
      rawWork = JSON.parse(rawWork);
    } catch {
      rawWork = [];
    }
  }
  let workExperience = [];
  if (Array.isArray(rawWork) && rawWork.length > 0) {
    workExperience = rawWork.map((item, idx) => ({
      id: item.id || idx + 1,
      role: item.role || item.title || item.designation || "Software Engineer",
      company: item.company || item.companyName || "",
      start:
        item.start || (item.startDate ? formatMonthYear(item.startDate) : ""),
      end: item.currentlyWorking
        ? "Present"
        : item.end ||
          (item.endDate ? formatMonthYear(item.endDate) : "Present"),
      desc:
        item.desc ||
        item.description ||
        item.summary ||
        (Array.isArray(item.skills) && item.skills.length
          ? `Skills: ${item.skills.join(", ")}`
          : ""),
    }));
  } else if (
    p.currentTitle ||
    u.currentTitle ||
    p.currentCompany ||
    u.currentCompany
  ) {
    workExperience = [
      {
        id: 1,
        role: p.currentTitle || u.currentTitle || "Software Engineer",
        company: p.currentCompany || u.currentCompany || "",
        start: "",
        end: "Present",
        desc: summary || "",
      },
    ];
  } else {
    workExperience = INITIAL_RESUME.workExperience;
  }

  // 3. Education
  let rawEdu = p.educations || u.educations;
  if (typeof rawEdu === "string") {
    try {
      rawEdu = JSON.parse(rawEdu);
    } catch {
      rawEdu = [];
    }
  }
  let education = [];
  if (Array.isArray(rawEdu) && rawEdu.length > 0) {
    education = rawEdu.map((item, idx) => {
      let degreeLabel = item.degree || item.course || "";
      if (item.field && degreeLabel) degreeLabel += ` | ${item.field}`;
      else if (!degreeLabel) degreeLabel = item.field || "Degree";

      let yearLabel = item.currentlyStudying
        ? `${formatYear(item.startYear)} - Present`
        : item.endYear
          ? item.startYear
            ? `${formatYear(item.startYear)} - ${formatYear(item.endYear)}`
            : formatYear(item.endYear)
          : item.year || item.duration || "";

      return {
        id: item.id || idx + 1,
        degree: degreeLabel,
        institution:
          item.school ||
          item.institution ||
          item.college ||
          item.university ||
          "",
        year: yearLabel,
        grade: item.grade || item.percentage || item.cgpa || "",
      };
    });
  } else if (p.education || u.education) {
    const singleEdu = p.education || u.education;
    education = [
      {
        id: 1,
        degree:
          typeof singleEdu === "string"
            ? singleEdu
            : singleEdu.degree || "Degree",
        institution: singleEdu.school || singleEdu.institution || "",
        year: singleEdu.year || "",
        grade: singleEdu.grade || "",
      },
    ];
  } else {
    education = INITIAL_RESUME.education;
  }

  // 4. Projects
  let rawProj = p.projects || u.projects;
  if (typeof rawProj === "string") {
    try {
      rawProj = JSON.parse(rawProj);
    } catch {
      rawProj = [];
    }
  }
  let projects = [];
  if (Array.isArray(rawProj) && rawProj.length > 0) {
    projects = rawProj.map((item, idx) => ({
      id: item.id || idx + 1,
      name: item.name || item.title || "Project",
      duration: item.duration || "",
      year: item.year || (item.createdAt ? formatYear(item.createdAt) : ""),
      link: item.link || item.projectLink || "",
      desc:
        item.desc ||
        item.description ||
        (Array.isArray(item.skills) && item.skills.length
          ? `Built using ${item.skills.join(", ")}`
          : ""),
    }));
  } else if (p.projectTitle || u.projectTitle) {
    projects = [
      {
        id: 1,
        name: p.projectTitle || u.projectTitle || "Project",
        duration: "",
        year: "",
        link: p.projectLink || u.projectLink || "",
        desc: p.projectDescription || u.projectDescription || "",
      },
    ];
  } else {
    projects = INITIAL_RESUME.projects;
  }

  // 5. Skills
  let skills = [];
  if (Array.isArray(p.skills) && p.skills.length > 0) {
    skills = p.skills;
  } else if (Array.isArray(u.skills) && u.skills.length > 0) {
    skills = u.skills;
  } else if (p.itSkills || u.itSkills) {
    const rawIt = p.itSkills || u.itSkills;
    skills =
      typeof rawIt === "string"
        ? rawIt
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(rawIt)
          ? rawIt
          : [];
  }
  if (!skills || skills.length === 0) {
    skills = INITIAL_RESUME.skills;
  }

  // 6. Languages, Certifications, Internships, Hobbies, Extra-Curricular
  const languages =
    Array.isArray(p.languages) && p.languages.length
      ? p.languages
      : Array.isArray(u.languages) && u.languages.length
        ? u.languages
        : INITIAL_RESUME.languages;

  let certifications = [];
  if (Array.isArray(p.certifications) && p.certifications.length) {
    certifications = p.certifications;
  } else if (Array.isArray(u.certifications) && u.certifications.length) {
    certifications = u.certifications;
  } else if (Array.isArray(p.achievements) && p.achievements.length) {
    certifications = p.achievements.map((a, i) => ({
      id: i + 1,
      name: typeof a === "string" ? a : a.title || a.name || "",
      issuer: a.issuer || "",
      year: a.year || "",
    }));
  }

  let internships = [];
  if (Array.isArray(p.internships) && p.internships.length) {
    internships = p.internships;
  } else if (Array.isArray(u.internships) && u.internships.length) {
    internships = u.internships;
  } else {
    const internExps = (Array.isArray(rawWork) ? rawWork : []).filter((w) =>
      (w.title || w.role || "").toLowerCase().includes("intern"),
    );
    if (internExps.length > 0) {
      internships = internExps.map((w, idx) => ({
        id: idx + 1,
        company: w.company || "",
        duration: w.duration || "",
        role: w.title || w.role || "Intern",
      }));
    } else {
      internships = INITIAL_RESUME.internships;
    }
  }

  const hobbies =
    Array.isArray(p.hobbies) && p.hobbies.length
      ? p.hobbies
      : Array.isArray(u.hobbies) && u.hobbies.length
        ? u.hobbies
        : [];
  const extraCurricular =
    Array.isArray(p.extraCurricular) && p.extraCurricular.length
      ? p.extraCurricular
      : Array.isArray(u.extraCurricular) && u.extraCurricular.length
        ? u.extraCurricular
        : [];
  const customSections =
    Array.isArray(p.customSections) && p.customSections.length
      ? p.customSections
      : Array.isArray(u.customSections) && u.customSections.length
        ? u.customSections
        : [];

  return {
    name,
    title,
    phone,
    email,
    location,
    experience_label,
    photo,
    github,
    linkedin,
    mavenjobs,
    website,
    summary,
    workExperience,
    projects,
    internships,
    education,
    skills,
    languages,
    certifications,
    hobbies,
    extraCurricular,
    customSections,
  };
};

export const FONT_SIZES = ["Small", "Medium", "Large"];
export const SPACINGS = ["Compact", "Medium", "Comfortable"];
export const THEME_COLORS = [
  "#143f86",
  "#1e40af",
  "#0d9488",
  "#16a34a",
  "#a0845c",
  "#7c3aed",
  "#475569",
];
