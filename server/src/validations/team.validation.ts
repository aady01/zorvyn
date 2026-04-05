import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const teamIdParamSchema = z.object({
  id: z.string().uuid(),
});
