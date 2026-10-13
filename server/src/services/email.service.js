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

async function sendNewUserCredentialsEmail({
  to,
  name,
  password,
  companyName = "Maven Jobs",
  role = "Recruiter",
  loginUrl,
}) {
  try {
    const targetLoginUrl = loginUrl || `${APP_URL}/employer-login`;
    const displayName = escapeHtml(String(name || "Team Member").trim());
    const displayCompany = escapeHtml(String(companyName || "your company").trim());
    const displayRole = escapeHtml(String(role || "Recruiter").trim());
    const displayPassword = escapeHtml(String(password).trim());
    const displayEmail = escapeHtml(String(to).trim());

    const subject = `Your ${APP_NAME} Account Credentials - Welcome to ${companyName || APP_NAME}`;

    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px 28px;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #002366; line-height: 1.4;">
              Welcome to ${APP_NAME}!
            </h2>
            <p style="margin: 0 0 14px 0; font-size: 15px; color: #475569; line-height: 1.6;">
              Hi <strong>${displayName}</strong>,
            </p>
            <p style="margin: 0 0 18px 0; font-size: 14px; color: #334155; line-height: 1.6;">
              An account has been created for you at <strong>${displayCompany}</strong> on <strong>${APP_NAME}</strong>. Below are your account login credentials:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px; margin-bottom: 16px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Role:</span><br />
                    <span style="font-size: 14px; font-weight: 700; color: #002366;">${displayRole}</span>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Email (Login ID):</span><br />
                    <span style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">${displayEmail}</span>
                  </div>
                  <div>
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">System Generated Password:</span><br />
                    <span style="display: inline-block; margin-top: 4px; padding: 6px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 16px; font-weight: 800; color: #1d4ed8; font-family: monospace; letter-spacing: 0.05em;">${displayPassword}</span>
                  </div>
                </td>
              </tr>
            </table>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5;">
                &#9888; <strong>Security Notice:</strong> This is a system-generated password. For your security, please log in and change your password in your profile settings.
              </p>
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
        <tr>
          <td align="center" style="background-color: #002366; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0, 35, 102, 0.25);">
            <a href="${safeUrl(targetLoginUrl)}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 9999px;">
              Log in to Employer Portal &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
        Best regards,<br /><strong style="color: #1e293b;">The ${APP_NAME} Team</strong>
      </p>
    `;

    const html = wrapNaukriLayout(content, {
      title: subject,
      showFeatureGrid: false,
      showAppBanner: true,
    });

    const text = `Welcome to ${APP_NAME}!\n\nHi ${name},\n\nAn account has been created for you at ${companyName || APP_NAME}.\n\nYour Login Credentials:\n- Email: ${to}\n- System Generated Password: ${password}\n- Role: ${role}\n- Login URL: ${targetLoginUrl}\n\nFor your security, please log in and change your password upon your first login.\n\nBest regards,\nThe ${APP_NAME} Team`;

    const result = await emailModule.sendEmail({ to, subject, html, text });

    logger.info("[email:newUserCredentials] Sent successfully", {
      to,
      subject,
      messageId: result?.messageId,
    });

    return {
      success: true,
      messageId: result?.messageId,
    };
  } catch (error) {
    logger.warn("[email:newUserCredentials] Send failed", {
      to,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendPasswordChangedNotificationEmail({
  to,
  name,
  newPassword,
  companyName = "Maven Jobs",
  changedByName = "Company Administrator",
  loginUrl,
}) {
  try {
    const targetLoginUrl = loginUrl || `${APP_URL}/employer-login`;
    const displayName = escapeHtml(String(name || "Team Member").trim());
    const displayCompany = escapeHtml(String(companyName || "your company").trim());
    const displayChangedBy = escapeHtml(String(changedByName || "Administrator").trim());
    const displayPassword = escapeHtml(String(newPassword).trim());
    const displayEmail = escapeHtml(String(to).trim());

    const subject = `Your ${APP_NAME} Password Has Been Changed - ${companyName || APP_NAME}`;

    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px 28px;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #002366; line-height: 1.4;">
              Password Updated Successfully
            </h2>
            <p style="margin: 0 0 14px 0; font-size: 15px; color: #475569; line-height: 1.6;">
              Hi <strong>${displayName}</strong>,
            </p>
            <p style="margin: 0 0 18px 0; font-size: 14px; color: #334155; line-height: 1.6;">
              Your password for <strong>${displayCompany}</strong> on <strong>${APP_NAME}</strong> has been updated by <strong>${displayChangedBy}</strong> from the team management portal. Below are your updated account details:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px; margin-bottom: 16px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Email (Login ID):</span><br />
                    <span style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">${displayEmail}</span>
                  </div>
                  <div>
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">New Password:</span><br />
                    <span style="display: inline-block; margin-top: 4px; padding: 6px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 16px; font-weight: 800; color: #1d4ed8; font-family: monospace; letter-spacing: 0.05em;">${displayPassword}</span>
                  </div>
                </td>
              </tr>
            </table>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5;">
                &#9888; <strong>Important:</strong> If you did not request or expect this change, please contact your company administrator immediately.
              </p>
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
        <tr>
          <td align="center" style="background-color: #002366; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0, 35, 102, 0.25);">
            <a href="${safeUrl(targetLoginUrl)}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 9999px;">
              Log in to Employer Portal &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
        Best regards,<br /><strong style="color: #1e293b;">The ${APP_NAME} Team</strong>
      </p>
    `;

    const html = wrapNaukriLayout(content, {
      title: subject,
      showFeatureGrid: false,
      showAppBanner: true,
    });

    const text = `Password Updated - ${APP_NAME}\n\nHi ${name},\n\nYour account password for ${companyName || APP_NAME} has been changed by ${changedByName}.\n\nYour Updated Login Credentials:\n- Email: ${to}\n- New Password: ${newPassword}\n- Login URL: ${targetLoginUrl}\n\nIf you did not expect this change, please contact your administrator immediately.\n\nBest regards,\nThe ${APP_NAME} Team`;

    const result = await emailModule.sendEmail({ to, subject, html, text });

    logger.info("[email:passwordChanged] Sent successfully", {
      to,
      subject,
      messageId: result?.messageId,
    });

    return {
      success: true,
      messageId: result?.messageId,
    };
  } catch (error) {
    logger.warn("[email:passwordChanged] Send failed", {
      to,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendApplicationConfirmation,
  sendVideoCallEmail,
  sendOrderConfirmationEmail,
  sendNewUserCredentialsEmail,
  sendPasswordChangedNotificationEmail,
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

async function sendOrderConfirmationEmail(params) {
  try {
    const result = await emailModule.sendOrderConfirmationEmail(params);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
