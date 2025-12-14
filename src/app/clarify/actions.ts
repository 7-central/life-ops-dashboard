'use server';

import { captureRepository } from '@/data/repositories/capture-repository';
import { taskRepository } from '@/data/repositories/task-repository';
import { canMarkTaskReady } from '@/domain/task/rules';
import { DomainArea } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface CreateTaskFromCaptureInput {
  captureId: string;
  title: string;
  domainArea?: DomainArea;
  dodItems: string[];
  nextAction: string;
  durationMinutes: number;
  notes?: string;
}

export interface CreateTaskResult {
  success: boolean;
  taskId?: string;
  error?: string;
  errors?: string[];
}

export async function createTaskFromCapture(
  input: CreateTaskFromCaptureInput
): Promise<CreateTaskResult> {
  try {
    // Validate capture exists
    const capture = await captureRepository.getById(input.captureId);
    if (!capture) {
      return {
        success: false,
        error: 'Capture item not found',
      };
    }

    // Create task
    const task = await taskRepository.create({
      title: input.title,
      domainArea: input.domainArea,
      dodItems: input.dodItems,
      nextAction: input.nextAction,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      originCaptureItemId: input.captureId,
    });

    // Check if task meets READY criteria
    const readyCheck = canMarkTaskReady({
      domainArea: input.domainArea,
      dodItems: input.dodItems,
      nextAction: input.nextAction,
      durationMinutes: input.durationMinutes,
    });

    // If valid, mark as READY, otherwise leave as DRAFT
    if (readyCheck.valid) {
      await taskRepository.updateStatus(task.id, 'READY');
    }

    // Mark capture as processed
    await captureRepository.markProcessed(input.captureId);

    revalidatePath('/clarify');

    return {
      success: true,
      taskId: task.id,
      errors: readyCheck.valid ? undefined : readyCheck.errors,
    };
  } catch (error) {
    console.error('Error creating task from capture:', error);
    return {
      success: false,
      error: 'Failed to create task. Please try again.',
    };
  }
}

export async function parkCaptureItem(captureId: string): Promise<{ success: boolean }> {
  try {
    await captureRepository.park(captureId);
    revalidatePath('/clarify');
    return { success: true };
  } catch (error) {
    console.error('Error parking capture item:', error);
    return { success: false };
  }
}

export async function deleteCaptureItem(captureId: string): Promise<{ success: boolean }> {
  try {
    await captureRepository.delete(captureId);
    revalidatePath('/clarify');
    return { success: true };
  } catch (error) {
    console.error('Error deleting capture item:', error);
    return { success: false };
  }
}
