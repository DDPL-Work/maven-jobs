import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiMapPin, FiBriefcase, FiClock, FiBookmark, FiArrowRight,
  FiShare2, FiMoreVertical, FiCheckCircle, FiXCircle, FiPlus,
  FiChevronRight, FiBookOpen, FiActivity, FiCoffee, FiTruck, FiAward,
  FiBell, FiLogOut, FiShield, FiHeart, FiDollarSign, FiMonitor,
  FiTrendingUp, FiSun, FiGift, FiHeadphones, FiThumbsUp, FiStar as FiStarIcon,
  FiExternalLink, FiAlertTriangle
} from "react-icons/fi";
import { FaRupeeSign, FaStar, FaFacebookF, FaLinkedinIn, FaDumbbell } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useAuth } from "../../../../AuthContext";
import { JOBS, EXTENDED_JOBS } from "../../../../data/jobs";
import authService from "../../../../services/authService";
import ApplicationModal from "../../../../components/application/ApplicationModal";
import useJobApplication from "../../../../hooks/useJobApplication";
import "./JobDetailsPage.css";
import SkeletonPage from "../../../../components/Skeleton";
import { AITrigger } from "../../../../components/LazyAI";
import { aiService } from "../../../../services/aiService";
import LandingFooter from "../../../../components/LandingFooter";
import CandidateHeader from "../../../../components/common/CandidateHeader";

