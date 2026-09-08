import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFolder, FiEdit2, FiTrash2, FiShare2, FiSearch, FiX, FiArrowLeft, FiUsers } from 'react-icons/fi';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CandidateCard from '../../../../components/employer/CandidateCard';
import { useFolder, useDeleteFolder, useUpdateFolder, useRemoveCandidateFromFolder, useBulkRemoveCandidates } from '../../../../hooks/useFolderQueries';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';
import FolderSelectorModal from '../../../../components/employer/FolderSelectorModal';
import './SingleFolderPage.css';

export default function SingleFolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useFolder(folderId);

  const folder = data?.folder || null;
  const candidates = data?.candidates || [];

  const [search, setSearch] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveCandidateId, setMoveCandidateId] = useState(null);

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

  const handleDeleteFolder = async () => {
    if (!window.confirm(`Delete "${folder?.name}"? Candidates will not be removed, only the folder.`)) return;
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

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    if (!window.confirm(`Remove ${ids.length} candidate(s) from this folder?`)) return;
    try {
      await bulkRemove.mutateAsync({ folderId, candidateIds: ids });
      setSelectedIds(new Set());
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
            <button onClick={() => navigate('/employer-dashboard/folders')} style={{ background: 'none', border: 'none', color: '#002366', fontWeight: 700, cursor: 'pointer', fontSize: 'inherit' }}>
              Back to Folders
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sfp-root">
      <div className="sfp-container">
        <EmployerBreadcrumb items={[
          { label: 'Employer Dashboard', path: '/employer-dashboard' },
          { label: 'Folders', path: '/employer-dashboard/folders' },
          { label: folder.name },
        ]} />

        <div className="sfp-back" onClick={() => navigate('/employer-dashboard/folders')}>
          <FiArrowLeft size={14} /> Back to Folders
        </div>

        <div className="sfp-header">
          <div className="sfp-header-left">
            <div className="sfp-header-icon" style={{ background: folder.color || '#002366' }}>
              <FiFolder size={24} />
            </div>
            <div>
              <h1 className="sfp-title">{folder.name}</h1>
              {folder.description && <p className="sfp-desc">{folder.description}</p>}
              <div className="sfp-stats">
                <span><FiUsers size={13} /> {folder.candidateCount || 0} candidates</span>
                <span>Created {new Date(folder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>Updated {new Date(folder.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
          <div className="sfp-header-actions">
            <button className="sfp-action-btn" onClick={() => setShowRename(true)} title="Rename"><FiEdit2 size={15} /></button>
            <button className="sfp-action-btn" onClick={handleDeleteFolder} title="Delete"><FiTrash2 size={15} /></button>
            <button className="sfp-action-btn" onClick={() => navigator.clipboard?.writeText?.(window.location.href)} title="Share"><FiShare2 size={15} /></button>
          </div>
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

        {filteredCandidates.length > 0 && (
          <div className="sfp-select-all">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                onChange={selectAll} style={{ width: 16, height: 16 }} />
              Select all {filteredCandidates.length} candidate(s)
            </label>
          </div>
        )}

        {filteredCandidates.length > 0 ? (
          <div className="sfp-candidate-list">
            {filteredCandidates.map((candidate, i) => (
              <motion.div
                key={candidate.userId || candidate.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <CandidateCard
                  candidate={candidate}
                  onToggleSelect={toggleSelect}
                  isSelected={selectedIds.has(candidate.userId || candidate.id)}
                  context="folder"
                  onRemoveFromFolder={handleRemoveCandidate}
                  onMoveFolder={(c) => { setMoveCandidateId(c.userId || c.id); setMoveModalOpen(true); }}
                />
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
    </div>
  );
}
