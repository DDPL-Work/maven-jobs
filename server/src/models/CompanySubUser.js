const mongoose = require("mongoose");

const companySubUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isSuperUser: {
      type: Boolean,
      default: false,
    },
    permissions: {
      jobPosting: { type: Boolean, default: true },
      jobBooster: { type: Boolean, default: false },
      resdex: { type: Boolean, default: false },
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
    timeRestriction: {
      policy: {
        type: String,
        enum: ["all-day", "office-hours", "custom"],
        default: "all-day",
      },
      weekendRestrictions: [{ type: String }],
      accessStartTime: { type: String, default: "12:00 AM" },
      accessEndTime: { type: String, default: "11:59 PM" },
    },
    ipRestriction: {
      type: String,
      default: "",
    },
    accountSecurity: {
      notifyPasswordChange: { type: Boolean, default: true },
      receiveOtpOnlyOnMobile: { type: Boolean, default: false },
      useOtpOnPatternChange: { type: Boolean, default: false },
    },
    avatar: { type: String, default: "" },
    avatarBg: { type: String, default: "" },
    avatarColor: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySubUser", companySubUserSchema);
