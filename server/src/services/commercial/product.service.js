const Product = require("../../models/Product");
const ProductOffer = require("../../models/ProductOffer");
const PlanVersion = require("../../models/PlanVersion");
const AuditLogService = require("./audit-log.service");

function resolveGstComponents({
  basePrice = 0,
  defaultPrice = 0,
  discount = 0,
  discountPercent = 0,
  taxType,
  igstRate,
  cgstRate,
  sgstRate,
  taxPercent,
}) {
  const base = Math.max(0, Number(basePrice || defaultPrice || 0));
  let disc = Math.max(0, Number(discount || 0));
  let discPct = Math.max(0, Math.min(100, Number(discountPercent || 0)));
  if (discPct > 0 && disc === 0 && base > 0) {
    disc = Math.round((base * discPct) / 100);
  } else if (disc > 0 && discPct === 0 && base > 0) {
    discPct = Math.round((disc / base) * 100);
  }
  const taxable = Math.max(0, base - disc);

  let resolvedType = taxType;
  let numIgstRate = Number(igstRate !== undefined && igstRate !== null ? igstRate : 0);
  let numCgstRate = Number(cgstRate !== undefined && cgstRate !== null ? cgstRate : 0);
  let numSgstRate = Number(sgstRate !== undefined && sgstRate !== null ? sgstRate : 0);

  if (!resolvedType) {
    if (numCgstRate > 0 || numSgstRate > 0) {
      resolvedType = "CGST_SGST";
    } else {
      resolvedType = "IGST";
    }
  }

  // Enforce rule: If IGST applied -> CGST and SGST auto become 0.
  // If CGST and SGST applied -> IGST auto becomes 0.
  if (resolvedType === "IGST") {
    numCgstRate = 0;
    numSgstRate = 0;
    if (numIgstRate === 0 && taxPercent !== undefined && Number(taxPercent) > 0) {
      numIgstRate = Number(taxPercent);
    } else if (numIgstRate === 0) {
      numIgstRate = 18;
    }
  } else if (resolvedType === "CGST_SGST") {
    numIgstRate = 0;
    if (numCgstRate === 0 && numSgstRate === 0) {
      const total = Number(taxPercent !== undefined ? taxPercent : 18);
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
    taxable,
    basePrice: base,
    defaultPrice: base,
    discount: disc,
    discountPercent: discPct,
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

class ProductService {
  static resolveGstComponents = resolveGstComponents;

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

    const gstComp = resolveGstComponents({
      basePrice: data.basePrice || data.defaultPrice,
      defaultPrice: data.defaultPrice || data.basePrice,
      discount: data.discount,
      discountPercent: data.discountPercent,
      taxType: data.taxType,
      igstRate: data.igstRate,
      cgstRate: data.cgstRate,
      sgstRate: data.sgstRate,
      taxPercent: data.taxPercent,
    });

    const product = await Product.create({
      name: String(data.name || "").trim(),
      code,
      category: data.category || "JOB_POSTING",
      productType: data.productType || "CREDIT_BASED",
      unit: data.unit || "Job",
      allowStandalone: data.allowStandalone !== false,
      basePrice: gstComp.basePrice,
      defaultPrice: gstComp.defaultPrice,
      discount: gstComp.discount,
      discountPercent: gstComp.discountPercent,
      taxType: gstComp.taxType,
      igstRate: gstComp.igstRate,
      cgstRate: gstComp.cgstRate,
      sgstRate: gstComp.sgstRate,
      igstAmount: gstComp.igstAmount,
      cgstAmount: gstComp.cgstAmount,
      sgstAmount: gstComp.sgstAmount,
      taxPercent: gstComp.taxPercent,
      taxAmount: gstComp.taxAmount,
      finalPrice: gstComp.finalPrice,
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

    // Recalculate discount / tax if any pricing or tax field provided
    if (
      data.defaultPrice !== undefined ||
      data.basePrice !== undefined ||
      data.discount !== undefined ||
      data.discountPercent !== undefined ||
      data.taxType !== undefined ||
      data.igstRate !== undefined ||
      data.cgstRate !== undefined ||
      data.sgstRate !== undefined ||
      data.taxPercent !== undefined
    ) {
      const gstComp = resolveGstComponents({
        basePrice: data.basePrice !== undefined ? data.basePrice : (data.defaultPrice !== undefined ? data.defaultPrice : product.basePrice || product.defaultPrice),
        defaultPrice: data.defaultPrice !== undefined ? data.defaultPrice : (data.basePrice !== undefined ? data.basePrice : product.defaultPrice || product.basePrice),
        discount: data.discount !== undefined ? data.discount : product.discount,
        discountPercent: data.discountPercent !== undefined ? data.discountPercent : product.discountPercent,
        taxType: data.taxType !== undefined ? data.taxType : product.taxType,
        igstRate: data.igstRate !== undefined ? data.igstRate : product.igstRate,
        cgstRate: data.cgstRate !== undefined ? data.cgstRate : product.cgstRate,
        sgstRate: data.sgstRate !== undefined ? data.sgstRate : product.sgstRate,
        taxPercent: data.taxPercent !== undefined ? data.taxPercent : product.taxPercent,
      });

      product.basePrice = gstComp.basePrice;
      product.defaultPrice = gstComp.defaultPrice;
      product.discount = gstComp.discount;
      product.discountPercent = gstComp.discountPercent;
      product.taxType = gstComp.taxType;
      product.igstRate = gstComp.igstRate;
      product.cgstRate = gstComp.cgstRate;
      product.sgstRate = gstComp.sgstRate;
      product.igstAmount = gstComp.igstAmount;
      product.cgstAmount = gstComp.cgstAmount;
      product.sgstAmount = gstComp.sgstAmount;
      product.taxPercent = gstComp.taxPercent;
      product.taxAmount = gstComp.taxAmount;
      product.finalPrice = gstComp.finalPrice;
    }

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
