import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../AuthContext';
import notFoundImage from '../../assets/lost.png';
import './NotFoundPage.css';
import LandingEmployeeHeader from '../layout/employer/LandingEmployeeHeader';

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
      <LandingEmployeeHeader solid={true} />
      <div className="not-found-content">
        <div className="not-found-image-wrap">
          <img
            src={notFoundImage}
            alt="Guided Path to the Cozy Hilltop Home"
            className="not-found-image"
          />
        </div>
        <div className="not-found-body">
          <h1 className="not-found-title">I think you are at the wrong place</h1>
          <div className="not-found-actions">
            <button onClick={handleGoHome} className="not-found-button">
              <FiHome size={17} />
              <span>Take Me Home</span>
            </button>
            <button onClick={() => navigate(-1)} className="not-found-back-button">
              <FiArrowLeft size={17} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
