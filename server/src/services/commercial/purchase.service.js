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
    const endDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const effectiveUserId = userId || actor.id || actor._id || null;

    // Detect if this is an upgrade of an existing active plan (per Mobile Recharge Model)
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

    // Per Q2.4 vs Q2.7: Credit stacking ONLY occurs during mid-term upgrade/add-on, NEVER on renewal
    const isPlanUpgrade = Boolean((isUpgrade || currentActiveSub) && !isRenewal);

    // Compute unused rollover credits from previous active plan if upgrading
    const rolloverCreditsMap = {}; // { [productCode]: number }

    if (isPlanUpgrade) {
      // 1. Gather remaining quantity from active entitlements
      const oldActiveEntitlements = await Entitlement.find({
        companyId,
        status: "ACTIVE",
        expiryDate: { $gte: now },
        remainingQuantity: { $gt: 0 },
        ...(currentActiveSub ? { subscriptionId: currentActiveSub._id } : {}),
      });

      for (const ent of oldActiveEntitlements) {
        const code = String(ent.productCode || "").toUpperCase();
        const isAi = code === "AI_CREDIT" || code.includes("AI");
        // Non-AI products roll over their remaining unused balance on upgrade
        if (!isAi && ent.remainingQuantity > 0) {
          rolloverCreditsMap[code] = (rolloverCreditsMap[code] || 0) + ent.remainingQuantity;
        }
      }

      // 2. Also check company.planSnapshot.services for remaining unused balance
      const currentCompany = await Company.findById(companyId);
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
    }

    // 1. Create CommercialOrder (Full listed price of upgraded plan per Q2.3)
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

    // 3. Mark old active subscription as UPGRADED or EXPIRED and handle its active entitlements
    if (currentActiveSub) {
      if (isRenewal) {
        currentActiveSub.status = "EXPIRED";
        await currentActiveSub.save();

        // On renewal, per Q2.7, previous unused credits expire and are not carried forward
        const expiringEnts = await Entitlement.find({
          companyId,
          subscriptionId: currentActiveSub._id,
          status: "ACTIVE",
          remainingQuantity: { $gt: 0 },
        });

        for (const ent of expiringEnts) {
          await CreditLedgerService.recordEntry({
            companyId,
            subscriptionId: currentActiveSub._id,
            entitlementId: ent._id,
            productId: ent.productId,
            productCode: ent.productCode,
            transactionType: "EXPIRED",
            quantity: -ent.remainingQuantity,
            balanceAfter: 0,
            referenceType: "SubscriptionRenewal",
            referenceId: String(currentActiveSub._id),
            expiryDate: now,
            notes: `Unused credits expired upon plan renewal (Q2.7 policy)`,
            createdBy: actor,
          });
        }

        await Entitlement.updateMany(
          {
            companyId,
            subscriptionId: currentActiveSub._id,
            status: "ACTIVE",
          },
          {
            $set: {
              status: "EXPIRED",
              remainingQuantity: 0,
            },
          }
        );
      } else {
        currentActiveSub.status = "UPGRADED";
        await currentActiveSub.save();

        await Entitlement.updateMany(
          {
            companyId,
            subscriptionId: currentActiveSub._id,
            status: "ACTIVE",
          },
          {
            $set: {
              status: "SUPERSEDED",
              remainingQuantity: 0,
            },
          }
        );
      }
    }

    // Per Q2.7: If not an upgrade (purchased after plan expiry or explicit renewal),
    // forfeit any stale/expired plan entitlements from prior subscriptions
    if (!isPlanUpgrade) {
      const pastPlanSubs = await Subscription.find({
        companyId,
        subscriptionType: "PLAN",
      }).select("_id");
      const pastPlanSubIds = pastPlanSubs.map((s) => s._id);

      const stalePlanEnts = await Entitlement.find({
        companyId,
        subscriptionId: { $in: pastPlanSubIds },
        status: "ACTIVE",
        remainingQuantity: { $gt: 0 },
      });

      for (const ent of stalePlanEnts) {
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
          notes: `Unused credits expired upon plan end/renewal (Q2.7 policy)`,
          createdBy: actor,
        });
      }

      await Entitlement.updateMany(
        {
          companyId,
          subscriptionId: { $in: pastPlanSubIds },
          status: "ACTIVE",
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
          endDate: { $lt: now },
        },
        {
          $set: {
            status: "EXPIRED",
          },
        }
      );
    }

    if (isPlanUpgrade) {
      // Supersede active AI_CREDIT entitlement from previous plan so the new tier's monthly quota applies
      await Entitlement.updateMany(
        {
          companyId,
          productCode: "AI_CREDIT",
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

      // If no subscription record (e.g. initial free tier), supersede only non-standalone plan entitlements
      if (!currentActiveSub) {
        const standaloneSubs = await Subscription.find({
          companyId,
          subscriptionType: { $in: ["STANDALONE", "ADD_ON"] },
        }).select("_id");
        const standaloneSubIds = standaloneSubs.map((s) => s._id);

        const rolledOverCodes = Object.keys(rolloverCreditsMap);
        if (rolledOverCodes.length > 0) {
          await Entitlement.updateMany(
            {
              companyId,
              productCode: { $in: rolledOverCodes },
              status: "ACTIVE",
              subscriptionId: { $nin: standaloneSubIds },
            },
            {
              $set: {
                status: "SUPERSEDED",
                remainingQuantity: 0,
              },
            }
          );
        }
      }
    }

    // 4. Build Immutable Entitlement Snapshot (Stacking new credits on top of old remaining credits)
    const handledProductCodes = new Set();
    const productIds = (planVersion.items || []).map((i) => i.productId).filter(Boolean);
    const catalogProds = await Product.find({ _id: { $in: productIds } }).lean();
    const catalogProductMap = new Map(catalogProds.map((p) => [String(p._id), p]));

    const entitlementSnapshot = (planVersion.items || []).map((item) => {
      const code = String(item.productCode || "").toUpperCase();
      handledProductCodes.add(code);
      const isAiCredit = code === "AI_CREDIT" || code.includes("AI");

      let itemValidityDays;
      let itemExpiry;

      if (isAiCredit) {
        // AI credits are strictly monthly: expire at the end of the current month (no carry forward)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        itemExpiry = new Date(Math.min(endOfMonth.getTime(), endDate.getTime()));
        itemValidityDays = Math.max(1, Math.ceil((itemExpiry - now) / (1000 * 60 * 60 * 24)));
      } else {
        // Job posting, search resume, and send mivites are allocated for the full cycle of the plan days
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

    // If previous plan had unused credits for a product not in the new plan, preserve them
    for (const [code, leftoverQty] of Object.entries(rolloverCreditsMap)) {
      if (!handledProductCodes.has(code) && leftoverQty > 0) {
        const prod = await Product.findOne({ code });
        if (prod) {
          let pName = prod.name;
          if (prod.code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
            pName = "Max CV Access";
          } else if (prod.code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
            pName = "Max NVite Credits";
          }
          entitlementSnapshot.push({
            productId: prod._id,
            productCode: prod.code,
            productName: pName,
            quantity: leftoverQty,
            basePlanQuantity: 0,
            rolledOverQuantity: leftoverQty,
            unit: prod.unit || "Job",
            validityDays,
            features: prod.features || [],
            expiryDate: endDate,
          });
        }
      }
    }

    // 5. Create Subscription
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
        validityDays,
        gracePeriodDays,
        purchasedAt: now,
        isUpgrade: isPlanUpgrade,
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

    // 6. Create Live Entitlements & Record Credit Ledger Entries
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

      // Calculate new total balance for ledger
      const activeSameProducts = await Entitlement.find({
        companyId,
        productCode: snapItem.productCode,
        status: "ACTIVE",
        expiryDate: { $gte: now },
        remainingQuantity: { $gt: 0 },
      });
      const balanceAfter = activeSameProducts.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

      const rolledOver = snapItem.rolledOverQuantity || 0;
      await CreditLedgerService.recordEntry({
        companyId,
        subscriptionId: subscription._id,
        entitlementId: entitlement._id,
        productId: snapItem.productId,
        productCode: snapItem.productCode,
        transactionType: isPlanUpgrade ? "PLAN_UPGRADE" : "PLAN_PURCHASE",
        quantity: snapItem.quantity,
        balanceAfter,
        referenceType: "Order",
        referenceId: String(order._id),
        expiryDate: snapItem.expiryDate,
        notes: isPlanUpgrade
          ? `Plan upgrade to ${plan.name} v${planVersion.version}${rolledOver > 0 ? ` (Includes ${rolledOver} rolled-over credits)` : ""}`
          : `Plan purchase: ${plan.name} v${planVersion.version}`,
        createdBy: actor,
      });
    }

    await AuditLogService.log({
      action: isPlanUpgrade ? "UPGRADE_PLAN" : "PURCHASE_PLAN",
      targetType: "SUBSCRIPTION",
      targetId: subscription._id,
      targetName: `${plan.name} v${planVersion.version}`,
      performedBy: actor,
      beforeSnapshot: currentActiveSub ? currentActiveSub.toObject() : null,
      afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
      reason: isPlanUpgrade
        ? "Customer upgraded plan, previous unused credits rolled over on top"
        : "Plan purchased successfully",
    });

    // 7. Save plan snapshot and services into Company profile
    const servicesSnapshot = entitlementSnapshot.map((snap) => {
      const code = String(snap.productCode || "").toUpperCase();
      const isAiCredit = code === "AI_CREDIT" || code.includes("AI");
      const itemValidity = isAiCredit ? 30 : validityDays;

      return {
        productId: snap.productId,
        productCode: snap.productCode,
        productName: snap.productName,
        category: "",
        productType: "",
        quantity: snap.quantity,
        basePlanQuantity: snap.basePlanQuantity || snap.quantity,
        usedQuantity: 0,
        unit: snap.unit,
        validity: itemValidity,
        validityUnit: "DAYS",
        features: snap.features || [],
      };
    });

    // Retain active standalone / booster add-on credits on top of the new plan
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

    const miviteService = servicesSnapshot.find(s => String(s.productCode).toUpperCase() === "MIVITE");
    const hasHotVacancy = servicesSnapshot.some(s => String(s.productCode).toUpperCase() === "HOT_VACANCY");

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
    };

    if (totalJobLimit > 0) {
      companyUpdate.jobLimit = totalJobLimit;
    }
    if (miviteService && miviteService.quantity) {
      companyUpdate.nviteLimit = miviteService.quantity;
    }

    await Company.findByIdAndUpdate(companyId, { $set: companyUpdate });

    // 8. Dispatch Order Confirmation Email Notification
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
    }).catch((emailErr) => {
      console.warn("[PurchaseService] Order confirmation email dispatch warning:", emailErr?.message);
    });

    return {
      success: true,
      subscription,
      order,
      payment,
      isUpgrade: isPlanUpgrade,
    };
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
   * Plan Downgrade Flow:
   * Rule: Do not immediately replace current plan.
   * Schedule the plan change to take effect on expiry of current plan.
   */
  static async scheduleDowngrade({
    companyId,
    userId,
    targetPlanId,
    actor = {},
  }) {
    const currentSub = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
    });

    if (!currentSub) {
      const error = new Error("No active plan subscription found to downgrade");
      error.statusCode = 400;
      throw error;
    }

    const targetPlan = await Plan.findById(targetPlanId);
    if (!targetPlan) {
      const error = new Error("Target plan not found");
      error.statusCode = 404;
      throw error;
    }

    const publishedVersion = await PlanVersion.findOne({
      planId: targetPlanId,
      status: "PUBLISHED",
    });

    if (!publishedVersion) {
      const error = new Error("No published version for target plan");
      error.statusCode = 400;
      throw error;
    }

    const scheduledStartDate = currentSub.endDate;
    const validityDays = Number(publishedVersion.validity || 90);
    const scheduledEndDate = new Date(scheduledStartDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const scheduledSub = await Subscription.create({
      companyId,
      subscriptionType: "PLAN",
      planId: targetPlan._id,
      planVersionId: publishedVersion._id,
      planVersionNumber: publishedVersion.version,
      status: "SCHEDULED",
      startDate: scheduledStartDate,
      endDate: scheduledEndDate,
      scheduledStartDate,
      commercialSnapshot: {
        pricePaid: publishedVersion.finalPrice,
        basePrice: publishedVersion.basePrice,
        discount: publishedVersion.discount,
        taxPaid: publishedVersion.taxAmount,
        currency: publishedVersion.currency || "INR",
        planName: targetPlan.name,
        validityDays,
        purchasedAt: new Date(),
      },
    });

    await AuditLogService.log({
      action: "DOWNGRADE_PLAN",
      targetType: "SUBSCRIPTION",
      targetId: scheduledSub._id,
      targetName: `Scheduled downgrade to ${targetPlan.name}`,
      performedBy: actor,
      afterSnapshot: scheduledSub.toObject(),
      reason: `Downgrade scheduled for ${scheduledStartDate.toISOString()}`,
    });

    return {
      success: true,
      message: `Plan downgrade scheduled to start on ${scheduledStartDate.toLocaleDateString()}`,
      scheduledSubscription: scheduledSub,
    };
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

    // 2. Expire past active subscriptions and set company commercial status
    const pastSubscriptions = await Subscription.find({
      status: "ACTIVE",
      endDate: { $lt: now },
    });

    for (const sub of pastSubscriptions) {
      sub.status = "EXPIRED";
      await sub.save();
      expiredSubscriptionsCount++;

      // Check if company has another active PLAN subscription
      const otherActivePlan = await Subscription.findOne({
        companyId: sub.companyId,
        subscriptionType: "PLAN",
        status: "ACTIVE",
        endDate: { $gte: now },
      });

      if (!otherActivePlan) {
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

    // 4. Activate SCHEDULED subscriptions whose start date has arrived (e.g. Downgrades Q2.5)
    const dueScheduled = await Subscription.find({
      status: "SCHEDULED",
      startDate: { $lte: now },
    });

    for (const sub of dueScheduled) {
      sub.status = "ACTIVE";
      await sub.save();
      activatedScheduledCount++;

      // Ensure entitlements exist for this activated subscription
      const existingEntsCount = await Entitlement.countDocuments({ subscriptionId: sub._id });
      if (existingEntsCount === 0 && sub.planVersionId) {
        const planVer = await PlanVersion.findById(sub.planVersionId).lean();
        if (planVer && Array.isArray(planVer.items)) {
          for (const item of planVer.items) {
            await Entitlement.create({
              companyId: sub.companyId,
              subscriptionId: sub._id,
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              allocatedQuantity: item.quantity,
              consumedQuantity: 0,
              remainingQuantity: item.quantity,
              unit: item.unit,
              features: item.features || [],
              startDate: sub.startDate,
              expiryDate: sub.endDate,
              status: "ACTIVE",
            });
          }
        }
      }

      await Company.findByIdAndUpdate(sub.companyId, {
        commercialStatus: "ACTIVE",
        planGraceExpiresAt: null,
        packageExpiresAt: sub.endDate,
        packageType: sub.commercialSnapshot?.planName || "Active Plan",
      });
    }

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
