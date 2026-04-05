import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamId: z.string().uuid().optional(),
});
