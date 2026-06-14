import { useState } from 'react';
import { Trash2, CalendarSearch } from 'lucide-react';

export default function JobCard({ job, total, completed, pending, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const progress = total ? completed / total : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden" style={{ borderLeftColor: job.color, borderLeftWidth: 4 }}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{job.name}</h3>
            <div className="flex flex-col items-start gap-1 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white inline-block" style={{ backgroundColor: job.color }}>
                {job.type}
              </span>
              {job.googleAccountEmail && (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <CalendarSearch size={12} />
                  {job.googleAccountEmail}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setConfirming(true)}
            className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
            aria-label="Remove job"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{total}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{completed}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Done</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{pending}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Pending</p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${progress * 100}%`, backgroundColor: job.color }} />
        </div>

        {confirming && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-700 dark:text-red-400 space-y-2">
            <p>Remove this job? Its tasks will stay but lose this job association.</p>
            <div className="flex gap-2">
              <button
                onClick={() => onRemove(job.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
