import { captureRepository } from '@/data/repositories/capture-repository';
import { taskRepository } from '@/data/repositories/task-repository';
import { PriorityBoard } from '@/components/features/priority-board';
import { AIPriorityAssistant } from '@/components/features/ai-priority-assistant';
import { RecentlyCompleted } from '@/components/features/recently-completed';
import { purgeOldCompletedTasks } from '@/app/actions/task-actions';
import Link from 'next/link';

export default async function DashboardPage() {
  // Auto-purge old completed tasks on dashboard load
  await purgeOldCompletedTasks();

  const [unprocessedCount, readyTasks, nowTasks, nextTasks, laterTasks, recentlyCompletedTasks] = await Promise.all([
    captureRepository.getUnprocessed().then((items) => items.length),
    taskRepository.getByStatus('READY'),
    taskRepository.getByStatus('NOW'),
    taskRepository.getByStatus('NEXT'),
    taskRepository.getByStatus('LATER'),
    taskRepository.getRecentlyCompleted(),
  ]);

  const hasUnprocessed = unprocessedCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Daily Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your workflow: Clarify → Prioritize → Schedule → Execute
          </p>
        </div>

        {/* Step 1: Clarify Inbox */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-1">📥 Step 1: Clarify Inbox</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Process unstructured captures into actionable tasks
                </p>
              </div>
              {hasUnprocessed && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-semibold">
                  {unprocessedCount} unprocessed
                </span>
              )}
            </div>

            {hasUnprocessed ? (
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  You have {unprocessedCount} unprocessed {unprocessedCount === 1 ? 'item' : 'items'} waiting to be clarified.
                </p>
                <Link href="/clarify">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Go to Clarify Queue →
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  Inbox is clear! All captures have been processed.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Prioritize (Now/Next/Later) */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">🎯 Step 2: Prioritize Tasks</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Move READY tasks into Now (max 1), Next (max 3), or Later
              </p>
            </div>

            <AIPriorityAssistant hasReadyTasks={readyTasks.length > 0} />

            <PriorityBoard
              readyTasks={readyTasks}
              nowTasks={nowTasks}
              nextTasks={nextTasks}
              laterTasks={laterTasks}
            />

            <div className="mt-4">
              <Link href="/tasks">
                <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium">
                  Manage All Tasks →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recently Completed Tasks */}
        {recentlyCompletedTasks.length > 0 && (
          <section className="mb-8">
            <RecentlyCompleted tasks={recentlyCompletedTasks} />
          </section>
        )}

        {/* Step 3: Schedule */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">📅 Step 3: Build Today&apos;s Schedule</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Allocate timeboxes for your prioritized tasks
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Schedule view coming soon. For now, use the Tasks page to view and manage your work.
              </p>
              <Link href="/schedule">
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Go to Schedule →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/upload">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition cursor-pointer">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium">Capture Ideas</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quick capture from anywhere
                  </div>
                </div>
              </Link>
              <Link href="/tasks">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition cursor-pointer">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="font-medium">View All Tasks</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Filter and manage tasks
                  </div>
                </div>
              </Link>
              <Link href="/profile">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition cursor-pointer">
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-medium">Profile</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Goals & AI context
                  </div>
                </div>
              </Link>
              <Link href="/settings">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition cursor-pointer">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-medium">Settings</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Manage domains & projects
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
