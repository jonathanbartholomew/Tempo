import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import JobCard from './JobCard';
import { JOB_COLORS, JOB_TYPES } from '../../utils/helpers';

function isValidHex(v) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

export default function JobsTab({ jobs, tasks, connectedAccounts, onAddJob, onRemoveJob, onUpdateJob }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(JOB_TYPES[1]);
  const [color, setColor] = useState(JOB_COLORS[0].value);
  const [hexInput, setHexInput] = useState(JOB_COLORS[0].value);
  const [googleAccountEmail, setGoogleAccountEmail] = useState('');

  function pickColor(val) {
    setColor(val);
    setHexInput(val);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddJob({ name: trimmed, type, color, googleAccountEmail: googleAccountEmail || null });
    setName('');
    setType(JOB_TYPES[1]);
    pickColor(JOB_COLORS[0].value);
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
          <div className="flex items-center gap-2 flex-wrap">
            {JOB_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => pickColor(c.value)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c.value }}
                aria-label={c.name}
              />
            ))}
            <label
              className={`relative w-8 h-8 rounded-full cursor-pointer transition-transform overflow-hidden flex-shrink-0 ${!JOB_COLORS.find(c => c.value === color) ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
              style={{ background: !JOB_COLORS.find(c => c.value === color) ? color : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
              title="Custom color"
            >
              <input type="color" value={color} onChange={(e) => pickColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value);
                const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                if (isValidHex(v)) setColor(v);
              }}
              placeholder="#000000"
              maxLength={7}
              className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                onUpdate={onUpdateJob}
                connectedAccounts={connectedAccounts}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
