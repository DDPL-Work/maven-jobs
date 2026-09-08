const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },
    sizeBytes: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const clientIntakeSchema = new mongoose.Schema(
  {
    referenceId: { type: String, required: true, unique: true, index: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    roleTitle: { type: String, default: "", trim: true },
    roleDescription: { type: String, default: "", trim: true },
    budget: { type: String, default: "", trim: true },
    jdAttachments: { type: [attachmentSchema], default: [] },
    submissionMode: {
      type: String,
      enum: ["MANUAL", "UPLOAD_JD", "BOTH"],
      default: "MANUAL",
      index: true,
    },
    qrToken: { type: String, default: "", trim: true },
    sourcePath: { type: String, default: "", trim: true },
    sourceIp: { type: String, default: "", trim: true },
    sourceUserAgent: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["NEW", "IN_REVIEW", "CONTACTED", "CLOSED"],
      default: "NEW",
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClientIntake", clientIntakeSchema);
