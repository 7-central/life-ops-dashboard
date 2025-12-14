import { prisma } from '../prisma';
import type { TaskStatus, PriorityBucket, EnergyLevel } from '@prisma/client';

export interface CreateTaskData {
  title: string;
  domainAreaId?: string;
  projectId?: string;
  dodItems?: string[];
  nextAction?: string;
  durationMinutes?: number;
  notes?: string;
  tags?: string[];
  contexts?: string[];
  dueAt?: Date;
  energyFit?: EnergyLevel;
  urgency?: number;
  impact?: number;
  effort?: number;
  originCaptureItemId?: string;
}

export interface UpdateTaskData {
  title?: string;
  status?: TaskStatus;
  domainAreaId?: string;
  projectId?: string;
  dodItems?: string[];
  nextAction?: string;
  durationMinutes?: number;
  priorityBucket?: PriorityBucket | null;
  dueAt?: Date | null;
  energyFit?: EnergyLevel | null;
  urgency?: number | null;
  impact?: number | null;
  effort?: number | null;
  notes?: string;
  tags?: string[];
  contexts?: string[];
}

export const taskRepository = {
  /**
   * Create a new task
   */
  async create(data: CreateTaskData) {
    return prisma.task.create({
      data: {
        title: data.title,
        domainAreaId: data.domainAreaId,
        projectId: data.projectId,
        dodItems: data.dodItems || [],
        nextAction: data.nextAction,
        durationMinutes: data.durationMinutes,
        dueAt: data.dueAt,
        energyFit: data.energyFit,
        urgency: data.urgency,
        impact: data.impact,
        effort: data.effort,
        notes: data.notes,
        tags: data.tags || [],
        contexts: data.contexts || [],
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
        domainArea: true,
        project: true,
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
      include: {
        domainArea: true,
        project: true,
      },
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
