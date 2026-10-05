const EntitlementService = require("../services/commercial/entitlement.service");
const PurchaseService = require("../services/commercial/purchase.service");
const PlanService = require("../services/commercial/plan.service");
const OfferService = require("../services/commercial/offer.service");
const CreditLedgerService = require("../services/commercial/credit-ledger.service");
const asyncHandler = require("../middleware/async.middleware");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PaymentTransaction = require("../models/PaymentTransaction");

// ── Helper: get a lazily-initialized Razorpay instance ──────────────────────
let _rzp = null;
function getRzp() {
  if (!_rzp) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay credentials not configured");
    _rzp = new Razorpay({ key_id, key_secret });
  }
  return _rzp;
}

// 1. Get Company Entitlements & Credit Balances
exports.getEntitlements = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  if (!companyId) {
    return res.status(403).json({ success: false, message: "Company context required" });
  }

  const result = await EntitlementService.getCompanyEntitlements(companyId);
  res.json({ success: true, data: result });
});

// 2. Get Published Plans Catalog
exports.getPlansCatalog = asyncHandler(async (req, res) => {
  const result = await PlanService.listPlans({ status: "ACTIVE" });
  // Only return plans with a published version
  const publishedPlans = result.plans.filter((p) => p.activeVersion);
  res.json({ success: true, plans: publishedPlans });
});

// 3. Get Standalone & Add-on Offers & Products Catalog
exports.getOffersCatalog = asyncHandler(async (req, res) => {
  const Product = require("../models/Product");
  const [standaloneOffers, standaloneProducts] = await Promise.all([
    OfferService.getStandaloneOffers(),
    Product.find({
      status: "ACTIVE",
      allowStandalone: true,
      category: { $nin: ["USER_SEATS", "USER_SEAT"] },
    }).lean(),
  ]);

  // Strictly exclude USER_SEATS / Seat-based products from /buy-online catalog
  const filteredOffers = standaloneOffers.filter((o) => {
    const cat = o.product?.category;
    const pType = o.product?.productType;
    const code = String(o.product?.code || "");
    const sku = String(o.sku || "");
    return (
      cat !== "USER_SEATS" &&
      pType !== "SEAT_BASED" &&
      !code.includes("SEAT") &&
      !sku.includes("SEAT")
    );
  });

  const filteredProducts = standaloneProducts.filter(
    (p) => !String(p.code || "").includes("SEAT") && p.category !== "USER_SEATS"
  );

  res.json({ success: true, offers: filteredOffers, products: filteredProducts });
});

// 3b. Standalone Products Catalog
exports.getProductsCatalog = asyncHandler(async (req, res) => {
  const Product = require("../models/Product");
  const products = await Product.find({
    status: "ACTIVE",
    allowStandalone: true,
    category: { $nin: ["USER_SEATS", "USER_SEAT"] },
  }).lean();

  const filtered = products.filter(
    (p) => !String(p.code || "").includes("SEAT") && p.category !== "USER_SEATS"
  );

  res.json({ success: true, products: filtered });
});

// PAYMENT-A. Create Razorpay Order for a Commercial Purchase
exports.createCommercialOrder = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { amount, label, planId, versionId, offerId, productId, quantity, validity, planType } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid purchase amount" });
  }

  const rzp = getRzp();
  let rzpOrder;
  try {
    rzpOrder = await rzp.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `com_${Date.now().toString(36)}${String(userId).slice(-4)}`,
      notes: {
        companyId: String(companyId),
        userId: String(userId),
        planId: planId || "",
        versionId: versionId || "",
        offerId: offerId || "",
        productId: productId || "",
        quantity: String(quantity || 1),
      },
    });
  } catch (err) {
    const detail = err.error?.description || err.error?.message || err.message || "Order creation failed";
    console.error("[Commercial] Razorpay createOrder error:", detail);
    return res.status(502).json({ success: false, message: `Payment gateway error: ${detail}` });
  }

  // Persist a pending transaction record for audit & webhook safety
  let resolvedPlanType = planType;
  if (!resolvedPlanType && planId) {
    try {
      const Plan = require("../models/Plan");
      const planDoc = await Plan.findById(planId).select("planType").lean();
      if (planDoc?.planType) {
        resolvedPlanType = planDoc.planType;
      }
    } catch (_) {}
  }
  if (!resolvedPlanType) {
    resolvedPlanType = (productId || offerId) ? "CUSTOM" : "SMB";
  }
  resolvedPlanType = String(resolvedPlanType).toUpperCase();

  const tx = await PaymentTransaction.create({
    userId,
    role: req.user?.role || "CLIENT",
    companyId: companyId || null,
    razorpayOrderId: rzpOrder.id,
    amount: Math.round(Number(amount)),
    currency: "INR",
    planType: resolvedPlanType,
    durationDays: Number(validity || 90),
    status: "CREATED",
    metadata: { planId, versionId, offerId, productId, quantity, label, validity, rzpOrder },
  });

  res.json({
    success: true,
    data: {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,       // in paise
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      transactionId: String(tx._id),
      planLabel: label || "Commercial Purchase",
    },
  });
});

