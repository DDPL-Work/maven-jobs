const APP_NAME = process.env.APP_NAME || "Maven CRM QR";
const APP_URL = process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "";

const wrapLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title></title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding:0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:32px 32px 0 32px;background-color:#163060;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${APP_NAME}</h1>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#a0b4d6;">Transactional email service</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 24px 32px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
                            You are receiving this email because you have an account with ${APP_NAME}.
                            If you did not expect this email, you can safely ignore it.
                          </p>
                          <p style="margin:8px 0 0 0;font-size:12px;color:#94a3b8;">
                            &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const wrapCompanyLayout = (content, { companyName, companyWebsite, headerSubtext = "Video Call Invitation" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title></title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding:0 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:32px 32px 0 32px;background-color:#163060;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${escapeHtml(companyName || "Our Company")}</h1>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#a0b4d6;">${escapeHtml(headerSubtext)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 24px 32px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
                            You are receiving this email from ${escapeHtml(companyName || "Our Company")}.
                            ${companyWebsite ? `<br />Website: <a href="${safeUrl(companyWebsite)}" style="color:#163060;">${escapeHtml(companyWebsite)}</a>` : ""}
                          </p>
                          <p style="margin:8px 0 0 0;font-size:12px;color:#94a3b8;">
                            &copy; ${new Date().getFullYear()} ${escapeHtml(companyName || "Our Company")}. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const buildWelcomeHtml = ({ name }) => {
  const displayName = String(name || "").trim() || "there";

  return wrapLayout(`
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;">Welcome to ${APP_NAME}</h2>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${displayName},</p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      Your account has been created successfully. You can now explore job opportunities,
      track your applications, and stay connected with hiring companies — all from your personalised dashboard.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background-color:#163060;border-radius:8px;padding:12px 28px;">
          <a href="${APP_URL}/login" target="_blank" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
            Sign in to your account
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
      If you have any questions, please reach out to our support team.
    </p>
    <p style="margin:8px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">Best regards,<br />The ${APP_NAME} Team</p>
  `);
};

const buildPasswordResetHtml = ({ name, resetLink }) => {
  const displayName = String(name || "").trim() || "there";
  const link = String(resetLink || "").trim();

  return wrapLayout(`
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</h2>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${displayName},</p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      We received a request to reset the password for your ${APP_NAME} account.
      Click the button below to set a new password. This link will expire in 1 hour.
    </p>
    ${link ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background-color:#163060;border-radius:8px;padding:12px 28px;">
          <a href="${link}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
            Reset password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:13px;color:#64748b;">
      Or copy this link into your browser:<br />
      <a href="${link}" style="color:#163060;word-break:break-all;">${link}</a>
    </p>
    ` : `
    <p style="margin:16px 0 0 0;font-size:14px;color:#dc2626;font-weight:600;">
      A reset link could not be generated. Please request a new password reset.
    </p>
    `}
    <p style="margin:20px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
    <p style="margin:8px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">Best regards,<br />The ${APP_NAME} Team</p>
  `);
};

const buildOTPHtml = ({ name, otp }) => {
  const displayName = String(name || "").trim() || "there";
  const code = String(otp || "").trim();

  return wrapLayout(`
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;">Your OTP code</h2>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${displayName},</p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      Use the following one-time password to complete your action. This code is valid for 10 minutes.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="background-color:#f0f4ff;border-radius:8px;padding:20px 40px;border:2px dashed #163060;">
          <span style="font-size:36px;font-weight:700;color:#163060;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</span>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:13px;color:#64748b;">
      If you did not request this code, you can safely ignore this email.
    </p>
    <p style="margin:8px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">Best regards,<br />The ${APP_NAME} Team</p>
  `);
};

const buildJobApplicationConfirmationHtml = ({ name, jobTitle, companyName }) => {
  const displayName = String(name || "").trim() || "there";
  const role = String(jobTitle || "a position").trim();
  const company = String(companyName || "the company").trim();

  return wrapLayout(`
    <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;">Application submitted</h2>
    <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${displayName},</p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      Your application for <strong>${role}</strong> at <strong>${company}</strong> has been submitted successfully.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#f0fdf4;border-radius:8px;padding:16px;">
      <tr>
        <td>
          <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">&#10003; Application received</p>
          <p style="margin:4px 0 0 0;font-size:14px;color:#166534;">
            The hiring team will review your profile and reach out if there is a match.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
      You can track the status of your application from your dashboard.
    </p>
    <p style="margin:8px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">Best regards,<br />The ${APP_NAME} Team</p>
  `);
};

// const buildVideoCallHtml = ({ candidateName, companyName, date, time, link, reason }) => {
//   const displayName = String(candidateName || "").trim() || "there";
  
//   return wrapLayout(`
//     <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;">Video Call Scheduled</h2>
//     <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${displayName},</p>
//     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
//       <strong>${companyName}</strong> has scheduled a video call with you.
//     </p>
//     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0; width:100%; max-width: 400px; background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius:8px; padding:16px;">
//       <tr>
//         <td style="padding-bottom: 12px;">
//           <strong style="color:#1e293b; font-size:14px;">Date:</strong>
//           <span style="color:#475569; font-size:14px; display:block; margin-top:2px;">${date}</span>
//         </td>
//       </tr>
//       <tr>
//         <td style="padding-bottom: 12px;">
//           <strong style="color:#1e293b; font-size:14px;">Time:</strong>
//           <span style="color:#475569; font-size:14px; display:block; margin-top:2px;">${time}</span>
//         </td>
//       </tr>
//       <tr>
//         <td>
//           <strong style="color:#1e293b; font-size:14px;">Agenda/Reason:</strong>
//           <span style="color:#475569; font-size:14px; display:block; margin-top:2px;">${reason}</span>
//         </td>
//       </tr>
//     </table>
    
//     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
//       <tr>
//         <td align="center" style="background-color:#163060;border-radius:8px;padding:12px 28px;">
//           <a href="${link}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
//             Join Video Call
//           </a>
//         </td>
//       </tr>
//     </table>
    
//     <p style="margin:16px 0 0 0;font-size:13px;color:#64748b;">
//       Or copy this link into your browser:<br />
//       <a href="${link}" style="color:#163060;word-break:break-all;">${link}</a>
//     </p>

//     <p style="margin:20px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
//       Please ensure you are ready a few minutes early. We look forward to speaking with you!
//     </p>
//     <p style="margin:8px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">Best regards,<br />The ${companyName} Team</p>
//   `);
// };

// ---------- Helpers ----------

// Prevents HTML injection from user-supplied values
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Only allow http(s) links in the button / fallback link
const safeUrl = (url) => {
  const clean = String(url ?? "").trim();
  return /^https?:\/\//i.test(clean) ? escapeHtml(clean) : "#";
};

// One row inside the details card
const detailRow = (label, value, isLast = false) => `
  <tr>
    <td style="padding:14px 20px;${isLast ? "" : "border-bottom:1px solid #e2e8f0;"}">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">
        ${label}
      </div>
      <div style="font-size:15px;font-weight:600;color:#0f172a;line-height:1.5;">
        ${value}
      </div>
    </td>
  </tr>`;

// One bullet inside a checklist
const listItem = (text) => `
  <li style="margin:0 0 8px 0;font-size:14px;color:#475569;line-height:1.7;">${text}</li>`;

const sectionTitle = (text) => `
  <h3 style="margin:32px 0 12px 0;font-size:16px;font-weight:700;color:#0f172a;">${text}</h3>`;

// ---------- Template ----------

const buildVideoCallHtml = ({
  candidateName,
  companyName,
  companyWebsite,
  date,
  time,
  link,
  reason,
  timezone,        // optional, e.g. "IST (UTC+5:30)"
  duration,        // optional, e.g. "30 minutes"
  position,        // optional, e.g. "Senior Frontend Developer"
  interviewerName, // optional
  supportEmail,    // optional, for reschedule requests
}) => {
  const name = escapeHtml(String(candidateName || "").trim() || "there");
  const company = escapeHtml(String(companyName || "").trim() || "our team");
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time) + (timezone ? ` <span style="font-weight:400;color:#64748b;">(${escapeHtml(timezone)})</span>` : "");
  const safeReason = escapeHtml(reason);
  const href = safeUrl(link);

  const rows = [
    ["Date", safeDate],
    ["Time", safeTime],
    duration ? ["Duration", escapeHtml(duration)] : null,
    position ? ["Position", escapeHtml(position)] : null,
    interviewerName ? ["Hosted by", escapeHtml(interviewerName)] : null,
    ["Agenda", safeReason || "We will share the agenda at the start of the call."],
  ].filter(Boolean);

  const detailsHtml = rows
    .map(([label, value], i) => detailRow(label, value, i === rows.length - 1))
    .join("");

  const contactLine = supportEmail
    ? `simply reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#163060;font-weight:600;text-decoration:underline;">${escapeHtml(supportEmail)}</a>`
    : `simply reply to this email`;

  let introText = "";
  if (reason && reason.toLowerCase().includes("technical")) {
    introText = `Thank you for your time and interest. <strong style="color:#0f172a;">${company}</strong> has scheduled a technical interview with you. We'll dive into your technical background, discuss some engineering challenges, and explore how your skills align with our team.`;
  } else if (reason && reason.toLowerCase().includes("screening")) {
    introText = `Thank you for your time and interest. <strong style="color:#0f172a;">${company}</strong> has scheduled an initial screening call with you. This will be a chance for us to get to know you better, answer any questions you may have, and discuss the next steps together.`;
  } else if (reason && reason.toLowerCase().includes("final")) {
    introText = `Congratulations on making it to the final stages! <strong style="color:#0f172a;">${company}</strong> has scheduled a final round interview with you. We're excited to have this concluding conversation before making a decision.`;
  } else {
    introText = `Thank you for your time and interest. <strong style="color:#0f172a;">${company}</strong> has scheduled a video call with you regarding <strong>${safeReason || "your application"}</strong>. We look forward to our conversation.`;
  }

  const contentHtml = `
    <!-- Preheader (inbox preview text) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#ffffff;">
      Your video call with ${company} is scheduled for ${safeDate} at ${escapeHtml(time)}. Join link inside.
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <!-- Status badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:#e0e9f8;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#163060;">
          Video Call Confirmed
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">
      Your video call is scheduled
    </h2>
    <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;">
      Please review the details below and save the date.
    </p>

    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">Hi ${name},</p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#475569;line-height:1.7;">
      ${introText}
    </p>

    <!-- Details card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
      style="margin:24px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #163060;border-radius:8px;">
      ${detailsHtml}
    </table>

    <!-- CTA button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 12px 0;">
      <tr>
        <td align="center" style="background-color:#163060;border-radius:8px;">
          <a href="${href}" target="_blank"
            style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Join Video Call &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;line-height:1.6;">
      The button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;">
      <a href="${href}" style="color:#163060;word-break:break-all;">${href}</a>
    </p>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 0 0;" />

    ${sectionTitle("How to prepare")}
    <ul style="margin:0;padding:0 0 0 20px;">
      ${listItem("Review the agenda above and note any points or questions you would like to raise.")}
      ${listItem("Keep your resume, portfolio, or any relevant work samples handy for reference.")}
      ${listItem("Be ready to briefly introduce yourself and share your recent experience.")}
      ${listItem("Prepare a few questions about the role, the team, and the company &mdash; we love thoughtful questions.")}
    </ul>

    ${sectionTitle("Quick technical checklist")}
    <ul style="margin:0;padding:0 0 0 20px;">
      ${listItem("Use a stable internet connection, preferably wired or strong Wi-Fi.")}
      ${listItem("Test your camera, microphone, and speakers before the call.")}
      ${listItem("Choose a quiet, well-lit space with a neutral background.")}
      ${listItem("Close unnecessary tabs and applications, and silence notifications.")}
      ${listItem("Join <strong>5&ndash;10 minutes early</strong> so we can start right on time.")}
    </ul>

    ${sectionTitle("What to expect")}
    <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">
      We will begin with a short introduction, followed by a conversation about your background and
      the topics listed in the agenda. You will also have time to ask us anything. If we need anything
      further from you, we will let you know at the end of the call.
    </p>

    <!-- Reschedule notice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0 0 0;">
      <tr>
        <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#92400e;">Need to reschedule?</p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">
            If this time no longer works for you, please let us know at least 24 hours in advance &mdash;
            ${contactLine} &mdash; and we will happily find another slot.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
      We appreciate your time and look forward to speaking with you!
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:#475569;line-height:1.7;">
      Warm regards,<br />
      <strong style="color:#0f172a;">The ${company} Team</strong>
    </p>
  `;
  
  return wrapCompanyLayout(contentHtml, {
    companyName: companyName,
    companyWebsite: companyWebsite,
    headerSubtext: safeReason || "Video Call Invitation"
  });
};

module.exports = {
  wrapLayout,
  buildWelcomeHtml,
  buildPasswordResetHtml,
  buildOTPHtml,
  buildJobApplicationConfirmationHtml,
  buildVideoCallHtml,
};
