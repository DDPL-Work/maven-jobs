const cron = require("node-cron");
const ResdexSearch = require("../models/ResdexSearch");

const initSearchLogsScheduler = () => {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[SearchLogs Scheduler] Running search logs cleanup task...");
      
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      
      // Delete unpinned search logs that are older than 6 days (based on lastRunAt or createdAt)
      const result = await ResdexSearch.deleteMany({
        isPinned: false,
        $or: [
          { lastRunAt: { $lt: sixDaysAgo } },
          { lastRunAt: null, createdAt: { $lt: sixDaysAgo } }
        ]
      });

      console.log(`[SearchLogs Scheduler] Successfully deleted ${result.deletedCount} old search logs.`);
    } catch (error) {
      console.error("[SearchLogs Scheduler] Error cleaning up search logs:", error);
    }
  });
};

module.exports = { initSearchLogsScheduler };
