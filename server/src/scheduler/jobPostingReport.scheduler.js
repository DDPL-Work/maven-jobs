const cron = require("node-cron");
const Company = require("../models/Company");
const JobPostingReportSubscription = require("../models/JobPostingReportSubscription");
const {
  getReportDateWindow,
  getAggregatedReportData,
  sendJobPostingReportEmail,
} = require("../services/job-posting-report-email.service");
const logger = require("../config/logger");

let scheduledTasks = [];

/**
 * Process report subscriptions for a given frequency: "weekly" or "monthly"
 */
async function processReportSubscriptions(period) {
  logger.info(`[JobPostingReportScheduler] Starting automated run for period: ${period}`);
  try {
    const subscriptions = await JobPostingReportSubscription.find({
      subscription: period,
      emailList: { $exists: true, $not: { $size: 0 } },
    });

    logger.info(
      `[JobPostingReportScheduler] Found ${subscriptions.length} companies subscribed for ${period} reports`
    );

    const { start, end } = getReportDateWindow(period, new Date());

    for (const sub of subscriptions) {
      try {
        const company = await Company.findById(sub.companyId).select("name email");
        if (!company) {
          logger.warn(`[JobPostingReportScheduler] Company ${sub.companyId} not found, skipping.`);
          continue;
        }

        const validEmails = (sub.emailList || []).filter(
          (e) => typeof e === "string" && e.trim().length > 0 && e.includes("@")
        );

        if (validEmails.length === 0) {
          logger.warn(
            `[JobPostingReportScheduler] Company ${company.name} (${sub.companyId}) has no valid emails.`
          );
          continue;
        }

        const rows = await getAggregatedReportData(sub.companyId, start, end);

        await sendJobPostingReportEmail({
          toEmails: validEmails,
          companyName: company.name,
          period,
          start,
          end,
          rows,
        });

        sub.lastSentAt = new Date();
        sub.lastSentPeriod = period;
        await sub.save();

        logger.info(
          `[JobPostingReportScheduler] Successfully sent ${period} report for company: ${company.name}`
        );
      } catch (err) {
        logger.error(
          `[JobPostingReportScheduler] Error processing subscription for company ${sub.companyId}:`,
          err
        );
      }
    }
  } catch (err) {
    logger.error(`[JobPostingReportScheduler] Error running ${period} scheduler:`, err);
  }
}

/**
 * Initialize node-cron schedules:
 * 1. Weekly: Every Monday at 06:00 AM (0 6 * * 1)
 *    Monday is the first day of the week, reporting the previous full week (Mon - Sun).
 * 2. Monthly: 1st of every month at 06:00 AM (0 6 1 * *)
 *    1st of the month, reporting the previous full calendar month.
 */
function initJobPostingReportScheduler() {
  stopJobPostingReportScheduler();

  // Weekly: Monday at 06:00 AM
  const weeklyTask = cron.schedule("0 6 * * 1", () => {
    logger.info("[JobPostingReportScheduler] Triggered Weekly Cron (Every Monday 06:00 AM)");
    processReportSubscriptions("weekly").catch((err) =>
      logger.error("[JobPostingReportScheduler] Unhandled error in weekly cron:", err)
    );
  });
  scheduledTasks.push(weeklyTask);

  // Monthly: 1st of each month at 06:00 AM
  const monthlyTask = cron.schedule("0 6 1 * *", () => {
    logger.info("[JobPostingReportScheduler] Triggered Monthly Cron (1st of Month 06:00 AM)");
    processReportSubscriptions("monthly").catch((err) =>
      logger.error("[JobPostingReportScheduler] Unhandled error in monthly cron:", err)
    );
  });
  scheduledTasks.push(monthlyTask);

  logger.info(
    "[JobPostingReportScheduler] Scheduled weekly (Every Monday 6AM) and monthly (1st of month 6AM) crons."
  );

  return scheduledTasks;
}

function stopJobPostingReportScheduler() {
  for (const task of scheduledTasks) {
    try {
      task.stop();
    } catch (e) {
      // ignore
    }
  }
  scheduledTasks = [];
}

module.exports = {
  initJobPostingReportScheduler,
  stopJobPostingReportScheduler,
  processReportSubscriptions,
};
