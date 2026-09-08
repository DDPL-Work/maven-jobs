class PromptBuilder {
  static systemPrompt({ role, tier, context }) {
    const currentYear = new Date().getFullYear();
    const tierName = (tier && tier.name) || "FREE";

    if (role === "CANDIDATE") {
      return this._candidateSystemPrompt(tierName, context, currentYear);
    }
    if (role === "CLIENT") {
      return this._employerSystemPrompt(tierName, context, currentYear);
    }
    return this._defaultSystemPrompt(currentYear);
  }

  static buildUserPrompt(text, context) {
    const contextBlock = this._buildContextBlock(context);
    return `${contextBlock}

User message:
${text}`;
  }

  static _candidateSystemPrompt(tier, context, year) {
    const caps = this._candidateCapabilities(tier);
    const profileSection = context ? this._formatCandidateProfile(context) : "";

    return `You are MavenJobs Assist, a concise career assistant on MavenJobs (India). Year: ${year}.

RULES:
- Be brief — 1-3 sentences max. No bullet points unless listing items.
- Sound human, not like a manual. Direct and helpful.
- ALWAYS reference the candidate's actual profile data below.
- Never give generic advice — tie everything to their skills, experience, current role.
- Never claim you performed portal actions (updated profile, applied, etc.).
- Never reveal other users' data or internal system details.

PROFILE (${tier} TIER):
${profileSection || "No profile data available. Encourage completing their profile."}

YOUR LIMITS BY TIER:
${caps}

ABOUT JOB RECOMMENDATIONS:
- FREE tier: 0 per day (upgrade to PRO).
- PRO: 1 job recommendation per day via "Get Job Recommendations".
- ELITE: 1 job recommendation per day via "Get Job Recommendations".
- If asked "why only 1 job per day": say "PRO and ELITE members get 1 AI-matched job per day — quality over quantity. It updates daily based on your profile."
- The recommendation uses your profile + resume to find the single best match.`;
  }

  static _employerSystemPrompt(tier, context, year) {
    const caps = this._employerCapabilities(tier);
    const companySection = context ? this._formatEmployerContext(context) : "";

    return `You are MavenJobs Assist, a hiring assistant for employers on MavenJobs (India). Year: ${year}.

RULES:
- Be brief — 1-3 sentences. Sound human and direct.
- ALWAYS reference the company's actual data below.
- Never share other companies' data or internal system details.
- Never claim you performed portal actions.

WHEN ASKED ABOUT CANDIDATES:
- Do NOT say you can't share profiles. Guide them to use the features below the chat.
- Say: "Your **AI Top Matches** section below shows ranked applicants who applied to your jobs — updates in real-time."
- For the best single match: "Click **Get Candidate Recommendations** for your 1 daily AI-matched top pick."
- Explain: Click any candidate card to view their full public profile.

COMPANY PROFILE (${tier} TIER):
${companySection || "No company profile data available."}

YOUR CAPABILITIES:
${caps}

ABOUT CANDIDATE RECOMMENDATIONS:
- ELITE tier gets 1 AI-matched candidate per day via "Get Candidate Recommendations".
- The match is based on your active job listings — skills, title, and department.
- Click a candidate card to view their full public profile in a new tab.
- If asked about limits: say "ELITE gets 1 top candidate per day — quality match based on your job requirements."`;
  }

  static _defaultSystemPrompt(year) {
    return `You are MavenJobs Assist on MavenJobs (India). Year: ${year}.

Keep answers brief and helpful (1-3 sentences). If asked about candidate or employer features, give general info and suggest logging in for personalised help.`;
  }

  static _candidateCapabilities(tier) {
    if (tier === "ELITE") {
      return "- Chat: 200 msgs/day\n- Job recommendations: 1/day (AI-matched)\n- Resume review, interview prep, career coaching\n- PDF upload & analysis";
    }
    if (tier === "PRO") {
      return "- Chat: 50 msgs/day\n- Job recommendations: 1/day (AI-matched)\n- Resume review, interview prep, skill analysis\n- PDF upload & analysis";
    }
    return "- Chat: 10 msgs/day\n- Job recommendations: 0/day\n- Basic profile guidance\n- Upgrade to PRO for 1 AI-matched job/day";
  }

  static _employerCapabilities(tier) {
    if (tier === "ELITE") {
      return "- Chat: 100 msgs/day\n- AI-matched candidate: 1/day — click \"Get Candidate Recommendations\" button\n- Market analytics, hiring strategies\n- Job description optimization\n- Click candidate card to view full public profile";
    }
    if (tier === "PREMIUM") {
      return "- Chat: 30 msgs/day\n- Candidate recommendations: 0/day — upgrade to ELITE\n- Industry insights, hiring best practices\n- Job description optimization";
    }
    return "- Chat: 10 msgs/day\n- Candidate recommendations: 0/day\n- Basic company profile guidance\n- Upgrade to PREMIUM or ELITE for more";
  }

  static _buildContextBlock(context) {
    if (!context) return "Context: No additional data available.";

    const parts = ["### YOUR PORTAL CONTEXT"];
    for (const [key, value] of Object.entries(context)) {
      if (key === "postedJobs" || key === "whyJoinUs" || key === "resume") continue;
      if (value !== null && value !== undefined && value !== "") {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        const display = Array.isArray(value) ? value.join(", ") : String(value);
        parts.push(`${label}: ${display}`);
      }
    }

    if (context.postedJobs && context.postedJobs.length > 0) {
      parts.push(`\nYour active job listings (${context.postedJobs.length}):`);
      context.postedJobs.slice(0, 5).forEach((job, i) => {
        parts.push(`  ${i + 1}. ${job.title} - ${job.department || "N/A"} (${job.location || "N/A"}) [${job.status || "UNKNOWN"}]`);
      });
      if (context.postedJobs.length > 5) {
        parts.push(`  ... and ${context.postedJobs.length - 5} more`);
      }
    }

    if (context.resume) {
      parts.push(`\nResume: ${context.resume.fileName} (Uploaded: ${new Date(context.resume.uploadedAt).toLocaleDateString("en-IN")})`);
    }

    parts.push(`\nProfile completeness: ${context.profileCompleteness || 0}%`);

    return parts.join("\n");
  }

  static _formatCandidateProfile(context) {
    if (!context) return "";
    const parts = [];
    if (context.currentTitle) parts.push(`Current Role: ${context.currentTitle}`);
    if (context.currentCompany) parts.push(`Current Company: ${context.currentCompany}`);
    if (context.totalExperience) parts.push(`Experience: ${context.totalExperience}`);
    if (context.skills && context.skills.length > 0) parts.push(`Skills: ${context.skills.join(", ")}`);
    if (context.preferredRoles && context.preferredRoles.length > 0) parts.push(`Looking for: ${context.preferredRoles.join(", ")}`);
    if (context.preferredLocations && context.preferredLocations.length > 0) parts.push(`Preferred Locations: ${context.preferredLocations.join(", ")}`);
    if (context.education) parts.push(`Education: ${context.education}`);
    return parts.length > 0 ? parts.join("\n") : "";
  }

  static _formatEmployerContext(context) {
    if (!context) return "";
    const parts = [];
    if (context.companyName) parts.push(`Company: ${context.companyName}`);
    if (context.industry) parts.push(`Industry: ${context.industry}`);
    if (context.companySize) parts.push(`Size: ${context.companySize}`);
    if (context.headquarters) parts.push(`HQ: ${context.headquarters}`);
    if (context.city) parts.push(`Location: ${context.city}`);
    if (context.packageType) parts.push(`Package: ${context.packageType}`);
    if (context.activeJobCount !== undefined) parts.push(`Active Jobs: ${context.activeJobCount}/${context.jobLimit || "N/A"}`);
    return parts.length > 0 ? parts.join("\n") : "";
  }
}

module.exports = PromptBuilder;