import { Navigate } from 'react-router-dom';
import AccessDenied from './AccessDenied';

export default function ProtectedEmployerRoute({ children, fallback = '/employer-login', requiredPermission }) {
  const userStored = localStorage.getItem('employerUser');

  if (!userStored || userStored === 'undefined') {
    return <Navigate to={fallback} replace />;
  }

  const user = JSON.parse(userStored);

  if (user.role === 'RECRUITER' && requiredPermission) {
    const hasPermission = user.permissions && user.permissions[requiredPermission] === true;
    if (!hasPermission) {
      return <AccessDenied superUserEmail={user.superUserEmail} requiredPermission={requiredPermission} />;
    }
  }

  return children;
}