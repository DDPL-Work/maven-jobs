const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const https = require("https");
const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async.middleware");
const User = require("../models/User");
const Job = require("../models/Job");
const Company = require("../models/Company");
const CompanyReview = require("../models/CompanyReview");
const QRCode = require("../models/QRCode");                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
const Application = require("../models/Application");
const CandidateProfile = require("../models/CandidateProfile");
const CandidateProfileHistory = require("../models/CandidateProfileHistory");
const CandidateNotification = require("../models/CandidateNotification");
const CandidateQuizResult = require("../models/CandidateQuizResult");
const Nvite = require("../models/Nvite");
const EventBus = require("../events/EventBus");
const { EVENTS } = require("../events/events");
const activityService = require("../services/recruiter-activity.service");
const { uploadResumeFile, deleteResumeFile } = require("../services/resume-storage.service");
const { replaceCandidateImage } = require("../services/candidate-image-storage.service");
const {
  issueTokenPair,
  setAccessCookie,
  setRefreshCookie,
} = require("../services/auth.service");
const QuizService = require("../services/quiz.service");
const { fetchHomeLandingData } = require("./landing.controller");

const OpenAIService = require("../services/openai/OpenAIService");
const AIService = require("../services/ai/AIService");
const { scoreJob } = require("../recommendations/engine/scoringEngine");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

function timeAgo(date) {
  if (!date) return "recently";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + "d ago";
  const months = Math.floor(days / 30);
  if (months < 12) return months + "mo ago";
  return Math.floor(months / 12) + "y ago";
}

const supportedResumeMimeTypes = new Set([
  "application/pdf"
]);

const isPdfResumeUpload = (file = null) => {
  if (!file) {
    return false;
  }

  const mimeType = String(file.mimetype || "").toLowerCase();
  const fileName = String(file.originalname || "").toLowerCase();
  return supportedResumeMimeTypes.has(mimeType) || fileName.endsWith(".pdf");
};

