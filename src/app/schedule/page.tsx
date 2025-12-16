import { timeboxRepository } from '@/data/repositories/timebox-repository';
import { taskRepository } from '@/data/repositories/task-repository';
import { ScheduleTimeline } from '@/components/features/schedule-timeline';
import Link from 'next/link';

export default async function SchedulePage() {
  const today = new Date();
  const [allTimeblocks, nowTasks, nextTasks] = await Promise.all([
    timeboxRepository.getForDate(today),
    taskRepository.getByStatus('NOW'),
    taskRepository.getByStatus('NEXT'),
  ]);

  // Filter out completed and abandoned timeblocks
  const timeblocks = allTimeblocks.filter(
    (tb) => !tb.completed && !tb.abandonReason
  );

  // Get tasks that are schedulable (NOW/NEXT but not already scheduled)
  const scheduledTaskIds = timeblocks.map((tb) => tb.taskId);
  const availableTasks = [...nowTasks, ...nextTasks].filter(
    (task) => !scheduledTaskIds.includes(task.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Today&apos;s Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Timeblocks</div>
            <div className="text-3xl font-bold">{timeblocks.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
            <div className="text-3xl font-bold">
              {timeblocks.reduce((sum, tb) => sum + tb.durationMinutes, 0)} min
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Available Tasks</div>
            <div className="text-3xl font-bold">{availableTasks.length}</div>
          </div>
        </div>

        {/* Timeline */}
        <ScheduleTimeline timeblocks={timeblocks} availableTasks={availableTasks} />
      </div>
    </div>
  );
}
