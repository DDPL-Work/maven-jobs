import React, { useState } from 'react';
import { FiMessageSquare, FiShield, FiArrowRight } from 'react-icons/fi';
import ChatModal from './ChatModal';

export default function EliteChatWidget({ followedCompanyIds = [] }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <div className="pd-card" style={{
        padding: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg, #0A1628 0%, #1A3560 50%, #1E5EFF 100%)',
        position: 'relative',
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 160, height: 160,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 120, height: 120,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,94,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '22px 20px 24px', position: 'relative', zIndex: 1 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <FiMessageSquare size={22} style={{ color: '#60A5FA' }} />
          </div>

          {/* Content */}
          <h3 style={{
            fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px',
            lineHeight: 1.3, letterSpacing: '-0.01em',
          }}>
            Elite Recruiter Chat
          </h3>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px',
            lineHeight: 1.6,
          }}>
            Chat directly with recruiters from companies you've followed through the ELITE package.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16,
            fontSize: 11, color: 'rgba(255,255,255,0.45)',
          }}>
            <FiShield size={11} /> Premium feature — included with ELITE
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowChat(true)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)'; }}
          >
            Open Chat <FiArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} followedCompanyIds={followedCompanyIds} />
    </>
  );
}
