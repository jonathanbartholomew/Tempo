import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ArrowRight, X } from 'lucide-react';

function formatMs(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function GlobalTimerBar({ timer, jobs, onPause, onResume, onStop, onDiscard, onGoToTime }) {
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

  if (!timer.active) return null;

  const job = timer.jobId ? (jobs || []).find((j) => j.id === timer.jobId) : null;
  const label = timer.taskTitle || timer.description || 'Tracking…';
  const notes = timer.taskTitle && timer.description ? timer.description : null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 md:left-60 z-40 border-t transition-colors ${
      timer.running
        ? 'bg-white dark:bg-gray-900 border-blue-500/30'
        : 'bg-white dark:bg-gray-900 border-amber-500/30'
    }`}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Pulse + elapsed */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${timer.running ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-lg font-bold tabular-nums font-mono text-gray-900 dark:text-gray-100 tracking-tight">
            {formatMs(ms)}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            timer.running
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}>
            {timer.running ? 'LIVE' : 'PAUSED'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-white/10 flex-shrink-0" />

        {/* What's being tracked */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {job && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold flex-shrink-0" style={{ color: job.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: job.color }} />
              {job.name}
            </span>
          )}
          {job && <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-white/10" />}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{label}</span>
          {notes && <span className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate">· {notes}</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {timer.running ? (
            <button onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors">
              <Pause size={12} /> Pause
            </button>
          ) : (
            <button onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors">
              <Play size={12} /> Resume
            </button>
          )}
          <button onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors">
            <Square size={12} /> Save
          </button>
          <button onClick={onGoToTime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 text-xs font-semibold transition-colors"
            title="Go to Time tab">
            <ArrowRight size={12} /> Time
          </button>
          <button onClick={onDiscard}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Discard timer">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
