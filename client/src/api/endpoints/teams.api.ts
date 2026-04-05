import { get, getPaginated, post, put, del } from '@/api/ky';
import type {
  Team,
  PaginationParams,
  CreateTeamDTO,
  UpdateTeamDTO,
} from '@/types';

export const teamsApi = {
  list: (params?: PaginationParams) =>
    getPaginated<Team[]>('teams', params as Record<string, string | number | undefined>),

  getById: (id: string) =>
    get<Team>(`teams/${id}`),

  create: (data: CreateTeamDTO) =>
    post<Team>('teams', data),

  update: (id: string, data: UpdateTeamDTO) =>
    put<Team>(`teams/${id}`, data),

  delete: (id: string) =>
    del<{ message: string }>(`teams/${id}`),
};
