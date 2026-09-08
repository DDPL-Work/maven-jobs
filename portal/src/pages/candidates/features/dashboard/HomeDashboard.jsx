import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiStar,
  FiBookmark,
  FiChevronRight,
  FiChevronLeft,
  FiMail,
  FiSend,
  FiInfo,
  FiEye,
  FiBell,
  FiMenu,
  FiX,
  FiChevronDown,
  FiHome,
  FiFileText,
  FiMonitor,
  FiHelpCircle,
  FiSettings,
  FiZap,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiMessageSquare,
  FiShield,
  FiCalendar,
  FiSearch,
  FiEdit2,
  FiArrowRight,
  FiXCircle,
  FiExternalLink,
  FiAlertTriangle,
  FiBookOpen,
} from "react-icons/fi";
import { useAuth } from "../../../../AuthContext";
import {
  useDashboard,
  useCandidateNotifications,
  useCandidateChats,
  useCandidateApplications,
  usePublishedBlogs,
  useCandidateCompanies,
} from "../../../../hooks/useCandidateQueries";
import { useSaveJob } from "../../../../hooks/useCandidateMutations";
import authService from "../../../../services/authService";
import HourglassLoader from "../../../../components/HourglassLoader";
import {
  SkeletonDashboard,
  SkeletonJobCard,
  SkeletonProfileHeader,
  SkeletonBlogCard,
} from "../../../../components/Skeleton";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import { AITrigger } from "../../../../components/LazyAI";
import ProfileWidget from "../../../../components/candidate/ProfileWidget";
import LocationAutocomplete from "../../../../components/LocationAutocomplete";
import { aiService } from "../../../../services/aiService";

import NVites from "../../../../components/candidate/NVites";
import EarlyAccessRoles from "../../../../components/candidate/EarlyAccessRoles";
import FollowingCompanies from "../../../../components/candidate/FollowingCompanies";
import EliteChatWidget from "../../../../components/candidate/EliteChatWidget";
import CandidateSearchBar from "../../../../components/candidate/CandidateSearchBar";
import GlobalSearchForm from "../../../../components/common/GlobalSearchForm";
import EarlyAccessModal from "../../../../components/EarlyAccessModal";
import ApplicationModal from "../../../../components/application/ApplicationModal";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import "../dashboard/ProfileDashboard.css";
import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader";

