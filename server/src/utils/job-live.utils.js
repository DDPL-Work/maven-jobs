/**
 * Utility functions for checking and filtering live jobs for candidate-facing portals.
 * Business Rule:
 * When an employer posts a job (SMB Job, Hot Vacancy, Internship, Standard),
 * the job remains live on the candidate portal for the set number of days (default 30 days).
 * After the live duration ends (liveUntil < now or deadline < now):
 * - Candidate portal HIDES the job from search, listings, recommendations, and detail pages.
 * - Candidates cannot apply to the job.
 * - In Employer/Recruiter dashboard, the job is NOT unlisted. The employer/recruiter can still
 *   see the job, its status ("expired"), and all candidate applications/responses.
 */

function getCandidateLiveJobFilter(extraConditions = {}) {
  const now = new Date();
  return {
    isActive: true,
    approvalStatus: "APPROVED",
    $or: [
      { liveUntil: { $gte: now } },
      { liveUntil: { $exists: false }, deadline: { $gte: now } },
      { liveUntil: null, deadline: { $gte: now } },
      {
        liveUntil: { $exists: false },
        deadline: { $exists: false },
        createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      {
        liveUntil: null,
        deadline: null,
        createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    ],
    ...extraConditions,
  };
}

function isJobLiveForCandidate(job) {
  if (!job) return false;
  if (!job.isActive || job.approvalStatus !== "APPROVED") return false;
  const now = new Date();
  if (job.liveUntil && new Date(job.liveUntil) < now) return false;
  if (job.deadline && new Date(job.deadline) < now) return false;
  if (!job.liveUntil && !job.deadline && job.createdAt) {
    const age = now.getTime() - new Date(job.createdAt).getTime();
    if (age > 30 * 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

module.exports = {
  getCandidateLiveJobFilter,
  isJobLiveForCandidate,
};
