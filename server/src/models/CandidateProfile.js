const mongoose = require("mongoose");

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    /**
     * Public share identifier (LinkedIn-like)
     * Used to resolve a candidate profile without authentication.
     * NOTE: Existing profiles will get a generated value on first update
     *       or via a one-time migration (recommended).
     */
    publicShareId: { type: String, default: null, unique: true, index: true },
    phone: { type: String, default: "" },
    altPhone: { type: String, default: "" },
    headline: { type: String, default: "" },
    summary: { type: String, default: "" },
    totalExperience: { type: String, default: "" },
    currentTitle: { type: String, default: "" },
    currentCompany: { type: String, default: "" },
    workStatus: { type: String, default: "" },
    currentSalary: { type: String, default: "" },
    salaryBreakdown: { type: String, default: "" },
    noticePeriod: { type: String, default: "" },
    currentCity: { type: String, default: "" },
    currentState: { type: String, default: "" },
    currentCountry: { type: String, default: "India" },
    preferredLocations: {
      type: [String],
      default: [],
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    languages: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    personalDetailsObj: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    diversityInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    careerProfileObj: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    linkedInUrl: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" },
    expectedSalary: { type: String, default: "" },
    education: { type: String, default: "" },
    itSkills: { type: String, default: "[]" },
    workExperiences: { type: String, default: "[]" },
    educations: { type: String, default: "[]" },
    accomplishments: { type: String, default: "[]" },
    projects: { type: String, default: "[]" },
    projectTitle: { type: String, default: "" },
    projectLink: { type: String, default: "" },
    projectDescription: { type: String, default: "" },
    profileViews: { type: Number, default: 0 },
    recruiterActions: { type: Number, default: 0 },
    lastScannedQrToken: { type: String, default: "" },
    savedJobIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    }],
    followedCompanyIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    }],
    interestedJobIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    }],
    profilePic: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    coverPic: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    resume: {
      fileName: { type: String, default: "" },
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      storageProvider: { type: String, default: "" },
      sizeBytes: { type: Number, default: 0 },
      mimeType: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

// Automatically sync CandidateProfile changes to Elasticsearch
candidateProfileSchema.post("save", function (doc) {
  if (doc?._id) {
    try {
      const { scheduleIndexCandidate } = require("../services/elasticsearch.service");
      scheduleIndexCandidate(doc);
    } catch (_) {}
  }
});

candidateProfileSchema.post("findOneAndUpdate", function (doc) {
  if (doc?._id) {
    try {
      const { scheduleIndexCandidate } = require("../services/elasticsearch.service");
      scheduleIndexCandidate(doc);
    } catch (_) {}
  }
});

candidateProfileSchema.post("findOneAndDelete", function (doc) {
  if (doc?._id) {
    try {
      const { scheduleDeleteCandidate, scheduleReindexCandidates } = require("../services/elasticsearch.service");
      scheduleDeleteCandidate(String(doc._id));
      scheduleReindexCandidates(1500);
    } catch (_) {}
  }
});

candidateProfileSchema.post("deleteOne", { document: true, query: false }, function () {
  if (this?._id) {
    try {
      const { scheduleDeleteCandidate, scheduleReindexCandidates } = require("../services/elasticsearch.service");
      scheduleDeleteCandidate(String(this._id));
      scheduleReindexCandidates(1500);
    } catch (_) {}
  }
});

candidateProfileSchema.post("deleteOne", { document: false, query: true }, function () {
  try {
    const filter = this.getFilter();
    const { scheduleDeleteCandidate, scheduleReindexCandidates } = require("../services/elasticsearch.service");
    if (filter?._id) {
      scheduleDeleteCandidate(String(filter._id));
    }
    scheduleReindexCandidates(1500);
  } catch (_) {}
});

candidateProfileSchema.post("deleteMany", function () {
  try {
    const { scheduleReindexCandidates } = require("../services/elasticsearch.service");
    scheduleReindexCandidates(1500);
  } catch (_) {}
});

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);
