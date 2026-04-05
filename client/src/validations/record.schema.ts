import { z } from 'zod/v4';

export const createRecordSchema = z.object({
  amount: z.number({ error: 'Amount is required' }).positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required').max(100),
  notes: z.string().max(500).optional(),
  date: z.string().min(1, 'Date is required'),
  teamId: z.string().min(1, 'Team is required'),
  projectId: z.string().optional(),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
  date: z.string().optional(),
  projectId: z.string().nullable().optional(),
});

export type CreateRecordFormData = z.infer<typeof createRecordSchema>;
export type UpdateRecordFormData = z.infer<typeof updateRecordSchema>;
