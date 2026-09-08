import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiRefreshCw, FiDownload, FiCalendar, FiBarChart2
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import authService from '../../../../services/authService';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import './AnalyticsPage.css';

const ResdexTab = lazy(() => import('../../../../components/employer/ResdexTab'));
const AnalyticsTab = lazy(() => import('../../../../components/employer/AnalyticsTab'));

function TabSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="ap-card" style={{ marginBottom: 16, padding: 24 }}>
          <div style={{ height: 20, width: '40%', background: '#f1f5f9', borderRadius: 6, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[1, 2, 3, 4].map(j => (
              <div key={j} style={{ height: 80, background: '#f8fafc', borderRadius: 10 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('analytics');
  const [range, setRange] = useState('12m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await authService.getEmployerAnalytics(range);
      if (res?.success) setData(res.data);
      else setError('Analytics data unavailable — server may be offline');
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => navigate("/employer-login");
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, [navigate]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);

  const handleRangeChange = useCallback((newRange) => {
    setRange(newRange);
  }, []);

  const handleExport = useCallback(() => {
    if (!data) return;
    const esc = (v) => {
      const s = String(v ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      ['Section', 'Metric', 'Value'],
      ...data.kpis.map(k => ['Analytics', k.label, esc(k.val)]),
    ];
    if (data.overview) {
      rows.push(['', '', ''], ['Overview', 'Field', 'Value']);
      Object.entries(data.overview).forEach(([key, val]) => rows.push(['', key, esc(val)]));
    }
    if (data.recentApplications?.length) {
      rows.push(['', '', ''], ['Recent Applications', 'Name', 'Role', 'Status', 'Applied']);
      data.recentApplications.forEach(a => rows.push(['', esc(a.name), esc(a.role), esc(a.status), new Date(a.applied).toLocaleDateString()]));
    }
    if (data.sources?.length) {
      rows.push(['', '', ''], ['Source Breakdown', 'Source', 'Applications']);
      data.sources.forEach(s => rows.push(['', esc(s.source || s._id || 'Unknown'), s.count ?? s.applications ?? 0]));
    }
    if (data.departments?.length) {
      rows.push(['', '', ''], ['Departments', 'Department', 'Applications', 'Hired']);
      data.departments.forEach(d => rows.push(['', esc(d.department), d.applications ?? 0, d.hired ?? 0]));
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mavenjobs-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <EmployerLayout
      company={data?.company || {}}
      activeTab="analysis"
      onNavigate={(tabId) => {
        if (tabId === "home") { navigate("/employer-dashboard"); return; }
        if (tabId === "jobs") { navigate("/post-job"); return; }
        if (tabId === "analysis") { navigate("/employer-dashboard/analytics"); return; }
      }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Analytics' },
      ]} />

      <div className="ap-container" style={{ maxWidth: 'none', padding: 0, margin: 0 }}>
      <div className="ap-header">
        <div className="ap-header-left">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            Analytics Center
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
            Recruitment performance, recruiter productivity, candidate pipeline and Resdex insights.
          </motion.p>
        </div>
        <div className="ap-header-right">
          <span className="ap-label">
            {data ? `Last updated: ${new Date().toLocaleTimeString()}` : ''}
          </span>
          <button className="ap-btn" onClick={handleRefresh} disabled={refreshing || loading}
            style={refreshing ? { opacity: 0.6 } : {}}>
            <FiRefreshCw size={14} className={refreshing ? 'ap-spin' : ''} /> Refresh
          </button>
          <button className="ap-btn" onClick={handleExport} disabled={!data}>
            <FiDownload size={14} /> Export CSV
          </button>
          <button className="ap-btn ap-btn-primary" style={{ gap: 6 }}>
            <FiCalendar size={14} /> This Year
          </button>
        </div>
      </div>

        <div className="ap-tabs">
          <button className={`ap-tab${tab === 'resdex' ? ' active' : ''}`} onClick={() => setTab('resdex')}>
            <FiBarChart2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Resdex
          </button>
          <button className={`ap-tab${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>
            <FiBarChart2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Analytics
          </button>
        </div>

        <Suspense fallback={<TabSkeleton />}>
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'resdex' ? <ResdexTab /> : (
              <AnalyticsTab
                data={data}
                loading={loading}
                error={error}
                range={range}
                onRangeChange={handleRangeChange}
                onRefresh={handleRefresh}
              />
            )}
          </motion.div>
        </Suspense>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button onClick={() => navigate('/employer-dashboard')} className="ap-btn" style={{ padding: '10px 24px' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </EmployerLayout>
  );
}
