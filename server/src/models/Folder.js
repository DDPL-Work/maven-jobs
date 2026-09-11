const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true },
  description: { type: String, default: "", trim: true },
  icon: { type: String, default: "folder" },
  color: { type: String, default: "#002366" },
  isPublic: { type: Boolean, default: false },
  candidateCount: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: null },
  createdBy: { type: String, default: "" },
  sharedWith: [{ type: String, trim: true }],
}, { timestamps: true });

folderSchema.index({ companyId: 1, name: 1 }, { unique: true });
folderSchema.index({ companyId: 1, updatedAt: -1 });
folderSchema.index({ employerId: 1, updatedAt: -1 });

module.exports = mongoose.model("Folder", folderSchema);
