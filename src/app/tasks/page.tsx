import { prisma } from '@/data/prisma';
import { domainAreaRepository } from '@/data/repositories/domain-area-repository';
import { projectRepository } from '@/data/repositories/project-repository';
import { TaskList } from '@/components/features/task-list';
import Link from 'next/link';

export default async function TasksPage() {
  const [allTasks, domainAreas, projects] = await Promise.all([
    prisma.task.findMany({
      include: {
        domainArea: true,
        project: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    domainAreaRepository.getActive(),
    projectRepository.getActive(),
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

        <TaskList tasks={allTasks} domainAreas={domainAreas} projects={projects} />
      </div>
    </div>
  );
}
