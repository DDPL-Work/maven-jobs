//ProfileDashboard.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import {
  buildRtcConfig as buildWebRtcConfig,
  createPeerConnection as createRtcPeerConnection,
  flushIceCandidates,
  stopMediaStream,
} from "../../../../utils/webrtc";
import {
  FiEdit2,
  FiBriefcase,
  FiMapPin,
  FiZap,
  FiCheckCircle,
  FiChevronRight,
  FiHome,
  FiFileText,
  FiMonitor,
  FiShare2,
  FiDownload,
  FiUpload,
  FiPlus,
  FiUsers,
  FiEye,
  FiTrendingUp,
  FiAward,
  FiBell,
  FiSettings,
  FiLogOut,
  FiPhone,
  FiMail,
  FiX,
  FiCalendar,
  FiClock,
  FiChevronLeft,
  FiInfo,
  FiSend,
  FiChevronDown,
  FiGlobe,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiCopy,
  FiHelpCircle,
  FiShield,
  FiLock,
  FiTrash2,
  FiSearch,
  FiLayers,
  FiBookOpen,
  FiArrowRight,
  FiMenu,
  FiMessageSquare,
  FiVideo,
  FiPaperclip,
  FiSmile,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaLinkedinIn,
  FaTwitter as FaXTwitter,
  FaFacebookF,
} from "react-icons/fa";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GiCrown } from "react-icons/gi";
import { useAuth } from "../../../../AuthContext";
import RecommendedJobs from "../jobs/RecommendedJobs";
import "./ProfileDashboard.css";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import ResumeTemplate from "../../../../components/ResumeTemplate";
import ProfileEditModal from "../../../../components/ProfileModals";
import authService from "../../../../services/authService";
import api from "../../../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDashboard,
  useCandidateNotifications,
  useCandidateChats,
  usePublishedBlogs,
} from "../../../../hooks/useCandidateQueries";
import SkeletonPage from "../../../../components/Skeleton";
import HourglassLoader from "../../../../components/HourglassLoader";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import ProfileSections from "../../../../components/profile/ProfileSections";
import CandidateSearchBar from "../../../../components/candidate/CandidateSearchBar";
import GlobalSearchForm from "../../../../components/common/GlobalSearchForm";
import EarlyAccessModal from "../../../../components/EarlyAccessModal";
import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader";
import FAQModal, { FaqAccordionItem as FaqItem } from "./Components/ProfileDashboard/FAQModal";
import SettingsModal from "./Components/ProfileDashboard/SettingsModal";

const getCandidateSocketUrl = () =>
  (
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/api\/v\d+$/, "");

const PROFILE_COMPLETION_MODAL_THRESHOLD = 75;

const getInitials = (name = "Company") =>
  String(name || "Company")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "C";

const getCompanyNameFromThread = (thread = {}) => {
  if (thread.companyName) return thread.companyName;
  const jobTitle = thread.jobTitle || "";
  if (jobTitle.includes(" - ")) return jobTitle.split(" - ")[0].trim();
  return "Company";
};

const normalizeCandidateThread = (thread = {}, index = 0) => {
  const companyName = getCompanyNameFromThread(thread);
  const role = thread.jobTitle?.includes(" - ")
    ? thread.jobTitle.split(" - ").slice(1).join(" - ").trim()
    : thread.jobTitle || "Recruiter conversation";

  return {
    ...thread,
    id: String(thread.id || thread._id || `thread-${index}`),
    companyName,
    avatar: getInitials(companyName),
    role,
    preview: thread.lastMessageText || "No messages yet",
    time: thread.time || "Just now",
    unread:
      Number(thread.unreadCount || 0) > 0 ||
      thread.lastSenderRole === "COMPANY",
    messages: Array.isArray(thread.messages) ? thread.messages : [],
    activeCall: thread.activeCall || {
      state: "IDLE",
      mediaType: "AUDIO",
      initiatedBy: "SYSTEM",
    },
  };
};


