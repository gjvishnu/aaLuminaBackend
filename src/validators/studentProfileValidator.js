import { z } from 'zod';

const uuid = z.string().uuid();
const text = (max) => z.string().trim().min(1).max(max);
const description = z.string().trim().min(1);

export const studentParamsSchema = z.object({ studentId: uuid });
export const studentItemParamsSchema = z.object({ studentId: uuid, id: uuid });
export const studentSkillParamsSchema = z.object({ studentId: uuid, skillId: uuid });

export const addStudentSkillSchema = z.object({ skillId: uuid });
export const replaceStudentSkillsSchema = z.object({ skillIds: z.array(uuid) });

export const internshipSchema = z
  .object({
    title: text(150),
    companyName: text(150),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    description,
    isVerified: z.boolean().optional(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    path: ['endDate'],
    message: 'endDate cannot be before startDate',
  });

export const projectSchema = z.object({
  title: text(150),
  projectType: text(100),
  description,
  technologies: z.array(uuid).default([]),
});
