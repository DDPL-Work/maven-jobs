const JobReport = require("../models/JobReport");
const Job = require("../models/Job");
const Company = require("../models/Company");
const CrmUser = require("../models/CrmUser");
const Lead = require("../models/Lead");
const emailService = require("../services/email.service");
const notificationService = require("../services/notification.service");
const logger = require("../config/logger");
const asyncHandler = require("../middleware/async.middleware");

const REASON_LABELS = {
  FRAUD_SCAM: "Suspicious or fraudulent opportunity / Scam",
  ASKING_MONEY: "Employer is asking for money or registration fee",
  INACCURATE_DETAILS: "Misleading or inaccurate job details",
  OFFENSIVE_CONTENT: "Offensive, discriminatory, or abusive content",
  EXPIRED_JOB: "Position is closed, expired, or already filled",
  OTHER: "Other issue",
};

/**
 * Resolves the assigned CRM user for a given company/job
 * Checks:
 * 1. company.assignedFSE
 * 2. company.assignedFSE
 * 3. company.createdByCRM
 * 4. job.createdByCRM
 * 5. company.accountManager matching CrmUser email or fullName
 * 6. Lead model matching companyName -> assignedTo or createdBy
 */
const resolveAssignedCrm = async (company, job = null) => {
  if (!company) return null;

  // 1. Direct assignedFSE on Company
  if (company.assignedFSE) {
    const crm = await CrmUser.findById(company.assignedFSE).select("fullName email role phone");
    if (crm && crm.isActive && crm.accessStatus !== "RESTRICTED") return crm;
  }

  // 2. Direct assignedFSE on Company
  if (company.assignedFSE) {
    const crm = await CrmUser.findById(company.assignedFSE).select("fullName email role phone");
    if (crm && crm.isActive && crm.accessStatus !== "RESTRICTED") return crm;
  }

  // 3. createdByCRM on Company
  if (company.createdByCRM) {
    const crm = await CrmUser.findById(company.createdByCRM).select("fullName email role phone");
    if (crm && crm.isActive && crm.accessStatus !== "RESTRICTED") return crm;
  }

  // 4. createdByCRM on Job
  if (job?.createdByCRM) {
    const crm = await CrmUser.findById(job.createdByCRM).select("fullName email role phone");
    if (crm && crm.isActive && crm.accessStatus !== "RESTRICTED") return crm;
  }

  // 5. Account manager string (e.g. "sudhanshu2246@gmail.com" or full name)
  if (company.accountManager && company.accountManager.trim()) {
    const accMgr = company.accountManager.trim();
    const crm = await CrmUser.findOne({
      $or: [
        { email: accMgr.toLowerCase() },
        { fullName: new RegExp(`^${accMgr}$`, "i") },
      ],
      isActive: { $ne: false },
      accessStatus: { $ne: "RESTRICTED" },
    }).select("fullName email role phone");
    if (crm) return crm;
  }

  // 6. Matching Lead by companyName (e.g., "Dev Bhoomi travels")
  if (company.name && company.name.trim()) {
    const cleanName = company.name.trim();
    const lead = await Lead.findOne({
      companyName: new RegExp(`^${cleanName}$`, "i"),
    })
      .populate("assignedTo", "fullName email role phone isActive accessStatus")
      .populate("createdBy", "fullName email role phone isActive accessStatus");

    if (lead?.assignedTo && lead.assignedTo.isActive && lead.assignedTo.accessStatus !== "RESTRICTED") {
      return lead.assignedTo;
    }
    if (lead?.createdBy && lead.createdBy.isActive && lead.createdBy.accessStatus !== "RESTRICTED") {
      return lead.createdBy;
    }
  }

  return null;
};

/**
 * Builds email notification sent to assigned CRM user when one of their companies' jobs is reported
 */