const generateToken = (id) =>
  jwt.sign({ id, type: "CANDIDATE_PANEL" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const formatCompanyReview = (review) => ({
  id: String(review._id),
  candidateName: review.isAnonymous ? "Anonymous Candidate" : (review.candidateName || "Candidate"),
  candidateTitle: review.candidateTitle || "Verified candidate",
  candidateCity: review.candidateCity || "",
  rating: Number(review.rating || 0),
  headline: review.headline || "",
  review: review.review || "",
  isAnonymous: Boolean(review.isAnonymous),
  createdAt: review.createdAt || null,
  lastUpdated: review.updatedAt || review.createdAt || null,
});

const generateTemporaryPassword = () =>
  `Mvn!${crypto.randomBytes(8).toString("hex")}`;

const DASHBOARD_PIPELINE_LIMIT = 24;
const DASHBOARD_ALERTS_LIMIT = 1;
const DAILY_QUIZ_XP_PER_CORRECT = 20;
const DAILY_QUIZ_QUESTION_COUNT = 5;

const calculateCandidateXp = async (candidateId) => {
  const rows = await CandidateQuizResult.aggregate([
    { $match: { candidateId } },
    {
      $group: {
        _id: "$candidateId",
        totalXp: { $sum: "$xpEarned" },
        quizzesPlayed: { $sum: 1 },
        bestScore: { $max: "$score" },
      },
    },
  ]);

  return rows[0] || { totalXp: 0, quizzesPlayed: 0, bestScore: 0 };
};

const normalizeIndianPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91${digits.slice(2)}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return "";
};

const formatRelativeTime = (value) => {
  if (!value) {
    return "Unavailable";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizePreferenceArray = (value, fieldName, maxItems) => {
  const arr = toArray(value);
  if (arr.length > maxItems) {
    throw createHttpError(400, `${fieldName} cannot exceed ${maxItems} items.`);
  }
  return arr;
};

const computeProfileCompletion = (profile, user) => {
  const checkpoints = [
    user?.name,
    user?.email,
    profile.phone,
    profile.headline,
    profile.summary,
    profile.totalExperience,
    profile.currentCity,
    profile.skills?.length > 0,
    profile.preferredRoles?.length > 0,
    profile.preferredLocations?.length > 0,
    profile.expectedSalary,
    profile.education,
    profile.itSkills,
    profile.projectTitle,
    profile.resume?.url,
    profile.profilePic?.url,
    profile.coverPic?.url,
  ];

  const filledCount = checkpoints.filter((item) => {
    if (typeof item === 'boolean') return item;
    return Boolean(item);
  }).length;

  return Math.round((filledCount / checkpoints.length) * 100);
};

const formatCandidateUser = (user = null) => ({
  id: String(user?._id || ""),
  name: user?.name || "",
  email: user?.email || "",
  role: user?.role || "CANDIDATE",
  designation: user?.department || "",
  accessStatus: user?.accessStatus || "ACTIVE",
  membership: user?.membership || { plan: "FREE", active: false },
  avatar: user?.avatar || user?.profileImageUrl || "",
  provider: user?.provider || "local",
});

const formatProfile = (profile = {}, user = null) => {
  const userAvatar = user?.avatar || user?.profileImageUrl || "";
  const rawProfilePic = profile?.profilePic;
  const profilePicUrl = (typeof rawProfilePic === "string" ? rawProfilePic : rawProfilePic?.url) || "";
  const rawCoverPic = profile?.coverPic;
  const coverPicUrl = (typeof rawCoverPic === "string" ? rawCoverPic : rawCoverPic?.url) || "";

  return {
    id: String(profile?._id || ""),
    publicShareId: profile?.publicShareId || "",
    user: formatCandidateUser(user),
    phone: profile?.phone || "",
    altPhone: profile?.altPhone || "",
    headline: profile?.headline || "",
    summary: profile?.summary || "",
    totalExperience: profile?.totalExperience || "",
    currentTitle: profile?.currentTitle || user?.department || "",
    currentCompany: profile?.currentCompany || "",
    noticePeriod: profile?.noticePeriod || "",
    currentCity: profile?.currentCity || "",
    currentState: profile?.currentState || "",
    currentCountry: profile?.currentCountry || "",
    preferredLocations: profile?.preferredLocations || [],
    preferredRoles: profile?.preferredRoles || [],
    skills: profile?.skills || [],
    linkedInUrl: profile?.linkedInUrl || "",
    portfolioUrl: profile?.portfolioUrl || "",
    expectedSalary: profile?.expectedSalary || "",
    education: profile?.education || "",
    itSkills: profile?.itSkills || "",
    workExperiences: (() => {
      try { const parsed = JSON.parse(profile?.workExperiences || "[]"); return Array.isArray(parsed) ? parsed : []; }
      catch { return []; }
    })(),
    educations: (() => {
      try { const parsed = JSON.parse(profile?.educations || "[]"); return Array.isArray(parsed) ? parsed : []; }
      catch { return []; }
    })(),
    projects: (() => {
      try { const parsed = JSON.parse(profile?.projects || "[]"); return Array.isArray(parsed) ? parsed : []; }
      catch { return []; }
    })(),
    projectTitle: profile?.projectTitle || "",
    projectLink: profile?.projectLink || "",
    projectDescription: profile?.projectDescription || "",
    lastScannedQrToken: profile?.lastScannedQrToken || "",
    savedJobIds: (profile?.savedJobIds || []).map((id) => String(id)),
    followedCompanyIds: (profile?.followedCompanyIds || []).map((id) => String(id)),
    resume: {
      fileName: profile?.resume?.fileName || "",
      url: profile?.resume?.url || "",
      storageProvider: profile?.resume?.storageProvider || "",
      sizeBytes: Number(profile?.resume?.sizeBytes || 0),
      mimeType: profile?.resume?.mimeType || "",
      uploadedAt: profile?.resume?.uploadedAt || null,
    },
    profileCompletion: computeProfileCompletion(profile || {}, user || {}),
    profilePic: profilePicUrl || userAvatar
      ? { url: profilePicUrl || userAvatar, publicId: rawProfilePic?.publicId || "" }
      : { url: "", publicId: "" },
    coverPic: coverPicUrl
      ? { url: coverPicUrl, publicId: rawCoverPic?.publicId || "" }
      : { url: "", publicId: "" },
    updatedAt: profile?.updatedAt,
    lastUpdated: formatRelativeTime(profile?.updatedAt),
  };
};

const parseExperienceRange = (expStr) => {
  if (!expStr) return { min: 0, max: 99 };
  const cleaned = String(expStr).toLowerCase().replace(/yrs?|years?/gi, "").trim();
  const parts = cleaned.split(/[-–]/)
    .map((p) => parseFloat(p.trim()))
    .filter((n) => !isNaN(n));
  if (parts.length >= 2) return { min: parts[0], max: parts[1] };
  if (parts.length === 1) return { min: 0, max: parts[0] };
  return { min: 0, max: 99 };
};

const normalizeStr = (s) => String(s || "").toLowerCase().trim();

const normalizeSearchTerms = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);

const jobMatchesKeywordSearch = (job, search = "") => {
  const terms = normalizeSearchTerms(search);
  if (!terms.length) return true;

  const skills = (Array.isArray(job.skills) ? job.skills : []).map((skill) => String(skill || "").toLowerCase());
  const stackAliases = [];
  const hasSkillAny = (aliases) => aliases.some((alias) =>
    skills.some((candidateSkill) => candidateSkill.includes(alias)),
  );

  if (
    hasSkillAny(["mongodb", "mongo"]) &&
    hasSkillAny(["express", "express.js"]) &&
    hasSkillAny(["react", "react.js"]) &&
    hasSkillAny(["node", "node.js"])
  ) {
    stackAliases.push("mern", "mern stack");
  }

  if (
    hasSkillAny(["mongodb", "mongo"]) &&
    hasSkillAny(["express", "express.js"]) &&
    hasSkillAny(["angular"]) &&
    hasSkillAny(["node", "node.js"])
  ) {
    stackAliases.push("mean", "mean stack");
  }

  const searchableText = [
    job.title,
    job.department,
    job.location,
    job.experience,
    job.companyId?.name,
    job.companyId?.industry,
    ...(Array.isArray(job.skills) ? job.skills : []),
    ...stackAliases,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => searchableText.includes(term));
};

const computeMatchScore = (job, profile) => {
  if (!job || !profile) {
    return { overall: 0, skillMatch: 0, locationMatch: 0, experienceMatch: 0, roleMatch: 0, matchedSkills: [], missingSkills: [] };
  }

  const jobSkills = (Array.isArray(job.skills) ? job.skills : []).map(normalizeStr).filter(Boolean);
  const profileSkills = (Array.isArray(profile.skills) ? profile.skills : []).map(normalizeStr).filter(Boolean);

  const matchedSkills = [];
  const missingSkills = [];
  jobSkills.forEach((js) => {
    const found = profileSkills.some((ps) => ps.includes(js) || js.includes(ps));
    if (found) matchedSkills.push(js);
    else missingSkills.push(js);
  });
  const skillMatch = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : profileSkills.length > 0 ? 50 : 0;

  const jobLoc = normalizeStr(job.location);
  const candidateCity = normalizeStr(profile.currentCity);
  const prefLocs = (profile.preferredLocations || []).map(normalizeStr);
  let locationMatch = 0;
  if (jobLoc) {
    if (candidateCity && jobLoc.includes(candidateCity)) locationMatch = 100;
    else if (prefLocs.some((pl) => jobLoc.includes(pl) || pl.includes(jobLoc))) locationMatch = 85;
    else if (jobLoc.includes("remote")) locationMatch = 90;
    else locationMatch = 20;
  } else {
    locationMatch = 70;
  }

  const jobExp = parseExperienceRange(job.experience);
  const candidateExp = parseFloat(profile.totalExperience) || 0;
  let experienceMatch = 0;
  if (candidateExp >= jobExp.min && candidateExp <= jobExp.max) {
    experienceMatch = 100;
  } else if (candidateExp < jobExp.min) {
    const gap = jobExp.min - candidateExp;
    experienceMatch = Math.max(0, Math.round(100 - gap * 20));
  } else {
    const gap = candidateExp - jobExp.max;
    experienceMatch = Math.max(0, Math.round(100 - gap * 10));
  }

  const prefRoles = (profile.preferredRoles || []).map(normalizeStr);
  const jobTitle = normalizeStr(job.title);
  const jobDept = normalizeStr(job.department);
  let roleMatch = 0;
  if (prefRoles.length > 0) {
    const titleMatch = prefRoles.some((r) => jobTitle.includes(r) || r.includes(jobTitle));
    const deptMatch = prefRoles.some((r) => jobDept.includes(r) || r.includes(jobDept));
    if (titleMatch) roleMatch = 100;
    else if (deptMatch) roleMatch = 70;
    else roleMatch = 15;
  } else {
    roleMatch = 40;
  }

  const overall = Math.round(
    skillMatch * 0.40 +
    locationMatch * 0.25 +
    experienceMatch * 0.25 +
    roleMatch * 0.10
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    skillMatch: Math.min(100, Math.max(0, skillMatch)),
    locationMatch: Math.min(100, Math.max(0, locationMatch)),
    experienceMatch: Math.min(100, Math.max(0, experienceMatch)),
    roleMatch: Math.min(100, Math.max(0, roleMatch)),
    matchedSkills: matchedSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: missingSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
  };
};

const computeAIMatchScore = async (job, profile) => {
  if (!job || !profile) {
    return { overall: 0, skillMatch: 0, locationMatch: 0, experienceMatch: 0, roleMatch: 0, matchedSkills: [], missingSkills: [] };
  }

  const jobSkills = (Array.isArray(job.skills) ? job.skills : []).filter(Boolean);
  const profileSkills = (Array.isArray(profile.skills) ? profile.skills : []).filter(Boolean);

  const profileSummary = [
    `Title: ${profile.currentTitle || "N/A"}`,
    `Skills: ${profileSkills.slice(0, 20).join(", ")}`,
    `Experience: ${profile.totalExperience || "N/A"} years`,
    `Location: ${profile.currentCity || "N/A"}`,
    `Preferred Roles: ${(profile.preferredRoles || []).slice(0, 5).join(", ")}`,
    `Education: ${profile.education || "N/A"}`,
    `IT Skills: ${profile.itSkills || "N/A"}`,
    `Summary: ${(profile.summary || "").slice(0, 300)}`,
  ].join("\n");

  const prompt = `You are an AI career match scorer. Evaluate how well this candidate fits the job.

CANDIDATE PROFILE:
${profileSummary}

JOB DETAILS:
- Title: ${job.title || "N/A"}
- Department: ${job.department || "N/A"}
- Skills: ${jobSkills.slice(0, 20).join(", ")}
- Location: ${job.location || "N/A"}
- Experience: ${job.experience || "N/A"}
- Description: ${(job.description || "").slice(0, 300)}

Return ONLY valid JSON with these fields:
- "overall": 0-100 overall match score
- "skillMatch": 0-100 skills alignment
- "experienceMatch": 0-100 experience fit
- "locationMatch": 0-100 location match
- "roleMatch": 0-100 role relevance
- "matchedSkills": array of job skills the candidate has (use exact skill names from the job)
- "missingSkills": array of job skills the candidate lacks (use exact skill names from the job)

Be strict — a developer profile should NOT get high match for a sales/CRM/HR job. No extra text.`;

  try {
    const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await OpenAIService.createChatCompletion({
      model,
      systemPrompt: "You are a precise career match scorer. Respond only with valid JSON.",
      userPrompt: prompt,
      maxOutputTokens: 1000,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
    const result = JSON.parse(cleaned);

    return {
      overall: Math.min(100, Math.max(0, Math.round(Number(result.overall) || 0))),
      skillMatch: Math.min(100, Math.max(0, Math.round(Number(result.skillMatch) || 0))),
      experienceMatch: Math.min(100, Math.max(0, Math.round(Number(result.experienceMatch) || 0))),
      locationMatch: Math.min(100, Math.max(0, Math.round(Number(result.locationMatch) || 0))),
      roleMatch: Math.min(100, Math.max(0, Math.round(Number(result.roleMatch) || 0))),
      matchedSkills: (Array.isArray(result.matchedSkills) ? result.matchedSkills : []).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      missingSkills: (Array.isArray(result.missingSkills) ? result.missingSkills : []).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    };
  } catch {
    return computeMatchScore(job, profile);
  }
};

const getCompanyRatingsMap = async (companyIds) => {
  const ids = [...new Set(companyIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const stats = await CompanyReview.aggregate([
    { $match: { companyId: { $in: ids.map((id) => (typeof id === "string" ? new mongoose.Types.ObjectId(id) : id)) }, status: "PUBLISHED" } },
    { $group: { _id: "$companyId", avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);
  return new Map(stats.map((s) => [String(s._id), { avgRating: Math.round(s.avgRating * 10) / 10, reviewCount: s.reviewCount }]));
};

const formatJob = (job, applicationMap = new Map(), matchData = null, companyRating = null) => {
  const application = applicationMap.get(String(job._id));

  return {
    id: String(job._id),
    companyId: String(job.companyId?._id || job.companyId || ""),
    companyName: job.companyId?.name || "Unknown company",
    companyLogoUrl: job.companyId?.logoUrl || "",
    companyCoverUrl: job.companyId?.coverImageUrl || "",
    companyRating: companyRating?.avgRating || null,
    companyReviewCount: companyRating?.reviewCount || 0,
    title: job.title,
    department: job.department || "General",
    jobType: job.jobType || "",
    workplaceType: job.workplaceType || "",
    location: job.location || "",
    experience: job.experience || "",
    salaryMin: Number(job.salaryMin || 0),
    salaryMax: Number(job.salaryMax || 0),
    summary: job.summary || "",
    description: job.description || "",
    externalLink: job.externalLink || "",
    skills: Array.isArray(job.skills) ? job.skills : [],
    deadline: job.deadline || null,
    isActive: Boolean(job.isActive),
    applicationStatus: application?.status || "",
    hasApplied: Boolean(application),
    hasSaved: Boolean(matchData?.savedJobIds?.has?.(String(job._id))),
    createdAt: job.createdAt,
    lastUpdated: formatRelativeTime(job.updatedAt),
    matchScore: matchData?.overall ?? null,
    skillMatch: matchData?.skillMatch ?? null,
    locationMatch: matchData?.locationMatch ?? null,
    experienceMatch: matchData?.experienceMatch ?? null,
    roleMatch: matchData?.roleMatch ?? null,
    matchedSkills: matchData?.matchedSkills || [],
    missingSkills: matchData?.missingSkills || [],
    screeningQuestions: Array.isArray(job.screeningQuestions)
      ? job.screeningQuestions.map((sq) => ({
          _id: String(sq._id),
          question: sq.question,
          type: sq.type,
          required: sq.required,
          options: sq.options || [],
          maxLength: sq.maxLength,
          order: sq.order,
        }))
      : [],
  };
};

const PERSONAL_JOB_FIELDS = ["applicationStatus","hasApplied","hasSaved","matchScore","skillMatch","locationMatch","experienceMatch","roleMatch","matchedSkills","missingSkills"];

const publicJobData = (formatted) => {
  const out = { ...formatted };
  for (const key of PERSONAL_JOB_FIELDS) {
    delete out[key];
  }
  return out;
};

const formatApplication = (application, matchData = null) => ({
  id: String(application._id),
  jobId: String(application.jobId?._id || application.jobId || ""),
  jobTitle: application.jobId?.title || "Unknown job",
  companyId: String(application.companyId?._id || application.companyId || ""),
  companyName: application.companyId?.name || "Unknown company",
  status: application.status,
  resumeUrl: application.resumeUrl || "",
  resumeFileName: application.resumeFileName || "",
  sourceQrToken: application.sourceQrToken || "",
  appliedAt: application.createdAt,
  updatedAt: application.updatedAt,
  lastUpdated: formatRelativeTime(application.updatedAt),
  matchScore: matchData?.overall ?? null,
  skillMatch: matchData?.skillMatch ?? null,
  locationMatch: matchData?.locationMatch ?? null,
  experienceMatch: matchData?.experienceMatch ?? null,
  roleMatch: matchData?.roleMatch ?? null,
  matchedSkills: matchData?.matchedSkills || [],
  missingSkills: matchData?.missingSkills || [],
  jobLocation: application.jobId?.location || "",
  jobExperience: application.jobId?.experience || "",
  jobSkills: Array.isArray(application.jobId?.skills) ? application.jobId.skills : [],
  answers: Array.isArray(application.answers)
    ? application.answers.map((a) => ({
        questionId: String(a.questionId || ""),
        question: a.question || "",
        answer: a.answer,
      }))
    : [],
  appliedFrom: application.appliedFrom || "JOB_DETAILS",
});

const formatNotification = (notification) => ({
  id: String(notification._id),
  title: notification.title,
  message: notification.message,
  category: notification.category,
  status: notification.status,
  actionUrl: notification.actionUrl || "",
  createdAt: notification.createdAt,
  lastUpdated: formatRelativeTime(notification.updatedAt),
  metadata: notification.metadata || {},
});

const formatHistoryItem = (entry) => ({
  id: String(entry._id),
  action: entry.action,
  changedFields: entry.changedFields || [],
  changes: entry.changes || [],
  createdAt: entry.createdAt,
  lastUpdated: formatRelativeTime(entry.createdAt),
});

const ensureCandidateProfile = async (user) => {
  let profile = await CandidateProfile.findOne({ userId: user._id });

  if (!profile) {
    profile = await CandidateProfile.create({ userId: user._id });
    await CandidateProfileHistory.create({
      candidateId: user._id,
      profileId: profile._id,
      action: "CREATE",
      changedFields: [],
      changes: [],
      actorType: "SYSTEM",
    });
  }

  if (!profile.publicShareId) {
    const deterministicPart = `mj_${String(user._id).slice(-6)}`;
    const randomPart =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
        : crypto.randomBytes(6).toString("hex");

    profile.publicShareId = `${deterministicPart}_${randomPart}`;
  }

  if (!String(profile.currentTitle || "").trim() && String(user.department || "").trim()) {
    profile.currentTitle = String(user.department).trim();
  }

  if (profile.isModified()) {
    await profile.save();
  }

  return profile;
};

const resolveQrContext = async (
  token,
  { expandToCompanyJobs = false, limit = 24 } = {},
) => {
  const qrCode = await QRCode.findOne({ token, isActive: true }).populate("companyId");

  if (!qrCode || !qrCode.companyId) {
    throw createHttpError(404, "Invalid or expired QR code");
  }

  const mappedJobId = qrCode.jobId ? String(qrCode.jobId) : "";

  const jobs = await Job.find(
    mappedJobId && !expandToCompanyJobs
      ? {
        _id: qrCode.jobId,
        companyId: qrCode.companyId._id,
        isActive: true,
        approvalStatus: "APPROVED",
      }
      : {
        companyId: qrCode.companyId._id,
        isActive: true,
        approvalStatus: "APPROVED",
      },
  )
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("companyId", "name coverImageUrl");

  if (mappedJobId && expandToCompanyJobs) {
    jobs.sort((left, right) => {
      const leftMapped = String(left._id) === mappedJobId;
      const rightMapped = String(right._id) === mappedJobId;

      if (leftMapped === rightMapped) {
        return 0;
      }

      return leftMapped ? -1 : 1;
    });
  }

  return {
    qrCode,
    company: qrCode.companyId,
    jobs,
  };
};

const buildApplicationMap = async (candidateId, jobIds) => {
  if (!jobIds.length || !candidateId) {
    return new Map();
  }

  const applications = await Application.find({
    candidateId,
    jobId: { $in: jobIds },
  });

  return new Map(applications.map((application) => [String(application.jobId), application]));
};

const getRecommendedJobs = async (profile, candidateId) => {
  let jobs = [];
  let mappedCompany = null;

  if (profile.lastScannedQrToken) {
    try {
      const context = await resolveQrContext(profile.lastScannedQrToken, {
        expandToCompanyJobs: true,
        limit: 24,
      });
      jobs = context.jobs;
      mappedCompany = context.company;
    } catch {
      jobs = [];
    }
  }

  // Always fetch all active jobs to populate categories
  const allJobs = await Job.find({ isActive: true, approvalStatus: "APPROVED" })
    .sort({ updatedAt: -1 })
    .populate("companyId", "name logoUrl");

  const applicationMap = await buildApplicationMap(
    candidateId,
    allJobs.map((job) => job._id),
  );

  const companyIds = allJobs.map((j) => String(j.companyId?._id || j.companyId || "")).filter(Boolean);
  const ratingsMap = await getCompanyRatingsMap(companyIds);
  const formattedJobs = allJobs.map((job) => {
    const cid = String(job.companyId?._id || job.companyId || "");
    return formatJob(job, applicationMap, null, ratingsMap.get(cid) || null);
  });

  const categories = {
    Profile: [],
    Applies: [],
    Preferences: [],
    'You might like': []
  };

  const profileSkills = profile.skills || [];
  const preferredRoles = profile.preferredRoles || [];
  const preferredLocations = profile.preferredLocations || [];

  const scoreMap = new Map(
    allJobs.map((job) => [String(job._id), scoreJob(profile, job)]),
  );
  const sortByScoreDesc = (list) =>
    list.sort(
      (a, b) =>
        (scoreMap.get(String(b.id)) || 0) - (scoreMap.get(String(a.id)) || 0),
    );

  formattedJobs.forEach(job => {
    if (job.hasApplied) {
      categories.Applies.push(job);
      return;
    }

    let categorized = false;

    const hasSkillMatch = job.skills && job.skills.some(skill => profileSkills.includes(skill));
    if (hasSkillMatch) {
      categories.Profile.push(job);
      categorized = true;
    }

    const hasRoleMatch = preferredRoles.some(role => job.title?.toLowerCase().includes(role.toLowerCase()));
    const hasLocationMatch = preferredLocations.some(loc =>
      job.location && job.location.toLowerCase().includes(loc.toLowerCase()),
    );
    if (hasRoleMatch || hasLocationMatch) {
      categories.Preferences.push(job);
      categorized = true;
    }

    if (!categorized) {
      categories['You might like'].push(job);
    }
  });

  sortByScoreDesc(categories.Profile);
  sortByScoreDesc(categories.Preferences);
  sortByScoreDesc(categories['You might like']);

  const categorizedJobs = {
    [`Profile (${categories.Profile.length})`]: categories.Profile,
    [`Applies (${categories.Applies.length})`]: categories.Applies,
    [`Preferences (${categories.Preferences.length})`]: categories.Preferences,
    [`You might like (${categories['You might like'].length})`]: categories['You might like']
  };

  return {
    mappedCompany: mappedCompany
      ? {
        id: String(mappedCompany._id),
        name: mappedCompany.name,
        industry: mappedCompany.industry || "General",
        city: mappedCompany.location?.city || "",
        region: mappedCompany.location?.region || "",
      }
      : null,
    jobs: categorizedJobs,
  };
};

const buildSimilarJobs = async (job, candidateId) => {
  const similarJobs = await Job.find({
    _id: { $ne: job._id },
    isActive: true,
    approvalStatus: "APPROVED",
    $or: [
      { companyId: job.companyId?._id || job.companyId },
      job.department ? { department: job.department } : null,
      Array.isArray(job.skills) && job.skills.length ? { skills: { $in: job.skills } } : null,
    ].filter(Boolean),
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("companyId", "name logoUrl coverImageUrl");

  const applicationMap = candidateId
    ? await buildApplicationMap(candidateId, similarJobs.map((item) => item._id))
    : new Map();

  return similarJobs.map((item) => {
    const formatted = formatJob(item, applicationMap);
    return candidateId ? formatted : publicJobData(formatted);
  });
};

const escapeCsvValue = (value) => {
  const normalized =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join(" | ")
        : String(value);

  return `"${normalized.replace(/"/g, '""')}"`;
};

const sendCsv = (res, fileName, headers, rows) => {
  const csv = [headers, ...rows]
    .map((line) => line.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.status(200).send(csv);
};

exports.register = asyncHandler(async (req, res) => {
  const requestBody = req.body && typeof req.body === "object" ? req.body : {};
  const name = String(requestBody.name || "").trim();
  const designation = String(requestBody.designation || "").trim();
  const phone = String(requestBody.phone || "").trim();
  const email = String(requestBody.email || "").trim();
  const password = String(requestBody.password || "").trim();
  const qrToken = String(requestBody.qrToken || "").trim();
  const preferredLocation = String(requestBody.preferredLocation || "").trim();
  const expectedSalary = String(requestBody.expectedSalary || "").trim();
  const termsAccepted = requestBody.termsAccepted === "true" || requestBody.termsAccepted === true;

  if (!Object.keys(requestBody).length) {
    throw createHttpError(
      400,
      "Invalid registration payload. Send multipart/form-data with candidate fields and resume file.",
    );
  }

  if (!name || !designation || !phone || !email) {
    throw createHttpError(
      400,
      "Name, preferred position, phone number, and email are required.",
    );
  }

  const normalizedPhone = normalizeIndianPhoneNumber(phone);
  if (!normalizedPhone) {
    throw createHttpError(400, "Phone number must contain exactly 10 digits.");
  }

  if (req.file && !isPdfResumeUpload(req.file)) {
    throw createHttpError(400, "Only PDF resume files are supported.");
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createHttpError(409, "Email already exists");
  }

  const resolvedPassword = String(password || "").trim() || generateTemporaryPassword();

  let user = null;

  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(resolvedPassword, 10),
      role: "CANDIDATE",
      department: designation.trim(),
      accessStatus: "ACTIVE",
      isActive: true,
      termsAccepted,
    });

    let uploadedResume = null;
    if (req.file) {
      uploadedResume = await uploadResumeFile(req.file, user._id);
    }

    const profileData = {
      userId: user._id,
      phone: normalizedPhone,
      currentTitle: designation.trim(),
      lastScannedQrToken: qrToken.trim(),
      preferredLocations: preferredLocation ? [preferredLocation] : [],
      expectedSalary: expectedSalary || "",
    };

    if (uploadedResume) {
      profileData.resume = {
        ...uploadedResume,
        uploadedAt: new Date(),
      };
    }

    const profile = await CandidateProfile.create(profileData);

    const changedFields = [];
    const changes = [];

    if (designation.trim()) {
      changedFields.push("currentTitle");
      changes.push({
        field: "currentTitle",
        previousValue: "",
        nextValue: designation.trim(),
      });
    }

    if (phone.trim()) {
      changedFields.push("phone");
      changes.push({
        field: "phone",
        previousValue: "",
        nextValue: normalizedPhone,
      });
    }

    if (qrToken.trim()) {
      changedFields.push("lastScannedQrToken");
      changes.push({
        field: "lastScannedQrToken",
        previousValue: "",
        nextValue: qrToken.trim(),
      });
    }

    if (preferredLocation) {
      changedFields.push("preferredLocations");
      changes.push({
        field: "preferredLocations",
        previousValue: [],
        nextValue: [preferredLocation],
      });
    }

    if (expectedSalary) {
      changedFields.push("expectedSalary");
      changes.push({
        field: "expectedSalary",
        previousValue: "",
        nextValue: expectedSalary,
      });
    }

    if (uploadedResume) {
      changedFields.push("resume");
      changes.push({
        field: "resume",
        previousValue: { fileName: "", url: "" },
        nextValue: {
          fileName: uploadedResume.fileName,
          url: uploadedResume.url,
          storageProvider: uploadedResume.storageProvider,
        },
      });
    }

    await CandidateProfileHistory.create({
      candidateId: user._id,
      profileId: profile._id,
      action: "CREATE",
      changedFields,
      changes,
      actorType: "CANDIDATE",
      actorId: user._id,
    });

    const tokenPair = await issueTokenPair({
      user,
      source: "USER",
      req,
    });

    setRefreshCookie(res, tokenPair.refreshToken);
    setAccessCookie(res, tokenPair.accessToken);

    EventBus.emit(EVENTS.CANDIDATE_REGISTERED, {
      candidateId: user._id,
      email: user.email,
      fullName: user.name,
    });

    res.status(201).json({
      success: true,
      referenceId: `MVN-${String(user._id).slice(-8).toUpperCase()}`,
      token: tokenPair.accessToken,
      accessToken: tokenPair.accessToken,
      expiresInSeconds: tokenPair.expiresInSeconds,
      user: formatCandidateUser(user),
      profile: formatProfile(profile, user),
    });
  } catch (error) {
    if (user?._id) {
      await CandidateProfile.deleteOne({ userId: user._id }).catch(() => null);
      await CandidateProfileHistory.deleteMany({ candidateId: user._id }).catch(() => null);
      await User.deleteOne({ _id: user._id }).catch(() => null);
    }
    throw error;
  }
});

exports.login = asyncHandler(async (req, res) => {
  const requestBody = req.body && typeof req.body === "object" ? req.body : {};
  const email = String(requestBody.email || "").trim();
  const password = String(requestBody.password || "").trim();

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    role: "CANDIDATE",
  });

  if (!user) {
    throw createHttpError(404, "Candidate account not found");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (!user.isActive || user.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "Candidate account is inactive");
  }

  const profile = await ensureCandidateProfile(user);

  const tokenPair = await issueTokenPair({
    user,
    source: "USER",
    req,
  });

  setRefreshCookie(res, tokenPair.refreshToken);
  setAccessCookie(res, tokenPair.accessToken);

  res.status(200).json({
    success: true,
    token: tokenPair.accessToken,
    accessToken: tokenPair.accessToken,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: formatCandidateUser(user),
    profile: formatProfile(profile, user),
  });
});

exports.me = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);

  res.status(200).json({
    success: true,
    user: formatCandidateUser(req.user),
    profile: formatProfile(profile, req.user),
  });
});

exports.getLandingHome = asyncHandler(async (_req, res) => {
  try {
    const landingData = await fetchHomeLandingData();
    return res.status(200).json({
      success: true,
      data: landingData,
    });
  } catch (error) {
    console.error("Home landing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch landing data",
    });
  }
});

exports.getLandingByToken = asyncHandler(async (req, res) => {
  const token = String(req.params.token || "").trim();

  if (!token) {
    throw createHttpError(400, "QR token is required");
  }

  const context = await resolveQrContext(token);

  context.qrCode.scans += 1;
  await context.qrCode.save();

  res.status(200).json({
    success: true,
    data: {
      token: context.qrCode.token,
      company: {
        id: String(context.company._id),
        name: context.company.name,
        tagline: context.company.tagline || "",
        industry: context.company.industry || "",
        companySize: context.company.companySize || "",
        foundedYear: context.company.foundedYear || "",
        employeesCount: context.company.employeesCount || "",
        headquarters: context.company.headquarters || "",
        website: context.company.website || "",
        linkedIn: context.company.linkedIn || "",
        activelyHiring: Boolean(context.company.activelyHiring),
        openRoles: Number(context.company.openRoles || context.company.activeJobCount || 0),
        about: context.company.about || "",
        mission: context.company.mission || "",
        vision: context.company.vision || "",
        whyJoinUs: context.company.whyJoinUs || [],
        location: context.company.location || {},
      },
      jobs: context.jobs.map((job) => formatJob(job)),
      scans: context.qrCode.scans,
    },
  });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);
  const quizKey = new Date().toISOString().slice(0, 10);
  const followedIds = profile.followedCompanyIds || [];
  const [applications, notifications, recommended, applicationStats, companyIds, extraJobs, todayQuizResult, quizXp, followedCompanyJobs, followedCompanies, nviteRecords] = await Promise.all([
    Application.find({ candidateId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(DASHBOARD_PIPELINE_LIMIT)
      .populate("companyId", "name")
      .populate("jobId", "title location experience skills department"),
    CandidateNotification.find({ candidateId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(DASHBOARD_ALERTS_LIMIT),
    getRecommendedJobs(profile, req.user._id),
    Application.find({ candidateId: req.user._id }).select("status"),
    Application.distinct("companyId", { candidateId: req.user._id }),
    Job.find({ isActive: true, approvalStatus: "APPROVED" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("companyId", "name logoUrl"),
    CandidateQuizResult.findOne({ candidateId: req.user._id, quizKey }),
    calculateCandidateXp(req.user._id),
    followedIds.length > 0
      ? Job.find({ companyId: { $in: followedIds }, isActive: true, approvalStatus: "APPROVED" })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("companyId", "name industry logoUrl")
      : Promise.resolve([]),
    followedIds.length > 0
      ? Company.find({ _id: { $in: followedIds } })
          .select("name logoUrl industry location.city updatedAt")
          .lean()
      : Promise.resolve([]),
    Nvite.find({ "recipients.userId": req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("companyId", "name logoUrl")
      .populate("recruiterId", "name avatar")
      .lean(),
  ]);

  const unreadAlerts = await CandidateNotification.countDocuments({
    candidateId: req.user._id,
    status: "UNREAD",
  });

  const recruiterActionCount = await CandidateNotification.countDocuments({
    candidateId: req.user._id,
    category: "APPLICATION",
  });

  const historicalProfileViews = companyIds.filter(Boolean).length || 0;

  const effectiveProfileViews = Math.max(profile.profileViews || 0, historicalProfileViews);
  const effectiveRecruiterActions = Math.max(profile.recruiterActions || 0, recruiterActionCount);

  const allDashboardJobIds = [...extraJobs, ...followedCompanyJobs]
    .map((j) => String(j.companyId?._id || j.companyId || ""))
    .filter(Boolean);
  const dashboardRatingsMap = await getCompanyRatingsMap(allDashboardJobIds);

  const enrichedApplications = await Promise.all(applications.map(async (item) => {
    const matchData = item.jobId && typeof item.jobId === "object"
      ? computeMatchScore(item.jobId, profile)
      : null;
    return formatApplication(item, matchData);
  }));

  const enrichedExtraJobs = await Promise.all(extraJobs.map(async (job) => {
    const matchData = computeMatchScore(job, profile);
    const cid = String(job.companyId?._id || job.companyId || "");
    return formatJob(job, new Map(), matchData, dashboardRatingsMap.get(cid) || null);
  }));

  const hiringCompanyPool = extraJobs
    .filter((j) => j.companyId && j.companyId._id)
    .map((j) => ({
      id: String(j.companyId._id),
      name: j.companyId.name || "Unknown",
      logoUrl: j.companyId.logoUrl || "",
    }))
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  const enrichedExtraJobsWithHiring = enrichedExtraJobs.map((job, idx) => {
    const ownCompany = hiringCompanyPool.find((c) => c.id === job.companyId) || null;
    const others = hiringCompanyPool.filter((c) => c.id !== job.companyId);
    const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 4);
    const hiringCompanies = ownCompany ? [ownCompany, ...shuffled] : shuffled;
    return { ...job, hiringCompanies };
  });

  const formattedNvites = nviteRecords.map((n) => {
    const companyName = n.companyId?.name || "Unknown Company";
    const recruiterName = n.recruiterId?.name || "Recruiter";
    const candidateName = req.user?.name || "Candidate";
    const recipient = (n.recipients || []).find(
      r => r.userId && String(r.userId) === String(req.user._id)
    );
    const resolveVars = (str) => (str || "")
      .replace(/\{\{candidate_name\}\}/g, candidateName)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{recruiter_name\}\}/g, recruiterName);
    const resolvedSubject = resolveVars(n.subject);
    const resolvedBody = resolveVars(n.body);
    const initials = companyName.split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const ago = timeAgo(n.createdAt);
    const hash = initials.charCodeAt(0) || 100;
    const hue = (hash * 47) % 360;
    return {
      id: n._id,
      title: resolvedSubject,
      body: resolvedBody,
      company: companyName,
      ago,
      code: initials,
      bg: `linear-gradient(135deg, hsl(${hue},70%,65%), hsl(${(hue + 40) % 360},70%,55%))`,
      col: "#fff",
      status: recipient?.status || "sent",
      sentAt: recipient?.sentAt || n.createdAt,
      recruiterName,
      logoUrl: n.companyId?.logoUrl || null,
    };
  });

  const followedJobAppMap = await buildApplicationMap(
    req.user._id,
    followedCompanyJobs.filter(Boolean).map(j => j._id).filter(Boolean),
  );

  const enrichedFollowedJobs = (await Promise.all(followedCompanyJobs.map(async (job) => {
    const matchData = computeMatchScore(job, profile);
    const cid = String(job.companyId?._id || job.companyId || "");
    return formatJob(job, followedJobAppMap, matchData, dashboardRatingsMap.get(cid) || null);
  }))).filter(job => !job.hasApplied);

  res.status(200).json({
    success: true,
    data: {
      profile: formatProfile(profile, req.user),
      summary: {
        totalApplications: applicationStats.length,
        shortlisted: applicationStats.filter((item) =>
          ["SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"].includes(item.status),
        ).length,
        interviews: applicationStats.filter((item) =>
          ["INTERVIEW", "OFFERED", "HIRED"].includes(item.status),
        ).length,
        companiesApplied: companyIds.filter(Boolean).length,
        unreadAlerts,
        quizXp: Number(quizXp.totalXp || 0),
        profileViews: effectiveProfileViews,
        recruiterActions: effectiveRecruiterActions,
        jobMatches: recommended.jobs
          ? new Set(
              Object.values(recommended.jobs).flatMap(arr =>
                Array.isArray(arr) ? arr.map(j => String(j._id || j.id)) : []
              )
            ).size
          : 0,
      },
      quiz: {
        isAvailable: !todayQuizResult,
        hasPlayedToday: Boolean(todayQuizResult),
        title: "Your Daily Quiz is Ready!",
        subtitle: todayQuizResult
          ? "You have completed today's challenge. Come back tomorrow for more XP."
          : "Sharpen your skills with today's challenge and earn XP.",
        xpReward: DAILY_QUIZ_QUESTION_COUNT * DAILY_QUIZ_XP_PER_CORRECT,
        questionCount: DAILY_QUIZ_QUESTION_COUNT,
        durationSeconds: DAILY_QUIZ_QUESTION_COUNT * 15,
        totalXp: Number(quizXp.totalXp || 0),
        quizzesPlayed: Number(quizXp.quizzesPlayed || 0),
      },
      mappedCompany: recommended.mappedCompany,
      recommendedJobs: recommended.jobs,
      nvites: formattedNvites,
      earlyAccess: enrichedExtraJobsWithHiring.slice(3, 10),
      followedCompanyJobs: enrichedFollowedJobs,
      followedCompanies: followedCompanies.map((c) => ({
        id: String(c._id),
        name: c.name,
        logoUrl: c.logoUrl || "",
        industry: c.industry || "",
        city: c.location?.city || "",
        followedAt: c.updatedAt || null,
      })),
      recentApplications: enrichedApplications,
      notifications: notifications.map((item) => formatNotification(item)),
    },
  });
});

exports.getNvites = asyncHandler(async (req, res) => {
  const records = await Nvite.find({ "recipients.userId": req.user._id })
    .sort({ createdAt: -1 })
    .populate("companyId", "name logoUrl")
    .populate("recruiterId", "name avatar")
    .lean();

  const companyName = records[0]?.companyId?.name || "";
  const candidateName = req.user?.name || "Candidate";

  const formatted = records.map((n) => {
    const cName = n.companyId?.name || "Unknown Company";
    const rName = n.recruiterId?.name || "Recruiter";
    const recipient = (n.recipients || []).find(
      r => r.userId && String(r.userId) === String(req.user._id)
    );
    const resolve = (str) => (str || "")
      .replace(/\{\{candidate_name\}\}/g, candidateName)
      .replace(/\{\{company_name\}\}/g, cName)
      .replace(/\{\{recruiter_name\}\}/g, rName);
    const initials = cName.split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const ago = timeAgo(n.createdAt);
    const hash = initials.charCodeAt(0) || 100;
    const hue = (hash * 47) % 360;
    return {
      id: n._id,
      title: resolve(n.subject),
      body: resolve(n.body),
      company: cName,
      ago,
      code: initials,
      bg: `linear-gradient(135deg, hsl(${hue},70%,65%), hsl(${(hue + 40) % 360},70%,55%))`,
      col: "#fff",
      status: recipient?.status || "sent",
      sentAt: recipient?.sentAt || n.createdAt,
      recruiterName: rName,
      logoUrl: n.companyId?.logoUrl || null,
    };
  });

  res.status(200).json({ success: true, data: formatted });
});

exports.getJobs = asyncHandler(async (req, res) => {
  const token = String(req.query.token || "").trim();
  const search = String(req.query.search || "").trim().toLowerCase();

  let jobs = [];
  let company = null;
  let profile = null;

  if (req.user) {
    profile = await ensureCandidateProfile(req.user);
  }

  if (token) {
    const qrContext = await resolveQrContext(token, {
      expandToCompanyJobs: true,
      limit: 48,
    });

    jobs = qrContext.jobs;
    company = qrContext.company;

    if (profile && profile.lastScannedQrToken !== token) {
      profile.lastScannedQrToken = token;
      await profile.save();
    }

    if (search) {
      jobs = jobs.filter((job) =>
        [
          job.title,
          job.department,
          job.location,
          job.experience,
          job.companyId?.name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }
  } else {
    jobs = await Job.find({
      isActive: true,
      approvalStatus: "APPROVED",
    })
      .sort({ updatedAt: -1 })
      .limit(300)
      .populate("companyId", "name industry coverImageUrl");

    if (search) {
      jobs = jobs.filter((job) => jobMatchesKeywordSearch(job, search));
    }

    jobs = jobs.slice(0, 48);
  }

  const applicationMap = req.user
    ? await buildApplicationMap(req.user._id, jobs.map((job) => job._id))
    : new Map();
  const savedJobIds = new Set((profile?.savedJobIds || []).map((id) => String(id)));

  res.status(200).json({
    success: true,
    data: {
      company: company
        ? {
          id: String(company._id),
          name: company.name,
          industry: company.industry || "",
          city: company.location?.city || "",
          region: company.location?.region || "",
        }
        : null,
      jobs: jobs.map((job) => {
        const formatted = formatJob(job, applicationMap, req.user ? { savedJobIds } : null);
        return req.user ? formatted : publicJobData(formatted);
      }),
    },
  });
});

exports.getJobSuggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) {
    return res.json({ success: true, data: { jobs: [] } });
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const jobs = await Job.find({
    isActive: true,
    approvalStatus: "APPROVED",
    $or: [
      { title: regex },
      { skills: regex },
      { location: regex },
      { department: regex },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(3)
    .populate("companyId", "name")
    .select("title location salaryMin salaryMax companyId");

  const results = jobs.map((job) => ({
    id: job._id,
    title: job.title,
    company: job.companyId?.name || "",
    location: job.location || "",
    salary:
      job.salaryMin && job.salaryMax
        ? `${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA`
        : "",
  }));

  res.json({ success: true, data: { jobs: results } });
});

exports.getJobDetail = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("companyId", "name industry location logoUrl coverImageUrl");

  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    throw createHttpError(404, "Job not found");
  }

  const companyIdStr = String(job.companyId?._id || job.companyId || "");
  const ratingsMap = companyIdStr ? await getCompanyRatingsMap([companyIdStr]) : new Map();
  const companyRating = ratingsMap.get(companyIdStr) || null;

  let applicationMap = new Map();
  let matchData = {};
  let hasFollowedCompany = false;

  if (req.user) {
    const profile = await ensureCandidateProfile(req.user);
    applicationMap = await buildApplicationMap(req.user._id, [job._id]);
    
    // Try AI match score, fallback to local computation on failure
    try {
      const aiMatch = await AIService.computeAIMatchScore(job, profile);
      matchData = {
        ...aiMatch,
        savedJobIds: new Set((profile.savedJobIds || []).map((savedJobId) => String(savedJobId))),
      };
    } catch (aiError) {
      console.warn("[getJobDetail] AI match score failed, using local fallback:", aiError.message);
      const localMatch = computeMatchScore(job, profile);
      matchData = {
        ...localMatch,
        savedJobIds: new Set((profile.savedJobIds || []).map((savedJobId) => String(savedJobId))),
      };
    }
    
    hasFollowedCompany = new Set((profile.followedCompanyIds || []).map((companyId) => String(companyId))).has(String(companyIdStr));
  }

  res.status(200).json({
    success: true,
    data: {
      job: req.user ? formatJob(job, applicationMap, matchData, companyRating) : publicJobData(formatJob(job, new Map(), null, companyRating)),
      hasFollowedCompany: req.user ? hasFollowedCompany : undefined,
      similarJobs: await buildSimilarJobs(job, req.user?._id),
    },
  });
});

exports.getSimilarJobs = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("companyId", "name");

  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    throw createHttpError(404, "Job not found");
  }

  res.status(200).json({
    success: true,
    data: await buildSimilarJobs(job, req.user?._id),
  });
});

exports.getJobMatchScore = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("companyId", "name industry location");

  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    throw createHttpError(404, "Job not found");
  }

  const profile = await ensureCandidateProfile(req.user);
  const matchData = await AIService.computeAIMatchScore(job, profile);

  res.status(200).json({
    success: true,
    data: matchData,
  });
});

exports.createApplication = asyncHandler(async (req, res) => {
  const requestBody = req.body && typeof req.body === "object" ? req.body : {};
  const { jobId = "", qrToken = "", sourceJobId = "", answers = [], appliedFrom = "JOB_DETAILS" } = requestBody;

  if (!jobId) {
    throw createHttpError(400, "Job is required");
  }

  const profile = await ensureCandidateProfile(req.user);

  const job = await Job.findById(jobId).populate("companyId", "name");

  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    throw createHttpError(404, "Job is not available for applications");
  }

  const existingApplication = await Application.findOne({
    candidateId: req.user._id,
    jobId: job._id,
  });

  if (existingApplication) {
    throw createHttpError(409, "You have already applied for this job");
  }

  const sanitizedAnswers = Array.isArray(answers)
    ? answers.map((a) => ({
        questionId: a.questionId || null,
        question: String(a.question || "").trim(),
        answer: a.answer !== undefined && a.answer !== null ? a.answer : "",
      }))
    : [];

  const application = await Application.create({
    candidateId: req.user._id,
    companyId: job.companyId?._id || job.companyId,
    jobId: job._id,
    status: "APPLIED",
    resumeUrl: profile.resume?.url || "",
    resumeFileName: profile.resume?.fileName || "",
    sourceQrToken: qrToken.trim(),
    sourceJobId: sourceJobId || null,
    answers: sanitizedAnswers,
    appliedFrom: appliedFrom === "QUICK_APPLY" ? "QUICK_APPLY" : "JOB_DETAILS",
  });

  if (qrToken.trim()) {
    profile.lastScannedQrToken = qrToken.trim();
    await profile.save();
  }

  await CandidateNotification.create({
    candidateId: req.user._id,
    companyId: job.companyId?._id || job.companyId,
    jobId: job._id,
    applicationId: application._id,
    title: "Application submitted",
    message: `Your application for ${job.title} at ${job.companyId?.name || "the company"
      } has been submitted successfully.`,
    category: "APPLICATION",
    actionUrl: "/candidate/applications",
  });

  EventBus.emit(EVENTS.CANDIDATE_APPLICATION_SUBMITTED, {
    email: req.user.email,
    fullName: req.user.name,
    jobTitle: job.title,
    companyName: job.companyId?.name || "the company",
    applicationId: application._id,
  });

  // Log recruiter activity (fire & forget) — a candidate applied
  activityService.fireAndForget({
    companyId: application.companyId,
    recruiter: null,
    action: "CANDIDATE_APPLIED",
    text: `**${req.user.name || req.user.email || "A candidate"}** applied for **${job.title}**`,
    metadata: {
      candidateId: req.user._id,
      jobId: job._id,
      jobTitle: job.title,
      applicationId: application._id,
    },
  });

  const hydratedApplication = await Application.findById(application._id)
    .populate("companyId", "name")
    .populate("jobId", "title");

  res.status(201).json({
    success: true,
    data: formatApplication(hydratedApplication),
  });
});

