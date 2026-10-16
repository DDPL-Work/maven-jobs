const mongoose = require("mongoose");

const salesEnquiryFormSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      default: () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        return `ENQ-${timestamp}-${randomSuffix}`;
      },
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: {
        values: ["company", "consultancy", "other", ""],
        message: "{VALUE} is not a valid entity type",
      },
      default: "",
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    organizationName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    employeeCount: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    source: {
      type: String,
      default: "TALENT_CLOUD",
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "NEW",
        "CONTACTED",
        "IN_DISCUSSION",
        "DEMO_SCHEDULED",
        "CONVERTED",
        "CLOSED",
      ],
      default: "NEW",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sourceIp: {
      type: String,
      default: "",
      trim: true,
    },
    sourceUserAgent: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryReport: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate a human-readable reference ID if not provided
salesEnquiryFormSchema.pre("save", function () {
  if (!this.referenceId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.referenceId = `ENQ-${timestamp}-${randomSuffix}`;
  }
});

module.exports = mongoose.model("SalesEnquiryForm", salesEnquiryFormSchema);
