const mongoose = require("mongoose");

const nationalSalesPolicySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
      trim: true,
    },
    highValueDealThreshold: {
      type: Number,
      min: 0,
      default: 500000,
    },
    strategicDealThreshold: {
      type: Number,
      min: 0,
      default: 1000000,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
    },
    autoApproveBelowThreshold: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NationalSalesPolicy", nationalSalesPolicySchema);
