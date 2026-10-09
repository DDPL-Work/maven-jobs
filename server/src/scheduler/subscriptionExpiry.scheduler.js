const cron = require("node-cron");
const PurchaseService = require("../services/commercial/purchase.service");

/**
 * Subscription & Entitlement Expiry Scheduler
 * 
 * Enforces the client's commercial policy:
 * 1. Hourly check to expire past subscriptions and forfeit unused entitlements
 * 2. Manage 90-day read-only grace period (EXPIRED_GRACE -> EXPIRED_LOCKED)
 * 3. Activate scheduled downgrades when their effective start date arrives
 */
const initSubscriptionExpiryScheduler = () => {
  // Run on startup after DB connection
  setTimeout(async () => {
    try {
      console.log("[Subscription Expiry Scheduler] Running initial startup check...");
      const results = await PurchaseService.checkAndExpireSubscriptions();
      console.log("[Subscription Expiry Scheduler] Initial check complete:", results);
    } catch (err) {
      console.error("[Subscription Expiry Scheduler] Initial check error:", err.message);
    }
  }, 5000);

  // Run every 5 minutes (*/5 * * * *) to promptly expire plans and zero balances
  cron.schedule("*/5 * * * *", async () => {
    try {
      const results = await PurchaseService.checkAndExpireSubscriptions();
      if (
        results.expiredSubscriptionsCount > 0 ||
        results.expiredEntitlementsCount > 0 ||
        results.activatedScheduledCount > 0 ||
        results.lockedGraceCompaniesCount > 0 ||
        (results.zeroedExpiredCompanies && results.zeroedExpiredCompanies.modifiedCount > 0)
      ) {
        console.log("[Subscription Expiry Scheduler] Expiry cycle complete:", results);
      }
    } catch (err) {
      console.error("[Subscription Expiry Scheduler] Expiry cycle error:", err.message);
    }
  });

  console.log("[Subscription Expiry Scheduler] Initialized (every 5 mins + startup trigger)");
};

module.exports = { initSubscriptionExpiryScheduler };
