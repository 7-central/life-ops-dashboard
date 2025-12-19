'use client';

import { useState } from 'react';
import { updateProfile, generateProfileSummary } from '@/app/actions/profile-actions';
import type { UserProfile } from '@/generated/prisma';

interface ProfileFormProps {
  profile: UserProfile;
  isSummaryStale: boolean;
}

export function ProfileForm({ profile: initialProfile, isSummaryStale: initialStale }: ProfileFormProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSummaryStale, setIsSummaryStale] = useState(initialStale);

  const hasContent =
    profile.longTermGoals ||
    profile.mediumTermGoals ||
    profile.shortTermFocus ||
    profile.businessPlan ||
    profile.lifePlan ||
    profile.priorityPrinciples ||
    profile.preferences;

  const completenessScore = [
    profile.longTermGoals,
    profile.mediumTermGoals,
    profile.shortTermFocus,
    profile.businessPlan,
    profile.lifePlan,
    profile.priorityPrinciples,
  ].filter(Boolean).length;

  const totalFields = 6;
  const completenessPercent = Math.round((completenessScore / totalFields) * 100);

  function handleFieldChange(field: keyof UserProfile, value: string) {
    setProfile({ ...profile, [field]: value });
    // Mark summary as stale when content changes
    if (profile.summary) {
      setIsSummaryStale(true);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile({
        longTermGoals: profile.longTermGoals || undefined,
        mediumTermGoals: profile.mediumTermGoals || undefined,
        shortTermFocus: profile.shortTermFocus || undefined,
        businessPlan: profile.businessPlan || undefined,
        lifePlan: profile.lifePlan || undefined,
        priorityPrinciples: profile.priorityPrinciples || undefined,
        preferences: profile.preferences || undefined,
      });

      if (result.success) {
        setSuccess('Profile saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateSummary() {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateProfileSummary();

      if (result.success && result.summary) {
        setProfile({ ...profile, summary: result.summary, summaryGeneratedAt: new Date() });
        setIsSummaryStale(false);
        setSuccess('Summary generated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to generate summary');
      }
    } catch (err) {
      setError('Failed to generate summary');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Completeness Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-3">Profile Completeness</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  completenessPercent >= 80
                    ? 'bg-green-600'
                    : completenessPercent >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-semibold">{completenessPercent}%</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {completenessScore} of {totalFields} required fields completed
        </p>
      </div>

      {/* Profile Fields */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Goals & Plans</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Long-Term Goals
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.longTermGoals || ''}
            onChange={(e) => handleFieldChange('longTermGoals', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What are your long-term goals? (e.g., career, business, personal)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Medium-Term Goals (3-6 months)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.mediumTermGoals || ''}
            onChange={(e) => handleFieldChange('mediumTermGoals', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What do you want to achieve in the next 3-6 months?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Short-Term Focus (1-4 weeks)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.shortTermFocus || ''}
            onChange={(e) => handleFieldChange('shortTermFocus', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What are your immediate priorities for the next few weeks?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Business Plan / Focus Areas
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.businessPlan || ''}
            onChange={(e) => handleFieldChange('businessPlan', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What are your key business or professional focus areas?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Life Plan / Personal Priorities
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.lifePlan || ''}
            onChange={(e) => handleFieldChange('lifePlan', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What are your personal priorities and life goals?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Prioritization Principles
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={profile.priorityPrinciples || ''}
            onChange={(e) => handleFieldChange('priorityPrinciples', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="What matters most to you? What should be avoided or deprioritized (busy work)?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Preferences (Optional)
          </label>
          <textarea
            value={profile.preferences || ''}
            onChange={(e) => handleFieldChange('preferences', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="Batching preferences, communication tone, working style, etc."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* AI Summary Section */}
      {hasContent && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">AI Summary</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate a condensed summary for AI-powered task prioritization
              </p>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : isSummaryStale ? 'Regenerate Summary' : 'Generate Summary'}
            </button>
          </div>

          {isSummaryStale && profile.summary && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg text-orange-700 dark:text-orange-300 text-sm">
              ⚠️ Summary is out of date. Profile has been updated since summary was last generated.
              Click &quot;Regenerate Summary&quot; to update.
            </div>
          )}

          {profile.summary ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{profile.summary}</p>
              </div>
              {profile.summaryGeneratedAt && (
                <p className="text-xs text-gray-500 mt-3">
                  Generated {new Date(profile.summaryGeneratedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center text-gray-600 dark:text-gray-400">
              No summary generated yet. Click &quot;Generate Summary&quot; to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
