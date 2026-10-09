const mongoose = require("mongoose");

const entitlementSnapshotItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "Job",
    },
    validityDays: {
      type: Number,
      default: 30,
    },
    userLimit: {
      type: Number,
      default: 0,
    },
    features: [
      {
        key: String,
        name: String,
        enabled: Boolean,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    subscriptionType: {
      type: String,
      enum: ["PLAN", "STANDALONE", "ADD_ON"],
      required: true,
      default: "PLAN",
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
      index: true,
    },
    planVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlanVersion",
      default: null,
    },
    planVersionNumber: {
      type: Number,
      default: 1,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOffer",
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED", "SCHEDULED", "UPGRADED"],
      default: "ACTIVE",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledStartDate: {
      type: Date,
      default: null,
    },
    commercialSnapshot: {
      pricePaid: { type: Number, default: 0 },
      basePrice: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      taxPaid: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      planName: { type: String, default: "" },
      productName: { type: String, default: "" },
      offerName: { type: String, default: "" },
      validityDays: { type: Number, default: 30 },
      gracePeriodDays: { type: Number, default: 90 },
      purchasedAt: { type: Date, default: Date.now },
      orderNumber: { type: String, default: "" },
      paymentId: { type: String, default: "" },
      invoiceNumber: { type: String, default: "" },
    },
    entitlementSnapshot: [entitlementSnapshotItemSchema],
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommercialOrder",
      default: null,
    },
    orderNumber: {
      type: String,
      default: "",
      index: true,
    },
    paymentId: {
      type: String,
      default: "",
      index: true,
    },
    invoiceNumber: {
      type: String,
      default: "",
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    renewedFromSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
