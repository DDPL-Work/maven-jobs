import { useMutation, useQueryClient } from "@tanstack/react-query";
import authService from "../services/authService";
import { queryKeys } from "./queryKeys";

export function useSaveJob(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, save }) => {
      const res = await authService.saveJob(jobId, save);
      if (!res.success) throw new Error("Failed to save job");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "jobs", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "savedJobs", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard", userId] });
    },
  });
}

export function useCreateApplication(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationData) => {
      const res = await authService.createApplication(applicationData);
      if (!res.success) throw new Error("Application failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "applications", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "jobs", userId] });
    },
  });
}

export function useFollowCompany(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, follow }) => {
      const res = await authService.followCompany(companyId, follow);
      if (!res.success) throw new Error("Failed to update follow");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "company"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "companies"] });
    },
  });
}

export function useUpdateProfile(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileData) => {
      const res = await authService.updateProfile(profileData);
      if (!res.success) throw new Error("Profile update failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard", userId] });
    },
  });
}

export function useUploadResume(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const res = await authService.uploadResume(file);
      if (!res.success) throw new Error("Resume upload failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile", userId] });
    },
  });
}

export function useSubmitCompanyReview(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, payload }) => {
      const res = await authService.submitCompanyReview(companyId, payload);
      if (!res.success) throw new Error("Review submission failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "company"] });
    },
  });
}

export function useMarkNotificationRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId) => {
      const res = await authService.markCandidateNotificationRead(notificationId);
      if (!res.success) throw new Error("Failed to mark notification");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications", userId] });
    },
  });
}

export function useCandidateQuizSubmit(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers) => {
      const res = await authService.submitTodayQuiz(answers);
      if (!res.success) throw new Error("Quiz submission failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "quizToday"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "quizRanking"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard", userId] });
    },
  });
}
