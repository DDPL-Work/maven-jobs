const ProductService = require("../services/commercial/product.service");
const OfferService = require("../services/commercial/offer.service");
const PlanService = require("../services/commercial/plan.service");
const CreditLedgerService = require("../services/commercial/credit-ledger.service");
const CommercialStatsService = require("../services/commercial/commercial-stats.service");
const AuditLogService = require("../services/commercial/audit-log.service");
const Subscription = require("../models/Subscription");
const Entitlement = require("../models/Entitlement");
const asyncHandler = require("../middleware/async.middleware");

// 1. Commercial Overview Dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const stats = await CommercialStatsService.getOverviewStats();
  res.json({ success: true, data: stats });
});

// 2. Product Management
exports.getProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.listProducts(req.query);
  res.json({ success: true, ...result });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);
  res.json({ success: true, data: product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(req.body, req.user);
  res.status(201).json({ success: true, data: product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.updateProduct(req.params.id, req.body, req.user);
  res.json({ success: true, data: product });
});

exports.deactivateProduct = asyncHandler(async (req, res) => {
  const status = req.body.status || "INACTIVE";
  const product = await ProductService.setProductStatus(req.params.id, status, req.user);
  res.json({ success: true, data: product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const result = await ProductService.deleteProduct(req.params.id, req.user);
  res.json(result);
});

// 3. Product Offers / SKUs
exports.getOffers = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  if (req.params.productId) query.productId = req.params.productId;
  const result = await OfferService.listOffers(query);
  res.json({ success: true, ...result });
});

exports.createOffer = asyncHandler(async (req, res) => {
  const offerData = { ...req.body };
  if (req.params.productId) offerData.productId = req.params.productId;
  const offer = await OfferService.createOffer(offerData, req.user);
  res.status(201).json({ success: true, data: offer });
});

exports.updateOffer = asyncHandler(async (req, res) => {
  const offer = await OfferService.updateOffer(req.params.id, req.body, req.user);
  res.json({ success: true, data: offer });
});

exports.deleteOffer = asyncHandler(async (req, res) => {
  const offer = await OfferService.deleteOffer(req.params.id, req.user);
  res.json({ success: true, data: offer });
});

// 4. Plans & Plan Versions
exports.getPlans = asyncHandler(async (req, res) => {
  const result = await PlanService.listPlans(req.query);
  res.json({ success: true, ...result });
});

exports.getPlan = asyncHandler(async (req, res) => {
  const plan = await PlanService.getPlanById(req.params.id);
  res.json({ success: true, data: plan });
});

exports.createPlan = asyncHandler(async (req, res) => {
  const result = await PlanService.createPlan(req.body, req.user);
  res.status(201).json({ success: true, data: result });
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await PlanService.updatePlan(req.params.id, req.body, req.user);
  res.json({ success: true, data: plan });
});

exports.createPlanVersion = asyncHandler(async (req, res) => {
  const version = await PlanService.createNewVersion(req.params.id, req.body, req.user);
  res.status(201).json({ success: true, data: version });
});

exports.updatePlanVersion = asyncHandler(async (req, res) => {
  const version = await PlanService.updateVersionDraft(req.params.id, req.body, req.user);
  res.json({ success: true, data: version });
});

exports.publishPlanVersion = asyncHandler(async (req, res) => {
  const { versionId } = req.body;
  const result = await PlanService.publishVersion(req.params.id, versionId, req.user);
  res.json({ success: true, data: result });
});

exports.deactivatePlan = asyncHandler(async (req, res) => {
  const status = req.body.status || "INACTIVE";
  const plan = await PlanService.setPlanStatus(req.params.id, status, req.user);
  res.json({ success: true, data: plan });
});

// 5. Subscriptions & Entitlements
exports.getSubscriptions = asyncHandler(async (req, res) => {
  const { status, subscriptionType, companyId, page = 1, limit = 50 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (subscriptionType) query.subscriptionType = subscriptionType;
  if (companyId) query.companyId = companyId;

  const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
  const pageLimit = Math.min(100, Math.max(1, Number(limit)));

  const [subscriptions, total] = await Promise.all([
    Subscription.find(query)
      .populate("companyId", "name email industry")
      .populate("planId", "name code planType")
      .populate("productId", "name code category unit")
      .populate("offerId", "sku name quantity")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Subscription.countDocuments(query),
  ]);

  res.json({
    success: true,
    subscriptions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / pageLimit),
  });
});

exports.getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate("companyId", "name email industry phone location")
    .populate("planId", "name code planType")
    .populate("productId", "name code category unit")
    .populate("offerId", "sku name quantity price")
    .populate("orderId")
    .lean();

  if (!subscription) {
    return res.status(404).json({ success: false, message: "Subscription not found" });
  }

  // Get active entitlements for this subscription
  const entitlements = await Entitlement.find({ subscriptionId: req.params.id }).lean();

  res.json({
    success: true,
    data: {
      ...subscription,
      entitlements,
    },
  });
});

// 6. Credit Ledger & Adjustments
exports.getCreditLedger = asyncHandler(async (req, res) => {
  const result = await CreditLedgerService.listLedger(req.query);
  res.json({ success: true, ...result });
});

exports.adjustCredit = asyncHandler(async (req, res) => {
  const { companyId, productCode, quantity, reason, validityDays } = req.body;
  const result = await CreditLedgerService.manualAdjustment({
    companyId,
    productCode,
    quantity,
    reason,
    validityDays,
    actor: req.user,
  });
  res.json({ success: true, data: result });
});

// 7. Audit Logs
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const result = await AuditLogService.listLogs(req.query);
  res.json({ success: true, ...result });
});
