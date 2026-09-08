import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiUsers, FiBriefcase, FiStar, FiTrendingUp, FiClock,
  FiChevronLeft, FiChevronRight, FiDownload, FiEye,
  FiMail, FiUserPlus, FiEdit2, FiCopy, FiTrash2, FiRefreshCw,
  FiBookmark, FiAward, FiZap, FiMapPin, FiCheckCircle,
  FiX, FiFolder
} from 'react-icons/fi';
import { FaUserTie, FaGraduationCap, FaDollarSign } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';

const HERO_SLIDES = [
  {
    bg: 'linear-gradient(135deg, #002366 0%, #1E5EFF 100%)',
    title: 'Find Top Talent Faster',
    desc: 'Access 50K+ verified profiles with AI-powered search filters.',
    cta: 'Start Searching',
    icon: 'search',
  },
  {
    bg: 'linear-gradient(135deg, #0DBF7B 0%, #059669 100%)',
    title: 'Resdex Insights Dashboard',
    desc: 'Track your recruitment performance and optimize your hiring pipeline.',
    cta: 'View Insights',
    icon: 'trending',
  },
  {
    bg: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
    title: 'AI Matching Engine',
    desc: 'Get candidate suggestions based on your job requirements automatically.',
    cta: 'Try AI Match',
    icon: 'zap',
  },
];

const HERO_ICONS = { search: FiSearch, trending: FiTrendingUp, zap: FiZap };

const QUOTA_ITEMS = [
  { label: 'CV Access', used: 145, total: 200, icon: FiDownload, color: '#1E5EFF', bg: '#EEF4FF' },
  { label: 'Invites Remaining', used: 38, total: 100, icon: FiMail, color: '#0DBF7B', bg: '#ECFDF5' },
  { label: 'Hot Vacancies', used: 12, total: 25, icon: FiBriefcase, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Resume Unlocks', used: 67, total: 150, icon: FiEye, color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Database Credits', used: 890, total: 1200, icon: FiStar, color: '#EC4899', bg: '#FDF2F8' },
  { label: 'AI Searches', used: 23, total: 50, icon: FiZap, color: '#0EA5E9', bg: '#F0F9FF' },
];

const SAVED_SEARCHES = [
  { name: 'Senior React Developers', created: '12 Jan 2026', profiles: 48, lastUsed: '2h ago' },
  { name: 'DevOps Engineers - Remote', created: '05 Jan 2026', profiles: 32, lastUsed: '1d ago' },
  { name: 'Product Managers B2B SaaS', created: '28 Dec 2025', profiles: 24, lastUsed: '3d ago' },
  { name: 'UX Designers - Bangalore', created: '15 Dec 2025', profiles: 19, lastUsed: '1w ago' },
  { name: 'Data Scientists - NLP', created: '01 Dec 2025', profiles: 15, lastUsed: '2w ago' },
];

const FOLDERS = [
  { name: 'Shortlisted - Q1 2026', profiles: 24, owner: 'Neha K.', created: '10 Jan 2026', updated: '2d ago' },
  { name: 'Backend Engineers', profiles: 18, owner: 'Rajesh T.', created: '28 Dec 2025', updated: '5d ago' },
  { name: 'Product Team Prospects', profiles: 12, owner: 'Priya M.', created: '15 Dec 2025', updated: '1w ago' },
  { name: 'Internship Applicants', profiles: 34, owner: 'Amit J.', created: '01 Dec 2025', updated: '2w ago' },
];

const RECENTLY_VIEWED = [
  { name: 'Aarav Khanna', role: 'Senior React Developer', exp: '6 yrs', skills: ['React','Node.js','TypeScript'], viewed: '10 min ago', avatar: 'AK' },
  { name: 'Sneha Reddy', role: 'DevOps Engineer', exp: '4 yrs', skills: ['AWS','Docker','Kubernetes'], viewed: '1h ago', avatar: 'SR' },
  { name: 'Kabir Singh', role: 'Product Manager', exp: '7 yrs', skills: ['SaaS','Agile','Analytics'], viewed: '3h ago', avatar: 'KS' },
  { name: 'Isha Patel', role: 'UI/UX Designer', exp: '3 yrs', skills: ['Figma','Design Systems','Prototyping'], viewed: '1d ago', avatar: 'IP' },
  { name: 'Rohan Gupta', role: 'Full Stack Developer', exp: '5 yrs', skills: ['MERN','Python','GraphQL'], viewed: '2d ago', avatar: 'RG' },
];

const ACTIVITY_META = {
  SEARCH: { color: '#1E5EFF', icon: FiSearch },
  NVITE_SENT: { color: '#EC4899', icon: FiMail },
  RESUME_VIEW: { color: '#F59E0B', icon: FiEye },
  RESUME_DOWNLOAD: { color: '#0DBF7B', icon: FiDownload },
  FOLDER_CREATED: { color: '#8B5CF6', icon: FiFolder },
  CANDIDATE_ADDED: { color: '#0EA5E9', icon: FiUserPlus },
  JOB_POSTED: { color: '#059669', icon: FiBriefcase },
  CANDIDATE_APPLIED: { color: '#6366F1', icon: FiUsers },
};

