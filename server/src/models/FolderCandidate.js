const mongoose = require("mongoose");

const folderCandidateSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String, default: "", trim: true },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

folderCandidateSchema.index({ folderId: 1, candidateId: 1 }, { unique: true });
folderCandidateSchema.index({ candidateId: 1 });

module.exports = mongoose.model("FolderCandidate", folderCandidateSchema);
