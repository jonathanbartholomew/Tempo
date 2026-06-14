import { useState } from 'react';
import { Clock, CalendarPlus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CalendarSearch, EyeOff } from 'lucide-react';
import TaskRow from './TaskRow';
import QuickAdd from './QuickAdd';
import AIPlanImport from './AIPlanImport';
import ProgressRing from './ProgressRing';
import ActivityChart from './ActivityChart';
import { getTodayString, formatDateLong, getJob, getLevelInfo, shiftDate } from '../../utils/helpers';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayTab({ tasks, jobs, meetings, googleEvents, stats, onAddTask, onAddMeeting, onToggleTask, onDeleteTask, onGoToMeetings, onHideEvent }) {
  const [showCompleted, setShowCompleted] = useState(true);
  const today = getTodayString();
  const [viewDate, setViewDate] = useState(today);
  const isToday = viewDate === today;

  const todaysTasks = tasks.filter((t) => t.date === viewDate);
  const completed = todaysTasks.filter((t) => t.done);

  const timedTasks = todaysTasks.filter((t) => t.time);
  const untimedTasks = todaysTasks.filter((t) => !t.time);
  const pendingUntimed = untimedTasks.filter((t) => !t.done);
  const completedUntimed = untimedTasks.filter((t) => t.done);

  const todaysMeetings = meetings.filter((m) => m.date === viewDate);

  const allDayGoogleEvents = (googleEvents || []).filter((e) => e.date === viewDate && e.allDay);
  const timedGoogleEvents = (googleEvents || []).filter((e) => e.date === viewDate && !e.allDay);

  const timeline = [
    ...timedTasks.map((t) => ({ type: 'task', time: t.time, key: `task-${t.id}`, data: t })),
    ...todaysMeetings.map((m) => ({ type: 'meeting', time: m.time, key: `meeting-${m.id}`, data: m })),
    ...timedGoogleEvents.map((e) => ({ type: 'google', time: e.time, key: e.id, data: e })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const progress = todaysTasks.length ? completed.length / todaysTasks.length : 0;
  const level = getLevelInfo(stats.totalXp);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDateLong(viewDate)}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isToday ? `${greeting()}! Here's what's on deck today.` : "Here's what's on deck."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Level {level.level}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.totalXp} XP total</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setViewDate((d) => shiftDate(d, -1))}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setViewDate(today)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isToday ? 'text-gray-400 dark:text-gray-600 cursor-default' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setViewDate((d) => shiftDate(d, 1))}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4">
            <ProgressRing progress={progress} size={96} strokeWidth={9} label={`${Math.round(progress * 100)}%`} sublabel="Progress" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today's Plan</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {completed.length} of {todaysTasks.length} tasks done
              </p>
              <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Focus Time</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">XP earned, last 7 days</p>
            <div className="mt-2">
              <ActivityChart history={stats.history || {}} />
            </div>
          </div>
        </div>
      </div>

      <QuickAdd jobs={jobs} onAdd={(task) => onAddTask({ ...task, date: viewDate })} />

      <AIPlanImport jobs={jobs} tasks={tasks} meetings={meetings} googleEvents={googleEvents} date={viewDate} onAddTask={onAddTask} onAddMeeting={onAddMeeting} />

      {allDayGoogleEvents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allDayGoogleEvents.map((event) => (
            <span
              key={event.id}
              className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium border border-dashed bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              style={{ borderColor: event.accountColor || '#9ca3af' }}
            >
              <a href={event.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {event.title} · All day · {event.account}
              </a>
              <button
                onClick={() => onHideEvent(event.title)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Hide ${event.title}`}
                title="Hide this event from Tempo"
              >
                <EyeOff size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today's Schedule</h2>
          <button
            onClick={onGoToMeetings}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <CalendarPlus size={14} />
            Add Meeting
          </button>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing scheduled at a specific time today.</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((item) => {
              if (item.type === 'task') {
                return (
                  <TaskRow
                    key={item.key}
                    task={item.data}
                    job={getJob(jobs, item.data.jobId)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                  />
                );
              }
              if (item.type === 'meeting') {
                const meeting = item.data;
                const job = getJob(jobs, meeting.jobId);
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                    style={{ borderLeftColor: job?.color || '#9ca3af', borderLeftWidth: 4 }}
                  >
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{meeting.time}</span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{meeting.title}</span>
                    {job && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full text-white" style={{ backgroundColor: job.color }}>
                        {job.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{meeting.duration}m</span>
                  </div>
                );
              }
              const event = item.data;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <CalendarSearch size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.time}</span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{event.title}</span>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: event.accountColor || '#6b7280' }}
                  >
                    {event.account}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{event.duration}m</span>
                  <button
                    onClick={() => onHideEvent(event.title)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label={`Hide ${event.title}`}
                    title="Hide this event from Tempo"
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Anytime Tasks</h2>
        {pendingUntimed.length === 0 && completedUntimed.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing on the list yet. Add something above!</p>
        )}
        <div className="space-y-2">
          {pendingUntimed.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              job={getJob(jobs, task.jobId)}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>

        {completedUntimed.length > 0 && (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowCompleted((s) => !s)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Completed ({completedUntimed.length})
            </button>
            {showCompleted && (
              <div className="space-y-2">
                {completedUntimed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    job={getJob(jobs, task.jobId)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
