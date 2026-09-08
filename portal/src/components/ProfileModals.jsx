import React, { useState } from 'react';
import { FiX, FiCheck, FiUpload, FiPlus, FiTrash2 } from 'react-icons/fi';
import { LuLoaderCircle } from 'react-icons/lu';

export default function ProfileEditModal({ section, data, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState(data || {});
  const [newSkill, setNewSkill] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleSkillRemove = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const renderContent = () => {
    switch (section) {
      case 'Resume headline':
        return (
          <div className="psm-form">
            <label>Headline</label>
            <textarea
              name="headline"
              value={formData.headline || ''}
              onChange={handleInputChange}
              placeholder="e.g. Senior MERN Stack Developer with 5+ years of experience..."
              rows={5}
            />
            <p className="psm-hint">A brief summary of your professional identity.</p>
          </div>
        );
      case 'Key skills':
        return (
          <div className="psm-form">
            <label>Skills</label>
            <div className="psm-skill-input-row">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Type a skill and press Add"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
              />
              <button type="button" onClick={handleSkillAdd} className="psm-add-btn">Add</button>
            </div>
            <div className="psm-skills-list">
              {(formData.skills || []).map(skill => (
                <span key={skill} className="psm-skill-pill">
                  {skill}
                  <button type="button" onClick={() => handleSkillRemove(skill)}><FiX size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        );
      case 'Profile summary':
        return (
          <div className="psm-form">
            <label>Professional Summary</label>
            <textarea
              name="summary"
              value={formData.summary || ''}
              onChange={handleInputChange}
              placeholder="Tell recruiters about your career path, achievements, and goals..."
              rows={8}
            />
          </div>
        );
      case 'Career profile':
        return (
          <div className="psm-form">
            <div className="psm-form-row">
              <div className="psm-field">
                <label>Expected Salary (CTC)</label>
                <input
                  type="text"
                  name="expectedSalary"
                  value={formData.expectedSalary || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 12 LPA"
                />
              </div>
              <div className="psm-field">
                <label>Preferred Locations</label>
                <input
                  type="text"
                  name="preferredLocations"
                  value={Array.isArray(formData.preferredLocations) ? formData.preferredLocations.join(', ') : formData.preferredLocations || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredLocations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  placeholder="e.g. Bengaluru, Remote"
                />
              </div>
            </div>
          </div>
        );
      case 'Basic Details':
        return (
          <div className="psm-form">
             <div className="psm-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                />
              </div>
              <div className="psm-field">
                <label>Mobile Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="10 digit mobile number"
                />
              </div>
              <div className="psm-field">
                <label>Current City</label>
                <input
                  type="text"
                  name="currentCity"
                  value={formData.currentCity || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Delhi"
                />
              </div>
          </div>
        );
      case 'Employment':
        return (
          <div className="psm-form">
            <div className="psm-field">
              <label>Designation</label>
              <input
                type="text"
                name="currentTitle"
                value={formData.currentTitle || ''}
                onChange={handleInputChange}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="psm-field">
              <label>Company</label>
              <input
                type="text"
                name="currentCompany"
                value={formData.currentCompany || ''}
                onChange={handleInputChange}
                placeholder="e.g. Google India"
              />
            </div>
            <div className="psm-form-row">
              <div className="psm-field">
                <label>Total Experience</label>
                <input
                  type="text"
                  name="totalExperience"
                  value={formData.totalExperience || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 5 Years"
                />
              </div>
              <div className="psm-field">
                <label>Notice Period</label>
                <input
                  type="text"
                  name="noticePeriod"
                  value={formData.noticePeriod || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 30 Days"
                />
              </div>
            </div>
          </div>
        );
      case 'Education':
        return (
          <div className="psm-form">
            <div className="psm-field">
              <label>Education Level</label>
              <input
                type="text"
                name="education"
                value={formData.education || ''}
                onChange={handleInputChange}
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>
          </div>
        );
      case 'IT skills':
        return (
          <div className="psm-form">
            <label>IT Skills</label>
            <textarea
              name="itSkills"
              value={formData.itSkills || ''}
              onChange={handleInputChange}
              placeholder="e.g. VS Code, Docker, AWS, Git..."
              rows={4}
            />
          </div>
        );
      case 'Projects':
        return (
          <div className="psm-form">
            <div className="psm-field">
              <label>Project Title</label>
              <input
                type="text"
                name="projectTitle"
                value={formData.projectTitle || ''}
                onChange={handleInputChange}
                placeholder="e.g. AI-Powered Portfolio Builder"
              />
            </div>
            <div className="psm-field">
              <label>Project Link</label>
              <input
                type="text"
                name="projectLink"
                value={formData.projectLink || ''}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="psm-field">
              <label>Description</label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription || ''}
                onChange={handleInputChange}
                placeholder="Briefly describe what you built..."
                rows={4}
              />
            </div>
          </div>
        );
      default:
        return <div className="psm-empty">Form for {section} coming soon...</div>;
    }
  };

  return (
    <div className="psm-container">
      <div className="psm-body">
        {renderContent()}
        <div className="psm-footer">
          <button className="psm-cancel-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="psm-save-btn" onClick={() => onSave(formData)} disabled={isLoading}>
            {isLoading ? <LuLoaderCircle className="spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
      <style>{`
        .psm-form { display: flex; flex-direction: column; gap: 20px; }
        .psm-field { display: flex; flex-direction: column; gap: 8px; }
        .psm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .psm-skill-input-row { display: flex; gap: 10px; }
        .psm-skill-input-row input { flex: 1; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; }
        .psm-add-btn { padding: 0 20px; background: #143f86; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .psm-skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .psm-skill-pill { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f1f5f9; border-radius: 20px; font-size: 0.9rem; color: #475569; font-weight: 500; }
        .psm-skill-pill button { background: none; border: none; padding: 0; cursor: pointer; color: #94a3b8; display: flex; align-items: center; }
        .psm-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .psm-cancel-btn { padding: 10px 20px; background: none; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; }
        .psm-save-btn { padding: 10px 24px; background: #143f86; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 120px; }
        .psm-save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
