const OpenAIService = require("./OpenAIService");
const PromptBuilder = require("./PromptBuilder");
const TierManager = require("./TierManager");
const UserContextBuilder = require("./UserContextBuilder");
const ChatBotThread = require("../../models/ChatBotThread");
const ChatBotMessage = require("../../models/ChatBotMessage");
const DailyUsage = require("../../models/DailyUsage");
const EliteJobMatchService = require("./EliteJobMatchService");
const CandidateProfile = require("../../models/CandidateProfile");
const Job = require("../../models/Job");
const Application = require("../../models/Application");
const { PDFParse, VerbosityLevel } = require("pdf-parse");

class ChatBotService {
  async resolveThread({ userId, userRole, threadId, userTier, profileSnapshot }) {
    const nowThreadId =
      threadId && typeof threadId === "string" ? threadId.trim() : "";

    if (nowThreadId) {
      try {
        const existing = await ChatBotThread.findOne({ _id: nowThreadId, userId });
        if (existing) return existing;
      } catch (e) {
        // Invalid ObjectId -> treat as missing
      }
    }

    const tier = userTier || "FREE";

    const created = await ChatBotThread.create({
      userId,
      userRole: userRole || "CLIENT",
      title: "ChatBot",
      userTier: tier,
      profileSnapshot: profileSnapshot || null,
      messageCount: 0,
      lastActivityAt: new Date(),
      metadata: {},
    });

    return created;
  }

  async checkDailyLimit(thread, tier) {
    const limit = (tier && tier.dailyMessageLimit) || 10;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayMessages = await ChatBotMessage.countDocuments({
      threadId: thread._id,
      senderRole: "USER",
      createdAt: { $gte: todayStart },
    });

    if (todayMessages >= limit) {
      const tierName = (tier && tier.name) || "FREE";
      throw new Error(
        `Daily message limit reached for ${tierName} tier (${limit} messages). Please try again tomorrow or upgrade your plan for higher limits.`
      );
    }
  }

