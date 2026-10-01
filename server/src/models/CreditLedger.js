const mongoose = require("mongoose");

const creditLedgerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    entitlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entitlement",
      default: null,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: [
        "PLAN_PURCHASE",
        "STANDALONE_PURCHASE",
        "ADD_ON_PURCHASE",
        "FREE_TIER_GRANT",
        "JOB_POSTED",
        "RESUME_VIEWED",
        "AI_USED",
        "MANUAL_ADJUSTMENT",
        "REFUND",
        "EXPIRED",
        "PLAN_RENEWAL",
        "PLAN_UPGRADE",
      ],
      index: true,
    },
    quantity: {
      type: Number,
      required: true, // Positive for additions, negative for consumption
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceType: {
      type: String,
      default: "System", // Job, CandidateProfile, AIRequest, Order, Manual, Subscription
    },
    referenceId: {
      type: String,
      default: "",
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      id: { type: String, default: "system" },
      email: { type: String, default: "" },
      role: { type: String, default: "SYSTEM" },
    },
  },
  { timestamps: true }
);

creditLedgerSchema.index({ companyId: 1, productCode: 1, createdAt: -1 });

module.exports = mongoose.model("CreditLedger", creditLedgerSchema);
