const CreditLedger = require("../../models/CreditLedger");
const Entitlement = require("../../models/Entitlement");
const Product = require("../../models/Product");
const AuditLogService = require("./audit-log.service");

class CreditLedgerService {
  /**
   * Record a new entry in the credit ledger
   */
  static async recordEntry({
    companyId,
    subscriptionId = null,
    entitlementId = null,
    productId,
    productCode,
    transactionType,
    quantity,
    balanceAfter,
    referenceType = "System",
    referenceId = "",
    expiryDate = null,
    notes = "",
    createdBy = { id: "system", email: "", role: "SYSTEM" },
  }) {
    return await CreditLedger.create({
      companyId,
      subscriptionId,
      entitlementId,
      productId,
      productCode: String(productCode).toUpperCase(),
      transactionType,
      quantity,
      balanceAfter,
      referenceType,
      referenceId: String(referenceId || ""),
      expiryDate,
      notes,
      createdBy: {
        id: String(createdBy?.id || createdBy?._id || "system"),
        email: String(createdBy?.email || ""),
        role: String(createdBy?.role || "SYSTEM"),
      },
    });
  }

  /**
   * List ledger entries with filters and pagination
   */
  static async listLedger({
    companyId,
    productCode,
    transactionType,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = {}) {
    const query = {};
    if (companyId) query.companyId = companyId;
    if (productCode) query.productCode = String(productCode).toUpperCase();
    if (transactionType) query.transactionType = transactionType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const pageLimit = Math.min(200, Math.max(1, Number(limit)));

    const [entries, total] = await Promise.all([
      CreditLedger.find(query)
        .populate("companyId", "name email")
        .populate("productId", "name code category unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      CreditLedger.countDocuments(query),
    ]);

    return {
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / pageLimit),
    };
  }

  /**
   * Super Admin manual adjustment of credits for a company
   */
  static async manualAdjustment({
    companyId,
    productCode,
    quantity,
    reason,
    validityDays = 30,
    actor = {},
  }) {
    const qty = Number(quantity);
    if (!qty || isNaN(qty)) {
      const error = new Error("Valid non-zero quantity is required");
      error.statusCode = 400;
      throw error;
    }

    if (!reason || !reason.trim()) {
      const error = new Error("Reason is required for manual credit adjustment");
      error.statusCode = 400;
      throw error;
    }

    const code = String(productCode).trim().toUpperCase();
    const product = await Product.findOne({ code });
    if (!product) {
      const error = new Error(`Product with code '${code}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();

    // Calculate current total remaining active credits
    const activeEntitlements = await Entitlement.find({
      companyId,
      productCode: code,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    const currentTotal = activeEntitlements.reduce((sum, e) => sum + (e.remainingQuantity || 0), 0);

    let balanceAfter = currentTotal;

    if (qty > 0) {
      // Add credits: create a manual entitlement
      const expiryDate = new Date(now.getTime() + Number(validityDays) * 24 * 60 * 60 * 1000);
      const entitlement = await Entitlement.create({
        companyId,
        subscriptionId: null, // manual
        productId: product._id,
        productCode: code,
        productName: product.name,
        allocatedQuantity: qty,
        consumedQuantity: 0,
        remainingQuantity: qty,
        unit: product.unit,
        features: product.features || [],
        startDate: now,
        expiryDate,
        status: "ACTIVE",
      });

      balanceAfter = currentTotal + qty;

      await this.recordEntry({
        companyId,
        entitlementId: entitlement._id,
        productId: product._id,
        productCode: code,
        transactionType: "MANUAL_ADJUSTMENT",
        quantity: qty,
        balanceAfter,
        referenceType: "ManualAdjustment",
        referenceId: String(entitlement._id),
        expiryDate,
        notes: reason,
        createdBy: actor,
      });
    } else {
      // Deduct credits: check if sufficient balance
      const deductQty = Math.abs(qty);
      if (currentTotal < deductQty) {
        const error = new Error(`Insufficient credits to deduct. Current active balance: ${currentTotal}`);
        error.statusCode = 400;
        throw error;
      }

      let remainingToDeduct = deductQty;
      // Deduct from earliest expiring entitlements
      for (const ent of activeEntitlements) {
        if (remainingToDeduct <= 0) break;
        const availableInEnt = ent.remainingQuantity;
        const deductFromThis = Math.min(availableInEnt, remainingToDeduct);

        ent.consumedQuantity += deductFromThis;
        ent.remainingQuantity -= deductFromThis;
        if (ent.remainingQuantity <= 0) {
          ent.status = "EXHAUSTED";
        }
        await ent.save();
        remainingToDeduct -= deductFromThis;
      }

      balanceAfter = currentTotal - deductQty;

      await this.recordEntry({
        companyId,
        productId: product._id,
        productCode: code,
        transactionType: "MANUAL_ADJUSTMENT",
        quantity: -deductQty,
        balanceAfter,
        referenceType: "ManualAdjustment",
        notes: reason,
        createdBy: actor,
      });
    }

    await AuditLogService.log({
      action: "MANUAL_CREDIT_ADJUSTMENT",
      targetType: "CREDIT_LEDGER",
      targetId: String(companyId),
      targetName: `${code}: ${qty > 0 ? "+" + qty : qty}`,
      performedBy: actor,
      beforeSnapshot: { balance: currentTotal },
      afterSnapshot: { balance: balanceAfter, quantity: qty },
      reason,
    });

    return {
      success: true,
      previousBalance: currentTotal,
      adjustment: qty,
      newBalance: balanceAfter,
      productCode: code,
    };
  }
}

module.exports = CreditLedgerService;
