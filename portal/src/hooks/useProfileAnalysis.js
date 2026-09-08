import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';

export function useProfileAnalysis(userId, enabled) {
  return useQuery({
    queryKey: ['candidate', 'profile-analysis', userId],
    queryFn: async () => {
      const res = await authService.analyzeProfileWithAI();
      return res.success ? res.data : null;
    },
    enabled: Boolean(userId && enabled),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}