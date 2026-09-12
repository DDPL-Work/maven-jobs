const asyncHandler = require("../middleware/async.middleware");
const JobPostingReportLog = require("../models/JobPostingReportLog");

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const buildDateRange = (from, to) => {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const periodToDates = (period) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  if (period === "yesterday") {
    start.setDate(now.getDate() - 1);
    end.setDate(now.getDate() - 1);
  } else if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else if (period === "month") {
    start.setDate(now.getDate() - 30);
  } else {
    start.setDate(now.getDate() - 1);
    end.setDate(now.getDate() - 1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ─────────────────────────────────────────────────────────────
//  GET /reports/job-posting
//  Query params:
//    mode   = "one_click" | "customised"
//    period = "yesterday" | "week" | "month"   (for one_click)
//    from   = YYYY-MM-DD                        (for customised)
//    to     = YYYY-MM-DD                        (for customised)
//    type   = "user_wise" | "job_wise"          (for customised)
// ─────────────────────────────────────────────────────────────
exports.getJobPostingReport = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const {
    mode = "one_click",
    period = "yesterday",
    from,
    to,
    type = "user_wise",
  } = req.query;

  // Resolve date window
  let start, end;
  if (mode === "one_click") {
    ({ start, end } = periodToDates(period));
  } else {
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "'from' and 'to' dates are required for customised mode." });
    }
    ({ start, end } = buildDateRange(from, to));
  }

  const baseMatch = { companyId, actionDate: { $gte: start, $lte: end } };

  // ── User-wise (default for one_click and customised user_wise) ──────────
  if (mode === "one_click" || type === "user_wise") {
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
        },
      },
      {
        $addFields: {
          totalJobExpense: { $add: ["$jobPostExpense", "$jobEditExpense", "$jobRefreshExpense"] },
        },
      },
      { $sort: { userName: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      mode,
      type: "user_wise",
      from: start.toISOString(),
      to: end.toISOString(),
      data: rows,
    });
  }

  // ── Job-wise (customised job_wise) ──────────────────────────────────────
  const rows = await JobPostingReportLog.aggregate([
    {
      $match: {
        ...baseMatch,
        actionType: "JOB_POST", // anchor each job at its POST event
      },
    },
    {
      $lookup: {
        from: "jobpostingreportlogs",
        let: { jid: "$jobId", cid: "$companyId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$jobId", "$$jid"] },
                  { $eq: ["$companyId", "$$cid"] },
                ],
              },
            },
          },
          {
            $group: {
              _id: "$actionType",
              totalExpense: { $sum: "$expense" },
              count: { $sum: 1 },
            },
          },
        ],
        as: "summary",
      },
    },
    {
      $addFields: {
        _post: {
          $arrayElemAt: [{ $filter: { input: "$summary", cond: { $eq: ["$$this._id", "JOB_POST"] } } }, 0],
        },
        _edit: {
          $arrayElemAt: [{ $filter: { input: "$summary", cond: { $eq: ["$$this._id", "JOB_EDIT"] } } }, 0],
        },
        _refresh: {
          $arrayElemAt: [{ $filter: { input: "$summary", cond: { $eq: ["$$this._id", "JOB_REFRESH"] } } }, 0],
        },
        _apps: {
          $arrayElemAt: [{ $filter: { input: "$summary", cond: { $eq: ["$$this._id", "APPLICATION_RECEIVED"] } } }, 0],
        },
        _views: {
          $arrayElemAt: [{ $filter: { input: "$summary", cond: { $eq: ["$$this._id", "JOB_VIEW"] } } }, 0],
        },
      },
    },
    {
      $project: {
        jobId: 1,
        jobTitle: 1,
        userName: 1,
        userEmail: 1,
        alias: 1,
        department: 1,
        location: 1,
        status: 1,
        actionDate: 1,
        jobPostExpense: { $ifNull: ["$_post.totalExpense", 0] },
        jobEditExpense: { $ifNull: ["$_edit.totalExpense", 0] },
        jobRefreshExpense: { $ifNull: ["$_refresh.totalExpense", 0] },
        applicationsReceived: { $ifNull: ["$_apps.count", 0] },
        jobViews: { $ifNull: ["$_views.count", 0] },
        totalJobExpense: {
          $add: [
            { $ifNull: ["$_post.totalExpense", 0] },
            { $ifNull: ["$_edit.totalExpense", 0] },
            { $ifNull: ["$_refresh.totalExpense", 0] },
          ],
        },
      },
    },
    { $sort: { actionDate: -1 } },
  ]);

  return res.status(200).json({
    success: true,
    mode,
    type: "job_wise",
    from: start.toISOString(),
    to: end.toISOString(),
    data: rows,
  });
});

