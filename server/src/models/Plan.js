const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    planType: {
      type: String,
      required: true,
      enum: ["FREE", "SMB", "CORPORATE", "ENTERPRISE", "CUSTOM"],
      default: "FREE",
    },
    description: {
      type: String,
      default: "",
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxType: {
      type: String,
      enum: ["IGST", "CGST_SGST", "NONE"],
      default: "IGST",
    },
    igstRate: {
      type: Number,
      default: 18,
      min: 0,
    },
    cgstRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 18,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPayablePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
