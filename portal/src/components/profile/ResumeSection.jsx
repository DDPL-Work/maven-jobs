import React, { useRef, useState } from 'react';
import { FiDownload, FiTrash2, FiX } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';
import authService from '../../services/authService';
import api from '../../services/api';

const ResumeSection = React.memo(({ user }) => {
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, type: 'error', title: '', message: '', onConfirm: null });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size limit (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setModalState({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'File size must be under 2MB', onConfirm: null });
      return;
    }

    setIsUploading(true);
    try {
      const result = await authService.uploadResume(file);
      if (result.success || result.resume) {
        const updated = result.resume || result.data?.resume;
        if (updated && updateUser) {
          updateUser({ ...user, resume: updated });
        }
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      setModalState({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Failed to upload resume. Please try again.', onConfirm: null });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Resume',
      message: 'Are you sure you want to delete your resume?',
      onConfirm: async () => {
        try {
          await authService.deleteResume();
          if (updateUser) {
            const updatedUser = { ...user };
            delete updatedUser.resume;
            updateUser(updatedUser);
          }
        } catch (err) {
          console.error("Failed to delete resume:", err);
          setModalState({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete resume. Please try again.', onConfirm: null });
        }
      }
    });
  };

  const handleDownload = async () => {
    if (!user?.resume?.url) return;
    try {
      const res = await api.get("/candidate/profile/resume", { responseType: "blob" });
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to load resume securely", err);
      window.open(user.resume.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return `Aug ${new Date().getDate()}, ${new Date().getFullYear()}`;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="ps-card">
      <div className="ps-card-header">
        <h3 className="ps-section-title">Resume</h3>
      </div>
      <div className="ps-resume-body" style={{ marginTop: '16px' }}>
        {user?.resume && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>
                {user.resume.name || "Resume.pdf"}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                Uploaded on {formatDate(user.resume.uploadedAt)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleDownload}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                aria-label="Download resume"
              >
                <FiDownload size={16} />
              </button>
              <button 
                onClick={handleDelete}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                aria-label="Delete resume"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        )}

        <div style={{ 
          border: '1px dashed #cbd5e1', 
          borderRadius: '12px', 
          padding: '24px', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{ 
              background: 'white', 
              border: '1.5px solid #4338ca', 
              color: '#4338ca', 
              padding: '8px 24px', 
              borderRadius: '24px', 
              fontSize: '14px', 
              fontWeight: 600, 
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !isUploading && (e.currentTarget.style.background = '#eff6ff')}
            onMouseLeave={e => !isUploading && (e.currentTarget.style.background = 'white')}
          >
            {isUploading ? "Uploading..." : (user?.resume ? "Update resume" : "Upload resume")}
          </button>
          <div style={{ color: '#64748b', fontSize: '13px' }}>
            Supported Formats: doc, docx, rtf, pdf, upto 2 MB
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".doc,.docx,.rtf,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {modalState.isOpen && (
        <div className="cm-modal-overlay" onClick={() => setModalState({ ...modalState, isOpen: false })}>
          <div className="cm-modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>{modalState.title}</h3>
              <button className="cm-modal-close" onClick={() => setModalState({ ...modalState, isOpen: false })}>
                <FiX size={20} />
              </button>
            </div>
            <div className="cm-modal-body" style={{ padding: "24px 32px" }}>
              <p className="cm-helper-text" style={{ fontSize: '15px', color: '#334155', marginBottom: 0 }}>
                {modalState.message}
              </p>
            </div>
            <div className="cm-modal-footer">
              <button className="cm-btn-cancel" onClick={() => setModalState({ ...modalState, isOpen: false })}>
                {modalState.type === 'confirm' ? 'Cancel' : 'OK'}
              </button>
              {modalState.type === 'confirm' && (
                <button 
                  className="cm-btn-save" 
                  style={{ background: '#ef4444', color: 'white' }}
                  onClick={async () => {
                    setModalState({ ...modalState, isOpen: false });
                    if (modalState.onConfirm) await modalState.onConfirm();
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ResumeSection;