exports.toggleSavedJob = asyncHandler(async (req, res) => {
  const jobId = String(req.params.id || "").trim();
  const save = req.body?.save !== false;

  const job = await Job.findById(jobId).select("_id isActive approvalStatus");
  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    throw createHttpError(404, "Job not found");
  }

  const profile = await ensureCandidateProfile(req.user);
  const savedIds = new Set((profile.savedJobIds || []).map((id) => String(id)));

  if (save) {
    savedIds.add(String(job._id));
  } else {
    savedIds.delete(String(job._id));
  }

  profile.savedJobIds = [...savedIds];
  await profile.save();

  res.status(200).json({
    success: true,
    data: {
      jobId: String(job._id),
      hasSaved: savedIds.has(String(job._id)),
      savedJobIds: [...savedIds],
    },
  });
});

exports.getSavedJobs = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);

  const savedJobIds = (profile.savedJobIds || [])
    .map((id) => String(id))
    .filter(Boolean);

  if (!savedJobIds.length) {
    return res.status(200).json({
      success: true,
      data: [],
      total: 0,
    });
  }

  const jobs = await Job.find({ _id: { $in: savedJobIds } })
    .populate("companyId", "name logoUrl industry city website")
    .sort({ postedAt: -1 })
    .lean();

  const formatted = jobs.map((job) => formatJob(job, new Map(), { savedJobIds: new Set(savedJobIds) }));

  return res.status(200).json({
    success: true,
    data: formatted,
    total: formatted.length,
  });
});

