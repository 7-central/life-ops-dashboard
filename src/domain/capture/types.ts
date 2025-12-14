import { z } from 'zod';

export const CaptureStatusEnum = z.enum(['UNPROCESSED', 'PROCESSED', 'PARKED', 'DELETED']);
export type CaptureStatus = z.infer<typeof CaptureStatusEnum>;

export const CaptureItemSchema = z.object({
  id: z.string().cuid(),
  rawText: z.string().min(1, 'Capture text cannot be empty'),
  capturedAt: z.date(),
  status: CaptureStatusEnum,
  source: z.string().default('manual'),
});

export type CaptureItem = z.infer<typeof CaptureItemSchema>;

export const CreateCaptureItemSchema = z.object({
  rawText: z.string().min(1, 'Capture text cannot be empty'),
  source: z.string().optional().default('manual'),
});

export type CreateCaptureItemInput = z.infer<typeof CreateCaptureItemSchema>;
