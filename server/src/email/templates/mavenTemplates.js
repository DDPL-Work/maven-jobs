const {
  wrapNaukriLayout,
  renderFeatureGrid,
  renderAppDownloadBanner,
  escapeHtml,
  safeUrl,
} = require("./layouts");

const APP_NAME = "Maven Jobs";
const APP_URL = process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "https://naukri-3.vercel.app";

/**
 * Common Naukri-style wrapper for all 14 Maven templates.
 * Guarantees identical header (with Maven Jobs logo) and identical universal footer across every template.
 */
const mavenWrapLayout = (content, options = {}) => {
  return wrapNaukriLayout(content, {
    title: options.title || APP_NAME,
    showFeatureGrid: options.showFeatureGrid ?? false,
    showAppBanner: options.showAppBanner ?? true,
    unsubscribeUrl: options.unsubscribeUrl,
    supportUrl: options.supportUrl,
  });
};

/**
 * 1. Welcome Email (Candidate)
 */
const buildWelcomeHtml = ({ fullName }) => {
  const name = String(fullName || "").trim() || "there";
  const content = `
    <!-- Top Greeting & Header Title -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 15px; color: #64748b; font-weight: 500;">
        Welcome to Maven Jobs, ${escapeHtml(name)}!
      </p>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.25;">
        A message from our CEO
      </h1>
    </div>

    <!-- Naukri Signature Amber Quote Card -->
    <div style="border: 1.5px solid #fde68a; border-radius: 14px; background-color: #ffffff; padding: 24px 26px; margin: 0 0 28px 0; position: relative;">
      <div style="font-family: Georgia, serif; font-size: 46px; line-height: 24px; color: #f59e0b; font-weight: bold; margin-bottom: 12px;">
        &#10077;
      </div>
      <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155; line-height: 1.65;">
        Welcome to the Maven Jobs family of job seekers!
      </p>
      <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155; line-height: 1.65;">
        At Maven Jobs, <strong>we help you get discovered by 5 Lakh+ top recruiters</strong> hiring talent like you.
      </p>
      <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.65;">
        Let us help you get to the next level in your career progression and land you a job you would love to go to!
      </p>
      
      <!-- CEO Signature -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
        <tr>
          <td valign="middle" style="padding-right: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e0f2fe; text-align: center; line-height: 40px; font-size: 18px; font-weight: bold; color: #0284c7;">
              M
            </div>
          </td>
          <td valign="middle">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Leadership Team</div>
            <div style="font-size: 12px; color: #64748b;">CEO &#124; MavenJobs.com</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Blue Pill CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/login" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Complete your profile
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: `Welcome to ${APP_NAME}`,
    showFeatureGrid: true,
    showAppBanner: true,
  });
};

/**
 * 2. OTP Verification & Login Email
 */
const buildOtpHtml = ({ fullName, otp, purpose }) => {
  const name = String(fullName || "").trim() || "there";
  const code = String(otp || "").trim();
  const subtitle = purpose === "login" ? "Your Login Verification Code" : "Verify Your Email";
  const expiryMinutes = purpose === "login" ? "5" : "10";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">
        ${subtitle}
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        ${subtitle}
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7; text-align: center;">
      Hi ${escapeHtml(name)}, use the code below to complete your ${purpose === "login" ? "login" : "email verification"}:
    </p>

    <!-- Code Display Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="background-color: #f0f7ff; border-radius: 12px; padding: 18px 44px; border: 2px dashed #2563eb;">
          <span style="font-size: 38px; font-weight: 800; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${code}</span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b; text-align: center;">
      &#9201; This code expires in <strong>${expiryMinutes} minutes</strong>. Please do not share this code with anyone.
    </p>
  `;

  return mavenWrapLayout(content, {
    title: subtitle,
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 3. Password Reset Email
 */
const buildPasswordResetHtml = ({ fullName, resetLink }) => {
  const name = String(fullName || "").trim() || "there";
  const link = String(resetLink || "").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">
        Account Security
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Reset Your Password
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      We received a request to reset the password for your ${APP_NAME} account. Click the button below to set a new password. This link will expire in 30 minutes.
    </p>

    ${link ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${link}" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Reset password
          </a>
        </td>
      </tr>
    </table>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      <strong>Or copy this link into your browser:</strong><br />
      <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
    </div>
    ` : `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 14px; color: #dc2626; font-weight: 600;">
      A reset link could not be generated. Please request a new password reset.
    </div>
    `}

    <p style="margin: 20px 0 28px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  return mavenWrapLayout(content, {
    title: "Reset Your Password",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 4. Password Changed Security Alert
 */
const buildSecurityAlertHtml = ({ fullName, timestamp, ipAddress }) => {
  const name = String(fullName || "").trim() || "there";
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #dc2626; font-weight: 600;">
        &#9888; Security Alert
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Your Password Was Changed
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your ${APP_NAME} account password was successfully changed. Here are the activity details:
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Time:</strong> ${escapeHtml(timestamp) || "N/A"}</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>IP Address:</strong> ${escapeHtml(ipAddress) || "N/A"}</td></tr>
    </table>

    <p style="margin: 20px 0 24px 0; font-size: 14px; color: #b91c1c; line-height: 1.6; font-weight: 500;">
      If you did not make this change, please contact our support team immediately or reset your password.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
      <tr>
        <td align="center" style="background-color: #dc2626; border-radius: 9999px;">
          <a href="${APP_URL}/forgot-password" target="_blank" style="display: inline-block; padding: 12px 36px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Secure My Account
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Your Password Was Changed",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 5. Application Submitted Confirmation
 */
const buildApplicationConfirmationHtml = ({ fullName, jobTitle, companyName }) => {
  const name = String(fullName || "").trim() || "there";
  const role = String(jobTitle || "a position").trim();
  const company = String(companyName || "a company").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #16a34a; font-weight: 600;">
        &#10003; Application Submitted
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Application Received
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your application for <strong>${escapeHtml(role)}</strong> at <strong>${escapeHtml(company)}</strong> has been received successfully.
    </p>

    <!-- Success Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 700;">&#10003; Application submitted</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #15803d; line-height: 1.5;">
            The hiring team will review your profile and reach out if there is a match.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/candidate/applications" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Track application status
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Application Received",
    showFeatureGrid: true,
    showAppBanner: true,
  });
};

/**
 * 6. Candidate Shortlisted
 */
const buildShortlistedHtml = ({ fullName, jobTitle, companyName }) => {
  const name = String(fullName || "").trim() || "there";
  const role = String(jobTitle || "the position").trim();
  const company = String(companyName || "the company").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        Great News!
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        You've Been Shortlisted
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Great news! Your application for <strong>${escapeHtml(role)}</strong> at <strong>${escapeHtml(company)}</strong> has been shortlisted.
    </p>

    <!-- Shortlisted Highlight Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 700;">&#10003; Application shortlisted</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #1d4ed8; line-height: 1.5;">
            The recruiter will reach out to schedule an interview soon.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/applications" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            View application status
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "You've Been Shortlisted",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 7. Candidate Application Rejected
 */
const buildRejectedHtml = ({ fullName, jobTitle, companyName }) => {
  const name = String(fullName || "").trim() || "there";
  const role = String(jobTitle || "the position").trim();
  const company = String(companyName || "the company").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">
        Status Update
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Application Status Update
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Thank you for your interest in the <strong>${escapeHtml(role)}</strong> position at <strong>${escapeHtml(company)}</strong>.
    </p>

    <!-- Notice Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6;">
            After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match the requirements of this role.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 24px 0; font-size: 14px; color: #475569; line-height: 1.7;">
      We encourage you to explore and apply for other positions on ${APP_NAME} that match your background.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/jobs" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Browse more jobs
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Application Status Update",
    showFeatureGrid: true,
    showAppBanner: true,
  });
};

/**
 * 8. Interview Scheduled
 */
const buildInterviewScheduledHtml = ({ fullName, jobTitle, companyName, interviewDate, interviewTime, interviewMode, interviewLink }) => {
  const name = String(fullName || "").trim() || "there";
  const role = String(jobTitle || "the position").trim();
  const company = String(companyName || "the company").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        Interview Scheduled
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Interview Scheduled
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your interview for <strong>${escapeHtml(role)}</strong> at <strong>${escapeHtml(company)}</strong> has been scheduled.
    </p>

    <!-- Details Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px;">
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Date:</strong> ${escapeHtml(interviewDate) || "TBD"}</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Time:</strong> ${escapeHtml(interviewTime) || "TBD"}</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Mode:</strong> ${escapeHtml(interviewMode) || "TBD"}</td></tr>
      ${interviewLink ? `<tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Link:</strong> <a href="${escapeHtml(interviewLink)}" style="color: #2563eb;">${escapeHtml(interviewLink)}</a></td></tr>` : ""}
    </table>

    ${interviewLink ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${escapeHtml(interviewLink)}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Join Interview &rarr;
          </a>
        </td>
      </tr>
    </table>
    ` : ""}

    <p style="margin: 16px 0 28px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      Please ensure you are prepared and have a stable internet connection if the interview is virtual.
    </p>
  `;

  return mavenWrapLayout(content, {
    title: "Interview Scheduled",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 9. Interview Rescheduled
 */
const buildInterviewRescheduledHtml = (params) => {
  const { fullName, jobTitle, companyName } = params;
  const name = String(fullName || "").trim() || "there";
  const role = String(jobTitle || "the position").trim();
  const company = String(companyName || "the company").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #ea580c; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        Schedule Update
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Interview Updated
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your interview for <strong>${escapeHtml(role)}</strong> at <strong>${escapeHtml(company)}</strong> has been rescheduled. Please find the updated details below:
    </p>

    <!-- Details Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px;">
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Date:</strong> ${escapeHtml(params.interviewDate) || "TBD"}</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Time:</strong> ${escapeHtml(params.interviewTime) || "TBD"}</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Mode:</strong> ${escapeHtml(params.interviewMode) || "TBD"}</td></tr>
      ${params.interviewLink ? `<tr><td style="padding: 6px 0; font-size: 14px; color: #475569;"><strong>Link:</strong> <a href="${escapeHtml(params.interviewLink)}" style="color: #2563eb;">${escapeHtml(params.interviewLink)}</a></td></tr>` : ""}
    </table>

    <p style="margin: 16px 0 28px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      If you have any questions, please contact the recruiter directly.
    </p>
  `;

  return mavenWrapLayout(content, {
    title: "Interview Updated",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 10. Offer Letter Issued
 */
const buildOfferIssuedHtml = ({ fullName, companyName, jobTitle, offerLink }) => {
  const name = String(fullName || "").trim() || "there";
  const company = String(companyName || "the company").trim();
  const role = String(jobTitle || "the position").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        &#127881; Congratulations!
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Congratulations! Offer Letter Issued
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      We are pleased to inform you that <strong>${escapeHtml(company)}</strong> has issued an offer letter for the position of <strong>${escapeHtml(role)}</strong>.
    </p>

    <!-- Celebration Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; text-align: center;">
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 18px; color: #166534; font-weight: 800;">Congratulations!</p>
          <p style="margin: 0; font-size: 14px; color: #15803d;">You have received a formal offer from ${escapeHtml(company)}.</p>
        </td>
      </tr>
    </table>

    ${offerLink ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${escapeHtml(offerLink)}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            View offer letter
          </a>
        </td>
      </tr>
    </table>
    ` : ""}

    <p style="margin: 16px 0 28px 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
      Please review the offer letter carefully and respond at your earliest convenience.
    </p>
  `;

  return mavenWrapLayout(content, {
    title: "Congratulations! Offer Letter Issued",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 11. Offer Accepted (Recruiter Notification)
 */
const buildOfferAcceptedRecruiterHtml = ({ candidateName, jobTitle }) => {
  const candidate = String(candidateName || "A candidate").trim();
  const role = String(jobTitle || "a position").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        Offer Response
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Offer Accepted
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      <strong>${escapeHtml(candidate)}</strong> has accepted the offer for the <strong>${escapeHtml(role)}</strong> position.
    </p>

    <!-- Info Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
            &#10003; Candidate accepted the offer. Please proceed with the onboarding process.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/recruiter/applications" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Go to Candidate Pipeline
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Offer Accepted",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 12. Recruiter Welcome
 */
const buildRecruiterWelcomeHtml = ({ fullName }) => {
  const name = String(fullName || "").trim() || "there";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">
        Recruiter Registration
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Welcome to Maven Jobs Recruiter
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your recruiter account has been created successfully. You can now post jobs, review applications, schedule interviews, and manage offers &mdash; all from your recruiter dashboard.
    </p>

    <!-- Highlights Card -->
    <div style="border: 1.5px solid #e2e8f0; border-radius: 12px; background: #f8fafc; padding: 20px 24px; margin: 20px 0 28px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">What you can do with your recruiter account:</p>
      <ul style="margin: 0; padding: 0 0 0 18px; font-size: 14px; color: #475569; line-height: 1.7;">
        <li>Post jobs and reach thousands of verified candidates</li>
        <li>Search resumes and discover relevant talent using smart filters</li>
        <li>Schedule video calls and track candidate stages in real time</li>
      </ul>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/recruiter/login" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Go to dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Welcome to Maven Jobs Recruiter",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 13. Recruiter New Application Received
 */
const buildNewApplicationReceivedHtml = ({ candidateName, jobTitle }) => {
  const candidate = String(candidateName || "A candidate").trim();
  const role = String(jobTitle || "the position").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        Candidate Notification
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        New Application Received
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      <strong>${escapeHtml(candidate)}</strong> has applied for the <strong>${escapeHtml(role)}</strong> role.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px;">
      <tr><td style="padding: 4px 0; font-size: 14px; color: #475569;"><strong>Candidate:</strong> ${escapeHtml(candidate)}</td></tr>
      <tr><td style="padding: 4px 0; font-size: 14px; color: #475569;"><strong>Job Position:</strong> ${escapeHtml(role)}</td></tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/recruiter/applications" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Review application
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "New Application Received",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 14. Recruiter Job Posted Confirmation
 */
const buildJobPostedHtml = ({ jobTitle }) => {
  const role = String(jobTitle || "a position").trim();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">
        &#10003; Job Active
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Job Posted Successfully
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hello,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your job posting for <strong>${escapeHtml(role)}</strong> is now live on ${APP_NAME}. Candidates can start applying immediately.
    </p>

    <!-- Success Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 700;">&#10003; Job is now active</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #15803d; line-height: 1.5;">
            You will receive notifications whenever candidates submit their applications.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/recruiter/jobs" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Manage job postings
          </a>
        </td>
      </tr>
    </table>
  `;

  return mavenWrapLayout(content, {
    title: "Job Posted Successfully",
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

module.exports = {
  mavenWrapLayout,
  buildWelcomeHtml,
  buildOtpHtml,
  buildPasswordResetHtml,
  buildSecurityAlertHtml,
  buildApplicationConfirmationHtml,
  buildShortlistedHtml,
  buildRejectedHtml,
  buildInterviewScheduledHtml,
  buildInterviewRescheduledHtml,
  buildOfferIssuedHtml,
  buildOfferAcceptedRecruiterHtml,
  buildRecruiterWelcomeHtml,
  buildNewApplicationReceivedHtml,
  buildJobPostedHtml,
};
