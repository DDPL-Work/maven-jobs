const RecruiterActivity = require("../models/RecruiterActivity");
const User = require("../models/User");

const MAX_ACTIVITY_PER_COMPANY = 300;

const buildRecruiterName = (recruiter = {}) =>
  recruiter.name || recruiter.fullName || recruiter.email || "Recruiter";

const logActivity = async ({ companyId, recruiter = null, action, text, metadata = {} }) => {
  try {
    const doc = await RecruiterActivity.create({
      companyId,
      recruiterId: recruiter?._id || null,
      recruiterName: buildRecruiterName(recruiter),
      action,
      text,
      metadata,
    });

    const recentIds = await RecruiterActivity.find({ companyId })
      .sort({ createdAt: -1 })
      .select("_id")
      .limit(MAX_ACTIVITY_PER_COMPANY)
      .lean();
    const keepIds = recentIds.map((r) => r._id);
    if (keepIds.length >= MAX_ACTIVITY_PER_COMPANY) {
      await RecruiterActivity.deleteMany({ companyId, _id: { $nin: keepIds } });
    }

    return doc;
  } catch (err) {
    console.error("[recruiterActivity] failed to log activity:", err);
    return null;
  }
};

const fireAndForget = (loggerOrPayload) => {
  const promise =
    typeof loggerOrPayload === "function"
      ? loggerOrPayload()
      : Promise.resolve(logActivity(loggerOrPayload));

  promise.catch((err) =>
    console.error("[recruiterActivity] background log failed:", err),
  );
};

const resolveCandidateName = async (candidateId) => {
  try {
    const user = await User.findById(candidateId).select("name email").lean();
    return user?.name || (user?.email ? user.email.split("@")[0] : "Candidate");
  } catch {
    return "Candidate";
  }
};

const logForCandidate = async ({ companyId, recruiter, candidateId, action, text }) => {
  const name = await resolveCandidateName(candidateId);
  const filledText = String(text || "{{candidateName}}").replace(/{{candidateName}}/g, name);
  return logActivity({
    companyId,
    recruiter,
    action,
    text: filledText,
    metadata: { candidateId },
  });
};

module.exports = { logActivity, fireAndForget, logForCandidate };