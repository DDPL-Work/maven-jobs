const cron = require("node-cron");
const CandidateReminder = require("../models/CandidateReminder");
const User = require("../models/User");
const CandidateProfile = require("../models/CandidateProfile");
const emailService = require("../services/email.service");

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

          const htmlMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2563eb; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Candidate Reminder: ${reminder.type}</h2>
              <p style="font-size: 16px; color: #333;">Hello ${employer.name || 'Recruiter'},</p>
              <p style="font-size: 16px; color: #333;">This is your scheduled reminder regarding <strong>${candidate.name}</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0f172a;">Reminder Details</h3>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${reminder.description || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${reminder.type}</p>
                <h3 style="margin-top: 15px; color: #0f172a;">Candidate Details</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${candidate.name}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> ${candidateRole}</p>
                
                <div style="margin-top: 25px; text-align: center;">
                  <a href="${candidateUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View Candidate Profile
                  </a>
                </div>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Log in to your Maven employer dashboard to view this candidate's full profile.</p>
            </div>
          `;

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
