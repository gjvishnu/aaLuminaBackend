import { z } from 'zod';

const limit = (defaultValue) => z.coerce.number().int().min(1).max(20).default(defaultValue);

export const studentDashboardQuerySchema = z.object({
  studentId: z.string().uuid(),
  driveLimit: limit(3),
  recommendedLimit: limit(3),
  skillLimit: limit(6),
});