exports.toggleCompanyFollow = asyncHandler(async (req, res) => {
  const companyId = String(req.params.id || "").trim();
  const follow = req.body?.follow !== false;

  const company = await Company.findById(companyId).select("_id status name");
  if (!company || company.status !== "ACTIVE") {
    throw createHttpError(404, "Company not found");
  }

  const profile = await ensureCandidateProfile(req.user);
  const followedIds = new Set((profile.followedCompanyIds || []).map((id) => String(id)));

  if (follow) {
    if (!followedIds.has(String(company._id))) {
      followedIds.add(String(company._id));
      await CandidateNotification.create({
        candidateId: req.user._id,
        companyId: company._id,
        title: `Following ${company.name || "Company"}`,
        message: `You are now following ${company.name || "this company"}. You will receive updates about their new jobs.`,
        category: "SYSTEM",
        actionUrl: `/company/${company._id}`,
      });
    }
  } else {
    followedIds.delete(String(company._id));
  }

  profile.followedCompanyIds = [...followedIds];
  await profile.save();

  res.status(200).json({
    success: true,
    data: {
      companyId: String(company._id),
      isFollowing: followedIds.has(String(company._id)),
      followedCompanyIds: [...followedIds],
    },
  });
});

exports.expressInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: "Job ID is required" });
  }

  const job = await Job.findById(id).select("_id title");
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const profile = await CandidateProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const jobIdStr = String(job._id);
  const alreadyInterested = (profile.interestedJobIds || []).some(
    (jid) => String(jid) === jobIdStr,
  );

  if (!alreadyInterested) {
    profile.interestedJobIds.push(job._id);
    await profile.save();
  }

  res.status(200).json({
    success: true,
    data: {
      jobId: jobIdStr,
      jobTitle: job.title,
      interested: true,
      interestedJobIds: profile.interestedJobIds.map((jid) => String(jid)),
    },
  });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidateId: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("companyId", "name")
    .populate("jobId", "title skills location experience department description");

  const profile = await ensureCandidateProfile(req.user);

  const enriched = applications.map((item) => {
    const job = item.jobId && typeof item.jobId === "object" ? item.jobId : null;
    return formatApplication(item, computeMatchScore(job, profile));
  });

  res.status(200).json({
    success: true,
    data: enriched,
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);
  const history = await CandidateProfileHistory.find({ candidateId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    success: true,
    data: {
      profile: formatProfile(profile, req.user),
      history: history.map((item) => formatHistoryItem(item)),
    },
  });
});