const buildJobReportEmailHtml = ({ job, company, report, assignedCrm }) => {
  const reasonText = REASON_LABELS[report.reason] || report.reason;
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); padding: 22px; color: #ffffff; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Action Required: Job Listing Reported</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #fecaca;">Maven Jobs Compliance Alert</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">
        Hello <strong>${assignedCrm?.fullName || "Account Manager"}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
        A candidate has reported a job listing posted by your assigned company <strong>"${company.name}"</strong>.
        Please review the report details below and take appropriate action in your CRM panel.
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b; font-weight: 700;">Report Reference: ${report.reportId}</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;"><strong>Reason:</strong> ${reasonText}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; width: 35%; color: #64748b;">Company Name</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${company.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Job Title</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${job.title}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Candidate Comments</td>
            <td style="padding: 10px 0; color: #334155;">${report.description || "None provided"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Reported At</td>
            <td style="padding: 10px 0; color: #64748b;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
          </tr>
          ${report.reporterEmail ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Reporter Email</td>
            <td style="padding: 10px 0; color: #2563eb;">${report.reporterEmail}</td>
          </tr>` : ""}
        </tbody>
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${process.env.PORTAL_URL || "http://localhost:5173"}/crm/reported-jobs" 
           style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Review in CRM Panel &rarr;
        </a>
      </div>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Maven Jobs. Internal Compliance System.
    </div>
  </div>
  `;
};

/**
 * @desc    Submit a report for a specific job (Candidate / Public)
 * @route   POST /api/v1/candidate/jobs/:id/report OR /api/v1/jobs/:id/report
 * @access  Public (Optional auth for candidate)
 */
exports.submitJobReport = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  const {
    reason,
    description = "",
    reporterName = "",
    reporterEmail = "",
    reporterPhone = "",
  } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid reason for reporting this job.",
    });
  }

  // 1. Fetch Job and associated Company
  const job = await Job.findById(jobId).populate("companyId");
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found.",
    });
  }

  const company = job.companyId;
  if (!company) {
    return res.status(400).json({
      success: false,
      message: "Associated company not found for this job.",
    });
  }

  // 2. Identify Reporter
  const candidateUser = req.user && req.user.role === "CANDIDATE" ? req.user : null;
  const cleanReporterEmail = (candidateUser?.email || reporterEmail || "").toLowerCase().trim();
  const cleanReporterName = (candidateUser?.name || reporterName || "").trim();
  const cleanReporterPhone = (candidateUser?.phone || reporterPhone || "").trim();

  // 3. Spam / Duplicate Prevention: 1 report per job per email/IP within 24 hours
  const clientIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existingReportQuery = {
    jobId: job._id,
    createdAt: { $gte: twentyFourHoursAgo },
  };

  if (candidateUser) {
    existingReportQuery.reportedBy = candidateUser._id;
  } else if (cleanReporterEmail) {
    existingReportQuery.reporterEmail = cleanReporterEmail;
  } else if (clientIp) {
    existingReportQuery.sourceIp = clientIp;
  }

  const existingReport = await JobReport.findOne(existingReportQuery);
  if (existingReport) {
    return res.status(200).json({
      success: true,
      message: "You have already submitted a report for this job. Our compliance team is currently reviewing it.",
      data: {
        reportId: existingReport.reportId,
        alreadyReported: true,
      },
    });
  }

  // 4. Resolve the Allocated CRM for this company (e.g. sudhanshu2246@gmail.com)
  const assignedCrm = await resolveAssignedCrm(company, job);

  // 5. Create JobReport document
  const validReason = REASON_LABELS[reason] ? reason : "OTHER";
  const jobReport = await JobReport.create({
    jobId: job._id,
    jobTitle: job.title,
    companyId: company._id,
    companyName: company.name,
    reportedBy: candidateUser?._id || null,
    reporterName: cleanReporterName,
    reporterEmail: cleanReporterEmail,
    reporterPhone: cleanReporterPhone,
    reason: validReason,
    reasonLabel: REASON_LABELS[validReason] || "Other",
    description: description.trim(),
    assignedCrm: assignedCrm?._id || null,
    assignedCrmEmail: assignedCrm?.email || "",
    assignedCrmName: assignedCrm?.fullName || "",
    status: "PENDING",
    sourceIp: clientIp,
    sourceUserAgent: userAgent,
  });

  logger.info(
    `[JobReport] Created report ${jobReport.reportId} for Job "${job.title}" (${company.name}). ` +
    `Allocated CRM: ${assignedCrm ? `${assignedCrm.fullName} (${assignedCrm.email})` : "UNASSIGNED"}`
  );

  // 6. Asynchronous In-App Notification and Real-time Socket Event to CRM
  (async () => {
    try {
      // In-App Admin/CRM Notification
      await notificationService.sendAdminNotification({
        title: `Job Reported: ${company.name}`,
        message: `Job "${job.title}" posted by "${company.name}" was reported by a candidate. Reason: ${jobReport.reasonLabel}.`,
        type: "CRM",
        severity: "HIGH",
        actionUrl: `/crm/reported-jobs?reportId=${jobReport._id}`,
        metadata: {
          reportId: jobReport.reportId,
          jobId: job._id,
          companyId: company._id,
          companyName: company.name,
          assignedCrmId: assignedCrm?._id,
          assignedCrmEmail: assignedCrm?.email,
        },
      });

      // Real-time WebSocket emission to CRM rooms
      if (global.chatSocketServer) {
        // Emit to specific CRM room if assigned
        if (assignedCrm?._id) {
          global.chatSocketServer.to(`crm:${assignedCrm._id}`).emit("job-report:new", {
            reportId: jobReport.reportId,
            jobId: job._id,
            jobTitle: job.title,
            companyName: company.name,
            reason: jobReport.reasonLabel,
            createdAt: jobReport.createdAt,
          });
        }
        // Emit to general CRM and admin rooms
        global.chatSocketServer.to(["admin", "crm"]).emit("job-report:new", {
          reportId: jobReport.reportId,
          jobId: job._id,
          jobTitle: job.title,
          companyName: company.name,
          assignedCrmEmail: assignedCrm?.email || "Unassigned",
          reason: jobReport.reasonLabel,
          createdAt: jobReport.createdAt,
        });
      }

      // Email alert directly to the allocated CRM (e.g. sudhanshu2246@gmail.com)
      if (assignedCrm?.email && /^\S+@\S+\.\S+$/.test(assignedCrm.email)) {
        await emailService.sendEmail({
          to: assignedCrm.email,
          subject: `[ALERT] Candidate Reported Job: "${job.title}" (${company.name})`,
          html: buildJobReportEmailHtml({ job, company, report: jobReport, assignedCrm }),
          text: `A candidate has reported the job "${job.title}" posted by "${company.name}". Reason: ${jobReport.reasonLabel}. Description: ${jobReport.description || "N/A"}. Please review in the CRM panel.`,
        }).catch((emailErr) => {
          logger.warn(`[JobReport] Failed sending alert email to assigned CRM ${assignedCrm.email}:`, emailErr.message);
        });
      }
    } catch (notifErr) {
      logger.error("[JobReport] Error dispatching notifications:", notifErr);
    }
  })().catch(() => {});

  return res.status(201).json({
    success: true,
    message: "Thank you for reporting this job. Our compliance and CRM team have been notified and will investigate.",
    data: {
      reportId: jobReport.reportId,
    },
  });
});

