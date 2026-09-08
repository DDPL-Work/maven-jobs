const mongoose = require("mongoose");

const nonVisitDaySchema = new mongoose.Schema(
  {
    fse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["FULL_DAY", "HALF_DAY"],
      default: "FULL_DAY",
    },
    remarks: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate entries for the same FSE on the same date
// We'll normalize the date to start of day in the controller before saving
nonVisitDaySchema.index({ fse: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("NonVisitDay", nonVisitDaySchema);
