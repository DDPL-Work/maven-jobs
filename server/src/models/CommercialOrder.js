const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["PLAN", "STANDALONE_OFFER", "ADD_ON", "CUSTOM"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    skuOrCode: { type: String, required: true },
    title: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    validityDays: { type: Number, default: 30 },
  },
  { _id: false }
);

const commercialOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      default: "",
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxType: {
      type: String,
      enum: ["IGST", "CGST_SGST", "NONE"],
      default: "IGST",
    },
    igstRate: {
      type: Number,
      default: 0,
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
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "ONLINE", // ONLINE, INVOICE, SIMULATED
    },
    paymentId: {
      type: String,
      default: "",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommercialOrder", commercialOrderSchema);
