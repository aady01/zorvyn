import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});
