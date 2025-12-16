'use client';

import { useState } from 'react';
import {
  scoreReadyTasksWithAI,
  applyAIRecommendations,
} from '@/app/actions/ai-actions';
import type { BulkPrioritizationResult } from '@/services/ai';

interface AIPriorityAssistantProps {
  hasReadyTasks: boolean;
}

export function AIPriorityAssistant({ hasReadyTasks }: AIPriorityAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<BulkPrioritizationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      const result = await scoreReadyTasksWithAI();

      if (!result.success) {
        setError(result.error || 'Failed to analyze tasks');
        return;
      }

      setRecommendations(result.data);
      setShowResults(true);
    } catch (err) {
      setError('An error occurred while analyzing tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!recommendations) return;

    setLoading(true);
    setError(null);

    try {
      const result = await applyAIRecommendations(recommendations.recommendations);

      if (!result.success) {
        setError(result.error || 'Failed to apply recommendations');
        return;
      }

      // Success - close modal
      setShowResults(false);
      setRecommendations(null);
    } catch (err) {
      setError('An error occurred while applying recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setShowResults(false);
    setRecommendations(null);
    setError(null);
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={handleAnalyze}
          disabled={loading || !hasReadyTasks}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>✨</span>
          {loading ? 'Analyzing...' : 'AI Priority Assistant'}
        </button>
        {!hasReadyTasks && (
          <p className="text-xs text-gray-500 mt-1">
            Move tasks to READY first to use AI assistance
          </p>
        )}
      </div>

      {error && !showResults && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results Modal */}
      {showResults && recommendations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold mb-4">AI Priority Recommendations</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{recommendations.summary}</p>
            </div>

            {/* Recommendations Breakdown */}
            <div className="space-y-6 mb-6">
              {/* NOW */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-red-700 dark:text-red-300">
                  NOW (1 task)
                </h3>
                {recommendations.scores
                  .filter((s) => recommendations.recommendations.now.includes(s.taskId))
                  .map((score) => (
                    <div
                      key={score.taskId}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium">Score: {score.score}/100</div>
                        <div className="text-xs text-gray-500">
                          Confidence: {Math.round(score.confidence * 100)}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{score.reasoning}</p>
                    </div>
                  ))}
              </div>

              {/* NEXT */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-yellow-700 dark:text-yellow-300">
                  NEXT ({recommendations.recommendations.next.length} tasks)
                </h3>
                {recommendations.scores
                  .filter((s) => recommendations.recommendations.next.includes(s.taskId))
                  .map((score) => (
                    <div
                      key={score.taskId}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-2"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium">Score: {score.score}/100</div>
                        <div className="text-xs text-gray-500">
                          Confidence: {Math.round(score.confidence * 100)}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{score.reasoning}</p>
                    </div>
                  ))}
              </div>

              {/* LATER */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-300">
                  LATER ({recommendations.recommendations.later.length} tasks)
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendations.recommendations.later.length} tasks recommended for backlog
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply Recommendations'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
