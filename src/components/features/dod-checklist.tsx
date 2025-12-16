'use client';

interface DodChecklistProps {
  items: string[];
  completedItems: string[];
  onToggle: (item: string) => void;
}

export function DodChecklist({ items, completedItems, onToggle }: DodChecklistProps) {
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Definition of Done</h3>
        <div className="text-sm">
          <span className="text-green-400 font-medium">{completedCount}</span>
          <span className="text-gray-400"> / {totalCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isCompleted = completedItems.includes(item);
          return (
            <button
              key={index}
              onClick={() => onToggle(item)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border transition ${
                isCompleted
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                  isCompleted
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-500 bg-gray-700'
                }`}
              >
                {isCompleted && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Item Text */}
              <span
                className={`flex-1 text-left transition ${
                  isCompleted
                    ? 'text-gray-300 line-through'
                    : 'text-white'
                }`}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg text-center">
          <div className="text-green-400 font-medium mb-1">
            All items complete!
          </div>
          <div className="text-sm text-gray-300">
            Ready to mark this task as done.
          </div>
        </div>
      )}
    </div>
  );
}
