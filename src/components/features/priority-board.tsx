'use client';

import { useState } from 'react';
import type { Task, DomainArea, Project } from '@/generated/prisma';
import {
  moveTaskToNow,
  moveTaskToNext,
  moveTaskToLater,
  moveTaskToReady,
} from '@/app/actions/task-actions';

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface PriorityBoardProps {
  readyTasks: TaskWithRelations[];
  nowTasks: TaskWithRelations[];
  nextTasks: TaskWithRelations[];
  laterTasks: TaskWithRelations[];
}

export function PriorityBoard({ readyTasks, nowTasks, nextTasks, laterTasks }: PriorityBoardProps) {
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState<{
    taskId: string;
    target: 'NOW' | 'NEXT';
    message: string;
  } | null>(null);

  async function handleMoveTask(taskId: string, target: 'NOW' | 'NEXT' | 'LATER' | 'READY') {
    setMovingTaskId(taskId);
    setError(null);

    try {
      let result;
      switch (target) {
        case 'NOW':
          result = await moveTaskToNow(taskId);
          break;
        case 'NEXT':
          result = await moveTaskToNext(taskId);
          break;
        case 'LATER':
          result = await moveTaskToLater(taskId);
          break;
        case 'READY':
          result = await moveTaskToReady(taskId);
          break;
      }

      if (!result.success && result.error) {
        // Show override confirmation for WIP limit errors
        if (result.error.includes('WIP limit') || result.error.includes('already')) {
          setShowOverrideConfirm({
            taskId,
            target: target as 'NOW' | 'NEXT',
            message: result.error,
          });
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Failed to move task');
      console.error(err);
    } finally {
      setMovingTaskId(null);
    }
  }

  async function handleOverride() {
    if (!showOverrideConfirm) return;

    setMovingTaskId(showOverrideConfirm.taskId);
    setError(null);

    try {
      let result;
      if (showOverrideConfirm.target === 'NOW') {
        result = await moveTaskToNow(showOverrideConfirm.taskId, true);
      } else {
        result = await moveTaskToNext(showOverrideConfirm.taskId, true);
      }

      if (!result.success) {
        setError(result.error || 'Failed to move task');
      }
    } catch (err) {
      setError('Failed to move task');
      console.error(err);
    } finally {
      setMovingTaskId(null);
      setShowOverrideConfirm(null);
    }
  }

  function TaskCard({
    task,
    showMoveButtons = true,
  }: {
    task: TaskWithRelations;
    showMoveButtons?: boolean;
  }) {
    const isMoving = movingTaskId === task.id;

    return (
      <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="font-medium mb-1 text-sm">{task.title}</div>
        <div className="text-xs text-gray-500 mb-2">{task.domainArea?.name}</div>

        {showMoveButtons && (
          <div className="flex flex-wrap gap-1">
            {task.status !== 'NOW' && (
              <button
                onClick={() => handleMoveTask(task.id, 'NOW')}
                disabled={isMoving}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition"
              >
                → NOW
              </button>
            )}
            {task.status !== 'NEXT' && (
              <button
                onClick={() => handleMoveTask(task.id, 'NEXT')}
                disabled={isMoving}
                className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition"
              >
                → NEXT
              </button>
            )}
            {task.status !== 'LATER' && (
              <button
                onClick={() => handleMoveTask(task.id, 'LATER')}
                disabled={isMoving}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition"
              >
                → LATER
              </button>
            )}
            {task.status !== 'READY' && (
              <button
                onClick={() => handleMoveTask(task.id, 'READY')}
                disabled={isMoving}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition"
              >
                → READY
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {showOverrideConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Override WIP Limit?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{showOverrideConfirm.message}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Do you want to override the WIP limit and proceed anyway?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowOverrideConfirm(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Override
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* READY Column */}
        <div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-2">
            <h3 className="font-semibold">READY</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{readyTasks.length} tasks</p>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {readyTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {readyTasks.length === 0 && (
              <p className="text-sm text-gray-500 italic">No ready tasks</p>
            )}
          </div>
        </div>

        {/* NOW Column */}
        <div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mb-2">
            <h3 className="font-semibold">NOW</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">max 1</p>
          </div>
          <div className="space-y-2">
            {nowTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {nowTasks.length === 0 && <p className="text-sm text-gray-500 italic">Empty</p>}
          </div>
        </div>

        {/* NEXT Column */}
        <div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg mb-2">
            <h3 className="font-semibold">NEXT</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">max 3</p>
          </div>
          <div className="space-y-2">
            {nextTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {nextTasks.length === 0 && <p className="text-sm text-gray-500 italic">Empty</p>}
          </div>
        </div>

        {/* LATER Column */}
        <div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mb-2">
            <h3 className="font-semibold">LATER</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{laterTasks.length} tasks</p>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {laterTasks.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {laterTasks.length > 5 && (
              <p className="text-xs text-gray-500 italic">+{laterTasks.length - 5} more</p>
            )}
            {laterTasks.length === 0 && <p className="text-sm text-gray-500 italic">Empty</p>}
          </div>
        </div>
      </div>
    </>
  );
}
