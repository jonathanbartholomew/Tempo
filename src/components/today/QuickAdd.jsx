import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { PRIORITIES } from '../../utils/helpers';
import { parseTaskInput, formatParsedHint } from '../../utils/parseTask';

export default function QuickAdd({ jobs, onAdd }) {
  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [time, setTime] = useState('');

  const parsed = useMemo(() => {
    if (!title.trim()) return null;
    const result = parseTaskInput(title);
    if (!result.date && !result.time) return null;
    return result;
  }, [title]);

  const hint = parsed ? formatParsedHint(parsed.date, parsed.time) : null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (parsed) {
      onAdd({
        title: parsed.title || trimmed,
        jobId: jobId || null,
        priority,
        date: parsed.date || undefined,
        time: parsed.time || time || null,
      });
    } else {
      onAdd({ title: trimmed, jobId: jobId || null, priority, time: time || null });
    }

    setTitle('');
    setTime('');
  }

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Add a task… try "call Sarah tomorrow at 3pm"'
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {!parsed && (
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:text-gray-100"
          />
        )}
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">No job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.name}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:text-gray-100"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {hint && (
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
            📅 {hint}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            — "{parsed.title || title.trim()}"
          </span>
          <button
            type="button"
            onClick={() => setTitle(parsed.title || title.trim())}
            className="ml-auto text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
            title="Dismiss date detection"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
