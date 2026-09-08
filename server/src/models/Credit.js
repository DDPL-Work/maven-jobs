const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, unique: true, index: true },
  balance: { type: Number, default: 0, min: 0 },
  lifetimePurchased: { type: Number, default: 0 },
  lifetimeUsed: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Credit", creditSchema);
