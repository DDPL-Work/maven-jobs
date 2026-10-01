const express = require("express");
const controller = require("../controllers/commercial-admin.controller");
const { protectAdmin } = require("../middleware/admin.middleware");

const router = express.Router();

router.use(protectAdmin);

// Commercial Dashboard
router.get("/dashboard", controller.getDashboard);

// Products
router.get("/products", controller.getProducts);
router.post("/products", controller.createProduct);
router.get("/products/:id", controller.getProduct);
router.patch("/products/:id", controller.updateProduct);
router.post("/products/:id/status", controller.deactivateProduct);
router.delete("/products/:id", controller.deleteProduct);

// Product Offers
router.get("/products/:productId/offers", controller.getOffers);
router.post("/products/:productId/offers", controller.createOffer);
router.get("/offers", controller.getOffers);
router.post("/offers", controller.createOffer);
router.patch("/offers/:id", controller.updateOffer);
router.delete("/offers/:id", controller.deleteOffer);

// Plans & Versions
router.get("/plans", controller.getPlans);
router.post("/plans", controller.createPlan);
router.get("/plans/:id", controller.getPlan);
router.patch("/plans/:id", controller.updatePlan);
router.post("/plans/:id/status", controller.deactivatePlan);

router.post("/plans/:id/versions", controller.createPlanVersion);
router.patch("/versions/:id", controller.updatePlanVersion);
router.post("/plans/:id/publish", controller.publishPlanVersion);

// Subscriptions & Entitlements
router.get("/subscriptions", controller.getSubscriptions);
router.get("/subscriptions/:id", controller.getSubscription);

// Credit Ledger
router.get("/credit-ledger", controller.getCreditLedger);
router.post("/credit-ledger/adjust", controller.adjustCredit);

// Commercial Audit Logs
router.get("/audit-logs", controller.getAuditLogs);

module.exports = router;
