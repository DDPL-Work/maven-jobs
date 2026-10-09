const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema({
  icon: String,
  title: String,
  desc: String,
});

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tagline: String,
    industry: String,
    companySize: String,
    foundedYear: String,
    employeesCount: String,
    headquarters: String,

    website: String,
    linkedIn: String,
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    coverImagePublicId: { type: String, default: "" },
    activelyHiring: { type: Boolean, default: true },
    openRoles: Number,
    type: { type: String, default: "" },
    specialties: [{ type: String }],
    perks: [{ label: { type: String }, icon: { type: String } }],

    email: { type: String, required: true },
    phone: String,
    countryCode: String,
    altPhone: String,

    contactPerson: { type: String, default: "" },
    contactDesignation: { type: String, default: "" },
    alias: { type: String, default: "" },
    tanNumber: { type: String, default: "" },
    gstin: { type: String, default: "" },
    kycStatus: { type: String, default: "PENDING_VERIFICATION" },
    registeredName: { type: String, default: "" },
    addressLabel: { type: String, default: "Primary Address" },
    profileHotVacancies: { type: String, default: "Standard" },
    profileClassifieds: { type: String, default: "Standard" },
    jobLiveDurationDays: { type: Number, default: 30 },
    jobLiveDurations: {
      standard: { type: Number, default: 30 },
      hotVacancy: { type: Number, default: 30 },
      smb: { type: Number, default: 30 },
      internship: { type: Number, default: 30 },
    },

    location: {
      country: String,
      region: String,
      city: String,
      zone: String,
      address: String,
      pincode: String,
    },
    
    allowedDomains: [{ type: String }],

    // Security settings for the company (e.g. OTP and passwords)
    securitySettings: {
      notifyPasswordChange: { type: Boolean, default: true },
      receiveOtpOnlyOnMobile: { type: Boolean, default: false },
      useOtpOnPatternChange: { type: Boolean, default: false },
    },

    // Product Settings (Resdex & Job Posting preferences)
    productSettings: {
      resdex: {
        allowSubuserResetLogin: { type: Boolean, default: true },
        displayAvailableUsernames: { type: Boolean, default: true },
      },
      jobPosting: {
        photos: [{ type: String }],
        presentations: [{ title: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
        videoUrls: [{ title: String, url: String }],
        addresses: [{
          title: String,
          addressLine: String,
          city: String,
          state: String,
          pincode: String,
          isDefault: { type: Boolean, default: false }
        }],
        emailIds: [{
          email: String,
          label: String,
          isDefault: { type: Boolean, default: false }
        }]
      }
    },

    about: String,
    mission: String,
    vision: String,

    whyJoinUs: [highlightSchema],

    createdByCRM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      required: true,
    },
    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // packageType: {
    //   type: String,
    //   enum: ["STANDARD", "PREMIUM", "ELITE"],
    //   default: "STANDARD",
    // },
    // jobLimit: {
    //   type: Number,
    //   default: 0,
    // },
    // grandfatheredJobLimit: {
    //   type: Number,
    //   default: 0,
    // },
    // nviteLimit: {
    //   type: Number,
    //   default: 0,
    // },
    // activeJobCount: { type: Number, default: 0 },
    // packageExpiresAt: { type: Date, default: null },
    configurationNotes: { type: String, default: "" },
    accountManager: { type: String, default: "" },

    quotaConfig: {
      allocationPolicy: { type: String, enum: ['weekly', 'monthly', 'full'], default: 'full' },
      weekly: {
        cvAccess: { type: Number, default: 0 },
        nvite: { type: Number, default: 0 }
      },
      monthly: {
        cvAccess: { type: Number, default: 0 },
        nvite: { type: Number, default: 0 }
      }
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "PENDING_VERIFICATION", "REJECTED"],
      default: "ACTIVE",
    },
    commercialStatus: {
      type: String,
      enum: ["ACTIVE", "EXPIRED_GRACE", "EXPIRED_LOCKED", "NO_PLAN"],
      default: "NO_PLAN",
      index: true,
    },
    planGraceExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    assignedFSE: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmUser",
      default: null,
    },

    // Commercial plan snapshot & consumed services/products
    planSnapshot: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
      planVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "PlanVersion" },
      planVersionNumber: { type: Number, default: 1 },
      planName: { type: String, default: "" },
      planCode: { type: String, default: "" },
      planType: { type: String, default: "FREE" },
      billingCycle: { type: String, default: "CUSTOM" },
      validity: { type: Number, default: 30 },
      validityUnit: { type: String, default: "DAYS" },
      gracePeriodDays: { type: Number, default: 90 },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      assignedAt: { type: Date, default: Date.now },
      services: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          productCode: { type: String, default: "" },
          productName: { type: String, default: "" },
          category: { type: String, default: "" },
          productType: { type: String, default: "" },
          quantity: { type: Number, default: 0 },
          usedQuantity: { type: Number, default: 0 },
          unit: { type: String, default: "" },
          validity: { type: Number, default: 30 },
          validityUnit: { type: String, default: "DAYS" },
          features: [
            {
              key: String,
              name: String,
              enabled: Boolean,
              value: mongoose.Schema.Types.Mixed,
            },
          ],
        },
      ],
    },
  },
  { timestamps: true }
);

