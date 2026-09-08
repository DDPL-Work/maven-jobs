const PackageChangeRequest = require("../models/PackageChangeRequest");
const {
  normalizePackageName,
  resolveCompanyJobLimit,
} = require("./package-limit.service");

const DEFAULT_DOWNGRADE_CYCLE_DAYS = 30;

const addDays = (baseDate, days) => {
  const safeDate = baseDate instanceof Date && !Number.isNaN(baseDate.getTime())
    ? baseDate
    : new Date();
  const next = new Date(safeDate.getTime());
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const toDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const normalizeRequestStatus = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  return ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(normalized)
    ? normalized
    : "";
};

const buildPackageChangeEffectiveAt = ({
  isUpgrade = false,
  requestedEffectiveAt = null,
  fallbackDays = DEFAULT_DOWNGRADE_CYCLE_DAYS,
} = {}) => {
  if (isUpgrade) {
    return new Date();
  }

  const candidate = toDateOrNull(requestedEffectiveAt);
  if (candidate && candidate.getTime() > Date.now()) {
    return candidate;
  }

  return addDays(new Date(), fallbackDays);
};

const formatPackageChangeRequest = (request, options = {}) => {
  const companyName = options?.companyName || request?.companyId?.name || "";
  const requestedByName = options?.requestedByName || request?.requestedBy?.name || "";
  const reviewedByName = options?.reviewedByName || request?.reviewedBy?.fullName || "";
  const now = Date.now();
  const effectiveAt = request?.effectiveAt ? new Date(request.effectiveAt) : null;
  const isScheduled = Boolean(
    request?.status === "APPROVED" &&
      !request?.appliedAt &&
      effectiveAt &&
      !Number.isNaN(effectiveAt.getTime()) &&
      effectiveAt.getTime() > now,
  );

  return {
    id: String(request?._id || ""),
    companyId: request?.companyId?._id
      ? String(request.companyId._id)
      : String(request?.companyId || ""),
    companyName: companyName || "Company",
    requestedBy: requestedByName || "Client",
    reviewedBy: reviewedByName || "",
    currentPackageType: normalizePackageName(request?.currentPackageType, "STANDARD"),
    requestedPackageType: normalizePackageName(request?.requestedPackageType, "STANDARD"),
    currentJobLimit: Number(request?.currentJobLimit || 0),
    requestedJobLimit: Number(request?.requestedJobLimit || 0),
    reason: request?.reason || "",
    status: normalizeRequestStatus(request?.status) || "PENDING",
    isUpgrade: Boolean(request?.isUpgrade),
    decisionNote: request?.decisionNote || "",
    reviewedAt: request?.reviewedAt || null,
    createdAt: request?.createdAt || null,
    updatedAt: request?.updatedAt || null,
    effectiveAt: request?.effectiveAt || null,
    appliedAt: request?.appliedAt || null,
    isScheduled,
  };
};

const applyDueApprovedPackageChangesForCompany = async (company, packageLimitMap = new Map()) => {
  if (!company?._id) {
    return {
      appliedCount: 0,
      updated: false,
      lastAppliedRequest: null,
    };
  }

  const dueRequests = await PackageChangeRequest.find({
    companyId: company._id,
    status: "APPROVED",
    appliedAt: null,
    effectiveAt: { $lte: new Date() },
  }).sort({ effectiveAt: 1, createdAt: 1 });

  if (!dueRequests.length) {
    return {
      appliedCount: 0,
      updated: false,
      lastAppliedRequest: null,
    };
  }

  let updated = false;
  let lastAppliedRequest = null;

  for (const request of dueRequests) {
    const targetPackageType = normalizePackageName(
      request.requestedPackageType,
      company.packageType || "STANDARD",
    );
    const nextCompany = {
      packageType: targetPackageType,
      jobLimit: company.jobLimit,
    };
    const targetJobLimit = resolveCompanyJobLimit(nextCompany, packageLimitMap);

    if (company.packageType !== targetPackageType) {
      company.packageType = targetPackageType;
      updated = true;
    }
    if (Number(company.jobLimit || 0) !== Number(targetJobLimit || 0)) {
      company.jobLimit = Number(targetJobLimit || 0);
      updated = true;
    }
    if (Number(company.grandfatheredJobLimit || 0) !== 0) {
      company.grandfatheredJobLimit = 0;
      updated = true;
    }

    request.currentPackageType = normalizePackageName(request.currentPackageType, company.packageType);
    request.currentJobLimit = Number(request.currentJobLimit || company.jobLimit || 0);
    request.requestedPackageType = targetPackageType;
    request.requestedJobLimit = Number(targetJobLimit || 0);
    request.appliedAt = new Date();
    await request.save();
    lastAppliedRequest = request;
  }

  return {
    appliedCount: dueRequests.length,
    updated,
    lastAppliedRequest,
  };
};

module.exports = {
  DEFAULT_DOWNGRADE_CYCLE_DAYS,
  normalizeRequestStatus,
  buildPackageChangeEffectiveAt,
  formatPackageChangeRequest,
  applyDueApprovedPackageChangesForCompany,
};
