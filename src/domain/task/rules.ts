import type { TaskStatus } from './types';

/**
 * Business rules for Tasks
 */

/**
 * Rule: Task cannot be marked READY without required fields
 */
export function canMarkTaskReady(task: {
  domainAreaId?: string | null;
  dodItems?: string[];
  nextAction?: string | null;
  durationMinutes?: number | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.domainAreaId) {
    errors.push('Domain area is required');
  }

  if (!task.dodItems || task.dodItems.length === 0) {
    errors.push('At least one DoD item is required');
  }

  if (task.dodItems && task.dodItems.length > 3) {
    errors.push('Maximum 3 DoD items allowed');
  }

  if (!task.nextAction || task.nextAction.trim().length === 0) {
    errors.push('Next action is required');
  }

  if (!task.durationMinutes || task.durationMinutes <= 0) {
    errors.push('Duration estimate is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rule: Maximum 1 task in NOW status
 */
export function canMoveToNow(currentNowCount: number): { valid: boolean; error?: string } {
  if (currentNowCount >= 1) {
    return {
      valid: false,
      error: 'Maximum 1 task allowed in NOW. Move or complete the current NOW task first.',
    };
  }
  return { valid: true };
}

/**
 * Rule: Maximum 3 tasks in NEXT status
 */
export function canMoveToNext(currentNextCount: number): { valid: boolean; error?: string } {
  if (currentNextCount >= 3) {
    return {
      valid: false,
      error: 'Maximum 3 tasks allowed in NEXT. Move or complete some NEXT tasks first.',
    };
  }
  return { valid: true };
}

/**
 * Rule: Task must be READY before moving to NOW/NEXT
 */
export function canPrioritizeTask(status: TaskStatus): { valid: boolean; error?: string } {
  if (status !== 'READY' && status !== 'NOW' && status !== 'NEXT' && status !== 'LATER') {
    return {
      valid: false,
      error: 'Task must be in READY, NOW, NEXT, or LATER status to be prioritized',
    };
  }
  return { valid: true };
}

/**
 * Validate DoD completion for marking task as DONE
 */
export function validateDoDCompletion(
  dodItems: string[],
  completedItems: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (dodItems.length === 0) {
    errors.push('Task has no DoD items defined');
  }

  if (completedItems.length !== dodItems.length) {
    errors.push('Not all DoD items have been completed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valid timebox durations (in minutes)
 */
export const VALID_TIMEBOX_DURATIONS = [25, 45, 60, 90] as const;
export type TimeboxDuration = (typeof VALID_TIMEBOX_DURATIONS)[number];

export function isValidTimeboxDuration(minutes: number): minutes is TimeboxDuration {
  return VALID_TIMEBOX_DURATIONS.includes(minutes as TimeboxDuration);
}
