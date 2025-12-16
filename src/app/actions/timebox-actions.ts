'use server';

import { timeboxRepository } from '@/data/repositories/timebox-repository';
import { taskRepository } from '@/data/repositories/task-repository';
import { validateTimeBlock } from '@/domain/timebox/rules';
import { revalidatePath } from 'next/cache';

interface TimeboxResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Create a new timeblock for a task
 */
export async function createTimeBlock(
  taskId: string,
  scheduledFor: Date,
  durationMinutes: number
): Promise<TimeboxResult> {
  try {
    // Get the task to check its status
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    // Get all existing timeblocks to check for overlaps
    const existingBlocks = await timeboxRepository.getAll();

    // Validate the timeblock
    const validation = validateTimeBlock(
      {
        scheduledFor: new Date(scheduledFor),
        durationMinutes,
      },
      existingBlocks.map((block) => ({
        id: block.id,
        scheduledFor: block.scheduledFor,
        durationMinutes: block.durationMinutes,
      })),
      task.status
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('. '),
      };
    }

    // Create the timeblock
    const timeblock = await timeboxRepository.create({
      taskId,
      scheduledFor: new Date(scheduledFor),
      durationMinutes,
    });

    // Update task status to SCHEDULED
    await taskRepository.updateStatus(taskId, 'SCHEDULED');

    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/tasks');

    return {
      success: true,
      data: timeblock,
    };
  } catch (error) {
    console.error('Error creating timeblock:', error);
    return {
      success: false,
      error: 'Failed to create timeblock',
    };
  }
}

/**
 * Update an existing timeblock
 */
export async function updateTimeBlock(
  id: string,
  scheduledFor?: Date,
  durationMinutes?: number
): Promise<TimeboxResult> {
  try {
    // Get the existing timeblock
    const existing = await timeboxRepository.getById(id);
    if (!existing) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // If updating schedule or duration, validate
    if (scheduledFor || durationMinutes) {
      const existingBlocks = await timeboxRepository.getAll();

      const validation = validateTimeBlock(
        {
          id,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : existing.scheduledFor,
          durationMinutes: durationMinutes ?? existing.durationMinutes,
        },
        existingBlocks.map((block) => ({
          id: block.id,
          scheduledFor: block.scheduledFor,
          durationMinutes: block.durationMinutes,
        })),
        existing.task.status,
        true // isUpdate
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('. '),
        };
      }
    }

    // Update the timeblock
    const updated = await timeboxRepository.update(id, {
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      durationMinutes,
    });

    revalidatePath('/schedule');
    revalidatePath('/');

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error('Error updating timeblock:', error);
    return {
      success: false,
      error: 'Failed to update timeblock',
    };
  }
}

/**
 * Delete a timeblock
 */
export async function deleteTimeBlock(id: string): Promise<TimeboxResult> {
  try {
    // Get the timeblock to find associated task
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // Delete the timeblock
    await timeboxRepository.delete(id);

    // Update task status back to its priority bucket
    const task = timeblock.task;
    if (task.status === 'SCHEDULED') {
      // Move back to the priority bucket it was in
      const newStatus = task.priorityBucket || 'READY';
      await taskRepository.updateStatus(task.id, newStatus);
    }

    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error deleting timeblock:', error);
    return {
      success: false,
      error: 'Failed to delete timeblock',
    };
  }
}

/**
 * Mark a timeblock as completed (without marking task as DONE)
 */
export async function completeTimeBlock(
  id: string,
  actualMinutes: number
): Promise<TimeboxResult> {
  try {
    // Get the timeblock
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // Mark as completed
    await timeboxRepository.markCompleted(id, actualMinutes);

    // Note: We don't automatically mark the task as DONE here
    // That should happen in Focus Mode when the user completes the task
    // For now, just mark the timeblock as completed

    revalidatePath('/schedule');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error completing timeblock:', error);
    return {
      success: false,
      error: 'Failed to complete timeblock',
    };
  }
}

/**
 * Complete a timeblock and mark the task as DONE
 */
export async function completeTaskFromTimeblock(
  id: string,
  actualMinutes: number
): Promise<TimeboxResult> {
  try {
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // Mark timeblock as completed
    await timeboxRepository.markCompleted(id, actualMinutes);

    // Mark task as DONE
    await taskRepository.updateStatus(timeblock.task.id, 'DONE');

    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error completing task from timeblock:', error);
    return {
      success: false,
      error: 'Failed to complete task',
    };
  }
}

/**
 * Abandon a timeblock
 */
