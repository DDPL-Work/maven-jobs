const { generateUnsubscribeToken } = require("../utils/unsubscribeToken");
const { wrapNaukriLayout } = require("../../email/templates/layouts");

const FRONTEND_URL = () => process.env.FRONTEND_URL || "https://maven-jobs.com";
const API_BASE = () => process.env.API_BASE_URL || "https://mavenjobs.in/api/v1";

function buildClickUrl(jobId, userId, messageId) {
  return `${API_BASE()}/recommendations/click?jobId=${encodeURIComponent(String(jobId))}&userId=${encodeURIComponent(String(userId))}&messageId=${encodeURIComponent(messageId || "")}`;
}

function buildRecommendationEmail(userName, recommendations, plan, userId, email) {
  const isElite = plan === "ELITE";
  const subject = isElite
    ? "Exclusive Elite Job Opportunities Await ⭐"
    : "Your Top 3 Job Matches for Today 🚀";
  const heading = isElite
    ? "Your Exclusive Elite Job Matches"
    : "Your Daily Job Recommendations";
  const messageId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const unsubscribeToken = userId && email ? generateUnsubscribeToken(userId, email, "recommendations").token : "";
  const unsubscribeUrl = userId && email
    ? `${API_BASE()}/recommendations/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&type=recommendations`
    : "";

  const jobCards = (recommendations || []).map((job, i) => {
    const clickUrl = userId ? buildClickUrl(job.jobId, userId, messageId) : (job.applyUrl || "#");
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top">
                <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                  ${i + 1}. ${escapeHtml(job.title)}
                </p>
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 500; color: #475569;">
                  ${escapeHtml(job.companyName || "")}
                </p>
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">
                  📍 ${escapeHtml(job.location || "Various")}
                  ${job.salaryRange ? `&nbsp;|&nbsp;💰 ${escapeHtml(job.salaryRange)}` : ""}
                  ${job.experience ? `&nbsp;|&nbsp;⚡ ${escapeHtml(job.experience)}` : ""}
                </p>
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #16a34a;">
                  Match Score: ${job.score}%
                </p>
              </td>
              <td width="130" align="right" valign="middle" style="padding-left: 12px;">
                <a href="${escapeHtml(clickUrl)}" target="_blank"
                   style="display: inline-block; padding: 9px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 13px; font-weight: 600; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);">
                  Apply Now &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }).join("\n");

  const content = `
    <!-- Naukri Quote Highlight Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px 28px;">
          <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
          <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">${heading}</h2>
          <p style="margin: 0 0 8px 0; font-size: 15px; color: #475569; line-height: 1.6;">
            Hi ${escapeHtml(userName)},
          </p>
          <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
            Based on your profile, here are today's ${isElite ? "exclusive elite " : ""}recommendations:
          </p>
        </td>
      </tr>
    </table>

    <!-- Job Cards -->
    ${jobCards}

    <!-- Explore More Jobs Pill Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto 20px auto;">
      <tr>
        <td align="center" style="background-color: #163060; border-radius: 9999px; box-shadow: 0 4px 14px rgba(22, 48, 96, 0.25);">
          <a href="${escapeHtml(FRONTEND_URL())}/jobs"
             target="_blank"
             style="display: inline-block; padding: 13px 40px; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 15px; font-weight: 600;">
            Explore More Jobs &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px 0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
      You are receiving this because you are a ${isElite ? "Maven Jobs Elite" : "Maven Jobs Pro"} member.<br />
      <a href="${escapeHtml(FRONTEND_URL())}/notifications/preferences" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">Manage preferences</a>
    </p>
  `;

  const html = wrapNaukriLayout(content, {
    title: heading,
    showFeatureGrid: true,
    showAppBanner: true,
    unsubscribeUrl,
  });

  return { subject, html, messageId };
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { buildRecommendationEmail, escapeHtml, buildClickUrl };
