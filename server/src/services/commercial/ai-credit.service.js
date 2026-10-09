const mongoose = require("mongoose");
const Entitlement = require("../../models/Entitlement");
const Subscription = require("../../models/Subscription");
const Plan = require("../../models/Plan");
const Product = require("../../models/Product");
const CreditLedger = require("../../models/CreditLedger");
const AiUsageLog = require("../../models/AiUsageLog");
const EntitlementService = require("./entitlement.service");
const CreditLedgerService = require("./credit-ledger.service");

class AiCreditService {
  /**
   * Returns start and end of current calendar month
   */
  static getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Resolves the current monthly cycle expiry date for a company.
   * If the company has an active plan (e.g. 90-day plan):
   * AI credits are assigned per monthly cycle under that plan.
   * Top-up AI credits expire strictly when the current monthly cycle ends (or when the plan ends, whichever is earlier).
   * They do NOT carry forward past the current monthly cycle.
   */
  static async getCurrentCycleExpiry(companyId) {
    const now = new Date();
    const { end } = this.getMonthRange();

    const activePlan = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });

    if (activePlan) {
      return activePlan.endDate < end ? activePlan.endDate : end;
    }

    return end;
  }

  /**
   * Ensures that every company (Free tier or Paid Plan) has their AI credits allowance for the current calendar month.
   * Specification:
   * 1. AI credits are monthly: unused AI credits from previous months EXPIRE at month-end and do NOT carry forward.
   * 2. Free tier gets 10 AI uses/month.
   * 3. Paid plans get their monthly AI credit quota for each active month of the subscription.
   * 4. Top-up AI credits expire when the current monthly cycle ends and do NOT carry forward.
   */
  static async ensureMonthlyAllowance(companyId) {
    if (!companyId) return null;
    const now = new Date();
    const { start, end } = this.getMonthRange();

    // Check if company has an active plan subscription
    const activePlan = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    }).populate("planId");

    const Company = require("../../models/Company");
    const company = await Company.findById(companyId);

    // Determine plan type and monthly AI quota
    let monthlyQuantity = 10;
    let planCode = "FREE";
    let isPaid = false;

    if (activePlan) {
      planCode = activePlan.planId?.code || company?.planSnapshot?.planCode || "PLAN";
      isPaid = planCode !== "FREE";
      
      const aiPlanSnap = (activePlan.entitlementSnapshot || []).find(
        (e) => String(e.productCode).toUpperCase() === "AI_CREDIT"
      );
      if (aiPlanSnap && (aiPlanSnap.basePlanQuantity || aiPlanSnap.quantity)) {
        monthlyQuantity = aiPlanSnap.basePlanQuantity || aiPlanSnap.quantity;
      } else if (company?.planSnapshot?.services) {
        const aiItem = company.planSnapshot.services.find(
          (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
        );
        if (aiItem && aiItem.basePlanQuantity) {
          monthlyQuantity = aiItem.basePlanQuantity;
        } else {
          if (planCode.toUpperCase().includes("SMB")) monthlyQuantity = 50;
          else if (planCode.toUpperCase().includes("CORP")) monthlyQuantity = 200;
          else if (planCode.toUpperCase().includes("FREE")) monthlyQuantity = 10;
        }
      }
    } else if (company?.planSnapshot?.services) {
      planCode = company.planSnapshot.planCode || "FREE";
      isPaid = planCode !== "FREE";
      const aiItem = company.planSnapshot.services.find(
        (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
      );
      if (aiItem && aiItem.basePlanQuantity) {
        monthlyQuantity = aiItem.basePlanQuantity;
      } else if (aiItem && typeof aiItem.quantity === "number" && aiItem.quantity > 0) {
        monthlyQuantity = aiItem.quantity;
      } else {
        if (planCode.toUpperCase().includes("SMB")) monthlyQuantity = 50;
        else if (planCode.toUpperCase().includes("CORP")) monthlyQuantity = 200;
        else monthlyQuantity = 10;
      }
    }

    // Expiry for the monthly AI credit is end of current month (or active plan endDate, whichever is earlier)
    const expiryDate = activePlan && activePlan.endDate < end ? activePlan.endDate : end;
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Expire any past-due or previous-month active AI entitlements (prevent carry forward of base & top-up credits)
    await Entitlement.updateMany(
      {
        companyId,
        productCode: "AI_CREDIT",
        status: "ACTIVE",
        $or: [
          { expiryDate: { $lt: now } },
          { startDate: { $lt: start } },
        ],
      },
      { $set: { status: "EXPIRED", remainingQuantity: 0 } }
    );

    // Also expire any standalone/top-up subscriptions whose endDate has passed
    await Subscription.updateMany(
      {
        companyId,
        status: "ACTIVE",
        endDate: { $lt: now },
      },
      { $set: { status: "EXPIRED" } }
    );

    // 2. Check if active AI entitlement already exists for current calendar month
    const existingMonthEnt = await Entitlement.findOne({
      companyId,
      productCode: "AI_CREDIT",
      status: "ACTIVE",
      expiryDate: { $gte: now },
      $or: [
        { "features.key": `monthlyAllocation_${currentMonthKey}` },
        { "features.key": "freeMonthlyAllocation", startDate: { $gte: start } },
        ...(activePlan ? [{ subscriptionId: activePlan._id, startDate: { $gte: start, $lte: end } }] : []),
      ],
    });

    if (existingMonthEnt) {
      return existingMonthEnt;
    }

    // 3. Find AI_CREDIT product
    const aiProduct = await Product.findOne({ code: "AI_CREDIT" });
    if (!aiProduct) return null;

    const planAiSvc = (company?.planSnapshot?.services || []).find(
      (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
    );
    const planAiFeatures = Array.isArray(planAiSvc?.features) ? planAiSvc.features : null;

    const entitlementFeatures = planAiFeatures !== null
      ? [
          { key: `monthlyAllocation_${currentMonthKey}`, name: `Monthly Allocation (${currentMonthKey})`, enabled: true },
          ...planAiFeatures,
        ]
      : [
          { key: `monthlyAllocation_${currentMonthKey}`, name: `Monthly Allocation (${currentMonthKey})`, enabled: true },
          { key: "freeMonthlyAllocation", name: "Monthly Allocation", enabled: !isPaid },
        ];

    // 4. Create fresh monthly entitlement
    const monthlyEntitlement = await Entitlement.create({
      companyId,
      subscriptionId: activePlan ? activePlan._id : null,
      productId: aiProduct._id,
      productCode: "AI_CREDIT",
      productName: isPaid ? `${planCode} Monthly AI Credits` : "Free Monthly AI Credits",
      allocatedQuantity: monthlyQuantity,
      consumedQuantity: 0,
      remainingQuantity: monthlyQuantity,
      unit: "AI Use",
      features: entitlementFeatures,
      startDate: now,
      expiryDate: expiryDate,
      status: "ACTIVE",
    });

    // 5. Reset company.planSnapshot.services[AI_CREDIT] for the new month cycle
    if (company?.planSnapshot && Array.isArray(company.planSnapshot.services)) {
      const sIndex = company.planSnapshot.services.findIndex(
        (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
      );
      if (sIndex !== -1) {
        company.planSnapshot.services[sIndex].quantity = monthlyQuantity;
        company.planSnapshot.services[sIndex].usedQuantity = 0;
        company.planSnapshot.services[sIndex].validity = Math.max(1, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
        company.markModified("planSnapshot");
        await company.save().catch(() => {});
      }
    }

    // 6. Record in credit ledger
    await CreditLedgerService.recordEntry({
      companyId,
      subscriptionId: activePlan ? activePlan._id : null,
      entitlementId: monthlyEntitlement._id,
      productId: aiProduct._id,
      productCode: "AI_CREDIT",
      transactionType: isPaid ? "PLAN_PURCHASE" : "FREE_TIER_GRANT",
      quantity: monthlyQuantity,
      balanceAfter: monthlyQuantity,
      referenceType: "System",
      referenceId: `AI_MONTH_${currentMonthKey}`,
      expiryDate: expiryDate,
      notes: `Monthly AI allocation (${monthlyQuantity} uses for ${now.toLocaleString("default", { month: "long" })}) - No carry forward`,
    });

    return monthlyEntitlement;
  }

  static async ensureMonthlyFreeAllowance(companyId) {
    return this.ensureMonthlyAllowance(companyId);
  }

  /**
   * Helper: extract a feature flag value from an AI_CREDIT service features array.
   * Returns true only if the feature exists AND is explicitly enabled: true.
   * If the feature is missing from the array, defaults to defaultValue.
   */
  static getAiFeatureFlag(featuresArray, key, defaultValue = false) {
    if (!Array.isArray(featuresArray) || featuresArray.length === 0) return defaultValue;
    const feat = featuresArray.find(f => String(f.key) === key);
    if (!feat) return defaultValue;
    return feat.enabled === true;
  }

  /**
   * Get AI credits summary and feature permissions for a company.
   * Feature flags are read directly from planSnapshot.services[AI_CREDIT].features,
   * which is the authoritative source seeded per plan.
   */
  static async getAiQuota(companyId) {
    await this.ensureMonthlyAllowance(companyId);

    const Company = require("../../models/Company");
    const company = await Company.findById(companyId);

    const now = new Date();
    const activePlan = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    }).populate("planId");

    const planCode = activePlan?.planId?.code || company?.planSnapshot?.planCode || "FREE";
    const isPaid = planCode !== "FREE";

    // 1. Fetch all active AI_CREDIT entitlements (sorted earliest expiry first)
    const activeEntitlements = await Entitlement.find({
      companyId,
      productCode: "AI_CREDIT",
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    // Also fetch exhausted entitlements still within their validity window for accurate total allocation/consumption tracking
    const allRelevantEntitlements = await Entitlement.find({
      companyId,
      productCode: "AI_CREDIT",
      expiryDate: { $gte: now },
      status: { $in: ["ACTIVE", "EXHAUSTED"] },
    }).sort({ expiryDate: 1 });

    const entAvailable = activeEntitlements.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);
    const entAllocated = allRelevantEntitlements.reduce((sum, e) => sum + (e.allocatedQuantity || 0), 0);
    const entConsumed = allRelevantEntitlements.reduce((sum, e) => sum + (e.consumedQuantity || 0), 0);

    // 2. Inspect planSnapshot.services for AI_CREDIT
    let aiSvc = null;
    let snapAllocated = 0;
    let snapConsumed = 0;
    if (company?.planSnapshot && Array.isArray(company.planSnapshot.services)) {
      aiSvc = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
      if (aiSvc) {
        snapAllocated = Number(aiSvc.quantity || 0);
        snapConsumed = Number(aiSvc.usedQuantity || 0);
      }
    }

    // Combined totals: Ground truth available credits comes strictly from active non-expired entitlements in the current cycle
    const totalAvailable = entAvailable;
    const totalAllocated = Math.max(entAllocated, snapAllocated);
    const totalConsumed = Math.max(0, totalAllocated - totalAvailable);

    // Keep company.planSnapshot.services in sync so other controllers/profile queries see identical stacked balance
    if (aiSvc && company) {
      let needsSave = false;
      if (aiSvc.quantity !== totalAllocated) {
        aiSvc.quantity = totalAllocated;
        needsSave = true;
      }
      if (aiSvc.usedQuantity !== totalConsumed) {
        aiSvc.usedQuantity = totalConsumed;
        needsSave = true;
      }
      if (needsSave) {
        company.markModified("planSnapshot");
        await company.save().catch(() => {});
      }
    }

    // 3. Merge feature flags (union: plan service features + active booster entitlement features)
    const svcFeatures = Array.isArray(aiSvc?.features) ? aiSvc.features : [];
    const entFeatures = activeEntitlements.flatMap(e => Array.isArray(e.features) ? e.features : []);
    const mergedFeatures = [...svcFeatures, ...entFeatures];

    const canImproveJd = this.getAiFeatureFlag(mergedFeatures, "improveJd", false) ||
                         this.getAiFeatureFlag(mergedFeatures, "improveJobDescription", false);
    const canGenerateJd = this.getAiFeatureFlag(mergedFeatures, "generateJd", false) ||
                          this.getAiFeatureFlag(mergedFeatures, "writeFullJd", false) ||
                          this.getAiFeatureFlag(mergedFeatures, "writeFullJobDescription", false);
    const canScreeningQuestions = this.getAiFeatureFlag(mergedFeatures, "screeningQuestions", false) ||
                                  this.getAiFeatureFlag(mergedFeatures, "writeScreeningQuestions", false);

    const permissions = {
      improveJobDescription: canImproveJd,
      improveRequirements: canImproveJd,
      improveResponsibilities: canImproveJd,
      writeFullJobDescription: canGenerateJd,
      writeScreeningQuestions: canScreeningQuestions,
      smartMatch: this.getAiFeatureFlag(mergedFeatures, "smartMatch", false),
      canImproveJd,
      canGenerateJd,
      canGenerateScreeningQuestions: canScreeningQuestions,
    };

    const hasBooster = activeEntitlements.some(e => e.subscriptionId && String(e.productName || "").toLowerCase().includes("booster"));

    return {
      allocatedCredits: totalAllocated,
      consumedCredits: totalConsumed,
      availableCredits: totalAvailable,
      features: permissions,
      permissions,
      planType: planCode,
      isPaid: isPaid || hasBooster,
      isPaidPlan: isPaid,
      expiresAt: company?.planSnapshot?.endDate || (activeEntitlements[activeEntitlements.length - 1]?.expiryDate) || null,
      batches: activeEntitlements.map((e) => ({
        id: e._id,
        name: e.productName,
        available: e.remainingQuantity,
        expiryDate: e.expiryDate,
      })),
    };
  }

  /**
   * Consume 1 AI credit for a recruiter action
   */
  static async useAiCredit({ companyId, userId, jobId = null, feature, promptTokens = 0, completionTokens = 0, actor = {} }) {
    await this.ensureMonthlyFreeAllowance(companyId);

    const normalizedFeature = String(feature || "IMPROVE_JD").trim().toUpperCase();
    const quota = await this.getAiQuota(companyId);
    const perms = quota.permissions || quota.features || {};

    // Feature permission gates — read from plan's features array, not just isPaid
    if ((normalizedFeature === "WRITE_FULL_JD" || normalizedFeature === "IMPROVE_RESPONSIBILITIES_GENERATE" || normalizedFeature === "IMPROVE_REQUIREMENTS_GENERATE") && !perms.canGenerateJd && !perms.writeFullJobDescription) {
      const error = new Error("Generating content from scratch requires the 'Generate JD from Title' feature. Please upgrade your plan to unlock this.");
      error.statusCode = 403;
      error.code = "FEATURE_NOT_ENABLED";
      throw error;
    }

    if (normalizedFeature === "SCREENING_QUESTIONS" && !perms.canGenerateScreeningQuestions && !perms.writeScreeningQuestions) {
      const error = new Error("Generating screening questions requires the 'Screening Questions' feature. Please upgrade your plan to unlock this.");
      error.statusCode = 403;
      error.code = "FEATURE_NOT_ENABLED";
      throw error;
    }

    if (quota.availableCredits < 1) {
      const error = new Error("You have exhausted your AI uses for this period. Please purchase an AI Credit Booster pack or upgrade your plan.");
      error.statusCode = 402;
      error.code = "AI_CREDITS_EXHAUSTED";
      throw error;
    }

    // Deterministic FIFO consumption
    const consumptionResult = await EntitlementService.consumeCredit({
      companyId,
      productCode: "AI_CREDIT",
      quantity: 1,
      referenceType: "AiUsageLog",
      referenceId: String(jobId || ""),
      actor: actor || { userId, userEmail: "recruiter" },
      notes: `AI action: ${normalizedFeature}`,
    });

    // Record AI Usage Log
    const usageLog = await AiUsageLog.create({
      companyId,
      userId,
      jobId: jobId ? new mongoose.Types.ObjectId(jobId) : null,
      feature: normalizedFeature,
      creditsUsed: 1,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      planType: quota.planType,
      status: "SUCCESS",
    });

    return {
      success: true,
      feature: normalizedFeature,
      creditsDeducted: 1,
      remainingCredits: consumptionResult.remaining,
      usageLogId: usageLog._id,
    };
  }
}

module.exports = AiCreditService;
