import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiUsers,
  FiZap,
  FiSearch,
  FiAward,
  FiMessageSquare,
  FiCheckCircle,
  FiTrendingUp,
  FiBriefcase,
  FiX,
  FiChevronDown,
  FiPlay,
  FiShield,
  FiBarChart2,
  FiTarget,
  FiCpu,
  FiLayers,
  FiEye,
  FiEyeOff,
  FiRefreshCcw,
  FiPhoneCall,
  FiClock,
  FiBookOpen,
  FiHelpCircle,
} from "react-icons/fi";
import { FaBuilding, FaQuoteLeft } from "react-icons/fa";
import { useAuth } from "../../../../AuthContext";
import authService from "../../../../services/authService";
import { useEmployerLanding } from "../../../../hooks/useLandingQueries";
import { usePublishedBlogs } from "../../../../hooks/useCandidateQueries";
import ForgotPassword from "../../../../auth/ForgotPassword";
import "./EmployerLandingPage.css";
import { SkeletonHomePage } from "../../../../components/Skeleton";
import EmployerFooter from "../../../../layout/employer/LandingEmployeeFooter";
import LandingEmployeeHeader from "../../../../layout/employer/LandingEmployeeHeader";
import TalentCloudDemoForm from "../../../../components/employer/TalentCloudDemoForm";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";

