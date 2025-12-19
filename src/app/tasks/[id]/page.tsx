import { prisma } from '@/data/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TaskBoardControls } from '@/components/features/task-board-controls';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      domainArea: true,
      project: true,
      originCaptureItem: true,
    },
  });

  if (!task) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    READY: 'bg-gray-100 text-gray-800',
    NOW: 'bg-red-100 text-red-800',
    NEXT: 'bg-yellow-100 text-yellow-800',
    LATER: 'bg-blue-100 text-blue-800',
    SCHEDULED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-green-100 text-green-800',
    DONE: 'bg-green-200 text-green-900',
    ABANDONED: 'bg-gray-300 text-gray-900',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/tasks" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to All Tasks
          </Link>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-4xl font-bold">{task.title}</h1>
            <Link
              href={`/tasks/${task.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit Task
            </Link>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[task.status]}`}>
              {task.status}
            </span>
            {task.priorityBucket && (
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">
                Priority: {task.priorityBucket}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Details</h2>

            <div className="grid grid-cols-2 gap-4">
              {task.domainArea && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Domain Area
                  </span>
                  <p className="text-lg">{task.domainArea.name}</p>
                </div>
              )}

              {task.project && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Project
                  </span>
                  <p className="text-lg">{task.project.name}</p>
                </div>
              )}

              {task.durationMinutes && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Estimated Duration
                  </span>
                  <p className="text-lg">{task.durationMinutes} minutes</p>
                </div>
              )}

              {task.energyFit && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Energy Level
                  </span>
                  <p className="text-lg">{task.energyFit}</p>
                </div>
              )}

              {task.urgency && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Urgency
                  </span>
                  <p className="text-lg">{task.urgency}/5</p>
                </div>
              )}

              {task.impact && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Impact
                  </span>
                  <p className="text-lg">{task.impact}/5</p>
                </div>
              )}

              {task.effort && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Effort
                  </span>
                  <p className="text-lg">{task.effort}/5</p>
                </div>
              )}

              {task.dueAt && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Due Date
                  </span>
                  <p className="text-lg">{new Date(task.dueAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Action */}
          {task.nextAction && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Next Action</h2>
              <p className="text-lg">{task.nextAction}</p>
            </div>
          )}

          {/* Definition of Done - Interactive Checklist */}
          {task.dodItems && task.dodItems.length > 0 && (
            <TaskBoardControls
              taskId={task.id}
              dodItems={task.dodItems}
              dodCompletedItems={task.dodCompletedItems}
              taskStatus={task.status}
            />
          )}

          {/* Notes */}
          {task.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Notes</h2>
              <p className="text-lg whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contexts */}
          {task.contexts && task.contexts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Contexts</h2>
              <div className="flex flex-wrap gap-2">
                {task.contexts.map((context) => (
                  <span
                    key={context}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                  >
                    {context}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Origin */}
          {task.originCaptureItem && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Origin</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Created from capture on{' '}
                {new Date(task.originCaptureItem.capturedAt).toLocaleString()}
              </p>
              <p className="text-lg italic">{task.originCaptureItem.rawText}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
              <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
