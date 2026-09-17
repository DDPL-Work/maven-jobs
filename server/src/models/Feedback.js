const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    feedbackType: {
      type: String,
      enum: [
        "General",
        "Feature Request",
        "Resdex Search & Email",
        "Job Postings & Response Manager",
        "Support & Training",
        "Onboarding",
        "Marketing Communications",
        "Sales processes",
        "others"
      ],
      default: "General",
    },
    suggestions: {
      type: String,
      required: true,
      trim: true,
    },
    canContact: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
