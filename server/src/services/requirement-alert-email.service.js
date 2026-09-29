const Folder = require("../models/Folder");
const FolderCandidate = require("../models/FolderCandidate");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");
const emailService = require("./email.service");
const logger = require("../config/logger");
const { wrapNaukriLayout, escapeHtml, safeUrl } = require("../email/templates/layouts");

const APP_NAME = process.env.APP_NAME || "Maven Jobs";
const FRONTEND_URL = process.env.EMPLOYER_WEB_URL || process.env.FRONTEND_URL || "https://naukri-3.vercel.app";

/**
 * Build professional HTML for candidate match alert email
 */
function buildRequirementAlertHtml({ requirement, candidates, frequency }) {
  const reqName = escapeHtml(requirement.name || "Hiring Requirement");
  const jobTitle = escapeHtml(requirement.jobTitle || requirement.criteria?.jobTitle || "Open Role");
  const skillsList = requirement.criteria?.skills || [];
  const locationsList = requirement.criteria?.locations || [];

  const requirementUrl = `${FRONTEND_URL}/employer-dashboard/folders/${requirement._id}`;
  const searchUrl = `${FRONTEND_URL}/resume-search`;

  const candidatesHtml = candidates
    .map((c) => {
      const name = escapeHtml(c.name || "Candidate");
      const title = escapeHtml(c.currentTitle || c.headline || "Job Seeker");
      const company = c.currentCompany ? ` at ${escapeHtml(c.currentCompany)}` : "";
      const exp = c.totalExperience ? `${escapeHtml(c.totalExperience)} exp` : "";
      const city = c.currentCity ? escapeHtml(c.currentCity) : "";
      const skills = (c.skills || []).slice(0, 5);
      const profileUrl = `${FRONTEND_URL}/candidates/${c.userId || c.id}`;

      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top">
                <a href="${safeUrl(profileUrl)}" target="_blank" style="text-decoration: none; font-size: 16px; font-weight: 700; color: #002366; display: block; margin-bottom: 4px;">
                  ${name}
                </a>
                <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                  ${title}${company}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
                  ${[exp, city].filter(Boolean).join(" • ")}
                </div>
                ${
                  skills.length > 0
                    ? `
                  <div style="display: block; margin-bottom: 12px;">
                    ${skills
                      .map(
                        (s) =>
                          `<span style="display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px;">${escapeHtml(s)}</span>`
                      )
                      .join("")}
                  </div>`
                    : ""
                }
              </td>
              <td align="right" valign="top" style="width: 110px;">
                <a href="${safeUrl(profileUrl)}" target="_blank" style="display: inline-block; background: #002366; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 14px; border-radius: 6px; text-align: center;">
                  View Profile
                </a>
              </td>
            </tr>
          </table>
        </div>
      `;
    })
    .join("");

  const mainContent = `
    <div style="padding: 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <!-- Title Header -->
      <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; margin-bottom: 8px;">
          ${frequency === "WEEKLY" ? "Weekly Talent Digest" : "Daily Talent Alert"}
        </span>
        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
          🎯 New Matches Found for "${reqName}"
        </h2>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          We found <strong>${candidates.length} new matching profile(s)</strong> that match your hiring criteria.
        </p>
      </div>

      <!-- Requirement Summary Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 13px; color: #475569; padding-bottom: 6px;">
              <strong>Target Opening:</strong> ${jobTitle}
            </td>
          </tr>
          ${
            skillsList.length > 0
              ? `<tr>
                  <td style="font-size: 13px; color: #475569; padding-bottom: 6px;">
                    <strong>Required Skills:</strong> ${skillsList.map(s => escapeHtml(s)).join(", ")}
                  </td>
                </tr>`
              : ""
          }
          ${
            locationsList.length > 0
              ? `<tr>
                  <td style="font-size: 13px; color: #475569;">
                    <strong>Locations:</strong> ${locationsList.map(l => escapeHtml(l)).join(", ")}
                  </td>
                </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Candidate Cards -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">
          Top Matching Talent
        </h3>
        ${candidatesHtml}
      </div>

      <!-- Footer Action -->
      <div style="text-align: center; padding: 20px 0 10px 0; border-top: 1px solid #e2e8f0;">
        <a href="${safeUrl(requirementUrl)}" target="_blank" style="display: inline-block; background: #002366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-right: 12px; box-shadow: 0 4px 12px rgba(0,35,102,0.2);">
          Open Requirement Workspace
        </a>
        <a href="${safeUrl(searchUrl)}" target="_blank" style="display: inline-block; background: #f1f5f9; color: #334155; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">
          Run Search in Resdex
        </a>
        <p style="font-size: 12px; color: #94a3b8; margin: 16px 0 0 0;">
          You are receiving this email because alerts are enabled for requirement "${reqName}". You can turn off or adjust alerts anytime from the Resdex Requirements page.
        </p>
      </div>
    </div>
  `;

  return wrapNaukriLayout(mainContent, {
    recipientEmail: Array.isArray(requirement.alerts?.recipients)
      ? requirement.alerts.recipients[0]
      : "",
  });
}

/**
 * Process and dispatch candidate match alerts for all active requirements
 * @param {'DAILY'|'WEEKLY'} frequency
 */
async function processRequirementAlerts(frequency = "DAILY") {
  const normalizedFreq = String(frequency).toUpperCase();
  logger.info(`[RequirementAlerts] Starting ${normalizedFreq} alert dispatch run...`);

  // 1. Fetch active requirements with alerts enabled
  const requirements = await Folder.find({
    folderType: "REQUIREMENT",
    status: { $ne: "closed" },
    "alerts.enabled": true,
    "alerts.frequency": normalizedFreq,
  })
    .populate("employerId", "name email")
    .lean();

  if (requirements.length === 0) {
    logger.info(`[RequirementAlerts] No active requirements with ${normalizedFreq} alerts enabled.`);
    return { processed: 0, emailsSent: 0 };
  }

  let totalEmailsSent = 0;

  for (const reqItem of requirements) {
    try {
      const skills = reqItem.criteria?.skills || [];
      const locations = reqItem.criteria?.locations || [];

      // Determine time window (since lastSentAt or past 24h / 7d)
      let sinceDate = reqItem.alerts?.lastSentAt;
      if (!sinceDate) {
        const lookbackMs = normalizedFreq === "WEEKLY" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        sinceDate = new Date(Date.now() - lookbackMs);
      }

      // Fetch candidates already in this requirement folder to exclude them
      const existingCandidates = await FolderCandidate.find({ folderId: reqItem._id })
        .select("candidateId")
        .lean();
      const existingIds = new Set(existingCandidates.map((fc) => String(fc.candidateId)));

      // Build profile match query
      const matchQuery = {
        updatedAt: { $gte: sinceDate },
      };

      // Match skills or jobTitle
      const orClauses = [];
      if (skills.length > 0) {
        orClauses.push({
          skills: {
            $in: skills.map((s) => new RegExp(String(s).trim(), "i")),
          },
        });
      }
      if (reqItem.jobTitle || reqItem.criteria?.jobTitle) {
        const titleRegex = new RegExp(String(reqItem.jobTitle || reqItem.criteria?.jobTitle).trim(), "i");
        orClauses.push({ currentTitle: titleRegex });
        orClauses.push({ headline: titleRegex });
      }

      if (orClauses.length > 0) {
        matchQuery.$or = orClauses;
      }

      // Match locations if specified
      if (locations.length > 0) {
        matchQuery.$and = [
          {
            $or: [
              { currentCity: { $in: locations.map((l) => new RegExp(String(l).trim(), "i")) } },
              { preferredLocations: { $in: locations.map((l) => new RegExp(String(l).trim(), "i")) } },
            ],
          },
        ];
      }

      // Query top 5 matching candidate profiles
      const matchingProfiles = await CandidateProfile.find(matchQuery)
        .sort({ updatedAt: -1 })
        .limit(15)
        .lean();

      // Filter out candidates already in this folder
      const newProfiles = matchingProfiles.filter(
        (p) => !existingIds.has(String(p.userId)) && !existingIds.has(String(p._id))
      ).slice(0, 5);

      if (newProfiles.length === 0) {
        continue;
      }

      // Enrich with user name & email
      const userIds = newProfiles.map((p) => p.userId).filter(Boolean);
      const users = await User.find({ _id: { $in: userIds } })
        .select("name email avatar")
        .lean();
      const userMap = {};
      for (const u of users) userMap[String(u._id)] = u;

      const enrichedCandidates = newProfiles.map((p) => {
        const u = userMap[String(p.userId)] || {};
        return {
          id: String(p._id),
          userId: String(p.userId || p._id),
          name: u.name || p.name || "Candidate",
          email: u.email || "",
          headline: p.headline || "",
          currentTitle: p.currentTitle || "",
          currentCompany: p.currentCompany || "",
          totalExperience: p.totalExperience || "",
          currentCity: p.currentCity || "",
          skills: p.skills || [],
        };
      });

      // Recipient list: specified recipients or folder owner
      const recipients = Array.isArray(reqItem.alerts?.recipients) && reqItem.alerts.recipients.length > 0
        ? reqItem.alerts.recipients
        : [reqItem.employerId?.email].filter(Boolean);

      if (recipients.length === 0) continue;

      const html = buildRequirementAlertHtml({
        requirement: reqItem,
        candidates: enrichedCandidates,
        frequency: normalizedFreq,
      });

      const subject = `🎯 ${enrichedCandidates.length} New Candidate Match${enrichedCandidates.length > 1 ? "es" : ""} for "${reqItem.name}"`;

      // Send to recipients
      for (const to of recipients) {
        await emailService.sendEmail({
          to,
          subject,
          html,
          text: `Found ${enrichedCandidates.length} new candidates matching requirement "${reqItem.name}". Open your workspace at ${FRONTEND_URL}/resdex-requirements`,
        });
      }

      // Update lastSentAt timestamp
      await Folder.updateOne(
        { _id: reqItem._id },
        { $set: { "alerts.lastSentAt": new Date() } }
      );

      totalEmailsSent += recipients.length;
      logger.info(`[RequirementAlerts] Sent alert for "${reqItem.name}" to ${recipients.join(", ")}`);
    } catch (err) {
      logger.error(`[RequirementAlerts] Error processing requirement ${reqItem._id}:`, err);
    }
  }

  logger.info(`[RequirementAlerts] Finished dispatch run. Sent ${totalEmailsSent} alert emails.`);
  return { processed: requirements.length, emailsSent: totalEmailsSent };
}

/**
 * Send an immediate test match alert for a specific requirement
 */
async function sendTestRequirementAlert(requirementId, user) {
  const reqItem = await Folder.findById(requirementId).lean();
  if (!reqItem) throw new Error("Requirement not found");

  const skills = reqItem.criteria?.skills || [];
  const matchQuery = {};

  if (skills.length > 0) {
    matchQuery.skills = { $in: skills.map((s) => new RegExp(String(s).trim(), "i")) };
  }

  // Find up to 3 candidate profiles for demo preview
  let profiles = await CandidateProfile.find(matchQuery).limit(3).lean();
  if (profiles.length === 0) {
    profiles = await CandidateProfile.find().limit(3).lean();
  }

  const userIds = profiles.map((p) => p.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
  const userMap = {};
  for (const u of users) userMap[String(u._id)] = u;

  const demoCandidates = profiles.map((p) => {
    const u = userMap[String(p.userId)] || {};
    return {
      id: String(p._id),
      userId: String(p.userId || p._id),
      name: u.name || "Candidate",
      headline: p.headline || "Experienced Developer",
      currentTitle: p.currentTitle || reqItem.jobTitle || "Developer",
      currentCompany: p.currentCompany || "Tech Company",
      totalExperience: p.totalExperience || "4 Years",
      currentCity: p.currentCity || "Pune",
      skills: p.skills?.length > 0 ? p.skills : skills,
    };
  });

  const recipient = user?.email || (reqItem.alerts?.recipients?.[0]) || "recruiter@company.com";
  const html = buildRequirementAlertHtml({
    requirement: reqItem,
    candidates: demoCandidates,
    frequency: reqItem.alerts?.frequency || "DAILY",
  });

  const subject = `[Preview] 🎯 Candidate Match Alert for "${reqItem.name}"`;

  return emailService.sendEmail({
    to: recipient,
    subject,
    html,
    text: `Preview: Candidate match alert for "${reqItem.name}"`,
  });
}

module.exports = {
  processRequirementAlerts,
  sendTestRequirementAlert,
  buildRequirementAlertHtml,
};
