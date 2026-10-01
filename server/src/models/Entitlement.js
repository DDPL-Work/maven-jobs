const mongoose = require("mongoose");

const seatAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const entitlementSchema = new mongoose.Schema(
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
      required: false,
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
    productName: {
      type: String,
      required: true,
    },
    allocatedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    consumedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "Job",
    },
    features: [
      {
        key: String,
        name: String,
        enabled: Boolean,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    userLimit: {
      type: Number,
      default: 0,
    },
    assignedSeats: [seatAssignmentSchema],
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true, // Crucial for deterministic earliest-expiry credit consumption!
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXHAUSTED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

entitlementSchema.index({ companyId: 1, productCode: 1, status: 1, expiryDate: 1 });

module.exports = mongoose.model("Entitlement", entitlementSchema);
