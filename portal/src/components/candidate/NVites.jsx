import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import mailIcon from '../../../assets/mailIcon.png';

export default function NVites({ nvites = [] }) {
  const displayList = nvites.slice(0, 3);

  return (
    <div className="pd-card pd-nvites-card">
      <Link to="/mivites" className="pd-nvites-left" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="pd-nvites-icon-custom">
          <img src={mailIcon} alt="Mail Icon" />
        </div>
        <h3 className="pd-nvites-title">MIvites: Invitation<br />to apply</h3>
        <span className="pd-nvites-view-all">View all</span>
      </Link>
      <div className="pd-nvites-list">
        {displayList.length > 0 ? displayList.map(inv => (
          <Link to="/mivites" className="pd-nvite-row" key={inv.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="pd-nvite-logo-wrap">
              {inv.logoUrl ? (
                <img src={inv.logoUrl} alt="" className="pd-nvite-logo-img" />
              ) : (

                <div className="pd-nvite-logo" style={{ background: inv.bg, color: inv.col }}>{inv.code}</div>
              )}
            </div>
            <div className="pd-nvite-info">
              <div className="pd-nvite-title-main">{inv.title}</div>
              <div className="pd-nvite-company">{inv.company}</div>
            </div>
            <div className="pd-nvite-time">
              {inv.ago.toLowerCase().includes('invited') ? inv.ago : `Invited ${inv.ago}`}
            </div>
          </Link>
        )) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No invitations at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
