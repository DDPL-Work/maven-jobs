import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiRefreshCw, FiDownload, FiCalendar, FiBarChart2, FiChevronDown
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
  const { tabSlug } = useParams();
  const tab = tabSlug === 'analytics' ? 'analytics' : 'resdex';

  const setTab = (newTab) => {
    navigate(`/employer-dashboard/analytics/${newTab}`);
  };
  const [dateFilter, setDateFilter] = useState({ range: '12m', startDate: null, endDate: null, label: 'This Year' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterMode, setFilterMode] = useState('quick');
  const [customValue, setCustomValue] = useState('');
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [showFilterModeDropdown, setShowFilterModeDropdown] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const sessionUser = (() => {
    try { return JSON.parse(localStorage.getItem('employerUser') || 'null'); } catch { return null; }
  })();
  const isRecruiter = (sessionUser?.role || '').toUpperCase() === 'RECRUITER';

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await authService.getEmployerAnalytics(dateFilter.range, dateFilter.startDate, dateFilter.endDate);
      if (res?.success) setData(res.data);
      else setError('Analytics data unavailable — server may be offline');
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => navigate("/employer-login");
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, [navigate]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);

  const applyCustomFilter = () => {
    if (!customValue) return;
    let start, end, label;
    if (filterMode === 'year') {
      start = `${customValue}-01-01`;
      end = `${customValue}-12-31`;
      label = `Year ${customValue}`;
    } else if (filterMode === 'month') { // "YYYY-MM"
      const [y, m] = customValue.split('-');
      const lastDay = new Date(y, m, 0).getDate();
      start = `${customValue}-01`;
      end = `${customValue}-${lastDay}`;
      const mStr = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' });
      label = `${mStr} ${y}`;
    } else if (filterMode === 'quarter') { // "YYYY-Qx"
      const [y, q] = customValue.split('-Q');
      const qNum = parseInt(q);
      const startMonth = (qNum - 1) * 3;
      const endMonth = qNum * 3 - 1;
      const lastDay = new Date(y, endMonth + 1, 0).getDate();
      start = `${y}-${String(startMonth + 1).padStart(2, '0')}-01`;
      end = `${y}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`;
      label = `Q${qNum} ${y}`;
    } else if (filterMode === 'week') { 
      const parts = customValue.split('|');
      start = parts[0];
      end = parts[1];
      label = parts[2];
    }
    setDateFilter({ range: 'custom', startDate: start, endDate: end, label });
    setShowFilterPanel(false);
  };

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
            {isRecruiter
              ? 'Your personal recruitment performance, candidate pipeline and Resdex insights.'
              : 'Recruitment performance, recruiter productivity, candidate pipeline and Resdex insights.'}
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
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className="ap-btn ap-btn-primary" 
              style={{ gap: 6 }}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <FiCalendar size={14} /> {dateFilter.label}
            </button>
            {showFilterPanel && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                  onClick={() => setShowFilterPanel(false)} 
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  width: 250,
                  padding: 12
                }}>
                  <div style={{ marginBottom: 12, position: 'relative' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Filter Type</label>
                    <div 
                      onClick={() => setShowFilterModeDropdown(!showFilterModeDropdown)}
                      style={{ 
                        width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        cursor: 'pointer', backgroundColor: '#f8fafc', fontSize: 14, color: '#334155' 
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {filterMode === 'quick' ? 'Quick Ranges' : 
                         filterMode === 'year' ? 'Yearly' : 
                         filterMode === 'month' ? 'Monthly' : 
                         filterMode === 'quarter' ? 'Quarterly' : 'Weekly'}
                      </span>
                      <FiChevronDown size={14} color="#64748b" style={{ transform: showFilterModeDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                    {showFilterModeDropdown && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setShowFilterModeDropdown(false)} />
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                          backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 60, padding: 4
                        }}>
                          {[
                            { value: 'quick', label: 'Quick Ranges' },
                            { value: 'year', label: 'Yearly' },
                            { value: 'month', label: 'Monthly' },
                            { value: 'quarter', label: 'Quarterly' },
                            { value: 'week', label: 'Weekly' },
                          ].map(opt => (
                            <div 
                              key={opt.value}
                              onClick={() => { setFilterMode(opt.value); setCustomValue(''); setShowFilterModeDropdown(false); }}
                              style={{ 
                                padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 4,
                                backgroundColor: filterMode === opt.value ? '#eff6ff' : 'transparent',
                                color: filterMode === opt.value ? '#1E5EFF' : '#475569',
                                fontWeight: filterMode === opt.value ? 600 : 400
                              }}
                              onMouseEnter={(e) => { if (filterMode !== opt.value) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                              onMouseLeave={(e) => { if (filterMode !== opt.value) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {filterMode === 'quick' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        { range: '7d', label: 'This Week' },
                        { range: '30d', label: 'This Month' },
                        { range: '12m', label: 'This Year' }
                      ].map(opt => (
                        <button
                          key={opt.range}
                          onClick={() => { setDateFilter({ ...opt, startDate: null, endDate: null }); setShowFilterPanel(false); }}
                          style={{
                            textAlign: 'left', padding: '6px 10px', borderRadius: 4, border: 'none',
                            backgroundColor: dateFilter.range === opt.range ? '#eff6ff' : 'transparent',
                            color: dateFilter.range === opt.range ? '#1E5EFF' : '#334155',
                            cursor: 'pointer', fontSize: 14
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {filterMode !== 'quick' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filterMode === 'year' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <div 
                              key={y} onClick={() => setCustomValue(y.toString())}
                              style={{ padding: '8px', textAlign: 'center', borderRadius: 6, cursor: 'pointer', backgroundColor: customValue === y.toString() ? '#1E5EFF' : '#f8fafc', color: customValue === y.toString() ? '#fff' : '#334155', fontSize: 13, fontWeight: 500, border: '1px solid', borderColor: customValue === y.toString() ? '#1E5EFF' : '#e2e8f0' }}
                            >
                              {y}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {filterMode !== 'year' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                          <button style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCustomYear(y => y - 1)}>&lt;</button>
                          <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{customYear}</span>
                          <button style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCustomYear(y => y + 1)}>&gt;</button>
                        </div>
                      )}

                      {filterMode === 'month' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                            const val = `${customYear}-${String(i+1).padStart(2,'0')}`;
                            return (
                              <div 
                                key={m} onClick={() => setCustomValue(val)}
                                style={{ padding: '8px', textAlign: 'center', borderRadius: 6, cursor: 'pointer', backgroundColor: customValue === val ? '#1E5EFF' : '#f8fafc', color: customValue === val ? '#fff' : '#334155', fontSize: 13, fontWeight: 500, border: '1px solid', borderColor: customValue === val ? '#1E5EFF' : '#e2e8f0' }}
                              >
                                {m}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {filterMode === 'quarter' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                            const val = `${customYear}-${q}`;
                            return (
                              <div 
                                key={q} onClick={() => setCustomValue(val)}
                                style={{ padding: '12px 8px', textAlign: 'center', borderRadius: 6, cursor: 'pointer', backgroundColor: customValue === val ? '#1E5EFF' : '#f8fafc', color: customValue === val ? '#fff' : '#334155', fontSize: 13, fontWeight: 500, border: '1px solid', borderColor: customValue === val ? '#1E5EFF' : '#e2e8f0' }}
                              >
                                {q}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {filterMode === 'week' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: 12 }}>
                            <button style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => {
                              if (customMonth === 0) { setCustomMonth(11); setCustomYear(y => y - 1); } else { setCustomMonth(m => m - 1); }
                            }}>&lt;</button>
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{new Date(customYear, customMonth, 1).toLocaleString('default', { month: 'short' })} {customYear}</span>
                            <button style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => {
                              if (customMonth === 11) { setCustomMonth(0); setCustomYear(y => y + 1); } else { setCustomMonth(m => m + 1); }
                            }}>&gt;</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                            {(() => {
                              const lastDay = new Date(customYear, customMonth + 1, 0).getDate();
                              const weeks = [];
                              let currentStart = 1;
                              let weekNum = 1;
                              while (currentStart <= lastDay) {
                                const currentEnd = Math.min(currentStart + 6, lastDay);
                                const startStr = `${customYear}-${String(customMonth+1).padStart(2,'0')}-${String(currentStart).padStart(2,'0')}`;
                                const endStr = `${customYear}-${String(customMonth+1).padStart(2,'0')}-${String(currentEnd).padStart(2,'0')}`;
                                const mStr = new Date(customYear, customMonth, 1).toLocaleString('default', { month: 'short' });
                                const label = `${mStr} W${weekNum}, ${customYear}`;
                                const display = `Week ${weekNum} (${currentStart}-${currentEnd})`;
                                const val = `${startStr}|${endStr}|${label}`;
                                weeks.push(
                                  <div 
                                    key={weekNum} onClick={() => setCustomValue(val)}
                                    style={{ padding: '8px', textAlign: 'center', borderRadius: 6, cursor: 'pointer', backgroundColor: customValue === val ? '#1E5EFF' : '#f8fafc', color: customValue === val ? '#fff' : '#334155', fontSize: 13, fontWeight: 500, border: '1px solid', borderColor: customValue === val ? '#1E5EFF' : '#e2e8f0' }}
                                  >
                                    {display}
                                  </div>
                                );
                                currentStart = currentEnd + 1;
                                weekNum++;
                              }
                              return weeks;
                            })()}
                          </div>
                        </>
                      )}

                      <button 
                        onClick={applyCustomFilter}
                        disabled={!customValue}
                        style={{ width: '100%', padding: '10px', background: '#1E5EFF', color: 'white', borderRadius: 6, border: 'none', cursor: customValue ? 'pointer' : 'not-allowed', opacity: customValue ? 1 : 0.6, fontWeight: 600, marginTop: 4 }}
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
            {tab === 'resdex' ? <ResdexTab isRecruiter={isRecruiter} overview={data?.overview} /> : (
              <AnalyticsTab
                data={data}
                loading={loading}
                error={error}
                range={dateFilter.range}
                isRecruiter={isRecruiter}
                onRangeChange={(newRange) => setDateFilter({ 
                  range: newRange, 
                  startDate: null, 
                  endDate: null, 
                  label: newRange === '7d' ? 'This Week' : newRange === '30d' ? 'This Month' : 'This Year' 
                })}
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
