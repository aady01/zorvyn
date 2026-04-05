import { get, getPaginated, post, put, del } from '@/api/ky';
import type {
  User,
  PaginationParams,
  CreateUserDTO,
  UpdateUserDTO,
} from '@/types';

export const usersApi = {
  list: (params?: PaginationParams) =>
    getPaginated<User[]>('users', params as Record<string, string | number | undefined>),

  getById: (id: string) =>
    get<User>(`users/${id}`),

  create: (data: CreateUserDTO) =>
    post<User>('users', data),

  update: (id: string, data: UpdateUserDTO) =>
    put<User>(`users/${id}`, data),

  delete: (id: string) =>
    del<{ message: string }>(`users/${id}`),
};
