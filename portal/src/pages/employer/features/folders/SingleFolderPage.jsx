import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFolder, FiEdit2, FiTrash2, FiShare2, FiSearch, FiX, FiArrowLeft, FiUsers, FiBriefcase, FiMapPin, FiPhone, FiChevronDown, FiSmartphone, FiArrowRight, FiMail, FiSend, FiMessageSquare, FiCheck, FiUser, FiCopy, FiClock, FiBell, FiPlay } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useFolder, useDeleteFolder, useUpdateFolder, useRemoveCandidateFromFolder, useBulkRemoveCandidates, useUpdateFolderCandidate, useAddCandidateComment, useDeleteCandidateComment } from '../../../../hooks/useFolderQueries';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';
import CreateRequirementModal from '../../../../components/employer/CreateRequirementModal';
import RequirementAlertModal from '../../../../components/employer/RequirementAlertModal';
import FolderSelectorModal from '../../../../components/employer/FolderSelectorModal';
import './SingleFolderPage.css';
import '../jobs/JobResponsesDetail.css';
import EmployerHeader from '../../../../components/employer/EmployerHeader';

export default function SingleFolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, refetch } = useFolder(folderId);

  const folder = data?.folder || null;
  const candidates = data?.candidates || [];

  const [search, setSearch] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveCandidateId, setMoveCandidateId] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'all';
  });
  const [localStatuses, setLocalStatuses] = useState({});
  const [localTags, setLocalTags] = useState({});
  const [editRequirementOpen, setEditRequirementOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // Additional state for JRD-style cards
  const [revealedContacts, setRevealedContacts] = useState({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [openCommentCandidateId, setOpenCommentCandidateId] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const isRequirement = folder?.folderType === 'REQUIREMENT' || Boolean(folder?.criteria);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleRevealContact = (candidate) => {
    setRevealedContacts((prev) => ({ ...prev, [candidate.userId || candidate.id]: true }));
  };
  const handleCopyPhone = (e, phone) => {
    e.stopPropagation();
    if (phone) navigator.clipboard?.writeText(phone);
    showToast(`Copied ${phone || 'number'} to clipboard!`);
  };
  const handleCallFromApp = (candidate) => {
    const rawPhone = candidate.phone || '';
    if (rawPhone) window.location.href = `tel:${rawPhone.replace(/[^0-9+]/g, '')}`;
  };
  const handleOpenEmail = (candidate) => {
    if (candidate.email) window.location.href = `mailto:${candidate.email}`;
  };
  const handleOpenWhatsApp = (candidate) => {
    const digits = (candidate.phone || '').replace(/[^0-9]/g, '');
    if (digits) window.open(`https://wa.me/${digits.length === 10 ? '91' + digits : digits}`, '_blank');
  };
  const updateFolderCandidate = useUpdateFolderCandidate();
  const addCandidateComment = useAddCandidateComment();
  const deleteCandidateComment = useDeleteCandidateComment();

  const handleSelectCallStatus = async (candidate, opt) => {
    setLocalStatuses(prev => ({ ...prev, [candidate.userId || candidate.id]: opt }));
    setOpenStatusDropdownId(null);
    try {
      await updateFolderCandidate.mutateAsync({
        folderId,
        candidateId: candidate.userId || candidate.id,
        data: { callStatus: opt }
      });
      showToast(`Status changed to "${opt}".`);
    } catch {
      showToast('Failed to update status.');
    }
  };

  const getCallStatus = (candidate) => {
    return localStatuses[candidate.userId || candidate.id] || candidate.callStatus || '';
  };

  const getCandidateTag = useCallback((candidate) => {
    const cid = candidate.userId || candidate.id;
    return localTags[cid] || candidate.tag || 'prospect';
  }, [localTags]);

  const handleSelectTag = async (candidate, newTag) => {
    const cid = candidate.userId || candidate.id;
    setLocalTags(prev => ({ ...prev, [cid]: newTag }));
    try {
      await updateFolderCandidate.mutateAsync({
        folderId,
        candidateId: cid,
        data: { tag: newTag }
      });
      showToast(`Candidate marked as "${newTag.charAt(0).toUpperCase() + newTag.slice(1)}".`);
    } catch {
      showToast('Failed to update candidate stage.');
    }
  };

  const handleRunRequirementSearch = () => {
    if (!folder) return;
    const criteria = folder?.criteria || {};
    const skills = criteria.skills || folder?.skills || [];
    const jobTitle = folder.jobTitle || criteria.jobTitles?.[0] || folder.name || '';
    
    const savedFilters = {
      keyword: jobTitle,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      designation: folder.jobTitle || criteria.jobTitles?.[0] || '',
      minExperience: criteria.experienceMin !== undefined && criteria.experienceMin !== null && criteria.experienceMin !== '' ? String(criteria.experienceMin) : '',
      maxExperience: criteria.experienceMax !== undefined && criteria.experienceMax !== null && criteria.experienceMax !== '' ? String(criteria.experienceMax) : '',
      currentSalaryMin: criteria.salaryMin !== undefined && criteria.salaryMin !== null && criteria.salaryMin !== '' ? String(criteria.salaryMin) : '',
      currentSalaryMax: criteria.salaryMax !== undefined && criteria.salaryMax !== null && criteria.salaryMax !== '' ? String(criteria.salaryMax) : '',
      currentCity: Array.isArray(criteria.locations) ? criteria.locations : (criteria.locations ? [criteria.locations] : (folder?.locations || [])),
      noticePeriod: Array.isArray(criteria.noticePeriod) ? criteria.noticePeriod : (criteria.noticePeriod ? [criteria.noticePeriod] : []),
      ug: criteria.education || '',
      industry: criteria.industry || '',
      role: criteria.jobTitles?.[0] || folder.jobTitle || ''
    };

    navigate('/resume-search', {
      state: {
        savedFilters,
        searchName: folder.name,
        requirementId: folder._id
      }
    });
  };

  const handleAddComment = async (candidate) => {
    const cid = candidate.userId || candidate.id;
    const text = (commentTexts[cid] || '').trim();
    if (!text) return;

    setIsSubmittingComment(true);
    try {
      await addCandidateComment.mutateAsync({
        folderId,
        candidateId: cid,
        text
      });
      setCommentTexts(prev => ({ ...prev, [cid]: '' }));
      showToast('Comment saved.');
      refetch();
    } catch (err) {
      console.error('Failed to save comment:', err);
      showToast(err?.response?.data?.message || err?.message || 'Failed to save comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (candidate, commentId) => {
    const cid = candidate.userId || candidate.id;
    try {
      await deleteCandidateComment.mutateAsync({
        folderId,
        candidateId: cid,
        commentId
      });
      showToast('Comment removed.');
      refetch();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      showToast('Failed to delete comment.');
    }
  };

  const deleteFolder = useDeleteFolder();
  const removeCandidate = useRemoveCandidateFromFolder();
  const bulkRemove = useBulkRemoveCandidates();
  const updateFolder = useUpdateFolder();

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase().trim();
    return candidates.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.currentTitle || '').toLowerCase().includes(q) ||
      (c.currentCompany || '').toLowerCase().includes(q) ||
      (c.currentCity || '').toLowerCase().includes(q) ||
      (c.skills || []).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [candidates, search]);

  const displayCandidates = useMemo(() => {
    if (activeTab === 'contacted') {
      return filteredCandidates.filter((c) => getCallStatus(c) === 'Called');
    }
    if (activeTab === 'prospect') {
      return filteredCandidates.filter((c) => getCandidateTag(c) === 'prospect');
    }
    if (activeTab === 'shortlisted') {
      return filteredCandidates.filter((c) => getCandidateTag(c) === 'shortlisted');
    }
    if (activeTab === 'rejected') {
      return filteredCandidates.filter((c) => getCandidateTag(c) === 'rejected');
    }
    return filteredCandidates;
  }, [filteredCandidates, activeTab, localStatuses, localTags, getCandidateTag]);

  const handleDeleteFolder = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFolder = async () => {
    try {
      await deleteFolder.mutateAsync(folderId);
      navigate('/employer-dashboard/folders');
    } catch {
      // silent
    }
  };

  const handleRemoveCandidate = async (candidate) => {
    try {
      await removeCandidate.mutateAsync({ folderId, candidateId: candidate.userId || candidate.id });
      refetch();
    } catch {
      // silent
    }
  };

  const handleBulkRemove = () => {
    if (selectedIds.size === 0) return;
    setShowRemoveConfirm(true);
  };

  const confirmBulkRemove = async () => {
    const ids = [...selectedIds];
    try {
      await bulkRemove.mutateAsync({ folderId, candidateIds: ids });
      setSelectedIds(new Set());
      setShowRemoveConfirm(false);
      refetch();
    } catch {
      // silent
    }
  };

  const handleRename = async (data) => {
    try {
      await updateFolder.mutateAsync({ id: folderId, ...data });
      setShowRename(false);
      refetch();
    } catch {
      // silent
    }
  };

  const toggleSelect = useCallback((candidate) => {
    const id = candidate.userId || candidate.id;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.userId || c.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="sfp-root">
        <div className="sfp-container">
          <div style={{ height: 20, width: 300, background: '#f1f5f9', borderRadius: 6, marginBottom: 20 }} />
          <div style={{ height: 40, width: 200, background: '#f1f5f9', borderRadius: 8, marginBottom: 24 }} />
          <div style={{ height: 80, background: '#f1f5f9', borderRadius: 14, marginBottom: 20 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 200, background: '#f1f5f9', borderRadius: 14, marginBottom: 16, animation: 'sfpPulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="sfp-root">
        <div className="sfp-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Folder not found</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 8 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#002366', fontWeight: 700, cursor: 'pointer', fontSize: 'inherit' }}>
              Back to Folders
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sfp-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#1e293b',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999
        }}>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <FiX size={15} />
          </button>
        </div>
      )}

      <EmployerHeader />
      <div className="sfp-container">
        <EmployerBreadcrumb items={[
          { label: 'Employer Dashboard', path: '/employer-dashboard' },
          {
            label: isRequirement ? 'Resdex Requirements' : 'Folders',
            path: isRequirement ? '/resdex-requirements' : '/employer-dashboard/folders'
          },
          { label: folder.name },
        ]} />

        <div
          className="sfp-back"
          onClick={() => navigate(isRequirement ? '/resdex-requirements' : '/employer-dashboard/folders')}
          style={{ cursor: 'pointer' }}
        >
          <FiArrowLeft size={14} /> Back to {isRequirement ? 'Resdex Requirements' : 'Folders'}
        </div>

        {/* Top Header Card */}
        <div className="sfp-header">
          <div className="sfp-header-left">
            <div className="sfp-header-icon" style={{ background: folder.color || '#002366' }}>
              {isRequirement ? <FiBriefcase size={24} /> : <FiFolder size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="sfp-title">{folder.name}</h1>
                {isRequirement && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 14,
                    background: folder.status === 'closed' ? '#f1f5f9' : '#ecfdf5',
                    color: folder.status === 'closed' ? '#64748b' : '#047857',
                    border: `1px solid ${folder.status === 'closed' ? '#cbd5e1' : '#a7f3d0'}`,
                    textTransform: 'uppercase'
                  }}>
                    {folder.status === 'closed' ? 'Closed' : 'Active / Open'}
                  </span>
                )}
              </div>
              {folder.description && <p className="sfp-desc">{folder.description}</p>}
              <div className="sfp-stats">
                <span><FiUsers size={13} /> {folder.candidateCount || candidates.length} candidates</span>
                <span>Created {new Date(folder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>Updated {new Date(folder.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
          <div className="sfp-header-actions">
            {isRequirement ? (
              <button
                className="sfp-action-btn"
                onClick={() => setEditRequirementOpen(true)}
                title="Edit Requirement Criteria"
              >
                <FiEdit2 size={15} />
              </button>
            ) : (
              <button className="sfp-action-btn" onClick={() => setShowRename(true)} title="Rename"><FiEdit2 size={15} /></button>
            )}
            <button className="sfp-action-btn" onClick={handleDeleteFolder} title="Delete"><FiTrash2 size={15} /></button>
            <button className="sfp-action-btn" onClick={() => navigator.clipboard?.writeText?.(window.location.href)} title="Share link"><FiShare2 size={15} /></button>
          </div>
        </div>

        {/* Resdex Requirement Blueprint Banner*/}
        {isRequirement && (
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1.5px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Target Role: {folder.jobTitle || folder.criteria?.jobTitle || folder.name}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const next = folder.status === 'closed' ? 'open' : 'closed';
                    try {
                      await updateFolder.mutateAsync({ id: folderId, status: next });
                      refetch();
                      showToast(`Requirement marked as ${next.toUpperCase()}`);
                    } catch {
                      showToast('Failed to change status');
                    }
                  }}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {folder.status === 'closed' ? 'Reopen Opening' : 'Close Opening'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setAlertModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Configure candidate match alerts"
                >
                  <FiBell size={13} />
                  <span>Alerts: {folder.alerts?.frequency || 'Daily'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunRequirementSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#002366',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 35, 102, 0.22)'
                  }}
                  title="Run saved search criteria in Resdex"
                >
                  <FiPlay size={13} />
                  <span>Run Search in Resdex</span>
                </button>
              </div>
            </div>

            {/* Criteria Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
              {(folder.criteria?.skills || folder.skills || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Key Skills:</span>
                  {(folder.criteria?.skills || folder.skills || []).map(s => (
                    <span key={s} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {(folder.criteria?.experienceMin !== undefined || folder.criteria?.experienceMax !== undefined) && (
                <span style={{ marginLeft: 6 }}>
                  💼 {folder.criteria?.experienceMin || 0} - {folder.criteria?.experienceMax || 15} Yrs
                </span>
              )}
              {(folder.criteria?.salaryMin !== undefined || folder.criteria?.salaryMax !== undefined) && (
                <span style={{ marginLeft: 6 }}>
                  💰 ₹{folder.criteria?.salaryMin || 0} - {folder.criteria?.salaryMax || 'Any'} LPA
                </span>
              )}
              {(folder.criteria?.locations || folder.locations || []).length > 0 && (
                <span style={{ marginLeft: 6 }}>
                  📍 {(folder.criteria?.locations || folder.locations || []).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pipeline Tabs */}
        <div className="sfp-tabs" style={{ display: 'flex', gap: 20, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: 'none', border: 'none', fontSize: '0.95rem',
              fontWeight: activeTab === 'all' ? 700 : 500,
              color: activeTab === 'all' ? '#002366' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'all' ? '2.5px solid #002366' : '2.5px solid transparent',
              paddingBottom: 10, transition: 'all 0.15s ease'
            }}
          >
            All Candidates ({filteredCandidates.length})
          </button>

          {isRequirement && (
            <>
              <button
                onClick={() => setActiveTab('prospect')}
                style={{
                  background: 'none', border: 'none', fontSize: '0.95rem',
                  fontWeight: activeTab === 'prospect' ? 700 : 500,
                  color: activeTab === 'prospect' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'prospect' ? '2.5px solid #1d4ed8' : '2.5px solid transparent',
                  paddingBottom: 10, transition: 'all 0.15s ease'
                }}
              >
                Prospects ({filteredCandidates.filter(c => getCandidateTag(c) === 'prospect').length})
              </button>

              <button
                onClick={() => setActiveTab('shortlisted')}
                style={{
                  background: 'none', border: 'none', fontSize: '0.95rem',
                  fontWeight: activeTab === 'shortlisted' ? 700 : 500,
                  color: activeTab === 'shortlisted' ? '#047857' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'shortlisted' ? '2.5px solid #047857' : '2.5px solid transparent',
                  paddingBottom: 10, transition: 'all 0.15s ease'
                }}
              >
                Shortlisted ({filteredCandidates.filter(c => getCandidateTag(c) === 'shortlisted').length})
              </button>

              <button
                onClick={() => setActiveTab('rejected')}
                style={{
                  background: 'none', border: 'none', fontSize: '0.95rem',
                  fontWeight: activeTab === 'rejected' ? 700 : 500,
                  color: activeTab === 'rejected' ? '#b91c1c' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'rejected' ? '2.5px solid #b91c1c' : '2.5px solid transparent',
                  paddingBottom: 10, transition: 'all 0.15s ease'
                }}
              >
                Rejected ({filteredCandidates.filter(c => getCandidateTag(c) === 'rejected').length})
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('contacted')}
            style={{
              background: 'none', border: 'none', fontSize: '0.95rem',
              fontWeight: activeTab === 'contacted' ? 700 : 500,
              color: activeTab === 'contacted' ? '#002366' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'contacted' ? '2.5px solid #002366' : '2.5px solid transparent',
              paddingBottom: 10, transition: 'all 0.15s ease'
            }}
          >
            Contacted ({filteredCandidates.filter(c => getCallStatus(c) === 'Called').length})
          </button>
        </div>

        <div className="sfp-toolbar">
          <div className="sfp-search">
            <FiSearch size={16} className="sfp-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates in this folder..."
              className="sfp-search-input"
            />
            {search && <button className="sfp-search-clear" onClick={() => setSearch('')}><FiX size={14} /></button>}
          </div>

          {selectedIds.size > 0 && (
            <div className="sfp-bulk-bar">
              <span className="sfp-bulk-count">{selectedIds.size} selected</span>
              <button className="sfp-bulk-btn" onClick={() => setMoveModalOpen(true)}>Move</button>
              <button className="sfp-bulk-btn danger" onClick={handleBulkRemove}>Remove</button>
              <button className="sfp-bulk-btn" onClick={() => setSelectedIds(new Set())}>Deselect</button>
            </div>
          )}
        </div>

        {displayCandidates.length > 0 && (
          <div className="sfp-select-all">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedIds.size === displayCandidates.length && displayCandidates.length > 0}
                onChange={selectAll} style={{ width: 16, height: 16 }} />
              Select all {displayCandidates.length} candidate(s)
            </label>
          </div>
        )}

        {displayCandidates.length > 0 ? (
          <div className="sfp-candidate-list">
            {displayCandidates.map((candidate, i) => (
              <motion.div
                key={candidate.userId || candidate.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <div className={`jrd-candidate-card ${selectedIds.has(candidate.userId || candidate.id) ? 'selected' : ''}`} style={{ marginBottom: 16 }}>
                  <div className="jrd-card-main-grid">
                    <div className="jrd-card-checkbox-col">
                      <input
                        type="checkbox"
                        className="jrd-checkbox"
                        checked={selectedIds.has(candidate.userId || candidate.id)}
                        onChange={() => toggleSelect(candidate)}
                      />
                    </div>
                    <div className="jrd-card-profile-col">
                      <div className="jrd-card-name-row">
                        <Link 
                          className="jrd-candidate-name jrd-candidate-name--link" 
                          to={`/candidates/${candidate.userId || candidate.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          {candidate.name || 'Unknown Candidate'}
                        </Link>
                        {candidate.isNew && <span className="jrd-badge-new-response">New</span>}
                        {candidate.isRecommended && <span className="jrd-badge-recommended">Recommended</span>}
                      </div>
                      <div className="jrd-card-meta-tags">
                        {candidate.experience && (
                          <span className="jrd-meta-tag-item">
                            <FiBriefcase size={14} color="#64748b" /> {candidate.experience}
                          </span>
                        )}
                        {candidate.salary && (
                          <span className="jrd-meta-tag-item">
                            {String(candidate.salary).startsWith('₹') ? candidate.salary : `₹ ${candidate.salary}`}
                          </span>
                        )}
                        {candidate.noticePeriod && (
                          <span className="jrd-meta-tag-item">
                            <FiClock size={14} color="#64748b" /> {candidate.noticePeriod}
                          </span>
                        )}
                        {candidate.currentCity && (
                          <span className="jrd-meta-tag-item">
                            <FiMapPin size={14} color="#64748b" /> {candidate.currentCity}
                          </span>
                        )}
                      </div>
                      <div className="jrd-details-table">
                        {candidate.currentTitle && (
                          <div className="jrd-detail-row">
                            <span className="jrd-detail-label">Current</span>
                            <span className="jrd-detail-val">{candidate.currentTitle} {candidate.currentCompany ? `at ${candidate.currentCompany}` : ''}</span>
                          </div>
                        )}
                        {candidate.education && (
                          <div className="jrd-detail-row">
                            <span className="jrd-detail-label">Education</span>
                            <span className="jrd-detail-val">{Array.isArray(candidate.education) ? candidate.education[0]?.degree : (candidate.education?.degree || candidate.education)}</span>
                          </div>
                        )}
                        {candidate.prefLocation && (
                          <div className="jrd-detail-row">
                            <span className="jrd-detail-label">Pref. location</span>
                            <span className="jrd-detail-val">{candidate.prefLocation}</span>
                          </div>
                        )}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="jrd-detail-row">
                            <span className="jrd-detail-label">Key skills</span>
                            <span className="jrd-detail-skills">{candidate.skills.slice(0, 8).join(' | ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Comments Preview on Candidate Card */}
                      {Array.isArray(candidate.comments) && candidate.comments.length > 0 && (
                        <div
                          className="jrd-card-comment-snippet"
                          onClick={() => setOpenCommentCandidateId(candidate.userId || candidate.id)}
                          style={{
                            marginTop: 10,
                            padding: '9px 13px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderLeft: '3px solid #002366',
                            borderRadius: '0 8px 8px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to view all comments or reply"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <FiMessageSquare size={13} color="#002366" />
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#002366' }}>
                                Recruiter Note ({candidate.comments[candidate.comments.length - 1].authorName || 'Recruiter'})
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {candidate.comments[candidate.comments.length - 1].createdAt
                                ? new Date(candidate.comments[candidate.comments.length - 1].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : ''}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#334155', fontStyle: 'italic', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            &ldquo;{candidate.comments[candidate.comments.length - 1].text}&rdquo;
                          </p>
                          {candidate.comments.length > 1 && (
                            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                              +{candidate.comments.length - 1} more comment{candidate.comments.length - 1 > 1 ? 's' : ''} (click to expand)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="jrd-card-right-col">
                       {((typeof candidate.profilePic === 'string' ? candidate.profilePic : candidate.profilePic?.url) || candidate.avatar) ? (
                         <img src={(typeof candidate.profilePic === 'string' ? candidate.profilePic : candidate.profilePic?.url) || candidate.avatar} alt={candidate.name} className="jrd-avatar-img" />
                       ) : (
                         <div className="jrd-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', color: '#0284c7', fontWeight: 700, fontSize: 18 }}>
                           {(candidate.name || 'C').charAt(0).toUpperCase()}
                         </div>
                       )}
                       {candidate.bio && (
                         <p className="jrd-bio-quote" title={candidate.bio}>
                           &ldquo;{candidate.bio}&rdquo;
                         </p>
                       )}
                       {candidate.email && (
                         <div className="jrd-candidate-email-text" title={candidate.email} style={{ marginTop: 12 }}>{candidate.email}</div>
                       )}
                       <div className="jrd-contact-status-wrapper">
                         <div className="jrd-contact-status-pill">
                            {revealedContacts[candidate.userId || candidate.id] ? (
                              <span
                                className="jrd-contact-phone-revealed"
                                title="Click to copy number"
                                onClick={(e) => handleCopyPhone(e, candidate.phone)}
                              >
                                <FiCopy size={13} />
                                <span>{candidate.phone || 'No phone'}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="jrd-contact-trigger-btn"
                                onClick={() => handleRevealContact(candidate)}
                                title="View and copy phone number"
                              >
                                <FiPhone size={12} />
                                <span>Contact</span>
                              </button>
                            )}

                            <span className="jrd-contact-sep">|</span>

                            <button
                              type="button"
                              className={`jrd-status-trigger-btn ${candidate.callStatus ? 'has-status' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusDropdownId(
                                  openStatusDropdownId === (candidate.userId || candidate.id) ? null : (candidate.userId || candidate.id)
                                );
                              }}
                              title="Change status"
                            >
                              <span>{getCallStatus(candidate) || 'Status'}</span>
                              <FiChevronDown size={13} />
                            </button>
                         </div>
                         {openStatusDropdownId === (candidate.userId || candidate.id) && (
                           <div className="jrd-status-dropdown-menu">
                             {['Called', 'Messaged', 'Not picked', 'Not reachable'].map((opt) => (
                               <button
                                 key={opt}
                                 type="button"
                                 className={`jrd-status-menu-item ${getCallStatus(candidate) === opt ? 'selected' : ''}`}
                                 onClick={() => handleSelectCallStatus(candidate, opt)}
                               >
                                 {opt}
                               </button>
                             ))}
                           </div>
                         )}
                       </div>

                       <button
                         type="button"
                         className="jrd-btn-call-app"
                         onClick={() => handleCallFromApp(candidate)}
                         title={`Call ${candidate.name} via system phone app`}
                       >
                         <FiSmartphone size={14} />
                         <span>Call from app</span>
                         <FiArrowRight size={13} />
                       </button>

                       <div className="jrd-side-icons">
                         <div
                           className="jrd-side-icon-btn-wrapper"
                           onMouseEnter={() => setHoveredTooltip(`email-${candidate.userId || candidate.id}`)}
                           onMouseLeave={() => setHoveredTooltip(null)}
                         >
                           <button
                             type="button"
                             className="jrd-side-icon-btn"
                             title="Email"
                             onClick={() => handleOpenEmail(candidate)}
                           >
                             <FiMail size={15} />
                           </button>
                           {hoveredTooltip === `email-${candidate.userId || candidate.id}` && (
                             <div className="jrd-side-tooltip">Email</div>
                           )}
                         </div>

                         <div className="jrd-side-icon-btn-wrapper">
                           <button
                             type="button"
                             className="jrd-side-icon-btn"
                             title="Share candidate profile"
                             onClick={() => {
                               if (navigator.clipboard) {
                                 navigator.clipboard.writeText(`${window.location.origin}/employer/candidate/${candidate.userId || candidate.id}`);
                                 showToast("Candidate profile link copied!");
                               }
                             }}
                           >
                             <FiSend size={15} />
                           </button>
                         </div>

                         <div className="jrd-side-icon-btn-wrapper">
                           <button
                             type="button"
                             className="jrd-side-icon-btn whatsapp"
                             title="Message on WhatsApp"
                             onClick={() => handleOpenWhatsApp(candidate)}
                           >
                             <FaWhatsapp size={17} />
                           </button>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="jrd-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div className="jrd-comment-trigger-wrapper">
                        <button
                          type="button"
                          className={`jrd-btn-comment ${openCommentCandidateId === (candidate.userId || candidate.id) ? 'active' : ''}`}
                          onClick={() =>
                            setOpenCommentCandidateId((prev) =>
                              prev === (candidate.userId || candidate.id) ? null : (candidate.userId || candidate.id)
                            )
                          }
                        >
                          <FiMessageSquare size={14} />
                          <span>
                            {Array.isArray(candidate.comments) && candidate.comments.length > 0
                              ? `Comments (${candidate.comments.length})`
                              : 'Add comment'}
                          </span>
                        </button>
                        {openCommentCandidateId === (candidate.userId || candidate.id) && (
                          <div className="jrd-btn-comment-indicator" />
                        )}
                      </div>

                      {/* Candidate Pipeline Stage Pills*/}
                      {isRequirement && (
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Stage:</span>
                          {[
                            { id: 'prospect', label: 'May Be', bg: '#eff6ff', color: '#1d4ed8', activeBg: '#1d4ed8' },
                            { id: 'shortlisted', label: 'Shortlisted', bg: '#ecfdf5', color: '#047857', activeBg: '#059669' },
                            { id: 'rejected', label: 'Rejected', bg: '#fef2f2', color: '#b91c1c', activeBg: '#dc2626' }
                          ].map(st => {
                            const isSelected = getCandidateTag(candidate) === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleSelectTag(candidate, st.id)}
                                style={{
                                  padding: '3px 9px',
                                  borderRadius: 12,
                                  border: isSelected ? `1.5px solid ${st.activeBg}` : '1px solid #cbd5e1',
                                  background: isSelected ? st.activeBg : st.bg,
                                  color: isSelected ? '#ffffff' : st.color,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                title={`Tag candidate as ${st.label}`}
                              >
                                {isSelected ? '✓ ' : ''}{st.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                     <div className="jrd-card-actions-right">
                       <button type="button" className="jrd-btn-action" onClick={() => { setMoveCandidateId(candidate.userId || candidate.id); setMoveModalOpen(true); }}>
                         <FiFolder size={14} /> <span>Move</span>
                       </button>
                       <button type="button" className="jrd-btn-delete-card" title="Remove from folder" onClick={() => handleRemoveCandidate(candidate)}>
                         <FiTrash2 size={14} />
                       </button>
                     </div>

                     {/* Expandable Comments Area */}
                     {openCommentCandidateId === (candidate.userId || candidate.id) && (
                       <div className="jrd-comments-expand-panel">
                         {Array.isArray(candidate.comments) && candidate.comments.length > 0 && (
                           <div className="jrd-comments-list">
                             {candidate.comments.map((comm, cIdx) => (
                               <div key={comm._id || cIdx} className="jrd-comment-bubble" style={{ position: 'relative' }}>
                                 <div className="jrd-comment-avatar">
                                   <FiUser size={15} />
                                 </div>
                                 <div className="jrd-comment-bubble-content" style={{ flex: 1 }}>
                                   <div className="jrd-comment-author-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <div>
                                       <span className="jrd-comment-author-name">
                                         {comm.authorName || 'Recruiter'}
                                       </span>
                                       <span className="jrd-comment-date" style={{ marginLeft: 8 }}>
                                         {comm.createdAt ? new Date(comm.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                       </span>
                                     </div>
                                     {comm._id && (
                                       <button
                                         type="button"
                                         onClick={() => handleDeleteComment(candidate, comm._id)}
                                         style={{
                                           background: 'none',
                                           border: 'none',
                                           color: '#94a3b8',
                                           cursor: 'pointer',
                                           padding: '2px 4px',
                                           display: 'flex',
                                           alignItems: 'center'
                                         }}
                                         title="Delete comment"
                                       >
                                         <FiTrash2 size={12} />
                                       </button>
                                     )}
                                   </div>
                                   <p className="jrd-comment-bubble-text">{comm.text}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}

                         <div className="jrd-comment-input-row">
                           <div className="jrd-comment-avatar">
                             <FiUser size={18} />
                           </div>
                           <div className="jrd-comment-field-wrapper">
                             <textarea
                               className="jrd-comment-textarea"
                               placeholder="Type your comment here"
                               rows={2}
                               value={commentTexts[candidate.userId || candidate.id] || ''}
                               onChange={(e) =>
                                 setCommentTexts((prev) => ({
                                   ...prev,
                                   [candidate.userId || candidate.id]: e.target.value,
                                 }))
                               }
                             />
                             <div className="jrd-comment-submit-row">
                               <button
                                 type="button"
                                 className="jrd-btn-submit-comment"
                                 disabled={isSubmittingComment || !commentTexts[candidate.userId || candidate.id]?.trim()}
                                 onClick={() => handleAddComment(candidate)}
                               >
                                 {isSubmittingComment ? 'Saving...' : 'Comment'}
                               </button>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="sfp-empty">
            <FiFolder size={40} style={{ color: '#cbd5e1' }} />
            <h3>{search ? 'No candidates match your search' : 'No candidates in this folder'}</h3>
            <p>Add candidates from Resume Search or search results.</p>
          </div>
        )}
      </div>

      <CreateFolderModal isOpen={showRename} onClose={() => setShowRename(false)} onSubmit={handleRename} initialData={folder} />
      {moveModalOpen && (
        <FolderSelectorModal
          onClose={() => { setMoveModalOpen(false); setMoveCandidateId(null); }}
          candidateId={moveCandidateId}
          onAdded={() => {
            if (moveCandidateId) {
              removeCandidate.mutateAsync({ folderId, candidateId: moveCandidateId }).catch(() => {});
            }
            setMoveCandidateId(null);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="sfp-modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
          <div className="sfp-modal-content" style={{background:'white', borderRadius:'12px', width:'400px', maxWidth:'90%', overflow:'hidden'}}>
            <div className="sfp-modal-header" style={{display:'flex', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #e2e8f0'}}>
              <h2 style={{margin:0, fontSize:'1.1rem', color:'#0f172a'}}>Confirm Deletion</h2>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}>
                <FiX size={20} />
              </button>
            </div>
            <div className="sfp-modal-body" style={{ padding: '20px' }}>
              <p style={{ margin: 0, marginBottom: '20px', color: '#475569' }}>Delete "{folder?.name}"? Candidates will not be removed, only the folder.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'none', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="button" onClick={confirmDeleteFolder} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="sfp-modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
          <div className="sfp-modal-content" style={{background:'white', borderRadius:'12px', width:'400px', maxWidth:'90%', overflow:'hidden'}}>
            <div className="sfp-modal-header" style={{display:'flex', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #e2e8f0'}}>
              <h2 style={{margin:0, fontSize:'1.1rem', color:'#0f172a'}}>Confirm Removal</h2>
              <button type="button" onClick={() => setShowRemoveConfirm(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}>
                <FiX size={20} />
              </button>
            </div>
            <div className="sfp-modal-body" style={{ padding: '20px' }}>
              <p style={{ margin: 0, marginBottom: '20px', color: '#475569' }}>Remove {selectedIds.size} candidate(s) from this folder?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRemoveConfirm(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'none', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="button" onClick={confirmBulkRemove} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {isRequirement && (
        <CreateRequirementModal
          isOpen={editRequirementOpen}
          onClose={() => setEditRequirementOpen(false)}
          onSubmit={async (payload) => {
            try {
              await updateFolder.mutateAsync({ id: folderId, ...payload });
              refetch();
              showToast('Requirement criteria updated.');
            } catch (err) {
              console.error('Failed to update requirement:', err);
            }
          }}
          initialData={folder}
        />
      )}

      {/* Alert Settings Modal */}
      {isRequirement && (
        <RequirementAlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          requirement={folder}
          onSaveAlerts={async (alertPayload) => {
            try {
              await updateFolder.mutateAsync({ id: folderId, ...alertPayload });
              refetch();
              showToast('Candidate match alert settings updated.');
            } catch (err) {
              console.error('Failed to update alerts:', err);
            }
          }}
        />
      )}
    </div>
  );
}
