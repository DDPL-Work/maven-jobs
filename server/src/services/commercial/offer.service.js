const ProductOffer = require("../../models/ProductOffer");
const Product = require("../../models/Product");
const AuditLogService = require("./audit-log.service");

class OfferService {
  static async listOffers({
    productId,
    status,
    search,
    isPopular,
    page = 1,
    limit = 50,
  } = {}) {
    const query = {};
    if (productId) query.productId = productId;
    if (status) query.status = status;
    if (isPopular !== undefined) query.isPopular = isPopular === "true" || isPopular === true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const pageLimit = Math.min(200, Math.max(1, Number(limit)));

    const [offers, total] = await Promise.all([
      ProductOffer.find(query)
        .populate("productId", "name code category unit defaultPrice allowStandalone")
        .sort({ price: 1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      ProductOffer.countDocuments(query),
    ]);

    return {
      offers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / pageLimit),
    };
  }

  static async getStandaloneOffers() {
    // Returns active offers whose product has allowStandalone = true
    const activeProducts = await Product.find({
      status: "ACTIVE",
      allowStandalone: true,
    }).lean();

    const productMap = new Map(activeProducts.map((p) => [String(p._id), p]));
    const productIds = activeProducts.map((p) => p._id);

    const offers = await ProductOffer.find({
      productId: { $in: productIds },
      status: "ACTIVE",
    })
      .sort({ price: 1 })
      .lean();

    return offers.map((offer) => ({
      ...offer,
      product: productMap.get(String(offer.productId)) || null,
    }));
  }

  static async createOffer(data, actor = {}) {
    const sku = String(data.sku || "").trim().toUpperCase();
    if (!sku) {
      const error = new Error("SKU is required");
      error.statusCode = 400;
      throw error;
    }

    const existing = await ProductOffer.findOne({ sku });
    if (existing) {
      const error = new Error(`Offer SKU '${sku}' already exists`);
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(data.productId);
    if (!product) {
      const error = new Error("Valid product is required for an offer");
      error.statusCode = 404;
      throw error;
    }

    const offer = await ProductOffer.create({
      productId: product._id,
      sku,
      name: String(data.name || "").trim(),
      quantity: Math.max(1, Number(data.quantity || 1)),
      price: Math.max(0, Number(data.price || 0)),
      currency: data.currency || product.currency || "INR",
      validity: Math.max(1, Number(data.validity || product.validity || 30)),
      validityUnit: data.validityUnit || product.validityUnit || "DAYS",
      discountPercent: Math.max(0, Math.min(100, Number(data.discountPercent || 0))),
      isPopular: Boolean(data.isPopular),
      status: data.status || "ACTIVE",
      description: data.description || "",
    });

    await AuditLogService.log({
      action: "CREATE_OFFER",
      targetType: "OFFER",
      targetId: offer._id,
      targetName: `${offer.sku} - ${offer.name}`,
      performedBy: actor,
      afterSnapshot: offer.toObject(),
      reason: "Product offer/SKU created by admin",
    });

    return offer;
  }

  static async updateOffer(id, data, actor = {}) {
    const offer = await ProductOffer.findById(id);
    if (!offer) {
      const error = new Error("Offer not found");
      error.statusCode = 404;
      throw error;
    }

    const beforeSnapshot = offer.toObject();

    if (data.sku && String(data.sku).toUpperCase() !== offer.sku) {
      const newSku = String(data.sku).trim().toUpperCase();
      const duplicate = await ProductOffer.findOne({ sku: newSku, _id: { $ne: id } });
      if (duplicate) {
        const error = new Error(`SKU '${newSku}' already exists`);
        error.statusCode = 400;
        throw error;
      }
      offer.sku = newSku;
    }

    if (data.name !== undefined) offer.name = String(data.name).trim();
    if (data.quantity !== undefined) offer.quantity = Math.max(1, Number(data.quantity));
    if (data.price !== undefined) offer.price = Math.max(0, Number(data.price));
    if (data.currency !== undefined) offer.currency = data.currency;
    if (data.validity !== undefined) offer.validity = Math.max(1, Number(data.validity));
    if (data.validityUnit !== undefined) offer.validityUnit = data.validityUnit;
    if (data.discountPercent !== undefined) offer.discountPercent = Math.max(0, Math.min(100, Number(data.discountPercent)));
    if (data.isPopular !== undefined) offer.isPopular = Boolean(data.isPopular);
    if (data.status !== undefined) offer.status = data.status;
    if (data.description !== undefined) offer.description = data.description;

    await offer.save();

    await AuditLogService.log({
      action: "UPDATE_OFFER",
      targetType: "OFFER",
      targetId: offer._id,
      targetName: offer.sku,
      performedBy: actor,
      beforeSnapshot,
      afterSnapshot: offer.toObject(),
      reason: data.auditReason || "Offer updated by admin",
    });

    return offer;
  }

  static async deleteOffer(id, actor = {}) {
    const offer = await ProductOffer.findById(id);
    if (!offer) {
      const error = new Error("Offer not found");
      error.statusCode = 404;
      throw error;
    }

    // Soft delete by setting status ARCHIVED
    offer.status = "ARCHIVED";
    await offer.save();

    await AuditLogService.log({
      action: "ARCHIVE_OFFER",
      targetType: "OFFER",
      targetId: offer._id,
      targetName: offer.sku,
      performedBy: actor,
      afterSnapshot: { status: "ARCHIVED" },
      reason: "Offer archived by admin",
    });

    return offer;
  }
}

module.exports = OfferService;
