import { prisma } from '../prisma';

export interface CreateDomainAreaData {
  name: string;
  sortOrder?: number;
}

export interface UpdateDomainAreaData {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const domainAreaRepository = {
  /**
   * Get all domain areas
   */
  async getAll(activeOnly = false) {
    return prisma.domainArea.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Get active domain areas for dropdowns
   */
  async getActive() {
    return this.getAll(true);
  },

  /**
   * Get domain area by ID
   */
  async getById(id: string) {
    return prisma.domainArea.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  },

  /**
   * Create a new domain area
   */
  async create(data: CreateDomainAreaData) {
    return prisma.domainArea.create({
      data: {
        name: data.name,
        sortOrder: data.sortOrder ?? 999,
      },
    });
  },

  /**
   * Update domain area
   */
  async update(id: string, data: UpdateDomainAreaData) {
    return prisma.domainArea.update({
      where: { id },
      data,
    });
  },

  /**
   * Archive domain area (set isActive = false)
   */
  async archive(id: string) {
    return this.update(id, { isActive: false });
  },

  /**
   * Unarchive domain area
   */
  async unarchive(id: string) {
    return this.update(id, { isActive: true });
  },

  /**
   * Check if domain area can be deleted (no associated tasks)
   */
  async canDelete(id: string): Promise<boolean> {
    const count = await prisma.task.count({
      where: { domainAreaId: id },
    });
    return count === 0;
  },

  /**
   * Delete domain area (only if no tasks reference it)
   */
  async delete(id: string) {
    const canDelete = await this.canDelete(id);
    if (!canDelete) {
      throw new Error('Cannot delete domain area with associated tasks. Archive instead.');
    }
    return prisma.domainArea.delete({
      where: { id },
    });
  },

  /**
   * Reorder domain areas
   */
  async reorder(updates: Array<{ id: string; sortOrder: number }>) {
    return prisma.$transaction(
      updates.map((update) =>
        prisma.domainArea.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
  },
};
