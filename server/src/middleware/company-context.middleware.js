const Company = require("../models/Company");
const Subscription = require("../models/Subscription");

const resolveCompanyContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(403).json({ success: false, message: "No company associated with this user" });
    }
    const company = await Company.findById(req.user.companyId);
    if (!company || company.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Company not found or inactive" });
    }

    const now = new Date();

    // Check for an active PLAN subscription
    const activeSub = await Subscription.findOne({
      companyId: company._id,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    }).sort({ endDate: -1 });

    if (activeSub) {
      company.commercialStatus = "ACTIVE";
      company.planGraceExpiresAt = null;
    } else {
      // Find the most recently expired plan subscription
      const lastExpiredSub = await Subscription.findOne({
        companyId: company._id,
        subscriptionType: "PLAN",
      }).sort({ endDate: -1 });

      if (lastExpiredSub && lastExpiredSub.endDate) {
        const graceEnd = new Date(lastExpiredSub.endDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (now <= graceEnd) {
          company.commercialStatus = "EXPIRED_GRACE";
          company.planGraceExpiresAt = graceEnd;
        } else {
          company.commercialStatus = "EXPIRED_LOCKED";
          company.planGraceExpiresAt = graceEnd;
        }
      } else {
        company.commercialStatus = company.commercialStatus || "NO_PLAN";
      }
    }

    // Automatically zero out balances if plan is expired
    if (typeof company.zeroExpiredPlanBalances === "function" && company.zeroExpiredPlanBalances()) {
      await company.save();
    }

    req.company = company;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { resolveCompanyContext };
