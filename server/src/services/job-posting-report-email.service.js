const JobPostingReportLog = require("../models/JobPostingReportLog");
const emailModule = require("../email");
const { wrapNaukriLayout, escapeHtml } = require("../email/templates/layouts");
const logger = require("../config/logger");
const XLSX = require("xlsx");

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
function buildReportExcel(rows, period, start, end, companyName = "Company") {
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

  const data = [];
  
  if (!rows || rows.length === 0) {
    data.push(["No activity recorded during this period"]);
  } else {
    for (const r of rows) {
      data.push([
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
      ]);
    }
  }

  const worksheetData = [
    [`Job Posting ${period === "weekly" ? "Weekly" : "Monthly"} Report - ${companyName}`],
    [`Period: ${formatDateStr(start)} to ${formatDateStr(end)}`],
    [],
    headers,
    ...data
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Job Posting Report");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
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
  const filename = `Job_Posting_Report_${periodLabel}_${dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;

  const excelBuffer = buildReportExcel(rows, period, start, end, companyName);

  const subject = `${companyName}: Your ${periodLabel} Job Posting Report (${dateRangeStr})`;

  const totalPosted = rows.reduce((acc, r) => acc + (r.jobsPosted || 0), 0);
  const totalApps = rows.reduce((acc, r) => acc + (r.applicationsReceived || 0), 0);
  const totalExpense = rows.reduce((acc, r) => acc + (r.totalExpense || 0), 0);

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px 28px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">
            Scheduled Reporting &bull; ${escapeHtml(periodLabel)}
          </p>
          <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
          <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">Job Posting ${escapeHtml(periodLabel)} Report</h2>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Period: <strong>${escapeHtml(dateRangeStr)}</strong></p>
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello,<br />Please find attached your ${escapeHtml(periodLabel.toLowerCase())} job posting report for <strong>${escapeHtml(companyName)}</strong>.
          </p>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; font-size: 15px; color: #334155; margin-bottom: 12px;">Summary Overview</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Jobs Posted:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${totalPosted}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Applications Received:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${totalApps}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Expenses:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${totalExpense}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
            The detailed breakdown user-wise is available in the attached Excel file. You can open it directly with Microsoft Excel or Google Sheets.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = wrapNaukriLayout(content, {
    title: subject,
    showFeatureGrid: false,
    showAppBanner: true,
  });

  const text = `Job Posting ${periodLabel} Report for ${companyName}\nPeriod: ${dateRangeStr}\nTotal Jobs Posted: ${totalPosted}\nApplications Received: ${totalApps}\nTotal Expenses: ${totalExpense}\n\nPlease review the attached Excel report.`;

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
            content: excelBuffer,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
  buildReportExcel,
  sendJobPostingReportEmail,
};
