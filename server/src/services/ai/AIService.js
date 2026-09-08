const crypto = require("crypto");
const OpenAIService = require("../openai/OpenAIService");

class AIService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.activeCount = 0;
    this.maxConcurrency = parseInt(process.env.AI_MAX_CONCURRENCY || "3", 10);
    this.cacheTTL = parseInt(process.env.AI_CACHE_TTL || "3600000", 10);
    this.requestTimeout = parseInt(process.env.AI_REQUEST_TIMEOUT || "120000", 10);
  }

  generateCacheKey(operation, inputs) {
    const hash = crypto
      .createHash("sha256")
      .update(`${operation}:${JSON.stringify(inputs)}`)
      .digest("hex");
    return `${operation}:${hash}`;
  }

  getCached(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async deduplicate(key, factory) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    const promise = factory().finally(() => {
      this.pendingRequests.delete(key);
    });
    this.pendingRequests.set(key, promise);
    return promise;
  }

  async enqueue(task) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeCount >= this.maxConcurrency || this.requestQueue.length === 0) return;

    const { task, resolve, reject } = this.requestQueue.shift();
    this.activeCount++;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI request timeout")), timeoutMs)
      ),
    ]);
  }

  async computeAIMatchScore(job, profile) {
    const cacheKey = this.generateCacheKey("matchScore", {
      jobId: job._id?.toString() || job.id,
      profileId: profile._id?.toString() || profile.id,
      jobUpdatedAt: job.updatedAt,
      profileUpdatedAt: profile.updatedAt,
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
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

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: "You are a precise career match scorer. Respond only with valid JSON.",
            userPrompt: prompt,
            maxOutputTokens: 1000,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const parsed = JSON.parse(cleaned);

        const result = {
          overall: Math.min(100, Math.max(0, Math.round(Number(parsed.overall) || 0))),
          skillMatch: Math.min(100, Math.max(0, Math.round(Number(parsed.skillMatch) || 0))),
          experienceMatch: Math.min(100, Math.max(0, Math.round(Number(parsed.experienceMatch) || 0))),
          locationMatch: Math.min(100, Math.max(0, Math.round(Number(parsed.locationMatch) || 0))),
          roleMatch: Math.min(100, Math.max(0, Math.round(Number(parsed.roleMatch) || 0))),
          matchedSkills: (Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : []).map((s) =>
            s.charAt(0).toUpperCase() + s.slice(1)
          ),
          missingSkills: (Array.isArray(parsed.missingSkills) ? parsed.missingSkills : []).map((s) =>
            s.charAt(0).toUpperCase() + s.slice(1)
          ),
        };

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  async enhanceResumeWithAI(profile, resumeText, section) {
    const cacheKey = this.generateCacheKey("resumeEnhance", {
      profileId: profile._id?.toString() || profile.id,
      section,
      resumeHash: crypto.createHash("sha256").update(resumeText).digest("hex").slice(0, 16),
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
        const prompts = {
          summary: {
            system: "You are an expert resume writer. Return ONLY valid JSON with 'suggestions' (string), 'keywords' (array), 'actionVerbs' (array).",
            user: `Enhance this professional summary for a ${profile.currentTitle || "professional"}:\n\n${resumeText}\n\nReturn JSON with suggestions, keywords, actionVerbs.`,
          },
          experience: {
            system: "You are an expert resume writer. Return ONLY valid JSON with 'suggestions' (string), 'keywords' (array), 'actionVerbs' (array).",
            user: `Improve these experience bullets for a ${profile.currentTitle || "professional"}:\n\n${resumeText}\n\nReturn JSON with suggestions, keywords, actionVerbs.`,
          },
          skills: {
            system: "You are an expert resume writer. Return ONLY valid JSON with 'suggestions' (string), 'keywords' (array), 'actionVerbs' (array).",
            user: `Optimize these skills for a ${profile.currentTitle || "professional"} role:\n\n${resumeText}\n\nReturn JSON with suggestions, keywords, actionVerbs.`,
          },
        };

        const promptConfig = prompts[section];
        if (!promptConfig) throw new Error(`Unknown section: ${section}`);

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: promptConfig.system,
            userPrompt: promptConfig.user,
            maxOutputTokens: 1500,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const result = JSON.parse(cleaned);

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  async analyzeResumeATS(profile, resumeText) {
    const cacheKey = this.generateCacheKey("atsScore", {
      profileId: profile._id?.toString() || profile.id,
      resumeHash: crypto.createHash("sha256").update(resumeText).digest("hex").slice(0, 16),
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
        const prompt = `You are an ATS (Applicant Tracking System) analyzer. Score this resume for ATS compatibility.

CANDIDATE: ${profile.currentTitle || "Professional"} - ${profile.currentCompany || "Company"}
EXPERIENCE: ${profile.totalExperience || "N/A"} years
SKILLS: ${(profile.skills || []).join(", ")}

RESUME TEXT:
${resumeText.slice(0, 4000)}

Return ONLY valid JSON:
{
  "atsScore": 0-100,
  "issues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["rec1", "rec2"],
  "keywordMatch": 0-100,
  "formatScore": 0-100,
  "readabilityScore": 0-100
}`;

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: "You are a precise ATS analyzer. Respond only with valid JSON.",
            userPrompt: prompt,
            maxOutputTokens: 1500,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const result = JSON.parse(cleaned);

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  async analyzeResume(profile, resumeText, mode = "ats") {
    const cacheKey = this.generateCacheKey("resumeAnalysis", {
      profileId: profile._id?.toString() || profile.id,
      mode,
      resumeHash: crypto.createHash("sha256").update(resumeText).digest("hex").slice(0, 16),
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
        const prompts = {
          ats: {
            system: "You are an ATS analyzer. Return ONLY valid JSON with: score, issues[], strengths[], recommendations[], keywordMatch, formatScore, readabilityScore.",
            user: `Analyze this resume for ATS compatibility:\n\n${resumeText.slice(0, 4000)}`,
          },
          roast: {
            system: "You are a witty but constructive resume roaster. Return ONLY valid JSON with: roast (string), score (0-100).",
            user: `Roast this resume:\n\n${resumeText.slice(0, 4000)}`,
          },
          recruiter: {
            system: "You are a recruiter reviewing a resume. Return ONLY valid JSON with: feedback (string), score (0-100), hireability (string).",
            user: `Review this resume from a recruiter perspective:\n\n${resumeText.slice(0, 4000)}`,
          },
          grammar: {
            system: "You are a grammar and style checker. Return ONLY valid JSON with: corrections (array of {original, corrected}), score (0-100).",
            user: `Check grammar and style:\n\n${resumeText.slice(0, 4000)}`,
          },
        };

        const promptConfig = prompts[mode];
        if (!promptConfig) throw new Error(`Unknown mode: ${mode}`);

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: promptConfig.system,
            userPrompt: promptConfig.user,
            maxOutputTokens: 1500,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const result = JSON.parse(cleaned);

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  async suggestSkillsAutocomplete(profile, partialSkill) {
    const cacheKey = this.generateCacheKey("skillSuggest", {
      profileId: profile._id?.toString() || profile.id,
      partial: partialSkill.toLowerCase(),
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
        const prompt = `Suggest 10 relevant skills for a ${profile.currentTitle || "professional"} with ${profile.totalExperience || "N/A"} years experience, based on partial input: "${partialSkill}".
        
Current skills: ${(profile.skills || []).join(", ")}
Preferred roles: ${(profile.preferredRoles || []).join(", ")}

Return ONLY valid JSON array of strings: ["skill1", "skill2", ...]`;

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: "You are a skill suggestion engine. Respond only with valid JSON array of strings.",
            userPrompt: prompt,
            maxOutputTokens: 500,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const result = JSON.parse(cleaned);

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  async analyzeProfileWithAI(profile) {
    const cacheKey = this.generateCacheKey("profileAnalysis", {
      profileId: profile._id?.toString() || profile.id,
      profileHash: crypto.createHash("sha256").update(JSON.stringify(profile)).digest("hex").slice(0, 16),
    });

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    return this.deduplicate(cacheKey, async () => {
      return this.enqueue(async () => {
        const prompt = `Analyze this candidate profile and provide career insights:

TITLE: ${profile.currentTitle || "N/A"}
COMPANY: ${profile.currentCompany || "N/A"}
EXPERIENCE: ${profile.totalExperience || "N/A"} years
LOCATION: ${profile.currentCity || "N/A"}
SKILLS: ${(profile.skills || []).join(", ")}
PREFERRED ROLES: ${(profile.preferredRoles || []).join(", ")}
PREFERRED LOCATIONS: ${(profile.preferredLocations || []).join(", ")}
SUMMARY: ${(profile.summary || "").slice(0, 500)}
EDUCATION: ${profile.education || "N/A"}

Return ONLY valid JSON with:
{
  "careerTrajectory": "string",
  "skillGaps": ["skill1", "skill2"],
  "recommendedRoles": ["role1", "role2"],
  "recommendedSkills": ["skill1", "skill2"],
  "marketDemand": "high|medium|low",
  "salaryRange": "string",
  "nextSteps": ["step1", "step2"]
}`;

        const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
        const response = await this.executeWithTimeout(
          OpenAIService.createChatCompletion({
            model,
            systemPrompt: "You are a career analyst. Respond only with valid JSON.",
            userPrompt: prompt,
            maxOutputTokens: 1500,
          }),
          this.requestTimeout
        );

        const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
        const result = JSON.parse(cleaned);

        this.setCache(cacheKey, result);
        return result;
      });
    });
  }

  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      queueLength: this.requestQueue.length,
      activeCount: this.activeCount,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

module.exports = new AIService();