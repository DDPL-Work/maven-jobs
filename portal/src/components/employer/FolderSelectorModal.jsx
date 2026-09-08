import { useState, useEffect, useCallback } from 'react';
import { FiX, FiFolder, FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useFolders, useCreateFolder, useAddCandidateToFolder } from '../../hooks/useFolderQueries';

const KEY = 'fsm-sel-spin';

export default function FolderSelectorModal({ candidateId, onClose, onAdded }) {
  const { data: folders = [], isLoading, isError, error: fetchError } = useFolders({ limit: 100 });
  const createFolder = useCreateFolder();
  const addCandidate = useAddCandidateToFolder();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successFolderId, setSuccessFolderId] = useState(null);

  const escHandler = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', escHandler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', escHandler);
      document.body.style.overflow = '';
    };
  }, [escHandler]);

  const handleSelect = async (folderId) => {
    if (addingTo) return;
    setErrorMsg('');
    setAddingTo(folderId);
    try {
      await addCandidate.mutateAsync({ folderId, candidateId });
      setSuccessFolderId(folderId);
      onAdded?.();
      setTimeout(() => onClose?.(), 600);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add candidate';
      setErrorMsg(msg);
      setAddingTo(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setErrorMsg('');
    try {
      const res = await createFolder.mutateAsync({ name: trimmed });
      if (res?.success && res?.data?._id) {
        await handleSelect(res.data._id);
      }
      setShowCreate(false);
      setNewName('');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create folder';
      setErrorMsg(msg);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="fsm-overlay"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Add candidate to folder"
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 420, width: '90%', maxHeight: '80vh',
        padding: 0, boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
        fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'fsmFadeIn 0.15s ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px 0',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Save to Folder
          </h2>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, lineHeight: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <FiX size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 22px 20px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2', borderRadius: 10,
              color: '#991b1b', fontSize: 13, fontWeight: 500, marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <FiAlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} aria-label="Dismiss"
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>
                <FiX size={14} />
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>
              <div className={`${KEY}`} style={{ width: 20, height: 20, margin: '0 auto 10px' }} />
              Loading folders...
            </div>
          ) : isError ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ef4444', fontSize: 13 }}>
              <FiAlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
              {fetchError?.message || 'Failed to load folders'}
              <br />
              <button onClick={() => window.location.reload()}
                style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' }}>
                Retry
              </button>
            </div>
          ) : folders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {folders.map((f) => {
                const isAdding = addingTo === f._id;
                const isDone = successFolderId === f._id;
                return (
                  <button
                    key={f._id}
                    onClick={() => handleSelect(f._id)}
                    disabled={!!addingTo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 10, border: isDone ? '1.5px solid #10b981' : '1px solid #f1f5f9',
                      background: isDone ? '#ecfdf5' : '#fafbfc',
                      cursor: addingTo ? 'default' : 'pointer',
                      transition: 'all 0.15s', width: '100%', textAlign: 'left',
                      fontSize: 14, color: '#1e293b', fontWeight: 600,
                      opacity: isDone ? 0.85 : 1,
                    }}
                    onMouseEnter={e => { if (!addingTo) { e.currentTarget.style.background = '#f0f5ff'; e.currentTarget.style.borderColor = '#bfdbfe'; } }}
                    onMouseLeave={e => { if (!addingTo && !isDone) { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = '#f1f5f9'; } }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: f.color || '#002366',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, flexShrink: 0,
                    }}>
                      {isDone ? <FiCheck size={16} /> : <FiFolder size={14} />}
                    </div>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, flexShrink: 0 }}>
                      {f.candidateCount || 0}
                    </span>
                    {isAdding && (
                      <div className={`${KEY}`} style={{
                        width: 16, height: 16, border: '2px solid #002366',
                        borderTopColor: 'transparent', borderRadius: '50%', flexShrink: 0,
                      }} />
                    )}
                    {isDone && (
                      <FiCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>
              <FiFolder size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              No folders yet. Create one to get started.
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            {showCreate ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter folder name"
                  style={{
                    flex: 1, padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0',
                    borderRadius: 8, outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#002366'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewName(''); } }}
                  autoFocus
                />
                <button onClick={handleCreate} disabled={!newName.trim() || createFolder.isPending}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: 'none',
                    background: '#002366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    opacity: !newName.trim() || createFolder.isPending ? 0.55 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {createFolder.isPending ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(''); }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                    background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none',
                color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                justifyContent: 'center', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#002366'; e.currentTarget.style.color = '#002366'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
              >
                <FiPlus size={14} /> Create New Folder
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fsmFadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } } .${KEY} { animation:fsmSpin 0.55s linear infinite } @keyframes fsmSpin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
