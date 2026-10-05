import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EmployerHeader from "../../../../layout/employer/EmployerHeader";
import EmployerFooter from "../../../../layout/employer/EmployerFooter";
import {
  FiSmartphone,
  FiDownload,
  FiSearch,
  FiPhoneCall,
  FiMessageCircle,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiShield,
  FiBriefcase,
  FiLock,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiArrowRight,
  FiActivity,
  FiClock,
  FiFilter,
  FiMic,
  FiMicOff,
  FiVolume2,
  FiPhoneOff,
  FiHome,
  FiSend,
  FiVideo,
  FiX,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiPlus,
  FiUser,
  FiGrid
} from "react-icons/fi";
import { FaGooglePlay, FaApple } from "react-icons/fa";
import mentor1 from "../../../../../assets/mentor1.png";
import mentor2 from "../../../../../assets/mentor2.png";
import "./RecruiterAppDownloadPage.css";

const RECRUITER_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mavenjobs.recruiter";
const RECRUITER_APP_STORE_URL = "https://apps.apple.com/app/maven-jobs-recruiter/id6440000001";
const QR_IMAGE_URL = "https://res.cloudinary.com/dntt0iavv/image/upload/v1790405098/email-assets/maven-app-download-qr.png";

const RECRUITER_DEMO_STEPS = [
  { label: "1. Sourcing 2 Crore+ Resdex Profiles", tab: "cvs" },
  { label: "2. 1-Click Shortlisting & Credit Sync", tab: "cvs" },
  { label: "3. Masked Calling via Cloud Telephony", tab: "cvs" },
  { label: "4. Interview Calendar Coordination", tab: "interviews" },
  { label: "5. Active Hiring Pipeline Velocity", tab: "jobs" }
];

