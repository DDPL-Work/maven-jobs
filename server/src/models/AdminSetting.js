const mongoose = require("mongoose");

const adminSettingSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    owner: { type: String, required: true },
    risk: { type: String, required: true },
    currentState: { type: String, required: true },
    description: { type: String, default: "" },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminSetting", adminSettingSchema);
