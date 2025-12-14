import { captureRepository } from '@/data/repositories/capture-repository';
import { taskRepository } from '@/data/repositories/task-repository';
import Link from 'next/link';

export default async function DashboardPage() {
  const [unprocessedCount, readyTasks, nowTasks, nextTasks, laterTasks] = await Promise.all([
    captureRepository.getUnprocessed().then((items) => items.length),
    taskRepository.getByStatus('READY'),
    taskRepository.getByStatus('NOW'),
    taskRepository.getByStatus('NEXT'),
    taskRepository.getByStatus('LATER'),
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* READY Column */}
              <div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-2">
                  <h3 className="font-semibold">READY</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{readyTasks.length} tasks</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {readyTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm"
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.domainArea?.name}</div>
                    </div>
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
                    <div
                      key={task.id}
                      className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm"
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.domainArea?.name}</div>
                    </div>
                  ))}
                  {nowTasks.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Empty</p>
                  )}
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
                    <div
                      key={task.id}
                      className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm"
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.domainArea?.name}</div>
                    </div>
                  ))}
                  {nextTasks.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Empty</p>
                  )}
                </div>
              </div>

              {/* LATER Column */}
              <div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mb-2">
                  <h3 className="font-semibold">LATER</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{laterTasks.length} tasks</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {laterTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm"
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.domainArea?.name}</div>
                    </div>
                  ))}
                  {laterTasks.length > 5 && (
                    <p className="text-xs text-gray-500 italic">+{laterTasks.length - 5} more</p>
                  )}
                  {laterTasks.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Empty</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/tasks">
                <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium">
                  Manage All Tasks →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Step 3: Schedule */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">📅 Step 3: Build Today's Schedule</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
