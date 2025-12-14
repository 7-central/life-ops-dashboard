import { prisma } from '../prisma';
import type { TaskStatus, DomainArea } from '@prisma/client';

export interface CreateTaskData {
  title: string;
  domainArea?: DomainArea;
  dodItems?: string[];
  nextAction?: string;
  durationMinutes?: number;
  notes?: string;
  tags?: string[];
  originCaptureItemId?: string;
}

export interface UpdateTaskData {
  title?: string;
  domainArea?: DomainArea;
  status?: TaskStatus;
  dodItems?: string[];
  nextAction?: string;
  durationMinutes?: number;
  notes?: string;
  tags?: string[];
}

export const taskRepository = {
  /**
   * Create a new task
   */
  async create(data: CreateTaskData) {
    return prisma.task.create({
      data: {
        title: data.title,
        domainArea: data.domainArea,
        dodItems: data.dodItems || [],
        nextAction: data.nextAction,
        durationMinutes: data.durationMinutes,
        notes: data.notes,
        tags: data.tags || [],
        originCaptureItemId: data.originCaptureItemId,
      },
    });
  },

  /**
   * Get a task by ID
   */
  async getById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        originCaptureItem: true,
        timeBlocks: true,
        shippedOutputs: true,
      },
    });
  },

  /**
   * Update a task
   */
  async update(id: string, data: UpdateTaskData) {
    return prisma.task.update({
      where: { id },
      data,
    });
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: TaskStatus) {
    return prisma.task.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get count of tasks by status
   */
  async countByStatus(status: TaskStatus) {
    return prisma.task.count({
      where: { status },
    });
  },

  /**
   * Get all READY tasks
   */
  async getReady() {
    return this.getByStatus('READY');
  },

  /**
   * Get NOW tasks (should be max 1)
   */
  async getNow() {
    return this.getByStatus('NOW');
  },

  /**
   * Get NEXT tasks (should be max 3)
   */
  async getNext() {
    return this.getByStatus('NEXT');
  },

  /**
   * Get LATER tasks
   */
  async getLater() {
    return this.getByStatus('LATER');
  },

  /**
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus) {
    return this.update(id, { status });
  },
};
