const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["CANDIDATE", "CLIENT"], required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    planType: { type: String, enum: ["PRO", "ELITE", "ELITE_QUARTERLY", "PREMIUM"], required: true },
    durationDays: { type: Number, default: 30 },
    status: { type: String, enum: ["CREATED", "PAID", "FAILED", "REFUNDED", "EXPIRED"], default: "CREATED" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ razorpayOrderId: 1 });
paymentTransactionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
