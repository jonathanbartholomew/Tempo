import { useState, useEffect, useRef } from 'react';
import {
  Clock, Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, ChevronDown,
  Loader2, Timer, ListTodo, Tag, Layers, Play, Pause, Square, AlertCircle,
  RotateCcw, SkipForward, Briefcase, List, GanttChart,
} from 'lucide-react';
import ProgressRing from '../today/ProgressRing';
import ActivityChart from '../today/ActivityChart';
import { useServerStorage } from '../../context/DataContext';
import { STORAGE_KEYS, DEFAULT_FOCUS_SESSION, getTodayString, getHistoryEntry, shiftDate } from '../../utils/helpers';

const CATEGORIES = [
  { id: 'task',   label: 'Task',   icon: ListTodo, dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-500/12 dark:bg-blue-500/15',   border: 'border-blue-500/30',   color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25' },
  { id: 'ticket', label: 'Ticket', icon: Tag,      dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/12 dark:bg-purple-500/15', border: 'border-purple-500/30', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25' },
  { id: 'focus',  label: 'Focus',  icon: Timer,    dot: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/12 dark:bg-amber-500/15',  border: 'border-amber-500/30',  color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25' },
  { id: 'custom', label: 'Custom', icon: Layers,   dot: 'bg-teal-500',   text: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-500/12 dark:bg-teal-500/15',   border: 'border-teal-500/30',   color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

function formatMinutes(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatMs(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Accepts: "90", "1h", "1h30m", "1h 30m", "1.5" (hours)
function parseTimeInput(val) {
  const s = String(val).trim().toLowerCase();
  const hm = s.match(/^(\d+(?:\.\d+)?)\s*h\s*(?:(\d+)\s*m?)?$/);
  if (hm) return Math.max(1, Math.round(parseFloat(hm[1]) * 60 + parseInt(hm[2] || 0, 10)));
  const mOnly = s.match(/^(\d+)\s*m?$/);
  if (mOnly) return Math.max(1, parseInt(mOnly[1], 10));
  const dec = parseFloat(s);
  if (!isNaN(dec) && dec > 0) return Math.max(1, Math.round(dec));
  return null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


// ─── Custom category picker ───────────────────────────────────────────────────

function CategoryPicker({ value, onChange, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = CAT_MAP[value] || CAT_MAP.custom;
  const SelIcon = selected.icon;

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const sm = size === 'sm';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40
          ${selected.bg} ${selected.border} ${selected.text}
          ${sm ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2'}`}
      >
        <span className={`rounded-full flex-shrink-0 ${selected.dot} ${sm ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
        <SelIcon size={sm ? 11 : 13} />
        {selected.label}
        <ChevronDown size={sm ? 10 : 12} className="opacity-60 ml-0.5" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-36 rounded-xl border border-gray-200 dark:border-white/12 bg-white dark:bg-[#0e1133] shadow-xl overflow-hidden py-1">
          {CATEGORIES.map((c) => {
            const CIcon = c.icon;
            const active = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                  ${active
                    ? `${c.bg} ${c.text} font-semibold`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/6'}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <CIcon size={12} />
                {c.label}
                {active && <Check size={11} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskPicker({ value, onChange, tasks }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = tasks.find((t) => t.id === value) || null;

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/6 text-gray-700 dark:text-gray-300 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors max-w-48 font-medium"
      >
        <ListTodo size={13} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="truncate">{selected ? selected.title : 'Pick a task…'}</span>
        <ChevronDown size={12} className="opacity-60 ml-auto flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 rounded-xl border border-gray-200 dark:border-white/12 bg-white dark:bg-[#0e1133] shadow-xl overflow-hidden py-1">
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors"
            >
              <X size={12} /> Clear selection
            </button>
          )}
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onChange(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
                ${value === t.id
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/6'}`}
            >
              <span className="flex-1 truncate">{t.title}</span>
              {value === t.id && <Check size={11} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function JobPicker({ value, onChange, jobs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = (jobs || []).find((j) => j.id === value) || null;

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/6 text-gray-700 dark:text-gray-300 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors font-medium"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="truncate max-w-32">{selected.name}</span>
          </>
        ) : (
          <>
            <Briefcase size={13} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-400 dark:text-gray-500">No job</span>
          </>
        )}
        <ChevronDown size={12} className="opacity-60 ml-auto flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-52 rounded-xl border border-gray-200 dark:border-white/12 bg-white dark:bg-[#0e1133] shadow-xl overflow-hidden py-1">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${!value ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}
          >
            <Briefcase size={13} /> No job
            {!value && <Check size={11} className="ml-auto" />}
          </button>
          {(jobs || []).map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => { onChange(j.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                ${value === j.id ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/6'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: j.color }} />
              <span className="flex-1 truncate">{j.name}</span>
              {value === j.id && <Check size={11} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live timer widget ────────────────────────────────────────────────────────

function TimerWidget({ timer, onPause, onResume, onStop, onDiscard, onDescriptionChange }) {
  const [ms, setMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const update = () => {
      setMs(timer.elapsed + (timer.running && timer.startedAt ? Date.now() - timer.startedAt : 0));
    };
    update();
    if (timer.running) {
      intervalRef.current = setInterval(update, 500);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer.running, timer.startedAt, timer.elapsed]);

  const cat = CAT_MAP[timer.category] || CAT_MAP.custom;
  const CatIcon = cat.icon;

  return (
    <div className={`rounded-2xl border-2 ${timer.running ? 'border-blue-500/40 bg-blue-500/5' : 'border-amber-500/40 bg-amber-500/5'} p-4 transition-colors`}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Elapsed display */}
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${timer.running ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-100 font-mono">
            {formatMs(ms)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${timer.running ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
            {timer.running ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {timer.running ? (
            <button onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium transition-colors">
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium transition-colors">
              <Play size={14} /> Resume
            </button>
          )}
          <button onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors">
            <Square size={14} /> Stop & Log
          </button>
          <button onClick={onDiscard}
            className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Discard">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* What's being tracked */}
      <div className="flex items-center gap-2 mt-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cat.color}`}>
          <CatIcon size={9} />{cat.label}
        </span>
        {timer.jiraKey && (
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{timer.jiraKey}</span>
        )}
        <input
          value={timer.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What are you working on?"
          className="flex-1 text-sm bg-transparent border-0 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none min-w-0"
        />
      </div>
    </div>
  );
}

// ─── Add / start form ─────────────────────────────────────────────────────────

function AddEntryForm({ onAdd, onStartTimer, todayTasks, jobs }) {
  const [mode, setMode] = useState('manual');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('task');
  const [jobId, setJobId] = useState(null);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTaskSelect(taskId) {
    setSelectedTaskId(taskId);
    if (taskId) {
      const task = todayTasks.find((t) => t.id === taskId);
      if (task) {
        setTaskTitle(task.title);
        setCategory('task');
        if (task.jobId) setJobId(task.jobId);
      }
    } else {
      setTaskTitle('');
    }
  }

  function reset() {
    setDescription(''); setTime(''); setSelectedTaskId(''); setTaskTitle(''); setJobId(null);
  }

  async function submitManual(e) {
    e.preventDefault();
    const minutes = parseTimeInput(time);
    if (!taskTitle && !description.trim()) { setError('Add a task or description.'); return; }
    if (!minutes) { setError('Enter a valid time (e.g. 30, 1h, 1h 30m).'); return; }
    setError('');
    setSaving(true);
    const ok = await onAdd({ description: description.trim(), category, minutes, jobId, taskTitle: taskTitle || null });
    if (ok) reset();
    setSaving(false);
  }

  function submitTimer() {
    if (!taskTitle && !description.trim()) { setError('Add a task or description first.'); return; }
    setError('');
    onStartTimer({ description: description.trim(), category, taskId: selectedTaskId || null, taskTitle: taskTitle || null, jobId });
    reset();
  }

  const hasTask = !!taskTitle;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/4 shadow-sm dark:shadow-none p-4 space-y-3">
      {/* Row 1: task + job + category */}
      <div className="flex gap-2 flex-wrap items-center">
        {todayTasks.length > 0 && (
          <TaskPicker value={selectedTaskId} onChange={handleTaskSelect} tasks={todayTasks} />
        )}
        {(jobs || []).length > 0 && (
          <JobPicker value={jobId} onChange={setJobId} jobs={jobs} />
        )}
        <CategoryPicker value={category} onChange={setCategory} />
        <div className="ml-auto flex items-center rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-xs">
          <button onClick={() => setMode('manual')}
            className={`px-3 py-1 transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
            Manual
          </button>
          <button onClick={() => setMode('timer')}
            className={`flex items-center gap-1 px-3 py-1 transition-colors ${mode === 'timer' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
            <Play size={10} /> Timer
          </button>
        </div>
      </div>

      {/* Row 2: task title (read-only if picked) + notes + time + submit */}
      <div className="flex gap-2 flex-wrap items-center">
        {hasTask ? (
          <div className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-500/8 text-blue-700 dark:text-blue-300 font-medium">
            <ListTodo size={13} className="flex-shrink-0" />
            <span className="truncate max-w-48">{taskTitle}</span>
            <button type="button" onClick={() => handleTaskSelect('')} className="ml-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200">
              <X size={12} />
            </button>
          </div>
        ) : null}

        <input
          type="text"
          placeholder={hasTask ? 'Notes (optional)…' : 'What did you work on?'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 min-w-40 text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />

        {mode === 'manual' ? (
          <>
            <input
              type="text"
              placeholder="e.g. 30m, 1h, 1h 30m"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-36 text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && submitManual(e)}
            />
            <button onClick={submitManual} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </>
        ) : (
          <button onClick={submitTimer}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors">
            <Play size={14} /> Start Timer
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry, onUpdate, onDelete, onRestartTimer, jobs, isActive }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [cat, setCat] = useState(entry.category);
  const [jobId, setJobId] = useState(entry.job_id || null);
  const [time, setTime] = useState(formatMinutes(entry.minutes));
  const [saving, setSaving] = useState(false);

  const catMeta = CAT_MAP[entry.category] || CAT_MAP.custom;
  const CatIcon = catMeta.icon;
  const job = (jobs || []).find((j) => j.id === (editing ? jobId : entry.job_id));

  async function save() {
    const minutes = parseTimeInput(time);
    if (!minutes) return;
    setSaving(true);
    const ok = await onUpdate(entry.id, {
      description: desc.trim(),
      category: cat,
      minutes,
      jobId,
      taskTitle: entry.task_title || null,
    });
    if (ok) setEditing(false);
    setSaving(false);
  }

  function cancel() {
    setDesc(entry.description); setCat(entry.category);
    setJobId(entry.job_id || null); setTime(formatMinutes(entry.minutes));
    setEditing(false);
  }

  const primaryLabel = entry.task_title || entry.description;
  const secondaryLabel = entry.task_title && entry.description ? entry.description : null;

  if (editing) {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/8 p-3 space-y-2">
        {entry.task_title && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <ListTodo size={11} /> {entry.task_title}
          </div>
        )}
        <div className="flex gap-2 items-center flex-wrap">
          <input value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder={entry.task_title ? 'Notes…' : 'Description'}
            className="flex-1 min-w-36 text-sm bg-white dark:bg-white/8 border border-gray-200 dark:border-white/15 rounded-lg px-2.5 py-1.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            autoFocus />
          <CategoryPicker value={cat} onChange={setCat} size="sm" />
          {(jobs || []).length > 0 && <JobPicker value={jobId} onChange={setJobId} jobs={jobs} />}
          <input value={time} onChange={(e) => setTime(e.target.value)}
            className="w-28 text-sm bg-white dark:bg-white/8 border border-gray-200 dark:border-white/15 rounded-lg px-2.5 py-1.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} />
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saving}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={cancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
      isActive
        ? 'border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/8'
        : 'border-gray-100 dark:border-white/6 bg-white dark:bg-white/3 hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
    }`}>
      {/* Active pulse or job color bar */}
      {isActive
        ? <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500 animate-pulse" />
        : <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: job ? job.color : 'transparent' }} />
      }

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{primaryLabel}</span>
          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${catMeta.color}`}>
            <CatIcon size={9} />{catMeta.label}
          </span>
        </div>
        {(secondaryLabel || job) && (
          <div className="flex items-center gap-2 mt-0.5">
            {job && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: job.color }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
                {job.name}
              </span>
            )}
            {secondaryLabel && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{secondaryLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Time + actions */}
      <span className="text-sm font-semibold tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0">
        {formatMinutes(entry.minutes)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onRestartTimer(entry)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          title="Restart timer for this entry">
          <Play size={11} /> Start
        </button>
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors" title="Edit">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Focus / Pomodoro section ─────────────────────────────────────────────────

const WORK_OPTIONS  = [15, 25, 45, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_RECONCILE = 1000;

function fmtSecs(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function nextSession(session, onLogFocus) {
  if (session.mode === 'work') {
    onLogFocus(session.workMinutes, session.jobId);
    return { ...session, mode: 'break', secondsLeft: session.breakMinutes * 60, sessionsCompleted: session.sessionsCompleted + 1 };
  }
  return { ...session, mode: 'work', secondsLeft: session.workMinutes * 60 };
}

function reconcileElapsed(session, onLogFocus) {
  if (!session.running || !session.updatedAt) return session;
  let elapsed = Math.floor((Date.now() - session.updatedAt) / 1000);
  if (elapsed <= 0) return { ...session, updatedAt: Date.now() };
  let next = session;
  for (let i = 0; i < MAX_RECONCILE && elapsed > 0; i++) {
    if (elapsed < next.secondsLeft) { next = { ...next, secondsLeft: next.secondsLeft - elapsed }; elapsed = 0; }
    else { elapsed -= next.secondsLeft; next = nextSession(next, onLogFocus); }
  }
  return { ...next, updatedAt: Date.now() };
}

function FocusSection({ stats, jobs, onLogFocus }) {
  const [session, setSession] = useServerStorage(STORAGE_KEYS.focusSession, DEFAULT_FOCUS_SESSION);
  const { mode, workMinutes, breakMinutes, secondsLeft, running, sessionsCompleted, jobId } = session;
  const intervalRef = useRef(null);

  useEffect(() => {
    setSession((prev) => reconcileElapsed(prev, onLogFocus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft <= 1) return { ...nextSession(prev, onLogFocus), running: false, updatedAt: Date.now() };
        return { ...prev, secondsLeft: prev.secondsLeft - 1, updatedAt: Date.now() };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const today = getTodayString();
  const todayHistory = getHistoryEntry(stats, today);

  const jobMinutes = {};
  for (let i = 0; i < 7; i++) {
    const entry = getHistoryEntry(stats, shiftDate(today, -i));
    for (const [id, mins] of Object.entries(entry.focusByJob || {})) {
      jobMinutes[id] = (jobMinutes[id] || 0) + mins;
    }
  }
  const jobBreakdown = (jobs || [])
    .map((job) => ({ job, minutes: jobMinutes[job.id] || 0 }))
    .filter(({ minutes }) => minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  function toggle() { setSession((p) => ({ ...p, running: !p.running, updatedAt: Date.now() })); }
  function reset()  { setSession((p) => ({ ...p, running: false, secondsLeft: (p.mode === 'work' ? p.workMinutes : p.breakMinutes) * 60, updatedAt: Date.now() })); }
  function skip()   {
    setSession((p) => p.mode === 'work'
      ? { ...p, running: false, mode: 'break', secondsLeft: p.breakMinutes * 60, updatedAt: Date.now() }
      : { ...p, running: false, mode: 'work', secondsLeft: p.workMinutes * 60, updatedAt: Date.now() });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Timer card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col items-center gap-4">
        <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full ${
          mode === 'work' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
        }`}>
          {mode === 'work' ? 'Focus session' : 'Break'}
        </span>

        <ProgressRing progress={progress} size={180} strokeWidth={12} label={fmtSecs(secondsLeft)} sublabel={mode === 'work' ? 'Stay focused' : 'Take a breather'} />

        <div className="flex items-center gap-3">
          <button onClick={toggle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RotateCcw size={18} />
          </button>
          <button onClick={skip}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <SkipForward size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <label className="flex items-center gap-1.5">
            Focus
            <select value={workMinutes} onChange={(e) => setSession((p) => ({ ...p, workMinutes: +e.target.value, secondsLeft: p.mode === 'work' && !p.running ? +e.target.value * 60 : p.secondsLeft }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {WORK_OPTIONS.map((m) => <option key={m} value={m}>{m}m</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Break
            <select value={breakMinutes} onChange={(e) => setSession((p) => ({ ...p, breakMinutes: +e.target.value, secondsLeft: p.mode === 'break' && !p.running ? +e.target.value * 60 : p.secondsLeft }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {BREAK_OPTIONS.map((m) => <option key={m} value={m}>{m}m</option>)}
            </select>
          </label>
        </div>

        {(jobs || []).length > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Briefcase size={14} />
            Job
            <select value={jobId || ''} onChange={(e) => setSession((p) => ({ ...p, jobId: e.target.value || null }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">None</option>
              {(jobs || []).map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </label>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">{sessionsCompleted} session{sessionsCompleted === 1 ? '' : 's'} completed this visit</p>
      </div>

      {/* Chart card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Timer size={15} className="text-blue-500" /> Focus Time
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{todayHistory.focusMinutes}m today</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Minutes focused, last 7 days</p>
          <ActivityChart history={stats.history || {}} metric="focusMinutes" />
        </div>
        {jobBreakdown.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Focus time by job, last 7 days</p>
            <div className="space-y-1.5">
              {jobBreakdown.map(({ job, minutes }) => (
                <div key={job.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: job.color }} />
                    {job.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline / Gantt view ────────────────────────────────────────────────────

const CAT_COLORS = { task: '#3b82f6', ticket: '#a855f7', focus: '#f59e0b', custom: '#14b8a6' };

function getEntryTimes(entry) {
  if (entry.started_at) {
    const start = new Date(entry.started_at);
    return { start, end: new Date(start.getTime() + entry.minutes * 60000) };
  }
  const end = new Date(entry.created_at);
  return { start: new Date(end.getTime() - entry.minutes * 60000), end };
}

function fmtHour(date, timeFormat) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h' });
}

function TimelineView({ entries, jobs, timeFormat }) {
  if (entries.length === 0) return null;

  const times = entries.map(getEntryTimes);
  const minMs = Math.min(...times.map((t) => t.start.getTime()));
  const maxMs = Math.max(...times.map((t) => t.end.getTime()));

  // Snap to whole hours with at least 1h padding each side
  const dayStart = new Date(Math.floor(minMs / 3600000) * 3600000);
  const dayEnd   = new Date((Math.floor(maxMs / 3600000) + 1) * 3600000);
  const totalMs  = dayEnd.getTime() - dayStart.getTime();

  const hourTicks = [];
  for (let t = dayStart.getTime(); t <= dayEnd.getTime(); t += 3600000) {
    hourTicks.push(new Date(t));
  }

  function pct(ms) { return ((ms - dayStart.getTime()) / totalMs) * 100; }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/4 shadow-sm dark:shadow-none overflow-hidden">
      {/* Sticky ruler */}
      <div className="flex items-end border-b border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/4 px-4 py-2">
        <div className="w-40 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Entry</div>
        <div className="flex-1 relative h-5">
          {hourTicks.map((h) => (
            <div
              key={h.getTime()}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct(h.getTime())}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{fmtHour(h, timeFormat)}</span>
            </div>
          ))}
        </div>
        <div className="w-14 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400 text-right">Time</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {entries.map((entry, i) => {
          const { start, end } = times[i];
          const job = (jobs || []).find((j) => j.id === entry.job_id);
          const barColor = job ? job.color : (CAT_COLORS[entry.category] || CAT_COLORS.custom);
          const leftPct  = pct(start.getTime());
          const widthPct = pct(end.getTime()) - leftPct;
          const label    = entry.task_title || entry.description || '—';

          return (
            <div key={entry.id} className="flex items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors group">
              {/* Label */}
              <div className="w-40 flex-shrink-0 pr-3 min-w-0">
                {job && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
                    <span className="text-[10px] font-semibold truncate" style={{ color: job.color }}>{job.name}</span>
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate block">{label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{fmtHour(start, timeFormat)} – {fmtHour(end, timeFormat)}</span>
              </div>

              {/* Bar track */}
              <div className="flex-1 relative h-8 rounded bg-gray-50 dark:bg-white/4">
                {/* Hour grid lines */}
                {hourTicks.map((h) => (
                  <div
                    key={h.getTime()}
                    className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-white/8"
                    style={{ left: `${pct(h.getTime())}%` }}
                  />
                ))}

                {/* The bar */}
                <div
                  className="absolute top-1 bottom-1 rounded flex items-center px-2 overflow-hidden"
                  style={{
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 0.5)}%`,
                    backgroundColor: barColor,
                    opacity: 0.85,
                  }}
                  title={`${label} · ${formatMinutes(entry.minutes)}`}
                >
                  {widthPct > 8 && (
                    <span className="text-[11px] font-semibold text-white truncate drop-shadow-sm">
                      {formatMinutes(entry.minutes)}
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="w-14 flex-shrink-0 text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400 text-right">
                {formatMinutes(entry.minutes)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="flex items-center px-4 py-2 border-t border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/4">
        <div className="w-40 flex-shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</div>
        <div className="flex-1" />
        <div className="w-14 text-xs font-bold text-gray-800 dark:text-gray-100 text-right tabular-nums">
          {formatMinutes(entries.reduce((s, e) => s + e.minutes, 0))}
        </div>
      </div>
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function fmtHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

const DID_YOU_KNOWS = [
  'The human brain uses about 20 watts of power — roughly the same as a dim lightbulb. That\'s why deep thinking drains you fast.',
  'People blink about 66% less when staring at screens. That\'s a big reason why Zoom fatigue is real.',
  'Multitasking reduces productivity by 40%, according to studies from Stanford University.',
  'The average office worker checks email 121 times per day — roughly once every 5 minutes.',
  'The first webcam was created to monitor a coffee pot at the University of Cambridge in 1991.',
  'Google once rented goats to mow the lawn at their HQ — they found it more sustainable than lawnmowers.',
  'Slack was originally built as a communication tool for a failed video game project called Glitch.',
  'Microsoft\'s first product wasn\'t Windows — it was a version of BASIC for the Altair 8800, released in 1975.',
  'LinkedIn launched in 2003, a full year before Facebook\'s release in 2004.',
  'Workers attend an average of 62 meetings per month, and over 30% are considered a waste of time.',
  'The ideal meeting length is 25 minutes. Most attendees start losing focus after the 18-minute mark.',
  'The average employee wastes 31 hours per month in unproductive meetings, per a study by Atlassian.',
  'Bluetooth is named after a Viking king — Harald "Bluetooth" Gormsson, who united Denmark and Norway in the 900s.',
  'The average rolling desk chair travels about 8 miles per year just from small movements.',
  'You can\'t hum while holding your nose. Seriously — try it right now.',
  'More people globally own a mobile phone than have access to a toilet: 6.6 billion phones, 4.5 billion toilets.',
  'A group of flamingos is called a "flamboyance." Use that next time someone calls your team too loud.',
  'Short, fun content increases information retention by 40%, according to the American Psychological Association.',
  'Using humor in meetings improves team trust and reduces stress responses by up to 17%.',
  'The word "deadline" originally referred to a line drawn around a Civil War prison camp — cross it, and guards would shoot.',
  'Octopuses have three hearts, blue blood, and can unscrew jars from the inside. Overqualified for most jobs.',
  'Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.',
  'A day on Venus is longer than a year on Venus — it rotates so slowly that it completes an orbit before one full spin.',
  'The average person spends 6 months of their lifetime waiting for red lights to turn green.',
  'Crows can recognize human faces and hold grudges for years. Be kind to crows.',
  'The shortest commercial flight in the world is 1.7 miles and lasts about 90 seconds — between two Scottish islands.',
  'There are more possible iterations of a game of chess than there are atoms in the observable universe.',
  'The inventor of the frisbee was turned into a frisbee after he died — his ashes were molded into one, per his request.',
  'A group of cats is called a "clowder." A group of kittens is a "kindle." Now you know.',
  'Bananas are slightly radioactive due to their potassium content. You\'d need to eat about 10 million to feel any effect.',
];

function factForDay(dateStr) {
  const hash = dateStr.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return DID_YOU_KNOWS[hash % DID_YOU_KNOWS.length];
}

function WeekView({ weekEntries, weekLoading, weekStart, jobs, onGoToDay, addDays }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = getTodayString();

  const [selectedDay, setSelectedDay] = useState(() =>
    days.includes(today) ? today : days[0]
  );

  useEffect(() => {
    const newDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setSelectedDay(newDays.includes(today) ? today : newDays[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const dayTotals = days.map((d) =>
    weekEntries.filter((e) => e.date?.slice(0, 10) === d).reduce((s, e) => s + e.minutes, 0)
  );
  const weekTotal = dayTotals.reduce((s, m) => s + m, 0);
  const selectedEntries = weekEntries.filter((e) => e.date?.slice(0, 10) === selectedDay);

  if (weekLoading) return (
    <div className="flex items-center gap-2 py-16 justify-center text-gray-400">
      <Loader2 size={16} className="animate-spin" /> Loading week…
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/4 shadow-sm dark:shadow-none overflow-hidden">
      {/* Day tabs */}
      <div className="flex border-b border-gray-100 dark:border-white/8 overflow-x-auto">
        {days.map((d, i) => {
          const dt = new Date(d + 'T00:00:00');
          const isToday = d === today;
          const isSelected = d === selectedDay;
          const mins = dayTotals[i];
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`relative flex-1 min-w-[72px] px-2 py-3 text-center transition-colors border-r border-gray-100 dark:border-white/6 last:border-r-0 ${
                isSelected
                  ? 'bg-white dark:bg-white/6'
                  : 'bg-gray-50 dark:bg-white/2 hover:bg-gray-100 dark:hover:bg-white/4'
              }`}
            >
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {dt.toLocaleDateString([], { weekday: 'short' })}
              </div>
              <div className={`text-sm font-bold tabular-nums ${
                mins > 0
                  ? isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'
                  : 'text-gray-300 dark:text-gray-600'
              }`}>
                {fmtHM(mins)}
              </div>
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
              {isToday && !isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-200 dark:bg-blue-900" />
              )}
            </button>
          );
        })}
        {/* Week total */}
        <div className="min-w-[80px] px-3 py-3 text-center bg-gray-50 dark:bg-white/2 border-l border-gray-200 dark:border-white/10 flex-shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-gray-400 dark:text-gray-500">Week</div>
          <div className={`text-sm font-bold tabular-nums ${
            weekTotal > 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'
          }`}>
            {fmtHM(weekTotal)}
          </div>
        </div>
      </div>

      {/* Selected day content */}
      {selectedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-8 text-center min-h-48">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Did you know?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{factForDay(selectedDay)}</p>
          </div>
          <button
            onClick={() => onGoToDay(selectedDay)}
            className="mt-6 text-xs px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Log time for this day →
          </button>
        </div>
      ) : (
        <div>
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {selectedEntries.map((entry) => {
              const job = (jobs || []).find((j) => j.id === entry.job_id);
              const catMeta = CAT_MAP[entry.category] || CAT_MAP.custom;
              const CatIcon = catMeta.icon;
              const label = entry.task_title || entry.description || '—';
              const barColor = job?.color || CAT_COLORS[entry.category] || '#6b7280';
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{label}</span>
                      <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${catMeta.color}`}>
                        <CatIcon size={8} />{catMeta.label}
                      </span>
                    </div>
                    {job && (
                      <span className="text-xs font-medium" style={{ color: job.color }}>{job.name}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200 flex-shrink-0">
                    {fmtHM(entry.minutes)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3">
            <button
              onClick={() => onGoToDay(selectedDay)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
            >
              Edit entries for this day →
            </button>
            <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">
              {fmtHM(selectedEntries.reduce((s, e) => s + e.minutes, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function TimeTab({ timeTracking, tasks, stats, jobs, onLogFocus, timeFormat }) {
  const {
    entries, loading, date, setDate, addEntry, updateEntry, deleteEntry,
    totalMinutes, isToday,
    timer, startTimerSafe, pauseTimer, resumeTimer, stopAndSave, discardTimer, updateTimerDescription,
    weekEntries, weekLoading, weekStart, setWeekStart, addDays, getMonday,
  } = timeTracking;

  const [subTab, setSubTab] = useState('track');
  const [scope, setScope] = useState('day'); // 'day' | 'week'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'timeline'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const today = getTodayString();

  function prevWeek() { setWeekStart((w) => addDays(w, -7)); }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)); }
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart === getMonday(today);

  function weekLabel() {
    const s = new Date(weekStart + 'T00:00:00');
    const e = new Date(weekEnd + 'T00:00:00');
    const sStr = s.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const eStr = e.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${sStr} – ${eStr}`;
  }

  const todayTasks = (tasks || []).filter((t) => !t.done && (t.date === today || !t.date));
  const filtered = categoryFilter === 'all' ? entries : entries.filter((e) => e.category === categoryFilter);
  const catTotals = CATEGORIES.map((c) => ({
    ...c,
    minutes: entries.filter((e) => e.category === c.id).reduce((s, e) => s + e.minutes, 0),
  })).filter((c) => c.minutes > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Time</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {scope === 'week' ? weekLabel() : formatDate(date)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Track / Focus sub-tabs */}
          <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden text-sm font-medium">
            <button onClick={() => setSubTab('track')}
              className={`px-4 py-1.5 transition-colors ${subTab === 'track' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
              Track
            </button>
            <button onClick={() => setSubTab('focus')}
              className={`px-4 py-1.5 transition-colors ${subTab === 'focus' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
              Focus
            </button>
          </div>

          {/* Day / Week scope (only in Track) */}
          {subTab === 'track' && (
            <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden text-sm font-medium">
              <button onClick={() => setScope('day')}
                className={`px-4 py-1.5 transition-colors ${scope === 'day' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
                Day
              </button>
              <button onClick={() => setScope('week')}
                className={`px-4 py-1.5 transition-colors ${scope === 'week' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
                Week
              </button>
            </div>
          )}

          {/* Navigation */}
          {subTab === 'track' && (
            <div className="flex items-center gap-1">
              <button onClick={() => scope === 'week' ? prevWeek() : setDate(offsetDate(date, -1))}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scope === 'week' ? setWeekStart(getMonday(today)) : setDate(today)}
                disabled={scope === 'week' ? isCurrentWeek : isToday}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6 disabled:opacity-40 disabled:cursor-default transition-colors">
                Today
              </button>
              <button
                onClick={() => scope === 'week' ? nextWeek() : setDate(offsetDate(date, 1))}
                disabled={scope === 'day' && date >= today}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-default transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {subTab === 'focus' ? (
        <FocusSection stats={stats || { history: {} }} jobs={jobs} onLogFocus={onLogFocus || (() => {})} />
      ) : scope === 'week' ? (
        <WeekView
          weekEntries={weekEntries}
          weekLoading={weekLoading}
          weekStart={weekStart}
          jobs={jobs}
          addDays={addDays}
          onGoToDay={(d) => { setScope('day'); setDate(d); }}
        />
      ) : (
        <>
          {/* Running timer widget */}
          {timer.active && (
            <TimerWidget
              timer={timer}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onStop={stopAndSave}
              onDiscard={discardTimer}
              onDescriptionChange={updateTimerDescription}
            />
          )}

          {/* Total + breakdown */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/4 shadow-sm dark:shadow-none p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total tracked today</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatMinutes(totalMinutes)}</span>
            </div>
            {catTotals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {catTotals.map((c) => (
                  <span key={c.id} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${c.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {c.label} · {formatMinutes(c.minutes)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <AddEntryForm
            onAdd={addEntry}
            onStartTimer={startTimerSafe}
            todayTasks={todayTasks}
            jobs={jobs}
          />

          {/* Filter row + view toggle */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category filter pills */}
              <div className="flex gap-2 flex-wrap flex-1">
                <button onClick={() => setCategoryFilter('all')}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${categoryFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  All ({entries.length})
                </button>
                {CATEGORIES.filter((c) => entries.some((e) => e.category === c.id)).map((c) => (
                  <button key={c.id} onClick={() => setCategoryFilter(c.id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${categoryFilter === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {c.label} ({entries.filter((e) => e.category === c.id).length})
                  </button>
                ))}
              </div>
              {/* View mode toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden flex-shrink-0">
                <button onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
                  <List size={12} /> List
                </button>
                <button onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
                  <GanttChart size={12} /> Timeline
                </button>
              </div>
            </div>
          )}

          {/* Entry list / timeline */}
          {loading ? (
            <div className="flex items-center gap-2 py-10 justify-center text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <Clock size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No time logged yet — add an entry above.</p>
            </div>
          ) : viewMode === 'timeline' ? (
            <TimelineView entries={filtered} jobs={jobs} timeFormat={timeFormat} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <p className="text-sm">No entries in this category.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onUpdate={updateEntry}
                  onDelete={deleteEntry}
                  onRestartTimer={(e) => {
                    startTimerSafe({
                      description: e.description,
                      category: e.category,
                      taskTitle: e.task_title || null,
                      jobId: e.job_id || null,
                      initialMs: (e.minutes || 0) * 60000,
                      entryId: e.id,
                    });
                  }}
                  jobs={jobs}
                  isActive={timer.entryId === entry.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
