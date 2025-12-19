'use server';

import { taskRepository } from '@/data/repositories/task-repository';
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
 * Delete a task permanently (hard delete with cascade cleanup)
 * Removes task and all associated data:
 * - TimeBlocks
 * - ShippedOutputs
 * - AuditEvents
 * - Follow-on task relationships
 */
export async function deleteTask(taskId: string): Promise<MoveTaskResult> {
  try {
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Use Prisma transaction to ensure all-or-nothing deletion
    const { prisma } = await import('@/data/prisma');

    await prisma.$transaction(async (tx) => {
      // 1. Delete all timeblocks for this task
      await tx.timeBlock.deleteMany({
        where: { taskId },
      });

      // 2. Delete all shipped outputs for this task
      await tx.shippedOutput.deleteMany({
        where: { taskId },
      });

      // 3. Delete all audit events for this task
      await tx.auditEvent.deleteMany({
        where: { taskId },
      });

      // 4. Clear follow-on relationships (set to null for tasks that follow this one)
      await tx.task.updateMany({
        where: { followOnOfTaskId: taskId },
        data: { followOnOfTaskId: null },
      });

      // 5. Finally, delete the task itself
      await tx.task.delete({
        where: { id: taskId },
      });
    });

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

/**
 * Toggle DoD item completion status
 */
export async function toggleDoDItem(
  taskId: string,
  itemIndex: number,
  completed: boolean
): Promise<MoveTaskResult> {
  try {
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Initialize dodCompletedItems if not set
    const dodCompletedItems = task.dodCompletedItems || [];

    // Ensure array is same length as dodItems
    while (dodCompletedItems.length < task.dodItems.length) {
      dodCompletedItems.push(false);
    }

    // Update the specific item
    dodCompletedItems[itemIndex] = completed;

    await taskRepository.update(taskId, {
      dodCompletedItems,
    });

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    console.error('Error toggling DoD item:', error);
    return {
      success: false,
      error: 'Failed to toggle DoD item',
    };
  }
}

/**
 * Complete a task
 */
export async function completeTask(
  taskId: string,
  forceComplete = false
): Promise<MoveTaskResult> {
  try {
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Check if all DoD items are completed
    const dodCompletedItems = task.dodCompletedItems || [];
    const allDoDComplete = task.dodItems.length === 0 ||
      task.dodItems.every((_, index) => dodCompletedItems[index] === true);

    if (!allDoDComplete && !forceComplete) {
      return {
        success: false,
        error: 'Not all DoD items are completed. Please complete all items or use force complete.',
      };
    }

    // Mark task as complete
    await taskRepository.update(taskId, {
      status: 'DONE',
      completedAt: new Date(),
      forceCompleted: !allDoDComplete,
    });

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    console.error('Error completing task:', error);
    return {
      success: false,
      error: 'Failed to complete task',
    };
  }
}

/**
 * Undo task completion (restore to previous state)
 */
export async function undoTaskCompletion(taskId: string): Promise<MoveTaskResult> {
  try {
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.status !== 'DONE') {
      return { success: false, error: 'Task is not completed' };
    }

    // Restore to READY status (user can re-prioritize)
    await taskRepository.update(taskId, {
      status: 'READY',
      completedAt: null,
      forceCompleted: false,
    });

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    console.error('Error undoing task completion:', error);
    return {
      success: false,
      error: 'Failed to undo completion',
    };
  }
}

/**
 * Purge old completed tasks (completed more than 48 hours ago)
 * Returns the number of tasks purged
 */
export async function purgeOldCompletedTasks(): Promise<{ success: boolean; purgedCount?: number; error?: string }> {
  try {
    const oldTasks = await taskRepository.getOldCompletedTasks();

    // Delete each task using the existing deleteTask function
    let purgedCount = 0;
    for (const task of oldTasks) {
      const result = await deleteTask(task.id);
      if (result.success) {
        purgedCount++;
      } else {
        console.error(`Failed to purge task ${task.id}:`, result.error);
      }
    }

    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true, purgedCount };
  } catch (error) {
    console.error('Error purging old completed tasks:', error);
    return {
      success: false,
      error: 'Failed to purge old tasks',
    };
  }
}
