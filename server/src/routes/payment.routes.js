const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { protectUser } = require("../middleware/auth.middleware");
const rateLimit = require("express-rate-limit");

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many payment requests. Try again later." },
});

router.post("/create-order", protectUser, orderLimiter, paymentController.createOrder);
router.post("/confirm", protectUser, paymentController.confirmPayment);
router.post("/verify", protectUser, paymentController.verifyPayment);
router.get("/plans", paymentController.getPlans);

module.exports = router;
module.exports.webhookHandler = paymentController.webhook;
