const APP_NAME = process.env.APP_NAME || "Maven Jobs";
const APP_URL = process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "https://naukri-3.vercel.app";

// Helper to escape HTML characters
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Safe URL validator
const safeUrl = (url) => {
  const clean = String(url ?? "").trim();
  return /^https?:\/\//i.test(clean) ? escapeHtml(clean) : "#";
};

// Direct Cloudinary CDN URLs embedded in the HTML template UI (Zero email attachments)
const EMAIL_ASSETS = {
  logo: process.env.MAVEN_LOGO_URL || "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/maven-jobs-brand-logo.png",
  googlePlay: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-google-play.png",
  appleStore: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-apple-store.png",
  facebook: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-facebook.png",
  twitter: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-twitter.png",
  instagram: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-instagram.png",
  linkedin: "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/icon-linkedin.png",
  qr: process.env.MAVEN_QR_DOWNLOAD_URL || "https://res.cloudinary.com/dntt0iavv/image/upload/email-assets/maven-app-download-qr.png",
};

const PLAY_STORE_URL = process.env.PLAY_STORE_URL || "https://play.google.com/store/apps/details?id=com.mavenjobs";
const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/app/maven-jobs/id6440000000";
const DOWNLOAD_URL = `${APP_URL}/download`;

// Maven Jobs Logo URL
const getLogoUrl = () => EMAIL_ASSETS.logo;

// App Download QR Code URL
const getQrCodeUrl = () => EMAIL_ASSETS.qr;

/**
 * Renders the top header:
 * Left: Maven Jobs Logo (styled with image + fallback typography)
 * Right: "Get app" with Google Play and Apple icons
 */