const PERK_MAP = {
  "Health Insurance": { icon: FiShield, color: "#10b981", bg: "#ECFDF5" },
  "Gym": { icon: FiHeart, color: "#ef4444", bg: "#FEF2F2" },
  "Food": { icon: FiCoffee, color: "#f59e0b", bg: "#FFFBEB" },
  "Cab": { icon: FiMapPin, color: "#6366f1", bg: "#EEF2FF" },
  "Bonus": { icon: FiDollarSign, color: "#10b981", bg: "#ECFDF5" },
  "Flexible Hours": { icon: FiClock, color: "#0ea5e9", bg: "#F0F9FF" },
  "Remote": { icon: FiMonitor, color: "#8b5cf6", bg: "#F5F3FF" },
  "Stock Options": { icon: FiTrendingUp, color: "#002366", bg: "#F8FAFC" },
  "Learning": { icon: FiBookmark, color: "#f59e0b", bg: "#FFFBEB" },
  "Vacation": { icon: FiSun, color: "#0ea5e9", bg: "#F0F9FF" },
  "Gifts": { icon: FiGift, color: "#ef4444", bg: "#FEF2F2" },
  "Headphones": { icon: FiHeadphones, color: "#6366f1", bg: "#EEF2FF" },
  "Wellness": { icon: FiThumbsUp, color: "#10b981", bg: "#ECFDF5" },
};

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, openLogin } = useAuth();
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [autoApplyPending, setAutoApplyPending] = useState(searchParams.get("apply") === "true");
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchScoreLoading, setMatchScoreLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [showNoResumeModal, setShowNoResumeModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [companyReviews, setCompanyReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, headline: "", review: "", isAnonymous: false });
  const [showMoreSecurity, setShowMoreSecurity] = useState(false);
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const followUpTimerRef = useRef(null);

  const {
    isModalOpen,
    answers,
    errors,
    isSubmitting,
    isSuccess,
    hasApplied: hasAppliedFromHook,
    hasScreeningQuestions,
    handleApplyClick,
    handleCloseModal,
    handleChange,
    handleSubmit
  } = useJobApplication(job, user);

  const postedDaysAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff < 1) return "Today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  };

  const loadCompanyData = async (companyId) => {
    try {
      const res = await authService.getCompanyDetail(companyId);
      if (res?.success && res?.data) {
        setCompanyData(res.data);
        setCompanyReviews(res.data.reviews || []);
        setIsFollowing(res.data.isFollowing || false);
      }
    } catch (e) {
      // silent — rely on hasFollowedCompany from job detail
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setApplyMessage("");
    setCompanyReviews([]);
    setCompanyData(null);
    setReviewForm({ rating: 5, headline: "", review: "", isAnonymous: false });
    authService.getJobDetail(id).then((res) => {
      if (res?.success && res?.data?.job) {
        const j = res.data.job;
        const companyId = (j.companyId?._id || j.companyId || '').toString();
        const title = j.title || j.role || 'Senior Engineer';
        const company = j.companyId?.name || j.companyName || j.company || 'Enterprise Partner';
        const minSal = j.salaryMin || 0;
        const maxSal = j.salaryMax || 0;
        const salStr = minSal && maxSal ? `${(minSal/100000).toFixed(0)}–${(maxSal/100000).toFixed(0)} Lakhs PA` : (j.salary || 'Negotiable');
        const posted = j.createdAt ? postedDaysAgo(j.createdAt) : (j.posted || 'Recently');

        setJob({
          id: j._id || j.id,
          companyId,
          companyName: j.companyName || company,
          companyLogoUrl: j.companyLogoUrl || "",
          title,
          company,
          rating: j.companyRating || (4.0 + Math.random() * 0.8).toFixed(1),
          reviewsCount: j.companyReviewCount || Math.floor(Math.random() * 800) + 50,
          exp: j.experience || j.exp || 'Not specified',
          salary: salStr,
          location: j.location || 'Not specified',
          posted,
          desc: j.description || j.summary || 'No description provided.',
          tags: j.skills?.length > 0 ? j.skills : ['Full-Time', j.department || 'Engineering'],
          logo: company[0],
          type: j.companyId?.industry || j.industry || 'IT Services',
          dept: j.department || 'Not specified',
          mode: j.workplaceType || 'Not specified',
          openings: j.openings || 0,
          applicants: j.applicantsCount || 0,
          summary: j.summary || '',
          jobDescription: {
            aboutRole: j.description || j.summary || "No description provided.",
            responsibilities: j.responsibilities || [],
            requiredSkills: j.requiredSkills || {
              coreCompetencies: j.skills || [],
              domainKnowledge: [j.department || "Engineering"].filter(Boolean)
            }
          },
          companyInfo: {
            about: j.companyId?.about || `${company} is a leading provider of innovative solutions.`,
            address: j.companyId?.location?.city ? `${j.companyId.location.city}, ${j.companyId.location.region || 'India'}` : "Location not specified"
          },
          matchScore: null,
          skillMatch: null,
          locationMatch: null,
          experienceMatch: null,
          roleMatch: null,
          hasApplied: j.hasApplied || false,
          hasSaved: j.hasSaved || false,
          screeningQuestions: j.screeningQuestions || [],
          externalLink: j.externalLink || '',
        });
        setHasApplied(j.hasApplied || false);
        setIsSaved(j.hasSaved || false);
        setIsFollowing(res.data.hasFollowedCompany || (user ? true : false));

        if (companyId && companyId.length > 6) loadCompanyData(companyId);

        if (res.data.similarJobs?.length > 0) {
          setSimilarJobs(res.data.similarJobs.map((sj) => ({
            id: sj._id || sj.id,
            title: sj.title || 'Software Engineer',
            company: sj.companyId?.name || sj.companyName || sj.company || company,
            companyLogoUrl: sj.companyLogoUrl || sj.companyId?.logoUrl || '',
            companyCoverUrl: sj.companyCoverUrl || sj.companyId?.coverImageUrl || '',
            rating: sj.companyId?.rating || (4.1 + Math.random() * 0.7).toFixed(1),
            reviews: sj.companyId?.reviewsCount || Math.floor(Math.random() * 500) + 30,
            location: sj.location || 'Bengaluru',
            salary: sj.salaryMin && sj.salaryMax ? `${(sj.salaryMin/100000).toFixed(0)}–${(sj.salaryMax/100000).toFixed(0)} LPA` : (sj.salary || ''),
            exp: sj.experience || '',
            posted: sj.createdAt ? postedDaysAgo(sj.createdAt) : 'Recently',
            logo: (sj.companyId?.name || sj.company || 'M')[0]
          })));
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id, searchParams, user]);

  useEffect(() => {
    if (hasAppliedFromHook) {
      setHasApplied(true);
    }
  }, [hasAppliedFromHook]);

  useEffect(() => {
    if (!loading && autoApplyPending) {
      if (!user) {
        openLogin();
        setAutoApplyPending(false);
      } else if (job && !job.hasApplied) {
        if (user.resume?.url) {
          handleApplyClick("QUICK_APPLY");
        } else {
          setShowNoResumeModal(true);
        }
        setAutoApplyPending(false);
      }
    }
  }, [loading, job, user, autoApplyPending, handleApplyClick, openLogin]);

  useEffect(() => {
    if (isSuccess) {
      setHasApplied(true);
      setApplyMessage("Application submitted successfully!");
    }
  }, [isSuccess]);

  useEffect(() => {
    return () => {
      aiService.cancelAll();
    };
  }, []);

  const [matchScoreTriggered, setMatchScoreTriggered] = useState(false);

  useEffect(() => {
    if (!matchScoreTriggered || !job || !user) return;

    let cancelled = false;
    setMatchScoreLoading(true);

    authService.getJobMatchScore(job.id).then((res) => {
      if (!cancelled && res?.success && res?.data) {
        setJob((prev) => ({
          ...prev,
          matchScore: res.data.overall ?? null,
          skillMatch: res.data.skillMatch ?? null,
          locationMatch: res.data.locationMatch ?? null,
          experienceMatch: res.data.experienceMatch ?? null,
          roleMatch: res.data.roleMatch ?? null,
        }));
      }
      setMatchScoreLoading(false);
    }).catch(() => {
      if (!cancelled) setMatchScoreLoading(false);
    });

    return () => { cancelled = true; };
  }, [matchScoreTriggered, job, user]);

  const handleFollowToggle = async () => {
    if (!user) { openLogin(); return; }
    if (!job?.companyId || followLoading) return;
    setFollowLoading(true);
    const newState = !isFollowing;
    setIsFollowing(newState);
    try {
      await authService.followCompany(job.companyId, newState);
    } catch {
      setIsFollowing(!newState);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !job?.companyId) return;
    try {
      const res = await authService.submitCompanyReview(job.companyId, reviewForm);
      if (res?.success) {
        setReviewForm({ rating: 5, headline: "", review: "", isAnonymous: false });
        setShowReviewModal(false);
        loadCompanyData(job.companyId);
      }
    } catch (e) {
      // silent
    }
  };

  const submitApplication = async () => {
    setShowNoResumeModal(false);
    setApplying(true);
    setApplyMessage("");
    try {
      const res = await authService.createApplication({ jobId: job.id });
      if (res?.success) {
        setHasApplied(true);
        setApplyMessage("Application submitted successfully!");
      } else {
        setApplyMessage(res?.message || "Applied successfully!");
        setHasApplied(true);
      }
    } catch (err) {
      setApplyMessage(err?.message || "Applied successfully!");
      setHasApplied(true);
    }
    setApplying(false);
  };

  const handleApply = () => {
    if (!user) {
      openLogin();
      return;
    }
    if (hasApplied) return;
    if (!user.resume?.url) {
      setShowNoResumeModal(true);
      return;
    }
    const questions = job?.screeningQuestions;
    if (questions?.length > 0) {
      handleApplyClick("JOB_DETAILS");
      return;
    }
    submitApplication();
  };

  // We keep this for the "No resume" bypass just in case, or link it to the modal
  const submitWithoutResume = () => {
    setShowNoResumeModal(false);
    handleApplyClick("JOB_DETAILS");
  };

  const handleProceedExternal = () => {
    window.open(job.externalLink, "_blank", "noopener,noreferrer");
    setShowExternalLinkModal(false);
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    followUpTimerRef.current = setTimeout(() => {
      setShowFollowUpModal(true);
    }, 5000);
  };

  const handleAppliedYes = async () => {
    setShowFollowUpModal(false);
    setHasApplied(true);
    setApplyMessage("Application submitted successfully!");
    try {
      await authService.createApplication({ jobId: job.id });
    } catch { /* already tracked locally */ }
  };

  const handleAppliedNo = () => {
    setShowFollowUpModal(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, []);

  const handleSaveJob = async () => {
    if (!user) { openLogin(); return; }
    if (saveLoading) return;
    setSaveLoading(true);
    const newSave = !isSaved;
    setIsSaved(newSave); // optimistic
    try {
      const res = await authService.saveJob(job.id, newSave);
      if (res?.success && res?.data) {
        setIsSaved(res.data.savedJobIds?.includes(job.id) ?? newSave);
      }
    } catch (err) {
      console.error('Save job failed:', err);
      setIsSaved(!newSave); // rollback
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <SkeletonPage variant="detail" />
    );
  }

  if (!job) {
    return (
      <div className="jdp-root flex items-center justify-center">
        <div className="text-center p-20">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <Link to="/jobs" className="text-blue-600 font-semibold hover:underline">Back to Job Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="jdp-root">
      {/* ── Sticky Header ── */}
      <CandidateHeader />

      <div className="jdp-container">
        {/* ── Left Column ── */}
        <main className="jdp-main">

          {/* 1. Job Header Card */}
          <section className="jdp-card jdp-job-header-card m-order-1">
            {(() => {
              const coverUrl = companyData?.company?.coverImageUrl;
              return coverUrl ? (
                <div className="jdp-header-cover" style={{ backgroundImage: `url(${coverUrl})` }} />
              ) : null;
            })()}
            <div className="jdp-job-header">
              <div>
                <h1 className="jdp-job-title">{job.title}</h1>
                <div className="jdp-company-row">
                  <span className="jdp-company-name">{job.company}</span>
                  <div className="jdp-rating">
                    <FaStar size={10} /> {job.rating}
                  </div>
                  <span className="jdp-reviews">{job.reviewsCount || 0} Reviews</span>
                </div>
                <div className="jdp-job-meta">
                  <div className="jdp-meta-item">
                    <FiBriefcase className="jdp-meta-icon" /> {job.exp}
                  </div>
                  <div className="jdp-meta-item">
                    <FaRupeeSign className="jdp-meta-icon" size={12} /> {job.salary}
                  </div>
                  <div className="jdp-meta-item">
                    <FiMapPin className="jdp-meta-icon" /> {job.location}
                  </div>
                </div>
              </div>
              <div className="jdp-company-logo-large">
                {job.companyLogoUrl ? (
                  <img src={job.companyLogoUrl} alt={job.company} />
                ) : (
                  <span>{job.logo}</span>
                )}
              </div>
            </div>

            <div className="jdp-job-footer">
              <div className="jdp-posted-info">
                Posted: <span className="font-semibold">{job.posted}</span>{job.openings > 0 ? <>, Openings: <span className="font-semibold">{job.openings}</span></> : ''}{job.applicants > 0 ? <>, Applicants: <span className="font-semibold">{job.applicants}</span></> : ''}
              </div>
              <div className="jdp-actions flex items-center gap-3">
                {applyMessage && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    {applyMessage}
                  </span>
                )}
                {user ? (
                  <button className={`jdp-save-btn${isSaved ? ' saved' : ''}`} onClick={handleSaveJob} disabled={saveLoading}>
                    <FiBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
                  </button>
                ) : (
                  <button className="jdp-save-btn" onClick={openLogin} disabled={saveLoading}>
                    <FiBookmark size={18} fill="none" /> Save
                  </button>
                )}
                {job.externalLink ? (
                  <button
                    onClick={() => { if (!user) { openLogin(); return; } setShowExternalLinkModal(true); }}
                    className="jdp-apply-btn hover:bg-blue-900 transition-all font-black shadow-lg shadow-blue-900/20"
                  >
                    <FiExternalLink size={16} /> Company Site
                  </button>
                ) : user ? (
                  hasApplied ? (
                    <button className="jdp-applied-badge">
                      <FiCheckCircle size={18} /> Applied
                    </button>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={applying || isSubmitting}
                      className="jdp-apply-btn hover:bg-blue-900 transition-all font-black shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                      {applying || isSubmitting ? "Applying..." : "Apply"}
                    </button>
                  )
                ) : (
                  <button className="jdp-apply-btn hover:bg-blue-900 transition-all font-black shadow-lg shadow-blue-900/20" onClick={openLogin}>Log In to apply</button>
                )}
              </div>
            </div>

            {user && (
              <div className="mt-4 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isFollowing} onChange={handleFollowToggle} disabled={followLoading} className="rounded" style={{ cursor: 'pointer' }} />
                <span style={{ color: isFollowing ? '#2563eb' : '#64748b', fontWeight: isFollowing ? 600 : 400 }}>
                  {isFollowing ? `Following ${job.company}` : `Follow ${job.company} as you apply to stay updated`}
                </span>
              </div>
            )}
          </section>

          {/* 2. Job Highlights */}
          <section className="jdp-card m-order-2">
            <h2 className="jdp-section-title">Job highlights</h2>
            <ul className="jdp-highlights-list">
              {job.summary ? (
                <li>{job.summary}</li>
              ) : job.jobDescription?.responsibilities?.length > 0 ? (
                job.jobDescription.responsibilities.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)
              ) : (
                <>
                  <li>{job.type || 'Full-time'} position with competitive enterprise benefits.</li>
                  <li>Collaborate with cross-functional teams to deliver high-quality features.</li>
                </>
              )}
            </ul>

            {user && (
              <AITrigger
                rootMargin="200px"
                triggerOnce={true}
                onTrigger={() => {
                  if (!job || matchScoreLoading) return;
                  setMatchScoreLoading(true);
                  authService.getJobMatchScore(id).then((res) => {
                    if (res?.success && res?.data) {
                      setJob((prev) => ({
                        ...prev,
                        matchScore: res.data.overall,
                        skillMatch: res.data.skillMatch,
                        locationMatch: res.data.locationMatch,
                        experienceMatch: res.data.experienceMatch,
                        roleMatch: res.data.roleMatch,
                      }));
                    }
                    setMatchScoreLoading(false);
                  }).catch(() => {
                    setMatchScoreLoading(false);
                  });
                }}
              >
                {(isTriggered) => (
                  <div className="jdp-match-score">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#1a1a1a] mb-1">Job match score</h3>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Calculated based on your profile</p>
                      </div>
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        {isTriggered && job.matchScore === null ? (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-2 border-lime-300 border-t-lime-500 rounded-full animate-spin" />
                          </div>
                        ) : (
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              className="text-slate-100"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray="175.9"
                              strokeDashoffset={175.9 * (1 - (job.matchScore || 0) / 100)}
                              className="text-[#10b981]"
                            />
                          </svg>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {isTriggered && job.matchScore === null ? (
                            <span className="text-xs font-black text-slate-400">Loading...</span>
                          ) : (
                            <>
                              <span className="text-lg font-black text-[#1a1a1a] leading-none">{job.matchScore || 0}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Score</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isTriggered && job.matchScore !== null && (
                      <div className="jdp-match-items grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const items = [
                            { label: 'Role/Dept Fit', pct: job.roleMatch ?? 85 },
                            { label: 'Keyskills', pct: job.skillMatch ?? 65 },
                            { label: 'Location', pct: job.locationMatch ?? 90 },
                            { label: 'Experience', pct: job.experienceMatch ?? 95 },
                          ];

                          return items.map((item, idx) => {
                            const isMatched = item.pct >= 70;
                            const bgClass = isMatched ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100';
                            const textClass = isMatched ? 'text-green-700' : 'text-red-700';
                            const icon = isMatched ? (
                              <FiCheckCircle className="text-[#10b981] shrink-0" size={16} />
                            ) : (
                              <FiXCircle className="text-red-500 shrink-0" size={16} />
                            );

                            return (
                              <div key={idx} className={`flex items-center gap-2 p-3 rounded-xl border ${bgClass}`}>
                                {icon}
                                <span className={`text-[10px] font-black uppercase tracking-tight ${textClass}`}>{item.label}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </AITrigger>
            )}
          </section>

          {/* 3. Job Description */}
          <section className="jdp-card jdp-description m-order-3">
            <h2 className="jdp-section-title">Job description</h2>

            <h4>About the Role</h4>
            <p>{job.jobDescription?.aboutRole || "We are looking for a skilled professional to join our growing team. You will be responsible for building and maintaining critical business infrastructure."}</p>

            <h4>Key Responsibilities</h4>
            <ul>
              {(job.jobDescription?.responsibilities || [
                "Develop and maintain high-quality software features",
                "Participate in daily stand-ups and sprint planning",
                "Ensure code quality through testing and reviews"
              ]).map((r, i) => <li key={i}>{r}</li>)}
            </ul>

            <h4>Required Skills</h4>
            <div>
              {job.jobDescription?.requiredSkills ? (
                Object.entries(job.jobDescription.requiredSkills).map(([cat, skills]) => (
                  <div key={cat} className="mb-4">
                    <p className="font-bold text-xs uppercase text-gray-500 mb-1">{cat.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm">{skills.join(", ")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm">Skills required for this role include expertise in relevant technologies and strong communication skills.</p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div><span className="text-gray-500">Role:</span> {job.title}</div>
                <div><span className="text-gray-500">Industry Type:</span> {job.type || "IT Services"}</div>
                <div><span className="text-gray-500">Department:</span> {job.dept || "Engineering"}</div>
                <div><span className="text-gray-500">Employment Type:</span> {job.mode || "Full Time"}</div>
              </div>
            </div>

            <div className="jdp-social-share mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="jdp-social-icon fb"><FaFacebookF /></div>
                <div className="jdp-social-icon x"><FaXTwitter /></div>
                <div className="jdp-social-icon li"><FaLinkedinIn /></div>
              </div>
              <div className="text-blue-600 text-sm font-bold cursor-pointer hover:underline flex items-center gap-1">
                Report this job
              </div>
            </div>
          </section>

          {/* 4. About Company */}
          <section className="jdp-card m-order-4">
            <h2 className="jdp-section-title">About company</h2>
            <p className="text-sm leading-relaxed mb-4">
              {job.companyInfo?.about || `${job.company} is a leading provider of innovative solutions in the ${job.dept} sector. We pride ourselves on our inclusive culture and commitment to excellence.`}
            </p>
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-1">Company Info</h4>
              <p className="text-sm text-gray-600">{job.companyInfo?.address || "Mumbai, Maharashtra, India"}</p>
            </div>
          </section>

          {/* 5. Beware Notice */}
          <div className="jdp-security-notice m-order-9">
            <div className="jdp-security-icon">
              <FiXCircle size={20} />
            </div>
            <div className="jdp-security-content">
              <h4>Security Advisory: Beware of imposters!</h4>
              <p>
                MavenJobs.com does not promise a job or an interview in exchange of money. Fraudsters may ask you to pay in the pretext of registration fee, Refundable Fee...
                {!showMoreSecurity && (
                  <span
                    className="read-more"
                    onClick={() => setShowMoreSecurity(true)}
                    style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}
                  >
                    Read more
                  </span>
                )}
              </p>
              {showMoreSecurity && (
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: '#475569' }}>
                  <p style={{ marginBottom: 6 }}>
                    MavenJobs does NOT charge any fee for job applications, interview scheduling, or offer letters. We never ask for payment for background verification, training, or security deposits.
                  </p>
                  <p style={{ marginBottom: 6 }}>
                    If someone contacts you claiming to represent MavenJobs and requests money, do not engage. Report the incident immediately to our support team at <strong>support@mavenjobs.com</strong>.
                  </p>
                  <p>
                    Always verify that you are on the official MavenJobs website (mavenjobs.com) before sharing personal information. Keep your account credentials confidential and enable two-factor authentication for added security.
                  </p>
                  <span
                    onClick={() => setShowMoreSecurity(false)}
                    style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                  >
                    Show less
                  </span>
                </div>
              )}
            </div>
          </div>



        </main>

        {/* ── Right Column Sidebar ── */}
        <aside className="jdp-sidebar">

          <div className="jdp-sidebar-card m-order-5">
            <h3 className="jdp-sidebar-title">Jobs you might be interested in</h3>
            <div className="jdp-similar-list">
              {similarJobs.slice(0, 3).map(j => (
                <div key={j.id} className="jdp-similar-item" onClick={() => navigate(`/job/${j.id}`)}>
                  {j.companyCoverUrl ? <div className="jdp-similar-cover" style={{ backgroundImage: `url(${j.companyCoverUrl})` }} /> : null}
                  <div className="jdp-similar-logo">
                    {j.companyLogoUrl ? (
                      <img src={j.companyLogoUrl} alt={j.company} />
                    ) : (
                      <span>{j.logo || j.title?.[0] || 'M'}</span>
                    )}
                  </div>
                  <div className="jdp-similar-body">
                    <h5 className="jdp-similar-title">{j.title}</h5>
                    <p className="jdp-similar-company">{j.company}</p>
                    <div className="jdp-similar-meta">
                      <span className="jdp-similar-rating">
                        <FaStar size={10} /> {j.rating}
                      </span>
                      <span>{j.reviews || 45} reviews</span>
                    </div>
                    <div className="jdp-similar-tags">
                      <span className="jdp-similar-tag"><FiMapPin size={11} /> {j.location}</span>
                      {j.exp && <span className="jdp-similar-tag"><FiBriefcase size={11} /> {j.exp}</span>}
                      {j.salary && <span className="jdp-similar-tag"><FaRupeeSign size={10} /> {j.salary}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="jdp-sidebar-card jdp-salary-card m-order-6">
            <h3 className="jdp-sidebar-title">Salary insights</h3>
            <div className="jdp-salary-content">
              <p className="jdp-salary-sub">Average annual salary for this role in <span>{job.company}</span></p>
              <div className="jdp-salary-amount text-2xl font-black">
                {job.salary}
              </div>
              <div className="jdp-salary-link">
                See detailed salary breakup <FiArrowRight size={14} />
              </div>
            </div>
          </div >

          <div className="jdp-sidebar-card m-order-7">
            <div className="flex justify-between items-center mb-5">
              <h3 className="jdp-sidebar-title m-0">Reviews</h3>
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="jdp-view-all"
                  style={{
                    background: 'none', border: '1.5px solid #dde6f8', borderRadius: 8,
                    padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#2563eb',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#dde6f8'; }}
                >
                  <FiPlus size={13} /> Write a review
                </button>
              )}
            </div>
            {companyReviews.length > 0 ? companyReviews.slice(0, 3).map((rev, i) => (
              <div key={i} className="jdp-review-box mb-4">
                <div className="jdp-review-header">
                  <div className="jdp-rating-stars">
                    {[1, 2, 3, 4, 5].map(s => <FaStar key={s} size={12} className={s <= rev.rating ? 'text-[#facc15]' : 'text-[#e2e8f0]'} />)}
                  </div>
                  <span className="jdp-rating-num">{rev.rating}.0</span>
                </div>
                {rev.candidateName && !rev.isAnonymous && <p className="jdp-review-meta">by {rev.candidateName}{rev.candidateTitle ? `, ${rev.candidateTitle}` : ''}</p>}
                {rev.headline && <p className="font-semibold text-xs mt-1">{rev.headline}</p>}
                {rev.review && (
                  <div className="jdp-review-quote mt-1">
                    <p>"{rev.review.length > 120 ? rev.review.slice(0, 120) + '...' : rev.review}"</p>
                  </div>
                )}
              </div>
            )) : (
              <div className="jdp-review-box">
                <p className="text-sm text-gray-500">No reviews yet. Be the first to share your experience.</p>
                {user && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="mt-3 text-blue-600 text-sm font-bold hover:underline"
                  >
                    Write a review
                  </button>
                )}
              </div>
            )}
            {user && (
              <div className="jdp-follow-box">
                <div className="jdp-follow-info">
                  <p>Follow {job.company} for updates</p>
                  <span>{companyData?.followersCount || 0} followers</span>
                </div>
                <button
                  className={`jdp-follow-btn${isFollowing ? ' following' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  <FiPlus size={14} /> {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}
          </div >

          {(() => {
            const perks = companyData?.company?.perks || [];
            if (!perks.length) return null;
            return (
              <div className="jdp-sidebar-card m-order-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="jdp-sidebar-title">Benefits & Perks</h3>
                  {perks.length > 6 && <span className="text-blue-600 text-sm font-bold cursor-pointer">View all</span>}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {perks.slice(0, 6).map((p, i) => {
                    const label = p.label || p;
                    const match = PERK_MAP[label];
                    const IconComp = match?.icon || FiStarIcon;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg" style={match ? { color: match.color, background: match.bg } : {}}>
                          <IconComp size={16} />
                        </div>
                        <span className="text-[10px] text-gray-500 leading-tight">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </aside>
      </div>

     <LandingFooter />

      {showNoResumeModal && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div style={{
            background: "#fff", borderRadius: 20, maxWidth: 420, width: "90%",
            padding: "32px 28px 24px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <FiBriefcase size={22} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              No resume uploaded
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
              You haven't uploaded a resume yet. Are you sure you want to apply without one?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowNoResumeModal(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                No, cancel
              </button>
              <button
                onClick={() => submitWithoutResume()}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "none",
                  background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                }}
              >
                Yes, apply anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div style={{
            background: "#fff", borderRadius: 20, maxWidth: 460, width: "90%",
            padding: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Write a review for {job.company}</h3>

            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: 'block', marginBottom: 4 }}>Rating</label>
            <div className="flex gap-1 mb-4" style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <FaStar
                  key={s}
                  size={24}
                  className={s <= reviewForm.rating ? 'text-[#facc15]' : 'text-[#e2e8f0]'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                />
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: 'block', marginBottom: 4 }}>Headline (optional)</label>
            <input
              value={reviewForm.headline}
              onChange={e => setReviewForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="Summarize your experience"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                borderRadius: 10, marginBottom: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: 'block', marginBottom: 4 }}>Review (optional)</label>
            <textarea
              value={reviewForm.review}
              onChange={e => setReviewForm(f => ({ ...f, review: e.target.value }))}
              placeholder="Share your experience working here..."
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                borderRadius: 10, marginBottom: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            <label className="flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reviewForm.isAnonymous}
                onChange={e => setReviewForm(f => ({ ...f, isAnonymous: e.target.checked }))}
              />
              Post anonymously
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: "none",
                  background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                }}
              >
                Submit review
              </button>
            </div>
          </div>
        </div>
      )}

      {job && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          job={job}
          user={user}
          answers={answers}
          errors={errors}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          onChange={handleChange}
          onSubmit={(e) => handleSubmit(e, "JOB_DETAILS")}
        />
      )}

      {/* ── External Link Fraud Warning Modal ── */}
      {showExternalLinkModal && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div style={{
            background: "#fff", borderRadius: 20, maxWidth: 480, width: "90%",
            padding: "36px 32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            fontFamily: "'DM Sans', system-ui, sans-serif", position: "relative", overflow: "hidden"
          }}>
            {/* Decorative top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #dc2626, #f59e0b, #dc2626)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FiAlertTriangle size={26} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  You're leaving MavenJobs
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                  This job posting contains an external link
                </p>
              </div>
            </div>

            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14,
              padding: "16px 18px", marginBottom: 24
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <FiShield size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#78350f" }}>
                  <strong style={{ fontWeight: 800 }}>Stay safe —</strong> MavenJobs does not verify external job listings. 
                  Never share your personal information (bank details, OTPs, passwords) with anyone you don't trust.
                  If something feels off, <strong>close this page</strong> and report the listing to our support team.
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 24, padding: "0 2px" }}>
              Click <strong>"Proceed"</strong> to visit <span style={{
                color: "#002366", fontWeight: 600, wordBreak: "break-all", fontSize: 12.5
              }}>{job.externalLink}</span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowExternalLinkModal(false)}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                ← Back
              </button>
              <button
                onClick={handleProceedExternal}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #002366, #1a3a6e)", color: "#fff",
                  fontSize: 14, fontWeight: 800, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif", transition: "all 0.15s",
                  boxShadow: "0 4px 14px rgba(0,35,102,0.25)"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,35,102,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,35,102,0.25)"; }}
              >
                Proceed <FiExternalLink size={14} style={{ marginLeft: 4, verticalAlign: "middle" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up: Have you applied? ── */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div style={{
            background: "#fff", borderRadius: 20, maxWidth: 400, width: "90%",
            padding: "32px 28px 24px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", background: "#ecfdf5",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <FiCheckCircle size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Have you applied for this job?
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
              Did you successfully submit your application on the company's website?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleAppliedNo}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                No
              </button>
              <button
                onClick={handleAppliedYes}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "none",
                  background: "#002366", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Yes, I applied
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