/**
 * @desc    Get Reported Jobs for the logged-in CRM user
 * @route   GET /api/v1/crm-panel/reported-jobs
 * @access  Private (CRM Panel)
 */
exports.getCrmReportedJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const { status, search } = req.query;
  const user = req.user;

  // Filter based on CRM user:
  // If ADMIN or NATIONAL_SALES_HEAD, can see all reports.
  // Otherwise, only see reports allocated to this CRM user (or company created by them)
  const isGlobalManager =
    user?.role === "ADMIN" ||
    user?.role === "NATIONAL_SALES_HEAD" ||
    user?.role === "STATE_MANAGER" ||
    user?.role === "ZONAL_MANAGER";

  let filter = {};

  if (!isGlobalManager) {
    const userEmail = (user.email || "").toLowerCase().trim();
    filter.$or = [
      { assignedCrm: user._id },
      { assignedCrmEmail: userEmail },
    ];
  }

  if (status && status !== "ALL") {
    filter.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");
    const searchConditions = [
      { jobTitle: regex },
      { companyName: regex },
      { reportId: regex },
      { reporterName: regex },
      { reporterEmail: regex },
      { description: regex },
    ];
    if (filter.$or) {
      filter = {
        $and: [{ $or: filter.$or }, { $or: searchConditions }],
      };
    } else {
      filter.$or = searchConditions;
    }
  }

  // Count metrics for summary cards
  const baseFilter = !isGlobalManager
    ? {
        $or: [
          { assignedCrm: user._id },
          { assignedCrmEmail: (user.email || "").toLowerCase().trim() },
        ],
      }
    : {};

  const [reports, total, countPending, countUnderReview, countResolved] = await Promise.all([
    JobReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("jobId", "title isActive approvalStatus deadline location")
      .populate("companyId", "name email phone logoUrl location")
      .populate("assignedCrm", "fullName email role phone")
      .populate("resolvedBy", "fullName email")
      .lean(),
    JobReport.countDocuments(filter),
    JobReport.countDocuments({ ...baseFilter, status: "PENDING" }),
    JobReport.countDocuments({ ...baseFilter, status: "UNDER_REVIEW" }),
    JobReport.countDocuments({ ...baseFilter, status: { $in: ["RESOLVED", "DISMISSED"] } }),
  ]);

  return res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    counts: {
      total: countPending + countUnderReview + countResolved,
      pending: countPending,
      underReview: countUnderReview,
      resolved: countResolved,
    },
  });
});

