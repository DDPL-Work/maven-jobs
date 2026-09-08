const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "ELITE"],
      unique: true,
    },

    jobLimit: { type: Number, required: true }
    ,
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
