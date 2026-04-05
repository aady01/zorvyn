import { get, getPaginated, post, put, del } from '@/api/ky';
import type {
  FinancialRecord,
  RecordQueryParams,
  CreateRecordDTO,
  UpdateRecordDTO,
} from '@/types';

export const recordsApi = {
  list: (params?: RecordQueryParams) =>
    getPaginated<FinancialRecord[]>('records', params as Record<string, string | number | undefined>),

  getById: (id: string) =>
    get<FinancialRecord>(`records/${id}`),

  create: (data: CreateRecordDTO) =>
    post<FinancialRecord>('records', data),

  update: (id: string, data: UpdateRecordDTO) =>
    put<FinancialRecord>(`records/${id}`, data),

  delete: (id: string) =>
    del<{ message: string }>(`records/${id}`),
};
