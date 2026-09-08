const mongoose = require("mongoose");

const creditTransactionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  type: { type: String, enum: ["PURCHASE", "RESUME_VIEW", "RESUME_DOWNLOAD", "SEARCH", "ADMIN_ADJUST", "REFUND"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, default: "" },
  referenceId: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

creditTransactionSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("CreditTransaction", creditTransactionSchema);