const renderHeader = () => {
  const logoUrl = getLogoUrl();
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
      <tr>
        <td align="left" valign="middle">
          <a href="${APP_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <div style="display: inline-block; vertical-align: middle;">
                    <img src="${logoUrl}" alt="Maven Jobs" width="140" style="display: block; border: 0; width: 140px; height: auto; max-height: 42px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #163060;" />
                  </div>
                </td>
              </tr>
            </table>
          </a>
        </td>
        <td align="right" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #475569; font-weight: 500;">
          <span style="vertical-align: middle; margin-right: 8px;">Get app</span>
          <a href="${PLAY_STORE_URL}" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: middle; margin-right: 8px;" title="Google Play Store">
            <img src="${EMAIL_ASSETS.googlePlay}" alt="Google Play" width="18" height="18" style="display: inline-block; border: 0; vertical-align: middle;" />
          </a>
          <a href="${APP_STORE_URL}" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: middle;" title="Apple App Store">
            <img src="${EMAIL_ASSETS.appleStore}" alt="App Store" width="18" height="18" style="display: inline-block; border: 0; vertical-align: middle;" />
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Renders the 2x2 Feature Cards Grid (Same as Naukri.com screenshot 2):
 * 1. Get real time job application updates -> Browse Jobs >
 * 2. Get discovered by top recruiters -> Upload Resume >
 * 3. Get customised job recommendations -> Update Preferences >
 * 4. Get job updates in your inbox -> Create Alerts >
 */
const renderFeatureGrid = () => {
  return `
    <div style="margin: 32px 0 20px 0; text-align: center;">
      <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Tips to ensure you get the right job!
      </h3>
      <p style="margin: 0; font-size: 13px; color: #2563eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Explore on <a href="${APP_URL}/jobs" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: none;">Maven Jobs app</a> to make the most of these features
      </p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td width="50%" valign="top" style="padding: 0 6px 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; height: 100%;">
            <tr>
              <td>
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #fef3c7; text-align: center; line-height: 34px; font-size: 16px; margin-bottom: 12px;">&#128269;</div>
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Get real time job application updates
                </p>
                <a href="${APP_URL}/jobs" target="_blank" style="font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Browse Jobs &rsaquo;
                </a>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" valign="top" style="padding: 0 0 12px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; height: 100%;">
            <tr>
              <td>
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #e0f2fe; text-align: center; line-height: 34px; font-size: 16px; margin-bottom: 12px;">&#128196;</div>
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Get discovered by top recruiters
                </p>
                <a href="${APP_URL}/candidate/profile" target="_blank" style="font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Upload Resume &rsaquo;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td width="50%" valign="top" style="padding: 0 6px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; height: 100%;">
            <tr>
              <td>
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #fef08a; text-align: center; line-height: 34px; font-size: 16px; margin-bottom: 12px;">&#128188;</div>
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Get customised job recommendations
                </p>
                <a href="${APP_URL}/notifications/preferences" target="_blank" style="font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Update Preferences &rsaquo;
                </a>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" valign="top" style="padding: 0 0 0 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 16px; height: 100%;">
            <tr>
              <td>
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #fee2e2; text-align: center; line-height: 34px; font-size: 16px; margin-bottom: 12px;">&#128276;</div>
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Get job updates in your inbox
                </p>
                <a href="${APP_URL}/candidate/alerts" target="_blank" style="font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Create Alerts &rsaquo;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Renders the App Download Banner (Naukri.com screenshot 2 & 3):
 * Left: "Applies are a click away on the Maven app", Available on, "Get App" orange button
 * Right: QR code card with "Scan to download"
 */
const renderAppDownloadBanner = () => {
  const qrUrl = getQrCodeUrl();
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f7ff; border: 1px solid #e0f2fe; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
      <tr>
        <td valign="middle" align="left">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            Applies are a click away on the Maven app
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; margin-bottom: 14px;">
            Available on
            <a href="${PLAY_STORE_URL}" target="_blank" style="text-decoration: none; vertical-align: middle; margin: 0 3px 0 6px;">
              <img src="${EMAIL_ASSETS.googlePlay}" alt="Google Play" width="16" height="16" style="vertical-align: middle; display: inline-block; border: 0;" />
            </a>
            <a href="${APP_STORE_URL}" target="_blank" style="text-decoration: none; vertical-align: middle; margin-left: 3px;">
              <img src="${EMAIL_ASSETS.appleStore}" alt="App Store" width="16" height="16" style="vertical-align: middle; display: inline-block; border: 0;" />
            </a>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="background-color: #f97316; border-radius: 9999px;">
                <a href="${DOWNLOAD_URL}" target="_blank" style="display: inline-block; padding: 8px 24px; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 9999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Get App
                </a>
              </td>
            </tr>
          </table>
        </td>
        <td valign="middle" align="right" width="115" style="padding-left: 16px;">
          <a href="${DOWNLOAD_URL}" target="_blank" style="text-decoration: none; display: inline-block; text-align: center;">
            <div style="background: #ffffff; padding: 6px; border: 1px solid #dbeafe; border-radius: 8px; display: inline-block; text-align: center;">
              <img src="${qrUrl}" alt="Scan QR" width="80" height="80" style="display: block; border: 0;" />
              <span style="display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #64748b; margin-top: 4px;">Scan to download</span>
            </div>
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Universal Footer (Identical Across EVERY template, matching Naukri.com screenshot 3):
 * 1. Social icons (Facebook, Twitter/X, Instagram, LinkedIn)
 * 2. Unsubscribe | Report a problem | Terms & Conditions | Privacy Policy
 * 3. System generated email advisory
 * 4. Anti-fraud / Security advice: "Please do not pay any money to anyone..."
 * 5. Copyright
 */
const renderUniversalFooter = ({ unsubscribeUrl, supportUrl } = {}) => {
  const unsubsLink = unsubscribeUrl || `${APP_URL}/notifications/preferences`;
  const reportLink = supportUrl || `${APP_URL}/contact`;
  const currentYear = new Date().getFullYear();

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 20px 28px 20px; text-align: center;">
      <!-- Social Media Icons -->
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 6px;">
                <a href="https://facebook.com/mavenjobs" target="_blank" style="text-decoration: none; display: inline-block;" title="Facebook">
                  <img src="${EMAIL_ASSETS.facebook}" alt="Facebook" width="22" height="22" style="display: block; border: 0;" />
                </a>
              </td>
              <td style="padding: 0 6px;">
                <a href="https://twitter.com/mavenjobs" target="_blank" style="text-decoration: none; display: inline-block;" title="Twitter / X">
                  <img src="${EMAIL_ASSETS.twitter}" alt="Twitter" width="22" height="22" style="display: block; border: 0;" />
                </a>
              </td>
              <td style="padding: 0 6px;">
                <a href="https://instagram.com/mavenjobs" target="_blank" style="text-decoration: none; display: inline-block;" title="Instagram">
                  <img src="${EMAIL_ASSETS.instagram}" alt="Instagram" width="22" height="22" style="display: block; border: 0;" />
                </a>
              </td>
              <td style="padding: 0 6px;">
                <a href="https://linkedin.com/company/mavenjobs" target="_blank" style="text-decoration: none; display: inline-block;" title="LinkedIn">
                  <img src="${EMAIL_ASSETS.linkedin}" alt="LinkedIn" width="22" height="22" style="display: block; border: 0;" />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Utility Links -->
      <tr>
        <td align="center" style="padding-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b;">
          <a href="${unsubsLink}" target="_blank" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
          &nbsp;&#124;&nbsp;
          <a href="${reportLink}" target="_blank" style="color: #64748b; text-decoration: underline;">Report a problem</a>
          &nbsp;&#124;&nbsp;
          <a href="${APP_URL}/terms" target="_blank" style="color: #64748b; text-decoration: underline;">Terms &amp; Conditions</a>
          &nbsp;&#124;&nbsp;
          <a href="${APP_URL}/privacy" target="_blank" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
        </td>
      </tr>

      <!-- Disclaimer & Anti-Fraud Notice -->
      <tr>
        <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.6; color: #94a3b8; max-width: 520px;">
          <p style="margin: 0 0 10px 0;">
            You have received this mail because your e-mail ID is registered with MavenJobs.com. This is a system-generated e-mail, please don't reply to this message.
          </p>
          <p style="margin: 0 0 12px 0;">
            Please do not pay any money to anyone who promises to find you a job. Maven Jobs shall not have any responsibility in this regard. We recommend that you visit our <a href="${APP_URL}/terms" target="_blank" style="color: #2563eb; text-decoration: underline;">Terms &amp; Conditions</a> and the <a href="${APP_URL}/security-advice" target="_blank" style="color: #2563eb; text-decoration: underline;">Security Advice</a> for more information.
          </p>
          <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
            &copy; ${currentYear} ${APP_NAME}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Core Naukri-style wrapper that encapsulates the entire email canvas.
 */
const wrapNaukriLayout = (content, options = {}) => {
  const showFeatureGrid = options.showFeatureGrid ?? false;
  const showAppBanner = options.showAppBanner ?? true;
  const unsubscribeUrl = options.unsubscribeUrl;
  const supportUrl = options.supportUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(options.title || APP_NAME)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 0 16px;">
              <!-- Main White Card Container -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border: 1px solid #eef2f6;">
                <!-- Header with Maven Jobs Logo & App Badges -->
                <tr>
                  <td>
                    ${renderHeader()}
                  </td>
                </tr>

                <!-- Main Content Body -->
                <tr>
                  <td style="padding: 28px 32px 16px 32px;">
                    ${content}

                    <!-- 2x2 Feature Grid (if enabled) -->
                    ${showFeatureGrid ? renderFeatureGrid() : ""}

                    <!-- App Download Banner (if enabled) -->
                    ${showAppBanner ? renderAppDownloadBanner() : ""}
                  </td>
                </tr>

                <!-- Universal Standard Footer -->
                <tr>
                  <td style="background-color: #ffffff; border-top: 1px solid #f1f5f9;">
                    ${renderUniversalFooter({ unsubscribeUrl, supportUrl })}
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
};

// Backward-compatible alias for existing imports
const wrapLayout = (content, options) => wrapNaukriLayout(content, options);

/**
 * 1. Welcome Email (Exact Replica of Naukri.com Screenshot 1 & 2)
 */
const buildWelcomeHtml = ({ name, fullName }) => {
  const displayName = String(name || fullName || "").trim() || "there";

  const content = `
    <!-- Top Greeting Subtitle & Main Title -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 15px; color: #64748b; font-weight: 500;">
        Welcome to Maven Jobs, ${escapeHtml(displayName)}!
      </p>
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.25;">
        A message from our CEO
      </h1>
    </div>

    <!-- The Signature Naukri Highlight / Quote Card -->
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
      
      <!-- CEO Signature Row -->
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
            Get Started
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapNaukriLayout(content, {
    title: `Welcome to ${APP_NAME}`,
    showFeatureGrid: true,
    showAppBanner: true,
  });
};

/**
 * 2. Password Reset Email
 */
const buildPasswordResetHtml = ({ name, fullName, resetLink }) => {
  const displayName = String(name || fullName || "").trim() || "there";
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
      Hi ${escapeHtml(displayName)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      We received a request to reset the password for your ${APP_NAME} account. Click the button below to choose a new password. This link will expire in 1 hour.
    </p>

    ${link ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${link}" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      <strong>Button not working?</strong> Copy and paste this link into your browser:<br />
      <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
    </div>
    ` : `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 14px; color: #dc2626; font-weight: 600;">
      A reset link could not be generated. Please request a new password reset.
    </div>
    `}

    <p style="margin: 20px 0 28px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      If you did not make this request, you can safely ignore this email &mdash; your password will remain unchanged.
    </p>
  `;

  return wrapNaukriLayout(content, {
    title: `Reset your ${APP_NAME} password`,
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 3. OTP Verification Email
 */
const buildOTPHtml = ({ name, fullName, otp, purpose }) => {
  const displayName = String(name || fullName || "").trim() || "there";
  const code = String(otp || "").trim();
  const subtitle = purpose === "login" ? "Your Login Verification Code" : "Verify Your Email";
  const expiryMinutes = purpose === "login" ? "5" : "10";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b; font-weight: 500;">
        ${subtitle}
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        One-Time Verification Code
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7; text-align: center;">
      Hi ${escapeHtml(displayName)}, use the code below to complete your verification:
    </p>

    <!-- OTP Code Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="background-color: #f0f7ff; border-radius: 12px; padding: 18px 44px; border: 2px dashed #2563eb;">
          <span style="font-size: 38px; font-weight: 800; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${code}</span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b; text-align: center;">
      &#9201; This code expires in <strong>${expiryMinutes} minutes</strong>. Please do not share it with anyone.
    </p>
  `;

  return wrapNaukriLayout(content, {
    title: `Your OTP code — ${APP_NAME}`,
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

/**
 * 4. Job Application Submitted Confirmation
 */
const buildJobApplicationConfirmationHtml = ({ name, fullName, jobTitle, companyName }) => {
  const displayName = String(name || fullName || "").trim() || "there";
  const role = String(jobTitle || "a position").trim();
  const company = String(companyName || "the company").trim();

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
      Hi ${escapeHtml(displayName)},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Your application for <strong>${escapeHtml(role)}</strong> at <strong>${escapeHtml(company)}</strong> has been received successfully.
    </p>

    <!-- Application Status Box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <tr>
        <td>
          <div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 4px;">
            &#10003; Successfully delivered to hiring team
          </div>
          <div style="font-size: 13px; color: #15803d; line-height: 1.5;">
            The recruiters at ${escapeHtml(company)} will review your profile and reach out if there is a match.
          </div>
        </td>
      </tr>
    </table>

    <!-- Track Application CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${APP_URL}/candidate/applications" target="_blank" style="display: inline-block; padding: 13px 38px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Track Application Status
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapNaukriLayout(content, {
    title: `Application submitted — ${role} at ${company}`,
    showFeatureGrid: true,
    showAppBanner: true,
  });
};

/**
 * 5. Video Call / Interview Invitation
 */
const buildVideoCallHtml = ({
  candidateName,
  companyName,
  companyWebsite,
  date,
  time,
  link,
  reason,
  timezone,
  duration,
  position,
  interviewerName,
  supportEmail,
}) => {
  const name = escapeHtml(String(candidateName || "").trim() || "there");
  const company = escapeHtml(String(companyName || "").trim() || "our team");
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time) + (timezone ? ` (${escapeHtml(timezone)})` : "");
  const safeReason = escapeHtml(reason);
  const href = safeUrl(link);

  const detailRow = (label, value) => `
    <tr>
      <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">
          ${label}
        </span>
        <span style="font-size: 14px; font-weight: 600; color: #0f172a;">
          ${value}
        </span>
      </td>
    </tr>
  `;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #2563eb;">
        Video Call Invitation
      </p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Interview Scheduled with ${company}
      </h1>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.7;">
      <strong>${company}</strong> has scheduled a video interview with you regarding <strong>${safeReason || "your application"}</strong>. Please find the confirmed details below:
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 20px 0 24px 0;">
      ${detailRow("Date", safeDate)}
      ${detailRow("Time", safeTime)}
      ${duration ? detailRow("Duration", escapeHtml(duration)) : ""}
      ${position ? detailRow("Position", escapeHtml(position)) : ""}
      ${interviewerName ? detailRow("Hosted By", escapeHtml(interviewerName)) : ""}
      ${detailRow("Agenda", safeReason || "Interview discussion")}
    </table>

    <!-- Join Call CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto 16px auto;">
      <tr>
        <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
            Join Video Call &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; text-align: center; font-size: 12px; color: #64748b;">
      Meeting link: <a href="${href}" style="color: #2563eb; word-break: break-all;">${href}</a>
    </p>
  `;

  return wrapNaukriLayout(content, {
    title: `Video Call Scheduled with ${company}`,
    showFeatureGrid: false,
    showAppBanner: true,
  });
};

module.exports = {
  wrapNaukriLayout,
  wrapLayout,
  renderHeader,
  renderFeatureGrid,
  renderAppDownloadBanner,
  renderUniversalFooter,
  buildWelcomeHtml,
  buildPasswordResetHtml,
  buildOTPHtml,
  buildJobApplicationConfirmationHtml,
  buildVideoCallHtml,
  escapeHtml,
  safeUrl,
};
