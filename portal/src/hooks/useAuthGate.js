import { useMemo } from 'react';
import { useAuth } from '../AuthContext';

export function useAuthGate() {
  const { user, openLogin } = useAuth();

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isCandidate = useMemo(() => user?.role === 'CANDIDATE', [user]);
  const isEmployer = useMemo(() => user?.role === 'CLIENT', [user]);
  const isGuest = useMemo(() => !user, [user]);

  const requireAuth = (callback) => {
    if (isGuest) {
      openLogin();
      return false;
    }
    return callback ? callback() : true;
  };

  return { user, isAuthenticated, isCandidate, isEmployer, isGuest, openLogin, requireAuth };
}