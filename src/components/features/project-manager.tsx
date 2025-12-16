'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from '@/app/settings/actions';
import type { Project } from '@/generated/prisma';

interface ProjectManagerProps {
  projects: (Project & { _count?: { tasks: number } })[];
}

export function ProjectManager({ projects }: ProjectManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeProjects = projects.filter((p) => p.isActive);
  const archivedProjects = projects.filter((p) => !p.isActive);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newName);
    formData.append('description', newDescription);

    const result = await createProject(formData);
    if (result.success) {
      setNewName('');
      setNewDescription('');
      setIsAdding(false);
      setMessage({ type: 'success', text: 'Project created!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create' });
    }
  }

  async function handleUpdate(id: string) {
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('description', editDescription);

    const result = await updateProject(id, formData);
    if (result.success) {
      setEditingId(null);
      setMessage({ type: 'success', text: 'Project updated!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }
  }

  async function handleArchive(id: string) {
    const result = await archiveProject(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Project archived!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to archive' });
    }
  }

  async function handleUnarchive(id: string) {
    const result = await unarchiveProject(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Project restored!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to restore' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This only works if no tasks reference it.')) return;

    const result = await deleteProject(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Project deleted!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Cannot delete' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            + Add Project
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            required
            autoFocus
          />
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Active</h3>
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {editingId === project.id ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(project.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium">{project.name}</span>
                    {project._count && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({project._count.tasks} tasks)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(project.id);
                        setEditName(project.name);
                        setEditDescription(project.description || '');
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleArchive(project.id)}>
                      Archive
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {archivedProjects.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Archived</h3>
          {archivedProjects.map((project) => (
            <div
              key={project.id}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 opacity-60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium">{project.name}</span>
                  {project._count && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({project._count.tasks} tasks)
                    </span>
                  )}
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUnarchive(project.id)}>
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(project.id)}
                    disabled={project._count ? project._count.tasks > 0 : false}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
