import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './BasicDetailsModal.css';

const BasicDetailsModal = ({ user, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    workStatus: user?.workStatus || 'Experienced',
    totalExpYears: user?.totalExpYears || '0 Year',
    totalExpMonths: user?.totalExpMonths || '2 Months',
    currentSalary: user?.currentSalary || '',
    salaryBreakdown: user?.salaryBreakdown || 'Fixed',
    locationType: user?.locationType || 'India',
    city: user?.currentCity || '',
    locality: user?.locality || '',
    noticePeriod: user?.noticePeriod || '15 Days or less',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="bdm-overlay" onClick={onClose}>
      <div className="bdm-container" onClick={e => e.stopPropagation()}>
        <div className="bdm-header">
          <div className="bdm-title-row">
            <h2 className="bdm-title">Basic details</h2>
            <button className="bdm-close" onClick={onClose}><FiX size={20} /></button>
          </div>
        </div>
        
        <div className="bdm-body">
          {activeTab === 'basic' && (
            <div className="bdm-form">
              <div className="bdm-field">
                <label>Name <span>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              
              <div className="bdm-employment-hint">
                <strong>Associate MERN Stack Developer at Dr Design Pvt Ltd, Dehradun</strong>
                <p>To edit go to Employment section.<br/>Please remove your current employment if you want to mark yourself as fresher</p>
              </div>

              <div className="bdm-field">
                <label>Work status</label>
                <p className="bdm-sub-label">We will personalise your Naukri experience based on this</p>
                <div className="bdm-radio-group">
                  <label><input type="radio" name="workStatus" value="Fresher" checked={formData.workStatus === 'Fresher'} onChange={handleChange} /> Fresher</label>
                  <label><input type="radio" name="workStatus" value="Experienced" checked={formData.workStatus === 'Experienced'} onChange={handleChange} /> Experienced</label>
                </div>
              </div>

              <div className="bdm-field">
                <label>Total experience <span>*</span></label>
                <p className="bdm-sub-label">This helps recruiters know your years of experience</p>
                <div className="bdm-row">
                  <select name="totalExpYears" value={formData.totalExpYears} onChange={handleChange}>
                    <option>0 Year</option>
                    <option>1 Year</option>
                    <option>2 Years</option>
                  </select>
                  <select name="totalExpMonths" value={formData.totalExpMonths} onChange={handleChange}>
                    <option>0 Month</option>
                    <option>2 Months</option>
                    <option>4 Months</option>
                  </select>
                </div>
              </div>

              <div className="bdm-field">
                <label>Current salary <span>*</span></label>
                <p className="bdm-sub-label">Salary information helps us find relevant jobs for you</p>
                <div className="bdm-row-input">
                  <select className="bdm-currency"><option>₹</option></select>
                  <input type="text" name="currentSalary" value={formData.currentSalary} onChange={handleChange} placeholder="1,56,000" />
                </div>
              </div>

              <div className="bdm-field">
                <label>Salary breakdown <span>*</span></label>
                <select name="salaryBreakdown" value={formData.salaryBreakdown} onChange={handleChange}>
                  <option>Fixed</option>
                  <option>Variable</option>
                </select>
                <p className="bdm-hint-green">Your total salary has been considered as fixed component</p>
              </div>

              <div className="bdm-field">
                <label>Current location <span>*</span></label>
                <p className="bdm-sub-label">This helps us match you to relevant jobs</p>
                <div className="bdm-radio-group">
                  <label><input type="radio" name="locationType" value="India" checked={formData.locationType === 'India'} onChange={handleChange} /> India</label>
                  <label><input type="radio" name="locationType" value="Outside India" checked={formData.locationType === 'Outside India'} onChange={handleChange} /> Outside India</label>
                </div>
                <div className="bdm-row">
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Dehradun" />
                  <select name="locality" value={formData.locality} onChange={handleChange}>
                    <option>Karanpur</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="bdm-field">
                <label>Mobile number <span>*</span></label>
                <p className="bdm-sub-label">Recruiters will contact you on this number</p>
                <div className="bdm-contact-info">
                  <span>{user?.phone || '9616970788'}</span> <a href="#change">Change Mobile Number</a>
                </div>
              </div>

              <div className="bdm-field">
                <label>Email address <span>*</span></label>
                <p className="bdm-sub-label">We will send relevant jobs and updates to this email</p>
                <div className="bdm-contact-info">
                  <span>{user?.email || 'sudhanshu2246@gmail.com'}</span> <a href="#change">Change Email</a>
                </div>
              </div>

              <div className="bdm-field">
                <label>Notice period <span>*</span></label>
                <p className="bdm-sub-label">Lets recruiters know your availability to join</p>
                <div className="bdm-pills">
                  {['15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months', 'Serving Notice Period'].map(p => (
                    <button key={p} className={`bdm-pill ${formData.noticePeriod === p ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, noticePeriod: p }))}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
        </div>

        <div className="bdm-footer">
          <button className="bdm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="bdm-btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsModal;