// ─────────────────────────────────────────────────────────────
//  Subscription Models & Services
// ─────────────────────────────────────────────────────────────
const JobPostingReportSubscription = require("../models/JobPostingReportSubscription");
const {
  getReportDateWindow,
  getAggregatedReportData,
  sendJobPostingReportEmail: sendEmailReportService,
} = require("../services/job-posting-report-email.service");

// ─────────────────────────────────────────────────────────────
//  GET /reports/job-posting/subscription
// ─────────────────────────────────────────────────────────────
exports.getJobPostingReportSubscription = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const sub = await JobPostingReportSubscription.findOne({ companyId });

  return res.status(200).json({
    success: true,
    data: {
      subscription: sub?.subscription || "disabled",
      emailList: sub?.emailList || [],
      lastSentAt: sub?.lastSentAt || null,
      lastSentPeriod: sub?.lastSentPeriod || "",
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /reports/job-posting/subscription
// ─────────────────────────────────────────────────────────────
exports.saveJobPostingReportSubscription = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const { subscription = "disabled", emailList = [] } = req.body;

  if (!["disabled", "weekly", "monthly"].includes(subscription)) {
    return res.status(400).json({
      success: false,
      message: "Subscription must be 'disabled', 'weekly', or 'monthly'.",
    });
  }

  const cleanedEmails = Array.isArray(emailList)
    ? emailList
        .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e) => e.length > 0 && e.includes("@"))
    : [];

  const sub = await JobPostingReportSubscription.findOneAndUpdate(
    { companyId },
    {
      companyId,
      subscription,
      emailList: cleanedEmails,
      updatedBy: req.user?._id || null,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    message: "Report subscription saved successfully.",
    data: {
      subscription: sub.subscription,
      emailList: sub.emailList,
      lastSentAt: sub.lastSentAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /reports/job-posting/send-email
//  Body: { period: "weekly" | "monthly", emailList?: string[] }
// ─────────────────────────────────────────────────────────────
exports.sendJobPostingReportEmail = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const { period = "weekly", emailList } = req.body;

  if (!["weekly", "monthly"].includes(period)) {
    return res.status(400).json({
      success: false,
      message: "Period must be 'weekly' or 'monthly'.",
    });
  }

  // Resolve target emails
  let targetEmails = Array.isArray(emailList)
    ? emailList.map((e) => (typeof e === "string" ? e.trim().toLowerCase() : "")).filter((e) => e.includes("@"))
    : [];

  if (targetEmails.length === 0) {
    const sub = await JobPostingReportSubscription.findOne({ companyId });
    if (sub && Array.isArray(sub.emailList) && sub.emailList.length > 0) {
      targetEmails = sub.emailList;
    }
  }

  if (targetEmails.length === 0 && req.user?.email) {
    targetEmails = [req.user.email];
  }

  if (targetEmails.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid recipient email address provided.",
    });
  }

  const { start, end } = getReportDateWindow(period, new Date());
  const rows = await getAggregatedReportData(companyId, start, end);
  const companyName = req.company?.name || "Company";

  const result = await sendEmailReportService({
    toEmails: targetEmails,
    companyName,
    period,
    start,
    end,
    rows,
  });

  return res.status(200).json({
    success: true,
    message: `Report sent to ${targetEmails.join(", ")}`,
    data: {
      period,
      from: start.toISOString(),
      to: end.toISOString(),
      recipients: targetEmails,
      details: result.results,
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  Resdex Models & Services
// ─────────────────────────────────────────────────────────────
const ResdexReportSubscription = require("../models/ResdexReportSubscription");
const {
  getResdexDateWindow,
  getResdexAggregatedData,
  sendResdexReportEmail: sendResdexEmailService,
} = require("../services/resdex-report-email.service");

// ─────────────────────────────────────────────────────────────
//  GET /reports/resdex
//  Query params:
//    tab       = "database-usage" | "search-report" | "user-login" | ...
//    mode      = "one_click" | "customised"
//    period    = "yesterday" | "week" | "month"
//    from      = YYYY-MM-DD
//    to        = YYYY-MM-DD
//    userIds   = comma-separated string
//    keyword   = search keyword
//    sortType  = "date_wise" | "subuser_wise"
// ─────────────────────────────────────────────────────────────
exports.getResdexReport = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const {
    tab = "database-usage",
    mode = "one_click",
    period = "yesterday",
    from,
    to,
    userIds = "",
    keyword = "",
    sortType = "date_wise",
  } = req.query;

  let start, end;
  if (mode === "one_click") {
    ({ start, end } = getResdexDateWindow(period, new Date()));
  } else {
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "'from' and 'to' dates are required for customised mode." });
    }
    ({ start, end } = buildDateRange(from, to));
  }

  const parsedUserIds = typeof userIds === "string" && userIds.trim().length > 0
    ? userIds.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const { headers, rows } = await getResdexAggregatedData({
    companyId,
    tab,
    start,
    end,
    userIds: parsedUserIds,
    keyword,
    sortType,
  });

  return res.status(200).json({
    success: true,
    tab,
    mode,
    from: start.toISOString(),
    to: end.toISOString(),
    headers,
    data: rows,
  });
});

