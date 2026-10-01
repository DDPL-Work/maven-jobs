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
    });

    // Create initial PlanVersion v1 in DRAFT or PUBLISHED
    const basePrice = Math.max(0, Number(data.basePrice || 0));
    const discount = Math.max(0, Number(data.discount || 0));
    const taxPercent = Math.max(0, Number(data.taxPercent !== undefined ? data.taxPercent : 18));
    const taxableAmount = Math.max(0, basePrice - discount);
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const finalPrice = Math.round(taxableAmount + taxAmount);

    const initialVersion = await PlanVersion.create({
      planId: plan._id,
      version: 1,
      name: `${plan.name} v1`,
      description: plan.description,
      billingCycle: data.billingCycle || "CUSTOM",
      validity: Math.max(1, Number(data.validity || 90)),
      validityUnit: data.validityUnit || "DAYS",
      basePrice,
      discount,
      taxPercent,
      taxAmount,
      finalPrice,
      currency: data.currency || "INR",
      items: Array.isArray(data.items) ? data.items : [],
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

    await plan.save();

    // Also update the active/published plan version if pricing or items are provided
    if (
      data.items !== undefined ||
      data.basePrice !== undefined ||
      data.discount !== undefined ||
      data.taxPercent !== undefined ||
      data.validity !== undefined ||
      data.billingCycle !== undefined
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
        if (data.validity !== undefined) activeVer.validity = Math.max(1, Number(data.validity));
        if (data.validityUnit !== undefined) activeVer.validityUnit = data.validityUnit;
        if (data.items !== undefined && Array.isArray(data.items)) activeVer.items = data.items;

        const basePrice = Math.max(
          0,
          Number(data.basePrice !== undefined ? data.basePrice : activeVer.basePrice)
        );
        const discount = Math.max(
          0,
          Number(data.discount !== undefined ? data.discount : activeVer.discount)
        );
        const taxPercent = Math.max(
          0,
          Number(data.taxPercent !== undefined ? data.taxPercent : activeVer.taxPercent)
        );
        const taxableAmount = Math.max(0, basePrice - discount);
        const taxAmount = (taxableAmount * taxPercent) / 100;
        const finalPrice = Math.round(taxableAmount + taxAmount);

        activeVer.basePrice = basePrice;
        activeVer.discount = discount;
        activeVer.taxPercent = taxPercent;
        activeVer.taxAmount = taxAmount;
        activeVer.finalPrice = finalPrice;

        await activeVer.save();
      }
    }

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

    const basePrice = Math.max(0, Number(data.basePrice ?? latestVersionDoc?.basePrice ?? 0));
    const discount = Math.max(0, Number(data.discount ?? latestVersionDoc?.discount ?? 0));
    const taxPercent = Math.max(0, Number(data.taxPercent ?? latestVersionDoc?.taxPercent ?? 18));
    const taxableAmount = Math.max(0, basePrice - discount);
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const finalPrice = Math.round(taxableAmount + taxAmount);

    const newVersion = await PlanVersion.create({
      planId: plan._id,
      version: nextVersion,
      name: `${plan.name} v${nextVersion}`,
      description: data.description || latestVersionDoc?.description || plan.description,
      billingCycle: data.billingCycle || latestVersionDoc?.billingCycle || "CUSTOM",
      validity: Math.max(1, Number(data.validity || latestVersionDoc?.validity || 90)),
      validityUnit: data.validityUnit || latestVersionDoc?.validityUnit || "DAYS",
      basePrice,
      discount,
      taxPercent,
      taxAmount,
      finalPrice,
      currency: data.currency || latestVersionDoc?.currency || "INR",
      items: Array.isArray(data.items) ? data.items : (latestVersionDoc?.items || []),
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
    if (data.validity !== undefined) version.validity = Math.max(1, Number(data.validity));
    if (data.validityUnit !== undefined) version.validityUnit = data.validityUnit;
    if (data.description !== undefined) version.description = data.description;
    if (data.changelog !== undefined) version.changelog = data.changelog;

    if (data.basePrice !== undefined || data.discount !== undefined || data.taxPercent !== undefined) {
      const basePrice = Math.max(0, Number(data.basePrice !== undefined ? data.basePrice : version.basePrice));
      const discount = Math.max(0, Number(data.discount !== undefined ? data.discount : version.discount));
      const taxPercent = Math.max(0, Number(data.taxPercent !== undefined ? data.taxPercent : version.taxPercent));
      const taxable = Math.max(0, basePrice - discount);
      version.basePrice = basePrice;
      version.discount = discount;
      version.taxPercent = taxPercent;
      version.taxAmount = (taxable * taxPercent) / 100;
      version.finalPrice = Math.round(taxable + version.taxAmount);
    }

    if (Array.isArray(data.items)) {
      version.items = data.items;
    }

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
