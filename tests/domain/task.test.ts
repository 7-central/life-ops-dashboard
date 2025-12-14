import {
  canMarkTaskReady,
  canMoveToNow,
  canMoveToNext,
  canPrioritizeTask,
  validateDoDCompletion,
  isValidTimeboxDuration,
} from '@/domain/task/rules';

describe('Task Domain Rules', () => {
  describe('canMarkTaskReady', () => {
    it('should validate a complete task as ready', () => {
      const task = {
        domainArea: 'WORK' as const,
        dodItems: ['Item 1', 'Item 2'],
        nextAction: 'Start coding',
        durationMinutes: 60,
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject task without domain area', () => {
      const task = {
        dodItems: ['Item 1'],
        nextAction: 'Start coding',
        durationMinutes: 60,
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Domain area is required');
    });

    it('should reject task without DoD items', () => {
      const task = {
        domainArea: 'WORK' as const,
        dodItems: [],
        nextAction: 'Start coding',
        durationMinutes: 60,
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one DoD item is required');
    });

    it('should reject task with more than 3 DoD items', () => {
      const task = {
        domainArea: 'WORK' as const,
        dodItems: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
        nextAction: 'Start coding',
        durationMinutes: 60,
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 3 DoD items allowed');
    });

    it('should reject task without next action', () => {
      const task = {
        domainArea: 'WORK' as const,
        dodItems: ['Item 1'],
        nextAction: '',
        durationMinutes: 60,
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Next action is required');
    });

    it('should reject task without duration', () => {
      const task = {
        domainArea: 'WORK' as const,
        dodItems: ['Item 1'],
        nextAction: 'Start coding',
      };

      const result = canMarkTaskReady(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duration estimate is required');
    });
  });

  describe('canMoveToNow', () => {
    it('should allow moving to NOW when count is 0', () => {
      const result = canMoveToNow(0);
      expect(result.valid).toBe(true);
    });

    it('should reject moving to NOW when count is 1', () => {
      const result = canMoveToNow(1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum 1 task allowed in NOW');
    });

    it('should reject moving to NOW when count exceeds 1', () => {
      const result = canMoveToNow(2);
      expect(result.valid).toBe(false);
    });
  });

  describe('canMoveToNext', () => {
    it('should allow moving to NEXT when count is less than 3', () => {
      expect(canMoveToNext(0).valid).toBe(true);
      expect(canMoveToNext(1).valid).toBe(true);
      expect(canMoveToNext(2).valid).toBe(true);
    });

    it('should reject moving to NEXT when count is 3', () => {
      const result = canMoveToNext(3);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum 3 tasks allowed in NEXT');
    });

    it('should reject moving to NEXT when count exceeds 3', () => {
      const result = canMoveToNext(4);
      expect(result.valid).toBe(false);
    });
  });

  describe('canPrioritizeTask', () => {
    it('should allow prioritization of READY tasks', () => {
      const result = canPrioritizeTask('READY');
      expect(result.valid).toBe(true);
    });

    it('should allow prioritization of NOW tasks', () => {
      const result = canPrioritizeTask('NOW');
      expect(result.valid).toBe(true);
    });

    it('should allow prioritization of NEXT tasks', () => {
      const result = canPrioritizeTask('NEXT');
      expect(result.valid).toBe(true);
    });

    it('should allow prioritization of LATER tasks', () => {
      const result = canPrioritizeTask('LATER');
      expect(result.valid).toBe(true);
    });

    it('should reject prioritization of DRAFT tasks', () => {
      const result = canPrioritizeTask('DRAFT');
      expect(result.valid).toBe(false);
    });

    it('should reject prioritization of IN_PROGRESS tasks', () => {
      const result = canPrioritizeTask('IN_PROGRESS');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDoDCompletion', () => {
    it('should validate when all DoD items are completed', () => {
      const dodItems = ['Item 1', 'Item 2', 'Item 3'];
      const completedItems = ['Item 1', 'Item 2', 'Item 3'];

      const result = validateDoDCompletion(dodItems, completedItems);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject when not all DoD items are completed', () => {
      const dodItems = ['Item 1', 'Item 2', 'Item 3'];
      const completedItems = ['Item 1', 'Item 2'];

      const result = validateDoDCompletion(dodItems, completedItems);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Not all DoD items have been completed');
    });

    it('should reject when task has no DoD items', () => {
      const dodItems: string[] = [];
      const completedItems: string[] = [];

      const result = validateDoDCompletion(dodItems, completedItems);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task has no DoD items defined');
    });
  });

  describe('isValidTimeboxDuration', () => {
    it('should accept valid timebox durations', () => {
      expect(isValidTimeboxDuration(25)).toBe(true);
      expect(isValidTimeboxDuration(45)).toBe(true);
      expect(isValidTimeboxDuration(60)).toBe(true);
      expect(isValidTimeboxDuration(90)).toBe(true);
    });

    it('should reject invalid timebox durations', () => {
      expect(isValidTimeboxDuration(20)).toBe(false);
      expect(isValidTimeboxDuration(30)).toBe(false);
      expect(isValidTimeboxDuration(50)).toBe(false);
      expect(isValidTimeboxDuration(120)).toBe(false);
    });
  });
});
