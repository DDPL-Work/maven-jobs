const Entitlement = require("../../models/Entitlement");
const Subscription = require("../../models/Subscription");
const CreditLedgerService = require("./credit-ledger.service");

class EntitlementService {
  /**
   * Resolve active company entitlements, credit balances, and capabilities
   */
  static async getCompanyEntitlements(companyId) {
    const now = new Date();

    try {
      const AiCreditService = require("./ai-credit.service");
      await AiCreditService.ensureMonthlyAllowance(companyId);
    } catch (_) {}

    // Fetch active subscriptions
    const activeSubscriptions = await Subscription.find({
      companyId,
      status: "ACTIVE",
      endDate: { $gte: now },
    })
      .populate("planId", "name code planType")
      .populate("productId", "name code")
      .sort({ endDate: -1 })
      .lean();

    // Fetch all active entitlements
    const entitlements = await Entitlement.find({
      companyId,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    })
      .sort({ expiryDate: 1 }) // Earliest expiry first
      .lean();

    // Aggregate by productCode
    const productMap = new Map();

    for (const ent of entitlements) {
      const code = ent.productCode;
      if (!productMap.has(code)) {
        productMap.set(code, {
          code,
          name: ent.productName,
          unit: ent.unit,
          productId: ent.productId,
          allocated: 0,
          consumed: 0,
          available: 0,
          earliestExpiry: ent.expiryDate,
          latestExpiry: ent.expiryDate,
          userLimit: 0,
          assignedSeats: [],
          features: {},
        });
      }

      const item = productMap.get(code);
      item.allocated += ent.allocatedQuantity || 0;
      item.consumed += ent.consumedQuantity || 0;
      item.available += ent.remainingQuantity || 0;

      if (new Date(ent.expiryDate) < new Date(item.earliestExpiry)) {
        item.earliestExpiry = ent.expiryDate;
      }
      if (new Date(ent.expiryDate) > new Date(item.latestExpiry)) {
        item.latestExpiry = ent.expiryDate;
      }

      if (ent.userLimit) {
        item.userLimit = (item.userLimit || 0) + ent.userLimit;
      }

      if (Array.isArray(ent.assignedSeats)) {
        item.assignedSeats = [...item.assignedSeats, ...ent.assignedSeats];
      }

      if (Array.isArray(ent.features)) {
        ent.features.forEach((f) => {
          if (f.key) {
            item.features[f.key] = f.enabled !== false ? (f.value !== undefined ? f.value : true) : false;
          }
        });
      }
    }

    // Identify primary active plan subscription
    const primaryPlanSub = activeSubscriptions.find((s) => s.subscriptionType === "PLAN") || null;

    return {
      activePlan: primaryPlanSub
        ? {
            subscriptionId: primaryPlanSub._id,
            planName: primaryPlanSub.commercialSnapshot?.planName || primaryPlanSub.planId?.name || "Active Plan",
            planCode: primaryPlanSub.planId?.code,
            versionNumber: primaryPlanSub.planVersionNumber,
            startDate: primaryPlanSub.startDate,
            endDate: primaryPlanSub.endDate,
            daysRemaining: Math.max(0, Math.ceil((new Date(primaryPlanSub.endDate) - now) / (1000 * 60 * 60 * 24))),
          }
        : null,
      activeSubscriptionsCount: activeSubscriptions.length,
      products: Array.from(productMap.values()),
    };
  }

  /**
   * Check if company has sufficient credit for an action
   */
  static async checkEntitlement(companyId, productCode, requestedQuantity = 1) {
    const now = new Date();
    const code = String(productCode).trim().toUpperCase();

    const activeEntitlements = await Entitlement.find({
      companyId,
      productCode: code,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).lean();

    const totalAvailable = activeEntitlements.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

    return {
      allowed: totalAvailable >= requestedQuantity,
      available: totalAvailable,
      requested: requestedQuantity,
      productCode: code,
    };
  }

  /**
   * Deterministic FIFO consumption:
   * Consumes credits from the entitlement with the EARLIEST expiry date first!
   * Atomic and prevents concurrent overdraft.
   */
  static async consumeCredit({
    companyId,
    productCode,
    quantity = 1,
    referenceType = "System",
    referenceId = "",
    actor = {},
    notes = "",
  }) {
    const qtyToConsume = Math.max(1, Number(quantity || 1));
    const code = String(productCode).trim().toUpperCase();
    const now = new Date();

    // Query active entitlements sorted by earliest expiry date first
    const activeEntitlements = await Entitlement.find({
      companyId,
      productCode: code,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    const totalAvailable = activeEntitlements.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

    if (totalAvailable < qtyToConsume) {
      const error = new Error(`Insufficient ${code} credits. Available: ${totalAvailable}, Requested: ${qtyToConsume}`);
      error.statusCode = 402; // Payment / credits required
      error.code = "INSUFFICIENT_CREDITS";
      error.details = {
        productCode: code,
        available: totalAvailable,
        requested: qtyToConsume,
      };
      throw error;
    }

    let remainingToConsume = qtyToConsume;
    let primaryEntitlement = null;
    let productId = null;

    for (const ent of activeEntitlements) {
      if (remainingToConsume <= 0) break;

      productId = ent.productId;
      if (!primaryEntitlement) primaryEntitlement = ent;

      const availableInThis = ent.remainingQuantity;
      const take = Math.min(availableInThis, remainingToConsume);

      ent.consumedQuantity += take;
      ent.remainingQuantity -= take;

      if (ent.remainingQuantity === 0) {
        ent.status = "EXHAUSTED";
      }

      await ent.save();
      remainingToConsume -= take;
    }

    const newTotalAvailable = totalAvailable - qtyToConsume;

    // Record consumption in credit ledger
    const ledgerEntry = await CreditLedgerService.recordEntry({
      companyId,
      subscriptionId: primaryEntitlement?.subscriptionId || null,
      entitlementId: primaryEntitlement?._id || null,
      productId: productId || primaryEntitlement?.productId,
      productCode: code,
      transactionType:
        code === "SMB_JOB" || code === "HOT_VACANCY" || code === "INTERNSHIP_JOB" || code === "JOB_POSTING"
          ? "JOB_POSTED"
          : code === "AI_CREDIT"
          ? "AI_USED"
          : code === "RESUME_VIEW" || code === "RESDEX"
          ? "RESUME_VIEWED"
          : "JOB_POSTED",
      quantity: -qtyToConsume,
      balanceAfter: newTotalAvailable,
      referenceType,
      referenceId,
      expiryDate: primaryEntitlement?.expiryDate || null,
      notes: notes || `Consumed ${qtyToConsume} ${code} credit(s)`,
      createdBy: actor,
    });

    return {
      success: true,
      productCode: code,
      consumed: qtyToConsume,
      remaining: newTotalAvailable,
      ledgerEntry,
    };
  }
}

module.exports = EntitlementService;
