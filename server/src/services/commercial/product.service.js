const Product = require("../../models/Product");
const ProductOffer = require("../../models/ProductOffer");
const PlanVersion = require("../../models/PlanVersion");
const AuditLogService = require("./audit-log.service");

class ProductService {
  static async listProducts({
    category,
    productType,
    status,
    search,
    allowStandalone,
    page = 1,
    limit = 50,
  } = {}) {
    const query = {};
    if (category) query.category = category;
    if (productType) query.productType = productType;
    if (status) query.status = status;
    if (allowStandalone !== undefined) query.allowStandalone = allowStandalone === "true" || allowStandalone === true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const pageLimit = Math.min(200, Math.max(1, Number(limit)));

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).lean(),
      Product.countDocuments(query),
    ]);

    // Attach active offer counts for each product
    const productIds = products.map((p) => p._id);
    const offerCounts = await ProductOffer.aggregate([
      { $match: { productId: { $in: productIds }, status: "ACTIVE" } },
      { $group: { _id: "$productId", count: { $sum: 1 } } },
    ]);
    const offerCountMap = new Map(offerCounts.map((o) => [String(o._id), o.count]));

    const enrichedProducts = products.map((prod) => ({
      ...prod,
      activeOffersCount: offerCountMap.get(String(prod._id)) || 0,
    }));

    return {
      products: enrichedProducts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / pageLimit),
    };
  }

  static async getProductById(id) {
    const product = await Product.findById(id).lean();
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    // Get associated offers
    const offers = await ProductOffer.find({ productId: id }).sort({ price: 1 }).lean();

    // Get plans utilizing this product in their items
    const planVersions = await PlanVersion.find({
      "items.productId": id,
      status: "PUBLISHED",
    })
      .populate("planId", "name code planType status")
      .lean();

    const plansUsingProduct = planVersions.map((pv) => ({
      planId: pv.planId?._id,
      planName: pv.planId?.name,
      planCode: pv.planId?.code,
      version: pv.version,
      validity: pv.validity,
      finalPrice: pv.finalPrice,
    }));

    return {
      ...product,
      offers,
      plansUsingProduct,
    };
  }

  static async createProduct(data, actor = {}) {
    const code = String(data.code || "").trim().toUpperCase();
    if (!code) {
      const error = new Error("Product code is required");
      error.statusCode = 400;
      throw error;
    }

    const existing = await Product.findOne({ code });
    if (existing) {
      const error = new Error(`Product with code '${code}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.create({
      name: String(data.name || "").trim(),
      code,
      category: data.category || "JOB_POSTING",
      productType: data.productType || "CREDIT_BASED",
      unit: data.unit || "Job",
      allowStandalone: data.allowStandalone !== false,
      defaultPrice: Math.max(0, Number(data.defaultPrice || 0)),
      currency: data.currency || "INR",
      validity: Math.max(1, Number(data.validity || 30)),
      validityUnit: data.validityUnit || "DAYS",
      minQuantity: Math.max(1, Number(data.minQuantity || 1)),
      maxQuantity: Math.max(1, Number(data.maxQuantity || 100000)),
      autoRenewalAllowed: Boolean(data.autoRenewalAllowed),
      features: Array.isArray(data.features) ? data.features : [],
      status: data.status || "ACTIVE",
      description: data.description || "",
    });

    await AuditLogService.log({
      action: "CREATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: product._id,
      targetName: product.name,
      performedBy: actor,
      afterSnapshot: product.toObject(),
      reason: "Product created by admin",
    });

    return product;
  }

  static async updateProduct(id, data, actor = {}) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    const beforeSnapshot = product.toObject();

    // Prevent changing code if it would collide
    if (data.code && String(data.code).toUpperCase() !== product.code) {
      const newCode = String(data.code).trim().toUpperCase();
      const duplicate = await Product.findOne({ code: newCode, _id: { $ne: id } });
      if (duplicate) {
        const error = new Error(`Product with code '${newCode}' already exists`);
        error.statusCode = 400;
        throw error;
      }
      product.code = newCode;
    }

    if (data.name !== undefined) product.name = String(data.name).trim();
    if (data.category !== undefined) product.category = data.category;
    if (data.productType !== undefined) product.productType = data.productType;
    if (data.unit !== undefined) product.unit = data.unit;
    if (data.allowStandalone !== undefined) product.allowStandalone = Boolean(data.allowStandalone);
    if (data.defaultPrice !== undefined) product.defaultPrice = Math.max(0, Number(data.defaultPrice));
    if (data.currency !== undefined) product.currency = data.currency;
    if (data.validity !== undefined) product.validity = Math.max(1, Number(data.validity));
    if (data.validityUnit !== undefined) product.validityUnit = data.validityUnit;
    if (data.minQuantity !== undefined) product.minQuantity = Math.max(1, Number(data.minQuantity));
    if (data.maxQuantity !== undefined) product.maxQuantity = Math.max(1, Number(data.maxQuantity));
    if (data.autoRenewalAllowed !== undefined) product.autoRenewalAllowed = Boolean(data.autoRenewalAllowed);
    if (data.features !== undefined) product.features = Array.isArray(data.features) ? data.features : [];
    if (data.status !== undefined) product.status = data.status;
    if (data.description !== undefined) product.description = data.description;

    await product.save();

    await AuditLogService.log({
      action: "UPDATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: product._id,
      targetName: product.name,
      performedBy: actor,
      beforeSnapshot,
      afterSnapshot: product.toObject(),
      reason: data.auditReason || "Product updated by admin",
    });

    return product;
  }

  static async setProductStatus(id, status, actor = {}) {
    if (!["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status)) {
      const error = new Error("Invalid status. Must be ACTIVE, INACTIVE, or ARCHIVED");
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    const beforeStatus = product.status;
    product.status = status;
    await product.save();

    await AuditLogService.log({
      action: status === "ACTIVE" ? "ACTIVATE_PRODUCT" : "DEACTIVATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: product._id,
      targetName: product.name,
      performedBy: actor,
      beforeSnapshot: { status: beforeStatus },
      afterSnapshot: { status },
      reason: `Status changed to ${status}`,
    });

    return product;
  }

  static async deleteProduct(id, actor = {}) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if any published plan version is using this product
    const planInUse = await PlanVersion.findOne({
      "items.productId": id,
      status: "PUBLISHED",
    }).populate("planId", "name");

    if (planInUse) {
      const planName = planInUse.planId?.name || "a published plan";
      const error = new Error(
        `Cannot delete product '${product.name}' because it is in use by active plan '${planName}'. Please remove it from the plan items first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Remove any associated standalone offers
    await ProductOffer.deleteMany({ productId: id });

    const beforeSnapshot = product.toObject();
    await Product.findByIdAndDelete(id);

    await AuditLogService.log({
      action: "DELETE_PRODUCT",
      targetType: "PRODUCT",
      targetId: id,
      targetName: product.name,
      performedBy: actor,
      beforeSnapshot,
      afterSnapshot: null,
      reason: "Product permanently deleted by admin",
    });

    return { success: true, message: `Product '${product.name}' deleted successfully` };
  }
}

module.exports = ProductService;
