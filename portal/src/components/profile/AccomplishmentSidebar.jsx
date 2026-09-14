import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './AccomplishmentSidebar.css';
import CustomSelect from '../common/CustomSelect';

const emptyForms = {
  onlineProfiles: { profile: 'LinkedIn', url: '', description: '' },
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
    onSave(formData);
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
              <CustomSelect 
                value={formData.profile} 
                onChange={(e) => handleChange('profile', e.target.value)}
                placeholder="Select profile"
                options={['LinkedIn', 'GitHub', 'Portfolio', 'Other'].map(p => ({ label: p, value: p }))}
              />
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
