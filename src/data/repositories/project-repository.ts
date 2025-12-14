import { prisma } from '../prisma';

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const projectRepository = {
  /**
   * Get all projects
   */
  async getAll(activeOnly = false) {
    return prisma.project.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get active projects for dropdowns
   */
  async getActive() {
    return this.getAll(true);
  },

  /**
   * Get project by ID
   */
  async getById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  },

  /**
   * Create a new project
   */
  async create(data: CreateProjectData) {
    return prisma.project.create({
      data,
    });
  },

  /**
   * Update project
   */
  async update(id: string, data: UpdateProjectData) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  /**
   * Archive project (set isActive = false)
   */
  async archive(id: string) {
    return this.update(id, { isActive: false });
  },

  /**
   * Unarchive project
   */
  async unarchive(id: string) {
    return this.update(id, { isActive: true });
  },

  /**
   * Check if project can be deleted (no associated tasks)
   */
  async canDelete(id: string): Promise<boolean> {
    const count = await prisma.task.count({
      where: { projectId: id },
    });
    return count === 0;
  },

  /**
   * Delete project (only if no tasks reference it)
   */
  async delete(id: string) {
    const canDelete = await this.canDelete(id);
    if (!canDelete) {
      throw new Error('Cannot delete project with associated tasks. Archive instead.');
    }
    return prisma.project.delete({
      where: { id },
    });
  },
};
