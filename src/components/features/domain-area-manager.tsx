'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createDomainArea,
  updateDomainArea,
  archiveDomainArea,
  unarchiveDomainArea,
  deleteDomainArea,
} from '@/app/settings/actions';
import type { DomainArea } from '@/generated/prisma';

interface DomainAreaManagerProps {
  domainAreas: (DomainArea & { _count?: { tasks: number } })[];
}

export function DomainAreaManager({ domainAreas }: DomainAreaManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeDomains = domainAreas.filter((d) => d.isActive);
  const archivedDomains = domainAreas.filter((d) => !d.isActive);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newName);

    const result = await createDomainArea(formData);
    if (result.success) {
      setNewName('');
      setIsAdding(false);
      setMessage({ type: 'success', text: 'Domain area created!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create' });
    }
  }

  async function handleUpdate(id: string) {
    const formData = new FormData();
    formData.append('name', editName);

    const result = await updateDomainArea(id, formData);
    if (result.success) {
      setEditingId(null);
      setMessage({ type: 'success', text: 'Domain area updated!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }
  }

  async function handleArchive(id: string) {
    const result = await archiveDomainArea(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Domain area archived!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to archive' });
    }
  }

  async function handleUnarchive(id: string) {
    const result = await unarchiveDomainArea(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Domain area restored!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to restore' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this domain area? This only works if no tasks reference it.')) return;

    const result = await deleteDomainArea(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Domain area deleted!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Cannot delete' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Domain Areas</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            + Add Domain Area
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
        <form onSubmit={handleCreate} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Domain area name"
              required
              autoFocus
            />
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Active</h3>
        {activeDomains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {editingId === domain.id ? (
              <div className="flex gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <Button size="sm" onClick={() => handleUpdate(domain.id)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <span className="font-medium">{domain.name}</span>
                  {domain._count && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({domain._count.tasks} tasks)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(domain.id);
                      setEditName(domain.name);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleArchive(domain.id)}>
                    Archive
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {archivedDomains.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Archived</h3>
          {archivedDomains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 opacity-60"
            >
              <div>
                <span className="font-medium">{domain.name}</span>
                {domain._count && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({domain._count.tasks} tasks)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleUnarchive(domain.id)}>
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(domain.id)}
                  disabled={domain._count ? domain._count.tasks > 0 : false}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
