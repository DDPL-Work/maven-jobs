import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import authService from "../services/authService";
import { queryKeys } from "./queryKeys";

export function useDashboard(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.dashboard(userId),
    queryFn: async () => {
      const res = await authService.getDashboard();
      if (!res.success) throw new Error("Failed to load dashboard");
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCandidateProfile(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.profile(userId),
    queryFn: async () => {
      const res = await authService.getCandidateProfile();
      return res.success ? res.data : null;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCandidateJobs(userId, params, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.jobs(userId, params),
    queryFn: async () => {
      const res = await authService.getJobs(params);
      return res.success ? res.data : { jobs: [], total: 0, totalPages: 1 };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCandidateJob(jobId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.job(jobId),
    queryFn: async () => {
      const res = await authService.getJobDetail(jobId);
      if (!res.success) throw new Error("Job not found");
      return res.data;
    },
    enabled: Boolean(jobId) && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCandidateSavedJobs(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.savedJobs(userId),
    queryFn: async () => {
      const res = await authService.getSavedJobs();
      return res.success ? res.data : [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCandidateApplications(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.applications(userId),
    queryFn: async () => {
      const res = await authService.getApplications();
      return res.success ? res.data : [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCandidateNotifications(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.notifications(userId),
    queryFn: async () => {
      const res = await authService.getCandidateNotifications();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  });
}

export function useCandidateChats(userId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.chats(userId),
    queryFn: async () => {
      const res = await authService.getCandidateChats();
      return res?.data?.threads || [];
    },
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCandidateCompanies(params, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.companies(params),
    queryFn: async () => {
      const res = await authService.getCompanies(params);
      return res.success ? res.data : { companies: [], total: 0, totalPages: 1 };
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCandidateCompany(companyId, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.company(companyId),
    queryFn: async () => {
      const res = await authService.getCompanyDetail(companyId);
      return res.success ? res.data : null;
    },
    enabled: Boolean(companyId) && enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCompanyStats(params, enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.companyStats(params),
    queryFn: async () => {
      const res = await authService.getCompanyStats(params);
      return res.success ? res.data : [];
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCompanyFilterOptions(enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.companyFilterOptions,
    queryFn: async () => {
      const res = await authService.getCompanyFilterOptions();
      return res.success ? res.data : {};
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useQuizRanking(enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.quizRanking,
    queryFn: async () => {
      const res = await authService.getQuizRanking();
      return res.success ? res.data : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuizToday(enabled) {
  return useQuery({
    queryKey: queryKeys.candidate.quizToday,
    queryFn: async () => {
      const res = await authService.getTodayQuiz();
      return res.success ? res.data : null;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePublishedBlogs(params = {}) {
  return useQuery({
    queryKey: queryKeys.blog.published(params),
    queryFn: async () => {
      const res = await authService.getPublishedBlogs({ limit: 8, page: 1, ...params });
      return {
        blogs: Array.isArray(res?.data) ? res.data : [],
        pagination: res?.pagination || null,
      };
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: queryKeys.blog.categories,
    queryFn: async () => {
      const res = await authService.getBlogCategories();
      return res.success ? res.data : [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useBlogBySlug(slug) {
  return useQuery({
    queryKey: queryKeys.blog.slug(slug),
    queryFn: async () => {
      const res = await authService.getBlogBySlug(slug);
      return res.success ? res.data : null;
    },
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