  async sendMessage({ threadId, user, text }) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      throw new Error("Message text is required");
    }

    const capabilities = await TierManager.getCapabilities(user);
    const context = await this._buildContext(user, capabilities);

    const profileSnapshot = this._sanitizeForSnapshot(context);
    const userTierName = user.role === "CANDIDATE"
      ? TierManager.resolveCandidateTier(user).name
      : capabilities.name;

    const thread = await this.resolveThread({
      userId: user.id,
      userRole: user.role,
      threadId,
      userTier: userTierName,
      profileSnapshot,
    });

    await this.checkDailyLimit(thread, capabilities);

    const contextWindow = capabilities.contextWindowSize || 5;
    const recentMessages = await ChatBotMessage.find({ threadId: thread._id })
      .sort({ createdAt: -1 })
      .limit(contextWindow)
      .lean();

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => ({
        role: m.senderRole === "USER" ? "user" : "assistant",
        text: m.text,
      }));

    const userMsg = await ChatBotMessage.create({
      threadId: thread._id,
      userId: user.id,
      senderRole: "USER",
      senderId: user.id,
      senderModel: "User",
      type: "TEXT",
      text: trimmed,
      metadata: {
        tier: userTierName,
        role: user.role,
      },
    });

    const systemPrompt = PromptBuilder.systemPrompt({
      role: user.role || "unknown",
      tier: capabilities,
      context,
    });

    let userPrompt = PromptBuilder.buildUserPrompt(trimmed, context);

    // Token-efficient PDF context injection (max ~750 tokens)
    if (thread.metadata && thread.metadata.pdfContext) {
      const pdfText = String(thread.metadata.pdfContext.text || "").trim();
      if (pdfText) {
        userPrompt += `\n\nUploaded Document ("${thread.metadata.pdfContext.fileName}"):\n${pdfText}`;
      }
    }

    let botReply;
    try {
      const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";

      const response = await OpenAIService.createChatCompletion({
        model,
        systemPrompt,
        userPrompt,
        conversationHistory,
        maxOutputTokens: capabilities.maxOutputTokens || 400,
      });

      botReply =
        response?.output_text ||
        response?.output?.[0]?.content?.[0]?.text ||
        response?.output?.[0]?.text ||
        "";
      botReply = String(botReply || "").trim();
    } catch (err) {
      console.error("[ChatBotService] OpenAI error:", err.status, err.message, err.error?.message || "");
      botReply = (await OpenAIService.getSafeChatbotFallbackResponse()).outputText;
    }

    if (!botReply) {
      botReply = (await OpenAIService.getSafeChatbotFallbackResponse()).outputText;
    }

    const botMsg = await ChatBotMessage.create({
      threadId: thread._id,
      userId: user.id,
      senderRole: "BOT",
      senderId: null,
      senderModel: "User",
      type: "TEXT",
      text: botReply,
      metadata: {
        model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || null,
        tier: userTierName,
        role: user.role,
      },
    });

    await ChatBotThread.findByIdAndUpdate(thread._id, {
      $inc: { messageCount: 1 },
      lastActivityAt: new Date(),
    });

    return {
      threadId: String(thread._id),
      userMessage: {
        id: String(userMsg._id),
        role: "USER",
        text: userMsg.text,
        createdAt: userMsg.createdAt,
      },
      botMessage: {
        id: String(botMsg._id),
        role: "BOT",
        text: botMsg.text,
        createdAt: botMsg.createdAt,
      },
      tier: userTierName,
      usage: {
        dailyMessages: await this._getDailyCount(thread._id),
        dailyLimit: capabilities.dailyMessageLimit,
      },
    };
  }

  async listMessages({ threadId, userId, limit = 50 }) {
    const tId = String(threadId || "").trim();
    if (!tId) throw new Error("threadId is required");

    const thread = await ChatBotThread.findOne({ _id: tId, userId });
    if (!thread) throw new Error("Conversation not found");

    const messages = await ChatBotMessage.find({ threadId: tId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return messages.reverse();
  }

  async listThreads(userId) {
    const threads = await ChatBotThread.find({ userId })
      .select("title userRole userTier messageCount lastActivityAt createdAt")
      .sort({ lastActivityAt: -1 })
      .limit(20)
      .lean();

    return threads;
  }

  async deleteThread(threadId, userId) {
    const thread = await ChatBotThread.findOneAndDelete({ _id: threadId, userId });
    if (!thread) throw new Error("Thread not found");
    await ChatBotMessage.deleteMany({ threadId: thread._id });
    return { deleted: true };
  }

  async clearHistory(threadId, userId) {
    const thread = await ChatBotThread.findOne({ _id: threadId, userId });
    if (!thread) throw new Error("Thread not found");
    await ChatBotMessage.deleteMany({ threadId: thread._id });
    await ChatBotThread.findByIdAndUpdate(threadId, { messageCount: 0, lastActivityAt: new Date() });
    return { cleared: true };
  }

  async getUsageStats(userId, user) {
    const capabilities = await TierManager.getCapabilities(user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalToday = await ChatBotMessage.countDocuments({
      userId,
      senderRole: "USER",
      createdAt: { $gte: todayStart },
    });

    const totalThreads = await ChatBotThread.countDocuments({ userId });
    const totalMessages = await ChatBotMessage.countDocuments({ userId });

    return {
      tier: capabilities.name,
      dailyMessagesUsed: totalToday,
      dailyMessageLimit: capabilities.dailyMessageLimit,
      totalThreads,
      totalMessages,
      contextWindowSize: capabilities.contextWindowSize,
    };
  }

  async getJobRecommendations(user) {
    const capabilities = await TierManager.getCapabilities(user);
    const tierName = user.role === "CANDIDATE"
      ? TierManager.resolveCandidateTier(user).name
      : capabilities.name;

    if (user.role !== "CANDIDATE") {
      return {
        success: false,
        message: "Job recommendations are available for candidate accounts only.",
        tier: tierName,
      };
    }

    if (!capabilities.canGetJobRecommendations || capabilities.dailyJobRecommendations <= 0) {
      return {
        success: false,
        message: `Job recommendations are not available on your current plan (${tierName}). Upgrade to PRO or ELITE to get personalised job matches.`,
        tier: tierName,
      };
    }

    const limitCheck = await this._checkRecommendationDailyLimit(
      user._id || user.id,
      "JOB_RECOMMENDATION",
      capabilities,
      capabilities.dailyJobRecommendations
    );

    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.message,
        tier: tierName,
        usage: { used: limitCheck.used, limit: limitCheck.limit },
      };
    }

    const matches = await EliteJobMatchService.findMatchesForCandidate(user._id || user.id);
    await this._logUsage(user._id || user.id, "JOB_RECOMMENDATION");

    const remaining = limitCheck.limit - (limitCheck.used + 1);

    if (!matches || matches.length === 0) {
      return {
        success: true,
        message: "No matching jobs found based on your current profile. Try updating your skills, preferred roles, or locations to get better matches.",
        jobs: [],
        tier: tierName,
        usage: { used: limitCheck.used + 1, limit: limitCheck.limit, remaining },
      };
    }

    return {
      success: true,
      message: `Here are your top ${Math.min(matches.length, 5)} job recommendations based on your profile skills and experience. You have ${remaining} recommendation${remaining !== 1 ? "s" : ""} remaining today.`,
      jobs: matches.slice(0, 5),
      tier: tierName,
      usage: { used: limitCheck.used + 1, limit: limitCheck.limit, remaining },
    };
  }

  async getCandidateRecommendations(user) {
    const capabilities = await TierManager.getCapabilities(user);
    const tierName = capabilities.name;

    if (user.role !== "CLIENT" || !user.companyId) {
      return {
        success: false,
        message: "Candidate recommendations are available for employer accounts only.",
        tier: tierName,
      };
    }

    if (capabilities.dailyCandidateRecommendations <= 0) {
      return {
        success: false,
        message: `Candidate recommendations are not available on your current plan (${tierName}). Upgrade to ELITE to discover top talent.`,
        tier: tierName,
      };
    }

    const limitCheck = await this._checkRecommendationDailyLimit(
      user._id || user.id,
      "CANDIDATE_RECOMMENDATION",
      capabilities,
      capabilities.dailyCandidateRecommendations
    );

    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.message,
        tier: tierName,
        usage: { used: limitCheck.used, limit: limitCheck.limit },
      };
    }

    const candidates = await this._findCandidatesForCompany(user.companyId);
    await this._logUsage(user._id || user.id, "CANDIDATE_RECOMMENDATION");

    const remaining = limitCheck.limit - (limitCheck.used + 1);

    if (!candidates || candidates.length === 0) {
      return {
        success: true,
        message: "No matching candidates found based on your current job listings. Post more detailed job requirements to get better candidate matches.",
        candidates: [],
        tier: tierName,
        usage: { used: limitCheck.used + 1, limit: limitCheck.limit, remaining },
      };
    }

    return {
      success: true,
      message: `Here is your AI-matched fresh candidate who hasn't applied yet — a top match based on your job listings. ${remaining > 0 ? `You have ${remaining} recommendation${remaining !== 1 ? "s" : ""} remaining today.` : ""} Click the card to view their full public profile.`,
      candidates: candidates.slice(0, 1),
      tier: tierName,
      usage: { used: limitCheck.used + 1, limit: limitCheck.limit, remaining },
    };
  }

  async getTopApplicants(companyId) {
    const companyJobs = await Job.find({ companyId, isActive: true })
      .select("_id title skills department")
      .lean();

    if (companyJobs.length === 0) return [];

    const jobIds = companyJobs.map(j => j._id);

    const recentApps = await Application.find({
      jobId: { $in: jobIds },
      companyId,
      status: { $ne: "REJECTED" },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    if (recentApps.length === 0) return [];

    const seenIds = new Set();
    const uniqueApps = [];
    for (const app of recentApps) {
      const cid = String(app.candidateId);
      if (!seenIds.has(cid)) {
        seenIds.add(cid);
        uniqueApps.push(app);
      }
      if (uniqueApps.length >= 10) break;
    }

    const candidateIds = uniqueApps.map(a => a.candidateId);

    const profiles = await CandidateProfile.find({
      userId: { $in: candidateIds },
    })
      .select("userId headline currentTitle totalExperience skills currentCity preferredLocations preferredRoles itSkills education projectDescription publicShareId summary")
      .populate("userId", "name email")
      .lean();

    const profileMap = new Map(profiles.map(p => [String(p.userId?._id || p.userId), p]));

    const applicants = [];
    for (const app of uniqueApps) {
      const pid = String(app.candidateId);
      const profile = profileMap.get(pid);
      if (profile) {
        applicants.push({
          candidateId: profile._id,
          userId: profile.userId?._id || profile.userId,
          name: profile.userId?.name || "Unknown",
          headline: profile.headline || profile.currentTitle || "",
          currentTitle: profile.currentTitle || "",
          totalExperience: profile.totalExperience || "",
          skills: profile.skills || [],
          currentCity: profile.currentCity || "",
          preferredLocations: profile.preferredLocations || [],
          preferredRoles: profile.preferredRoles || [],
          publicShareId: profile.publicShareId || "",
          matchScore: 0,
        });
      }
    }

    if (applicants.length === 0) return [];

    const ranked = await this._aiRankApplicants(companyJobs, applicants);

    return ranked.length >= 3 ? ranked.slice(0, 3) : applicants.slice(0, 3).map((a, i) => ({ ...a, matchScore: 100 - i * 15 }));
  }

  async _aiRankApplicants(jobs, applicants) {
    const jobsSummary = jobs.slice(0, 5).map((j, i) => ({
      i,
      t: j.title,
      d: j.department || "",
      s: (Array.isArray(j.skills) ? j.skills : []).slice(0, 8),
    }));

    const applicantsList = applicants.map((a, i) => ({
      i,
      n: a.name,
      t: a.currentTitle || "",
      sk: a.skills.slice(0, 8),
      e: a.totalExperience || "",
      l: a.currentCity || "",
    }));

    const prompt = `You are ranking actual job applicants for an employer. These candidates have already applied to the company's jobs.

COMPANY JOBS:
${JSON.stringify(jobsSummary, null, 2)}

APPLICANTS (${applicantsList.length} total):
${JSON.stringify(applicantsList, null, 2)}

Rank the applicants by how well they match the company's job requirements. Return a JSON array with ALL applicants, each with:
- "i": index
- "score": 0-100 match score
- "reason": one sentence

Return ONLY valid JSON, no other text.`;

    try {
      const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
      const response = await OpenAIService.createChatCompletion({
        model,
        systemPrompt: "You are a precise applicant ranking AI. Respond only with valid JSON.",
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
        aiResults = match ? JSON.parse(match[0]) : [];
      }

      if (!Array.isArray(aiResults)) return [];

      const result = [];
      for (const item of aiResults) {
        if (item && typeof item.i === "number" && typeof item.score === "number") {
          const app = applicants[item.i];
          if (app) {
            result.push({ ...app, matchScore: Math.max(0, Math.min(100, Math.round(item.score))) });
          }
        }
      }

      return result.sort((a, b) => b.matchScore - a.matchScore);
    } catch (err) {
      console.error("[ChatBotService] AI applicant ranking failed:", err.message);
      return [];
    }
  }

  async uploadPdf(file, user, existingThreadId) {
    if (!file) {
      return { success: false, message: "No file provided." };
    }

    const MAX_PDF_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_PDF_SIZE) {
      return { success: false, message: "File size exceeds 5 MB limit." };
    }

    if (file.mimetype !== "application/pdf") {
      return { success: false, message: "Only PDF files are allowed." };
    }

    // Step 1: Try pdf-parse (correct v2 API)
    let pdfText = "";
    let usedVision = false;
    const MIN_TEXT_LENGTH = 80;

    try {
      const parser = new PDFParse({ verbosity: VerbosityLevel.SILENT, data: file.buffer });
      await parser.load();
      const result = await parser.getText();
      pdfText = (result && result.text || "").trim();
      parser.destroy();
    } catch (err) {
      pdfText = "";
    }

    // Step 2: If too little text (image-based PDF), try OpenAI Vision via file upload
    if (pdfText.length < MIN_TEXT_LENGTH) {
      try {
        const visionText = await OpenAIService.extractPdfTextViaOpenAI(
          file.buffer,
          file.originalname
        );
        if (visionText && visionText.length > MIN_TEXT_LENGTH) {
          pdfText = visionText;
          usedVision = true;
        }
      } catch (visionErr) {
        // Vision fallback failed, keep whatever pdf-parse gave us
      }
    }

    // Step 3: If still no text, return error
    if (!pdfText || pdfText.trim().length < 10) {
      return {
        success: false,
        message: "Could not read any text from this PDF. The file may be a scanned image, corrupted, or password-protected. Try uploading a text-based PDF.",
      };
    }

    // Token efficiency: limit extracted text to 3000 characters (~750 tokens)
    const MAX_PDF_CHARS = 3000;
    if (pdfText.length > MAX_PDF_CHARS) {
      pdfText = pdfText.slice(0, MAX_PDF_CHARS) + "\n...[truncated]";
    }

    const capabilities = await TierManager.getCapabilities(user);
    const userTierName = user.role === "CANDIDATE"
      ? TierManager.resolveCandidateTier(user).name
      : capabilities.name;

    const profileSnapshot = capabilities.canAccessProfile
      ? { role: user.role, tier: userTierName }
      : { tier: userTierName };

    const thread = await this.resolveThread({
      userId: user.id,
      userRole: user.role,
      threadId: existingThreadId || "",
      userTier: userTierName,
      profileSnapshot,
    });

    await ChatBotThread.findByIdAndUpdate(thread._id, {
      $set: {
        "metadata.pdfContext": {
          text: pdfText,
          fileName: file.originalname,
          uploadedAt: new Date(),
        },
      },
    });

    return {
      success: true,
      message: `"${file.originalname}" uploaded successfully${usedVision ? " (text extracted via AI Vision)" : ""}. The AI can now reference its content.`,
      threadId: String(thread._id),
      fileName: file.originalname,
      charCount: pdfText.length,
      usedVision,
    };
  }

  async getThreadsWithDetails(userId) {
    const threads = await ChatBotThread.find({ userId })
      .select("title userRole userTier messageCount lastActivityAt createdAt metadata")
      .sort({ lastActivityAt: -1 })
      .limit(50)
      .lean();

    return threads.map(t => ({
      _id: t._id,
      title: t.title || "Chat",
      userRole: t.userRole,
      userTier: t.userTier,
      messageCount: t.messageCount || 0,
      lastActivityAt: t.lastActivityAt,
      createdAt: t.createdAt,
      hasPdf: !!(t.metadata && t.metadata.pdfContext),
    }));
  }

  async _checkRecommendationDailyLimit(userId, type, tier, limit) {
    const today = new Date().toISOString().slice(0, 10);

    let usageDoc;
    try {
      usageDoc = await DailyUsage.findOne({ userId, type, date: today }).lean();
    } catch {
      usageDoc = null;
    }

    const used = (usageDoc && usageDoc.count) || 0;

    if (used >= limit) {
      const tierName = (tier && tier.name) || "FREE";
      const customMsg = type === "JOB_RECOMMENDATION"
        ? "You already used your daily job recommendation. Come back tomorrow for your next job match!"
        : `Daily ${type === "CANDIDATE_RECOMMENDATION" ? "candidate recommendation" : "recommendation"} limit reached for ${tierName} tier (${limit} per day). Please try again tomorrow or upgrade your plan for higher limits.`;
      return {
        allowed: false,
        used,
        limit,
        message: customMsg,
      };
    }

    return { allowed: true, used, limit };
  }

  async _logUsage(userId, type) {
    const today = new Date().toISOString().slice(0, 10);

    try {
      await DailyUsage.findOneAndUpdate(
        { userId, type, date: today },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    } catch {
      // silently fail - not critical if logging fails
    }
  }

  async _findCandidatesForCompany(companyId) {
    const companyJobs = await Job.find({ companyId, isActive: true, approvalStatus: "APPROVED" })
      .select("skills title department description location")
      .lean();

    if (!companyJobs || companyJobs.length === 0) return [];

    const jobIds = companyJobs.map(j => j._id);

    const appliedCandidateIds = await Application.distinct("candidateId", {
      jobId: { $in: jobIds },
      companyId,
    });

    const allCandidates = await CandidateProfile.find(
      appliedCandidateIds.length > 0 ? { userId: { $nin: appliedCandidateIds } } : {}
    )
      .select("userId headline currentTitle totalExperience skills currentCity preferredLocations preferredRoles itSkills education projectDescription publicShareId summary")
      .populate("userId", "name email")
      .lean();

    if (allCandidates.length === 0) return [];

    const scored = await this._aiScoreCandidates(companyJobs, allCandidates);

    if (scored.length === 0) {
      return allCandidates.slice(0, 5).map(c => ({
        candidateId: c._id,
        userId: c.userId?._id || c.userId,
        name: c.userId?.name || "Unknown",
        headline: c.headline || c.currentTitle || "",
        currentTitle: c.currentTitle || "",
        totalExperience: c.totalExperience || "",
        skills: c.skills || [],
        currentCity: c.currentCity || "",
        preferredLocations: c.preferredLocations || [],
        preferredRoles: c.preferredRoles || [],
        publicShareId: c.publicShareId || "",
        matchScore: 50,
      }));
    }

    return scored
      .filter(c => c.matchScore >= 60)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 1);
  }

  async _aiScoreCandidates(jobs, candidates) {
    const jobsSummary = jobs.map((j, i) => ({
      i,
      t: j.title,
      d: j.department || "",
      s: (Array.isArray(j.skills) ? j.skills : []).slice(0, 10),
      l: j.location || "",
    }));

    const candidatesList = candidates.map((c, i) => ({
      i,
      n: c.userId?.name || "Unknown",
      t: c.currentTitle || "",
      sk: (Array.isArray(c.skills) ? c.skills : []).slice(0, 10),
      its: c.itSkills || "",
      e: c.totalExperience || "",
      l: c.currentCity || "",
      p: c.preferredRoles?.slice(0, 5) || [],
      ed: c.education || "",
      pr: c.projectDescription || "",
    }));

    const prompt = `You are an AI talent matcher. Your job is to find the best candidate fit for a company's job openings.

COMPANY'S JOB OPENINGS:
${JSON.stringify(jobsSummary, null, 2)}

AVAILABLE CANDIDATES (${candidatesList.length} total):
${JSON.stringify(candidatesList, null, 2)}

For each candidate, evaluate how well they match the company's job requirements. Consider:
1. Skill alignment — do the candidate's skills match the job's required skills?
2. Role relevance — is the candidate's current title/role relevant?
3. Experience fit — does their experience level match?
4. Domain fit — is their background in the right field?

CRITICAL RULES:
- A MERN Stack developer job should get candidates with React/Node/MongoDB skills, NOT sales or admin profiles.
- A Sales job should get candidates with sales background, NOT developers.
- Be strict about domain matching. A CRM specialist is NOT a match for a software engineering role.

Return a JSON array with one object per candidate (ALL candidates must be scored). Each object:
- "i": candidate index
- "score": 0-100 match score
- "reason": one sentence explaining the score

Return ONLY valid JSON, no other text.`;

    try {
      const model = process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";
      const response = await OpenAIService.createChatCompletion({
        model,
        systemPrompt: "You are a precise talent matching AI. Respond only with valid JSON.",
        userPrompt: prompt,
        maxOutputTokens: 6000,
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

      const result = [];
      for (const item of aiResults) {
        if (item && typeof item.i === "number" && typeof item.score === "number") {
          const c = candidates[item.i];
          if (c) {
            result.push({
              candidateId: c._id,
              userId: c.userId?._id || c.userId,
              name: c.userId?.name || "Unknown",
              headline: c.headline || c.currentTitle || "",
              currentTitle: c.currentTitle || "",
              totalExperience: c.totalExperience || "",
              skills: c.skills || [],
              currentCity: c.currentCity || "",
              preferredLocations: c.preferredLocations || [],
              preferredRoles: c.preferredRoles || [],
              publicShareId: c.publicShareId || "",
              matchScore: Math.max(0, Math.min(100, Math.round(item.score))),
            });
          }
        }
      }

      return result;
    } catch (err) {
      console.error("[ChatBotService] AI candidate matching failed:", err.message);
      return [];
    }
  }

  async _buildContext(user, capabilities) {
    if (!user || !user.role) return null;

    try {
      if (user.role === "CANDIDATE") {
        return await UserContextBuilder.buildCandidateContext(user.id, capabilities);
      }
      if (user.role === "CLIENT" && user.companyId) {
        return await UserContextBuilder.buildEmployerContext(user.id, user.companyId, capabilities);
      }
    } catch (e) {
      // If context building fails, continue without it
    }

    return null;
  }

  _sanitizeForSnapshot(context) {
    if (!context) return null;
    const allowed = [
      "currentTitle", "currentCompany", "totalExperience", "skills",
      "preferredRoles", "preferredLocations", "education", "headline",
      "companyName", "industry", "companySize", "packageType",
    ];
    const snapshot = {};
    for (const key of allowed) {
      if (context[key] !== undefined) {
        snapshot[key] = context[key];
      }
    }
    return Object.keys(snapshot).length > 0 ? snapshot : null;
  }

  async _getDailyCount(threadId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return ChatBotMessage.countDocuments({
      threadId,
      senderRole: "USER",
      createdAt: { $gte: todayStart },
    });
  }
}

module.exports = new ChatBotService();
