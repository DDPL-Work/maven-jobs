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
   * Ensures that every company (even Free tier) has their 10 AI uses for the current month
   * As per Spec Section 5:
   * "Q5.1 AI for everyone, even free users? Yes, with a limit (Free: 10 uses/month)"
   * "Q5.6 Unused AI uses expire? Yes, at the end of the month."
   */
  static async ensureMonthlyFreeAllowance(companyId) {
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

    // If company already has an active paid plan (SMB, Corporate), their plan entitlement handles their quota
    if (activePlan) {
      return null;
    }

    // Check if free allowance entitlement already exists for current calendar month
    const existingMonthFreeEnt = await Entitlement.findOne({
      companyId,
      productCode: "AI_CREDIT",
      status: "ACTIVE",
      expiryDate: { $gte: now },
      "features.key": "freeMonthlyAllocation",
    });

    if (existingMonthFreeEnt) {
      return existingMonthFreeEnt;
    }

    // Find AI_CREDIT product
    const aiProduct = await Product.findOne({ code: "AI_CREDIT" });
    if (!aiProduct) return null;

    // Create Free Tier Subscription
    const freeSub = await Subscription.create({
      companyId,
      subscriptionType: "STANDALONE",
      productId: aiProduct._id,
      status: "ACTIVE",
      startDate: now,
      endDate: end,
      commercialSnapshot: {
        pricePaid: 0,
        basePrice: 0,
        discount: 0,
        taxPaid: 0,
        currency: "INR",
        productName: "Free Monthly AI Credits",
        validityDays: Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
        purchasedAt: now,
      },
    });

    // Create 10 Free AI uses valid till month-end
    const freeEntitlement = await Entitlement.create({
      companyId,
      subscriptionId: freeSub._id,
      productId: aiProduct._id,
      productCode: "AI_CREDIT",
      productName: "Free Monthly AI Credits",
      allocatedQuantity: 10,
      consumedQuantity: 0,
      remainingQuantity: 10,
      unit: "AI Use",
      features: [
        { key: "freeMonthlyAllocation", name: "Free Tier Monthly Allocation", enabled: true },
        { key: "improveJd", name: "Improve Job Description", enabled: true },
        { key: "improveRequirements", name: "Improve Requirements", enabled: true },
        { key: "improveResponsibilities", name: "Improve Responsibilities", enabled: true },
      ],
      startDate: now,
      expiryDate: end,
      status: "ACTIVE",
    });

    // Record in credit ledger
    await CreditLedgerService.recordEntry({
      companyId,
      entitlementId: freeEntitlement._id,
      productId: aiProduct._id,
      productCode: "AI_CREDIT",
      transactionType: "FREE_TIER_GRANT",
      quantity: 10,
      balanceAfter: 10,
      referenceType: "System",
      referenceId: `FREE_MONTH_${now.getFullYear()}_${now.getMonth() + 1}`,
      expiryDate: end,
      notes: `Monthly free AI allocation (10 uses for ${now.toLocaleString("default", { month: "long" })})`,
    });

    return freeEntitlement;
  }

  /**
   * Get AI credits summary and feature permissions for a company
   */
  static async getAiQuota(companyId) {
    await this.ensureMonthlyFreeAllowance(companyId);

    const now = new Date();
    const activePlan = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    }).populate("planId");

    const planCode = activePlan?.planId?.code || "FREE";
    const isPaid = planCode !== "FREE";

    // Calculate total available AI credits (Free + Plan + Standalone Add-ons)
    const activeEntitlements = await Entitlement.find({
      companyId,
      productCode: "AI_CREDIT",
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    const totalAvailable = activeEntitlements.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);
    const totalAllocated = activeEntitlements.reduce((sum, e) => sum + (e.allocatedQuantity || 0), 0);

    // Feature permissions as per Spec Q5.8:
    // Improving text is free & paid. Writing full new JD & screening questions requires paid plan.
    const permissions = {
      improveJobDescription: true,
      improveRequirements: true,
      improveResponsibilities: true,
      writeFullJobDescription: isPaid,
      generateScreeningQuestions: isPaid,
    };

    return {
      planType: planCode,
      isPaidPlan: isPaid,
      availableCredits: totalAvailable,
      allocatedCredits: totalAllocated,
      consumedCredits: Math.max(0, totalAllocated - totalAvailable),
      permissions,
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

    // Check feature permission gates
    if ((normalizedFeature === "WRITE_FULL_JD" || normalizedFeature === "SCREENING_QUESTIONS") && !quota.isPaidPlan) {
      const error = new Error("This AI feature (generating new content) requires an active SMB or Corporate plan. Please upgrade.");
      error.statusCode = 403;
      error.code = "PLAN_UPGRADE_REQUIRED";
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
