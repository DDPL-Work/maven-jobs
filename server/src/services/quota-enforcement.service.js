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
async function checkAndEnforceQuota(company, type, needed = 1) {
  const quotaConfig      = company.quotaConfig || {};
  const allocationPolicy = quotaConfig.allocationPolicy || 'full';

  // ── 'full' policy ──────────────────────────────────────────────────────────
  // CV access: controlled entirely by Credit.balance (monetary), no period quota
  if (allocationPolicy === 'full' && type === 'cvAccess') {
    return { total: Infinity, used: 0, left: Infinity, unlimited: true };
  }

  // NVite 'full': check company.nviteLimit (0 = unlimited)
  if (allocationPolicy === 'full' && type === 'nvite') {
    const total = company.nviteLimit || 0;
    if (total === 0) {
      const used = await countNviteUsage(company._id, {});
      return { total: Infinity, used, left: Infinity, unlimited: true };
    }
    const used = await countNviteUsage(company._id, {});
    const left = Math.max(0, total - used);
    if (left < needed) {
      const err = new Error(
        left === 0
          ? `NVite quota exhausted. Your account has used all ${total} NVites in the current plan.`
          : `NVite quota insufficient. Only ${left} NVite${left === 1 ? '' : 's'} remaining but ${needed} requested.`
      );
      err.statusCode = 429;
      err.code       = 'NVITE_QUOTA_EXHAUSTED';
      err.quotaInfo  = { type, total, used, left, allocationPolicy };
      throw err;
    }
    return { total, used, left };
  }

  // ── Weekly / Monthly policy ─────────────────────────────────────────────────
  let dateFilter = {};
  let total      = 0;

  if (allocationPolicy === 'weekly') {
    dateFilter = { createdAt: { $gte: getStartOfWeek() } };
    total = type === 'cvAccess'
      ? (quotaConfig.weekly?.cvAccess ?? 0)
      : (quotaConfig.weekly?.nvite   ?? 0);
  } else if (allocationPolicy === 'monthly') {
    dateFilter = { createdAt: { $gte: getStartOfMonth() } };
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
    const label  = type === 'cvAccess' ? 'CV access' : 'NVite';
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
