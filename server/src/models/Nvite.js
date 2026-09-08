const mongoose = require("mongoose");

const nviteSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipients: [{
    email: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "sent", "opened", "replied", "bounced"], default: "pending" },
    sentAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },
  }],
  subject: { type: String, required: true },
  body: { type: String, required: true },
  templateId: { type: String, default: null },
  totalCount: { type: Number, default: 0 },
  unknownCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

nviteSchema.index({ companyId: 1, createdAt: -1 });
nviteSchema.index({ "recipients.email": 1 });

module.exports = mongoose.model("Nvite", nviteSchema);