// ─────────────────────────────────────────────────────────────
//  GET /reports/resdex/subscription
// ─────────────────────────────────────────────────────────────
exports.getResdexReportSubscription = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const sub = await ResdexReportSubscription.findOne({ companyId });

  return res.status(200).json({
    success: true,
    data: {
      subscriptions: sub?.subscriptions || {
        "database-usage": "disabled",
        "user-login": "disabled",
      },
      emailList: sub?.emailList || [],
      lastSentAt: sub?.lastSentAt || {},
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /reports/resdex/subscription
// ─────────────────────────────────────────────────────────────
exports.saveResdexReportSubscription = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const { subscriptions = {}, emailList = [] } = req.body;

  const cleanedEmails = Array.isArray(emailList)
    ? emailList
        .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e) => e.length > 0 && e.includes("@"))
    : [];

  const sub = await ResdexReportSubscription.findOneAndUpdate(
    { companyId },
    {
      companyId,
      subscriptions,
      emailList: cleanedEmails,
      updatedBy: req.user?._id || null,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    message: "Resdex report subscription saved successfully.",
    data: {
      subscriptions: sub.subscriptions,
      emailList: sub.emailList,
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  POST /reports/resdex/send-email
// ─────────────────────────────────────────────────────────────
exports.sendResdexReportEmail = asyncHandler(async (req, res) => {
  const companyId = req.company?._id;
  if (!companyId) {
    return res.status(400).json({ success: false, message: "Company context not found." });
  }

  const { tab = "database-usage", period = "weekly", emailList } = req.body;

  let targetEmails = Array.isArray(emailList)
    ? emailList.map((e) => (typeof e === "string" ? e.trim().toLowerCase() : "")).filter((e) => e.includes("@"))
    : [];

  if (targetEmails.length === 0) {
    const sub = await ResdexReportSubscription.findOne({ companyId });
    if (sub && Array.isArray(sub.emailList) && sub.emailList.length > 0) {
      targetEmails = sub.emailList;
    }
  }

  if (targetEmails.length === 0 && req.user?.email) {
    targetEmails = [req.user.email];
  }

  if (targetEmails.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid recipient email address provided.",
    });
  }

  const { start, end } = getResdexDateWindow(period, new Date());
  const { headers, rows } = await getResdexAggregatedData({
    companyId,
    tab,
    start,
    end,
  });

  const companyName = req.company?.name || "Company";

  const result = await sendResdexEmailService({
    toEmails: targetEmails,
    companyName,
    tab,
    period,
    start,
    end,
    headers,
    rows,
  });

  return res.status(200).json({
    success: true,
    message: `Resdex report sent to ${targetEmails.join(", ")}`,
    data: {
      tab,
      period,
      from: start.toISOString(),
      to: end.toISOString(),
      recipients: targetEmails,
      details: result.results,
    },
  });
});


