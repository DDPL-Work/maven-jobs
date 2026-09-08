const CandidateProfile = require("../../models/CandidateProfile");
const Company = require("../../models/Company");
const Job = require("../../models/Job");

class UserContextBuilder {
  async buildCandidateContext(userId, capabilities) {
    try {
      const profile = await CandidateProfile.findOne({ userId }).lean();
      if (!profile) return null;

      const ctx = {};

      if (capabilities.canAccessProfile) {
        if (profile.headline) ctx.headline = profile.headline;
        if (profile.summary) ctx.summary = profile.summary;
        if (profile.currentTitle) ctx.currentTitle = profile.currentTitle;
        if (profile.currentCompany) ctx.currentCompany = profile.currentCompany;
        if (profile.totalExperience) ctx.totalExperience = profile.totalExperience;
        if (Array.isArray(profile.skills) && profile.skills.length > 0) ctx.skills = profile.skills;
        if (Array.isArray(profile.preferredRoles) && profile.preferredRoles.length > 0) ctx.preferredRoles = profile.preferredRoles;
        if (Array.isArray(profile.preferredLocations) && profile.preferredLocations.length > 0) ctx.preferredLocations = profile.preferredLocations;
        if (profile.education) ctx.education = profile.education;
        if (profile.itSkills) ctx.itSkills = profile.itSkills;
        if (profile.currentCity) ctx.currentCity = profile.currentCity;
        if (profile.currentState) ctx.currentState = profile.currentState;
        if (profile.noticePeriod) ctx.noticePeriod = profile.noticePeriod;
        if (profile.expectedSalary) ctx.expectedSalary = profile.expectedSalary;
        if (profile.projectTitle) ctx.projectTitle = profile.projectTitle;
        if (profile.projectDescription) ctx.projectDescription = profile.projectDescription;
        if (profile.portfolioUrl) ctx.portfolioUrl = profile.portfolioUrl;
        if (profile.linkedInUrl) ctx.linkedInUrl = profile.linkedInUrl;
        ctx.profileCompleteness = this._calculateProfileCompleteness(profile);
      }

      if (capabilities.canAccessResume && profile.resume && profile.resume.fileName) {
        ctx.resume = {
          fileName: profile.resume.fileName,
          mimeType: profile.resume.mimeType,
          uploadedAt: profile.resume.uploadedAt,
        };
      }

      return ctx;
    } catch {
      return null;
    }
  }

  async buildEmployerContext(userId, companyId, capabilities) {
    try {
      const company = await Company.findById(companyId).lean();
      if (!company) return null;

      const ctx = {};

      if (capabilities.canAccessCompanyProfile) {
        if (company.name) ctx.companyName = company.name;
        if (company.tagline) ctx.tagline = company.tagline;
        if (company.industry) ctx.industry = company.industry;
        if (company.companySize) ctx.companySize = company.companySize;
        if (company.headquarters) ctx.headquarters = company.headquarters;
        if (company.about) ctx.about = company.about;
        if (company.mission) ctx.mission = company.mission;
        if (company.vision) ctx.vision = company.vision;
        if (company.whyJoinUs && company.whyJoinUs.length > 0) ctx.whyJoinUs = company.whyJoinUs;
        if (company.location && company.location.city) ctx.city = company.location.city;
        if (company.website) ctx.website = company.website;
        ctx.packageType = company.packageType || "STANDARD";
        ctx.activeJobCount = company.activeJobCount || 0;
        ctx.jobLimit = company.jobLimit || 0;
      }

      const jobs = await Job.find({ companyId })
        .select("title department jobType location experience skills salaryMin salaryMax approvalStatus")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (jobs && jobs.length > 0) {
        ctx.postedJobs = jobs.map((j) => ({
          title: j.title,
          department: j.department,
          jobType: j.jobType,
          location: j.location,
          experience: j.experience,
          skills: j.skills,
          salaryRange: j.salaryMin && j.salaryMax ? `${j.salaryMin} - ${j.salaryMax}` : null,
          status: j.approvalStatus,
        }));
      }

      return ctx;
    } catch {
      return null;
    }
  }

  _calculateProfileCompleteness(profile) {
    const fields = [
      "headline", "summary", "currentTitle", "currentCompany",
      "totalExperience", "currentCity", "currentState", "phone",
      "education", "noticePeriod",
    ];
    const filled = fields.filter((f) => profile[f] && String(profile[f]).trim().length > 0).length;
    const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
    const hasPreferredRoles = Array.isArray(profile.preferredRoles) && profile.preferredRoles.length > 0;
    const hasResume = profile.resume && profile.resume.url;
    const total = fields.length + 3;
    const filledCount = filled + (hasSkills ? 1 : 0) + (hasPreferredRoles ? 1 : 0) + (hasResume ? 1 : 0);
    return Math.round((filledCount / total) * 100);
  }
}

module.exports = new UserContextBuilder();
