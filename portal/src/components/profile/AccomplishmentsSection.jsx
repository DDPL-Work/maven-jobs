import React, { useState, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiLink, FiFileText, FiExternalLink } from 'react-icons/fi';
import AccomplishmentSidebar, { getSocialIcon, SOCIAL_PLATFORMS } from './AccomplishmentSidebar';

const SUGGESTED_PLATFORMS = [
  'LinkedIn',
  'GitHub',
  'Twitter / X',
  'LeetCode',
  'Portfolio / Website',
  'HackerRank',
  'Stack Overflow',
  'Medium',
  'Kaggle',
  'Behance',
  'Dribbble',
  'YouTube'
];

const AccomplishmentsSection = React.memo(({ user, onSave }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Parse existing data
  const data = useMemo(() => {
    let parsed = {
      onlineProfiles: [],
      workSamples: [],
      whitePapers: [],
      presentations: [],
      patents: [],
      certifications: []
    };
    if (user?.accomplishments) {
      try {
        const d = JSON.parse(user.accomplishments);
        if (typeof d === 'object' && d !== null) {
          parsed = { ...parsed, ...d };
        }
      } catch (e) {
        // If it's old plain text, we can just ignore it or log it
        console.warn("Could not parse accomplishments JSON");
      }
    }
    return parsed;
  }, [user?.accomplishments]);

  const handleAdd = (typeKey, categoryLabel, defaultProfile = null) => {
    setActiveType({ key: typeKey, label: categoryLabel });
    setEditingItem(defaultProfile ? { profile: defaultProfile, url: '', description: '' } : null);
    setEditingIndex(null);
    setSidebarOpen(true);
  };

  const handleEdit = (typeKey, categoryLabel, index, item) => {
    setActiveType({ key: typeKey, label: categoryLabel });
    setEditingItem(item);
    setEditingIndex(index);
    setSidebarOpen(true);
  };

  const handleDelete = async (typeKey, index) => {
    const list = [...(data[typeKey] || [])];
    list.splice(index, 1);
    const newData = { ...data, [typeKey]: list };
    await onSave({ accomplishments: JSON.stringify(newData) });
  };

  const handleSaveSidebar = async (formData) => {
    const typeKey = activeType.key;
    const list = [...(data[typeKey] || [])];
    
    if (editingIndex !== null) {
      list[editingIndex] = { ...formData, id: list[editingIndex].id || Date.now() };
    } else {
      list.push({ ...formData, id: Date.now() });
    }
    
    const newData = { ...data, [typeKey]: list };
    const res = await onSave({ accomplishments: JSON.stringify(newData) });
    if (res?.success !== false) {
      setSidebarOpen(false);
    }
  };

  const renderSection = (title, description, typeKey, renderItem) => {
    const items = data[typeKey] || [];
    const isOnlineProfiles = typeKey === 'onlineProfiles';
    const addedNames = new Set((items || []).map(i => (i.profile || '').trim().toLowerCase()));
    const availableSuggestions = isOnlineProfiles 
      ? SUGGESTED_PLATFORMS.filter(p => !addedNames.has(p.toLowerCase()))
      : [];

    return (
      <div style={{ padding: '24px', borderBottom: '1px solid var(--slate-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--navy)', margin: '0 0 4px 0' }}>{title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: 0 }}>{description}</p>
          </div>
          <button onClick={() => handleAdd(typeKey, title)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Add</button>
        </div>

        {isOnlineProfiles && availableSuggestions.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Add:</span>
            {availableSuggestions.slice(0, 7).map(platform => (
              <button
                key={platform}
                type="button"
                onClick={() => handleAdd('onlineProfiles', 'Online profile', platform)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.8rem',
                  color: 'var(--navy)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{getSocialIcon(platform, 13)}</span>
                <span>+ {platform}</span>
              </button>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>{renderItem(item)}</div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', marginTop: '4px' }}>
                  <button onClick={() => handleEdit(typeKey, title, idx, item)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><FiEdit2 size={14} /></button>
                  <button onClick={() => handleDelete(typeKey, idx)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="ps-card">
        <div className="ps-card-header" style={{ padding: '24px', paddingBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h3 className="ps-section-title" style={{ margin: 0 }}>Accomplishments</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '8px 0 0 0' }}>Showcase your credentials by adding relevant certifications, work samples, online profiles, etc.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {renderSection('Online profile', 'Add link to online professional profiles (e.g. LinkedIn, GitHub, LeetCode, Twitter/X, Portfolio, etc.)', 'onlineProfiles', (item) => (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2
              }}>
                {getSocialIcon(item.profile, 18)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.profile}</div>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4, wordBreak: 'break-all', marginTop: 2, textDecoration: 'none' }}>
                  {item.url} <FiExternalLink size={12} />
                </a>
                {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '6px', marginBottom: 0 }}>{item.description}</p>}
              </div>
            </div>
          ))}

          {renderSection('Work sample', 'Link relevant work samples (e.g. Github, Behance)', 'workSamples', (item) => (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.title}</div>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{item.url}</a>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 4 }}>
                {item.durationFromMonth} {item.durationFromYear} to {item.isCurrent ? 'Present' : `${item.durationToMonth} ${item.durationToYear}`}
              </div>
              {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '8px' }}>{item.description}</p>}
            </div>
          ))}

          {renderSection('White paper / Research publication / Journal entry', 'Add links to your online publications', 'whitePapers', (item) => (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.title}</div>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{item.url}</a>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 4 }}>Published on: {item.publishedMonth} {item.publishedYear}</div>
              {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '8px' }}>{item.description}</p>}
            </div>
          ))}

          {renderSection('Presentation', 'Add links to your online presentations (e.g. Slide-share presentation links etc.)', 'presentations', (item) => (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.title}</div>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{item.url}</a>
              {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '8px' }}>{item.description}</p>}
            </div>
          ))}

          {renderSection('Patent', 'Add details of patents you have filed', 'patents', (item) => (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.title}</div>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{item.url}</a>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4 }}>
                <strong>Office:</strong> {item.office} | <strong>Status:</strong> {item.status === 'issued' ? 'Issued' : 'Pending'} 
                {item.applicationNumber && ` | App No: ${item.applicationNumber}`}
              </div>
              {item.status === 'issued' && <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 4 }}>Issued on: {item.issueMonth} {item.issueYear}</div>}
              {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '8px' }}>{item.description}</p>}
            </div>
          ))}

          {renderSection('Certification', 'Add details of certifications you have completed', 'certifications', (item) => (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>{item.name}</div>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue)', display: 'block', wordBreak: 'break-all', marginTop: 2 }}>{item.url}</a>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4 }}>
                <strong>Completion ID:</strong> {item.completionId}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 4 }}>
                Valid from: {item.validFromMonth} {item.validFromYear} 
                {!item.doesNotExpire ? ` to ${item.validToMonth} ${item.validToYear}` : ' (Does not expire)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AccomplishmentSidebar 
        isOpen={sidebarOpen} 
        category={activeType?.label} 
        typeKey={activeType?.key} 
        initialData={editingItem}
        onClose={() => setSidebarOpen(false)}
        onSave={handleSaveSidebar}
      />
    </>
  );
});

export default AccomplishmentsSection;
