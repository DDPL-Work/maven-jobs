/**
 * Utility to determine whether a company logo should be displayed on candidate-facing job cards,
 * based on the commercial plan's product category features.
 *
 * Business Rule:
 * If the job posting feature for any job post product category (HOT_VACANCY, SMB_JOB, INTERNSHIP_JOB, etc.)
 * contains the feature related to showing the company logo on the job card (key "companyLogo" enabled: true),
 * then show the company logo. Otherwise, do not show the logo on the candidate side.
 */

const DEFAULT_CATEGORY_LOGO_RULES = {
  HOT_VACANCY: true,
  SMB_JOB: false,
  INTERNSHIP_JOB: false,
  JOB_POSTING: false,
};

/**
 * Resolve target product code from job category / fields
 */
function resolveJobProductCode(job) {
  if (!job) return "JOB_POSTING";
  if (job.productCode) return String(job.productCode).toUpperCase();
  const category = String(job.jobCategory || (job.isHotVacancy ? "hot" : "standard")).toLowerCase();
  if (category === "hot" || job.isHotVacancy) return "HOT_VACANCY";
  if (category === "management" || category === "smb") return "SMB_JOB";
  if (category === "internship") return "INTERNSHIP_JOB";
  return "JOB_POSTING";
}

/**
 * Check if a features array has companyLogo enabled
 */
function hasLogoFeatureEnabled(features) {
  if (!Array.isArray(features) || features.length === 0) return null;
  const logoFeat = features.find(
    (f) =>
      f &&
      (f.key === "companyLogo" ||
        /company\s*logo/i.test(String(f.key || "")) ||
        /company\s*logo/i.test(String(f.name || "")))
  );
  if (!logoFeat) return null;
  return logoFeat.enabled === true;
}

/**
 * Determine if company logo should be shown for a job on candidate side
 */
function shouldShowCompanyLogo(job, company) {
  if (!job) return false;

  // 1. Direct explicit boolean on job
  if (typeof job.showCompanyLogo === "boolean") {
    return job.showCompanyLogo;
  }

  // 2. Explicit plan features stored directly on job
  const jobFeaturesResult = hasLogoFeatureEnabled(job.planFeatures || job.features);
  if (typeof jobFeaturesResult === "boolean") {
    return jobFeaturesResult;
  }

  // 3. Resolve target product code
  const targetProductCode = resolveJobProductCode(job);

  // 4. Check company planSnapshot services
  const comp = company || (job.companyId && typeof job.companyId === "object" ? job.companyId : null);
  const services = comp?.planSnapshot?.services;
  if (Array.isArray(services) && services.length > 0) {
    const matchingService = services.find((s) => {
      const pCode = String(s.productCode || "").toUpperCase();
      if (pCode === targetProductCode) return true;
      if (targetProductCode === "HOT_VACANCY" && pCode.includes("HOT")) return true;
      if (targetProductCode === "SMB_JOB" && pCode.includes("SMB")) return true;
      if (targetProductCode === "INTERNSHIP_JOB" && pCode.includes("INTERN")) return true;
      if (targetProductCode === "JOB_POSTING" && (pCode.includes("JOB") || String(s.category).toUpperCase() === "JOB_POSTING")) return true;
      return false;
    });

    if (matchingService) {
      const serviceResult = hasLogoFeatureEnabled(matchingService.features);
      if (typeof serviceResult === "boolean") {
        return serviceResult;
      }
    }
  }

  // 5. Check company entitlements if available
  if (Array.isArray(comp?.entitlements) && comp.entitlements.length > 0) {
    const matchingEnt = comp.entitlements.find((e) => {
      const pCode = String(e.productCode || "").toUpperCase();
      return pCode === targetProductCode || (targetProductCode === "HOT_VACANCY" && pCode.includes("HOT"));
    });
    if (matchingEnt) {
      const entResult = hasLogoFeatureEnabled(matchingEnt.features);
      if (typeof entResult === "boolean") {
        return entResult;
      }
    }
  }

  // 6. Default fallback from product catalog definitions
  if (Object.prototype.hasOwnProperty.call(DEFAULT_CATEGORY_LOGO_RULES, targetProductCode)) {
    return DEFAULT_CATEGORY_LOGO_RULES[targetProductCode];
  }

  return Boolean(job.isHotVacancy || job.jobCategory === "hot");
}

module.exports = {
  shouldShowCompanyLogo,
  resolveJobProductCode,
  hasLogoFeatureEnabled,
  DEFAULT_CATEGORY_LOGO_RULES,
};
