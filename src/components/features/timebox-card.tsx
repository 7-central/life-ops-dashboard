'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TimeBlock, Task, DomainArea, Project } from '@/generated/prisma';
import {
  deleteTimeBlock,
  startTimeBlock,
  completeTaskFromTimeblock,
  extendTimeBlock,
  bringNextTaskForward,
} from '@/app/actions/timebox-actions';

type TimeBlockWithTask = TimeBlock & {
  task: Task & {
    domainArea: DomainArea | null;
    project: Project | null;
  };
};

interface TimeboxCardProps {
  timeblock: TimeBlockWithTask;
  onEdit?: (timeblock: TimeBlockWithTask) => void;
}

export function TimeboxCard({ timeblock, onEdit }: TimeboxCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [extending, setExtending] = useState(false);
  const [bringingForward, setBringingForward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [actualMinutes, setActualMinutes] = useState(timeblock.durationMinutes);
  const [extensionMinutes, setExtensionMinutes] = useState(15);
  const [bringNextForward, setBringNextForward] = useState(true);

  const startTime = new Date(timeblock.scheduledFor);
  const endTime = new Date(startTime.getTime() + timeblock.durationMinutes * 60000);

  const isNow = () => {
    const now = new Date();
    return now >= startTime && now <= endTime;
  };

  const isPast = () => {
    const now = new Date();
    return now > endTime;
  };

  async function handleDelete() {
    if (!confirm('Delete this timeblock?')) return;

    setDeleting(true);
    setError(null);

    const result = await deleteTimeBlock(timeblock.id);
    if (!result.success) {
      setError(result.error || 'Failed to delete');
      setDeleting(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    setError(null);

    const result = await startTimeBlock(timeblock.id);
    if (!result.success) {
      setError(result.error || 'Failed to start');
      setStarting(false);
    } else {
      // Navigate to focus mode
      router.push(`/focus/${timeblock.id}`);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);

    const result = await completeTaskFromTimeblock(timeblock.id, actualMinutes);
    if (!result.success) {
      setError(result.error || 'Failed to complete');
      setCompleting(false);
      return;
    }

    // Optionally bring next task forward
    if (bringNextForward) {
      const forwardResult = await bringNextTaskForward(timeblock.id);
      if (forwardResult.success && forwardResult.data?.nextTaskTitle) {
        // Success message will be shown by page refresh
      }
    }

    setShowCompleteDialog(false);
  }

  async function handleExtend() {
    setExtending(true);
    setError(null);

    const result = await extendTimeBlock(timeblock.id, extensionMinutes);
    if (!result.success) {
      setError(result.error || 'Failed to extend');
      setExtending(false);
    } else {
      setShowExtendDialog(false);
      setExtending(false);
      if (result.data?.rescheduledCount > 0) {
        alert(`Extended by ${extensionMinutes} minutes. ${result.data.rescheduledCount} subsequent tasks rescheduled.`);
      }
    }
  }

  async function handleBringForward() {
    if (!confirm('Pull the next task forward to start when this one ends?')) return;

    setBringingForward(true);
    setError(null);

    const result = await bringNextTaskForward(timeblock.id);
    if (!result.success) {
      setError(result.error || 'Failed to bring forward');
      setBringingForward(false);
    } else {
      setBringingForward(false);
      if (result.data?.nextTaskTitle) {
        alert(
          `"${result.data.nextTaskTitle}" moved forward by ${result.data.savedMinutes} minutes.`
        );
      }
    }
  }

  const bgColor = isNow()
    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
    : isPast()
      ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 opacity-60'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    <div className={`border-l-4 ${bgColor} rounded-lg p-4 shadow-sm`}>
      {error && (
        <div className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Time Range */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">
          {startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          -{' '}
          {endTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {timeblock.durationMinutes} min
        </div>
      </div>

      {/* Task Info */}
      <div className="mb-3">
        <div className="font-medium text-sm mb-1">{timeblock.task.title}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {timeblock.task.domainArea?.name}
        </div>
        {timeblock.task.dodItems && timeblock.task.dodItems.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {timeblock.task.dodItems.length} DoD items
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="mb-3">
        {timeblock.completed && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ Completed ({timeblock.actualMinutes} min)
          </div>
        )}
        {timeblock.abandonReason && (
          <div className="text-xs text-red-600 dark:text-red-400">
            Abandoned: {timeblock.abandonReason}
          </div>
        )}
        {isNow() && !timeblock.completed && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
            ● HAPPENING NOW
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!timeblock.completed && !timeblock.abandonReason && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {isNow() && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium"
              >
                {starting ? 'Starting...' : 'Start Focus'}
              </button>
            )}
            {!isPast() && (
              <>
                <button
                  onClick={() => onEdit?.(timeblock)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition text-sm"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              </>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="flex-1 px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition"
            >
              ✓ Complete
            </button>
            {isNow() && (
              <button
                onClick={() => setShowExtendDialog(true)}
                className="flex-1 px-2 py-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
              >
                + Extend
              </button>
            )}
            <button
              onClick={handleBringForward}
              disabled={bringingForward}
              className="flex-1 px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition"
            >
              {bringingForward ? '...' : '→ Next'}
            </button>
          </div>
        </div>
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Complete Task</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              How long did this task actually take?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Actual time (minutes)
              </label>
              <input
                type="number"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated: {timeblock.durationMinutes} minutes
              </p>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bringNextForward}
                  onChange={(e) => setBringNextForward(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Bring next task forward to start now</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Automatically move the next scheduled task to start immediately
              </p>
            </div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Task marked as DONE</li>
                <li>• Timeblock marked as completed</li>
                {bringNextForward && <li>• Next task moved to start now</li>}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {completing ? 'Completing...' : 'Complete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Dialog */}
      {showExtendDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Extend Task</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Need more time? Extend this task and automatically reschedule
              everything after it.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Add time (minutes)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setExtensionMinutes(mins)}
                    className={`px-3 py-2 rounded border transition text-sm ${
                      extensionMinutes === mins
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    +{mins}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                New duration: {timeblock.durationMinutes + extensionMinutes} minutes
              </p>
            </div>
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
              <p className="font-medium mb-1">Note:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                All tasks scheduled after this one will be pushed back by{' '}
                {extensionMinutes} minutes.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extending}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
              >
                {extending ? 'Extending...' : 'Extend Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
