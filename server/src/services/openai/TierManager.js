const User = require("../../models/User");
const Company = require("../../models/Company");

const CANDIDATE_TIERS = {
  FREE: {
    name: "FREE",
    dailyMessageLimit: 50,
    dailyJobRecommendations: 3,
    contextWindowSize: 5,
    maxOutputTokens: 500,
    canAccessProfile: true,
    canAccessResume: false,
    canGetSkillAnalysis: false,
    canGetInterviewPrep: false,
    canGetResumeFeedback: false,
    canGetCareerPath: false,
    canGetJobRecommendations: true,
    canAskAdvanced: false,
  },
  PRO: {
    name: "PRO",
    dailyMessageLimit: 50,
    dailyJobRecommendations: 1,
    contextWindowSize: 20,
    maxOutputTokens: 2500,
    canAccessProfile: true,
    canAccessResume: true,
    canGetSkillAnalysis: true,
    canGetInterviewPrep: true,
    canGetResumeFeedback: true,
    canGetCareerPath: true,
    canGetJobRecommendations: true,
    canAskAdvanced: true,
  },
  ELITE: {
    name: "ELITE",
    dailyMessageLimit: 100,
    dailyJobRecommendations: 5,
    contextWindowSize: 40,
    maxOutputTokens: 6000,
    canAccessProfile: true,
    canAccessResume: true,
    canGetSkillAnalysis: true,
    canGetInterviewPrep: true,
    canGetResumeFeedback: true,
    canGetCareerPath: true,
    canGetJobRecommendations: true,
    canAskAdvanced: true,
  },
};

const EMPLOYER_TIERS = {
  STANDARD: {
    name: "STANDARD",
    dailyMessageLimit: 10,
    dailyCandidateRecommendations: 0,
    contextWindowSize: 5,
    maxOutputTokens: 500,
    canAccessCompanyProfile: true,
    canGetJobPostingHelp: true,
    canGetCandidateInsights: false,
    canGetIndustryInsights: false,
    canGetMarketData: false,
    canGetHiringAnalytics: false,
  },
  PREMIUM: {
    name: "PREMIUM",
    dailyMessageLimit: 30,
    dailyCandidateRecommendations: 0,
    contextWindowSize: 15,
    maxOutputTokens: 2000,
    canAccessCompanyProfile: true,
    canGetJobPostingHelp: true,
    canGetCandidateInsights: true,
    canGetIndustryInsights: true,
    canGetMarketData: false,
    canGetHiringAnalytics: false,
  },
  ELITE: {
    name: "ELITE",
    dailyMessageLimit: 100,
    dailyCandidateRecommendations: 5,
    contextWindowSize: 30,
    maxOutputTokens: 5000,
    canAccessCompanyProfile: true,
    canGetJobPostingHelp: true,
    canGetCandidateInsights: true,
    canGetIndustryInsights: true,
    canGetMarketData: true,
    canGetHiringAnalytics: true,
  },
};

class TierManager {
  resolveCandidateTier(user) {
    if (!user || !user.membership) return CANDIDATE_TIERS.FREE;
    const plan = (user.membership.plan || "FREE").toUpperCase();
    const isActive = user.membership.active === true;
    const now = new Date();
    const notExpired = !user.membership.expiresAt || new Date(user.membership.expiresAt) > now;

    if (!isActive || !notExpired) return CANDIDATE_TIERS.FREE;

    if (plan === "ELITE") return CANDIDATE_TIERS.ELITE;
    if (plan === "PRO") return CANDIDATE_TIERS.PRO;
    return CANDIDATE_TIERS.FREE;
  }

  async resolveEmployerTier(user) {
    if (!user || !user.companyId) return EMPLOYER_TIERS.STANDARD;
    try {
      const company = await Company.findById(user.companyId).select("packageType").lean();
      if (!company) return EMPLOYER_TIERS.STANDARD;
      const pkg = (company.packageType || "STANDARD").toUpperCase();
      if (pkg === "ELITE") return EMPLOYER_TIERS.ELITE;
      if (pkg === "PREMIUM") return EMPLOYER_TIERS.PREMIUM;
      return EMPLOYER_TIERS.STANDARD;
    } catch {
      return EMPLOYER_TIERS.STANDARD;
    }
  }

  async getCapabilities(user) {
    if (!user || !user.role) return EMPLOYER_TIERS.STANDARD;
    if (user.role === "CANDIDATE") return this.resolveCandidateTier(user);
    if (user.role === "CLIENT") return await this.resolveEmployerTier(user);
    return EMPLOYER_TIERS.STANDARD;
  }

  getTierLabel(user) {
    if (user.role === "CANDIDATE") {
      return this.resolveCandidateTier(user).name;
    }
    return "STANDARD";
  }

  async getEmployerTierLabel(user) {
    const caps = await this.resolveEmployerTier(user);
    return caps.name;
  }
}

module.exports = new TierManager();
