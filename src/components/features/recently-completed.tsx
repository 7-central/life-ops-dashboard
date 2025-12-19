'use client';

import { useState } from 'react';
import { undoTaskCompletion, deleteTask, purgeOldCompletedTasks } from '@/app/actions/task-actions';
import type { Task, DomainArea, Project } from '@/generated/prisma';

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface RecentlyCompletedProps {
  tasks: TaskWithRelations[];
}

export function RecentlyCompleted({ tasks }: RecentlyCompletedProps) {
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  async function handleUndo(taskId: string) {
    setProcessingTaskId(taskId);
    setError(null);

    try {
      const result = await undoTaskCompletion(taskId);
      if (!result.success) {
        setError(result.error || 'Failed to undo completion');
      } else {
        // Refresh the page to show updated status
        window.location.reload();
      }
    } catch (err) {
      setError('Failed to undo completion');
      console.error(err);
    } finally {
      setProcessingTaskId(null);
    }
  }

  async function handleDeleteNow(taskId: string, taskTitle: string) {
    const confirmed = confirm(
      `⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete "${taskTitle}"?\n\nThis action CANNOT be undone.`
    );

    if (!confirmed) return;

    setProcessingTaskId(taskId);
    setError(null);

    try {
      const result = await deleteTask(taskId);
      if (!result.success) {
        setError(result.error || 'Failed to delete task');
      } else {
        // Refresh the page
        window.location.reload();
      }
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    } finally {
      setProcessingTaskId(null);
    }
  }

  async function handlePurgeOld() {
    if (!confirm('Purge all tasks completed more than 48 hours ago?\n\nThis action CANNOT be undone.')) {
      return;
    }

    setIsPurging(true);
    setError(null);
    setPurgeResult(null);

    try {
      const result = await purgeOldCompletedTasks();
      if (result.success) {
        setPurgeResult(`Successfully purged ${result.purgedCount || 0} old task(s)`);
        // Refresh after a brief delay
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(result.error || 'Failed to purge old tasks');
      }
    } catch (err) {
      setError('Failed to purge old tasks');
      console.error(err);
    } finally {
      setIsPurging(false);
    }
  }

  function getTimeRemaining(completedAt: Date | null): string {
    if (!completedAt) return 'Unknown';

    const now = new Date();
    const completed = new Date(completedAt);
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const purgeTime = new Date(completed.getTime() + fortyEightHours);
    const remaining = purgeTime.getTime() - now.getTime();

    if (remaining <= 0) return 'Will be purged soon';

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m until auto-purge`;
    } else {
      return `${minutes}m until auto-purge`;
    }
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Recently Completed</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tasks completed in the last 48 hours ({tasks.length})
          </p>
        </div>
        <button
          onClick={handlePurgeOld}
          disabled={isPurging}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          {isPurging ? 'Purging...' : 'Purge Old Tasks Now'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {purgeResult && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm">
          {purgeResult}
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const isProcessing = processingTaskId === task.id;

          return (
            <div
              key={task.id}
              className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-through text-gray-600 dark:text-gray-400">
                    {task.title}
                  </h3>
                  <div className="flex gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {task.domainArea && <span>{task.domainArea.name}</span>}
                    {task.completedAt && (
                      <span>• Completed {new Date(task.completedAt).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {getTimeRemaining(task.completedAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUndo(task.id)}
                    disabled={isProcessing}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Undoing...' : 'Undo'}
                  </button>
                  <button
                    onClick={() => handleDeleteNow(task.id, task.title)}
                    disabled={isProcessing}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Deleting...' : 'Delete Now'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
