/**
 * quota-enforcement.service.js
 *
 * Shared helper that checks whether a company has remaining quota
 * for a given action type ('cvAccess' or 'nvite') based on their
 * allocationPolicy (full / weekly / monthly).
 *
 * Throws a 429 HTTP error if the quota is exhausted.
 * Returns the remaining quota info if access is allowed.
 */

const PaidResume = require('../models/PaidResume');
const Nvite      = require('../models/Nvite');

function getStartOfWeek() {
  const now  = new Date();
  const day  = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const sow  = new Date(now);
  sow.setDate(diff);
  sow.setHours(0, 0, 0, 0);
  return sow;
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

async function countCvUsage(companyId, dateFilter) {
  return PaidResume.countDocuments({ companyId, ...dateFilter });
}

async function countNviteUsage(companyId, dateFilter) {
  const agg = await Nvite.aggregate([
    { $match: { companyId, ...dateFilter } },
    { $group: { _id: null, sum: { $sum: '$totalCount' } } },
  ]);
  return agg[0]?.sum || 0;
}

/**
 * checkAndEnforceQuota
 *
 * @param {Object} company                  Mongoose Company document (with quotaConfig)
 * @param {'cvAccess'|'nvite'} type         Which quota to check
 * @param {number} [needed=1]               How many units are being requested
 * @throws {Error} statusCode=429 if quota is exhausted
 * @returns {{ total, used, left, unlimited? }} quota breakdown
 */
async function resolveCommercialLimits(company) {
  let cvTotal = 0;
  let nviteTotal = 0;
  try {
    const Credit = require('../models/Credit');
    const credit = await Credit.findOne({ companyId: company._id }).lean();
    
    if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
      cvTotal = 0;
      nviteTotal = 0;
      for (const s of company.planSnapshot.services) {
        const code = String(s.productCode || "").toUpperCase();
        const cat = String(s.category || "").toUpperCase();
        if (code.includes("CV") || code.includes("RESDEX") || code.includes("RESUME") || cat === "RESUME_SEARCH") {
          cvTotal += (s.quantity || 0);
        }
        if (code.includes("NVITE") || code.includes("MIVITE") || cat === "MIVITES") {
          nviteTotal += (s.quantity || 0);
        }
      }
    } else {
      const Package = require('../models/Package');
      const pkg = await Package.findOne({ name: company.packageType || "STANDARD" });
      cvTotal = Math.max(pkg?.cvAccessLimit || 0, credit?.lifetimePurchased || 0);
      nviteTotal = company.nviteLimit || pkg?.nviteLimit || 0;
    }

    const Entitlement = require('../models/Entitlement');
    const activeEnts = await Entitlement.find({
      companyId: company._id,
      status: "ACTIVE",
      expiryDate: { $gte: new Date() },
      remainingQuantity: { $gt: 0 },
    }).lean();

    for (const ent of activeEnts) {
      const pCode = String(ent.productCode || "").toUpperCase();
      if (pCode.includes("CV") || pCode.includes("RESDEX") || pCode.includes("RESUME")) {
        cvTotal = Math.max(cvTotal, ent.remainingQuantity || 0);
      } else if (pCode.includes("NVITE") || pCode.includes("MIVITE")) {
        nviteTotal = Math.max(nviteTotal, ent.remainingQuantity || 0);
      }
    }
  } catch (_) {}

  return { cvTotal, nviteTotal };
}

/**
 * checkAndEnforceQuota
 *
 * @param {Object} company                  Mongoose Company document (with quotaConfig)
 * @param {'cvAccess'|'nvite'} type         Which quota to check
 * @param {number} [needed=1]               How many units are being requested
 * @throws {Error} statusCode=429 if quota is exhausted
 * @returns {{ total, used, left, unlimited? }} quota breakdown
 */
