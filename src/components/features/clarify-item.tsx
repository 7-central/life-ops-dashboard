'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createTaskFromCapture, parkCaptureItem, deleteCaptureItem } from '@/app/clarify/actions';
import type { CaptureItem, DomainArea, Project } from '@prisma/client';

interface ClarifyItemProps {
  capture: CaptureItem;
  domainAreas: DomainArea[];
  projects: Project[];
}

export function ClarifyItem({ capture, domainAreas, projects }: ClarifyItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(capture.rawText);
  const [domainAreaId, setDomainAreaId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dod1, setDod1] = useState('');
  const [dod2, setDod2] = useState('');
  const [dod3, setDod3] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const dodItems = [dod1, dod2, dod3].filter((item) => item.trim().length > 0);

    const result = await createTaskFromCapture({
      captureId: capture.id,
      title,
      domainAreaId,
      projectId: projectId || undefined,
      dodItems,
      nextAction,
      durationMinutes: parseInt(duration, 10),
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (result.errors && result.errors.length > 0) {
        setMessage(`Task created as DRAFT: ${result.errors.join(', ')}`);
      } else {
        setMessage('Task created and marked READY!');
      }
      setTimeout(() => setIsExpanded(false), 1500);
    } else {
      setMessage(result.error || 'Failed to create task');
    }
  }

  async function handlePark() {
    setIsSubmitting(true);
    await parkCaptureItem(capture.id);
    setIsSubmitting(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this capture item?')) return;
    setIsSubmitting(true);
    await deleteCaptureItem(capture.id);
    setIsSubmitting(false);
  }

  if (!isExpanded) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="mb-3 text-gray-800 dark:text-gray-200">{capture.rawText}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsExpanded(true)}>
            Clarify
          </Button>
          <Button size="sm" variant="outline" onClick={handlePark} disabled={isSubmitting}>
            Park
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-blue-300 dark:border-blue-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Task Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Clear, actionable title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Domain Area *</label>
          <select
            value={domainAreaId}
            onChange={(e) => setDomainAreaId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            required
          >
            <option value="">Select domain...</option>
            {domainAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Project (optional)</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Definition of Done (1-3 items) *</label>
          <Input
            value={dod1}
            onChange={(e) => setDod1(e.target.value)}
            placeholder="DoD item 1"
            required
            className="mb-2"
          />
          <Input
            value={dod2}
            onChange={(e) => setDod2(e.target.value)}
            placeholder="DoD item 2 (optional)"
            className="mb-2"
          />
          <Input
            value={dod3}
            onChange={(e) => setDod3(e.target.value)}
            placeholder="DoD item 3 (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Next Action (one-sitting task) *</label>
          <Input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="First concrete step you can do in one sitting"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Estimated time in minutes"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional context or details"
            rows={3}
          />
        </div>

        {message && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-md text-sm">
            {message}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
