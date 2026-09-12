const ResdexReportLog = require("../models/ResdexReportLog");
const emailModule = require("../email");
const logger = require("../config/logger");

/**
 * Calculate date window:
 * - daily: yesterday 00:00:00 to 23:59:59.999
 * - weekly: Monday 00:00:00 to Sunday 23:59:59.999 of the previous week
 * - monthly: 1st 00:00:00 to last day 23:59:59.999 of the previous month
 */
function getResdexDateWindow(period, referenceDate = new Date()) {
  const ref = new Date(referenceDate);

  if (period === "daily" || period === "yesterday") {
    const start = new Date(ref);
    start.setDate(ref.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(ref);
    end.setDate(ref.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (period === "weekly" || period === "week") {
    const currentDay = ref.getDay();
    const daysSinceMonday = (currentDay + 6) % 7;
    const thisMonday = new Date(ref);
    thisMonday.setDate(ref.getDate() - daysSinceMonday);
    thisMonday.setHours(0, 0, 0, 0);

    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(thisMonday);
    end.setMilliseconds(-1);

    return { start, end };
  }

  if (period === "monthly" || period === "month") {
    const start = new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(ref.getFullYear(), ref.getMonth(), 0, 23, 59, 59, 999);

    return { start, end };
  }

  throw new Error(`Unsupported period: ${period}. Must be 'daily', 'weekly', or 'monthly'.`);
}

/**
 * Fetch dynamic report data for any Resdex tab
 */
async function getResdexAggregatedData({
  companyId,
  tab = "database-usage",
  start,
  end,
  userIds = [],
  keyword = "",
  sortType = "date_wise",
}) {
  const baseMatch = {
    companyId,
    actionDate: { $gte: start, $lte: end },
  };

  if (Array.isArray(userIds) && userIds.length > 0) {
    baseMatch.userId = { $in: userIds };
  }

  if (tab === "database-usage") {
    const rows = await ResdexReportLog.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $ifNull: ["$userId", "$subuserName"] },
          subuserName: { $first: "$subuserName" },
          subuserEmail: { $first: "$subuserEmail" },
          searches: {
            $sum: { $cond: [{ $eq: ["$actionType", "SEARCH"] }, 1, 0] },
          },
          cvViews: {
            $sum: { $cond: [{ $eq: ["$actionType", "CV_VIEW"] }, 1, 0] },
          },
          excelDl: {
            $sum: { $cond: [{ $eq: ["$actionType", "CV_DOWNLOAD_EXCEL"] }, 1, 0] },
          },
          wordDl: {
            $sum: { $cond: [{ $eq: ["$actionType", "CV_DOWNLOAD_WORD"] }, 1, 0] },
          },
          nvites: {
            $sum: { $cond: [{ $eq: ["$actionType", "NVITE_SENT"] }, 1, 0] },
          },
          dup: {
            $sum: { $cond: [{ $eq: ["$actionType", "DUPLICATE_CANDIDATE_DETECTED"] }, 1, 0] },
          },
          fwd: {
            $sum: { $cond: [{ $eq: ["$actionType", "RESUME_FORWARDED"] }, 1, 0] },
          },
          sms: {
            $sum: { $cond: [{ $eq: ["$actionType", "SMS_SENT"] }, 1, 0] },
          },
          phone: {
            $sum: { $cond: [{ $eq: ["$actionType", "PHONE_VIEW_CALL"] }, 1, 0] },
          },
          uniqueCandidates: { $addToSet: "$candidateId" },
        },
      },
      {
        $project: {
          subuserName: 1,
          subuserEmail: 1,
          searches: 1,
          cvViews: 1,
          excelDl: 1,
          wordDl: 1,
          nvites: 1,
          dup: 1,
          fwd: 1,
          sms: 1,
          phone: 1,
          uniqueCv: { $size: { $filter: { input: "$uniqueCandidates", cond: { $ne: ["$$this", null] } } } },
          uniqueExcel: "$excelDl",
          a: "$cvViews",
          b: "$fwd",
          c: "$excelDl",
          total: { $add: ["$cvViews", "$fwd", "$excelDl"] },
        },
      },
      { $sort: { cvViews: -1, searches: -1, subuserName: 1 } },
    ]);

    return {
      headers: [
        "Subuser",
        "Total Searches",
        "Total CV Views",
        "Total CVs Downloaded in Excel (in Resdex)",
        "Resume Downloaded in Word",
        "NVites",
        "Duplicate Candidates Detected",
        "Resumes Forwarded",
        "SMS Sent",
        "View phone number/Call candidate",
        "Unique CV Views or View Phone number/Call candidate",
        "Unique Excel Downloads (in Resdex)",
        "CV Access due to CV View/C2V (A)",
        "CV Access due to Forward (B)",
        "CV Access due to Excel Downloads (C) (in Resdex)",
        "CV Access By Company (A+B+C)",
      ],
      rows: rows.map((r) => [
        `${r.subuserName} | ${r.subuserEmail}`,
        r.searches,
        r.cvViews,
        r.excelDl,
        r.wordDl,
        r.nvites,
        r.dup,
        r.fwd,
        r.sms,
        r.phone,
        r.uniqueCv,
        r.uniqueExcel,
        r.a,
        r.b,
        r.c,
        r.total,
      ]),
      rawRows: rows,
    };
  }

  if (tab === "user-login") {
    const logs = await ResdexReportLog.find({
      ...baseMatch,
      actionType: "USER_LOGIN",
    })
      .sort(sortType === "subuser_wise" ? { subuserName: 1, actionDate: -1 } : { actionDate: -1 })
      .limit(500);

    const formatDate = (d) => {
      if (!d) return "";
      const date = new Date(d);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
    };

    const formatTime = (d) => {
      if (!d) return "-";
      return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    return {
      headers: ["Date", "Name", "Login Time", "Logout Time", "Usage in Min", "IP Address"],
      rows: logs.map((l) => [
        formatDate(l.loginTime || l.actionDate),
        l.subuserName || "Recruiter",
        formatTime(l.loginTime || l.actionDate),
        formatTime(l.logoutTime),
        l.sessionDurationMinutes ? String(l.sessionDurationMinutes) : "-",
        l.ipAddress || "-",
      ]),
      rawRows: logs,
    };
  }

  if (tab === "call-report") {
    const rows = await ResdexReportLog.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $ifNull: ["$userId", "$subuserName"] },
          subuserName: { $first: "$subuserName" },
          subuserEmail: { $first: "$subuserEmail" },
          views: { $sum: { $cond: [{ $eq: ["$actionType", "CV_VIEW"] }, 1, 0] } },
          appViews: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$actionType", "CV_VIEW"] }, { $eq: ["$platform", "APP"] }] },
                1,
                0,
              ],
            },
          },
          callsInit: { $sum: { $cond: [{ $eq: ["$actionType", "PHONE_VIEW_CALL"] }, 1, 0] } },
          callsConn: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$actionType", "PHONE_VIEW_CALL"] }, { $eq: ["$callConnected", true] }] },
                1,
                0,
              ],
            },
          },
          uniqueJobSeekers: { $addToSet: "$candidateId" },
          totalCallSec: { $sum: { $ifNull: ["$callDurationSeconds", 0] } },
        },
      },
      {
        $project: {
          subuserName: 1,
          subuserEmail: 1,
          views: 1,
          appPct: {
            $cond: [
              { $gt: ["$views", 0] },
              { $round: [{ $multiply: [{ $divide: ["$appViews", "$views"] }, 100] }, 1] },
              0,
            ],
          },
          callsInit: 1,
          callsConn: 1,
          uniqContacted: {
            $size: { $filter: { input: "$uniqueJobSeekers", cond: { $ne: ["$$this", null] } } },
          },
          totDuration: {
            $concat: [
              { $toString: { $floor: { $divide: ["$totalCallSec", 60] } } },
              ":",
              { $toString: { $mod: ["$totalCallSec", 60] } },
            ],
          },
          avgDuration: {
            $cond: [
              { $gt: ["$callsConn", 0] },
              {
                $concat: [
                  { $toString: { $floor: { $divide: [{ $divide: ["$totalCallSec", "$callsConn"] }, 60] } } },
                  ":00",
                ],
              },
              "00:00",
            ],
          },
        },
      },
    ]);

    return {
      headers: [
        "Subuser",
        "Total CV Views (Web + App)",
        "% of CV Views on App",
        "Total calls initiated",
        "Total calls connected",
        "Unique Job Seekers contacted",
        "Total call duration(in mins)",
        "Average call duration(in mins)",
      ],
      rows: rows.map((r) => [
        `${r.subuserName} | ${r.subuserEmail}`,
        r.views,
        r.appPct,
        r.callsInit,
        r.callsConn,
        r.uniqContacted,
        r.totDuration,
        r.avgDuration,
      ]),
      rawRows: rows,
    };
  }

  if (tab === "search-report") {
    const match = { ...baseMatch, actionType: "SEARCH" };
    if (keyword) {
      match.searchQuery = { $regex: keyword, $options: "i" };
    }
    const logs = await ResdexReportLog.find(match).sort({ actionDate: -1 }).limit(300);

    return {
      headers: ["Search Query", "Performed By", "Results Found", "Date & Time"],
      rows: logs.map((l) => [
        l.searchQuery || "Keyword Search",
        `${l.subuserName} | ${l.subuserEmail}`,
        l.resultsCount || 0,
        l.actionDate.toLocaleString(),
      ]),
      rawRows: logs,
    };
  }

  if (tab === "contacted-candidate-mis") {
    const match = { ...baseMatch, actionType: "CANDIDATE_CONTACTED" };
    const logs = await ResdexReportLog.find(match).sort({ actionDate: -1 }).limit(300);

    return {
      headers: ["Candidate Name", "Target Role", "Channel", "Recruiter", "Status", "Date"],
      rows: logs.map((l) => [
        l.candidateName || "Candidate",
        l.candidateRole || "Profile",
        l.contactChannel || "NVite",
        `${l.subuserName} | ${l.subuserEmail}`,
        l.contactStatus || "Delivered",
        new Date(l.actionDate).toLocaleDateString(),
      ]),
      rawRows: logs,
    };
  }

  if (tab === "comments-reports") {
    const match = { ...baseMatch, actionType: "CANDIDATE_COMMENT" };
    const logs = await ResdexReportLog.find(match).sort({ actionDate: -1 }).limit(300);

    return {
      headers: ["Candidate Name", "Folder", "Reviewer", "Rating", "Notes & Feedback", "Date"],
      rows: logs.map((l) => [
        l.candidateName || "Candidate",
        l.folderName || "General",
        `${l.subuserName} | ${l.subuserEmail}`,
        l.rating ? `${l.rating} / 5` : "-",
        l.commentText || "",
        new Date(l.actionDate).toLocaleDateString(),
      ]),
      rawRows: logs,
    };
  }

  return { headers: [], rows: [], rawRows: [] };
}

