import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiMonitor, FiEdit2, FiTrash2, FiPlus, FiX, FiUploadCloud, FiFolder, FiExternalLink, FiChevronDown } from 'react-icons/fi';
import authService from "../../services/authService";
import '../../pages/candidates/features/dashboard/Components/ProfileDashboard/BasicDetailsModal.css';
import CustomSelect from '../common/CustomSelect';

const emptyProject = () => ({
  id: Date.now() + Math.random(),
  isNew: true,
  title: '',
  tag: '',
  client: '',
  status: 'In progress',
  workedFromYear: '',
  workedFromMonth: '',
  workedTillYear: '',
  workedTillMonth: '',
  projectLocation: '',
  projectSite: '',
  employmentNature: '',
  teamSize: '',
  role: '',
  roleDescription: '',
  skillsUsedText: '',
  link: '',
  description: '',
  skills: [],
  media: [],
});

const ProjectCard = React.memo(({ project, palette, onEdit, onDelete, editing, onSaveItem, onCancel, tagOptions }) => {
  const [expanded, setExpanded] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [f, setF] = useState({ 
    ...project, 
    tag: project.tag || '',
    client: project.client || '',
    status: project.status || 'In progress',
    workedFromYear: project.workedFromYear || '',
    workedFromMonth: project.workedFromMonth || '',
    workedTillYear: project.workedTillYear || '',
    workedTillMonth: project.workedTillMonth || '',
    projectLocation: project.projectLocation || '',
    projectSite: project.projectSite || '',
    employmentNature: project.employmentNature || '',
    teamSize: project.teamSize || '',
    role: project.role || '',
    roleDescription: project.roleDescription || '',
    skillsUsedText: project.skillsUsedText || '',
    skills: [...(project.skills || [])], 
    media: [...(project.media || [])] 
  });
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setF({ 
        ...project, 
        tag: project.tag || '',
        client: project.client || '',
        status: project.status || 'In progress',
        workedFromYear: project.workedFromYear || '',
        workedFromMonth: project.workedFromMonth || '',
        workedTillYear: project.workedTillYear || '',
        workedTillMonth: project.workedTillMonth || '',
        projectLocation: project.projectLocation || '',
        projectSite: project.projectSite || '',
        employmentNature: project.employmentNature || '',
        teamSize: project.teamSize || '',
        role: project.role || '',
        roleDescription: project.roleDescription || '',
        skillsUsedText: project.skillsUsedText || '',
        skills: [...(project.skills || [])], 
        media: [...(project.media || [])] 
      });
      setShowMoreDetails(false);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [editing, project]);

  const handleAddSkill = useCallback(() => {
    const s = newSkill.trim();
    if (!s || f.skills.includes(s)) return;
    setF(p => ({ ...p, skills: [...p.skills, s] }));
    setNewSkill('');
  }, [newSkill, f.skills]);

  const handleRemoveSkill = useCallback((name) => {
    setF(p => ({ ...p, skills: p.skills.filter(x => x !== name) }));
  }, []);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await authService.uploadProjectMedia(fd, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      if (res?.success && res?.data) {
        setF(p => ({ ...p, media: [...p.media, res.data] }));
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleRemoveMedia = useCallback((idx) => {
    setF(p => ({ ...p, media: p.media.filter((_, i) => i !== idx) }));
  }, []);

  if (editing) {
    return (
      <div className="bdm-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
        <div className="bdm-container" onClick={e => e.stopPropagation()} style={{ width: '700px' }}>
          <div className="bdm-header">
            <div className="bdm-title-row">
              <h2 className="bdm-title">Project</h2>
              <button className="bdm-close" onClick={onCancel}><FiX size={20} /></button>
            </div>
          </div>
          
          <div className="bdm-body">
            <p className="bdm-sub-label" style={{ marginTop: '-12px', marginBottom: '24px' }}>Stand out for employers by adding details about projects you have done in college, internships, or at work</p>
            
            <div className="bdm-form">
              <div className="bdm-field">
                <label>Project title <span>*</span></label>
                <input ref={titleRef} value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Enter project title" required />
              </div>

              <div className="bdm-field">
                <label>Tag this project with your employment/education</label>
                <CustomSelect 
                  value={f.tag} 
                  onChange={e => setF(p => ({ ...p, tag: e.target.value }))}
                  placeholder="Select employment/education"
                  options={(tagOptions || []).map(opt => ({ label: opt, value: opt }))}
                />
              </div>

              <div className="bdm-field">
                <label>Client <span>*</span></label>
                <input value={f.client} onChange={e => setF(p => ({ ...p, client: e.target.value }))} placeholder="Enter client name" />
              </div>

              <div className="bdm-field">
                <label>Project status</label>
                <div className="bdm-radio-group">
                  <label>
                    <input type="radio" name="projStatus" checked={f.status === 'In progress'} onChange={() => setF(p => ({ ...p, status: 'In progress' }))} /> In progress
                  </label>
                  <label>
                    <input type="radio" name="projStatus" checked={f.status === 'Finished'} onChange={() => setF(p => ({ ...p, status: 'Finished' }))} /> Finished
                  </label>
                </div>
              </div>

              <div className="bdm-field">
                <label>Worked from <span>*</span></label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <CustomSelect 
                    value={f.workedFromYear} 
                    onChange={e => setF(p => ({ ...p, workedFromYear: e.target.value }))}
                    placeholder="Select year"
                    options={[...Array(30)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                  />
                  <CustomSelect 
                    value={f.workedFromMonth} 
                    onChange={e => setF(p => ({ ...p, workedFromMonth: e.target.value }))}
                    placeholder="Select month"
                    options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                  />
                </div>
              </div>

              {f.status === 'Finished' && (
                <div className="bdm-field">
                  <label>Worked till <span>*</span></label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <CustomSelect 
                      value={f.workedTillYear} 
                      onChange={e => setF(p => ({ ...p, workedTillYear: e.target.value }))}
                      placeholder="Select year"
                      options={[...Array(30)].map((_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                    />
                    <CustomSelect 
                      value={f.workedTillMonth} 
                      onChange={e => setF(p => ({ ...p, workedTillMonth: e.target.value }))}
                      placeholder="Select month"
                      options={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ label: m, value: m }))}
                    />
                  </div>
                </div>
              )}

              <div className="bdm-field">
                <label>Details of project <span>*</span></label>
                <div style={{ border: '1px solid var(--slate-3)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--slate-3)', background: '#F8FAFC' }}>
                    <button style={{ background: 'white', border: '1px solid #E2E8F0', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      👑 Write with AI
                    </button>
                  </div>
                  <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} placeholder="Enter your project details..." rows={5} style={{ width: '100%', border: 'none', padding: '12px', outline: 'none', resize: 'vertical' }} />
                </div>
                <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '4px' }}>{f.description?.length || 0}/1000</p>
              </div>

              <button onClick={() => setShowMoreDetails(!showMoreDetails)} style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                {showMoreDetails ? 'Show less details' : 'Add more details'}
              </button>

              {showMoreDetails && (
                <>
                  <div className="bdm-field">
                    <label>Project location</label>
                    <input value={f.projectLocation} onChange={e => setF(p => ({ ...p, projectLocation: e.target.value }))} placeholder="Enter project location" />
                  </div>

                  <div className="bdm-field">
                    <label>Project site</label>
                    <div className="bdm-radio-group">
                      <label>
                        <input type="radio" name="projectSite" checked={f.projectSite === 'Offsite'} onChange={() => setF(p => ({ ...p, projectSite: 'Offsite' }))} /> Offsite
                      </label>
                      <label>
                        <input type="radio" name="projectSite" checked={f.projectSite === 'Onsite'} onChange={() => setF(p => ({ ...p, projectSite: 'Onsite' }))} /> Onsite
                      </label>
                    </div>
                  </div>

                  <div className="bdm-field">
                    <label>Nature of employment</label>
                    <div className="bdm-radio-group">
                      <label>
                        <input type="radio" name="employmentNature" checked={f.employmentNature === 'Full time'} onChange={() => setF(p => ({ ...p, employmentNature: 'Full time' }))} /> Full time
                      </label>
                      <label>
                        <input type="radio" name="employmentNature" checked={f.employmentNature === 'Part time'} onChange={() => setF(p => ({ ...p, employmentNature: 'Part time' }))} /> Part time
                      </label>
                      <label>
                        <input type="radio" name="employmentNature" checked={f.employmentNature === 'Contractual'} onChange={() => setF(p => ({ ...p, employmentNature: 'Contractual' }))} /> Contractual
                      </label>
                    </div>
                  </div>

                  <div className="bdm-field">
                    <label>Team size</label>
                    <CustomSelect 
                      value={f.teamSize} 
                      onChange={e => setF(p => ({ ...p, teamSize: e.target.value }))}
                      placeholder="Select team size"
                      options={[...Array(30)].map((_, i) => ({ label: String(i+1), value: String(i+1) }))}
                    />
                  </div>

                  <div className="bdm-field">
                    <label>Role</label>
                    <CustomSelect 
                      value={f.role} 
                      onChange={e => setF(p => ({ ...p, role: e.target.value }))}
                      placeholder="Select role"
                      options={['Domain Expert', 'Sr. Project Leader', 'Solution Architect', 'Quality Analyst', 'Database Architect / DBA', 'Network / System Administrator', 'Project Leader', 'Module Leader', 'Sr. Programmer', 'Programmer', 'Test Engineer', 'Other'].map(r => ({ label: r, value: r }))}
                    />
                  </div>

                  <div className="bdm-field">
                    <label>Role description</label>
                    <textarea value={f.roleDescription} onChange={e => setF(p => ({ ...p, roleDescription: e.target.value }))} placeholder="Type here..." rows={4} />
                    <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '4px' }}>{250 - (f.roleDescription?.length || 0)} character(s) left</p>
                  </div>

                  <div className="bdm-field">
                    <label>Skills used</label>
                    <input value={f.skillsUsedText} onChange={e => setF(p => ({ ...p, skillsUsedText: e.target.value }))} placeholder="Enter skills used" />
                    <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '4px' }}>{500 - (f.skillsUsedText?.length || 0)} character(s) left</p>
                  </div>

                  <div className="bdm-field">
                    <label>Link (optional)</label>
                    <input value={f.link} onChange={e => setF(p => ({ ...p, link: e.target.value }))} placeholder="https://github.com/..." />
                  </div>

                  <div className="bdm-field">
                    <label>Skills Used</label>
                    <div className="ps-skills-grid" style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {f.skills.map(s => (
                        <span key={s} className="ps-skill-chip" style={{ background: '#F8FAFC', color: 'var(--navy)', border: '1px solid var(--slate-4)', borderRadius: '20px', padding: '6px 10px 6px 14px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {s}
                          <button onClick={() => handleRemoveSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}><FiX size={14} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="ps-add-skill-row" style={{ display: 'flex', gap: 12 }}>
                      <input style={{ flex: 1 }} value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }} />
                      <button className="ps-btn ps-btn-primary" onClick={handleAddSkill} style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}><FiPlus size={14} /> Add</button>
                    </div>
                  </div>

                  <div className="bdm-field">
                    <label>Media (screenshots)</label>
                    <div className="ps-project-media-grid" style={{ marginTop: 8 }}>
                      {f.media.map((m, i) => (
                        <div key={m.publicId || i} className="ps-project-media-thumb">
                          <img src={m.url} alt="" />
                          <button className="ps-project-media-remove" onClick={() => handleRemoveMedia(i)}><FiXCircle size={16} /></button>
                        </div>
                      ))}
                      <label className={`ps-project-media-add ${uploading ? 'ps-project-media-uploading' : ''}`}>
                        {uploading ? (
                          <div className="ps-project-media-upload-progress">
                            <FiLoader size={20} className="ps-spin" />
                            <span>{uploadProgress}%</span>
                          </div>
                        ) : (
                          <>
                            <FiImage size={20} />
                            <span>Add Image</span>
                          </>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) { handleUpload(file); e.target.value = ''; } }} />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
          <div className="bdm-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '24px 32px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="bdm-btn-cancel" onClick={onCancel} style={{ border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.95rem', background: 'none' }}>Cancel</button>
              <button className="bdm-btn-save" onClick={() => f.title.trim() && onSaveItem(f)} disabled={!f.title.trim()} style={{ background: f.title.trim() ? 'var(--blue)' : 'var(--slate-3)', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, fontSize: '0.95rem', cursor: f.title.trim() ? 'pointer' : 'not-allowed' }}>Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-project-item">
      <div className="ps-project-icon">
        <FiFolder size={18} />
      </div>
      <div className="ps-project-body">
        <div className="ps-project-title-row">
          <div>
            <h4 className="ps-project-name">{project.title}</h4>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="ps-project-link">
                <FiExternalLink size={12} /> {project.link}
              </a>
            )}
          </div>
          <div className="ps-project-actions">
            <button className="ps-icon-btn" onClick={onEdit} aria-label="Edit"><FiEdit2 size={13} /></button>
            <button className="ps-icon-btn ps-icon-btn-danger" onClick={onDelete} aria-label="Delete"><FiTrash2 size={13} /></button>
          </div>
        </div>
        {project.description && (
          <div className="ps-project-desc-wrap">
            <p className="ps-project-desc">{expanded ? project.description : project.description.length > 200 ? project.description.slice(0, 200) + '...' : project.description}</p>
            {project.description.length > 200 && (
              <button className="ps-see-more" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Show less' : 'See more'} <FiChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}
          </div>
        )}
        {project.skills?.length > 0 && (
          <div className="ps-project-skills">
            {project.skills.map(s => (
              <span key={s} className="ps-skill-chip-sm">{s}</span>
            ))}
          </div>
        )}
        {project.media?.length > 0 && (
          <div className="ps-project-media-grid">
            {project.media.map((m, i) => (
              <div key={m.publicId || i} className="ps-project-media-thumb">
                <img src={m.url} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const ProjectsSection = React.memo(({ user, onEdit, onSave }) => {
  const [projects, setProjects] = useState([]);
  const [editIdx, setEditIdx] = useState(null);

  const raw = user?.projects;
  const parsed = Array.isArray(raw) ? raw : [];
  
  const workExps = Array.isArray(user?.workExperiences) ? user.workExperiences : [];
  const educations = Array.isArray(user?.education) ? user.education : [];
  
  const tagOptions = [
    ...workExps.map(exp => [exp.jobTitle, exp.company].filter(Boolean).join(' - ') + (exp.location ? `, ${exp.location}` : '')),
    ...educations.map(edu => {
      if (edu.educationLevel === 'Class X' || edu.educationLevel === 'Class XII') return edu.educationLevel;
      return [edu.educationLevel, edu.degree || edu.field].filter(Boolean).join(' - ');
    })
  ].filter(Boolean);

  useEffect(() => {
    if (parsed.length) setProjects(parsed);
    else if (user?.projectTitle) setProjects([{ id: Date.now(), title: user.projectTitle, link: user.projectLink || '', description: user.projectDescription || '', skills: [], media: [] }]);
    else setProjects([]);
  }, [user?.projects, user?.projectTitle, user?.projectLink, user?.projectDescription]);

  const persist = async (next) => {
    const prev = projects;
    setProjects(next);
    setEditIdx(null);
    const result = await onSave({ projects: JSON.stringify(next) });
    if (!result || !result.success) setProjects(prev);
  };

  const handleAdd = () => {
    setProjects(prev => [...prev, emptyProject()]);
    setEditIdx(projects.length);
  };

  const handleSaveItem = (data) => {
    if (!data.title.trim()) return;
    const next = [...projects];
    const dataToSave = { ...data };
    delete dataToSave.isNew;
    if (editIdx !== null && editIdx < next.length) {
      next[editIdx] = { ...dataToSave, id: next[editIdx]?.id || Date.now() + Math.random() };
    } else {
      next.push({ ...dataToSave, id: Date.now() + Math.random() });
    }
    persist(next);
  };

  const handleCancel = () => {
    setProjects(prev => prev.filter(p => !p.isNew));
    setEditIdx(null);
  };

  const handleDelete = (idx) => {
    persist(projects.filter((_, i) => i !== idx));
  };

  const isEmpty = !projects.length && !user?.projectTitle;

  if (isEmpty && editIdx === null) {
    return (
      <div className="ps-card ps-add-card" onClick={handleAdd} style={{ cursor: 'pointer' }}>
        <div className="ps-card-header">
          <h3 className="ps-section-title">Projects</h3>
        </div>
        <div className="ps-add-placeholder">
          <FiFolder size={14} />
          <span>Add your projects</span>
        </div>
      </div>
    );
  }

  const display = projects.length ? projects : parsed;

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Projects</h3>
        {editIdx === null && (
          <button className="ps-edit-btn" onClick={handleAdd} aria-label="Add project" title="Add project">
            <FiPlus size={16} />
          </button>
        )}
      </div>
      <div className="ps-project-list">
        {display.map((proj, i) => (
          <ProjectCard
            key={proj.id || i}
            project={proj}
            editing={editIdx === i}
            onEdit={() => setEditIdx(i)}
            onDelete={() => handleDelete(i)}
            onSaveItem={handleSaveItem}
            onCancel={handleCancel}
            tagOptions={tagOptions}
          />
        ))}
        {editIdx === null && display.length > 0 && (
          <button className="ps-add-exp-btn" onClick={handleAdd}>
            <FiPlus size={14} /> Add another project
          </button>
        )}
      </div>
    </div>
  );
});

export default ProjectsSection;
