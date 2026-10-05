import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CandidateHeader from "../../../../components/common/CandidateHeader";
import LandingFooter from "../../../../layout/candidate/LandingFooter";
import {
  FiSmartphone,
  FiDownload,
  FiBell,
  FiZap,
  FiMessageSquare,
  FiTrendingUp,
  FiCheckCircle,
  FiStar,
  FiCopy,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiBriefcase,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiExternalLink,
  FiPlay,
  FiPause,
  FiRotateCcw
} from "react-icons/fi";
import { FaGooglePlay, FaApple } from "react-icons/fa";
import "./AppDownloadPage.css";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mavenjobs";
const APP_STORE_URL = "https://apps.apple.com/app/maven-jobs/id6440000000";
const QR_IMAGE_URL = "https://res.cloudinary.com/dntt0iavv/image/upload/v1790405098/email-assets/maven-app-download-qr.png";

const CANDIDATE_DEMO_STEPS = [
  { label: "1. Discovering Verified Job Openings", tab: "discover" },
  { label: "2. 1-Tap Application Sent to Razorpay", tab: "discover" },
  { label: "3. Direct Recruiter Message & Interview Invite", tab: "chat" },
  { label: "4. Live Application Status & Milestones", tab: "applied" }
];

export default function AppDownloadPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive Candidate iPhone Simulator State
  const [candTab, setCandTab] = useState("discover"); // 'discover' | 'applied' | 'chat'
  const [appliedJobs, setAppliedJobs] = useState({ 2: true }); // Pre-shortlisted
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-running Video Walkthrough Loop State
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [demoStep, setDemoStep] = useState(0);

  // Loop timer: advances step every 4.2 seconds
  useEffect(() => {
    if (!isPlayingDemo) return;

    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % CANDIDATE_DEMO_STEPS.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlayingDemo]);

  // Execute demo actions when demoStep changes
  useEffect(() => {
    if (!isPlayingDemo) return;

    if (demoStep === 0) {
      setCandTab("discover");
      setAppliedJobs({ 2: true });
      triggerToast("Browsing 100,000+ verified matching jobs...");
    } else if (demoStep === 1) {
      setCandTab("discover");
      setAppliedJobs({ 1: true, 2: true });
      triggerToast("✓ 1-Tap Applied to Razorpay! Profile delivered to HR.");
    } else if (demoStep === 2) {
      setCandTab("chat");
      triggerToast("New message received from Swiggy Talent Acquisition!");
    } else if (demoStep === 3) {
      setCandTab("applied");
      triggerToast("Tracking milestones: Razorpay (Viewed) · Swiggy (Shortlisted)");
    }
  }, [demoStep, isPlayingDemo]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleApply = (id, company, role) => {
    setIsPlayingDemo(false); // Pause auto-demo on manual interaction
    setAppliedJobs((prev) => {
      const already = Boolean(prev[id]);
      if (!already) {
        triggerToast(`✓ 1-Tap Applied to ${company} for ${role}! Profile sent.`);
        return { ...prev, [id]: true };
      } else {
        triggerToast(`Application already submitted to ${company}.`);
        return prev;
      }
    });
  };

  useEffect(() => {
    document.title = "Download MavenJobs App - Candidate Job Search & Career App";
    window.scrollTo(0, 0);

    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    // If accessed directly on mobile browser, auto-redirect to candidate store
    if (/android/i.test(ua)) {
      window.location.href = PLAY_STORE_URL;
    } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      window.location.href = APP_STORE_URL;
    }
  }, []);

  const handleSendSms = (e) => {
    e.preventDefault();
    if (phoneNumber.trim().length >= 10) {
      setSmsSent(true);
      setTimeout(() => setSmsSent(false), 6000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const candidatePillars = [
    {
      icon: <FiBell />,
      bg: "#eff6ff",
      color: "#2563eb",
      title: "Real-Time Job Radar",
      desc: "Receive instant push alerts within 30 seconds when high-match jobs matching your expected CTC and target location are posted."
    },
    {
      icon: <FiZap />,
      bg: "#fef3c7",
      color: "#d97706",
      title: "1-Tap Express Apply",
      desc: "Apply to top tech MNCs, BFSI giants, and funded startups with your pre-synced ATS resume in a single tap without tedious forms."
    },
    {
      icon: <FiMessageSquare />,
      bg: "#ecfdf5",
      color: "#059669",
      title: "Direct Recruiter Chat",
      desc: "Chat directly with verified talent acquisition leaders, accept interview invites, and discuss role expectations in real time."
    },
    {
      icon: <FiDollarSign />,
      bg: "#f3e8ff",
      color: "#7c3aed",
      title: "Salary & Hike Insights",
      desc: "Unlock real verified compensation benchmarks for your years of experience, design role, or tech stack before accepting any interview."
    },
    {
      icon: <FiTrendingUp />,
      bg: "#fef2f2",
      color: "#dc2626",
      title: "Live Application Tracker",
      desc: "Know exactly when your profile was reviewed, shortlisted, or downloaded by HR teams with transparent pipeline milestones."
    },
    {
      icon: <FiShield />,
      bg: "#e0f2fe",
      color: "#0284c7",
      title: "100% Spam-Protected & Verified",
      desc: "Zero fake consultancy fees or spam. Every posting is vetted through company GSTIN and business domain verification."
    }
  ];

  const candidateReviews = [
    {
      quote: "Got placed as Senior Frontend Engineer in 12 days! The real-time notification popped up right as the role opened, and I applied within seconds. The recruiter contacted me directly in the app chat.",
      name: "Rohit Deshmukh",
      role: "Senior SDE · Placed at SaaS Unicorn",
      rating: 5
    },
    {
      quote: "The salary insights on the MavenJobs app helped me negotiate a 42% hike. Being able to track when recruiters download your resume takes all the anxiety out of the job hunt.",
      name: "Sneha Mukherjee",
      role: "Product Marketing Manager · Gurgaon",
      rating: 5
    },
    {
      quote: "Clean, fast, and completely distraction-free. No spam consultancies calling at odd hours. If you're a serious professional looking for career advancement, this app is indispensable.",
      name: "Arunachalam V.",
      role: "Lead DevOps Specialist · Bengaluru",
      rating: 5
    }
  ];

  const candidateFaqs = [
    {
      q: "Is the MavenJobs Candidate Mobile App free to use?",
      a: "Yes, 100% free! MavenJobs never charges jobseekers for downloading the app, applying to jobs, creating a digital resume, or communicating with verified recruiters."
    },
    {
      q: "How fast do I receive alerts when matching jobs are posted?",
      a: "Our background matching engine scans thousands of newly approved vacancies every minute. You receive instant push alerts within 30 to 60 seconds of a relevant opening going live."
    },
    {
      q: "Can I store multiple tailored resumes on my mobile device?",
      a: "Absolutely. You can upload up to 5 role-specific resumes (e.g. SDE Backend vs Fullstack, or Specialist vs Management) and select your preferred version when applying with 1-tap."
    },
    {
      q: "How does the app protect my current employment privacy?",
      a: "You can easily block your current company or its subsidiaries in your privacy settings. Recruiters from your current employer will never see your active search status or profile."
    }
  ];

  return (
    <div className="candidate-app-page">
      <CandidateHeader />

      {/* ── HERO ── */}
      <section className="cap-hero">
        <div className="cap-hero-glow-1" />
        <div className="cap-hero-glow-2" />
        <div className="cap-hero-grid-bg" />

        <div className="cap-container">
          <div className="cap-hero-layout">
            {/* Left Content */}
            <div>
              <div className="cap-badge">
                <span className="cap-badge-dot" />
                #1 Job Search &amp; Career App in India
              </div>

              <h1 className="cap-hero-title">
                Supercharge Your Career <br />
                <span className="cap-hero-title-highlight">Right in Your Pocket</span>
              </h1>

              <p className="cap-hero-sub">
                Join 5+ Million ambitious jobseekers. Discover 100,000+ verified openings,
                chat directly with hiring managers, and apply in 1-tap with instant push notifications.
              </p>

              {/* Direct Store Download Buttons */}
              <div className="cap-store-buttons">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cap-store-btn"
                  id="candidate-app-googleplay-btn"
                >
                  <FaGooglePlay size={28} color="#059669" />
                  <div style={{ textAlign: "left" }}>
                    <div className="cap-store-btn-tag">Get it on</div>
                    <div className="cap-store-btn-title">Google Play</div>
                  </div>
                </a>

                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cap-store-btn cap-store-btn-dark"
                  id="candidate-app-appstore-btn"
                >
                  <FaApple size={32} />
                  <div style={{ textAlign: "left" }}>
                    <div className="cap-store-btn-tag">Download on the</div>
                    <div className="cap-store-btn-title">App Store</div>
                  </div>
                </a>
              </div>

              {/* SMS Link Box */}
              {/* <div className="cap-sms-box">
                <div className="cap-sms-label">
                  <FiSmartphone /> Get the official download link via SMS or WhatsApp:
                </div>
                <form className="cap-sms-form" onSubmit={handleSendSms}>
                  <div className="cap-sms-input-wrap">
                    <span className="cap-sms-prefix">+91</span>
                    <input
                      type="tel"
                      className="cap-sms-input"
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                    />
                  </div>
                  <button type="submit" className="cap-sms-submit">
                    Send Link
                  </button>
                </form>
                {smsSent && (
                  <div className="cap-sms-success">
                    <FiCheckCircle /> Download link sent to +91 {phoneNumber}! Please check your SMS.
                  </div>
                )}
              </div> */}
            </div>

            {/* Right: Interactive Phone Mockup */}
            <div className="cap-phone-wrap">
              {/* Auto-Running Video Loop Control Bar */}
              <div className="phone-video-bar">
                <div className="phone-video-indicator">
                  <span className="phone-video-dot" />
                  <span>{CANDIDATE_DEMO_STEPS[demoStep].label}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    className="phone-video-btn"
                    onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                    title={isPlayingDemo ? "Pause Auto-walkthrough" : "Play Auto-walkthrough"}
                  >
                    {isPlayingDemo ? <FiPause size={12} /> : <FiPlay size={12} />}
                    <span>{isPlayingDemo ? "Pause" : "Play"}</span>
                  </button>
                  <button
                    className="phone-video-btn"
                    onClick={() => { setDemoStep(0); setIsPlayingDemo(true); }}
                    title="Restart Demo Loop"
                  >
                    <FiRotateCcw size={11} />
                  </button>
                </div>
              </div>

              {/* Step Progress Indicators */}
              <div className="phone-video-progress">
                {CANDIDATE_DEMO_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`phone-progress-seg ${demoStep === idx ? "active" : ""}`}
                    onClick={() => { setDemoStep(idx); setIsPlayingDemo(false); }}
                    style={{ cursor: "pointer" }}
                    title={`Jump to step ${idx + 1}`}
                  />
                ))}
              </div>


              {/* iPhone 18 Pro Max Device Frame */}
              <div className="iphone18-device">
                {/* Hardware Buttons */}
                <div className="iphone-btn-action" title="Action Button" />
                <div className="iphone-btn-volume-up" title="Volume Up" />
                <div className="iphone-btn-volume-down" title="Volume Down" />
                <div className="iphone-btn-power" title="Power" />
                <div className="iphone-btn-camera" title="Camera Control" />

                {/* Inner Bezel */}
                <div className="iphone18-inner-frame">
                  {/* Screen Glass */}
                  <div className="iphone18-screen">
                    {/* iOS Status Bar */}
                    <div className="iphone-status-bar">
                      <span className="iphone-status-time">9:41</span>

                      {/* Dynamic Island */}
                      <div className="iphone-dynamic-island" title="Dynamic Island">
                        <div className="iphone-island-camera" />
                        <div className="iphone-island-sensor" />
                      </div>

                      {/* Network & Battery */}
                      <div className="iphone-status-icons">
                        <div className="iphone-signal-bars">
                          <span className="bar bar-1" />
                          <span className="bar bar-2" />
                          <span className="bar bar-3" />
                          <span className="bar bar-4" />
                        </div>
                        <span className="iphone-net-type">5G</span>
                        <div className="iphone-battery-icon">
                          <div className="iphone-battery-fill" />
                          <div className="iphone-battery-terminal" />
                        </div>
                      </div>
                    </div>

                    {/* In-App Toast Alert */}
                    {toastMessage && (
                      <div className="iphone-inapp-toast">
                        <FiCheckCircle size={15} color="#34d399" />
                        <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{toastMessage}</span>
                      </div>
                    )}

                    {/* App Content Body */}
                    <div className="iphone-screen-content">
                      {/* Top user bar */}
                      <div className="cap-screen-header">
                        <div className="cap-screen-user">
                          <div className="cap-screen-avatar">JD</div>
                          <div>
                            <div className="cap-screen-greeting">Welcome back</div>
                            <div className="cap-screen-name">John Doe</div>
                          </div>
                        </div>
                        <span className="cap-screen-live-badge">
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                          Actively Looking
                        </span>
                      </div>

                      {/* Interactive Search Bar in Mockup */}
                      <div className="cap-screen-search">
                        <FiBriefcase size={14} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search 10,000+ verified roles..."
                          style={{
                            background: "none",
                            border: "none",
                            outline: "none",
                            fontSize: "0.78rem",
                            color: "#0f172a",
                            width: "100%",
                            fontFamily: "inherit"
                          }}
                        />
                      </div>

                      {/* TAB 1: DISCOVER JOBS */}
                      {candTab === "discover" && (
                        <div>
                          {/* Job Card 1 */}
                          {(!searchQuery || "senior react next.js engineer razorpay".includes(searchQuery.toLowerCase())) && (
                            <div className="cap-screen-card">
                              <span className="cap-screen-card-tag">NEW · HOT MATCH</span>
                              <h4 className="cap-screen-job-title">Senior React / Next.js Engineer</h4>
                              <div className="cap-screen-job-company">Razorpay Software · Bengaluru (Hybrid)</div>
                              <div className="cap-screen-job-meta">
                                <span className="cap-screen-salary">₹24 - 32 LPA</span>
                                <button
                                  className={`cap-screen-apply-btn ${appliedJobs[1] ? "applied" : ""}`}
                                  onClick={() => handleApply(1, "Razorpay", "Senior React Engineer")}
                                >
                                  {appliedJobs[1] ? "Applied ✓" : "1-Tap Apply"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Job Card 2 */}
                          {(!searchQuery || "technical product manager swiggy".includes(searchQuery.toLowerCase())) && (
                            <div className="cap-screen-card">
                              <span className="cap-screen-card-tag" style={{ background: "#fef3c7", color: "#b45309" }}>100% REMOTE</span>
                              <h4 className="cap-screen-job-title">Technical Product Manager</h4>
                              <div className="cap-screen-job-company">Swiggy Labs · Remote</div>
                              <div className="cap-screen-job-meta">
                                <span className="cap-screen-salary">₹28 - 38 LPA</span>
                                <button
                                  className="cap-screen-apply-btn"
                                  style={{ background: "#059669" }}
                                  onClick={() => triggerToast("Swiggy HR reviewed your profile & invited you to interview!")}
                                >
                                  Shortlisted ✓
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Job Card 3 */}
                          {(!searchQuery || "cloud infrastructure architect cisco".includes(searchQuery.toLowerCase())) && (
                            <div className="cap-screen-card">
                              <span className="cap-screen-card-tag" style={{ background: "#f3e8ff", color: "#7c3aed" }}>MNC GIANT</span>
                              <h4 className="cap-screen-job-title">Cloud Infrastructure Architect</h4>
                              <div className="cap-screen-job-company">Cisco Systems · Hyderabad</div>
                              <div className="cap-screen-job-meta">
                                <span className="cap-screen-salary">₹34 - 45 LPA</span>
                                <button
                                  className={`cap-screen-apply-btn ${appliedJobs[3] ? "applied" : ""}`}
                                  onClick={() => handleApply(3, "Cisco Systems", "Cloud Architect")}
                                >
                                  {appliedJobs[3] ? "Applied ✓" : "1-Tap Apply"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: APPLIED STATUS */}
                      {candTab === "applied" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#15803d", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>SHORTLISTED</span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>2d ago</span>
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Technical Product Manager</div>
                            <div style={{ fontSize: "0.74rem", color: "#64748b" }}>Swiggy Labs · Remote</div>
                            <div style={{ marginTop: 8, fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                              Next: Video Discussion with VP Product
                            </div>
                          </div>

                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 4 }}>RESUME VIEWED</span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Yesterday</span>
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Senior React / Next.js Engineer</div>
                            <div style={{ fontSize: "0.74rem", color: "#64748b" }}>Razorpay Software · Bengaluru</div>
                            <div style={{ marginTop: 8, fontSize: "0.72rem", color: "#2563eb", fontWeight: 700 }}>
                              HR downloaded your CV &amp; portfolio
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: CHAT */}
                      {candTab === "chat" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div
                            onClick={() => triggerToast("Opening chat thread with Swiggy Talent Team")}
                            style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0", cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Swiggy Talent Team</span>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>10:14 AM</span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              "Hi John, we were impressed by your portfolio! Are you free tomorrow for an intro call?"
                            </p>
                          </div>

                          <div
                            onClick={() => triggerToast("Opening chat thread with Google Tech Recruiting")}
                            style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0", cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Google Tech Recruiting</span>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Yesterday</span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              "Thank you for sharing your updated resume. Our engineering committee is reviewing it."
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom In-Phone Tab Navigation */}
                    <div className="iphone-bottom-nav">
                      <button
                        className={`iphone-tab-item ${candTab === "discover" ? "active" : ""}`}
                        onClick={() => setCandTab("discover")}
                      >
                        <FiBriefcase size={15} />
                        <span>Jobs</span>
                      </button>
                      <button
                        className={`iphone-tab-item ${candTab === "applied" ? "active" : ""}`}
                        onClick={() => setCandTab("applied")}
                      >
                        <FiCheckCircle size={15} />
                        <span>Applied ({Object.keys(appliedJobs).length})</span>
                      </button>
                      <button
                        className={`iphone-tab-item ${candTab === "chat" ? "active" : ""}`}
                        onClick={() => setCandTab("chat")}
                      >
                        <FiMessageSquare size={15} />
                        <span>Chats</span>
                      </button>
                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="iphone-home-indicator-wrap">
                      <div className="iphone-home-indicator" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="cap-trust-bar">
        <div className="cap-container">
          <div className="cap-trust-grid">
            <div>
              <div className="cap-trust-num">4.8 ★</div>
              <div className="cap-trust-label">Over 120k Play &amp; App Store Reviews</div>
            </div>
            <div>
              <div className="cap-trust-num">5 Million+</div>
              <div className="cap-trust-label">Candidate App Installs</div>
            </div>
            <div>
              <div className="cap-trust-num">100,000+</div>
              <div className="cap-trust-label">Active Verified Jobs</div>
            </div>
            <div>
              <div className="cap-trust-num">35,000+</div>
              <div className="cap-trust-label">Direct Hiring Companies</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALUE PILLARS (CANDIDATE FEATURES) ── */}
      <section className="cap-features-section">
        <div className="cap-container">
          <div className="cap-section-header">
            <span className="cap-section-tag">Candidate Experience</span>
            <h2 className="cap-section-title">Designed for Jobseekers Who Value Time</h2>
            <p className="cap-section-desc">
              From discovering unadvertised startup roles to tracking your interview rounds,
              every feature in the MavenJobs app is engineered to accelerate your career.
            </p>
          </div>

          <div className="cap-features-grid">
            {candidatePillars.map((p, idx) => (
              <div key={idx} className="cap-feature-card">
                <div className="cap-feature-icon" style={{ background: p.bg, color: p.color }}>
                  {p.icon}
                </div>
                <h3 className="cap-feature-title">{p.title}</h3>
                <p className="cap-feature-text">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* QR Code Card Showcase */}
          <div className="cap-qr-showcase">
            <div>
              <span className="cap-section-tag" style={{ color: "#1d4ed8" }}>Instant Installation</span>
              <h3 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
                Scan to Install Directly on Your Phone
              </h3>
              <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 520 }}>
                Open your camera or QR scanner to download the app in seconds. Available on Android (v8.0+)
                and iOS (iOS 15.0+). No registration fee, no hidden subscriptions for candidates.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 20px",
                    borderRadius: 12,
                    background: copiedLink ? "#ecfdf5" : "#ffffff",
                    border: copiedLink ? "1.5px solid #10b981" : "1.5px solid #cbd5e1",
                    color: copiedLink ? "#065f46" : "#1e293b",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {copiedLink ? <FiCheck color="#10b981" /> : <FiCopy />}
                  {copiedLink ? "Link Copied to Clipboard!" : "Copy Page Download Link"}
                </button>

                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Instant universal deep link
                </span>
              </div>
            </div>

            <div className="cap-qr-box">
              <img
                src={QR_IMAGE_URL}
                alt="Scan MavenJobs Candidate App QR"
                className="cap-qr-code-img"
              />
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem", marginBottom: 2 }}>
                Scan with Phone Camera
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Android APK &amp; Apple App Store
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CANDIDATE TESTIMONIALS ── */}
      <section className="cap-reviews-section">
        <div className="cap-container">
          <div className="cap-section-header">
            <span className="cap-section-tag">Success Stories</span>
            <h2 className="cap-section-title">Loved by Thousands of Placed Jobseekers</h2>
            <p className="cap-section-desc">
              Real feedback from engineers, product leads, and business professionals who found their dream job on mobile.
            </p>
          </div>

          <div className="cap-reviews-grid">
            {candidateReviews.map((r, i) => (
              <div key={i} className="cap-review-card">
                <div className="cap-review-stars">
                  {[...Array(r.rating)].map((_, si) => (
                    <FiStar key={si} fill="#F59E0B" color="#F59E0B" size={16} />
                  ))}
                </div>
                <p className="cap-review-quote">"{r.quote}"</p>
                <div className="cap-reviewer">
                  <div className="cap-reviewer-avatar">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="cap-reviewer-name">{r.name}</div>
                    <div className="cap-reviewer-role">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="cap-faq-section">
        <div className="cap-container">
          <div className="cap-section-header">
            <span className="cap-section-tag">Jobseeker Questions</span>
            <h2 className="cap-section-title">Frequently Asked Questions</h2>
            <p className="cap-section-desc">
              Everything you need to know about the MavenJobs Candidate Mobile App.
            </p>
          </div>

          <div className="cap-faq-list">
            {candidateFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="cap-faq-item">
                  <button
                    className="cap-faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <FiChevronUp size={20} color="#2563eb" /> : <FiChevronDown size={20} color="#64748b" />}
                  </button>
                  {isOpen && (
                    <div className="cap-faq-answer">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recruiter App Switcher Banner */}
          <div
            style={{
              marginTop: 64,
              padding: "24px 32px",
              borderRadius: 20,
              background: "#f1f5f9",
              border: "1.5px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                Are you an Employer, HR Consultant, or Recruiter?
              </div>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b" }}>
                Looking to search Resdex, make masked calls, and manage candidate pipelines on mobile? Download the dedicated Recruiter App.
              </p>
            </div>
            <Link
              to="/download/recruiter-app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 12,
                background: "#002366",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#001a50"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#002366"}
            >
              Get Recruiter App <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
