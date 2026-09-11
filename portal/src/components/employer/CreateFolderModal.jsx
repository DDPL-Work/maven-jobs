import { useState, useEffect } from 'react';
import { FiX, FiSave, FiUsers } from 'react-icons/fi';

export default function CreateFolderModal({ isOpen, onClose, onSubmit, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [sharedWith, setSharedWith] = useState(
    Array.isArray(initialData?.sharedWith)
      ? initialData.sharedWith.join(', ')
      : (initialData?.sharedWith || initialData?.shareWithUsers || '')
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      const initialShared = Array.isArray(initialData?.sharedWith)
        ? initialData.sharedWith.join(', ')
        : (initialData?.sharedWith || initialData?.shareWithUsers || '');
      setSharedWith(initialShared);
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name is required');
      return;
    }
    setError('');
    const usersArray = sharedWith
      ? sharedWith.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    onSubmit({
      name: trimmed,
      description: description.trim(),
      color: initialData?.color || '#002366',
      icon: initialData?.icon || 'folder',
      isPublic: initialData?.isPublic || false,
      sharedWith: usersArray,
      shareWithUsers: sharedWith.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 460, width: '90%',
        padding: 0, boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {initialData ? 'Rename Folder' : 'Create Folder'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Folder Name *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Frontend React Developers"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, border: `1.5px solid ${error ? '#dc2626' : '#e2e8f0'}`,
                borderRadius: 10, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              autoFocus
            />
            {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this folder"
              rows={2}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, border: '1.5px solid #e2e8f0',
                borderRadius: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Share with users</label>
            <div style={{ position: 'relative' }}>
              <input
                value={sharedWith}
                onChange={(e) => setSharedWith(e.target.value)}
                placeholder="Enter user emails or names (e.g. alex@example.com, john@company.com)"
                style={{
                  width: '100%', padding: '10px 14px 10px 38px', fontSize: 14, border: '1.5px solid #e2e8f0',
                  borderRadius: 10, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
              />
              <FiUsers size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 4 }}>
              Separate multiple users or email addresses with commas
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none',
              background: '#002366', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <FiSave size={14} /> {initialData ? 'Save' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