export default function RecruiterAppDownloadPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive iPhone Simulator State
  const [simTab, setSimTab] = useState("cvs"); // 'cvs' | 'jobs' | 'interviews'
  const [activeCall, setActiveCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(false);
  const [shortlisted, setShortlisted] = useState({});
  const [credits, setCredits] = useState(840);
  const [toastMessage, setToastMessage] = useState(null);
  const [islandExpanded, setIslandExpanded] = useState(false);

  // Auto-running Video Walkthrough Loop State
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [demoStep, setDemoStep] = useState(0);

  // Loop progression timer (advances step every 4.2 seconds)
  useEffect(() => {
    if (!isPlayingDemo) return;

    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % RECRUITER_DEMO_STEPS.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlayingDemo]);

  // Execute animated actions on step change
  useEffect(() => {
    if (!isPlayingDemo) return;

    if (demoStep === 0) {
      // Step 0: Browsing Resdex
      setSimTab("cvs");
      setActiveCall(null);
      setShortlisted({});
      setCredits(840);
      triggerToast("Sourcing active candidates across 2 Crore+ Resdex profiles...");
    } else if (demoStep === 1) {
      // Step 1: Shortlist Rahul Sharma
      setSimTab("cvs");
      setActiveCall(null);
      setShortlisted({ 1: true });
      setCredits(839);
      triggerToast("✓ Rahul Sharma shortlisted! 1 CV credit utilized.");
    } else if (demoStep === 2) {
      // Step 2: Masked Call
      setSimTab("cvs");
      setActiveCall({ name: "Rahul Sharma", role: "Staff DevOps Architect", photo: mentor1 });
      setCallMuted(false);
      setCallSpeaker(false);
      triggerToast("Connecting masked call to Rahul Sharma via Cloud Telephony...");
    } else if (demoStep === 3) {
      // Step 3: End Call & Switch to Interviews
      setActiveCall(null);
      setSimTab("interviews");
      triggerToast("Interview confirmed for 11:30 AM! Zoom invite sent.");
    } else if (demoStep === 4) {
      // Step 4: Active Jobs
      setActiveCall(null);
      setSimTab("jobs");
      triggerToast("Reviewing 42 applicants on Staff DevOps Architect.");
    }
  }, [demoStep, isPlayingDemo]);

  // Call timer interval
  useEffect(() => {
    let interval = null;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleStartCall = (name, role, photo = null) => {
    setIsPlayingDemo(false); // Pause auto-loop on manual interaction
    setActiveCall({ name, role, photo });
    setCallMuted(false);
    setCallSpeaker(false);
    triggerToast(`Connecting masked call to ${name}...`);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    triggerToast("Call ended. Audio encrypted & logged.");
  };

  const handleShortlist = (id, name) => {
    setIsPlayingDemo(false); // Pause auto-loop on manual interaction
    setShortlisted((prev) => {
      const isAlready = Boolean(prev[id]);
      if (!isAlready) {
        setCredits((c) => Math.max(0, c - 1));
        triggerToast(`✓ ${name} shortlisted! 1 CV credit utilized.`);
        return { ...prev, [id]: true };
      } else {
        triggerToast(`${name} removed from shortlist.`);
        return { ...prev, [id]: false };
      }
    });
  };

  const formatDuration = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    document.title = "Download MavenJobs Recruiter App - Enterprise Talent Sourcing & Hiring";
    window.scrollTo(0, 0);

    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    // If accessed directly on mobile browser, auto-redirect to recruiter store
    if (/android/i.test(ua)) {
      window.location.href = RECRUITER_PLAY_STORE_URL;
    } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      window.location.href = RECRUITER_APP_STORE_URL;
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

  const recruiterPillars = [
    {
      icon: <FiSearch />,
      bg: "#ecfdf5",
      color: "#059669",
      title: "Mobile Resdex Sourcing",
      desc: "Search 2 Crore+ verified active resumes anywhere. Use Boolean syntax, current CTC filters, experience, notice period, and exact tech stack."
    },
    {
      icon: <FiPhoneCall />,
      bg: "#eff6ff",
      color: "#2563eb",
      title: "Virtual Masked Calling",
      desc: "Contact candidates with 1 click directly from the app without disclosing your personal phone number. Enterprise caller-ID ensures higher pick-up rates."
    },
    {
      icon: <FiUsers />,
      bg: "#fef3c7",
      color: "#d97706",
      title: "Fast Application Screening",
      desc: "Review incoming applicants with swipe-to-shortlist controls. Add hiring tags, reject with courteous automated notes, or request immediate CV updates."
    },
    {
      icon: <FiMessageCircle />,
      bg: "#f3e8ff",
      color: "#7c3aed",
      title: "WhatsApp & In-App NVites",
      desc: "Send personalized job offers and interview briefs directly via pre-approved WhatsApp templates and secure in-app recruiter messages."
    },
    {
      icon: <FiCalendar />,
      bg: "#fef2f2",
      color: "#dc2626",
      title: "Interview Slot Coordination",
      desc: "Propose interview slots, sync calendar availability (Google Meet / Zoom / Onsite), and track candidate attendance confirmations on the move."
    },
    {
      icon: <FiActivity />,
      bg: "#e0f2fe",
      color: "#0284c7",
      title: "Live Credit & Quota Management",
      desc: "Track daily CV view quota, unmasked contacts balance, and recruiter seat consumption in real time with enterprise usage reports."
    }
  ];

  const recruiterReviews = [
    {
      quote: "The masked calling feature on the MavenJobs Recruiter App is a lifesaver. Our TA team contacts 40+ candidates daily during campus and lateral hiring drives without exposing their personal numbers.",
      name: "Ananya Sharma",
      role: "Head of Talent Acquisition · FinTech Enterprise",
      rating: 5
    },
    {
      quote: "Being able to run Boolean searches on Resdex while traveling between client meetings reduced our time-to-fill for senior engineering roles by 40%. The UI is lightning fast.",
      name: "Karthik Rajan",
      role: "Managing Director · Apex Executive Search",
      rating: 5
    },
    {
      quote: "Real-time push alerts when a candidate in my saved talent pool changes their notice period to 'Serving Notice' gave us a huge advantage over competitors in hiring top architects.",
      name: "Pooja Hegde",
      role: "Lead Tech Recruiter · SaaS Scaleup",
      rating: 5
    }
  ];

  const recruiterFaqs = [
    {
      q: "How do I log in to the MavenJobs Recruiter Mobile App?",
      a: "Use your existing MavenJobs Enterprise / Recruiter sub-user credentials (work email and password). All active subscriptions, Resdex quotas, and job postings sync automatically."
    },
    {
      q: "Does candidate calling deduct from my personal phone balance?",
      a: "No. The MavenJobs Recruiter App routes voice calls through our enterprise cloud telephony bridge, displaying your organization's verified business caller ID."
    },
    {
      q: "Can multiple recruiters in our agency use the app simultaneously?",
      a: "Yes. Each sub-user seat in your company subscription can log into their mobile device, with individual candidate folders and audit trails maintained under your master admin account."
    },
    {
      q: "Can I download resumes and share candidate profiles on WhatsApp?",
      a: "Yes. You can share candidate summaries with hiring managers directly via WhatsApp or email, formatted cleanly without unmasking private personal credentials if restricted by permissions."
    }
  ];

  return (
    <div className="recruiter-app-page">
      <EmployerHeader />

      {/* ── HERO ── */}
      <section className="rap-hero">
        <div className="rap-hero-glow-1" />
        <div className="rap-hero-glow-2" />
        <div className="rap-hero-grid-bg" />

        <div className="rap-container">
          <div className="rap-hero-layout">
            {/* Left Content */}
            <div>
              <div className="rap-badge">
                <span className="rap-badge-dot" />
                MavenJobs Recruiter &amp; Enterprise Suite
              </div>

              <h1 className="rap-hero-title">
                Close Hires Faster <br />
                <span className="rap-hero-title-highlight">From Anywhere</span>
              </h1>

              <p className="rap-hero-sub">
                India's most powerful talent sourcing engine in your pocket. Search 2 Cr+ resumes on Resdex,
                make masked calls to candidates, and review applicants on the go.
              </p>

              {/* Direct Store Download Buttons */}
              <div className="rap-store-buttons">
                <a
                  href={RECRUITER_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rap-store-btn"
                  id="recruiter-app-googleplay-btn"
                >
                  <FaGooglePlay size={28} color="#059669" />
                  <div style={{ textAlign: "left" }}>
                    <div className="rap-store-btn-tag">Recruiter Edition</div>
                    <div className="rap-store-btn-title">Google Play</div>
                  </div>
                </a>

                <a
                  href={RECRUITER_APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rap-store-btn rap-store-btn-dark"
                  id="recruiter-app-appstore-btn"
                >
                  <FaApple size={32} />
                  <div style={{ textAlign: "left" }}>
                    <div className="rap-store-btn-tag">Enterprise iOS</div>
                    <div className="rap-store-btn-title">App Store</div>
                  </div>
                </a>
              </div>

              {/* SMS Link Box */}
              {/* <div className="rap-sms-box">
                <div className="rap-sms-label">
                  <FiSmartphone /> Send recruiter download link to work phone:
                </div>
                <form className="rap-sms-form" onSubmit={handleSendSms}>
                  <div className="rap-sms-input-wrap">
                    <span className="rap-sms-prefix">+91</span>
                    <input
                      type="tel"
                      className="rap-sms-input"
                      placeholder="Enter recruiter mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                    />
                  </div>
                  <button type="submit" className="rap-sms-submit">
                    Send Link
                  </button>
                </form>
                {smsSent && (
                  <div className="rap-sms-success">
                    <FiCheckCircle /> Enterprise app link sent to +91 {phoneNumber}! Please check your messages.
                  </div>
                )}
              </div> */}
            </div>

            {/* Right: Phone Mockup (Recruiter Cockpit) */}
            <div className="rap-phone-wrap">
              {/* Auto-Running Video Loop Control Bar */}
              <div className="phone-video-bar">
                <div className="phone-video-indicator">
                  <span className="phone-video-dot" />
                  <span>{RECRUITER_DEMO_STEPS[demoStep].label}</span>
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
                {RECRUITER_DEMO_STEPS.map((_, idx) => (
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
                      <div
                        className="iphone-dynamic-island"
                        title={activeCall ? "Active Call in Dynamic Island" : "Dynamic Island"}
                        onClick={() => setIslandExpanded(!islandExpanded)}
                        style={activeCall ? { width: 140, background: "#06180e", borderColor: "#10b981", border: "1px solid rgba(16,185,129,0.4)" } : {}}
                      >
                        {activeCall ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 6px", color: "#34d399", fontSize: "0.68rem", fontWeight: 800 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              {activeCall.photo ? (
                                <img src={activeCall.photo} alt={activeCall.name} style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "callPulse 1s infinite" }} />
                              )}
                              <span>{formatDuration(callDuration)}</span>
                            </div>
                            <FiPhoneCall size={10} color="#10b981" />
                          </div>
                        ) : (
                          <>
                            <div className="iphone-island-camera" />
                            <div className="iphone-island-sensor" />
                          </>
                        )}
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

                    {/* In-App Toast Message */}
                    {toastMessage && (
                      <div className="iphone-inapp-toast">
                        <FiCheckCircle size={15} color="#34d399" />
                        <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{toastMessage}</span>
                      </div>
                    )}

                    {/* App Content Body */}
                    <div className="iphone-screen-content">
                      {/* Header */}
                      <div className="rap-screen-header">
                        <div className="rap-screen-logo">
                          <FiBriefcase size={17} color="#059669" />
                          <span>MavenRecruiter</span>
                        </div>
                        <span className="rap-screen-quota-badge">
                          {credits} CV Credits Left
                        </span>
                      </div>

                      {/* Quick stats row / Tab switcher */}
                      <div className="rap-screen-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
                        <div
                          className={`rap-screen-stat-pill ${simTab === "jobs" ? "active" : ""}`}
                          onClick={() => setSimTab("jobs")}
                          title="Click to view Active Jobs"
                        >
                          <div className="rap-screen-stat-num">18</div>
                          <div className="rap-screen-stat-lbl">Active Jobs</div>
                        </div>

                        <div
                          className={`rap-screen-stat-pill ${simTab === "cvs" ? "active" : ""}`}
                          onClick={() => setSimTab("cvs")}
                          title="Click to view Candidate CVs"
                        >
                          <div className="rap-screen-stat-num">142</div>
                          <div className="rap-screen-stat-lbl">New CVs</div>
                        </div>

                        <div
                          className={`rap-screen-stat-pill ${simTab === "interviews" ? "active" : ""}`}
                          onClick={() => setSimTab("interviews")}
                          title="Click to view Scheduled Interviews"
                        >
                          <div className="rap-screen-stat-num">9</div>
                          <div className="rap-screen-stat-lbl">Interviews</div>
                        </div>
                      </div>

                      {/* TAB 1: NEW CVS PIPELINE */}
                      {simTab === "cvs" && (
                        <div>
                          {/* Candidate Card 1 */}
                          <div className="rap-screen-candidate-card">
                            <div className="rap-screen-cand-top">
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <img src={mentor1} alt="Rahul Sharma" className="rap-screen-cand-avatar" />
                                <div>
                                  <div className="rap-screen-cand-name">Rahul Sharma</div>
                                  <div className="rap-screen-cand-title">Staff DevOps Architect · 8.5 Yrs</div>
                                </div>
                              </div>
                              <span className="rap-screen-cand-match">96% MATCH</span>
                            </div>
                            <div className="rap-screen-cand-chips">
                              <span className="rap-screen-chip">Kubernetes</span>
                              <span className="rap-screen-chip">AWS / Terraform</span>
                              <span className="rap-screen-chip" style={{ color: "#b45309" }}>15 Days Notice</span>
                            </div>
                            <div className="rap-screen-cand-actions">
                              <button
                                className="rap-screen-btn-call"
                                onClick={() => handleStartCall("Rahul Sharma", "Staff DevOps Architect", mentor1)}
                              >
                                <FiPhoneCall size={11} /> Masked Call
                              </button>
                              <button
                                className="rap-screen-btn-shortlist"
                                style={shortlisted[1] ? { background: "#dcfce7", color: "#15803d", borderColor: "#86efac" } : {}}
                                onClick={() => handleShortlist(1, "Rahul Sharma")}
                              >
                                <FiCheck size={11} /> {shortlisted[1] ? "Shortlisted ✓" : "Shortlist"}
                              </button>
                            </div>
                          </div>

                          {/* Candidate Card 2 */}
                          <div className="rap-screen-candidate-card">
                            <div className="rap-screen-cand-top">
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <img src={mentor2} alt="Priyanka Varma" className="rap-screen-cand-avatar" />
                                <div>
                                  <div className="rap-screen-cand-name">Priyanka Varma</div>
                                  <div className="rap-screen-cand-title">Product Design Lead · 6 Yrs</div>
                                </div>
                              </div>
                              <span className="rap-screen-cand-match">92% MATCH</span>
                            </div>
                            <div className="rap-screen-cand-chips">
                              <span className="rap-screen-chip">Figma UI/UX</span>
                              <span className="rap-screen-chip">Design Systems</span>
                              <span className="rap-screen-chip" style={{ color: "#059669" }}>Immediate Joiner</span>
                            </div>
                            <div className="rap-screen-cand-actions">
                              <button
                                className="rap-screen-btn-call"
                                onClick={() => handleStartCall("Priyanka Varma", "Product Design Lead", mentor2)}
                              >
                                <FiPhoneCall size={11} /> Masked Call
                              </button>
                              <button
                                className="rap-screen-btn-shortlist"
                                style={shortlisted[2] ? { background: "#dcfce7", color: "#15803d", borderColor: "#86efac" } : {}}
                                onClick={() => handleShortlist(2, "Priyanka Varma")}
                              >
                                <FiCheck size={11} /> {shortlisted[2] ? "Shortlisted ✓" : "Shortlist"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: ACTIVE JOBS */}
                      {simTab === "jobs" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#15803d", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>ACTIVE · 42 APPLICANTS</span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>₹32 - 45 LPA</span>
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Staff DevOps Architect</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b", margin: "2px 0 8px" }}>Bengaluru · 8-12 Yrs Exp</div>
                            <button
                              onClick={() => { setSimTab("cvs"); triggerToast("Filtering applicants for Staff DevOps Architect"); }}
                              style={{ width: "100%", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "6px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              View 42 Applicants →
                            </button>
                          </div>

                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>ACTIVE · 28 APPLICANTS</span>
                              <span style={{ fontSize: "0.68rem", color: "#64748b" }}>₹24 - 36 LPA</span>
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Product Design Lead</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b", margin: "2px 0 8px" }}>Mumbai / Remote · 5-8 Yrs</div>
                            <button
                              onClick={() => { setSimTab("cvs"); triggerToast("Filtering applicants for Product Design Lead"); }}
                              style={{ width: "100%", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "6px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              View 28 Applicants →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: SCHEDULED INTERVIEWS */}
                      {simTab === "interviews" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 4 }}>TODAY · 11:30 AM</span>
                              <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>Confirmed</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "6px 0 3px" }}>
                              <img src={mentor1} alt="Rahul Sharma" className="rap-screen-cand-avatar" />
                              <div>
                                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Rahul Sharma</div>
                                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>System Design &amp; Architecture Round</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartCall("Rahul Sharma", "System Design Interview", mentor1)}
                              style={{ width: "100%", background: "#059669", border: "none", color: "#ffffff", padding: "6px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 6 }}
                            >
                              <FiVideo size={12} /> Join Video Interview
                            </button>
                          </div>

                          <div style={{ background: "#ffffff", padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#7c3aed", background: "#f3e8ff", padding: "2px 6px", borderRadius: 4 }}>TODAY · 02:15 PM</span>
                              <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>Google Meet</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "6px 0 3px" }}>
                              <img src={mentor2} alt="Priyanka Varma" className="rap-screen-cand-avatar" />
                              <div>
                                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>Priyanka Varma</div>
                                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Design Portfolio &amp; Case Study</div>
                              </div>
                            </div>
                            <button
                              onClick={() => triggerToast("Sending calendar reminder to Priyanka Varma")}
                              style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", padding: "6px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", marginTop: 6 }}
                            >
                              Send Reminder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom In-Phone Tab Navigation */}
                    <div className="iphone-bottom-nav">
                      <button
                        className={`iphone-tab-item ${simTab === "cvs" ? "active" : ""}`}
                        onClick={() => setSimTab("cvs")}
                      >
                        <FiUsers size={15} />
                        <span>Talent</span>
                      </button>
                      <button
                        className={`iphone-tab-item ${simTab === "jobs" ? "active" : ""}`}
                        onClick={() => setSimTab("jobs")}
                      >
                        <FiBriefcase size={15} />
                        <span>Jobs</span>
                      </button>
                      <button
                        className={`iphone-tab-item ${simTab === "interviews" ? "active" : ""}`}
                        onClick={() => setSimTab("interviews")}
                      >
                        <FiCalendar size={15} />
                        <span>Schedule</span>
                      </button>
                      <button
                        className="iphone-tab-item"
                        onClick={() => triggerToast("Opening Resdex Boolean Search Filter")}
                      >
                        <FiSearch size={15} />
                        <span>Search</span>
                      </button>
                    </div>

                    {/* LIVE MASKED CALL SCREEN OVERLAY */}
                    {activeCall && (
                      <div className="iphone-call-overlay">
                        {/* Top Caller Info */}
                        <div className="iphone-call-top-info">
                          <div className="iphone-call-cloud-sub">
                            <FiShield size={11} color="#34d399" />
                            <span>Maven Masked Telephony</span>
                          </div>
                          <h3 className="iphone-call-name">{activeCall.name}</h3>
                          <div className="iphone-call-duration">
                            {formatDuration(callDuration)}
                          </div>

                          <div className="iphone-call-avatar-circle">
                            {activeCall.photo ? (
                              <img
                                src={activeCall.photo}
                                alt={activeCall.name}
                                className="iphone-call-avatar-img"
                              />
                            ) : (
                              activeCall.name.charAt(0)
                            )}
                          </div>
                          <div className="iphone-call-role-tag">
                            {activeCall.role}
                          </div>
                        </div>

                        {/* Authentic 2x3 iOS In-Call Controls */}
                        <div>
                          <div className="iphone-call-grid-2x3">
                            <div className="iphone-call-action-unit">
                              <button
                                className={`iphone-call-circle-btn ${callMuted ? "active" : ""}`}
                                onClick={() => {
                                  setCallMuted(!callMuted);
                                  triggerToast(callMuted ? "Microphone Unmuted" : "Microphone Muted");
                                }}
                                title={callMuted ? "Unmute" : "Mute"}
                              >
                                {callMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                              </button>
                              <span className="iphone-call-action-label">{callMuted ? "unmute" : "mute"}</span>
                            </div>

                            <div className="iphone-call-action-unit">
                              <button
                                className="iphone-call-circle-btn"
                                onClick={() => triggerToast("Keypad tone enabled")}
                                title="Keypad"
                              >
                                <FiGrid size={19} />
                              </button>
                              <span className="iphone-call-action-label">keypad</span>
                            </div>

                            <div className="iphone-call-action-unit">
                              <button
                                className={`iphone-call-circle-btn ${callSpeaker ? "active" : ""}`}
                                onClick={() => {
                                  setCallSpeaker(!callSpeaker);
                                  triggerToast(callSpeaker ? "Speaker Off" : "Speakerphone On");
                                }}
                                title="Speaker"
                              >
                                <FiVolume2 size={20} />
                              </button>
                              <span className="iphone-call-action-label">audio</span>
                            </div>

                            <div className="iphone-call-action-unit">
                              <button
                                className="iphone-call-circle-btn"
                                onClick={() => triggerToast("Candidate conferencing invite sent")}
                                title="Add Call"
                              >
                                <FiPlus size={22} />
                              </button>
                              <span className="iphone-call-action-label">add call</span>
                            </div>

                            <div className="iphone-call-action-unit">
                              <button
                                className="iphone-call-circle-btn"
                                onClick={() => triggerToast("Switching to Maven Video Interview...")}
                                title="FaceTime"
                              >
                                <FiVideo size={20} />
                              </button>
                              <span className="iphone-call-action-label">FaceTime</span>
                            </div>

                            <div className="iphone-call-action-unit">
                              <button
                                className="iphone-call-circle-btn"
                                onClick={() => triggerToast("Viewing candidate ATS contact profile")}
                                title="Contacts"
                              >
                                <FiUser size={20} />
                              </button>
                              <span className="iphone-call-action-label">contacts</span>
                            </div>
                          </div>

                          {/* iOS Red Circular End Call Button */}
                          <button
                            className="iphone-call-hangup-btn"
                            onClick={handleEndCall}
                            title="End Call"
                          >
                            <FiPhoneCall />
                          </button>

                          {/* iOS Home Indicator Bar */}
                          <div className="iphone-call-home-bar" />
                        </div>
                      </div>
                    )}

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
      <div className="rap-trust-bar">
        <div className="rap-container">
          <div className="rap-trust-grid">
            <div>
              <div className="rap-trust-num">45,000+</div>
              <div className="rap-trust-label">Active Recruiters &amp; TA Teams</div>
            </div>
            <div>
              <div className="rap-trust-num">2 Crore+</div>
              <div className="rap-trust-label">Verified White-Collar Resumes</div>
            </div>
            <div>
              <div className="rap-trust-num">3x Faster</div>
              <div className="rap-trust-label">Time-to-Candidate Contact</div>
            </div>
            <div>
              <div className="rap-trust-num">98.4%</div>
              <div className="rap-trust-label">Candidate Contact Delivery Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALUE PILLARS (RECRUITER CAPABILITIES) ── */}
      <section className="rap-features-section">
        <div className="rap-container">
          <div className="rap-section-header">
            <span className="rap-section-tag">Talent Acquisition on Mobile</span>
            <h2 className="rap-section-title">Built for Modern Hiring Velocity</h2>
            <p className="rap-section-desc">
              Everything your recruitment team needs to source, contact, and interview top talent directly from iOS and Android.
            </p>
          </div>

          <div className="rap-features-grid">
            {recruiterPillars.map((p, idx) => (
              <div key={idx} className="rap-feature-card">
                <div className="rap-feature-icon" style={{ background: p.bg, color: p.color }}>
                  {p.icon}
                </div>
                <h3 className="rap-feature-title">{p.title}</h3>
                <p className="rap-feature-text">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* QR Code Card Showcase */}
          <div className="rap-qr-showcase">
            <div>
              <span className="rap-section-tag" style={{ color: "#059669" }}>Instant Enterprise Provisioning</span>
              <h3 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
                Scan to Install MavenJobs Recruiter
              </h3>
              <p style={{ color: "#334155", fontSize: "1rem", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 520 }}>
                Point your phone camera to download the recruiter companion. Compatible with corporate MDM solutions,
                Android Enterprise, and Apple Business Manager.
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
                  {copiedLink ? "Link Copied to Clipboard!" : "Copy Recruiter App Link"}
                </button>

                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Instant universal download link
                </span>
              </div>
            </div>

            <div className="rap-qr-box">
              <img
                src={QR_IMAGE_URL}
                alt="Scan MavenJobs Recruiter App QR"
                className="rap-qr-code-img"
              />
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem", marginBottom: 2 }}>
                Scan to Provision Mobile Seat
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Android APK &amp; Apple App Store
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & GOVERNANCE BAR ── */}
      <section className="rap-security-bar">
        <div className="rap-container">
          <div className="rap-security-grid">
            <div className="rap-sec-item">
              <div className="rap-sec-icon">
                <FiShield />
              </div>
              <div>
                <div className="rap-sec-title">ISO 27001 Certified</div>
                <div className="rap-sec-desc">Bank-grade enterprise data protection</div>
              </div>
            </div>

            <div className="rap-sec-item">
              <div className="rap-sec-icon">
                <FiLock />
              </div>
              <div>
                <div className="rap-sec-title">Masked Caller ID</div>
                <div className="rap-sec-desc">Safeguard recruiter mobile privacy</div>
              </div>
            </div>

            <div className="rap-sec-item">
              <div className="rap-sec-icon">
                <FiCheckCircle />
              </div>
              <div>
                <div className="rap-sec-title">Sub-User Governance</div>
                <div className="rap-sec-desc">Role-based access &amp; audit trails</div>
              </div>
            </div>

            <div className="rap-sec-item">
              <div className="rap-sec-icon">
                <FiActivity />
              </div>
              <div>
                <div className="rap-sec-title">99.9% Uptime SLA</div>
                <div className="rap-sec-desc">Enterprise continuous availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECRUITER TESTIMONIALS ── */}
      <section className="rap-reviews-section">
        <div className="rap-container">
          <div className="rap-section-header">
            <span className="rap-section-tag">Enterprise Customer Feedback</span>
            <h2 className="rap-section-title">Trusted by Top Talent Leaders</h2>
            <p className="rap-section-desc">
              Discover how India's fastest-growing hiring teams leverage MavenJobs Recruiter on mobile.
            </p>
          </div>

          <div className="rap-reviews-grid">
            {recruiterReviews.map((r, i) => (
              <div key={i} className="rap-review-card">
                <div className="rap-review-stars">
                  {[...Array(r.rating)].map((_, si) => (
                    <FiStar key={si} fill="#F59E0B" color="#F59E0B" size={16} />
                  ))}
                </div>
                <p className="rap-review-quote">"{r.quote}"</p>
                <div className="rap-reviewer">
                  <div className="rap-reviewer-avatar">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="rap-reviewer-name">{r.name}</div>
                    <div className="rap-reviewer-role">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ & CANDIDATE APP LINK ── */}
      <section className="cap-faq-section" style={{ background: "#ffffff", padding: "72px 24px 96px" }}>
        <div className="cap-container">
          <div className="rap-section-header">
            <span className="rap-section-tag">Enterprise Guidance</span>
            <h2 className="rap-section-title">Frequently Asked Questions</h2>
            <p className="rap-section-desc">
              Answers for corporate HR, TA managers, and recruitment agencies.
            </p>
          </div>

          <div className="cap-faq-list" style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {recruiterFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="cap-faq-item" style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
                  <button
                    className="cap-faq-question"
                    onClick={() => toggleFaq(idx)}
                    style={{ width: "100%", padding: "20px 24px", textAlign: "left", background: "none", border: "none", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <FiChevronUp size={20} color="#059669" /> : <FiChevronDown size={20} color="#64748b" />}
                  </button>
                  {isOpen && (
                    <div className="cap-faq-answer" style={{ padding: "0 24px 20px", fontSize: "0.95rem", color: "#475569", lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Candidate App Switcher Banner */}
          <div
            style={{
              marginTop: 64,
              padding: "24px 32px",
              borderRadius: 20,
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e3a8a", marginBottom: 4 }}>
                Are you a Jobseeker or Candidate Looking for Jobs?
              </div>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "#475569" }}>
                Looking to search verified jobs, receive instant alerts, and apply in 1-tap? Download the Candidate Job Search App.
              </p>
            </div>
            <Link
              to="/download/candidate-app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 12,
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#1d4ed8"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#2563eb"}
            >
              Get Candidate App <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <EmployerFooter />
    </div>
  );
}
