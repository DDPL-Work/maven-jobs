const Package = require("../models/Package");

const PACKAGE_ORDER = ["STANDARD", "PREMIUM", "ELITE"];

const DEFAULT_PACKAGE_CATALOG = [
  {
    name: "STANDARD",
    jobLimit: 5,
    description: "Starter package for focused hiring and foundational growth.",
  },
  {
    name: "PREMIUM",
    jobLimit: 10,
    description: "Balanced plan for companies managing active and recurring openings.",
  },
  {
    name: "ELITE",
    jobLimit: 20,
    description: "High-capacity package for scale hiring across teams and locations.",
  },
];

const normalizePackageName = (value, fallback = "STANDARD") => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (PACKAGE_ORDER.includes(normalized)) {
    return normalized;
  }

  return fallback;
};

const toSafePositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toSafeNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sortPackageCatalog = (items = []) => {
  const orderMap = new Map(PACKAGE_ORDER.map((name, index) => [name, index]));

  return [...items].sort((left, right) => {
    const leftOrder = orderMap.has(left.name) ? orderMap.get(left.name) : 100;
    const rightOrder = orderMap.has(right.name) ? orderMap.get(right.name) : 100;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return Number(left.jobLimit || 0) - Number(right.jobLimit || 0);
  });
};

const loadPackageCatalog = async () => {
  const packageDocs = await Package.find().select("name jobLimit description").lean();

  const candidateCatalog = packageDocs.length
    ? packageDocs.map((pkg) => ({
        name: normalizePackageName(pkg.name),
        jobLimit: toSafePositiveInt(pkg.jobLimit, 0),
        description: String(pkg.description || "").trim(),
      }))
    : DEFAULT_PACKAGE_CATALOG;

  const cleanedCatalog = candidateCatalog
    .filter((item) => item.name && Number(item.jobLimit || 0) > 0)
    .map((item) => {
      const fallback = DEFAULT_PACKAGE_CATALOG.find((defaultItem) => defaultItem.name === item.name);
      return {
        name: item.name,
        jobLimit: Number(item.jobLimit),
        description: item.description || fallback?.description || "",
      };
    });

  const packageCatalog = sortPackageCatalog(cleanedCatalog.length ? cleanedCatalog : DEFAULT_PACKAGE_CATALOG);
  const packageLimitMap = new Map(packageCatalog.map((item) => [item.name, Number(item.jobLimit || 0)]));

  return {
    packageCatalog,
    packageLimitMap,
  };
};

const resolveCompanyJobLimit = (company, packageLimitMap = new Map()) => {
  const packageType = normalizePackageName(company?.packageType);
  const packageLimit = Number(packageLimitMap.get(packageType) || 0);
  if (packageLimit > 0) {
    return packageLimit;
  }

  const companyLimit = toSafePositiveInt(company?.jobLimit, 0);
  if (companyLimit > 0) {
    return companyLimit;
  }

  const fallback = DEFAULT_PACKAGE_CATALOG.find((item) => item.name === packageType);
  return Number(fallback?.jobLimit || DEFAULT_PACKAGE_CATALOG[0].jobLimit);
};

const applyCompanyPackageSnapshot = (company, packageLimitMap = new Map()) => {
  const normalizedPackageType = normalizePackageName(company?.packageType);
  const resolvedJobLimit = resolveCompanyJobLimit(company, packageLimitMap);
  const grandfatheredJobLimit = toSafePositiveInt(company?.grandfatheredJobLimit, 0);
  const activeJobCount = toSafeNonNegativeInt(company?.activeJobCount, 0);
  const shouldMoveToLatestLimit = grandfatheredJobLimit > 0 && activeJobCount >= grandfatheredJobLimit;
  const effectiveJobLimit =
    grandfatheredJobLimit > 0 && !shouldMoveToLatestLimit
      ? grandfatheredJobLimit
      : resolvedJobLimit;

  let dirty = false;

  if (company && company.packageType !== normalizedPackageType) {
    company.packageType = normalizedPackageType;
    dirty = true;
  }

  if (company && Number(company.jobLimit || 0) !== effectiveJobLimit) {
    company.jobLimit = effectiveJobLimit;
    dirty = true;
  }

  if (company && shouldMoveToLatestLimit && Number(company.grandfatheredJobLimit || 0) !== 0) {
    company.grandfatheredJobLimit = 0;
    dirty = true;
  }

  return {
    packageType: normalizedPackageType,
    jobLimit: effectiveJobLimit,
    grandfatheredJobLimit:
      shouldMoveToLatestLimit || grandfatheredJobLimit <= 0 ? 0 : grandfatheredJobLimit,
    dirty,
  };
};

module.exports = {
  DEFAULT_PACKAGE_CATALOG,
  loadPackageCatalog,
  resolveCompanyJobLimit,
  applyCompanyPackageSnapshot,
  normalizePackageName,
};
