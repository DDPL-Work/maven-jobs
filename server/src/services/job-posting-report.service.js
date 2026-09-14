const JobPostingReportLog = require("../models/JobPostingReportLog");

/**
 * Service to record job posting activity and expenses into JobPostingReportLog.
 * Runs safely (never crashes caller) with fireAndForget pattern.
 */
const logJobPostingEvent = async ({
  companyId,
  user = null,
  userId = null,
  job = null,
  jobId = null,
  jobTitle = "",
  actionType,
  expense = 0,
  department = "",
  location = "",
  status = "",
  metadata = {},
  actionDate = new Date(),
}) => {
  try {
    const resolvedUserId = userId || user?._id || user?.id || null;
    const resolvedUserName = user?.name || user?.fullName || metadata?.userName || "Recruiter";
    const resolvedUserEmail = user?.email || metadata?.userEmail || "";
    const resolvedAlias = user?.alias || metadata?.alias || "";

    const resolvedJobId = jobId || job?._id || job?.id || null;
    const resolvedJobTitle = jobTitle || job?.title || metadata?.jobTitle || "Untitled Job";
    const resolvedDept = department || job?.department || "General";
    const resolvedLoc = location || job?.location || "";
    const resolvedStatus = status || (job?.isActive ? "Active" : "Closed");

    return await JobPostingReportLog.create({
      companyId,
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      alias: resolvedAlias,
      jobId: resolvedJobId,
      jobTitle: resolvedJobTitle,
      actionType,
      expense: Number(expense) || 0,
      department: resolvedDept,
      location: resolvedLoc,
      status: resolvedStatus,
      metadata,
      actionDate,
    });
  } catch (err) {
    console.error("[jobPostingReport.service] Failed to log job event:", err.message);
    return null;
  }
};

const fireAndForgetJobEvent = (payloadOrFn) => {
  const promise =
    typeof payloadOrFn === "function"
      ? payloadOrFn()
      : Promise.resolve(logJobPostingEvent(payloadOrFn));

  promise.catch((err) =>
    console.error("[jobPostingReport.service] Background log failed:", err)
  );
};

module.exports = {
  logJobPostingEvent,
  fireAndForgetJobEvent,
};