const employerBlogPostsFallback = [
  {
    id: 1,
    title: "10 AI-Powered Sourcing Strategies to Cut Time-to-Hire by 45%",
    category: "AI & RECRUITMENT",
    readTime: "5 min read",
    date: "Oct 12, 2026",
    excerpt: "Discover how top talent acquisition teams leverage algorithmic resume screening and automated pipeline triggers to connect with high-intent candidates faster.",
    author: "Maven Talent Research",
    link: "/blogs",
    coverImage: {
      url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: 2,
    title: "India Hiring Trends 2026: In-Demand Tech Skills & Compensation Benchmarks",
    category: "SALARY & MARKET INSIGHTS",
    readTime: "7 min read",
    date: "Oct 8, 2026",
    excerpt: "Comprehensive data across tier-1 and tier-2 tech hubs on developer salary expectations, remote vs hybrid flexibility, and emerging AI engineering roles.",
    author: "Editorial Team",
    link: "/blogs",
    coverImage: {
      url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: 3,
    title: "Building an Authentic Employer Brand that Attracts Passive Top Performers",
    category: "EMPLOYER BRANDING",
    readTime: "4 min read",
    date: "Oct 3, 2026",
    excerpt: "Practical guide to showcasing team culture, transparent growth paths, and employee value propositions that convert passive profile viewers into applicants.",
    author: "Hiring Advisory Group",
    link: "/blogs",
    coverImage: {
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    },
  },
];

const employerFaqs = [
  {
    q: "How does Free Job Posting work on Maven Jobs?",
    a: "Employers can publish active job vacancies at zero cost. Free postings remain active for 7 days, accept up to 50 relevant applications, and include applicant screening questions. For urgent hiring, featured placement, or unlimited applications, premium plans are available.",
  },
  {
    q: "How can I search and access candidates in the Resdex database?",
    a: "Resdex provides access to over 2 crore verified candidate profiles across India. You can run Boolean search queries, filter by technical skills, experience, current CTC, expected salary, notice period, and location, and unlock contact details using your account search credits.",
  },
  {
    q: "What is Maven Talent Cloud and what features does it include?",
    a: "Maven Talent Cloud is an integrated recruitment suite combining AI-driven talent sourcing, automated pre-screening, interview scheduling, employer branding, and collaborative ATS tools into a unified platform for growing businesses and enterprises.",
  },
  {
    q: "Can multiple recruiters and hiring managers share a company account?",
    a: "Yes. Maven Jobs supports multi-user sub-accounts with custom role permissions. Account administrators can allocate job posting quotas and resume search limits to individual recruiters while tracking team performance through centralized analytics.",
  },
  {
    q: "How quickly do candidate applications arrive and how can we manage candidate pipelines?",
    a: "Applications appear immediately in your Employer Dashboard as candidates apply. You can review full profiles, download resumes, track candidate status across custom stages (Shortlisted, Interview, Offer, Rejected), and send video call invites directly from your dashboard.",
  },
  {
    q: "What subscription plans and payment methods are available?",
    a: "We offer flexible pay-as-you-go packs, monthly recruiter subscriptions, and custom annual enterprise contracts. Payments can be made online via credit/debit card, UPI, Net Banking, or through corporate invoicing and NEFT/RTGS for business accounts.",
  },
  {
    q: "How does Maven Jobs protect candidate privacy and recruiter compliance?",
    a: "Maven Jobs strictly adheres to the Digital Personal Data Protection Act (DPDP) and international data security standards with 256-bit encryption. Candidate contact information is unlocked only for authorized recruitment purposes, and all communications are securely logged.",
  },
];

const getInitials = (value = "Company") =>
  String(value || "Company")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "CO";

const EmployerLandingPage = () => {
  const navigate = useNavigate();
  useAuth();
  const [employerSession, setEmployerSession] = useState(() => {
    const userStr = localStorage.getItem("employerUser");
    if (!userStr || userStr === "undefined") return null;
    try {
      const savedUser = JSON.parse(userStr);
      return savedUser
        ? {
            ...savedUser,
            companyName: savedUser.companyName || savedUser.company || "",
          }
        : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState("sales");

  const [hiringFor, setHiringFor] = useState("company");
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Select range");
  const [activeOfferingTab, setActiveOfferingTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [openEmployerFaq, setOpenEmployerFaq] = useState(null);

  useEffect(() => {
    if (isLoginModalOpen || isSalesModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsLoginModalOpen(false);
          setIsSalesModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isLoginModalOpen, isSalesModalOpen]);
  const [formStatus, setFormStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const {
    data: employerData = { stats: [], partners: [] },
    isLoading: loading,
  } = useEmployerLanding();
  const { data: blogsData, isLoading: blogsLoading } = usePublishedBlogs({
    limit: 3,
  });
  const dynamicBlogs = blogsData?.blogs?.length
    ? blogsData.blogs
    : employerBlogPostsFallback;
  const [enquiry, setEnquiry] = useState({
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    designation: "",
    city: "",
    password: "",
  });
  const [showEmployerForgotPassword, setShowEmployerForgotPassword] =
    useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!localStorage.getItem("employerUser")) return;

    let active = true;
    authService
      .getEmployerDashboard()
      .then((response) => {
        if (!active || !response?.data?.company) return;
        const nextSession = {
          ...(employerSession || {}),
          companyName:
            response.data.company.name || employerSession?.companyName || "",
          email: employerSession?.email || response.data.company.email || "",
          logoUrl: response.data.company.logoUrl || "",
          coverImageUrl: response.data.company.coverImageUrl || "",
          activeJobCount:
            response.data.tracking?.activeApprovedJobs ??
            response.data.company.activeJobCount ??
            0,
          totalApplications: response.data.tracking?.totalApplications ?? 0,
        };
        localStorage.setItem("employerUser", JSON.stringify(nextSession));
        setEmployerSession(nextSession);
      })
      .catch(() => {
        if (!active) return;
        localStorage.clear(); sessionStorage.clear();
        setEmployerSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const offerings = [
    {
      title: "Job Posting",
      desc: "Receive applications instantly and connect with high-quality, relevant candidates at scale.",
      icon: <FiBriefcase />,
      color: "#2563eb",
      bg: "#eff6ff",
      path: "/job-posting",
    },
    {
      title: "Profile Database",
      desc: "Access and attract from a real-time pool of 10 crore+ active jobseekers across India.",
      icon: <FiSearch />,
      color: "#7c3aed",
      bg: "#f5f3ff",
      path: "/resume-search",
    },
    {
      title: "Expert Assist",
      desc: "Leave sourcing and shortlisting to our hiring experts — you focus only on final interviews.",
      icon: <FiUsers />,
      color: "#0891b2",
      bg: "#ecfeff",
      path: "/expert-assist",
    },
    {
      title: "Employer Branding",
      desc: "Stand out as a top workplace and attract passive talent through custom brand campaigns.",
      icon: <FiAward />,
      color: "#d97706",
      bg: "#fffbeb",
      path: "/branding",
    },
    {
      title: "Hiring Automation",
      desc: "Streamline your recruitment workflow with AI-powered ATS and smart screening tools.",
      icon: <FiCpu />,
      color: "#059669",
      bg: "#ecfdf5",
      path: "/hiring-automation",
    },
    {
      title: "Talent Planning",
      desc: "Get deep insights into market trends and salary benchmarks to plan hiring with precision.",
      icon: <FiBarChart2 />,
      color: "#e11d48",
      bg: "#fff1f2",
      path: "/talent-pulse",
    },
  ];

  const fallbackStats = [
    { value: "10Cr+", label: "Registered jobseekers" },
    { value: "1.5L+", label: "Companies trust us" },
    { value: "98%", label: "Placement success rate" },
    { value: "48hrs", label: "Average time-to-hire" },
  ];
  // Production-ready fallback partners (no hardcoded internal/test brands)
  const fallbackPartners = [
    { id: "mavenjobs", name: "Maven Jobs" },
    { id: "mks-industrial-solutions", name: "MKS Industrial Solutions" },
    { id: "hello-ltd", name: "HELLO LTD" },
  ];

  const stats = employerData.stats?.length ? employerData.stats : fallbackStats;
  const partners = employerData.partners?.length
    ? employerData.partners
    : fallbackPartners;
  const marqueePartners = [...partners, ...partners];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "VP Talent, Flipkart",
      text: "MavenJobs helped us cut our hiring cycle by 40%. The AI-matching is genuinely impressive.",
      initials: "PS",
      color: "#2563eb",
    },
    {
      name: "Arjun Mehta",
      role: "HR Director, TCS",
      text: "We filled 200+ roles in a quarter using Resdex. The quality of candidates is unmatched.",
      initials: "AM",
      color: "#7c3aed",
    },
    {
      name: "Sneha Iyer",
      role: "Talent Lead, Microsoft",
      text: "The employer branding tools helped us become a recognized top workplace within 6 months.",
      initials: "SI",
      color: "#059669",
    },
  ];

  const businessTypes = [
    {
      icon: <FaBuilding size={28} />,
      title: "Large enterprises",
      subtitle: "End-to-end talent strategy",
      color: "#2563eb",
      bg: "#eff6ff",
      features: [
        "Fill any role — from bulk to leadership",
        "AI-powered candidate scoring",
        "Custom employer brand campaigns",
        "Dedicated account management",
      ],
    },
    {
      icon: <FiZap size={28} />,
      title: "SMBs & startups",
      subtitle: "Lean hiring, big results",
      color: "#059669",
      bg: "#ecfdf5",
      features: [
        "Find local candidates across India",
        "Hire for relevant experience fast",
        "Start hiring with affordable plans",
        "Self-serve dashboard",
      ],
      featured: true,
    },
    {
      icon: <FiMessageSquare size={28} />,
      title: "Consultants & agencies",
      subtitle: "Scale your placements",
      color: "#7c3aed",
      bg: "#f5f3ff",
      features: [
        "Speed up hiring with faster turnaround",
        "Multi-client management dashboard",
        "Instantly connect with candidates",
        "Performance analytics",
      ],
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Create your account",
      desc: "Sign up in under 2 minutes and set up your employer profile.",
    },
    {
      num: "02",
      title: "Post your requirements",
      desc: "Describe the role and let our AI surface the best-fit candidates.",
    },
    {
      num: "03",
      title: "Review & shortlist",
      desc: "Get ranked applications with AI insights straight to your dashboard.",
    },
    {
      num: "04",
      title: "Hire with confidence",
      desc: "Interview, select, and onboard — all tracked in one place.",
    },
  ];

  const updateEnquiry = (field, value) => {
    const nextValue =
      field === "phone"
        ? String(value || "")
            .replace(/\D/g, "")
            .slice(0, 10)
        : value;
    setEnquiry((current) => ({ ...current, [field]: nextValue }));
    setFormStatus({ loading: false, message: "", error: "" });
  };

  const submitEmployerSignup = async (event) => {
    event.preventDefault();
    const companyName = enquiry.companyName.trim();
    const email = enquiry.email.trim();
    const phone = enquiry.phone.trim();
    const fullName = enquiry.fullName.trim();
    const password = enquiry.password.trim();

    if (!fullName || !companyName || !email || !phone || !password) {
      setFormStatus({
        loading: false,
        message: "",
        error:
          "Please enter your name, company, work email, mobile number, and password.",
      });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setFormStatus({
        loading: false,
        message: "",
        error: "Enter a valid 10 digit mobile number.",
      });
      return;
    }

    if (password.length < 7 || password.length > 20) {
      setFormStatus({
        loading: false,
        message: "",
        error: "Password must be between 7 and 20 characters.",
      });
      return;
    }

    setFormStatus({ loading: true, message: "", error: "" });
    try {
      const response = await authService.employerRegister({
        fullName,
        companyName,
        email,
        phone,
        password,
        designation: enquiry.designation.trim() || "Company",
        city: enquiry.city.trim(),
      });

      const employerUser = {
        ...(response?.user || {}),
        companyName:
          response?.company?.name || response?.user?.companyName || companyName,
        logoUrl: response?.company?.logoUrl || response?.user?.logoUrl || "",
        coverImageUrl:
          response?.company?.coverImageUrl ||
          response?.user?.coverImageUrl ||
          "",
      };

      localStorage.setItem("employerUser", JSON.stringify(employerUser));
      setEmployerSession(employerUser);

      setFormStatus({
        loading: false,
        message:
          "Account created successfully. Redirecting to your dashboard...",
        error: "",
      });
      setEnquiry({
        fullName: "",
        phone: "",
        email: "",
        companyName: "",
        designation: "",
        city: "",
        password: "",
      });
      setTimeout(() => navigate("/employer-dashboard"), 650);
    } catch (error) {
      setFormStatus({
        loading: false,
        message: "",
        error: error.message || "Unable to submit request right now.",
      });
    }
  };

  const submitCallbackRequest = async (event) => {
    event.preventDefault();
    const companyName = enquiry.companyName.trim();
    const email = enquiry.email.trim();
    const phone = enquiry.phone.trim();
    const roleTitle =
      enquiry.designation.trim() ||
      `Employer signup for ${enquiry.fullName.trim() || companyName}`;

    if (!companyName || !email || !phone || !roleTitle) {
      setFormStatus({
        loading: false,
        message: "",
        error: "Please enter company, work email, phone, and designation.",
      });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setFormStatus({
        loading: false,
        message: "",
        error: "Enter a valid 10 digit mobile number.",
      });
      return;
    }

    setFormStatus({ loading: true, message: "", error: "" });
    try {
      const response = await authService.submitEmployerEnquiry({
        companyName,
        email,
        phone: `+91${phone}`,
        roleTitle,
        roleDescription: [
          enquiry.fullName ? `Contact: ${enquiry.fullName}` : "",
          hiringFor ? `Hiring for: ${hiringFor}` : "",
          enquiry.city ? `City: ${enquiry.city}` : "",
          selectedRange !== "Select range"
            ? `Hiring range: ${selectedRange}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        budget: selectedRange !== "Select range" ? selectedRange : "",
      });

      setFormStatus({
        loading: false,
        message: response?.referenceId
          ? `Sign up submitted. Reference ID: ${response.referenceId}`
          : "Sign up submitted. Our team will contact you shortly.",
        error: "",
      });
      setEnquiry({
        fullName: "",
        phone: "",
        email: "",
        companyName: "",
        designation: "",
        city: "",
        password: "",
      });
      setSelectedRange("Select range");
    } catch (error) {
      setFormStatus({
        loading: false,
        message: "",
        error: error.message || "Unable to submit request right now.",
      });
    }
  };

  const submitEmployerLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);
    try {
      const response = await authService.employerLogin(
        loginEmail,
        loginPassword,
      );
      if (response?.success || response?.user) {
        const employerUser = {
          ...(response.user || {}),
          companyName:
            response?.company?.name || response?.user?.companyName || "",
          logoUrl: response?.company?.logoUrl || response?.user?.logoUrl || "",
          coverImageUrl:
            response?.company?.coverImageUrl ||
            response?.user?.coverImageUrl ||
            "",
          activeJobCount:
            response?.tracking?.activeApprovedJobs ??
            response?.company?.activeJobCount ??
            0,
          totalApplications: response?.tracking?.totalApplications ?? 0,
        };
        localStorage.setItem("employerUser", JSON.stringify(employerUser));
        setEmployerSession(employerUser);
        navigate("/employer-dashboard");
      } else {
        setLoginError("Invalid response from server. Please try again.");
      }
    } catch (error) {
      setLoginError(error.message || "Invalid employer credentials.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (loading) return <SkeletonHomePage />;

  return (
    <>
      <div className="elp-root">
        {/* ─── Navbar ─── */}
        <LandingEmployeeHeader
          isLoggedIn={!!employerSession}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* ─── Hero ─── */}
        <section className="elp-hero">
          <div className="elp-hero-spline">
            <iframe
              src="https://my.spline.design/3drobotheadtrackingmouse-NHtRtyr7t11PThDyraVaeDCW/"
              frameBorder="0"
              width="100%"
              height="100%"
              title="Spline Background"
            />
            {/* Overlay to hide the Spline watermark */}
            <div 
              style={{ 
                position: "absolute", 
                bottom: 0, 
                right: 0, 
                width: "180px", 
                height: "60px", 
                backgroundColor: "#020617", 
                zIndex: 1 
              }} 
            />
            <div className="elp-hero-overlay" />
          </div>

          <div className="elp-hero-inner">
            <div className="elp-hero-left">
              <div className="elp-hero-eyebrow">
                <span className="elp-eyebrow-dot" />
                Talent Decoded
              </div>
              <h1 className="elp-hero-h1">
                Decode India's
                <br />
                largest talent pool
                <br />
                with the power of <span className="elp-hero-accent">AI</span>
              </h1>
              <p className="elp-hero-sub">
                Accelerate hiring with data-driven precision. Scale your
                workforce with unparalleled intelligence and seamless
                recruitment workflows.
              </p>

              <div className="elp-hero-stats">
                {stats.map((s, i) => (
                  <div key={i} className="elp-hero-stat">
                    <span className="elp-hero-stat-val">{s.value}</span>
                    <span className="elp-hero-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>


            </div>

            {/* Desktop Callback Card / Profile Modal */}
            <div
              className={`elp-callback-card elp-desktop-callback-card ${employerSession ? "logged-in" : ""}`}
              style={employerSession ? { padding: 0, overflow: "hidden" } : {}}
            >
              {!employerSession && (
                <div className="elp-card-top-pill">
                  <button
                    type="button"
                    className={`elp-card-pill-btn ${activeTab === "sales" ? "active" : ""}`}
                    onClick={() => setActiveTab("sales")}
                  >
                    Sales enquiry
                  </button>
                  <button
                    type="button"
                    className={`elp-card-pill-btn ${activeTab !== "sales" ? "active" : ""}`}
                    onClick={() => setActiveTab("login")}
                  >
                    Register/Log in
                  </button>
                </div>
              )}

              {employerSession ? (
                <div className="elp-profile-modal">
                  {/* Cover Image */}
                  <div
                    style={{
                      height: "140px",
                      background: employerSession.coverImageUrl
                        ? `url("${employerSession.coverImageUrl}") center/cover no-repeat`
                        : "linear-gradient(135deg, #0f172a 0%, #172554 52%, #0f766e 100%)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.48))",
                      }}
                    />
                  </div>

                  {/* Profile Info */}
                  <div
                    style={{
                      padding: "0 24px 24px",
                      textAlign: "center",
                      marginTop: "-45px",
                    }}
                  >
                    <div
                      style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "20px",
                        background: employerSession.logoUrl
                          ? `url("${employerSession.logoUrl}") center/cover no-repeat`
                          : "linear-gradient(135deg, #002366, #10b981)",
                        border: "4px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        margin: "0 auto 16px",
                        position: "relative",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 900,
                        fontSize: "1.35rem",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {!employerSession.logoUrl &&
                        getInitials(
                          employerSession.companyName ||
                            employerSession.username,
                        )}
                    </div>

                    <h3
                      style={{
                        color: "#fff",
                        fontSize: "1.5rem",
                        fontWeight: "800",
                        marginBottom: "4px",
                        fontFamily: "inherit",
                      }}
                    >
                      {employerSession.companyName ||
                        employerSession.username ||
                        "Employer workspace"}
                    </h3>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.9rem",
                        marginBottom: "20px",
                      }}
                    >
                      {employerSession.email || "Verified employer account"}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "24px",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div
                          style={{
                            color: "#10b981",
                            fontWeight: "800",
                            fontSize: "1.1rem",
                          }}
                        >
                          {employerSession.activeJobCount ?? 0}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Active Jobs
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div
                          style={{
                            color: "#6366f1",
                            fontWeight: "800",
                            fontSize: "1.1rem",
                          }}
                        >
                          {employerSession.totalApplications ?? 0}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Applicants
                        </div>
                      </div>
                    </div>

                    <button
                      className="elp-btn-callback"
                      onClick={() => navigate("/employer-dashboard")}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #2563eb, #1e40af)",
                        border: "none",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                      }}
                    >
                      Go to Dashboard <FiArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : activeTab === "sales" ? (
                <TalentCloudDemoForm
                  isEmbedded={true}
                  showTitle={false}
                  buttonText="Request callback"
                  hiringForLabel="HIRING FOR"
                  onSubmit={async (data) => {
                    await authService.submitSalesEnquiry({
                      fullName: data.fullName,
                      mobile: data.mobile,
                      email: data.email,
                      entityType: data.entityType,
                      designation: data.designation,
                      organizationName: data.organizationName,
                      employeeCount: data.employeeCount,
                      city: data.city,
                      source: "EMPLOYER_LANDING",
                    });
                  }}
                />
              ) : activeTab === "signup" ? (
                <form
                  className="elp-callback-form"
                  onSubmit={submitEmployerSignup}
                >
                  <div className="elp-form-group">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={enquiry.fullName}
                      onChange={(event) =>
                        updateEnquiry("fullName", event.target.value)
                      }
                    />
                  </div>
                  <div className="elp-form-group">
                    <label>Mobile number</label>
                    <div className="elp-phone-input">
                      <span>+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10 digit mobile number"
                        value={enquiry.phone}
                        onChange={(event) =>
                          updateEnquiry("phone", event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="elp-form-group">
                    <label>Work email</label>
                    <input
                      type="email"
                      placeholder="Enter your work email"
                      value={enquiry.email}
                      onChange={(event) =>
                        updateEnquiry("email", event.target.value)
                      }
                    />
                  </div>
                  <div className="elp-form-group">
                    <label>Company / consultancy name</label>
                    <input
                      type="text"
                      placeholder="Enter organisation name"
                      value={enquiry.companyName}
                      onChange={(event) =>
                        updateEnquiry("companyName", event.target.value)
                      }
                    />
                  </div>
                  <div className="elp-form-group">
                    <label>Password</label>
                    <div className="elp-password-input">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={enquiry.password}
                        onChange={(event) =>
                          updateEnquiry("password", event.target.value)
                        }
                        minLength={7}
                        maxLength={20}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="elp-password-toggle"
                        onClick={() =>
                          setShowSignupPassword((current) => !current)
                        }
                        aria-label={
                          showSignupPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showSignupPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                    <div className="elp-password-hint">
                      Use 7 to 20 characters.
                    </div>
                  </div>
                  {formStatus.error && (
                    <div className="elp-form-error">{formStatus.error}</div>
                  )}
                  {formStatus.message && (
                    <div className="elp-form-success">{formStatus.message}</div>
                  )}
                  <button
                    type="submit"
                    className="elp-btn-callback"
                    disabled={formStatus.loading}
                  >
                    {formStatus.loading ? "Creating account..." : "Sign Up"}{" "}
                    <FiArrowRight size={16} />
                  </button>
                  <p className="elp-callback-note">
                    <FiShield size={12} /> Your data is safe. No spam, ever.
                  </p>
                </form>
              ) : (
                <form
                  className="elp-callback-form elp-login-form"
                  onSubmit={submitEmployerLogin}
                >
                  <div className="elp-form-group">
                    <label>Work Email ID</label>
                    <input
                      type="email"
                      placeholder="Enter registered email ID"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError("");
                      }}
                    />
                  </div>
                  <div className="elp-form-group">
                    <label>Password</label>
                    <div className="elp-password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginError("");
                        }}
                      />
                      <button
                        type="button"
                        className="elp-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                    <div style={{ textAlign: "right", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setShowEmployerForgotPassword(true)}
                        className="elp-forgot-link"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontFamily: "inherit",
                          fontSize: "inherit",
                          fontWeight: "inherit",
                          color: "inherit",
                          textDecoration: "none",
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: "13px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        padding: "8px 12px",
                        background: "rgba(239,68,68,0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="elp-btn-callback"
                    style={{ marginTop: "12px" }}
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? "Logging in..." : "Log in"}
                  </button>

                  <div className="elp-login-footer">
                    Don't have a registered email?{" "}
                    <button
                      type="button"
                      className="elp-signup-link"
                      onClick={() => navigate("/recruit/client-registration-form")}
                    >
                      Create account
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Mobile Auth Buttons (visible on screens <= 1024px) */}
            {!employerSession ? (
              <div className="elp-mobile-auth-actions">
                <button
                  type="button"
                  className="elp-mobile-btn-sales"
                  onClick={() => setIsSalesModalOpen(true)}
                >
                  <FiPhoneCall size={16} /> Sales enquiry
                </button>
                <button
                  type="button"
                  className="elp-mobile-btn-login"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Employer Login <FiArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="elp-mobile-btn-register"
                  onClick={() => navigate("/recruit/client-registration-form")}
                >
                  Register as Employer <FiArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="elp-mobile-auth-actions">
                <button
                  type="button"
                  className="elp-mobile-btn-register"
                  onClick={() => navigate("/employer-dashboard")}
                >
                  Go to Dashboard <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Partners Strip ─── */}
        <div className="elp-partners">
          <div className="elp-partners-inner">
            <span className="elp-partners-label">
              Trusted by India's leading companies
            </span>
            <div
              className="elp-partners-marquee"
              aria-label="Trusted company logos marquee"
            >
              <div className="elp-partners-track">
                {marqueePartners.map((partner, index) => {
                  const key = `${partner.id || partner.name}-${index}`;
                  const content = partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} />
                  ) : (
                    partner.name
                  );
                  return partner.id ? (
                    <Link
                      key={key}
                      to={`/company/${partner.id}`}
                      className="elp-partner-logo"
                    >
                      {content}
                    </Link>
                  ) : (
                    <span key={key} className="elp-partner-logo">
                      {content}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Bar ─── */}
        <div className="elp-stats-bar">
          {stats.map((s, i) => (
            <div key={i} className="elp-stat-item">
              <span className="elp-stat-val">{s.value}</span>
              <span className="elp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ─── Offerings ─── */}
        <section className="elp-section" id="offerings">
          <div className="elp-section-inner">
            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Our Solutions</span>
              <h2 className="elp-section-h2">
                Everything you need to hire better
              </h2>
              <p className="elp-section-sub">
                From planning and branding to sourcing and automation — we
                handle it all so you can focus on hiring the best talent.
              </p>
            </div>

            <div className="elp-offerings-grid">
              {offerings.map((item, i) => (
                <div key={i} className="elp-offering-card">
                  <div
                    className="elp-offering-icon"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="elp-offering-title">{item.title}</h3>
                  <p className="elp-offering-desc">{item.desc}</p>
                  <Link
                    to={item.path}
                    className="elp-offering-link"
                    style={{ color: item.color }}
                  >
                    View plans <FiArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="elp-hiw-section" id="how-it-works">
          <div className="elp-section-inner">
            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Simple Process</span>
              <h2 className="elp-section-h2">Hire in 4 simple steps</h2>
              <p className="elp-section-sub">
                Get from job posting to hired candidate in record time.
              </p>
            </div>
            <div className="elp-steps-grid">
              {steps.map((step, i) => (
                <div key={i} className="elp-step-card">
                  <div className="elp-step-num">{step.num}</div>
                  <div
                    className="elp-step-connector"
                    style={{ opacity: i < steps.length - 1 ? 1 : 0 }}
                  />
                  <h3 className="elp-step-title">{step.title}</h3>
                  <p className="elp-step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Business Types ─── */}
        <section className="elp-section elp-biz-section" id="solutions">
          <div className="elp-section-inner">
            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Business Focus</span>
              <h2 className="elp-section-h2">
                Built for every kind of business
              </h2>
              <p className="elp-section-sub">
                Big or small, we've got you covered at every stage of growth.
              </p>
            </div>
            <div className="elp-biz-grid">
              {businessTypes.map((biz, i) => (
                <div
                  key={i}
                  className={`elp-biz-card ${biz.featured ? "featured" : ""}`}
                >
                  {biz.featured && (
                    <div className="elp-featured-badge">Most popular</div>
                  )}
                  <div
                    className="elp-biz-icon"
                    style={{ background: biz.bg, color: biz.color }}
                  >
                    {biz.icon}
                  </div>
                  <h3 className="elp-biz-title">{biz.title}</h3>
                  <p className="elp-biz-subtitle">{biz.subtitle}</p>
                  <ul className="elp-biz-features">
                    {biz.features.map((f, j) => (
                      <li key={j}>
                        <FiCheckCircle
                          size={15}
                          style={{ color: biz.color, flexShrink: 0 }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="elp-biz-btn"
                    style={
                      biz.featured
                        ? {
                            background: biz.color,
                            color: "white",
                            borderColor: biz.color,
                          }
                        : { borderColor: biz.color, color: biz.color }
                    }
                    onClick={() => navigate("/recruit/client-registration-form")}
                  >
                    Sign Up
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="elp-testimonials-section">
          <div className="elp-section-inner">



            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Customer Stories</span>
              <h2 className="elp-section-h2">Trusted by 1.5L+ companies</h2>
            </div>
            <div className="elp-testimonials-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="elp-testimonial-card">
                  <FaQuoteLeft
                    size={20}
                    style={{ color: t.color, opacity: 0.6, marginBottom: 16 }}
                  />
                  <p className="elp-testimonial-text">"{t.text}"</p>
                  <div className="elp-testimonial-author">
                    <div
                      className="elp-testimonial-avatar"
                      style={{ background: t.color + "20", color: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="elp-testimonial-name">{t.name}</div>
                      <div className="elp-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Hiring Blogs & Recruiter Insights ─── */}
        <section className="elp-section elp-blog-section">
          <div className="elp-section-inner">
            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Recruiter Insights</span>
              <h2 className="elp-section-h2">From Our Hiring Blog</h2>
              <p className="elp-section-sub">
                Actionable talent acquisition strategies, salary benchmarks, and AI hiring trends to help you recruit smarter.
              </p>
            </div>

            <div className="elp-blog-grid">
              {blogsLoading
                ? [1, 2, 3].map((n) => (
                    <div key={n} className="elp-blog-skeleton-card">
                      <div className="elp-blog-skeleton-img" />
                      <div className="elp-blog-skeleton-bar" style={{ width: "35%", height: 18 }} />
                      <div className="elp-blog-skeleton-bar" style={{ width: "90%", height: 22 }} />
                      <div className="elp-blog-skeleton-bar" style={{ width: "75%", height: 16 }} />
                      <div className="elp-blog-skeleton-bar" style={{ width: "100%", height: 14, marginTop: 10 }} />
                      <div className="elp-blog-skeleton-bar" style={{ width: "85%", height: 14 }} />
                    </div>
                  ))
                : dynamicBlogs.slice(0, 3).map((post) => {
                    const slug = post.slug;
                    const link = slug ? `/blogs/${slug}` : (post.link || "/blogs");
                    const category = post.category || "Recruiter Insights";
                    const readTime = post.metadata?.readTimeMinutes
                      ? `${post.metadata.readTimeMinutes} min read`
                      : (post.readTime || "5 min read");
                    const authorName = post.author?.name || post.author || "Maven Jobs";
                    const excerpt = post.excerpt || "";
                    const title = post.title;
                    const coverUrl = post.coverImage?.url;

                    return (
                      <Link
                        key={post._id || post.id || slug}
                        to={link}
                        className="elp-blog-card"
                      >
                        {coverUrl && (
                          <div className="elp-blog-img-wrap">
                            <img
                              src={coverUrl}
                              alt={title}
                              className="elp-blog-img"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="elp-blog-card-top">
                          <span className="elp-blog-badge">{category}</span>
                          <span className="elp-blog-meta">
                            <FiClock size={12} /> {readTime}
                          </span>
                        </div>
                        <h3 className="elp-blog-title">{title}</h3>
                        {excerpt && <p className="elp-blog-excerpt">{excerpt}</p>}
                        <div className="elp-blog-footer">
                          <span className="elp-blog-author">{authorName}</span>
                          <span className="elp-blog-read-more">
                            Read article <FiArrowRight size={13} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
            </div>

            <div className="elp-blog-cta-row">
              <Link to="/blogs" className="elp-btn-outline">
                <FiBookOpen size={16} /> Explore All Articles
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Recruiter FAQs ─── */}
        <section className="elp-section elp-faq-section" id="faq">
          <div className="elp-section-inner">
            <div className="elp-section-header">
              <span className="elp-eyebrow-tag">Got Questions?</span>
              <h2 className="elp-section-h2">Frequently Asked Questions</h2>
              <p className="elp-section-sub">
                Everything you need to know about job posting, resume database access, pricing, and candidate verification.
              </p>
            </div>

            <div className="elp-faq-list">
              {employerFaqs.map((faq, idx) => {
                const isOpen = openEmployerFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`elp-faq-item ${isOpen ? "open" : ""}`}
                  >
                    <button
                      type="button"
                      className="elp-faq-btn"
                      onClick={() => setOpenEmployerFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="elp-faq-q-text">{faq.q}</span>
                      <FiChevronDown
                        size={18}
                        className={`elp-faq-chevron ${isOpen ? "rotate" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="elp-faq-ans">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="elp-faq-footer-help">
              <FiHelpCircle size={22} className="elp-faq-help-icon" />
              <div className="elp-faq-help-content">
                <strong>Need custom enterprise solutions or specialized hiring assistance?</strong>
                <p>Our talent advisors and recruitment consultants are available 6 days a week.</p>
              </div>
              <button
                type="button"
                className="elp-btn-filled elp-faq-help-btn"
                onClick={() => {
                  if (window.innerWidth <= 1024) {
                    setIsSalesModalOpen(true);
                  } else {
                    setActiveTab("sales");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                Talk to Sales
              </button>
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="elp-cta-banner">
          <div className="elp-cta-inner">
            <div className="elp-cta-left">
              <h2 className="elp-cta-h2">
                Ready to find your next great hire?
              </h2>
              <p className="elp-cta-sub">
                Join 1.5 lakh+ companies already using MavenJobs to build
                world-class teams.
              </p>
            </div>
            <div className="elp-cta-actions">
              <button
                className="elp-btn-filled elp-btn-lg"
                onClick={() => navigate("/recruit/client-registration-form")}
              >
                Get started free <FiArrowRight size={18} />
              </button>
              <a
                href="#sales-enquiry"
                className="elp-cta-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.innerWidth <= 1024) {
                    setIsSalesModalOpen(true);
                  } else {
                    setActiveTab("sales");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                Talk to sales <FiArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <EmployerFooter />
      </div>

      {/* ─── Fullscreen Mobile Sales Enquiry Modal ─── */}
      {isSalesModalOpen && (
        <div className="elp-fullscreen-login-modal elp-fullscreen-sales-modal" role="dialog" aria-modal="true">
          <div className="elp-fullscreen-modal-header">
            <Link to="/" onClick={() => setIsSalesModalOpen(false)}>
              <img
                src={mavenLogo}
                alt="Maven Jobs Logo"
                style={{ height: "36px", objectFit: "contain" }}
              />
            </Link>
            <button
              type="button"
              className="elp-fullscreen-modal-close"
              onClick={() => setIsSalesModalOpen(false)}
              aria-label="Close Sales Enquiry Modal"
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="elp-fullscreen-modal-body">
            <div className="elp-card-top-pill" style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className="elp-card-pill-btn active"
                onClick={() => {}}
              >
                Sales enquiry
              </button>
              <button
                type="button"
                className="elp-card-pill-btn"
                onClick={() => {
                  setIsSalesModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                Register/Log in
              </button>
            </div>

            <div className="elp-fullscreen-modal-title">Sales enquiry</div>
            <p className="elp-fullscreen-modal-sub">
              Book your personalized demo or request a callback from our hiring specialists.
            </p>

            <TalentCloudDemoForm
              isEmbedded={true}
              showTitle={false}
              buttonText="Request callback"
              hiringForLabel="HIRING FOR"
              onSubmit={async (data) => {
                await authService.submitSalesEnquiry({
                  fullName: data.fullName,
                  mobile: data.mobile,
                  email: data.email,
                  entityType: data.entityType,
                  designation: data.designation,
                  organizationName: data.organizationName,
                  employeeCount: data.employeeCount,
                  city: data.city,
                  source: "EMPLOYER_LANDING",
                });
              }}
            />

            <div className="elp-login-footer" style={{ marginTop: "24px" }}>
              Already registered?{" "}
              <button
                type="button"
                className="elp-signup-link"
                onClick={() => {
                  setIsSalesModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                Log in here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Fullscreen Mobile Login Modal ─── */}
      {isLoginModalOpen && (
        <div className="elp-fullscreen-login-modal" role="dialog" aria-modal="true">
          <div className="elp-fullscreen-modal-header">
            <Link to="/" onClick={() => setIsLoginModalOpen(false)}>
              <img
                src={mavenLogo}
                alt="Maven Jobs Logo"
                style={{ height: "36px", objectFit: "contain" }}
              />
            </Link>
            <button
              type="button"
              className="elp-fullscreen-modal-close"
              onClick={() => setIsLoginModalOpen(false)}
              aria-label="Close Login Modal"
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="elp-fullscreen-modal-body">
            <div className="elp-card-top-pill" style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className="elp-card-pill-btn"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setIsSalesModalOpen(true);
                }}
              >
                Sales enquiry
              </button>
              <button
                type="button"
                className="elp-card-pill-btn active"
                onClick={() => {}}
              >
                Register/Log in
              </button>
            </div>

            <div className="elp-fullscreen-modal-title">Employer Login</div>
            <p className="elp-fullscreen-modal-sub">
              Sign in to manage your jobs, candidates, and hiring pipeline.
            </p>

            <form
              className="elp-callback-form elp-login-form"
              onSubmit={async (e) => {
                await submitEmployerLogin(e);
              }}
            >
              <div className="elp-form-group">
                <label>Work Email ID</label>
                <input
                  type="email"
                  placeholder="Enter registered email ID"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError("");
                  }}
                  required
                />
              </div>

              <div className="elp-form-group">
                <label>Password</label>
                <div className="elp-password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError("");
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="elp-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginModalOpen(false);
                      setShowEmployerForgotPassword(true);
                    }}
                    className="elp-forgot-link"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      fontWeight: "inherit",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {loginError && (
                <div
                  style={{
                    color: "#ef4444",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    padding: "8px 12px",
                    background: "rgba(239,68,68,0.1)",
                    borderRadius: "8px",
                  }}
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="elp-btn-callback"
                style={{ marginTop: "12px" }}
                disabled={isLoginLoading}
              >
                {isLoginLoading ? "Logging in..." : "Log in"}
              </button>

              <div className="elp-login-footer">
                Need a demo or sales callback?{" "}
                <button
                  type="button"
                  className="elp-signup-link"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setIsSalesModalOpen(true);
                  }}
                >
                  Sales enquiry
                </button>
              </div>

              <div className="elp-login-footer" style={{ marginTop: "8px" }}>
                Don't have an employer account?{" "}
                <button
                  type="button"
                  className="elp-signup-link"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    navigate("/recruit/client-registration-form");
                  }}
                >
                  Register now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ForgotPassword
        isOpen={showEmployerForgotPassword}
        onClose={() => setShowEmployerForgotPassword(false)}
        userType="employer"
      />
    </>
  );
};

export default EmployerLandingPage;

