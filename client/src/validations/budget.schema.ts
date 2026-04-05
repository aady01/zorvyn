import { z } from 'zod/v4';

export const createBudgetSchema = z.object({
  totalBudget: z.number({ error: 'Budget amount is required' }).positive('Budget must be positive'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  teamId: z.string().min(1, 'Team is required'),
});

export const updateBudgetSchema = z.object({
  totalBudget: z.number().positive('Budget must be positive').optional(),
});

export type CreateBudgetFormData = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetFormData = z.infer<typeof updateBudgetSchema>;
