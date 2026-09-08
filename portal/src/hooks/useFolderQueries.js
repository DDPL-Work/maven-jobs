import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';

const folderKeys = {
  all: ['folders'],
  list: (params) => ['folders', 'list', params],
  detail: (id) => ['folders', 'detail', id],
};

export function useFolders(params, enabled = true) {
  return useQuery({
    queryKey: folderKeys.list(params),
    queryFn: async () => {
      const res = await authService.listFolders(params);
      return res.success ? res.data : [];
    },
    enabled,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useFolder(id, enabled = true) {
  return useQuery({
    queryKey: folderKeys.detail(id),
    queryFn: async () => {
      const res = await authService.getFolder(id);
      if (!res.success) throw new Error('Failed to load folder');
      return res.data;
    },
    enabled: Boolean(id) && enabled,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => authService.createFolder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => authService.updateFolder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => authService.deleteFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}

export function useDuplicateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => authService.duplicateFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}

export function useAddCandidateToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, candidateId }) => authService.addCandidateToFolder(folderId, candidateId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: folderKeys.detail(vars.folderId) }),
  });
}

export function useRemoveCandidateFromFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, candidateId }) => authService.removeCandidateFromFolder(folderId, candidateId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: folderKeys.detail(vars.folderId) }),
  });
}

export function useBulkRemoveCandidates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, candidateIds }) => authService.bulkRemoveCandidates(folderId, candidateIds),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: folderKeys.detail(vars.folderId) }),
  });
}

export function useMoveCandidates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => authService.moveCandidates(data.fromFolderId, data.toFolderId, data.candidateIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}

export function useCopyCandidates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => authService.copyCandidates(data.toFolderId, data.candidateIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: folderKeys.all }),
  });
}
