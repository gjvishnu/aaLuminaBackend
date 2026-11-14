import { z } from 'zod';
import { jobTypes } from './driveValidator.js';

const uuid = z.string().uuid();
const optionalText = z.string().trim().min(1).max(150).optional();

export const jobSortOptions = ['newest', 'applyBy', 'match'];

export const jobListQuerySchema = z.object({
  studentId: uuid,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: optionalText,
  companyId: uuid.optional(),
  jobRole: optionalText,
  jobLocation: optionalText,
  jobType: z.enum(jobTypes).optional(),
  sortBy: z.enum(jobSortOptions).default('newest'),
});

export const jobDetailQuerySchema = z.object({ studentId: uuid });

export const jobParamsSchema = z.object({ roleId: uuid });
