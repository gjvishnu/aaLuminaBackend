import { z } from 'zod';

const uuid = z.string().uuid();

export const applicationStatuses = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'REJECTED',
  'SELECTED',
  'WITHDRAWN',
];

export const applicationListQuerySchema = z.object({
  studentId: uuid,
  status: z.enum(applicationStatuses).optional(),
  search: z.string().trim().min(1).max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createApplicationSchema = z.object({
  studentId: uuid,
  roleId: uuid,
});
