import { taskRepository } from '@/data/repositories/task-repository';
import Link from 'next/link';

export default async function TasksPage() {
  const [allTasks] = await Promise.all([
    taskRepository.getByStatus('READY'),
    // We'll add more statuses and filtering later
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">All Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your tasks across all statuses
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Full task management with filtering, editing, and status changes will be available in the next milestone.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For now, you can manage tasks through the Dashboard and Clarify pages.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold">{allTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ready Tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
