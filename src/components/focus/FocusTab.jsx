import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Timer } from 'lucide-react';
import ProgressRing from '../today/ProgressRing';
import ActivityChart from '../today/ActivityChart';
import { getTodayString, getHistoryEntry } from '../../utils/helpers';

const WORK_OPTIONS = [15, 25, 45, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTab({ stats, onLogFocus }) {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60;

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handleSessionEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, workMinutes, breakMinutes]);

  function handleSessionEnd() {
    setRunning(false);
    if (mode === 'work') {
      onLogFocus(workMinutes);
      setSessionsCompleted((c) => c + 1);
      setMode('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode('work');
      setSecondsLeft(workMinutes * 60);
    }
  }

  function toggleRunning() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft((mode === 'work' ? workMinutes : breakMinutes) * 60);
  }

  function skip() {
    setRunning(false);
    if (mode === 'work') {
      setMode('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode('work');
      setSecondsLeft(workMinutes * 60);
    }
  }

  function changeWorkMinutes(value) {
    setWorkMinutes(value);
    if (mode === 'work' && !running) setSecondsLeft(value * 60);
  }

  function changeBreakMinutes(value) {
    setBreakMinutes(value);
    if (mode === 'break' && !running) setSecondsLeft(value * 60);
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
