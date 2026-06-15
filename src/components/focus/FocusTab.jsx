import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Timer } from 'lucide-react';
import ProgressRing from '../today/ProgressRing';
import ActivityChart from '../today/ActivityChart';
import { useServerStorage } from '../../context/DataContext';
import { STORAGE_KEYS, DEFAULT_FOCUS_SESSION, getTodayString, getHistoryEntry } from '../../utils/helpers';

const WORK_OPTIONS = [15, 25, 45, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];
const MAX_RECONCILE_CYCLES = 1000;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function nextSession(session, onLogFocus) {
  const { mode, workMinutes, breakMinutes, sessionsCompleted } = session;
  if (mode === 'work') {
    onLogFocus(workMinutes);
    return { ...session, mode: 'break', secondsLeft: breakMinutes * 60, sessionsCompleted: sessionsCompleted + 1 };
  }
  return { ...session, mode: 'work', secondsLeft: workMinutes * 60 };
}

// Catches up the timer for time that passed while this tab/component was unmounted.
function reconcileElapsed(session, onLogFocus) {
  if (!session.running || !session.updatedAt) return session;
  let elapsed = Math.floor((Date.now() - session.updatedAt) / 1000);
  if (elapsed <= 0) return { ...session, updatedAt: Date.now() };

  let next = session;
  for (let i = 0; i < MAX_RECONCILE_CYCLES && elapsed > 0; i++) {
    if (elapsed < next.secondsLeft) {
      next = { ...next, secondsLeft: next.secondsLeft - elapsed };
      elapsed = 0;
    } else {
      elapsed -= next.secondsLeft;
      next = nextSession(next, onLogFocus);
    }
  }
  return { ...next, updatedAt: Date.now() };
}

export default function FocusTab({ stats, onLogFocus }) {
  const [session, setSession] = useServerStorage(STORAGE_KEYS.focusSession, DEFAULT_FOCUS_SESSION);
  const { mode, workMinutes, breakMinutes, secondsLeft, running, sessionsCompleted } = session;
  const intervalRef = useRef(null);

  // Reconcile time that passed while this tab was hidden/unmounted.
  useEffect(() => {
    setSession((prev) => reconcileElapsed(prev, onLogFocus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (prev.secondsLeft <= 1) {
          return { ...nextSession(prev, onLogFocus), running: false, updatedAt: Date.now() };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1, updatedAt: Date.now() };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60;

  function toggleRunning() {
    setSession((prev) => ({ ...prev, running: !prev.running, updatedAt: Date.now() }));
  }

  function reset() {
    setSession((prev) => ({
      ...prev,
      running: false,
      secondsLeft: (prev.mode === 'work' ? prev.workMinutes : prev.breakMinutes) * 60,
      updatedAt: Date.now(),
    }));
  }

  function skip() {
    setSession((prev) => {
      if (prev.mode === 'work') {
        return { ...prev, running: false, mode: 'break', secondsLeft: prev.breakMinutes * 60, updatedAt: Date.now() };
      }
      return { ...prev, running: false, mode: 'work', secondsLeft: prev.workMinutes * 60, updatedAt: Date.now() };
    });
  }

  function changeWorkMinutes(value) {
    setSession((prev) => ({
      ...prev,
      workMinutes: value,
      secondsLeft: prev.mode === 'work' && !prev.running ? value * 60 : prev.secondsLeft,
    }));
  }

  function changeBreakMinutes(value) {
    setSession((prev) => ({
      ...prev,
      breakMinutes: value,
      secondsLeft: prev.mode === 'break' && !prev.running ? value * 60 : prev.secondsLeft,
    }));
  }

  const progress = 1 - secondsLeft / totalSeconds;
  const today = getTodayString();
  const todayHistory = getHistoryEntry(stats, today);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Focus</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col items-center gap-4">
          <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full ${
            mode === 'work' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
          }`}>
            {mode === 'work' ? 'Focus session' : 'Break'}
          </span>

          <ProgressRing progress={progress} size={180} strokeWidth={12} label={formatTime(secondsLeft)} sublabel={mode === 'work' ? 'Stay focused' : 'Take a breather'} />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={skip}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Skip to next session"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <label className="flex items-center gap-1.5">
              Focus
              <select
                value={workMinutes}
                onChange={(e) => changeWorkMinutes(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORK_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}m</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              Break
              <select
                value={breakMinutes}
                onChange={(e) => changeBreakMinutes(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BREAK_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}m</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">{sessionsCompleted} session{sessionsCompleted === 1 ? '' : 's'} completed this visit</p>
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Timer size={15} className="text-blue-500" />
                Focus Time
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">{todayHistory.focusMinutes}m today</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Minutes focused, last 7 days</p>
            <ActivityChart history={stats.history || {}} metric="focusMinutes" />
          </div>
        </div>
      </div>
    </div>
  );
}
