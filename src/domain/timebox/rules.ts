/**
 * Business rules for TimeBlocks
 */

export const VALID_TIMEBOX_DURATIONS = [25, 45, 60, 90] as const;
export type TimeboxDuration = (typeof VALID_TIMEBOX_DURATIONS)[number];

export interface TimeBlockData {
  id?: string;
  scheduledFor: Date;
  durationMinutes: number;
}

/**
 * Rule: Timebox duration must be one of the standard values
 */
export function isValidDuration(minutes: number): { valid: boolean; error?: string } {
  if (!VALID_TIMEBOX_DURATIONS.includes(minutes as TimeboxDuration)) {
    return {
      valid: false,
      error: `Duration must be one of: ${VALID_TIMEBOX_DURATIONS.join(', ')} minutes`,
    };
  }
  return { valid: true };
}

/**
 * Rule: TimeBlocks cannot overlap
 */
export function hasOverlap(
  newBlock: TimeBlockData,
  existingBlocks: TimeBlockData[]
): { valid: boolean; error?: string } {
  const newStart = new Date(newBlock.scheduledFor);
  const newEnd = new Date(newStart.getTime() + newBlock.durationMinutes * 60000);

  for (const existing of existingBlocks) {
    // Skip checking against itself when updating
    if (newBlock.id && existing.id === newBlock.id) {
      continue;
    }

    const existingStart = new Date(existing.scheduledFor);
    const existingEnd = new Date(existingStart.getTime() + existing.durationMinutes * 60000);

    // Check if blocks overlap
    // Overlap occurs if: (newStart < existingEnd) AND (newEnd > existingStart)
    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        valid: false,
        error: `TimeBlock overlaps with existing block at ${existingStart.toLocaleTimeString()}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Rule: Only NOW and NEXT tasks can be scheduled
 */
export function canScheduleTask(taskStatus: string): { valid: boolean; error?: string } {
  if (taskStatus !== 'NOW' && taskStatus !== 'NEXT') {
    return {
      valid: false,
      error: 'Only tasks in NOW or NEXT status can be scheduled',
    };
  }
  return { valid: true };
}

/**
 * Rule: Scheduled time must be in the future (for new blocks)
 */
export function isValidScheduleTime(
  scheduledFor: Date,
  isUpdate = false
): { valid: boolean; error?: string } {
  if (isUpdate) {
    // For updates, allow past times (in case rescheduling a block that already started)
    return { valid: true };
  }

  const now = new Date();
  const scheduled = new Date(scheduledFor);

  if (scheduled < now) {
    return {
      valid: false,
      error: 'Cannot schedule timeblocks in the past',
    };
  }

  return { valid: true };
}

/**
 * Validate complete timebox creation
 */
export function validateTimeBlock(
  newBlock: TimeBlockData,
  existingBlocks: TimeBlockData[],
  taskStatus: string,
  isUpdate = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check duration
  const durationCheck = isValidDuration(newBlock.durationMinutes);
  if (!durationCheck.valid && durationCheck.error) {
    errors.push(durationCheck.error);
  }

  // Check overlap
  const overlapCheck = hasOverlap(newBlock, existingBlocks);
  if (!overlapCheck.valid && overlapCheck.error) {
    errors.push(overlapCheck.error);
  }

  // Check task eligibility
  const taskCheck = canScheduleTask(taskStatus);
  if (!taskCheck.valid && taskCheck.error) {
    errors.push(taskCheck.error);
  }

  // Check schedule time
  const timeCheck = isValidScheduleTime(newBlock.scheduledFor, isUpdate);
  if (!timeCheck.valid && timeCheck.error) {
    errors.push(timeCheck.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