/**
 * Generate CSV buffer for the Resdex report
 */
function buildResdexReportCSV({ headers, rows, tab, period, start, end, companyName = "Company" }) {
  const escapeCsv = (val) => {
    const s = String(val ?? "");
    return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const formatDateStr = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const lines = [
    `# RESDEX ${tab.toUpperCase().replace(/-/g, " ")} REPORT - ${companyName}`,
    `# Period: ${period} (${formatDateStr(start)} to ${formatDateStr(end)})`,
    "",
    headers.map(escapeCsv).join(","),
  ];

  if (!rows || rows.length === 0) {
    lines.push(["No records found for the specified period", ...new Array(headers.length - 1).fill("")].map(escapeCsv).join(","));
  } else {
    for (const r of rows) {
      lines.push(r.map(escapeCsv).join(","));
    }
  }

  return Buffer.from(lines.join("\r\n"), "utf-8");
}

/**
 * Send the Resdex report email with CSV attachment
 */
async function sendResdexReportEmail({
  toEmails,
  companyName,
  tab,
  period,
  start,
  end,
  headers,
  rows,
}) {
  const formatDateStr = (d) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tabTitle = tab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const dateRangeStr = `${formatDateStr(start)} - ${formatDateStr(end)}`;
  const filename = `Resdex_${tabTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_${period}_${dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;

  const csvBuffer = buildResdexReportCSV({ headers, rows, tab, period, start, end, companyName });
  const subject = `${companyName}: Your Resdex ${tabTitle} Report (${dateRangeStr})`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #002366; margin-bottom: 8px;">Resdex ${tabTitle} Report</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 0;">Period: <strong>${dateRangeStr}</strong> (${period.toUpperCase()})</p>

      <p>Hello,</p>
      <p>Please find attached your Resdex <strong>${tabTitle}</strong> report for <strong>${companyName}</strong>.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 15px; color: #334155;">Overview</h3>
        <p style="font-size: 14px; margin: 0;">Total Records: <strong>${rows.length}</strong></p>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        The detailed breakdown is available in the attached CSV file. You can open it directly in Microsoft Excel or Google Sheets.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">
        This automated email was sent by Maven Jobs according to your scheduled Resdex reporting preferences.
      </p>
    </div>
  `;

  const text = `Resdex ${tabTitle} Report for ${companyName}\nPeriod: ${dateRangeStr}\nTotal Records: ${rows.length}\n\nPlease review the attached CSV report.`;

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
      logger.error(`[ResdexReportEmail] Failed to send report to ${to}:`, err);
      results.push({ email: to, success: false, error: err.message });
    }
  }

  return { results, filename, start, end };
}

module.exports = {
  getResdexDateWindow,
  getResdexAggregatedData,
  buildResdexReportCSV,
  sendResdexReportEmail,
};
