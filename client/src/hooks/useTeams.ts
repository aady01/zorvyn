import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamsApi } from '@/api/endpoints/teams.api';
import { extractApiError } from '@/api/ky';
import type { PaginationParams, CreateTeamDTO, UpdateTeamDTO } from '@/types';

const TEAMS_KEY = 'teams';

export function useTeams(params?: PaginationParams) {
  return useQuery({
    queryKey: [TEAMS_KEY, params],
    queryFn: () => teamsApi.list(params),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: [TEAMS_KEY, id],
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamDTO) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_KEY] });
      toast.success('Team created');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamDTO }) =>
      teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_KEY] });
      toast.success('Team updated');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_KEY] });
      toast.success('Team deleted');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}
