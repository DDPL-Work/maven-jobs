const mongoose = require("mongoose");

const paidResumeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  firstViewedAt: { type: Date, default: Date.now },
  lastViewedAt: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 1 },
}, { timestamps: true });

paidResumeSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model("PaidResume", paidResumeSchema);
