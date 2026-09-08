const AIService = require("../services/ai/AIService");
const asyncHandler = require("../middleware/async.middleware");

exports.getMatchScore = asyncHandler(async (req, res) => {
  const { jobId, profileId } = req.body;
  if (!jobId) {
    return res.status(400).json({ success: false, message: "jobId is required" });
  }

  const Job = require("../models/Job");
  const CandidateProfile = require("../models/CandidateProfile");

  const job = await Job.findById(jobId).populate("companyId", "name industry location");
  if (!job || !job.isActive || job.approvalStatus !== "APPROVED") {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  let profile;
  if (profileId) {
    profile = await CandidateProfile.findById(profileId);
  } else {
    profile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!profile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const matchData = await AIService.computeAIMatchScore(job, profile);

  res.status(200).json({ success: true, data: matchData });
});

exports.enhanceResume = asyncHandler(async (req, res) => {
  const { profile, resumeText, section } = req.body;
  if (!resumeText || !section) {
    return res.status(400).json({ success: false, message: "resumeText and section are required" });
  }

  const CandidateProfile = require("../models/CandidateProfile");
  let userProfile = profile;
  if (!userProfile) {
    userProfile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!userProfile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const result = await AIService.enhanceResumeWithAI(userProfile, resumeText, section);
  res.status(200).json({ success: true, data: result });
});

exports.analyzeResumeATS = asyncHandler(async (req, res) => {
  const { profile, resumeText } = req.body;
  if (!resumeText) {
    return res.status(400).json({ success: false, message: "resumeText is required" });
  }

  const CandidateProfile = require("../models/CandidateProfile");
  let userProfile = profile;
  if (!userProfile) {
    userProfile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!userProfile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const result = await AIService.analyzeResumeATS(userProfile, resumeText);
  res.status(200).json({ success: true, data: result });
});

exports.analyzeResume = asyncHandler(async (req, res) => {
  const { profile, resumeText, mode = "ats" } = req.body;
  if (!resumeText) {
    return res.status(400).json({ success: false, message: "resumeText is required" });
  }

  const CandidateProfile = require("../models/CandidateProfile");
  let userProfile = profile;
  if (!userProfile) {
    userProfile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!userProfile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const result = await AIService.analyzeResume(userProfile, resumeText, mode);
  res.status(200).json({ success: true, data: result });
});

exports.suggestSkills = asyncHandler(async (req, res) => {
  const { profile, partialSkill } = req.body;

  const CandidateProfile = require("../models/CandidateProfile");
  let userProfile = profile;
  if (!userProfile) {
    userProfile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!userProfile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const result = await AIService.suggestSkillsAutocomplete(userProfile, partialSkill || "");
  res.status(200).json({ success: true, data: result });
});

exports.analyzeProfile = asyncHandler(async (req, res) => {
  const { profile } = req.body;

  const CandidateProfile = require("../models/CandidateProfile");
  let userProfile = profile;
  if (!userProfile) {
    userProfile = await CandidateProfile.findOne({ userId: req.user._id });
  }

  if (!userProfile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }

  const result = await AIService.analyzeProfileWithAI(userProfile);
  res.status(200).json({ success: true, data: result });
});