const Product = require("../../models/Product");
const Plan = require("../../models/Plan");
const Subscription = require("../../models/Subscription");
const CommercialOrder = require("../../models/CommercialOrder");
const CreditLedger = require("../../models/CreditLedger");

class CommercialStatsService {
  static async getOverviewStats() {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      activeProducts,
      totalPlans,
      activePlans,
      activeSubscriptions,
      expiredSubscriptions,
      standaloneSubscriptions,
      ordersAgg,
      expiringSoon,
      consumptionAgg,
      popularPlansAgg,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "ACTIVE" }),
      Plan.countDocuments(),
      Plan.countDocuments({ status: "ACTIVE" }),
      Subscription.countDocuments({ status: "ACTIVE", endDate: { $gte: now } }),
      Subscription.countDocuments({ status: "EXPIRED" }),
      Subscription.countDocuments({ subscriptionType: "STANDALONE", status: "ACTIVE" }),
      CommercialOrder.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Subscription.find({
        status: "ACTIVE",
        endDate: { $gte: now, $lte: sevenDaysLater },
      })
        .populate("companyId", "name email")
        .populate("planId", "name code")
        .sort({ endDate: 1 })
        .limit(10)
        .lean(),
      CreditLedger.aggregate([
        { $match: { quantity: { $lt: 0 } } },
        {
          $group: {
            _id: "$productCode",
            totalConsumed: { $sum: { $abs: "$quantity" } },
            eventsCount: { $sum: 1 },
          },
        },
        { $sort: { totalConsumed: -1 } },
        { $limit: 6 },
      ]),
      Subscription.aggregate([
        { $match: { subscriptionType: "PLAN", planId: { $ne: null } } },
        { $group: { _id: "$planId", purchasesCount: { $sum: 1 } } },
        { $sort: { purchasesCount: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = ordersAgg[0]?.totalRevenue || 0;
    const totalOrdersCount = ordersAgg[0]?.count || 0;

    // Populate plan names for popular plans
    const popularPlanIds = popularPlansAgg.map((p) => p._id);
    const plansInfo = await Plan.find({ _id: { $in: popularPlanIds } }).select("name code planType").lean();
    const planInfoMap = new Map(plansInfo.map((p) => [String(p._id), p]));

    const popularPlans = popularPlansAgg.map((p) => ({
      planId: p._id,
      count: p.count || p.purchasesCount,
      name: planInfoMap.get(String(p._id))?.name || "Plan",
      code: planInfoMap.get(String(p._id))?.code || "",
      type: planInfoMap.get(String(p._id))?.planType || "",
    }));

    // Estimate MRR (Total revenue from active plan subscriptions normalized to 30 days)
    const activePlanSubs = await Subscription.find({
      status: "ACTIVE",
      subscriptionType: "PLAN",
      endDate: { $gte: now },
    }).lean();

    const mrr = activePlanSubs.reduce((acc, sub) => {
      const price = Number(sub.commercialSnapshot?.pricePaid || 0);
      const days = Math.max(1, Number(sub.commercialSnapshot?.validityDays || 90));
      return acc + Math.round((price / days) * 30);
    }, 0);

    return {
      totalProducts,
      activeProducts,
      totalPlans,
      activePlans,
      activeSubscriptions,
      expiredSubscriptions,
      standaloneSubscriptions,
      totalRevenue,
      totalOrdersCount,
      mrr,
      expiringSoon,
      consumptionByProduct: consumptionAgg,
      popularPlans,
    };
  }
}

module.exports = CommercialStatsService;
