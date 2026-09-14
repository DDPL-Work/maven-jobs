const JobPostingReportLog = require("../models/JobPostingReportLog");
const emailModule = require("../email");
const logger = require("../config/logger");

/**
 * Calculate date window:
 * - weekly: Monday 00:00:00 to Sunday 23:59:59.999 of the previous week
 * - monthly: 1st 00:00:00 to the last day 23:59:59.999 of the previous month
 */
function getReportDateWindow(period, referenceDate = new Date()) {
  const ref = new Date(referenceDate);

  if (period === "weekly") {
    // Current day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const currentDay = ref.getDay();
    // Monday is first day of week.
    // Days since last Monday:
    const daysSinceMonday = (currentDay + 6) % 7;
    // Monday of current week
    const thisMonday = new Date(ref);
    thisMonday.setDate(ref.getDate() - daysSinceMonday);
    thisMonday.setHours(0, 0, 0, 0);

    // Previous week's Monday
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    // Previous week's Sunday
    const end = new Date(thisMonday);
    end.setMilliseconds(-1); // 23:59:59.999 on previous Sunday

    return { start, end };
  }

  if (period === "monthly") {
    // First day of previous month
    const start = new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0);
    // Last millisecond of previous month
    const end = new Date(ref.getFullYear(), ref.getMonth(), 0, 23, 59, 59, 999);

    return { start, end };
  }

  throw new Error(`Unsupported period: ${period}. Must be 'weekly' or 'monthly'.`);
}

/**
 * Fetch report aggregated data for a company within date range
 */
async function getAggregatedReportData(companyId, start, end) {
  const baseMatch = { companyId, actionDate: { $gte: start, $lte: end } };

  const rows = await JobPostingReportLog.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: { $ifNull: ["$userId", "$userName"] },
        userName: { $first: "$userName" },
        userEmail: { $first: "$userEmail" },
        alias: { $first: "$alias" },
        jobPostExpense: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_POST"] }, "$expense", 0] },
        },
        jobEditExpense: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_EDIT"] }, "$expense", 0] },
        },
        jobRefreshExpense: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_REFRESH"] }, "$expense", 0] },
        },
        jobsDeleted: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_DELETE"] }, 1, 0] },
        },
        jobsPosted: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_POST"] }, 1, 0] },
        },
        jobsClosed: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_CLOSE"] }, 1, 0] },
        },
        applicationsReceived: {
          $sum: { $cond: [{ $eq: ["$actionType", "APPLICATION_RECEIVED"] }, 1, 0] },
        },
        jobViews: {
          $sum: { $cond: [{ $eq: ["$actionType", "JOB_VIEW"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        userName: 1,
        userEmail: 1,
        alias: 1,
        jobsPosted: 1,
        jobPostExpense: 1,
        jobEditExpense: 1,
        jobRefreshExpense: 1,
        jobsDeleted: 1,
        jobsClosed: 1,
        applicationsReceived: 1,
        jobViews: 1,
        totalExpense: {
          $add: ["$jobPostExpense", "$jobEditExpense", "$jobRefreshExpense"],
        },
      },
    },
    { $sort: { jobsPosted: -1, userName: 1 } },
  ]);

  return rows;
}

/**
 * Generate CSV buffer for the aggregated report rows
 */
function buildReportCSV(rows, period, start, end, companyName = "Company") {
  const escapeCsv = (val) => {
    const s = String(val ?? "");
    return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const formatDateStr = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const headers = [
    "User Name",
    "Email",
    "Alias / Role",
    "Jobs Posted",
    "Post Expense",
    "Edit Expense",
    "Refresh Expense",
    "Jobs Closed",
    "Jobs Deleted",
    "Applications Received",
    "Job Views",
    "Total Expense",
  ];

  const lines = [
    `# Job Posting ${period === "weekly" ? "Weekly" : "Monthly"} Report - ${companyName}`,
    `# Period: ${formatDateStr(start)} to ${formatDateStr(end)}`,
    "",
    headers.map(escapeCsv).join(","),
  ];

  if (!rows || rows.length === 0) {
    lines.push(
      ["No activity recorded during this period", "", "", 0, 0, 0, 0, 0, 0, 0, 0, 0]
        .map(escapeCsv)
        .join(",")
    );
  } else {
    for (const r of rows) {
      lines.push(
        [
          r.userName || "Recruiter",
          r.userEmail || "",
          r.alias || "",
          r.jobsPosted || 0,
          r.jobPostExpense || 0,
          r.jobEditExpense || 0,
          r.jobRefreshExpense || 0,
          r.jobsClosed || 0,
          r.jobsDeleted || 0,
          r.applicationsReceived || 0,
          r.jobViews || 0,
          r.totalExpense || 0,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  }

  return Buffer.from(lines.join("\r\n"), "utf-8");
}

/**
 * Send the report email with CSV attachment
 */
async function sendJobPostingReportEmail({
  toEmails,
  companyName,
  period,
  start,
  end,
  rows,
}) {
  const formatDateStr = (d) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const periodLabel = period === "weekly" ? "Weekly" : "Monthly";
  const dateRangeStr = `${formatDateStr(start)} - ${formatDateStr(end)}`;
  const filename = `Job_Posting_Report_${periodLabel}_${dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;

  const csvBuffer = buildReportCSV(rows, period, start, end, companyName);

  const subject = `${companyName}: Your ${periodLabel} Job Posting Report (${dateRangeStr})`;

  const totalPosted = rows.reduce((acc, r) => acc + (r.jobsPosted || 0), 0);
  const totalApps = rows.reduce((acc, r) => acc + (r.applicationsReceived || 0), 0);
  const totalExpense = rows.reduce((acc, r) => acc + (r.totalExpense || 0), 0);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Job Posting ${periodLabel} Report</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 0;">Period: <strong>${dateRangeStr}</strong></p>

      <p>Hello,</p>
      <p>Please find attached your ${periodLabel.toLowerCase()} job posting report for <strong>${companyName}</strong>.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 15px; color: #334155;">Summary Overview</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total Jobs Posted:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${totalPosted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Applications Received:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${totalApps}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total Expenses:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${totalExpense}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        The detailed breakdown user-wise is available in the attached CSV file. You can open it directly with Microsoft Excel or Google Sheets.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">
        This automated email was sent by Maven Jobs according to your scheduled reporting preferences.
      </p>
    </div>
  `;

  const text = `Job Posting ${periodLabel} Report for ${companyName}\nPeriod: ${dateRangeStr}\nTotal Jobs Posted: ${totalPosted}\nApplications Received: ${totalApps}\nTotal Expenses: ${totalExpense}\n\nPlease review the attached CSV report.`;

  const results = [];
  for (const to of toEmails) {
    if (!to || !to.includes("@")) continue;
    try {
      const res = await emailModule.sendEmail({
        to,
        subject,
        html,
        text,
        attachments: [
          {
            filename,
            content: csvBuffer,
            contentType: "text/csv",
          },
        ],
      });
      results.push({ email: to, success: true, res });
    } catch (err) {
      logger.error(`[JobPostingReportEmail] Failed to send report to ${to}:`, err);
      results.push({ email: to, success: false, error: err.message });
    }
  }

  return { results, filename, start, end };
}

module.exports = {
  getReportDateWindow,
  getAggregatedReportData,
  buildReportCSV,
  sendJobPostingReportEmail,
};
