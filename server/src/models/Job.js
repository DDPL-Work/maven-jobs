const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    summary: { type: String, default: "" },
    department: String,
    jobType: String, // Full-time, Part-time, etc.
    jobCategory: {
      type: String,
      enum: ["standard", "management", "hot", "internship"],
      default: "standard"
    },
    workplaceType: String,

    location: String,
    experience: String,

    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },

    skills: [String],

    deadline: Date,

    description: String,        // Role Description
    responsibilities: String,   // Key Responsibilities
    qualifications: String,     // Required Skills & Qualifications

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    createdBySource: {
      type: String,
      enum: ["CRM", "CLIENT"],
      default: "CRM",
    },
    createdByCRM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    createdByClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedByCRMAt: {
      type: Date,
      default: null,
    },
    collaborators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    packageSlotCount: {
      type: Number,
      default: 1,
    },
    requiresPackageOverride: {
      type: Boolean,
      default: false,
    },

    isActive: { type: Boolean, default: true },

    externalLink: { type: String, default: "" },

    screeningQuestions: [
      {
        question: { type: String, required: true },
        type: {
          type: String,
          // Must match uiTypeToSchemaType in PostJob.jsx
          enum: [
            "YES_NO",         // "Yes/No"
            "DROPDOWN",       // "Single Choice"
            "CHECKBOX",       // "Multiple Choice"
            "TEXT",           // "Text Answer"
            "NUMERIC",        // "Number"
          ],
          default: "YES_NO",  // frontend default question type is "Yes/No"
        },
        required: { type: Boolean, default: false }, // frontend adds questions with required:false

        options: [String],
        maxLength: { type: Number, default: 500 },
        order: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

jobSchema.index({ companyId: 1, isActive: 1 });

// Automatically sync deletions to OpenSearch and trigger debounced reindex
jobSchema.post("findOneAndDelete", function (doc) {
  if (doc?._id) {
    try {
      const { scheduleDelete, scheduleReindex } = require("../services/opensearch.service");
      scheduleDelete(String(doc._id));
      scheduleReindex(1500);
    } catch (_) {}
  }
});

jobSchema.post("deleteOne", { document: true, query: false }, function () {
  if (this?._id) {
    try {
      const { scheduleDelete, scheduleReindex } = require("../services/opensearch.service");
      scheduleDelete(String(this._id));
      scheduleReindex(1500);
    } catch (_) {}
  }
});

jobSchema.post("deleteOne", { document: false, query: true }, function () {
  try {
    const filter = this.getFilter();
    const { scheduleDelete, scheduleReindex } = require("../services/opensearch.service");
    if (filter?._id) {
      scheduleDelete(String(filter._id));
    }
    scheduleReindex(1500);
  } catch (_) {}
});

jobSchema.post("deleteMany", function () {
  try {
    const { scheduleReindex } = require("../services/opensearch.service");
    scheduleReindex(1500);
  } catch (_) {}
});

module.exports = mongoose.model("Job", jobSchema);
