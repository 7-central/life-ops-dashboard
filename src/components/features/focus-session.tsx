'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TimeBlock, Task, DomainArea, Project } from '@/generated/prisma';
import { FocusTimer } from './focus-timer';
import { DodChecklist } from './dod-checklist';
import {
  completeTaskFromTimeblock,
  abandonTimeBlock,
} from '@/app/actions/timebox-actions';
import { captureIdea } from '@/app/actions/capture-actions';

type TimeBlockWithTask = TimeBlock & {
  task: Task & {
    domainArea: DomainArea | null;
    project: Project | null;
  };
};

interface FocusSessionProps {
  timeblock: TimeBlockWithTask;
}

export function FocusSession({ timeblock }: FocusSessionProps) {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [completedDodItems, setCompletedDodItems] = useState<string[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');
  const [quickCaptureText, setQuickCaptureText] = useState('');
  const [actualMinutes, setActualMinutes] = useState(0);
  const [processing, setProcessing] = useState(false);

  // ESC key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowExitDialog(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent accidental navigation
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function handleDodToggle(item: string) {
    setCompletedDodItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function handleTimerComplete(elapsedMinutes: number) {
    setActualMinutes(elapsedMinutes);
    setShowCompleteDialog(true);
  }

  async function handleComplete() {
    setProcessing(true);
    const result = await completeTaskFromTimeblock(timeblock.id, actualMinutes);

    if (result.success) {
      router.push('/schedule');
    } else {
      alert(result.error || 'Failed to complete task');
      setProcessing(false);
    }
  }

  async function handleAbandon() {
    if (!abandonReason.trim()) {
      alert('Please provide a reason for abandoning');
      return;
    }

    setProcessing(true);
    const result = await abandonTimeBlock(timeblock.id, abandonReason, actualMinutes);

    if (result.success) {
      router.push('/schedule');
    } else {
      alert(result.error || 'Failed to abandon task');
      setProcessing(false);
    }
  }

  async function handleQuickCapture() {
    if (!quickCaptureText.trim()) return;

    const result = await captureIdea(quickCaptureText);
    if (result.success) {
      setQuickCaptureText('');
      setShowQuickCapture(false);
      alert('Idea captured! You can process it later.');
    } else {
      alert(result.error || 'Failed to capture idea');
    }
  }

  function handleExit() {
    router.push('/schedule');
  }

  const dodProgress = timeblock.task.dodItems.length > 0
    ? `${completedDodItems.length}/${timeblock.task.dodItems.length}`
    : '0/0';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Minimal Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">Focus Mode</div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            DoD Progress: <span className="text-white font-medium">{dodProgress}</span>
          </div>
          <button
            onClick={() => setShowExitDialog(true)}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Exit (ESC)
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Timer */}
        <div className="mb-12">
          <FocusTimer
            durationMinutes={timeblock.durationMinutes}
            isPaused={isPaused}
            onComplete={handleTimerComplete}
            onMinuteElapsed={setActualMinutes}
          />
        </div>

        {/* Task Info */}
        <div className="max-w-3xl w-full mb-8 text-center">
          <div className="text-sm text-gray-400 mb-2">
            {timeblock.task.domainArea?.name}
          </div>
          <h1 className="text-4xl font-bold mb-4">{timeblock.task.title}</h1>
          {timeblock.task.nextAction && (
            <div className="text-xl text-gray-300 mb-6">
              Next Action: {timeblock.task.nextAction}
            </div>
          )}
        </div>

        {/* DoD Checklist */}
        {timeblock.task.dodItems.length > 0 && (
          <div className="max-w-2xl w-full mb-8">
            <DodChecklist
              items={timeblock.task.dodItems}
              completedItems={completedDodItems}
              onToggle={handleDodToggle}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setShowCompleteDialog(true)}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-medium"
          >
            ✓ Complete Task
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-8 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-lg font-medium"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={() => setShowQuickCapture(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
          >
            📝 Quick Capture
          </button>
          <button
            onClick={() => setShowAbandonDialog(true)}
            className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-lg font-medium"
          >
            🚫 Abandon
          </button>
        </div>
      </div>

      {/* Exit Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Exit Focus Mode?</h3>
            <p className="text-gray-300 mb-6">
              You&apos;re currently in a focus session. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Stay Focused
              </button>
              <button
                onClick={handleExit}
                className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Complete Task</h3>
            <p className="text-gray-300 mb-4">
              Great work! You completed this task in {actualMinutes} minutes.
            </p>
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-400 mb-2">Definition of Done:</div>
              <ul className="space-y-1">
                {timeblock.task.dodItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className={completedDodItems.includes(item) ? 'text-green-400' : 'text-gray-400'}>
                      {completedDodItems.includes(item) ? '✓' : '○'}
                    </span>
                    <span className={completedDodItems.includes(item) ? 'text-white' : 'text-gray-400'}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {processing ? 'Completing...' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandon Dialog */}
      {showAbandonDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Abandon Task</h3>
            <p className="text-gray-300 mb-4">
              Why are you abandoning this task? This helps improve future planning.
            </p>
            <textarea
              value={abandonReason}
              onChange={(e) => setAbandonReason(e.target.value)}
              placeholder="e.g., Blocked by dependency, lost focus, wrong priority..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandonDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAbandon}
                disabled={processing || !abandonReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {processing ? 'Abandoning...' : 'Abandon Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Dialog */}
      {showQuickCapture && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Quick Capture</h3>
            <p className="text-gray-300 mb-4">
              Capture a follow-on task or idea without losing focus.
            </p>
            <textarea
              value={quickCaptureText}
              onChange={(e) => setQuickCaptureText(e.target.value)}
              placeholder="Type your idea or follow-on task..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-4"
              rows={3}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuickCapture(false);
                  setQuickCaptureText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickCapture}
                disabled={!quickCaptureText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
