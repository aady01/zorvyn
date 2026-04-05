import { getPaginated, post, put } from '@/api/ky';
import type {
  Budget,
  BudgetQueryParams,
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from '@/types';

export const budgetsApi = {
  list: (params?: BudgetQueryParams) =>
    getPaginated<Budget[]>('budgets', params as Record<string, string | number | undefined>),

  create: (data: CreateBudgetDTO) =>
    post<Budget>('budgets', data),

  update: (id: string, data: UpdateBudgetDTO) =>
    put<Budget>(`budgets/${id}`, data),
};
