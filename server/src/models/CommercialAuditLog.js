const mongoose = require("mongoose");

const commercialAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: [
        "PRODUCT",
        "OFFER",
        "PLAN",
        "PLAN_VERSION",
        "SUBSCRIPTION",
        "ENTITLEMENT",
        "CREDIT_LEDGER",
      ],
      index: true,
    },
    targetId: {
      type: String,
      default: "",
    },
    targetName: {
      type: String,
      default: "",
    },
    performedBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    beforeSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

commercialAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CommercialAuditLog", commercialAuditLogSchema);
