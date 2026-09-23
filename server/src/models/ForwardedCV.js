const mongoose = require("mongoose");

const forwardedCVSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateProfile",
      default: null,
    },
    toEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    isResumeAttached: {
      type: Boolean,
      default: false,
    },
    resumeLink: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
forwardedCVSchema.index({ companyId: 1, createdAt: -1 });
forwardedCVSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model("ForwardedCV", forwardedCVSchema);
