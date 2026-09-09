import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  FiCheck, FiX, FiMail, FiShare2, FiDownload, FiTrash2, FiPhone,
  FiMessageSquare, FiSmartphone, FiCopy, FiChevronDown, FiChevronUp,
  FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiUser, FiCalendar,
  FiCheckCircle, FiExternalLink, FiArrowRight, FiGlobe, FiEye
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin, FaGithub } from 'react-icons/fa';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import employerJobService from '../../../../services/employerJobService';
import './CandidateFullProfile.css';

const CALL_STATUS_OPTIONS = [
  'Called',
  'Messaged',
  'Not picked',
  'Not reachable',
];

export default function CandidateFullProfile() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const queryAppId = searchParams.get('applicationId') || '';
  const queryJobId = searchParams.get('jobId') || '';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status & interactive state
  const [currentStatus, setCurrentStatus] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const dropdownRef = useRef(null);

  // Close status dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    employerJobService
      .getCandidateFullProfile(candidateId, {
        applicationId: queryAppId,
        jobId: queryJobId,
      })
      .then((data) => {
        setProfile(data);
        setCurrentStatus(data?.status || 'APPLIED');
        setCallStatus(data?.callStatus || '');
        setComments(data?.comments || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load candidate profile');
        setLoading(false);
      });
  }, [candidateId, queryAppId, queryJobId]);

  // Status updates
  const handleUpdateStatus = async (status) => {
    const activeJobId = profile?.jobId || queryJobId;
    const activeAppId = profile?.applicationId || queryAppId;
    setCurrentStatus(status);

    if (activeJobId && activeAppId) {
      try {
        await employerJobService.updateCandidateJobStatus(activeJobId, activeAppId, status);
      } catch (_) {
        // Fallback gracefully
      }
    }
    const label = status === 'SHORTLISTED' ? 'Shortlisted' : status === 'MAYBE' ? 'marked as Maybe' : 'Rejected';
    showToast(`Candidate ${label}`);
  };

  // Update Call / Outreach Status matching parent page
  const handleSelectCallStatus = async (statusOption) => {
    setStatusDropdownOpen(false);
    const activeJobId = profile?.jobId || queryJobId;
    const activeAppId = profile?.applicationId || queryAppId;
    setCallStatus(statusOption);

    if (activeJobId && activeAppId) {
      try {
        await employerJobService.updateCandidateJobStatus(activeJobId, activeAppId, null, statusOption);
      } catch (err) {
        showToast(err?.message || 'Failed to update status.');
        return;
      }
    }
    showToast(`Status updated to "${statusOption}"`);
  };

  // Reveal contact & copy to clipboard matching parent page
  const handleRevealContact = () => {
    setPhoneRevealed(true);
    const phone = profile?.phone || '';
    if (phone) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phone);
        showToast(`Phone: ${phone} (Copied to clipboard!)`);
      } else {
        showToast(`Phone: ${phone}`);
      }
    } else {
      showToast('No phone number available');
    }
  };

  // Copy phone number on click
  const handleCopyPhone = (e) => {
    if (e) e.stopPropagation();
    const cleanNumber = profile?.phone || '';
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

  // Call from system app (dialer) matching parent page
  const handleCallFromApp = () => {
    const rawPhone = profile?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      showToast(`Opening default calling app for ${cleanPhone}...`);
      window.location.href = `tel:${cleanPhone}`;
    } else {
      showToast('No phone number available for this candidate.');
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    const activeJobId = profile?.jobId || queryJobId;
    const activeAppId = profile?.applicationId || queryAppId;
    setSubmittingComment(true);

    const tempComment = {
      text,
      authorName: 'Recruiter',
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [tempComment, ...prev]);
    setNewComment('');

    if (activeJobId && activeAppId) {
      try {
        await employerJobService.addCandidateComment(activeJobId, activeAppId, text);
      } catch (_) {
        // Retain local comment
      }
    }
    setSubmittingComment(false);
    showToast('Comment added');
  };

  // Forward profile (copy link)
  const handleForward = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Profile link copied to clipboard!');
  };

  // Email candidate
  const handleEmail = () => {
    if (profile?.email) {
      window.open(`mailto:${profile.email}`, '_blank');
    } else {
      showToast('No email address available for candidate');
    }
  };

  // WhatsApp candidate
  const handleWhatsapp = () => {
    const rawPhone = profile?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone) {
      const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${waNumber}`, '_blank');
    } else {
      showToast('No phone number available for WhatsApp');
    }
  };

  // Download resume
  const handleDownloadResume = () => {
    if (profile?.resumeUrl) {
      window.open(profile.resumeUrl, '_blank');
    } else {
      showToast('No resume file attached');
    }
  };

  // Smooth scroll jump
  const handleJumpTo = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="cfp-loading-state">
          <div className="cfp-spinner" />
          <p>Loading candidate profile…</p>
        </div>
      </EmployerLayout>
    );
  }

  if (error || !profile) {
    return (
      <EmployerLayout>
        <div className="cfp-error-state">
          <FiUser size={48} />
          <h2>Profile not found</h2>
          <p>{error || 'This candidate profile could not be loaded.'}</p>
        </div>
      </EmployerLayout>
    );
  }

  const initials = (profile.name || 'C')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formatSalary = (sal) => {
    if (!sal) return null;
    const s = String(sal).trim();
    if (!s) return null;
    if (!s.startsWith('₹')) return `₹ ${s} lac(s)`;
    return s;
  };

  const hasSummary = Boolean(profile.summary || profile.bio);
  const hasExperience = Boolean(profile.workExperiences?.length > 0);
  const hasEducation = Boolean(profile.educations?.length > 0);
  const hasItSkills = Boolean(profile.itSkillsList?.length > 0);
  const hasLanguages = Boolean(profile.languages?.length > 0);
  const hasOtherDetails = Boolean(
    profile.dateOfBirth ||
    profile.gender ||
    profile.maritalStatus ||
    profile.hometown ||
    profile.currentCity ||
    profile.desiredJobType ||
    profile.employmentStatus ||
    profile.usWorkStatus ||
    profile.countries ||
    profile.category ||
    profile.physicallyChallenged
  );

  const navLinks = [
    hasSummary && { id: 'summary', label: 'Summary' },
    hasExperience && { id: 'experience', label: 'Work Experience' },
    hasEducation && { id: 'education', label: 'Education' },
    hasItSkills && { id: 'it-skills', label: 'IT skills' },
    hasLanguages && { id: 'languages', label: 'Languages' },
    hasOtherDetails && { id: 'other-details', label: 'Other Details' },
  ].filter(Boolean);

  return (
    <EmployerLayout>
      <div className="cfp-page-container">

        {/* ─── Toast Feedback ─── */}
        {toast && <div className="cfp-toast-notification">{toast}</div>}

        {/* ─── 1. Top Action Toolbar ─── */}
        <div className="cfp-top-toolbar">
          <div className="cfp-toolbar-group cfp-toolbar-status-group">
            <button
              type="button"
              className={`cfp-btn-pill cfp-btn-shortlist ${currentStatus === 'SHORTLISTED' ? 'is-active' : ''}`}
              onClick={() => handleUpdateStatus('SHORTLISTED')}
            >
              <FiCheckCircle size={15} className="cfp-icon-shortlist" />
              <span>Shortlist</span>
            </button>

            <button
              type="button"
              className={`cfp-btn-pill cfp-btn-maybe ${currentStatus === 'MAYBE' ? 'is-active' : ''}`}
              onClick={() => handleUpdateStatus('MAYBE')}
            >
              <FiMessageSquare size={14} className="cfp-icon-maybe" />
              <span>Maybe</span>
            </button>

            <button
              type="button"
              className={`cfp-btn-pill cfp-btn-reject ${currentStatus === 'REJECTED' ? 'is-active' : ''}`}
              onClick={() => handleUpdateStatus('REJECTED')}
            >
              <FiX size={15} className="cfp-icon-reject" />
              <span>Reject</span>
            </button>
          </div>

          <div className="cfp-toolbar-sep" />

          <div className="cfp-toolbar-group cfp-toolbar-actions-group">
            <button type="button" className="cfp-btn-action" onClick={handleEmail} title="Send email to candidate">
              <FiMail size={15} />
              <span>Email</span>
            </button>

            <button type="button" className="cfp-btn-action" onClick={handleForward} title="Copy profile share link">
              <FiShare2 size={15} />
              <span>Forward</span>
            </button>

            <button type="button" className="cfp-btn-action" onClick={handleDownloadResume} title="Download resume">
              <FiDownload size={15} />
              <span>Download</span>
            </button>

            <button
              type="button"
              className="cfp-btn-action"
              onClick={() => showToast('Candidate application removed')}
              title="Delete application"
            >
              <FiTrash2 size={15} />
              <span>Delete</span>
            </button>

            <button type="button" className="cfp-btn-action cfp-btn-whatsapp" onClick={handleWhatsapp} title="Contact on WhatsApp">
              <FaWhatsapp size={16} color="#25D366" />
              <span>Whatsapp</span>
            </button>
          </div>
        </div>

        {/* ─── 2. Comment Box ─── */}
        <div className="cfp-comment-box">
          <div className="cfp-comment-avatar">
            <FiUser size={18} />
          </div>
          <form className="cfp-comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              placeholder="Type your comment here"
              className="cfp-comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            {newComment.trim() && (
              <button type="submit" className="cfp-comment-post-btn" disabled={submittingComment}>
                Post
              </button>
            )}
          </form>
        </div>

        {/* Render comments list if any exist */}
        {comments.length > 0 && (
          <div className="cfp-comments-stream">
            {comments.map((c, i) => (
              <div key={i} className="cfp-comment-item">
                <span className="cfp-comment-author">{c.authorName || 'Recruiter'}:</span>
                <span className="cfp-comment-text">{c.text}</span>
                {c.createdAt && (
                  <span className="cfp-comment-time">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── 3. Candidate Header Card ─── */}
        <div className="cfp-card cfp-header-card">
          <div className="cfp-header-content">
            <div className="cfp-header-info">
              <h1 className="cfp-candidate-title">{profile.name}</h1>
              {(profile.headline || profile.role || profile.currentTitle || profile.resumeUrl) && (
                <div className="cfp-headline-line">
                  {(profile.headline || profile.role || profile.currentTitle) && (
                    <span className="cfp-headline-text">
                      {profile.headline || profile.role || profile.currentTitle}
                    </span>
                  )}
                  {(profile.headline || profile.role || profile.currentTitle) && profile.resumeUrl && (
                    <span className="cfp-dot-sep">|</span>
                  )}
                  {profile.resumeUrl && (
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cfp-view-resume-textlink"
                    >
                      View Resume
                    </a>
                  )}
                </div>
              )}

              {/* Action Pills: Contact | Status + Call from app */}
              <div className="cfp-header-pills-row">
                <div className="cfp-contact-status-pill" ref={dropdownRef}>
                  {phoneRevealed ? (
                    <span className="cfp-phone-revealed-text" onClick={handleCopyPhone} title="Click to copy number">
                      <FiCopy size={13} />
                      <span>{profile.phone || 'No phone'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="cfp-pill-trigger-btn"
                      onClick={handleRevealContact}
                      title="View and copy phone number"
                    >
                      <FiPhone size={13} />
                      <span>Contact</span>
                    </button>
                  )}

                  <span className="cfp-pill-sep">|</span>

                  <button
                    type="button"
                    className={`cfp-pill-trigger-btn ${callStatus ? 'has-status' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownOpen((prev) => !prev);
                    }}
                    title="Change status"
                  >
                    <span>{callStatus || 'Status'}</span>
                    <FiChevronDown size={13} />
                  </button>

                  {statusDropdownOpen && (
                    <div className="cfp-status-dropdown-menu">
                      {CALL_STATUS_OPTIONS.map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`cfp-dropdown-opt ${callStatus === st ? 'is-selected' : ''}`}
                          onClick={() => handleSelectCallStatus(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="cfp-call-app-btn"
                  onClick={handleCallFromApp}
                  title={`Call ${profile.name} via system phone app`}
                >
                  <FiSmartphone size={14} />
                  <span>Call from app</span>
                  <FiArrowRight size={13} />
                </button>

                {profile.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cfp-header-resume-btn"
                    title="Open candidate resume in new tab"
                  >
                    <FiEye size={14} />
                    <span>View Resume</span>
                    <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Avatar on Right */}
            <div className="cfp-header-avatar-col">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="cfp-avatar-img" />
              ) : (
                <div className="cfp-avatar-img cfp-avatar-placeholder">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 4. Candidate Details Card ─── */}
        <div className="cfp-card cfp-candidate-details-card">
          <h2 className="cfp-card-heading">Candidate Details</h2>
          <div className="cfp-details-grid">
            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Current Location:</span>
              <span className="cfp-detail-val">{profile.location || profile.currentCity || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Experience:</span>
              <span className="cfp-detail-val">{profile.totalExperience || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Preferred Location:</span>
              <span className="cfp-detail-val">
                {profile.preferredLocations?.length > 0
                  ? profile.preferredLocations.join(', ')
                  : '—'}
              </span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Current Salary:</span>
              <span className="cfp-detail-val">{formatSalary(profile.currentSalary) || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Department:</span>
              <span className="cfp-detail-val">{profile.department || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Expected Salary:</span>
              <span className="cfp-detail-val">{formatSalary(profile.expectedSalary) || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Role:</span>
              <span className="cfp-detail-val">{profile.role || profile.currentTitle || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Highest Degree:</span>
              <span className="cfp-detail-val">{profile.highestDegree || profile.education || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Industry:</span>
              <span className="cfp-detail-val">{profile.industry || '—'}</span>
            </div>

            <div className="cfp-detail-item">
              <span className="cfp-detail-label">Available to join in:</span>
              <span className="cfp-detail-val">{profile.availableToJoin || profile.noticePeriod || '—'}</span>
            </div>

            <div className="cfp-detail-item cfp-detail-item--full">
              <span className="cfp-detail-label">Key Skills:</span>
              <span className="cfp-detail-val cfp-detail-val--skills">
                {profile.keySkills ||
                  (profile.skills?.length > 0 ? profile.skills.join(', ') : '—')}
              </span>
            </div>
          </div>

          {profile.appliedAtFormatted && (
            <div className="cfp-app-date-row">
              <span>Application Date : {profile.appliedAtFormatted}</span>
            </div>
          )}
        </div>

        {/* ─── 5. "Jump to" Navigation Bar ─── */}
        {navLinks.length > 0 && (
          <div className="cfp-jumpto-bar">
            <span className="cfp-jumpto-label">Jump to</span>
            {navLinks.map((item, idx) => (
              <Fragment key={item.id}>
                {idx > 0 && <span className="cfp-jumpto-sep">|</span>}
                <a href={`#${item.id}`} onClick={(e) => handleJumpTo(e, item.id)}>
                  {item.label}
                </a>
              </Fragment>
            ))}
          </div>
        )}

        {/* ─── 6. Summary Card ─── */}
        {hasSummary && (
          <div id="summary" className="cfp-card">
            <h2 className="cfp-card-heading">Summary</h2>
            <div className="cfp-card-body">
              <p className="cfp-summary-para">{profile.summary || profile.bio}</p>
            </div>
          </div>
        )}

        {/* ─── 7. Work Experience Card ─── */}
        {hasExperience && (
          <div id="experience" className="cfp-card">
            <h2 className="cfp-card-heading">Work Experience</h2>
            <div className="cfp-card-body">
              {profile.workExperiences.map((exp, i) => (
                <div key={exp.id || i} className="cfp-exp-block">
                  <h3 className="cfp-exp-company-title">{exp.company || '—'}</h3>
                  <div className="cfp-exp-role-meta">
                    <span className="cfp-exp-role">{exp.title || '—'}</span>
                    {(exp.startDate || exp.endDate) && (
                      <span className="cfp-exp-dates">
                        {' '}| From {exp.startDate || '—'} to {exp.isCurrent ? 'Present' : (exp.endDate || '—')}
                      </span>
                    )}
                  </div>
                  {exp.description && <p className="cfp-exp-description">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 8. Education Card ─── */}
        {hasEducation && (
          <div id="education" className="cfp-card">
            <h2 className="cfp-card-heading">Education</h2>
            <div className="cfp-card-body">
              {profile.educations.map((edu, i) => (
                <div key={edu.id || i} className="cfp-edu-block">
                  {edu.degree && (
                    <div className="cfp-edu-degree">
                      {edu.degree}{edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}
                    </div>
                  )}
                  <div className="cfp-edu-meta">
                    {[edu.institution, edu.passingYear ? `in ${edu.passingYear}` : null].filter(Boolean).join(' | ') || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 9. IT Skills Card ─── */}
        {hasItSkills && (
          <div id="it-skills" className="cfp-card">
            <h2 className="cfp-card-heading">IT Skills</h2>
            <div className="cfp-card-table-wrapper">
              <table className="cfp-data-table">
                <thead>
                  <tr>
                    <th>Skill Name</th>
                    <th>Version</th>
                    <th>Last Used</th>
                    <th>Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.itSkillsList.map((skill, i) => (
                    <tr key={i}>
                      <td className="cfp-table-cell-bold">{skill.skillName || '—'}</td>
                      <td>{skill.version || '—'}</td>
                      <td>{skill.lastUsed || '—'}</td>
                      <td>{skill.experience || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 10. Language Known Card ─── */}
        {hasLanguages && (
          <div id="languages" className="cfp-card">
            <h2 className="cfp-card-heading">Language Known</h2>
            <div className="cfp-card-table-wrapper">
              <table className="cfp-data-table">
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Proficiency</th>
                    <th className="cfp-table-center">Read</th>
                    <th className="cfp-table-center">Write</th>
                    <th className="cfp-table-center">Speak</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.languages.map((lang, i) => (
                    <tr key={i}>
                      <td className="cfp-table-cell-bold">{lang.name || '—'}</td>
                      <td>{lang.proficiency || '—'}</td>
                      <td className="cfp-table-center">
                        {lang.read === true ? <span className="cfp-icon-check">✓</span> : lang.read === false ? <span className="cfp-icon-cross">✕</span> : '—'}
                      </td>
                      <td className="cfp-table-center">
                        {lang.write === true ? <span className="cfp-icon-check">✓</span> : lang.write === false ? <span className="cfp-icon-cross">✕</span> : '—'}
                      </td>
                      <td className="cfp-table-center">
                        {lang.speak === true ? <span className="cfp-icon-check">✓</span> : lang.speak === false ? <span className="cfp-icon-cross">✕</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 11. Other Details Card ─── */}
        {hasOtherDetails && (
          <div id="other-details" className="cfp-card">
            <h2 className="cfp-card-heading">Other Details</h2>
            <div className="cfp-card-body cfp-other-details-grid">
              {/* Left Column */}
              <div className="cfp-other-details-col">
                {(profile.dateOfBirth || profile.gender || profile.maritalStatus) && (
                  <div className="cfp-subsection">
                    <h3 className="cfp-subsection-title">Personal Detail</h3>
                    {profile.dateOfBirth && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Date of Birth:</span>
                        <span className="cfp-info-val">{profile.dateOfBirth}</span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Gender:</span>
                        <span className="cfp-info-val">{profile.gender}</span>
                      </div>
                    )}
                    {profile.maritalStatus && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Marital Status:</span>
                        <span className="cfp-info-val">{profile.maritalStatus}</span>
                      </div>
                    )}
                  </div>
                )}

                {(profile.hometown || profile.currentCity) && (
                  <div className="cfp-subsection">
                    <h3 className="cfp-subsection-title">Address</h3>
                    <div className="cfp-info-pair">
                      <span className="cfp-info-lbl">Hometown:</span>
                      <span className="cfp-info-val">{profile.hometown || profile.currentCity}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="cfp-other-details-col">
                {(profile.desiredJobType || profile.employmentStatus) && (
                  <div className="cfp-subsection">
                    <h3 className="cfp-subsection-title">Desired Job Details</h3>
                    {profile.desiredJobType && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Job Type:</span>
                        <span className="cfp-info-val">{profile.desiredJobType}</span>
                      </div>
                    )}
                    {profile.employmentStatus && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Employment Status:</span>
                        <span className="cfp-info-val">{profile.employmentStatus}</span>
                      </div>
                    )}
                  </div>
                )}

                {(profile.usWorkStatus || profile.countries) && (
                  <div className="cfp-subsection">
                    <h3 className="cfp-subsection-title">Work Authorization</h3>
                    {profile.usWorkStatus && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">US Work Status:</span>
                        <span className="cfp-info-val">{profile.usWorkStatus}</span>
                      </div>
                    )}
                    {profile.countries && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Countries:</span>
                        <span className="cfp-info-val">{profile.countries}</span>
                      </div>
                    )}
                  </div>
                )}

                {(profile.category || profile.physicallyChallenged) && (
                  <div className="cfp-subsection">
                    <h3 className="cfp-subsection-title">Affirmative Action</h3>
                    {profile.category && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Category:</span>
                        <span className="cfp-info-val">{profile.category}</span>
                      </div>
                    )}
                    {profile.physicallyChallenged && (
                      <div className="cfp-info-pair">
                        <span className="cfp-info-lbl">Physically Challenged:</span>
                        <span className="cfp-info-val">{profile.physicallyChallenged}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </EmployerLayout>
  );
}
