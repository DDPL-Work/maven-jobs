import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  FiCalendar, FiDownload, FiCheckCircle, FiAlertCircle,
  FiChevronDown, FiX, FiPlus, FiBarChart2, FiSearch,
  FiUsers, FiEye, FiPhone, FiMail, FiMessageSquare,
  FiFileText, FiLayers, FiLogIn, FiClock, FiMoreVertical,
  FiInfo, FiPlusCircle
} from 'react-icons/fi';
import EmployerLayout from '../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../components/employer/EmployerBreadcrumb';
import authService from '../../../services/authService';
import DynamicReportTable from './DynamicReportTable';
import './ResdexReport.css';

const TABS = [
  { id: 'database-usage', label: 'Database Usage' },
  { id: 'search-report', label: 'Search report' },
  { id: 'user-login', label: 'User Login' },
  { id: 'contacted-candidate-mis', label: 'Contacted Candidate MIS' },
  { id: 'comments-reports', label: 'Comments Reports' },
  { id: 'call-report', label: 'Call Report' },
];

const DEFAULT_USERS = [
  { id: 'u1', name: 'khushi chawla', email: 'sales@mavenjobs.in', role: 'Sales' },
  { id: 'u2', name: 'Ankita', email: 'recruiter05@mavenjobs.in', role: 'Recruiter' },
  { id: 'u3', name: 'khushi chawla', email: 'bd4@mavenjobs.in', role: 'Business Development' },
  { id: 'u4', name: 'Khushi', email: 'bd3@mavenjobs.in', role: 'Business Development' },
  { id: 'u5', name: 'Nikita', email: 'hr@mavenjobs.in', role: 'HR' },
  { id: 'u6', name: 'muskan', email: 'recruit@mavenjobs.in', role: 'Recruiter' },
  { id: 'u7', name: 'admin', email: 'admin@mavenjobs.in', role: 'Admin' },
  { id: 'u8', name: 'saloni', email: 'info@mavenjobs.in', role: 'Operations' },
  { id: 'u9', name: 'sheena', email: 'recruiter4@mavenjobs.in', role: 'Recruiter' },
  { id: 'u10', name: 'test', email: 'jobs@mavenjobs.in', role: 'Tester' },
];