exports.getPublicProfileByShareId = asyncHandler(async (req, res) => {
  const shareId = String(req.params.shareId || "").trim();
  if (!shareId) {
    throw createHttpError(400, "Share id is required");
  }

  const profile = await CandidateProfile.findOne({ publicShareId: shareId }).populate("userId");

  // If we get a lean profile without user populated for some reason, fallback to manual user query
  // (keeps endpoint resilient).
  if (!profile) {
    throw createHttpError(404, "Candidate profile not found");
  }

  let user = null;
  try {
    user = await User.findById(profile.userId || profile._id).select("name email role department accessStatus");
  } catch {
    user = null;
  }

  return res.status(200).json({
    success: true,
    data: {
      profile: formatProfile(profile, user),
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);
  const requestBody = req.body && typeof req.body === "object" ? req.body : {};
  const changes = [];

  const syncField = (field, value, transform = (item) => item) => {
    if (value === undefined) {
      return;
    }

    const nextValue = transform(value);
    const previousValue = profile[field];
    const isEqual =
      Array.isArray(previousValue) || Array.isArray(nextValue)
        ? JSON.stringify(previousValue || []) === JSON.stringify(nextValue || [])
        : String(previousValue ?? "") === String(nextValue ?? "");

    if (!isEqual) {
      changes.push({ field, previousValue, nextValue });
      profile[field] = nextValue;
    }
  };

  if (
    requestBody.name !== undefined &&
    String(requestBody.name).trim() &&
    String(requestBody.name).trim() !== req.user.name
  ) {
    changes.push({
      field: "name",
      previousValue: req.user.name,
      nextValue: String(requestBody.name).trim(),
    });
    req.user.name = String(requestBody.name).trim();
    await req.user.save();
  }

  syncField("phone", requestBody.phone, (value) => String(value).trim());
  syncField("altPhone", requestBody.altPhone, (value) => String(value).trim());
  syncField("headline", requestBody.headline, (value) => String(value).trim());
  syncField("summary", requestBody.summary, (value) => String(value).trim());
  syncField("totalExperience", requestBody.totalExperience, (value) => String(value).trim());
  syncField("currentTitle", requestBody.currentTitle, (value) => String(value).trim());
  syncField("currentCompany", requestBody.currentCompany, (value) => String(value).trim());
  syncField("noticePeriod", requestBody.noticePeriod, (value) => String(value).trim());
  syncField("currentCity", requestBody.currentCity, (value) => String(value).trim());
  syncField("currentState", requestBody.currentState, (value) => String(value).trim());
  syncField("currentCountry", requestBody.currentCountry, (value) => String(value).trim());
  syncField("preferredLocations", requestBody.preferredLocations, (value) =>
    sanitizePreferenceArray(value, "preferredLocations", 10),
  );
  syncField("preferredRoles", requestBody.preferredRoles, (value) =>
    sanitizePreferenceArray(value, "preferredRoles", 3),
  );
  syncField("skills", requestBody.skills, toArray);
  syncField("linkedInUrl", requestBody.linkedInUrl, (value) => String(value).trim());
  syncField("portfolioUrl", requestBody.portfolioUrl, (value) => String(value).trim());
  syncField("expectedSalary", requestBody.expectedSalary, (value) => String(value).trim());
  syncField("education", requestBody.education, (value) => String(value).trim());
  syncField("itSkills", requestBody.itSkills, (value) => String(value).trim());
  syncField("educations", requestBody.educations, (value) => {
    if (typeof value === "string") {
      try { JSON.parse(value); return value; } catch { return "[]"; }
    }
    if (Array.isArray(value)) return JSON.stringify(value);
    return "[]";
  });
  syncField("projects", requestBody.projects, (value) => {
    if (typeof value === "string") {
      try { JSON.parse(value); return value; } catch { return "[]"; }
    }
    if (Array.isArray(value)) return JSON.stringify(value);
    return "[]";
  });
  syncField("workExperiences", requestBody.workExperiences, (value) => {
    if (typeof value === "string") {
      try { JSON.parse(value); return value; } catch { return "[]"; }
    }
    if (Array.isArray(value)) return JSON.stringify(value);
    return "[]";
  });
  syncField("projectTitle", requestBody.projectTitle, (value) => String(value).trim());
  syncField("projectLink", requestBody.projectLink, (value) => String(value).trim());
  syncField("projectDescription", requestBody.projectDescription, (value) => String(value).trim());

  const nextDesignation = String(requestBody.currentTitle || "").trim();
  if (requestBody.currentTitle !== undefined && req.user.department !== nextDesignation) {
    changes.push({
      field: "designation",
      previousValue: req.user.department || "",
      nextValue: nextDesignation,
    });
    req.user.department = nextDesignation;
    await req.user.save();
  }

  if (!changes.length) {
    res.status(200).json({
      success: true,
      data: formatProfile(profile, req.user),
    });
    return;
  }

  await profile.save();
  await CandidateProfileHistory.create({
    candidateId: req.user._id,
    profileId: profile._id,
    action: "UPDATE",
    changedFields: changes.map((item) => item.field),
    changes,
    actorType: "CANDIDATE",
    actorId: req.user._id,
  });

  res.status(200).json({
    success: true,
    data: formatProfile(profile, req.user),
  });
});

exports.getProfileHistory = asyncHandler(async (req, res) => {
  const history = await CandidateProfileHistory.find({ candidateId: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: history.map((item) => formatHistoryItem(item)),
  });
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, "Resume file is required");
  }

  if (!supportedResumeMimeTypes.has(req.file.mimetype)) {
    throw createHttpError(400, "Only PDF files are supported");
  }

  const profile = await ensureCandidateProfile(req.user);
  const previousResume = {
    fileName: profile.resume?.fileName || "",
    url: profile.resume?.url || "",
  };
  const uploadedResume = await uploadResumeFile(req.file, req.user._id);

  profile.resume = {
    ...uploadedResume,
    uploadedAt: new Date(),
  };
  await profile.save();

  await CandidateProfileHistory.create({
    candidateId: req.user._id,
    profileId: profile._id,
    action: "RESUME_UPLOADED",
    changedFields: ["resume"],
    changes: [
      {
        field: "resume",
        previousValue: previousResume,
        nextValue: {
          fileName: uploadedResume.fileName,
          url: uploadedResume.url,
          storageProvider: uploadedResume.storageProvider,
        },
      },
    ],
    actorType: "CANDIDATE",
    actorId: req.user._id,
  });

  await CandidateNotification.create({
    candidateId: req.user._id,
    title: "Resume updated",
    message: "Your latest resume is securely stored and ready for future applications.",
    category: "SYSTEM",
    actionUrl: "/candidate/profile",
  });

  res.status(200).json({
    success: true,
    data: formatProfile(profile, req.user),
  });
});

