'use client';

import { useState } from 'react';
import type { Task, DomainArea, Project, TaskStatus } from '@/generated/prisma';
import { deleteTask } from '@/app/actions/task-actions';
import Link from 'next/link';

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface TaskListProps {
  tasks: TaskWithRelations[];
  domainAreas: DomainArea[];
  projects: Project[];
}

export function TaskList({ tasks, domainAreas, projects }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (domainFilter !== 'ALL' && task.domainAreaId !== domainFilter) return false;
    if (projectFilter !== 'ALL' && task.projectId !== projectFilter) return false;
    return true;
  });

  const groupedByStatus = filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, TaskWithRelations[]>);

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to abandon this task?')) return;

    setDeletingTaskId(taskId);
    try {
      const result = await deleteTask(taskId);
      if (!result.success) {
        alert(result.error || 'Failed to delete task');
      }
    } catch (error) {
      alert('Failed to delete task');
      console.error(error);
    } finally {
      setDeletingTaskId(null);
    }
  }

  const statusColors: Record<TaskStatus, string> = {
    DRAFT: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
    READY: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
    NOW: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    NEXT: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    LATER: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    SCHEDULED: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    IN_PROGRESS: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    DONE: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    ABANDONED: 'bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-700',
  };

  const statuses: TaskStatus[] = [
    'DRAFT',
    'READY',
    'NOW',
    'NEXT',
    'LATER',
    'SCHEDULED',
    'IN_PROGRESS',
    'DONE',
    'ABANDONED',
  ];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="ALL">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Domain Area</label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="ALL">All Domains</option>
              {domainAreas.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="ALL">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Task List by Status */}
      <div className="space-y-6">
        {statuses.map((status) => {
          const tasksInStatus = groupedByStatus[status] || [];
          if (tasksInStatus.length === 0) return null;

          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {status} ({tasksInStatus.length})
              </h3>
              <div className="space-y-3">
                {tasksInStatus.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg ${statusColors[task.status]}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <div className="flex gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.domainArea && <span>{task.domainArea.name}</span>}
                          {task.project && <span>• {task.project.name}</span>}
                          {task.durationMinutes && <span>• {task.durationMinutes} min</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          View
                        </Link>
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    {task.nextAction && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Next Action: </span>
                        <span className="text-sm">{task.nextAction}</span>
                      </div>
                    )}

                    {task.dodItems && task.dodItems.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">DoD:</span>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {task.dodItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-md">
          <p className="text-gray-600 dark:text-gray-400">
            No tasks found matching your filters.
          </p>
        </div>
      )}
    </div>
  );
}
