import { useQuery } from "@tanstack/react-query";
import authService from "../services/authService";
import { queryKeys } from "./queryKeys";

export function useLandingHome(enabled = true) {
  return useQuery({
    queryKey: queryKeys.landing.home,
    queryFn: async () => {
      const res = await authService.getLandingHome();
      if (!res.success) throw new Error("Failed to load landing data");
      return res.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePublicJobs(params, enabled = true) {
  return useQuery({
    queryKey: queryKeys.landing.jobs(params),
    queryFn: async () => {
      const res = await authService.searchPublicJobs(params);
      if (!res.success) throw new Error("Failed to fetch jobs");
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useEmployerLanding(enabled = true) {
  return useQuery({
    queryKey: queryKeys.landing.employer,
    queryFn: async () => {
      const res = await authService.getEmployerLanding();
      if (!res.success) throw new Error("Failed to load employer data");
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePublicCompany(companyId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.landing.company(companyId),
    queryFn: async () => {
      const res = await authService.getPublicCompanyDetail(companyId);
      if (!res.success) throw new Error("Company not found");
      return res.data;
    },
    enabled: Boolean(companyId) && enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
