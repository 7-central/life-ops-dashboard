'use server';

import { taskRepository } from '@/data/repositories/task-repository';
import { timeboxRepository } from '@/data/repositories/timebox-repository';
import { canMoveToNow, canMoveToNext } from '@/domain/task/rules';
import type { TaskStatus } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';

interface MoveTaskResult {
  success: boolean;
  error?: string;
  warning?: string;
}

/**
 * Move task to NOW status (max 1 allowed)
 */
export async function moveTaskToNow(taskId: string, override = false): Promise<MoveTaskResult> {
  try {
    const currentNowCount = await taskRepository.countByStatus('NOW');

    // Check WIP limit
    const canMove = canMoveToNow(currentNowCount);
    if (!canMove.valid && !override) {
      return {
        success: false,
        error: canMove.error,
      };
    }

    // Move task
    await taskRepository.update(taskId, {
      status: 'NOW',
      priorityBucket: 'NOW',
    });

    revalidatePath('/');
    revalidatePath('/tasks');

    return {
      success: true,
      warning: !canMove.valid ? 'WIP limit overridden' : undefined,
    };
  } catch (error) {
    console.error('Error moving task to NOW:', error);
    return {
      success: false,
      error: 'Failed to move task',
    };
  }
}

/**
 * Move task to NEXT status (max 3 allowed)
 */
export async function moveTaskToNext(taskId: string, override = false): Promise<MoveTaskResult> {
  try {
    const currentNextCount = await taskRepository.countByStatus('NEXT');

    // Check WIP limit
    const canMove = canMoveToNext(currentNextCount);
    if (!canMove.valid && !override) {
      return {
        success: false,
        error: canMove.error,
      };
    }

    // Move task
    await taskRepository.update(taskId, {
      status: 'NEXT',
      priorityBucket: 'NEXT',
    });

    revalidatePath('/');
    revalidatePath('/tasks');

    return {
      success: true,
      warning: !canMove.valid ? 'WIP limit overridden' : undefined,
    };
  } catch (error) {
    console.error('Error moving task to NEXT:', error);
    return {
      success: false,
      error: 'Failed to move task',
    };
  }
}

/**
 * Move task to LATER status (unlimited)
 */
export async function moveTaskToLater(taskId: string): Promise<MoveTaskResult> {
  try {
    await taskRepository.update(taskId, {
      status: 'LATER',
      priorityBucket: 'LATER',
    });

    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error moving task to LATER:', error);
    return {
      success: false,
      error: 'Failed to move task',
    };
  }
}

/**
 * Move task back to READY status
 */
export async function moveTaskToReady(taskId: string): Promise<MoveTaskResult> {
  try {
    await taskRepository.update(taskId, {
      status: 'READY',
      priorityBucket: null,
    });

    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error moving task to READY:', error);
    return {
      success: false,
      error: 'Failed to move task',
    };
  }
}

/**
 * Update task status directly
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<MoveTaskResult> {
  try {
    await taskRepository.updateStatus(taskId, status);

    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error updating task status:', error);
    return {
      success: false,
      error: 'Failed to update task status',
    };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<MoveTaskResult> {
  try {
    // Delete all associated timeblocks first
    const timeblocks = await timeboxRepository.getForTask(taskId);
    for (const timeblock of timeblocks) {
      await timeboxRepository.delete(timeblock.id);
    }

    // Update status to ABANDONED (soft delete)
    await taskRepository.updateStatus(taskId, 'ABANDONED');

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath('/clarify');
    revalidatePath('/schedule');

    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      error: 'Failed to delete task',
    };
  }
}

/**
 * Update task fields
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    domainAreaId?: string;
    projectId?: string;
    dodItems?: string[];
    nextAction?: string;
    durationMinutes?: number;
    notes?: string;
    tags?: string[];
  }
): Promise<MoveTaskResult> {
  try {
    await taskRepository.update(taskId, data);

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      error: 'Failed to update task',
    };
  }
}
