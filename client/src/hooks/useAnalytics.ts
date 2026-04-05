import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/endpoints/analytics.api';
import type { DateRange } from '@/types';

const ANALYTICS_KEY = 'analytics';

export function useSummary(range?: DateRange) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'summary', range],
    queryFn: () => analyticsApi.getSummary(range),
  });
}

export function useByTeam(range?: DateRange) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'by-team', range],
    queryFn: () => analyticsApi.getByTeam(range),
  });
}

export function useByCategory(range?: DateRange) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'by-category', range],
    queryFn: () => analyticsApi.getByCategory(range),
  });
}

export function useBudgetVsActual(range?: DateRange) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'budget-vs-actual', range],
    queryFn: () => analyticsApi.getBudgetVsActual(range),
  });
}

export function useTrends(range?: DateRange) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'trends', range],
    queryFn: () => analyticsApi.getTrends(range),
  });
}
