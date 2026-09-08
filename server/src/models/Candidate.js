const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    // BASIC INFO
    companyName: { type: String, required: true },
    tagline: String,
    industry: { type: String, required: true },
    companySize: String,
    foundedYear: Number,

    // CONTACT
    email: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: String,
    website: String,
    linkedIn: String,

    // LOCATION
    country: String,
    region: { type: String, index: true },
    city: { type: String, required: true, index: true },
    zone: { type: String, index: true },
    address: String,
    pincode: String,

    // PACKAGE
    packageType: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "ELITE"],
      default: "STANDARD",
    },

    jobLimit: {
      type: Number,
      default: 2,
    },

    activeJobCount: {
      type: Number,
      default: 0,
    },

    // CRM CONTROL
    createdByCRM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