// PAYMENT-B. Verify Razorpay Signature + Atomically Activate Entitlement
exports.confirmCommercialPayment = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const {
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
    planId, versionId, offerId, productId, quantity,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ success: false, message: "Missing Razorpay payment fields" });
  }

  // 1. Verify HMAC signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  if (expected !== razorpaySignature) {
    return res.status(400).json({ success: false, message: "Payment signature verification failed" });
  }

  // 2. Mark the pending transaction as PAID (idempotent)
  const tx = await PaymentTransaction.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: "PAID" },
    { new: true }
  );

  // 3. Activate entitlement via PurchaseService
  let result;
  if (planId) {
    result = await PurchaseService.purchasePlan({
      companyId,
      userId,
      planId,
      versionId,
      paymentMethod: "ONLINE",
      transactionId: razorpayPaymentId,
      actor: req.user,
    });
  } else {
    result = await PurchaseService.purchaseProductOffer({
      companyId,
      userId,
      offerId,
      productId,
      quantity: quantity || 1,
      paymentMethod: "ONLINE",
      transactionId: razorpayPaymentId,
      actor: req.user,
    });
  }

  res.status(201).json({ ...result, transactionId: tx?._id || razorpayPaymentId });
});

// 4. Purchase Plan
exports.purchasePlan = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { planId, versionId, paymentMethod, transactionId } = req.body;

  if (!planId) {
    return res.status(400).json({ success: false, message: "planId is required" });
  }

  const result = await PurchaseService.purchasePlan({
    companyId,
    userId,
    planId,
    versionId,
    paymentMethod: paymentMethod || "ONLINE",
    transactionId,
    actor: req.user,
  });

  res.status(201).json(result);
});

// 5. Purchase Standalone Product Offer or Direct Product
exports.purchaseProductOffer = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { offerId, productId, quantity = 1, paymentMethod, transactionId } = req.body;

  if (!offerId && !productId) {
    return res.status(400).json({ success: false, message: "offerId or productId is required" });
  }

  const result = await PurchaseService.purchaseProductOffer({
    companyId,
    userId,
    offerId,
    productId,
    quantity,
    paymentMethod: paymentMethod || "ONLINE",
    transactionId,
    actor: req.user,
  });

  res.status(201).json(result);
});

// 6. Plan Upgrade
exports.upgradePlan = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { newPlanId, planId, versionId, paymentMethod, transactionId } = req.body;
  const targetPlanId = newPlanId || planId;

  if (!targetPlanId) {
    return res.status(400).json({ success: false, message: "newPlanId or planId is required" });
  }

  const result = await PurchaseService.upgradePlan({
    companyId,
    userId,
    newPlanId: targetPlanId,
    versionId,
    paymentMethod: paymentMethod || "ONLINE",
    transactionId,
    actor: req.user,
  });

  res.json(result);
});

// 7. Plan Downgrade
exports.scheduleDowngrade = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { targetPlanId } = req.body;

  if (!targetPlanId) {
    return res.status(400).json({ success: false, message: "targetPlanId is required" });
  }

  const result = await PurchaseService.scheduleDowngrade({
    companyId,
    userId,
    targetPlanId,
    actor: req.user,
  });

  res.json(result);
});

// 8. Plan Renewal
exports.renewPlan = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { subscriptionId, paymentMethod, transactionId } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ success: false, message: "subscriptionId is required" });
  }

  const result = await PurchaseService.renewPlan({
    companyId,
    userId,
    subscriptionId,
    paymentMethod: paymentMethod || "ONLINE",
    transactionId,
    actor: req.user,
  });

  res.json(result);
});

// 9. Company Credit Ledger
exports.getCompanyLedger = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const { productCode, page = 1, limit = 50 } = req.query;

  const result = await CreditLedgerService.listLedger({
    companyId,
    productCode,
    page,
    limit,
  });

  res.json({ success: true, ...result });
});

// GET /api/commercial/ai/quota
exports.getAiQuota = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const AiCreditService = require("../services/commercial/ai-credit.service");
  const quota = await AiCreditService.getAiQuota(companyId);
  res.json({ success: true, data: quota });
});

// POST /api/commercial/ai/use
exports.useAiCredit = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const userId = req.user?._id;
  const { jobId, feature, promptTokens, completionTokens } = req.body;

  const AiCreditService = require("../services/commercial/ai-credit.service");
  const result = await AiCreditService.useAiCredit({
    companyId,
    userId,
    jobId,
    feature,
    promptTokens,
    completionTokens,
    actor: {
      userId: req.user?._id,
      userEmail: req.user?.email || "recruiter",
      role: req.user?.role || "RECRUITER",
    },
  });

  res.json({ success: true, data: result });
});

// POST /api/commercial/contact-sales
exports.submitSalesInquiry = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    companyName,
    hiringFor,
    employeeCount,
    designation,
    workEmail,
    city,
    extraFields,
    notes,
  } = req.body;

  try {
    const Lead = require("../models/Lead");
    await Lead.create({
      companyName: companyName || "Inquiry Company",
      contacts: [
        {
          fullName: fullName || "Contact Person",
          phone: mobileNumber || "N/A",
          email: workEmail || "",
          designation: designation || "",
          isPrimary: true,
        },
      ],
      businessCategory: hiringFor === "a consultancy" ? "HR_CONSULTING" : "OTHERS",
      notes: `Hiring For: ${hiringFor || "your company"} | Employees: ${employeeCount || "Not specified"} | City: ${city || "Not specified"}${notes ? ` | Notes: ${notes}` : ""}${extraFields?.length ? ` | Extra: ${JSON.stringify(extraFields)}` : ""}`,
      status: "NEW",
      source: "WEBSITE",
    });
  } catch (leadErr) {
    console.warn("[commercial] Lead auto-create notice:", leadErr.message);
  }

  res.json({
    success: true,
    message: "Thank you! Our sales specialist will contact you shortly.",
  });
});
