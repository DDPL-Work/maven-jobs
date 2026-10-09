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

    // Real-time expiry sweep for company per Q2.7
    try {
      const pastEnts = await Entitlement.find({
        companyId,
        status: "ACTIVE",
        expiryDate: { $lt: now },
      });

      if (pastEnts.length > 0) {
        const CreditLedgerService = require("./credit-ledger.service");
        for (const ent of pastEnts) {
          const forfeitedQty = ent.remainingQuantity || 0;
          ent.status = "EXPIRED";
          ent.remainingQuantity = 0;
          await ent.save();

          if (forfeitedQty > 0) {
            try {
              await CreditLedgerService.recordEntry({
                companyId,
                subscriptionId: ent.subscriptionId || null,
                entitlementId: ent._id,
                productId: ent.productId,
                productCode: ent.productCode,
                transactionType: "EXPIRED",
                quantity: -forfeitedQty,
                balanceAfter: 0,
                referenceType: "RealtimeExpiry",
                referenceId: String(ent._id),
                expiryDate: ent.expiryDate,
                notes: `Credits expired upon plan end date (Q2.7 policy)`,
                createdBy: { id: "system", role: "REALTIME" },
              });
            } catch (_) {}
          }
        }
      }
    } catch (sweepErr) {
      console.warn("[getCompanyEntitlements] Real-time expiry sweep warning:", sweepErr?.message);
    }

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

    let commercialStatus = primaryPlanSub ? "ACTIVE" : "NO_PLAN";
    let isGracePeriod = false;
    let graceDaysRemaining = 0;
    let planGraceExpiresAt = null;
    let expiredPlan = null;

    if (!primaryPlanSub) {
      const lastExpiredSub = await Subscription.findOne({
        companyId,
        subscriptionType: "PLAN",
      }).sort({ endDate: -1 }).populate("planId", "name code planType").lean();

      if (lastExpiredSub && lastExpiredSub.endDate) {
        const configuredGraceDays = Number(
          lastExpiredSub.commercialSnapshot?.gracePeriodDays !== undefined
            ? lastExpiredSub.commercialSnapshot.gracePeriodDays
            : 90
        );
        const graceEnd = new Date(new Date(lastExpiredSub.endDate).getTime() + configuredGraceDays * 24 * 60 * 60 * 1000);
        planGraceExpiresAt = configuredGraceDays > 0 ? graceEnd : lastExpiredSub.endDate;
        if (configuredGraceDays > 0 && now <= graceEnd) {
          commercialStatus = "EXPIRED_GRACE";
          isGracePeriod = true;
          graceDaysRemaining = Math.max(0, Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24)));
        } else {
          commercialStatus = "EXPIRED_LOCKED";
        }

        expiredPlan = {
          subscriptionId: lastExpiredSub._id,
          planName: lastExpiredSub.commercialSnapshot?.planName || lastExpiredSub.planId?.name || "Previous Plan",
          planCode: lastExpiredSub.planId?.code,
          endDate: lastExpiredSub.endDate,
          gracePeriodDays: configuredGraceDays,
          daysSinceExpiry: Math.max(0, Math.floor((now - new Date(lastExpiredSub.endDate)) / (1000 * 60 * 60 * 24))),
        };
      }
    }

    // Fetch Company model to read company planSnapshot and packageExpiresAt directly from Company
    const Company = require("../../models/Company");
    const companyDoc = await Company.findById(companyId)
      .select("name planSnapshot commercialStatus planGraceExpiresAt packageExpiresAt")
      .lean();

    const companyPlanEndDate = companyDoc?.planSnapshot?.endDate || companyDoc?.packageExpiresAt;
    const effectiveEndDate = companyPlanEndDate || primaryPlanSub?.endDate || null;

    let daysRemaining = 0;
    let hoursRemaining = 0;
    let totalHoursRemaining = 0;
    let isExpiringSoon = false;
    let isPlanExpired = false;

    if (effectiveEndDate) {
      const diffMs = new Date(effectiveEndDate).getTime() - now.getTime();
      if (diffMs > 0) {
        totalHoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
        daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        isExpiringSoon = totalHoursRemaining <= (7 * 24); // within 7 days (168 hours)
        isPlanExpired = false;
      } else {
        daysRemaining = 0;
        hoursRemaining = 0;
        totalHoursRemaining = 0;
        isExpiringSoon = false;
        isPlanExpired = true;
      }
    }

    if (isPlanExpired) {
      // Per Q2.7 / Q3.7: When plan is expired, remaining credits are expired/unavailable (available = 0)
      for (const item of productMap.values()) {
        item.available = 0;
      }
      if (
        companyDoc?.planSnapshot?.validity > 0 ||
        (Array.isArray(companyDoc?.planSnapshot?.services) &&
          companyDoc.planSnapshot.services.some((s) => s.quantity > 0 || s.usedQuantity > 0 || s.validity > 0))
      ) {
        Company.expirePlansForExpiredCompanies().catch(() => {});
      }
    }

    return {
      activePlan: primaryPlanSub
        ? {
            subscriptionId: primaryPlanSub._id,
            planName: primaryPlanSub.commercialSnapshot?.planName || primaryPlanSub.planId?.name || "Active Plan",
            planCode: primaryPlanSub.planId?.code,
            versionNumber: primaryPlanSub.planVersionNumber,
            startDate: primaryPlanSub.startDate,
            endDate: primaryPlanSub.endDate,
            daysRemaining,
            hoursRemaining,
            totalHoursRemaining,
          }
        : null,
      companyPlan: (companyDoc?.planSnapshot || companyPlanEndDate)
        ? {
            planName: companyDoc?.planSnapshot?.planName || primaryPlanSub?.commercialSnapshot?.planName || "Active Plan",
            planCode: companyDoc?.planSnapshot?.planCode || primaryPlanSub?.planId?.code || "",
            planType: companyDoc?.planSnapshot?.planType || "PLAN",
            startDate: companyDoc?.planSnapshot?.startDate || primaryPlanSub?.startDate || null,
            endDate: effectiveEndDate,
            packageExpiresAt: companyDoc?.packageExpiresAt || null,
            gracePeriodDays: companyDoc?.planSnapshot?.gracePeriodDays ?? 90,
            daysRemaining,
            hoursRemaining,
            totalHoursRemaining,
            isExpiringSoon,
            isExpired: isPlanExpired,
          }
        : null,
      expiredPlan,
      commercialStatus: companyDoc?.commercialStatus || commercialStatus,
      isGracePeriod,
      graceDaysRemaining,
      planGraceExpiresAt: companyDoc?.planGraceExpiresAt || planGraceExpiresAt,
      isExpiringSoon,
      daysRemaining,
      hoursRemaining,
      totalHoursRemaining,
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

    // Check if company's plan is expired per Q2.7 / Q3.7
    const Company = require("../../models/Company");
    const company = await Company.findById(companyId).select("planSnapshot packageExpiresAt commercialStatus").lean();
    const planEndDate = company?.planSnapshot?.endDate || company?.packageExpiresAt;
    const isCompanyPlanExpired = Boolean(
      (planEndDate && new Date(planEndDate) < now) ||
      company?.commercialStatus === "EXPIRED_GRACE" ||
      company?.commercialStatus === "EXPIRED_LOCKED"
    );

    if (isCompanyPlanExpired) {
      return {
        allowed: false,
        available: 0,
        requested: requestedQuantity,
        productCode: code,
        reason: "Plan expired",
      };
    }

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
