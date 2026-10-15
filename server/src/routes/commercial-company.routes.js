const express = require("express");
const controller = require("../controllers/commercial-company.controller");
const { protectUser } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { resolveCompanyContext } = require("../middleware/company-context.middleware");

const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");

const router = express.Router();

// Public Catalogs & Contact for Buy Online marketplace
router.get("/plans", cacheRoute({ key: "cache:commercial:plans", ttl: 600 }), controller.getPlansCatalog);
router.get("/offers", cacheRoute({ key: "cache:commercial:offers", ttl: 600 }), controller.getOffersCatalog);
router.get("/products", cacheRoute({ key: "cache:commercial:products", ttl: 600 }), controller.getProductsCatalog);
router.post("/contact-sales", controller.submitSalesInquiry);

// Protected Company Entitlements & Purchases
router.use(protectUser);
router.use(role("CLIENT", "RECRUITER"));

const companyEntitlementsInvalidate = [
  (req) => `cache:commercial:entitlements:${req.user?.companyId || req.company?._id}`,
  (req) => `cache:company-panel:subscriptions:${req.user?.companyId || req.company?._id}`,
  (req) => `cache:company-panel:dashboard:${req.user?.companyId || req.company?._id}:*`,
];

// Entitlements & Balances (Fast-path Cached Routes)
router.get("/entitlements", cacheRoute({
  key: (req) => `cache:commercial:entitlements:${req.user?.companyId || req.company?._id}`,
  ttl: 120,
}), resolveCompanyContext, controller.getEntitlements);

router.get("/credits", cacheRoute({
  key: (req) => `cache:commercial:entitlements:${req.user?.companyId || req.company?._id}`,
  ttl: 120,
}), resolveCompanyContext, controller.getEntitlements);

router.use(resolveCompanyContext);
router.get("/ledger", controller.getCompanyLedger);
router.get("/classify-transition", controller.classifyTransition);

// AI Credits & Usage
router.get("/ai/quota", controller.getAiQuota);
router.post("/ai/use", invalidateCache(companyEntitlementsInvalidate), controller.useAiCredit);

// Commercial Payment Flow
router.post("/create-order", controller.createCommercialOrder);
router.post("/confirm-payment", invalidateCache(companyEntitlementsInvalidate), controller.confirmCommercialPayment);

// Purchase flows
router.post("/purchase-plan", invalidateCache(companyEntitlementsInvalidate), controller.purchasePlan);
router.post("/purchase-product", invalidateCache(companyEntitlementsInvalidate), controller.purchaseProductOffer);
router.post("/purchase-addon", invalidateCache(companyEntitlementsInvalidate), controller.purchaseProductOffer);
router.post("/upgrade", invalidateCache(companyEntitlementsInvalidate), controller.upgradePlan);
router.post("/downgrade", invalidateCache(companyEntitlementsInvalidate), controller.scheduleDowngrade);
router.post("/renew", invalidateCache(companyEntitlementsInvalidate), controller.renewPlan);

module.exports = router;
