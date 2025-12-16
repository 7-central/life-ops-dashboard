import { domainAreaRepository } from '@/data/repositories/domain-area-repository';
import { projectRepository } from '@/data/repositories/project-repository';
import { DomainAreaManager } from '@/components/features/domain-area-manager';
import { ProjectManager } from '@/components/features/project-manager';

export default async function SettingsPage() {
  const [domainAreas, projects] = await Promise.all([
    domainAreaRepository.getAll(),
    projectRepository.getAll(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your domain areas and projects
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <DomainAreaManager domainAreas={domainAreas} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <ProjectManager projects={projects} />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">About Settings</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Domain Areas</strong> - Categories for organizing your tasks (e.g., Work,
              Personal, Health)
            </li>
            <li>
              <strong>Projects</strong> - Optional groupings for related tasks
            </li>
            <li>Archive items you don&apos;t need anymore instead of deleting them</li>
            <li>You can only delete domain areas/projects that have no associated tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
