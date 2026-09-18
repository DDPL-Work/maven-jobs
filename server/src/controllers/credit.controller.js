const mongoose = require("mongoose");
const Credit = require("../models/Credit");
const CreditTransaction = require("../models/CreditTransaction");
const PaidResume = require("../models/PaidResume");
const ResdexReportLog = require("../models/ResdexReportLog");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");
const createHttpError = require("http-errors");
const asyncHandler = require("../middleware/async.middleware");
const activityService = require("../services/recruiter-activity.service");
const { checkAndEnforceQuota } = require("../services/quota-enforcement.service");

const RESUME_CREDIT_COST = 10;
const SEARCH_CREDIT_COST = 10;
const CREDITS_PER_TOPUP = 1000;
const TOPUP_AMOUNT = 100;

function ensureCreditDoc(companyId) {
  return Credit.findOneAndUpdate(
    { companyId },
    { $setOnInsert: { companyId, balance: 0, lifetimePurchased: 0, lifetimeUsed: 0 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, lean: true },
  );
}

// GET /credits
exports.getCredits = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");
  const credit = await ensureCreditDoc(companyId);
  res.json({ success: true, data: credit });
});

// GET /credits/history
exports.getCreditHistory = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");
  const { page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
  const pageLimit = Math.min(100, Math.max(1, Number(limit)));

  const [transactions, total] = await Promise.all([
    CreditTransaction.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    CreditTransaction.countDocuments({ companyId }),
  ]);

  res.json({
    success: true,
    data: transactions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / pageLimit),
  });
});

// POST /credits/topup — creates Razorpay order for credit purchase
exports.topupCredits = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");

  const credit = await ensureCreditDoc(companyId);
  const amount = TOPUP_AMOUNT;
  const credits = CREDITS_PER_TOPUP;

  const Razorpay = require("razorpay");
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw createHttpError(500, "Razorpay is not configured");

  const razorpay = new Razorpay({ key_id, key_secret });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `ct_${String(companyId).slice(-8)}_${Date.now()}`,
      notes: { type: "CREDIT_TOPUP", companyId: String(companyId), credits },
    });
  } catch (razorpayErr) {
    console.error("Razorpay order creation failed:", razorpayErr);
    throw createHttpError(502, "Payment gateway error. Please try again.");
  }

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
      credits,
      planLabel: `${credits} Credits`,
    },
  });
});

// POST /credits/verify — verify Razorpay payment and add credits
exports.verifyTopup = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw createHttpError(400, "Missing payment details");
  }

  const crypto = require("crypto");
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    throw createHttpError(400, "Invalid payment signature");
  }

  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");

  const credit = await Credit.findOne({ companyId });
  if (!credit) throw createHttpError(404, "Credit account not found. Please top up first.");

  const credits = CREDITS_PER_TOPUP;
  credit.balance += credits;
  credit.lifetimePurchased += credits;
  await credit.save();

  await CreditTransaction.create({
    companyId,
    type: "PURCHASE",
    amount: credits,
    balanceAfter: credit.balance,
    description: `Purchased ${credits} credits`,
    referenceId: razorpayPaymentId,
    metadata: { razorpayOrderId, razorpayPaymentId },
  });

  res.json({ success: true, data: credit, message: `${credits} credits added` });
});

