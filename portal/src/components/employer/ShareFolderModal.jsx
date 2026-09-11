import { useState, useMemo } from 'react';
import { FiX, FiShare2, FiSearch, FiCheck, FiCopy, FiUser, FiPlus, FiFolder } from 'react-icons/fi';

const COMPANY_TEAM_USERS = [
  { id: 'u1', name: 'Admin (Master User)', email: 'admin@mavenjobs.in', role: 'Master Admin' },
  { id: 'u2', name: 'Rahul Sharma', email: 'rahul.s@mavenjobs.in', role: 'Lead Recruiter' },
  { id: 'u3', name: 'Priya Verma', email: 'priya.v@mavenjobs.in', role: 'Senior Talent Sourcer' },
  { id: 'u4', name: 'Amit Patel', email: 'amit.p@mavenjobs.in', role: 'Tech Hiring Specialist' },
  { id: 'u5', name: 'Sneha Kulkarni', email: 'sneha.k@mavenjobs.in', role: 'Executive Sourcer' },
  { id: 'u6', name: 'Vikram Malhotra', email: 'vikram.m@mavenjobs.in', role: 'HR Partner' },
];

export default function ShareFolderModal({ isOpen, onClose, onShare, selectedFolders = [] }) {
  const [search, setSearch] = useState('');
  const [selectedUserEmails, setSelectedUserEmails] = useState([]);
  const [customEmail, setCustomEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredUsers = COMPANY_TEAM_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (email) => {
    setSelectedUserEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAddCustomUser = (e) => {
    e.preventDefault();
    const trimmed = customEmail.trim();
    if (!trimmed) return;
    if (!selectedUserEmails.includes(trimmed)) {
      setSelectedUserEmails((prev) => [...prev, trimmed]);
    }
    setCustomEmail('');
  };

  const handleCopyLink = () => {
    const link = window.location.origin + `/manage-folders`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUserEmails.length === 0) {
      alert('Please select at least one user to share with.');
      return;
    }
    onShare({
      userEmails: selectedUserEmails,
      permission,
      folders: selectedFolders,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          maxWidth: 500,
          width: '92%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <FiShare2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Share Folder{selectedFolders.length > 1 ? 's' : ''}
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Select team members or enter users to grant access
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Selected Folders Chips */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Folder{selectedFolders.length > 1 ? 's' : ''} ({selectedFolders.length})
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 80, overflowY: 'auto' }}>
              {selectedFolders.map((f) => (
                <span
                  key={f._id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: '#f1f5f9',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1e293b',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <FiFolder size={12} color="#0284c7" />
                  {f.name}
                </span>
              ))}
            </div>
          </div>

          {/* Search team users */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Users ({selectedUserEmails.length} selected)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team member by name or email..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  fontSize: 13,
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <FiSearch size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Users List with Checkboxes */}
          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '4px 0',
              marginBottom: 16,
              background: '#f8fafc',
            }}
          >
            {filteredUsers.map((u) => {
              const isChecked = selectedUserEmails.includes(u.email);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    background: isChecked ? '#eff6ff' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#475569',
                      background: '#e2e8f0',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {u.role}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Add custom user email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Or add user by email
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomUser}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FiPlus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Permission & Copy Link Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, background: '#f8fafc', padding: '10px 14px', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Access:</span>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  fontWeight: 500,
                  outline: 'none',
                }}
              >
                <option value="view">Can view candidates</option>
                <option value="edit">Can view & add candidates</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#16a34a' : '#2563eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
              {copied ? 'Link copied!' : 'Copy folder link'}
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUserEmails.length === 0}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: selectedUserEmails.length === 0 ? '#94a3b8' : '#1d68bd',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: selectedUserEmails.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.15s',
              }}
            >
              <FiShare2 size={14} />
              Share ({selectedUserEmails.length})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
