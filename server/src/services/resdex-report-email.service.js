const ResdexReportLog = require("../models/ResdexReportLog");
const UserLoginLog = require("../models/UserLoginLog");

const emailModule = require("../email");
const { wrapNaukriLayout, escapeHtml } = require("../email/templates/layouts");
const logger = require("../config/logger");
const XLSX = require("xlsx");

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

    const ResdexSearch = require("../models/ResdexSearch");
    const searchMatch = {
      companyId,
      $or: [
        { updatedAt: { $gte: start, $lte: end } },
        { lastRunAt: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } }
      ]
    };
    if (Array.isArray(userIds) && userIds.length > 0) {
      searchMatch.userId = { $in: userIds };
    }
    const searchCounts = await ResdexSearch.aggregate([
      { $match: searchMatch },
      { $group: { _id: "$userId", totalSearches: { $sum: 1 } } }
    ]);

    const searchMap = {};
    searchCounts.forEach(s => {
      if (s._id) searchMap[s._id.toString()] = s.totalSearches;
    });

    const finalRows = [];
    const processedUserIds = new Set();
    
    for (const r of rows) {
      const uid = r._id?.toString();
      if (uid) {
        processedUserIds.add(uid);
        r.searches = searchMap[uid] || 0;
      }
      finalRows.push(r);
    }

    const missingUserIds = Object.keys(searchMap).filter(uid => !processedUserIds.has(uid));
    if (missingUserIds.length > 0) {
      const CompanySubUser = require("../models/CompanySubUser");
      const subusers = await CompanySubUser.find({
        companyId,
        userId: { $in: missingUserIds }
      }).populate("userId", "name email");

      subusers.forEach(su => {
        if (su.userId) {
          finalRows.push({
            _id: su.userId._id,
            subuserName: su.userId.name || "Unknown",
            subuserEmail: su.userId.email || "",
            searches: searchMap[su.userId._id.toString()],
            cvViews: 0,
            excelDl: 0,
            wordDl: 0,
            nvites: 0,
            dup: 0,
            fwd: 0,
            sms: 0,
            phone: 0,
            uniqueCv: 0
          });
        }
      });
    }

    finalRows.sort((a, b) => (b.cvViews - a.cvViews) || (b.searches - a.searches) || (a.subuserName || "").localeCompare(b.subuserName || ""));

    return {
      headers: [
        "Subuser",
        "Total Searches",
        // "Total CV Views",
        "Total CVs Downloaded (in Resdex)",
        "NVites",
        "Resumes Forwarded",
        "SMS Sent",
        "View phone number/Call candidate",
        "Unique CV Views or View Phone number/Call candidate",
      ],
      rows: finalRows.map((r) => [
        `${r.subuserName} | ${r.subuserEmail}`,
        r.searches,
        // r.cvViews,
        r.excelDl,
        r.nvites,
        r.fwd,
        r.sms,
        r.phone,
        r.uniqueCv,
      ]),
      rawRows: finalRows,
    };
  }

  if (tab === "user-login") {
    const loginMatch = {
      companyId,
      event: "LOGIN",
      timestamp: { $gte: start, $lte: end },
    };

    if (Array.isArray(userIds) && userIds.length > 0) {
      loginMatch.userId = { $in: userIds };
    }

    const loginLogs = await UserLoginLog.find(loginMatch)
      .sort(sortType === "subuser_wise" ? { userName: 1, timestamp: -1 } : { timestamp: -1 })
      .limit(500)
      .lean();

    // For each login event, try to find the matching logout event by userId + sessionId
    const sessionIds = loginLogs.map((l) => l.sessionId).filter(Boolean);
    const logoutMap = {};
    if (sessionIds.length > 0) {
      const logoutLogs = await UserLoginLog.find({
        companyId,
        event: "LOGOUT",
        sessionId: { $in: sessionIds },
      }).lean();
      logoutLogs.forEach((l) => {
        if (l.sessionId) logoutMap[l.sessionId] = l;
      });
    }

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

    const rows = loginLogs.map((l) => {
      const matchedLogout = l.sessionId ? logoutMap[l.sessionId] : null;
      const logoutTime = matchedLogout?.logoutTime || l.logoutTime || null;
      let durationMin = l.sessionDurationMinutes || "-";
      if (!durationMin || durationMin === "-") {
        if (l.loginTime && logoutTime) {
          const diffMs = new Date(logoutTime) - new Date(l.loginTime);
          if (diffMs > 0) durationMin = Math.round(diffMs / 60000);
        }
      }

      return [
        formatDate(l.loginTime || l.timestamp),
        `${l.userName || "Recruiter"} | ${l.userEmail || ""}`,
        l.role || "-",
        formatTime(l.loginTime || l.timestamp),
        formatTime(logoutTime),
        durationMin !== null && durationMin !== undefined && durationMin !== "-"
          ? String(durationMin)
          : "-",
        l.ipAddress || "-",
      ];
    });

    return {
      headers: ["Date", "Name", "Role", "Login Time", "Logout Time", "Usage in Min", "IP Address"],
      rows,
      rawRows: loginLogs,
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
          views: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$actionType",
                    [
                      "CV_VIEW",
                      "CV_DOWNLOAD_EXCEL",
                      "CV_DOWNLOAD_WORD",
                      "RESUME_DOWNLOAD",
                      "CV_DOWNLOAD",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          appViews: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: [
                        "$actionType",
                        [
                          "CV_VIEW",
                          "CV_DOWNLOAD_EXCEL",
                          "CV_DOWNLOAD_WORD",
                          "RESUME_DOWNLOAD",
                          "CV_DOWNLOAD",
                        ],
                      ],
                    },
                    { $eq: ["$platform", "APP"] },
                  ],
                },
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
        "Total calls connected",
        // "Total calls initiated",
        // "Unique Job Seekers contacted",
        // "Total call duration(in mins)",
        // "Average call duration(in mins)",
      ],
      rows: rows.map((r) => [
        `${r.subuserName} | ${r.subuserEmail}`,
        r.views,
        r.appPct,
        r.uniqContacted,
        // r.callsInit,
        // r.callsConn,
        // r.totDuration,
        // r.avgDuration,
      ]),
      rawRows: rows,
    };
  }

  if (tab === "search-report") {
    const ResdexSearch = require("../models/ResdexSearch");
    require("../models/User");

    const searchMatch = {
      companyId,
      $or: [
        { updatedAt: { $gte: start, $lte: end } },
        { lastRunAt: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } }
      ]
    };

    if (Array.isArray(userIds) && userIds.length > 0) {
      searchMatch.userId = { $in: userIds };
    }

    if (keyword) {
      searchMatch.$and = [
        {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { "filters.keyword": { $regex: keyword, $options: "i" } }
          ]
        }
      ];
    }

    const logs = await ResdexSearch.find(searchMatch)
      .sort({ updatedAt: -1 })
      .limit(300)
      .populate("userId", "name email");

    return {
      headers: ["Search Query", "Performed By", "Results Found", "Date & Time"],
      rows: logs.map((l) => {
        const queryName = l.name || l.filters?.keyword || "Keyword Search";
        const userName = l.userId ? l.userId.name : "Unknown User";
        const userEmail = l.userId ? l.userId.email : "No Email";
        return [
          queryName,
          `${userName} | ${userEmail}`,
          l.resultCount || 0,
          l.updatedAt.toLocaleString(),
        ];
      }),
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

function buildResdexReportExcel({ headers, rows, tab, period, start, end, companyName = "Company" }) {
  const formatDateStr = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const data = [];

  if (!rows || rows.length === 0) {
    data.push(["No records found for the specified period", ...new Array(headers.length - 1).fill("")]);
  } else {
    for (const r of rows) {
      data.push(r);
    }

    if (tab === "database-usage") {
      const totalRow = ["Total"];
      for (let colIdx = 1; colIdx < headers.length; colIdx++) {
        let sum = 0;
        let isNumeric = true;
        let hasValue = false;
        
        for (const r of rows) {
          const val = r[colIdx];
          if (val === null || val === undefined || val === '') continue;
          
          const num = Number(val);
          if (Number.isFinite(num)) {
            sum += num;
            hasValue = true;
          } else {
            isNumeric = false;
            break;
          }
        }
        
        if (isNumeric && hasValue) {
          totalRow.push(sum);
        } else {
          totalRow.push("");
        }
      }
      data.push(totalRow);
    }
  }

  const worksheetData = [
    [`RESDEX ${tab.toUpperCase().replace(/-/g, " ")} REPORT - ${companyName}`],
    [`Period: ${period} (${formatDateStr(start)} to ${formatDateStr(end)})`],
    [],
    headers,
    ...data
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resdex Report");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
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
  const filename = `Resdex_${tabTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_${period}_${dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;

  const excelBuffer = buildResdexReportExcel({ headers, rows, tab, period, start, end, companyName });
  const subject = `${companyName}: Your Resdex ${tabTitle} Report (${dateRangeStr})`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px 28px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">
            Scheduled Resdex Reporting &bull; ${escapeHtml(period.toUpperCase())}
          </p>
          <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
          <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">Resdex ${escapeHtml(tabTitle)} Report</h2>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Period: <strong>${escapeHtml(dateRangeStr)}</strong> (${escapeHtml(period.toUpperCase())})</p>
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello,<br />Please find attached your Resdex <strong>${escapeHtml(tabTitle)}</strong> report for <strong>${escapeHtml(companyName)}</strong>.
          </p>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; font-size: 15px; color: #334155; margin-bottom: 8px;">Overview</h3>
            <p style="font-size: 14px; margin: 0; color: #64748b;">Total Records: <strong style="color: #0f172a;">${rows.length}</strong></p>
          </div>

          <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
            The detailed breakdown is available in the attached Excel file. You can open it directly in Microsoft Excel or Google Sheets.
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

  const text = `Resdex ${tabTitle} Report for ${companyName}\nPeriod: ${dateRangeStr}\nTotal Records: ${rows.length}\n\nPlease review the attached Excel report.`;

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
      logger.error(`[ResdexReportEmail] Failed to send report to ${to}:`, err);
      results.push({ email: to, success: false, error: err.message });
    }
  }

  return { results, filename, start, end };
}

module.exports = {
  getResdexDateWindow,
  getResdexAggregatedData,
  buildResdexReportExcel,
  sendResdexReportEmail,
};
