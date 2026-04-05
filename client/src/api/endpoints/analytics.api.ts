import { get } from '@/api/ky';
import type {
  AnalyticsSummary,
  TeamAnalytics,
  CategoryAnalytics,
  BudgetVsActual,
  TrendData,
  DateRange,
} from '@/types';

export const analyticsApi = {
  getSummary: (range?: DateRange) =>
    get<AnalyticsSummary>('analytics/summary', range as Record<string, string | number | undefined>),

  getByTeam: (range?: DateRange) =>
    get<TeamAnalytics[]>('analytics/by-team', range as Record<string, string | number | undefined>),

  getByCategory: (range?: DateRange) =>
    get<CategoryAnalytics[]>('analytics/by-category', range as Record<string, string | number | undefined>),

  getBudgetVsActual: (range?: DateRange) =>
    get<BudgetVsActual[]>('analytics/budget-vs-actual', range as Record<string, string | number | undefined>),

  getTrends: (range?: DateRange) =>
    get<TrendData[]>('analytics/trends', range as Record<string, string | number | undefined>),
};
