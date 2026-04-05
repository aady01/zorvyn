import { z } from 'zod';

export const createBudgetSchema = z.object({
  totalBudget: z.number().positive('Total budget must be positive'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  teamId: z.string().uuid(),
});

export const updateBudgetSchema = z.object({
  totalBudget: z.number().positive().optional(),
});

export const budgetIdParamSchema = z.object({
  id: z.string().uuid(),
});
