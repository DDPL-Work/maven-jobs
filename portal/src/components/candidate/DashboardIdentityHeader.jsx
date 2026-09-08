import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiAward, FiCheckCircle, FiInfo } from 'react-icons/fi';

export default function DashboardIdentityHeader({ user }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      frameRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(prev => {
          if (!prev && y > 30) return true;
          if (prev && y < 10) return false;
          return prev;
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (!user) return null;

  return (
    <div className={`hd-identity-bar${scrolled ? ' scrolled' : ''}`}>
      <div className="pd-identity-inner">
        <div className="pd-avatar-wrap">
          <img
            src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="Profile"
            className="pd-big-avatar"
          />
          <div className="pd-avatar-online" />
        </div>

        <div className="pd-identity-info">
          <div className="pd-name-row">
            <h1 className="pd-name">
              {user.membership?.active && user.membership?.plan !== "FREE" && (
                <span className={`pd-membership-badge ${user.membership.plan === "ELITE" ? "elite" : "pro"}`}>
                  <FiAward size={14} />
                  {user.membership.plan}
                </span>
              )}
              {user.name}
              <span className="pd-verified"><FiCheckCircle size={16} /></span>
            </h1>
            <span className="pd-open-badge">
              <span className="pd-status-dot" /> Open to Work
            </span>
          </div>

          <p className="pd-headline">{user.headline || 'Update your headline'}</p>
          <p className="pd-location"><FiMapPin size={12} /> {user.currentCity || "Update your location"}</p>
        </div>


      </div>
    </div>
  );
}