/**
 * @desc    Get single Reported Job details
 * @route   GET /api/v1/crm-panel/reported-jobs/:id
 * @access  Private (CRM Panel)
 */
exports.getCrmReportedJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const report = await JobReport.findById(id)
    .populate("jobId")
    .populate("companyId")
    .populate("assignedCrm", "fullName email role phone")
    .populate("resolvedBy", "fullName email");

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Job report not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * @desc    Update Reported Job status, action taken & notes
 * @route   PATCH /api/v1/crm-panel/reported-jobs/:id
 * @access  Private (CRM Panel)
 */
exports.updateCrmReportedJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, actionTaken, crmNotes } = req.body;

  const report = await JobReport.findById(id);
  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Job report not found.",
    });
  }

  if (status) {
    const validStatuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];
    if (validStatuses.includes(status.toUpperCase())) {
      report.status = status.toUpperCase();
    }
  }

  if (actionTaken) {
    const validActions = ["NONE", "JOB_REMOVED", "COMPANY_WARNED", "JOB_MODIFIED", "DISMISSED"];
    if (validActions.includes(actionTaken.toUpperCase())) {
      report.actionTaken = actionTaken.toUpperCase();

      // If action is to remove the job, deactivate the job directly in DB
      if (report.actionTaken === "JOB_REMOVED" && report.jobId) {
        await Job.findByIdAndUpdate(report.jobId, {
          isActive: false,
        });
        logger.info(`[JobReport] Deactivated Job ${report.jobId} following action JOB_REMOVED`);
      }
    }
  }

  if (crmNotes !== undefined) {
    report.crmNotes = String(crmNotes).trim();
  }

  if (report.status === "RESOLVED" || report.status === "DISMISSED") {
    report.resolvedAt = new Date();
    report.resolvedBy = req.user?._id || null;
  }

  await report.save();

  return res.status(200).json({
    success: true,
    message: "Report updated successfully.",
    data: report,
  });
});