// POST /credits/use — charge credits for an action
exports.useCredits = asyncHandler(async (req, res) => {
  const { action, candidateId } = req.body;
  if (!action || !candidateId) throw createHttpError(400, "action and candidateId are required");

  const validActions = ["RESUME_VIEW", "RESUME_DOWNLOAD"];
  if (!validActions.includes(action)) throw createHttpError(400, "Invalid action");

  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");

  let hasQuota = false;
  // ── Check period-based CV quota FIRST (weekly/monthly limits from quotaConfig) ──
  // Skip quota check if the resume has already been paid for (free re-access)
  const alreadyPaid = await PaidResume.findOne({ companyId, candidateId }).lean();
  const allocationPolicy = req.company?.quotaConfig?.allocationPolicy || 'full';
  
  if (!alreadyPaid) {
    try {
      const quotaResult = await checkAndEnforceQuota(req.company, 'cvAccess', 1);
      if (!quotaResult.unlimited) {
        hasQuota = true; // Using period-based quota
      }
    } catch (quotaErr) {
      return res.status(429).json({
        success: false,
        message: quotaErr.message,
        code: quotaErr.code || 'CV_QUOTA_EXHAUSTED',
        quotaInfo: quotaErr.quotaInfo || null,
      });
    }
  }

  const credit = await Credit.findOne({ companyId });
  if (!credit) throw createHttpError(404, "Credit account not found. Please top up first.");

  // If they are on 'full' allocation policy (pay-as-you-go), they MUST have enough financial credits
  if (!alreadyPaid && allocationPolicy === 'full') {
    if (credit.balance < RESUME_CREDIT_COST) {
      throw createHttpError(402, "Insufficient credits. Please top up.");
    }
  }

  // ── Already paid: free re-access — update view count and log ──
  const paid = await PaidResume.findOne({ companyId, candidateId });
  if (paid) {
    paid.lastViewedAt = new Date();
    paid.viewCount += 1;
    await paid.save();

    // Resolve candidate details for audit log
    const candidateUser = await User.findById(candidateId).select("name email").lean();
    const candidateName = candidateUser?.name || candidateUser?.email?.split('@')[0] || 'Candidate';
    const candidateProfile = await CandidateProfile.findOne({ userId: candidateId }).select("currentTitle").lean();

    // Write to ResdexReportLog (the audit ledger)
    ResdexReportLog.create({
      companyId,
      userId: req.user._id,
      subuserName: req.user.name || req.user.email || 'Recruiter',
      subuserEmail: req.user.email || '',
      actionType: action === 'RESUME_DOWNLOAD' ? 'CV_DOWNLOAD_EXCEL' : 'CV_VIEW',
      section: 'DATABASE_USAGE',
      candidateId,
      candidateName,
      candidateRole: candidateProfile?.currentTitle || '',
      creditsUsed: 0,
      platform: 'WEB',
      metadata: {
        charged: false,
        reason: 'already_paid_free_reaccess',
        viewCount: paid.viewCount,
        recruiterName: req.user.name || '',
        recruiterEmail: req.user.email || '',
        companyName: req.company?.name || '',
      },
    }).catch(err => console.error('[ResdexReportLog] Failed to write re-access log:', err));

    activityService.fireAndForget(() =>
      activityService.logForCandidate({
        companyId,
        recruiter: req.user,
        candidateId,
        action,
        text:
          action === "RESUME_DOWNLOAD"
            ? "Downloaded CV of **{{candidateName}}**"
            : "Viewed resume of **{{candidateName}}**",
      }),
    );
    return res.json({
      success: true,
      data: { charged: false, balance: credit.balance, message: "Already paid — free access" },
    });
  }

  // ── First-time access: create PaidResume, log ledger ──
  // Deduct financial credits ONLY if they are Pay-As-You-Go (allocationPolicy === 'full')
  if (allocationPolicy === 'full') {
    credit.balance -= RESUME_CREDIT_COST;
    credit.lifetimeUsed += RESUME_CREDIT_COST;
    await credit.save();
  }

  // Resolve candidate details for audit log
  const candidateUser = await User.findById(candidateId).select("name email").lean();
  const candidateName = candidateUser?.name || candidateUser?.email?.split('@')[0] || 'Candidate';
  const candidateProfile = await CandidateProfile.findOne({ userId: candidateId }).select("currentTitle").lean();

  await PaidResume.create({ companyId, candidateId, recruiterId: req.user._id });

  // ── Write CreditTransaction (financial ledger) ONLY if financial credits used ──
  if (allocationPolicy === 'full') {
    await CreditTransaction.create({
      companyId,
      type: action,
      amount: -RESUME_CREDIT_COST,
      balanceAfter: credit.balance,
      description: `${action === "RESUME_VIEW" ? "Viewed" : "Downloaded"} CV of ${candidateName} (${RESUME_CREDIT_COST} credits)`,
      referenceId: String(candidateId),
      metadata: {
        candidateId,
        candidateName,
        action,
        recruiterId: req.user._id,
        recruiterName: req.user.name || '',
        recruiterEmail: req.user.email || '',
        companyName: req.company?.name || '',
      },
    });
  }

  // ── Write to ResdexReportLog (audit ledger) ALWAYS ──
  ResdexReportLog.create({
    companyId,
    userId: req.user._id,
    subuserName: req.user.name || req.user.email || 'Recruiter',
    subuserEmail: req.user.email || '',
    actionType: action === 'RESUME_DOWNLOAD' ? 'CV_DOWNLOAD_EXCEL' : 'CV_VIEW',
    section: 'DATABASE_USAGE',
    candidateId,
    candidateName,
    candidateRole: candidateProfile?.currentTitle || '',
    creditsUsed: allocationPolicy === 'full' ? RESUME_CREDIT_COST : 0,
    platform: 'WEB',
    metadata: {
      charged: allocationPolicy === 'full',
      balanceAfter: credit.balance,
      recruiterName: req.user.name || '',
      recruiterEmail: req.user.email || '',
      companyName: req.company?.name || '',
    },
  }).catch(err => console.error('[ResdexReportLog] Failed to write CV access log:', err));

  activityService.fireAndForget(() =>
    activityService.logForCandidate({
      companyId,
      recruiter: req.user,
      candidateId,
      action,
      text:
        action === "RESUME_DOWNLOAD"
          ? "Downloaded CV of **{{candidateName}}**"
          : "Viewed resume of **{{candidateName}}**",
    }),
  );

  res.json({
    success: true,
    data: { charged: true, balance: credit.balance, creditsUsed: RESUME_CREDIT_COST },
  });
});

// GET /credits/check/:candidateId — check if resume is already paid for
exports.checkResumeAccess = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");
  const { candidateId } = req.params;
  const paid = await PaidResume.findOne({ companyId, candidateId }).lean();
  const credit = await Credit.findOne({ companyId }).lean();

  res.json({
    success: true,
    data: {
      hasAccess: !!paid,
      balance: credit?.balance || 0,
      cost: RESUME_CREDIT_COST,
    },
  });
});

// POST /credits/search — charge credits for a resume search
exports.searchCredits = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) throw createHttpError(403, "Company context not found");

  const credit = await Credit.findOne({ companyId });
  if (!credit) throw createHttpError(404, "Credit account not found. Please top up first.");

  if (credit.balance < SEARCH_CREDIT_COST) {
    throw createHttpError(402, `Insufficient credits. ${SEARCH_CREDIT_COST} credits required per search.`);
  }

  credit.balance -= SEARCH_CREDIT_COST;
  credit.lifetimeUsed += SEARCH_CREDIT_COST;
  await credit.save();

  await CreditTransaction.create({
    companyId,
    type: "SEARCH",
    amount: -SEARCH_CREDIT_COST,
    balanceAfter: credit.balance,
    description: `Resume search (${SEARCH_CREDIT_COST} credits)`,
    metadata: { action: "RESUME_SEARCH" },
  });

  res.json({
    success: true,
    data: { balance: credit.balance, creditsUsed: SEARCH_CREDIT_COST },
    message: `${SEARCH_CREDIT_COST} credits used for search`,
  });
});
