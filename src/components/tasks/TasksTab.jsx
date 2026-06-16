import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TaskRow from '../today/TaskRow';
import QuickAdd from '../today/QuickAdd';
import AIPlanImport from '../today/AIPlanImport';
import { getJob, getTodayString, formatDateLong } from '../../utils/helpers';

function fmtMinutes(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function TasksTab({ tasks, jobs, meetings, googleEvents, onAddTask, onAddMeeting, onAiPlanImported, onToggleTask, onDeleteTask, onEditTask, timeFormat, timeTracking }) {
  const [addDate, setAddDate] = useState(getTodayString());
  const [showCompleted, setShowCompleted] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showAnytime, setShowAnytime] = useState(false);

  const today = getTodayString();

  // Build a title → total minutes map from week entries (already includes today)
  const minutesByTitle = {};
  (timeTracking?.weekEntries || []).forEach((entry) => {
    const key = entry.task_title?.trim().toLowerCase();
    if (!key) return;
    minutesByTitle[key] = (minutesByTitle[key] || 0) + (entry.minutes || 0);
  });

  function trackedFor(task) {
    return minutesByTitle[task.title?.trim().toLowerCase()] || 0;
  }
  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));

  const overdue = pending.filter((t) => t.date && t.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const todayPending = pending.filter((t) => t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todayDone = tasks.filter((t) => t.done && t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todayTotal = todayPending.length + todayDone.length;
  const todayProgress = todayTotal > 0 ? todayDone.length / todayTotal : 0;

  const upcoming = pending.filter((t) => t.date && t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const noDate = pending.filter((t) => !t.date);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>

      <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <label htmlFor="task-add-date">Add for:</label>
          <input
            id="task-add-date"
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <QuickAdd jobs={jobs} onAdd={(task) => onAddTask({ ...task, date: addDate })} />
      </div>

      <AIPlanImport jobs={jobs} tasks={tasks} meetings={meetings} googleEvents={googleEvents} date={addDate} onAddTask={onAddTask} onAddMeeting={onAddMeeting} onAiPlanImported={onAiPlanImported} />

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length} accent="text-red-500">
          {overdue.map((task) => (
            <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} trackedMinutes={trackedFor(task)} />
          ))}
        </Section>
      )}

      {/* Today — always visible with progress bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Today
          </h2>
          {todayTotal > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {todayDone.length} / {todayTotal} done
            </span>
          )}
        </div>

        {todayTotal > 0 && (
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${todayProgress * 100}%` }}
            />
          </div>
        )}

        <div className="space-y-2">
          {todayPending.length === 0 && todayDone.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing for today.</p>
          ) : (
            todayPending.map((task) => (
              <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
            ))
          )}

          {todayDone.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              {todayDone.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming — collapsible, default closed */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowUpcoming((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {showUpcoming ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Upcoming
            <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              ({upcoming.length})
            </span>
          </button>
          {showUpcoming && (
            <div className="space-y-2">
              {upcoming.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} trackedMinutes={trackedFor(task)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Anytime — collapsible, default closed */}
      {noDate.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAnytime((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {showAnytime ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Anytime
            <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              ({noDate.length})
            </span>
          </button>
          {showAnytime && (
            <div className="space-y-2">
              {noDate.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed — collapsible, default closed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Completed
            <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              ({completed.length})
            </span>
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={task.date ? formatDateLong(task.date) : null} trackedMinutes={trackedFor(task)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
