const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "ELITE"],
      unique: true,
    },

    price: { type: Number, default: 0 },
    jobPostingLimit: { type: Number, required: true },
    smbJobPostingLimit: { type: Number, default: 0 },
    cvAccessLimit: { type: Number, default: 0 },
    nviteLimit: { type: Number, default: 0 },
    description: {
      type: String,
      default: "",
    },
    isDefaultPackage: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
