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
   * Ensures that every company (Free tier or Paid Plan) has their AI credits allowance for the current calendar month.
   * Specification:
   * 1. AI credits are monthly: unused AI credits from previous months EXPIRE at month-end and do NOT carry forward.
   * 2. Free tier gets 10 AI uses/month.
   * 3. Paid plans get their monthly AI credit quota for each active month of the subscription.
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
      
      const aiItem = (activePlan.entitlementSnapshot || []).find(e => String(e.productCode).toUpperCase() === "AI_CREDIT") ||
                     (company?.planSnapshot?.services || []).find(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
      if (aiItem && typeof aiItem.quantity === "number") {
        monthlyQuantity = aiItem.quantity;
      }
    } else if (company?.planSnapshot?.services) {
      const aiItem = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
      if (aiItem && typeof aiItem.quantity === "number") {
        monthlyQuantity = aiItem.quantity;
        planCode = company.planSnapshot.planCode || "FREE";
        isPaid = planCode !== "FREE";
      }
    }

    // Expiry for the monthly AI credit is end of current month (or active plan endDate, whichever is earlier)
    const expiryDate = activePlan && activePlan.endDate < end ? activePlan.endDate : end;
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Expire any past-due active AI entitlements from previous months (prevent carry forward)
    await Entitlement.updateMany(
      {
        companyId,
        productCode: "AI_CREDIT",
        status: "ACTIVE",
        expiryDate: { $lt: now },
      },
      { $set: { status: "EXPIRED", remainingQuantity: 0 } }
    );

    // Check if active AI entitlement already exists for current calendar month
    const existingMonthEnt = await Entitlement.findOne({
      companyId,
      productCode: "AI_CREDIT",
      status: "ACTIVE",
      expiryDate: { $gte: now },
      $or: [
        { "features.key": `monthlyAllocation_${currentMonthKey}` },
        { "features.key": "freeMonthlyAllocation", startDate: { $gte: start } },
        { startDate: { $gte: start, $lte: end } }
      ]
    });

    if (existingMonthEnt) {
      return existingMonthEnt;
    }

    // Find AI_CREDIT product
    const aiProduct = await Product.findOne({ code: "AI_CREDIT" });
    if (!aiProduct) return null;

    // Create fresh monthly entitlement
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
      features: [
        { key: `monthlyAllocation_${currentMonthKey}`, name: `Monthly Allocation (${currentMonthKey})`, enabled: true },
        { key: "freeMonthlyAllocation", name: "Monthly Allocation", enabled: !isPaid },
        { key: "improveJd", name: "Improve Job Description", enabled: true },
        { key: "improveRequirements", name: "Improve Requirements", enabled: true },
        { key: "improveResponsibilities", name: "Improve Responsibilities", enabled: true },
        { key: "writeFullJd", name: "Write Full Job Description", enabled: isPaid },
        { key: "screeningQuestions", name: "Generate Screening Questions", enabled: isPaid },
      ],
      startDate: now,
      expiryDate: expiryDate,
      status: "ACTIVE",
    });

    // Record in credit ledger
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
   * Get AI credits summary and feature permissions for a company
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

    // Feature permissions as per Spec Q5.8:
    // Improving text is free & paid. Writing full new JD & screening questions requires paid plan.
    const permissions = {
      improveJobDescription: true,
      improveRequirements: true,
      writeFullJobDescription: isPaid,
      writeScreeningQuestions: isPaid,
      smartMatch: isPaid,
    };

    // If company has planSnapshot with AI_CREDIT service, planSnapshot is authoritative
    if (company?.planSnapshot && Array.isArray(company.planSnapshot.services)) {
      const aiSvc = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
      if (aiSvc) {
        const total = Number(aiSvc.quantity || 0);
        const used = Number(aiSvc.usedQuantity || 0);
        return {
          allocatedCredits: total,
          consumedCredits: used,
          availableCredits: Math.max(0, total - used),
          features: permissions,
          planType: planCode,
          isPaid,
          expiresAt: company.planSnapshot.endDate || null,
        };
      }
    }

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
