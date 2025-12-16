import { prisma } from '../prisma';
import type { CaptureStatus } from '@/generated/prisma';

export interface CreateCaptureItemData {
  rawText: string;
  source?: string;
}

export interface UpdateCaptureItemData {
  status?: CaptureStatus;
}

export const captureRepository = {
  /**
   * Create a new capture item
   */
  async create(data: CreateCaptureItemData) {
    return prisma.captureItem.create({
      data: {
        rawText: data.rawText,
        source: data.source || 'manual',
      },
    });
  },

  /**
   * Create multiple capture items at once
   */
  async createMany(items: CreateCaptureItemData[]) {
    return prisma.captureItem.createManyAndReturn({
      data: items.map((item) => ({
        rawText: item.rawText,
        source: item.source || 'manual',
      })),
    });
  },

  /**
   * Get all unprocessed capture items
   */
  async getUnprocessed() {
    return prisma.captureItem.findMany({
      where: {
        status: 'UNPROCESSED',
      },
      orderBy: {
        capturedAt: 'asc',
      },
    });
  },

  /**
   * Get a single capture item by ID
   */
  async getById(id: string) {
    return prisma.captureItem.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });
  },

  /**
   * Update capture item status
   */
  async updateStatus(id: string, status: CaptureStatus) {
    return prisma.captureItem.update({
      where: { id },
      data: { status },
    });
  },

  /**
   * Park a capture item (soft delete)
   */
  async park(id: string) {
    return this.updateStatus(id, 'PARKED');
  },

  /**
   * Mark as deleted
   */
  async delete(id: string) {
    return this.updateStatus(id, 'DELETED');
  },

  /**
   * Mark as processed
   */
  async markProcessed(id: string) {
    return this.updateStatus(id, 'PROCESSED');
  },
};
