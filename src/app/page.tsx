export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Life Ops Dashboard</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        ADHD-optimized workflow system
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/upload"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Upload Ideas
        </a>
        <a
          href="/clarify"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
        >
          Clarify Queue
        </a>
      </div>
    </div>
  );
}
