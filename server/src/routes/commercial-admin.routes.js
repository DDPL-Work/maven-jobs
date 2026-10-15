const express = require("express");
const controller = require("../controllers/commercial-admin.controller");
const { protectAdmin } = require("../middleware/admin.middleware");

const { invalidateCache } = require("../middleware/cache.middleware");

const router = express.Router();

router.use(protectAdmin);

const catalogInvalidate = [
  "cache:commercial:plans",
  "cache:commercial:offers",
  "cache:commercial:products",
  "cache:company-panel:packages",
];

// Commercial Dashboard
router.get("/dashboard", controller.getDashboard);

// Products
router.get("/products", controller.getProducts);
router.post("/products", invalidateCache(catalogInvalidate), controller.createProduct);
router.get("/products/:id", controller.getProduct);
router.patch("/products/:id", invalidateCache(catalogInvalidate), controller.updateProduct);
router.post("/products/:id/status", invalidateCache(catalogInvalidate), controller.deactivateProduct);
router.delete("/products/:id", invalidateCache(catalogInvalidate), controller.deleteProduct);

// Product Offers
router.get("/products/:productId/offers", controller.getOffers);
router.post("/products/:productId/offers", invalidateCache(catalogInvalidate), controller.createOffer);
router.get("/offers", controller.getOffers);
router.post("/offers", invalidateCache(catalogInvalidate), controller.createOffer);
router.patch("/offers/:id", invalidateCache(catalogInvalidate), controller.updateOffer);
router.delete("/offers/:id", invalidateCache(catalogInvalidate), controller.deleteOffer);

// Plans & Versions
router.get("/plans", controller.getPlans);
router.post("/plans", invalidateCache(catalogInvalidate), controller.createPlan);
router.get("/plans/:id", controller.getPlan);
router.patch("/plans/:id", invalidateCache(catalogInvalidate), controller.updatePlan);
router.post("/plans/:id/status", invalidateCache(catalogInvalidate), controller.deactivatePlan);

router.post("/plans/:id/versions", invalidateCache(catalogInvalidate), controller.createPlanVersion);
router.patch("/versions/:id", invalidateCache(catalogInvalidate), controller.updatePlanVersion);
router.post("/plans/:id/publish", invalidateCache(catalogInvalidate), controller.publishPlanVersion);

// Subscriptions & Entitlements
router.get("/subscriptions", controller.getSubscriptions);
router.get("/subscriptions/:id", controller.getSubscription);

// Credit Ledger
router.get("/credit-ledger", controller.getCreditLedger);
router.post("/credit-ledger/adjust", controller.adjustCredit);

// Commercial Audit Logs
router.get("/audit-logs", controller.getAuditLogs);

module.exports = router;
