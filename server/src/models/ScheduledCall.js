const mongoose = require("mongoose");

const scheduledCallSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: "Initial screening call",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Rescheduled", "Called", "Closed", "Active"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduledCall", scheduledCallSchema);
