import React, { useState, useEffect } from 'react';
import { FiX, FiGlobe, FiLink, FiCode } from 'react-icons/fi';
import { 
  FaLinkedin, FaGithub, FaStackOverflow, FaMedium, FaKaggle, 
  FaBehance, FaDribbble, FaYoutube 
} from 'react-icons/fa';
import { SiLeetcode, SiHackerrank, SiX } from 'react-icons/si';
import './AccomplishmentSidebar.css';
import CustomSelect from '../common/CustomSelect';

export const SOCIAL_PLATFORMS = [
  'LinkedIn',
  'GitHub',
  'Twitter / X',
  'Portfolio / Website',
  'LeetCode',
  'HackerRank',
  'Stack Overflow',
  'Medium',
  'Kaggle',
  'Behance',
  'Dribbble',
  'CodeChef',
  'YouTube',
  'Other'
];

export const getSocialIcon = (profileName, size = 16) => {
  const p = (profileName || '').toLowerCase();
  if (p.includes('linkedin')) return <FaLinkedin size={size} color="#0A66C2" />;
  if (p.includes('github')) return <FaGithub size={size} color="#24292F" />;
  if (p.includes('twitter') || p.includes(' x') || p === 'x') return <SiX size={size} color="#0F1419" />;
  if (p.includes('leetcode')) return <SiLeetcode size={size} color="#FFA116" />;
  if (p.includes('hackerrank')) return <SiHackerrank size={size} color="#00EA64" />;
  if (p.includes('stack')) return <FaStackOverflow size={size} color="#F58025" />;
  if (p.includes('medium')) return <FaMedium size={size} color="#000000" />;
  if (p.includes('kaggle')) return <FaKaggle size={size} color="#20BEFF" />;
  if (p.includes('behance')) return <FaBehance size={size} color="#1769FF" />;
  if (p.includes('dribbble')) return <FaDribbble size={size} color="#EA4C89" />;
  if (p.includes('youtube')) return <FaYoutube size={size} color="#FF0000" />;
  if (p.includes('codechef') || p.includes('code')) return <FiCode size={size} color="#5B4638" />;
  if (p.includes('portfolio') || p.includes('website')) return <FiGlobe size={size} color="#2563EB" />;
  return <FiLink size={size} color="#64748B" />;
};

export const getUrlPlaceholder = (profile) => {
  switch (profile) {
    case 'LinkedIn': return 'https://linkedin.com/in/username';
    case 'GitHub': return 'https://github.com/username';
    case 'Twitter / X': return 'https://x.com/username';
    case 'LeetCode': return 'https://leetcode.com/u/username';
    case 'HackerRank': return 'https://hackerrank.com/username';
    case 'Stack Overflow': return 'https://stackoverflow.com/users/...';
    case 'Medium': return 'https://medium.com/@username';
    case 'Kaggle': return 'https://kaggle.com/username';
    case 'Behance': return 'https://behance.net/username';
    case 'Dribbble': return 'https://dribbble.com/username';
    case 'CodeChef': return 'https://codechef.com/users/username';
    case 'YouTube': return 'https://youtube.com/@channel';
    case 'Portfolio / Website': return 'https://yourportfolio.com';
    default: return 'https://...';
  }
};

const emptyForms = {
  onlineProfiles: { profile: '', url: '', description: '' },
  workSamples: { title: '', url: '', durationFromMonth: '', durationFromYear: '', durationToMonth: '', durationToYear: '', isCurrent: false, description: '' },
  whitePapers: { title: '', url: '', publishedMonth: '', publishedYear: '', description: '' },
  presentations: { title: '', url: '', description: '' },
  patents: { title: '', url: '', office: '', status: 'issued', applicationNumber: '', issueYear: '', issueMonth: '', description: '' },
  certifications: { name: '', completionId: '', url: '', validFromMonth: '', validFromYear: '', validToMonth: '', validToYear: '', doesNotExpire: false }
};

