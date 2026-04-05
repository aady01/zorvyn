import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { budgetsApi } from '@/api/endpoints/budgets.api';
import { extractApiError } from '@/api/ky';
import type { BudgetQueryParams, CreateBudgetDTO, UpdateBudgetDTO } from '@/types';

const BUDGETS_KEY = 'budgets';

export function useBudgets(params?: BudgetQueryParams) {
  return useQuery({
    queryKey: [BUDGETS_KEY, params],
    queryFn: () => budgetsApi.list(params),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudgetDTO) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Budget created');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetDTO }) =>
      budgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Budget updated');
    },
    onError: async (error) => {
      const message = await extractApiError(error);
      toast.error(message);
    },
  });
}
