import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { useDashboard } from "../../../../hooks/useCandidateQueries";
import HourglassLoader from "../../../../components/HourglassLoader";
import CandidateHeader from "../../../../components/common/CandidateHeader";
import LandingFooter from "../../../../components/LandingFooter";
import RecommendedJobs from "../jobs/RecommendedJobs";
import { CareerPreferencesSidebar } from "./HomeDashboard";
import "./RecommendedJobsPage.css";
import "./ProfileDashboard.css";

const colors = [
  { bg: "#EEF2FF", col: "#4338CA" },
  { bg: "#FFF7ED", col: "#C2410C" },
  { bg: "#F0FDF4", col: "#15803D" },
  { bg: "#EFF6FF", col: "#1D4ED8" },
  { bg: "#FDF2F8", col: "#9D174D" },
  { bg: "#FEF3C7", col: "#92400E" },
  { bg: "#E0E7FF", col: "#3730A3" },
];

const formatSalary = (min, max) => {
  if (!min && !max) return null;
  const toL = (v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`);
  if (min && max) return `${toL(min)} - ${toL(max)} P.A.`;
  if (max) return `Up to ${toL(max)} P.A.`;
  return `${toL(min)}+ P.A.`;
};

const buildTags = (job) => {
  const tagSet = new Set();
  if (job.workplaceType) tagSet.add(job.workplaceType);
  if (job.jobType) tagSet.add(job.jobType);
  if (job.department && job.department.length < 25)
    tagSet.add(job.department);
  if (Array.isArray(job.skills)) {
    job.skills.slice(0, 4).forEach((s) => tagSet.add(s));
  }
  if (tagSet.size === 0) tagSet.add("Full-Time");
  return [...tagSet].slice(0, 5);
};

const formatJobData = (job, idx) => ({
  ...job,
  id: job._id || job.id,
  title: job.title,
  company: job.companyName,
  loc: job.location || "Remote",
  ago: job.lastUpdated || "Recent",
  exp: job.experience,
  desc: job.description
    ? `Preferred candidate profile: ${job.description}`
    : job.desc || "",
  tags: buildTags(job),
  salaryFormatted: formatSalary(job.salaryMin, job.salaryMax),
  code: job.title ? job.title.substring(0, 2).toUpperCase() : "JB",
  bg: colors[idx % colors.length].bg,
  col: colors[idx % colors.length].col,
  companyLogoUrl: job.companyLogoUrl || "",
});

export default function RecommendedJobsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [recommendedJobs, setRecommendedJobs] = useState({});
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPreferencesSidebar, setShowPreferencesSidebar] = useState(false);

  const dashboardQuery = useDashboard(!!user);
  const { data: dashboardData } = dashboardQuery;

  useEffect(() => {
    if (!dashboardData) return; 
    if (dashboardData.recommendedJobs) {
      const mappedJobs = {};
      const sortedKeys = Object.keys(dashboardData.recommendedJobs).sort((a, b) => {
        if (a.toLowerCase().includes("applies")) return -1;
        if (b.toLowerCase().includes("applies")) return 1;
        return 0;
      });
      sortedKeys.forEach((key) => {
        mappedJobs[key] = dashboardData.recommendedJobs[key].map(
          (job, idx) => formatJobData(job, idx),
        );
      });
      setRecommendedJobs(mappedJobs);
    }
    if (dashboardData.profile) setCandidateProfile(dashboardData.profile);
    setPageLoading(false);
  }, [dashboardData]);

  if (!user) return <Navigate to="/" />;
  if (pageLoading) return <HourglassLoader />;

  return (
    <div className="rjp-root">
      <CandidateHeader />

      <div className="rjp-page">
        <RecommendedJobs
          recommendedJobs={recommendedJobs}
          candidateProfile={candidateProfile}
          onEditPreferences={() => setShowPreferencesSidebar(true)}
          initialTab={location.state?.tab}
        />
      </div>

      <LandingFooter />

      {showPreferencesSidebar && (
        <CareerPreferencesSidebar
          candidateProfile={candidateProfile}
          onClose={() => setShowPreferencesSidebar(false)}
          onSaved={(updated) => {
            setCandidateProfile((prev) => ({ ...prev, ...updated }));
            setShowPreferencesSidebar(false);
            dashboardQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
