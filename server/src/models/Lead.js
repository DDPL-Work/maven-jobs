const crypto = require("crypto");
const mongoose = require("mongoose");
const {
  BUSINESS_CATEGORIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_PRIORITIES,
} = require("../constants/lead-generator.constants");

const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

const leadContactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const activityContactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const leadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      unique: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    contacts: {
      type: [leadContactSchema],
      default: [],
    },
    businessCategory: {
      type: String,
      enum: BUSINESS_CATEGORIES,
      required: true,
    },
    leadSource: {
      type: String,
      enum: LEAD_SOURCES,
      required: true,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "NEW",
      index: true,
    },
    priority: {
      type: String,
      enum: LEAD_PRIORITIES,
      default: "MEDIUM",
    },
    city: {
      type: String,
      trim: true,
      required: true,
    },
    state: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    tnc: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    sourcingDate: {
      type: Date,
      default: null,
    },
    isStartup: {
      type: Boolean,
      default: false,
    },
    masterUnion: {
      type: String,
      trim: true,
      default: "",
    },
    isOtherSource: {
      type: Boolean,
      default: false,
    },
    subStatus: {
      type: String,
      trim: true,
      default: "",
    },
    franchiseStatus: {
      type: String,
      trim: true,
      default: "",
    },
    projection: {
      type: String,
      enum: ["", "WP > 50", "WP < 50", "MP < 50", "MP > 50"],
      default: "",
      trim: true,
    },
    clientType: {
      type: String,
      enum: ["Standard", "Premium"],
      default: "Standard",
    },
    sourcedBy: {
      type: String,
      trim: true,
      default: "",
    },
    employeeCount: {
      type: String,
      trim: true,
      default: "",
    },
    nextFollowUpAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastContactedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    dealValue: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
    },
    convertedAt: {
      type: Date,
      default: null,
      index: true,
    },
    requiresNationalApproval: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStrategicDeal: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"],
      default: "NOT_REQUIRED",
      index: true,
    },
    approvalLevel: {
      type: String,
      enum: ["STATE_MANAGER", "ZONAL_MANAGER", "NATIONAL_SALES_HEAD"],
      default: "STATE_MANAGER",
    },
    approvalRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    approvalRequestedAt: {
      type: Date,
      default: null,
    },
    approvalDecisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },
    approvalDecisionAt: {
      type: Date,
      default: null,
    },
    approvalDecisionNote: {
      type: String,
      trim: true,
      default: "",
    },
    isForwardedToSM: {
      type: Boolean,
      default: false,
    },
    activities: [
      {
        outcome: { type: String, required: true },
        notes: { type: String, required: true },
        subStatus: { type: String, trim: true, default: "" },
        interactionMode: { type: String, enum: ["Call", "Visit"], default: "Call" },
        nextFollowUpAt: { type: Date },
        contact: {
          type: activityContactSchema,
          required: false,
          default: null,
        },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

leadSchema.index({ leadSource: 1, createdAt: -1 });
leadSchema.index({ businessCategory: 1, createdAt: -1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ "contacts.phone": 1 });
leadSchema.index({ "contacts.email": 1 });

leadSchema.pre("validate", async function () {
  if (!this.leadCode) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.leadCode = `LD-${stamp}-${suffix}`;
  }
});

leadSchema.pre("save", async function () {
  this.contactName = String(this.contactName || "").trim();
  this.phone = normalizePhoneNumber(String(this.phone || ""));
  this.alternatePhone = normalizePhoneNumber(this.alternatePhone);
  this.email = (this.email || "").trim().toLowerCase();
  this.companyName = this.companyName.trim();
  this.city = this.city.trim();
  this.state = this.state.trim();
  this.address = (this.address || "").trim();
  this.notes = (this.notes || "").trim();
  this.pincode = (this.pincode || "").trim();
  this.currency = (this.currency || "INR").trim().toUpperCase();

  const normalizedContacts = (Array.isArray(this.contacts) ? this.contacts : [])
    .map((contact) => ({
      fullName: String(contact?.fullName || "").trim(),
      phone: normalizePhoneNumber(String(contact?.phone || "")),
      email: String(contact?.email || "").trim().toLowerCase(),
      designation: String(contact?.designation || "").trim(),
      isPrimary: Boolean(contact?.isPrimary),
    }))
    .filter((contact) => contact.fullName || contact.phone || contact.email);

  if (normalizedContacts.length) {
    const primaryIndex = normalizedContacts.findIndex((contact) => contact.isPrimary);
    const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

    this.contacts = normalizedContacts.map((contact, index) => ({
      ...contact,
      isPrimary: index === resolvedPrimaryIndex,
    }));

    const primaryContact = this.contacts[resolvedPrimaryIndex];
    this.contactName = primaryContact.fullName || this.contactName;
    this.phone = primaryContact.phone || this.phone;
    if (primaryContact.email) {
      this.email = primaryContact.email;
    }
  } else {
    this.contacts = [];
  }

  if (Array.isArray(this.activities)) {
    this.activities = this.activities.map((activity = {}) => {
      const activitySnapshot = typeof activity.toObject === "function" ? activity.toObject() : activity;
      if (!activity.contact) {
        return {
          ...activitySnapshot,
          contact: null,
        };
      }

      return {
        ...activitySnapshot,
        contact: {
          fullName: String(activity.contact.fullName || "").trim(),
          phone: normalizePhoneNumber(String(activity.contact.phone || "")),
          email: String(activity.contact.email || "").trim().toLowerCase(),
          designation: String(activity.contact.designation || "").trim(),
        },
      };
    });
  }
});

leadSchema.statics.normalizePhoneNumber = normalizePhoneNumber;

module.exports = mongoose.model("Lead", leadSchema);
