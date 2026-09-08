import { Navigate } from 'react-router-dom';

export default function ProtectedEmployerRoute({ children, fallback = '/employer-login' }) {
  const token =
    localStorage.getItem('employerToken');

  if (!token || token === 'undefined') {
    return <Navigate to={fallback} replace />;
  }

  return children;
}