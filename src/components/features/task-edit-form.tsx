'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, DomainArea, Project } from '@/generated/prisma';
import { updateTask } from '@/app/actions/task-actions';

type TaskWithRelations = Task & {
  domainArea: DomainArea | null;
  project: Project | null;
};

interface TaskEditFormProps {
  task: TaskWithRelations;
  domainAreas: DomainArea[];
  projects: Project[];
}

export function TaskEditForm({ task, domainAreas, projects }: TaskEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(task.title);
  const [domainAreaId, setDomainAreaId] = useState(task.domainAreaId || '');
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [nextAction, setNextAction] = useState(task.nextAction || '');
  const [durationMinutes, setDurationMinutes] = useState(task.durationMinutes?.toString() || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [dodItems, setDodItems] = useState<string[]>(task.dodItems || []);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [newDodItem, setNewDodItem] = useState('');
  const [newTag, setNewTag] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = await updateTask(task.id, {
        title,
        domainAreaId: domainAreaId || undefined,
        projectId: projectId || undefined,
        nextAction: nextAction || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes || undefined,
        dodItems,
        tags,
      });

      if (result.success) {
        router.push(`/tasks/${task.id}`);
      } else {
        setError(result.error || 'Failed to update task');
      }
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function addDodItem() {
    if (newDodItem.trim()) {
      setDodItems([...dodItems, newDodItem.trim()]);
      setNewDodItem('');
    }
  }

  function removeDodItem(index: number) {
    setDodItems(dodItems.filter((_, i) => i !== index));
  }

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Domain Area */}
        <div>
          <label className="block text-sm font-medium mb-2">Domain Area</label>
          <select
            value={domainAreaId}
            onChange={(e) => setDomainAreaId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">Select domain area...</option>
            {domainAreas.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium mb-2">Project (Optional)</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Next Action */}
        <div>
          <label className="block text-sm font-medium mb-2">Next Action</label>
          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="The first concrete step to move this forward..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            min="1"
            placeholder="How long will this take?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Definition of Done */}
        <div>
          <label className="block text-sm font-medium mb-2">Definition of Done</label>
          <div className="space-y-2">
            {dodItems.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...dodItems];
                    newItems[idx] = e.target.value;
                    setDodItems(newItems);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={() => removeDodItem(idx)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDodItem}
                onChange={(e) => setNewDodItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDodItem())}
                placeholder="Add a completion criterion..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={addDodItem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Additional context, links, or thoughts..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
