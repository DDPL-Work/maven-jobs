const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["CANDIDATE", "CLIENT", "RECRUITER", "ADMIN"],
      required: true,
      default: "CLIENT",
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    planType: {
      type: String,
      enum: [
        // Candidate plans
        "PRO",
        "ELITE",
        "ELITE_QUARTERLY",
        "PREMIUM",
        // Company / Commercial plans
        "FREE",
        "SMB",
        "CORPORATE",
        "ENTERPRISE",
        "CUSTOM",
        "COMMERCIAL",
        // Legacy job packages
        "JOB_PACKAGE_1",
        "JOB_PACKAGE_2",
        "JOB_PACKAGE_3",
      ],
      required: true,
      default: "SMB",
    },
    durationDays: { type: Number, default: 30 },
    status: { type: String, enum: ["CREATED", "PAID", "FAILED", "REFUNDED", "EXPIRED"], default: "CREATED" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ razorpayOrderId: 1 });
paymentTransactionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
