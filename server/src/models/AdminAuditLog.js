const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: "" },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["INFO", "MEDIUM", "HIGH", "CRITICAL"],
      default: "INFO",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
