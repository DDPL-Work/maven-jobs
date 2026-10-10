const Plan = require("../../models/Plan");
const PlanVersion = require("../../models/PlanVersion");
const Product = require("../../models/Product");
const ProductOffer = require("../../models/ProductOffer");
const Subscription = require("../../models/Subscription");
const Entitlement = require("../../models/Entitlement");
const CommercialOrder = require("../../models/CommercialOrder");
const CommercialPayment = require("../../models/CommercialPayment");
const Company = require("../../models/Company");
const User = require("../../models/User");
const CreditLedgerService = require("./credit-ledger.service");
const AuditLogService = require("./audit-log.service");
const {
  generateInvoiceNumber,
  buildInvoiceData,
  generateInvoicePdfBuffer,
} = require("../../email/templates/invoice");

const DEFAULT_PRODUCT_FEATURES = {
  HOT_VACANCY: [
    { key: "companyLogo", name: "Company Logo Shown", enabled: true },
    { key: "topSearchPlacement", name: "Top Search Placement", enabled: true },
    { key: "candidateAlerts", name: "Candidate Job Alerts", enabled: true },
    { key: "multipleCities", name: "Multiple Cities Allowed", enabled: true, value: 3 },
  ],
  SMB_JOB: [
    { key: "basicPosting", name: "Basic Job Posting", enabled: true },
    { key: "cityAllowed", name: "City Allowed", enabled: true },
    { key: "companyLogo", name: "Company Logo Shown", enabled: false },
    { key: "candidateAlerts", name: "Candidate Alerts", enabled: false },
    { key: "topSearchPlacement", name: "Top Search Placement", enabled: false },
  ],
  INTERNSHIP_JOB: [],
  AI_CREDIT: [
    { key: "improveJd", name: "Improve Job Description (Free Tier)", enabled: true },
    { key: "generateJd", name: "Write Full JD from Title (Paid Only)", enabled: true },
    { key: "screeningQuestions", name: "Generate Screening Questions (Paid Only)", enabled: true },
  ],
  RESDEX: [
    { key: "advanceFilters", name: "Advanced Filters", enabled: true },
    { key: "downloadCv", name: "Download PDF CV", enabled: true },
    { key: "contactDetails", name: "View Direct Contact Info", enabled: true },
  ],
  MIVITE: [
    { key: "candidateOutreach", name: "Candidate Outreach Messaging", enabled: true },
    { key: "directInvite", name: "Direct Job Application NVites", enabled: true },
  ],
};

class PurchaseService {
  /**
   * Helper to resolve 2-character uppercase company initials
   */
  static resolveCompanyInitials(company) {
    const raw = String(company?.name || "").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (raw.length >= 2) return raw.slice(0, 2);
    if (raw.length === 1) return `${raw}X`;
    return "CO";
  }

  /**
   * Helper to resolve 2-character uppercase payment mode code
   */
  static resolvePaymentModeCode(paymentMethod = "ONLINE") {
    const mode = String(paymentMethod || "ONLINE").toUpperCase().trim();
    if (mode.startsWith("FREE")) return "FR";
    if (mode.startsWith("RAZORPAY")) return "RZ";
    if (mode.startsWith("ONLINE")) return "ON";
    if (mode.startsWith("UPI")) return "UP";
    if (mode.startsWith("CARD")) return "CA";
    if (mode.startsWith("NET")) return "NB";
    if (mode.startsWith("CHEQUE")) return "CH";
    if (mode.startsWith("CASH")) return "CS";
    if (mode.startsWith("NEFT")) return "NE";
    if (mode.startsWith("BANK")) return "BT";
    if (mode.startsWith("SIMULATED")) return "SM";
    const clean = mode.replace(/[^A-Z0-9]/g, "");
    if (clean.length >= 2) return clean.slice(0, 2);
    if (clean.length === 1) return `${clean}X`;
    return "ON";
  }

  /**
   * Generate human-readable Order ID:
   * Format: MJ{last 2 digit of year}{company inital two digit who made order}{three digit serial number}
   * Example: MJ26DD001
   */
  static async generateOrderId(company) {
    const year2 = String(new Date().getFullYear()).slice(-2);
    const compInitials = this.resolveCompanyInitials(company);
    const prefix = `MJ${year2}${compInitials}`;

    const existingCount = await CommercialOrder.countDocuments({
      orderNumber: new RegExp(`^${prefix}`),
    });

    let seq = existingCount + 1;
    let orderNumber = `${prefix}${String(seq).padStart(3, "0")}`;

    while (await CommercialOrder.exists({ orderNumber })) {
      seq++;
      orderNumber = `${prefix}${String(seq).padStart(3, "0")}`;
    }

    return orderNumber;
  }

  /**
   * Generate human-readable Payment ID:
   * Format: MJ{payment Mode initial two digit}{year last two digit}{4 digit serial number}
   * Example: MJON260001
   */
  static async generatePaymentId(paymentMethod = "ONLINE") {
    const modeCode = this.resolvePaymentModeCode(paymentMethod);
    const year2 = String(new Date().getFullYear()).slice(-2);
    const prefix = `MJ${modeCode}${year2}`;

    const existingCount = await CommercialPayment.countDocuments({
      paymentId: new RegExp(`^${prefix}`),
    });

    let seq = existingCount + 1;
    let paymentId = `${prefix}${String(seq).padStart(4, "0")}`;

    while (await CommercialPayment.exists({ paymentId })) {
      seq++;
      paymentId = `${prefix}${String(seq).padStart(4, "0")}`;
    }

    return paymentId;
  }

