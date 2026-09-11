import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiDownload, FiCheckCircle, FiAlertCircle,
  FiMail, FiX, FiPlus, FiBarChart2, FiBriefcase,
  FiUsers, FiEye, FiFileText, FiClock, FiSearch
} from 'react-icons/fi';
import EmployerLayout from '../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../components/employer/EmployerBreadcrumb';
import authService from '../../../services/authService';
import './JobPostingReport.css';

const formatYMD = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatYMD(d);
};

export default function JobPostingReport() {
  const navigate = useNavigate();
  const [company, setCompany] = useState({});
  const [allJobs, setAllJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Section 1: One Click Report
  const [oneClickPeriod, setOneClickPeriod] = useState('yesterday'); // 'yesterday' | 'week' | 'month'

  // Section 2: Customised Report
  const yesterdayStr = useMemo(() => getYesterday(), []);
  const [fromDate, setFromDate] = useState(yesterdayStr);
  const [toDate, setToDate] = useState(yesterdayStr);
  const [reportType, setReportType] = useState('user_wise'); // 'user_wise' | 'job_wise'
  const [displayFormat, setDisplayFormat] = useState('browser'); // 'browser' | 'excel'

  // Section 3: Auto Emailing
  const [subscription, setSubscription] = useState('disabled'); // 'disabled' | 'weekly' | 'monthly'
  const [emailList, setEmailList] = useState(['admin@mavenjobs.in']);
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Result & Action States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch employer session and job data
  useEffect(() => {
    let isMounted = true;
    const loadEmployerData = async () => {
      setLoadingJobs(true);
      try {
        const stored = localStorage.getItem('employerUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) setCompany({ name: parsed.companyName || 'My Company' });
          } catch {}
        }

        const res = await authService.getEmployerDashboard();
        if (isMounted && res?.data) {
          if (res.data.company) {
            setCompany(res.data.company);
          }
          if (Array.isArray(res.data.jobs)) {
            setAllJobs(res.data.jobs);
          }
        }
      } catch (err) {
        console.error('Failed to load employer jobs for report', err);
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    loadEmployerData();

    // Load saved auto-email settings if any
    const savedSub = localStorage.getItem('maven_report_subscription');
    if (savedSub) {
      try {
        const parsed = JSON.parse(savedSub);
        if (parsed.subscription) setSubscription(parsed.subscription);
        if (Array.isArray(parsed.emailList) && parsed.emailList.length > 0) {
          setEmailList(parsed.emailList);
        }
      } catch {}
    }

    return () => { isMounted = false; };
  }, []);

  // Helper to filter jobs by date range
  const filterJobsByDate = useCallback((start, end) => {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    return allJobs.filter(job => {
      const created = job.createdAt ? new Date(job.createdAt) : new Date();
      return created >= startDate && created <= endDate;
    });
  }, [allJobs]);

  // Export CSV/Excel function
  const exportToExcel = useCallback((dataToExport, title) => {
    if (!dataToExport || dataToExport.length === 0) {
      showToast('No job posting records available for export in this period.');
      return;
    }

    const esc = (val) => {
      const s = String(val ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    let headers = [];
    let rows = [];

    if (reportType === 'user_wise') {
      headers = ['Recruiter / User', 'User Email', 'Designation', 'Total Jobs Posted', 'Active Jobs', 'Total Views', 'Applications Received'];
      rows = dataToExport.map(row => [
        esc(row.userName),
        esc(row.userEmail),
        esc(row.designation || 'Recruiter'),
        row.jobsCount,
        row.activeCount,
        row.viewsCount,
        row.applicationsCount,
      ]);
    } else {
      headers = ['Job Title', 'Job ID', 'Posted By', 'Department', 'Location', 'Posting Date', 'Status', 'Views', 'Applications Received'];
      rows = dataToExport.map(row => [
        esc(row.title),
        esc(row._id || row.id || 'N/A'),
        esc(row.postedBy?.name || row.postedByName || company.name || 'Admin'),
        esc(row.department || row.functionalArea || 'General'),
        esc(row.location || 'Remote'),
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A',
        esc(row.status || 'Active'),
        row.views || 0,
        row.applicationsCount ?? (row.applications?.length || 0),
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${formatYMD(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Report downloaded successfully!`);
  }, [reportType, company.name, showToast]);

  // Compute Report Structure
  const buildReportData = useCallback((jobsList, mode) => {
    if (mode === 'user_wise') {
      // Group jobs by recruiter / postedBy
      const usersMap = {};
      const fallbackUser = company.name || 'HR Admin';
      const fallbackEmail = emailList[0] || 'admin@mavenjobs.in';

      jobsList.forEach(job => {
        const uName = job.postedBy?.name || job.postedByName || fallbackUser;
        const uEmail = job.postedBy?.email || job.postedByEmail || fallbackEmail;
        const key = uEmail || uName;

        if (!usersMap[key]) {
          usersMap[key] = {
            userName: uName,
            userEmail: uEmail,
            designation: job.postedBy?.designation || 'Hiring Specialist',
            jobsCount: 0,
            activeCount: 0,
            viewsCount: 0,
            applicationsCount: 0,
          };
        }

        usersMap[key].jobsCount += 1;
        if (job.status === 'Active' || job.status === 'active') {
          usersMap[key].activeCount += 1;
        }
        usersMap[key].viewsCount += (job.views || 0);
        usersMap[key].applicationsCount += (job.applicationsCount ?? (job.applications?.length || 0));
      });

      // If no jobs match yet, provide default row with current employer info
      const list = Object.values(usersMap);
      if (list.length === 0) {
        list.push({
          userName: fallbackUser,
          userEmail: fallbackEmail,
          designation: 'Recruiter',
          jobsCount: 0,
          activeCount: 0,
          viewsCount: 0,
          applicationsCount: 0,
        });
      }
      return list;
    } else {
      // Job-wise
      return jobsList.map(j => ({
        ...j,
        postedByName: j.postedBy?.name || j.postedByName || company.name || 'Recruitment Team',
        applicationsCount: j.applicationsCount ?? (j.applications?.length || 0),
      }));
    }
  }, [company.name, emailList]);

  // Handler: One Click Report
  const handleOneClickGenerate = () => {
    setIsGenerating(true);
    let start = new Date();
    let end = new Date();

    if (oneClickPeriod === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (oneClickPeriod === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (oneClickPeriod === 'month') {
      start.setDate(start.getDate() - 30);
    }

    const filtered = filterJobsByDate(start, end);
    const reportRows = buildReportData(filtered, 'job_wise');

    const totalViews = filtered.reduce((acc, j) => acc + (j.views || 0), 0);
    const totalApps = filtered.reduce((acc, j) => acc + (j.applicationsCount ?? (j.applications?.length || 0)), 0);

    setTimeout(() => {
      setGeneratedReport({
        title: `One Click Report (${oneClickPeriod.toUpperCase()})`,
        periodLabel: `${formatYMD(start)} to ${formatYMD(end)}`,
        mode: 'job_wise',
        rows: reportRows,
        metrics: {
          totalJobs: filtered.length,
          activeJobs: filtered.filter(j => (j.status || '').toLowerCase() === 'active').length,
          totalViews,
          totalApps,
        }
      });
      setIsGenerating(false);
      showToast(`One Click Report generated for ${oneClickPeriod}!`);
    }, 300);
  };

  // Handler: Customised Report
  const handleCustomisedGenerate = () => {
    if (!fromDate || !toDate) {
      showToast('Please select both From and To dates.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showToast('From date cannot be after To date.');
      return;
    }

    setIsGenerating(true);
    const filtered = filterJobsByDate(fromDate, toDate);
    const reportRows = buildReportData(filtered, reportType);

    if (displayFormat === 'excel') {
      setTimeout(() => {
        setIsGenerating(false);
        exportToExcel(reportRows, `Job_Posting_Report_${reportType}`);
      }, 300);
      return;
    }

    const totalViews = filtered.reduce((acc, j) => acc + (j.views || 0), 0);
    const totalApps = filtered.reduce((acc, j) => acc + (j.applicationsCount ?? (j.applications?.length || 0)), 0);

    setTimeout(() => {
      setGeneratedReport({
        title: `Customised Report (${reportType === 'user_wise' ? 'User Wise' : 'Job Wise'})`,
        periodLabel: `${fromDate} to ${toDate}`,
        mode: reportType,
        rows: reportRows,
        metrics: {
          totalJobs: filtered.length,
          activeJobs: filtered.filter(j => (j.status || '').toLowerCase() === 'active').length,
          totalViews,
          totalApps,
        }
      });
      setIsGenerating(false);
      showToast('Customised report generated successfully!');
    }, 300);
  };

  // Email chip addition
  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setIsAddingEmail(false);
      return;
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) {
      showToast('Please enter a valid email address.');
      return;
    }
    if (emailList.includes(trimmed)) {
      showToast('Email address already added.');
      setEmailInput('');
      setIsAddingEmail(false);
      return;
    }

    setEmailList(prev => [...prev, trimmed]);
    setEmailInput('');
    setIsAddingEmail(false);
  };

  const handleRemoveEmail = (target) => {
    if (emailList.length === 1) {
      showToast('At least one email recipient is required.');
      return;
    }
    setEmailList(prev => prev.filter(e => e !== target));
  };

  // Save Auto Emailing
  const handleSaveAutoEmail = () => {
    localStorage.setItem('maven_report_subscription', JSON.stringify({
      subscription,
      emailList,
      updatedAt: new Date().toISOString()
    }));
    showToast(subscription === 'disabled'
      ? 'Auto emailing preferences saved (Disabled).'
      : `Subscribed successfully to ${subscription} usage reports!`
    );
  };

  // Filtered rows for result table search
  const displayedRows = useMemo(() => {
    if (!generatedReport?.rows) return [];
    if (!searchTerm.trim()) return generatedReport.rows;
    const term = searchTerm.toLowerCase();

    if (generatedReport.mode === 'user_wise') {
      return generatedReport.rows.filter(r =>
        r.userName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        r.designation?.toLowerCase().includes(term)
      );
    } else {
      return generatedReport.rows.filter(r =>
        r.title?.toLowerCase().includes(term) ||
        r.postedByName?.toLowerCase().includes(term) ||
        r.location?.toLowerCase().includes(term) ||
        r.department?.toLowerCase().includes(term)
      );
    }
  }, [generatedReport, searchTerm]);

  return (
    <EmployerLayout
      company={company}
      activeTab="report"
      onNavigate={(tabId) => {
        if (tabId === 'home') navigate('/employer-dashboard');
        if (tabId === 'analysis') navigate('/employer-dashboard/analytics');
        if (tabId === 'jobs') navigate('/post-job');
      }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Report', path: '/reports-job-posting' },
        { label: 'Job Posting' },
      ]} />

      <div className="jpr-container">
        {/* Main Usage Reports Form Card */}
        <div className="jpr-card">
          <h1 className="jpr-page-title">
            <FiBarChart2 size={24} color="#002366" />
            Usage Reports
          </h1>

          {/* ─────────────────────────────────────────────────────────────
              Section 1: One Click Report
             ───────────────────────────────────────────────────────────── */}
          <div className="jpr-section">
            <h2 className="jpr-section-title">One Click Report</h2>

            <div className="jpr-form-row">
              <div className="jpr-row-label">Specify Time Period:</div>
              <div className="jpr-row-content">
                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="oneClickPeriod"
                    value="yesterday"
                    checked={oneClickPeriod === 'yesterday'}
                    onChange={() => setOneClickPeriod('yesterday')}
                  />
                  <span className="jpr-radio-custom" />
                  Yesterday
                </label>

                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="oneClickPeriod"
                    value="week"
                    checked={oneClickPeriod === 'week'}
                    onChange={() => setOneClickPeriod('week')}
                  />
                  <span className="jpr-radio-custom" />
                  This Week
                </label>

                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="oneClickPeriod"
                    value="month"
                    checked={oneClickPeriod === 'month'}
                    onChange={() => setOneClickPeriod('month')}
                  />
                  <span className="jpr-radio-custom" />
                  This Month
                </label>
              </div>
            </div>

            <div className="jpr-form-row" style={{ marginBottom: 8 }}>
              <div className="jpr-row-label"></div>
              <div className="jpr-row-content">
                <button
                  type="button"
                  className="jpr-btn-primary"
                  onClick={handleOneClickGenerate}
                  disabled={isGenerating}
                >
                  <FiBarChart2 size={15} />
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          <hr className="jpr-section-divider" />

          {/* ─────────────────────────────────────────────────────────────
              Section 2: Customised Report
             ───────────────────────────────────────────────────────────── */}
          <div className="jpr-section">
            <h2 className="jpr-section-title">Customised Report</h2>

            {/* Durations */}
            <div className="jpr-form-row">
              <div className="jpr-row-label">Specify durations:</div>
              <div className="jpr-row-content">
                <div className="jpr-date-group">
                  <div className="jpr-date-item">
                    <span className="jpr-date-sublabel">From:</span>
                    <div className="jpr-date-input-wrap">
                      <FiCalendar className="jpr-date-icon" size={15} />
                      <input
                        type="date"
                        className="jpr-date-input"
                        value={fromDate}
                        max={yesterdayStr}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="jpr-date-item">
                    <span className="jpr-date-sublabel">To:</span>
                    <div className="jpr-date-input-wrap">
                      <FiCalendar className="jpr-date-icon" size={15} />
                      <input
                        type="date"
                        className="jpr-date-input"
                        value={toDate}
                        max={yesterdayStr}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <div className="jpr-helper-note">
                    Note: The data is available for the maximum of last 12 months. The reports can be generated upto a day before the present day.
                  </div>
                </div>
              </div>
            </div>

            {/* Select report type */}
            <div className="jpr-form-row">
              <div className="jpr-row-label">Select report type:</div>
              <div className="jpr-row-content">
                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    value="user_wise"
                    checked={reportType === 'user_wise'}
                    onChange={() => setReportType('user_wise')}
                  />
                  <span className="jpr-radio-custom" />
                  User wise
                </label>

                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    value="job_wise"
                    checked={reportType === 'job_wise'}
                    onChange={() => setReportType('job_wise')}
                  />
                  <span className="jpr-radio-custom" />
                  Job wise
                </label>
              </div>
            </div>

            {/* Specify display format */}
            <div className="jpr-form-row">
              <div className="jpr-row-label">Specify the display format:</div>
              <div className="jpr-row-content">
                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="displayFormat"
                    value="browser"
                    checked={displayFormat === 'browser'}
                    onChange={() => setDisplayFormat('browser')}
                  />
                  <span className="jpr-radio-custom" />
                  Display in browser
                </label>

                <label className="jpr-radio-label">
                  <input
                    type="radio"
                    name="displayFormat"
                    value="excel"
                    checked={displayFormat === 'excel'}
                    onChange={() => setDisplayFormat('excel')}
                  />
                  <span className="jpr-radio-custom" />
                  Download in Excel
                </label>
              </div>
            </div>

            <div className="jpr-form-row" style={{ marginBottom: 8 }}>
              <div className="jpr-row-label"></div>
              <div className="jpr-row-content">
                <button
                  type="button"
                  className="jpr-btn-primary"
                  onClick={handleCustomisedGenerate}
                  disabled={isGenerating}
                >
                  <FiBarChart2 size={15} />
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Section 3: Auto Emailing of Usage Reports
           ───────────────────────────────────────────────────────────── */}
        <div className="jpr-card">
          <h2 className="jpr-section-title" style={{ fontSize: 19, marginBottom: 18 }}>
            Auto Emailing of Usage Reports
          </h2>

          {/* Notification Banner */}
          <div className={`jpr-status-banner ${subscription === 'disabled' ? 'not-subscribed' : 'subscribed'}`}>
            {subscription === 'disabled' ? (
              <>
                <FiAlertCircle size={18} />
                <span>Not Subscribed</span>
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                <span>
                  Subscribed ({subscription === 'weekly' ? 'Weekly delivery every Monday' : 'Monthly delivery on 1st'})
                </span>
              </>
            )}
          </div>

          {/* Subscribe Now Radios */}
          <div className="jpr-form-row">
            <div className="jpr-row-label">Subscribe Now:</div>
            <div className="jpr-row-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <label className="jpr-radio-label">
                <input
                  type="radio"
                  name="subscription"
                  value="disabled"
                  checked={subscription === 'disabled'}
                  onChange={() => setSubscription('disabled')}
                />
                <span className="jpr-radio-custom" />
                Disabled (Do not send email reports)
              </label>

              <label className="jpr-radio-label">
                <input
                  type="radio"
                  name="subscription"
                  value="weekly"
                  checked={subscription === 'weekly'}
                  onChange={() => setSubscription('weekly')}
                />
                <span className="jpr-radio-custom" />
                Weekly (Previous Week Report delivered every Monday)
              </label>

              <label className="jpr-radio-label">
                <input
                  type="radio"
                  name="subscription"
                  value="monthly"
                  checked={subscription === 'monthly'}
                  onChange={() => setSubscription('monthly')}
                />
                <span className="jpr-radio-custom" />
                Monthly (Previous Month Report delivered on 1st of every Month)
              </label>
            </div>
          </div>

          {/* Select Email to get Reports */}
          <div className="jpr-form-row">
            <div className="jpr-row-label">Select Email to get Reports:</div>
            <div className="jpr-row-content">
              <div className="jpr-email-container">
                {emailList.map((email) => (
                  <div key={email} className="jpr-email-chip">
                    <span>{email}</span>
                    <button
                      type="button"
                      className="jpr-email-chip-remove"
                      onClick={() => handleRemoveEmail(email)}
                      aria-label={`Remove ${email}`}
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                ))}

                {isAddingEmail ? (
                  <input
                    type="email"
                    className="jpr-email-input"
                    placeholder="Type email and press Enter..."
                    value={emailInput}
                    autoFocus
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddEmail();
                      } else if (e.key === 'Escape') {
                        setIsAddingEmail(false);
                        setEmailInput('');
                      }
                    }}
                    onBlur={handleAddEmail}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingEmail(true)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FiPlus size={13} /> Add another...
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="jpr-form-row" style={{ marginBottom: 0 }}>
            <div className="jpr-row-label"></div>
            <div className="jpr-row-content">
              <button
                type="button"
                className="jpr-btn-primary"
                onClick={handleSaveAutoEmail}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Section 4: Generated Report Results (Preview Table & KPIs)
           ───────────────────────────────────────────────────────────── */}
        {generatedReport && (
          <div className="jpr-results-card">
            <div className="jpr-results-header">
              <div>
                <h2 className="jpr-section-title" style={{ margin: 0, fontSize: 19 }}>
                  {generatedReport.title}
                </h2>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Time Duration: <strong style={{ color: '#0f172a' }}>{generatedReport.periodLabel}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <FiSearch style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} size={14} />
                  <input
                    type="text"
                    placeholder="Search in report..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '7px 12px 7px 32px',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="jpr-btn-primary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  onClick={() => exportToExcel(generatedReport.rows, generatedReport.title)}
                >
                  <FiDownload size={14} />
                  Export Excel
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="jpr-kpi-grid">
              <div className="jpr-kpi-box">
                <div className="jpr-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <FiBriefcase />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>Total Jobs Posted</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                    {generatedReport.metrics.totalJobs}
                  </div>
                </div>
              </div>

              <div className="jpr-kpi-box">
                <div className="jpr-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <FiCheckCircle />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>Active Jobs</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                    {generatedReport.metrics.activeJobs}
                  </div>
                </div>
              </div>

              <div className="jpr-kpi-box">
                <div className="jpr-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <FiEye />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>Total Views</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                    {generatedReport.metrics.totalViews}
                  </div>
                </div>
              </div>

              <div className="jpr-kpi-box">
                <div className="jpr-kpi-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                  <FiUsers />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>Total Applications</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                    {generatedReport.metrics.totalApps}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="jpr-table-wrapper">
              <table className="jpr-table">
                {generatedReport.mode === 'user_wise' ? (
                  <>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Designation</th>
                        <th style={{ textAlign: 'center' }}>Jobs Posted</th>
                        <th style={{ textAlign: 'center' }}>Active Jobs</th>
                        <th style={{ textAlign: 'center' }}>Views</th>
                        <th style={{ textAlign: 'center' }}>Applications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.length > 0 ? (
                        displayedRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: '#002366' }}>{row.userName}</td>
                            <td>{row.userEmail}</td>
                            <td>{row.designation}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.jobsCount}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="jpr-badge active">{row.activeCount} Active</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>{row.viewsCount}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                              {row.applicationsCount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No user-wise records found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Posted By</th>
                        <th>Location</th>
                        <th>Posted On</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Views</th>
                        <th style={{ textAlign: 'center' }}>Applications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.length > 0 ? (
                        displayedRows.map((job, idx) => (
                          <tr key={job._id || job.id || idx}>
                            <td style={{ fontWeight: 700, color: '#002366' }}>
                              {job.title}
                              <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>
                                ID: {job._id || job.id || 'N/A'}
                              </div>
                            </td>
                            <td>{job.postedByName}</td>
                            <td>{job.location || 'Remote'}</td>
                            <td>
                              {job.createdAt
                                ? new Date(job.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Recent'}
                            </td>
                            <td>
                              <span className={`jpr-badge ${(job.status || 'active').toLowerCase()}`}>
                                {job.status || 'Active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>{job.views || 0}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                              {job.applicationsCount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No job records found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="jpr-toast">
          <FiCheckCircle size={17} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </EmployerLayout>
  );
}
