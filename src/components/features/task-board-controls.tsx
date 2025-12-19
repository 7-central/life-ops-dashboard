'use client';

import { useState } from 'react';
import { toggleDoDItem, completeTask } from '@/app/actions/task-actions';

interface TaskBoardControlsProps {
  taskId: string;
  dodItems: string[];
  dodCompletedItems: boolean[];
  taskStatus: string;
}

export function TaskBoardControls({
  taskId,
  dodItems,
  dodCompletedItems,
  taskStatus,
}: TaskBoardControlsProps) {
  const [completedItems, setCompletedItems] = useState<boolean[]>(
    dodCompletedItems.length === dodItems.length
      ? dodCompletedItems
      : dodItems.map((_, idx) => dodCompletedItems[idx] || false)
  );
  const [isTogglingItem, setIsTogglingItem] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showForceCompleteConfirm, setShowForceCompleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = completedItems.filter(Boolean).length;
  const totalCount = dodItems.length;
  const allComplete = completedCount === totalCount;

  async function handleToggleDoDItem(index: number, completed: boolean) {
    setIsTogglingItem(index);
    setError(null);

    try {
      const result = await toggleDoDItem(taskId, index, completed);
      if (result.success) {
        // Update local state
        const newCompleted = [...completedItems];
        newCompleted[index] = completed;
        setCompletedItems(newCompleted);
      } else {
        setError(result.error || 'Failed to update DoD item');
      }
    } catch (err) {
      setError('Failed to update DoD item');
      console.error(err);
    } finally {
      setIsTogglingItem(null);
    }
  }

  async function handleCompleteTask(force = false) {
    setIsCompleting(true);
    setError(null);

    try {
      const result = await completeTask(taskId, force);
      if (result.success) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        if (result.error?.includes('Not all DoD items')) {
          setShowForceCompleteConfirm(true);
        } else {
          setError(result.error || 'Failed to complete task');
        }
      }
    } catch (err) {
      setError('Failed to complete task');
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  }

  if (dodItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Definition of Done</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount} complete
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* DoD Checklist */}
      <div className="space-y-3 mb-6">
        {dodItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={completedItems[index] || false}
              onChange={(e) => handleToggleDoDItem(index, e.target.checked)}
              disabled={isTogglingItem === index || taskStatus === 'DONE'}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            />
            <label
              className={`text-lg flex-1 ${
                completedItems[index]
                  ? 'line-through text-gray-500 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {item}
            </label>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                allComplete ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Mark Complete Button */}
      {taskStatus !== 'DONE' && (
        <div>
          <button
            onClick={() => handleCompleteTask(false)}
            disabled={isCompleting}
            className={`w-full px-6 py-3 rounded-lg font-medium transition ${
              allComplete
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            } disabled:opacity-50`}
          >
            {isCompleting ? 'Completing...' : 'Mark Task Complete'}
          </button>
          {!allComplete && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              Complete all DoD items to mark this task as done
            </p>
          )}
        </div>
      )}

      {/* Force Complete Confirmation Modal */}
      {showForceCompleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Complete Anyway?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Not all Definition of Done items are completed ({completedCount}/{totalCount} done).
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Do you want to mark this task as complete anyway? This will be recorded as a
              force-completion.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowForceCompleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowForceCompleteConfirm(false);
                  handleCompleteTask(true);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
              >
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Status */}
      {taskStatus === 'DONE' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm text-center">
          ✓ Task completed
        </div>
      )}
    </div>
  );
}
