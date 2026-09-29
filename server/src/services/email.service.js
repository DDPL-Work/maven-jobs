const emailModule = require("../email");
const { wrapNaukriLayout, escapeHtml, safeUrl } = require("../email/templates/layouts");

const logger = require("../config/logger");

const APP_NAME = process.env.APP_NAME || "Maven Jobs";
const APP_URL = process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "";

async function sendEmail({ to, subject, html, text = "" }) {
  try {
    const result = await emailModule.sendEmail({ to, subject, html, text });

    logger.info("[email:legacy] Sent successfully", {
      to,
      subject,
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const safeMessage = process.env.NODE_ENV === "production"
      ? "Failed to send email"
      : error.message;

    logger.warn("[email:legacy] Send failed", {
      to,
      subject,
      error: safeMessage,
    });

    return {
      success: false,
      error: safeMessage,
    };
  }
}

async function sendWelcomeEmail({ to, name }) {
  try {
    const result = await emailModule.sendWelcomeEmail({ to, name });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  try {
    const result = await emailModule.sendPasswordResetEmail({ to, name, resetLink });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendNotificationEmail({ to, name, notification }) {
  try {
    const html = buildNotificationHtml({ name, notification });
    const notifTitle = notification?.title || "New notification";
    const text = `${notifTitle}\n\nHi ${name || "there"},\n\n${notification?.message || ""}\n\nView details: ${notification?.actionUrl || "N/A"}\n\nBest regards,\nThe ${APP_NAME} Team`;

    const result = await emailModule.sendEmail({ to, subject: notifTitle, html, text });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendApplicationConfirmation({ to, name, jobTitle, companyName }) {
  try {
    const result = await emailModule.sendJobApplicationConfirmation({ to, name, jobTitle, companyName });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function buildNotificationHtml({ name, notification }) {
  const displayName = escapeHtml(String(name || "").trim() || "there");
  const title = escapeHtml(String(notification?.title || "New notification").trim());
  const message = escapeHtml(String(notification?.message || "").trim());
  const actionUrl = safeUrl(notification?.actionUrl);
  const category = escapeHtml(String(notification?.category || "Update").trim());

  const content = `
    <!-- Naukri Quote Highlight Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px 28px;">
          <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
          <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">${title}</h2>
          <p style="margin: 0 0 14px 0; font-size: 15px; color: #475569; line-height: 1.6;">
            Hi <strong>${displayName}</strong>,
          </p>
          ${message ? `<p style="margin: 0 0 14px 0; font-size: 14px; color: #334155; line-height: 1.6;">${message}</p>` : ""}
          <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
            Category: <span style="display: inline-block; padding: 2px 8px; background: #e2e8f0; border-radius: 4px; color: #334155; font-weight: 600;">${category}</span>
          </p>
        </td>
      </tr>
    </table>

    ${actionUrl && actionUrl !== "#" ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            View Details &rarr;
          </a>
        </td>
      </tr>
    </table>
    ` : ""}

    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
      Best regards,<br /><strong style="color: #1e293b;">The ${APP_NAME} Team</strong>
    </p>
  `;

  return wrapNaukriLayout(content, {
    title,
    showFeatureGrid: false,
    showAppBanner: true,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendApplicationConfirmation,
  sendVideoCallEmail,
};

async function sendVideoCallEmail({ to, candidateName, companyName, companyWebsite, date, time, link, reason }) {
  try {
    const result = await emailModule.sendVideoCallEmail({ to, candidateName, companyName, companyWebsite, date, time, link, reason });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Failed to send video call email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
