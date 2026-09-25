import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiUsers, FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiCalendar, FiLayers, FiGlobe, FiTag } from 'react-icons/fi';
import employerJobService from '../../../../../services/employerJobService';
import './PreviewMiviteModal.css';

/**
 * Renders plain-text description (\n newlines + • bullets) as structured JSX.
 * Groups consecutive • lines into <ul> lists.
 */
function PlainTextContent({ text }) {
  if (!text) return <p style={{ color: '#94a3b8' }}>No description provided.</p>;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nodes = [];
  let bulletBuffer = [];

  const flushBullets = (key) => {
    if (bulletBuffer.length > 0) {
      nodes.push(
        <ul key={`ul-${key}`} style={{ margin: '0 0 14px 0', paddingLeft: '20px', listStyle: 'disc' }}>
          {bulletBuffer.map((b, i) => (
            <li key={i} style={{ marginBottom: '5px', color: '#64748b', fontSize: '14px', lineHeight: '1.65' }}>{b}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('•')) {
      bulletBuffer.push(line.replace(/^[•\-]\s*/, ''));
    } else {
      flushBullets(i);
      nodes.push(
        <p key={`p-${i}`} style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.65' }}>
          {line}
        </p>
      );
    }
  });
  flushBullets('end');

  return <>{nodes}</>;
}

function MetaCard({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="pmm-meta-card">
      <div className="pmm-meta-card-icon" style={{ background: color + '15', color }}>
        <Icon size={16} />
      </div>
      <div className="pmm-meta-card-text">
        <span className="pmm-meta-card-label">{label}</span>
        <span className="pmm-meta-card-value">{value}</span>
      </div>
    </div>
  );
}

export default function PreviewMiviteModal({ jobId, onClose }) {
  const [activeTab, setActiveTab] = useState('description');

  const [loadingJob, setLoadingJob] = useState(true);
  const [jobDetail, setJobDetail] = useState(null);
  const [jobError, setJobError] = useState('');

  const [loadingNvites, setLoadingNvites] = useState(true);
  const [nviteRecipients, setNviteRecipients] = useState([]);
  const [nviteError, setNviteError] = useState('');

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoadingJob(true);
      try {
        const data = await employerJobService.getJob(jobId);
        setJobDetail(data || null);
        if (!data) setJobError('Failed to load job details');
      } catch (err) {
        setJobError(err.message || 'Error fetching job');
      } finally {
        setLoadingJob(false);
      }
    };

    const fetchNvites = async () => {
      setLoadingNvites(true);
      try {
        const recipients = await employerJobService.getJobNviteRecipients(jobId);
        setNviteRecipients(recipients || []);
      } catch (err) {
        setNviteError(err.message || 'Error fetching NVite recipients');
      } finally {
        setLoadingNvites(false);
      }
    };

    fetchJob();
    fetchNvites();
  }, [jobId]);

  /* Format salary: 500000 -> ₹5.0L */
  const formatSalary = (min, max) => {
    const fmt = (n) => n >= 100000 ? `\u20B9${(n / 100000).toFixed(1)}L` : `\u20B9${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} \u2013 ${fmt(max)} / year`;
    if (min) return `From ${fmt(min)}`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  // Auto-split description if responsibilities and qualifications were merged into it
  let displayDescription = jobDetail?.description || '';
  let displayResponsibilities = jobDetail?.responsibilities || '';
  let displayQualifications = jobDetail?.qualifications || '';

  if (displayDescription && !displayResponsibilities && !displayQualifications) {
    const parts = displayDescription.split(/\n\n(?=[•\-])/);
    if (parts.length >= 2) {
      displayDescription = parts[0].trim();
      displayResponsibilities = parts[1].trim();
      if (parts.length >= 3) {
        displayQualifications = parts.slice(2).join('\n\n').trim();
      }
    }
  }

  return (
    <div className="pmm-modal-overlay" onClick={onClose}>
      <div className="pmm-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="pmm-header">
          <div className="pmm-header-title">
            <h3>NVite Preview</h3>
            {jobDetail && <span className="pmm-job-badge">{jobDetail.title}</span>}
          </div>
          <button className="pmm-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="pmm-tabs">
          <button className={`pmm-tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>
            <FiFileText size={15} /> Job Description
          </button>
          <button className={`pmm-tab-btn ${activeTab === 'mivites' ? 'active' : ''}`} onClick={() => setActiveTab('mivites')}>
            <FiUsers size={15} /> List of MiVites
            {nviteRecipients.length > 0 && <span className="pmm-tab-count">{nviteRecipients.length}</span>}
          </button>
        </div>

        <div className="pmm-body">

          {/* ──── JOB DESCRIPTION TAB ──── */}
          {activeTab === 'description' && (
            <div className="pmm-tab-content">
              {loadingJob ? (
                <div className="pmm-loading">Loading job details...</div>
              ) : jobError ? (
                <div className="pmm-error">{jobError}</div>
              ) : !jobDetail ? (
                <div className="pmm-empty">No job details found.</div>
              ) : (
                <div className="pmm-job-details">

                  {/* 1. Title + Active status */}
                  <div className="pmm-title-row">
                    <h2 className="pmm-job-title">{jobDetail.title}</h2>
                    <span className={`pmm-active-pill ${jobDetail.isActive ? 'is-active' : 'is-closed'}`}>
                      {jobDetail.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  {/* 2. Job Description (Top) */}
                  {displayDescription && (
                    <div className="pmm-summary">
                      <PlainTextContent text={displayDescription} />
                    </div>
                  )}

                  {/* 3. Key Details as icon cards */}
                  <div className="pmm-meta-cards-grid">
                    <MetaCard icon={FiBriefcase}  label="Job Type"   value={jobDetail.jobType}                                   color="#2563eb" />
                    <MetaCard icon={FiGlobe}      label="Workplace"  value={jobDetail.workplaceType}                             color="#2563eb" />
                    <MetaCard icon={FiMapPin}     label="Location"   value={jobDetail.location}                                  color="#2563eb" />
                    <MetaCard icon={FiLayers}     label="Department" value={jobDetail.department}                                color="#2563eb" />
                    <MetaCard icon={FiClock}      label="Experience" value={jobDetail.experience}                                color="#2563eb" />
                    <MetaCard icon={FiDollarSign} label="Salary"     value={formatSalary(jobDetail.salaryMin, jobDetail.salaryMax)} color="#2563eb" />
                    <MetaCard icon={FiCalendar}   label="Apply By"   value={formatDate(jobDetail.deadline)}                     color="#2563eb" />
                    <MetaCard icon={FiTag}        label="Approval"   value={jobDetail.approvalStatus}                           color="#2563eb" />
                  </div>

                  {/* 4. Skills */}
                  {jobDetail.skills && jobDetail.skills.length > 0 && (
                    <div className="pmm-section">
                      <h4 className="pmm-section-title">Skills Required</h4>
                      <div className="pmm-skills-wrap">
                        {jobDetail.skills.map((skill, i) => (
                          <span key={i} className="pmm-skill-badge">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Responsibilities */}
                  {displayResponsibilities && (
                    <div className="pmm-section">
                      <h4 className="pmm-section-title">Responsibilities</h4>
                      <div className="pmm-description-body">
                        <PlainTextContent text={displayResponsibilities} />
                      </div>
                    </div>
                  )}

                  {/* 6. Requirements & Qualifications */}
                  {displayQualifications && (
                    <div className="pmm-section">
                      <h4 className="pmm-section-title">Requirements & Qualifications</h4>
                      <div className="pmm-description-body">
                        <PlainTextContent text={displayQualifications} />
                      </div>
                    </div>
                  )}

                  {/* 6. Screening Questions */}
                  {jobDetail.screeningQuestions && jobDetail.screeningQuestions.length > 0 && (
                    <div className="pmm-section">
                      <h4 className="pmm-section-title">
                        Screening Questions
                        <span className="pmm-section-count">{jobDetail.screeningQuestions.length}</span>
                      </h4>
                      <div className="pmm-questions-list">
                        {jobDetail.screeningQuestions.map((q, idx) => (
                          <div key={q._id || idx} className="pmm-question-item">
                            <span className="pmm-q-num">Q{idx + 1}</span>
                            <div className="pmm-q-details">
                              <p className="pmm-q-text">{q.question}</p>
                              <div className="pmm-q-meta">
                                <span className="pmm-q-type">{q.type}</span>
                                {q.required && <span className="pmm-q-req">Required</span>}
                              </div>
                              {q.options && q.options.length > 0 && (
                                <div className="pmm-q-options">
                                  {q.options.map((opt, i) => (
                                    <span key={i} className="pmm-q-opt-badge">{opt}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ──── MIVITES TAB ──── */}
          {activeTab === 'mivites' && (
            <div className="pmm-tab-content">
              {loadingNvites ? (
                <div className="pmm-loading">Loading recipients...</div>
              ) : nviteError ? (
                <div className="pmm-error">{nviteError}</div>
              ) : nviteRecipients.length === 0 ? (
                <div className="pmm-empty">
                  <FiUsers size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <p>No NVites have been sent for this job yet.</p>
                </div>
              ) : (
                <div className="pmm-recipients-list">
                  <div className="pmm-recipients-header">
                    <span>{nviteRecipients.length} candidate{nviteRecipients.length !== 1 ? 's' : ''} received this NVite</span>
                  </div>
                  {nviteRecipients.map((rec, idx) => {
                    // avatar is an object { url, publicId }
                    const avatarUrl = rec.avatar?.url || null;
                    const initials = rec.candidateName?.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                    const profileUrl = `/candidates/${rec.userId}`;

                    return (
                      <div key={rec.userId || idx} className="pmm-recipient-card">

                        {/* Avatar */}
                        <div className="pmm-rec-avatar">
                          {avatarUrl
                            ? <img src={avatarUrl} alt={rec.candidateName} />
                            : <span>{initials}</span>
                          }
                        </div>

                        {/* Info */}
                        <div className="pmm-rec-info">
                          {/* Name – clickable, opens profile in new tab */}
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pmm-rec-name pmm-rec-name-link"
                            title="View full profile"
                          >
                            {rec.candidateName}
                          </a>

                          {/* Designation / Experience / Location – only if present */}
                          {(rec.designation || rec.experience || rec.location) && (
                            <div className="pmm-rec-sub">
                              {rec.designation && <span>{rec.designation}</span>}
                              {rec.experience && <span>{rec.designation ? ' • ' : ''}{rec.experience}</span>}
                              {rec.location && <span>{(rec.designation || rec.experience) ? ' • ' : ''}{rec.location}</span>}
                            </div>
                          )}

                          {/* Email + Phone */}
                          <div className="pmm-rec-contact">
                            {rec.candidateEmail && (
                              <a href={`mailto:${rec.candidateEmail}`} className="pmm-rec-contact-link">
                                {rec.candidateEmail}
                              </a>
                            )}
                            {rec.phone && (
                              <a href={`tel:${rec.phone}`} className="pmm-rec-contact-link">
                                {rec.candidateEmail ? ' • ' : ''}{rec.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Status + Resume */}
                        <div className="pmm-rec-status">
                          <span className="pmm-nvite-status-badge">{rec.status}</span>
                          {rec.resumeUrl && (
                            <a
                              href={rec.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pmm-resume-link"
                            >
                              View Resume
                            </a>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
