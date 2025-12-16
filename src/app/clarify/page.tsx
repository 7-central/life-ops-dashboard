import Link from 'next/link';
import { captureRepository } from '@/data/repositories/capture-repository';
import { domainAreaRepository } from '@/data/repositories/domain-area-repository';
import { projectRepository } from '@/data/repositories/project-repository';
import { ClarifyItem } from '@/components/features/clarify-item';

export default async function ClarifyPage() {
  const [unprocessedItems, domainAreas, projects] = await Promise.all([
    captureRepository.getUnprocessed(),
    domainAreaRepository.getActive(),
    projectRepository.getActive(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Clarify Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process your unprocessed captures into actionable tasks
          </p>
        </div>

        {unprocessedItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No items to clarify! Your queue is empty.
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Upload New Ideas
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {unprocessedItems.length} {unprocessedItems.length === 1 ? 'item' : 'items'} to
              clarify
            </div>

            <div className="space-y-4">
              {unprocessedItems.map((item) => (
                <ClarifyItem
                  key={item.id}
                  capture={item}
                  domainAreas={domainAreas}
                  projects={projects}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Required Fields for READY Status</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Domain Area: Which area of life does this belong to?</li>
            <li>Definition of Done: 1-3 concrete bullets that define completion</li>
            <li>Next Action: The first one-sitting task you can do</li>
            <li>Duration: How long you estimate this will take</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Tasks missing these fields will be saved as DRAFT and need to be completed before
            prioritization.
          </p>
        </div>
      </div>
    </div>
  );
}
