import React, { useRef, useState, useEffect } from 'react';
import { FiX, FiDownload, FiLoader } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TemplateModernNavy, TemplateMinimalEmerald, TemplateCorporateClassic } from './DynamicResumeTemplates';

export default function CandidateResumeModal({ isOpen, onClose, candidate }) {
  const resumeRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [templateIndex, setTemplateIndex] = useState(0);

  useEffect(() => {
    if (candidate) {
      // Determine template based on name characters so it's consistent for the same candidate
      const charCode = candidate.name.charCodeAt(0) + candidate.name.charCodeAt(candidate.name.length - 1);
      setTemplateIndex(charCode % 3);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);
    try {
      // A4 dimensions in pixels at 96 DPI are roughly 794 x 1123
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
    setIsDownloading(false);
  };

  const renderTemplate = () => {
    switch (templateIndex) {
      case 0: return <TemplateModernNavy candidate={candidate} ref={resumeRef} />;
      case 1: return <TemplateMinimalEmerald candidate={candidate} ref={resumeRef} />;
      case 2: return <TemplateCorporateClassic candidate={candidate} ref={resumeRef} />;
      default: return <TemplateModernNavy candidate={candidate} ref={resumeRef} />;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'rgba(0,10,30,0.7)', backdropFilter: 'blur(8px)',
        padding: '20px'
      }}
      onClick={onClose} // Close when clicking backdrop
    >
      <div 
        style={{
          background: '#f8fafc',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 30px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Candidate Profile</h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{candidate.name} • {candidate.role}</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={downloadPDF}
              disabled={isDownloading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px',
                background: '#10b981', color: '#fff',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 700,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.7 : 1,
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif"
              }}
              onMouseEnter={e => { if (!isDownloading) e.currentTarget.style.background = '#059669' }}
              onMouseLeave={e => { if (!isDownloading) e.currentTarget.style.background = '#10b981' }}
            >
              {isDownloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
              {isDownloading ? 'Generating PDF...' : 'Download Resume'}
            </button>
            <button 
              onClick={onClose}
              style={{
                width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f1f5f9', color: '#64748b',
                border: 'none', borderRadius: '50%',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
          {/* The Wrapper adds a shadow and centers the A4 page visually */}
          <div style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', background: '#fff', width: '794px' }}>
            {renderTemplate()}
          </div>
        </div>
        
        {/* Template Indicator (for debugging/visual clarity) */}
        <div style={{ padding: '12px 30px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            Template Style: {templateIndex === 0 ? 'Modern Navy' : templateIndex === 1 ? 'Minimalist Emerald' : 'Corporate Classic'}
          </div>
        </div>
      </div>
    </div>
  );
}
