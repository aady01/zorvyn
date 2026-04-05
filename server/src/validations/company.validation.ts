import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  industry: z.string().max(100).optional(),
});