const styleId = "hd-chat-keyframes";
if (!document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes adFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes adScaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .pd-nav-dropdown-wrapper {
      position: relative;
    }
    .pd-nav-dropdown-wrapper::after {
      content: '';
      position: absolute;
      bottom: -14px;
      left: 0;
      right: 0;
      height: 14px;
      z-index: 1000;
    }
    @keyframes statusDrop { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .pd-app-status-dd {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      min-width: 180px;
      z-index: 1000;
      padding: 5px;
      animation: statusDrop 0.12s cubic-bezier(0.16,1,0.3,1);
    }
    .pd-app-status-dd-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 13px;
      border-radius: 7px;
      border: none;
      background: none;
      color: var(--text-2, #334155);
      font-family: var(--font-display);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .pd-app-status-dd-item:hover {
      background: var(--blue-lt, #eef2ff);
      color: var(--blue, #6366f1);
    }
    .km-modal-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(15,23,42,0.7); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(8px); animation: fadeIn .25s ease; }
    .km-modal-box { background: #0f172a; border-radius: 24px; width: 100%; max-width: 780px; max-height: 85vh; display: flex; overflow: hidden; position: relative; box-shadow: 0 32px 80px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); animation: adScaleIn .35s cubic-bezier(.34,1.56,.64,1); }
    .km-modal-close { position: absolute; top: 16px; right: 16px; z-index: 10; background: rgba(255,255,255,0.08); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.6); transition: all .25s; }
    .km-modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; transform: rotate(90deg); }
    .km-modal-glow { position: absolute; top: -120px; left: -80px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%); pointer-events: none; }
    .km-modal-content { display: flex; width: 100%; }
    .km-modal-left { flex: 1; padding: 40px 36px; overflow-y: auto; max-height: 85vh; }
    .km-sticky-top { margin-bottom: 28px; }
    .km-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .18em; color: #818cf8; text-transform: uppercase; margin-bottom: 8px; }
    .km-title { font-family: var(--fd); font-size: 24px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -.03em; margin-bottom: 12px; }
    .km-title span { background: linear-gradient(135deg,#818cf8,#6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .km-subtitle { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
    .km-features-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
    .km-feat-item { display: flex; gap: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); transition: all .2s; }
    .km-feat-item:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.2); }
    .km-feat-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(99,102,241,0.12); display: flex; align-items: center; justify-content: center; color: #818cf8; flex-shrink: 0; font-size: 18px; }
    .km-feat-text h4 { font-family: var(--fd); font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 3px; }
    .km-feat-text p { font-size: 12.5px; color: rgba(255,255,255,0.55); line-height: 1.5; }
    .km-modal-actions-fixed { display: flex; gap: 10px; }
    .km-btn-premium { flex: 1; padding: 12px 20px; border-radius: 12px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff; font-size: 14px; font-weight: 800; font-family: var(--fd); cursor: pointer; box-shadow: 0 4px 16px rgba(99,102,241,0.3); transition: all .2s; }
    .km-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
    .km-btn-ghost { padding: 12px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 700; font-family: var(--fd); cursor: pointer; transition: all .2s; }
    .km-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .km-modal-right { width: 280px; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.06); padding: 32px 24px; background: rgba(255,255,255,0.02); overflow-y: auto; max-height: 85vh; }
    .km-insight-header { font-size: 10px; font-weight: 800; letter-spacing: .18em; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 20px; }
    .km-insights-scroll { display: flex; flex-direction: column; gap: 20px; }
    .km-visual-card { background: rgba(255,255,255,0.04); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.06); }
    .km-user-mini { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .km-user-mini img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .km-mini-name { font-size: 13px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 4px; }
    .km-mini-role { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; }
    .km-mini-tag { font-size: 9px; font-weight: 800; background: rgba(16,185,129,0.15); color: #6ee7b7; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; letter-spacing: .08em; margin-left: auto; }
    .km-visual-stats { display: flex; gap: 12px; margin-bottom: 16px; }
    .km-vstat { flex: 1; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px; text-align: center; }
    .km-vstat strong { display: block; font-family: var(--fd); font-size: 20px; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 4px; }
    .km-vstat span { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: .08em; }
    .km-visual-graph { margin-bottom: 8px; }
    .km-graph-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .km-graph-label span { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; }
    .km-sc-val { font-family: var(--fd); font-size: 18px; font-weight: 800; color: #fff; }
    .km-sc-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; }
    .km-sc-pct { font-size: 12px; font-weight: 800; color: #6ee7b7; display: block; margin-top: 4px; }
    .km-mt-track { height: 4px; border-radius: 4px; background: rgba(255,255,255,0.06); display: flex; gap: 2px; overflow: hidden; }
    .km-mt-bar { height: 100%; border-radius: 4px; background: rgba(255,255,255,0.1); transition: width .6s; }
    .km-mt-bar.active { background: linear-gradient(90deg,#6366f1,#818cf8); }
    @media (max-width: 768px) {
      .chat-modal-left { width: 100% !important; min-width: 100% !important; }
      .chat-modal-back-btn { display: flex !important; }
    }
  `;
  document.head.appendChild(style);
}

const colors = [
  { bg: "#EEF2FF", col: "#4338CA" },
  { bg: "#FFF7ED", col: "#C2410C" },
  { bg: "#F0FDF4", col: "#15803D" },
  { bg: "#EFF6FF", col: "#1D4ED8" },
  { bg: "#FDF2F8", col: "#9D174D" },
  { bg: "#FEF3C7", col: "#92400E" },
  { bg: "#E0E7FF", col: "#3730A3" },
];

export default function HomeDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [recommendedJobs, setRecommendedJobs] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [nvites, setNvites] = useState([]);
  const [earlyAccess, setEarlyAccess] = useState([]);
  const [showEarlyAccessModal, setShowEarlyAccessModal] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [followedCompanyJobs, setFollowedCompanyJobs] = useState([]);
  const [followedCompanies, setFollowedCompanies] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalApplications: 0,
    shortlisted: 0,
    interviews: 0,
    companiesApplied: 0,
  });
  const [showKnowMoreModal, setShowKnowMoreModal] = useState(false);
  const [showApplyMatchModal, setShowApplyMatchModal] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPreferencesSidebar, setShowPreferencesSidebar] = useState(false);
  const jobScrollRef = useRef(null);
  const followedJobScrollRef = useRef(null);
  const matchScrollRef = useRef(null);
  const blogScrollRef = useRef(null);
  const leftSidebarRef = useRef(null);
  const rightSidebarRef = useRef(null);

  useEffect(() => {
    if (!leftSidebarRef.current || !rightSidebarRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === leftSidebarRef.current) {
          const height = entry.target.getBoundingClientRect().height;
          document.documentElement.style.setProperty('--left-sidebar-height', `${height}px`);
        }
        if (entry.target === rightSidebarRef.current) {
          const height = entry.target.getBoundingClientRect().height;
          document.documentElement.style.setProperty('--right-sidebar-height', `${height}px`);
        }
      }
    });
    observer.observe(leftSidebarRef.current);
    observer.observe(rightSidebarRef.current);
    return () => observer.disconnect();
  }, []);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [quickApplyJob, setQuickApplyJob] = useState(null);
  const [qaAnswers, setQaAnswers] = useState({});
  const [qaErrors, setQaErrors] = useState({});
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaSuccess, setQaSuccess] = useState(false);
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);
  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpJobId, setFollowUpJobId] = useState(null);
  const followUpTimerRef = useRef(null);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({});



  const { data: blogsData } = usePublishedBlogs();
  const [latestBlogs, setLatestBlogs] = useState([]);
  
  const { data: companiesData } = useCandidateCompanies({ limit: 4 }, !!user);
  const topCompanies = companiesData?.companies || [];

  const dashboardQuery = useDashboard(!!user);
  const { data: dashboardData, isLoading: dashboardLoading } = dashboardQuery;
  const { mutateAsync: saveJobMutation } = useSaveJob(user?._id || user?.id);

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const toL = (v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`);
    if (min && max) return `${toL(min)} - ${toL(max)} P.A.`;
    if (max) return `Up to ${toL(max)} P.A.`;
    return `${toL(min)}+ P.A.`;
  };

  const buildTags = (job) => {
    const tagSet = new Set();
    if (job.workplaceType) tagSet.add(job.workplaceType);
    if (job.jobType) tagSet.add(job.jobType);
    if (job.department && job.department.length < 25)
      tagSet.add(job.department);
    if (tagSet.size === 0) tagSet.add("Full-Time");
    return [...tagSet].slice(0, 3);
  };

  const formatJobData = (job, idx) => ({
    ...job,
    id: job._id || job.id,
    title: job.title,
    company: job.companyName,
    loc: job.location || "Remote",
    ago: job.lastUpdated,
    rating: job.companyRating || (4.0 + Math.random() * 0.9).toFixed(1),
    code: job.title.substring(0, 2).toUpperCase(),
    bg: colors[idx % colors.length].bg,
    col: colors[idx % colors.length].col,
    hiringCompanies: job.hiringCompanies || [],
    tags: buildTags(job),
    salaryFormatted: formatSalary(job.salaryMin, job.salaryMax),
  });

  useEffect(() => {
    if (!dashboardData) return;
    if (dashboardData.recommendedJobs) {
      const mappedJobs = {};
      Object.keys(dashboardData.recommendedJobs).forEach((key) => {
        mappedJobs[key] = dashboardData.recommendedJobs[key].map(formatJobData);
      });
      setRecommendedJobs(mappedJobs);
      const firstKey = Object.keys(mappedJobs)[0];
      if (firstKey) setActiveTab(firstKey);
    }
    if (dashboardData.nvites) setNvites(dashboardData.nvites);
    if (dashboardData.earlyAccess)
      setEarlyAccess(dashboardData.earlyAccess.map(formatJobData));
    if (dashboardData.followedCompanyJobs)
      setFollowedCompanyJobs(
        dashboardData.followedCompanyJobs.map((job, idx) =>
          formatJobData(job, idx),
        ),
      );
    if (dashboardData.followedCompanies)
      setFollowedCompanies(dashboardData.followedCompanies);
    if (dashboardData.profile) setCandidateProfile(dashboardData.profile);
    if (dashboardData.summary) setDashboardSummary(dashboardData.summary);
    if (dashboardData.recentApplications)
      setRecentApplications(dashboardData.recentApplications);
    setPageLoading(false);
  }, [dashboardData]);

  useEffect(() => {
    if (blogsData?.blogs) setLatestBlogs(blogsData.blogs);
  }, [blogsData]);

  useEffect(() => {
    return () => {
      aiService.cancelAll();
    };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, []);

  const handleScroll = (ref, dir) => {
    if (ref.current)
      ref.current.scrollBy({
        left: dir === "left" ? -300 : 300,
        behavior: "smooth",
      });
  };

  const handleSaveJob = async (jobId) => {
    if (!jobId) return;
    const isCurrentlySaved =
      candidateProfile?.savedJobIds?.includes(jobId) || false;
    try {
      const res = await saveJobMutation({ jobId, save: !isCurrentlySaved });
      if (res?.success && res?.data) {
        setCandidateProfile((prev) => ({
          ...prev,
          savedJobIds: res.data.savedJobIds,
        }));
      }
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  if (!user) return <Navigate to="/" />;
  if (pageLoading) return <HourglassLoader />;

  const handleQuickApply = async (job) => {
    if (appliedJobs[job.id] || job.hasApplied) return;

    const questions = job.screeningQuestions || [];
    if (questions.length > 0) {
      setQuickApplyJob({
        id: job.id,
        title: job.title,
        companyName: job.company,
        companyLogoUrl: job.companyLogoUrl,
        location: job.loc,
        screeningQuestions: questions,
      });
      setQaAnswers({});
      setQaErrors({});
      setQaSuccess(false);
      setShowApplyModal(true);
      return;
    }

    setApplyingJobId(job.id);
    try {
      const res = await authService.getJobDetail(job.id);
      const remoteQuestions = res?.data?.job?.screeningQuestions || [];
      if (remoteQuestions.length > 0) {
        setQuickApplyJob({
          ...res.data.job,
          companyName: res.data.job.companyName || job.company,
          companyLogoUrl: res.data.job.companyLogoUrl || job.companyLogoUrl,
          location: res.data.job.location || job.loc,
          screeningQuestions: remoteQuestions,
        });
        setQaAnswers({});
        setQaErrors({});
        setQaSuccess(false);
        setShowApplyModal(true);
        setApplyingJobId(null);
        return;
      }
    } catch {
      /* fall through */
    }

    try {
      await authService.createApplication({
        jobId: job.id,
        appliedFrom: "QUICK_APPLY",
      });
      setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || err?.error || "";
      if (msg.toLowerCase().includes("already applied")) {
        setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
      }
    }
    setApplyingJobId(null);
  };

  const handleQaChange = (qId, value) => {
    setQaAnswers((prev) => ({ ...prev, [qId]: value }));
    if (qaErrors[qId]) {
      setQaErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleQaSubmit = async (e) => {
    e.preventDefault();
    if (!quickApplyJob) return;

    const questions = quickApplyJob.screeningQuestions || [];
    let isValid = true;
    const newErrors = {};
    questions.forEach((q) => {
      const qid = q._id || q.id;
      const val = qaAnswers[qid];
      if (q.required && (val === undefined || val === null || val === "")) {
        newErrors[qid] = "This question is required";
        isValid = false;
      }
    });
    if (!isValid) {
      setQaErrors(newErrors);
      return;
    }

    setQaSubmitting(true);
    try {
      const answers = questions.map((q) => ({
        questionId: q._id || q.id,
        question: q.question,
        answer: qaAnswers[q._id || q.id] || "",
      }));
      await authService.createApplication({
        jobId: quickApplyJob.id,
        appliedFrom: "QUICK_APPLY",
        answers,
      });
      setQaSuccess(true);
      setAppliedJobs((prev) => ({ ...prev, [quickApplyJob.id]: true }));
    } catch {
      setQaSuccess(false);
    }
    setQaSubmitting(false);
  };

  const handleProceedExternal = () => {
    window.open(externalLinkUrl, "_blank", "noopener,noreferrer");
    setShowExternalLinkModal(false);
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    followUpTimerRef.current = setTimeout(() => {
      setShowFollowUpModal(true);
    }, 5000);
  };

  const handleAppliedYes = async () => {
    setShowFollowUpModal(false);
    if (followUpJobId) {
      setAppliedJobs((prev) => ({ ...prev, [followUpJobId]: true }));
      try {
        await authService.createApplication({ jobId: followUpJobId });
      } catch {
        /* already tracked */
      }
    }
    setFollowUpJobId(null);
  };

  const handleAppliedNo = () => {
    setShowFollowUpModal(false);
    setFollowUpJobId(null);
  };

  const renderJobCard = (job) => {
    const isApplied = appliedJobs[job.id] || job.hasApplied;
    return (
      <div className="pd-job-card" key={job.id}>
        <div className="pd-job-header">
          <div
            className="pd-job-logo"
            style={{ background: job.bg, color: job.col, overflow: "hidden" }}
          >
            {job.companyLogoUrl ? (
              <img
                src={job.companyLogoUrl}
                alt={job.company}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 10,
                }}
              />
            ) : (
              job.code
            )}
          </div>
          <span className="pd-job-ago">{job.ago}</span>
        </div>
        <h4 className="pd-job-title">{job.title}</h4>
        <p className="pd-job-company">
          {job.company}{" "}
          <span className="pd-job-rating">
            <FiStar size={11} /> {job.rating}
            {job.companyReviewCount ? ` (${job.companyReviewCount})` : ""}
          </span>
        </p>
        <p className="pd-job-loc">
          <FiMapPin size={11} /> {job.loc}
        </p>
        <AITrigger
          rootMargin="200px"
          triggerOnce={true}
          onTrigger={() => {
            if (!job.matchScore && !job._matchScoreLoading) {
              job._matchScoreLoading = true;
              authService
                .getJobMatchScore(job.id)
                .then((res) => {
                  if (res?.success && res?.data) {
                    setRecommendedJobs((prev) => {
                      const newJobs = { ...prev };
                      Object.keys(newJobs).forEach((tab) => {
                        newJobs[tab] = newJobs[tab].map((j) =>
                          j.id === job.id
                            ? { ...j, ...res.data, _matchScoreLoading: false }
                            : j,
                        );
                      });
                      return newJobs;
                    });
                  }
                })
                .catch(() => {});
            }
          }}
        >
          {(triggered) => (
            <>
              {triggered &&
                job.matchScore !== null &&
                job.matchScore !== undefined && (
                  <div
                    className="pd-job-match-score"
                    style={{
                      marginTop: 8,
                      padding: 8,
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-slate-100"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray="113.1"
                            strokeDashoffset={
                              113.1 * (1 - (job.matchScore || 0) / 100)
                            }
                            className="text-[#10b981]"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-black text-[#1a1a1a] leading-none">
                            {job.matchScore}
                          </span>
                          <span className="text-[6px] font-bold text-slate-400 uppercase">
                            Score
                          </span>
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: 11 }}>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {job.skillMatch !== undefined && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">
                              Skills: {job.skillMatch}%
                            </span>
                          )}
                          {job.locationMatch !== undefined && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              Location: {job.locationMatch}%
                            </span>
                          )}
                          {job.experienceMatch !== undefined && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                              Exp: {job.experienceMatch}%
                            </span>
                          )}
                          {job.roleMatch !== undefined && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                              Role: {job.roleMatch}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </>
          )}
        </AITrigger>
        <div className="pd-job-actions">
          {job.externalLink ? (
            <button
              className="pd-job-apply"
              onClick={() => {
                setExternalLinkUrl(job.externalLink);
                setFollowUpJobId(job.id);
                setShowExternalLinkModal(true);
              }}
            >
              <FiExternalLink size={14} /> Company Site
            </button>
          ) : isApplied ? (
            <button className="pd-job-applied" disabled>
              <FiCheckCircle size={14} /> Applied
            </button>
          ) : (
            <button
              className="pd-job-apply"
              disabled={applyingJobId === job.id}
              onClick={() => handleQuickApply(job)}
            >
              {applyingJobId === job.id ? "Applying..." : "Quick Apply"}
            </button>
          )}
          <button className="pd-job-save" onClick={() => handleSaveJob(job.id)}>
            <FiBookmark
              size={14}
              fill={
                candidateProfile?.savedJobIds?.includes(job.id)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    );
  };

  const renderFollowedJobCard = (job) => {
    const isApplied = appliedJobs[job.id] || job.hasApplied;
    return (
      <div className="pd-job-card" key={job.id}>
        <div className="pd-job-header">
          <div
            className="pd-job-logo"
            style={{ background: job.bg, color: job.col, overflow: "hidden" }}
          >
            {job.companyLogoUrl ? (
              <img
                src={job.companyLogoUrl}
                alt={job.company}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 10,
                }}
              />
            ) : (
              job.code
            )}
          </div>
          <span className="pd-job-ago">{job.ago}</span>
        </div>
        <h4 className="pd-job-title">{job.title}</h4>
        <p className="pd-job-company">
          {job.company}{" "}
          <span className="pd-job-rating">
            <FiStar size={11} /> {job.rating}
            {job.companyReviewCount ? ` (${job.companyReviewCount})` : ""}
          </span>
        </p>
        <p className="pd-job-loc">
          <FiMapPin size={11} /> {job.loc}
        </p>
        <div className="pd-job-actions">
          {job.externalLink ? (
            <button
              className="pd-job-apply"
              onClick={() => {
                setExternalLinkUrl(job.externalLink);
                setFollowUpJobId(job.id);
                setShowExternalLinkModal(true);
              }}
            >
              <FiExternalLink size={14} /> Company Site
            </button>
          ) : isApplied ? (
            <button className="pd-job-applied" disabled>
              <FiCheckCircle size={14} /> Applied
            </button>
          ) : (
            <button
              className="pd-job-apply"
              disabled={applyingJobId === job.id}
              onClick={() => handleQuickApply(job)}
            >
              {applyingJobId === job.id ? "Applying..." : "Quick Apply"}
            </button>
          )}
          <button className="pd-job-save" onClick={() => handleSaveJob(job.id)}>
            <FiBookmark
              size={14}
              fill={
                candidateProfile?.savedJobIds?.includes(job.id)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pd-root">
      {/*  Navbar  */}
      <CandidateHeader />

      <div className="hd-page">
        {/* Main 3-Column Layout */}
        <div className="hd-main">
          {/* Left Sidebar */}
          <aside className="pd-left">
            <div className="pd-left-sticky" ref={leftSidebarRef}>
              <ProfileWidget
                user={user}
                profileCompletion={Number(user?.profileCompletion || 0)}
              />
              
              <div className="pd-card" style={{ padding: '8px 12px', marginTop: '16px' }}>
                <div className="pd-quick-links-list">
                  {[
                    { label: 'My home', id: 'section-home', icon: <FiHome size={18} /> },
                    { label: 'Jobs', id: 'section-recommended', icon: <FiBriefcase size={18} /> },
                    { label: 'Companies', id: 'section-companies', icon: <FiMonitor size={18} /> },
                    { label: 'Blogs', id: 'section-blogs', icon: <FiBookOpen size={18} /> },
                    { label: 'MIvites', id: 'section-mivites', icon: <FiMail size={18} /> },
                    { label: 'Apply match', id: 'section-apply-match', icon: <FiTrendingUp size={18} /> }
                  ].map((link, i) => (
                    <div 
                      key={link.id} 
                      className={`pd-quick-link-item ${i === 0 ? 'active' : ''}`}
                      onClick={() => {
                        if (link.id === 'section-home') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        const el = document.getElementById(link.id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    >
                      <span className="pd-quick-link-icon">{link.icon}</span>
                      <span className="pd-quick-link-text">{link.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="desktop-only">
                <FollowingCompanies
                  companies={followedCompanies}
                  totalCount={followedCompanies.length}
                />
                <Link
                  to="/premium"
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    className="pd-card pd-premium-card"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="pd-premium-glow" />
                    <div className="pd-premium-eyebrow">
                      PREMIUM X PROFILE SIGNAL
                    </div>
                    <h3 className="pd-premium-title">
                      Verified career visibility
                    </h3>
                    <p className="pd-premium-desc">
                      PremiumX adds a verified profile layer, recruiter-ready
                      highlights, and smart outreach signals for high-intent
                      candidates.
                    </p>
                    <div className="pd-premium-mini-grid">
                      <span>
                        <FiShield size={13} /> Verified badge
                      </span>
                      <span>
                        <FiTrendingUp size={13} /> Visibility boost
                      </span>
                      <span>
                        <FiMessageSquare size={13} /> Recruiter inbox
                      </span>
                    </div>
                    <span className="pd-premium-link">
                      Explore PremiumX <FiArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </aside>

          {/* Center Content */}
          <section className="pd-center">
            {/* Recommended Jobs */}
            <div className="pd-card" id="section-recommended">
              <div className="pd-section-header">
                <h3>Recommended for you</h3>
                <Link to="/recommended-jobs" className="pd-text-btn">
                  View all <FiChevronRight size={14} />
                </Link>
              </div>
              <div className="pd-tabs" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(recommendedJobs).map((tab) => (
                  <button
                    key={tab}
                    className={`pd-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
                {activeTab && activeTab.startsWith("Preferences") && recommendedJobs[activeTab]?.length > 0 && (
                  <button 
                    onClick={() => setShowPreferencesSidebar(true)} 
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="pd-scroll-wrap">
                <button
                  className="pd-scroll-btn left"
                  onClick={() => handleScroll(jobScrollRef, "left")}
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="pd-job-scroll" ref={jobScrollRef}>
                  {!recommendedJobs[activeTab] || recommendedJobs[activeTab].length === 0 ? (
                    activeTab.startsWith("Preferences") ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: 1,
                          padding: "40px 20px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "12px",
                          margin: "10px auto",
                          maxWidth: "600px",
                          width: "100%",
                        }}
                      >
                        <h4
                          style={{
                            color: "#0f172a",
                            fontSize: "17px",
                            fontWeight: "600",
                            margin: "0 0 20px 0",
                            textAlign: "center",
                            lineHeight: "1.4"
                          }}
                        >
                          Get the best job recommendations by<br/>telling us your career needs
                        </h4>
                        <button
                          onClick={() => setShowPreferencesSidebar(true)}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            padding: "10px 24px",
                            borderRadius: "24px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px"
                          }}
                        >
                          Update career preferences
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: 1,
                          padding: "60px 20px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "16px",
                          border: "1.5px dashed #cbd5e1",
                          margin: "10px auto",
                          maxWidth: "400px",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            backgroundColor: "#e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                          }}
                        >
                          <FiBriefcase size={24} style={{ color: "#64748b" }} />
                        </div>
                        <h4
                          style={{
                            color: "#1e293b",
                            fontSize: "16px",
                            fontWeight: "700",
                            margin: "0 0 6px 0",
                          }}
                        >
                          No jobs found
                        </h4>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          We couldn't find any jobs in this category right now.
                        </p>
                      </div>
                    )
                  ) : (
                    (recommendedJobs[activeTab] || []).map(renderJobCard)
                  )}
                </div>
                <button
                  className="pd-scroll-btn right"
                  onClick={() => handleScroll(jobScrollRef, "right")}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Jobs from Followed Companies */}
            <div className="pd-card" id="section-followed">
              <div className="pd-section-header">
                <h3>Jobs from Followed Companies</h3>
                <Link to="/companies" className="pd-text-btn">
                  Follow more <FiChevronRight size={14} />
                </Link>
              </div>
              <div className="pd-scroll-wrap">
                <button
                  className="pd-scroll-btn left"
                  onClick={() => handleScroll(followedJobScrollRef, "left")}
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="pd-job-scroll" ref={followedJobScrollRef}>
                  {followedCompanyJobs.length > 0 ? (
                    followedCompanyJobs.map(renderFollowedJobCard)
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        padding: "40px 20px",
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          backgroundColor: "#F0FDF4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <FiBriefcase size={20} style={{ color: "#10b981" }} />
                      </div>
                      <h4
                        style={{
                          color: "#1e293b",
                          fontSize: "15px",
                          fontWeight: "600",
                          margin: "0 0 4px",
                        }}
                      >
                        Jobs from companies you follow
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          margin: 0,
                          maxWidth: 320,
                        }}
                      >
                        Follow companies to see their latest job openings here.
                        Start exploring companies now.
                      </p>
                      <button
                        onClick={() => navigate("/companies")}
                        style={{
                          marginTop: 16,
                          padding: "8px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: "#10b981",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Explore Companies
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="pd-scroll-btn right"
                  onClick={() => handleScroll(followedJobScrollRef, "right")}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Apply Match - last 7 days */}
            {(() => {
              const safeApps = recentApplications || [];
              const appsWithScores = safeApps.filter(
                (app) => app && typeof app.matchScore === "number",
              );
              const hasApps = appsWithScores.length > 0;
              const getAvg = (field, fallback) => {
                if (!hasApps) return fallback;
                const sum = appsWithScores.reduce(
                  (acc, curr) => acc + (curr[field] ?? fallback),
                  0,
                );
                return Math.round(sum / appsWithScores.length);
              };

              const totalApps =
                dashboardSummary?.totalApplications || safeApps.length || 0;
              const matchedAppsCount = hasApps
                ? appsWithScores.filter((app) => app.matchScore >= 75).length
                : 0;
              const matchRateRatio =
                totalApps > 0 ? matchedAppsCount / totalApps : 0;
              const matchRateStatus =
                matchRateRatio > 0.5
                  ? "HIGH"
                  : matchRateRatio > 0.25
                    ? "MED"
                    : "LOW";

              const userExp =
                candidateProfile?.totalExperience || user?.experience || "1 yr";
              const userExpNum = parseFloat(userExp) || 1;
              const expMatchPct = getAvg("experienceMatch", hasApps ? 75 : 0);

              const userCity =
                candidateProfile?.currentCity ||
                candidateProfile?.preferredLocations?.[0] ||
                user?.currentCity ||
                "Remote";
              const locMatchPct = getAvg("locationMatch", hasApps ? 82 : 0);

              const userSkills = candidateProfile?.skills || user?.skills || [];
              const userSkillsStr =
                userSkills.length > 0
                  ? userSkills.slice(0, 2).join(", ")
                  : "Add Skills";
              const skillsMatchPct = getAvg("skillMatch", hasApps ? 65 : 0);

              const userIndustry =
                candidateProfile?.currentCompany ||
                user?.company ||
                "IT & Services";
              const industryMatchPct = getAvg("roleMatch", hasApps ? 80 : 0);

              const userDept =
                candidateProfile?.currentTitle ||
                user?.headline ||
                "Professional";
              const deptMatchPct = getAvg("roleMatch", hasApps ? 78 : 0);

              const earlyAppVal = "Fresh jobs";
              const earlyAppPct = hasApps ? getAvg("matchScore", 75) + 4 : 0;

              const dynamicMatchMetrics = [
                {
                  label: "Work Experience",
                  val: `${userExp}${userExp.toLowerCase().includes("yr") ? "" : " Yrs"}`,
                  pct: expMatchPct,
                  icon: <FiBriefcase />,
                },
                {
                  label: "Location",
                  val: userCity,
                  pct: locMatchPct,
                  icon: <FiMapPin />,
                },
                {
                  label: "Key Skills",
                  val:
                    userSkillsStr.length > 15
                      ? userSkillsStr.substring(0, 14) + "..."
                      : userSkillsStr,
                  pct: skillsMatchPct,
                  icon: <FiEdit2 />,
                },
                {
                  label: "Industry",
                  val:
                    userIndustry.length > 15
                      ? userIndustry.substring(0, 14) + "..."
                      : userIndustry,
                  pct: industryMatchPct,
                  icon: <FiMonitor />,
                },
                {
                  label: "Department",
                  val:
                    userDept.length > 15
                      ? userDept.substring(0, 14) + "..."
                      : userDept,
                  pct: deptMatchPct,
                  icon: <FiUsers />,
                },
                {
                  label: "Early Applicant",
                  val: earlyAppVal,
                  pct: earlyAppPct,
                  icon: <FiTrendingUp />,
                },
              ];

              return (
                <div className="pd-card pd-match-card" id="section-apply-match">
                  <div className="pd-section-header">
                    <h3>Apply match - last 7 days</h3>
                    <button
                      className="pd-text-btn"
                      onClick={() => setShowApplyMatchModal(true)}
                    >
                      View all <FiChevronRight size={14} />
                    </button>
                  </div>
                  <div className="pd-scroll-wrap">
                    <button
                      className="pd-scroll-btn left"
                      onClick={() => {
                        if (matchScrollRef.current)
                          matchScrollRef.current.scrollBy({
                            left: -300,
                            behavior: "smooth",
                          });
                      }}
                    >
                      <FiChevronLeft size={18} />
                    </button>
                    <div className="pd-match-scroll" ref={matchScrollRef}>
                      <div className="pd-match-card-item summary">
                        <div
                          className={`pd-match-low-ring ${matchRateStatus.toLowerCase()}`}
                        >
                          <span>{matchRateStatus}</span>
                        </div>
                        <p>
                          <strong>
                            {matchedAppsCount} of {totalApps}
                          </strong>{" "}
                          applies matched
                        </p>
                      </div>
                      {dynamicMatchMetrics.map((m, i) => (
                        <div className="pd-match-card-item" key={i}>
                          <div className="pd-match-ring-wrap">
                            <svg viewBox="0 0 50 50" className="pd-match-svg">
                              <circle cx="25" cy="25" r="21" />
                              <circle
                                cx="25"
                                cy="25"
                                r="21"
                                style={{
                                  strokeDashoffset: `calc(132 - (132 * ${m.pct}) / 100)`,
                                }}
                              />
                            </svg>
                            <span className="pd-match-ring-icon">{m.icon}</span>
                          </div>
                          <div className="pd-match-info">
                            <h4>{m.label}</h4>
                            <p>{m.val}</p>
                            <span className="pd-match-pct">{m.pct}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="pd-match-card-item update">
                        <h4>Review your profile</h4>
                        <p>Improve job recommendations</p>
                        <button
                          className="pd-update-link"
                          onClick={() => navigate("/profile")}
                        >
                          Update Profile <FiArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="pd-scroll-btn right"
                      onClick={() => {
                        if (matchScrollRef.current)
                          matchScrollRef.current.scrollBy({
                            left: 300,
                            behavior: "smooth",
                          });
                      }}
                    >
                      <FiChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Top Companies */}
            <div className="pd-card" id="section-companies">
              <div className="pd-section-header">
                <h3>Top companies for you</h3>
                <Link to="/companies" className="pd-text-btn">
                  View all <FiChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '10px 0' }}>
                {topCompanies.length > 0 ? (
                  topCompanies.slice(0, 4).map(c => (
                    <div key={c.id || c._id} onClick={() => navigate(`/company/${c.id || c._id}`)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0',
                      cursor: 'pointer', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                       <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {c.logoUrl ? <img src={c.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} alt={c.name} /> : <FiMonitor size={20} color="#64748b" />}
                       </div>
                       <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h4>
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.industry || 'Information Technology'}</span>
                       </div>
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    Loading top companies...
                  </div>
                )}
              </div>
            </div>

            {/* NVites */}
            <div id="section-mivites">
              <NVites nvites={nvites} />
            </div>

            {/* Early Access Roles */}
            <EarlyAccessRoles
              earlyAccess={earlyAccess}
              onViewAll={() => setShowEarlyAccessModal(true)}
            />

            {/* Top Blogs */}
            <div className="pd-card" id="section-blogs">
              <div className="pd-section-header">
                <h3>Recommended blogs</h3>
                <Link to="/blogs" className="pd-text-btn">
                  View all <FiChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px' }}>
                {latestBlogs.length > 0 ? (
                  latestBlogs.slice(0, 3).map(blog => (
                    <Link key={blog._id || blog.id} to={`/blogs/${blog.slug}`} style={{ display: 'flex', gap: '16px', textDecoration: 'none', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: blog.coverImage?.url ? `url(${blog.coverImage.url}) center/cover` : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.title}</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>{blog.category || 'General'}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {blog.metadata?.readTimeMinutes ? `${blog.metadata.readTimeMinutes} min read` : '5 min read'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    Loading recommended blogs...
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Only Extras (Following + Premium) */}
            <div className="mobile-only">
              <FollowingCompanies
                companies={followedCompanies}
                totalCount={followedCompanies.length}
              />
              <Link
                to="/premium"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="pd-card pd-premium-card"
                  style={{ cursor: "pointer" }}
                >
                  <div className="pd-premium-glow" />
                  <div className="pd-premium-eyebrow">
                    PREMIUM X PROFILE SIGNAL
                  </div>
                  <h3 className="pd-premium-title">
                    Verified career visibility
                  </h3>
                  <p className="pd-premium-desc">
                    PremiumX adds a verified profile layer, recruiter-ready
                    highlights, and smart outreach signals for high-intent
                    candidates.
                  </p>
                  <div className="pd-premium-mini-grid">
                    <span>
                      <FiShield size={13} /> Verified badge
                    </span>
                    <span>
                      <FiTrendingUp size={13} /> Visibility boost
                    </span>
                    <span>
                      <FiMessageSquare size={13} /> Recruiter inbox
                    </span>
                  </div>
                  <span className="pd-premium-link">
                    Explore PremiumX <FiArrowRight size={13} />
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="pd-right" ref={rightSidebarRef}>
            {/* Recruiter Spotlight */}
            <div className="pd-card pd-standout-card">
              <div className="pd-standout-text">
                <div className="pd-standout-eyebrow">RECRUITER SPOTLIGHT</div>
                <h3>Stand out from the crowd</h3>
                <p>
                  Highlight your application and get noticed by top recruiters
                  instantly.
                </p>
                <button
                  className="pd-btn-primary sm"
                  onClick={() => setShowKnowMoreModal(true)}
                >
                  <FiZap size={13} /> Know More
                </button>
              </div>
              <div className="pd-standout-graphic">
                <div className="pd-graphic-rings">
                  <div className="pd-ring r1" />
                  <div className="pd-ring r2" />
                  <div className="pd-ring r3" />
                </div>
                <FiUsers size={36} className="pd-standout-icon" />
              </div>
            </div>

            <EliteChatWidget
              followedCompanyIds={candidateProfile?.followedCompanyIds || []}
            />

            {/* Blogs */}
            <div className="pd-card pd-blog-card" style={{ padding: 0, overflow: 'hidden' }}>
              {latestBlogs.length > 0 ? (
                <Link to={`/blogs/${latestBlogs[0].slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    width: '100%',
                    height: '140px',
                    background: latestBlogs[0].coverImage?.url 
                      ? `url(${latestBlogs[0].coverImage.url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 40%, #06B6D4 100%)'
                  }} />
                  <div style={{ padding: '20px 16px' }}>
                    <h4 style={{ 
                      margin: '0 0 20px 0', 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      color: '#0f172a', 
                      lineHeight: '1.4' 
                    }}>
                      {latestBlogs[0].title}
                    </h4>
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: '#2563eb' 
                    }}>
                      Know more
                    </span>
                  </div>
                </Link>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  <p>No blogs yet. Check back soon!</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Early Access Modal */}
      <EarlyAccessModal
        isOpen={showEarlyAccessModal}
        onClose={() => setShowEarlyAccessModal(false)}
        jobs={earlyAccess}
      />

      {/* ── External Link Fraud Warning Modal ── */}
      {showExternalLinkModal && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              maxWidth: 480,
              width: "90%",
              padding: "36px 32px 28px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "linear-gradient(90deg, #dc2626, #f59e0b, #dc2626)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiAlertTriangle size={26} color="#dc2626" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  You're leaving MavenJobs
                </h3>
                <p
                  style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}
                >
                  This job posting contains an external link
                </p>
              </div>
            </div>
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 14,
                padding: "16px 18px",
                marginBottom: 24,
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <FiShield
                  size={18}
                  color="#d97706"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <div
                  style={{ fontSize: 13, lineHeight: 1.7, color: "#78350f" }}
                >
                  <strong>Stay safe —</strong> MavenJobs does not verify
                  external job listings. Never share your personal information
                  (bank details, OTPs, passwords) with anyone you don't trust.
                  If something feels off, <strong>close this page</strong> and
                  report the listing to our support team.
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.7,
                marginBottom: 24,
                padding: "0 2px",
              }}
            >
              Click <strong>"Proceed"</strong> to visit{" "}
              <span
                style={{
                  color: "#002366",
                  fontWeight: 600,
                  wordBreak: "break-all",
                  fontSize: 12.5,
                }}
              >
                {externalLinkUrl}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowExternalLinkModal(false)}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleProceedExternal}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #002366, #1a3a6e)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  boxShadow: "0 4px 14px rgba(0,35,102,0.25)",
                }}
              >
                Proceed{" "}
                <FiExternalLink
                  size={14}
                  style={{ marginLeft: 4, verticalAlign: "middle" }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up: Have you applied? ── */}
      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              maxWidth: 400,
              width: "90%",
              padding: "32px 28px 24px",
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FiCheckCircle size={24} color="#10b981" />
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 6px",
              }}
            >
              Have you applied for this job?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Did you successfully submit your application on the company's
              website?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleAppliedNo}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                No
              </button>
              <button
                onClick={handleAppliedYes}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#002366",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Yes, I applied
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setQuickApplyJob(null);
        }}
        job={quickApplyJob}
        user={user}
        answers={qaAnswers}
        errors={qaErrors}
        isSubmitting={qaSubmitting}
        isSuccess={qaSuccess}
        onChange={handleQaChange}
        onSubmit={handleQaSubmit}
      />

      {/* ─── Apply Match Analytics Modal ─── */}
      {showApplyMatchModal &&
        (() => {
          const safeApps = recentApplications || [];
          const appsWithScores = safeApps.filter(
            (app) => app && typeof app.matchScore === "number",
          );
          const hasApps = appsWithScores.length > 0;
          const getAvg = (field, fallback) => {
            if (!hasApps) return fallback;
            const sum = appsWithScores.reduce(
              (acc, curr) => acc + (curr[field] ?? fallback),
              0,
            );
            return Math.round(sum / appsWithScores.length);
          };

          const totalApps =
            dashboardSummary?.totalApplications || safeApps.length || 0;
          const matchedAppsCount = hasApps
            ? appsWithScores.filter((app) => app.matchScore >= 75).length
            : 0;
          const matchRateRatio =
            totalApps > 0 ? matchedAppsCount / totalApps : 0;
          const matchRatePct = Math.round(matchRateRatio * 100);

          const userExp =
            candidateProfile?.totalExperience || user?.experience || "1 yr";
          const expMatchPct = getAvg("experienceMatch", hasApps ? 75 : 0);

          const userCity =
            candidateProfile?.currentCity ||
            candidateProfile?.preferredLocations?.[0] ||
            user?.currentCity ||
            "Remote";
          const locMatchPct = getAvg("locationMatch", hasApps ? 82 : 0);

          const userSkills = candidateProfile?.skills || user?.skills || [];
          const userSkillsStr =
            userSkills.length > 0
              ? userSkills.slice(0, 2).join(", ")
              : "Add Skills";
          const skillsMatchPct = getAvg("skillMatch", hasApps ? 65 : 0);

          const userIndustry =
            candidateProfile?.currentCompany ||
            user?.company ||
            "IT & Services";
          const industryMatchPct = getAvg("roleMatch", hasApps ? 80 : 0);

          const userDept =
            candidateProfile?.currentTitle || user?.headline || "Professional";
          const deptMatchPct = getAvg("roleMatch", hasApps ? 78 : 0);

          const earlyAppVal = "Fresh jobs";
          const earlyAppPct = hasApps ? getAvg("matchScore", 75) + 4 : 0;

          const dimensions = [
            {
              title: "Work Experience Match",
              desc: `Your experience (${userExp}) aligns with ${expMatchPct}% of applied role requirements.`,
              tip: "Tip: Add recent freelance projects to boost score",
              pct: expMatchPct,
            },
            {
              title: "Location Compatibility",
              desc: `Based in ${userCity}. Matches ${locMatchPct}% of employer site preferences.`,
              tip: "Tip: Update preferred locations in profile settings",
              pct: locMatchPct,
            },
            {
              title: "Key Skills Alignment",
              desc: `Top skills (${userSkillsStr}) match ${skillsMatchPct}% of JD keywords.`,
              tip: "Tip: Add 3 more core skills from recent JDs",
              pct: skillsMatchPct,
            },
            {
              title: "Industry Relevance",
              desc: `Background in ${userIndustry} gives you an ${industryMatchPct}% advantage.`,
              tip: "Tip: Highlight industry-specific achievements",
              pct: industryMatchPct,
            },
            {
              title: "Department Fit",
              desc: `Title (${userDept}) matches ${deptMatchPct}% of target department hierarchies.`,
              tip: "Tip: Use standard industry job titles",
              pct: deptMatchPct,
            },
            {
              title: "Early Applicant Advantage",
              desc: `Applying within first 48 hours puts you in the top ${earlyAppPct}% of candidate visibility.`,
              tip: "Tip: Turn on instant job match alerts",
              pct: earlyAppPct,
            },
          ];

          const appsList = hasApps
            ? appsWithScores.slice(0, 5)
            : [
                {
                  companyName: "No recent applications",
                  jobTitle: "Apply to jobs to see your match scores!",
                  status: "-",
                  matchScore: 0,
                },
              ];

          return (
            <div
              className="pam-overlay"
              onClick={() => setShowApplyMatchModal(false)}
            >
              <div className="pam-content" onClick={(e) => e.stopPropagation()}>
                <div className="pam-header">
                  <div className="pam-title-area">
                    <h2>Application Match Analytics</h2>
                    <p>
                      Real-time telemetry and compatibility breakdown for your
                      recent job applications
                    </p>
                  </div>
                  <button
                    className="pam-close-btn"
                    onClick={() => setShowApplyMatchModal(false)}
                  >
                    <FiX size={22} />
                  </button>
                </div>

                <div className="pam-body">
                  <div className="pam-summary-grid">
                    <div className="pam-summary-card">
                      <span className="pam-summary-label">
                        Total Applications
                      </span>
                      <span className="pam-summary-val">{totalApps}</span>
                      <span className="pam-summary-sub">
                        Last 7 Days Activity
                      </span>
                    </div>
                    <div className="pam-summary-card">
                      <span className="pam-summary-label">
                        High Match Applies
                      </span>
                      <span className="pam-summary-val">
                        {matchedAppsCount}
                      </span>
                      <span className="pam-summary-sub">
                        Exceeds 80% Threshold
                      </span>
                    </div>
                    <div className="pam-summary-card">
                      <span className="pam-summary-label">
                        Overall Match Rate
                      </span>
                      <span className="pam-summary-val">{matchRatePct}%</span>
                      <span className="pam-summary-sub">
                        +14% vs Platform Avg
                      </span>
                    </div>
                    <div className="pam-summary-card">
                      <span className="pam-summary-label">
                        Shortlist Probability
                      </span>
                      <span className="pam-summary-val">
                        {(matchRateRatio * 1.2 * 100).toFixed(0)}%
                      </span>
                      <span className="pam-summary-sub">
                        Based on AI Telemetry
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="pam-section-title">
                      Match Breakdown by Dimension
                    </h3>
                    <div className="pam-grid">
                      {dimensions.map((d, idx) => (
                        <div className="pam-dim-card" key={idx}>
                          <div className="pam-dim-info">
                            <h4>{d.title}</h4>
                            <p>{d.desc}</p>
                          </div>
                          <div className="pam-dim-tip">{d.tip}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="pam-section-title">
                      Telemetry by Recent Application
                    </h3>
                    <div className="pam-table-card">
                      <table className="pam-table">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Role</th>
                            <th>Match Score</th>
                            <th>Application Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appsList.map((app, idx) => {
                            const score =
                              app.matchScore ||
                              Math.min(
                                98,
                                Math.max(
                                  65,
                                  Math.round(80 + (idx % 3) * 7 - idx * 2),
                                ),
                              );
                            const badgeClass =
                              score >= 85
                                ? "high"
                                : score >= 75
                                  ? "med"
                                  : "low";
                            return (
                              <tr key={idx}>
                                <td>
                                  <strong>
                                    {app.companyName ||
                                      app.company?.name ||
                                      "Enterprise Partner"}
                                  </strong>
                                </td>
                                <td>
                                  {app.jobTitle ||
                                    app.job?.title ||
                                    "Senior Engineer"}
                                </td>
                                <td>
                                  <span className={`pam-badge ${badgeClass}`}>
                                    {score}% Match
                                  </span>
                                </td>
                                <td>
                                  <span className="pam-status">
                                    {app.status || "APPLIED"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Know More Modal */}
      {showKnowMoreModal && (
        <div
          className="km-modal-overlay"
          onClick={() => setShowKnowMoreModal(false)}
        >
          <div className="km-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="km-modal-glow" />
            <button
              className="km-modal-close"
              onClick={() => setShowKnowMoreModal(false)}
            >
              <FiX size={20} />
            </button>

            <div className="km-modal-content">
              <div className="km-modal-left">
                <div className="km-sticky-top">
                  <div className="km-eyebrow">RECRUITER SPOTLIGHT</div>
                  <h2 className="km-title">
                    Stand out to the <span>Top 1%</span> of recruiters
                  </h2>
                  <p className="km-subtitle">
                    Highlight your application and get noticed by top recruiters
                    instantly with our priority matching engine.
                  </p>
                </div>

                <div className="km-features-list">
                  {[
                    {
                      icon: <FiTrendingUp />,
                      title: "Priority Ranking",
                      desc: "Your application appears at the top of the recruiter's list for every job you apply.",
                    },
                    {
                      icon: <FiCheckCircle />,
                      title: "Verified Badge",
                      desc: 'Get a distinct "Verified Premium" badge on your profile to build instant trust.',
                    },
                    {
                      icon: <FiZap />,
                      title: "AI-Enhanced Pitch",
                      desc: "Our AI crafts the perfect elevator pitch for each application based on your profile.",
                    },
                    {
                      icon: <FiSend />,
                      title: "Direct Messaging",
                      desc: "Unlock the ability to message hiring managers directly before they even see your resume.",
                    },
                    {
                      icon: <FiAward />,
                      title: "Profile Boost",
                      desc: "Get up to 4x more visibility in recruiter search results compared to standard members.",
                    },
                    {
                      icon: <FiEye />,
                      title: "Advanced Analytics",
                      desc: "See exactly who viewed your profile and which companies are interested in your skills.",
                    },
                  ].map((f, i) => (
                    <div key={i} className="km-feat-item">
                      <div className="km-feat-icon">{f.icon}</div>
                      <div className="km-feat-text">
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="km-modal-actions-fixed">
                  <button
                    className="km-btn-premium"
                    onClick={() => navigate("/pro")}
                  >
                    Upgrade to Pro Member
                  </button>
                  <button
                    className="km-btn-ghost"
                    onClick={() => setShowKnowMoreModal(false)}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>

              <div className="km-modal-right">
                <div className="km-insights-scroll">
                  <div className="km-insight-header">PERFORMANCE INSIGHTS</div>

                  <div className="km-visual-card">
                    <div className="km-user-mini">
                      <img src={user.profilePic || ""} alt="" />
                      <div>
                        <div className="km-mini-name">
                          {user.name}{" "}
                          <FiCheckCircle size={10} color="#10b981" />
                        </div>
                        <div className="km-mini-role">
                          {user.headline || "MERN Stack Developer"}
                        </div>
                      </div>
                      <span className="km-mini-tag">TOP MATCH</span>
                    </div>
                    <div className="km-visual-stats">
                      <div className="km-vstat">
                        <strong>
                          {dashboardSummary.totalApplications || 0}
                        </strong>
                        <span>Applications</span>
                      </div>
                      <div className="km-vstat">
                        <strong>{dashboardSummary.shortlisted || 0}</strong>
                        <span>Shortlisted</span>
                      </div>
                    </div>
                    <div className="km-visual-graph">
                      {(() => {
                        const total = dashboardSummary.totalApplications || 0;
                        const shortlisted = dashboardSummary.shortlisted || 0;
                        const interviews = dashboardSummary.interviews || 0;
                        const companies =
                          dashboardSummary.companiesApplied || 0;
                        const shortlistedPct =
                          total > 0 ? (shortlisted / total) * 100 : 0;
                        const interviewPct =
                          total > 0 ? (interviews / total) * 100 : 0;
                        const shortlistedOfShortlisted =
                          shortlisted > 0
                            ? (interviews / shortlisted) * 100
                            : 0;
                        return (
                          <>
                            <div className="km-graph-label">
                              <span>Applications</span>
                              <strong className="km-sc-val">
                                {total || 0}
                              </strong>
                            </div>
                            <div className="km-mt-track">
                              <div
                                className="km-mt-bar"
                                style={{
                                  width: `${Math.min(shortlistedPct * 0.5, 100)}%`,
                                }}
                              />
                              <div
                                className="km-mt-bar active"
                                style={{
                                  width: `${Math.min(shortlistedPct, 100)}%`,
                                }}
                              />
                              <div
                                className="km-mt-bar"
                                style={{
                                  width: `${Math.min(interviewPct, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="km-sc-sub">
                              {companies || 0} companies applied to
                            </p>

                            <div className="km-graph-label">
                              <span>Shortlisted</span>
                              <strong className="km-sc-val">
                                {shortlisted || 0}
                              </strong>
                            </div>
                            <div className="km-mt-track">
                              <div
                                className="km-mt-bar active"
                                style={{
                                  width: `${Math.min(shortlisted > 0 ? (shortlisted / total) * 100 : 0, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="km-sc-pct">
                              {total > 0
                                ? Math.round((shortlisted / total) * 100)
                                : 0}
                              % Success Rate
                            </span>

                            <div className="km-graph-label">
                              <span>Interviews</span>
                              <strong className="km-sc-val">
                                {interviews || 0}
                              </strong>
                            </div>
                            <div className="km-mt-track">
                              <div
                                className="km-mt-bar active"
                                style={{
                                  width: `${Math.min(shortlisted > 0 ? (interviews / shortlisted) * 100 : 0, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="km-sc-sub">
                              {interviews > 0
                                ? `${interviews} live interview${interviews > 1 ? "s" : ""} in progress`
                                : "No interviews yet - keep applying!"}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <LandingFooter />

      {showPreferencesSidebar && (
        <CareerPreferencesSidebar
          candidateProfile={candidateProfile}
          onClose={() => setShowPreferencesSidebar(false)}
          onSaved={(updated) => {
            setCandidateProfile((prev) => ({ ...prev, ...updated }));
            setShowPreferencesSidebar(false);
          }}
        />
      )}
    </div>
  );
}

function ApplicationStatusDropdown() {
  const navigate = useNavigate();
  return (
    <div className="pd-app-status-dd">
      <button
        className="pd-app-status-dd-item"
        onClick={() => navigate("/jobs")}
      >
        <FiSearch size={14} />
        <span>Search Job</span>
      </button>
      <button
        className="pd-app-status-dd-item"
        onClick={() => navigate("/info")}
      >
        <FiInfo size={14} />
        <span>Application Status</span>
      </button>
    </div>
  );
}

// ─── Number to Indian words ──────────────────────────────────────────────────
function numberToIndianWords(n) {
  if (!n || isNaN(n)) return "";
  const num = parseInt(n, 10);
  if (num === 0) return "Zero rupees";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
    "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)]+" Hundred"+(n%100 ? " "+convert(n%100) : "");
    if (n < 100000) return convert(Math.floor(n/1000))+" Thousand"+(n%1000 ? " "+convert(n%1000) : "");
    if (n < 10000000) return convert(Math.floor(n/100000))+" Lakh"+(n%100000 ? " "+convert(n%100000) : "");
    return convert(Math.floor(n/10000000))+" Crore"+(n%10000000 ? " "+convert(n%10000000) : "");
  };
  return convert(num) + " rupees";
}

const JOB_ROLE_SUGGESTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "Product Manager", "UI/UX Designer",
  "DevOps Engineer", "Cloud Architect", "Mobile Developer", "Android Developer",
  "iOS Developer", "Machine Learning Engineer", "Business Analyst", "QA Engineer",
  "Scrum Master", "Technical Lead", "Project Manager", "Marketing Manager",
  "HR Executive", "Sales Executive", "Graphic Designer", "Content Writer",
  "System Administrator", "Database Administrator", "Security Analyst", "Network Engineer",
  "Blockchain Developer", "Game Developer", "Data Engineer", "Site Reliability Engineer",
  "Product Owner", "UX Researcher", "Web Designer", "Video Editor",
  "Digital Marketing Executive", "SEO Specialist", "Social Media Manager", "Copywriter",
  "Accountant", "Financial Analyst", "Operations Manager", "Customer Support Executive",
  "Technical Writer", "Legal Advisor", "Business Development Executive", "Growth Hacker",
  "Supply Chain Manager", "Logistics Coordinator", "Sales Manager", "Recruitment Specialist",
  
  // Expanded Technical & Engineering
  "React Developer", "Angular Developer", "Vue.js Developer", "Node.js Developer",
  "Python Developer", "Java Developer", "C++ Developer", ".NET Developer", "PHP Developer",
  "Ruby on Rails Developer", "Golang Developer", "Rust Developer", "Embedded Systems Engineer",
  "Hardware Engineer", "Firmware Engineer", "Automation Engineer", "Test Automation Engineer",
  "Release Engineer", "Cloud Engineer", "AWS Solutions Architect", "Azure Cloud Engineer",
  "GCP Engineer", "IT Support Specialist", "Help Desk Technician", "Cybersecurity Analyst",
  "Penetration Tester", "Information Security Officer", "Data Architect", "AI Engineer",
  "Deep Learning Engineer", "NLP Engineer", "Computer Vision Engineer", "Robotics Engineer",
  "Systems Analyst", "Network Administrator", "Database Developer", "ETL Developer",
  
  // Expanded Design & Creative
  "Art Director", "Creative Director", "UI Designer", "UX Designer", "Interaction Designer",
  "Motion Graphics Designer", "3D Animator", "3D Modeler", "Illustrator", "Visual Designer",
  "Sound Engineer", "Video Producer", "Photographer", "Content Strategist", "Technical Illustrator",
  "Instructional Designer", "Game Designer", "Level Designer", "Sound Designer", "Concept Artist",

  // Expanded Business, Finance & Legal
  "Chief Executive Officer (CEO)", "Chief Technology Officer (CTO)", "Chief Operating Officer (COO)",
  "Chief Financial Officer (CFO)", "Chief Marketing Officer (CMO)", "VP of Engineering",
  "Director of Operations", "Business Consultant", "Management Consultant", "Strategy Consultant",
  "Investment Banker", "Venture Capital Analyst", "Private Equity Associate", "Risk Manager",
  "Compliance Officer", "Auditor", "Tax Consultant", "Corporate Lawyer", "Legal Assistant",
  "Paralegal", "Contract Administrator", "Patent Attorney", "Economist", "Actuary",

  // Expanded Marketing, Sales & Support
  "VP of Sales", "Sales Director", "Account Executive", "Account Manager", "Key Account Manager",
  "Inside Sales Representative", "Outside Sales Representative", "Pre-Sales Consultant",
  "Sales Engineer", "Customer Success Manager", "Customer Experience Manager", "Support Engineer",
  "Community Manager", "Brand Manager", "Product Marketing Manager", "Performance Marketer",
  "Email Marketing Specialist", "Affiliate Manager", "Public Relations Manager", "Event Manager",
  "Market Research Analyst", "Advertising Executive", "Media Buyer", "Content Creator",

  // Expanded HR, Admin & Operations
  "Human Resources Manager", "HR Generalist", "Talent Acquisition Specialist", "Technical Recruiter",
  "HR Business Partner", "Compensation and Benefits Manager", "Training and Development Manager",
  "Office Manager", "Executive Assistant", "Administrative Assistant", "Data Entry Operator",
  "Facilities Manager", "Procurement Manager", "Inventory Manager", "Quality Assurance Manager",
  "Quality Control Inspector", "Manufacturing Engineer", "Production Manager",

  // Expanded Healthcare, Education & Others
  "Medical Officer", "Registered Nurse", "Pharmacist", "Clinical Research Associate",
  "Healthcare Administrator", "Medical Biller", "Biomedical Engineer", "Teacher",
  "Professor", "Lecturer", "Educational Consultant", "School Administrator", "Counselor",
  "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Architect", "Interior Designer",
  "Real Estate Agent", "Property Manager", "Travel Consultant", "Hotel Manager", "Chef"
];

// ─── Career Preferences Sidebar ──────────────────────────────────────────────
export function CareerPreferencesSidebar({ candidateProfile, onClose, onSaved }) {
  const [roleInput, setRoleInput] = useState("");
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState(
    () => candidateProfile?.preferredRoles
      ? (Array.isArray(candidateProfile.preferredRoles)
          ? candidateProfile.preferredRoles
          : String(candidateProfile.preferredRoles).split(",").map(s => s.trim()).filter(Boolean))
      : []
  );

  const [salary, setSalary] = useState(
    () => candidateProfile?.expectedSalary ? String(candidateProfile.expectedSalary) : ""
  );

  const [locInput, setLocInput] = useState("");
  const [selectedLocs, setSelectedLocs] = useState(
    () => candidateProfile?.preferredLocations
      ? (Array.isArray(candidateProfile.preferredLocations)
          ? candidateProfile.preferredLocations
          : String(candidateProfile.preferredLocations).split(",").map(s => s.trim()).filter(Boolean))
      : []
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const roleInputRef = useRef(null);
  const locInputRef = useRef(null);

  // Role search
  useEffect(() => {
    const q = roleInput.trim().toLowerCase();
    if (!q) { 
      setRoleSuggestions(JOB_ROLE_SUGGESTIONS.filter(r => !selectedRoles.includes(r)));
      return; 
    }
    setRoleSuggestions(
      JOB_ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(q) && !selectedRoles.includes(r))
    );
  }, [roleInput, selectedRoles]);



  const addRole = (role) => {
    if (selectedRoles.length >= 3) return;
    setSelectedRoles(prev => [...prev, role]);
    setRoleInput("");
    setShowRoleDropdown(false);
  };
  const removeRole = (role) => setSelectedRoles(prev => prev.filter(r => r !== role));

  const addLoc = (loc) => {
    if (selectedLocs.length >= 10 || !loc) return;
    setSelectedLocs(prev => [...prev, loc]);
  };
  const removeLoc = (loc) => setSelectedLocs(prev => prev.filter(l => l !== loc));

  const handleRoleKeyDown = (e) => {
    if (e.key === "Enter" && roleInput.trim()) {
      e.preventDefault();
      addRole(roleInput.trim());
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const { default: authService } = await import("../../../../services/authService");
      await authService.updateProfile({
        preferredRoles: selectedRoles,
        expectedSalary: salary ? Number(salary) : undefined,
        preferredLocations: selectedLocs,
      });
      onSaved({
        preferredRoles: selectedRoles,
        expectedSalary: salary ? Number(salary) : undefined,
        preferredLocations: selectedLocs,
      });
    } catch (err) {
      setError(err?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const salaryWords = numberToIndianWords(salary);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9001,
          width: "min(480px, 100vw)",
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          .cpref-tag {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 7px 14px; border-radius: 999px;
            border: 1.5px solid #cbd5e1; background: #fff;
            font-size: 14px; color: #1e293b; font-weight: 500;
          }
          .cpref-tag-remove {
            background: none; border: none; cursor: pointer;
            color: #94a3b8; line-height: 1; padding: 0;
            font-size: 16px; display: flex; align-items: center;
          }
          .cpref-tag-remove:hover { color: #475569; }
          .cpref-input-wrap {
            display: flex; align-items: center;
            border: 1.5px solid #cbd5e1; border-radius: 8px;
            padding: 10px 14px; gap: 8px; transition: border-color 0.15s;
          }
          .cpref-input-wrap:focus-within { border-color: #2563eb; }
          .cpref-input-wrap input {
            flex: 1; border: none; outline: none;
            font-size: 14px; color: #1e293b; background: transparent;
          }
          .cpref-suggestions {
            position: absolute; left: 0; right: 0; top: calc(100% + 4px);
            background: #fff; border: 1.5px solid #e2e8f0;
            border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            z-index: 10; overflow-y: auto; max-height: 220px;
          }
          .cpref-sugg-item {
            width: 100%; text-align: left; padding: 10px 16px;
            background: none; border: none; cursor: pointer;
            font-size: 14px; color: #334155; transition: background 0.1s;
          }
          .cpref-sugg-item:hover { background: #f1f5f9; }
          .cpref-limit-msg {
            font-size: 12px; color: #ef4444;
            display: flex; align-items: center; gap: 5px; margin-top: 8px;
          }
          .cpref-salary-row {
            display: flex; align-items: center;
            border: 1.5px solid #cbd5e1; border-radius: 8px;
            overflow: hidden; transition: border-color 0.15s;
          }
          .cpref-salary-row:focus-within { border-color: #2563eb; }
          .cpref-salary-prefix {
            padding: 10px 14px; background: #f8fafc;
            border-right: 1.5px solid #e2e8f0;
            font-size: 15px; color: #475569; font-weight: 600;
            display: flex; align-items: center; gap: 6px; white-space: nowrap;
          }
          .cpref-salary-input {
            flex: 1; border: none; outline: none;
            font-size: 15px; color: #1e293b; padding: 10px 14px;
            background: transparent;
          }
          
          /* Overrides for LocationAutocomplete to match cpref-input-wrap */
          .cpref-loc-wrap .la-input-wrapper {
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 10px 14px !important;
            background: transparent !important;
            transition: border-color 0.15s;
          }
          .cpref-loc-wrap .la-container--focused .la-input-wrapper {
            border-color: #2563eb !important;
          }
          .cpref-loc-wrap .la-input-icon {
            position: static !important;
            color: #94a3b8 !important;
            margin-right: 8px;
          }
          .cpref-loc-wrap .la-input {
            padding: 0 !important;
            font-size: 14px !important;
            color: #1e293b !important;
            height: auto !important;
            outline: none !important;
            border: none !important;
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
              Manage your job preferences
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#64748b" }}>
              This will help us send you the best job recommendations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", padding: "4px", borderRadius: "6px",
              display: "flex", alignItems: "center",
            }}
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>

          {/* Preferred Job Role */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "10px" }}>
              Preferred job role <span style={{ fontWeight: 400, color: "#94a3b8" }}>(Max 3)</span>
            </label>
            <div style={{ position: "relative" }}>
              <div className="cpref-input-wrap">
                <FiSearch size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
                <input
                  ref={roleInputRef}
                  value={roleInput}
                  onChange={e => {
                    setRoleInput(e.target.value);
                    setShowRoleDropdown(true);
                  }}
                  onFocus={() => setShowRoleDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRoleDropdown(false), 200)}
                  onKeyDown={handleRoleKeyDown}
                  placeholder="Enter your preferred job role"
                  disabled={selectedRoles.length >= 3}
                  style={{ opacity: selectedRoles.length >= 3 ? 0.5 : 1 }}
                />
              </div>
              {showRoleDropdown && roleSuggestions.length > 0 && (
                <div className="cpref-suggestions">
                  {roleSuggestions.map(s => (
                    <button key={s} className="cpref-sugg-item" onMouseDown={() => addRole(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedRoles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {selectedRoles.map(r => (
                  <span key={r} className="cpref-tag">
                    {r}
                    <button className="cpref-tag-remove" onClick={() => removeRole(r)}>×</button>
                  </span>
                ))}
              </div>
            )}
            {selectedRoles.length >= 3 && (
              <p className="cpref-limit-msg">
                <FiInfo size={13} /> You have reached the maximum selection limit
              </p>
            )}
          </div>

          {/* Expected Annual Salary */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "10px" }}>
              Expected annual salary
            </label>
            <div className="cpref-salary-row">
              <div className="cpref-salary-prefix">
                ₹
              </div>
              <input
                className="cpref-salary-input"
                type="number"
                min="0"
                placeholder="e.g. 500000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
              />
            </div>
            {salaryWords && (
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#2563eb", fontWeight: "500", textTransform: "capitalize" }}>
                {salaryWords}
              </p>
            )}
          </div>

          {/* Preferred Work Locations */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "10px" }}>
              Preferred work locations <span style={{ fontWeight: 400, color: "#94a3b8" }}>(Max 10)</span>
            </label>
            <div className="cpref-loc-wrap" style={{ position: "relative" }}>
              <LocationAutocomplete
                value={locInput}
                onChange={(val) => setLocInput(val)}
                onSelect={(item) => {
                  if (item?.label || item?.city) {
                    addLoc(item.label || item.city);
                    setLocInput(""); // Clear the input after adding
                  }
                }}
                placeholder="Search location"
                id="cpref-location-search"
                aria-label="Location search"
              />
            </div>
            {selectedLocs.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {selectedLocs.map(l => (
                  <span key={l} className="cpref-tag">
                    {l}
                    <button className="cpref-tag-remove" onClick={() => removeLoc(l)}>×</button>
                  </span>
                ))}
              </div>
            )}
            {selectedLocs.length >= 10 && (
              <p className="cpref-limit-msg">
                <FiInfo size={13} /> You have reached the maximum selection limit
              </p>
            )}
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "16px" }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 28px",
          borderTop: "1px solid #e2e8f0",
          display: "flex", gap: "16px", alignItems: "center",
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 36px", borderRadius: "999px",
              background: saving ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none",
              fontWeight: "700", fontSize: "15px",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 20px", borderRadius: "999px",
              background: "none", color: "#475569",
              border: "none", fontWeight: "600", fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
