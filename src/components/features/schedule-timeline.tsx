'use client';

import { useState, useEffect } from 'react';
import type { TimeBlock, Task, DomainArea, Project } from '@/generated/prisma';
import { TimeboxCard } from './timebox-card';
import { TaskSelector } from './task-selector';
import { createTimeBlock, updateTimeBlock } from '@/app/actions/timebox-actions';

type TimeBlockWithTask = TimeBlock & {
  task: Task & {
    domainArea: DomainArea | null;
    project: Project | null;
  };
};

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface ScheduleTimelineProps {
  timeblocks: TimeBlockWithTask[];
  availableTasks: TaskWithRelations[];
}

export function ScheduleTimeline({ timeblocks, availableTasks }: ScheduleTimelineProps) {
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [editingTimeblock, setEditingTimeblock] = useState<TimeBlockWithTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate time slots for the timeline (6 AM to 10 PM)
  const generateTimeSlots = () => {
    const slots = [];
    const today = new Date();
    for (let hour = 6; hour <= 22; hour++) {
      const time = new Date(today);
      time.setHours(hour, 0, 0, 0);
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleCreateClick = (time: Date) => {
    setSelectedTime(time);
    setEditingTimeblock(null);
    setShowTaskSelector(true);
    setError(null);
  };

  const handleEditClick = (timeblock: TimeBlockWithTask) => {
    setEditingTimeblock(timeblock);
    setSelectedTime(timeblock.scheduledFor);
    setShowTaskSelector(true);
    setError(null);
  };

  const handleTaskSelected = async (taskId: string, durationMinutes: number) => {
    setCreating(true);
    setError(null);

    try {
      let result;
      if (editingTimeblock) {
        // Update existing timeblock
        result = await updateTimeBlock(
          editingTimeblock.id,
          selectedTime,
          durationMinutes
        );
      } else {
        // Create new timeblock
        result = await createTimeBlock(taskId, selectedTime, durationMinutes);
      }

      if (!result.success) {
        setError(result.error || 'Failed to save timeblock');
      } else {
        setShowTaskSelector(false);
        setEditingTimeblock(null);
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const getCurrentTimePosition = () => {
    const startHour = 6;
    const endHour = 22;
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

    if (currentHour < startHour || currentHour > endHour) return null;

    const percentage = ((currentHour - startHour) / (endHour - startHour)) * 100;
    return percentage;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Timeline</h2>
        {availableTasks.length > 0 && (
          <button
            onClick={() => handleCreateClick(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Timeblock
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Timeline View */}
      <div className="relative">
        {/* Current Time Indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
            style={{ top: `${currentTimePosition}%` }}
          >
            <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="absolute left-4 -top-2 text-xs text-red-500 font-medium whitespace-nowrap">
              Now - {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
        )}

        {/* Time Slots Grid */}
        <div className="space-y-1">
          {timeSlots.map((slot) => {
            // Find timeblocks that start at or overlap this hour
            const blocksAtTime = timeblocks.filter((tb) => {
              const blockStart = new Date(tb.scheduledFor);
              const blockEnd = new Date(blockStart.getTime() + tb.durationMinutes * 60000);
              const slotEnd = new Date(slot.getTime() + 60 * 60000);
              return blockStart < slotEnd && blockEnd > slot;
            });

            return (
              <div key={slot.toISOString()} className="flex gap-3 min-h-[60px]">
                {/* Time Label */}
                <div className="w-20 flex-shrink-0 text-sm text-gray-600 dark:text-gray-400 pt-1">
                  {slot.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </div>

                {/* Time Slot Content */}
                <div className="flex-1 relative">
                  {blocksAtTime.length > 0 ? (
                    <div className="space-y-2">
                      {blocksAtTime.map((tb) => (
                        <TimeboxCard
                          key={tb.id}
                          timeblock={tb}
                          onEdit={handleEditClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCreateClick(slot)}
                      className="w-full h-full min-h-[50px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition text-sm text-gray-500 dark:text-gray-400"
                    >
                      + Add timeblock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {timeblocks.length === 0 && (
        <div className="text-center py-12 mt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No timeblocks scheduled for today.
          </p>
          {availableTasks.length > 0 ? (
            <button
              onClick={() => handleCreateClick(new Date())}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Schedule Your First Task
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Move tasks to NOW or NEXT to schedule them.
            </p>
          )}
        </div>
      )}

      {/* Task Selector Modal */}
      {showTaskSelector && (
        <TaskSelector
          tasks={editingTimeblock ? [editingTimeblock.task] : availableTasks}
          scheduledTime={selectedTime}
          onSelect={handleTaskSelected}
          onCancel={() => {
            setShowTaskSelector(false);
            setEditingTimeblock(null);
            setError(null);
          }}
          error={error}
          isLoading={creating}
        />
      )}
    </div>
  );
}
