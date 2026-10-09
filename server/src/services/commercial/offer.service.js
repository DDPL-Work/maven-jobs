const ProductOffer = require("../../models/ProductOffer");
const Product = require("../../models/Product");
const AuditLogService = require("./audit-log.service");

function resolveOfferGst({
  price = 0,
  basePrice = 0,
  discount = 0,
  discountPercent = 0,
  taxType,
  igstRate,
  cgstRate,
  sgstRate,
  taxPercent,
  fallbackTaxPercent = 18,
}) {
  const base = Math.max(0, Number(basePrice || price || 0));
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
    basePrice: base,
    price: base,
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

class OfferService {
  static resolveOfferGst = resolveOfferGst;

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

    const priceVal = data.basePrice !== undefined ? data.basePrice : data.price;
    const gstCalc = resolveOfferGst({
      basePrice: priceVal,
      price: priceVal,
      discount: data.discount,
      discountPercent: data.discountPercent,
      taxType: data.taxType,
      igstRate: data.igstRate,
      cgstRate: data.cgstRate,
      sgstRate: data.sgstRate,
      taxPercent: data.taxPercent,
      fallbackTaxPercent: product.taxPercent,
    });

    const offer = await ProductOffer.create({
      productId: product._id,
      sku,
      name: String(data.name || "").trim(),
      quantity: Math.max(1, Number(data.quantity || 1)),
      basePrice: gstCalc.basePrice,
      price: gstCalc.price,
      discount: gstCalc.discount,
      discountPercent: gstCalc.discountPercent,
      taxType: gstCalc.taxType,
      igstRate: gstCalc.igstRate,
      cgstRate: gstCalc.cgstRate,
      sgstRate: gstCalc.sgstRate,
      taxPercent: gstCalc.taxPercent,
      taxAmount: gstCalc.taxAmount,
      igstAmount: gstCalc.igstAmount,
      cgstAmount: gstCalc.cgstAmount,
      sgstAmount: gstCalc.sgstAmount,
      finalPrice: gstCalc.finalPrice,
      currency: data.currency || product.currency || "INR",
      validity: Math.max(1, Number(data.validity || product.validity || 30)),
      validityUnit: data.validityUnit || product.validityUnit || "DAYS",
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

    if (
      data.price !== undefined ||
      data.basePrice !== undefined ||
      data.discount !== undefined ||
      data.discountPercent !== undefined ||
      data.taxType !== undefined ||
      data.igstRate !== undefined ||
      data.cgstRate !== undefined ||
      data.sgstRate !== undefined ||
      data.taxPercent !== undefined
    ) {
      const currentBase =
        data.basePrice !== undefined
          ? data.basePrice
          : data.price !== undefined
          ? data.price
          : offer.basePrice !== undefined
          ? offer.basePrice
          : offer.price || 0;
      const gstCalc = resolveOfferGst({
        basePrice: currentBase,
        price: currentBase,
        discount: data.discount !== undefined ? data.discount : offer.discount,
        discountPercent: data.discountPercent !== undefined ? data.discountPercent : offer.discountPercent,
        taxType: data.taxType !== undefined ? data.taxType : offer.taxType,
        igstRate: data.igstRate !== undefined ? data.igstRate : offer.igstRate,
        cgstRate: data.cgstRate !== undefined ? data.cgstRate : offer.cgstRate,
        sgstRate: data.sgstRate !== undefined ? data.sgstRate : offer.sgstRate,
        taxPercent: data.taxPercent !== undefined ? data.taxPercent : offer.taxPercent,
        fallbackTaxPercent: offer.taxPercent,
      });

      offer.basePrice = gstCalc.basePrice;
      offer.price = gstCalc.price;
      offer.discount = gstCalc.discount;
      offer.discountPercent = gstCalc.discountPercent;
      offer.taxType = gstCalc.taxType;
      offer.igstRate = gstCalc.igstRate;
      offer.cgstRate = gstCalc.cgstRate;
      offer.sgstRate = gstCalc.sgstRate;
      offer.igstAmount = gstCalc.igstAmount;
      offer.cgstAmount = gstCalc.cgstAmount;
      offer.sgstAmount = gstCalc.sgstAmount;
      offer.taxPercent = gstCalc.taxPercent;
      offer.taxAmount = gstCalc.taxAmount;
      offer.finalPrice = gstCalc.finalPrice;
    }
    if (data.currency !== undefined) offer.currency = data.currency;
    if (data.validity !== undefined) offer.validity = Math.max(1, Number(data.validity));
    if (data.validityUnit !== undefined) offer.validityUnit = data.validityUnit;
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
