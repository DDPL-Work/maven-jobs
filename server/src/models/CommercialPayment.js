const mongoose = require("mongoose");

const commercialPaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommercialOrder",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ["RAZORPAY", "STRIPE", "MANUAL_INVOICE", "SIMULATED"],
      default: "RAZORPAY",
    },
    gatewayOrderId: {
      type: String,
      default: "",
    },
    gatewayPaymentId: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommercialPayment", commercialPaymentSchema);
