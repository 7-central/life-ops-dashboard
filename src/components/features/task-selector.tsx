'use client';

import { useState } from 'react';
import type { Task, DomainArea, Project } from '@/generated/prisma';
import { VALID_TIMEBOX_DURATIONS } from '@/domain/timebox/rules';

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface TaskSelectorProps {
  tasks: TaskWithRelations[];
  scheduledTime: Date;
  onSelect: (taskId: string, durationMinutes: number) => void;
  onCancel: () => void;
  error?: string | null;
  isLoading?: boolean;
}

export function TaskSelector({ tasks, scheduledTime, onSelect, onCancel, error, isLoading }: TaskSelectorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(45);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  function handleConfirm() {
    if (selectedTaskId) {
      onSelect(selectedTaskId, selectedDuration);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Schedule a Task</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Time:{' '}
            {scheduledTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No tasks available to schedule.
              </p>
              <p className="text-sm text-gray-500">
                Tasks must be in NOW or NEXT status to be scheduled.
              </p>
            </div>
          ) : (
            <>
              {/* Task List */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select a Task</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        selectedTaskId === task.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{task.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-3">
                        <span>{task.domainArea?.name}</span>
                        {task.durationMinutes && (
                          <span>Est. {task.durationMinutes} min</span>
                        )}
                        {task.dodItems && task.dodItems.length > 0 && (
                          <span>{task.dodItems.length} DoD items</span>
                        )}
                      </div>
                      {task.nextAction && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          Next: {task.nextAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              {selectedTaskId && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {VALID_TIMEBOX_DURATIONS.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`px-4 py-3 rounded-lg border transition ${
                          selectedDuration === duration
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                  {selectedTask?.durationMinutes &&
                    selectedTask.durationMinutes !== selectedDuration && (
                      <p className="text-xs text-gray-500 mt-2">
                        Note: Task estimated at {selectedTask.durationMinutes} min
                      </p>
                    )}
                </div>
              )}

              {/* Selected Task Preview */}
              {selectedTask && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-sm font-medium mb-2">Summary</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Task:</span>{' '}
                      {selectedTask.title}
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>{' '}
                      {selectedDuration} minutes
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Time Slot:</span>{' '}
                      {scheduledTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(
                        scheduledTime.getTime() + selectedDuration * 60000
                      ).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTaskId || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Scheduling...' : 'Schedule Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
