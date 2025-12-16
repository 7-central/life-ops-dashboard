import { prisma } from '@/data/prisma';
import { domainAreaRepository } from '@/data/repositories/domain-area-repository';
import { projectRepository } from '@/data/repositories/project-repository';
import { TaskEditForm } from '@/components/features/task-edit-form';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface TaskEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskEditPage({ params }: TaskEditPageProps) {
  const { id } = await params;

  const [task, domainAreas, projects] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        domainArea: true,
        project: true,
      },
    }),
    domainAreaRepository.getActive(),
    projectRepository.getActive(),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link href={`/tasks/${task.id}`} className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Task
          </Link>
          <h1 className="text-4xl font-bold mb-2">Edit Task</h1>
          <p className="text-gray-600 dark:text-gray-400">Update task details and properties</p>
        </div>

        <TaskEditForm task={task} domainAreas={domainAreas} projects={projects} />
      </div>
    </div>
  );
}