const formatYMD = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const formatResdexDuration = (start, end) => {
  const formatSingle = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };
  return `${formatSingle(start)} To ${formatSingle(end)}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatYMD(d);
};

export default function ResdexReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab determination from query param (support ?tab=xyz or ?xyz)
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) return tabParam;

    // Check if query string is direct tab id (e.g. ?search-report)
    const rawQuery = location.search.replace(/^\?/, '').split('&')[0];
    if (rawQuery && TABS.some(t => t.id === rawQuery)) return rawQuery;

    return 'database-usage';
  }, [searchParams, location.search]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setGeneratedReport(null);
  };

  // Company and Session state
  const [company, setCompany] = useState({});
  const yesterdayStr = useMemo(() => getYesterday(), []);

  // Common Form Fields
  const [fromDate, setFromDate] = useState(yesterdayStr);
  const [toDate, setToDate] = useState(yesterdayStr);
  const [displayFormat, setDisplayFormat] = useState('browser'); // 'browser' | 'excel'

  // User Selection Multi-select
  const [selectedUserIds, setSelectedUserIds] = useState(DEFAULT_USERS.map(u => u.id));
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Tab 1: Database Usage Fields
  const [oneClickPeriod, setOneClickPeriod] = useState('yesterday'); // 'yesterday' | 'week' | 'month'
  const [dbReportType, setDbReportType] = useState('Summary'); // 'Summary' | 'Quarterly' | 'Monthly' | 'Daily'
  const [dbFields, setDbFields] = useState({
    searches: true,
    nvites: true,
    resumeWord: true,
    duplicateCandidates: false,
    cvAccess: true,
    totalCvViews: true,
    totalCvExcel: true,
    resumesForwarded: false,
    viewPhone: false,
    smsSent: false,
  });
  const [usageSubscriptionType, setUsageSubscriptionType] = useState('all'); // 'active' | 'all'

  // Tab 2: Search Report Fields
  const [searchFilterKeyword, setSearchFilterKeyword] = useState('');

  // Tab 3: User Login Fields
  const [loginSortType, setLoginSortType] = useState('date_wise'); // 'date_wise' | 'subuser_wise'

  // Tab 4: Contacted Candidate MIS Fields
  const [contactChannel, setContactChannel] = useState('All Channels');
  const [contactedPageSize, setContactedPageSize] = useState(40);
  const [contactedSelectAll, setContactedSelectAll] = useState(false);

  // Tab 5: Comments Reports Fields
  const [commentsFolder, setCommentsFolder] = useState('All Folders');

  // Tab 6: Call Report Fields
  const [callReportType, setCallReportType] = useState('Summary');
  const [callFields, setCallFields] = useState({
    cvViews: true,
    cvViewsAppPercent: true,
    callsInitiated: false,
    callsConnected: false,
    uniqueJobSeekers: false,
    totalDuration: false,
    avgDuration: false,
  });

  // Auto Emailing Subscriptions state per tab
  const [emailSubscriptions, setEmailSubscriptions] = useState({
    'database-usage': 'disabled',
    'search-report': 'disabled',
    'user-login': 'disabled',
    'contacted-candidate-mis': 'disabled',
    'comments-reports': 'disabled',
    'call-report': 'disabled',
  });

  const [emailList, setEmailList] = useState(['admin@mavenjobs.in']);
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Report Generation & Export
  const [generatingBtn, setGeneratingBtn] = useState(null); // 'oneClick' | 'customised' | null
  const [generatedReport, setGeneratedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load employer company details & superuser email & subscriptions
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let superUserEmail = '';

        // 1. Read logged-in client user from localStorage
        const stored = localStorage.getItem('employerUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) setCompany({ name: parsed.companyName || 'My Company' });
            superUserEmail = parsed.email || '';
          } catch {}
        }

        // 2. Fetch authoritative dashboard API
        const res = await authService.getEmployerDashboard().catch(() => null);
        if (isMounted && res?.data) {
          if (res.data.company) setCompany(res.data.company);
          if (res.data.user?.email) superUserEmail = res.data.user.email;
        }

        // 3. Fetch backend Resdex subscriptions
        let backendSub = null;
        try {
          const subRes = await authService.getResdexReportSubscription();
          if (subRes?.success && subRes?.data) {
            backendSub = subRes.data;
          }
        } catch {}

        if (isMounted) {
          if (backendSub) {
            if (backendSub.subscriptions) {
              setEmailSubscriptions(prev => ({ ...prev, ...backendSub.subscriptions }));
            }
            if (Array.isArray(backendSub.emailList) && backendSub.emailList.length > 0) {
              setEmailList(backendSub.emailList);
            } else if (superUserEmail) {
              setEmailList([superUserEmail]);
            }
          } else {
            // Fallback to localStorage
            const savedSubs = localStorage.getItem('maven_resdex_subscriptions');
            if (savedSubs) {
              try {
                const parsed = JSON.parse(savedSubs);
                setEmailSubscriptions(prev => ({ ...prev, ...parsed }));
              } catch {}
            }
            if (superUserEmail) {
              setEmailList([superUserEmail]);
            }
          }
        }
      } catch {}
    })();

    return () => { isMounted = false; };
  }, []);

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.length === DEFAULT_USERS.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(DEFAULT_USERS.map(u => u.id));
    }
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

  // Save Auto Emailing for the current active tab
  const handleSaveAutoEmail = async () => {
    const currentSub = emailSubscriptions[activeTab];
    setIsSavingSubscription(true);
    try {
      await authService.saveResdexReportSubscription({
        subscriptions: emailSubscriptions,
        emailList,
      });

      localStorage.setItem('maven_resdex_subscriptions', JSON.stringify(emailSubscriptions));
      showToast(currentSub === 'disabled'
        ? `Auto emailing disabled for ${TABS.find(t => t.id === activeTab)?.label}.`
        : `Subscribed successfully to ${currentSub} reports for ${TABS.find(t => t.id === activeTab)?.label}!`
      );
    } catch (err) {
      showToast(err?.message || 'Failed to save auto emailing preferences.');
    } finally {
      setIsSavingSubscription(false);
    }
  };

  // Send Resdex report email immediately
  const handleSendNow = async () => {
    const validEmails = emailList.filter(e => e && e.includes('@'));
    if (!validEmails.length) {
      showToast('Please specify at least one recipient email.');
      return;
    }

    const currentSub = emailSubscriptions[activeTab];
    const sendPeriod = currentSub === 'monthly' ? 'monthly' : currentSub === 'daily' ? 'daily' : 'weekly';

    setIsSendingEmail(true);
    try {
      const res = await authService.sendResdexReportEmail({
        tab: activeTab,
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

  // CSV / Excel export
  const exportToExcel = useCallback((headers, rows, filename) => {
    if (!rows || rows.length === 0) {
      showToast('No records available for export.');
      return;
    }

    const esc = (val) => {
      const s = String(val ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${formatYMD(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Report exported successfully to Excel/CSV!');
  }, [showToast]);

  // Data definitions matching reference screenshots
  const DB_USAGE_DATA = [
    { name: 'khushi chawla | sales@mavenjobs.in', searches: 14, cvViews: 19, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 19, uniqueCv: 19, uniqueExcel: 0, a: 19, b: 0, c: 0, total: 19 },
    { name: 'Ankita | recruiter05@mavenjobs.in', searches: 10, cvViews: 25, excelDl: 0, wordDl: 20, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 25, uniqueExcel: 0, a: 25, b: 0, c: 0, total: 25 },
    { name: 'khushi chawla | bd4@mavenjobs.in', searches: 2, cvViews: 1, excelDl: 0, wordDl: 1, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 1, uniqueExcel: 0, a: 1, b: 0, c: 0, total: 1 },
    { name: 'Khushi | bd3@mavenjobs.in', searches: 2, cvViews: 10, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 9, uniqueCv: 10, uniqueExcel: 0, a: 9, b: 0, c: 0, total: 9 },
    { name: 'Nikita | hr@mavenjobs.in', searches: 5, cvViews: 23, excelDl: 0, wordDl: 2, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 11, uniqueCv: 15, uniqueExcel: 0, a: 12, b: 0, c: 0, total: 12 },
    { name: 'muskan | recruit@mavenjobs.in', searches: 0, cvViews: 0, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 0, uniqueExcel: 0, a: 0, b: 0, c: 0, total: 0 },
    { name: 'admin | admin@mavenjobs.in', searches: 0, cvViews: 0, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 0, uniqueExcel: 0, a: 0, b: 0, c: 0, total: 0 },
    { name: 'saloni | info@mavenjobs.in', searches: 0, cvViews: 0, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 0, uniqueExcel: 0, a: 0, b: 0, c: 0, total: 0 },
    { name: 'sheena | recruiter4@mavenjobs.in', searches: 0, cvViews: 0, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 0, uniqueExcel: 0, a: 0, b: 0, c: 0, total: 0 },
    { name: 'test | jobs@mavenjobs.in', searches: 0, cvViews: 0, excelDl: 0, wordDl: 0, nvites: 0, dup: 0, fwd: 0, sms: 0, phone: 0, uniqueCv: 0, uniqueExcel: 0, a: 0, b: 0, c: 0, total: 0 },
  ];

  const CALL_DATA = [
    { name: 'khushi chawla | sales@mavenjobs.in', views: 19, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'Ankita | recruiter05@mavenjobs.in', views: 25, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'khushi chawla | bd4@mavenjobs.in', views: 1, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'Khushi | bd3@mavenjobs.in', views: 10, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'Nikita | hr@mavenjobs.in', views: 23, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'muskan | recruit@mavenjobs.in', views: 0, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'admin | admin@mavenjobs.in', views: 0, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'saloni | info@mavenjobs.in', views: 0, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'sheena | recruiter4@mavenjobs.in', views: 0, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
    { name: 'test | jobs@mavenjobs.in', views: 0, appPct: 0, callsInit: 0, callsConn: 0, uniqContacted: 0, totDuration: '00:00', avgDuration: '00:00' },
  ];

  const LOGIN_DATA = [
    ['09-Sep-26', 'khushi chawla', '09:15 AM', '06:30 PM', '555', '192.168.1.10'],
    ['09-Sep-26', 'Ankita', '09:30 AM', '06:45 PM', '555', '192.168.1.11'],
    ['09-Sep-26', 'khushi chawla (bd4)', '09:45 AM', '06:15 PM', '510', '192.168.1.12'],
    ['09-Sep-26', 'Khushi (bd3)', '10:00 AM', '07:00 PM', '540', '192.168.1.13'],
    ['09-Sep-26', 'Nikita', '09:00 AM', '06:00 PM', '540', '192.168.1.14'],
    ['09-Sep-26', 'muskan', '09:15 AM', '06:00 PM', '525', '192.168.1.15'],
    ['09-Sep-26', 'admin', '08:45 AM', '07:30 PM', '645', '192.168.1.16'],
    ['09-Sep-26', 'saloni', '09:30 AM', '06:30 PM', '540', '192.168.1.17'],
    ['09-Sep-26', 'sheena', '09:00 AM', '06:15 PM', '555', '192.168.1.18'],
    ['09-Sep-26', 'test', '10:00 AM', '05:30 PM', '450', '192.168.1.19'],
  ];

  // One Click Report Handler
  const handleOneClickGenerate = async () => {
    setGeneratingBtn('oneClick');
    try {
      const res = await authService.getResdexReport({
        tab: activeTab,
        mode: 'one_click',
        period: oneClickPeriod,
      });

      const rows = res.data && res.data.length > 0 ? res.data : [];
      const headers = res.headers && res.headers.length > 0 ? res.headers : [];
      const durationStr = formatResdexDuration(res.from || new Date(), res.to || new Date());

      setGeneratedReport({
        reportType: 'One Click Report',
        durationLabel: durationStr,
        headers: headers.length ? headers : ['Subuser', 'Total CV Views', 'Total Searches'],
        rows: rows.length ? rows : [['No data recorded for this period', 0, 0]],
        showTotalRow: activeTab === 'database-usage',
        showNote: activeTab === 'database-usage',
        filename: `Resdex_${activeTab}_One_Click`,
      });

      showToast(`One Click Report generated for "${oneClickPeriod}"!`);
    } catch (err) {
      showToast(err?.message || 'Failed to generate one-click report.');
    } finally {
      setGeneratingBtn(null);
    }
  };

  // Generate Report Handler (Customised Report)
  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) {
      showToast('Please select From and To dates.');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      showToast('From date cannot be after To date.');
      return;
    }

    setGeneratingBtn('customised');
    try {
      const params = {
        tab: activeTab,
        mode: 'customised',
        from: fromDate,
        to: toDate,
        userIds: selectedUserIds.join(','),
        keyword: searchFilterKeyword,
        sortType: loginSortType,
      };

      const res = await authService.getResdexReport(params);
      const rows = res.data && res.data.length > 0 ? res.data : [];
      const headers = res.headers && res.headers.length > 0 ? res.headers : [];
      const durationStr = formatResdexDuration(res.from || fromDate, res.to || toDate);
      const filename = `Resdex_${activeTab}_Customised`;

      if (displayFormat === 'excel') {
        exportToExcel(
          headers.length ? headers : ['Subuser', 'Activity'],
          rows.length ? rows : [['No data recorded for this period', 0]],
          filename
        );
      } else {
        setGeneratedReport({
          reportType: 'Customised Report',
          durationLabel: durationStr,
          headers: headers.length ? headers : ['Subuser', 'Activity'],
          rows: rows.length ? rows : [['No data recorded for this period', 0]],
          showTotalRow: activeTab === 'database-usage',
          showNote: activeTab === 'database-usage',
          filename,
        });
        showToast(`${TABS.find(t => t.id === activeTab)?.label} generated successfully!`);
      }
    } catch (err) {
      showToast(err?.message || 'Failed to generate report.');
    } finally {
      setGeneratingBtn(null);
    }
  };

  // Filtered rows for table search
  const displayedRows = useMemo(() => {
    if (!generatedReport?.rows) return [];
    if (!searchTerm.trim()) return generatedReport.rows;
    const term = searchTerm.toLowerCase();

    return generatedReport.rows.filter(r =>
      Object.values(r).some(val => String(val).toLowerCase().includes(term))
    );
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
        { label: 'Report', path: '/report/resdex' },
        { label: 'Resdex' },
        { label: TABS.find(t => t.id === activeTab)?.label || 'Usage' },
      ]} />

      <div className="rxr-container">
        {/* Resdex Top Tabs Navigation */}
        <div className="rxr-tabs-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`rxr-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {generatedReport ? (
          <DynamicReportTable
            reportType={generatedReport.reportType}
            durationLabel={generatedReport.durationLabel}
            headers={generatedReport.headers}
            rows={generatedReport.rows}
            showTotalRow={generatedReport.showTotalRow}
            showNote={generatedReport.showNote !== false}
            theme="blue"
            onNewReport={() => setGeneratedReport(null)}
            filename={generatedReport.filename || 'Resdex_Report'}
          />
        ) : (
          <>
            {/* Main Resdex Report Filter Card (hidden on search-report & contacted-candidate-mis per screenshot) */}
            {activeTab !== 'search-report' && activeTab !== 'contacted-candidate-mis' && (
            <div className="rxr-card">
              {(activeTab === 'database-usage' || activeTab === 'user-login' || activeTab === 'call-report') ? (
                <>
                  {/* ─────────────────────────────────────────────────────────────
                      1. One Click Report (Database Usage, User Login & Call Report)
                     ───────────────────────────────────────────────────────────── */}
                  <h2 className="rxr-section-title" style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>
                    One Click Report
                  </h2>

              <div className="rxr-form-row">
                <div className="rxr-row-label">Specify Time Period:</div>
                <div className="rxr-row-content">
                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name="oneClickPeriod"
                      value="yesterday"
                      checked={oneClickPeriod === 'yesterday'}
                      onChange={() => setOneClickPeriod('yesterday')}
                    />
                    <span className="rxr-radio-custom" />
                    Yesterday
                  </label>

                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name="oneClickPeriod"
                      value="week"
                      checked={oneClickPeriod === 'week'}
                      onChange={() => setOneClickPeriod('week')}
                    />
                    <span className="rxr-radio-custom" />
                    This Week
                  </label>

                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name="oneClickPeriod"
                      value="month"
                      checked={oneClickPeriod === 'month'}
                      onChange={() => setOneClickPeriod('month')}
                    />
                    <span className="rxr-radio-custom" />
                    This Month
                  </label>
                </div>
              </div>

              <div className="rxr-form-row" style={{ marginBottom: 32 }}>
                <div className="rxr-row-label"></div>
                <div className="rxr-row-content">
                  <button
                    type="button"
                    className="rxr-btn-primary"
                    onClick={handleOneClickGenerate}
                    disabled={generatingBtn === 'oneClick'}
                  >
                    <FiBarChart2 size={15} />
                    {generatingBtn === 'oneClick' ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  2. Customised Report (Database Usage & User Login)
                 ───────────────────────────────────────────────────────────── */}
              <h2 className="rxr-section-title" style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>
                Customised Report
              </h2>

              {/* Specify durations */}
              <div className="rxr-form-row">
                <div className="rxr-row-label">Specify durations:</div>
                <div className="rxr-row-content">
                  <div className="rxr-date-group">
                    <div className="rxr-date-item">
                      <span className="rxr-date-sublabel">From</span>
                      <div className="rxr-date-input-wrap">
                        <FiCalendar className="rxr-date-icon" size={15} />
                        <input
                          type="date"
                          className="rxr-date-input"
                          value={fromDate}
                          max={yesterdayStr}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rxr-date-item">
                      <span className="rxr-date-sublabel">To</span>
                      <div className="rxr-date-input-wrap">
                        <FiCalendar className="rxr-date-icon" size={15} />
                        <input
                          type="date"
                          className="rxr-date-input"
                          value={toDate}
                          max={yesterdayStr}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specify user names */}
              <div className="rxr-form-row">
                <div className="rxr-row-label">Specify user names:</div>
                <div className="rxr-row-content">
                  <div className="rxr-select-wrap" ref={userDropdownRef}>
                    <button
                      type="button"
                      className="rxr-select"
                      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => setUserDropdownOpen(p => !p)}
                    >
                      <span>
                        {selectedUserIds.length === DEFAULT_USERS.length
                          ? `${DEFAULT_USERS.length} Users selected`
                          : `${selectedUserIds.length} Users selected`}
                      </span>
                      <FiChevronDown className="rxr-select-icon" size={16} />
                    </button>

                    {userDropdownOpen && (
                      <div className="rxr-multiselect-dropdown">
                        <div
                          className="rxr-multiselect-item"
                          style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 4, fontWeight: 700 }}
                          onClick={toggleAllUsers}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === DEFAULT_USERS.length}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Select All ({DEFAULT_USERS.length} Users)</span>
                        </div>

                        {DEFAULT_USERS.map(user => (
                          <div
                            key={user.id}
                            className="rxr-multiselect-item"
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ lineHeight: 1.2 }}>
                              <div style={{ fontWeight: 600 }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{user.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Database Usage specific options */}
              {activeTab === 'database-usage' && (
                <>
                  {/* Specify report type */}
                  <div className="rxr-form-row">
                    <div className="rxr-row-label">Specify report type:</div>
                    <div className="rxr-row-content">
                      <div className="rxr-select-wrap" style={{ minWidth: 280 }}>
                        <select
                          className="rxr-select"
                          value={dbReportType}
                          onChange={(e) => setDbReportType(e.target.value)}
                        >
                          <option value="Summary">Summary</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Daily">Daily</option>
                        </select>
                        <FiChevronDown className="rxr-select-icon" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Fields to be seen: 2-Column Checkboxes */}
                  <div className="rxr-form-row">
                    <div className="rxr-row-label">Fields to be seen:</div>
                    <div className="rxr-row-content">
                      <div className="rxr-checkbox-grid">
                        {/* Column 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.searches}
                              onChange={(e) => setDbFields({ ...dbFields, searches: e.target.checked })}
                            />
                            Searches
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.nvites}
                              onChange={(e) => setDbFields({ ...dbFields, nvites: e.target.checked })}
                            />
                            NVites
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.resumeWord}
                              onChange={(e) => setDbFields({ ...dbFields, resumeWord: e.target.checked })}
                            />
                            Resume downloaded in Word
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.duplicateCandidates}
                              onChange={(e) => setDbFields({ ...dbFields, duplicateCandidates: e.target.checked })}
                            />
                            Duplicate Candidates detected
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.cvAccess}
                              onChange={(e) => setDbFields({ ...dbFields, cvAccess: e.target.checked })}
                            />
                            CV access
                          </label>
                        </div>

                        {/* Column 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.totalCvViews}
                              onChange={(e) => setDbFields({ ...dbFields, totalCvViews: e.target.checked })}
                            />
                            Total CV views
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.totalCvExcel}
                              onChange={(e) => setDbFields({ ...dbFields, totalCvExcel: e.target.checked })}
                            />
                            Total CVs downloaded in Excel
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.resumesForwarded}
                              onChange={(e) => setDbFields({ ...dbFields, resumesForwarded: e.target.checked })}
                            />
                            Resumes forwarded
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.viewPhone}
                              onChange={(e) => setDbFields({ ...dbFields, viewPhone: e.target.checked })}
                            />
                            View phone number/Call candidate
                          </label>
                          <label className="rxr-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dbFields.smsSent}
                              onChange={(e) => setDbFields({ ...dbFields, smsSent: e.target.checked })}
                            />
                            SMS sent
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Show usage for */}
                  <div className="rxr-form-row">
                    <div className="rxr-row-label">Show usage for:</div>
                    <div className="rxr-row-content">
                      <label className="rxr-radio-label">
                        <input
                          type="radio"
                          name="usageSub"
                          value="active"
                          checked={usageSubscriptionType === 'active'}
                          onChange={() => setUsageSubscriptionType('active')}
                        />
                        <span className="rxr-radio-custom" />
                        Current / Active subscription
                      </label>

                      <label className="rxr-radio-label">
                        <input
                          type="radio"
                          name="usageSub"
                          value="all"
                          checked={usageSubscriptionType === 'all'}
                          onChange={() => setUsageSubscriptionType('all')}
                        />
                        <span className="rxr-radio-custom" />
                        All subscriptions
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* User Login specific options: Sort Type */}
              {activeTab === 'user-login' && (
                <div className="rxr-form-row">
                  <div className="rxr-row-label">Sort Type:</div>
                  <div className="rxr-row-content">
                    <label className="rxr-radio-label">
                      <input
                        type="radio"
                        name="loginSort"
                        value="date_wise"
                        checked={loginSortType === 'date_wise'}
                        onChange={() => setLoginSortType('date_wise')}
                      />
                      <span className="rxr-radio-custom" />
                      Date Wise
                    </label>

                    <label className="rxr-radio-label">
                      <input
                        type="radio"
                        name="loginSort"
                        value="subuser_wise"
                        checked={loginSortType === 'subuser_wise'}
                        onChange={() => setLoginSortType('subuser_wise')}
                      />
                      <span className="rxr-radio-custom" />
                      SubUser Wise
                    </label>
                  </div>
                </div>
              )}

              {/* Call Report specific options: Report Type and 7 Fields checkboxes */}
              {activeTab === 'call-report' && (
                <>
                  {/* Specify report type */}
                  <div className="rxr-form-row">
                    <div className="rxr-row-label">Specify report type:</div>
                    <div className="rxr-row-content">
                      <div className="rxr-select-wrap" style={{ minWidth: 280 }}>
                        <select
                          className="rxr-select"
                          value={callReportType}
                          onChange={(e) => setCallReportType(e.target.value)}
                        >
                          <option value="Summary">Summary</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Daily">Daily</option>
                        </select>
                        <FiChevronDown className="rxr-select-icon" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Fields to be seen: Vertical single column per screenshot */}
                  <div className="rxr-form-row">
                    <div className="rxr-row-label">Fields to be seen:</div>
                    <div className="rxr-row-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.cvViews}
                            onChange={(e) => setCallFields({ ...callFields, cvViews: e.target.checked })}
                          />
                          Total CV Views (Web + App)
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.cvViewsAppPercent}
                            onChange={(e) => setCallFields({ ...callFields, cvViewsAppPercent: e.target.checked })}
                          />
                          % of CV Views on App
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.callsInitiated}
                            onChange={(e) => setCallFields({ ...callFields, callsInitiated: e.target.checked })}
                          />
                          Total calls initiated
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.callsConnected}
                            onChange={(e) => setCallFields({ ...callFields, callsConnected: e.target.checked })}
                          />
                          Total calls connected
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.uniqueJobSeekers}
                            onChange={(e) => setCallFields({ ...callFields, uniqueJobSeekers: e.target.checked })}
                          />
                          Unique Job Seekers contacted
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.totalDuration}
                            onChange={(e) => setCallFields({ ...callFields, totalDuration: e.target.checked })}
                          />
                          Total call duration(in mins)
                        </label>
                        <label className="rxr-checkbox-label">
                          <input
                            type="checkbox"
                            checked={callFields.avgDuration}
                            onChange={(e) => setCallFields({ ...callFields, avgDuration: e.target.checked })}
                          />
                          Average call duration(in mins)
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Specify the display format */}
              <div className="rxr-form-row">
                <div className="rxr-row-label">Specify the display format:</div>
                <div className="rxr-row-content">
                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name="displayFormat"
                      value="browser"
                      checked={displayFormat === 'browser'}
                      onChange={() => setDisplayFormat('browser')}
                    />
                    <span className="rxr-radio-custom" />
                    Display in browser
                  </label>

                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name="displayFormat"
                      value="excel"
                      checked={displayFormat === 'excel'}
                      onChange={() => setDisplayFormat('excel')}
                    />
                    <span className="rxr-radio-custom" />
                    Download in Excel
                  </label>
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="rxr-form-row" style={{ marginBottom: 4 }}>
                <div className="rxr-row-label"></div>
                <div className="rxr-row-content">
                  <button
                    type="button"
                    className="rxr-btn-primary"
                    onClick={handleGenerateReport}
                    disabled={generatingBtn === 'customised'}
                  >
                    <FiBarChart2 size={15} />
                    {generatingBtn === 'customised' ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
                  Other Tabs: Search report, User Login, Contacted, Comments, Call
                 ───────────────────────────────────────────────────────────── */}
              <h1 className="rxr-page-title">
                <FiBarChart2 size={24} color="#002366" />
                {activeTab === 'comments-reports' ? 'Customised Report' : TABS.find(t => t.id === activeTab)?.label}
              </h1>

              {/* 1. Specify Durations */}
              <div className="rxr-form-row">
                <div className="rxr-row-label">Specify durations:</div>
                <div className="rxr-row-content">
                  <div className="rxr-date-group">
                    <div className="rxr-date-item">
                      <span className="rxr-date-sublabel">From</span>
                      <div className="rxr-date-input-wrap">
                        <FiCalendar className="rxr-date-icon" size={15} />
                        <input
                          type="date"
                          className="rxr-date-input"
                          value={fromDate}
                          max={yesterdayStr}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rxr-date-item">
                      <span className="rxr-date-sublabel">To</span>
                      <div className="rxr-date-input-wrap">
                        <FiCalendar className="rxr-date-icon" size={15} />
                        <input
                          type="date"
                          className="rxr-date-input"
                          value={toDate}
                          max={yesterdayStr}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {activeTab !== 'comments-reports' && (
                    <div style={{ width: '100%' }}>
                      <div className="rxr-helper-note">
                        Note: The data is available for the maximum of last 12 months. The reports can be generated upto a day before the present day.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Specify User Names Dropdown (hidden on comments-reports per screenshot) */}
              {activeTab !== 'comments-reports' && (
                <div className="rxr-form-row">
                  <div className="rxr-row-label">Specify user names:</div>
                  <div className="rxr-row-content">
                    <div className="rxr-select-wrap" ref={userDropdownRef}>
                      <button
                        type="button"
                        className="rxr-select"
                        style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onClick={() => setUserDropdownOpen(p => !p)}
                      >
                        <span>
                          {selectedUserIds.length === DEFAULT_USERS.length
                            ? `${DEFAULT_USERS.length} Users selected`
                            : `${selectedUserIds.length} Users selected`}
                        </span>
                        <FiChevronDown className="rxr-select-icon" size={16} />
                      </button>

                      {userDropdownOpen && (
                        <div className="rxr-multiselect-dropdown">
                          <div
                            className="rxr-multiselect-item"
                            style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 4, fontWeight: 700 }}
                            onClick={toggleAllUsers}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.length === DEFAULT_USERS.length}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>Select All ({DEFAULT_USERS.length} Users)</span>
                          </div>

                          {DEFAULT_USERS.map(user => (
                            <div
                              key={user.id}
                              className="rxr-multiselect-item"
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                              <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{user.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Search Report Fields */}
              {activeTab === 'search-report' && (
                <div className="rxr-form-row">
                  <div className="rxr-row-label">Filter by Search Keyword:</div>
                  <div className="rxr-row-content">
                    <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
                      <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} size={16} />
                      <input
                        type="text"
                        className="rxr-date-input"
                        style={{ paddingLeft: 38, width: '100%' }}
                        placeholder="e.g. React, Java, Tech Lead (Optional)"
                        value={searchFilterKeyword}
                        onChange={(e) => setSearchFilterKeyword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}



              {/* Common: Specify display format (hidden on comments-reports per screenshot) */}
              {activeTab !== 'comments-reports' && (
                <div className="rxr-form-row">
                  <div className="rxr-row-label">Specify the display format:</div>
                  <div className="rxr-row-content">
                    <label className="rxr-radio-label">
                      <input
                        type="radio"
                        name="displayFormat"
                        value="browser"
                        checked={displayFormat === 'browser'}
                        onChange={() => setDisplayFormat('browser')}
                      />
                      <span className="rxr-radio-custom" />
                      Display in browser
                    </label>

                    <label className="rxr-radio-label">
                      <input
                        type="radio"
                        name="displayFormat"
                        value="excel"
                        checked={displayFormat === 'excel'}
                        onChange={() => setDisplayFormat('excel')}
                      />
                      <span className="rxr-radio-custom" />
                      Download in Excel
                    </label>
                  </div>
                </div>
              )}

              {/* Generate Report Button */}
              <div className="rxr-form-row" style={{ marginBottom: 4 }}>
                <div className="rxr-row-label"></div>
                <div className="rxr-row-content">
                  <button
                    type="button"
                    className="rxr-btn-primary"
                    onClick={handleGenerateReport}
                    disabled={generatingBtn === 'customised'}
                  >
                    <FiBarChart2 size={15} />
                    {generatingBtn === 'customised' ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Contacted Candidate MIS Tab (Folder View per Screenshot)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'contacted-candidate-mis' && (
          <div className="rxr-contacted-container">
            {/* Breadcrumb Header */}
            <div className="rxr-contacted-breadcrumb">
              <div className="rxr-contacted-folder-icon">
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 4C1.5 2.61929 2.61929 1.5 4 1.5H8.5C9.32843 1.5 10.0883 1.90827 10.5528 2.59271L11.7236 4.30729C12.1881 4.99173 12.948 5.4 13.7764 5.4H20C21.3807 5.4 22.5 6.51929 22.5 7.9V16C22.5 17.3807 21.3807 18.5 20 18.5H4C2.61929 18.5 1.5 17.3807 1.5 16V4Z" fill="#0073e6"/>
                  <circle cx="12" cy="10" r="2" fill="white"/>
                  <path d="M8.5 15C8.5 13.067 10.067 11.5 12 11.5C13.933 11.5 15.5 13.067 15.5 15H8.5Z" fill="white"/>
                </svg>
              </div>
              <button
                type="button"
                className="rxr-contacted-link-btn"
                onClick={() => navigate('/manage-folders')}
              >
                Manage Folders
              </button>
              <span className="rxr-contacted-sep">&gt;</span>
              <span className="rxr-contacted-crumb-active">Contacted Candidates in last 7 days</span>
            </div>

            {/* Sub tab indicator & pagination row */}
            <div className="rxr-contacted-header-row">
              <div className="rxr-contacted-tab-indicator">
                Profiles 0
              </div>

              <div className="rxr-contacted-page-controls">
                <span>Show</span>
                <select
                  className="rxr-contacted-show-select"
                  value={contactedPageSize}
                  onChange={(e) => setContactedPageSize(Number(e.target.value))}
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={60}>60</option>
                  <option value={100}>100</option>
                </select>

                <button type="button" className="rxr-contacted-page-nav-btn" disabled title="First page">
                  &laquo;
                </button>
                <button type="button" className="rxr-contacted-page-nav-btn" disabled title="Previous page">
                  &lsaquo;
                </button>
                <div className="rxr-contacted-page-box">
                  Page 1 of 1
                </div>
                <button type="button" className="rxr-contacted-page-nav-btn" disabled title="Next page">
                  &rsaquo;
                </button>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="rxr-contacted-toolbar">
              <div className="rxr-contacted-toolbar-left">
                <label className="rxr-contacted-check-label">
                  <input
                    type="checkbox"
                    className="rxr-contacted-checkbox"
                    checked={contactedSelectAll}
                    onChange={(e) => setContactedSelectAll(e.target.checked)}
                  />
                  <span>Select all</span>
                </label>

                <button
                  type="button"
                  className="rxr-contacted-toolbar-btn disabled"
                  onClick={() => showToast('Select at least one candidate to add to folder.')}
                >
                  <FiPlusCircle size={15} color="#94a3b8" />
                  <span>Add to</span>
                  <FiChevronDown size={14} color="#94a3b8" />
                </button>

                <button
                  type="button"
                  className="rxr-contacted-toolbar-btn disabled"
                  onClick={() => showToast('Select candidates to schedule a reminder.')}
                >
                  <FiClock size={15} color="#94a3b8" />
                  <span>Set reminder</span>
                  <FiChevronDown size={14} color="#94a3b8" />
                </button>

                <button
                  type="button"
                  className="rxr-contacted-more-btn"
                  onClick={() => showToast('More folder options')}
                  title="More options"
                >
                  <FiMoreVertical size={16} color="#94a3b8" />
                </button>
              </div>

              <div className="rxr-contacted-toolbar-right">
                <span>Want to email candidates?</span>
                <button
                  type="button"
                  className="rxr-contacted-nvite-link"
                  onClick={() => navigate('/search-resume?tab=nvite')}
                >
                  Switch to NVite
                </button>
                <span
                  className="rxr-contacted-info-icon"
                  title="NVite allows direct targeted candidate outreach with automated tracking"
                >
                  <FiInfo size={15} color="#94a3b8" />
                </span>
              </div>
            </div>

            {/* Empty State Card */}
            <div className="rxr-contacted-empty-card">
              {/* Recruiter Empty State SVG Illustration */}
              <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                {/* Hanging Lamp */}
                <line x1="85" y1="0" x2="85" y2="40" stroke="#93c5fd" strokeWidth="1.5" />
                <path d="M73 40C73 35 97 35 97 40L102 52H68L73 40Z" fill="#3b82f6" opacity="0.85" />
                <circle cx="85" cy="53" r="2.5" fill="#fef08a" />
                <polygon points="65,54 105,54 125,120 45,120" fill="#60a5fa" opacity="0.1" />

                {/* Thought Bubble with Question Mark */}
                <path d="M102 68C102 62.5 106.5 58 112 58H122C127.5 58 132 62.5 132 68C132 73.5 127.5 78 122 78H115L108 84V78H112C106.5 78 102 73.5 102 68Z" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
                <text x="117" y="72" fontSize="12" fontWeight="700" fill="#2563eb" textAnchor="middle">?</text>

                {/* Background papers behind folder */}
                <rect x="52" y="70" width="48" height="60" rx="3" transform="rotate(-12 52 70)" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="45" y1="88" x2="72" y2="82" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="48" y1="100" x2="68" y2="96" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

                <rect x="78" y="75" width="48" height="60" rx="3" transform="rotate(8 78 75)" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="88" y1="92" x2="114" y2="96" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="89" y1="104" x2="110" y2="107" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

                {/* Recruiter woman character */}
                <ellipse cx="134" cy="67" rx="9" ry="11" fill="#1e293b" />
                <circle cx="134" cy="70" r="6" fill="#fcd34d" />
                <path d="M126 65C126 60 142 60 142 65C138 64 130 63 126 65Z" fill="#0f172a" />
                <path d="M124 77C124 75 144 75 144 77L146 102H122L124 77Z" fill="#0284c7" />
                <path d="M130 76L134 82L138 76" fill="#ffffff" />
                <path d="M124 82L116 98L122 100" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M123 102L121 138H145L144 102H123Z" fill="#1e293b" />
                <line x1="128" y1="138" x2="128" y2="152" stroke="#fcd34d" strokeWidth="2.5" />
                <line x1="138" y1="138" x2="138" y2="152" stroke="#fcd34d" strokeWidth="2.5" />
                <path d="M125 152H131L133 155H124V152Z" fill="#0f172a" />
                <path d="M135 152H141L143 155H134V152Z" fill="#0f172a" />

                {/* Front Main Blue Folder */}
                <path d="M48 108C48 105 50 103 53 103H72L78 108H118C121 108 123 110 123 113V152C123 155 121 157 118 157H53C50 157 48 155 48 152V108Z" fill="#2563eb" />
                <path d="M42 120H128L120 158H36L42 120Z" fill="#3b82f6" />
                <line x1="74" y1="133" x2="90" y2="149" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="90" y1="133" x2="74" y2="149" stroke="#93c5fd" strokeWidth="3.5" strokeLinecap="round" />

                {/* Botanical leaf sprig on bottom left */}
                <path d="M32 156C32 156 30 148 26 146C22 148 24 156 32 156Z" fill="#60a5fa" />
                <path d="M34 155C34 155 35 146 41 144C43 148 39 154 34 155Z" fill="#3b82f6" />
                <path d="M33 157C33 150 33 142 33 138" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />

                {/* Ground shadow */}
                <ellipse cx="90" cy="160" rx="60" ry="3.5" fill="#e2e8f0" />
              </svg>

              <div className="rxr-contacted-empty-title">
                There are no profiles in this folder
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Auto Emailing Section (Available for Database Usage, Search Report & User Login)
           ───────────────────────────────────────────────────────────── */}
        {(activeTab === 'database-usage' || activeTab === 'search-report' || activeTab === 'user-login') && (
          <div className="rxr-card">
            <h2 className="rxr-section-title" style={{ fontSize: 19, marginBottom: 18 }}>
              {activeTab === 'database-usage' && 'Auto Emailing of Usage Reports'}
              {activeTab === 'search-report' && 'Auto Emailing of Search Reports'}
              {activeTab === 'user-login' && 'Auto Emailing of Login Reports'}
            </h2>

            {/* Notification Banner */}
            <div className={`rxr-status-banner ${emailSubscriptions[activeTab] === 'disabled' ? 'not-subscribed' : 'subscribed'}`}>
              {emailSubscriptions[activeTab] === 'disabled' ? (
                <>
                  <FiAlertCircle size={18} />
                  <span>Not Subscribed</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  <span>
                    Subscribed ({emailSubscriptions[activeTab].toUpperCase()} delivery)
                  </span>
                </>
              )}
            </div>

            {/* Subscribe Now Radio Options */}
            <div className="rxr-form-row">
              <div className="rxr-row-label">Subscribe Now:</div>
              <div className="rxr-row-content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
                {/* Daily */}
                <label className="rxr-radio-label">
                  <input
                    type="radio"
                    name={`autoSub_${activeTab}`}
                    value="daily"
                    checked={emailSubscriptions[activeTab] === 'daily'}
                    onChange={() => setEmailSubscriptions({ ...emailSubscriptions, [activeTab]: 'daily' })}
                  />
                  <span className="rxr-radio-custom" />
                  Daily (Previous Day Report delivered in the morning)
                </label>

                {/* Weekly */}
                {(activeTab === 'database-usage' || activeTab === 'user-login' || activeTab === 'contacted-candidate-mis' || activeTab === 'call-report') && (
                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name={`autoSub_${activeTab}`}
                      value="weekly"
                      checked={emailSubscriptions[activeTab] === 'weekly'}
                      onChange={() => setEmailSubscriptions({ ...emailSubscriptions, [activeTab]: 'weekly' })}
                    />
                    <span className="rxr-radio-custom" />
                    Weekly (Previous Week Report delivered every Monday)
                  </label>
                )}

                {/* Monthly */}
                {(activeTab === 'database-usage' || activeTab === 'user-login' || activeTab === 'contacted-candidate-mis' || activeTab === 'call-report') && (
                  <label className="rxr-radio-label">
                    <input
                      type="radio"
                      name={`autoSub_${activeTab}`}
                      value="monthly"
                      checked={emailSubscriptions[activeTab] === 'monthly'}
                      onChange={() => setEmailSubscriptions({ ...emailSubscriptions, [activeTab]: 'monthly' })}
                    />
                    <span className="rxr-radio-custom" />
                    Monthly (Previous Month Report delivered on 1st of every Month)
                  </label>
                )}

                {/* Disable Radio */}
                <label className="rxr-radio-label">
                  <input
                    type="radio"
                    name={`autoSub_${activeTab}`}
                    value="disabled"
                    checked={emailSubscriptions[activeTab] === 'disabled'}
                    onChange={() => setEmailSubscriptions({ ...emailSubscriptions, [activeTab]: 'disabled' })}
                  />
                  <span className="rxr-radio-custom" />
                  {activeTab === 'database-usage' && 'Disable RESDEX Usage MIS alerts'}
                  {activeTab === 'search-report' && 'Disable RESDEX Search MIS alerts'}
                  {activeTab === 'user-login' && 'Disable RESDEX Login MIS alerts'}
                  {activeTab === 'contacted-candidate-mis' && 'Disable Contacted MIS alerts'}
                  {activeTab === 'call-report' && 'Disable Call MIS alerts'}
                </label>
              </div>
            </div>

            {/* Select Email to get Reports */}
            <div className="rxr-form-row">
              <div className="rxr-row-label">Select Email to get Reports:</div>
              <div className="rxr-row-content">
                <div className="rxr-email-container">
                  {emailList.map((email) => (
                    <div key={email} className="rxr-email-chip">
                      <span>{email}</span>
                      <button
                        type="button"
                        className="rxr-email-chip-remove"
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
                      className="rxr-email-input"
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
                      <FiPlus size={13} /> Add Email
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Save & Send Report Now Buttons */}
            <div className="rxr-form-row" style={{ marginBottom: 0 }}>
              <div className="rxr-row-label"></div>
              <div className="rxr-row-content" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  type="button"
                  className="rxr-btn-primary"
                  onClick={handleSaveAutoEmail}
                  disabled={isSavingSubscription}
                >
                  {isSavingSubscription ? 'Saving...' : 'Save'}
                </button>

                <button
                  type="button"
                  className="rxr-btn-primary"
                  onClick={handleSendNow}
                  disabled={isSendingEmail || !emailList.length}
                  style={{
                    background: '#ffffff',
                    color: '#002366',
                    border: '1px solid #002366',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Generate and email the current Resdex report immediately to the selected email(s)"
                >
                  <FiMail size={15} />
                  {isSendingEmail ? 'Sending Email...' : 'Send Report Now'}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="rxr-toast">
          <FiCheckCircle size={17} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </EmployerLayout>
  );
}