  /**
   * Backward-compatible order number generator
   */
  static generateOrderNumber(company) {
    if (company) {
      const year2 = String(new Date().getFullYear()).slice(-2);
      const compInitials = this.resolveCompanyInitials(company);
      const random3 = Math.floor(100 + Math.random() * 900);
      return `MJ${year2}${compInitials}${random3}`;
    }
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Helper to dispatch professional order confirmation email asynchronously
   */
  static async sendOrderConfirmationNotification({
    companyId,
    userId,
    serviceTitle,
    transactionId,
    orderNumber,
    paymentId,
    invoiceNumber,
    amount,
    validityDays,
    expiryDate,
    paymentMethod = "ONLINE",
    inclusions = [],
  }) {
    try {
      const company = await Company.findById(companyId).lean();
      if (!company) {
        console.warn("[PurchaseService] Company not found for order confirmation email:", companyId);
        return;
      }

      let recipientUser = null;
      if (userId) {
        recipientUser = await User.findById(userId).lean();
      }
      if (!recipientUser) {
        recipientUser = await User.findOne({ companyId, role: "CLIENT" }).lean();
      }

      // Collect recipient email addresses (deduplicated)
      const recipientEmails = new Set();
      if (recipientUser?.email) recipientEmails.add(recipientUser.email.trim().toLowerCase());
      if (company.email) recipientEmails.add(company.email.trim().toLowerCase());

      if (recipientEmails.size === 0) {
        console.warn("[PurchaseService] No valid recipient email found for order confirmation:", companyId);
        return;
      }

      const clientName = recipientUser?.name || company.contactPerson || company.name || "Valued Client";

      // Formulate customer code and transaction ID format matching the reference specification
      // e.g. Customer code: 260908CS21265690, Transaction ID: 260908TS43352860
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const datePrefix = `${yy}${mm}${dd}`;

      const customerCode = company.customerCode || `${datePrefix}CS${String(company._id).slice(-8).toUpperCase()}`;
      const resolvedTxnId = paymentId || transactionId || orderNumber || `${datePrefix}TS${String(Date.now()).slice(-8)}`;

      // Generate dynamic Tax Invoice PDF Buffer with embedded QR Code & Maven Branding
      let invoiceBuffer = null;
      try {
        const invData = buildInvoiceData({
          company,
          user: recipientUser,
          invoiceNumber,
          orderNumber,
          paymentId: resolvedTxnId,
          serviceTitle,
          amount,
          validityDays,
          expiryDate,
        });
        invoiceBuffer = await generateInvoicePdfBuffer(invData);
      } catch (pdfErr) {
        console.warn("[PurchaseService] Warning generating invoice PDF buffer:", pdfErr?.message);
      }

      const { sendOrderConfirmationEmail } = require("../email.service");

      for (const email of recipientEmails) {
        sendOrderConfirmationEmail({
          to: email,
          fullName: clientName,
          companyName: company.name,
          serviceTitle,
          customerCode,
          transactionId: resolvedTxnId,
          orderNumber,
          invoiceNumber,
          invoiceBuffer,
          amount,
          validityDays,
          expiryDate,
          inclusions,
          paymentMethod,
        }).catch((sendErr) => {
          console.error(`[PurchaseService] Failed to send order confirmation to ${email}:`, sendErr?.message || sendErr);
        });
      }
    } catch (err) {
      console.error("[PurchaseService] sendOrderConfirmationNotification error:", err?.message || err);
    }
  }

  /**
   * Helper to resolve plan tier rank strictly using the hierarchy:
   * FREE (0) < SMB (1) < CORPORATE / CUSTOM (2) < ENTERPRISE (3)
   */
  static resolvePlanTierRank(planOrType) {
    if (!planOrType) return 0;
    const PLAN_TIER_RANK = { FREE: 0, SMB: 1, CORPORATE: 2, ENTERPRISE: 3, CUSTOM: 2 };
    const str = (
      typeof planOrType === "string"
        ? planOrType
        : String(planOrType.planType || planOrType.code || planOrType.name || "")
    ).toUpperCase();
    if (str.includes("ENTERPRISE")) return 3;
    if (str.includes("CORPORATE")) return 2;
    if (str.includes("SMB")) return 1;
    if (str.includes("FREE")) return 0;
    return PLAN_TIER_RANK[str] ?? 1;
  }

  /**
   * Deterministic plan transition classifier:
   * - DOWNGRADE: New tier is lower than current active tier. Deferred: starts only after current plan ends.
   * - SAME_LEVEL_RENEWAL: New tier is same as current active tier. Immediate: merges credits and extends old validity to new plan end date.
   * - UPGRADE: New tier is higher than current active tier. Immediate: stacks credits with dual independent expiry dates (FIFO earliest-expiry first).
   * - FRESH_START: Current plan is expired or free tier. Immediate: vanishes stale credits, allocates fresh credits.
   */
  static classifyPlanTransition({ currentCompany, currentActiveSub, newPlan, newPlanVersion, isRenewal = false }) {
    const now = new Date();

    const isCurrentPlanExpired = Boolean(
      !currentActiveSub ||
      new Date(currentActiveSub.endDate) < now ||
      currentActiveSub.status !== "ACTIVE" ||
      currentCompany?.commercialStatus === "EXPIRED_GRACE" ||
      currentCompany?.commercialStatus === "EXPIRED_LOCKED" ||
      currentCompany?.commercialStatus === "NO_PLAN" ||
      (currentCompany?.planSnapshot?.endDate && new Date(currentCompany.planSnapshot.endDate) < now) ||
      (currentCompany?.packageExpiresAt && new Date(currentCompany.packageExpiresAt) < now)
    );

    const isFreePlan =
      String(newPlan.planType || "").toUpperCase() === "FREE" ||
      String(newPlan.code || "").toUpperCase() === "FREE" ||
      Number(newPlanVersion?.finalPrice || 0) === 0;

    const currentRank = this.resolvePlanTierRank(
      currentActiveSub?.commercialSnapshot?.planType ||
      currentCompany?.planSnapshot?.planType ||
      currentActiveSub?.commercialSnapshot?.planName ||
      currentCompany?.planSnapshot?.planName
    );
    const newRank = this.resolvePlanTierRank(newPlan);

    const isCurrentPlanFree =
      currentRank === 0 ||
      String(currentActiveSub?.commercialSnapshot?.planType || "").toUpperCase() === "FREE" ||
      String(currentActiveSub?.commercialSnapshot?.planName || "").toUpperCase().includes("FREE") ||
      String(currentCompany?.planSnapshot?.planType || "").toUpperCase() === "FREE" ||
      String(currentCompany?.planSnapshot?.planName || "").toUpperCase().includes("FREE") ||
      Number(currentActiveSub?.commercialSnapshot?.pricePaid || 0) === 0;

    // Deterministic hierarchy check:
    // If current plan is active and new plan tier is higher, it is an UPGRADE
    if (!isCurrentPlanExpired && currentActiveSub && newRank > currentRank) {
      return {
        transitionType: "UPGRADE",
        reason: `New plan (${newPlan.name}, tier ${newRank}) is higher than current plan (tier ${currentRank}). Starts immediately; credits stack with dual independent expiry dates.`,
        isImmediate: true,
        currentRank,
        newRank,
      };
    }

    // If current plan is expired, there is no active subscription, OR transitioning from a free tier grant without an upgrade:
    if (isCurrentPlanExpired || !currentActiveSub || isCurrentPlanFree) {
      return {
        transitionType: "FRESH_START",
        reason: isCurrentPlanFree
          ? "Transitioning from Free tier grant. Promotional free credits vanish so new plan starts fresh."
          : "Current plan is expired or inactive. Starting fresh plan with new incoming credits.",
        isImmediate: true,
        currentRank: 0,
        newRank,
      };
    }

    if (newRank < currentRank) {
      return {
        transitionType: "DOWNGRADE",
        reason: `New plan (${newPlan.name}, tier ${newRank}) is lower than current active plan (tier ${currentRank}). Starts only after current plan ends.`,
        isImmediate: false,
        scheduledStartDate: currentActiveSub.endDate,
        currentRank,
        newRank,
      };
    }

    if (newRank === currentRank) {
      return {
        transitionType: "SAME_LEVEL_RENEWAL",
        reason: `New plan (${newPlan.name}) is same tier as current plan. Starts immediately; remaining credits merge and validity extends to new plan end date.`,
        isImmediate: true,
        currentRank,
        newRank,
      };
    }

    // newRank > currentRank
    return {
      transitionType: "UPGRADE",
      reason: `New plan (${newPlan.name}, tier ${newRank}) is higher than current plan (tier ${currentRank}). Starts immediately; credits stack with dual independent expiry dates.`,
      isImmediate: true,
      currentRank,
      newRank,
    };
  }

  /**
   * Purchase a bundled plan
   */
  static async purchasePlan({
    companyId,
    userId,
    planId,
    versionId = null,
    paymentMethod = "ONLINE",
    transactionId = "",
    actor = {},
    isUpgrade = false,
    isRenewal = false,
  }) {
    const plan = await Plan.findById(planId);
    if (!plan || plan.status === "ARCHIVED") {
      const error = new Error("Plan not found or archived");
      error.statusCode = 404;
      throw error;
    }

    // Determine target version: either explicitly requested or current published version
    let planVersion = null;
    if (versionId) {
      planVersion = await PlanVersion.findById(versionId);
    } else {
      planVersion = await PlanVersion.findOne({ planId, status: "PUBLISHED" });
    }

    if (!planVersion) {
      const error = new Error("No published version available for this plan");
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    const validityDays = Number(planVersion.validity || 90);
    const gracePeriodDays = Number(
      planVersion.gracePeriodDays !== undefined
        ? planVersion.gracePeriodDays
        : (plan.gracePeriodDays !== undefined ? plan.gracePeriodDays : 90)
    );
    const effectiveUserId = userId || actor.id || actor._id || null;

    // Fetch current company record early to inspect commercialStatus and planSnapshot
    const currentCompany = await Company.findById(companyId);

    // Detect if this company has an existing active plan
    let currentActiveSub = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });

    if (!currentActiveSub && isUpgrade && !isRenewal) {
      currentActiveSub = await Subscription.findOne({
        companyId,
        subscriptionType: "PLAN",
        status: "ACTIVE",
      }).sort({ createdAt: -1 });
    }

    // Classify transition deterministically
    const transition = this.classifyPlanTransition({
      currentCompany,
      currentActiveSub,
      newPlan: plan,
      newPlanVersion: planVersion,
      isRenewal,
    });
    const transitionType = transition.transitionType; // "DOWNGRADE" | "SAME_LEVEL_RENEWAL" | "UPGRADE" | "FRESH_START"

    // 1. Create CommercialOrder (Full listed price of plan)
    const company = await Company.findById(companyId);
    const orderNumber = await this.generateOrderId(company);
    const paymentId = await this.generatePaymentId(paymentMethod);
    const invoiceNumber = generateInvoiceNumber(plan.code || plan.planType || "PLAN");

    const order = await CommercialOrder.create({
      orderNumber,
      invoiceNumber,
      paymentId,
      companyId,
      userId: effectiveUserId,
      items: [
        {
          itemType: "PLAN",
          referenceId: plan._id,
          skuOrCode: plan.code,
          title: `${plan.name} v${planVersion.version}`,
          quantity: 1,
          unitPrice: planVersion.basePrice,
          amount: planVersion.finalPrice,
          validityDays,
        },
      ],
      subtotal: planVersion.basePrice,
      discountAmount: planVersion.discount,
      taxType: planVersion.taxType || "IGST",
      igstRate: planVersion.taxType === "CGST_SGST" ? 0 : (planVersion.igstRate !== undefined ? planVersion.igstRate : (planVersion.taxPercent || 18)),
      cgstRate: planVersion.taxType === "IGST" ? 0 : (planVersion.cgstRate || 0),
      sgstRate: planVersion.taxType === "IGST" ? 0 : (planVersion.sgstRate || 0),
      igstAmount: planVersion.taxType === "CGST_SGST" ? 0 : (planVersion.igstAmount !== undefined ? planVersion.igstAmount : (planVersion.taxAmount || 0)),
      cgstAmount: planVersion.taxType === "IGST" ? 0 : (planVersion.cgstAmount || 0),
      sgstAmount: planVersion.taxType === "IGST" ? 0 : (planVersion.sgstAmount || 0),
      taxAmount: planVersion.taxAmount,
      totalAmount: planVersion.finalPrice,
      currency: planVersion.currency || "INR",
      status: "COMPLETED",
      paymentMethod,
    });

    // 2. Create CommercialPayment
    const payment = await CommercialPayment.create({
      orderId: order._id,
      companyId,
      gateway: paymentMethod === "ONLINE" ? "RAZORPAY" : "SIMULATED",
      gatewayPaymentId: transactionId || paymentId,
      paymentId,
      invoiceNumber,
      amount: planVersion.finalPrice,
      currency: planVersion.currency || "INR",
      status: "SUCCESS",
    });

    // ════════════════════════════════════════════════════════════════════════
    // ROUTE 1: DOWNGRADE (Higher -> Lower, starts ONLY after current plan ends)
    // ════════════════════════════════════════════════════════════════════════
    if (transitionType === "DOWNGRADE") {
      const scheduledStartDate = currentActiveSub.endDate;
      const scheduledEndDate = new Date(new Date(scheduledStartDate).getTime() + validityDays * 24 * 60 * 60 * 1000);

      const productIds = (planVersion.items || []).map((i) => i.productId).filter(Boolean);
      const catalogProds = await Product.find({ _id: { $in: productIds } }).lean();
      const catalogProductMap = new Map(catalogProds.map((p) => [String(p._id), p]));

      const entitlementSnapshot = (planVersion.items || []).map((item) => {
        const code = String(item.productCode || "").toUpperCase();
        const isAiCredit = code === "AI_CREDIT" || code.includes("AI");
        let pName = item.productName;
        if (code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
          pName = "Max CV Access";
        } else if (code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
          pName = "Max NVite Credits";
        }

        const catalogProd = catalogProductMap.get(String(item.productId));
        const resolvedFeatures =
          item.features && item.features.length > 0
            ? item.features
            : (catalogProd?.features && catalogProd.features.length > 0
                ? catalogProd.features
                : (DEFAULT_PRODUCT_FEATURES[code] || []));

        let itemValidityDays;
        let itemExpiry;

        if (isAiCredit) {
          const sDate = new Date(scheduledStartDate);
          const endOfMonth = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0, 23, 59, 59, 999);
          itemExpiry = new Date(Math.min(endOfMonth.getTime(), scheduledEndDate.getTime()));
          itemValidityDays = Math.max(1, Math.ceil((itemExpiry - sDate) / (1000 * 60 * 60 * 24)));
        } else {
          itemValidityDays = validityDays;
          itemExpiry = scheduledEndDate;
        }

        return {
          productId: item.productId,
          productCode: item.productCode,
          productName: pName,
          quantity: item.quantity,
          basePlanQuantity: item.quantity,
          rolledOverQuantity: 0,
          unit: item.unit,
          validityDays: itemValidityDays,
          features: resolvedFeatures,
          expiryDate: itemExpiry,
        };
      });

      const subscription = await Subscription.create({
        companyId,
        subscriptionType: "PLAN",
        planId: plan._id,
        planVersionId: planVersion._id,
        planVersionNumber: planVersion.version,
        status: "SCHEDULED",
        startDate: scheduledStartDate,
        endDate: scheduledEndDate,
        scheduledStartDate,
        commercialSnapshot: {
          pricePaid: planVersion.finalPrice,
          basePrice: planVersion.basePrice,
          discount: planVersion.discount,
          taxPaid: planVersion.taxAmount,
          currency: planVersion.currency || "INR",
          planName: plan.name,
          planType: plan.planType,
          validityDays,
          gracePeriodDays,
          purchasedAt: now,
          isScheduled: true,
          isDowngrade: true,
          transitionType: "DOWNGRADE",
          previousSubscriptionId: currentActiveSub._id,
          orderNumber,
          paymentId,
          invoiceNumber,
        },
        entitlementSnapshot,
        orderId: order._id,
        orderNumber,
        paymentId,
        invoiceNumber,
      });

      // Update Company with scheduled plan metadata
      await Company.findByIdAndUpdate(companyId, {
        $set: {
          scheduledPlan: {
            subscriptionId: subscription._id,
            planId: plan._id,
            planVersionId: planVersion._id,
            planVersionNumber: planVersion.version,
            planName: plan.name,
            planCode: plan.code,
            planType: plan.planType,
            billingCycle: planVersion.billingCycle,
            validity: validityDays,
            validityUnit: planVersion.validityUnit || "DAYS",
            gracePeriodDays,
            startDate: scheduledStartDate,
            endDate: scheduledEndDate,
            scheduledAt: now,
            services: entitlementSnapshot,
          },
        },
      });

      await AuditLogService.log({
        action: "SCHEDULE_DOWNGRADE",
        targetType: "SUBSCRIPTION",
        targetId: subscription._id,
        targetName: `${plan.name} v${planVersion.version}`,
        performedBy: actor,
        beforeSnapshot: currentActiveSub ? currentActiveSub.toObject() : null,
        afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
        reason: `Plan downgrade scheduled. Will activate on ${scheduledStartDate.toISOString()} after current plan ends.`,
      });

      this.sendOrderConfirmationNotification({
        companyId,
        userId: effectiveUserId,
        serviceTitle: `${plan.name} (Scheduled to start ${new Date(scheduledStartDate).toLocaleDateString()})`,
        transactionId: payment.paymentId || payment.gatewayPaymentId || transactionId,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        invoiceNumber,
        amount: planVersion.finalPrice,
        validityDays,
        expiryDate: scheduledEndDate,
        paymentMethod,
        inclusions: entitlementSnapshot.map((s) => ({
          quantity: s.quantity,
          unit: s.unit || "Credit",
          name: s.productName,
        })),
      }).catch(() => {});

      return {
        success: true,
        subscription,
        order,
        payment,
        transitionType: "DOWNGRADE",
        isScheduled: true,
        scheduledStartDate,
        message: `Plan purchase successful. Your ${plan.name} is scheduled to start on ${new Date(scheduledStartDate).toLocaleDateString()} after your current plan ends.`,
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // ROUTE 2: SAME-LEVEL RENEWAL (Same tier, immediate merge, extended validity)
    // ════════════════════════════════════════════════════════════════════════
    if (transitionType === "SAME_LEVEL_RENEWAL") {
      const endDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

      // 1. Gather remaining unused credits from current active plan
      const oldActiveEntitlements = await Entitlement.find({
        companyId,
        status: "ACTIVE",
        expiryDate: { $gte: now },
        remainingQuantity: { $gt: 0 },
        ...(currentActiveSub ? { subscriptionId: currentActiveSub._id } : {}),
      });

      const rolloverCreditsMap = {};
      for (const ent of oldActiveEntitlements) {
        const code = String(ent.productCode || "").toUpperCase();
        const isAi = code === "AI_CREDIT" || code.includes("AI");
        if (!isAi && ent.remainingQuantity > 0) {
          rolloverCreditsMap[code] = (rolloverCreditsMap[code] || 0) + ent.remainingQuantity;
        }
      }

      // Check company planSnapshot for remaining balance as fallback
      if (currentCompany?.planSnapshot?.services && Array.isArray(currentCompany.planSnapshot.services)) {
        for (const s of currentCompany.planSnapshot.services) {
          const code = String(s.productCode || "").toUpperCase();
          const isAi = code === "AI_CREDIT" || code.includes("AI");
          if (!isAi) {
            const unusedInSnapshot = Math.max(0, (s.quantity || 0) - (s.usedQuantity || 0));
            rolloverCreditsMap[code] = Math.max(rolloverCreditsMap[code] || 0, unusedInSnapshot);
          }
        }
      }

      // 2. Mark old active subscription as SUPERSEDED
      if (currentActiveSub) {
        currentActiveSub.status = "SUPERSEDED";
        await currentActiveSub.save();
      }

      // 3. Mark old active entitlements as SUPERSEDED and log rollover to CreditLedger
      for (const ent of oldActiveEntitlements) {
        if (ent.remainingQuantity > 0) {
          await CreditLedgerService.recordEntry({
            companyId,
            subscriptionId: currentActiveSub ? currentActiveSub._id : null,
            entitlementId: ent._id,
            productId: ent.productId,
            productCode: ent.productCode,
            transactionType: "RENEWAL_EXTENSION_ROLLOVER",
            quantity: -ent.remainingQuantity,
            balanceAfter: 0,
            referenceType: "SubscriptionExtension",
            referenceId: String(order._id),
            expiryDate: endDate,
            notes: `Rolled over ${ent.remainingQuantity} credits into same-level plan with validity extended to ${endDate.toISOString().slice(0, 10)}`,
            createdBy: actor,
          });
        }
      }

      await Entitlement.updateMany(
        {
          companyId,
          status: "ACTIVE",
          ...(currentActiveSub ? { subscriptionId: currentActiveSub._id } : {}),
        },
        {
          $set: {
            status: "SUPERSEDED",
            remainingQuantity: 0,
          },
        }
      );

      // 4. Build Entitlement Snapshot with merged quantities (old + new) and extended validity
      const productIds = (planVersion.items || []).map((i) => i.productId).filter(Boolean);
      const catalogProds = await Product.find({ _id: { $in: productIds } }).lean();
      const catalogProductMap = new Map(catalogProds.map((p) => [String(p._id), p]));
      const handledProductCodes = new Set();

      const entitlementSnapshot = (planVersion.items || []).map((item) => {
        const code = String(item.productCode || "").toUpperCase();
        handledProductCodes.add(code);
        const isAiCredit = code === "AI_CREDIT" || code.includes("AI");

        let itemValidityDays;
        let itemExpiry;

        if (isAiCredit) {
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          itemExpiry = new Date(Math.min(endOfMonth.getTime(), endDate.getTime()));
          itemValidityDays = Math.max(1, Math.ceil((itemExpiry - now) / (1000 * 60 * 60 * 24)));
        } else {
          // Both old and new credits valid until new plan endDate
          itemValidityDays = validityDays;
          itemExpiry = endDate;
        }

        const rolloverQty = !isAiCredit ? (rolloverCreditsMap[code] || 0) : 0;
        const totalQuantity = (item.quantity || 0) + rolloverQty;

        let pName = item.productName;
        if (code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
          pName = "Max CV Access";
        } else if (code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
          pName = "Max NVite Credits";
        }

        const catalogProd = catalogProductMap.get(String(item.productId));
        const resolvedFeatures =
          item.features && item.features.length > 0
            ? item.features
            : (catalogProd?.features && catalogProd.features.length > 0
                ? catalogProd.features
                : (DEFAULT_PRODUCT_FEATURES[code] || []));

        return {
          productId: item.productId,
          productCode: item.productCode,
          productName: pName,
          quantity: totalQuantity,
          basePlanQuantity: item.quantity,
          rolledOverQuantity: rolloverQty,
          unit: item.unit,
          validityDays: itemValidityDays,
          features: resolvedFeatures,
          expiryDate: itemExpiry,
        };
      });

      // 5. Create new Subscription
      const subscription = await Subscription.create({
        companyId,
        subscriptionType: "PLAN",
        planId: plan._id,
        planVersionId: planVersion._id,
        planVersionNumber: planVersion.version,
        status: "ACTIVE",
        startDate: now,
        endDate,
        commercialSnapshot: {
          pricePaid: planVersion.finalPrice,
          basePrice: planVersion.basePrice,
          discount: planVersion.discount,
          taxPaid: planVersion.taxAmount,
          currency: planVersion.currency || "INR",
          planName: plan.name,
          planType: plan.planType,
          validityDays,
          gracePeriodDays,
          purchasedAt: now,
          transitionType: "SAME_LEVEL_RENEWAL",
          previousSubscriptionId: currentActiveSub ? currentActiveSub._id : null,
          orderNumber,
          paymentId,
          invoiceNumber,
        },
        entitlementSnapshot,
        orderId: order._id,
        orderNumber,
        paymentId,
        invoiceNumber,
      });

      // 6. Create Live Entitlements & Log Credit Ledger
      for (const snapItem of entitlementSnapshot) {
        const entitlement = await Entitlement.create({
          companyId,
          subscriptionId: subscription._id,
          productId: snapItem.productId,
          productCode: snapItem.productCode,
          productName: snapItem.productName,
          allocatedQuantity: snapItem.quantity,
          consumedQuantity: 0,
          remainingQuantity: snapItem.quantity,
          unit: snapItem.unit,
          features: snapItem.features,
          startDate: now,
          expiryDate: snapItem.expiryDate,
          status: "ACTIVE",
        });

        const rolledOver = snapItem.rolledOverQuantity || 0;
        await CreditLedgerService.recordEntry({
          companyId,
          subscriptionId: subscription._id,
          entitlementId: entitlement._id,
          productId: snapItem.productId,
          productCode: snapItem.productCode,
          transactionType: "PLAN_RENEWAL",
          quantity: snapItem.quantity,
          balanceAfter: snapItem.quantity,
          referenceType: "Order",
          referenceId: String(order._id),
          expiryDate: snapItem.expiryDate,
          notes: `Same-level plan renewal: ${plan.name} v${planVersion.version}${rolledOver > 0 ? ` (Includes ${rolledOver} rolled-over credits with validity extended to ${endDate.toISOString().slice(0, 10)})` : ""}`,
          createdBy: actor,
        });
      }

      await AuditLogService.log({
        action: "RENEW_PLAN",
        targetType: "SUBSCRIPTION",
        targetId: subscription._id,
        targetName: `${plan.name} v${planVersion.version}`,
        performedBy: actor,
        beforeSnapshot: currentActiveSub ? currentActiveSub.toObject() : null,
        afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
        reason: "Same-level plan renewed. Credits merged and validity extended.",
      });

      // 7. Update Company profile
      await this._syncCompanyProfile({
        companyId,
        plan,
        planVersion,
        subscription,
        entitlementSnapshot,
        validityDays,
        gracePeriodDays,
        endDate,
        now,
        isPlanUpgrade: true,
      });

      this.sendOrderConfirmationNotification({
        companyId,
        userId: effectiveUserId,
        serviceTitle: `${plan.name} (${validityDays} Days Validity)`,
        transactionId: payment.paymentId || payment.gatewayPaymentId || transactionId,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        invoiceNumber,
        amount: planVersion.finalPrice,
        validityDays,
        expiryDate: endDate,
        paymentMethod,
        inclusions: entitlementSnapshot.map((s) => ({
          quantity: s.quantity,
          unit: s.unit || "Credit",
          name: s.productName,
        })),
      }).catch(() => {});

      return {
        success: true,
        subscription,
        order,
        payment,
        transitionType: "SAME_LEVEL_RENEWAL",
        message: `Plan renewal successful. Your remaining credits have been merged and extended for ${validityDays} days.`,
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // ROUTE 3: UPGRADE (Lower -> Higher, immediate start, dual independent expiry)
    // ════════════════════════════════════════════════════════════════════════
    if (transitionType === "UPGRADE") {
      const endDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

      // 1. Mark old active subscription as UPGRADED
      if (currentActiveSub) {
        currentActiveSub.status = "UPGRADED";
        await currentActiveSub.save();
      }

      // 2. Dual-batch architecture:
      // All existing active entitlements (including AI credits and seats) from previous lower plan
      // RETAIN THEIR ORIGINAL EXPIRY DATE and remaining balance with ZERO vanishing!
      // New plan credits will be added on top, with FIFO (earliest expiry first) consumption.

      // 3. Gather old remaining quantities for display stacking in company profile
      const oldActiveEntitlements = await Entitlement.find({
        companyId,
        status: "ACTIVE",
        expiryDate: { $gte: now },
        remainingQuantity: { $gt: 0 },
        ...(currentActiveSub ? { subscriptionId: currentActiveSub._id } : {}),
      });

      const oldRemainingMap = {};
      for (const ent of oldActiveEntitlements) {
        const code = String(ent.productCode || "").toUpperCase();
        oldRemainingMap[code] = (oldRemainingMap[code] || 0) + ent.remainingQuantity;
      }

      // 4. Build Entitlement Snapshot for new upgraded subscription (pure new credits)
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const productIds = (planVersion.items || []).map((i) => i.productId).filter(Boolean);
      const catalogProds = await Product.find({ _id: { $in: productIds } }).lean();
      const catalogProductMap = new Map(catalogProds.map((p) => [String(p._id), p]));

      const entitlementSnapshot = (planVersion.items || []).map((item) => {
        const code = String(item.productCode || "").toUpperCase();
        const isAiCredit = code === "AI_CREDIT" || code.includes("AI");

        let itemValidityDays;
        let itemExpiry;

        if (isAiCredit) {
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          itemExpiry = new Date(Math.min(endOfMonth.getTime(), endDate.getTime()));
          itemValidityDays = Math.max(1, Math.ceil((itemExpiry - now) / (1000 * 60 * 60 * 24)));
        } else {
          itemValidityDays = validityDays;
          itemExpiry = endDate;
        }

        let pName = item.productName;
        if (code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
          pName = "Max CV Access";
        } else if (code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
          pName = "Max NVite Credits";
        }

        const catalogProd = catalogProductMap.get(String(item.productId));
        let resolvedFeatures =
          item.features && item.features.length > 0
            ? [...item.features]
            : (catalogProd?.features && catalogProd.features.length > 0
                ? [...catalogProd.features]
                : [...(DEFAULT_PRODUCT_FEATURES[code] || [])]);

        if (isAiCredit) {
          if (!resolvedFeatures.some((f) => f.key === `monthlyAllocation_${currentMonthKey}`)) {
            resolvedFeatures.unshift({
              key: `monthlyAllocation_${currentMonthKey}`,
              name: `Monthly Allocation (${currentMonthKey})`,
              enabled: true,
            });
          }
        }

        return {
          productId: item.productId,
          productCode: item.productCode,
          productName: pName,
          quantity: item.quantity,
          basePlanQuantity: item.quantity,
          rolledOverQuantity: 0,
          unit: item.unit,
          validityDays: itemValidityDays,
          features: resolvedFeatures,
          expiryDate: itemExpiry,
        };
      });

      // 5. Create new Subscription
      const subscription = await Subscription.create({
        companyId,
        subscriptionType: "PLAN",
        planId: plan._id,
        planVersionId: planVersion._id,
        planVersionNumber: planVersion.version,
        status: "ACTIVE",
        startDate: now,
        endDate,
        commercialSnapshot: {
          pricePaid: planVersion.finalPrice,
          basePrice: planVersion.basePrice,
          discount: planVersion.discount,
          taxPaid: planVersion.taxAmount,
          currency: planVersion.currency || "INR",
          planName: plan.name,
          planType: plan.planType,
          validityDays,
          gracePeriodDays,
          purchasedAt: now,
          isUpgrade: true,
          transitionType: "UPGRADE",
          upgradedFromSubscriptionId: currentActiveSub ? currentActiveSub._id : null,
          orderNumber,
          paymentId,
          invoiceNumber,
        },
        entitlementSnapshot,
        orderId: order._id,
        orderNumber,
        paymentId,
        invoiceNumber,
      });

      // 6. Create Live Entitlements for the new plan batch & Log CreditLedger
      for (const snapItem of entitlementSnapshot) {
        const entitlement = await Entitlement.create({
          companyId,
          subscriptionId: subscription._id,
          productId: snapItem.productId,
          productCode: snapItem.productCode,
          productName: snapItem.productName,
          allocatedQuantity: snapItem.quantity,
          consumedQuantity: 0,
          remainingQuantity: snapItem.quantity,
          unit: snapItem.unit,
          features: snapItem.features,
          startDate: now,
          expiryDate: snapItem.expiryDate,
          status: "ACTIVE",
        });

        // Compute total balance after (combining both batches)
        const activeSame = await Entitlement.find({
          companyId,
          productCode: snapItem.productCode,
          status: "ACTIVE",
          expiryDate: { $gte: now },
          remainingQuantity: { $gt: 0 },
        });
        const balanceAfter = activeSame.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

        await CreditLedgerService.recordEntry({
          companyId,
          subscriptionId: subscription._id,
          entitlementId: entitlement._id,
          productId: snapItem.productId,
          productCode: snapItem.productCode,
          transactionType: "PLAN_UPGRADE",
          quantity: snapItem.quantity,
          balanceAfter,
          referenceType: "Order",
          referenceId: String(order._id),
          expiryDate: snapItem.expiryDate,
          notes: `Plan upgrade to ${plan.name} v${planVersion.version}. New tier credits active (stacked with previous credits).`,
          createdBy: actor,
        });
      }

      await AuditLogService.log({
        action: "UPGRADE_PLAN",
        targetType: "SUBSCRIPTION",
        targetId: subscription._id,
        targetName: `${plan.name} v${planVersion.version}`,
        performedBy: actor,
        beforeSnapshot: currentActiveSub ? currentActiveSub.toObject() : null,
        afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
        reason: "Plan upgraded immediately. Credits stacked with independent FIFO expiry.",
      });

      // 7. Update Company profile (display stacked quantities: old remaining + new)
      await this._syncCompanyProfile({
        companyId,
        plan,
        planVersion,
        subscription,
        entitlementSnapshot,
        validityDays,
        gracePeriodDays,
        endDate,
        now,
        isPlanUpgrade: true,
        stackedOldCreditsMap: oldRemainingMap,
        oldActiveEntitlements,
      });

      this.sendOrderConfirmationNotification({
        companyId,
        userId: effectiveUserId,
        serviceTitle: `${plan.name} (${validityDays} Days Validity)`,
        transactionId: payment.paymentId || payment.gatewayPaymentId || transactionId,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        invoiceNumber,
        amount: planVersion.finalPrice,
        validityDays,
        expiryDate: endDate,
        paymentMethod,
        inclusions: entitlementSnapshot.map((s) => ({
          quantity: s.quantity,
          unit: s.unit || "Credit",
          name: s.productName,
        })),
      }).catch(() => {});

      return {
        success: true,
        subscription,
        order,
        payment,
        transitionType: "UPGRADE",
        isUpgrade: true,
        message: `Plan upgrade to ${plan.name} successful. Account upgraded immediately, credits stacked with earliest-expiry priority.`,
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // ROUTE 4: FRESH_START (Expired plan, no plan, or Free plan)
    // ════════════════════════════════════════════════════════════════════════
    // Vanish all stale plan entitlements per Q2.7 policy so new plan starts fresh
    const activeStandaloneSubs = await Subscription.find({
      companyId,
      subscriptionType: { $in: ["STANDALONE", "ADD_ON"] },
      status: "ACTIVE",
      endDate: { $gte: now },
    }).select("_id");
    const activeStandaloneSubIds = activeStandaloneSubs.map((s) => s._id);

    const stalePlanEnts = await Entitlement.find({
      companyId,
      status: "ACTIVE",
      subscriptionId: { $nin: activeStandaloneSubIds },
    });

    for (const ent of stalePlanEnts) {
      if (ent.remainingQuantity > 0) {
        await CreditLedgerService.recordEntry({
          companyId,
          subscriptionId: ent.subscriptionId || null,
          entitlementId: ent._id,
          productId: ent.productId,
          productCode: ent.productCode,
          transactionType: "EXPIRED",
          quantity: -ent.remainingQuantity,
          balanceAfter: 0,
          referenceType: isRenewal ? "SubscriptionRenewal" : "PlanExpiryRenewal",
          referenceId: String(ent.subscriptionId || order._id),
          expiryDate: now,
          notes: `Unused credits vanished upon plan end/renewal (Q2.7 policy)`,
          createdBy: actor,
        });
      }
    }

    await Entitlement.updateMany(
      {
        companyId,
        status: "ACTIVE",
        subscriptionId: { $nin: activeStandaloneSubIds },
      },
      {
        $set: {
          status: "EXPIRED",
          remainingQuantity: 0,
        },
      }
    );

    await Subscription.updateMany(
      {
        companyId,
        subscriptionType: "PLAN",
        status: "ACTIVE",
      },
      {
        $set: {
          status: "EXPIRED",
        },
      }
    );

    // Build fresh entitlement snapshot
    const endDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const productIds = (planVersion.items || []).map((i) => i.productId).filter(Boolean);
    const catalogProds = await Product.find({ _id: { $in: productIds } }).lean();
    const catalogProductMap = new Map(catalogProds.map((p) => [String(p._id), p]));

    const entitlementSnapshot = (planVersion.items || []).map((item) => {
      const code = String(item.productCode || "").toUpperCase();
      const isAiCredit = code === "AI_CREDIT" || code.includes("AI");

      let itemValidityDays;
      let itemExpiry;

      if (isAiCredit) {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        itemExpiry = new Date(Math.min(endOfMonth.getTime(), endDate.getTime()));
        itemValidityDays = Math.max(1, Math.ceil((itemExpiry - now) / (1000 * 60 * 60 * 24)));
      } else {
        itemValidityDays = validityDays;
        itemExpiry = endDate;
      }

      let pName = item.productName;
      if (code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
        pName = "Max CV Access";
      } else if (code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
        pName = "Max NVite Credits";
      }

      const catalogProd = catalogProductMap.get(String(item.productId));
      const resolvedFeatures =
        item.features && item.features.length > 0
          ? item.features
          : (catalogProd?.features && catalogProd.features.length > 0
              ? catalogProd.features
              : (DEFAULT_PRODUCT_FEATURES[code] || []));

      return {
        productId: item.productId,
        productCode: item.productCode,
        productName: pName,
        quantity: item.quantity,
        basePlanQuantity: item.quantity,
        rolledOverQuantity: 0,
        unit: item.unit,
        validityDays: itemValidityDays,
        features: resolvedFeatures,
        expiryDate: itemExpiry,
      };
    });

    const subscription = await Subscription.create({
      companyId,
      subscriptionType: "PLAN",
      planId: plan._id,
      planVersionId: planVersion._id,
      planVersionNumber: planVersion.version,
      status: "ACTIVE",
      startDate: now,
      endDate,
      commercialSnapshot: {
        pricePaid: planVersion.finalPrice,
        basePrice: planVersion.basePrice,
        discount: planVersion.discount,
        taxPaid: planVersion.taxAmount,
        currency: planVersion.currency || "INR",
        planName: plan.name,
        planType: plan.planType,
        validityDays,
        gracePeriodDays,
        purchasedAt: now,
        transitionType: "FRESH_START",
        orderNumber,
        paymentId,
        invoiceNumber,
      },
      entitlementSnapshot,
      orderId: order._id,
      orderNumber,
      paymentId,
      invoiceNumber,
    });

    for (const snapItem of entitlementSnapshot) {
      const entitlement = await Entitlement.create({
        companyId,
        subscriptionId: subscription._id,
        productId: snapItem.productId,
        productCode: snapItem.productCode,
        productName: snapItem.productName,
        allocatedQuantity: snapItem.quantity,
        consumedQuantity: 0,
        remainingQuantity: snapItem.quantity,
        unit: snapItem.unit,
        features: snapItem.features,
        startDate: now,
        expiryDate: snapItem.expiryDate,
        status: "ACTIVE",
      });

      await CreditLedgerService.recordEntry({
        companyId,
        subscriptionId: subscription._id,
        entitlementId: entitlement._id,
        productId: snapItem.productId,
        productCode: snapItem.productCode,
        transactionType: "PLAN_PURCHASE",
        quantity: snapItem.quantity,
        balanceAfter: snapItem.quantity,
        referenceType: "Order",
        referenceId: String(order._id),
        expiryDate: snapItem.expiryDate,
        notes: `Plan purchase: ${plan.name} v${planVersion.version} (Fresh start)`,
        createdBy: actor,
      });
    }

    await AuditLogService.log({
      action: "PURCHASE_PLAN",
      targetType: "SUBSCRIPTION",
      targetId: subscription._id,
      targetName: `${plan.name} v${planVersion.version}`,
      performedBy: actor,
      afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
      reason: "Plan purchased successfully (fresh start)",
    });

    await this._syncCompanyProfile({
      companyId,
      plan,
      planVersion,
      subscription,
      entitlementSnapshot,
      validityDays,
      gracePeriodDays,
      endDate,
      now,
      isPlanUpgrade: false,
    });

    this.sendOrderConfirmationNotification({
      companyId,
      userId: effectiveUserId,
      serviceTitle: `${plan.name} (${validityDays} Days Validity)`,
      transactionId: payment.paymentId || payment.gatewayPaymentId || transactionId,
      orderNumber: order.orderNumber,
      paymentId: payment.paymentId,
      invoiceNumber,
      amount: planVersion.finalPrice,
      validityDays,
      expiryDate: endDate,
      paymentMethod,
      inclusions: entitlementSnapshot.map((s) => ({
        quantity: s.quantity,
        unit: s.unit || "Credit",
        name: s.productName,
      })),
    }).catch(() => {});

    return {
      success: true,
      subscription,
      order,
      payment,
      transitionType: "FRESH_START",
      message: `Plan purchase successful: ${plan.name}`,
    };
  }

  /**
   * Helper to synchronize Company profile planSnapshot, limits, and quotas
   */
  static async _syncCompanyProfile({
    companyId,
    plan,
    planVersion,
    subscription,
    entitlementSnapshot,
    validityDays,
    gracePeriodDays,
    endDate,
    now,
    isPlanUpgrade = false,
    stackedOldCreditsMap = {},
    oldActiveEntitlements = [],
  }) {
    const servicesSnapshot = entitlementSnapshot.map((snap) => {
      const code = String(snap.productCode || "").toUpperCase();
      const isAiCredit = code === "AI_CREDIT" || code.includes("AI");
      const itemValidity = isAiCredit ? 30 : validityDays;
      const stackedQty = (stackedOldCreditsMap[code] || 0) + snap.quantity;

      return {
        productId: snap.productId,
        productCode: snap.productCode,
        productName: snap.productName,
        category: "",
        productType: "",
        quantity: stackedQty,
        basePlanQuantity: snap.basePlanQuantity || snap.quantity,
        usedQuantity: 0,
        unit: snap.unit,
        validity: itemValidity,
        validityUnit: "DAYS",
        features: snap.features || [],
      };
    });

    // On upgrade: if old plan had active services not present in the new plan, retain them in snapshot until old plan expires
    if (isPlanUpgrade && Array.isArray(oldActiveEntitlements)) {
      for (const oldEnt of oldActiveEntitlements) {
        const codeUpper = String(oldEnt.productCode || "").toUpperCase();
        const alreadyInSnapshot = servicesSnapshot.some((s) => String(s.productCode || "").toUpperCase() === codeUpper);
        if (!alreadyInSnapshot && oldEnt.remainingQuantity > 0) {
          servicesSnapshot.push({
            productId: oldEnt.productId,
            productCode: oldEnt.productCode,
            productName: oldEnt.productName,
            category: "",
            productType: "",
            quantity: oldEnt.remainingQuantity,
            basePlanQuantity: oldEnt.allocatedQuantity || oldEnt.remainingQuantity,
            usedQuantity: 0,
            unit: oldEnt.unit || "Job",
            validity: Math.max(1, Math.ceil((new Date(oldEnt.expiryDate) - now) / (1000 * 60 * 60 * 24))),
            validityUnit: "DAYS",
            features: oldEnt.features || [],
          });
        }
      }
    }

    // Retain active standalone / booster add-on credits
    const activeAddons = await Entitlement.find({
      companyId,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).populate("subscriptionId");

    const standaloneAddons = activeAddons.filter(
      (e) => e.subscriptionId && (e.subscriptionId.subscriptionType === "STANDALONE" || e.subscriptionId.subscriptionType === "ADD_ON")
    );

    for (const addon of standaloneAddons) {
      const codeUpper = String(addon.productCode || "").toUpperCase();
      const existing = servicesSnapshot.find((s) => String(s.productCode || "").toUpperCase() === codeUpper);
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + (addon.remainingQuantity || 0);
      } else {
        servicesSnapshot.push({
          productId: addon.productId,
          productCode: addon.productCode,
          productName: addon.productName,
          category: "",
          productType: "",
          quantity: addon.remainingQuantity,
          usedQuantity: 0,
          unit: addon.unit || "Credit",
          validity: 30,
          validityUnit: "DAYS",
          features: addon.features || [],
        });
      }
    }

    const totalJobLimit = servicesSnapshot.reduce((sum, s) => {
      const sCode = String(s.productCode || "").toUpperCase();
      if (sCode.includes("JOB") || sCode.includes("VACANCY")) {
        return sum + (s.quantity || 0);
      }
      return sum;
    }, 0);

    const miviteService = servicesSnapshot.find((s) => String(s.productCode).toUpperCase() === "MIVITE");
    const hasHotVacancy = servicesSnapshot.some((s) => String(s.productCode).toUpperCase() === "HOT_VACANCY");

    const companyUpdate = {
      planSnapshot: {
        planId: plan._id,
        planVersionId: planVersion._id,
        planVersionNumber: planVersion.version,
        planName: plan.name,
        planCode: plan.code,
        planType: plan.planType,
        billingCycle: planVersion.billingCycle,
        validity: validityDays,
        validityUnit: planVersion.validityUnit || "DAYS",
        gracePeriodDays,
        startDate: now,
        endDate: endDate,
        assignedAt: now,
        services: servicesSnapshot,
      },
      packageExpiresAt: endDate,
      packageType: plan.name,
      profileHotVacancies: hasHotVacancy ? "Premium Hot Vacancy" : "Standard",
      commercialStatus: "ACTIVE",
      planGraceExpiresAt: null,
      jobLimit: totalJobLimit || 0,
      nviteLimit: miviteService ? (miviteService.quantity || 0) : 0,
      quotaConfig: {
        allocationPolicy: "full",
        weekly: { cvAccess: 0, nvite: 0 },
        monthly: { cvAccess: 0, nvite: 0 },
      },
    };

    if (!isPlanUpgrade) {
      companyUpdate.activeJobCount = 0;
      companyUpdate.openRoles = 0;
    }

    await Company.findByIdAndUpdate(companyId, { $set: companyUpdate });
  }

  /**
   * Synchronize Company.planSnapshot.services remaining counts with active Entitlements in real-time
   * Handles:
   * 1. Real-time expiry of past-due UPGRADED subscriptions (forfeiting unused old plan credits)
   * 2. Real-time expiry of individual past-due entitlements
   * 3. Removal of expired old plan services from company.planSnapshot.services
   * 4. Accurate subtraction of expired old plan credits, keeping only new plan data
   */
  static async syncCompanyPlanSnapshotWithActiveEntitlements(companyId) {
    const now = new Date();
    const company = await Company.findById(companyId);
    if (!company || !company.planSnapshot || !Array.isArray(company.planSnapshot.services)) return;

    // 1. Expire any UPGRADED subscriptions whose endDate has arrived
    const expiredUpgradedSubs = await Subscription.find({
      companyId,
      status: "UPGRADED",
      endDate: { $lt: now },
    });

    for (const oldSub of expiredUpgradedSubs) {
      oldSub.status = "EXPIRED";
      await oldSub.save();

      const oldEnts = await Entitlement.find({
        companyId,
        subscriptionId: oldSub._id,
        status: "ACTIVE",
      });

      for (const ent of oldEnts) {
        const forfeitedQty = ent.remainingQuantity || 0;
        ent.status = "EXPIRED";
        ent.remainingQuantity = 0;
        await ent.save();

        if (forfeitedQty > 0) {
          try {
            await CreditLedgerService.recordEntry({
              companyId,
              subscriptionId: oldSub._id,
              entitlementId: ent._id,
              productId: ent.productId,
              productCode: ent.productCode,
              transactionType: "EXPIRED",
              quantity: -forfeitedQty,
              balanceAfter: 0,
              referenceType: "OldPlanExpiry",
              referenceId: String(oldSub._id),
              expiryDate: oldSub.endDate,
              notes: `Unused credits from upgraded plan forfeited upon old plan expiry (${oldSub.endDate.toISOString().slice(0, 10)})`,
              createdBy: { id: "system", role: "REALTIME" },
            });
          } catch (_) {}
        }
      }
    }

    // 2. Real-time sweep for any other past-due active entitlements
    const pastEnts = await Entitlement.find({
      companyId,
      status: "ACTIVE",
      expiryDate: { $lt: now },
    });
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
            notes: `Credits expired upon entitlement end date`,
            createdBy: { id: "system", role: "REALTIME" },
          });
        } catch (_) {}
      }
    }

    // 3. Deduplicate any duplicate active AI_CREDIT entitlements under the same active plan subscription
    const activePlan = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });

    if (activePlan) {
      const activeAiEnts = await Entitlement.find({
        companyId,
        subscriptionId: activePlan._id,
        productCode: "AI_CREDIT",
        status: "ACTIVE",
        expiryDate: { $gte: now },
      }).sort({ createdAt: -1 });

      if (activeAiEnts.length > 1) {
        // Keep the newest/most specific one, expire duplicate(s)
        const [keepEnt, ...dupes] = activeAiEnts;
        for (const dupe of dupes) {
          dupe.status = "EXPIRED";
          dupe.remainingQuantity = 0;
          await dupe.save();
        }

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthlyExpiry = new Date(Math.min(endOfMonth.getTime(), new Date(activePlan.endDate).getTime()));
        if (new Date(keepEnt.expiryDate) > monthlyExpiry) {
          keepEnt.expiryDate = monthlyExpiry;
          await keepEnt.save();
        }
      }
    }

    // 4. Fetch live remaining credits from all active entitlements
    const activeEnts = await Entitlement.find({
      companyId,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    });

    const activeTotalsByCode = new Map();
    for (const ent of activeEnts) {
      const code = String(ent.productCode || "").toUpperCase();
      activeTotalsByCode.set(code, (activeTotalsByCode.get(code) || 0) + (ent.remainingQuantity || 0));
    }

    let modified = false;

    // 5. Clean up services: remove services of expired old plan when old plan has expired, keeping new plan data
    if (activePlan && Array.isArray(activePlan.entitlementSnapshot)) {
      const validProductCodes = new Set(
        activePlan.entitlementSnapshot.map((s) => String(s.productCode || "").toUpperCase())
      );

      const stillActiveUpgradedSubs = await Subscription.find({
        companyId,
        status: "UPGRADED",
        endDate: { $gte: now },
      });
      for (const uSub of stillActiveUpgradedSubs) {
        if (Array.isArray(uSub.entitlementSnapshot)) {
          for (const s of uSub.entitlementSnapshot) {
            validProductCodes.add(String(s.productCode || "").toUpperCase());
          }
        }
      }

      const activeAddonSubs = await Subscription.find({
        companyId,
        subscriptionType: { $in: ["STANDALONE", "ADD_ON"] },
        status: "ACTIVE",
        endDate: { $gte: now },
      });
      for (const aSub of activeAddonSubs) {
        if (Array.isArray(aSub.entitlementSnapshot)) {
          for (const s of aSub.entitlementSnapshot) {
            validProductCodes.add(String(s.productCode || "").toUpperCase());
          }
        }
      }

      const prevLen = company.planSnapshot.services.length;
      company.planSnapshot.services = company.planSnapshot.services.filter((s) => {
        const code = String(s.productCode || "").toUpperCase();
        const hasLiveCredits = (activeTotalsByCode.get(code) || 0) > 0;
        return validProductCodes.has(code) || hasLiveCredits;
      });

      if (company.planSnapshot.services.length !== prevLen) {
        modified = true;
      }
    }

    // 6. Synchronize quantity to match live remaining available credits
    for (const s of company.planSnapshot.services) {
      const code = String(s.productCode || "").toUpperCase();
      const liveAvailable = activeTotalsByCode.get(code) || 0;
      const currentRemaining = Math.max(0, (s.quantity || 0) - (s.usedQuantity || 0));
      if (liveAvailable !== currentRemaining) {
        s.quantity = liveAvailable + (s.usedQuantity || 0);
        modified = true;
      }
    }

    // 7. Keep company jobLimit and nviteLimit in sync
    const totalJobLimit = company.planSnapshot.services.reduce((sum, s) => {
      const sCode = String(s.productCode || "").toUpperCase();
      if (sCode.includes("JOB") || sCode.includes("VACANCY")) {
        return sum + (s.quantity || 0);
      }
      return sum;
    }, 0);
    const miviteService = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "MIVITE");

    if (company.jobLimit !== totalJobLimit) {
      company.jobLimit = totalJobLimit;
      modified = true;
    }
    if (miviteService && company.nviteLimit !== miviteService.quantity) {
      company.nviteLimit = miviteService.quantity;
      modified = true;
    }

    if (modified) {
      company.markModified("planSnapshot");
      await company.save();
    }
  }

  /**
   * Promote SCHEDULED subscriptions whose start date has arrived (Downgrade activation)
   * Can be called for a specific company or across all companies (cron/real-time)
   */
  static async activateScheduledSubscriptions(targetCompanyId = null) {
    const now = new Date();
    const query = {
      status: "SCHEDULED",
      startDate: { $lte: now },
    };
    if (targetCompanyId) {
      query.companyId = targetCompanyId;
    }

    // Find candidates eligible for activation
    const candidates = await Subscription.find(query).select("_id").lean();
    let activatedCount = 0;

    if (candidates.length > 0) {
      console.log(`[ScheduledPlanActivation] Found ${candidates.length} candidate scheduled subscription(s) to check (company filter: ${targetCompanyId || "ALL"}).`);
    }

    for (const cand of candidates) {
      // ATOMIC CLAIM: Atomically claim this subscription from SCHEDULED -> ACTIVE.
      // If multiple requests/crons run concurrently, exactly ONE request will match and update it.
      // All other concurrent requests will receive null and skip immediately, eliminating duplicate entitlements!
      const sub = await Subscription.findOneAndUpdate(
        { _id: cand._id, status: "SCHEDULED", startDate: { $lte: now } },
        { $set: { status: "ACTIVE" } },
        { returnDocument: "after" }
      );

      if (!sub) {
        // Already claimed/activated by another concurrent request!
        continue;
      }

      activatedCount++;
      const planName = sub.commercialSnapshot?.planName || "Scheduled Plan";
      console.log(`[ScheduledPlanActivation] Atomically claimed subscription ${sub._id} (${planName}) for company ${sub.companyId}...`);

      // 1. Expire and zero out ALL previous plan subscriptions for this company (Zero rollover on downgrade)
      const oldActiveSubs = await Subscription.find({
        companyId: sub.companyId,
        subscriptionType: "PLAN",
        status: { $in: ["ACTIVE", "UPGRADED", "SUPERSEDED"] },
        _id: { $ne: sub._id },
      });

      for (const oldSub of oldActiveSubs) {
        oldSub.status = "EXPIRED";
        await oldSub.save();
        console.log(`[ScheduledPlanActivation] Expired old subscription ${oldSub._id} (${oldSub.commercialSnapshot?.planName || "Plan"}) for company ${sub.companyId}`);

        const oldEnts = await Entitlement.find({
          companyId: sub.companyId,
          subscriptionId: oldSub._id,
          status: "ACTIVE",
        });

        for (const ent of oldEnts) {
          const forfeitedQty = ent.remainingQuantity || 0;
          ent.status = "EXPIRED";
          ent.remainingQuantity = 0;
          await ent.save();

          if (forfeitedQty > 0) {
            try {
              await CreditLedgerService.recordEntry({
                companyId: sub.companyId,
                subscriptionId: oldSub._id,
                entitlementId: ent._id,
                productId: ent.productId,
                productCode: ent.productCode,
                transactionType: "EXPIRED",
                quantity: -forfeitedQty,
                balanceAfter: 0,
                referenceType: "ScheduledTransitionExpiry",
                referenceId: String(oldSub._id),
                expiryDate: sub.startDate,
                notes: `Credits vanished upon scheduled plan activation - zero credits carried forward on downgrade`,
                createdBy: { id: "system", role: "TRANSITION" },
              });
            } catch (_) {}
          }
        }
      }

      // Also vanish any other unlinked stale plan entitlements
      const activeStandaloneSubs = await Subscription.find({
        companyId: sub.companyId,
        subscriptionType: { $in: ["STANDALONE", "ADD_ON"] },
        status: "ACTIVE",
        endDate: { $gte: now },
      }).select("_id");
      const activeStandaloneSubIds = activeStandaloneSubs.map((s) => s._id);

      const stalePlanEnts = await Entitlement.find({
        companyId: sub.companyId,
        status: "ACTIVE",
        subscriptionId: { $nin: [...activeStandaloneSubIds, sub._id] },
      });

      for (const ent of stalePlanEnts) {
        const forfeitedQty = ent.remainingQuantity || 0;
        ent.status = "EXPIRED";
        ent.remainingQuantity = 0;
        await ent.save();
        if (forfeitedQty > 0) {
          try {
            await CreditLedgerService.recordEntry({
              companyId: sub.companyId,
              subscriptionId: ent.subscriptionId || null,
              entitlementId: ent._id,
              productId: ent.productId,
              productCode: ent.productCode,
              transactionType: "EXPIRED",
              quantity: -forfeitedQty,
              balanceAfter: 0,
              referenceType: "ScheduledTransitionExpiry",
              referenceId: String(sub._id),
              expiryDate: sub.startDate,
              notes: `Stale credits vanished upon scheduled plan activation`,
              createdBy: { id: "system", role: "TRANSITION" },
            });
          } catch (_) {}
        }
      }

      console.log(`[ScheduledPlanActivation] Promoted subscription ${sub._id} (${planName}) to ACTIVE. Valid: ${sub.startDate.toISOString()} -> ${sub.endDate.toISOString()}`);

      // 2. IDEMPOTENCY GUARD: Remove any existing entitlements for this sub._id before creating
      // to guarantee exactly ONE clean batch of fresh entitlements is ever active for this plan.
      await Entitlement.deleteMany({ subscriptionId: sub._id });

      // 3. Create fresh live entitlements for the activated plan (EXACT base quantities, 0 rollover)
      let snapItems = sub.entitlementSnapshot;
      if ((!snapItems || snapItems.length === 0) && sub.planVersionId) {
        const planVer = await PlanVersion.findById(sub.planVersionId).lean();
        if (planVer && Array.isArray(planVer.items)) {
          snapItems = planVer.items;
        }
      }

      if (Array.isArray(snapItems)) {
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        for (const item of snapItems) {
          const code = String(item.productCode || "").toUpperCase();
          const isAiCredit = code === "AI_CREDIT" || code.includes("AI");

          let entExpiry;
          let entFeatures = Array.isArray(item.features) ? [...item.features] : [];

          if (isAiCredit) {
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            entExpiry = new Date(Math.min(endOfMonth.getTime(), sub.endDate.getTime()));
            if (!entFeatures.some((f) => f.key === `monthlyAllocation_${currentMonthKey}`)) {
              entFeatures.unshift({
                key: `monthlyAllocation_${currentMonthKey}`,
                name: `Monthly Allocation (${currentMonthKey})`,
                enabled: true,
              });
            }
          } else {
            entExpiry = item.expiryDate && new Date(item.expiryDate) > now ? item.expiryDate : sub.endDate;
          }

          // Idempotency: avoid creating duplicate entitlement if already created for this subscription and productCode
          const existingEnt = await Entitlement.findOne({
            companyId: sub.companyId,
            subscriptionId: sub._id,
            productCode: item.productCode,
            status: "ACTIVE",
            expiryDate: { $gte: now },
          });

          if (existingEnt) {
            continue;
          }

          const ent = await Entitlement.create({
            companyId: sub.companyId,
            subscriptionId: sub._id,
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            allocatedQuantity: item.quantity,
            consumedQuantity: 0,
            remainingQuantity: item.quantity,
            unit: item.unit || "Job",
            features: entFeatures,
            startDate: sub.startDate,
            expiryDate: entExpiry,
            status: "ACTIVE",
          });

          try {
            await CreditLedgerService.recordEntry({
              companyId: sub.companyId,
              subscriptionId: sub._id,
              entitlementId: ent._id,
              productId: item.productId,
              productCode: item.productCode,
              transactionType: "PLAN_PURCHASE",
              quantity: item.quantity,
              balanceAfter: item.quantity,
              referenceType: "SubscriptionActivation",
              referenceId: String(sub._id),
              expiryDate: entExpiry,
              notes: `Fresh credits activated from scheduled plan: ${planName}`,
              createdBy: { id: "system", role: "TRANSITION" },
            });
          } catch (_) {}
        }
        console.log(`[ScheduledPlanActivation] Created ${snapItems.length} fresh entitlement records for company ${sub.companyId} under plan ${planName}`);
      }

      // 4. Update Company model with activated plan
      const plan = sub.planId ? await Plan.findById(sub.planId).lean() : null;
      const planVersion = sub.planVersionId ? await PlanVersion.findById(sub.planVersionId).lean() : null;

      const servicesSnapshot = (snapItems || []).map((snap) => ({
        productId: snap.productId,
        productCode: snap.productCode,
        productName: snap.productName,
        category: "",
        productType: "",
        quantity: snap.quantity,
        basePlanQuantity: snap.basePlanQuantity || snap.quantity,
        usedQuantity: 0,
        unit: snap.unit,
        validity: snap.validityDays || sub.commercialSnapshot?.validityDays || 30,
        validityUnit: "DAYS",
        features: snap.features || [],
      }));

      const totalJobLimit = servicesSnapshot.reduce((sum, s) => {
        const sCode = String(s.productCode || "").toUpperCase();
        if (sCode.includes("JOB") || sCode.includes("VACANCY")) {
          return sum + (s.quantity || 0);
        }
        return sum;
      }, 0);

      const miviteService = servicesSnapshot.find((s) => String(s.productCode).toUpperCase() === "MIVITE");
      const hasHotVacancy = servicesSnapshot.some((s) => String(s.productCode).toUpperCase() === "HOT_VACANCY");

      await Company.findByIdAndUpdate(sub.companyId, {
        $set: {
          planSnapshot: {
            planId: sub.planId,
            planVersionId: sub.planVersionId,
            planVersionNumber: sub.planVersionNumber,
            planName: sub.commercialSnapshot?.planName || plan?.name || "Active Plan",
            planCode: plan?.code || "",
            planType: plan?.planType || sub.commercialSnapshot?.planType || "PLAN",
            billingCycle: planVersion?.billingCycle || "MONTHLY",
            validity: sub.commercialSnapshot?.validityDays || 30,
            validityUnit: "DAYS",
            gracePeriodDays: sub.commercialSnapshot?.gracePeriodDays ?? 90,
            startDate: sub.startDate,
            endDate: sub.endDate,
            assignedAt: now,
            services: servicesSnapshot,
          },
          packageExpiresAt: sub.endDate,
          packageType: sub.commercialSnapshot?.planName || plan?.name || "Active Plan",
          profileHotVacancies: hasHotVacancy ? "Premium Hot Vacancy" : "Standard",
          commercialStatus: "ACTIVE",
          planGraceExpiresAt: null,
          scheduledPlan: null,
          jobLimit: totalJobLimit || 0,
          nviteLimit: miviteService ? (miviteService.quantity || 0) : 0,
          activeJobCount: 0,
          openRoles: 0,
        },
      });

      console.log(`[ScheduledPlanActivation] Company ${sub.companyId} planSnapshot updated to ${planName}. Commercial status set to ACTIVE, scheduledPlan cleared.`);

      await AuditLogService.log({
        action: "ACTIVATE_SCHEDULED_PLAN",
        targetType: "SUBSCRIPTION",
        targetId: sub._id,
        targetName: planName,
        performedBy: { id: "system", role: "SYSTEM" },
        beforeSnapshot: null,
        afterSnapshot: { subscription: sub.toObject() },
        reason: `Scheduled plan activated automatically on effective start date arrival (${sub.startDate.toISOString()}).`,
      }).catch(() => {});
    }

    return activatedCount;
  }

  static async upgradePlan(params) {
    return this.purchasePlan({ ...params, isUpgrade: true });
  }

  static async scheduleDowngrade(params) {
    return this.purchasePlan({
      ...params,
      planId: params.targetPlanId || params.planId,
    });
  }

  static async renewPlan(params) {
    const { subscriptionId } = params;
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) {
      const err = new Error("Subscription not found");
      err.statusCode = 404;
      throw err;
    }
    return this.purchasePlan({
      ...params,
      planId: sub.planId,
      versionId: sub.planVersionId,
      isRenewal: true,
    });
  }

  static async classifyTransition({ companyId, planId, versionId }) {
    const now = new Date();
    const currentCompany = await Company.findById(companyId);
    const plan = await Plan.findById(planId);
    if (!plan) {
      const err = new Error("Plan not found");
      err.statusCode = 404;
      throw err;
    }
    let planVersion = null;
    if (versionId) {
      planVersion = await PlanVersion.findById(versionId);
    } else {
      planVersion = await PlanVersion.findOne({ planId, status: "PUBLISHED" });
    }

    const currentActiveSub = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });

    return this.classifyPlanTransition({
      currentCompany,
      currentActiveSub,
      newPlan: plan,
      newPlanVersion: planVersion,
    });
  }

  /**
   * Helper to assign the default Free Plan to a newly registered company
   */
  static async assignDefaultFreePlan({ companyId, userId, actor = {} }) {
    let freePlan = await Plan.findOne({ isDefault: true, status: "ACTIVE" });
    if (!freePlan) {
      freePlan = await Plan.findOne({ planType: "FREE", status: "ACTIVE" });
    }
    if (!freePlan) {
      freePlan = await Plan.findOne({ code: "FREE" });
    }

    if (!freePlan) {
      console.warn("[PurchaseService] No default/free plan found to assign to company", companyId);
      return null;
    }

    const planVersion =
      (await PlanVersion.findOne({ planId: freePlan._id, status: "PUBLISHED" }).sort({ version: -1 })) ||
      (await PlanVersion.findOne({ planId: freePlan._id }).sort({ version: -1 }));

    if (!planVersion) {
      console.warn("[PurchaseService] No published plan version found for free plan", freePlan._id);
      return null;
    }

    return await this.purchasePlan({
      companyId,
      userId,
      planId: freePlan._id,
      versionId: planVersion._id,
      paymentMethod: "FREE",
      transactionId: `FREE-${Date.now()}`,
      actor: actor.id || actor._id ? actor : { id: userId, role: "CLIENT" },
    });
  }

  /**
   * Standalone Product Offer Purchase (e.g. 10 SMB Jobs or 100 Resume Views)
   * This does NOT modify the existing Plan subscription!
   */
  static async purchaseProductOffer({
    companyId,
    userId,
    offerId = null,
    productId = null,
    quantity = 1,
    paymentMethod = "ONLINE",
    transactionId = "",
    actor = {},
  }) {
    let product = null;
    let offer = null;
    const orderQty = Math.max(1, Number(quantity || 1));
    let totalCredits = orderQty;
    let unitPrice = 0;
    let validityDays = 30;
    let skuOrCode = "";
    let itemTitle = "";
    let offerName = "";
    let currency = "INR";

    if (offerId) {
      offer = await ProductOffer.findById(offerId).populate("productId");
      if (!offer || offer.status === "ARCHIVED") {
        const error = new Error("Product offer not found or inactive");
        error.statusCode = 404;
        throw error;
      }
      product = offer.productId;
      if (!product || product.status === "ARCHIVED") {
        const error = new Error("Product is no longer available");
        error.statusCode = 404;
        throw error;
      }
      totalCredits = offer.quantity * orderQty;
      unitPrice = offer.price;
      validityDays = Number(offer.validity || product.validity || 30);
      skuOrCode = offer.sku;
      itemTitle = `${offer.name} (${totalCredits} ${product.unit})`;
      offerName = offer.name;
      currency = offer.currency || "INR";
    } else if (productId) {
      product = await Product.findById(productId);
      if (!product || product.status === "ARCHIVED") {
        const error = new Error("Product not found or inactive");
        error.statusCode = 404;
        throw error;
      }
      totalCredits = orderQty;
      unitPrice = product.defaultPrice;
      validityDays = Number(product.validity || 30);
      skuOrCode = product.code;
      itemTitle = `${product.name} (${orderQty} ${product.unit}${orderQty > 1 ? "s" : ""})`;
      offerName = `Direct Purchase (${orderQty} ${product.unit}s)`;
      currency = product.currency || "INR";
    } else {
      const error = new Error("Either offerId or productId is required");
      error.statusCode = 400;
      throw error;
    }

    const sourceObj = offer || product;
    const taxType = sourceObj.taxType || "IGST";
    let igstRate = sourceObj.igstRate !== undefined ? sourceObj.igstRate : 0;
    let cgstRate = sourceObj.cgstRate !== undefined ? sourceObj.cgstRate : 0;
    let sgstRate = sourceObj.sgstRate !== undefined ? sourceObj.sgstRate : 0;

    if (taxType === "IGST") {
      cgstRate = 0;
      sgstRate = 0;
      if (igstRate === 0) igstRate = sourceObj.taxPercent !== undefined ? sourceObj.taxPercent : 18;
    } else if (taxType === "CGST_SGST") {
      igstRate = 0;
      if (cgstRate === 0 && sgstRate === 0) {
        const totalTax = sourceObj.taxPercent !== undefined ? sourceObj.taxPercent : 18;
        cgstRate = Math.round((totalTax / 2) * 100) / 100;
        sgstRate = Math.round((totalTax - cgstRate) * 100) / 100;
      }
    } else {
      igstRate = 0;
      cgstRate = 0;
      sgstRate = 0;
    }

    const baseUnitRate = Number(sourceObj.basePrice ?? unitPrice ?? 0);
    const subtotal = baseUnitRate * orderQty;
    const discountAmount = offer && offer.discount ? offer.discount * orderQty : 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    const igstAmount = Math.round((taxable * (igstRate / 100)) * 100) / 100;
    const cgstAmount = Math.round((taxable * (cgstRate / 100)) * 100) / 100;
    const sgstAmount = Math.round((taxable * (sgstRate / 100)) * 100) / 100;
    const taxAmount = igstAmount + cgstAmount + sgstAmount;
    const totalAmount = Math.round(taxable + taxAmount);

    const now = new Date();
    const isAiCredit =
      String(product.code || skuOrCode || "").toUpperCase() === "AI_CREDIT" ||
      String(product.category || "").toUpperCase() === "AI";

    // Detect if company has an active subscribed plan running currently
    const company = await Company.findById(companyId);
    let subQuery = Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });
    if (typeof subQuery?.populate === "function") {
      subQuery = subQuery.populate("planId");
    }
    if (typeof subQuery?.sort === "function") {
      subQuery = subQuery.sort({ endDate: -1 });
    }
    let activePlanSub = await subQuery;

    let expiryDate;
    let isAddOn = false;

    if (isAiCredit) {
      // AI top-up credits are strictly tied to the current monthly cycle.
      // Under an active plan (e.g. 90-day plan), credits expire when the current month cycle ends and do NOT carry forward.
      const AiCreditService = require("./ai-credit.service");
      expiryDate = await AiCreditService.getCurrentCycleExpiry(companyId);
      validityDays = Math.max(1, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
    } else {
      // For any product except AI credit:
      // When any plan is subscribed and running currently, the expiry date of the newly purchased
      // add-on product credit or seat equals the expiry date of the current running plan!
      if (activePlanSub && activePlanSub.endDate && new Date(activePlanSub.endDate) > now) {
        expiryDate = new Date(activePlanSub.endDate);
        validityDays = Math.max(1, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        isAddOn = true;
      } else if (company?.planSnapshot?.endDate && new Date(company.planSnapshot.endDate) > now) {
        expiryDate = new Date(company.planSnapshot.endDate);
        validityDays = Math.max(1, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        isAddOn = true;
      } else {
        // Fallback when no plan is subscribed/running: default standalone product validity
        expiryDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
      }
    }

    const effectiveUserId = userId || actor.id || actor._id || null;

    // 1. Create Order
    const orderNumber = await this.generateOrderId(company);
    const paymentId = await this.generatePaymentId(paymentMethod);
    const invoiceNumber = generateInvoiceNumber(product.code || offer?.sku || "OFFER");

    const order = await CommercialOrder.create({
      orderNumber,
      invoiceNumber,
      paymentId,
      companyId,
      userId: effectiveUserId,
      items: [
        {
          itemType: isAddOn ? "ADD_ON" : "STANDALONE_OFFER",
          referenceId: offer ? offer._id : product._id,
          skuOrCode,
          title: itemTitle,
          quantity: orderQty,
          unitPrice,
          amount: totalAmount,
          validityDays,
        },
      ],
      subtotal,
      discountAmount,
      taxType,
      igstRate,
      cgstRate,
      sgstRate,
      igstAmount,
      cgstAmount,
      sgstAmount,
      taxAmount,
      totalAmount,
      currency,
      status: "COMPLETED",
      paymentMethod,
    });

    // 2. Create Payment
    const payment = await CommercialPayment.create({
      orderId: order._id,
      companyId,
      gateway: paymentMethod === "ONLINE" ? "RAZORPAY" : "SIMULATED",
      gatewayPaymentId: transactionId || paymentId,
      paymentId,
      invoiceNumber,
      amount: totalAmount,
      currency,
      status: "SUCCESS",
    });

    const isSeatProduct =
      String(product.code || skuOrCode || "").toUpperCase().includes("SEAT") ||
      String(product.category || "").toUpperCase() === "USER_SEATS" ||
      String(product.unit || "").toLowerCase().includes("seat");

    // 3. Create Subscription (type = ADD_ON when under active plan, else STANDALONE)
    const subscription = await Subscription.create({
      companyId,
      subscriptionType: isAddOn ? "ADD_ON" : "STANDALONE",
      planId: activePlanSub ? (activePlanSub.planId?._id || activePlanSub.planId) : null,
      productId: product._id,
      offerId: offer ? offer._id : null,
      status: "ACTIVE",
      startDate: now,
      endDate: expiryDate,
      commercialSnapshot: {
        pricePaid: totalAmount,
        basePrice: subtotal,
        discount: discountAmount,
        taxPaid: taxAmount,
        currency,
        productName: product.name,
        offerName,
        validityDays,
        purchasedAt: now,
        isAddOn,
        parentPlanSubscriptionId: activePlanSub ? activePlanSub._id : null,
        parentPlanName: activePlanSub?.commercialSnapshot?.planName || activePlanSub?.planId?.name || company?.planSnapshot?.planName || null,
        parentPlanEndDate: activePlanSub ? activePlanSub.endDate : (company?.planSnapshot?.endDate || null),
        orderNumber,
        paymentId,
        invoiceNumber,
      },
      entitlementSnapshot: [
        {
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          quantity: totalCredits,
          unit: product.unit,
          validityDays,
          userLimit: isSeatProduct ? totalCredits : 0,
          features: product.features || [],
          expiryDate,
        },
      ],
      orderId: order._id,
      orderNumber,
      paymentId,
      invoiceNumber,
    });

    // 4. Create Entitlement
    const entitlement = await Entitlement.create({
      companyId,
      subscriptionId: subscription._id,
      productId: product._id,
      productCode: product.code,
      productName: product.name,
      allocatedQuantity: totalCredits,
      consumedQuantity: 0,
      remainingQuantity: totalCredits,
      unit: product.unit,
      features: product.features || [],
      userLimit: isSeatProduct ? totalCredits : 0,
      startDate: now,
      expiryDate,
      status: "ACTIVE",
    });

    // If an active plan subscription is running, top up its entitlementSnapshot as well
    if (activePlanSub && Array.isArray(activePlanSub.entitlementSnapshot)) {
      const snapItem = activePlanSub.entitlementSnapshot.find(
        (s) => String(s.productCode).toUpperCase() === String(product.code || skuOrCode).toUpperCase()
      );
      if (snapItem) {
        snapItem.quantity = (Number(snapItem.quantity) || 0) + totalCredits;
        if (isSeatProduct) {
          snapItem.userLimit = (Number(snapItem.userLimit) || 0) + totalCredits;
        }
      } else {
        activePlanSub.entitlementSnapshot.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          quantity: totalCredits,
          unit: product.unit || "Job",
          validityDays,
          userLimit: isSeatProduct ? totalCredits : 0,
          features: product.features || [],
          expiryDate,
        });
      }
      activePlanSub.markModified("entitlementSnapshot");
      await activePlanSub.save();
    }

    // Calculate balance after
    const activeSameProducts = await Entitlement.find({
      companyId,
      productCode: product.code,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    });
    const balanceAfter = activeSameProducts.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

    // 5. Record Ledger Entry
    await CreditLedgerService.recordEntry({
      companyId,
      subscriptionId: subscription._id,
      entitlementId: entitlement._id,
      productId: product._id,
      productCode: product.code,
      transactionType: isAddOn ? "ADD_ON_PURCHASE" : "STANDALONE_PURCHASE",
      quantity: totalCredits,
      balanceAfter,
      referenceType: "Order",
      referenceId: String(order._id),
      expiryDate,
      notes: offer
        ? (isAddOn
            ? `Add-on offer purchase: ${offer.name} (${offer.sku}) - Synced with ${activePlanSub?.commercialSnapshot?.planName || company?.planSnapshot?.planName || "Active Plan"}`
            : `Standalone offer purchase: ${offer.name} (${offer.sku})`)
        : (isAddOn
            ? `Add-on product purchase: ${product.name} (Qty: ${totalCredits}) - Synced with ${activePlanSub?.commercialSnapshot?.planName || company?.planSnapshot?.planName || "Active Plan"}`
            : `Dynamic product purchase: ${product.name} (Qty: ${totalCredits})`),
      createdBy: actor,
    });

    await AuditLogService.log({
      action: isAddOn ? "PURCHASE_ADD_ON" : "PURCHASE_STANDALONE",
      targetType: "SUBSCRIPTION",
      targetId: subscription._id,
      targetName: offer ? `${offer.sku} - ${offer.name}` : `${product.code} - ${product.name} (Qty: ${totalCredits})`,
      performedBy: actor,
      afterSnapshot: {
        subscription: subscription?.toObject ? subscription.toObject() : subscription,
        order: order?.toObject ? order.toObject() : order,
      },
      reason: isAddOn ? "Add-on product purchased under active plan" : (offer ? "Standalone offer purchased" : "Dynamic product purchased"),
    });

    // 5b. Update company.planSnapshot.services so add-on credits are added on top of current credits
    const companyToUpdate = await Company.findById(companyId);
    if (companyToUpdate) {
      if (!companyToUpdate.planSnapshot) {
        companyToUpdate.planSnapshot = {
          planName: companyToUpdate.packageType || "FREE",
          planCode: "FREE",
          planType: "FREE",
          services: [],
        };
      }
      if (!Array.isArray(companyToUpdate.planSnapshot.services)) {
        companyToUpdate.planSnapshot.services = [];
      }

      const codeUpper = String(product.code || skuOrCode || "").toUpperCase();
      const existingSvc = companyToUpdate.planSnapshot.services.find(
        (s) => String(s.productCode || "").toUpperCase() === codeUpper
      );

      if (existingSvc) {
        // Stack new add-on credits on top of existing credits
        existingSvc.quantity = (Number(existingSvc.quantity) || 0) + totalCredits;
        if (isAiCredit) {
          existingSvc.validity = validityDays;
        } else if (isAddOn) {
          // Duration of add-on product is synchronized with current running plan
          existingSvc.validity = validityDays;
        } else if (validityDays > (existingSvc.validity || 0)) {
          existingSvc.validity = validityDays;
        }
        // Merge features from purchased product/offer (e.g. unlocks paid AI features, multi-city, etc.)
        if (Array.isArray(product.features) && product.features.length > 0) {
          const currentFeatures = Array.isArray(existingSvc.features) ? existingSvc.features : [];
          for (const f of product.features) {
            const idx = currentFeatures.findIndex((cf) => cf.key === f.key);
            if (idx >= 0) {
              if (f.enabled) currentFeatures[idx].enabled = true;
            } else {
              currentFeatures.push({ ...f });
            }
          }
          existingSvc.features = currentFeatures;
        }
      } else {
        // Product was not previously in the plan (e.g. buying Hot Vacancy when on SMB Plan)
        companyToUpdate.planSnapshot.services.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          category: product.category || "",
          productType: product.productType || "",
          quantity: totalCredits,
          usedQuantity: 0,
          unit: product.unit || "Credit",
          validity: validityDays,
          validityUnit: "DAYS",
          features: product.features || [],
        });
      }

      if (codeUpper.includes("JOB") || codeUpper.includes("VACANCY")) {
        companyToUpdate.jobLimit = (companyToUpdate.jobLimit || 0) + totalCredits;
      }
      if (codeUpper === "HOT_VACANCY") {
        companyToUpdate.profileHotVacancies = "Premium Hot Vacancy";
      }
      if (codeUpper.includes("NVITE") || codeUpper.includes("MIVITE")) {
        companyToUpdate.nviteLimit = (companyToUpdate.nviteLimit || 0) + totalCredits;
      }

      companyToUpdate.markModified("planSnapshot");
      await companyToUpdate.save();
    }

    // 6. Dispatch Order Confirmation Email Notification
    this.sendOrderConfirmationNotification({
      companyId,
      userId: effectiveUserId,
      serviceTitle: offer
        ? (isAiCredit
            ? `${offer.name} (${validityDays} Days - Current Monthly Cycle)`
            : isAddOn
            ? `${offer.name} (${validityDays} Days - Synced with ${activePlanSub?.commercialSnapshot?.planName || company?.planSnapshot?.planName || "Active Plan"})`
            : `${offer.name} (${validityDays} Days Validity)`)
        : (isAiCredit
            ? `${itemTitle} (${validityDays} Days - Current Monthly Cycle)`
            : isAddOn
            ? `${itemTitle} (${validityDays} Days - Synced with ${activePlanSub?.commercialSnapshot?.planName || company?.planSnapshot?.planName || "Active Plan"})`
            : `${itemTitle} (${validityDays} Days Validity)`),
      transactionId: payment.paymentId || payment.gatewayPaymentId || transactionId,
      orderNumber: order.orderNumber,
      paymentId: payment.paymentId,
      invoiceNumber,
      amount: totalAmount,
      validityDays,
      expiryDate,
      paymentMethod,
      inclusions: [
        {
          quantity: totalCredits,
          unit: product.unit || "Credit",
          name: product.name,
        },
      ],
    }).catch((emailErr) => {
      console.warn("[PurchaseService] Standalone/Add-on order confirmation email warning:", emailErr?.message);
    });

    return {
      success: true,
      subscription,
      order,
      payment,
      addedCredits: totalCredits,
      newBalance: balanceAfter,
      isAddOn,
      expiryDate,
      validityDays,
    };
  }

  /**
   * Plan Upgrade Flow:
   * Rule: Preserves old unused credits!
   * Marks previous plan subscription as UPGRADED.
   * Creates new subscription and entitlement.
   */
  static async upgradePlan({
    companyId,
    userId,
    newPlanId,
    versionId = null,
    paymentMethod = "ONLINE",
    transactionId = "",
    actor = {},
  }) {
    return await this.purchasePlan({
      companyId,
      userId,
      planId: newPlanId,
      versionId,
      paymentMethod,
      transactionId,
      actor,
      isUpgrade: true,
    });
  }


  /**
   * Plan Renewal Flow:
   * Uses current published version & pricing!
   * Default: No automatic carry-forward unless configured.
   */
  static async renewPlan({
    companyId,
    userId,
    subscriptionId,
    paymentMethod = "ONLINE",
    transactionId = "",
    actor = {},
  }) {
    const existingSub = await Subscription.findById(subscriptionId);
    if (!existingSub) {
      const error = new Error("Subscription to renew not found");
      error.statusCode = 404;
      throw error;
    }

    // Purchase current published version of the same plan with isRenewal: true
    const result = await this.purchasePlan({
      companyId,
      userId,
      planId: existingSub.planId,
      paymentMethod,
      transactionId,
      actor,
      isRenewal: true,
      isUpgrade: false,
    });

    existingSub.status = "EXPIRED";
    await existingSub.save();

    result.subscription.renewedFromSubscriptionId = existingSub._id;
    await result.subscription.save();

    await Company.findByIdAndUpdate(companyId, {
      commercialStatus: "ACTIVE",
      planGraceExpiresAt: null,
    });

    await AuditLogService.log({
      action: "RENEW_PLAN",
      targetType: "SUBSCRIPTION",
      targetId: result.subscription._id,
      targetName: `Renewed Plan ID: ${existingSub.planId}`,
      performedBy: actor,
      reason: "Subscription renewed with current published plan configuration; old credits forfeited per Q2.7",
    });

    return result;
  }

  /**
   * Background / Scheduled task to check and expire subscriptions & entitlements
   * Enforces:
   * 1. Entitlement expiry + CreditLedger log with transactionType: "EXPIRED"
   * 2. Subscription expiry + transition Company to EXPIRED_GRACE (90-day window) or EXPIRED_LOCKED
   * 3. Transition of companies past 90 days grace window to EXPIRED_LOCKED
   * 4. Activation of due SCHEDULED subscriptions (e.g. downgrades on completion date)
   */
  static async checkAndExpireSubscriptions() {
    const now = new Date();
    let expiredEntitlementsCount = 0;
    let expiredSubscriptionsCount = 0;
    let activatedScheduledCount = 0;
    let lockedGraceCompaniesCount = 0;

    // 0. Activate SCHEDULED subscriptions whose start date has arrived (Downgrade activation)
    // Run this first so transitioning companies are promoted to ACTIVE with fresh entitlements
    // and never falsely marked as EXPIRED_GRACE during the subsequent subscription expiry sweep.
    try {
      activatedScheduledCount = await this.activateScheduledSubscriptions();
    } catch (schedErr) {
      console.error("[checkAndExpireSubscriptions] Error activating scheduled subscriptions:", schedErr?.message);
    }

    // 1. Expire past active entitlements and log forfeiture in credit ledger
    const pastEntitlements = await Entitlement.find({
      status: "ACTIVE",
      expiryDate: { $lt: now },
    });

    for (const ent of pastEntitlements) {
      const forfeitedQty = ent.remainingQuantity || 0;
      ent.status = "EXPIRED";
      ent.remainingQuantity = 0;
      await ent.save();
      expiredEntitlementsCount++;

      if (forfeitedQty > 0) {
        try {
          await CreditLedgerService.recordEntry({
            companyId: ent.companyId,
            subscriptionId: ent.subscriptionId || null,
            entitlementId: ent._id,
            productId: ent.productId,
            productCode: ent.productCode,
            transactionType: "EXPIRED",
            quantity: -forfeitedQty,
            balanceAfter: 0,
            referenceType: "ScheduledExpiry",
            referenceId: String(ent._id),
            expiryDate: ent.expiryDate,
            notes: `Credits expired upon entitlement end date (${ent.expiryDate.toISOString().slice(0, 10)})`,
            createdBy: { id: "system", role: "CRON" },
          });
        } catch (ledgerErr) {
          console.error(`[checkAndExpireSubscriptions] Error logging ledger for entitlement ${ent._id}:`, ledgerErr.message);
        }
      }
    }

    // Sync company plan snapshot services for affected companies
    const affectedCompanyIds = new Set(pastEntitlements.map((e) => String(e.companyId)));
    for (const cId of affectedCompanyIds) {
      await this.syncCompanyPlanSnapshotWithActiveEntitlements(cId).catch(() => {});
    }

    // 2. Expire past active or upgraded subscriptions and set company commercial status
    const pastSubscriptions = await Subscription.find({
      status: { $in: ["ACTIVE", "UPGRADED"] },
      endDate: { $lt: now },
    });

    for (const sub of pastSubscriptions) {
      sub.status = "EXPIRED";
      await sub.save();
      expiredSubscriptionsCount++;
      affectedCompanyIds.add(String(sub.companyId));

      // Expire entitlements belonging to this expired subscription
      const subEnts = await Entitlement.find({
        subscriptionId: sub._id,
        status: "ACTIVE",
      });
      for (const ent of subEnts) {
        const forfeitedQty = ent.remainingQuantity || 0;
        ent.status = "EXPIRED";
        ent.remainingQuantity = 0;
        await ent.save();
        expiredEntitlementsCount++;
        if (forfeitedQty > 0) {
          try {
            await CreditLedgerService.recordEntry({
              companyId: ent.companyId,
              subscriptionId: sub._id,
              entitlementId: ent._id,
              productId: ent.productId,
              productCode: ent.productCode,
              transactionType: "EXPIRED",
              quantity: -forfeitedQty,
              balanceAfter: 0,
              referenceType: "SubscriptionExpiry",
              referenceId: String(sub._id),
              expiryDate: sub.endDate,
              notes: `Credits expired upon subscription expiry`,
              createdBy: { id: "system", role: "CRON" },
            });
          } catch (_) {}
        }
      }

      // Check if company has another active PLAN subscription
      const otherActivePlan = await Subscription.findOne({
        companyId: sub.companyId,
        subscriptionType: "PLAN",
        status: "ACTIVE",
        endDate: { $gte: now },
      });

      if (!otherActivePlan) {
        // Also vanish all remaining active plan entitlements or unlinked entitlements for this company
        const activeStandaloneSubs = await Subscription.find({
          companyId: sub.companyId,
          subscriptionType: { $in: ["STANDALONE", "ADD_ON"] },
          status: "ACTIVE",
          endDate: { $gte: now },
        }).select("_id");
        const activeStandaloneSubIds = activeStandaloneSubs.map((s) => s._id);

        const otherEnts = await Entitlement.find({
          companyId: sub.companyId,
          status: "ACTIVE",
          subscriptionId: { $nin: activeStandaloneSubIds },
        });

        for (const ent of otherEnts) {
          const forfeitedQty = ent.remainingQuantity || 0;
          ent.status = "EXPIRED";
          ent.remainingQuantity = 0;
          await ent.save();
          expiredEntitlementsCount++;
          if (forfeitedQty > 0) {
            try {
              await CreditLedgerService.recordEntry({
                companyId: ent.companyId,
                subscriptionId: ent.subscriptionId || null,
                entitlementId: ent._id,
                productId: ent.productId,
                productCode: ent.productCode,
                transactionType: "EXPIRED",
                quantity: -forfeitedQty,
                balanceAfter: 0,
                referenceType: "PlanExpiry",
                referenceId: String(sub._id),
                expiryDate: sub.endDate,
                notes: `Credits expired upon company plan expiry`,
                createdBy: { id: "system", role: "CRON" },
              });
            } catch (_) {}
          }
        }
        // Calculate configurable grace period per admin plan configuration (default 90 days)
        const comp = await Company.findById(sub.companyId);
        const configuredGraceDays = Number(
          sub.commercialSnapshot?.gracePeriodDays !== undefined
            ? sub.commercialSnapshot.gracePeriodDays
            : (comp?.planSnapshot?.gracePeriodDays !== undefined ? comp.planSnapshot.gracePeriodDays : 90)
        );
        const graceEnd = new Date(sub.endDate.getTime() + configuredGraceDays * 24 * 60 * 60 * 1000);
        const newCommercialStatus = (configuredGraceDays > 0 && now <= graceEnd) ? "EXPIRED_GRACE" : "EXPIRED_LOCKED";

        if (comp) {
          comp.commercialStatus = newCommercialStatus;
          comp.planGraceExpiresAt = configuredGraceDays > 0 ? graceEnd : sub.endDate;
          comp.packageExpiresAt = sub.endDate;
          if (typeof comp.zeroExpiredPlanBalances === "function") {
            comp.zeroExpiredPlanBalances();
          }
          await comp.save();
        } else {
          await Company.findByIdAndUpdate(sub.companyId, {
            commercialStatus: newCommercialStatus,
            planGraceExpiresAt: configuredGraceDays > 0 ? graceEnd : sub.endDate,
            packageExpiresAt: sub.endDate,
          });
        }
      }
    }

    for (const cId of affectedCompanyIds) {
      await this.syncCompanyPlanSnapshotWithActiveEntitlements(cId).catch(() => {});
    }

    // 3. Companies in EXPIRED_GRACE whose 90 days grace period has now elapsed
    const expiredGraceCompanies = await Company.find({
      commercialStatus: "EXPIRED_GRACE",
      planGraceExpiresAt: { $lt: now },
    });

    for (const comp of expiredGraceCompanies) {
      const activePlan = await Subscription.findOne({
        companyId: comp._id,
        subscriptionType: "PLAN",
        status: "ACTIVE",
        endDate: { $gte: now },
      });

      if (!activePlan) {
        comp.commercialStatus = "EXPIRED_LOCKED";
        if (typeof comp.zeroExpiredPlanBalances === "function") {
          comp.zeroExpiredPlanBalances();
        }
        await comp.save();
        lockedGraceCompaniesCount++;
      } else {
        comp.commercialStatus = "ACTIVE";
        comp.planGraceExpiresAt = null;
        await comp.save();
      }
    }

    // 4. Activate SCHEDULED subscriptions whose start date has arrived (Downgrade activation)
    activatedScheduledCount = await this.activateScheduledSubscriptions();

    // 5. Sweep all expired companies to guarantee balances, services, and validity are zeroed in MongoDB
    let zeroedSummary = null;
    if (typeof Company.expirePlansForExpiredCompanies === "function") {
      zeroedSummary = await Company.expirePlansForExpiredCompanies();
    }

    return {
      expiredSubscriptionsCount,
      expiredEntitlementsCount,
      activatedScheduledCount,
      lockedGraceCompaniesCount,
      zeroedExpiredCompanies: zeroedSummary,
    };
  }

  static async purchaseStandaloneOffer(params) {
    return this.purchaseProductOffer(params);
  }
}

module.exports = PurchaseService;
