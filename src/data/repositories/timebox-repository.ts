import { prisma } from '../prisma';

export interface CreateTimeBlockData {
  taskId: string;
  scheduledFor: Date;
  durationMinutes: number;
}

export interface UpdateTimeBlockData {
  scheduledFor?: Date;
  durationMinutes?: number;
  completed?: boolean;
  actualMinutes?: number;
  abandonReason?: string;
}

export const timeboxRepository = {
  /**
   * Create a new timeblock
   */
  async create(data: CreateTimeBlockData) {
    return prisma.timeBlock.create({
      data: {
        taskId: data.taskId,
        scheduledFor: data.scheduledFor,
        durationMinutes: data.durationMinutes,
      },
      include: {
        task: {
          include: {
            domainArea: true,
            project: true,
          },
        },
      },
    });
  },

  /**
   * Get a timeblock by ID
   */
  async getById(id: string) {
    return prisma.timeBlock.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            domainArea: true,
            project: true,
          },
        },
      },
    });
  },

  /**
   * Update a timeblock
   */
  async update(id: string, data: UpdateTimeBlockData) {
    return prisma.timeBlock.update({
      where: { id },
      data,
      include: {
        task: {
          include: {
            domainArea: true,
            project: true,
          },
        },
      },
    });
  },

  /**
   * Delete a timeblock
   */
  async delete(id: string) {
    return prisma.timeBlock.delete({
      where: { id },
    });
  },

  /**
   * Get all timeblocks for a specific date
   */
  async getForDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.timeBlock.findMany({
      where: {
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        task: {
          include: {
            domainArea: true,
            project: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });
  },

  /**
   * Get all timeblocks for a specific task
   */
  async getForTask(taskId: string) {
    return prisma.timeBlock.findMany({
      where: { taskId },
      include: {
        task: {
          include: {
            domainArea: true,
            project: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'desc',
      },
    });
  },

  /**
   * Mark timeblock as completed
   */
  async markCompleted(id: string, actualMinutes: number) {
    return this.update(id, {
      completed: true,
      actualMinutes,
    });
  },

  /**
   * Mark timeblock as abandoned
   */
  async markAbandoned(id: string, reason: string, actualMinutes?: number) {
    return this.update(id, {
      completed: false,
      abandonReason: reason,
      actualMinutes,
    });
  },

  /**
   * Get all timeblocks (for overlap checking)
   */
  async getAll() {
    return prisma.timeBlock.findMany({
      select: {
        id: true,
        scheduledFor: true,
        durationMinutes: true,
      },
    });
  },
};
