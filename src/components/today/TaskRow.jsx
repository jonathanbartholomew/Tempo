import { Trash2 } from 'lucide-react';
import { getPriority } from '../../utils/helpers';

export default function TaskRow({ task, job, onToggle, onDelete }) {
  const priority = getPriority(task.priority);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        task.done
          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }`}
        aria-label="Toggle task complete"
      >
        {task.done && (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {task.time && (
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {task.time}
        </span>
      )}

      <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
        {task.title}
      </span>

      {job && (
        <span
          className="text-xs font-medium px-2 py-1 rounded-full text-white whitespace-nowrap"
          style={{ backgroundColor: job.color }}
        >
          {job.name}
        </span>
      )}

      <span
        className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
        style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
      >
        {priority.label}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Delete task"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
