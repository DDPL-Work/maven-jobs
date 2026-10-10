const express = require("express");
const controller = require("../controllers/commercial-company.controller");
const { protectUser } = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { resolveCompanyContext } = require("../middleware/company-context.middleware");

const router = express.Router();

// Public Catalogs & Contact for Buy Online marketplace
router.get("/plans", controller.getPlansCatalog);
router.get("/offers", controller.getOffersCatalog);
router.get("/products", controller.getProductsCatalog);
router.post("/contact-sales", controller.submitSalesInquiry);

// Protected Company Entitlements & Purchases
router.use(protectUser);
router.use(role("CLIENT", "RECRUITER"));
router.use(resolveCompanyContext);

// Entitlements & Balances
router.get("/entitlements", controller.getEntitlements);
router.get("/credits", controller.getEntitlements);
router.get("/ledger", controller.getCompanyLedger);
router.get("/classify-transition", controller.classifyTransition);

// AI Credits & Usage
router.get("/ai/quota", controller.getAiQuota);
router.post("/ai/use", controller.useAiCredit);

// Commercial Payment Flow
router.post("/create-order", controller.createCommercialOrder);
router.post("/confirm-payment", controller.confirmCommercialPayment);

// Purchase flows
router.post("/purchase-plan", controller.purchasePlan);
router.post("/purchase-product", controller.purchaseProductOffer);
router.post("/purchase-addon", controller.purchaseProductOffer);
router.post("/upgrade", controller.upgradePlan);
router.post("/downgrade", controller.scheduleDowngrade);
router.post("/renew", controller.renewPlan);

module.exports = router;
