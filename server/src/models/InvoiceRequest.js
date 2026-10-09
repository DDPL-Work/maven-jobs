const mongoose = require("mongoose");

const invoiceRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedCrmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
      index: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
    },
    subscriptionId: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

invoiceRequestSchema.index({ companyId: 1, createdAt: -1 });
invoiceRequestSchema.index({ assignedCrmId: 1, status: 1 });

module.exports = mongoose.model("InvoiceRequest", invoiceRequestSchema);