/**
 * Automatically zero out balances when plan has expired
 */
companySchema.methods.zeroExpiredPlanBalances = function () {
  const now = new Date();
  const planEndDate = this.planSnapshot?.endDate || this.packageExpiresAt;
  const isExpired = Boolean(
    (planEndDate && new Date(planEndDate) < now) ||
    this.commercialStatus === "EXPIRED_GRACE" ||
    this.commercialStatus === "EXPIRED_LOCKED" ||
    (this.commercialStatus === "NO_PLAN" && (planEndDate ? new Date(planEndDate) < now : true))
  );

  if (isExpired && this.planSnapshot) {
    let changed = false;

    if (this.planSnapshot.validity !== 0) {
      this.planSnapshot.validity = 0;
      changed = true;
    }

    if (Array.isArray(this.planSnapshot.services)) {
      this.planSnapshot.services.forEach((s) => {
        if (s.quantity !== 0 || s.usedQuantity !== 0 || s.validity !== 0) {
          s.quantity = 0;
          s.usedQuantity = 0;
          s.validity = 0;
          changed = true;
        }
      });
    }

    if (this.jobLimit && this.jobLimit !== 0) {
      this.jobLimit = 0;
      changed = true;
    }

    if (this.nviteLimit && this.nviteLimit !== 0) {
      this.nviteLimit = 0;
      changed = true;
    }

    if (this.quotaConfig) {
      if (this.quotaConfig.weekly) {
        if (this.quotaConfig.weekly.cvAccess !== 0 || this.quotaConfig.weekly.nvite !== 0) {
          this.quotaConfig.weekly.cvAccess = 0;
          this.quotaConfig.weekly.nvite = 0;
          changed = true;
        }
      }
      if (this.quotaConfig.monthly) {
        if (this.quotaConfig.monthly.cvAccess !== 0 || this.quotaConfig.monthly.nvite !== 0) {
          this.quotaConfig.monthly.cvAccess = 0;
          this.quotaConfig.monthly.nvite = 0;
          changed = true;
        }
      }
    }

    if (this.commercialStatus === "ACTIVE" && planEndDate && new Date(planEndDate) < now) {
      const graceDays = Number(this.planSnapshot.gracePeriodDays ?? 90);
      const graceEnd = new Date(new Date(planEndDate).getTime() + graceDays * 86400000);
      this.commercialStatus = now <= graceEnd ? "EXPIRED_GRACE" : "EXPIRED_LOCKED";
      this.planGraceExpiresAt = graceEnd;
      changed = true;
    }

    if (changed) {
      this.markModified("planSnapshot");
      this.markModified("quotaConfig");
    }

    return changed;
  }
  return false;
};

