import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export function useEmployerAuth() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('employerUser') || 'null');
      return saved ? { ...saved, companyName: saved.companyName || saved.company || '' } : null;
    } catch {
      return null;
    }
  });

  const token = useMemo(() => localStorage.getItem('employerToken'), []);

  const isAuthenticated = useMemo(() => !!token, [token]);

  const openLogin = useCallback(() => {
    navigate('/employer-login');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('employerToken');
    localStorage.removeItem('employerUser');
    setSession(null);
    navigate('/employer-login');
  }, [navigate]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authService.getEmployerDashboard();
      if (response?.data?.company) {
        const next = {
          ...(session || {}),
          companyName: response.data.company.name || session?.companyName || '',
          email: session?.email || response.data.company.email || '',
          logoUrl: response.data.company.logoUrl || '',
          coverImageUrl: response.data.company.coverImageUrl || '',
          activeJobCount: response.data.tracking?.activeApprovedJobs ?? 0,
          totalApplications: response.data.tracking?.totalApplications ?? 0,
        };
        localStorage.setItem('employerUser', JSON.stringify(next));
        setSession(next);
      }
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    if (!token) return;
    refreshSession();
  }, []);

  const requireAuth = useCallback((redirectTo) => {
    if (!token) {
      navigate(redirectTo || '/employer-login');
      return false;
    }
    return true;
  }, [token, navigate]);

  return { session, token, isAuthenticated, logout, openLogin, refreshSession, requireAuth };
}