const cron = require("node-cron");
const CandidateReminder = require("../models/CandidateReminder");
const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const emailService = require("../services/email.service");
const { wrapNaukriLayout, escapeHtml } = require("../email/templates/layouts");

const initRemindersScheduler = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Find pending reminders that are due
      const dueReminders = await CandidateReminder.find({
        status: "pending",
        date: { $lte: now }
      })
      .populate("userId", "name email")
      .populate("candidateId", "name email");

      if (dueReminders.length === 0) return;

      console.log(`[Reminders Scheduler] Processing ${dueReminders.length} due reminders...`);

      for (const reminder of dueReminders) {
        try {
          const employer = reminder.userId;
          const candidate = reminder.candidateId;
          
          if (!employer || !candidate) {
             reminder.status = "cancelled";
             await reminder.save();
             continue;
          }

          const profile = await CandidateProfile.findOne({ userId: candidate._id }).select("currentTitle headline");
          const candidateRole = profile?.currentTitle || profile?.headline || "Candidate";

          const subject = reminder.description || `Reminder: ${reminder.type} regarding ${candidate.name}`;
          
          const FRONTEND_URL = process.env.PORTAL_URL
 || "http://localhost:5173";
          const candidateUrl = `${FRONTEND_URL}/candidates/${candidate._id}`;

          const content = `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <tr>
                <td style="padding: 24px 28px;">
                  <div style="font-size: 40px; line-height: 20px; font-weight: 700; color: #f59e0b; font-family: Georgia, serif; margin-bottom: 8px;">&ldquo;</div>
                  <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">Candidate Reminder: ${escapeHtml(reminder.type)}</h2>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Hello ${escapeHtml(employer.name || 'Recruiter')},
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                    This is your scheduled reminder regarding <strong>${escapeHtml(candidate.name)}</strong>.
                  </p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px 16px; margin-bottom: 12px;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;"><strong>Subject:</strong> ${escapeHtml(reminder.description || "N/A")}</p>
                        <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;"><strong>Candidate:</strong> ${escapeHtml(candidate.name)}</p>
                        <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Role:</strong> ${escapeHtml(candidateRole)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
              <tr>
                <td align="center" style="background-color: #2563eb; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
                  <a href="${candidateUrl}" target="_blank" style="display: inline-block; padding: 13px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px;">
                    View Candidate Profile &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin: 0 0 12px 0; text-align: center; font-size: 12px; color: #64748b;">
              Log in to your Maven employer dashboard to view this candidate's full profile.
            </p>
          `;

          const htmlMessage = wrapNaukriLayout(content, {
            title: subject,
            showFeatureGrid: false,
            showAppBanner: true,
          });

          await emailService.sendEmail({
            to: employer.email,
            subject: subject,
            html: htmlMessage,
          });

          // Mark as sent
          reminder.status = "sent";
          await reminder.save();
          console.log(`[Reminders Scheduler] Sent reminder email to ${employer.email} for candidate ${candidate.name}`);
        } catch (emailErr) {
          console.error(`[Reminders Scheduler] Failed to send reminder email for ${reminder._id}:`, emailErr);
        }
      }
    } catch (error) {
      console.error("[Reminders Scheduler] Error processing reminders:", error);
    }
  });
};

module.exports = { initRemindersScheduler };
