import { useState } from 'react';
import { FiX, FiFolder, FiSave } from 'react-icons/fi';

const COLORS = ['#002366', '#1d4ed8', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be123c'];
const ICONS = ['folder', 'star', 'heart', 'briefcase', 'users', 'target', 'bookmark', 'layers'];

export default function CreateFolderModal({ isOpen, onClose, onSubmit, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || 'folder');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name is required');
      return;
    }
    setError('');
    onSubmit({ name: trimmed, description: description.trim(), color, icon, isPublic });
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? '3px solid #0f172a' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s', padding: 0,
                }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Icon</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)} style={{
                  width: 36, height: 36, borderRadius: 8, background: icon === ic ? '#f0f5ff' : '#f8fafc',
                  border: icon === ic ? '2px solid #002366' : '1.5px solid #e2e8f0',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#475569', fontSize: 16, transition: 'all 0.15s', padding: 0,
                }}>
                  <FiFolder size={16} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="isPublic" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>Make this folder visible to team members</label>
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
