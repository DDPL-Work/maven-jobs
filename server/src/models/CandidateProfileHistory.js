const mongoose = require("mongoose");

const candidateProfileHistorySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateProfile",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "RESUME_UPLOADED"],
      required: true,
    },
    changedFields: {
      type: [String],
      default: [],
    },
    changes: {
      type: [
        {
          field: { type: String, required: true },
          previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
          nextValue: { type: mongoose.Schema.Types.Mixed, default: null },
        },
      ],
      default: [],
    },
    actorType: {
      type: String,
      enum: ["CANDIDATE", "ADMIN", "CRM", "SYSTEM"],
      default: "CANDIDATE",
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "CandidateProfileHistory",
  candidateProfileHistorySchema,
);
