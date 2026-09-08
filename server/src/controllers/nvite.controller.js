const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async.middleware");
const Nvite = require("../models/Nvite");
const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const emailModule = require("../email");
const logger = require("../config/logger");
const activityService = require("../services/recruiter-activity.service");

exports.sendNvite = asyncHandler(async (req, res) => {
  const company = req.company;
  const recruiter = req.user;
  const { recipients, subject, body, templateId } = req.body;

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

    const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0 0 20px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">${companyName}</p>
              ${htmlBody}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
                You received this message because a recruiter from ${companyName} found your profile on MavenJobs.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
