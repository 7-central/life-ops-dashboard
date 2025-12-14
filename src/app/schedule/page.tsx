import Link from 'next/link';

export default async function SchedulePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Plan your day with timeboxed execution blocks
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Timeline View Coming Soon</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The schedule page will let you:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 mb-4">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Create timeboxes (25/45/60/90 minutes)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Assign tasks to specific time slots</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Drag and drop to reorder</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Start focus mode from any block</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This feature will be available in the next milestone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
