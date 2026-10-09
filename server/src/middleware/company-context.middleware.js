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

    // 1. Activate any due SCHEDULED subscription in real time (e.g. downgrades whose start date has arrived)
    try {
      const PurchaseService = require("../services/commercial/purchase.service");
      const activatedCount = await PurchaseService.activateScheduledSubscriptions(company._id);
      if (activatedCount > 0) {
        console.log(`[CompanyContext] Real-time activation: ${activatedCount} scheduled plan(s) activated immediately on request for company ${company._id} (${company.name})`);
      }
    } catch (schedErr) {
      console.error("[CompanyContext] Error during real-time scheduled plan activation:", schedErr?.message);
    }

    // Refresh company instance in case scheduled plan was activated
    const refreshedCompany = await Company.findById(company._id);
    const targetCompany = refreshedCompany || company;

    // 2. Check for an active PLAN subscription
    const activeSub = await Subscription.findOne({
      companyId: targetCompany._id,
      subscriptionType: "PLAN",
      status: "ACTIVE",
      endDate: { $gte: now },
    }).sort({ endDate: -1 });

    if (activeSub) {
      targetCompany.commercialStatus = "ACTIVE";
      targetCompany.planGraceExpiresAt = null;
    } else {
      // Find the most recently expired plan subscription
      const lastExpiredSub = await Subscription.findOne({
        companyId: targetCompany._id,
        subscriptionType: "PLAN",
      }).sort({ endDate: -1 });

      if (lastExpiredSub && lastExpiredSub.endDate) {
        const graceEnd = new Date(lastExpiredSub.endDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (now <= graceEnd) {
          targetCompany.commercialStatus = "EXPIRED_GRACE";
          targetCompany.planGraceExpiresAt = graceEnd;
        } else {
          targetCompany.commercialStatus = "EXPIRED_LOCKED";
          targetCompany.planGraceExpiresAt = graceEnd;
        }
      } else {
        targetCompany.commercialStatus = targetCompany.commercialStatus || "NO_PLAN";
      }
    }

    // Automatically zero out balances if plan is expired
    if (typeof targetCompany.zeroExpiredPlanBalances === "function" && targetCompany.zeroExpiredPlanBalances()) {
      await targetCompany.save();
    }

    req.company = targetCompany;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { resolveCompanyContext };
