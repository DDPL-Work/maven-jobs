const Plan = require("../../models/Plan");
const PlanVersion = require("../../models/PlanVersion");
const Product = require("../../models/Product");
const Subscription = require("../../models/Subscription");
const AuditLogService = require("./audit-log.service");

class PlanService {
  static async listPlans({
    planType,
    status,
    search,
    page = 1,
    limit = 50,
  } = {}) {
    const query = {};
    if (planType) query.planType = planType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [plans, total] = await Promise.all([
      Plan.find(query).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(pageLimit).lean(),
      Plan.countDocuments(query),
    ]);

    const planIds = plans.map((p) => p._id);

    // Fetch active published versions for each plan
    const publishedVersions = await PlanVersion.find({
      planId: { $in: planIds },
      status: "PUBLISHED",
    }).lean();

    const versionMap = new Map();
    publishedVersions.forEach((pv) => {
      // If multiple published, store the one matching currentVersion or latest
      versionMap.set(String(pv.planId), pv);
    });

    // Count active subscribers for each plan
    const subscriberCounts = await Subscription.aggregate([
      { $match: { planId: { $in: planIds }, status: "ACTIVE" } },
      { $group: { _id: "$planId", count: { $sum: 1 } } },
    ]);
    const subscriberMap = new Map(subscriberCounts.map((s) => [String(s._id), s.count]));

    const enrichedPlans = plans.map((plan) => {
      const activeVersion = versionMap.get(String(plan._id)) || null;
      return {
        ...plan,
        activeVersion,
        activeSubscribersCount: subscriberMap.get(String(plan._id)) || 0,
      };
    });

    return {
      plans: enrichedPlans,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / pageLimit),
    };
  }

  static async getPlanById(id) {
    const plan = await Plan.findById(id).lean();
    if (!plan) {
      const error = new Error("Plan not found");
      error.statusCode = 404;
      throw error;
    }

    // Get all versions for this plan
    const versions = await PlanVersion.find({ planId: id }).sort({ version: -1 }).lean();

    // Get active subscribers count
    const activeSubscribersCount = await Subscription.countDocuments({
      planId: id,
      status: "ACTIVE",
    });

    // Get published version
    const publishedVersion = versions.find((v) => v.status === "PUBLISHED") || versions[0] || null;

    return {
      ...plan,
      versions,
      publishedVersion,
      activeSubscribersCount,
    };
  }

  static resolvePlanGst({
    basePrice = 0,
    discount = 0,
    taxType,
    igstRate,
    cgstRate,
    sgstRate,
    taxPercent,
    fallbackTaxPercent = 18,
  }) {
    const base = Math.max(0, Number(basePrice || 0));
    const disc = Math.max(0, Number(discount || 0));
    const taxable = Math.max(0, base - disc);

    let numIgstRate = Number(igstRate !== undefined && igstRate !== null ? igstRate : 0);
    let numCgstRate = Number(cgstRate !== undefined && cgstRate !== null ? cgstRate : 0);
    let numSgstRate = Number(sgstRate !== undefined && sgstRate !== null ? sgstRate : 0);

    let resolvedType = taxType;
    if (!resolvedType) {
      if (numIgstRate > 0) {
        resolvedType = "IGST";
      } else if (numCgstRate > 0 || numSgstRate > 0) {
        resolvedType = "CGST_SGST";
      } else {
        resolvedType = "IGST";
      }
    }

    // Mutual exclusion: If IGST applied -> CGST and SGST auto become 0.
    // If CGST and SGST applied -> IGST auto becomes 0.
    if (resolvedType === "IGST") {
      numCgstRate = 0;
      numSgstRate = 0;
      if (numIgstRate === 0 && taxPercent !== undefined && Number(taxPercent) > 0) {
        numIgstRate = Number(taxPercent);
      } else if (numIgstRate === 0) {
        numIgstRate = Number(fallbackTaxPercent || 18);
      }
    } else if (resolvedType === "CGST_SGST") {
      numIgstRate = 0;
      if (numCgstRate === 0 && numSgstRate === 0) {
        const total = Number(taxPercent !== undefined ? taxPercent : fallbackTaxPercent || 18);
        numCgstRate = Math.round((total / 2) * 100) / 100;
        numSgstRate = Math.round((total - numCgstRate) * 100) / 100;
      }
    } else if (resolvedType === "NONE") {
      numIgstRate = 0;
      numCgstRate = 0;
      numSgstRate = 0;
    }

    const igstAmount = Math.round((taxable * numIgstRate) / 100);
    const cgstAmount = Math.round((taxable * numCgstRate) / 100);
    const sgstAmount = Math.round((taxable * numSgstRate) / 100);
    const taxAmount = igstAmount + cgstAmount + sgstAmount;
    const totalTaxPercent = numIgstRate + numCgstRate + numSgstRate;
    const finalPrice = taxable + taxAmount;

    return {
      taxType: resolvedType,
      igstRate: numIgstRate,
      cgstRate: numCgstRate,
      sgstRate: numSgstRate,
      igstAmount,
      cgstAmount,
      sgstAmount,
      taxPercent: totalTaxPercent,
      taxAmount,
      finalPrice,
    };
  }
  /**
   * Helper to recalculate plan items and catalog pricing according to product duration cycle vs plan duration.
   * If a product (except AI credit) was defined for a 30-day cycle, and the plan has e.g. 90 days validity:
   * Multiplier = planValidity / productValidity (e.g. 90 / 30 = 3).
   * Total credits = baseQuantity * multiplier (e.g. 10 * 3 = 30).
   * Item validity = planValidity (90 days, full plan cycle).
   * Product price / subtotal = totalCredits * unitPrice.
   * AI credits are strictly monthly (30 days validity, no carry forward) and their subtotal charges for the months in the plan.
   */
  static async recalculatePlanItemsAndPricing({
    items = [],
    planValidity = 90,
    planValidityUnit = "DAYS",
    basePrice = 0,
    discount = 0,
    taxPercent = 18,
    taxType,
    igstRate,
    cgstRate,
    sgstRate,
    recalculatePrice = false,
    finalPrice,
    sellPrice,
  }) {
    const rawFinalPrice = finalPrice !== undefined ? finalPrice : sellPrice;

    if (!Array.isArray(items) || items.length === 0) {
      const numBase = Number(basePrice || 0);
      const numDisc = Number(discount || 0);
      const gstCalc = this.resolvePlanGst({
        basePrice: numBase,
        discount: numDisc,
        taxType,
        igstRate,
        cgstRate,
        sgstRate,
        taxPercent,
        fallbackTaxPercent: 18,
      });

      const resolvedFinal =
        rawFinalPrice !== undefined && rawFinalPrice !== null && !isNaN(Number(rawFinalPrice)) && Number(rawFinalPrice) >= 0
          ? Math.round(Number(rawFinalPrice))
          : gstCalc.finalPrice;

      return {
        items: [],
        catalogProductsBaseTotal: 0,
        basePrice: numBase,
        discount: numDisc,
        discountPercent: numBase > 0 ? Math.round((numDisc / numBase) * 100) : 0,
        taxType: gstCalc.taxType,
        igstRate: gstCalc.igstRate,
        cgstRate: gstCalc.cgstRate,
        sgstRate: gstCalc.sgstRate,
        igstAmount: gstCalc.igstAmount,
        cgstAmount: gstCalc.cgstAmount,
        sgstAmount: gstCalc.sgstAmount,
        taxPercent: gstCalc.taxPercent,
        taxAmount: gstCalc.taxAmount,
        finalPrice: resolvedFinal,
        sellPrice: resolvedFinal,
      };
    }

    const Product = require("../../models/Product");
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const catalogProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(catalogProducts.map((p) => [String(p._id), p]));

    let calculatedCatalogSum = 0;

    const recalculatedItems = items.map((item) => {
      const prod = productMap.get(String(item.productId));
      const code = String(item.productCode || prod?.code || "").toUpperCase();
      const cat = String(prod?.category || "").toUpperCase();
      const isAi = code === "AI_CREDIT" || code.includes("AI") || cat === "AI";

      const prodValidity = Number(prod?.validity || 30);
      const validityDays = Number(planValidity || 90);

      const multiplier = Math.max(
        1,
        validityDays >= 360 && validityDays <= 366 && prodValidity === 30
          ? 12
          : Math.round(validityDays / prodValidity)
      );

      const unitPrice = Number(
        prod?.defaultPrice !== undefined
          ? prod.defaultPrice
          : prod?.basePrice !== undefined
          ? prod.basePrice
          : item.unitPrice ?? 0
      );

      if (isAi) {
        // AI credits: monthly quota, 30 days validity, strictly no carry forward
        const monthlyQty = Number(item.baseQuantity || item.quantity || 10);
        const subtotal = monthlyQty * unitPrice * multiplier;
        calculatedCatalogSum += subtotal;

        return {
          productId: item.productId,
          productCode: item.productCode || prod?.code || code,
          productName: item.productName || prod?.name || "AI Credits",
          quantity: monthlyQty,
          baseQuantity: monthlyQty,
          unitPrice,
          basePrice: subtotal,
          unit: item.unit || prod?.unit || "AI Use",
          validity: 30, // monthly cycle
          validityUnit: "DAYS",
          features: item.features || prod?.features || [],
          expiryRule: "FIXED_DAYS",
        };
      } else {
        // Non-AI products (Jobs, Search Resume, MIvites, Seats, etc.)
        const totalQty = Math.max(
          0,
          Number(item.quantity !== undefined ? item.quantity : (item.baseQuantity || 1))
        );
        const subtotal = totalQty * unitPrice;
        calculatedCatalogSum += subtotal;

        let pName = item.productName || prod?.name || "Product";
        const cCode = String(item.productCode || prod?.code || code || "").toUpperCase();
        if (cCode === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
          pName = "Max CV Access";
        } else if (cCode === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
          pName = "Max NVite Credits";
        }

        return {
          productId: item.productId,
          productCode: item.productCode || prod?.code || code,
          productName: pName,
          quantity: totalQty,
          baseQuantity: totalQty,
          unitPrice,
          basePrice: subtotal,
          unit: item.unit || prod?.unit || "Unit",
          validity: validityDays, // full plan cycle
          validityUnit: planValidityUnit || "DAYS",
          features: item.features || prod?.features || [],
          expiryRule: "SUBSCRIPTION_END",
        };
      }
    });

    const finalBasePrice =
      !recalculatePrice && basePrice !== undefined && basePrice !== null && !isNaN(Number(basePrice)) && Number(basePrice) > 0
        ? Math.max(0, Number(basePrice))
        : calculatedCatalogSum > 0
        ? calculatedCatalogSum
        : Math.max(0, Number(basePrice || 0));

    const numDiscount = Math.max(0, Number(discount || 0));

    const gstCalc = this.resolvePlanGst({
      basePrice: finalBasePrice,
      discount: numDiscount,
      taxType,
      igstRate,
      cgstRate,
      sgstRate,
      taxPercent,
      fallbackTaxPercent: 18,
    });

    const resolvedFinalPrice =
      rawFinalPrice !== undefined && rawFinalPrice !== null && !isNaN(Number(rawFinalPrice)) && Number(rawFinalPrice) >= 0
        ? Math.round(Number(rawFinalPrice))
        : gstCalc.finalPrice;

    return {
      items: recalculatedItems,
      catalogProductsBaseTotal: calculatedCatalogSum,
      basePrice: finalBasePrice,
      discount: numDiscount,
      discountPercent: finalBasePrice > 0 ? Math.round((numDiscount / finalBasePrice) * 100) : 0,
      taxType: gstCalc.taxType,
      igstRate: gstCalc.igstRate,
      cgstRate: gstCalc.cgstRate,
      sgstRate: gstCalc.sgstRate,
      igstAmount: gstCalc.igstAmount,
      cgstAmount: gstCalc.cgstAmount,
      sgstAmount: gstCalc.sgstAmount,
      taxPercent: gstCalc.taxPercent,
      taxAmount: gstCalc.taxAmount,
      finalPrice: resolvedFinalPrice,
      sellPrice: resolvedFinalPrice,
    };
  }

  static async createPlan(data, actor = {}) {
    const code = String(data.code || "").trim().toUpperCase();
    if (!code) {
      const error = new Error("Plan code is required");
      error.statusCode = 400;
      throw error;
    }

    const existing = await Plan.findOne({ code });
    if (existing) {
      const error = new Error(`Plan with code '${code}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    // Calculate item quotas and catalog prices based on product duration cycle vs plan duration
    const validity = Math.max(1, Number(data.validity || 90));
    const validityUnit = data.validityUnit || "DAYS";
    const gracePeriodDays = Math.max(0, Number(data.gracePeriodDays !== undefined ? data.gracePeriodDays : 90));
    const explicitFinalPrice = data.finalPrice !== undefined ? data.finalPrice : data.sellPrice;

    const calcResult = await PlanService.recalculatePlanItemsAndPricing({
      items: Array.isArray(data.items) ? data.items : [],
      planValidity: validity,
      planValidityUnit: validityUnit,
      basePrice: data.basePrice,
      discount: data.discount,
      taxPercent: data.taxPercent,
      taxType: data.taxType,
      igstRate: data.igstRate,
      cgstRate: data.cgstRate,
      sgstRate: data.sgstRate,
      finalPrice: explicitFinalPrice,
      sellPrice: data.sellPrice,
      recalculatePrice: Boolean(data.recalculatePrice),
    });

    const discountPercent = calcResult.basePrice > 0 ? Math.round((calcResult.discount / calcResult.basePrice) * 100) : 0;

    const plan = await Plan.create({
      name: String(data.name || "").trim(),
      code,
      planType: data.planType || "SMB",
      description: data.description || "",
      currentVersion: 1,
      status: data.status || "ACTIVE",
      featured: Boolean(data.featured),
      isDefault: Boolean(data.isDefault),
      displayOrder: Number(data.displayOrder || 0),
      gracePeriodDays,
      basePrice: calcResult.basePrice,
      discount: calcResult.discount,
      discountPercent,
      taxType: calcResult.taxType,
      igstRate: calcResult.igstRate,
      cgstRate: calcResult.cgstRate,
      sgstRate: calcResult.sgstRate,
      igstAmount: calcResult.igstAmount,
      cgstAmount: calcResult.cgstAmount,
      sgstAmount: calcResult.sgstAmount,
      taxPercent: calcResult.taxPercent,
      taxAmount: calcResult.taxAmount,
      finalPrice: calcResult.finalPrice,
      sellPrice: calcResult.sellPrice,
      finalPayablePrice: calcResult.finalPrice,
    });

    const initialVersion = await PlanVersion.create({
      planId: plan._id,
      version: 1,
      name: `${plan.name} v1`,
      description: plan.description,
      billingCycle: data.billingCycle || "CUSTOM",
      validity,
      validityUnit,
      gracePeriodDays,
      basePrice: calcResult.basePrice,
      discount: calcResult.discount,
      discountPercent,
      taxType: calcResult.taxType,
      igstRate: calcResult.igstRate,
      cgstRate: calcResult.cgstRate,
      sgstRate: calcResult.sgstRate,
      igstAmount: calcResult.igstAmount,
      cgstAmount: calcResult.cgstAmount,
      sgstAmount: calcResult.sgstAmount,
      taxPercent: calcResult.taxPercent,
      taxAmount: calcResult.taxAmount,
      finalPrice: calcResult.finalPrice,
      sellPrice: calcResult.sellPrice,
      finalPayablePrice: calcResult.finalPrice,
      currency: data.currency || "INR",
      items: calcResult.items,
      status: data.publishImmediately ? "PUBLISHED" : "DRAFT",
      publishedAt: data.publishImmediately ? new Date() : null,
      publishedBy: data.publishImmediately
        ? {
            id: String(actor?.id || actor?._id || ""),
            email: String(actor?.email || ""),
            role: String(actor?.role || "ADMIN"),
          }
        : null,
      changelog: "Initial creation",
    });

    await AuditLogService.log({
      action: "CREATE_PLAN",
      targetType: "PLAN",
      targetId: plan._id,
      targetName: plan.name,
      performedBy: actor,
      afterSnapshot: { plan: plan.toObject(), version: initialVersion.toObject() },
      reason: "Plan and initial version created by admin",
    });

    return {
      plan,
      version: initialVersion,
    };
  }

  static async updatePlan(id, data, actor = {}) {
    const plan = await Plan.findById(id);
    if (!plan) {
      const error = new Error("Plan not found");
      error.statusCode = 404;
      throw error;
    }

    const beforeSnapshot = plan.toObject();

    if (data.name !== undefined) plan.name = String(data.name).trim();
    if (data.code !== undefined && data.code.trim()) {
      const newCode = String(data.code).trim().toUpperCase();
      if (newCode !== plan.code) {
        const existing = await Plan.findOne({ code: newCode, _id: { $ne: plan._id } });
        if (existing) {
          const error = new Error(`Plan with code '${newCode}' already exists`);
          error.statusCode = 400;
          throw error;
        }
        plan.code = newCode;
      }
    }
    if (data.planType !== undefined) plan.planType = data.planType;
    if (data.description !== undefined) plan.description = data.description;
    if (data.status !== undefined) plan.status = data.status;
    if (data.featured !== undefined) plan.featured = Boolean(data.featured);
    if (data.isDefault !== undefined) plan.isDefault = Boolean(data.isDefault);
    if (data.displayOrder !== undefined) plan.displayOrder = Number(data.displayOrder);
    if (data.gracePeriodDays !== undefined) plan.gracePeriodDays = Math.max(0, Number(data.gracePeriodDays));

    // Also update the active/published plan version if pricing or items are provided
    if (
      data.items !== undefined ||
      data.basePrice !== undefined ||
      data.discount !== undefined ||
      data.taxPercent !== undefined ||
      data.taxType !== undefined ||
      data.igstRate !== undefined ||
      data.cgstRate !== undefined ||
      data.sgstRate !== undefined ||
      data.finalPrice !== undefined ||
      data.sellPrice !== undefined ||
      data.validity !== undefined ||
      data.billingCycle !== undefined ||
      data.gracePeriodDays !== undefined
    ) {
      let activeVer = await PlanVersion.findOne({
        planId: plan._id,
        status: "PUBLISHED",
      }).sort({ version: -1 });

      if (!activeVer) {
        activeVer = await PlanVersion.findOne({
          planId: plan._id,
        }).sort({ version: -1 });
      }

      if (activeVer) {
        if (data.name !== undefined) activeVer.name = `${plan.name} v${activeVer.version}`;
        if (data.description !== undefined) activeVer.description = data.description;
        if (data.billingCycle !== undefined) activeVer.billingCycle = data.billingCycle;
        if (data.gracePeriodDays !== undefined) activeVer.gracePeriodDays = Math.max(0, Number(data.gracePeriodDays));

        const validityDays = Math.max(1, Number(data.validity !== undefined ? data.validity : activeVer.validity));
        const validityUnit = data.validityUnit || activeVer.validityUnit || "DAYS";
        const itemsToUpdate = Array.isArray(data.items) ? data.items : activeVer.items;
        const explicitFinalPrice = data.finalPrice !== undefined ? data.finalPrice : data.sellPrice;

        const calcResult = await PlanService.recalculatePlanItemsAndPricing({
          items: itemsToUpdate,
          planValidity: validityDays,
          planValidityUnit: validityUnit,
          basePrice: data.basePrice !== undefined ? data.basePrice : activeVer.basePrice,
          discount: data.discount !== undefined ? data.discount : activeVer.discount,
          taxPercent: data.taxPercent !== undefined ? data.taxPercent : activeVer.taxPercent,
          taxType: data.taxType !== undefined ? data.taxType : activeVer.taxType,
          igstRate: data.igstRate !== undefined ? data.igstRate : activeVer.igstRate,
          cgstRate: data.cgstRate !== undefined ? data.cgstRate : activeVer.cgstRate,
          sgstRate: data.sgstRate !== undefined ? data.sgstRate : activeVer.sgstRate,
          finalPrice: explicitFinalPrice !== undefined ? explicitFinalPrice : activeVer.finalPrice,
          sellPrice: data.sellPrice !== undefined ? data.sellPrice : activeVer.sellPrice,
          recalculatePrice: Boolean(data.recalculatePrice),
        });

        activeVer.validity = validityDays;
        activeVer.validityUnit = validityUnit;
        activeVer.items = calcResult.items;
        activeVer.basePrice = calcResult.basePrice;
        activeVer.discount = calcResult.discount;
        activeVer.taxType = calcResult.taxType;
        activeVer.igstRate = calcResult.igstRate;
        activeVer.cgstRate = calcResult.cgstRate;
        activeVer.sgstRate = calcResult.sgstRate;
        activeVer.igstAmount = calcResult.igstAmount;
        activeVer.cgstAmount = calcResult.cgstAmount;
        activeVer.sgstAmount = calcResult.sgstAmount;
        activeVer.taxPercent = calcResult.taxPercent;
        activeVer.taxAmount = calcResult.taxAmount;
        activeVer.finalPrice = calcResult.finalPrice;
        activeVer.sellPrice = calcResult.sellPrice;
        activeVer.discountPercent = calcResult.basePrice > 0 ? Math.round((calcResult.discount / calcResult.basePrice) * 100) : 0;
        activeVer.finalPayablePrice = calcResult.finalPrice;

        await activeVer.save();

        plan.basePrice = calcResult.basePrice;
        plan.discount = calcResult.discount;
        plan.discountPercent = activeVer.discountPercent;
        plan.taxType = calcResult.taxType;
        plan.igstRate = calcResult.igstRate;
        plan.cgstRate = calcResult.cgstRate;
        plan.sgstRate = calcResult.sgstRate;
        plan.igstAmount = calcResult.igstAmount;
        plan.cgstAmount = calcResult.cgstAmount;
        plan.sgstAmount = calcResult.sgstAmount;
        plan.taxPercent = calcResult.taxPercent;
        plan.taxAmount = calcResult.taxAmount;
        plan.finalPrice = calcResult.finalPrice;
        plan.sellPrice = calcResult.sellPrice;
        plan.finalPayablePrice = calcResult.finalPrice;
      }
    }

    await plan.save();

    await AuditLogService.log({
      action: "UPDATE_PLAN",
      targetType: "PLAN",
      targetId: plan._id,
      targetName: plan.name,
      performedBy: actor,
      beforeSnapshot,
      afterSnapshot: plan.toObject(),
      reason: data.auditReason || "Plan metadata and active version updated",
    });

    return plan;
  }

  static async createNewVersion(planId, data, actor = {}) {
    const plan = await Plan.findById(planId);
    if (!plan) {
      const error = new Error("Plan not found");
      error.statusCode = 404;
      throw error;
    }

    // Determine next version number
    const latestVersionDoc = await PlanVersion.findOne({ planId }).sort({ version: -1 });
    const nextVersion = (latestVersionDoc?.version || plan.currentVersion || 0) + 1;

    const validity = Math.max(1, Number(data.validity || latestVersionDoc?.validity || 90));
    const validityUnit = data.validityUnit || latestVersionDoc?.validityUnit || "DAYS";
    const gracePeriodDays = Math.max(0, Number(data.gracePeriodDays ?? latestVersionDoc?.gracePeriodDays ?? plan.gracePeriodDays ?? 90));
    const rawItems = Array.isArray(data.items) ? data.items : (latestVersionDoc?.items || []);
    const explicitFinalPrice = data.finalPrice !== undefined ? data.finalPrice : data.sellPrice;

    const calcResult = await PlanService.recalculatePlanItemsAndPricing({
      items: rawItems,
      planValidity: validity,
      planValidityUnit: validityUnit,
      basePrice: data.basePrice ?? latestVersionDoc?.basePrice ?? 0,
      discount: data.discount ?? latestVersionDoc?.discount ?? 0,
      taxPercent: data.taxPercent ?? latestVersionDoc?.taxPercent ?? 18,
      taxType: data.taxType ?? latestVersionDoc?.taxType,
      igstRate: data.igstRate ?? latestVersionDoc?.igstRate,
      cgstRate: data.cgstRate ?? latestVersionDoc?.cgstRate,
      sgstRate: data.sgstRate ?? latestVersionDoc?.sgstRate,
      finalPrice: explicitFinalPrice !== undefined ? explicitFinalPrice : latestVersionDoc?.finalPrice,
      sellPrice: data.sellPrice !== undefined ? data.sellPrice : latestVersionDoc?.sellPrice,
      recalculatePrice: false,
    });

    const newVersion = await PlanVersion.create({
      planId: plan._id,
      version: nextVersion,
      name: `${plan.name} v${nextVersion}`,
      description: data.description || latestVersionDoc?.description || plan.description,
      billingCycle: data.billingCycle || latestVersionDoc?.billingCycle || "CUSTOM",
      validity,
      validityUnit,
      gracePeriodDays,
      basePrice: calcResult.basePrice,
      discount: calcResult.discount,
      discountPercent: calcResult.basePrice > 0 ? Math.round((calcResult.discount / calcResult.basePrice) * 100) : 0,
      taxType: calcResult.taxType,
      igstRate: calcResult.igstRate,
      cgstRate: calcResult.cgstRate,
      sgstRate: calcResult.sgstRate,
      igstAmount: calcResult.igstAmount,
      cgstAmount: calcResult.cgstAmount,
      sgstAmount: calcResult.sgstAmount,
      taxPercent: calcResult.taxPercent,
      taxAmount: calcResult.taxAmount,
      finalPrice: calcResult.finalPrice,
      sellPrice: calcResult.sellPrice,
      finalPayablePrice: calcResult.finalPrice,
      currency: data.currency || latestVersionDoc?.currency || "INR",
      items: calcResult.items,
      status: "DRAFT",
      changelog: data.changelog || `Version ${nextVersion} created as draft`,
    });

    await AuditLogService.log({
      action: "CREATE_PLAN_VERSION",
      targetType: "PLAN_VERSION",
      targetId: newVersion._id,
      targetName: `${plan.name} v${nextVersion}`,
      performedBy: actor,
      afterSnapshot: newVersion.toObject(),
      reason: `Draft v${nextVersion} created`,
    });

    return newVersion;
  }

  static async updateVersionDraft(versionId, data, actor = {}) {
    const version = await PlanVersion.findById(versionId);
    if (!version) {
      const error = new Error("Plan version not found");
      error.statusCode = 404;
      throw error;
    }

    if (version.status !== "DRAFT") {
      const error = new Error("Cannot edit a published or archived version. Create a new version instead.");
      error.statusCode = 400;
      throw error;
    }

    if (data.billingCycle !== undefined) version.billingCycle = data.billingCycle;
    if (data.description !== undefined) version.description = data.description;
    if (data.changelog !== undefined) version.changelog = data.changelog;
    if (data.gracePeriodDays !== undefined) version.gracePeriodDays = Math.max(0, Number(data.gracePeriodDays));

    const validity = Math.max(1, Number(data.validity !== undefined ? data.validity : version.validity));
    const validityUnit = data.validityUnit || version.validityUnit || "DAYS";
    const rawItems = Array.isArray(data.items) ? data.items : version.items;
    const explicitFinalPrice = data.finalPrice !== undefined ? data.finalPrice : data.sellPrice;

    const calcResult = await PlanService.recalculatePlanItemsAndPricing({
      items: rawItems,
      planValidity: validity,
      planValidityUnit: validityUnit,
      basePrice: data.basePrice !== undefined ? data.basePrice : version.basePrice,
      discount: data.discount !== undefined ? data.discount : version.discount,
      taxPercent: data.taxPercent !== undefined ? data.taxPercent : version.taxPercent,
      taxType: data.taxType !== undefined ? data.taxType : version.taxType,
      igstRate: data.igstRate !== undefined ? data.igstRate : version.igstRate,
      cgstRate: data.cgstRate !== undefined ? data.cgstRate : version.cgstRate,
      sgstRate: data.sgstRate !== undefined ? data.sgstRate : version.sgstRate,
      finalPrice: explicitFinalPrice !== undefined ? explicitFinalPrice : version.finalPrice,
      sellPrice: data.sellPrice !== undefined ? data.sellPrice : version.sellPrice,
      recalculatePrice: false,
    });

    version.validity = validity;
    version.validityUnit = validityUnit;
    version.items = calcResult.items;
    version.basePrice = calcResult.basePrice;
    version.discount = calcResult.discount;
    version.taxType = calcResult.taxType;
    version.igstRate = calcResult.igstRate;
    version.cgstRate = calcResult.cgstRate;
    version.sgstRate = calcResult.sgstRate;
    version.igstAmount = calcResult.igstAmount;
    version.cgstAmount = calcResult.cgstAmount;
    version.sgstAmount = calcResult.sgstAmount;
    version.taxPercent = calcResult.taxPercent;
    version.taxAmount = calcResult.taxAmount;
    version.finalPrice = calcResult.finalPrice;
    version.sellPrice = calcResult.sellPrice;

    await version.save();
    return version;
  }

  static async publishVersion(planId, versionId, actor = {}) {
    const plan = await Plan.findById(planId);
    if (!plan) {
      const error = new Error("Plan not found");
      error.statusCode = 404;
      throw error;
    }

    const versionToPublish = await PlanVersion.findById(versionId);
    if (!versionToPublish || String(versionToPublish.planId) !== String(planId)) {
      const error = new Error("Plan version not found for this plan");
      error.statusCode = 404;
      throw error;
    }

    // Validation rule: Published plan must have at least one product item
    if (!Array.isArray(versionToPublish.items) || versionToPublish.items.length === 0) {
      const error = new Error("A published plan must contain at least one product item");
      error.statusCode = 400;
      throw error;
    }

    // Recalculate item quotas and catalog prices based on product duration cycle vs plan duration before publishing
    const calcResult = await PlanService.recalculatePlanItemsAndPricing({
      items: versionToPublish.items,
      planValidity: versionToPublish.validity,
      planValidityUnit: versionToPublish.validityUnit,
      basePrice: versionToPublish.basePrice,
      discount: versionToPublish.discount,
      taxPercent: versionToPublish.taxPercent,
      taxType: versionToPublish.taxType,
      igstRate: versionToPublish.igstRate,
      cgstRate: versionToPublish.cgstRate,
      sgstRate: versionToPublish.sgstRate,
      finalPrice: versionToPublish.finalPrice,
      sellPrice: versionToPublish.sellPrice,
      recalculatePrice: false,
    });

    versionToPublish.items = calcResult.items;
    versionToPublish.basePrice = calcResult.basePrice;
    versionToPublish.discount = calcResult.discount;
    versionToPublish.taxType = calcResult.taxType;
    versionToPublish.igstRate = calcResult.igstRate;
    versionToPublish.cgstRate = calcResult.cgstRate;
    versionToPublish.sgstRate = calcResult.sgstRate;
    versionToPublish.igstAmount = calcResult.igstAmount;
    versionToPublish.cgstAmount = calcResult.cgstAmount;
    versionToPublish.sgstAmount = calcResult.sgstAmount;
    versionToPublish.taxPercent = calcResult.taxPercent;
    versionToPublish.taxAmount = calcResult.taxAmount;
    versionToPublish.finalPrice = calcResult.finalPrice;
    versionToPublish.sellPrice = calcResult.sellPrice;

    // Archive previous published versions
    await PlanVersion.updateMany(
      { planId, status: "PUBLISHED" },
      { $set: { status: "ARCHIVED" } }
    );

    versionToPublish.status = "PUBLISHED";
    versionToPublish.publishedAt = new Date();
    versionToPublish.publishedBy = {
      id: String(actor?.id || actor?._id || ""),
      email: String(actor?.email || ""),
      role: String(actor?.role || "ADMIN"),
    };
    await versionToPublish.save();

    plan.currentVersion = versionToPublish.version;
    plan.status = "ACTIVE";
    plan.basePrice = versionToPublish.basePrice;
    plan.discount = versionToPublish.discount;
    plan.discountPercent = versionToPublish.basePrice > 0 ? Math.round((versionToPublish.discount / versionToPublish.basePrice) * 100) : 0;
    plan.taxType = versionToPublish.taxType;
    plan.igstRate = versionToPublish.igstRate;
    plan.cgstRate = versionToPublish.cgstRate;
    plan.sgstRate = versionToPublish.sgstRate;
    plan.igstAmount = versionToPublish.igstAmount;
    plan.cgstAmount = versionToPublish.cgstAmount;
    plan.sgstAmount = versionToPublish.sgstAmount;
    plan.taxPercent = versionToPublish.taxPercent;
    plan.taxAmount = versionToPublish.taxAmount;
    plan.finalPrice = versionToPublish.finalPrice;
    plan.sellPrice = versionToPublish.sellPrice;
    plan.finalPayablePrice = versionToPublish.finalPrice;
    await plan.save();

    await AuditLogService.log({
      action: "PUBLISH_PLAN_VERSION",
      targetType: "PLAN_VERSION",
      targetId: versionToPublish._id,
      targetName: `${plan.name} v${versionToPublish.version}`,
      performedBy: actor,
      afterSnapshot: versionToPublish.toObject(),
      reason: `Version ${versionToPublish.version} published by admin`,
    });

    return {
      plan,
      publishedVersion: versionToPublish,
    };
  }

  static async setPlanStatus(id, status, actor = {}) {
    const plan = await Plan.findById(id);
    if (!plan) {
      const error = new Error("Plan not found");
      error.statusCode = 404;
      throw error;
    }

    const beforeStatus = plan.status;
    plan.status = status;
    await plan.save();

    await AuditLogService.log({
      action: status === "ACTIVE" ? "ACTIVATE_PLAN" : "DEACTIVATE_PLAN",
      targetType: "PLAN",
      targetId: plan._id,
      targetName: plan.name,
      performedBy: actor,
      beforeSnapshot: { status: beforeStatus },
      afterSnapshot: { status },
      reason: `Plan status changed to ${status}`,
    });

    return plan;
  }
}

module.exports = PlanService;
