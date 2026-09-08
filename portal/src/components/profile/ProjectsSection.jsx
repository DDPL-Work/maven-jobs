import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiEdit2, FiFolder, FiExternalLink, FiCheck, FiX, FiPlus, FiTrash2, FiImage, FiXCircle, FiLoader, FiChevronDown } from 'react-icons/fi';
import authService from '../../services/authService';

const emptyProject = () => ({
  id: Date.now() + Math.random(),
  title: '',
  link: '',
  description: '',
  skills: [],
  media: [],
});

const ProjectCard = React.memo(({ project, palette, onEdit, onDelete, editing, onSaveItem, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const [f, setF] = useState({ ...project, skills: [...(project.skills || [])], media: [...(project.media || [])] });
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setF({ ...project, skills: [...(project.skills || [])], media: [...(project.media || [])] });
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
      <div className="ps-project-edit">
        <div className="ps-field">
          <label className="ps-label">Project Title *</label>
          <input ref={titleRef} className="ps-input" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="e.g. E-Commerce Platform" required />
        </div>
        <div className="ps-field">
          <label className="ps-label">Link (optional)</label>
          <input className="ps-input" value={f.link} onChange={e => setF(p => ({ ...p, link: e.target.value }))} placeholder="https://github.com/..." />
        </div>
        <div className="ps-field">
          <label className="ps-label">Description</label>
          <textarea className="ps-textarea" value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} placeholder="Describe your project..." rows={3} />
        </div>
        <div className="ps-field">
          <label className="ps-label">Skills Used</label>
          <div className="ps-skills-grid" style={{ marginBottom: 8 }}>
            {f.skills.map(s => (
              <span key={s} className="ps-skill-chip" style={{ paddingRight: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {s}
                <button onClick={() => handleRemoveSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', lineHeight: 1 }}><FiX size={12} /></button>
              </span>
            ))}
          </div>
          <div className="ps-add-skill-row">
            <input className="ps-input" style={{ flex: 1 }} value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }} />
            <button className="ps-btn ps-btn-primary" onClick={handleAddSkill}><FiPlus size={14} /> Add</button>
          </div>
        </div>
        <div className="ps-field">
          <label className="ps-label">Media (screenshots)</label>
          <div className="ps-project-media-grid">
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
        <div className="ps-edit-actions">
          <button className="ps-btn ps-btn-primary" onClick={() => f.title.trim() && onSaveItem(f)} disabled={!f.title.trim()}>
            <FiCheck size={14} /> Save
          </button>
          <button className="ps-btn ps-btn-ghost" onClick={onCancel}><FiX size={14} /> Cancel</button>
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
    if (editIdx !== null) {
      next[editIdx] = { ...data, id: next[editIdx]?.id || Date.now() + Math.random() };
    } else {
      next.push({ ...data, id: Date.now() + Math.random() });
    }
    persist(next);
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
            onCancel={() => { setEditIdx(null); if (editIdx === projects.length - 1 && projects.length > parsed.length) setProjects(prev => prev.slice(0, -1)); }}
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
