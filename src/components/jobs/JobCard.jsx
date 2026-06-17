import { useState, useEffect } from 'react';
import { Trash2, CalendarSearch, Pencil, Check, X } from 'lucide-react';
import { JOB_COLORS, JOB_TYPES } from '../../utils/helpers';

function isValidHex(v) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

export default function JobCard({ job, total, completed, pending, onRemove, onUpdate, connectedAccounts = [] }) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(job.name);
  const [type, setType] = useState(job.type);
  const [color, setColor] = useState(job.color);
  const [hexInput, setHexInput] = useState(job.color);

  useEffect(() => { setHexInput(color); }, [color]);
  const [googleAccountEmail, setGoogleAccountEmail] = useState(job.googleAccountEmail || '');

  const progress = total ? completed / total : 0;

  function startEdit() {
    setName(job.name);
    setType(job.type);
    setColor(job.color);
    setHexInput(job.color);
    setGoogleAccountEmail(job.googleAccountEmail || '');
    setConfirming(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onUpdate(job.id, {
      name: trimmed,
      type,
      color,
      googleAccountEmail: googleAccountEmail || null,
    });
    setEditing(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden" style={{ borderLeftColor: editing ? color : job.color, borderLeftWidth: 4 }}>
      <div className="p-4 space-y-3">
        {editing ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
              <label
                className={`relative w-7 h-7 rounded-full cursor-pointer transition-transform overflow-hidden flex-shrink-0 ${!JOB_COLORS.find(c => c.value === color) ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
                style={{ background: !JOB_COLORS.find(c => c.value === color) ? color : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
                title="Custom color"
              >
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
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
                className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {connectedAccounts.length > 0 && (
              <select
                value={googleAccountEmail}
                onChange={(e) => setGoogleAccountEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No linked Google Calendar</option>
                {connectedAccounts.map((acc) => (
                  <option key={acc.email} value={acc.email}>{acc.email}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Check size={13} /> Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </>
        ) : (
          <>
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
              <div className="flex items-center gap-1">
                <button
                  onClick={startEdit}
                  className="text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors"
                  aria-label="Edit job"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirming(true)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                  aria-label="Remove job"
                >
                  <Trash2 size={18} />
                </button>
              </div>
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
          </>
        )}
      </div>
    </div>
  );
}