// Pre-save hook: always check and zero balances before saving
companySchema.pre("save", function (next) {
  this.zeroExpiredPlanBalances();
  if (typeof next === "function") {
    return next();
  }
});

// Post-init hook: when document is loaded from MongoDB, ensure in-memory and database 0s
companySchema.post("init", function (doc) {
  const now = new Date();
  const planEndDate = doc.planSnapshot?.endDate || doc.packageExpiresAt;
  const isExpired = Boolean(
    (planEndDate && new Date(planEndDate) < now) ||
    doc.commercialStatus === "EXPIRED_GRACE" ||
    doc.commercialStatus === "EXPIRED_LOCKED" ||
    (doc.commercialStatus === "NO_PLAN" && (planEndDate ? new Date(planEndDate) < now : true))
  );

  if (isExpired && doc.planSnapshot) {
    let needsDbSync = false;
    if (doc.planSnapshot.validity !== 0) {
      doc.planSnapshot.validity = 0;
      needsDbSync = true;
    }
    if (Array.isArray(doc.planSnapshot.services)) {
      doc.planSnapshot.services.forEach((s) => {
        if (s.quantity !== 0 || s.usedQuantity !== 0 || s.validity !== 0) {
          s.quantity = 0;
          s.usedQuantity = 0;
          s.validity = 0;
          needsDbSync = true;
        }
      });
    }
    if (doc.jobLimit && doc.jobLimit !== 0) {
      doc.jobLimit = 0;
      needsDbSync = true;
    }
    if (doc.nviteLimit && doc.nviteLimit !== 0) {
      doc.nviteLimit = 0;
      needsDbSync = true;
    }
    if (doc.quotaConfig) {
      if (doc.quotaConfig.weekly && (doc.quotaConfig.weekly.cvAccess !== 0 || doc.quotaConfig.weekly.nvite !== 0)) {
        doc.quotaConfig.weekly.cvAccess = 0;
        doc.quotaConfig.weekly.nvite = 0;
        needsDbSync = true;
      }
      if (doc.quotaConfig.monthly && (doc.quotaConfig.monthly.cvAccess !== 0 || doc.quotaConfig.monthly.nvite !== 0)) {
        doc.quotaConfig.monthly.cvAccess = 0;
        doc.quotaConfig.monthly.nvite = 0;
        needsDbSync = true;
      }
    }

    if (needsDbSync && doc._id) {
      const CompanyModel = mongoose.models.Company || mongoose.model("Company");
      const hasServices = doc.planSnapshot.services && doc.planSnapshot.services.length > 0;
      const updatePayload = {
        $set: {
          "planSnapshot.validity": 0,
          jobLimit: 0,
          nviteLimit: 0,
          "quotaConfig.weekly.cvAccess": 0,
          "quotaConfig.weekly.nvite": 0,
          "quotaConfig.monthly.cvAccess": 0,
          "quotaConfig.monthly.nvite": 0,
          ...(hasServices
            ? {
                "planSnapshot.services.$[].quantity": 0,
                "planSnapshot.services.$[].usedQuantity": 0,
                "planSnapshot.services.$[].validity": 0,
              }
            : {}),
        },
      };

      if (doc.commercialStatus === "ACTIVE" && planEndDate && new Date(planEndDate) < now) {
        const graceDays = Number(doc.planSnapshot.gracePeriodDays ?? 90);
        const graceEnd = new Date(new Date(planEndDate).getTime() + graceDays * 86400000);
        const newStatus = now <= graceEnd ? "EXPIRED_GRACE" : "EXPIRED_LOCKED";
        doc.commercialStatus = newStatus;
        doc.planGraceExpiresAt = graceEnd;
        updatePayload.$set.commercialStatus = newStatus;
        updatePayload.$set.planGraceExpiresAt = graceEnd;
      }

      CompanyModel.updateOne({ _id: doc._id }, updatePayload).catch(() => {});
    }
  }
});