const DEFAULT_ACTIVITY_COLOR = '#94a3b8';
const ACTIVITY_PAGE_SIZE = 5;

const timeAgo = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const renderActivityText = (text = '') => {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    return idx % 2 === 1
      ? <strong key={idx} style={{ color: '#0a1628', fontWeight: 700 }}>{part}</strong>
      : <span key={idx}>{part}</span>;
  });
};

const formatCompact = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

export default function ResdexTab() {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const searchPerPage = 3;
  const folderPerPage = 3;
  const recentPerPage = 4;

  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalItems, setActivityTotalItems] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  const fetchActivities = useCallback(async (page = 1) => {
    setActivityLoading(true);
    setActivityError(false);
    try {
      const res = await authService.getRecruiterActivity(page, ACTIVITY_PAGE_SIZE);
      if (res?.success) {
        setActivities(res.data?.items || []);
        setActivityPage(res.data?.pagination?.page || page);
        setActivityTotalPages(res.data?.pagination?.totalPages || 1);
        setActivityTotalItems(res.data?.pagination?.totalItems || 0);
      } else {
        setActivities([]);
        setActivityError(true);
      }
    } catch {
      setActivities([]);
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <div className="ap-hero">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            className="ap-hero-slide"
            style={{ background: HERO_SLIDES[heroIdx].bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="ap-hero-content">
              <h2>{HERO_SLIDES[heroIdx].title}</h2>
              <p>{HERO_SLIDES[heroIdx].desc}</p>
              <button className="ap-hero-btn">
                {React.createElement(HERO_ICONS[HERO_SLIDES[heroIdx].icon] || FiSearch, { size: 16 })} {HERO_SLIDES[heroIdx].cta}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        <button className="ap-hero-arrow left" onClick={() => setHeroIdx(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
          <FiChevronLeft size={18} />
        </button>
        <button className="ap-hero-arrow right" onClick={() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length)}>
          <FiChevronRight size={18} />
        </button>
        <div className="ap-hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={`ap-hero-dot${i === heroIdx ? ' active' : ''}`} onClick={() => setHeroIdx(i)} />
          ))}
        </div>
      </div>

      {/* Welcome */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, textAlign: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#0a1628', margin: '0 0 4px' }}>
              Welcome back, {(JSON.parse(localStorage.getItem('employerUser') || '{}')?.companyName || JSON.parse(localStorage.getItem('employerUser') || '{}')?.name || 'User').split(' ')[0]} <span style={{ color: '#1E5EFF' }}>👋</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              You searched <strong style={{ color: '#0a1628' }}>421</strong> profiles this week.{' '}
              <strong style={{ color: '#0DBF7B' }}>127</strong> shortlisted candidates.{' '}
              <strong style={{ color: '#1E5EFF' }}>19</strong> active jobs.
            </p>
          </div>
        </div>
      </div>

      {/* Quota */}
      <h3 className="ap-section-title">Quota Usage</h3>
      <div className="ap-quota-grid">
        {QUOTA_ITEMS.map((q, i) => {
          const pct = Math.min(100, Math.round((q.used / q.total) * 100));
          return (
            <motion.div key={q.label} className="ap-quota-card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <div className="ap-quota-icon" style={{ background: q.bg, color: q.color }}><q.icon size={17} /></div>
              <div className="ap-quota-label">{q.label}</div>
              <div className="ap-quota-numbers">
                <span>{formatCompact(q.total - q.used)} left</span>
                <span>{formatCompact(q.used)} used</span>
              </div>
              <div className="ap-quota-bar">
                <motion.div className="ap-quota-bar-fill" style={{ background: q.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.04, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="ap-quota-pct">{pct}% utilized</div>
            </motion.div>
          );
        })}
      </div>

      {/* Saved Searches */}
      <h3 className="ap-section-title">Saved Searches</h3>
      <p className="ap-section-sub">Quick access to your most important candidate searches.</p>
      <div className="ap-card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
        <div className="ap-table-wrap" style={{ border: 'none' }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>Search Name</th>
                <th>Created</th>
                <th>Profiles Found</th>
                <th>Last Used</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SAVED_SEARCHES.slice(0, searchPerPage).map((s, i) => (
                <motion.tr key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td style={{ fontWeight: 700, color: '#0a1628' }}>{s.name}</td>
                  <td style={{ color: '#64748b' }}>{s.created}</td>
                  <td><span className="ap-pill ap-pill-blue">{s.profiles} profiles</span></td>
                  <td style={{ color: '#94a3b8' }}>{s.lastUsed}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {[FiEye, FiEdit2, FiCopy, FiTrash2].map((Icon, j) => (
                        <button key={j} className="ap-btn" style={{ padding: '5px 7px', border: 'none', background: '#f8fafc' }}
                          title={['Open','Edit','Duplicate','Delete'][j]}>
                          <Icon size={13} />
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
          <button className="ap-btn" style={{ gap: 6, color: '#1E5EFF', borderColor: '#ccdaff', background: '#EEF4FF' }}>
            <FiSearch size={14} /> Search Again
          </button>
        </div>
      </div>

      {/* Recruiter Folders & Recently Viewed */}
      <div className="ap-grid-2" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Recruiter Folders</span>
          </div>
          <div className="ap-table-wrap" style={{ border: 'none' }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Folder Name</th>
                  <th>Profiles</th>
                  <th>Owner</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {FOLDERS.slice(0, folderPerPage).map((f, i) => (
                  <tr key={f.name}>
                    <td style={{ fontWeight: 700, color: '#0a1628' }}>{f.name}</td>
                    <td><span className="ap-pill ap-pill-blue">{f.profiles}</span></td>
                    <td style={{ color: '#64748b' }}>{f.owner}</td>
                    <td style={{ color: '#94a3b8' }}>{f.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">Recently Viewed Profiles</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECENTLY_VIEWED.slice(0, recentPerPage).map((p, i) => (
              <motion.div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ background: '#f1f5f9', x: 2 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E5EFF', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0a1628' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.role} · {p.exp}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {p.skills.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '0.62rem', fontWeight: 600, color: '#1E5EFF', background: '#EEF4FF', padding: '1px 6px', borderRadius: 99 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.viewed}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">Recent Recruiter Activity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activityTotalItems > 0 && !activityLoading && (
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                {activityTotalItems > 1 ? `${activityTotalItems} activities` : '1 activity'}
              </span>
            )}
            <button className="ap-btn" style={{ padding: '6px 12px' }} disabled={activityLoading}
              onClick={() => fetchActivities(activityPage)}>
              <FiRefreshCw size={13} className={activityLoading ? 'ap-spin' : ''} style={activityLoading ? { marginRight: 4 } : {}} /> Refresh
            </button>
          </div>
        </div>

        {activityLoading ? (
          <div className="ap-timeline" style={{ padding: '4px 0' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="ap-tl-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: '65%', background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '35%', background: '#f8fafc', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : activityError ? (
          <div style={{ textAlign: 'center', padding: '28px 12px', color: '#64748b' }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem' }}>Could not load recruiter activity.</p>
            <button className="ap-btn" style={{ padding: '6px 14px', gap: 6 }} onClick={() => fetchActivities(activityPage)}>
              <FiRefreshCw size={13} /> Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: '#94a3b8' }}>
            <FiClock size={22} style={{ marginBottom: 8, opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              No activity yet — searches, invites, resume downloads, folders, job posts and candidate applications will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="ap-timeline">
              {activities.map((a, i) => {
                const meta = ACTIVITY_META[a.action] || { color: DEFAULT_ACTIVITY_COLOR, icon: null };
                const Icon = meta.icon;
                return (
                  <motion.div key={a._id || i} className="ap-tl-item"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.25 }}>
                    <div className="ap-tl-dot" style={{ background: meta.color }}>
                      {Icon && <span style={{ position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRadius: '50%', background: '#fff', border: `1.5px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={9} color={meta.color} />
                      </span>}
                    </div>
                    <div className="ap-tl-time">{timeAgo(a.createdAt)}</div>
                    <p className="ap-tl-text">{renderActivityText(a.text)}</p>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 16px 4px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                Page {activityPage} of {activityTotalPages}
                {activityTotalItems > 0 && ` · ${Math.min((activityPage - 1) * ACTIVITY_PAGE_SIZE + 1, activityTotalItems)}–${Math.min(activityPage * ACTIVITY_PAGE_SIZE, activityTotalItems)} of ${activityTotalItems}`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="ap-btn" style={{ padding: '5px 10px', gap: 4 }}
                  disabled={activityPage <= 1}
                  onClick={() => fetchActivities(activityPage - 1)}>
                  <FiChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: activityTotalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === activityTotalPages || Math.abs(p - activityPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`gap-${idx}`} style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '0 2px' }}>…</span>
                    ) : (
                      <button key={p} className="ap-btn"
                        style={p === activityPage
                          ? { padding: '5px 10px', background: '#1E5EFF', color: '#fff', borderColor: '#1E5EFF', fontWeight: 700 }
                          : { padding: '5px 10px' }}
                        onClick={() => fetchActivities(p)}>
                        {p}
                      </button>
                    ),
                  )}
                <button className="ap-btn" style={{ padding: '5px 10px', gap: 4 }}
                  disabled={activityPage >= activityTotalPages}
                  onClick={() => fetchActivities(activityPage + 1)}>
                  Next <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
