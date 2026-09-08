const mongoose = require("mongoose");

const dailyUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["JOB_RECOMMENDATION", "CANDIDATE_RECOMMENDATION"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

dailyUsageSchema.index({ userId: 1, type: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyUsage", dailyUsageSchema);
