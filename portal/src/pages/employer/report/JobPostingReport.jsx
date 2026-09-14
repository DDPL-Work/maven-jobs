import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiDownload, FiCheckCircle, FiAlertCircle,
  FiMail, FiX, FiPlus, FiBarChart2,
} from 'react-icons/fi';
import EmployerLayout from '../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../components/employer/EmployerBreadcrumb';
import authService from '../../../services/authService';
import DynamicReportTable from './DynamicReportTable';
import './JobPostingReport.css';

// -------------------------------------------------------------
//  Constants
// -------------------------------------------------------------
const USER_WISE_HEADERS = [
  'Username', 'Alias',
  'Job Post Expense', 'Job Edit Expense', 'Job Refresh Expense',
  'Jobs Deleted', 'Total Job Expense',
];

const JOB_WISE_HEADERS = [
  'Job Title', 'Posted By', 'Alias',
  'Department', 'Location', 'Status', 'Posted On',
  'Job Post Expense', 'Job Edit Expense', 'Job Refresh Expense',
  'Applications', 'Views', 'Total Job Expense',
];

// -------------------------------------------------------------
//  Helpers
// -------------------------------------------------------------
const formatYMD = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatYMD(d);
};

const formatDateLabel = (isoStr) => {
  const d = new Date(isoStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Map API user-wise row ───────────────────────────────────────────────────────────── table row array matching USER_WISE_HEADERS
const mapUserWiseRow = (r) => [
  r.userName   || r.userEmail || 'Unknown',
  r.alias      || '',
  r.jobPostExpense    ?? 0,
  r.jobEditExpense    ?? 0,
  r.jobRefreshExpense ?? 0,
  r.jobsDeleted       ?? 0,
  r.totalJobExpense   ?? 0,
];

// Map API job-wise row ───────────────────────────────────────────────────────────── table row array matching JOB_WISE_HEADERS
const mapJobWiseRow = (r) => [
  r.jobTitle   || 'Untitled',
  r.userName   || r.userEmail || 'Unknown',
  r.alias      || '',
  r.department || 'General',
  r.location   || '─────────────────────────────────────────────────────────────',
  r.status     || 'Active',
  r.actionDate ? formatDateLabel(r.actionDate) : '─────────────────────────────────────────────────────────────',
  r.jobPostExpense    ?? 0,
  r.jobEditExpense    ?? 0,
  r.jobRefreshExpense ?? 0,
  r.applicationsReceived ?? 0,
  r.jobViews   ?? 0,
  r.totalJobExpense ?? 0,
];

// -------------------------------------------------------------
//  Component
// -------------------------------------------------------------
export default function JobPostingReport() {
  const navigate = useNavigate();
  const [company, setCompany]     = useState({});

  // One Click
  const [oneClickPeriod, setOneClickPeriod] = useState('yesterday');

  // Customised
  const yesterdayStr = useMemo(() => getYesterday(), []);
  const [fromDate,       setFromDate]       = useState(yesterdayStr);
  const [toDate,         setToDate]         = useState(yesterdayStr);
  const [reportType,     setReportType]     = useState('user_wise');
  const [displayFormat,  setDisplayFormat]  = useState('browser');

  // Job-wise apply count
  const [applyCountType, setApplyCountType] = useState('same_as_above');
  const [applyFromDate,  setApplyFromDate]  = useState(yesterdayStr);
  const [applyToDate,    setApplyToDate]    = useState(yesterdayStr);

  // Auto-email
  const [subscription,  setSubscription]  = useState('disabled');
  const [emailList,     setEmailList]     = useState([]);  // populated from super user session on mount
  const [emailInput,    setEmailInput]    = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Result & UI state
  const [generatingBtn,  setGeneratingBtn]  = useState(null);
  const [generatedReport,setGeneratedReport]= useState(null);
  const [toastMessage,   setToastMessage]   = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ------------------------------------------------------------- Load company & subscription info -------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let superUserEmail = '';

        // Step 1: Read the logged-in CLIENT user email from localStorage immediately
        const stored = localStorage.getItem('employerUser');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            if (mounted) setCompany({ name: p.companyName || '' });
            superUserEmail = p.email || '';
          } catch {}
        }

        // Step 2: Confirm from dashboard API (authoritative)
        const res = await authService.getEmployerDashboard?.();
        if (mounted) {
          if (res?.data?.company) setCompany(res.data.company);
          const apiEmail = res?.data?.user?.email || '';
          if (apiEmail) superUserEmail = apiEmail;
        }

        // Step 3: Fetch saved subscription from backend API
        let backendSub = null;
        try {
          const subRes = await authService.getJobPostingReportSubscription();
          if (subRes?.success && subRes?.data) {
            backendSub = subRes.data;
          }
        } catch {}

        if (mounted && backendSub) {
          if (backendSub.subscription) setSubscription(backendSub.subscription);
          if (Array.isArray(backendSub.emailList) && backendSub.emailList.length > 0) {
            setEmailList(backendSub.emailList);
          } else if (superUserEmail) {
            setEmailList([superUserEmail]);
          }
        } else {
          // Fallback to localStorage preferences if API had no data
          const saved = localStorage.getItem('maven_report_subscription');
          if (saved) {
            try {
              const p = JSON.parse(saved);
              if (p.subscription && mounted) setSubscription(p.subscription);
              const savedEmails = Array.isArray(p.emailList) ? p.emailList : [];
              const hasRealEmail = superUserEmail && savedEmails.includes(superUserEmail);

              if (mounted) {
                if (hasRealEmail) {
                  setEmailList(savedEmails);
                } else if (superUserEmail) {
                  const extras = savedEmails.filter(e => e !== 'admin@mavenjobs.in' && e !== superUserEmail);
                  setEmailList([superUserEmail, ...extras]);
                }
              }
            } catch {
              if (mounted && superUserEmail) setEmailList([superUserEmail]);
            }
          } else if (mounted && superUserEmail) {
            setEmailList([superUserEmail]);
          }
        }
      } catch {}
    })();

    return () => { mounted = false; };
  }, []);


  // ------------------------------------------------------------- CSV export (for customised excel mode) ─────────────────────────────────────────────────────────────
  const exportToCSV = useCallback((rows, headers, filename) => {
    if (!rows?.length) { showToast('No records to export.'); return; }
    const esc = (v) => { const s = String(v ?? ''); return /[,"\n]/.test(s) ? `"${s.replace(/"/g,`""`)}"` : s; };
    const csv = [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${filename}_${formatYMD(new Date())}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded successfully!');
  }, [showToast]);

  // ------------------------------------------------------------- One Click handler ─────────────────────────────────────────────────────────────
  const handleOneClickGenerate = async () => {
    setGeneratingBtn('oneClick');
    try {
      const res = await authService.getJobPostingReport({ mode: 'one_click', period: oneClickPeriod });
      const rows = (res.data || []).map(mapUserWiseRow);

      setGeneratedReport({
        reportType: 'User Wise',
        durationLabel: `${formatDateLabel(res.from)} to ${formatDateLabel(res.to)}`,
        headers: USER_WISE_HEADERS,
        rows: rows.length ? rows : [['No data', '', 0, 0, 0, 0, 0]],
      });
      showToast(`One Click Report generated for "${oneClickPeriod}"!`);
    } catch (err) {
      showToast(err?.message || 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingBtn(null);
    }
  };

  // ------------------------------------------------------------- Customised handler ─────────────────────────────────────────────────────────────
  const handleCustomisedGenerate = async () => {
    if (!fromDate || !toDate) { showToast('Please select both From and To dates.'); return; }
    if (new Date(fromDate) > new Date(toDate)) { showToast('From date cannot be after To date.'); return; }

    setGeneratingBtn('customised');
    try {
      const params = { mode: 'customised', from: fromDate, to: toDate, type: reportType };
      const res = await authService.getJobPostingReport(params);

      const isJobWise  = reportType === 'job_wise';
      const headers    = isJobWise ? JOB_WISE_HEADERS : USER_WISE_HEADERS;
      const mapFn      = isJobWise ? mapJobWiseRow : mapUserWiseRow;
      const rows       = (res.data || []).map(mapFn);
      const emptyRow   = isJobWise
        ? ['No data', '', '', '', '', '', '', 0, 0, 0, 0, 0, 0]
        : ['No data', '', 0, 0, 0, 0, 0];

      if (displayFormat === 'excel') {
        exportToCSV(rows.length ? rows : [emptyRow], headers, `Job_Posting_${isJobWise ? 'Job' : 'User'}_Wise`);
        return;
      }

      setGeneratedReport({
        reportType: isJobWise ? 'Job Wise' : 'User Wise',
        durationLabel: `${formatDateLabel(res.from)} to ${formatDateLabel(res.to)}`,
        headers,
        rows: rows.length ? rows : [emptyRow],
      });
      showToast('Customised report generated successfully!');
    } catch (err) {
      showToast(err?.message || 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingBtn(null);
    }
  };

  // ------------------------------------------------------------- Email helpers ─────────────────────────────────────────────────────────────
  const handleAddEmail = () => {
    const t = emailInput.trim();
    if (!t) { setIsAddingEmail(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { showToast('Please enter a valid email address.'); return; }
    if (emailList.includes(t)) { showToast('Email already added.'); setEmailInput(''); setIsAddingEmail(false); return; }
    setEmailList(p => [...p, t]);
    setEmailInput(''); setIsAddingEmail(false);
  };

  const handleRemoveEmail = (target) => {
    if (emailList.length === 1) { showToast('At least one email is required.'); return; }
    setEmailList(p => p.filter(e => e !== target));
  };

  const handleSaveAutoEmail = async () => {
    setIsSavingSubscription(true);
    try {
      // Save to backend database
      await authService.saveJobPostingReportSubscription({
        subscription,
        emailList,
      });

      // Keep localStorage synchronized
      localStorage.setItem('maven_report_subscription', JSON.stringify({
        subscription,
        emailList,
        updatedAt: new Date().toISOString(),
      }));

      showToast(subscription === 'disabled'
        ? 'Auto emailing preferences saved (Disabled).'
        : `Subscribed to ${subscription} reports!`
      );
    } catch (err) {
      showToast(err?.message || 'Failed to save auto emailing preferences.');
    } finally {
      setIsSavingSubscription(false);
    }
  };

  const handleSendNow = async () => {
    const validEmails = emailList.filter(e => e && e.includes('@'));
    if (!validEmails.length) {
      showToast('Please specify at least one recipient email.');
      return;
    }

    const sendPeriod = subscription === 'monthly' ? 'monthly' : 'weekly';
    setIsSendingEmail(true);
    try {
      const res = await authService.sendJobPostingReportEmail({
        period: sendPeriod,
        emailList: validEmails,
      });
      showToast(res?.message || `Excel report sent successfully to ${validEmails.join(', ')}!`);
    } catch (err) {
      showToast(err?.message || 'Failed to send report email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // -------------------------------------------------------------
  //  Render
  // -------------------------------------------------------------
  return (
    <EmployerLayout
      company={company}
      activeTab="report"
      onNavigate={(tabId) => {
        if (tabId === 'home')     navigate('/employer-dashboard');
        if (tabId === 'analysis') navigate('/employer-dashboard/analytics');
        if (tabId === 'jobs')     navigate('/post-job');
      }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Report', path: '/reports-job-posting' },
        { label: 'Job Posting' },
      ]} />

      <div className="jpr-container">
        {generatedReport ? (
          <DynamicReportTable
            reportType={generatedReport.reportType}
            durationLabel={generatedReport.durationLabel}
            headers={generatedReport.headers}
            rows={generatedReport.rows}
            showTotalRow={false}
            showNote={false}
            theme="gray"
            onNewReport={() => setGeneratedReport(null)}
            filename="Job_Posting_Report"
          />
        ) : (
          <>
            {/* ───────────────────────────────────────────────────────────── Usage Reports Card ───────────────────────────────────────────────────────────── */}
            <div className="jpr-card">
              <h1 className="jpr-page-title">
                <FiBarChart2 size={24} color="#002366" />
                Usage Reports
              </h1>

              {/* Section 1: One Click Report */}
              <div className="jpr-section">
                <h2 className="jpr-section-title">One Click Report</h2>

                <div className="jpr-form-row">
                  <div className="jpr-row-label">Specify Time Period:</div>
                  <div className="jpr-row-content">
                    {[['yesterday','Yesterday'],['week','This Week'],['month','This Month']].map(([val,lbl]) => (
                      <label key={val} className="jpr-radio-label">
                        <input type="radio" name="oneClickPeriod" value={val}
                          checked={oneClickPeriod === val} onChange={() => setOneClickPeriod(val)} />
                        <span className="jpr-radio-custom" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="jpr-form-row" style={{ marginBottom: 8 }}>
                  <div className="jpr-row-label" />
                  <div className="jpr-row-content">
                    <button type="button" className="jpr-btn-primary"
                      onClick={handleOneClickGenerate} disabled={generatingBtn === 'oneClick'}>
                      <FiBarChart2 size={15} />
                      {generatingBtn === 'oneClick' ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              </div>

              <hr className="jpr-section-divider" />

              {/* Section 2: Customised Report */}
              <div className="jpr-section">
                <h2 className="jpr-section-title">Customised Report</h2>

                {/* Date range */}
                <div className="jpr-form-row">
                  <div className="jpr-row-label">Specify durations:</div>
                  <div className="jpr-row-content">
                    <div className="jpr-date-group">
                      {[['From', fromDate, setFromDate], ['To', toDate, setToDate]].map(([lbl, val, setter]) => (
                        <div key={lbl} className="jpr-date-item">
                          <span className="jpr-date-sublabel">{lbl}:</span>
                          <div className="jpr-date-input-wrap">
                            <FiCalendar className="jpr-date-icon" size={15} />
                            <input type="date" className="jpr-date-input"
                              value={val} max={yesterdayStr} onChange={e => setter(e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ width: '100%' }}>
                      <div className="jpr-helper-note">
                        Note: Data is available for the last 12 months. Reports can be generated up to the day before today.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report type */}
                <div className="jpr-form-row">
                  <div className="jpr-row-label">Select report type:</div>
                  <div className="jpr-row-content">
                    {[['user_wise','User wise'],['job_wise','Job wise']].map(([val,lbl]) => (
                      <label key={val} className="jpr-radio-label">
                        <input type="radio" name="reportType" value={val}
                          checked={reportType === val} onChange={() => setReportType(val)} />
                        <span className="jpr-radio-custom" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Job-wise: apply count sub-section */}
                {reportType === 'job_wise' && (
                  <>
                    <div className="jpr-form-row">
                      <div className="jpr-row-label">Select apply count from posting date:</div>
                      <div className="jpr-row-content">
                        {[
                          ['same_as_above','Same as above'],
                          ['overall','Overall'],
                          ['custom_date','Custom date'],
                        ].map(([val, lbl]) => (
                          <label key={val} className="jpr-radio-label">
                            <input type="radio" name="applyCountType" value={val}
                              checked={applyCountType === val} onChange={() => setApplyCountType(val)} />
                            <span className="jpr-radio-custom" />
                            {lbl}
                          </label>
                        ))}
                      </div>
                    </div>

                    {applyCountType === 'custom_date' && (
                      <div className="jpr-form-row">
                        <div className="jpr-row-label">Specify apply date range:</div>
                        <div className="jpr-row-content">
                          <div className="jpr-date-group">
                            {[['From', applyFromDate, setApplyFromDate], ['To', applyToDate, setApplyToDate]].map(([lbl, val, setter]) => (
                              <div key={lbl} className="jpr-date-item">
                                <span className="jpr-date-sublabel">{lbl}:</span>
                                <div className="jpr-date-input-wrap">
                                  <FiCalendar className="jpr-date-icon" size={15} />
                                  <input type="date" className="jpr-date-input"
                                    value={val} max={yesterdayStr} onChange={e => setter(e.target.value)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Display format */}
                <div className="jpr-form-row">
                  <div className="jpr-row-label">Specify the display format:</div>
                  <div className="jpr-row-content">
                    {[['browser','Display in browser'],['excel','Download in Excel']].map(([val,lbl]) => (
                      <label key={val} className="jpr-radio-label">
                        <input type="radio" name="displayFormat" value={val}
                          checked={displayFormat === val} onChange={() => setDisplayFormat(val)} />
                        <span className="jpr-radio-custom" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="jpr-form-row" style={{ marginBottom: 8 }}>
                  <div className="jpr-row-label" />
                  <div className="jpr-row-content">
                    <button type="button" className="jpr-btn-primary"
                      onClick={handleCustomisedGenerate} disabled={generatingBtn === 'customised'}>
                      <FiBarChart2 size={15} />
                      {generatingBtn === 'customised' ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── Auto Emailing Card ───────────────────────────────────────────────────────────── */}
            <div className="jpr-card">
              <h2 className="jpr-section-title" style={{ fontSize: 19, marginBottom: 18 }}>
                Auto Emailing of Usage Reports
              </h2>

              <div className={`jpr-status-banner ${subscription === 'disabled' ? 'not-subscribed' : 'subscribed'}`}>
                {subscription === 'disabled' ? (
                  <><FiAlertCircle size={18} /><span>Not Subscribed</span></>
                ) : (
                  <><FiCheckCircle size={18} />
                    <span>Subscribed ({subscription === 'weekly' ? 'Weekly every Monday' : 'Monthly 1st of every month'})</span>
                  </>
                )}
              </div>

              <div className="jpr-form-row">
                <div className="jpr-row-label">Subscribe Now:</div>
                <div className="jpr-row-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
                  {[
                    ['disabled', 'Disabled (Do not send email reports)'],
                    ['weekly',   'Weekly (Previous Week Report every Monday)'],
                    ['monthly',  'Monthly (Previous Month Report 1st of every Month)'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="jpr-radio-label">
                      <input type="radio" name="subscription" value={val}
                        checked={subscription === val} onChange={() => setSubscription(val)} />
                      <span className="jpr-radio-custom" />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              <div className="jpr-form-row">
                <div className="jpr-row-label">Select Email to get Reports:</div>
                <div className="jpr-row-content">
                  <div className="jpr-email-container">
                    {emailList.map(email => (
                      <div key={email} className="jpr-email-chip">
                        <span>{email}</span>
                        <button type="button" className="jpr-email-chip-remove"
                          onClick={() => handleRemoveEmail(email)} aria-label={`Remove ${email}`}>
                          <FiX size={13} />
                        </button>
                      </div>
                    ))}
                    {isAddingEmail ? (
                      <input type="email" className="jpr-email-input" placeholder="Type email and press Enter─────────────────────────────────────────────────────────────"
                        value={emailInput} autoFocus onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddEmail(); }
                          else if (e.key === 'Escape') { setIsAddingEmail(false); setEmailInput(''); }
                        }}
                        onBlur={handleAddEmail} />
                    ) : (
                      <button type="button" onClick={() => setIsAddingEmail(true)}
                        style={{ border:'none', background:'transparent', color:'#64748b', fontSize:13, cursor:'pointer', padding:'4px 6px', display:'inline-flex', alignItems:'center', gap:4 }}>
                        <FiPlus size={13} /> Add another...
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="jpr-form-row" style={{ marginBottom: 0 }}>
                <div className="jpr-row-label" />
                <div className="jpr-row-content" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="jpr-btn-primary"
                    onClick={handleSaveAutoEmail}
                    disabled={isSavingSubscription}
                  >
                    {isSavingSubscription ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    type="button"
                    className="jpr-btn-outline"
                    onClick={handleSendNow}
                    disabled={isSendingEmail || !emailList.length}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    title="Generate and email the report immediately to the selected email(s)"
                  >
                    <FiMail size={15} />
                    {isSendingEmail ? 'Sending Email...' : 'Send Report Now'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {toastMessage && (
        <div className="jpr-toast">
          <FiCheckCircle size={17} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </EmployerLayout>
  );
}
