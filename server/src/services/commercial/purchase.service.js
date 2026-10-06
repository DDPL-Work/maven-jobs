const Plan = require("../../models/Plan");
const PlanVersion = require("../../models/PlanVersion");
const Product = require("../../models/Product");
const ProductOffer = require("../../models/ProductOffer");
const Subscription = require("../../models/Subscription");
const Entitlement = require("../../models/Entitlement");
const CommercialOrder = require("../../models/CommercialOrder");
const CommercialPayment = require("../../models/CommercialPayment");
const Company = require("../../models/Company");
const CreditLedgerService = require("./credit-ledger.service");
const AuditLogService = require("./audit-log.service");

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
   * Helper to generate unique human-readable order number
   */
  static generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
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
    const endDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const effectiveUserId = userId || actor.id || actor._id || null;

    // Detect if this is an upgrade of an existing active plan (per Mobile Recharge Model)
    let currentActiveSub = await Subscription.findOne({
      companyId,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    });

    if (!currentActiveSub && isUpgrade) {
      currentActiveSub = await Subscription.findOne({
        companyId,
        subscriptionType: "PLAN",
        status: "ACTIVE",
      }).sort({ createdAt: -1 });
    }

    const isPlanUpgrade = Boolean(isUpgrade || currentActiveSub);

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
    const orderNumber = this.generateOrderNumber();
    const order = await CommercialOrder.create({
      orderNumber,
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
      gatewayPaymentId: transactionId || `PAY-${Date.now()}`,
      amount: planVersion.finalPrice,
      currency: planVersion.currency || "INR",
      status: "SUCCESS",
    });

    // 3. Mark old active subscription as UPGRADED and supersede its active entitlements
    if (currentActiveSub) {
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
        purchasedAt: now,
        isUpgrade: isPlanUpgrade,
        upgradedFromSubscriptionId: currentActiveSub ? currentActiveSub._id : null,
      },
      entitlementSnapshot,
      orderId: order._id,
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
        usedQuantity: 0,
        unit: snap.unit,
        validity: itemValidity,
        validityUnit: "DAYS",
        features: snap.features || [],
      };
    });

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
        startDate: now,
        endDate: endDate,
        assignedAt: now,
        services: servicesSnapshot,
      },
      packageExpiresAt: endDate,
      packageType: plan.name,
      profileHotVacancies: hasHotVacancy ? "Premium Hot Vacancy" : "Standard",
    };

    if (totalJobLimit > 0) {
      companyUpdate.jobLimit = totalJobLimit;
    }
    if (miviteService && miviteService.quantity) {
      companyUpdate.nviteLimit = miviteService.quantity;
    }

    await Company.findByIdAndUpdate(companyId, { $set: companyUpdate });

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

    const subtotal = unitPrice * orderQty;
    const taxAmount = Math.round((subtotal * 0.18) * 100) / 100; // 18% GST
    const totalAmount = Math.round(subtotal + taxAmount);

    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const effectiveUserId = userId || actor.id || actor._id || null;

    // 1. Create Order
    const orderNumber = this.generateOrderNumber();
    const order = await CommercialOrder.create({
      orderNumber,
      companyId,
      userId: effectiveUserId,
      items: [
        {
          itemType: "STANDALONE_OFFER",
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
      discountAmount: 0,
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
      gatewayPaymentId: transactionId || `PAY-${Date.now()}`,
      amount: totalAmount,
      currency,
      status: "SUCCESS",
    });

    // 3. Create Separate Subscription (type = STANDALONE)
    const subscription = await Subscription.create({
      companyId,
      subscriptionType: "STANDALONE",
      productId: product._id,
      offerId: offer ? offer._id : null,
      status: "ACTIVE",
      startDate: now,
      endDate: expiryDate,
      commercialSnapshot: {
        pricePaid: totalAmount,
        basePrice: subtotal,
        discount: 0,
        taxPaid: taxAmount,
        currency,
        productName: product.name,
        offerName,
        validityDays,
        purchasedAt: now,
      },
      entitlementSnapshot: [
        {
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          quantity: totalCredits,
          unit: product.unit,
          validityDays,
          features: product.features || [],
          expiryDate,
        },
      ],
      orderId: order._id,
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
      startDate: now,
      expiryDate,
      status: "ACTIVE",
    });

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
      transactionType: "STANDALONE_PURCHASE",
      quantity: totalCredits,
      balanceAfter,
      referenceType: "Order",
      referenceId: String(order._id),
      expiryDate,
      notes: offer
        ? `Standalone offer purchase: ${offer.name} (${offer.sku})`
        : `Dynamic product purchase: ${product.name} (Qty: ${totalCredits})`,
      createdBy: actor,
    });

    await AuditLogService.log({
      action: "PURCHASE_STANDALONE",
      targetType: "SUBSCRIPTION",
      targetId: subscription._id,
      targetName: offer ? `${offer.sku} - ${offer.name}` : `${product.code} - ${product.name} (Qty: ${totalCredits})`,
      performedBy: actor,
      afterSnapshot: { subscription: subscription.toObject(), order: order.toObject() },
      reason: offer ? "Standalone offer purchased" : "Dynamic product purchased",
    });

    return {
      success: true,
      subscription,
      order,
      payment,
      addedCredits: totalCredits,
      newBalance: balanceAfter,
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

    // Purchase current published version of the same plan
    const result = await this.purchasePlan({
      companyId,
      userId,
      planId: existingSub.planId,
      paymentMethod,
      transactionId,
      actor,
    });

    existingSub.status = "EXPIRED";
    await existingSub.save();

    result.subscription.renewedFromSubscriptionId = existingSub._id;
    await result.subscription.save();

    await AuditLogService.log({
      action: "RENEW_PLAN",
      targetType: "SUBSCRIPTION",
      targetId: result.subscription._id,
      targetName: `Renewed Plan ID: ${existingSub.planId}`,
      performedBy: actor,
      reason: "Subscription renewed with current published plan configuration",
    });

    return result;
  }

  /**
   * Background / Scheduled task to check and expire subscriptions & entitlements
   */
  static async checkAndExpireSubscriptions() {
    const now = new Date();

    // 1. Expire past subscriptions
    const expiredSubs = await Subscription.updateMany(
      { status: "ACTIVE", endDate: { $lt: now } },
      { $set: { status: "EXPIRED" } }
    );

    // 2. Expire past entitlements
    const expiredEnts = await Entitlement.updateMany(
      { status: "ACTIVE", expiryDate: { $lt: now } },
      { $set: { status: "EXPIRED" } }
    );

    // 3. Activate SCHEDULED subscriptions whose start date has arrived
    const dueScheduled = await Subscription.find({
      status: "SCHEDULED",
      startDate: { $lte: now },
    });

    for (const sub of dueScheduled) {
      sub.status = "ACTIVE";
      await sub.save();
    }

    return {
      expiredSubscriptionsCount: expiredSubs.modifiedCount || 0,
      expiredEntitlementsCount: expiredEnts.modifiedCount || 0,
      activatedScheduledCount: dueScheduled.length,
    };
  }

  static async purchaseStandaloneOffer(params) {
    return this.purchaseProductOffer(params);
  }
}

module.exports = PurchaseService;
