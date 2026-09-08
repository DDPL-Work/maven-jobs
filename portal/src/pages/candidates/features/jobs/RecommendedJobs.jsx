import React, { useState, useRef } from 'react';
import { 
  FiBriefcase, FiMapPin, FiClock, FiBookmark, FiChevronRight, FiChevronLeft, 
  FiX, FiPlus, FiEyeOff, FiCheck, FiCheckCircle, FiInfo, FiEdit2, FiShield, FiSend, FiStar, FiZap, FiUsers, FiCalendar,
  FiAward, FiBookOpen, FiPlay, FiTarget, FiMessageSquare
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import authService from '../../../../services/authService';
import ApplicationModal from '../../../../components/application/ApplicationModal';
import { useAuth } from '../../../../AuthContext';

const MOCK_RECOMMENDED_JOBS = [
  {
    id: 1,
    title: "Process Coordinator",
    company: "Finvin Advisor",
    rating: 2.3,
    reviews: 3,
    exp: "0-1 Yrs",
    salary: "1.2-2.4 Lacs PA",
    location: "Mumbai(Andheri)",
    desc: "Responsibilities:* Ensure timely follow-ups on tasks* Maintain accurate records an...",
    tags: ["Office Coordination", "Coordination", "Follow Ups", "Process", "UPS", "Office"],
    posted: "2 Days Ago",
    logoCode: "F",
    logoBg: "#EFF6FF",
    logoCol: "#2563EB"
  },
  {
    id: 2,
    title: "Java Developer",
    company: "Ignitefortune Tech",
    rating: 4.1,
    reviews: 12,
    exp: "0-1 Yrs",
    salary: "Not disclosed",
    location: "Remote",
    desc: "Internship Experience or experience on self accomplished projects is preferred Pr...",
    tags: ["Java", "JDBC", "Spring Boot", "Microservices", "Web Services", "Hibernate", "MySQL", "SQL"],
    posted: "3 Days Ago",
    logoCode: "I",
    logoBg: "#F5F3FF",
    logoCol: "#7C3AED"
  },
  {
    id: 3,
    title: "Sales Coordinator",
    company: "Siana International",
    rating: 4.6,
    reviews: 2,
    exp: "0-2 Yrs",
    salary: "2-2.5 Lacs PA",
    location: "Pune(Model Colony)",
    desc: "Processing orders & tracking delivery Primary POC for clients, handling inquiries, ...",
    tags: ["Sales Coordination", "Proforma Invoice", "Sales Support", "Sales Order Processing"],
    posted: "2 Days Ago",
    logoCode: "S",
    logoBg: "#FEF2F2",
    logoCol: "#EF4444"
  },
  {
    id: 4,
    title: "Java Developer",
    company: "Jugla Technologies",
    rating: 3.8,
    reviews: 45,
    exp: "0-1 Yrs",
    salary: "Not disclosed",
    location: "Remote",
    desc: "Candidate with Prior Self Project Or Internship ExperienceMust have HandsOn Co...",
    tags: ["Java", "JDBC", "Spring Boot", "MySQL", "Microservices", "Web Services", "SQL"],
    posted: "6 Days Ago",
    logoCode: "J",
    logoBg: "#EEF2FF",
    logoCol: "#4F46E5"
  },
  {
    id: 5,
    title: "R & D Engineer",
    company: "ABB",
    rating: 4.0,
    reviews: 3397,
    exp: "0-3 Yrs",
    salary: "Not disclosed",
    location: "Hybrid - Bengaluru",
    desc: "Must have exposure to agile software development methodologies, with good trac...",
    tags: ["Research and Development", "plc scada", "test automation", "jmeter", "java", "automation"],
    posted: "2 Days Ago",
    logoCode: "ABB",
    logoBg: "#F1F5F9",
    logoCol: "#DC2626"
  }
];

const allowsQuickApply = (job) => {
  if (job.allowQuickApply !== undefined) return Boolean(job.allowQuickApply);
  return !(
    Array.isArray(job.screeningQuestions) && job.screeningQuestions.length > 0
  ) && !job.externalLink;
};

export default function RecommendedJobs({ onBack, recommendedJobs = {}, candidateProfile = {}, onEditPreferences, initialTab }) {
  const { user } = useAuth();
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [activeTabState, setActiveTabState] = useState(initialTab || null);
  const [savedJobIds, setSavedJobIds] = useState(() => new Set((candidateProfile?.savedJobIds || []).map(id => String(id))));
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  // Application Modal & Queue states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyQueue, setApplyQueue] = useState([]);
  const [currentApplyIndex, setCurrentApplyIndex] = useState(0);
  const [quickApplyJob, setQuickApplyJob] = useState(null);
  const [qaAnswers, setQaAnswers] = useState({});
  const [qaErrors, setQaErrors] = useState({});
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaSuccess, setQaSuccess] = useState(false);

  const tabsScrollRef = useRef(null);

  const toggleSaveJob = async (jobId) => {
    const strId = String(jobId);
    const isSaved = savedJobIds.has(strId);
    try {
      const res = await authService.saveJob(strId, !isSaved);
      if (res?.success && res?.data) {
        setSavedJobIds(new Set((res.data.savedJobIds || []).map(id => String(id))));
      }
    } catch { /* ignore */ }
  };

  const availableTabs = Object.keys(recommendedJobs).length > 0
    ? Object.keys(recommendedJobs).map(key => ({
        name: key,
        count: recommendedJobs[key]?.length || 0,
        jobs: recommendedJobs[key] || []
      }))
    : [
        { name: 'Applies (5)', count: 5, jobs: MOCK_RECOMMENDED_JOBS },
        { name: 'Profile (15)', count: 15, jobs: MOCK_RECOMMENDED_JOBS },
        { name: 'Preferences (3)', count: 3, jobs: MOCK_RECOMMENDED_JOBS },
        { name: 'You might like (6)', count: 6, jobs: MOCK_RECOMMENDED_JOBS }
      ];

  const activeTab = activeTabState || (initialTab && availableTabs.find(t => t.name === initialTab))?.name || availableTabs[0]?.name || 'Profile (15)';
  const currentTabObj = availableTabs.find(t => t.name === activeTab) || availableTabs[0];
  const displayJobs = currentTabObj?.jobs || [];

  const allJobs = Object.keys(recommendedJobs).length > 0
    ? Object.values(recommendedJobs).flat()
    : MOCK_RECOMMENDED_JOBS;

  const handleToggleJob = (jobId) => {
    setSelectedJobs(prev => {
      if (prev.includes(jobId)) return prev.filter(id => id !== jobId);
      if (prev.length >= 5) return prev;
      const job = displayJobs.find(j => j.id === jobId || j._id === jobId);
      if (job && !allowsQuickApply(job)) return prev;
      return [...prev, jobId];
    });
  };

  const handleApplySuccess = (successfulJobIds) => {
    setAppliedJobIds(prev => [...new Set([...prev, ...successfulJobIds])]);
    setSelectedJobs([]);
  };

  const startBulkApply = () => {
    const jobsToApply = selectedJobs.map(id => allJobs.find(j => j.id === id || j._id === id)).filter(Boolean);
    if (jobsToApply.length === 0) return;
    setApplyQueue(jobsToApply);
    setCurrentApplyIndex(0);
    processQueueIndex(0, jobsToApply);
  };

  const processQueueIndex = async (index, queue) => {
    if (index >= queue.length) {
      handleApplySuccess(queue.map(j => j.id || j._id));
      setShowApplyModal(false);
      setApplyQueue([]);
      return;
    }
    const job = queue[index];
    let questions = job.screeningQuestions;
    
    // If screening questions aren't loaded yet, try to fetch them
    if (questions === undefined) {
      try {
        const res = await authService.getJobDetail(job.id || job._id);
        questions = res?.data?.job?.screeningQuestions || [];
      } catch (e) {
        questions = [];
      }
    }

    setQuickApplyJob({
      ...job,
      companyName: job.companyName || job.company,
      companyLogoUrl: job.companyLogoUrl || job.companyLogoUrl,
      location: job.location || job.loc,
      screeningQuestions: questions
    });
    setQaAnswers({});
    setQaErrors({});
    setQaSuccess(false);
    setShowApplyModal(true);
  };

  const handleQaChange = (qId, value) => {
    setQaAnswers(prev => ({ ...prev, [qId]: value }));
    if (qaErrors[qId]) {
      setQaErrors(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleQaSubmit = async (e) => {
    e.preventDefault();
    if (!quickApplyJob) return;

    const questions = quickApplyJob.screeningQuestions || [];
    let isValid = true;
    const newErrors = {};
    questions.forEach(q => {
      const qid = q._id || q.id;
      const val = qaAnswers[qid];
      if (q.required && (val === undefined || val === null || val === "")) {
        newErrors[qid] = "This question is required";
        isValid = false;
      }
    });
    if (!isValid) {
      setQaErrors(newErrors);
      return;
    }

    setQaSubmitting(true);
    try {
      const answers = questions.map(q => ({
        questionId: q._id || q.id,
        question: q.question,
        answer: qaAnswers[q._id || q.id] || ""
      }));
      await authService.createApplication({
        jobId: quickApplyJob.id || quickApplyJob._id,
        appliedFrom: "QUICK_APPLY",
        answers
      });
      setQaSuccess(true);
    } catch {
      setQaSuccess(false);
    }
    setQaSubmitting(false);
  };

  const handleModalClose = () => {
    if (qaSuccess) {
       const nextIdx = currentApplyIndex + 1;
       setCurrentApplyIndex(nextIdx);
       processQueueIndex(nextIdx, applyQueue);
    } else {
       setShowApplyModal(false);
       setApplyQueue([]);
       if (currentApplyIndex > 0) {
         handleApplySuccess(applyQueue.slice(0, currentApplyIndex).map(j => j.id || j._id));
       }
    }
  };

  return (
    <div className="rj-root">
      <div className="rj-container">
        
        {/* Sticky Header */}
        <div className="rj-sticky-header">
          {/* Header */}
          <div className="rj-header">
          <div className="rj-header-left">
            <h1 className="rj-title">Recommended jobs for you</h1>
          </div>
          
          <div className="rj-header-right">
            <span className="rj-helper-text">You can select upto 5 jobs to apply</span>
            <button 
              className={`rj-apply-main ${selectedJobs.length > 0 ? 'active' : ''}`}
              disabled={selectedJobs.length === 0 || applyQueue.length > 0}
              onClick={startBulkApply}
            >
              Apply{selectedJobs.length > 0 ? ` (${selectedJobs.length})` : ''}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="pd-scroll-btn left rj-scroll-mobile-only" 
            style={{ zIndex: 10, left: '-15px' }}
            onClick={() => {
              if (tabsScrollRef.current) tabsScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
            }}
          >
            <FiChevronLeft size={18} />
          </button>
          <div className="rj-tabs-wrap" ref={tabsScrollRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowX: 'auto', display: 'flex', flex: 1 }}>
            {availableTabs.map(tab => {
              const tabLabel = tab.name.includes('(') ? tab.name : `${tab.name} (${tab.count})`;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTabState(tab.name)}
                  className={`rj-tab ${activeTab === tab.name ? 'active' : ''}`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
          <button 
            className="pd-scroll-btn right rj-scroll-mobile-only" 
            style={{ zIndex: 10, right: '-15px' }}
            onClick={() => {
              if (tabsScrollRef.current) tabsScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
            }}
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        </div>

        {/* Content */}
        <div className="rj-layout">
          
          {/* Left Column */}
          <div className="rj-list">
            {displayJobs.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  padding: "80px 20px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "16px",
                  border: "1.5px dashed #cbd5e1",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  <FiBriefcase size={28} style={{ color: "#64748b" }} />
                </div>
                <h4
                  style={{
                    color: "#1e293b",
                    fontSize: "18px",
                    fontWeight: "700",
                    margin: "0 0 8px 0",
                  }}
                >
                  No jobs found
                </h4>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  We couldn't find any jobs in this category right now.
                </p>
              </div>
            ) : (
              displayJobs.map((job, idx) => {
              const jobId = job.id || job._id || idx;
              const title = job.title || 'Process Coordinator';
              const company = job.company || job.companyName || 'Finvin Advisor';
              const rating = job.rating || '4.2';
              const reviews = job.reviews || Math.floor(Math.random() * 40) + 2;
              const exp = job.exp || job.experience || '0-3 Yrs';
              const salary = job.salaryFormatted || job.salary || 'Not disclosed';
              const location = job.loc || job.location || 'Remote';
              const desc = job.desc || job.description || job.responsibilities || 'No description provided.';
              const tags = job.tags && job.tags.length > 0 ? job.tags : ['Full-Time', 'Corporate'];
              const posted = job.ago || job.posted || job.lastUpdated || 'Recent';
              const logoCode = job.code || job.logoCode || title.substring(0, 2).toUpperCase();
              const logoBg = job.bg || job.logoBg || '#EEF2FF';
              const logoCol = job.col || job.logoCol || '#4F46E5';
              const quickApply = allowsQuickApply(job);
              const isApplied = appliedJobIds.includes(jobId) || Boolean(job.hasApplied);

              return (
                <div 
                  key={jobId} 
                  className={`rj-job-card ${selectedJobs.includes(jobId) ? 'selected' : ''} ${isApplied ? 'applied' : ''}`}
                  onClick={() => {
                    const jid = job.id || job._id;
                    if (jid) window.open(`/job/${jid}`, "_blank", "noopener,noreferrer");
                  }}
                >
                  <div className="rj-job-row">
                    <div className="rj-check-col">
                      {isApplied ? (
                        <span className="rj-applied-badge" title="Applied">
                          <FiCheckCircle size={18} />
                        </span>
                      ) : quickApply ? (
                        <label className="rj-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedJobs.includes(jobId)}
                            onChange={() => handleToggleJob(jobId)}
                          />
                          <span className="rj-checkmark"><FiCheck size={12} /></span>
                        </label>
                      ) : (
                        <span className="rj-check-spacer" />
                      )}
                    </div>

                    <div className="rj-job-content">
                      <div className="rj-job-header">
                        <div className="rj-job-info">
                          <div className="rj-title-row">
                            <h3 className="rj-job-title">{title}</h3>
                            {isApplied && <span className="rj-applied-pill">Applied</span>}
                            {!quickApply && !isApplied && <span className="rj-not-quick">Not quick apply</span>}
                          </div>
                          <div className="rj-company-row">
                            <span className="rj-company-name">{company}</span>
                            {rating && (
                              <span className="rj-rating-pill">
                                <FiStar size={10} /> {rating} <span>|</span> {reviews} Reviews
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="rj-job-logo" style={{ background: logoBg, color: logoCol, overflow: "hidden" }}>
                          {job.companyLogoUrl ? (
                            <img
                              src={job.companyLogoUrl}
                              alt={company}
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                            />
                          ) : logoCode}
                        </div>
                      </div>

                      <div className="rj-job-meta">
                        <span><FiBriefcase size={13} /> {exp}</span>
                        <span><span className="rj-salary-ico">₹</span> {salary}</span>
                        <span><FiMapPin size={13} /> {location}</span>
                      </div>

                      <div className="rj-job-desc">
                        <FiEdit2 size={13} />
                        <p>{desc}</p>
                      </div>

                      <div className="rj-job-tags">
                        {tags.map((tag, i) => (
                          <span key={i} className="rj-tag">{tag}</span>
                        ))}
                      </div>

                      <div className="rj-job-footer">
                        <span className="rj-posted">{posted}</span>
                        <div className="rj-job-actions">
                          <button className="rj-action-btn" onClick={(e) => { e.stopPropagation(); }}>
                            <FiEyeOff size={15} /> Hide
                          </button>
                          <button className="rj-action-btn" onClick={(e) => { e.stopPropagation(); toggleSaveJob(job.id || job._id); }}>
                            <FiBookmark size={15} fill={savedJobIds.has(String(job.id || job._id)) ? 'currentColor' : 'none'} />
                            {savedJobIds.has(String(job.id || job._id)) ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>

          {/* Right Column */}
          <div className="rj-sidebar">
            
            <div className="rj-card">
              <div className="rj-card-head">
                <h3>Add preferences to get matching jobs</h3>
              </div>
              <div className="rj-pref-group">
                <div className="rj-pref-item">
                  <div className="rj-pref-label">PREFERRED JOB ROLE
                    <button className="rj-pref-edit" onClick={() => onEditPreferences && onEditPreferences()} aria-label="Edit preferred job role"><FiEdit2 size={12} /></button>
                  </div>
                  <div className="rj-pref-tags">
                    {(candidateProfile?.preferredRoles?.length > 0 ? candidateProfile.preferredRoles : ['Front End', 'MERN Stack', 'Software Developer']).map((r, i) => <span key={i}>{r}</span>)}
                  </div>
                </div>
                <div className="rj-pref-item">
                  <div className="rj-pref-label">PREFERRED LOCATION
                    <button className="rj-pref-edit" onClick={() => onEditPreferences && onEditPreferences()} aria-label="Edit preferred work location"><FiEdit2 size={12} /></button>
                  </div>
                  <div className="rj-pref-tags">
                    {(candidateProfile?.preferredLocations?.length > 0 ? candidateProfile.preferredLocations : ['Pune', 'Noida', 'Mumbai', 'Bengaluru']).map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                </div>
                <div className="rj-pref-item">
                  <div className="rj-pref-label">PREFERRED SALARY
                    <button className="rj-pref-edit" onClick={() => onEditPreferences && onEditPreferences()} aria-label="Edit preferred salary"><FiEdit2 size={12} /></button>
                  </div>
                  <div className="rj-pref-val">{candidateProfile?.expectedSalary ? `₹ ${Number(candidateProfile.expectedSalary).toLocaleString()}` : '₹ 5,00,000'}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>


      <ApplicationModal
        isOpen={showApplyModal}
        onClose={handleModalClose}
        job={quickApplyJob}
        user={user}
        answers={qaAnswers}
        errors={qaErrors}
        isSubmitting={qaSubmitting}
        isSuccess={qaSuccess}
        onChange={handleQaChange}
        onSubmit={handleQaSubmit}
      />

      <style>{`
        .rj-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: rjFadeIn 0.3s ease;
        }
        .rj-modal-content {
          background: #ffffff;
          width: 100%;
          max-width: 1000px;
          height: 90vh;
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.25);
          animation: rjSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rj-modal-nav {
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          background: #fff;
          z-index: 10;
        }
        .rj-nav-powered {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .rj-nav-powered .highlight {
          color: #f59e0b;
          font-weight: 700;
        }
        .rj-modal-close-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f8faFc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rj-modal-close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
          transform: rotate(90deg);
        }
        .rj-modal-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
        }
        .rj-modal-hero {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 48px;
          margin-bottom: 56px;
          align-items: center;
        }
        .rj-hero-tags {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .rj-tag-live {
          background: #fef2f2;
          color: #ef4444;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rj-tag-live .dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: rjPulse 1.5s infinite;
        }
        .rj-tag-time {
          background: #f0f9ff;
          color: #0ea5e9;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rj-hero-content h2 {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        .rj-hero-content p {
          font-size: 17px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .rj-hero-features {
          display: flex;
          gap: 24px;
        }
        .rj-hero-features span {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
        }
        .rj-hero-features span svg {
          color: #2563eb;
        }
        .rj-hero-visual {
          position: relative;
        }
        .rj-visual-card {
          width: 100%;
          height: 240px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.15);
          position: relative;
        }
        .rj-visual-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rj-visual-glass {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          padding: 12px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          color: #0f172a;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .rj-modal-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 56px;
        }
        .rj-section {
          margin-bottom: 48px;
        }
        .rj-section-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rj-learning-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .rj-learn-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        .rj-learn-card:hover {
          background: #fff;
          border-color: #e2e8f0;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }
        .rj-learn-icon {
          width: 40px;
          height: 40px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .rj-learn-info h5 {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .rj-learn-info p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }
        .rj-agenda {
          background: #f8fafc;
          border-radius: 24px;
          padding: 8px;
        }
        .rj-agenda-item {
          display: flex;
          padding: 20px 24px;
          border-radius: 16px;
          gap: 32px;
        }
        .rj-agenda-item:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }
        .rj-agenda-time {
          font-size: 14px;
          font-weight: 800;
          color: #2563eb;
          white-space: nowrap;
        }
        .rj-agenda-desc {
          font-size: 14px;
          color: #334155;
          font-weight: 600;
        }
        .rj-experts-row {
          display: flex;
          gap: 24px;
        }
        .rj-expert-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
        }
        .rj-expert-photo {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 16px;
        }
        .rj-expert-detail h6 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .rj-expert-detail span {
          font-size: 12px;
          color: #64748b;
        }
        .rj-sticky-box {
          position: sticky;
          top: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }
        .rj-box-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .rj-price-tag {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }
        .rj-price-old {
          font-size: 15px;
          color: #94a3b8;
          text-decoration: line-through;
          margin-left: 8px;
        }
        .rj-slot-tag {
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
          background: #fef2f2;
          padding: 4px 10px;
          border-radius: 8px;
        }
        .rj-box-meta {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rj-meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #475569;
          font-weight: 600;
        }
        .rj-meta-item svg {
          color: #94a3b8;
        }
        .rj-btn-enroll {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          background: #2563eb;
          color: #fff;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 24px;
        }
        .rj-btn-enroll:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
        }
        .rj-social-proof {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        .rj-avatars-mini {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .rj-av-mini {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #e2e8f0;
          border: 2px solid #fff;
          margin-right: -10px;
        }
        .rj-av-text {
          margin-left: 16px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }
        .rj-rating-mini {
          font-size: 12px;
          color: #475569;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rj-rating-mini svg {
          color: #f59e0b;
        }
        .rj-box-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        @keyframes rjFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rjSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rjPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
        .rj-modal-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .rj-modal-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .rj-modal-scroll-area::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        /* ── Bulk Quick Apply Modal ── */
        .rj-qa-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 10050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: rjFadeIn 0.25s ease;
        }
        .rj-qa-modal {
          background: #fff;
          width: 100%;
          max-width: 640px;
          max-height: 88vh;
          border-radius: 24px;
          box-shadow: 0 32px 72px rgba(15, 23, 42, 0.28);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: rjSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rj-qa-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 22px 26px 18px;
          border-bottom: 1px solid #f1f5f9;
        }
        .rj-qa-header h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .rj-qa-header p {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }
        .rj-qa-close {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: none;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rj-qa-close:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .rj-qa-close:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .rj-qa-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          animation: rjFadeIn 0.3s ease;
        }
        .rj-qa-questions {
          flex: 1;
          overflow-y: auto;
          padding: 20px 26px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .rj-qa-question {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
        }
        .rj-qa-q-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .rj-qa-q-text {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.45;
        }
        .rj-qa-q-count {
          flex-shrink: 0;
          font-size: 0.62rem;
          font-weight: 800;
          color: #2563eb;
          background: #dbeafe;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .rj-qa-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.85rem;
          font-family: var(--font);
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .rj-qa-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .rj-qa-textarea {
          resize: vertical;
        }
        .rj-qa-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .rj-qa-check {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 999px;
          padding: 7px 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rj-qa-check input {
          accent-color: #2563eb;
        }
        .rj-qa-check:hover {
          border-color: #93c5fd;
        }
        .rj-qa-none {
          padding: 40px 26px;
          text-align: center;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }
        .rj-qa-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 26px 20px;
          border-top: 1px solid #f1f5f9;
        }
        .rj-qa-cancel {
          padding: 11px 22px;
          border: none;
          border-radius: 999px;
          background: none;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 700;
          font-family: var(--font);
          cursor: pointer;
        }
        .rj-qa-submit {
          padding: 11px 26px;
          border: none;
          border-radius: 999px;
          background: #2563eb;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          font-family: var(--font);
          cursor: pointer;
          transition: all 0.25s;
        }
        .rj-qa-submit:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }
        .rj-qa-submit:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .rj-qa-center {
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 30px;
          gap: 18px;
        }
        .rj-qa-center h4 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .rj-qa-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 4px solid #dbeafe;
          border-top-color: #2563eb;
          animation: rjSpin 0.8s linear infinite;
        }
        .rj-qa-progress {
          width: 100%;
          max-width: 320px;
          height: 8px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .rj-qa-progress-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #60a5fa, #2563eb);
          transition: width 0.35s ease;
        }
        .rj-qa-progress-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #64748b;
        }
        .rj-qa-success-icon {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: #d1fae5;
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: rjPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rj-qa-fail-note {
          font-size: 0.85rem;
          color: #ef4444;
          font-weight: 600;
          margin: 0;
        }
        .rj-qa-fail-list {
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 120px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rj-qa-fail-list li {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #b91c1c;
          font-weight: 600;
        }
        .rj-applied-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: #10b981;
        }
        .rj-job-card.applied {
          border-color: #a7f3d0;
          background: #f0fdf4;
        }
        .rj-applied-pill {
          font-size: 0.65rem;
          font-weight: 800;
          color: #047857;
          background: #d1fae5;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        @keyframes rjSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes rjPop {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
