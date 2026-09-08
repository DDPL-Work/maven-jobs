const CandidateProfile = require("../../models/CandidateProfile");
const Job = require("../../models/Job");
const Company = require("../../models/Company");
const CandidateNotification = require("../../models/CandidateNotification");
const ChatBotThread = require("../../models/ChatBotThread");
const OpenAIService = require("./OpenAIService");

const MATCH_THRESHOLD = 60;
const MAX_PRE_FILTER = 40;
const MAX_FINAL_RESULTS = 1;

const normalizeStr = (v) => String(v || "").trim().toLowerCase();

const parseExperienceRange = (exp) => {
  if (!exp) return { min: 0, max: 99 };
  const s = String(exp).replace(/\s+/g, "").toLowerCase();
  const nums = s.match(/\d+(\.\d+)?/g);
  if (!nums) return { min: 0, max: 99 };
  if (nums.length === 1) return { min: 0, max: parseFloat(nums[0]) };
  return { min: parseFloat(nums[0]), max: parseFloat(nums[1]) };
};

const computeMatchScore = (job, profile) => {
  if (!job || !profile) return 0;

  let profileSkills = (Array.isArray(profile.skills) ? profile.skills : []).map(normalizeStr).filter(Boolean);
  if (profileSkills.length === 0 && profile.itSkills) {
    profileSkills = String(profile.itSkills).split(/[,;|/]/).map(normalizeStr).filter(Boolean);
  }

  const jobSkills = (Array.isArray(job.skills) ? job.skills : []).map(normalizeStr).filter(Boolean);

  const matchedSkills = jobSkills.filter(js => profileSkills.some(ps => ps.includes(js) || js.includes(ps)));
  const skillMatch = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : profileSkills.length > 0 ? 50 : 0;

  const jobLoc = normalizeStr(job.location);
  const candidateCity = normalizeStr(profile.currentCity);
  const prefLocs = (profile.preferredLocations || []).map(normalizeStr);
  let locationMatch = 0;
  if (jobLoc) {
    if (candidateCity && jobLoc.includes(candidateCity)) locationMatch = 100;
    else if (prefLocs.some(pl => jobLoc.includes(pl) || pl.includes(jobLoc))) locationMatch = 85;
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
    experienceMatch = Math.max(0, Math.round(100 - (jobExp.min - candidateExp) * 20));
  } else {
    experienceMatch = Math.max(0, Math.round(100 - (candidateExp - jobExp.max) * 10));
  }

  let prefRoles = (profile.preferredRoles || []).map(normalizeStr);
  if (prefRoles.length === 0 && profile.currentTitle) {
    prefRoles = [normalizeStr(profile.currentTitle)];
  }

  const jobTitle = normalizeStr(job.title);
  const jobDept = normalizeStr(job.department);
  let roleMatch = 0;
  if (prefRoles.length > 0) {
    const titleMatch = prefRoles.some(r => jobTitle.includes(r) || r.includes(jobTitle));
    const deptMatch = prefRoles.some(r => jobDept.includes(r) || r.includes(jobDept));
    if (titleMatch) roleMatch = 100;
    else if (deptMatch) roleMatch = 70;
    else roleMatch = 15;
  } else {
    roleMatch = 40;
  }

  return Math.round(skillMatch * 0.35 + locationMatch * 0.15 + experienceMatch * 0.25 + roleMatch * 0.25);
};

class EliteJobMatchService {
  async findMatchesForCandidate(userId) {
    const profile = await CandidateProfile.findOne({ userId }).lean();
    if (!profile) return [];

    const resumeText = await this._getLatestResumeText(userId);

    const allJobs = await Job.find({ isActive: true, approvalStatus: "APPROVED" })
      .populate("companyId", "name logo")
      .sort({ createdAt: -1 })
      .lean();

    let preFiltered = this._preFilterJobs(allJobs, profile);

    if (preFiltered.length === 0) {
      preFiltered = allJobs.slice(0, MAX_PRE_FILTER);
    }

    let scored = await this._aiScoreJobs(preFiltered, profile, resumeText);

    if (scored.length === 0) {
      scored = preFiltered.map(job => ({
        ...job,
        matchScore: computeMatchScore(job, profile),
      }));
    }

    return scored
      .filter(j => j.matchScore >= MATCH_THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_FINAL_RESULTS);
  }

