import { z } from 'zod';

export const degreeSchema = z.object({
  degreeName: z.string().trim().min(1).max(150),
});
