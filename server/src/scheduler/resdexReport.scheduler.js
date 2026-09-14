const cron = require("node-cron");
const Company = require("../models/Company");
const ResdexReportSubscription = require("../models/ResdexReportSubscription");
const {
  getResdexDateWindow,
  getResdexAggregatedData,
  sendResdexReportEmail,
} = require("../services/resdex-report-email.service");
const logger = require("../config/logger");

let resdexScheduledTasks = [];

/**
 * Process Resdex automated reports for a given frequency: "daily" | "weekly" | "monthly"
 */
async function processResdexSubscriptions(frequency) {
  logger.info(`[ResdexReportScheduler] Starting automated run for frequency: ${frequency}`);
  try {
    const subscriptions = await ResdexReportSubscription.find({
      emailList: { $exists: true, $not: { $size: 0 } },
    });

    const { start, end } = getResdexDateWindow(frequency, new Date());

    for (const sub of subscriptions) {
      try {
        const company = await Company.findById(sub.companyId).select("name email");
        if (!company) continue;

        const validEmails = (sub.emailList || []).filter(
          (e) => typeof e === "string" && e.trim().length > 0 && e.includes("@")
        );
        if (validEmails.length === 0) continue;

        const subObj = sub.subscriptions ? (sub.subscriptions.toObject ? sub.subscriptions.toObject() : sub.subscriptions) : {};

        for (const [tab, tabFreq] of Object.entries(subObj)) {
          if (tabFreq === frequency) {
            const { headers, rows } = await getResdexAggregatedData({
              companyId: sub.companyId,
              tab,
              start,
              end,
            });

            await sendResdexReportEmail({
              toEmails: validEmails,
              companyName: company.name,
              tab,
              period: frequency,
              start,
              end,
              headers,
              rows,
            });

            if (!sub.lastSentAt) sub.lastSentAt = new Map();
            sub.lastSentAt.set(tab, new Date());
            await sub.save();

            logger.info(
              `[ResdexReportScheduler] Sent ${frequency} report (${tab}) for company: ${company.name}`
            );
          }
        }
      } catch (err) {
        logger.error(`[ResdexReportScheduler] Error processing company ${sub.companyId}:`, err);
      }
    }
  } catch (err) {
    logger.error(`[ResdexReportScheduler] Error in ${frequency} run:`, err);
  }
}

/**
 * Initialize Resdex Cron Schedules:
 * 1. Daily: Every day at 06:30 AM (30 6 * * *)
 * 2. Weekly: Every Monday at 06:30 AM (30 6 * * 1)
 * 3. Monthly: 1st of every month at 06:30 AM (30 6 1 * *)
 */
function initResdexReportScheduler() {
  stopResdexReportScheduler();

  // Daily at 06:30 AM
  const dailyTask = cron.schedule("30 6 * * *", () => {
    logger.info("[ResdexReportScheduler] Triggered Daily Cron");
    processResdexSubscriptions("daily").catch((err) =>
      logger.error("[ResdexReportScheduler] Daily cron error:", err)
    );
  });
  resdexScheduledTasks.push(dailyTask);

  // Weekly: Monday at 06:30 AM
  const weeklyTask = cron.schedule("30 6 * * 1", () => {
    logger.info("[ResdexReportScheduler] Triggered Weekly Cron (Monday 6:30 AM)");
    processResdexSubscriptions("weekly").catch((err) =>
      logger.error("[ResdexReportScheduler] Weekly cron error:", err)
    );
  });
  resdexScheduledTasks.push(weeklyTask);

  // Monthly: 1st of month at 06:30 AM
  const monthlyTask = cron.schedule("30 6 1 * *", () => {
    logger.info("[ResdexReportScheduler] Triggered Monthly Cron (1st of month 6:30 AM)");
    processResdexSubscriptions("monthly").catch((err) =>
      logger.error("[ResdexReportScheduler] Monthly cron error:", err)
    );
  });
  resdexScheduledTasks.push(monthlyTask);

  logger.info("[ResdexReportScheduler] Initialized daily, weekly, and monthly Resdex report crons.");
  return resdexScheduledTasks;
}

function stopResdexReportScheduler() {
  for (const t of resdexScheduledTasks) {
    try {
      t.stop();
    } catch (e) {}
  }
  resdexScheduledTasks = [];
}

module.exports = {
  initResdexReportScheduler,
  stopResdexReportScheduler,
  processResdexSubscriptions,
};
