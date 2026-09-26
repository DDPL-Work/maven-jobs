const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async.middleware");
const Nvite = require("../models/Nvite");
const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const emailModule = require("../email");
const { wrapNaukriLayout, escapeHtml } = require("../email/templates/layouts");
const logger = require("../config/logger");
const activityService = require("../services/recruiter-activity.service");
const { checkAndEnforceQuota } = require("../services/quota-enforcement.service");
const ResdexReportLog = require("../models/ResdexReportLog");
const notificationService = require("../services/notification.service");

exports.sendNvite = asyncHandler(async (req, res) => {
  const company = req.company;
  const recruiter = req.user;
  const { recipients, subject, body, templateId, jobIds } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: "At least one recipient is required" });
  }

  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ success: false, message: "Subject is required" });
  }

  if (!body || !String(body).trim()) {
    return res.status(400).json({ success: false, message: "Message body is required" });
  }

  const validRecipients = recipients.filter(r => typeof r === "string" && r.includes("@"));
  if (validRecipients.length === 0) {
    return res.status(400).json({ success: false, message: "No valid recipient emails provided" });
  }

  // ── Check NVite quota before sending ──
  try {
    await checkAndEnforceQuota(company, 'nvite', validRecipients.length);
  } catch (quotaErr) {
    return res.status(429).json({
      success: false,
      message: quotaErr.message,
      code: quotaErr.code || 'NVITE_QUOTA_EXHAUSTED',
      quotaInfo: quotaErr.quotaInfo || null,
    });
  }

  const foundUsers = await User.find({
    email: { $in: validRecipients.map(e => e.toLowerCase()) },
    role: "CANDIDATE",
  }).select("_id email name").lean();

  const foundEmails = new Set(foundUsers.map(u => u.email));
  const unknown = validRecipients.filter(e => !foundEmails.has(e.toLowerCase()));

  const recipientsData = validRecipients.map(email => ({
    email: email.toLowerCase(),
    userId: foundUsers.find(u => u.email === email.toLowerCase())?._id || null,
    status: "pending",
  }));

  const nvite = await Nvite.create({
    companyId: company._id,
    recruiterId: recruiter._id,
    recipients: recipientsData,
    subject: subject.trim(),
    body: body.trim(),
    templateId: templateId || null,
    jobIds: Array.isArray(jobIds) ? jobIds : [],
    totalCount: validRecipients.length,
    unknownCount: unknown.length,
  });

  // Log recruiter activity (fire & forget)
  activityService.fireAndForget({
    companyId: company._id,
    recruiter,
    action: "NVITE_SENT",
    text: `Sent interview invite to **${validRecipients.length}** candidate${validRecipients.length === 1 ? "" : "s"}${
      unknown.length ? ` (${unknown.length} not on Maven Jobs)` : ""
    }`,
    metadata: { subject: subject.trim(), totalCount: validRecipients.length, matchedCount: foundUsers.length, nviteId: nvite._id },
  });

  /* ── Send emails via AWS SES ── */
  const companyName = company?.name || "Company";
  const recruiterName = recruiter?.name || "Recruiter";
  const sentResults = [];
  const failedEmails = [];

  for (const recipient of recipientsData) {
    const candidateUser = foundUsers.find(u => u.email === recipient.email);
    const candidateName = candidateUser?.name || recipient.email.split("@")[0];

    const personalizedSubject = subject
      .replace(/\{\{candidate_name\}\}/g, candidateName)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{recruiter_name\}\}/g, recruiterName);

    const personalizedBody = body
      .replace(/\{\{candidate_name\}\}/g, candidateName)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{recruiter_name\}\}/g, recruiterName);

    const htmlBody = personalizedBody
      .split("\n")
      .filter(line => line.trim())
      .map(line => `<p style="margin:0 0 6px;font-family:system-ui,sans-serif;font-size:14px;color:#334155;">${line}</p>`)
      .join("");

    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px 28px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">
              ${escapeHtml(companyName)} &bull; Interview Invitation
            </p>
            <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
            <h2 style="margin: 0 0 14px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;">${escapeHtml(personalizedSubject)}</h2>
            ${htmlBody}
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
        <tr>
          <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
            <a href="${process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "https://naukri-3.vercel.app"}${candidateUser?._id ? `/${candidateUser._id}/dashboard/mivites` : '/login'}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
              View Invitation on Maven &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 12px 0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
        You received this message because a recruiter from ${escapeHtml(companyName)} found your profile on Maven Jobs.
      </p>
    `;

    const fullHtml = wrapNaukriLayout(content, {
      title: personalizedSubject,
      showFeatureGrid: false,
      showAppBanner: true,
    });

    try {
      const emailResult = await emailModule.sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        html: fullHtml,
        text: personalizedBody,
      });

      await Nvite.updateOne(
        { _id: nvite._id, "recipients.email": recipient.email },
        { $set: { "recipients.$.status": "sent", "recipients.$.sentAt": new Date() } }
      );

      sentResults.push({ email: recipient.email, success: true, messageId: emailResult.messageId });
      logger.info("[nvite] Sent invitation email", { email: recipient.email, nviteId: nvite._id });

      // Send in-app notification to candidate (strictly candidate only)
      if (candidateUser?._id) {
        notificationService.sendCandidateNotification({
          candidateId: candidateUser._id,
          companyId: company._id,
          jobId: (Array.isArray(jobIds) && jobIds.length > 0) ? jobIds[0] : null,
          title: "Interview Invitation (NVite)",
          message: `${companyName} invited you: "${subject.trim()}".`,
          category: "INVITATION",
          actionUrl: `/${candidateUser._id}/dashboard/mivites`,
          metadata: { nviteId: String(nvite._id), companyName, recruiterName },
        }).catch(() => {});
      }
    } catch (err) {
      logger.error("[nvite] Failed to send email", { email: recipient.email, error: err.message });
      failedEmails.push({ email: recipient.email, error: err.message });
    }
  }

  res.status(201).json({
    success: true,
    data: {
      _id: nvite._id,
      totalSent: validRecipients.length,
      matchedCount: foundUsers.length,
      unknownCount: unknown.length,
      unknownEmails: unknown,
      emailResults: {
        delivered: sentResults.length,
        failed: failedEmails.length,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      },
    },
  });

  // ── Write per-recipient ResdexReportLog entries (audit ledger) ──
  // Done AFTER response is sent so it doesn’t delay the user
  setImmediate(async () => {
    try {
      const logs = recipientsData.map(recipient => {
        const candidateUser = foundUsers.find(u => u.email === recipient.email);
        const candidateName = candidateUser?.name || recipient.email.split('@')[0];
        const delivered = sentResults.some(r => r.email === recipient.email && r.success);
        return {
          companyId: company._id,
          userId: recruiter._id,
          subuserName: recruiter.name || recruiter.email || 'Recruiter',
          subuserEmail: recruiter.email || '',
          actionType: 'NVITE_SENT',
          section: 'DATABASE_USAGE',
          candidateId: recipient.userId || null,
          candidateName,
          contactChannel: 'NVITE',
          contactStatus: delivered ? 'Delivered' : 'Failed',
          platform: 'WEB',
          creditsUsed: 0,
          metadata: {
            nviteId: nvite._id,
            subject: subject.trim(),
            recipientEmail: recipient.email,
            recipientUserId: recipient.userId || null,
            onMavenJobs: !!recipient.userId,
            emailDelivered: delivered,
            recruiterName: recruiter.name || '',
            recruiterEmail: recruiter.email || '',
            companyName: company.name || '',
            totalRecipientsInBatch: validRecipients.length,
          },
        };
      });
      await ResdexReportLog.insertMany(logs, { ordered: false });
      logger.info(`[ResdexReportLog] Wrote ${logs.length} NVITE_SENT entries for nvite ${nvite._id}`);
    } catch (err) {
      logger.error('[ResdexReportLog] Failed to write NVite audit logs:', err.message);
    }
  });
});

exports.listNvites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const currentLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (currentPage - 1) * currentLimit;

  const [nvites, total] = await Promise.all([
    Nvite.find({ companyId: req.company._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .lean(),
    Nvite.countDocuments({ companyId: req.company._id }),
  ]);

  res.json({
    success: true,
    data: nvites,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  });
});

exports.getNviteStats = asyncHandler(async (req, res) => {
  const companyId = req.company._id;

  const [totalSent, pendingCount, openedCount, repliedCount, recent] = await Promise.all([
    Nvite.countDocuments({ companyId }),
    Nvite.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $unwind: "$recipients" },
      { $match: { "recipients.status": "pending" } },
      { $count: "count" },
    ]),
    Nvite.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $unwind: "$recipients" },
      { $match: { "recipients.status": "opened" } },
      { $count: "count" },
    ]),
    Nvite.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $unwind: "$recipients" },
      { $match: { "recipients.status": "replied" } },
      { $count: "count" },
    ]),
    Nvite.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("subject totalCount createdAt")
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      totalSent,
      pending: pendingCount[0]?.count || 0,
      opened: openedCount[0]?.count || 0,
      replied: repliedCount[0]?.count || 0,
      recent,
    },
  });
});
