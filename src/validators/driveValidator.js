import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
const uuid = z.string().uuid();
const dateValue = z.coerce.date();
const uniqueArray = (schema) =>
  z.array(schema).refine((values) => new Set(values).size === values.length, {
    message: 'Duplicate values are not allowed',
  });

const isValidDateOnly = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const queryDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isValidDateOnly, { message: 'Invalid calendar date' });

export const campusDriveStatuses = [
  'DRAFT',
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
];

export const jobTypes = [
  'FULL_TIME',
  'PART_TIME',
  'INTERNSHIP',
  'CONTRACT',
  'APPRENTICESHIP',
];

export const selectionProcesses = [
  'ONLINE_ASSESSMENT',
  'APTITUDE_TEST',
  'TECHNICAL_TEST',
  'GROUP_DISCUSSION',
  'TECHNICAL_INTERVIEW',
  'HR_INTERVIEW',
  'MANAGERIAL_INTERVIEW',
  'CASE_STUDY',
  'CODING_ROUND',
  'OTHER',
];

const driveTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
  message: 'driveTime must use HH:mm format',
});

const departmentReference = nonEmptyString;

export const driveRoleSchema = z.object({
  jobRole: nonEmptyString,
  jobLocation: nonEmptyString.optional().nullable(),
  jobType: z.enum(jobTypes),
  ctcPackage: nonEmptyString,
  numberOfOpenings: z.number().int().positive(),
  departments: uniqueArray(departmentReference).default([]),
  graduationYears: uniqueArray(z.number().int().min(1900).max(2200)).default([]),
  minimumCgpa: z.number().min(0).max(10).optional().nullable(),
  maximumBacklogs: z.number().int().min(0).optional().nullable(),
  degree: nonEmptyString.optional().nullable(),
  otherCriteria: z.array(nonEmptyString).default([]),
  jobDescription: nonEmptyString,
  jdPdfUrl: z.string().url().optional().nullable(),
  selectionProcesses: uniqueArray(z.enum(selectionProcesses)).default([]),
  skillIds: uniqueArray(uuid).default([]),
});

export const createDriveSchema = z.object({
  companyId: uuid,
  driveDate: dateValue,
  driveTime,
  venue: nonEmptyString,
  registrationEndDate: dateValue.optional().nullable(),
  status: z.enum(campusDriveStatuses).default('DRAFT'),
  roles: z.array(driveRoleSchema).default([]),
});

export const updateDriveSchema = z.object({
  companyId: uuid.optional(),
  driveDate: dateValue.optional(),
  driveTime: driveTime.optional(),
  venue: nonEmptyString.optional(),
  registrationEndDate: dateValue.optional().nullable(),
  status: z.enum(campusDriveStatuses).optional(),
});

export const updateRoleSchema = z.object({
  jobRole: nonEmptyString.optional(),
  jobLocation: nonEmptyString.optional().nullable(),
  jobType: z.enum(jobTypes).optional(),
  ctcPackage: nonEmptyString.optional(),
  numberOfOpenings: z.number().int().positive().optional(),
  departments: uniqueArray(departmentReference).optional(),
  graduationYears: uniqueArray(z.number().int().min(1900).max(2200)).optional(),
  minimumCgpa: z.number().min(0).max(10).optional().nullable(),
  maximumBacklogs: z.number().int().min(0).optional().nullable(),
  degree: nonEmptyString.optional().nullable(),
  otherCriteria: z.array(nonEmptyString).optional(),
  jobDescription: nonEmptyString.optional(),
  jdPdfUrl: z.string().url().optional().nullable(),
  selectionProcesses: uniqueArray(z.enum(selectionProcesses)).optional(),
  skillIds: uniqueArray(uuid).optional(),
});

export const driveQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  companyId: uuid.optional(),
  status: z.enum(campusDriveStatuses).optional(),
  driveDate: queryDate.optional(),
  driveDateFrom: queryDate.optional(),
  driveDateTo: queryDate.optional(),
  jobRole: nonEmptyString.optional(),
  jobType: z.enum(jobTypes).optional(),
});

export const idParamsSchema = z.object({ id: uuid });
export const roleParamsSchema = z.object({
  id: uuid,
  roleId: uuid,
});