  async _getLatestResumeText(userId) {
    try {
      const thread = await ChatBotThread.findOne({
        userId,
        "metadata.pdfContext.text": { $exists: true, $ne: "" },
      })
        .sort({ lastActivityAt: -1 })
        .select("metadata.pdfContext")
        .lean();

      if (thread?.metadata?.pdfContext?.text) {
        return String(thread.metadata.pdfContext.text).trim();
      }
    } catch {
    }
    return null;
  }

  _preFilterJobs(jobs, profile) {
    const profileSkills = [
      ...(Array.isArray(profile.skills) ? profile.skills.map(normalizeStr) : []),
      ...(profile.itSkills ? String(profile.itSkills).split(/[,;|/]/).map(normalizeStr) : []),
    ].filter(Boolean);

    const uniqueProfileSkills = [...new Set(profileSkills)];

    const candidateExp = parseFloat(profile.totalExperience) || 0;
    const candidateCity = normalizeStr(profile.currentCity);
    const prefLocs = (profile.preferredLocations || []).map(normalizeStr);

    const scored = jobs
      .map(job => {
        let relevanceScore = 0;

        const jobSkills = (Array.isArray(job.skills) ? job.skills : []).map(normalizeStr).filter(Boolean);
        if (jobSkills.length > 0 && uniqueProfileSkills.length > 0) {
          const matched = jobSkills.filter(js =>
            uniqueProfileSkills.some(ps => ps.includes(js) || js.includes(ps))
          );
          relevanceScore += (matched.length / Math.max(jobSkills.length, 1)) * 40;
        }

        const jobExp = parseExperienceRange(job.experience);
        if (candidateExp >= jobExp.min && candidateExp <= jobExp.max + 2) {
          relevanceScore += 20;
        } else if (candidateExp >= jobExp.min - 2 && candidateExp <= jobExp.max + 4) {
          relevanceScore += 10;
        }

        const jobLoc = normalizeStr(job.location);
        if (candidateCity && jobLoc.includes(candidateCity)) relevanceScore += 15;
        else if (prefLocs.some(pl => jobLoc.includes(pl) || pl.includes(jobLoc))) relevanceScore += 12;
        else if (jobLoc.includes("remote")) relevanceScore += 10;
        else relevanceScore += 2;

        if (jobSkills.length === 0 && uniqueProfileSkills.length > 0) relevanceScore += 5;

        return { job, relevanceScore };
      })
      .filter(item => item.relevanceScore > 10)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, MAX_PRE_FILTER)
      .map(item => ({
        _id: item.job._id,
        title: item.job.title,
        company: item.job.companyId?.name || "Unknown",
        companyLogo: item.job.companyId?.logo?.url || "",
        location: item.job.location || "Remote",
        salaryMin: item.job.salaryMin,
        salaryMax: item.job.salaryMax,
        experience: item.job.experience,
        jobType: item.job.jobType,
        workplaceType: item.job.workplaceType,
        skills: item.job.skills,
        department: item.job.department,
        companyId: item.job.companyId?._id || item.job.companyId,
        createdAt: item.job.createdAt,
      }));

