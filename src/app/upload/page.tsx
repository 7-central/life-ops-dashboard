'use client';

import { useState, useRef } from 'react';
import { uploadIdeas } from './actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setMessage(null);

    const result = await uploadIdeas(formData);

    setIsSubmitting(false);

    if (result.success) {
      setMessage({
        type: 'success',
        text: `Successfully captured ${result.count} ${result.count === 1 ? 'idea' : 'ideas'}!`,
      });
      formRef.current?.reset();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Something went wrong',
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold mb-2">Upload Ideas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Capture your thoughts quickly. One line = one idea.
          </p>
        </div>

        <form
          ref={formRef}
          action={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="mb-6">
            <label htmlFor="ideas" className="block text-sm font-medium mb-2">
              Your Ideas
            </label>
            <Textarea
              id="ideas"
              name="ideas"
              rows={12}
              placeholder="Enter your ideas, one per line...&#10;&#10;Example:&#10;Fix the bug in user authentication&#10;Research best practices for API design&#10;Update documentation for deployment process"
              className="w-full"
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Tip: Each line will be saved as a separate capture item
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Commit Ideas'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => formRef.current?.reset()}
              disabled={isSubmitting}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">What happens next?</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Your ideas are saved as unprocessed capture items</li>
            <li>
              Visit the <a href="/clarify" className="text-blue-600 hover:underline">Clarify Queue</a> to process them
            </li>
            <li>Convert captures into actionable tasks with clear next steps</li>
            <li>Prioritize and schedule your work</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
