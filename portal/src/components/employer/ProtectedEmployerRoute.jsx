import { Navigate } from 'react-router-dom';

export default function ProtectedEmployerRoute({ children, fallback = '/employer-login' }) {
  const userStored = localStorage.getItem('employerUser');

  if (!userStored || userStored === 'undefined') {
    return <Navigate to={fallback} replace />;
  }

  return children;
}