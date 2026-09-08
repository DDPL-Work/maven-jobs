const mongoose = require("mongoose");

const recruiterActivitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recruiterName: { type: String, default: "Recruiter" },
    action: {
      type: String,
      enum: [
        "SEARCH",
        "NVITE_SENT",
        "RESUME_VIEW",
        "RESUME_DOWNLOAD",
        "FOLDER_CREATED",
        "CANDIDATE_ADDED",
        "JOB_POSTED",
        "CANDIDATE_APPLIED",
      ],
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

recruiterActivitySchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("RecruiterActivity", recruiterActivitySchema);