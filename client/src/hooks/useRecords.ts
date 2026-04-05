import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recordsApi } from '@/api/endpoints/records.api';
import { extractApiError } from '@/api/ky';
import type { RecordQueryParams, CreateRecordDTO, UpdateRecordDTO } from '@/types';

const RECORDS_KEY = 'records';

export function useRecords(params?: RecordQueryParams) {
  return useQuery({
    queryKey: [RECORDS_KEY, params],
    queryFn: () => recordsApi.list(params),
  });
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: [RECORDS_KEY, id],
    queryFn: () => recordsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecordDTO) => recordsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Record created');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordDTO }) =>
      recordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Record updated');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Record deleted');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}
