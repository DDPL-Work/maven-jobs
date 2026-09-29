const mongoose = require("mongoose");

const folderCandidateSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String, default: "", trim: true },
  tags: [{ type: String, trim: true }],
  tag: { type: String, enum: ['prospect', 'shortlisted', 'rejected', ''], default: 'prospect' },
  callStatus: { type: String, enum: ['Called', 'Messaged', 'Not picked', 'Not reachable', ''], default: '' },
  comments: [
    {
      text: { type: String, required: true, trim: true },
      authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      authorName: { type: String, default: "Recruiter" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

folderCandidateSchema.index({ folderId: 1, candidateId: 1 }, { unique: true });
folderCandidateSchema.index({ candidateId: 1 });

module.exports = mongoose.model("FolderCandidate", folderCandidateSchema);
