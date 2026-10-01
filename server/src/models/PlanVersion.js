const mongoose = require("mongoose");

const planItemSchema = new mongoose.Schema(
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
    validity: {
      type: Number,
      default: 30, // product-specific validity (e.g. 30 days per job)
    },
    validityUnit: {
      type: String,
      enum: ["DAYS", "MONTHS", "YEARS"],
      default: "DAYS",
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
    expiryRule: {
      type: String,
      enum: ["SUBSCRIPTION_END", "FIXED_DAYS", "USAGE_BASED"],
      default: "SUBSCRIPTION_END",
    },
  },
  { _id: false }
);

const planVersionSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"],
      default: "CUSTOM",
    },
    validity: {
      type: Number,
      required: true,
      min: 1,
      default: 90, // plan validity in days
    },
    validityUnit: {
      type: String,
      enum: ["DAYS", "MONTHS", "YEARS"],
      default: "DAYS",
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 18, // GST 18%
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    items: {
      type: [planItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items);
        },
        message: "Plan items must be an array",
      },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    changelog: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

planVersionSchema.index({ planId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("PlanVersion", planVersionSchema);
