import React, { useState, useMemo, useCallback } from 'react';
import {
  FiTrendingUp, FiUsers, FiBriefcase, FiCheckCircle, FiCalendar,
  FiEye, FiBarChart2, FiSearch, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaUserTie } from 'react-icons/fa';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const SOURCE_COLORS = ['#002366', '#1E5EFF', '#0DBF7B', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const KPI_CARDS = [
  { label: 'Live Jobs', key: 'liveJobs', icon: FiBriefcase, color: '#1E5EFF', bg: '#EEF4FF' },
  { label: 'Applications', key: 'applications', icon: FiUsers, color: '#0DBF7B', bg: '#ECFDF5' },
  { label: 'Shortlisted', key: 'shortlisted', icon: FiCheckCircle, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Interviews', key: 'interviews', icon: FiCalendar, color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Offers Sent', key: 'offers', icon: FiTrendingUp, color: '#EC4899', bg: '#FDF2F8' },
  { label: 'Hired', key: 'hired', icon: FaUserTie, color: '#059669', bg: '#ECFDF5' },
  { label: 'Offer Acceptance', key: 'acceptance', icon: FiCheckCircle, color: '#002366', bg: '#F8FAFC' },
  { label: 'Time to Hire', key: 'timeToHire', icon: FiCalendar, color: '#D97706', bg: '#FFFBEB' },
  { label: 'Profile Views', key: 'profileViews', icon: FiEye, color: '#1E5EFF', bg: '#EEF4FF' },
  { label: 'Job Views', key: 'jobViews', icon: FiEye, color: '#6366F1', bg: '#EEF2FF' },
  { label: 'CTR', key: 'ctr', icon: FiBarChart2, color: '#0DBF7B', bg: '#ECFDF5' },
  { label: 'Conversion Rate', key: 'conversion', icon: FiTrendingUp, color: '#8B5CF6', bg: '#F5F3FF' },
];

const KPI_KEY_MAP = {
  liveJobs: { field: 'activeJobs', suffix: '' },
  applications: { field: 'totalApplications', suffix: '' },
  shortlisted: { field: 'shortlisted', suffix: '' },
  interviews: { field: 'interviewed', suffix: '' },
  offers: { field: 'offersSent', suffix: '' },
  hired: { field: 'hired', suffix: '' },
  acceptance: { field: 'acceptance', suffix: '%' },
  timeToHire: { field: 'timeToHire', suffix: 'd' },
  profileViews: { field: 'profileViews', suffix: '' },
  jobViews: { field: 'jobViews', suffix: '' },
  ctr: { field: 'ctr', suffix: '%' },
  conversion: { field: 'conversion', suffix: '%' },
};

const STATUS_STYLES = {
  APPLIED: 'ap-pill ap-pill-blue',
  SCREENING: 'ap-pill ap-pill-cyan',
  SHORTLISTED: 'ap-pill ap-pill-amber',
  INTERVIEW: 'ap-pill ap-pill-purple',
  OFFERED: 'ap-pill ap-pill-green',
  HIRED: 'ap-pill ap-pill-green',
  REJECTED: 'ap-pill ap-pill-red',
};

const formatCompact = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const timeAgo = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  if (isNaN(then)) return dateStr || '';
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ${months % 12}mo ago`;
};

export default function AnalyticsTab({ data, loading, error, range = '12m', onRangeChange, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const perPage = 4;

  const recentApps = data?.recentApplications || [];

  const monthlyData = useMemo(() => {
    if (!data?.monthly) return [];
    const { labels, applications, jobs } = data.monthly;
    return labels.map((label, i) => ({
      month: label,
      applications: applications[i] || 0,
      jobs: jobs[i] || 0,
    }));
  }, [data]);

  const funnelData = data?.funnel || [];

  const sourcesData = useMemo(() => {
    if (!data?.sources) return [];
    return data.sources.map(s => ({ name: s.label, value: s.pct }));
  }, [data]);

  const deptData = data?.departments || [];

  const getKpiValue = (key) => {
    const map = KPI_KEY_MAP[key];
    if (!map || !data?.overview) return '—';
    const raw = data.overview[map.field];
    if (raw === undefined || raw === null) return '—';
    return `${formatCompact(raw)}${map.suffix}`;
  };

  const getKpiChange = (key) => {
    if (!data?.kpis) return null;
    return data.kpis.find(k => {
      const labelMatch = KPI_CARDS.find(c => c.key === key);
      return labelMatch && k.label === labelMatch.label;
    });
  };

  const filtered = useMemo(() => {
    let list = [...recentApps];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => r.name?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return ((a.name || '').localeCompare(b.name || '')) * dir;
      return 0;
    });
    return list;
  }, [searchTerm, sortField, sortDir, recentApps]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (error) {
    return (
      <div className="ap-card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444', marginBottom: 12 }}>Failed to load analytics</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>{error}</div>
        <button className="ap-btn ap-btn-primary" onClick={onRefresh}>Try Again</button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        {[1, 2, 3].map(i => (
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

  return (
    <div>
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">Overview</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d', '30d', '90d', '12m'].map(r => (
              <button key={r} onClick={() => onRangeChange(r)}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  borderColor: range === r ? '#002366' : '#e2e8f0',
                  background: range === r ? '#002366' : 'white',
                  color: range === r ? 'white' : '#64748b',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >{r === '12m' ? '1 Year' : r}</button>
            ))}
          </div>
        </div>
        <div className="ap-grid-4">
          {KPI_CARDS.map((kpi, i) => {
            const change = getKpiChange(kpi.key);
            return (
              <motion.div key={kpi.key} className="ap-card" style={{ padding: 16, cursor: 'default' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                    {React.createElement(kpi.icon, { size: 18 })}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>{kpi.label}</span>
                </div>
                <motion.div className="ap-kpi-value"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 + 0.2, duration: 0.4 }}
                >
                  {getKpiValue(kpi.key)}
                </motion.div>
                <div className={`ap-kpi-change ${change?.up ? 'up' : 'down'}`}>
                  {change?.up ? '↑' : '↓'} {change?.change || ''}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="ap-grid-2" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Applications & Jobs</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E5EFF" stopOpacity={0.2} /><stop offset="100%" stopColor="#1E5EFF" stopOpacity={0} /></linearGradient>
                  <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0DBF7B" stopOpacity={0.2} /><stop offset="100%" stopColor="#0DBF7B" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="applications" stroke="#1E5EFF" fillOpacity={1} fill="url(#appGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="jobs" stroke="#0DBF7B" fillOpacity={1} fill="url(#jobGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Hiring Sources</span>
          </div>
          <div style={{ height: 260, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourcesData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                  {sourcesData.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ap-grid-2" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Pipeline Analytics</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
              Total: {funnelData.reduce((s, f) => s + f.value, 0)}
            </span>
          </div>
          <div className="ap-funnel">
            {funnelData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                No pipeline data yet
              </div>
            )}
            {funnelData.map((f, i) => {
              const maxVal = funnelData[0]?.value || 1;
              const pct = (f.value / maxVal) * 100;
              const conversion = i > 0 && funnelData[i - 1]?.value > 0 ? ((f.value / funnelData[i - 1].value) * 100).toFixed(0) : i === 0 ? '100' : '0';
              return (
                <div key={f.stage} className="ap-funnel-row">
                  <span className="ap-funnel-label">{f.stage}</span>
                  <div className="ap-funnel-bar-wrap">
                    <motion.div className="ap-funnel-bar" style={{ width: `${pct}%`, background: f.color }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                    >
                      {pct > 20 && f.value}
                    </motion.div>
                  </div>
                  <span className="ap-funnel-count">{conversion}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Department Hiring</span>
          </div>
          <div style={{ height: 280 }}>
            {deptData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                No department data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="hired" fill="#0DBF7B" radius={[0, 4, 4, 0]} name="Hired" />
                  <Bar dataKey="applications" fill="#E2E8F0" radius={[0, 4, 4, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="ap-grid-3" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Recruiter Performance</span>
          </div>
          <div className="ap-leaderboard">
            {[
              { name: 'Neha Kapoor', jobs: 12, responses: 89, hires: 8, eff: '74%' },
              { name: 'Rajesh Tiwari', jobs: 8, responses: 64, hires: 5, eff: '62%' },
              { name: 'Priya Mehta', jobs: 6, responses: 52, hires: 4, eff: '58%' },
              { name: 'Amit Joshi', jobs: 4, responses: 38, hires: 2, eff: '45%' },
            ].map((r, i) => (
              <div key={r.name} className="ap-lb-row">
                <div className={`ap-lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                  {i + 1}
                </div>
                <span className="ap-lb-name">{r.name}</span>
                <div className="ap-lb-stat"><strong>{r.jobs}</strong>Jobs</div>
                <div className="ap-lb-stat"><strong>{r.responses}</strong>Resp.</div>
                <div className="ap-lb-stat"><strong>{r.hires}</strong>Hires</div>
                <div className="ap-lb-stat"><strong>{r.eff}</strong>Eff.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ap-card" style={{ gridColumn: 'span 2' }}>
          <div className="ap-card-header">
            <span className="ap-card-title">Recent Applications</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
              <input placeholder="Search..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                style={{ padding: '7px 10px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none', width: 180 }}
              />
            </div>
          </div>
          <div className="ap-table-wrap" style={{ border: 'none' }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontWeight: 600 }}>No applications found</td></tr>
                ) : (
                  paged.map((r, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td style={{ fontWeight: 700, color: '#0a1628' }}>{r.name}</td>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>{r.role}</td>
                      <td><span className={STATUS_STYLES[r.status] || 'ap-pill ap-pill-gray'}>{r.status}</span></td>
                      <td style={{ color: '#94a3b8', fontWeight: 600 }}>{timeAgo(r.applied)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="ap-btn" style={{ padding: '6px 10px' }}>
                <FiChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="ap-btn" style={{ padding: '6px 10px' }}>
                <FiChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ap-grid-3">
        {[
          { title: 'Applications increased 32% this month.', desc: 'Highest volume since Q1. Marketing roles driving the surge.', color: '#0DBF7B', bg: '#ECFDF5' },
          { title: 'Backend hiring demand up 18%.', desc: 'Node.js & Python roles see 40% more applications than frontend.', color: '#1E5EFF', bg: '#EEF4FF' },
          { title: 'Average hiring time down 5 days.', desc: 'Streamlined screening pipeline improved efficiency by 22%.', color: '#F59E0B', bg: '#FFFBEB' },
        ].map((insight, i) => (
          <motion.div key={i} className="ap-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: insight.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiTrendingUp size={20} color={insight.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0a1628', marginBottom: 4 }}>{insight.title}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', lineHeight: 1.5 }}>{insight.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
