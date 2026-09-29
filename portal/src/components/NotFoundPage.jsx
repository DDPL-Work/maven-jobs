import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      if (user.role === 'CANDIDATE') {
        navigate('/dashboard');
      } else if (['RECRUITER', 'CLIENT', 'ADMIN'].includes(user.role)) {
        navigate('/employer-dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">I think you are at the wrong place</h2>
        <p className="not-found-text">
          Let me take you to home.
        </p>
        <button onClick={handleGoHome} className="not-found-button">
          Take Me Home
        </button>
      </div>
    </div>
  );
}
