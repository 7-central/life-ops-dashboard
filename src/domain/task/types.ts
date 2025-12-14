import { z } from 'zod';

export const TaskStatusEnum = z.enum([
  'DRAFT',
  'READY',
  'NOW',
  'NEXT',
  'LATER',
  'SCHEDULED',
  'IN_PROGRESS',
  'DONE',
  'ABANDONED',
]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const DomainAreaEnum = z.enum([
  'WORK',
  'PERSONAL',
  'HEALTH',
  'LEARNING',
  'ADMIN',
  'CREATIVE',
  'SOCIAL',
  'OTHER',
]);
export type DomainArea = z.infer<typeof DomainAreaEnum>;

export const TaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Title is required'),
  domainArea: DomainAreaEnum.nullable(),
  status: TaskStatusEnum,
  dodItems: z.array(z.string()),
  nextAction: z.string().nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  originCaptureItemId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  domainArea: DomainAreaEnum.optional(),
  dodItems: z.array(z.string()).optional().default([]),
  nextAction: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  originCaptureItemId: z.string().cuid().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  domainArea: DomainAreaEnum.optional(),
  dodItems: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
