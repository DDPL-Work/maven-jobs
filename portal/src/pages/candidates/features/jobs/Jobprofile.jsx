import React, { useState, useEffect } from 'react';
import {
  FiMapPin, FiBriefcase, FiUsers, FiStar, FiGlobe, FiCalendar,
  FiArrowLeft, FiHeart, FiExternalLink, FiSearch,
  FiChevronRight, FiClock, FiPlus, FiCheckCircle, FiInfo, FiSend,
  FiBookmark, FiArrowRight, FiLogOut,
  FiX, FiAward, FiTrendingUp, FiZap,
  FiShield, FiCoffee, FiDollarSign, FiMonitor, FiSun, FiGift,
  FiHeadphones, FiThumbsUp
} from 'react-icons/fi';
import { FaRupeeSign, FaStar, FaRegStar } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../AuthContext';
import authService from '../../../../services/authService';
import SkeletonPage from '../../../../components/Skeleton';
import LandingHeader from '../../../../components/LandingHeader';
import LandingFooter from '../../../../components/LandingFooter';

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

const normalizeUrl = (url) => {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(u)) return u;
  return `https://${u.replace(/^\/+/, '')}`;
};

const Jobprofile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [jobSearch, setJobSearch] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState({});
  const [saveLoading, setSaveLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fallbackCoverImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';

  const [company, setCompany] = useState({
    name: '', fullName: '', logo: '', bg: '#002366', accent: '#10b981',
    industry: '', type: '', size: '', founded: '', website: '',
    location: '', followers: '—', rating: 0, reviews: '0', reviewsList: [],
    coverImage: fallbackCoverImage,
    tags: [], about: '', departments: [], benefits: [], jobs: [],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = user
          ? await authService.getCompanyDetail(id).catch(() => authService.getPublicCompanyDetail(id))
          : await authService.getPublicCompanyDetail(id);
        if (res?.success && res?.data) {
          const c = res.data.company;
          const jobs = res.data.jobs || [];

          // Build departments from jobs
          const deptMap = {};
          jobs.forEach(j => {
            const d = j.department || 'General';
            deptMap[d] = (deptMap[d] || 0) + 1;
          });
          const departments = Object.entries(deptMap).map(([name, openings]) => ({ name, openings }));

          // Set follow state from API
          setIsFollowing(c.isFollowing || false);
          setFollowersCount(c.followersCount || 0);

          const reviews = res.data.reviews || [];
          const totalRatings = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
          const avgRating = reviews.length > 0 ? Math.round((totalRatings / reviews.length) * 10) / 10 : 0;

          setCompany({
            name: c.name || '',
            fullName: c.fullName || c.name || '',
            logo: c.logoUrl || c.logo || (c.name || 'M')[0].toUpperCase(),
            bg: c.color || '#002366',
            accent: '#10b981',
            industry: c.industry || 'General',
            type: c.type || 'Private',
            size: c.size || '10–50',
            founded: c.founded || '',
            website: normalizeUrl(c.website || ''),
            location: c.locationFull || c.location || '',
            rating: avgRating,
            reviews: reviews.length,
            reviewsList: reviews,
            coverImage: c.coverImageUrl || c.coverImage || fallbackCoverImage,
            tags: [c.type || 'Private', c.industry || 'Corporate'].filter(Boolean),
            about: c.about || `${c.name} is a leading company in the ${c.industry || 'technology'} industry, committed to excellence and innovation.`,
            mission: c.mission || '',
            vision: c.vision || '',
            whyJoinUs: c.whyJoinUs || [],
            activelyHiring: c.activelyHiring !== false,
            activeJobCount: c.activeJobCount || jobs.length,
            departments,
            benefits: (c.perks || []).map(p => {
              const match = PERK_MAP[p.label || p];
              const IconComp = match?.icon || FiStar;
              return {
                name: p.label || p,
                icon: <IconComp size={24} />,
                color: match?.color || '#64748B',
                bg: match?.bg || '#F1F5F9',
              };
            }),
            jobs: jobs.map(j => ({
              id: j.id,
              title: j.title,
              exp: j.experience || '0–3 Yrs',
              loc: j.location || c.location || '',
              posted: j.postedAt || 'Recently',
              salary: j.salary || 'Not disclosed',
              desc: j.summary || j.description || 'Join our team and work on exciting projects.',
              tags: j.skills?.length > 0 ? j.skills : ['General'],
              hasApplied: j.hasApplied || false,
            })),
          });
        }
      } catch (err) {
        console.error('Failed to fetch company:', err);
        setError('Failed to load company details');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  // Production-ready: toggle follow via backend API
  const handleFollowToggle = async () => {
    if (!user) return;
    if (followLoading) return;
    setFollowLoading(true);
    const newFollow = !isFollowing;
    // Optimistic update
    setIsFollowing(newFollow);
    setFollowersCount(prev => newFollow ? prev + 1 : Math.max(0, prev - 1));
    try {
      await authService.followCompany(id, newFollow);
    } catch (err) {
      console.error('Follow toggle failed:', err);
      // Rollback on error
      setIsFollowing(!newFollow);
      setFollowersCount(prev => newFollow ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setFollowLoading(false);
    }
  };

  // Production-ready: save job via backend API
  const toggleSave = async (jobId) => {
    if (!user) return;
    if (saveLoading[jobId]) return;
    setSaveLoading(prev => ({ ...prev, [jobId]: true }));
    const isCurrentlySaved = !!savedJobs[jobId];
    // Optimistic update
    setSavedJobs(prev => ({ ...prev, [jobId]: !isCurrentlySaved }));
    try {
      const res = await authService.saveJob(jobId, !isCurrentlySaved);
      if (res?.success && res?.data?.savedJobIds) {
        const newMap = {};
        res.data.savedJobIds.forEach(sid => newMap[sid] = true);
        setSavedJobs(newMap);
      }
    } catch (err) {
      console.error('Save job failed:', err);
      // Rollback on error
      setSavedJobs(prev => ({ ...prev, [jobId]: isCurrentlySaved }));
    } finally {
      setSaveLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const starCounts = [0, 0, 0, 0, 0];
  const reviewsCount = company.reviewsList.length;
  reviewsCount > 0 && company.reviewsList.forEach(r => {
    const s = Math.round(r.rating || 0);
    if (s >= 1 && s <= 5) starCounts[s - 1]++;
  });
  const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  const isLogoUrl = String(company.logo || "").startsWith("http");

  if (loading) {
    return <SkeletonPage variant="detail" />;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#EEF2F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#EF4444' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{error}</div>
          <button onClick={() => navigate('/companies')} style={{ padding: '10px 20px', borderRadius: 10, background: '#002366', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Back to Companies
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="jp-root" style={{ minHeight: '100vh', background: '#EEF2F9', fontFamily: "'DM Sans', sans-serif", color: '#0A1628', paddingTop: 72 }}>
      <style>{`
        @media (max-width: 768px) {
          .jp-root { padding-top: 64px !important; }
          .jp-container { padding: 16px 16px 60px !important; }
          .jp-profile-info { padding: 0 20px 24px !important; }
          .jp-profile-logo { width: 80px !important; height: 80px !important; top: -40px !important; border-radius: 16px !important; }
          .jp-profile-logo > div { font-size: 2rem !important; border-radius: 12px !important; }
          .jp-action-btns { justify-content: flex-end !important; margin-top: 0 !important; padding-top: 10px !important; margin-left: 90px !important; flex-wrap: wrap; }
          .jp-action-btns > * { flex: 1 !important; justify-content: center !important; text-align: center !important; }
          .jp-main-grid { grid-template-columns: 1fr !important; }
          .jp-benefits-grid { grid-template-columns: 1fr !important; }
          .jp-job-meta { grid-template-columns: repeat(2, 1fr) !important; }
          .jp-job-meta > div { min-width: 0; }
          .jp-highlights-grid { grid-template-columns: 1fr !important; }
          .jp-info-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .jp-sidebar { position: static !important; }
          .jp-job-actions { flex-direction: row !important; width: 100%; margin-top: 16px; }
          .jp-job-actions > button:last-child { flex: 1; justify-content: center; }
        }
      `}</style>

      {/* ─── Navbar ─────────────────────────────────────── */}
      <LandingHeader />

      <div className="jp-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ─── Profile Card ─────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 28, boxShadow: '0 4px 24px rgba(10,22,40,0.07)' }}>
          {/* Cover */}
          <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: '#CBD5E1' }}>
            <img src={company.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,35,102,0.15) 0%, rgba(0,35,102,0.55) 100%)' }} />
            <button
              onClick={() => navigate(-1)}
              style={{
                position: 'absolute', top: 20, left: 20,
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer'
              }}
            >
              <FiArrowLeft size={18} />
            </button>
            {/* Tags on cover */}
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
              {company.tags.map(tag => (
                <span key={tag} style={{
                  background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', fontSize: '0.68rem', fontWeight: 700,
                  padding: '4px 10px', borderRadius: 20, letterSpacing: '0.04em'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Logo + Info Row */}
          <div className="jp-profile-info" style={{ padding: '0 36px 32px', position: 'relative' }}>
            {/* Logo */}
            <div className="jp-profile-logo" style={{
              position: 'absolute', top: -52,
              width: 104, height: 104,
              background: 'white', borderRadius: 22,
              border: '4px solid white',
              boxShadow: '0 8px 32px rgba(0,35,102,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: 18,
                background: company.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora', sans-serif", fontWeight: 900,
                fontSize: '2.6rem', color: 'white', letterSpacing: '-0.04em'
              }}>
                {isLogoUrl ? (
                  <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : company.logo}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="jp-action-btns" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, marginBottom: 24 }}>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading || !user}
                style={{
                  padding: '9px 22px', borderRadius: 11,
                  background: isFollowing ? '#E8FBF3' : '#002366',
                  color: isFollowing ? '#0DBF7B' : 'white',
                  border: isFollowing ? '1.5px solid #0DBF7B' : '1.5px solid #002366',
                  fontWeight: 800, fontSize: '0.85rem',
                  cursor: followLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                  fontFamily: "'Sora', sans-serif", transition: 'all 0.18s',
                  opacity: followLoading ? 0.7 : 1
                }}
              >
                {isFollowing ? <FiCheckCircle size={15} /> : <FiPlus size={15} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '9px 22px', borderRadius: 11,
                    border: '1.5px solid #E2E8F0', background: 'white',
                    color: '#334155', fontWeight: 800, fontSize: '0.85rem',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7,
                    fontFamily: "'Sora', sans-serif", transition: 'all 0.18s'
                  }}
                >
                  <FiGlobe size={15} /> Website <FiExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Company Name & Meta */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.04em' }}>
                  {company.name}
                </h1>
                <span style={{
                  background: '#E8FBF3', color: '#0DBF7B',
                  fontSize: '0.7rem', fontWeight: 800,
                  padding: '4px 10px', borderRadius: 7,
                  border: '1px solid #0DBF7B',
                  letterSpacing: '0.04em', textTransform: 'uppercase'
                }}>
                  Actively Hiring
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748B', marginBottom: 16 }}>
                {company.fullName} · {company.industry}
              </p>

              {/* Meta Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {[
                  { icon: <FiMapPin size={13} />, text: company.location },
                  { icon: <FiUsers size={13} />, text: `${company.size} employees` },
                  { icon: <FiCalendar size={13} />, text: `Founded ${company.founded}` },
                  { icon: <FiCheckCircle size={13} />, text: `${followersCount} followers`, highlight: true },
                ].map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: m.highlight ? '#EEF4FF' : '#F8FAFC',
                    border: `1px solid ${m.highlight ? '#CCDAFF' : '#E2E8F0'}`,
                    color: m.highlight ? '#1E5EFF' : '#64748B',
                    padding: '5px 12px', borderRadius: 8,
                    fontSize: '0.8rem', fontWeight: 700
                  }}>
                    {m.icon} {m.text}
                  </div>
                ))}
                {/* Rating pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  color: '#92400E', padding: '5px 12px', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 800
                }}>
                  <FaStar size={11} color="#F59E0B" />
                  {company.rating} · {company.reviews} reviews
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderTop: '1px solid #F1F5F9', paddingTop: 0, marginTop: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['Overview', 'About', 'Jobs'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 20px 14px',
                    background: 'none', border: 'none',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '0.875rem', fontWeight: 800,
                    color: activeTab === tab ? '#002366' : '#94A3B8',
                    cursor: 'pointer', position: 'relative',
                    borderBottom: activeTab === tab ? '2.5px solid #002366' : '2.5px solid transparent',
                    transition: 'all 0.18s', marginBottom: -1,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {tab}
                  {tab === 'Jobs' && (
                    <span style={{
                      marginLeft: 6, background: '#002366', color: 'white',
                      fontSize: '0.62rem', fontWeight: 800,
                      padding: '1px 6px', borderRadius: 20
                    }}>
                      {company.jobs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Main Grid ──────────────────────────────────── */}
        <div className="jp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 308px', gap: 24, alignItems: 'start' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'Overview' && (
              <>
                {/* About */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px 32px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiInfo size={16} color="#1E5EFF" />
                    </div>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0A1628' }}>
                      About {company.name}
                    </h3>
                  </div>
                  <p style={{ color: '#475569', lineHeight: 1.75, fontWeight: 500, fontSize: '0.9rem' }}>
                    {company.about}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
                    {['Healthcare Planning', 'Hospital Architecture', 'MEP Design', 'Clinical Strategy', 'Operations Mgmt'].map(spec => (
                      <span key={spec} style={{
                        background: '#EEF4FF', color: '#1E5EFF',
                        fontSize: '0.72rem', fontWeight: 700,
                        padding: '5px 12px', borderRadius: 7,
                        border: '1px solid #CCDAFF'
                      }}>
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px 32px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0A1628', marginBottom: 20 }}>
                    Employee Benefits
                  </h3>
                  <div className="jp-benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {company.benefits.map(ben => (
                      <div key={ben.name} style={{
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                        borderRadius: 16, padding: '24px 16px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        textAlign: 'center', transition: 'all 0.22s', cursor: 'default'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,22,40,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#CCDAFF'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        <div style={{
                          width: 52, height: 52, borderRadius: 14,
                          background: ben.bg, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: ben.color, marginBottom: 14
                        }}>
                          {ben.icon}
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A1628', lineHeight: 1.4 }}>
                          {ben.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Departments */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px 32px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0A1628', marginBottom: 16 }}>
                    Hiring Departments
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {company.departments.map((dept, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', borderRadius: 12,
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                        cursor: 'pointer', transition: 'all 0.18s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#CCDAFF'; e.currentTarget.style.background = '#EEF4FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
                        onClick={() => setActiveTab('Jobs')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E5EFF' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>{dept.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            background: '#EEF4FF', color: '#1E5EFF',
                            fontSize: '0.72rem', fontWeight: 800,
                            padding: '3px 10px', borderRadius: 6, border: '1px solid #CCDAFF'
                          }}>
                            {dept.openings} open
                          </span>
                          <FiChevronRight size={15} color="#94A3B8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── JOBS TAB ── */}
            {activeTab === 'Jobs' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#0A1628' }}>
                    Active Openings
                    <span style={{
                      marginLeft: 10, background: '#002366', color: 'white',
                      fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20
                    }}>
                      {company.jobs.length}
                    </span>
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <FiSearch size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search Jobs..."
                      value={jobSearch}
                      onChange={e => setJobSearch(e.target.value)}
                      style={{
                        padding: '8px 14px 8px 34px', borderRadius: 10,
                        border: '1.5px solid #E2E8F0', background: 'white',
                        fontSize: '0.78rem', fontWeight: 700, color: '#334155',
                        outline: 'none', width: 200,
                        transition: 'border-color 0.18s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1E5EFF'}
                      onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                    />
                  </div>
                </div>

                {company.jobs.filter(job => {
                  if (!jobSearch.trim()) return true;
                  return job.title.toLowerCase().includes(jobSearch.toLowerCase().trim());
                }).map(job => (
                  <div
                    key={job.id}
                    style={{
                      background: 'white', borderRadius: 20,
                      border: '1px solid #E2E8F0', padding: '24px 28px',
                      boxShadow: '0 2px 12px rgba(10,22,40,0.05)',
                      transition: 'all 0.22s', cursor: 'default', position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(10,22,40,0.11)'; e.currentTarget.style.borderColor = '#CCDAFF'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(10,22,40,0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: company.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: '1.3rem',
                        color: 'white', boxShadow: '0 4px 12px rgba(0,35,102,0.25)'
                      }}>
                        {isLogoUrl ? (
                          <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : company.logo}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#0A1628', marginBottom: 5, letterSpacing: '-0.02em' }}>
                          {job.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>{company.name}</span>
                          <span style={{
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            color: '#166534', fontSize: '0.68rem', fontWeight: 800,
                            padding: '2px 8px', borderRadius: 6,
                            display: 'flex', alignItems: 'center', gap: 3
                          }}>
                            <FaStar size={9} color="#16A34A" /> {company.rating}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                            ({company.reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="jp-job-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                      {[
                        { icon: <FiBriefcase size={13} />, text: job.exp },
                        { icon: <FaRupeeSign size={11} />, text: job.salary },
                        { icon: <FiMapPin size={13} />, text: job.loc },
                        { icon: <FiClock size={13} />, text: job.posted },
                      ].map((m, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#F8FAFC', borderRadius: 9, padding: '7px 10px',
                          fontSize: '0.78rem', fontWeight: 700, color: '#475569',
                          border: '1px solid #F1F5F9'
                        }}>
                          <span style={{ color: '#94A3B8', flexShrink: 0 }}>{m.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.7, fontWeight: 500, marginBottom: 18 }}>
                      {job.desc}
                    </p>

                    {/* Tags + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {job.tags.map(tag => (
                          <span key={tag} style={{
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            color: '#64748B', fontSize: '0.7rem', fontWeight: 700,
                            padding: '4px 10px', borderRadius: 7, letterSpacing: '0.02em'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="jp-job-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => toggleSave(job.id)}
                          style={{
                            width: 38, height: 38, borderRadius: 10,
                            border: '1.5px solid #E2E8F0', background: savedJobs[job.id] ? '#EEF4FF' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: savedJobs[job.id] ? '#1E5EFF' : '#94A3B8', cursor: 'pointer',
                            transition: 'all 0.18s'
                          }}
                        >
                          <FiBookmark size={15} style={{ fill: savedJobs[job.id] ? '#1E5EFF' : 'none' }} />
                        </button>
                        <button
                          onClick={() => navigate(`/job/${job.id}`)}
                          style={{
                            padding: '9px 20px', borderRadius: 10,
                            background: '#002366', color: 'white',
                            border: 'none', fontFamily: "'Sora', sans-serif",
                            fontWeight: 800, fontSize: '0.82rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                            boxShadow: '0 4px 14px rgba(0,35,102,0.25)',
                            transition: 'all 0.18s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1E3A8A'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#002366'; e.currentTarget.style.transform = 'none'; }}
                        >
                          Quick Apply <FiArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── ABOUT TAB ── */}
            {activeTab === 'About' && (
              <>
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px 32px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0A1628', marginBottom: 16 }}>
                    About {company.name}
                  </h3>
                  <p style={{ color: '#475569', lineHeight: 1.8, fontWeight: 500, fontSize: '0.9rem', marginBottom: 16 }}>
                    {company.about}
                  </p>
                  <p style={{ color: '#475569', lineHeight: 1.8, fontWeight: 500, fontSize: '0.9rem' }}>
                    Over the decades, Hosmac has successfully managed over 500+ projects across the globe, bringing together architectural excellence and medical operational efficiency. Our team consists of seasoned professionals dedicated to transforming healthcare delivery.
                  </p>
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      Specialties
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Healthcare Planning', 'Hospital Architecture', 'MEP Design', 'Clinical Strategy', 'Operations Management', 'Medical Equipment Planning'].map(spec => (
                        <span key={spec} style={{
                          background: '#EEF4FF', color: '#1E5EFF', fontSize: '0.75rem',
                          fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1px solid #CCDAFF'
                        }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="jp-highlights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { icon: <FiGlobe size={20} />, title: 'Global Presence', desc: 'Headquartered in Mumbai with operational footprints in Middle East and Africa.', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
                    { icon: <FiAward size={20} />, title: 'Quality Standards', desc: 'ISO 9001:2015 certified consulting firm ensuring top-tier medical excellence.', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                    { icon: <FiTrendingUp size={20} />, title: '500+ Projects', desc: 'Successfully delivered projects across healthcare infrastructure globally.', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { icon: <FiZap size={20} />, title: 'Fast-Growing', desc: 'Rapidly expanding team with consistent year-on-year growth since 1996.', color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
                  ].map((h, i) => (
                    <div key={i} style={{
                      background: h.bg, border: `1px solid ${h.border}`,
                      borderRadius: 18, padding: '22px 24px'
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: h.color, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                        {h.icon}
                      </div>
                      <h4 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: '#0A1628', marginBottom: 6 }}>{h.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500, lineHeight: 1.6 }}>{h.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Company Info Table */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px 32px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0A1628', marginBottom: 20 }}>
                    Company Information
                  </h3>
                  <div className="jp-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
                    {[
                      { label: 'Company Type', value: company.type },
                      { label: 'Founded', value: company.founded },
                      { label: 'Employees', value: company.size },
                      { label: 'Industry', value: company.industry },
                      { label: 'Headquarters', value: company.location },
                      { label: 'Website', value: normalizeUrl(company.website), isLink: true },
                    ].map(info => (
                      <div key={info.label} style={{ padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
                          {info.label}
                        </div>
                        {info.isLink && info.value ? (
                          <a href={info.value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E5EFF', textDecoration: 'none', wordBreak: 'break-all' }}>
                            {info.value}
                          </a>
                        ) : (
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>{info.value || '—'}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─── Right Sidebar ─────────────────────────── */}
          <div className="jp-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 88 }}>

            {/* Rating Widget */}
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 12px rgba(10,22,40,0.05)' }}>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0A1628', marginBottom: 20 }}>
                Reviews & Rating
              </h3>

              {/* Big Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '3rem', fontWeight: 800, color: '#0A1628', lineHeight: 1, letterSpacing: '-0.05em' }}>
                    {company.rating}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginTop: 4 }}>
                    out of 5
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <FaStar key={s} size={16} color={s <= Math.round(company.rating) ? '#F59E0B' : '#E2E8F0'} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
                    Based on {company.reviews} reviews
                  </div>
                </div>
              </div>

              {/* Star Distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[5, 4, 3, 2, 1].map(s => {
                  const count = starCounts[s - 1];
                  const pct = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 2, width: 64, flexShrink: 0 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <FaStar key={i} size={11} color={i <= s ? '#F59E0B' : '#E2E8F0'} />
                        ))}
                      </div>
                      <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', width: 28, textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                style={{
                  width: '100%', padding: '11px', borderRadius: 11,
                  border: '1.5px solid #CCDAFF', background: '#EEF4FF',
                  color: '#1E5EFF', fontFamily: "'Sora', sans-serif",
                  fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#CCDAFF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#EEF4FF'; }}
              >
                <FiStar size={14} /> Write a Review
              </button>


            </div>

            {/* CTA Widget */}
            <div style={{
              borderRadius: 20, padding: '28px 24px',
              background: '#002366', position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,35,102,0.28)'
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(13,191,123,0.15)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <FiZap size={18} color="white" />
                </div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Work at {company.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.6, marginBottom: 20 }}>
                  Explore all openings and apply with your Maven profile instantly.
                </p>
                <button
                  onClick={() => setShowJobsModal(true)}
                  style={{
                    width: '100%', padding: '12px',
                    borderRadius: 11, background: '#0DBF7B',
                    color: 'white', border: 'none',
                    fontFamily: "'Sora', sans-serif", fontWeight: 800,
                    fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(13,191,123,0.35)',
                    transition: 'all 0.18s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0DBF7B'; e.currentTarget.style.transform = 'none'; }}
                >
                  <FiSend size={15} /> View All Openings
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────── */}
      <LandingFooter />

      {/* ─── Review Modal ──────────────────────────────── */}
      {
        showReviewModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowReviewModal(false)}
          >
            <div
              style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 64px rgba(10,22,40,0.2)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ background: '#002366', padding: '28px 32px', position: 'relative' }}>
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                >
                  <FiX size={16} />
                </button>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <FiStar size={20} color="white" />
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'white', marginBottom: 4 }}>Write a Review</h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Share your experience at {company.name}</p>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '28px 32px' }}>
                {/* Star Picker */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                    Overall Rating
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.15s' }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                      >
                        <FaStar size={32} color={(hoverRating || selectedRating) >= star ? '#F59E0B' : '#E2E8F0'} />
                      </button>
                    ))}
                  </div>
                  <div style={{ height: 20, fontSize: '0.8rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selectedRating ? ratingLabel[selectedRating] : ''}
                  </div>
                </div>

                {/* Textarea */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Share more details <span style={{ color: '#CBD5E1', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="What's it like working here? Describe culture, growth, work-life balance..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    style={{
                      width: '100%', background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0', borderRadius: 14,
                      padding: '14px 16px', fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem', color: '#334155', fontWeight: 500,
                      resize: 'none', outline: 'none', transition: 'all 0.18s',
                      lineHeight: 1.6, boxSizing: 'border-box'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1E5EFF'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,94,255,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12,
                      border: '1.5px solid #E2E8F0', background: 'white',
                      color: '#64748B', fontFamily: "'Sora', sans-serif",
                      fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedRating || reviewSubmitting}
                    onClick={async () => {
                      if (!selectedRating) return;
                      setReviewSubmitting(true);
                      try {
                        const savedUser = (() => {
                          try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
                        })();
                        const res = await authService.submitCompanyReview(id, {
                          rating: selectedRating,
                          review: reviewText,
                          headline: "",
                          isAnonymous: false,
                          candidateName: savedUser.name || savedUser.fullName || savedUser.email || 'Candidate',
                          candidateTitle: savedUser.headline || savedUser.title || 'Candidate',
                        });
                        const nextReview = res?.data?.review || null;
                        if (nextReview) {
                          setCompany((current) => ({
                            ...current,
                            reviewsList: [nextReview, ...(current.reviewsList || [])],
                            reviews: String(Number(current.reviews || 0) + 1),
                          }));
                        }
                        setShowReviewModal(false);
                        setSelectedRating(0);
                        setReviewText('');
                      } catch (error) {
                        alert(error?.message || 'Failed to submit review');
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                    style={{
                      flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                      background: selectedRating && !reviewSubmitting ? '#002366' : '#F1F5F9',
                      color: selectedRating && !reviewSubmitting ? 'white' : '#94A3B8',
                      fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '0.85rem',
                      cursor: selectedRating && !reviewSubmitting ? 'pointer' : 'not-allowed', transition: 'all 0.18s',
                      boxShadow: selectedRating && !reviewSubmitting ? '0 4px 16px rgba(0,35,102,0.25)' : 'none'
                    }}
                    onMouseEnter={e => { if (selectedRating && !reviewSubmitting) e.currentTarget.style.background = '#1E3A8A'; }}
                    onMouseLeave={e => { if (selectedRating && !reviewSubmitting) e.currentTarget.style.background = '#002366'; }}
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {
        showJobsModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowJobsModal(false)}
          >
            <div
              style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 840, maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 24px 64px rgba(10,22,40,0.2)', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ background: '#002366', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiBriefcase size={20} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: 'white', marginBottom: 2 }}>Openings at {company.name}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                      {company.jobs.length} {company.jobs.length === 1 ? 'position' : 'positions'} available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJobsModal(false)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', flexShrink: 0 }}
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
                {company.jobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <FiBriefcase size={48} color="#E2E8F0" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#94A3B8' }}>
                      No open positions right now
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 500, marginTop: 8 }}>
                      Check back later for new opportunities at {company.name}.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {company.jobs.map(job => (
                      <div
                        key={job.id}
                        style={{
                          background: 'white', borderRadius: 16,
                          border: '1px solid #E2E8F0', padding: '20px 24px',
                          boxShadow: '0 2px 8px rgba(10,22,40,0.04)',
                          transition: 'all 0.22s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(10,22,40,0.1)'; e.currentTarget.style.borderColor = '#CCDAFF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,22,40,0.04)'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: company.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: '1.1rem',
                            color: 'white', boxShadow: '0 4px 12px rgba(0,35,102,0.2)'
                          }}>
                            {isLogoUrl ? (
                              <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                            ) : company.logo}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0A1628', marginBottom: 4, letterSpacing: '-0.01em' }}>
                              {job.title}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>{company.name}</span>
                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1' }} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>{job.department || job.category || 'General'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Meta chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          {[
                            { icon: <FiBriefcase size={12} />, text: job.exp },
                            { icon: <FaRupeeSign size={10} />, text: job.salary },
                            { icon: <FiMapPin size={12} />, text: job.loc },
                            { icon: <FiClock size={12} />, text: job.posted },
                          ].map((m, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: '#F8FAFC', borderRadius: 8, padding: '5px 10px',
                              fontSize: '0.75rem', fontWeight: 600, color: '#475569',
                              border: '1px solid #F1F5F9'
                            }}>
                              <span style={{ color: '#94A3B8', flexShrink: 0, display: 'flex' }}>{m.icon}</span>
                              <span>{m.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.65, fontWeight: 500, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.desc}
                        </p>

                        {/* Tags + Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {(job.tags || []).slice(0, 3).map(tag => (
                              <span key={tag} style={{
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                color: '#64748B', fontSize: '0.68rem', fontWeight: 700,
                                padding: '3px 9px', borderRadius: 6, letterSpacing: '0.02em'
                              }}>
                                {tag}
                              </span>
                            ))}
                            {(job.tags || []).length > 3 && (
                              <span style={{
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700,
                                padding: '3px 9px', borderRadius: 6
                              }}>
                                +{job.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => navigate(`/job/${job.id}`)}
                              style={{
                                padding: '8px 18px', borderRadius: 10,
                                background: '#002366', color: 'white',
                                border: 'none', fontFamily: "'Sora', sans-serif",
                                fontWeight: 800, fontSize: '0.78rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 14px rgba(0,35,102,0.2)',
                                transition: 'all 0.18s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#1E3A8A'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#002366'; e.currentTarget.style.transform = 'none'; }}
                            >
                              View Details <FiArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Jobprofile;