export default function ProfileDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user?.name || "");
  const [coverImage, setCoverImage] = useState(user?.coverPic || "");
  const profileCompletion = Number(user?.profileCompletion || 0);


  const getCompletionModalSeenDate = () =>
    localStorage.getItem("profile_completion_modal_date");
  const setCompletionModalSeenToday = () =>
    localStorage.setItem(
      "profile_completion_modal_date",
      new Date().toDateString(),
    );
  const wasCompletionModalSeenToday = () =>
    getCompletionModalSeenDate() === new Date().toDateString();

  const [showCompletionModal, setShowCompletionModal] = useState(
    Boolean(user) &&
      profileCompletion < PROFILE_COMPLETION_MODAL_THRESHOLD &&
      !wasCompletionModalSeenToday(),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const pfpInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [skills, setSkills] = useState(user?.skills || []);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newSkillValue, setNewSkillValue] = useState("");
  const [activeTip, setActiveTip] = useState(null); // 'experience', 'summary', 'skills'
  const [activeEditSection, setActiveEditSection] = useState(null);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [workStatus, setWorkStatus] = useState("Open to Work");
  const [showWorkStatusModal, setShowWorkStatusModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuickAnswer, setShowQuickAnswer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);
  const { updateProfile } = useAuth();

  useEffect(() => {
    const currentCompletion = Number(user?.profileCompletion || 0);
    if (!user || currentCompletion >= PROFILE_COMPLETION_MODAL_THRESHOLD) {
      setShowCompletionModal(false);
    } else if (wasCompletionModalSeenToday()) {
      setShowCompletionModal(false);
    }
  }, [user, user?.profileCompletion]);

  const handleInlineSave = async (formData) => {
    try {
      const result = await updateProfile(formData);
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      }
      return result;
    } catch (err) {
      console.error("Inline save failed:", err);
      return { success: false, error: err };
    }
  };

  const handleSaveProfile = async (formData) => {
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        const savedProfile = result.profile || formData;
        setCandidateProfile((prev) => ({ ...(prev || {}), ...savedProfile }));
        setActiveEditSection(null);
        if (savedProfile.skills || formData.skills)
          setSkills(savedProfile.skills || formData.skills);
        queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be under 10MB");
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
      "text/rtf",
    ];
    if (!allowed.includes(file.type)) {
      alert("Please upload a doc, docx, rtf, or pdf file");
      return;
    }
    setIsUploadingResume(true);
    try {
      const result = await authService.uploadResume(file);
      if (result.success || result.resume) {
        const updated = result.resume || result.data?.resume;
        if (updated && updateUser) {
          updateUser({ ...user, resume: updated });
        }
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setIsUploadingResume(false);
    }
  };
  const resumeRef = useRef(null);

  // Production ready unique profile link generation (backend-backed)
  const [publicShareId, setPublicShareId] = useState(
    user?.publicShareId ||
      user?.profile?.publicShareId ||
      user?.user?.publicShareId ||
      "",
  );

  useEffect(() => {
    const nextId =
      user?.publicShareId ||
      user?.profile?.publicShareId ||
      user?.user?.publicShareId ||
      "";
    setPublicShareId(nextId);
  }, [user]);

  const shareUrl = publicShareId
    ? `${window.location.origin}/mj/${String(publicShareId).trim()}`
    : window.location.href;

  const handleShareProfile = useCallback(async () => {
    const url = publicShareId
      ? `${window.location.origin}/mj/${String(publicShareId).trim()}`
      : window.location.href;
    const name = user?.name || "My profile";
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Check out ${name} on MavenJobs`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToastNotification({ color: "#10b981", icon: <FiCheckCircle />, title: "Profile link copied!", desc: "Your unique MavenJobs profile link is on the clipboard." });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setToastNotification({ color: "#10b981", icon: <FiCheckCircle />, title: "Profile link copied!", desc: "Your unique MavenJobs profile link is on the clipboard." });
      } catch {
        window.prompt("Copy this link to share your profile", url);
      }
    }
  }, [publicShareId, user?.name]);

  const [recommendedJobs, setRecommendedJobs] = useState({});
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({});

  const handleToggleEditProfile = () => {
    if (isEditingProfile) {
      setIsEditingProfile(false);
      return;
    }
    setEditProfileForm({
      name: user?.name || "",
      headline: user?.headline || "",
      currentCompany: user?.currentCompany || "",
      currentCity: user?.currentCity || "",
      phone: user?.phone || "",
      totalExperience: user?.totalExperience || "",
      expectedSalary: user?.expectedSalary || "",
      noticePeriod: user?.noticePeriod || "",
    });
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
  };

  const handleEditFieldChange = (field, value) => {
    setEditProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfileFields = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(editProfileForm);
      if (result?.success) {
        setIsEditingProfile(false);
        queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      }
    } catch (err) {
      console.error("Profile field save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const [recentApplications, setRecentApplications] = useState([]);
  const [showApplyMatchModal, setShowApplyMatchModal] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalApplications: 0,
    shortlisted: 0,
    interviews: 0,
    companiesApplied: 0,
    profileViews: 0,
    recruiterActions: 0,
    jobMatches: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [candidateThreads, setCandidateThreads] = useState([]);
  const [showCandidateChat, setShowCandidateChat] = useState(false);
  const [activeCandidateConv, setActiveCandidateConv] = useState(0);
  const [candidateMsgInput, setCandidateMsgInput] = useState("");
  const [candidateCallModal, setCandidateCallModal] = useState(false);
  const [candidateCallMode, setCandidateCallMode] = useState("AUDIO");
  const [candidateCallStatus, setCandidateCallStatus] = useState("idle");
  const [candidateCallStream, setCandidateCallStream] = useState(null);
  // Disable call features: chat-only production mode
  const CALLS_ENABLED = false;
  const [candidateRemoteCallStream, setCandidateRemoteCallStream] =
    useState(null);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const candidateSocketRef = useRef(null);
  const candidateThreadsRef = useRef([]);
  const candidateChatEndRef = useRef(null);
  const candidateCallPreviewRef = useRef(null);
  const candidateRemoteVideoRef = useRef(null);
  const candidatePeerConnectionRef = useRef(null);
  const candidateLocalCallStreamRef = useRef(null);
  const candidatePendingIceCandidatesRef = useRef([]);
  const activeCandidateThreadIdRef = useRef("");
  const candidateRtcConfig = useMemo(() => buildWebRtcConfig(), []);

  const queryClient = useQueryClient();
  const dashboardQuery = useDashboard(!!user);
  const { data: dashboardData } = dashboardQuery;

  useEffect(() => {
    if (!dashboardData) return;

    const colors = [
      { bg: "#EEF2FF", col: "#4338CA" },
      { bg: "#FFF7ED", col: "#C2410C" },
      { bg: "#F0FDF4", col: "#15803D" },
      { bg: "#EFF6FF", col: "#1D4ED8" },
      { bg: "#FDF2F8", col: "#9D174D" },
      { bg: "#FEF3C7", col: "#92400E" },
      { bg: "#E0E7FF", col: "#3730A3" },
    ];

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
      rating: (4.0 + Math.random() * 0.9).toFixed(1),
      code: job.title.substring(0, 2).toUpperCase(),
      bg: colors[idx % colors.length].bg,
      col: colors[idx % colors.length].col,
      logos: ["A", "N", "B", "I", "X"]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5),
      tags: buildTags(job),
      salaryFormatted: formatSalary(job.salaryMin, job.salaryMax),
    });

    if (dashboardData.recommendedJobs) {
      const mappedJobs = {};
      Object.keys(dashboardData.recommendedJobs).forEach((key) => {
        mappedJobs[key] = dashboardData.recommendedJobs[key].map(formatJobData);
      });

      setRecommendedJobs(mappedJobs);
    }

    if (dashboardData.summary) setDashboardSummary(dashboardData.summary);
    if (dashboardData.profile) setCandidateProfile(dashboardData.profile);
    if (dashboardData.recentApplications)
      setRecentApplications(dashboardData.recentApplications);
    setPageLoading(false);
  }, [dashboardData]);

  const { data: notificationsData } = useCandidateNotifications(!!user);
  const { data: chatsData } = useCandidateChats(!!user);

  useEffect(() => {
    if (notificationsData) setNotifications(notificationsData);
  }, [notificationsData]);

  useEffect(() => {
    if (chatsData) setCandidateThreads(chatsData.map(normalizeCandidateThread));
  }, [chatsData]);

  const FALLBACK_NOTIFICATIONS = [
    {
      id: "fb-profile",
      icon: <FiEye />,
      color: "#059669",
      bg: "#ECFDF5",
      title: "Your profile is ready for recruiter discovery",
      desc: "Keep your skills and resume updated",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-jobs",
      icon: <FiBriefcase />,
      color: "#2563EB",
      bg: "#EFF6FF",
      title: "Applications are being tracked",
      desc: "Review your recent application activity",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-skills",
      icon: <FiAward />,
      color: "#7C3AED",
      bg: "#F5F3FF",
      title: "AI suggests updating your skills section",
      desc: "Add trending skills to improve discoverability",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-resume",
      icon: <FiFileText />,
      color: "#D97706",
      bg: "#FFFBEB",
      title: "Resume optimization available",
      desc: "Improve your resume with AI suggestions",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-quiz",
      icon: <FiZap />,
      color: "#7C3AED",
      bg: "#F5F3FF",
      title: "Daily quiz is ready for you",
      desc: "Answer 5 questions to earn XP",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-network",
      icon: <FiUsers />,
      color: "#2563EB",
      bg: "#EFF6FF",
      title: "Companies are viewing your profile",
      desc: "Your visibility score is high this week",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-interview",
      icon: <FiCheckCircle />,
      color: "#059669",
      bg: "#ECFDF5",
      title: "Interview tips available",
      desc: "Practice common questions for your industry",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-apply",
      icon: <FiClock />,
      color: "#D97706",
      bg: "#FFFBEB",
      title: "Don't miss out on new opportunities",
      desc: "New jobs matching your profile",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-growth",
      icon: <FiTrendingUp />,
      color: "#002366",
      bg: "#EEF2FF",
      title: "Your career growth summary",
      desc: "Track applications, views, and interviews",
      time: "Today",
      unread: false,
    },
    {
      id: "fb-alert",
      icon: <FiBell />,
      color: "#DC2626",
      bg: "#FEF2F2",
      title: "Application deadline approaching",
      desc: "Complete your applications on time",
      time: "Today",
      unread: false,
    },
  ];




  useEffect(() => {
    if (!user || !FALLBACK_NOTIFICATIONS.length) return;
    setToastNotification(FALLBACK_NOTIFICATIONS[0]);
    const timer = setTimeout(() => setToastNotification(null), 5000);
    return () => {
      clearTimeout(timer);
      setToastNotification(null);
    };
  }, []);

  const activeCandidateThread =
    candidateThreads[activeCandidateConv] || candidateThreads[0] || null;

  useEffect(() => {
    candidateThreadsRef.current = candidateThreads;
  }, [candidateThreads]);

  useEffect(() => {
    activeCandidateThreadIdRef.current = activeCandidateThread?.id || "";
  }, [activeCandidateThread?.id]);

  const { data: blogsData } = usePublishedBlogs();

  useEffect(() => {
    if (blogsData?.blogs) setLatestBlogs(blogsData.blogs);
  }, [blogsData]);

  useEffect(() => {
    if (!showCandidateChat) return;
    setTimeout(
      () => candidateChatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
  }, [
    showCandidateChat,
    activeCandidateConv,
    activeCandidateThread?.messages?.length,
  ]);

  useEffect(() => {
    if (!user) return;
    const token =
      localStorage.getItem("candidateToken") || localStorage.getItem("token");
    if (!token || candidateSocketRef.current) return;

    const socket = io(getCandidateSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      candidateThreadsRef.current.forEach((thread) => {
        if (thread.id) socket.emit("thread:join", { threadId: thread.id });
      });
      if (activeCandidateThreadIdRef.current) {
        socket.emit("thread:join", {
          threadId: activeCandidateThreadIdRef.current,
        });
      }
    });

    socket.on("chat:message", ({ threadId, message, thread }) => {
      setCandidateThreads((current) =>
        current.map((conversation, index) => {
          if (String(conversation.id) !== String(threadId)) return conversation;

          const nextMessages = Array.isArray(conversation.messages)
            ? [...conversation.messages]
            : [];
          const isFromMe = message.senderRole === "CANDIDATE";
          if (isFromMe) {
            const lastMsg = nextMessages[nextMessages.length - 1];
            if (
              lastMsg &&
              lastMsg.from === "me" &&
              lastMsg.text === message.text &&
              lastMsg.time === "Just now"
            ) {
              nextMessages[nextMessages.length - 1] = {
                from: "me",
                text: message.text || "",
                time: message.lastUpdated || "Just now",
              };
              return normalizeCandidateThread(
                {
                  ...conversation,
                  ...thread,
                  messages: nextMessages,
                  lastMessageText: message.text || conversation.preview,
                  unreadCount: 0,
                },
                index,
              );
            }
          }

          const nextMessage = {
            from: isFromMe ? "me" : "them",
            text: message.text || "",
            time: message.lastUpdated || "Just now",
          };

          return normalizeCandidateThread(
            {
              ...conversation,
              ...thread,
              messages: [...nextMessages, nextMessage],
              lastMessageText: message.text || conversation.preview,
              unreadCount: !isFromMe ? 1 : 0,
            },
            index,
          );
        }),
      );
    });

    // Call features are disabled in chat-only production mode; skipping call handlers

    candidateSocketRef.current = socket;

    return () => {
      socket.disconnect();
      candidateSocketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (
      !showCandidateChat ||
      !activeCandidateThread?.id ||
      !candidateSocketRef.current?.connected
    )
      return;
    candidateSocketRef.current.emit("thread:join", {
      threadId: activeCandidateThread.id,
    });
  }, [activeCandidateThread?.id, showCandidateChat]);

  useEffect(() => {
    if (!candidateSocketRef.current?.connected) return;
    candidateThreads.forEach((thread) => {
      if (thread.id)
        candidateSocketRef.current.emit("thread:join", { threadId: thread.id });
    });
  }, [candidateThreads]);

  useEffect(() => {
    if (!showCandidateChat || !activeCandidateThread?.id) return;

    const loadMessages = async () => {
      try {
        const response = await authService.getCandidateChatMessages(
          activeCandidateThread.id,
        );
        const threadMessages = response?.data?.messages || [];
        setCandidateThreads((current) =>
          current.map((thread, index) => {
            if (String(thread.id) !== String(activeCandidateThread.id))
              return thread;

            return normalizeCandidateThread(
              {
                ...thread,
                ...response?.data?.thread,
                messages: threadMessages.map((message) => ({
                  from: message.senderRole === "CANDIDATE" ? "me" : "them",
                  text: message.text || "",
                  time: message.lastUpdated || "Just now",
                })),
                unreadCount: 0,
              },
              index,
            );
          }),
        );
        await authService.markCandidateChatRead(activeCandidateThread.id);
      } catch (error) {
        console.error("Failed to load candidate chat messages", error);
      }
    };

    loadMessages();
  }, [activeCandidateThread?.id, showCandidateChat]);

  useEffect(() => {
    if (candidateCallPreviewRef.current && candidateCallStream) {
      candidateCallPreviewRef.current.srcObject = candidateCallStream;
    }

    return () => {
      if (candidateCallPreviewRef.current) {
        candidateCallPreviewRef.current.srcObject = null;
      }
    };
  }, [candidateCallStream, candidateCallModal]);

  useEffect(() => {
    if (candidateRemoteVideoRef.current && candidateRemoteCallStream) {
      candidateRemoteVideoRef.current.srcObject = candidateRemoteCallStream;
    }
  }, [candidateRemoteCallStream, candidateCallModal]);

  const openCandidateChat = async (threadId = "") => {
    if (!candidateThreads.length) {
      try {
        const response = await authService.getCandidateChats();
        const threads = (response?.data?.threads || []).map(
          normalizeCandidateThread,
        );
        setCandidateThreads(threads);
        const index = threads.findIndex(
          (thread) => String(thread.id) === String(threadId),
        );
        setActiveCandidateConv(index >= 0 ? index : 0);
      } catch (error) {
        console.error("Unable to open chat", error);
      }
    } else {
      const index = candidateThreads.findIndex(
        (thread) => String(thread.id) === String(threadId),
      );
      setActiveCandidateConv(index >= 0 ? index : 0);
    }

    setShowNotifications(false);
    setShowCandidateChat(true);
  };

  const handleNotificationClick = async (notification) => {
    if (notification.id && !String(notification.id).startsWith("thread-")) {
      authService
        .markCandidateNotificationRead(notification.id)
        .catch(() => {});
      setNotifications((current) =>
        current.map((item) =>
          String(item.id) === String(notification.id)
            ? { ...item, status: "READ" }
            : item,
        ),
      );
    }

    if (notification.category === "CHAT" || notification.metadata?.threadId) {
      openCandidateChat(notification.metadata?.threadId || "");
      return;
    }

    if (notification.actionUrl) {
      setShowNotifications(false);
      navigate(notification.actionUrl);
    }
  };

  const sendCandidateMessage = async () => {
    if (!candidateMsgInput.trim() || !activeCandidateThread?.id) return;
    const outgoing = candidateMsgInput.trim();
    setCandidateMsgInput("");

    setCandidateThreads((current) =>
      current.map((thread, index) =>
        index === activeCandidateConv
          ? normalizeCandidateThread(
              {
                ...thread,
                lastMessageText: outgoing,
                messages: [
                  ...(thread.messages || []),
                  { from: "me", text: outgoing, time: "Just now" },
                ],
                unreadCount: 0,
              },
              index,
            )
          : thread,
      ),
    );
    setTimeout(
      () => candidateChatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      60,
    );

    try {
      await authService.sendCandidateChatMessage(activeCandidateThread.id, {
        text: outgoing,
      });
    } catch (error) {
      // ignore or implement retry
    }
  };

  const startCandidateCall = async (mode) => {
    if (!CALLS_ENABLED) {
      alert("Calls are disabled. Chat-only mode is active.");
      return;
    }
    if (!activeCandidateThread?.id) return;
    const callType =
      String(mode || "AUDIO").toUpperCase() === "VIDEO" ? "VIDEO" : "AUDIO";
    setCandidateCallMode(callType);
    setCandidateCallStatus("connecting");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Media devices are not available in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "VIDEO",
      });
      setCandidateCallStream(stream);
      candidateLocalCallStreamRef.current = stream;
      setCandidateCallModal(true);

      const socket = candidateSocketRef.current;
      if (socket?.connected) {
        socket.emit(
          "call:join",
          { threadId: activeCandidateThread.id, mediaType: callType },
          (ack) => {
            setCandidateCallStatus(ack?.ok ? "ringing" : "failed");
          },
        );
      } else {
        setCandidateCallStatus("waiting");
      }
    } catch (error) {
      setCandidateCallStatus("failed");
      setCandidateCallModal(false);
      alert(error?.message || "Unable to start the call");
    }
  };

  const acceptCandidateCall = async () => {
    if (!CALLS_ENABLED) {
      alert("Calls are disabled. Chat-only mode is active.");
      return;
    }
    const callType =
      activeCandidateThread?.activeCall?.mediaType ||
      candidateCallMode ||
      "AUDIO";
    setCandidateCallMode(callType);
    setCandidateCallStatus("connecting");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Media devices are not available in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "VIDEO",
      });
      setCandidateCallStream(stream);
      candidateLocalCallStreamRef.current = stream;
      setCandidateCallModal(true);
      candidateSocketRef.current?.emit(
        "call:answer",
        { threadId: activeCandidateThread.id, answer: { accepted: true } },
        () => {
          setCandidateCallStatus("in-call");
        },
      );
    } catch (error) {
      alert(error?.message || "Unable to accept the call");
    }
  };

  const stopCandidateCall = (emitEnd = true) => {
    if (
      emitEnd &&
      candidateSocketRef.current?.connected &&
      activeCandidateThread?.id
    ) {
      candidateSocketRef.current.emit("call:end", {
        threadId: activeCandidateThread.id,
      });
    }

    if (candidatePeerConnectionRef.current) {
      candidatePeerConnectionRef.current.close();
      candidatePeerConnectionRef.current = null;
    }

    if (candidateCallStream) {
      candidateCallStream.getTracks().forEach((track) => track.stop());
    }

    candidatePendingIceCandidatesRef.current = [];
    setCandidateRemoteCallStream(null);
    setCandidateCallStream(null);
    setCandidateCallModal(false);
    setCandidateCallStatus("idle");
    setIsCallConnected(false);
  };

  if (!user) return <Navigate to="/" />;
  if (pageLoading) return <HourglassLoader />;

  const handleNameSave = () => {
    updateUser({ name: editNameValue });
    setIsEditingName(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleNameSave();
    if (e.key === "Escape") setIsEditingName(false);
  };

  const handlePfpChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "profile");

    try {
      const res = await authService.uploadImage(formData);
      updateUser({
        profilePic: res.data.url,
        profileCompletion: res.profileCompletion,
      });
    } catch (err) {
      console.error("PFP Upload failed:", err);
    } finally {
      setIsLoading(false);
    }
    e.target.value = "";
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "cover");

    try {
      const res = await authService.uploadImage(formData);
      setCoverImage(res.data.url);
      updateUser({
        coverPic: res.data.url,
        profileCompletion: res.profileCompletion,
      });
    } catch (err) {
      console.error("Cover Upload failed:", err);
    } finally {
      setIsLoading(false);
    }
    e.target.value = "";
  };

  const addSkill = () => {
    const s = newSkillValue.trim();
    if (s && !skills.includes(s)) {
      const updatedSkills = [...skills, s];
      setSkills(updatedSkills);
      setNewSkillValue("");
      setIsAddingSkill(false);
      updateProfile({ skills: updatedSkills });
    }
  };

  const removeSkill = (s) => {
    const updatedSkills = skills.filter((item) => item !== s);
    setSkills(updatedSkills);
    updateProfile({ skills: updatedSkills });
  };

  return (
    <div className="pd-root">
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <ResumeTemplate ref={resumeRef} user={user} />
      </div>
      <input
        ref={pfpInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePfpChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleCoverChange}
      />

      {/*  Navbar  */}
      <CandidateHeader />

      {/*  Notification Toast  */}
      {toastNotification && (
        <div className="pd-toast">
          <div
            className="pd-toast-icon"
            style={{ color: toastNotification.color || "#2563EB" }}
          >
            {toastNotification.icon || <FiBell />}
          </div>
          <div className="pd-toast-body">
            <span className="pd-toast-title">
              {toastNotification.title || "Notification"}
            </span>
            <span className="pd-toast-desc">{toastNotification.desc}</span>
          </div>
          <button
            className="pd-toast-close"
            onClick={() => setToastNotification(null)}
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/*  Cover  */}
      <div
        className="pd-cover"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="pd-cover-overlay" />
        <button
          className="pd-cover-edit"
          onClick={() => coverInputRef.current.click()}
        >
          <FiEdit2 size={13} /> Change Cover
        </button>
      </div>

      {/*  Identity Bar  */}
      <div className="pd-identity-bar">
        <div className="pd-identity-inner">
          <div className="pd-avatar-wrap">
            <img
              src={
                user.profilePic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Profile"
              className="pd-big-avatar"
            />
            <button
              className="pd-avatar-edit"
              onClick={() => pfpInputRef.current.click()}
            >
              <FiEdit2 size={11} />
            </button>
            <div className="pd-avatar-online" />
          </div>

          <div className="pd-identity-info">
            <div className="pd-name-row">
              {isEditingName ? (
                <div className="pd-name-edit-row">
                  <input
                    className="pd-name-input"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <button className="pd-save-btn" onClick={handleNameSave}>
                    Save
                  </button>
                  <button
                    className="pd-cancel-btn"
                    onClick={() => setIsEditingName(false)}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <h1 className="pd-name">
                  {user.membership?.active &&
                    user.membership?.plan !== "FREE" && (
                      <span
                        className={`pd-membership-badge ${user.membership.plan === "ELITE" ? "elite" : "pro"}`}
                      >
                        <FiAward size={14} />
                        {user.membership.plan}
                      </span>
                    )}
                  {user.name}
                  <span className="pd-verified">
                    <FiCheckCircle size={16} />
                  </span>
                  <button
                    className="pd-edit-icon-btn"
                    onClick={() => {
                      setEditNameValue(user.name);
                      setIsEditingName(true);
                    }}
                  >
                    <FiEdit2 size={13} />
                  </button>
                </h1>
              )}
              <span
                className={`pd-open-badge ${workStatus === "Working" ? "working" : ""}`}
                onClick={() => setShowWorkStatusModal(true)}
              >
                <span className="pd-status-dot" /> {workStatus}
              </span>
            </div>

            <p className="pd-headline">
              {user.headline || "Update your headline"}
            </p>
            <p className="pd-location">
              <FiMapPin size={12} />{" "}
              {user.currentCity || "Update your location"}
            </p>

            <div className="pd-quick-stats">
              <div className="pd-qs-item">
                <FiEye size={15} />
                <div>
                  <strong>{dashboardSummary.profileViews || 0}</strong>
                  <span>Profile views</span>
                </div>
              </div>
              <div className="pd-qs-divider" />
              <div className="pd-qs-item">
                <FiUsers size={15} />
                <div>
                  <strong>{dashboardSummary.recruiterActions || 0}</strong>
                  <span>Recruiter actions</span>
                </div>
              </div>
              <div className="pd-qs-divider" />
              <div className="pd-qs-item">
                <FiTrendingUp size={15} />
                <div>
                  <strong>{dashboardSummary.jobMatches || 0}</strong>
                  <span>Job matches</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pd-identity-cta">
            <button
              className="pd-btn-black"
              onClick={async () => {
                if (!user?.resume?.url) {
                  alert("No resume uploaded yet.");
                  return;
                }
                
                try {
                  const res = await api.get("/candidate/profile/resume", { responseType: "blob" });
                  const pdfBlob = new Blob([res.data], { type: "application/pdf" });
                  const blobUrl = URL.createObjectURL(pdfBlob);
                  window.open(blobUrl, "_blank", "noopener,noreferrer");
                } catch (err) {
                  console.error("Failed to load resume securely", err);
                  window.open(user.resume.url, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <FiFileText size={14} /> View Resume
            </button>
            <div className="flex gap-2">
              <button className="pd-btn-black flex-1" onClick={handleShareProfile}>
                <FiShare2 size={14} /> Share
              </button>
              <button
                className="pd-btn-black flex-1"
                onClick={() => navigate("/resume-builder")}
              >
                <FiFileText size={14} /> Resume
              </button>
            </div>
            <button className="pd-btn-black" onClick={() => navigate("/info")}>
              <FiInfo size={14} /> Application Status
            </button>
          </div>
        </div>
      </div>

      {/*  Main Layout  */}
      <div className="pd-main">
        {/* Left Sidebar */}
        <aside className="pd-left">
          <div className="pd-card pd-completion-card">
            <div className="pd-completion-top">
              <div>
                <div className="pd-completion-label">Profile Strength</div>
                <div className="pd-completion-pct">
                  {user.profileCompletion || 0}% Complete
                </div>
              </div>
              <div className="pd-completion-ring">
                <svg viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    style={{
                      strokeDashoffset: `calc(113 - (113 * ${user.profileCompletion || 0}) / 100)`,
                    }}
                  />
                </svg>
                <span>{user.profileCompletion || 0}</span>
              </div>
            </div>
            <div className="pd-completion-bar-track">
              <div
                className="pd-completion-bar"
                style={{ width: `${user.profileCompletion || 0}%` }}
              />
            </div>
            <div className="pd-completion-tips">
              {[
                { id: "experience", label: "Add work experience" },
                { id: "summary", label: "Add a profile summary" },
                { id: "skills", label: "Add your skills" },
              ].map((tip) => (
                <div
                  className="pd-tip-item"
                  key={tip.id}
                  onClick={() => {
                    setActiveTip(tip.id);
                    setShowPreview(true);
                    setActiveEditSection(
                      tip.id === "experience"
                        ? "Employment"
                        : tip.id === "summary"
                          ? "Profile summary"
                          : "Key skills",
                    );
                  }}
                >
                  <FiPlus size={13} />
                  <span>{tip.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pd-card pd-sidenav-card">
            <Link to="#" className="pd-sidenav-item active">
              <FiHome size={17} />
              <span>My Home</span>
            </Link>
            <button
              className="pd-sidenav-item"
              onClick={() => setShowJobsModal(true)}
            >
              <FiBriefcase size={17} />
              <span>Jobs</span>
            </button>
            <Link to="/companies" className="pd-sidenav-item">
              <FiMonitor size={17} />
              <span>Companies</span>
            </Link>
            <Link
              to="/blogs"
              state={{ from: "/profile-dashboard" }}
              className="pd-sidenav-item"
            >
              <FiFileText size={17} />
              <span>Blogs</span>
            </Link>
            <button
              className="pd-sidenav-item"
              onClick={() => setShowFAQModal(true)}
            >
              <FiHelpCircle size={17} />
              <span>FAQ</span>
            </button>
            <button
              className="pd-sidenav-item"
              onClick={() => setShowSettingsModal(true)}
            >
              <FiSettings size={17} />
              <span>Settings</span>
            </button>
          </div>

          <div className="pd-card pd-perf-card">
            <div className="pd-perf-title">
              Performance <FiTrendingUp size={15} />
            </div>
            <div className="pd-perf-grid">
              <div className="pd-perf-stat">
                <span className="pd-perf-val">
                  {dashboardSummary.profileViews || 0}
                </span>
                <span className="pd-perf-label">Profile views</span>
              </div>
              <div className="pd-perf-stat">
                <span className="pd-perf-val">
                  {dashboardSummary.recruiterActions || 0}
                </span>
                <span className="pd-perf-label">Recruiter actions</span>
              </div>
              <div className="pd-perf-stat">
                <span className="pd-perf-val">
                  {dashboardSummary.jobMatches || 0}
                </span>
                <span className="pd-perf-label">Job matches</span>
              </div>
            </div>
            <div className="pd-boost-banner" onClick={() => navigate('/pro')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/pro'); }} role="button" tabIndex={0}>
              <FiZap size={14} />
              <span>Get 3x profile boost</span>
              <FiChevronRight size={13} className="pd-boost-arrow" />
            </div>
          </div>
        </aside>

        {/* Center Feed */}
        <section className="pd-center">
          <ProfileSections
            user={user}
            onEdit={(section) => {
              setActiveEditSection(section);
              setShowPreview(true);
            }}
            onSave={handleInlineSave}
          />
        </section>

        {/* Right Sidebar */}
        <aside className="pd-right">
          <div className="pd-card pd-app-card">
            <div className="pd-qr-box">
              <img
                src={mavenLogo}
                alt="QR"
                style={{ width: 32, opacity: 0.4 }}
              />
            </div>
            <p className="pd-app-stat">
              <strong>3,587</strong> downloads in last 30 mins
            </p>
            <p className="pd-app-sub">Scan to download the app</p>
            <div className="pd-app-badges">
              <span className="pd-badge-pill">App Store</span>
              <span className="pd-badge-pill">Play Store</span>
            </div>
          </div>
          <Link
            to="/leave"
            style={{
              textDecoration: "none",
              display: "block",
              marginBottom: "20px",
            }}
          >
            <div
              className="pd-card"
              style={{
                padding: 0,
                overflow: "hidden",
                margin: 0,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0,30,80,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 12px rgba(0,30,80,0.04)";
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=400&h=200"
                alt="Leave Application"
                style={{
                  width: "100%",
                  height: "130px",
                  objectFit: "cover",
                  display: "block",
                  borderBottom: "1px solid #E2E8F0",
                }}
              />
              <div style={{ padding: "18px 20px 22px" }}>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#0F172A",
                    marginBottom: "8px",
                    lineHeight: 1.35,
                    letterSpacing: "-0.01em",
                  }}
                >
                  One-Day Leave Application Samples & Templates
                </h4>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "#64748B",
                    lineHeight: 1.55,
                    marginBottom: "16px",
                  }}
                >
                  Worried about asking for a day off? Learn how to write a
                  one-day leave application t...
                </p>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#2563EB",
                    textDecoration: "none",
                  }}
                >
                  Know more
                </div>
              </div>
            </div>
          </Link>

          <div className="pd-card pd-skills-card">
            <div className="pd-section-header">
              <h4>Top Skills</h4>
              <button
                className="pd-icon-btn"
                onClick={() => setIsAddingSkill(!isAddingSkill)}
              >
                {isAddingSkill ? <FiX size={15} /> : <FiPlus size={15} />}
              </button>
            </div>
            {isAddingSkill && (
              <div className="pd-skill-add-row">
                <input
                  type="text"
                  placeholder="Type skill..."
                  value={newSkillValue}
                  onChange={(e) => setNewSkillValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  autoFocus
                />
                <button onClick={addSkill}>
                  <FiCheckCircle size={14} />
                </button>
              </div>
            )}
            <div className="pd-skills-wrap">
              {skills.map((s) => (
                <span className="pd-skill-pill" key={s}>
                  {s}
                  <button
                    className="pd-skill-remove"
                    onClick={() => removeSkill(s)}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              ))}
              {skills.length === 0 && !isAddingSkill && (
                <p className="pd-no-skills">No skills added yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/*  Profile Preview Modal  */}
      {showPreview && (
        <div className="ppm-overlay" onClick={() => setShowPreview(false)}>
          <div className="ppm-content" onClick={(e) => e.stopPropagation()}>
            <button className="ppm-close" onClick={() => setShowPreview(false)}>
              <FiX size={22} />
            </button>
            <div className="ppm-body">
              <div className="ppm-card ppm-header-card">
                <div className="ppm-edit-header-btn">
                  {isEditingProfile ? (
                    <div className="ppm-edit-actions">
                      <button
                        className="ppm-save-btn"
                        onClick={handleSaveProfileFields}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="ppm-cancel-btn"
                        onClick={handleCancelEditProfile}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="ppm-edit-btn"
                      onClick={handleToggleEditProfile}
                      title="Edit profile fields"
                    >
                      <FiEdit2 size={16} />
                    </button>
                  )}
                </div>
                <div className="ppm-header-row">
                  <div className="ppm-avatar-wrap">
                    <img
                      src={
                        user.profilePic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt="Profile"
                    />
                    <div className="ppm-score">
                      {user.profileCompletion || 0}%
                    </div>
                  </div>
                  <div className="ppm-header-info">
                    {isEditingProfile ? (
                      <>
                        <input
                          className="ppm-edit-input ppm-edit-name"
                          value={editProfileForm.name}
                          onChange={(e) =>
                            handleEditFieldChange("name", e.target.value)
                          }
                          placeholder="Full Name"
                        />
                        <input
                          className="ppm-edit-input"
                          value={editProfileForm.headline}
                          onChange={(e) =>
                            handleEditFieldChange("headline", e.target.value)
                          }
                          placeholder="Professional headline (e.g. MERN Stack Developer)"
                        />
                        <input
                          className="ppm-edit-input"
                          value={editProfileForm.currentCompany}
                          onChange={(e) =>
                            handleEditFieldChange(
                              "currentCompany",
                              e.target.value,
                            )
                          }
                          placeholder="Current company"
                        />
                      </>
                    ) : (
                      <>
                        <h2>{user.name}</h2>
                        <p className="ppm-role">
                          {user.headline || "Add a professional headline"}
                        </p>
                        <p className="ppm-company-at">
                          {user.currentCompany
                            ? `at ${user.currentCompany}`
                            : "No company listed"}
                        </p>
                      </>
                    )}
                    <span className="ppm-updated">
                      Last updated &middot; {user.lastUpdated || "Just now"}
                    </span>
                  </div>
                </div>
                <div className="ppm-meta-grid">
                  {isEditingProfile ? (
                    <>
                      <div className="ppm-meta-item">
                        <FiMapPin size={14} />{" "}
                        <input
                          className="ppm-edit-input-sm"
                          value={editProfileForm.currentCity}
                          onChange={(e) =>
                            handleEditFieldChange("currentCity", e.target.value)
                          }
                          placeholder="City"
                        />
                      </div>
                      <div className="ppm-meta-item">
                        <FiPhone size={14} />{" "}
                        <input
                          className="ppm-edit-input-sm"
                          value={editProfileForm.phone}
                          onChange={(e) =>
                            handleEditFieldChange("phone", e.target.value)
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="ppm-meta-item">
                        <FiBriefcase size={14} />
                        <select
                          className="ppm-edit-select"
                          value={editProfileForm.totalExperience}
                          onChange={(e) =>
                            handleEditFieldChange(
                              "totalExperience",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select experience</option>
                          <option value="Fresher">Fresher</option>
                          <option value="6 months">6 months</option>
                          <option value="1 year">1 year</option>
                          <option value="2 years">2 years</option>
                          <option value="3 years">3 years</option>
                          <option value="5+ years">5+ years</option>
                          
                        </select>
                      </div>
                      <div className="ppm-meta-item">
                        <FiMail size={14} /> {user.email}
                      </div>
                      <div className="ppm-meta-item">
                        <input
                          className="ppm-edit-input-sm"
                          type="text"
                          value={editProfileForm.expectedSalary}
                          onChange={(e) =>
                            handleEditFieldChange(
                              "expectedSalary",
                              e.target.value,
                            )
                          }
                          placeholder="Expected salary (e.g. 10 LPA)"
                        />
                      </div>
                      <div className="ppm-meta-item">
                        <FiClock size={14} />
                        <select
                          className="ppm-edit-select"
                          value={editProfileForm.noticePeriod}
                          onChange={(e) =>
                            handleEditFieldChange(
                              "noticePeriod",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select notice period</option>
                          <option value="7 Days">7 Days</option>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                          <option value="90 Days">90 Days</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ppm-meta-item">
                        <FiMapPin size={14} /> {user.currentCity || "Add City"}
                      </div>
                      <div className="ppm-meta-item">
                        <FiPhone size={14} /> {user.phone || "Add Phone"}{" "}
                        {user.phone && (
                          <FiCheckCircle size={13} color="#10b981" />
                        )}
                      </div>
                      <div className="ppm-meta-item">
                        <FiBriefcase size={14} />{" "}
                        {user.totalExperience || "Add Experience"}
                      </div>
                      <div className="ppm-meta-item">
                        <FiMail size={14} /> {user.email}{" "}
                        <FiCheckCircle size={13} color="#10b981" />
                      </div>
                      <div className="ppm-meta-item">
                        {user.expectedSalary
                          ? `Rs. ${user.expectedSalary}`
                          : "Add Expected Salary"}
                      </div>
                      <div className="ppm-meta-item">
                        <FiClock size={14} />{" "}
                        {user.noticePeriod || "Add Notice Period"}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="ppm-layout">
                <div className="ppm-left-col">
                  <div className="ppm-card ppm-links-card">
                    <h3>Quick links</h3>
                    {[
                      "Resume",
                      "Resume headline",
                      "Key skills",
                      "Employment",
                      "Education",
                      "IT skills",
                      "Projects",
                      "Profile summary",
                      "Career profile",
                    ].map((link) => {
                      const isFilled =
                        (link === "Resume" && !!user.resume?.url) ||
                        (link === "Resume headline" && !!user.headline) ||
                        (link === "Key skills" && user.skills?.length > 0) ||
                        (link === "Employment" &&
                          (!!user.currentTitle || !!user.currentCompany)) ||
                        (link === "Education" && !!user.education) ||
                        (link === "IT skills" && !!user.itSkills) ||
                        (link === "Projects" && !!user.projectTitle) ||
                        (link === "Profile summary" && !!user.summary) ||
                        (link === "Career profile" &&
                          !!(
                            user.expectedSalary ||
                            (Array.isArray(user.preferredLocations) &&
                              user.preferredLocations.length > 0)
                          ));

                      return (
                        <div
                          className={`ppm-link-row ${isFilled ? "filled" : ""} ${activeEditSection === link ? "active" : ""}`}
                          key={link}
                          onClick={() => setActiveEditSection(link)}
                        >
                          <div className="ppm-link-label-wrap">
                            {isFilled && (
                              <FiCheckCircle
                                className="ppm-link-check"
                                size={14}
                              />
                            )}
                            <span>{link}</span>
                          </div>
                          <FiChevronRight size={13} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="ppm-right-col">
                  {activeEditSection ? (
                    <div className="ppm-edit-container">
                      <div className="ppm-edit-header">
                        <button
                          className="ppm-back-btn"
                          onClick={() => setActiveEditSection(null)}
                        >
                          <FiChevronLeft /> Back to Profile
                        </button>
                        <h3>Edit {activeEditSection}</h3>
                      </div>
                      <ProfileEditModal
                        section={activeEditSection}
                        data={user}
                        isLoading={isSaving}
                        onSave={handleSaveProfile}
                        onClose={() => setActiveEditSection(null)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="ppm-pro-banner">
                        <div className="ppm-pro-label">
                          MavenJobs<span>Pro</span>{" "}
                          <GiCrown className="ppm-crown" />
                        </div>
                        <div className="ppm-pro-pitch">
                          Up to <strong>4x profile views</strong>
                        </div>
                        <button
                          className="ppm-pro-btn"
                          onClick={() => navigate("/pro")}
                        >
                          Become Pro &middot; 25% off
                        </button>
                      </div>
                      {[
                        {
                          title: "Profile summary",
                          isFilled: !!user.summary,
                          content: user.summary ? (
                            <p className="ppm-body-text">{user.summary}</p>
                          ) : null,
                          addLabel: "Add professional summary",
                        },
                        {
                          title: "Resume",
                          isFilled: !!user.resume?.url,
                          customRender: true,
                          render: () => (
                            <>
                              <input
                                type="file"
                                ref={resumeInputRef}
                                style={{ display: "none" }}
                                accept=".doc,.docx,.rtf,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf"
                                onChange={handleResumeUpload}
                              />
                              {user.resume?.url ? (
                                <>
                                  <div className="ppm-resume-row">
                                    <FiFileText size={22} color="#2563eb" />
                                    <div>
                                      <div className="ppm-fname">
                                        {user.resume.fileName}
                                      </div>
                                      <div className="ppm-fdate">
                                        Uploaded{" "}
                                        {new Date(
                                          user.resume.uploadedAt,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="ppm-file-actions">
                                      <a
                                        href={user.resume.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Download"
                                      >
                                        <FiDownload size={18} />
                                      </a>
                                    </div>
                                  </div>
                                  <div
                                    className="ppm-upload-zone"
                                    onClick={() =>
                                      resumeInputRef.current?.click()
                                    }
                                  >
                                    {isUploadingResume ? (
                                      <div className="ppm-upload-loader">
                                        <span className="ppm-spinner" />{" "}
                                        Uploading...
                                      </div>
                                    ) : (
                                      <>
                                        <div className="ppm-upload-icon">
                                          <FiUpload size={28} />
                                        </div>
                                        <p className="ppm-upload-title">
                                          Replace resume
                                        </p>
                                        <p className="ppm-upload-hint">
                                          doc, docx, rtf, pdf &mdash; max 10MB
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div
                                  className="ppm-upload-zone"
                                  onClick={() =>
                                    !isUploadingResume &&
                                    resumeInputRef.current?.click()
                                  }
                                  style={{
                                    cursor: isUploadingResume
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  {isUploadingResume ? (
                                    <div className="ppm-upload-loader">
                                      <span className="ppm-spinner" />{" "}
                                      Uploading...
                                    </div>
                                  ) : (
                                    <>
                                      <div className="ppm-upload-icon">
                                        <FiUpload size={28} />
                                      </div>
                                      <p className="ppm-upload-title">
                                        Upload your resume
                                      </p>
                                      <p className="ppm-upload-hint">
                                        doc, docx, rtf, pdf &mdash; max 10MB
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </>
                          ),
                        },
                        {
                          title: "Resume headline",
                          isFilled: !!user.headline,
                          content: user.headline ? (
                            <p className="ppm-body-text">{user.headline}</p>
                          ) : null,
                        },
                        {
                          title: "Key skills",
                          isFilled: user.skills?.length > 0,
                          content:
                            user.skills?.length > 0 ? (
                              <div className="ppm-skills-wrap">
                                {user.skills.map((s) => (
                                  <span key={s} className="ppm-skill-chip">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            ) : null,
                        },
                        {
                          title: "Employment",
                          isFilled: !!user.currentTitle,
                          content: user.currentTitle ? (
                            <div className="ppm-exp-item">
                              <div className="ppm-exp-title-row">
                                <FiBriefcase size={16} color="#2563eb" />
                                <span className="ppm-exp-title">
                                  {user.currentTitle}
                                </span>
                              </div>
                              <div className="ppm-exp-co">
                                {user.currentCompany}
                              </div>
                              <div className="ppm-exp-meta">
                                {user.totalExperience} &middot;{" "}
                                {user.noticePeriod} notice
                              </div>
                            </div>
                          ) : null,
                        },
                        {
                          title: "Education",
                          isFilled: !!user.education,
                          content: user.education ? (
                            <div className="ppm-exp-item">
                              <div className="ppm-exp-title-row">
                                <FiBookOpen size={16} color="#2563eb" />
                                <span className="ppm-exp-title">
                                  {user.education}
                                </span>
                              </div>
                            </div>
                          ) : null,
                        },
                        {
                          title: "IT skills",
                          isFilled: !!user.itSkills,
                          content: user.itSkills ? (
                            <p className="ppm-body-text">{user.itSkills}</p>
                          ) : null,
                        },
                        {
                          title: "Projects",
                          isFilled: !!user.projectTitle,
                          content: user.projectTitle ? (
                            <div className="ppm-exp-item">
                              <div className="ppm-exp-title-row">
                                <FiMonitor size={16} color="#2563eb" />
                                <span className="ppm-exp-title">
                                  {user.projectTitle}
                                </span>
                              </div>
                              {user.projectLink && (
                                <div className="ppm-exp-co">
                                  <a
                                    href={user.projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ppm-project-link"
                                  >
                                    {user.projectLink}
                                  </a>
                                </div>
                              )}
                              {user.projectDescription && (
                                <p className="ppm-body-text ppm-project-desc">
                                  {user.projectDescription}
                                </p>
                              )}
                            </div>
                          ) : null,
                        },
                        {
                          title: "Career profile",
                          isFilled: !!(
                            user.expectedSalary ||
                            (Array.isArray(user.preferredLocations) &&
                              user.preferredLocations.length > 0)
                          ),
                          content: (
                            <div className="ppm-career-grid">
                              <div className="ppm-career-item">
                                <div className="ppm-career-icon">
                                  <FiZap size={14} />
                                </div>
                                <span className="ppm-career-label">
                                  Expected Salary
                                </span>
                                <span className="ppm-career-value">
                                  {user.expectedSalary || (
                                    <span className="ppm-career-na">
                                      Not set
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="ppm-career-item">
                                <div className="ppm-career-icon">
                                  <FiMapPin size={14} />
                                </div>
                                <span className="ppm-career-label">
                                  Preferred Locations
                                </span>
                                <span className="ppm-career-value">
                                  {Array.isArray(user.preferredLocations)
                                    ? user.preferredLocations.join(", ")
                                    : user.preferredLocations || (
                                        <span className="ppm-career-na">
                                          Not set
                                        </span>
                                      )}
                                </span>
                              </div>
                              <div className="ppm-career-item">
                                <div className="ppm-career-icon">
                                  <FiClock size={14} />
                                </div>
                                <span className="ppm-career-label">
                                  Notice Period
                                </span>
                                <span className="ppm-career-value">
                                  {user.noticePeriod || (
                                    <span className="ppm-career-na">
                                      Not set
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          ),
                        },
                      ].map((sec) => {
                        if (sec.customRender) {
                          return (
                            <div
                              className={`ppm-card ${!sec.isFilled ? "ppm-card-empty" : ""}`}
                              key={sec.title}
                            >
                              <div
                                className="ppm-sec-header"
                                onClick={() => setActiveEditSection(sec.title)}
                              >
                                <h3>{sec.title}</h3>
                                {sec.isFilled && (
                                  <FiCheckCircle color="#10b981" size={16} />
                                )}
                              </div>
                              {sec.render()}
                            </div>
                          );
                        }
                        const isEmpty = !sec.isFilled;
                        return (
                          <div
                            className={`ppm-card ${isEmpty ? "ppm-card-empty" : ""}`}
                            key={sec.title}
                          >
                            <div
                              className="ppm-sec-header"
                              onClick={() => setActiveEditSection(sec.title)}
                            >
                              <h3>{sec.title}</h3>
                              {!isEmpty && (
                                <FiCheckCircle color="#10b981" size={16} />
                              )}
                              {isEmpty ? (
                                <span className="ppm-add-badge">
                                  <FiPlus size={13} /> Add
                                </span>
                              ) : (
                                <FiEdit2
                                  size={14}
                                  className="ppm-sec-edit-icon"
                                />
                              )}
                            </div>
                            {isEmpty ? (
                              <div
                                className="ppm-add-target"
                                onClick={() => setActiveEditSection(sec.title)}
                              >
                                <FiPlus size={22} />
                                <span>
                                  {sec.addLabel ||
                                    `Add ${sec.title.toLowerCase()}`}
                                </span>
                              </div>
                            ) : (
                              sec.content
                            )}
                            {sec.extra}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Initial Completion Modal  */}
      {showCompletionModal && (
        <div className="ppm-overlay" style={{ zIndex: 10001 }}>
          <div
            className="ppm-content"
            style={{
              maxWidth: "500px",
              width: "90%",
              boxSizing: "border-box",
              textAlign: "center",
              padding: "clamp(24px, 5vw, 40px)",
              borderRadius: "clamp(20px, 4vw, 28px)",
            }}
          >
            <img
              src={mavenLogo}
              alt="Maven"
              style={{ height: "32px", marginBottom: "24px" }}
            />
            <h2
              style={{
                fontSize: "26px",
                color: "#143f86",
                marginBottom: "12px",
                fontWeight: 800,
              }}
            >
              Complete Your Profile
            </h2>
            <p
              style={{
                color: "#64748b",
                marginBottom: "32px",
                lineHeight: 1.6,
                fontSize: "15px",
              }}
            >
              Your profile is the first thing recruiters see. Complete it now to
              get <strong>3x more visibility</strong> and better job matches.
            </p>
            <button
              className="pd-btn-black"
              style={{
                width: "100%",
                justifyContent: "center",
                height: "54px",
                fontSize: "16px",
                borderRadius: "14px",
              }}
              onClick={() => {
                setCompletionModalSeenToday();
                setShowCompletionModal(false);
                setShowPreview(true);
              }}
            >
              View Details
            </button>
            <button
              className="pd-text-btn"
              style={{
                marginTop: "16px",
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: 600,
              }}
              onClick={() => {
                setCompletionModalSeenToday();
                setShowCompletionModal(false);
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}


      {/*  Jobs Modal  */}
      {showCandidateChat && (
        <div
          className="pd-chat-overlay"
          onClick={() => setShowCandidateChat(false)}
        >
          <div className="pd-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-chat-topbar">
              <h3>Messages</h3>
              <button
                className="pd-chat-close"
                onClick={() => setShowCandidateChat(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="pd-chat-shell">
              <aside className="pd-chat-list">
                <div className="pd-chat-search">
                  <FiSearch size={15} />
                  <input placeholder="Search messages..." />
                </div>
                {candidateThreads.length === 0 ? (
                  <div className="pd-chat-empty">
                    No recruiter conversations yet.
                  </div>
                ) : (
                  candidateThreads.map((thread, index) => (
                    <button
                      className={`pd-chat-thread ${index === activeCandidateConv ? "active" : ""}`}
                      key={thread.id}
                      onClick={() => setActiveCandidateConv(index)}
                    >
                      <div className="pd-chat-avatar">{thread.avatar}</div>
                      <div className="pd-chat-thread-main">
                        <div className="pd-chat-thread-row">
                          <strong>{thread.companyName}</strong>
                          <span>{thread.time}</span>
                        </div>
                        <p>{thread.role}</p>
                        <small>{thread.preview}</small>
                      </div>
                      {thread.unread && <span className="pd-chat-dot" />}
                    </button>
                  ))
                )}
              </aside>

              <section className="pd-chat-window">
                {activeCandidateThread ? (
                  <>
                    <div className="pd-chat-header">
                      <div className="pd-chat-avatar">
                        {activeCandidateThread.avatar}
                      </div>
                      <div>
                        <h4>{activeCandidateThread.companyName}</h4>
                        <p>{activeCandidateThread.role}</p>
                      </div>
                      <div className="pd-chat-actions">
                        {CALLS_ENABLED && (
                          <>
                            <button
                              title="Audio call"
                              onClick={() => startCandidateCall("AUDIO")}
                            >
                              <FiPhone size={17} />
                            </button>
                            <button
                              title="Video call"
                              onClick={() => startCandidateCall("VIDEO")}
                            >
                              <FiVideo size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {CALLS_ENABLED &&
                      activeCandidateThread.activeCall?.state === "RINGING" &&
                      activeCandidateThread.activeCall?.initiatedBy ===
                        "COMPANY" && (
                        <div className="pd-incoming-call">
                          <div>
                            <strong>
                              {activeCandidateThread.companyName} is calling
                            </strong>
                            <span>
                              {activeCandidateThread.activeCall.mediaType ===
                              "VIDEO"
                                ? "Video call"
                                : "Audio call"}
                            </span>
                          </div>
                          <button
                            className="accept"
                            onClick={acceptCandidateCall}
                          >
                            Accept
                          </button>
                          <button
                            className="reject"
                            onClick={() => stopCandidateCall(true)}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                    <div className="pd-chat-messages">
                      {(activeCandidateThread.messages || []).length === 0 ? (
                        <div className="pd-chat-empty big">
                          No messages yet.
                        </div>
                      ) : (
                        activeCandidateThread.messages.map((message, index) => (
                          <div
                            className={`pd-chat-bubble-row ${message.from === "me" ? "me" : "them"}`}
                            key={`${message.time}-${index}`}
                          >
                            <div className="pd-chat-bubble">
                              <span>{message.text}</span>
                              <small>{message.time}</small>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={candidateChatEndRef} />
                    </div>

                    <div className="pd-chat-compose">
                      <input
                        value={candidateMsgInput}
                        onChange={(e) => setCandidateMsgInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendCandidateMessage();
                        }}
                        placeholder="Write a message..."
                      />
                      <button className="ghost" title="Attach file">
                        <FiPaperclip size={17} />
                      </button>
                      <button className="ghost" title="Add emoji">
                        <FiSmile size={17} />
                      </button>
                      <button
                        className="send"
                        title="Send message"
                        onClick={sendCandidateMessage}
                      >
                        <FiSend size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pd-chat-empty big">
                    Select a conversation to start chatting.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {CALLS_ENABLED && candidateCallModal && (
        <div
          className="pd-call-overlay"
          onClick={() => stopCandidateCall(true)}
        >
          <div className="pd-call-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-call-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <h3>
                    {candidateCallMode === "VIDEO"
                      ? "Video Call"
                      : "Audio Call"}
                  </h3>
                  <p>
                    {candidateCallStatus === "ringing"
                      ? "Waiting for the other person"
                      : candidateCallStatus === "in-call"
                        ? "Call in progress"
                        : "Connecting call"}
                  </p>
                </div>
                {isCallConnected && (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#10b981",
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                      animation: "pulse 2s infinite",
                    }}
                  />
                )}
              </div>
              <button onClick={() => stopCandidateCall(true)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="pd-call-stage">
              {candidateCallMode === "VIDEO" ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 320,
                    background: "#111827",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {candidateRemoteCallStream && (
                    <video
                      ref={candidateRemoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <video
                    ref={candidateCallPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      width: 100,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "2px solid rgba(255,255,255,0.2)",
                      background: "#000",
                      zIndex: 10,
                      display: candidateCallStream ? "block" : "none",
                    }}
                  />
                  {!candidateRemoteCallStream && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 13,
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 16,
                          background: "#002366",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {activeCandidateThread?.avatar || "C"}
                      </div>
                      Connecting secure video stream...
                    </div>
                  )}
                </div>
              ) : (
                <div className="pd-audio-call-mark">
                  <FiPhone size={34} />
                </div>
              )}
            </div>
            <div className="pd-call-controls">
              <button
                className="danger"
                onClick={() => stopCandidateCall(true)}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {showJobsModal && (
        <div
          className="pd-modal-overlay"
          onClick={() => setShowJobsModal(false)}
        >
          <div className="pd-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="pd-modal-close"
              onClick={() => setShowJobsModal(false)}
            >
              <FiX size={22} />
            </button>
            <div className="pd-modal-scroll">
              <RecommendedJobs
                onBack={() => setShowJobsModal(false)}
                recommendedJobs={recommendedJobs}
                candidateProfile={candidateProfile}
              />
            </div>
          </div>
        </div>
      )}
      {/*  Apply Match Analytics Modal  */}
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
            candidateProfile?.currentTitle || user?.headline || "Professional";
          const deptMatchPct = getAvg("roleMatch", hasApps ? 78 : 0);

          const earlyAppVal = "Fresh jobs";
          const earlyAppPct = hasApps ? getAvg("matchScore", 75) + 4 : 0;

          const dimensions = [
            {
              title: "Work Experience Match",
              desc: `Your experience (${userExp}) aligns with ${expMatchPct}% of applied role requirements. E.g. senior roles require 3+ years.`,
              tip: "Tip: Add recent freelance projects to boost score",
              pct: expMatchPct,
            },
            {
              title: "Location Compatibility",
              desc: `Based in ${userCity}. Matches ${locMatchPct}% of employer site preferences (On-Site/Hybrid).`,
              tip: "Tip: Update preferred locations in profile settings",
              pct: locMatchPct,
            },
            {
              title: "Key Skills Alignment",
              desc: `Top skills (${userSkillsStr}) match ${skillsMatchPct}% of JD keywords. Missing 2 core requirements.`,
              tip: "Tip: Add 3 more core skills from recent JDs",
              pct: skillsMatchPct,
            },
            {
              title: "Industry Relevance",
              desc: `Background in ${userIndustry} gives you an ${industryMatchPct}% advantage over cross-industry applicants.`,
              tip: "Tip: Highlight industry-specific achievements",
              pct: industryMatchPct,
            },
            {
              title: "Department Fit",
              desc: `Title (${userDept}) matches ${deptMatchPct}% of target department hierarchies perfectly.`,
              tip: "Tip: Use standard industry job titles",
              pct: deptMatchPct,
            },
            {
              title: "Early Applicant Advantage",
              desc: `Applying within first 48 hours (${earlyAppVal}) puts you in the top ${earlyAppPct}% of candidate visibility.`,
              tip: "Tip: Turn on instant job match alerts",
              pct: earlyAppPct,
            },
          ];

          const appsList = hasApps
            ? appsWithScores
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
                  {/* Summary Grid */}
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

                  {/* Dimensions Grid */}
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

                  {/* Recent Applications Table */}
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
        
      {/*  Know More Modal  */}
      <style>{`
        /* Dynamic Skills Styles */
        .pd-skill-add-row {
          display: flex; gap: 8px; margin-bottom: 16px;
          animation: kmFadeIn 0.2s ease;
        }
        .pd-skill-add-row input {
          flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 8px 12px; border-radius: 8px; font-size: 13px;
          outline: none; transition: border-color 0.2s;
        }
        .pd-skill-add-row input:focus { border-color: #2563eb; }
        .pd-skill-add-row button {
          background: #2563eb; color: #fff; border: none;
          padding: 0 10px; border-radius: 8px; cursor: pointer;
          transition: background 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .pd-skill-add-row button:hover { background: #1d4ed8; }

        .pd-skill-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #eff6ff; color: #1e40af; padding: 6px 12px;
          border-radius: 100px; font-size: 13px; font-weight: 500;
          transition: all 0.2s; border: 1px solid transparent;
        }
        .pd-skill-pill:hover { border-color: rgba(30, 64, 175, 0.2); background: #e0e7ff; }

        .pd-skill-remove {
          background: rgba(30, 64, 175, 0.1); border: none;
          color: #1e40af; width: 16px; height: 16px;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
          padding: 0; margin-right: -4px;
        }
        .pd-skill-remove:hover { background: #1e40af; color: #fff; transform: scale(1.1); }

        .pd-no-skills { color: #94a3b8; font-size: 12px; font-style: italic; margin-top: 4px; }

        /* Completion Modal Styles */
        .cm-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px); z-index: 20000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: kmFadeIn 0.3s ease;
        }
        .cm-modal-box {
          background: #ffffff; width: 100%; max-width: 540px;
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: kmSlideUp 0.3s ease;
        }
        .cm-modal-header {
          padding: 24px 32px; border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
          background: #fff;
        }
        .cm-modal-header h3 { color: #0f172a; font-size: 18px; font-weight: 800; }
        .cm-modal-close {
          background: transparent; border: none; color: #64748b;
          cursor: pointer; transition: color 0.2s; display: flex;
        }
        .cm-modal-close:hover { color: #0f172a; }

        .cm-modal-body { padding: 32px; max-height: 70vh; overflow-y: auto; }
        
        .cm-form-group { margin-bottom: 20px; }
        .cm-form-group label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .cm-form-group input, .cm-form-group textarea {
          width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0;
          border-radius: 12px; font-size: 14px; transition: all 0.2s; outline: none;
        }
        .cm-form-group input:focus, .cm-form-group textarea:focus {
          border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .cm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .cm-helper-text { color: #64748b; font-size: 13px; margin-bottom: 24px; }
        .cm-summary-area { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; outline: none; resize: none; font-size: 14px; line-height: 1.6; }
        .cm-summary-area:focus { border-color: #10b981; }

        .cm-skill-input-wrap { display: flex; gap: 12px; margin-bottom: 24px; }
        .cm-skill-input-wrap input { flex: 1; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none; }
        .cm-add-btn { background: #0f172a; color: #fff; border: none; padding: 0 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }

        .cm-skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .cm-skill-chip {
          background: #f1f5f9; color: #0f172a; padding: 6px 14px;
          border-radius: 100px; font-size: 13px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .cm-skill-chip svg { cursor: pointer; color: #94a3b8; transition: color 0.2s; }
        .cm-skill-chip svg:hover { color: #ef4444; }

        .cm-modal-footer {
          padding: 24px 32px; background: #f8fafc;
          display: flex; justify-content: flex-end; gap: 12px;
        }
        .cm-btn-cancel { background: transparent; border: none; color: #64748b; font-weight: 700; cursor: pointer; padding: 10px 20px; }
        .cm-btn-save { background: #10b981; color: #fff; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .cm-btn-save:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }

        /* Strictly Professional Circular Checkbox */
        .cm-checkbox-group { margin: 12px 0 24px; }
        .cm-checkbox-label {
          display: inline-flex; align-items: center; gap: 10px;
          cursor: pointer; font-size: 14px; color: #475569; font-weight: 700;
          user-select: none; white-space: nowrap; transition: all 0.2s;
        }
        .cm-checkbox-label input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
        .cm-checkbox-box {
          width: 16px; height: 16px; border: 2px solid #cbd5e1;
          border-radius: 50%; background: #fff; position: relative;
          flex-shrink: 0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; justify-content: center;
        }
        .cm-checkbox-label input:checked ~ .cm-checkbox-box {
          background: #10b981; border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .cm-checkbox-box::after {
          content: ""; position: absolute; display: none;
          width: 3px; height: 6.5px;
          border: solid white; border-width: 0 1.8px 1.8px 0;
          transform: rotate(45deg); margin-top: -1px;
        }
        .cm-checkbox-label input:checked ~ .cm-checkbox-box::after {
          display: block;
        }
        .cm-checkbox-label:hover .cm-checkbox-box {
          border-color: #10b981;
        }
      `}</style>

      {/*  Work Status Modal  */}
      {showWorkStatusModal && (
        <div
          className="cm-modal-overlay"
          onClick={() => setShowWorkStatusModal(false)}
        >
          <div
            className="cm-modal-box"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cm-modal-header">
              <h3>Professional Status</h3>
              <button
                className="cm-modal-close"
                onClick={() => setShowWorkStatusModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="cm-modal-body" style={{ padding: "24px 32px" }}>
              <p
                className="cm-helper-text"
                style={{ marginBottom: 24, fontSize: "13.5px" }}
              >
                Let recruiters know your current availability to help them match
                you with the right opportunities.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  border: `1.5px solid ${workStatus === "Open to Work" ? "#10b981" : "#e2e8f0"}`,
                  borderRadius: "14px",
                  marginBottom: "16px",
                  cursor: "pointer",
                  background:
                    workStatus === "Open to Work" ? "#ecfdf5" : "#fff",
                  transition: "all 0.2s",
                  boxShadow:
                    workStatus === "Open to Work"
                      ? "0 4px 12px rgba(16,185,129,0.1)"
                      : "none",
                }}
                onClick={() => setWorkStatus("Open to Work")}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: "15px",
                      marginBottom: "4px",
                    }}
                  >
                    Open to Work
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Actively looking for new roles
                  </div>
                </div>
                <div
                  className="cm-checkbox-box"
                  style={{
                    borderColor:
                      workStatus === "Open to Work" ? "#10b981" : "#cbd5e1",
                    background:
                      workStatus === "Open to Work" ? "#10b981" : "#fff",
                    width: 20,
                    height: 20,
                  }}
                >
                  {workStatus === "Open to Work" && (
                    <FiCheckCircle size={12} color="#fff" />
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  border: `1.5px solid ${workStatus === "Working" ? "#1e5eff" : "#e2e8f0"}`,
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: workStatus === "Working" ? "#eef4ff" : "#fff",
                  transition: "all 0.2s",
                  boxShadow:
                    workStatus === "Working"
                      ? "0 4px 12px rgba(30,94,255,0.1)"
                      : "none",
                }}
                onClick={() => setWorkStatus("Working")}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: "15px",
                      marginBottom: "4px",
                    }}
                  >
                    Working
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    Currently employed, not actively looking
                  </div>
                </div>
                <div
                  className="cm-checkbox-box"
                  style={{
                    borderColor:
                      workStatus === "Working" ? "#1e5eff" : "#cbd5e1",
                    background: workStatus === "Working" ? "#1e5eff" : "#fff",
                    width: 20,
                    height: 20,
                  }}
                >
                  {workStatus === "Working" && (
                    <FiCheckCircle size={12} color="#fff" />
                  )}
                </div>
              </div>
            </div>

            <div className="cm-modal-footer">
              <button
                className="cm-btn-cancel"
                onClick={() => setShowWorkStatusModal(false)}
              >
                Cancel
              </button>
              <button
                className="cm-btn-save"
                onClick={() => setShowWorkStatusModal(false)}
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Profile Completion Modal  */}
      {activeTip && (
        <div className="cm-modal-overlay" onClick={() => setActiveTip(null)}>
          <div className="cm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>
                {activeTip === "experience" && "Add Work Experience"}
                {activeTip === "summary" && "Professional Summary"}
                {activeTip === "skills" && "Manage Core Skills"}
              </h3>
              <button
                className="cm-modal-close"
                onClick={() => setActiveTip(null)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="cm-modal-body">
              {activeTip === "experience" && (
                <div className="cm-form">
                  <div className="cm-form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="cm-form-group">
                    <label>Company Name</label>
                    <input type="text" placeholder="e.g. Google India" />
                  </div>
                  <div className="cm-checkbox-group">
                    <label className="cm-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isCurrentlyWorking}
                        onChange={(e) =>
                          setIsCurrentlyWorking(e.target.checked)
                        }
                      />
                      <span className="cm-checkbox-box" />I am currently working
                      in this role
                    </label>
                  </div>
                  <div className="cm-form-row">
                    <div className="cm-form-group">
                      <label>Start Date</label>
                      <input type="month" />
                    </div>
                    <div
                      className="cm-form-group"
                      style={{
                        opacity: isCurrentlyWorking ? 0.4 : 1,
                        filter: isCurrentlyWorking ? "blur(1.5px)" : "none",
                        pointerEvents: isCurrentlyWorking ? "none" : "auto",
                        transition: "all 0.3s",
                      }}
                    >
                      <label>End Date</label>
                      <input type="month" disabled={isCurrentlyWorking} />
                    </div>
                  </div>
                  <div className="cm-form-group">
                    <label>Description</label>
                    <textarea
                      placeholder="Describe your key responsibilities and achievements..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {activeTip === "summary" && (
                <div className="cm-form">
                  <p className="cm-helper-text">
                    Briefly highlight your expertise and what you bring to the
                    table.
                  </p>
                  <textarea
                    className="cm-summary-area"
                    placeholder="Results-driven professional with expertise in..."
                    rows={8}
                    autoFocus
                  />
                </div>
              )}

              {activeTip === "skills" && (
                <div className="cm-skills-editor">
                  <p className="cm-helper-text">
                    Add skills to get 40% better job recommendations.
                  </p>
                  <div className="cm-skill-input-wrap">
                    <input
                      type="text"
                      placeholder="Add a skill (e.g. Python, Figma)..."
                      value={newSkillValue}
                      onChange={(e) => setNewSkillValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    />
                    <button className="cm-add-btn" onClick={addSkill}>
                      Add
                    </button>
                  </div>
                  <div className="cm-skills-list">
                    {skills.map((s) => (
                      <span key={s} className="cm-skill-chip">
                        {s} <FiX size={12} onClick={() => removeSkill(s)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cm-modal-footer">
              <button
                className="cm-btn-cancel"
                onClick={() => setActiveTip(null)}
              >
                Cancel
              </button>
              <button
                className="cm-btn-save"
                onClick={() => setActiveTip(null)}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        onSelectQuickAnswer={setShowQuickAnswer}
        latestBlogs={latestBlogs}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
      />

      {/*  Quick Answer Modal  */}
      {showQuickAnswer && (
        <div
          className="pd-modal-overlay"
          onClick={() => setShowQuickAnswer(null)}
          style={{ zIndex: 3000 }}
        >
          <div
            className="pd-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
              padding: "28px",
              borderRadius: "24px",
              background: "#fff",
              height: "auto",
              minHeight: "auto",
            }}
          >
            <button
              className="pd-modal-close"
              onClick={() => setShowQuickAnswer(null)}
            >
              <FiX size={20} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#ecfdf5",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  color: "#10b981",
                }}
              >
                <FiZap size={28} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#002366",
                  marginBottom: "12px",
                  lineHeight: 1.3,
                }}
              >
                {showQuickAnswer.q}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#475569",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                  fontWeight: 500,
                }}
              >
                {showQuickAnswer.a}
              </p>
              <button
                className="cm-btn-save"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
                onClick={() => setShowQuickAnswer(null)}
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
      <LandingFooter />
    </div>
  );
}
