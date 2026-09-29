const cron = require("node-cron");
const logger = require("../config/logger");
const { processRequirementAlerts } = require("../services/requirement-alert-email.service");

let scheduledTasks = [];

/**
 * Initialize Resdex Requirement Match Alert Schedulers:
 * 1. Daily Alerts: Every morning at 07:00 AM (0 7 * * *)
 * 2. Weekly Alerts: Every Monday at 07:00 AM (0 7 * * 1)
 */
function initRequirementAlertScheduler() {
  stopRequirementAlertScheduler();

  // Daily alert cron: 07:00 AM every day
  const dailyTask = cron.schedule("0 7 * * *", () => {
    logger.info("[RequirementAlertScheduler] Triggered Daily Candidate Match Alert Cron");
    processRequirementAlerts("DAILY").catch((err) =>
      logger.error("[RequirementAlertScheduler] Daily cron execution error:", err)
    );
  });
  scheduledTasks.push(dailyTask);

  // Weekly alert cron: 07:00 AM every Monday
  const weeklyTask = cron.schedule("0 7 * * 1", () => {
    logger.info("[RequirementAlertScheduler] Triggered Weekly Candidate Match Alert Cron");
    processRequirementAlerts("WEEKLY").catch((err) =>
      logger.error("[RequirementAlertScheduler] Weekly cron execution error:", err)
    );
  });
  scheduledTasks.push(weeklyTask);

  logger.info("[RequirementAlertScheduler] Initialized Daily and Weekly Requirement Talent Alert crons.");
  return scheduledTasks;
}

function stopRequirementAlertScheduler() {
  if (scheduledTasks.length > 0) {
    for (const task of scheduledTasks) {
      try {
        task.stop();
      } catch {}
    }
    scheduledTasks = [];
    logger.info("[RequirementAlertScheduler] Stopped all requirement alert cron tasks.");
  }
}

module.exports = {
  initRequirementAlertScheduler,
  stopRequirementAlertScheduler,
};
