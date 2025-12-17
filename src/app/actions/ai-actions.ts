'use server';

import { taskRepository } from '@/data/repositories/task-repository';
import { aiService } from '@/services/ai';
import type { TaskForAI, PriorityScore, BulkPrioritizationResult } from '@/services/ai';
import type { Task, DomainArea, Project } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';

interface AIActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Convert a database Task to TaskForAI format
 */
function taskToAIFormat(
  task: Task & {
    domainArea: DomainArea | null;
    project: Project | null;
  }
): TaskForAI {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes || undefined,
    domainAreaName: task.domainArea?.name,
    projectName: task.project?.name,
    dodItems: task.dodItems,
    nextAction: task.nextAction || undefined,
    durationMinutes: task.durationMinutes || undefined,
    dueAt: task.dueAt || undefined,
    urgency: task.urgency || undefined,
    impact: task.impact || undefined,
    effort: task.effort || undefined,
    energyFit: task.energyFit || undefined,
    tags: task.tags,
    contexts: task.contexts,
  };
}

/**
 * Score a single task's priority using AI
 */
export async function scoreTaskWithAI(taskId: string): Promise<AIActionResult> {
  try {
    // Get the task with relations
    const task = await taskRepository.getById(taskId);
    if (!task) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    // Convert to AI format
    const taskForAI = taskToAIFormat(task);

    // Score with AI
    const score = await aiService.scoreTaskPriority(taskForAI);

    // Update task with AI suggestions (optional - store in notes or new fields)
    // For now, we just return the score
    return {
      success: true,
      data: score,
    };
  } catch (error) {
    console.error('Error scoring task with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to score task',
    };
  }
}

/**
 * Score all active tasks (READY, NOW, NEXT, LATER) and get prioritization recommendations
 */
export async function scoreReadyTasksWithAI(): Promise<AIActionResult> {
  try {
    // Get all active tasks from all priority buckets
    const [readyTasks, nowTasks, nextTasks, laterTasks] = await Promise.all([
      taskRepository.getReady(),
      taskRepository.getNow(),
      taskRepository.getNext(),
      taskRepository.getLater(),
    ]);

    // Combine all tasks
    const allTasks = [...readyTasks, ...nowTasks, ...nextTasks, ...laterTasks];

    if (allTasks.length === 0) {
      return {
        success: false,
        error: 'No tasks to score',
      };
    }

    // Convert to AI format
    const tasksForAI = allTasks.map(taskToAIFormat);

    // Score with AI - passing all tasks so it can properly redistribute
    const result = await aiService.scoreBulkPriority(tasksForAI);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error scoring tasks with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to score tasks',
    };
  }
}

/**
 * Apply AI recommendations to tasks
 * Redistributes ALL tasks to their recommended priority buckets
 */
export async function applyAIRecommendations(
  recommendations: BulkPrioritizationResult['recommendations']
): Promise<AIActionResult> {
  try {
    // Get all current tasks that might need to be moved
    const [currentNow, currentNext] = await Promise.all([
      taskRepository.getNow(),
      taskRepository.getNext(),
    ]);

    // Create sets of task IDs for efficient lookup
    const recommendedNowIds = new Set(recommendations.now);
    const recommendedNextIds = new Set(recommendations.next);
    const allRecommendedIds = new Set([
      ...recommendations.now,
      ...recommendations.next,
      ...recommendations.later,
    ]);

    // Move tasks to NOW
    for (const taskId of recommendations.now) {
      await taskRepository.update(taskId, {
        status: 'NOW',
        priorityBucket: 'NOW',
      });
    }

    // Move tasks to NEXT
    for (const taskId of recommendations.next) {
      await taskRepository.update(taskId, {
        status: 'NEXT',
        priorityBucket: 'NEXT',
      });
    }

    // Move tasks to LATER
    for (const taskId of recommendations.later) {
      await taskRepository.update(taskId, {
        status: 'LATER',
        priorityBucket: 'LATER',
      });
    }

    // Move tasks that are currently in NOW but not recommended for NOW back to LATER
    for (const task of currentNow) {
      if (!recommendedNowIds.has(task.id) && allRecommendedIds.has(task.id)) {
        // Task is in recommendations but in a different bucket - already handled above
        continue;
      }
      if (!allRecommendedIds.has(task.id)) {
        // Task is not in any recommendations - shouldn't happen but move to LATER as safeguard
        await taskRepository.update(task.id, {
          status: 'LATER',
          priorityBucket: 'LATER',
        });
      }
    }

    // Move tasks that are currently in NEXT but not recommended for NEXT
    for (const task of currentNext) {
      if (!recommendedNextIds.has(task.id) && allRecommendedIds.has(task.id)) {
        // Already handled above
        continue;
      }
      if (!allRecommendedIds.has(task.id)) {
        // Move to LATER as safeguard
        await taskRepository.update(task.id, {
          status: 'LATER',
          priorityBucket: 'LATER',
        });
      }
    }

    revalidatePath('/');
    revalidatePath('/tasks');

    return {
      success: true,
      data: {
        movedToNow: recommendations.now.length,
        movedToNext: recommendations.next.length,
        movedToLater: recommendations.later.length,
      },
    };
  } catch (error) {
    console.error('Error applying AI recommendations:', error);
    return {
      success: false,
      error: 'Failed to apply recommendations',
    };
  }
}

/**
 * Update task with AI-suggested scores
 */
export async function updateTaskWithAIScores(
  taskId: string,
  scores: PriorityScore['factors']
): Promise<AIActionResult> {
  try {
    // Convert 0-100 scores to 1-5 scale
    const urgency = Math.max(1, Math.min(5, Math.round((scores.urgencyScore / 100) * 5)));
    const impact = Math.max(1, Math.min(5, Math.round((scores.impactScore / 100) * 5)));
    const effort = Math.max(1, Math.min(5, Math.round((scores.effortScore / 100) * 5)));

    await taskRepository.update(taskId, {
      urgency,
      impact,
      effort,
    });

    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating task with AI scores:', error);
    return {
      success: false,
      error: 'Failed to update task scores',
    };
  }
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<AIActionResult> {
  try {
    const isConnected = await aiService.testConnection();
    return {
      success: isConnected,
      data: {
        provider: aiService.getProviderName(),
        connected: isConnected,
      },
    };
  } catch (error) {
    console.error('Error testing AI connection:', error);
    return {
      success: false,
      error: 'Failed to test connection',
    };
  }
}
