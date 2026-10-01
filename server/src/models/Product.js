const mongoose = require("mongoose");

const productFeatureSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    value: { type: mongoose.Schema.Types.Mixed, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "JOB_POSTING",
        "MIVITES",
        "RESUME_SEARCH",
        "AI",
        "USER_SEATS",
        "ADD_ONS",
        "OTHER",
      ],
      default: "JOB_POSTING",
    },
    productType: {
      type: String,
      required: true,
      enum: ["CREDIT_BASED", "SEAT_BASED", "FEATURE_BASED", "USAGE_BASED"],
      default: "CREDIT_BASED",
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "Job", // Job, Resume View, AI Use, User, Search, Booster, Seat
    },
    allowStandalone: {
      type: Boolean,
      default: true,
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    validity: {
      type: Number,
      default: 30,
      min: 1,
    },
    validityUnit: {
      type: String,
      enum: ["DAYS", "MONTHS", "YEARS"],
      default: "DAYS",
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxQuantity: {
      type: Number,
      default: 100000,
      min: 1,
    },
    autoRenewalAllowed: {
      type: Boolean,
      default: false,
    },
    features: [productFeatureSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
