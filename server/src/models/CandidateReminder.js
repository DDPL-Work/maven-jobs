const mongoose = require("mongoose");

const candidateReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["For call later", "For interview follow up", "For sending JD", "For other task", "Call later", "Interview", "Send job description", "Other"],
      default: "For other task",
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    mailCalendarEvent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by the scheduler
candidateReminderSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model("CandidateReminder", candidateReminderSchema);
