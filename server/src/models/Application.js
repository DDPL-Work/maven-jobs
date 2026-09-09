const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "APPLIED",
        "SCREENING",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFERED",
        "HIRED",
        "REJECTED",
      ],
      default: "APPLIED",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    resumeFileName: {
      type: String,
      default: "",
    },
    sourceQrToken: {
      type: String,
      default: "",
    },
    sourceJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        question: { type: String, default: "" },
        answer: { type: mongoose.Schema.Types.Mixed, default: "" },
      },
    ],

    appliedFrom: {
      type: String,
      enum: ["QUICK_APPLY", "JOB_DETAILS"],
      default: "JOB_DETAILS",
    },

    callStatus: {
      type: String,
      default: "",
    },

    isViewed: {
      type: Boolean,
      default: false,
    },

    comments: [
      {
        text: { type: String, required: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        authorName: { type: String, default: "Recruiter" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
