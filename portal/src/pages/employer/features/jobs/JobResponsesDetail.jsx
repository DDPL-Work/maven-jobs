import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiFolder, FiShare2, FiChevronDown, FiChevronUp, FiSearch,
  FiCheck, FiX, FiMail, FiDownload, FiTrash2, FiInfo,
  FiBriefcase, FiClock, FiMapPin, FiMessageSquare, FiSmartphone,
  FiPhone, FiSend, FiMessageCircle, FiCheckCircle,
  FiCopy, FiChevronRight, FiArrowRight, FiUser
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import employerJobService from '../../../../services/employerJobService';
import './JobResponsesDetail.css';

const ACCORDION_SECTIONS = [
  { id: 'location', label: 'Location' },
  { id: 'locality', label: 'Locality' },
  { id: 'experience', label: 'Experience' },
  { id: 'notice', label: 'Notice period / Availability to join' },
  { id: 'salary', label: 'Salary' },
  { id: 'education', label: 'Education' },
  { id: 'diversity', label: 'Diversity' },
  { id: 'industry', label: 'Industry' },
  { id: 'designation', label: 'Designation' },
  { id: 'company', label: 'Company' },
  { id: 'department', label: 'Department' },
  { id: 'institute', label: 'Institute' },
];

export default function JobResponsesDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Job & candidate data loaded from API
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Active top primary tab: 'all' | 'shortlisted' | 'maybe' | 'rejected'
  const [activeTab, setActiveTab] = useState('all');

  // Sub-filter pill: 'all' | 'new' | 'not_viewed' | 'action_pending'
  const [subFilter, setSubFilter] = useState('all');

  // Sort by
  const [sortBy, setSortBy] = useState('relevance');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Sidebar accordions state
  const [keywordsOpen, setKeywordsOpen] = useState(true);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [keySkillsOnly, setKeySkillsOnly] = useState(false);
  const [aiRecChecked, setAiRecChecked] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({});

  // Dynamic Multi-facet filters state: { [sectionId]: [selectedOptionIds...] }
  const [selectedFilters, setSelectedFilters] = useState({});
  // Section search queries for filtering long option lists
  const [accordionSearches, setAccordionSearches] = useState({});

  // Experience range filter
  const [expMin, setExpMin] = useState(0);
  const [expMax, setExpMax] = useState(30);
  const [appliedExpRange, setAppliedExpRange] = useState(null);

  // Salary range filter
  const [salMin, setSalMin] = useState(0);
  const [salMax, setSalMax] = useState(9.99);
  const [appliedSalRange, setAppliedSalRange] = useState(null);
  const [salaryNotMentionedChecked, setSalaryNotMentionedChecked] = useState(false);

  // Did you know banner response feedback
  const [dykFeedback, setDykFeedback] = useState(null);

  // Contact phone revealed state (per application ID)
  const [revealedContacts, setRevealedContacts] = useState({});

  // Status dropdown open state (per application ID)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);

  // Hovered tooltip for side action icons (e.g. 'email-1')
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Comment section open state (per application ID)
  const [openCommentCandidateId, setOpenCommentCandidateId] = useState(null);

  // Comment text input values (per application ID)
  const [commentTexts, setCommentTexts] = useState({});

  // Comment submitting indicator
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.jrd-contact-status-wrapper')) {
        setOpenStatusDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch full details and candidates from backend
  const loadJobData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employerJobService.getJobDetailWithResponses(jobId);
      if (res) {
        setData(res);
        setCandidates(res.candidates || []);
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  // Toggle single accordion (defaults to open for available sections)
  const toggleAccordion = (id) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Toggle a single filter option in an accordion section
  const toggleFilterOption = (sectionId, optionId) => {
    setSelectedFilters((prev) => {
      const current = prev[sectionId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[sectionId];
        return copy;
      }
      return { ...prev, [sectionId]: next };
    });
  };

  // Clear specific accordion section filters
  const clearFilterSection = (sectionId, e) => {
    if (e) e.stopPropagation();
    if (sectionId === 'experience') {
      setAppliedExpRange(null);
      setExpMin(0);
      setExpMax(30);
    } else if (sectionId === 'salary') {
      setAppliedSalRange(null);
      setSalaryNotMentionedChecked(false);
      setSalMin(0);
      setSalMax(9.99);
    }
    setSelectedFilters((prev) => {
      const copy = { ...prev };
      delete copy[sectionId];
      return copy;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    setKeywordSearch('');
    setKeySkillsOnly(false);
    setAiRecChecked(false);
    setAccordionSearches({});
    setAppliedExpRange(null);
    setAppliedSalRange(null);
    setSalaryNotMentionedChecked(false);
    setExpMin(0);
    setExpMax(30);
    setSalMin(0);
    setSalMax(9.99);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = Object.values(selectedFilters).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    if (keywordSearch.trim()) count++;
    if (aiRecChecked) count++;
    if (appliedExpRange) count++;
    if (appliedSalRange) count++;
    if (salaryNotMentionedChecked) count++;
    return count;
  }, [selectedFilters, keywordSearch, aiRecChecked, appliedExpRange, appliedSalRange, salaryNotMentionedChecked]);

  // Candidates in active primary tab ('all', 'shortlisted', 'maybe', 'rejected')
  const primaryTabCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (activeTab === 'shortlisted') return c.status === 'SHORTLISTED';
      if (activeTab === 'maybe') return c.status === 'MAYBE' || c.status === 'SCREENING';
      if (activeTab === 'rejected') return c.status === 'REJECTED';
      return true;
    });
  }, [candidates, activeTab]);

  // Primary tab counts computed dynamically from live candidates state
  const primaryTabsCount = useMemo(() => {
    return {
      all: candidates.length,
      shortlisted: candidates.filter((c) => c.status === 'SHORTLISTED').length,
      maybe: candidates.filter((c) => c.status === 'MAYBE' || c.status === 'SCREENING').length,
      rejected: candidates.filter((c) => c.status === 'REJECTED').length,
    };
  }, [candidates]);

  // Sub-filter counts computed dynamically based on candidates in the active primary tab
  const subCounts = useMemo(() => {
    const all = primaryTabCandidates.length;
    const newResponses = primaryTabCandidates.filter(
      (c) => c.isNew || c.status === 'APPLIED' || !c.isViewed
    ).length;
    const notViewed = primaryTabCandidates.filter((c) => !c.isViewed).length;
    const actionPending = primaryTabCandidates.filter(
      (c) => !['SHORTLISTED', 'MAYBE', 'REJECTED'].includes(c.status)
    ).length;

    return { all, newResponses, notViewed, actionPending };
  }, [primaryTabCandidates]);

  // Filter candidates based on sub-filter, keyword, ai-recommendations, and dynamic accordion filters
  const filteredCandidates = useMemo(() => {
    return primaryTabCandidates.filter((c) => {
      // Sub-filter pill
      if (subFilter === 'new') {
        if (!c.isNew && c.status !== 'APPLIED' && c.isViewed) return false;
      } else if (subFilter === 'not_viewed') {
        if (c.isViewed) return false;
      } else if (subFilter === 'action_pending') {
        if (['SHORTLISTED', 'MAYBE', 'REJECTED'].includes(c.status)) return false;
      }

      // AI recommendation
      if (aiRecChecked && !c.isRecommended) return false;

      // Keyword search
      if (keywordSearch.trim()) {
        const q = keywordSearch.toLowerCase();
        const matchesSkills = (c.keySkills || '').toLowerCase().includes(q);
        if (keySkillsOnly) {
          if (!matchesSkills) return false;
        } else {
          const matchesName = (c.name || '').toLowerCase().includes(q);
          const matchesRole = (c.currentRole || c.previousRole || '').toLowerCase().includes(q);
          if (!matchesSkills && !matchesName && !matchesRole) return false;
        }
      }

      // Dynamic Facet Filters from API
      // 1. Location
      if (selectedFilters.location?.length) {
        const cLoc = (c.location || '').toLowerCase();
        const cPref = (c.prefLocation || '').toLowerCase();
        const matchLoc = selectedFilters.location.some(
          (loc) => cLoc.includes(loc.toLowerCase()) || cPref.includes(loc.toLowerCase())
        );
        if (!matchLoc) return false;
      }

      // 2. Locality
      if (selectedFilters.locality?.length) {
        const cLoc = (c.location || '').toLowerCase();
        const matchLocality = selectedFilters.locality.some((loc) => {
          const sub = loc.split(',')[0].trim().toLowerCase();
          return cLoc.includes(sub) || cLoc.includes(loc.toLowerCase());
        });
        if (!matchLocality) return false;
      }

      // 3. Experience
      if (appliedExpRange) {
        const numMatch = (c.experience || '').match(/(\d+(\.\d+)?)/);
        const yrs = numMatch ? parseFloat(numMatch[1]) : 0;
        if (yrs < appliedExpRange.min || (appliedExpRange.max < 30 && yrs > appliedExpRange.max)) {
          return false;
        }
      }

      // 4. Notice period
      if (
        selectedFilters.notice?.length &&
        !selectedFilters.notice.includes('any') &&
        !selectedFilters.notice.includes('Any')
      ) {
        const np = (c.noticePeriod || '').toLowerCase();
        const matchNotice = selectedFilters.notice.some((bucket) => {
          if (bucket === 'Currently serving') return np.includes('serving');
          if (bucket === '0-15 days') return np.includes('0-15') || np.includes('15') || np.includes('immediate');
          if (bucket === '1 month') return np.includes('1m') || np.includes('1 month') || np.includes('30');
          if (bucket === '2 months') return np.includes('2m') || np.includes('2 month') || np.includes('60');
          if (bucket === '3 months') return np.includes('3m') || np.includes('3 month') || np.includes('90');
          if (bucket === 'more than 3 months') return np.includes('>') || np.includes('more') || np.includes('90+');
          return np.includes(bucket.toLowerCase());
        });
        if (!matchNotice) return false;
      }

      // 5. Salary
      if (salaryNotMentionedChecked) {
        const hasNoSalary =
          !c.salary || c.salary.toLowerCase().includes('not') || c.salary.trim() === '₹';
        if (!hasNoSalary) return false;
      } else if (appliedSalRange) {
        const numMatch = (c.salary || '').match(/(\d+(\.\d+)?)/);
        const sal = numMatch ? parseFloat(numMatch[1]) : null;
        if (sal !== null) {
          if (sal < appliedSalRange.min || (appliedSalRange.max < 50 && sal > appliedSalRange.max)) {
            return false;
          }
        }
      }

      // 6. Education
      if (selectedFilters.education?.length) {
        const cEdu = (c.education || '').toLowerCase();
        const matchEdu = selectedFilters.education.some((edu) =>
          cEdu.includes(edu.toLowerCase())
        );
        if (!matchEdu) return false;
      }

      // 7. Diversity
      if (selectedFilters.diversity?.length) {
        const cDiv = (c.diversity || c.gender || 'Men').toLowerCase();
        const matchDiv = selectedFilters.diversity.some((d) => {
          if (d === 'Men') return cDiv.includes('men') || cDiv.includes('male') || !c.gender;
          if (d === 'Women') return cDiv.includes('women') || cDiv.includes('female');
          return cDiv.includes(d.toLowerCase());
        });
        if (!matchDiv) return false;
      }

      // 8. Industry
      if (selectedFilters.industry?.length) {
        const cInd = `${c.industry || ''} ${c.currentRole || ''} ${c.previousRole || ''}`.toLowerCase();
        const matchInd = selectedFilters.industry.some((ind) => {
          if (ind === 'BPM / BPO') {
            return (
              cInd.includes('bpm') ||
              cInd.includes('bpo') ||
              cInd.includes('customer service') ||
              cInd.includes('concentrix') ||
              cInd.includes('support') ||
              cInd.includes('voice')
            );
          }
          return cInd.includes(ind.toLowerCase());
        });
        if (!matchInd) return false;
      }

      // 9. Designation
      if (selectedFilters.designation?.length) {
        const cDes = `${c.designation || ''} ${c.currentRole || ''} ${c.previousRole || ''}`.toLowerCase();
        const matchDes = selectedFilters.designation.some((des) =>
          cDes.includes(des.toLowerCase())
        );
        if (!matchDes) return false;
      }

      // 10. Company
      if (selectedFilters.company?.length) {
        const cComp = `${c.company || ''} ${c.currentRole || ''} ${c.previousRole || ''}`.toLowerCase();
        const matchComp = selectedFilters.company.some((comp) =>
          cComp.includes(comp.toLowerCase())
        );
        if (!matchComp) return false;
      }

      // 11. Department
      if (selectedFilters.department?.length) {
        const cDept = `${c.department || ''} ${c.keySkills || ''} ${c.bio || ''} ${c.currentRole || ''}`.toLowerCase();
        const matchDept = selectedFilters.department.some((dept) => {
          if (dept === 'Sales & Business Development') {
            return cDept.includes('sales') || cDept.includes('business development');
          }
          if (dept === 'Aviation & Aerospace') {
            return cDept.includes('aviation') || cDept.includes('aerospace');
          }
          return cDept.includes(dept.toLowerCase());
        });
        if (!matchDept) return false;
      }

      // 12. Institute
      if (selectedFilters.institute?.length) {
        const cInsts = (c.institutes || []).map((i) => i.toLowerCase());
        const cEdu = (c.education || '').toLowerCase();
        const matchInst = selectedFilters.institute.some(
          (inst) =>
            cInsts.some((i) => i.includes(inst.toLowerCase())) ||
            cEdu.includes(inst.toLowerCase())
        );
        if (!matchInst) return false;
      }

      return true;
    });
  }, [
    primaryTabCandidates,
    subFilter,
    aiRecChecked,
    keywordSearch,
    keySkillsOnly,
    selectedFilters,
    appliedExpRange,
    appliedSalRange,
    salaryNotMentionedChecked,
  ]);

  useEffect(() => {
    if (filteredCandidates.length > 0) {
      sessionStorage.setItem('maven_candidate_list', JSON.stringify(filteredCandidates.map(c => c.candidateId)));
      sessionStorage.setItem('maven_search_text', keywordSearch || '');
      sessionStorage.setItem('maven_search_total', filteredCandidates.length);
    }
  }, [filteredCandidates, keywordSearch]);

  // Bulk Selection
  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.applicationId));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Mark candidate as viewed (decreases Not viewed count dynamically)
  const handleMarkAsViewed = async (applicationId) => {
    setCandidates((prev) =>
      prev.map((c) => (c.applicationId === applicationId ? { ...c, isViewed: true } : c))
    );
    try {
      await employerJobService.updateCandidateJobStatus(jobId, applicationId, null, null, true);
    } catch {
      // silent background update
    }
  };

  // Status Actions
  const handleUpdateStatus = async (applicationId, statusName) => {
    try {
      await employerJobService.updateCandidateJobStatus(jobId, applicationId, statusName);
      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId ? { ...c, status: statusName, isViewed: true } : c
        )
      );
      showToast(`Candidate marked as ${statusName.toLowerCase()}.`);
    } catch (err) {
      showToast(err?.message || 'Failed to update candidate status.');
    }
  };

  // Bulk Shortlist
  const handleBulkShortlist = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one candidate.');
      return;
    }
    for (const id of selectedIds) {
      await employerJobService.updateCandidateJobStatus(jobId, id, 'SHORTLISTED');
    }
    setCandidates((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.applicationId)
          ? { ...c, status: 'SHORTLISTED', isViewed: true }
          : c
      )
    );
    showToast(`Shortlisted ${selectedIds.length} candidate(s).`);
    setSelectedIds([]);
  };

  // Bulk Reject
  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one candidate.');
      return;
    }
    for (const id of selectedIds) {
      await employerJobService.updateCandidateJobStatus(jobId, id, 'REJECTED');
    }
    setCandidates((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.applicationId) ? { ...c, status: 'REJECTED', isViewed: true } : c
      )
    );
    showToast(`Rejected ${selectedIds.length} candidate(s).`);
    setSelectedIds([]);
  };

  // Share Job
  const handleShareJob = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Job responses link copied to clipboard!');
    } else {
      showToast('Job link ready to share.');
    }
  };

  // Reveal candidate contact number
  const handleRevealContact = (candidate) => {
    handleMarkAsViewed(candidate.applicationId);
    setRevealedContacts((prev) => ({ ...prev, [candidate.applicationId]: true }));
    const phone = candidate.phone || '917017890403';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      showToast(`Phone: ${phone} (Copied to clipboard!)`);
    } else {
      showToast(`Phone: ${phone}`);
    }
  };

  // Copy phone number on click
  const handleCopyPhone = (e, phone) => {
    e.stopPropagation();
    const cleanNumber = phone || '';
    if (!cleanNumber) {
      showToast('No phone number available.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanNumber);
      showToast(`Copied ${cleanNumber} to clipboard!`);
    } else {
      showToast(`Phone: ${cleanNumber}`);
    }
  };

  // Call from system app (dialer)
  const handleCallFromApp = (candidate) => {
    const rawPhone = candidate.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      showToast(`Opening default calling app for ${cleanPhone}...`);
      window.location.href = `tel:${cleanPhone}`;
    } else {
      showToast('No phone number available for this candidate.');
    }
  };

  // Send message on WhatsApp
  const handleOpenWhatsApp = (candidate) => {
    const rawPhone = candidate.phone || '';
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (!digits) {
      showToast('No valid contact number available for WhatsApp.');
      return;
    }
    const phoneWithCountry = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(
      `Hello ${candidate.name || 'Candidate'}, we saw your profile regarding your application for the ${job.title || 'position'} role on Maven.`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank');
  };

  // Send email to candidate
  const handleOpenEmail = (candidate) => {
    const email = candidate.email || '';
    if (!email) {
      showToast('No email address available for this candidate.');
      return;
    }
    const subject = encodeURIComponent(`Application for ${job.title || 'position'} at Maven`);
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  // Update Call / Outreach Status
  const handleSelectCallStatus = async (candidate, statusOption) => {
    setOpenStatusDropdownId(null);
    try {
      await employerJobService.updateCandidateJobStatus(jobId, candidate.applicationId, null, statusOption);
      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === candidate.applicationId
            ? { ...c, callStatus: statusOption, isViewed: true }
            : c
        )
      );
      showToast(`Status updated to "${statusOption}"`);
    } catch (err) {
      showToast(err?.message || 'Failed to update status.');
    }
  };

  // Add comment to candidate
  const handleAddComment = async (candidate) => {
    const text = (commentTexts[candidate.applicationId] || '').trim();
    if (!text) {
      showToast('Please type a comment before submitting.');
      return;
    }
    setIsSubmittingComment(true);
    try {
      const saved = await employerJobService.addCandidateComment(jobId, candidate.applicationId, text);
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.applicationId === candidate.applicationId) {
            const existing = Array.isArray(c.comments) ? c.comments : [];
            return { ...c, comments: [...existing, saved] };
          }
          return c;
        })
      );
      setCommentTexts((prev) => ({ ...prev, [candidate.applicationId]: '' }));
      showToast('Comment saved successfully.');
    } catch (err) {
      showToast(err?.message || 'Failed to save comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const job = data?.job || {
    title: '',
    location: '',
    status: '',
  };

  const insights = data?.insights || {
    sentToCandidates: 0,
    viewRate: '0%',
    responseRate: '0%',
  };

  const tabsCount = primaryTabsCount;

  return (
    <EmployerLayout activeTab="jobs" requireAuth={false}>
      <div className="jrd-container">
        {/* Toast Alert */}
        {toast && (
          <div className="mjr-toast">
            <FiCheckCircle size={18} color="#10b981" />
            <span>{toast}</span>
          </div>
        )}

        {/* Top Header Bar & Breadcrumb (Screenshot 1) */}
        <div className="jrd-header-bar">
          <div className="jrd-breadcrumb">
            <Link to="/employer/jobs-responses" className="jrd-crumb-link">
              <FiFolder size={17} />
              <span>All Jobs</span>
            </Link>
            <FiChevronRight size={13} className="jrd-crumb-sep" />
            <span className="jrd-crumb-title">{job.title}</span>
            <span className="jrd-badge-active">{job.status || 'Active'}</span>
          </div>

          <div className="jrd-header-right">
            <button type="button" className="jrd-btn-share" onClick={handleShareJob}>
              <FiShare2 size={15} />
              <span>Share job</span>
            </button>

            <div className="jrd-insights-box">
              <span className="jrd-insights-title">NVite insights from last 90 days</span>
              <div className="jrd-insights-stats">
                <span>Sent to <strong>{insights.sentToCandidates} candidates</strong></span>
                <span className="jrd-insights-sep">|</span>
                <span>View rate <strong>{insights.viewRate}</strong></span>
                <span className="jrd-insights-sep">|</span>
                <span>Response rate <strong>{insights.responseRate}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout Grid */}
        <div className="jrd-main-grid">
          {/* Left Sidebar */}
          <aside className="jrd-sidebar">
            {/* Top Apply Inbox Navigation */}
            <div className="jrd-inbox-nav">
              <button
                type="button"
                className="jrd-inbox-item active"
                onClick={() => setActiveTab('all')}
              >
                <div className="jrd-inbox-item-left">
                  <FiMail size={16} />
                  <span>Apply Inbox</span>
                </div>
                <span className="jrd-inbox-count">{data?.inboxCounts?.applyInbox ?? candidates.length}</span>
              </button>

              <button
                type="button"
                className="jrd-inbox-item"
                onClick={() => showToast('No other category responses yet.')}
              >
                <div className="jrd-inbox-item-left">
                  <FiInfo size={16} />
                  <span>Others</span>
                </div>
                <span className="jrd-inbox-count">{data?.inboxCounts?.others ?? 0}</span>
              </button>
            </div>

            {/* Filters Header */}
            <div>
              <div className="jrd-filters-header-row">
                <div className="jrd-filters-header">Filters</div>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="jrd-btn-clear-all-filters"
                    onClick={clearAllFilters}
                  >
                    Clear all ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* AI Recommendations - only show if available for this job */}
              {((data?.filters?.aiRecommendationsCount ?? candidates.filter((c) => c.isRecommended).length) > 0 || aiRecChecked) && (
                <label className="jrd-filter-ai-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      className="jrd-checkbox"
                      checked={aiRecChecked}
                      onChange={(e) => setAiRecChecked(e.target.checked)}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span>AI-recommendations</span>
                      <FiInfo size={13} style={{ color: '#64748b' }} />
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    {data?.filters?.aiRecommendationsCount ?? candidates.filter((c) => c.isRecommended).length}
                  </span>
                </label>
              )}

              {/* Accordions Group */}
              <div className="jrd-accordions-group">
                {/* Accordion 1: Keywords */}
                <div className="jrd-accordion-item">
                  <button
                    type="button"
                    className="jrd-accordion-btn"
                    onClick={() => setKeywordsOpen((prev) => !prev)}
                  >
                    <span>Keywords</span>
                    {keywordsOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                  </button>

                  {keywordsOpen && (
                    <div className="jrd-accordion-body">
                      <div className="jrd-search-input-box">
                        <input
                          type="text"
                          className="jrd-search-input"
                          placeholder="Search keywords in profile"
                          value={keywordSearch}
                          onChange={(e) => setKeywordSearch(e.target.value)}
                        />
                      </div>
                      <label className="jrd-filter-pill-label">
                        <input
                          type="checkbox"
                          className="jrd-checkbox"
                          checked={keySkillsOnly}
                          onChange={(e) => setKeySkillsOnly(e.target.checked)}
                        />
                        <span>Search in key skills only</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Render All Filter Types matching Screenshots */}
                {ACCORDION_SECTIONS.map((sec) => {
                  const options = data?.filters?.[sec.id] || [];
                  const selectedCount = selectedFilters[sec.id]?.length || 0;
                  const searchVal = accordionSearches[sec.id] || '';
                  const filteredOptions = options.filter((opt) =>
                    (opt.label || '').toLowerCase().includes(searchVal.toLowerCase())
                  );
                  const isOpen = openAccordions[sec.id] !== false;

                  const hasActiveSectionFilter =
                    selectedCount > 0 ||
                    (sec.id === 'experience' && appliedExpRange !== null) ||
                    (sec.id === 'salary' && (appliedSalRange !== null || salaryNotMentionedChecked));

                  return (
                    <div key={sec.id} className="jrd-accordion-item">
                      <button
                        type="button"
                        className="jrd-accordion-btn"
                        onClick={() => toggleAccordion(sec.id)}
                      >
                        <span className="jrd-accordion-btn-left">
                          <span>{sec.label}</span>
                          {selectedCount > 0 && (
                            <span className="jrd-filter-selected-badge">{selectedCount}</span>
                          )}
                        </span>
                        <div className="jrd-accordion-btn-right">
                          {hasActiveSectionFilter && (
                            <span
                              className="jrd-filter-section-clear"
                              onClick={(e) => clearFilterSection(sec.id, e)}
                              title="Clear section"
                            >
                              Clear
                            </span>
                          )}
                          {isOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="jrd-accordion-body">
                          {sec.id === 'experience' ? (
                            /* Experience Histogram & Range Selector (Screenshot 2) */
                            <div className="jrd-histogram-container">
                              <div className="jrd-histogram-bars">
                                {(data?.filters?.experienceHistogram || [
                                  { range: '0-6', count: candidates.length },
                                  { range: '6-12', count: 0 },
                                  { range: '12-18', count: 0 },
                                  { range: '18-24', count: 0 },
                                  { range: '24-30', count: 0 },
                                  { range: '30+', count: 0 },
                                ]).map((b) => {
                                  const maxCount = Math.max(
                                    1,
                                    ...((data?.filters?.experienceHistogram || []).map((x) => x.count))
                                  );
                                  const heightPercent =
                                    b.count > 0 ? Math.max(25, Math.round((b.count / maxCount) * 100)) : 4;
                                  return (
                                    <div key={b.range} className="jrd-histogram-bar-wrap">
                                      <div
                                        className={`jrd-histogram-bar ${b.count > 0 ? 'active' : ''}`}
                                        style={{ height: `${heightPercent}%` }}
                                        title={`${b.range} yrs: ${b.count} candidate(s)`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="jrd-histogram-ticks">
                                <span>0</span>
                                <span>6</span>
                                <span>12</span>
                                <span>18</span>
                                <span>24</span>
                                <span>30</span>
                                <span>30+</span>
                              </div>
                              <div className="jrd-range-controls">
                                <select
                                  className="jrd-range-select"
                                  value={expMin}
                                  onChange={(e) => setExpMin(Number(e.target.value))}
                                >
                                  <option value={0}>0 years</option>
                                  <option value={1}>1 year</option>
                                  <option value={2}>2 years</option>
                                  <option value={3}>3 years</option>
                                  <option value={4}>4 years</option>
                                  <option value={5}>5 years</option>
                                  <option value={6}>6 years</option>
                                  <option value={10}>10 years</option>
                                  <option value={15}>15 years</option>
                                  <option value={20}>20 years</option>
                                  <option value={30}>30+ years</option>
                                </select>
                                <span className="jrd-range-to-text">to</span>
                                <select
                                  className="jrd-range-select"
                                  value={expMax}
                                  onChange={(e) => setExpMax(Number(e.target.value))}
                                >
                                  <option value={1}>1 year</option>
                                  <option value={2}>2 years</option>
                                  <option value={3}>3 years</option>
                                  <option value={5}>5 years</option>
                                  <option value={6}>6 years</option>
                                  <option value={10}>10 years</option>
                                  <option value={15}>15 years</option>
                                  <option value={20}>20 years</option>
                                  <option value={30}>30+ years</option>
                                </select>
                                <button
                                  type="button"
                                  className="jrd-btn-range-apply"
                                  onClick={() => setAppliedExpRange({ min: expMin, max: expMax })}
                                  title="Apply experience range"
                                >
                                  <FiArrowRight size={16} />
                                </button>
                              </div>
                              <div className="jrd-range-note">
                                <FiInfo size={13} style={{ color: '#94a3b8' }} />
                                <span>Result will include freshers as well</span>
                              </div>
                            </div>
                          ) : sec.id === 'salary' ? (
                            /* Salary Range Selector & Not Mentioned Checkbox (Screenshot 2) */
                            <div>
                              <div className="jrd-range-controls">
                                <select
                                  className="jrd-range-select"
                                  value={salMin}
                                  onChange={(e) => setSalMin(Number(e.target.value))}
                                >
                                  <option value={0}>0 Lacs</option>
                                  <option value={1}>1 Lac</option>
                                  <option value={2}>2 Lacs</option>
                                  <option value={3}>3 Lacs</option>
                                  <option value={4}>4 Lacs</option>
                                  <option value={5}>5 Lacs</option>
                                  <option value={6}>6 Lacs</option>
                                  <option value={7}>7 Lacs</option>
                                  <option value={8}>8 Lacs</option>
                                  <option value={9.99}>9.99+ Lacs</option>
                                  <option value={15}>15 Lacs</option>
                                  <option value={20}>20 Lacs</option>
                                  <option value={50}>50+ Lacs</option>
                                </select>
                                <span className="jrd-range-to-text">to</span>
                                <select
                                  className="jrd-range-select"
                                  value={salMax}
                                  onChange={(e) => setSalMax(Number(e.target.value))}
                                >
                                  <option value={1}>1 Lac</option>
                                  <option value={2}>2 Lacs</option>
                                  <option value={3}>3 Lacs</option>
                                  <option value={5}>5 Lacs</option>
                                  <option value={6}>6 Lacs</option>
                                  <option value={7}>7 Lacs</option>
                                  <option value={8}>8 Lacs</option>
                                  <option value={9.99}>9.99+ ...</option>
                                  <option value={15}>15 Lacs</option>
                                  <option value={20}>20 Lacs</option>
                                  <option value={50}>50+ Lacs</option>
                                </select>
                                <button
                                  type="button"
                                  className="jrd-btn-range-apply"
                                  onClick={() => setAppliedSalRange({ min: salMin, max: salMax })}
                                  title="Apply salary range"
                                >
                                  <FiArrowRight size={16} />
                                </button>
                              </div>
                              <label className="jrd-filter-option-item" style={{ marginTop: 8 }}>
                                <div className="jrd-filter-option-left">
                                  <input
                                    type="checkbox"
                                    className="jrd-checkbox"
                                    checked={salaryNotMentionedChecked}
                                    onChange={(e) => setSalaryNotMentionedChecked(e.target.checked)}
                                  />
                                  <span className="jrd-filter-option-label">
                                    Candidates with salary not mentioned
                                  </span>
                                </div>
                                <span className="jrd-filter-option-count">
                                  {data?.filters?.salaryNotMentionedCount ?? 0}
                                </span>
                              </label>
                            </div>
                          ) : (
                            /* Category Checkbox Lists (Screenshots 1, 2, 3, 4) */
                            <>
                              {!['notice', 'diversity'].includes(sec.id) && (
                                <div className="jrd-filter-search-box">
                                  <input
                                    type="text"
                                    className="jrd-filter-search-input"
                                    placeholder={`Search ${
                                      sec.label === 'Education' || sec.label === 'Industry'
                                        ? sec.label
                                        : sec.label.toLowerCase().split('/')[0].trim()
                                    }`}
                                    value={searchVal}
                                    onChange={(e) =>
                                      setAccordionSearches((prev) => ({
                                        ...prev,
                                        [sec.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  {searchVal && (
                                    <button
                                      type="button"
                                      className="jrd-filter-search-clear"
                                      onClick={() =>
                                        setAccordionSearches((prev) => ({ ...prev, [sec.id]: '' }))
                                      }
                                    >
                                      <FiX size={12} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {filteredOptions.length === 0 ? (
                                <div className="jrd-filter-empty-text">No matches found</div>
                              ) : (
                                <div className="jrd-filter-options-list">
                                  {filteredOptions.map((opt) => {
                                    const isChecked = (selectedFilters[sec.id] || []).includes(opt.id);
                                    return (
                                      <label key={opt.id} className="jrd-filter-option-item">
                                        <div className="jrd-filter-option-left">
                                          <input
                                            type="checkbox"
                                            className="jrd-checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleFilterOption(sec.id, opt.id)}
                                          />
                                          <span className="jrd-filter-option-label" title={opt.label}>
                                            {opt.label}
                                          </span>
                                        </div>
                                        <span className="jrd-filter-option-count">{opt.count}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Main Column */}
          <main className="jrd-content-area">
            {/* Top Primary Tabs (Screenshot 1) */}
            <div className="jrd-tabs-row">
              <div className="jrd-tabs-left">
                <button
                  type="button"
                  className={`jrd-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('all');
                    setSubFilter('all');
                  }}
                >
                  All responses {primaryTabsCount.all}
                </button>
                <button
                  type="button"
                  className={`jrd-tab-btn ${activeTab === 'shortlisted' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('shortlisted');
                    setSubFilter('all');
                  }}
                >
                  Shortlisted {primaryTabsCount.shortlisted}
                </button>
                <button
                  type="button"
                  className={`jrd-tab-btn ${activeTab === 'maybe' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('maybe');
                    setSubFilter('all');
                  }}
                >
                  Maybe {primaryTabsCount.maybe}
                </button>
                <button
                  type="button"
                  className={`jrd-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('rejected');
                    setSubFilter('all');
                  }}
                >
                  Rejected {primaryTabsCount.rejected}
                </button>
              </div>
            </div>

            {/* Sub-filter Pills (Matches user screenshot) */}
            <div className="jrd-sub-filters-row">
              <button
                type="button"
                className={`jrd-sub-pill ${subFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubFilter('all')}
              >
                All {subCounts.all}
              </button>
              <button
                type="button"
                className={`jrd-sub-pill ${subFilter === 'new' ? 'active' : ''}`}
                onClick={() => setSubFilter('new')}
              >
                New responses {subCounts.newResponses}
              </button>
              <button
                type="button"
                className={`jrd-sub-pill ${subFilter === 'not_viewed' ? 'active' : ''}`}
                onClick={() => setSubFilter('not_viewed')}
              >
                Not viewed {subCounts.notViewed}
              </button>
              <button
                type="button"
                className={`jrd-sub-pill ${subFilter === 'action_pending' ? 'active' : ''}`}
                onClick={() => setSubFilter('action_pending')}
              >
                Action pending {subCounts.actionPending}
              </button>
            </div>

            {/* Showing count and Sort selector */}
            <div className="jrd-meta-summary-row">
              <span>Showing {filteredCandidates.length} response{filteredCandidates.length !== 1 ? 's' : ''}</span>
              <div className="jrd-sort-box">
                <span>Sort by:</span>
                <select
                  className="jrd-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="date-desc">Application Date (Newest)</option>
                  <option value="exp-desc">Experience (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Toolbar / Bulk Action Bar */}
            <div className="jrd-toolbar">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="jrd-checkbox"
                  checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length}
                  onChange={handleSelectAll}
                />
                <span>Select all</span>
              </label>

              <button type="button" className="jrd-toolbar-btn" onClick={handleBulkShortlist}>
                <FiCheck size={14} color="#059669" />
                <span>Shortlist</span>
              </button>

              <button type="button" className="jrd-toolbar-btn" onClick={handleBulkReject}>
                <FiX size={14} color="#dc2626" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                className="jrd-toolbar-btn"
                onClick={() => showToast('Opening bulk email composer...')}
              >
                <FiMail size={14} />
                <span>Email</span>
              </button>

              <button
                type="button"
                className="jrd-toolbar-btn"
                onClick={() => showToast('Downloading candidate resumes...')}
              >
                <FiDownload size={14} />
                <span>Download</span>
              </button>

              <button
                type="button"
                className="jrd-toolbar-btn"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    showToast('Please select at least one candidate.');
                    return;
                  }
                  setCandidates((prev) => prev.filter((c) => !selectedIds.includes(c.applicationId)));
                  setSelectedIds([]);
                  showToast('Removed selected candidate responses.');
                }}
              >
                <FiTrash2 size={14} />
                <span>Delete</span>
              </button>
            </div>


            {/* Candidate Cards List */}
            <div className="jrd-candidates-list">
              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div className="mjr-spinner" />
                  <p style={{ marginTop: 14, fontSize: 14, color: '#64748b' }}>Loading candidate responses...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="mjr-draft-empty-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p className="mjr-draft-empty-title">
                    {candidates.length === 0 ? 'No candidate responses yet' : 'No candidate responses match your filters'}
                  </p>
                  <p className="mjr-draft-empty-subtitle">
                    {candidates.length === 0
                      ? 'When candidates apply to this job, their profiles and application responses will appear here.'
                      : 'Try adjusting your keywords or sub-filter tabs.'}
                  </p>
                </div>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = selectedIds.includes(candidate.applicationId);

                  return (
                    <div
                      key={candidate.applicationId}
                      className={`jrd-candidate-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="jrd-card-main-grid">
                        {/* Column 1: Checkbox */}
                        <div className="jrd-card-checkbox-col">
                          <input
                            type="checkbox"
                            className="jrd-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(candidate.applicationId)}
                          />
                        </div>

                        {/* Column 2: Candidate Details */}
                        <div className="jrd-card-profile-col">
                          {/* Name & Recommended Badge */}
                          <div className="jrd-card-name-row">
                            <span
                              className="jrd-candidate-name jrd-candidate-name--link"
                              onClick={() => {
                                handleMarkAsViewed(candidate.applicationId);
                                if (candidate.candidateId) {
                                  const query = new URLSearchParams();
                                  if (candidate.applicationId) query.set('applicationId', candidate.applicationId);
                                  if (jobId) query.set('jobId', jobId);
                                  const qs = query.toString() ? `?${query.toString()}` : '';
                                  window.open(`/employer/candidate/${candidate.candidateId}${qs}`, '_blank', 'noopener,noreferrer');
                                } else {
                                  showToast(`No profile ID found for ${candidate.name}`);
                                }
                              }}
                              title={`View full profile of ${candidate.name}`}
                            >
                              {candidate.name}
                            </span>
                            {!candidate.isViewed && (
                              <span className="jrd-badge-new-response">New</span>
                            )}
                            {candidate.isRecommended && (
                              <span className="jrd-badge-recommended">Recommended</span>
                            )}
                          </div>

                          {/* Meta Tags Row */}
                          <div className="jrd-card-meta-tags">
                            {candidate.experience && (
                              <span className="jrd-meta-tag-item">
                                <FiBriefcase size={14} color="#64748b" /> {candidate.experience}
                              </span>
                            )}
                            {candidate.salary && (
                              <span className="jrd-meta-tag-item">
                                {candidate.salary.startsWith('₹') ? candidate.salary : `₹ ${candidate.salary}`}
                              </span>
                            )}
                            {candidate.noticePeriod && (
                              <span className="jrd-meta-tag-item">
                                <FiClock size={14} color="#64748b" /> {candidate.noticePeriod}
                              </span>
                            )}
                            {candidate.location && (
                              <span className="jrd-meta-tag-item">
                                <FiMapPin size={14} color="#64748b" /> {candidate.location}
                              </span>
                            )}
                          </div>

                          {/* Details Table */}
                          <div className="jrd-details-table">
                            {candidate.currentRole && (
                              <div className="jrd-detail-row">
                                <span className="jrd-detail-label">Current</span>
                                <span className="jrd-detail-val">{candidate.currentRole}</span>
                              </div>
                            )}

                            {candidate.previousRole && (
                              <div className="jrd-detail-row">
                                <span className="jrd-detail-label">Previous</span>
                                <span className="jrd-detail-val">{candidate.previousRole}</span>
                              </div>
                            )}

                            {candidate.education && (
                              <div className="jrd-detail-row">
                                <span className="jrd-detail-label">Education</span>
                                <span className="jrd-detail-val">{candidate.education}</span>
                              </div>
                            )}

                            {candidate.prefLocation && (
                              <div className="jrd-detail-row">
                                <span className="jrd-detail-label">Pref. location</span>
                                <span className="jrd-detail-val">{candidate.prefLocation}</span>
                              </div>
                            )}

                            {candidate.keySkills && (
                              <div className="jrd-detail-row">
                                <span className="jrd-detail-label">Key skills</span>
                                <span className="jrd-detail-skills">{candidate.keySkills}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Avatar, Quote, Call & Social */}
                        <div className="jrd-card-right-col">
                          {/* Round Avatar or Initials Badge */}
                          {candidate.avatar ? (
                            <img
                              src={candidate.avatar}
                              alt={candidate.name}
                              className="jrd-avatar-img"
                              onClick={() => {
                                handleMarkAsViewed(candidate.applicationId);
                                showToast(`Viewing profile of ${candidate.name}`);
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <div
                              className="jrd-avatar-img"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#e0f2fe',
                                color: '#0284c7',
                                fontWeight: 700,
                                fontSize: 18,
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                handleMarkAsViewed(candidate.applicationId);
                                showToast(`Viewing profile of ${candidate.name}`);
                              }}
                            >
                              {(candidate.name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Bio Quote */}
                          {candidate.bio && (
                            <p className="jrd-bio-quote" title={candidate.bio}>
                              &ldquo;{candidate.bio}&rdquo;
                            </p>
                          )}

                          {/* Candidate Email text */}
                          {candidate.email && (
                            <div className="jrd-candidate-email-text" title={candidate.email}>
                              {candidate.email}
                            </div>
                          )}

                          {/* Contact | Status Pill */}
                          <div className="jrd-contact-status-wrapper">
                            <div className="jrd-contact-status-pill">
                              {revealedContacts[candidate.applicationId] ? (
                                <span
                                  className="jrd-contact-phone-revealed"
                                  title="Click to copy number"
                                  onClick={(e) => handleCopyPhone(e, candidate.phone)}
                                >
                                  <FiCopy size={13} />
                                  <span>{candidate.phone || 'No phone'}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="jrd-contact-trigger-btn"
                                  onClick={() => handleRevealContact(candidate)}
                                  title="View and copy phone number"
                                >
                                  <FiPhone size={12} />
                                  <span>Contact</span>
                                </button>
                              )}

                              <span className="jrd-contact-sep">|</span>

                              <button
                                type="button"
                                className={`jrd-status-trigger-btn ${candidate.callStatus ? 'has-status' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusDropdownId(
                                    openStatusDropdownId === candidate.applicationId ? null : candidate.applicationId
                                  );
                                }}
                                title="Change status"
                              >
                                <span>{candidate.callStatus || 'Status'}</span>
                                <FiChevronDown size={13} />
                              </button>
                            </div>

                            {/* Status Dropdown Menu with 4 options matching screenshot 1 */}
                            {openStatusDropdownId === candidate.applicationId && (
                              <div className="jrd-status-dropdown-menu">
                                {['Called', 'Messaged', 'Not picked', 'Not reachable'].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    className={`jrd-status-menu-item ${candidate.callStatus === opt ? 'selected' : ''}`}
                                    onClick={() => handleSelectCallStatus(candidate, opt)}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Call from app button - triggers system calling app */}
                          <button
                            type="button"
                            className="jrd-btn-call-app"
                            onClick={() => handleCallFromApp(candidate)}
                            title={`Call ${candidate.name} via system phone app`}
                          >
                            <FiSmartphone size={14} />
                            <span>Call from app</span>
                            <FiArrowRight size={13} />
                          </button>

                          {/* Side Action Icons */}
                          <div className="jrd-side-icons">
                            <div
                              className="jrd-side-icon-btn-wrapper"
                              onMouseEnter={() => setHoveredTooltip(`email-${candidate.applicationId}`)}
                              onMouseLeave={() => setHoveredTooltip(null)}
                            >
                              <button
                                type="button"
                                className="jrd-side-icon-btn"
                                title="Email"
                                onClick={() => handleOpenEmail(candidate)}
                              >
                                <FiMail size={15} />
                              </button>
                              {hoveredTooltip === `email-${candidate.applicationId}` && (
                                <div className="jrd-side-tooltip">Email</div>
                              )}
                            </div>

                            <div className="jrd-side-icon-btn-wrapper">
                              <button
                                type="button"
                                className="jrd-side-icon-btn"
                                title="Share candidate profile"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(window.location.href);
                                    showToast("Candidate profile link copied!");
                                  }
                                }}
                              >
                                <FiSend size={15} />
                              </button>
                            </div>

                            <div className="jrd-side-icon-btn-wrapper">
                              <button
                                type="button"
                                className="jrd-side-icon-btn whatsapp"
                                title="Message on WhatsApp"
                                onClick={() => handleOpenWhatsApp(candidate)}
                              >
                                <FaWhatsapp size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="jrd-card-footer">
                        <div className="jrd-comment-trigger-wrapper">
                          <button
                            type="button"
                            className={`jrd-btn-comment ${openCommentCandidateId === candidate.applicationId ? 'active' : ''}`}
                            onClick={() =>
                              setOpenCommentCandidateId((prev) =>
                                prev === candidate.applicationId ? null : candidate.applicationId
                              )
                            }
                          >
                            <FiMessageSquare size={14} />
                            <span>Add comment</span>
                          </button>
                          {openCommentCandidateId === candidate.applicationId && (
                            <div className="jrd-btn-comment-indicator" />
                          )}
                        </div>

                        <div className="jrd-card-actions-right">
                          <button
                            type="button"
                            className={`jrd-btn-action shortlist ${candidate.status === 'SHORTLISTED' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(candidate.applicationId, 'SHORTLISTED')}
                          >
                            {candidate.status === 'SHORTLISTED' && (
                              <div className="jrd-action-active-badge">
                                <FiCheck size={10} strokeWidth={4} />
                              </div>
                            )}
                            <FiCheck size={14} />
                            <span>Shortlist</span>
                          </button>

                          <button
                            type="button"
                            className={`jrd-btn-action maybe ${candidate.status === 'MAYBE' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(candidate.applicationId, 'MAYBE')}
                          >
                            {candidate.status === 'MAYBE' && (
                              <div className="jrd-action-active-badge">
                                <FiCheck size={10} strokeWidth={4} />
                              </div>
                            )}
                            <span>Maybe</span>
                          </button>

                          <button
                            type="button"
                            className={`jrd-btn-action reject ${candidate.status === 'REJECTED' ? 'active' : ''}`}
                            onClick={() => handleUpdateStatus(candidate.applicationId, 'REJECTED')}
                          >
                            {candidate.status === 'REJECTED' && (
                              <div className="jrd-action-active-badge">
                                <FiCheck size={10} strokeWidth={4} />
                              </div>
                            )}
                            <FiX size={14} />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            className="jrd-btn-delete-card"
                            title="Delete applicant"
                            onClick={() => {
                              setCandidates((prev) => prev.filter((c) => c.applicationId !== candidate.applicationId));
                              showToast(`Removed candidate ${candidate.name}.`);
                            }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        {/* Expandable Comments Area (Matches user screenshot) */}
                        {openCommentCandidateId === candidate.applicationId && (
                          <div className="jrd-comments-expand-panel">
                            {/* Previous comments list if any */}
                            {Array.isArray(candidate.comments) && candidate.comments.length > 0 && (
                              <div className="jrd-comments-list">
                                {candidate.comments.map((comm, cIdx) => (
                                  <div key={comm._id || cIdx} className="jrd-comment-bubble">
                                    <div className="jrd-comment-avatar">
                                      <FiUser size={15} />
                                    </div>
                                    <div className="jrd-comment-bubble-content">
                                      <div className="jrd-comment-author-row">
                                        <span className="jrd-comment-author-name">
                                          {comm.authorName || 'Recruiter'}
                                        </span>
                                        <span className="jrd-comment-date">
                                          {comm.createdAt
                                            ? new Date(comm.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })
                                            : 'Just now'}
                                        </span>
                                      </div>
                                      <p className="jrd-comment-bubble-text">{comm.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Comment Input Row (matches user screenshot) */}
                            <div className="jrd-comment-input-row">
                              <div className="jrd-comment-avatar">
                                <FiUser size={18} />
                              </div>
                              <div className="jrd-comment-field-wrapper">
                                <textarea
                                  className="jrd-comment-textarea"
                                  placeholder="Type your comment here"
                                  rows={2}
                                  value={commentTexts[candidate.applicationId] || ''}
                                  onChange={(e) =>
                                    setCommentTexts((prev) => ({
                                      ...prev,
                                      [candidate.applicationId]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                      handleAddComment(candidate);
                                    }
                                  }}
                                />
                                <div className="jrd-comment-submit-row">
                                  <button
                                    type="button"
                                    className="jrd-btn-submit-comment"
                                    disabled={
                                      isSubmittingComment ||
                                      !commentTexts[candidate.applicationId]?.trim()
                                    }
                                    onClick={() => handleAddComment(candidate)}
                                  >
                                    {isSubmittingComment ? 'Saving...' : 'Comment'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Applied meta note */}
                        <div className="jrd-applied-meta">
                          {candidate.appliedOn}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>
    </EmployerLayout>
  );
}