const AccomplishmentSidebar = ({ isOpen, category, typeKey, initialData, onClose, onSave }) => {
  const [formData, setFormData] = useState(emptyForms[typeKey] || {});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || emptyForms[typeKey] || {});
    }
  }, [isOpen, initialData, typeKey]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    let toSave = { ...formData };
    if (typeKey === 'onlineProfiles' && formData.profile === 'Other' && formData.customName?.trim()) {
      toSave.profile = formData.customName.trim();
    }
    onSave(toSave);
  };

  const renderMonths = () => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>);
  const renderYears = () => [...Array(40)].map((_, i) => {
    const y = new Date().getFullYear() - i;
    return <option key={y} value={y}>{y}</option>;
  });

  const renderFields = () => {
    switch (typeKey) {
      case 'onlineProfiles':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Social profile</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SOCIAL_PLATFORMS.map(p => {
                  const isSelected = formData.profile === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleChange('profile', p)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '1.5px solid var(--blue, #2563EB)' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? 'var(--blue, #2563EB)' : '#334155',
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {getSocialIcon(p, 14)}
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {formData.profile === 'Other' && (
              <div className="acc-field">
                <label className="acc-label">Profile / Platform name</label>
                <input 
                  className="acc-input" 
                  placeholder="e.g. Dev.to, Substack, Codepen" 
                  value={formData.customName || ''} 
                  onChange={(e) => handleChange('customName', e.target.value)} 
                />
              </div>
            )}
            <div className="acc-field">
              <label className="acc-label">URL</label>
              <input 
                className="acc-input" 
                placeholder={getUrlPlaceholder(formData.profile)} 
                value={formData.url || ''} 
                onChange={(e) => handleChange('url', e.target.value)} 
              />
            </div>
            <div className="acc-field">
              <label className="acc-label">Description (optional)</label>
              <textarea 
                className="acc-textarea" 
                rows={4} 
                placeholder="Description" 
                value={formData.description || ''} 
                onChange={(e) => handleChange('description', e.target.value)} 
              />
            </div>
          </>
        );
      case 'workSamples':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Work title</label>
              <input className="acc-input" placeholder="Enter title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">URL</label>
              <input className="acc-input" placeholder="Enter URL" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Duration from</label>
              <div className="acc-flex-row" style={{ gap: '16px' }}>
                <CustomSelect 
                  value={formData.durationFromYear} 
                  onChange={(e) => handleChange('durationFromYear', e.target.value)}
                  placeholder="Year"
                  options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                />
                <CustomSelect 
                  value={formData.durationFromMonth} 
                  onChange={(e) => handleChange('durationFromMonth', e.target.value)}
                  placeholder="Month"
                  options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                />
              </div>
            </div>
            <label className="acc-checkbox-label" style={{ marginBottom: 24 }}>
              <input type="checkbox" checked={formData.isCurrent} onChange={(e) => handleChange('isCurrent', e.target.checked)} />
              I am currently working on this
            </label>
            {!formData.isCurrent && (
              <div className="acc-field">
                <label className="acc-label">Duration to</label>
                <div className="acc-flex-row" style={{ gap: '16px' }}>
                  <CustomSelect 
                    value={formData.durationToYear} 
                    onChange={(e) => handleChange('durationToYear', e.target.value)}
                    placeholder="Year"
                    options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                  />
                  <CustomSelect 
                    value={formData.durationToMonth} 
                    onChange={(e) => handleChange('durationToMonth', e.target.value)}
                    placeholder="Month"
                    options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                  />
                </div>
              </div>
            )}
            <div className="acc-field">
              <label className="acc-label">Description</label>
              <textarea className="acc-textarea" rows={4} placeholder="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </>
        );
      case 'whitePapers':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Title</label>
              <input className="acc-input" placeholder="Enter title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">URL</label>
              <input className="acc-input" placeholder="Enter URL" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Published on</label>
              <div className="acc-flex-row" style={{ gap: '16px' }}>
                <CustomSelect 
                  value={formData.publishedYear} 
                  onChange={(e) => handleChange('publishedYear', e.target.value)}
                  placeholder="Year"
                  options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                />
                <CustomSelect 
                  value={formData.publishedMonth} 
                  onChange={(e) => handleChange('publishedMonth', e.target.value)}
                  placeholder="Month"
                  options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                />
              </div>
            </div>
            <div className="acc-field">
              <label className="acc-label">Description</label>
              <textarea className="acc-textarea" rows={4} placeholder="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </>
        );
      case 'presentations':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Presentation title</label>
              <input className="acc-input" placeholder="Enter title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">URL</label>
              <input className="acc-input" placeholder="Enter URL" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Description</label>
              <textarea className="acc-textarea" rows={4} placeholder="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </>
        );
      case 'patents':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Patent title</label>
              <input className="acc-input" placeholder="Enter title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">URL</label>
              <input className="acc-input" placeholder="Enter URL" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Patent office</label>
              <input className="acc-input" placeholder="Enter patent office" value={formData.office} onChange={(e) => handleChange('office', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Status</label>
              <div className="acc-radio-group" style={{ marginTop: '8px' }}>
                <label className="acc-radio-label">
                  <input type="radio" checked={formData.status === 'issued'} onChange={() => handleChange('status', 'issued')} style={{ accentColor: 'var(--blue)' }} /> Patent issued
                </label>
                <label className="acc-radio-label">
                  <input type="radio" checked={formData.status === 'pending'} onChange={() => handleChange('status', 'pending')} style={{ accentColor: 'var(--blue)' }} /> Patent pending
                </label>
              </div>
            </div>
            <div className="acc-field">
              <label className="acc-label">Application number</label>
              <input className="acc-input" placeholder="Enter application number" value={formData.applicationNumber} onChange={(e) => handleChange('applicationNumber', e.target.value)} />
            </div>
            {formData.status === 'issued' && (
              <div className="acc-field">
                <label className="acc-label">Issued date</label>
                <div className="acc-flex-row" style={{ gap: '16px' }}>
                  <CustomSelect 
                    value={formData.issueYear} 
                    onChange={(e) => handleChange('issueYear', e.target.value)}
                    placeholder="Year"
                    options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                  />
                  <CustomSelect 
                    value={formData.issueMonth} 
                    onChange={(e) => handleChange('issueMonth', e.target.value)}
                    placeholder="Month"
                    options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                  />
                </div>
              </div>
            )}
            <div className="acc-field">
              <label className="acc-label">Description</label>
              <textarea className="acc-textarea" rows={4} placeholder="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </>
        );
      case 'certifications':
        return (
          <>
            <div className="acc-field">
              <label className="acc-label">Certification name</label>
              <input className="acc-input" placeholder="Enter name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Certification completion ID</label>
              <input className="acc-input" placeholder="Enter completion ID" value={formData.completionId} onChange={(e) => handleChange('completionId', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Certification URL</label>
              <input className="acc-input" placeholder="Enter URL" value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
            </div>
            <div className="acc-field">
              <label className="acc-label">Certification validity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                <CustomSelect 
                  value={formData.validFromMonth} 
                  onChange={(e) => handleChange('validFromMonth', e.target.value)}
                  placeholder="MM"
                  options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                />
                <CustomSelect 
                  value={formData.validFromYear} 
                  onChange={(e) => handleChange('validFromYear', e.target.value)}
                  placeholder="YYYY"
                  options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                />
                {!formData.doesNotExpire && (
                  <>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)' }}>To</span>
                    <CustomSelect 
                      value={formData.validToMonth} 
                      onChange={(e) => handleChange('validToMonth', e.target.value)}
                      placeholder="MM"
                      options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                    />
                    <CustomSelect 
                      value={formData.validToYear} 
                      onChange={(e) => handleChange('validToYear', e.target.value)}
                      placeholder="YYYY"
                      options={[...Array(40)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                    />
                  </>
                )}
              </div>
            </div>
            <label className="acc-checkbox-label" style={{ marginBottom: 24, fontSize: '0.95rem', color: 'var(--navy)' }}>
              <input type="checkbox" checked={formData.doesNotExpire} onChange={(e) => handleChange('doesNotExpire', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--navy)' }} />
              This certification does not expire
            </label>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`acc-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('acc-sidebar-overlay')) onClose(); }}>
      <div className="acc-sidebar-container">
        <div className="acc-sidebar-header">
          <h2>{category}</h2>
          <button className="acc-sidebar-close" onClick={onClose}><FiX size={20} /></button>
        </div>
        <div className="acc-sidebar-body">
          {renderFields()}
        </div>
        <div className="acc-sidebar-footer">
          <button className="acc-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="acc-btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AccomplishmentSidebar;
