const mongoose = require("mongoose");

const resdexReportSubscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      index: true,
    },
    // Subscriptions per tab: 'database-usage', 'search-report', 'user-login', 'contacted-candidate-mis', 'comments-reports', 'call-report'
    subscriptions: {
      "database-usage": {
        type: String,
        enum: ["disabled", "daily", "weekly", "monthly"],
        default: "disabled",
      },
      "user-login": {
        type: String,
        enum: ["disabled", "daily", "weekly", "monthly"],
        default: "disabled",
      },
    },
    emailList: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    lastSentAt: {
      type: Map,
      of: Date,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ResdexReportSubscription",
  resdexReportSubscriptionSchema
);
