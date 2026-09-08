const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    qrImageUrl: {
      type: String,
    },

    pdfUrl: {
      type: String,
    },

    pdfPublicId: {
      type: String,
    },

    scans: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdByCRM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
    shareChannel: {
      type: String,
      enum: ["EMAIL", "APP", "MANUAL", ""],
      default: "",
    },
    sharedWithEmail: {
      type: String,
      default: "",
    },
    lastSharedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

/*
========================================
AUTO DELETE AFTER EXPIRY (OPTIONAL)
========================================
If expiresAt is set, Mongo will auto delete
the document when time is reached.
*/
qrCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("QRCode", qrCodeSchema);