// Static method: atomic sweep across all expired companies
companySchema.statics.expirePlansForExpiredCompanies = async function () {
  const now = new Date();

  // 1. Transition any ACTIVE companies whose endDate has passed
  const expiredActiveCompanies = await this.find({
    commercialStatus: "ACTIVE",
    $or: [
      { "planSnapshot.endDate": { $exists: true, $ne: null, $lt: now } },
      { packageExpiresAt: { $exists: true, $ne: null, $lt: now } },
    ],
  });

  for (const c of expiredActiveCompanies) {
    const graceDays = Number(c.planSnapshot?.gracePeriodDays ?? 90);
    const planEnd = new Date(c.planSnapshot?.endDate || c.packageExpiresAt);
    const graceEnd = new Date(planEnd.getTime() + graceDays * 86400000);
    c.commercialStatus = now <= graceEnd ? "EXPIRED_GRACE" : "EXPIRED_LOCKED";
    c.planGraceExpiresAt = graceEnd;
    c.zeroExpiredPlanBalances();
    await c.save();
  }

  // 2. Base condition for zeroing balances of any expired or NO_PLAN company
  const baseCondition = {
    $or: [
      { "planSnapshot.endDate": { $exists: true, $ne: null, $lt: now } },
      { packageExpiresAt: { $exists: true, $ne: null, $lt: now } },
      { commercialStatus: { $in: ["EXPIRED_GRACE", "EXPIRED_LOCKED"] } },
      {
        commercialStatus: "NO_PLAN",
        $or: [
          { "planSnapshot.endDate": { $exists: true, $ne: null, $lt: now } },
          { packageExpiresAt: { $exists: true, $ne: null, $lt: now } },
          { "planSnapshot.services.quantity": { $gt: 0 } },
        ],
      },
    ],
    $and: [
      {
        $or: [
          { "planSnapshot.validity": { $gt: 0 } },
          { "planSnapshot.services.quantity": { $gt: 0 } },
          { "planSnapshot.services.usedQuantity": { $gt: 0 } },
          { "planSnapshot.services.validity": { $gt: 0 } },
          { jobLimit: { $gt: 0 } },
          { nviteLimit: { $gt: 0 } },
        ],
      },
    ],
  };

  // 3. For companies with services array: update all array elements with $[]
  const withServicesRes = await this.updateMany(
    {
      ...baseCondition,
      "planSnapshot.services.0": { $exists: true },
    },
    {
      $set: {
        "planSnapshot.validity": 0,
        "planSnapshot.services.$[].quantity": 0,
        "planSnapshot.services.$[].usedQuantity": 0,
        "planSnapshot.services.$[].validity": 0,
        jobLimit: 0,
        nviteLimit: 0,
        "quotaConfig.weekly.cvAccess": 0,
        "quotaConfig.weekly.nvite": 0,
        "quotaConfig.monthly.cvAccess": 0,
        "quotaConfig.monthly.nvite": 0,
      },
    }
  );

  // 4. For companies without services array
  const withoutServicesRes = await this.updateMany(
    {
      ...baseCondition,
      "planSnapshot.services.0": { $exists: false },
    },
    {
      $set: {
        "planSnapshot.validity": 0,
        jobLimit: 0,
        nviteLimit: 0,
        "quotaConfig.weekly.cvAccess": 0,
        "quotaConfig.weekly.nvite": 0,
        "quotaConfig.monthly.cvAccess": 0,
        "quotaConfig.monthly.nvite": 0,
      },
    }
  );

  return {
    expiredActiveTransitioned: expiredActiveCompanies.length,
    matchedCount: (withServicesRes.matchedCount || 0) + (withoutServicesRes.matchedCount || 0),
    modifiedCount: (withServicesRes.modifiedCount || 0) + (withoutServicesRes.modifiedCount || 0),
  };
};

module.exports = mongoose.model("Company", companySchema);
