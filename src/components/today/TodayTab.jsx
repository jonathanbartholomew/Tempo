import { useState } from "react";
import {
  Clock,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarSearch,
  EyeOff,
  Timer,
} from "lucide-react";
import TaskRow from "./TaskRow";
import QuickAdd from "./QuickAdd";
import AIPlanImport from "./AIPlanImport";
import ProgressRing from "./ProgressRing";
import ActivityChart from "./ActivityChart";
import MonthCalendar from "../schedule/MonthCalendar";
import {
  getTodayString,
  formatDateLong,
  formatTime,
  getJob,
  getLevelInfo,
  shiftDate,
  getHistoryEntry,
} from "../../utils/helpers";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function TodayTab({
  tasks,
  jobs,
  meetings,
  googleEvents,
  stats,
  user,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
  onGoToMeetings,
  onHideEvent,
  timeFormat,
}) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const today = getTodayString();
  const [viewDate, setViewDate] = useState(today);
  const isToday = viewDate === today;

  const todaysTasks = tasks.filter((t) => t.date === viewDate);
  const completed = todaysTasks.filter((t) => t.done);

  const timedTasks = todaysTasks.filter((t) => t.time);
  const untimedTasks = todaysTasks.filter((t) => !t.time);
  const pendingUntimed = untimedTasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const completedUntimed = untimedTasks.filter((t) => t.done);

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...pendingUntimed];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onReorderTasks(reordered.map((t) => t.id));
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  const todaysMeetings = meetings.filter((m) => m.date === viewDate);

  const allDayGoogleEvents = (googleEvents || []).filter(
    (e) => e.date === viewDate && e.allDay,
  );
  const timedGoogleEvents = (googleEvents || []).filter(
    (e) => e.date === viewDate && !e.allDay,
  );

  const timeline = [
    ...timedTasks.map((t) => ({
      type: "task",
      time: t.time,
      key: `task-${t.id}`,
      data: t,
    })),
    ...todaysMeetings.map((m) => ({
      type: "meeting",
      time: m.time,
      key: `meeting-${m.id}`,
      data: m,
    })),
    ...timedGoogleEvents.map((e) => ({
      type: "google",
      time: e.time,
      key: e.id,
      data: e,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const progress = todaysTasks.length
    ? completed.length / todaysTasks.length
    : 0;
  const level = getLevelInfo(stats.totalXp);
  const todayHistory = getHistoryEntry(stats, today);
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {greeting()}, {firstName}
            </h1>
            <p className="text-lg text-gray-500 dark:text-white">
              let's make today count.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateLong(viewDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Level {level.level}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.totalXp} XP total
            </p>
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
              isToday
                ? "text-gray-400 dark:text-gray-600 cursor-default"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        <QuickAdd
          jobs={jobs}
          onAdd={(task) => onAddTask({ ...task, date: viewDate })}
        />

        <AIPlanImport
          jobs={jobs}
          tasks={tasks}
          meetings={meetings}
          googleEvents={googleEvents}
          date={viewDate}
          onAddTask={onAddTask}
        />
      </div>

      {/* Row 1: Today's Plan + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Today's Plan
            </h2>
            <button
              onClick={onGoToMeetings}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <CalendarPlus size={14} />
              Add Meeting
            </button>
          </div>

          {allDayGoogleEvents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allDayGoogleEvents.map((event) => (
                <span
                  key={event.id}
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium border border-dashed bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  style={{ borderColor: event.accountColor || "#9ca3af" }}
                >
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
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

          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
            {timeline.length === 0 &&
              pendingUntimed.length === 0 &&
              completedUntimed.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Nothing planned yet. Add a task above to get started.
                </p>
              )}

            {timeline.map((item) => {
              if (item.type === "task") {
                return (
                  <TaskRow
                    key={item.key}
                    task={item.data}
                    job={getJob(jobs, item.data.jobId)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    timeFormat={timeFormat}
                  />
                );
              }
              if (item.type === "meeting") {
                const meeting = item.data;
                const job = getJob(jobs, meeting.jobId);
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                    style={{
                      borderLeftColor: job?.color || "#9ca3af",
                      borderLeftWidth: 4,
                    }}
                  >
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTime(meeting.time, timeFormat)}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {meeting.title}
                    </span>
                    {job && (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: job.color }}
                      >
                        {job.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {meeting.duration}m
                    </span>
                  </div>
                );
              }
              const event = item.data;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <CalendarSearch
                    size={16}
                    className="text-gray-400 flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(event.time, timeFormat)}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {event.title}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: event.accountColor || "#6b7280" }}
                  >
                    {event.account}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {event.duration}m
                  </span>
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

            {pendingUntimed.map((task, index) => (
              <div
                key={task.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                className={
                  dragOverIndex === index && dragIndex !== null && dragIndex !== index
                    ? "rounded-xl ring-2 ring-blue-400"
                    : ""
                }
              >
                <TaskRow
                  task={task}
                  job={getJob(jobs, task.jobId)}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                  timeFormat={timeFormat}
                  dragHandleProps={{
                    draggable: true,
                    onDragStart: () => handleDragStart(index),
                    onDragEnd: handleDragEnd,
                  }}
                />
              </div>
            ))}

            {completedUntimed.length > 0 && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowCompleted((s) => !s)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showCompleted ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  Completed ({completedUntimed.length})
                </button>
                {showCompleted &&
                  completedUntimed.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      job={getJob(jobs, task.jobId)}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      timeFormat={timeFormat}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Calendar
          </h2>
          <MonthCalendar
            selectedDate={viewDate}
            onSelectDate={setViewDate}
            tasks={tasks}
            meetings={meetings}
            googleEvents={googleEvents}
          />
        </div>
      </div>

      {/* Row 2: Focus time + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Timer size={15} className="text-blue-500" />
              Focus Time
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {todayHistory.focusMinutes}m today
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Minutes focused, last 7 days
          </p>
          <ActivityChart history={stats.history || {}} metric="focusMinutes" />
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4">
          <ProgressRing
            progress={progress}
            size={96}
            strokeWidth={9}
            label={`${Math.round(progress * 100)}%`}
            sublabel="Progress"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Today's Progress
            </p>
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
      </div>
    </div>
  );
}