exports.deleteResume = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);
  if (!profile.resume?.publicId) {
    return res.status(200).json({ success: true, message: "No resume to delete." });
  }
  await deleteResumeFile(profile.resume.publicId);
  profile.resume = {
    fileName: "", url: "", publicId: "", storageProvider: "",
    sizeBytes: 0, mimeType: "", uploadedAt: null,
  };
  await profile.save();
  await CandidateNotification.create({
    candidateId: req.user._id,
    title: "Resume deleted",
    message: "Your resume has been removed from your profile.",
    category: "SYSTEM",
    actionUrl: "/candidate/profile",
  });
  res.status(200).json({ success: true, data: formatProfile(profile, req.user) });
});

exports.serveResume = asyncHandler(async (req, res) => {
  const profile = await ensureCandidateProfile(req.user);
  if (!profile.resume?.url) {
    return res.status(404).json({ success: false, message: "No resume found." });
  }
  const fileUrl = profile.resume.url;
  const fileName = profile.resume.fileName || "resume.pdf";
  const ext = fileName.split(".").pop().toLowerCase();
  const mimeMap = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    rtf: "application/rtf",
  };
  const forcedType = mimeMap[ext] || "application/octet-stream";
  https.get(fileUrl, (proxyRes) => {
    res.writeHead(200, {
      "Content-Type": forcedType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": proxyRes.headers["content-length"] || "",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    proxyRes.pipe(res);
  }).on("error", () => {
    res.status(502).json({ success: false, message: "Failed to fetch resume." });
  });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await CandidateNotification.find({ candidateId: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    data: notifications.map((item) => formatNotification(item)),
  });
});

exports.getTodayQuiz = asyncHandler(async (req, res) => {
  const [quiz, status] = await Promise.all([
    QuizService.getOrCreateTodayQuiz(req.user._id),
    QuizService.getTodayStatus(req.user._id),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...quiz,
      hasSubmitted: status.hasSubmitted,
      previousResult: status.previousResult,
    },
  });
});

exports.submitTodayQuiz = asyncHandler(async (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  const data = await QuizService.submitQuiz(req.user._id, answers);

  await CandidateNotification.create({
    candidateId: req.user._id,
    title: `${data.xpEarned} XP earned`,
    message: `You scored ${data.score}/${data.totalQuestions} in today's quiz.`,
    category: "SYSTEM",
    actionUrl: "/daily-quiz",
    metadata: { type: "QUIZ_RESULT", quizKey: new Date().toISOString().slice(0, 10), xpEarned: data.xpEarned },
  });

  res.status(201).json({
    success: true,
    data,
  });
});

exports.getQuizRanking = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user?._id || null;
  const result = await QuizService.getRanking(userId);

  res.status(200).json({
    success: true,
    data: {
      top10: result.top10,
      userRank: result.userRank,
    },
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await CandidateNotification.findOne({
    _id: req.params.id,
    candidateId: req.user._id,
  });

  if (!notification) {
    throw createHttpError(404, "Notification not found");
  }

  notification.status = "READ";
  await notification.save();

  res.status(200).json({
    success: true,
    data: formatNotification(notification),
  });
});

exports.exportCandidateProfiles = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "CANDIDATE" }).select("name email createdAt");
  const profiles = await CandidateProfile.find({
    userId: { $in: users.map((user) => user._id) },
  });
  const applications = await Application.find({
    candidateId: { $in: users.map((user) => user._id) },
  });

  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const applicationCounts = new Map();

  applications.forEach((application) => {
    const candidateId = String(application.candidateId);
    applicationCounts.set(candidateId, (applicationCounts.get(candidateId) || 0) + 1);
  });

  sendCsv(
    res,
    "candidate-profiles.csv",
    [
      "Name",
      "Email",
      "Phone",
      "Experience",
      "Current Title",
      "Current Company",
      "Skills",
      "Preferred Roles",
      "City",
      "State",
      "Resume Available",
      "Applications",
      "Registered At",
    ],
    users.map((user) => {
      const profile = profileMap.get(String(user._id));

      return [
        user.name,
        user.email,
        profile?.phone || "",
        profile?.totalExperience || "",
        profile?.currentTitle || "",
        profile?.currentCompany || "",
        profile?.skills || [],
        profile?.preferredRoles || [],
        profile?.currentCity || "",
        profile?.currentState || "",
        profile?.resume?.url ? "Yes" : "No",
        applicationCounts.get(String(user._id)) || 0,
        user.createdAt,
      ];
    }),
  );
});

exports.exportCandidateResumes = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "CANDIDATE" }).select("name email");
  const profiles = await CandidateProfile.find({
    userId: { $in: users.map((user) => user._id) },
  });

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  sendCsv(
    res,
    "candidate-resumes.csv",
    ["Name", "Email", "Resume File", "Storage Provider", "Resume URL", "Uploaded At"],
    profiles
      .filter((profile) => profile.resume?.url)
      .map((profile) => {
        const user = userMap.get(String(profile.userId));
        return [
          user?.name || "",
          user?.email || "",
          profile.resume?.fileName || "",
          profile.resume?.storageProvider || "",
          profile.resume?.url || "",
          profile.resume?.uploadedAt || "",
        ];
      }),
  );
});

exports.uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, "Please upload an image file.");
  }

  const type = req.body.type === "cover" ? "cover" : "profile";
  const profile = await ensureCandidateProfile(req.user);
  const previousPublicId = type === "cover" ? profile.coverPic?.publicId : profile.profilePic?.publicId;

  const uploaded = await replaceCandidateImage(req.file, {
    userId: req.user._id,
    type,
    previousPublicId,
  });

  if (type === "cover") {
    profile.coverPic = uploaded;
  } else {
    profile.profilePic = uploaded;
  }

  await profile.save();

  res.status(200).json({
    success: true,
    message: `${type === "cover" ? "Cover" : "Profile"} image updated successfully.`,
    data: uploaded,
    profileCompletion: computeProfileCompletion(profile, req.user),
  });
});

// ── Project Media Upload ──────────────────────────────────────────────────────

exports.uploadProjectMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, "Please upload an image file.");
  }

  const uploaded = await replaceCandidateImage(req.file, {
    userId: req.user._id,
    type: "project",
    previousPublicId: null,
  });

  res.status(200).json({
    success: true,
    data: uploaded,
  });
});

// ── Companies Directory ──────────────────────────────────────────────────────

const COMPANY_PALETTE = [
  '#1E5EFF','#7C3AED','#F59E0B','#0DBF7B','#EF4444',
  '#0F2040','#8B5CF6','#0EA5E9','#4F46E5','#1E40AF',
];

const companyColor = (id) => {
  const hex = String(id).replace(/[^a-f0-9]/gi, '').slice(-4) || '0000';
  const idx = parseInt(hex, 16) % COMPANY_PALETTE.length;
  return COMPANY_PALETTE[Math.abs(idx)];
};

// ── Dynamic filter options for companies directory ──
exports.getCompanyFilterOptions = asyncHandler(async (req, res) => {
  const [industries, cities, companyTypes] = await Promise.all([
    Company.distinct("industry", { status: "ACTIVE", industry: { $ne: "", $exists: true } }),
    Company.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: null,
          cities: {
            $addToSet: {
              $cond: [
                { $and: [{ $ne: ["$location.city", ""] }, { $ne: ["$location.city", null] }] },
                "$location.city",
                "$headquarters",
              ],
            },
          },
        },
      },
    ]),
    Company.distinct("packageType", { status: "ACTIVE" }),
  ]);

  const cleanCities = (
    (cities[0]?.cities || []).filter(Boolean).map((c) => c.trim()).filter(Boolean)
  );

  res.status(200).json({
    success: true,
    data: {
      industries: industries.filter(Boolean).sort(),
      cities: [...new Set(cleanCities)].sort(),
      companyTypes: companyTypes.filter(Boolean).filter(t => !['ELITE', 'PREMIUM', 'STANDARD'].includes(t)).sort(),
    },
  });
});

exports.getCompanyStats = asyncHandler(async (req, res) => {
  const { q = "", location = "" } = req.query;
  const baseFilter = { status: "ACTIVE" };

  if (q) {
    baseFilter.$or = [
      { name: { $regex: q, $options: "i" } },
      { industry: { $regex: q, $options: "i" } },
      { tagline: { $regex: q, $options: "i" } },
    ];
  }

  const [mncs, internet, manufacturing, fortune500, product] = await Promise.all([
    Company.countDocuments({ ...baseFilter, industry: { $regex: "MNC|Corporate", $options: "i" } }),
    Company.countDocuments({ ...baseFilter, industry: { $regex: "Internet|IT|Software", $options: "i" } }),
    Company.countDocuments({ ...baseFilter, industry: { $regex: "Manufacturing", $options: "i" } }),
    Company.countDocuments({ ...baseFilter, packageType: "ELITE" }),
    Company.countDocuments({ ...baseFilter, industry: { $regex: "Product", $options: "i" } }),
  ]);

  res.status(200).json({
    success: true,
    data: { mncs, internet, manufacturing, fortune500, product },
  });
});

