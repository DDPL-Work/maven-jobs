const mongoose = require("mongoose");

const crmCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ["EMAIL", "APP"],
      required: true,
    },
    audience: {
      type: String,
      enum: ["CLIENTS", "CANDIDATES"],
      required: true,
    },
    companyIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Company",
      default: [],
    },
    jobIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Job",
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "SENT"],
      default: "SENT",
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    createdByCRM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CrmCampaign", crmCampaignSchema);