export async function abandonTimeBlock(
  id: string,
  reason: string,
  actualMinutes?: number
): Promise<TimeboxResult> {
  try {
    // Get the timeblock
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // Mark as abandoned
    await timeboxRepository.markAbandoned(id, reason, actualMinutes);

    // Move task back to its priority bucket
    const task = timeblock.task;
    const newStatus = task.priorityBucket || 'READY';
    await taskRepository.updateStatus(task.id, newStatus);

    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error abandoning timeblock:', error);
    return {
      success: false,
      error: 'Failed to abandon timeblock',
    };
  }
}

/**
 * Start a timeblock (mark task as IN_PROGRESS)
 */
export async function startTimeBlock(id: string): Promise<TimeboxResult> {
  try {
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    // Update task status to IN_PROGRESS
    await taskRepository.updateStatus(timeblock.task.id, 'IN_PROGRESS');

    revalidatePath('/schedule');
    revalidatePath('/');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error) {
    console.error('Error starting timeblock:', error);
    return {
      success: false,
      error: 'Failed to start timeblock',
    };
  }
}

/**
 * Extend a timeblock and reschedule all subsequent timeblocks
 */
export async function extendTimeBlock(
  id: string,
  additionalMinutes: number
): Promise<TimeboxResult> {
  try {
    const timeblock = await timeboxRepository.getById(id);
    if (!timeblock) {
      return {
        success: false,
        error: 'TimeBlock not found',
      };
    }

    const today = new Date(timeblock.scheduledFor);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all timeblocks for today
    const allBlocks = await timeboxRepository.getForDate(today);

    // Find all timeblocks that start after this one ends
    const currentEnd = new Date(
      timeblock.scheduledFor.getTime() + timeblock.durationMinutes * 60000
    );
    const subsequentBlocks = allBlocks.filter((block) => {
      return block.id !== id && new Date(block.scheduledFor) >= currentEnd;
    });

    // Sort by scheduled time
    subsequentBlocks.sort(
      (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
    );

    // Extend the current timeblock
    const newDuration = timeblock.durationMinutes + additionalMinutes;
    await timeboxRepository.update(id, {
      durationMinutes: newDuration,
    });

    // Reschedule subsequent blocks
    for (const block of subsequentBlocks) {
      const newScheduledFor = new Date(
        block.scheduledFor.getTime() + additionalMinutes * 60000
      );
      await timeboxRepository.update(block.id, {
        scheduledFor: newScheduledFor,
      });
    }

    revalidatePath('/schedule');
    revalidatePath('/');

    return {
      success: true,
      data: { rescheduledCount: subsequentBlocks.length },
    };
  } catch (error) {
    console.error('Error extending timeblock:', error);
    return {
      success: false,
      error: 'Failed to extend timeblock',
    };
  }
}

/**
 * Bring the next timeblock forward to start now (or at specified time)
 */
export async function bringNextTaskForward(
  currentTimeblockId: string
): Promise<TimeboxResult> {
  try {
    const currentBlock = await timeboxRepository.getById(currentTimeblockId);
    if (!currentBlock) {
      return {
        success: false,
        error: 'Current timeblock not found',
      };
    }

    const today = new Date(currentBlock.scheduledFor);
    today.setHours(0, 0, 0, 0);

    // Get all timeblocks for today (excluding completed/abandoned ones)
    const allBlocks = await timeboxRepository.getForDate(today);
    const activeBlocks = allBlocks.filter(
      (block) => !block.completed && !block.abandonReason
    );

    // Determine the new start time for next task
    // If current task is completed, use NOW
    // Otherwise, use the scheduled end time of current task
    const newStartTime = currentBlock.completed
      ? new Date() // Use current time if task is completed
      : new Date(
          currentBlock.scheduledFor.getTime() +
            currentBlock.durationMinutes * 60000
        );

    // Find the next timeblock (first active one that starts after newStartTime)
    const nextBlock = activeBlocks
      .filter(
        (block) =>
          block.id !== currentTimeblockId &&
          new Date(block.scheduledFor) > newStartTime
      )
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0];

    if (!nextBlock) {
      return {
        success: false,
        error: 'No next timeblock found',
      };
    }

    // Calculate how much time we saved
    const savedMinutes = Math.floor(
      (nextBlock.scheduledFor.getTime() - newStartTime.getTime()) / 60000
    );

    // Move next block to start at new start time
    await timeboxRepository.update(nextBlock.id, {
      scheduledFor: newStartTime,
    });

    revalidatePath('/schedule');
    revalidatePath('/');

    return {
      success: true,
      data: {
        savedMinutes,
        nextTaskTitle: nextBlock.task.title,
      },
    };
  } catch (error) {
    console.error('Error bringing next task forward:', error);
    return {
      success: false,
      error: 'Failed to bring next task forward',
    };
  }
}