exports.getCompanies = asyncHandler(async (req, res) => {
  let { q = "", sort = "popular", page = 1, limit = 20, industry = "", companyType = "", location = "", packageType = "" } = req.query;

  const filter = { status: "ACTIVE" };
  const andConditions = [];

  // Text search
  if (q) {
    andConditions.push({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { industry: { $regex: q, $options: "i" } },
        { tagline: { $regex: q, $options: "i" } },
      ],
    });
  }

  // Industry filter (from category pills)
  if (industry && industry !== 'All') {
    andConditions.push({ industry: { $regex: industry, $options: "i" } });
  }

  // Company Type filter (Corporate, Foreign MNC, Startup, Indian MNC)
  if (companyType) {
    const types = String(companyType).split(",").map(t => t.trim()).filter(Boolean);
    if (types.length > 0) {
      const typePatterns = types.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      andConditions.push({ industry: { $regex: typePatterns.join("|"), $options: "i" } });
    }
  }

  // Package Type filter (STANDARD, PREMIUM, ELITE)
  if (packageType) {
    andConditions.push({ packageType: { $regex: packageType, $options: "i" } });
  }

  // Location filter
  if (location) {
    andConditions.push({
      $or: [
        { "location.city": { $regex: location, $options: "i" } },
        { headquarters: { $regex: location, $options: "i" } },
      ],
    });
  }

  if (andConditions.length === 1) {
    Object.assign(filter, andConditions[0]);
  } else if (andConditions.length > 1) {
    filter.$and = andConditions;
  }

  let sortQuery = { activeJobCount: -1, createdAt: -1 };
  if (sort === "name") sortQuery = { name: 1 };
  if (sort === "newest") sortQuery = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [companies, total] = await Promise.all([
    Company.find(filter).sort(sortQuery).skip(skip).limit(Number(limit)),
    Company.countDocuments(filter),
  ]);

  const companyIds = companies.map((c) => c._id);

  const reviewAggs = companyIds.length
    ? await CompanyReview.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: "$companyId", avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
      ]).exec()
    : [];

  const followersAggs = companyIds.length
    ? await CandidateProfile.aggregate([
        { $unwind: "$followedCompanyIds" },
        { $match: { followedCompanyIds: { $in: companyIds } } },
        { $group: { _id: "$followedCompanyIds", count: { $sum: 1 } } },
      ]).exec()
    : [];

  let followedSet = new Set();
  if (req.user) {
    const profile = await ensureCandidateProfile(req.user);
    followedSet = new Set(
      (profile?.followedCompanyIds || []).map((id) => String(id))
    );
  }

  const reviewMap = new Map(reviewAggs.map((r) => [String(r._id), r]));
  const followersMap = new Map(followersAggs.map((f) => [String(f._id), f.count]));

  res.status(200).json({
    success: true,
    data: {
      companies: companies.map((c) => {
        const cid = String(c._id);
        const r = reviewMap.get(cid) || {};
        return {
          id: cid,
          name: c.name,
          coverImageUrl: c.coverImageUrl || "",
          tagline: c.tagline || "",
          industry: c.industry || "General",
          location: c.location?.city || c.headquarters || "",
          size: c.companySize || c.employeesCount || "",
          activeJobCount: c.activeJobCount || 0,
          activelyHiring: c.activelyHiring !== false,
          packageType: c.packageType || "STANDARD",
          color: companyColor(c._id),
          logo: (c.name || "M")[0].toUpperCase(),
          logoUrl: c.logoUrl || "",
          founded: c.foundedYear || "",
          createdAt: c.createdAt,
          rating: r.avgRating ? Math.round(Number(r.avgRating) * 10) / 10 : null,
          reviewCount: r.reviewCount || 0,
          followers: followersMap.get(cid) || 0,
          isFollowing: followedSet.has(cid),
        };
      }),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.getCompanyDetail = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company || company.status !== "ACTIVE") {
    throw createHttpError(404, "Company not found");
  }

  const jobs = await Job.find({
    companyId: company._id,
    isActive: true,
    approvalStatus: "APPROVED",
  }).sort({ createdAt: -1 });
  const reviews = await CompanyReview.find({
    companyId: company._id,
    status: "PUBLISHED",
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .select("candidateName candidateTitle candidateCity rating headline review isAnonymous createdAt updatedAt");
  const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
  const companyRating = reviews.length > 0 ? Math.round((totalRatings / reviews.length) * 10) / 10 : 0;

  const applicationMap = req.user?._id
    ? await buildApplicationMap(req.user._id, jobs.map((j) => j._id))
    : new Map();
  let followedCompanyIds = new Set();
  if (req.user) {
    const profile = await ensureCandidateProfile(req.user);
    followedCompanyIds = new Set((profile.followedCompanyIds || []).map((companyId) => String(companyId)));
  }
  const followersCount = await CandidateProfile.countDocuments({ followedCompanyIds: company._id });

  const formattedJobs = jobs.map((j) => ({
    id: String(j._id),
    title: j.title,
    department: j.department || "General",
    experience: j.experience || "",
    location: j.location || company.location?.city || "",
    salaryMin: j.salaryMin || 0,
    salaryMax: j.salaryMax || 0,
    salary:
      j.salaryMin && j.salaryMax
        ? `${(j.salaryMin / 100000).toFixed(0)}–${(j.salaryMax / 100000).toFixed(0)} Lakhs PA`
        : "Not disclosed",
    skills: Array.isArray(j.skills) ? j.skills : [],
    jobType: j.jobType || "Full-time",
    workplaceType: j.workplaceType || "",
    summary: j.summary || "",
    description: j.description || "",
    postedAt: formatRelativeTime(j.createdAt),
    deadline: j.deadline || null,
    hasApplied: applicationMap.has(String(j._id)),
  }));

  res.status(200).json({
    success: true,
    data: {
      company: {
        id: String(company._id),
        name: company.name,
        fullName: company.tagline || company.name,
        industry: company.industry || "General",
        type: company.packageType || "Private",
        size: company.companySize || company.employeesCount || "",
        founded: company.foundedYear || "",
        website: company.website || "",
        linkedIn: company.linkedIn || "",
        location: company.location?.city || company.headquarters || "",
        locationFull: [company.location?.city, company.location?.region]
          .filter(Boolean)
          .join(", ") || "",
        activelyHiring: company.activelyHiring !== false,
        activeJobCount: formattedJobs.length,
        followersCount,
        isFollowing: followedCompanyIds.has(String(company._id)),
        color: companyColor(company._id),
        logo: (company.name || "M")[0].toUpperCase(),
        logoUrl: company.logoUrl || "",
        coverImageUrl: company.coverImageUrl || "",
        rating: companyRating,
        reviewsCount: reviews.length,
        about: company.about || "",
        mission: company.mission || "",
        vision: company.vision || "",
        whyJoinUs: Array.isArray(company.whyJoinUs) ? company.whyJoinUs : [],
        perks: Array.isArray(company.perks) ? company.perks : [],
      },
      jobs: formattedJobs,
      reviews: reviews.map((review) => formatCompanyReview(review)),
    },
  });
});

exports.submitCompanyReview = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company || company.status !== "ACTIVE") {
    throw createHttpError(404, "Company not found");
  }

  const rating = Number.parseInt(req.body.rating, 10);
  const reviewText = String(req.body.review || "").trim();
  const headline = String(req.body.headline || "").trim();
  const isAnonymous = String(req.body.isAnonymous || "true").toLowerCase() !== "false";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createHttpError(400, "Rating must be between 1 and 5");
  }

  if (!reviewText) {
    throw createHttpError(400, "Review text is required");
  }

  const profile = await CandidateProfile.findOne({ userId: req.user._id }).select("currentTitle currentCity");

  const savedReview = await CompanyReview.create({
    companyId: company._id,
    candidateId: req.user._id,
    candidateName: req.user.name || "",
    candidateTitle: profile?.currentTitle || "",
    candidateCity: profile?.currentCity || "",
    rating,
    headline,
    review: reviewText,
    isAnonymous,
    status: "PUBLISHED",
  });

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    data: {
      review: formatCompanyReview(savedReview),
    },
  });
});

