import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import JobCard from './JobCard';
import { JOB_COLORS, JOB_TYPES } from '../../utils/helpers';

export default function JobsTab({ jobs, tasks, connectedAccounts, onAddJob, onRemoveJob }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(JOB_TYPES[1]);
  const [color, setColor] = useState(JOB_COLORS[0].value);
  const [googleAccountEmail, setGoogleAccountEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddJob({ name: trimmed, type, color, googleAccountEmail: googleAccountEmail || null });
    setName('');
    setType(JOB_TYPES[1]);
    setColor(JOB_COLORS[0].value);
    setGoogleAccountEmail('');
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Jobs</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Job'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Job name..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            {JOB_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c.value }}
                aria-label={c.name}
              />
            ))}
          </div>

          {connectedAccounts.length > 0 && (
            <select
              value={googleAccountEmail}
              onChange={(e) => setGoogleAccountEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No linked Google Calendar</option>
              {connectedAccounts.map((acc) => (
                <option key={acc.email} value={acc.email}>{acc.email}</option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Add Job
          </button>
        </form>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No jobs yet. Add your first one above!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const jobTasks = tasks.filter((t) => t.jobId === job.id);
            const completed = jobTasks.filter((t) => t.done).length;
            return (
              <JobCard
                key={job.id}
                job={job}
                total={jobTasks.length}
                completed={completed}
                pending={jobTasks.length - completed}
                onRemove={onRemoveJob}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