    return scored;
  }

  async _aiScoreJobs(jobs, profile, resumeText) {
    if (jobs.length === 0) return [];

    const profileSummary = this._buildProfileSummary(profile, resumeText);
    const jobsList = jobs.map((j, i) => ({
      i,
      t: j.title,
      c: j.company,
      d: j.department || "",
      s: (Array.isArray(j.skills) ? j.skills : []).slice(0, 8),
      l: j.location || "Remote",
      e: j.experience || "",
    }));

    const prompt = `You are a strict career matching AI. Evaluate each job against this candidate.

CANDIDATE PROFILE:
${profileSummary}

JOBS TO EVALUATE (${jobsList.length} total):
${JSON.stringify(jobsList)}

INSTRUCTIONS:
- Return a JSON array with ONE object per job. Every job must be scored.
- score: 0-100 integer. Be strict. 0 = completely wrong field (e.g. CRM for a developer).
- reason: short explanation of the rating.

RATING GUIDELINES:
- 80-100: Strong match — skills, domain, and experience all align
- 60-79: Decent match — partial overlap but reasonable fit
- 40-59: Weak match — some overlap but significant mismatch
- 0-39: Not a match — wrong domain/function entirely

CRITICAL RULES:
- A software developer should NOT get CRM, Sales, HR, Data Entry, or administrative jobs.
- "Communication skills" or "teamwork" alone do NOT make a match.
- Focus on real technical/functional skill overlap.
- Marketing jobs do NOT match engineering profiles.
- Sales jobs do NOT match developer profiles.

Return format:
[
  {"i": 0, "score": 85, "reason": "..."},
  {"i": 1, "score": 12, "reason": "..."},
  ...
]

Return ONLY valid JSON, no other text.`;

    try {
      const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
      const response = await OpenAIService.createChatCompletion({
        model,
        systemPrompt: "You are a precise career matching AI. Respond only with valid JSON.",
        userPrompt: prompt,
        maxOutputTokens: 4000,
      });

      const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
      const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();

      let aiResults;
      try {
        aiResults = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          aiResults = JSON.parse(match[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }

      if (!Array.isArray(aiResults)) throw new Error("AI response is not an array");

      const scoredMap = new Map();
      for (const item of aiResults) {
        if (item && typeof item.i === "number" && typeof item.score === "number") {
          scoredMap.set(item.i, Math.max(0, Math.min(100, Math.round(item.score))));
        }
      }

      const result = [];
      for (const [index, score] of scoredMap) {
        if (index >= 0 && index < jobs.length) {
          result.push({ ...jobs[index], matchScore: score });
        }
      }

      return result;
    } catch (err) {
      console.error("[EliteJobMatchService] AI scoring failed:", err.message);
      return [];
    }
  }

  _buildProfileSummary(profile, resumeText) {
    const parts = [];
    if (profile.currentTitle) parts.push(`Current Title: ${profile.currentTitle}`);
    if (profile.currentCompany) parts.push(`Current Company: ${profile.currentCompany}`);
    if (profile.totalExperience) parts.push(`Total Experience: ${profile.totalExperience}`);
    if (profile.headline) parts.push(`Headline: ${profile.headline}`);
    if (profile.summary) parts.push(`Summary: ${profile.summary}`);

    const skills = Array.isArray(profile.skills) && profile.skills.length > 0
      ? profile.skills.join(", ")
      : profile.itSkills || "";
    if (skills) parts.push(`Skills: ${skills}`);

    if (Array.isArray(profile.preferredRoles) && profile.preferredRoles.length > 0) {
      parts.push(`Preferred Roles: ${profile.preferredRoles.join(", ")}`);
    }
    if (Array.isArray(profile.preferredLocations) && profile.preferredLocations.length > 0) {
      parts.push(`Preferred Locations: ${profile.preferredLocations.join(", ")}`);
    }
    if (profile.currentCity) parts.push(`Current City: ${profile.currentCity}`);
    if (profile.education) parts.push(`Education: ${profile.education}`);
    if (profile.projectDescription) parts.push(`Recent Project: ${profile.projectDescription}`);
    if (profile.projectTitle) parts.push(`Project Title: ${profile.projectTitle}`);
    if (profile.linkedInUrl) parts.push(`LinkedIn: ${profile.linkedInUrl}`);
    if (profile.portfolioUrl) parts.push(`Portfolio: ${profile.portfolioUrl}`);

    if (resumeText) {
      parts.push(`\nResume Content:\n${resumeText.slice(0, 2500)}`);
    }

    return parts.join("\n") || "No profile data available";
  }

  async createMatchNotifications(userId, matchedJobs) {
    const existingAlerts = await CandidateNotification.find({
      candidateId: userId,
      category: "JOB_ALERT",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).select("jobId").lean();

    const existingJobIds = new Set(existingAlerts.map(n => String(n.jobId)));

    const newAlerts = [];
    for (const job of matchedJobs) {
      if (existingJobIds.has(String(job._id))) continue;

      newAlerts.push({
        candidateId: userId,
        companyId: job.companyId,
        jobId: job._id,
        title: "New Job Match for You!",
        message: `Your profile strongly matches "${job.title}" at ${job.company} (${job.matchScore}% match). Apply now!`,
        category: "JOB_ALERT",
        status: "UNREAD",
        actionUrl: `/jobs/${job._id}`,
        metadata: { matchScore: job.matchScore, source: "ELITE_MATCH" },
      });
    }

    if (newAlerts.length > 0) {
      await CandidateNotification.insertMany(newAlerts);
    }

    return newAlerts.length;
  }

  async getMatchedJobs(userId, tierName) {
    if (tierName !== "ELITE") return [];

    const matches = await this.findMatchesForCandidate(userId);
    if (matches.length > 0) {
      await this.createMatchNotifications(userId, matches);
    }

    return matches;
  }
}

module.exports = new EliteJobMatchService();