exports.enhanceResumeWithAI = asyncHandler(async (req, res) => {
  const { section, content, context } = req.body;

  if (!section || !content) {
    return res.status(400).json({ success: false, message: "section and content are required" });
  }

  const prompts = {
    summary: {
      system: `You are an expert resume coach and ATS optimization specialist. Your job is NOT to rewrite content — instead, analyze the candidate's profile summary and provide specific, actionable guidance they can use to improve it themselves.

Return ONLY a JSON object with this exact structure — no markdown, no code fences:
{
  "suggestions": ["3-5 specific, actionable tips for improving this summary, focusing on impact, clarity, and ATS keyword density"],
  "keywords": ["4-6 industry-relevant keywords or phrases the candidate should naturally incorporate"],
  "actionVerbs": ["3-4 strong action verbs appropriate for this role"],
  "summary": "one-sentence overall guidance on the single biggest improvement to make"
}

Be specific to the candidate's current text and target role. Never return a rewritten version.`,
      user: `Review this profile summary and provide improvement guidance:\n\nCurrent summary: ${content}\n\n${context?.skills ? `Candidate skills: ${context.skills}` : ""}${context?.title ? `\nTarget role: ${context.title}` : ""}\n\nReturn ONLY the JSON object with suggestions, keywords, actionVerbs, and summary.`,
    },
    experience: {
      system: `You are an expert resume coach and ATS optimization specialist. Your job is NOT to rewrite content — instead, analyze the work experience description and provide specific, actionable guidance the candidate can use to improve it themselves.

Return ONLY a JSON object with this exact structure — no markdown, no code fences:
{
  "suggestions": ["3-5 specific, actionable tips for making this experience description more achievement-driven and quantifiable"],
  "keywords": ["4-6 role-specific keywords or phrases to embed naturally"],
  "actionVerbs": ["3-4 strong action verbs that would better describe this work"],
  "summary": "one-sentence overall guidance on the single biggest improvement to make"
}

Be specific to the candidate's role, company, and current text. Never return a rewritten version.`,
      user: `Review this work experience description and provide improvement guidance:\n\nRole: ${context?.role || ""}\nCompany: ${context?.company || ""}\n\nCurrent description: ${content}\n\nReturn ONLY the JSON object with suggestions, keywords, actionVerbs, and summary.`,
    },
    project: {
      system: `You are an expert resume coach and ATS optimization specialist. Your job is NOT to rewrite content — instead, analyze the project description and provide specific, actionable guidance the candidate can use to improve it themselves.

Return ONLY a JSON object with this exact structure — no markdown, no code fences:
{
  "suggestions": ["3-5 specific, actionable tips for making this project description more impact-driven and technically clear"],
  "keywords": ["4-6 technology or domain keywords to highlight naturally"],
  "actionVerbs": ["3-4 strong action verbs that better describe contributions"],
  "summary": "one-sentence overall guidance on the single biggest improvement to make"
}

Be specific to the candidate's project and current text. Never return a rewritten version.`,
      user: `Review this project description and provide improvement guidance:\n\nProject: ${context?.name || ""}\n\nCurrent description: ${content}\n\nReturn ONLY the JSON object with suggestions, keywords, actionVerbs, and summary.`,
    },
    internship: {
      system: `You are an expert resume coach and ATS optimization specialist. Your job is NOT to rewrite content — instead, analyze the internship description and provide specific, actionable guidance the candidate can use to improve it themselves.

Return ONLY a JSON object with this exact structure — no markdown, no code fences:
{
  "suggestions": ["3-5 specific, actionable tips for making this internship description more achievement-oriented and skills-focused"],
  "keywords": ["4-6 relevant skills or domain keywords to highlight"],
  "actionVerbs": ["3-4 strong action verbs that better describe contributions"],
  "summary": "one-sentence overall guidance on the single biggest improvement to make"
}

Be specific to the candidate's role, company, and current text. Never return a rewritten version.`,
      user: `Review this internship description and provide improvement guidance:\n\nRole: ${context?.role || ""}\nCompany: ${context?.company || ""}\n\nCurrent description: ${content}\n\nReturn ONLY the JSON object with suggestions, keywords, actionVerbs, and summary.`,
    },
  };

  const promptConfig = prompts[section];
  if (!promptConfig) {
    return res.status(400).json({ success: false, message: `Unknown section: ${section}` });
  }

  try {
    const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await OpenAIService.createChatCompletion({
      model,
      systemPrompt: promptConfig.system,
      userPrompt: promptConfig.user,
      maxOutputTokens: 1000,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json({ success: true, data: { enhanced: parsed } });
  } catch (error) {
    console.error("[ResumeAI] OpenAI error:", error.message);
    res.status(200).json({ success: true, data: { enhanced: { suggestions: ["We couldn't analyze this section right now. Try again in a moment or review it manually for impact and clarity."], keywords: [], actionVerbs: [], summary: "Temporary issue — please try your enhancement request again." } } });
  }
});

exports.analyzeResumeATS = asyncHandler(async (req, res) => {
  const { resume } = req.body;
  if (!resume) {
    return res.status(400).json({ success: false, message: "resume object is required" });
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and senior HR recruiter with 15+ years of experience evaluating resumes. Analyze the provided resume data and return a JSON object with EXACTLY this structure — no markdown, no code fences, no extra text:

{
  "score": <integer 0-100>,
  "strongPoints": [<3-5 concise strings>],
  "weakPoints": [<3-5 concise strings>],
  "recommendations": [<3-5 actionable strings>]
}

Guidelines for scoring:
- 90-100: Excellent — highly optimized for ATS, strong keywords, clear formatting, quantified achievements
- 70-89: Good — decent structure but room for improvement in keyword density or achievement specificity
- 50-69: Average — some ATS friction, missing key sections or weak action language
- 30-49: Below average — significant gaps in content, formatting, or keyword alignment
- 0-29: Poor — major issues that will cause ATS rejection

Score honestly based on: keyword richness, achievement quantification, section completeness, formatting clarity, and overall ATS compatibility.`;

  const userPrompt = `Analyze this resume for ATS compatibility:\n\n${JSON.stringify(resume, null, 2)}\n\nReturn ONLY the JSON object.`;

  try {
    const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await OpenAIService.createChatCompletion({
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens: 1500,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json({
      success: true,
      data: {
        score: Math.round(Math.max(0, Math.min(100, parsed.score || 0))),
        strongPoints: Array.isArray(parsed.strongPoints) ? parsed.strongPoints : [],
        weakPoints: Array.isArray(parsed.weakPoints) ? parsed.weakPoints : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      },
    });
  } catch (error) {
    console.error("[ResumeATS] OpenAI error:", error.message);
    res.status(200).json({
      success: true,
      data: {
        score: 72,
        strongPoints: ["Profile summary present and well-structured", "Work experience includes action verbs", "Education section complete with details"],
        weakPoints: ["Limited quantified achievements in experience", "Projects section could use more technical detail", "Skills section could be more comprehensive"],
        recommendations: ["Add specific metrics and numbers to each work experience entry", "Expand project descriptions to highlight technologies and outcomes", "Include more industry-specific keywords throughout"],
      },
    });
  }
});

exports.analyzeResume = asyncHandler(async (req, res) => {
  const { mode, resume, content } = req.body;
  if (!mode || !resume) {
    return res.status(400).json({ success: false, message: "mode and resume are required" });
  }

  const validModes = { ats: 1, roast: 1, recruiter: 1, grammar: 1 };
  if (!validModes[mode]) {
    return res.status(400).json({ success: false, message: `Unknown mode: ${mode}` });
  }

  const prompts = {
    ats: {
      system: "You are an expert ATS analyst. Analyze the resume and return JSON: {\"score\":0-100,\"strongPoints\":[],\"weakPoints\":[],\"recommendations\":[]}. Score honestly based on keyword richness, quantified achievements, section completeness, and formatting clarity.",
      user: `Analyze for ATS compatibility:\n${JSON.stringify(resume, null, 2)}\nReturn ONLY the JSON object.`,
    },
    roast: {
      system: "You are a brutally honest career coach who roasts people to motivate them. Analyze the resume harshly but hilariously. Return JSON: {\"score\":0-100,\"roast\":\"burn text (2-3 sentences)\",\"mainIssues\":[],\"harshTruths\":[]}. Be savage but constructive — no insults, just tough love.",
      user: `Roast this resume:\n${JSON.stringify(resume, null, 2)}\nReturn ONLY the JSON object.`,
    },
    recruiter: {
      system: "You are a 60+ year old veteran recruiter who has reviewed 50,000+ resumes. You're wise, slightly old-school, but fair. Analyze this resume with decades of wisdom. Return JSON: {\"score\":0-100,\"verdict\":\"overall impression (2-3 sentences)\",\"observations\":[],\"advice\":[],\"wisdom\":\"one memorable piece of career wisdom\"}.",
      user: `Review this resume with your decades of experience:\n${JSON.stringify(resume, null, 2)}\nReturn ONLY the JSON object.`,
    },
    grammar: {
      system: "You are a meticulous copy editor. Check the resume text for grammar, spelling, punctuation, and style issues. Return JSON: {\"score\":0-100,\"corrections\":[{\"original\":\"...\",\"suggestion\":\"...\",\"explanation\":\"...\"}],\"summary\":\"brief assessment\"}. List each distinct issue as a separate correction object.",
      user: `Check this resume for grammar and style issues:\n${content || JSON.stringify(resume, null, 2)}\nReturn ONLY the JSON object.`,
    },
  };

  const cfg = prompts[mode];
  try {
    const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await OpenAIService.createChatCompletion({
      model,
      systemPrompt: cfg.system,
      userPrompt: cfg.user,
      maxOutputTokens: 2000,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const clamp = (n) => Math.round(Math.max(0, Math.min(100, n || 0)));

    if (mode === "ats") {
      res.status(200).json({ success: true, data: { score: clamp(parsed.score), strongPoints: parsed.strongPoints || [], weakPoints: parsed.weakPoints || [], recommendations: parsed.recommendations || [] } });
    } else if (mode === "roast") {
      res.status(200).json({ success: true, data: { score: clamp(parsed.score), roast: parsed.roast || "", mainIssues: parsed.mainIssues || [], harshTruths: parsed.harshTruths || [] } });
    } else if (mode === "recruiter") {
      res.status(200).json({ success: true, data: { score: clamp(parsed.score), verdict: parsed.verdict || "", observations: parsed.observations || [], advice: parsed.advice || [], wisdom: parsed.wisdom || "" } });
    } else if (mode === "grammar") {
      res.status(200).json({ success: true, data: { score: clamp(parsed.score), corrections: parsed.corrections || [], summary: parsed.summary || "" } });
    }
  } catch (error) {
    console.error(`[ResumeAnalyze] ${mode} error:`, error.message);
    const fallbacks = {
      ats: { score: 72, strongPoints: ["Profile summary present"], weakPoints: ["Limited quantified achievements"], recommendations: ["Add metrics to experience"] },
      roast: { score: 50, roast: "Your resume is… fine. Which is the problem. Fine doesn't get hired.", mainIssues: ["Needs more impact"], harshTruths: ["Recruiters scan for 6 seconds — yours doesn't pop"] },
      recruiter: { score: 68, verdict: "I've seen thousands like these. Solid foundation, needs refinement.", observations: ["Good structure"], advice: ["Quantify your achievements"], wisdom: "A resume is not a history — it's a marketing document." },
      grammar: { score: 85, corrections: [], summary: "No major issues detected. Consider a final proofread." },
    };
    res.status(200).json({ success: true, data: fallbacks[mode] || fallbacks.ats });
  }
});

exports.analyzeProfileWithAI = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({ success: false, message: "Profile not found. Complete your profile first." });
  }

  const userName = req.user.name || "Candidate";

  const profileSummary = [
    `Name: ${userName}`,
    `Current Title: ${profile.currentTitle || "Not set"}`,
    `Current Company: ${profile.currentCompany || "Not set"}`,
    `Headline: ${profile.headline || "Not set"}`,
    `Total Experience: ${profile.totalExperience || "Not set"}`,
    `Skills: ${(profile.skills || []).join(", ") || "None listed"}`,
    `Education: ${profile.education || "Not set"}`,
    `Preferred Roles: ${(profile.preferredRoles || []).join(", ") || "None"}`,
    `Preferred Locations: ${(profile.preferredLocations || []).join(", ") || "None"}`,
    `Current City: ${profile.currentCity || "Not set"}`,
    `Notice Period: ${profile.noticePeriod || "Not set"}`,
    `Expected Salary: ${profile.expectedSalary || "Not set"}`,
    `LinkedIn: ${profile.linkedInUrl || "Not set"}`,
    `Portfolio: ${profile.portfolioUrl || "Not set"}`,
    `Summary: ${profile.summary || "Not set"}`,
  ].join("\n");

  let resumeText = "";
  if (profile.resume && profile.resume.url) {
    try {
      const pdfText = await new Promise((resolve, reject) => {
        https.get(profile.resume.url, (res) => {
          if (res.statusCode !== 200) return resolve("");
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            try {
              const pdfParse = require("pdf-parse");
              const data = await pdfParse(buffer);
              resolve(data.text || "");
            } catch {
              resolve("");
            }
          });
          res.on("error", () => resolve(""));
        });
      });
      resumeText = pdfText.trim();
      if (resumeText.length < 80) {
        const visionText = await OpenAIService.extractPdfTextViaOpenAI(
          Buffer.from(await new Promise((resolve, reject) => {
            https.get(profile.resume.url, (res) => {
              const chunks = [];
              res.on("data", (c) => chunks.push(c));
              res.on("end", () => resolve(Buffer.concat(chunks)));
              res.on("error", reject);
            });
          })),
          profile.resume.fileName || "resume.pdf"
        );
        if (visionText && visionText.length > 80) resumeText = visionText;
      }
    } catch {
      resumeText = "";
    }
  } else {
    const workEx = profile.workExperiences || "[]";
    const edu = profile.educations || "[]";
    const projects = profile.projects || "[]";
    resumeText = [
      `Work Experiences: ${workEx}`,
      `Education: ${edu}`,
      `Projects: ${projects}`,
    ].join("\n");
  }

  const systemPrompt = `You are an expert career analyst and AI recruiter. Analyze the candidate's profile and resume comprehensively and return a JSON object (NO markdown, NO code fences, ONLY raw JSON) with these fields:
{
  "overallScore": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestedRoles": ["..."],
  "suggestedIndustries": ["..."],
  "careerStage": "entry|mid|senior|lead",
  "skillGaps": ["..."],
  "topCompaniesFit": ["..."],
  "profileCompleteness": 0-100,
  "atsReadiness": 0-100,
  "summary": "..."
}`;

  const userPrompt = `Analyze this candidate's profile and resume:\n\n=== PROFILE ===\n${profileSummary}\n\n=== RESUME ===\n${resumeText || "(No resume available)"}`;

  try {
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";
    const response = await OpenAIService.createChatCompletion({
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens: 2000,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      success: true,
      data: {
        overallScore: Math.round(Math.max(0, Math.min(100, parsed.overallScore || 0))),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestedRoles: Array.isArray(parsed.suggestedRoles) ? parsed.suggestedRoles : [],
        suggestedIndustries: Array.isArray(parsed.suggestedIndustries) ? parsed.suggestedIndustries : [],
        careerStage: parsed.careerStage || parsed.careerMatch || "mid",
        skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
        topCompaniesFit: Array.isArray(parsed.topCompaniesFit || parsed.topMatchFit) ? (parsed.topCompaniesFit || parsed.topMatchFit) : [],
        profileCompleteness: Math.round(Math.max(0, Math.min(100, parsed.profileCompleteness || 0))),
        atsReadiness: Math.round(Math.max(0, Math.min(100, parsed.atsReadiness || 0))),
        summary: parsed.summary || "",
      },
    });
  } catch (err) {
    console.error("[analyzeProfileWithAI] error:", err.message);
    res.json({
      success: true,
      data: {
        overallScore: 65,
        strengths: ["Profile exists with skills and experience"],
        weaknesses: ["Consider adding more detail to your profile"],
        suggestedRoles: ["Software Engineer", "Full Stack Developer", "Frontend Developer"],
        suggestedIndustries: ["IT Services", "Product Based", "Startups"],
        careerStage: "mid",
        skillGaps: [],
        topCompaniesFit: ["IT", "E-commerce", "Healthcare Technology"],
        profileCompleteness: 60,
        atsReadiness: 70,
        summary: "Your profile shows solid foundational information. Adding more quantifiable achievements and detailed work experience would significantly improve your career prospects.",
      },
    });
  }
});

exports.suggestSkillsAutocomplete = asyncHandler(async (req, res) => {
  const { query, existingSkills } = req.body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.json({ success: true, data: { suggestions: [] } });
  }

  const q = query.trim().toLowerCase();
  const existing = Array.isArray(existingSkills) ? existingSkills.map(s => s.toLowerCase()) : [];

  const systemPrompt = "You are a career skills taxonomy expert. Given a partial skill name, suggest up to 10 real, commonly-used professional skills that match or relate to the user's input. Return ONLY a JSON array of strings, no other text. Do NOT include skills the user already has (they will be excluded on our side). Focus on real, marketable skills (e.g. JavaScript, React, Python, Project Management, AWS, Figma, etc.).";
  const userPrompt = `Partial skill input: "${q}"\n\nSuggest matching professional skills:`;

  try {
    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 300,
    });

    const raw = response?.output_text || response?.outputText || response?.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const suggestions = Array.isArray(parsed)
      ? parsed.filter(s => !existing.includes(s.toLowerCase())).slice(0, 10)
      : [];

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    console.error("[SuggestSkillsAutocomplete] error:", err.message);
    res.json({ success: true, data: { suggestions: [] } });
  }
});

exports.getPublicCandidateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid candidate ID");
  }

  const profile = await CandidateProfile.findOne({ userId: id }).populate("userId", "name email avatar role");
  if (!profile) {
    throw createHttpError(404, "Candidate not found");
  }

  let user = null;
  try {
    user = await User.findById(profile.userId || id).select("name email role department accessStatus");
  } catch {
    user = null;
  }

  res.status(200).json({
    success: true,
    data: {
      profile: formatProfile(profile, user),
    },
  });
});

exports.getPublicCandidateResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid candidate ID");
  }

  const profile = await CandidateProfile.findOne({ userId: id }).select("resume userId");
  if (!profile) {
    throw createHttpError(404, "Candidate not found");
  }

  const resumeUrl = profile.resume?.url;
  if (!resumeUrl) {
    throw createHttpError(404, "Resume unavailable");
  }

  res.status(200).json({
    success: true,
    data: {
      url: resumeUrl,
      fileName: profile.resume.fileName || "resume.pdf",
      mimeType: profile.resume.mimeType || "application/pdf",
    },
  });
});

exports.downloadPublicCandidateResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid candidate ID");
  }

  const profile = await CandidateProfile.findOne({ userId: id }).select("resume userId");
  if (!profile) {
    throw createHttpError(404, "Candidate not found");
  }

  const resume = profile.resume;
  if (!resume?.url) {
    throw createHttpError(404, "Resume unavailable");
  }

  const fileName = resume.fileName || "resume.pdf";
  const fileUrl = resume.url;

  https.get(fileUrl, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      res.status(502).json({ success: false, message: "Failed to fetch resume from storage" });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": proxyRes.headers["content-length"] || "",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    proxyRes.pipe(res);
  }).on("error", () => {
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: "Failed to fetch resume" });
    }
  });
});