async function checkAndEnforceQuota(company, type, needed = 1) {
  // Plan Expiration Check (Q3.7)
  if (company?.planSnapshot?.endDate && new Date(company.planSnapshot.endDate) < new Date()) {
    const label = type === 'cvAccess' ? 'Resume Search (Max CV Access)' : 'Candidate Outreach (Max NVite Credits)';
    const err = new Error(`Your plan has expired. You can view previously accessed CVs and jobs (up to 90 days), but new ${label} actions are locked until renewal.`);
    err.statusCode = 403;
    err.code = 'PLAN_EXPIRED';
    throw err;
  }

  const quotaConfig      = company.quotaConfig || {};
  const allocationPolicy = quotaConfig.allocationPolicy || 'full';
  const planStartDate    = company?.planSnapshot?.startDate ? new Date(company.planSnapshot.startDate) : null;

  // ── 'full' policy ──────────────────────────────────────────────────────────
  if (allocationPolicy === 'full') {
    const limits = await resolveCommercialLimits(company);
    const total = type === 'cvAccess' ? limits.cvTotal : limits.nviteTotal;
    const fullDateFilter = planStartDate ? { createdAt: { $gte: planStartDate } } : {};
    const used = type === 'cvAccess'
      ? await countCvUsage(company._id, fullDateFilter)
      : await countNviteUsage(company._id, fullDateFilter);
    const left = Math.max(0, total - used);

    if (left < needed) {
      const label = type === 'cvAccess' ? 'Max CV Access' : 'Max NVite Credits';
      const err = new Error(
        left === 0
          ? `${label} quota exhausted. Your account has no active ${label} credits in the current plan.`
          : `${label} quota insufficient. Only ${left} credit${left === 1 ? '' : 's'} remaining but ${needed} requested.`
      );
      err.statusCode = 429;
      err.code       = type === 'cvAccess' ? 'CV_QUOTA_EXHAUSTED' : 'NVITE_QUOTA_EXHAUSTED';
      err.quotaInfo  = { type, total, used, left, allocationPolicy };
      throw err;
    }
    return { total, used, left };
  }

  // ── Weekly / Monthly policy ─────────────────────────────────────────────────
  let dateFilter = {};
  let total      = 0;

  if (allocationPolicy === 'weekly') {
    const sow = getStartOfWeek();
    const filterStart = planStartDate ? new Date(Math.max(sow.getTime(), planStartDate.getTime())) : sow;
    dateFilter = { createdAt: { $gte: filterStart } };
    total = type === 'cvAccess'
      ? (quotaConfig.weekly?.cvAccess ?? 0)
      : (quotaConfig.weekly?.nvite   ?? 0);
  } else if (allocationPolicy === 'monthly') {
    const som = getStartOfMonth();
    const filterStart = planStartDate ? new Date(Math.max(som.getTime(), planStartDate.getTime())) : som;
    dateFilter = { createdAt: { $gte: filterStart } };
    total = type === 'cvAccess'
      ? (quotaConfig.monthly?.cvAccess ?? 0)
      : (quotaConfig.monthly?.nvite    ?? 0);
  }

  const used = type === 'cvAccess'
    ? await countCvUsage(company._id, dateFilter)
    : await countNviteUsage(company._id, dateFilter);

  const left = Math.max(0, total - used);

  if (left < needed) {
    const period = allocationPolicy === 'weekly' ? 'week' : 'month';
    const label  = type === 'cvAccess' ? 'Max CV Access' : 'Max NVite Credits';
    const err = new Error(
      left === 0
        ? `${label} quota exhausted for this ${period}. Your limit of ${total} will reset at the start of the next ${period}.`
        : `${label} quota insufficient. Only ${left} ${label}${left === 1 ? '' : 's'} remaining this ${period} but ${needed} requested.`
    );
    err.statusCode = 429;
    err.code       = type === 'cvAccess' ? 'CV_QUOTA_EXHAUSTED' : 'NVITE_QUOTA_EXHAUSTED';
    err.quotaInfo  = { type, total, used, left, allocationPolicy, period };
    throw err;
  }

  return { total, used, left };
}

module.exports = { checkAndEnforceQuota };
