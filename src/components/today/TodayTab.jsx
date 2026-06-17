import { useState } from "react";
import {
  Clock,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarSearch,
  Calendar,
  EyeOff,
  Timer,
  CheckCircle2,
} from "lucide-react";
import TaskRow from "./TaskRow";
import QuickAdd from "./QuickAdd";
import AIPlanImport from "./AIPlanImport";
import ProgressRing from "./ProgressRing";
import ActivityChart from "./ActivityChart";
import MonthCalendar from "../schedule/MonthCalendar";
import JiraCard from "../jira/JiraCard";
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
  onToggleMeeting,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
  onAddMeeting,
  onAiPlanImported,
  onGoToMeetings,
  onHideEvent,
  gcalAttended,
  onToggleGoogleEvent,
  timeFormat,
  jira,
  onGoToJira,
  timeTracking,
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

  const todayGoogleEvents = [...timedGoogleEvents, ...allDayGoogleEvents];
  const attendedAppMeetings = todaysMeetings.filter((m) => m.attended).length;
  const attendedGcal = todayGoogleEvents.filter((e) => gcalAttended?.[e.id]?.attended).length;
  const attendedMeetings = attendedAppMeetings + attendedGcal;
  const totalMeetings = todaysMeetings.length + todayGoogleEvents.length;
  const totalItems = todaysTasks.length + totalMeetings;
  const taskFrac = totalItems > 0 ? completed.length / totalItems : 0;
  const meetingFrac = totalItems > 0 ? attendedMeetings / totalItems : 0;
  const combinedPct = totalItems > 0 ? Math.round((completed.length + attendedMeetings) / totalItems * 100) : 0;

  const progress = todaysTasks.length
    ? completed.length / todaysTasks.length
    : 0;
  const level = getLevelInfo(stats.totalXp);
  const todayHistory = getHistoryEntry(stats, today);
  const firstName = user?.name?.split(" ")[0] || "there";

  const trackedHistory = {};
  (timeTracking?.weekEntries || []).forEach((entry) => {
    const d = entry.date?.slice(0, 10);
    if (!d) return;
    if (!trackedHistory[d]) trackedHistory[d] = { trackedMinutes: 0 };
    trackedHistory[d].trackedMinutes += entry.minutes || 0;
  });
  const todayTrackedMinutes = trackedHistory[today]?.trackedMinutes || 0;

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
          jiraIssues={jira?.issues || []}
          date={viewDate}
          onAddTask={onAddTask}
          onAddMeeting={onAddMeeting}
          onAiPlanImported={onAiPlanImported}
        />
      </div>

      {/* Progress row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Timer size={15} className="text-blue-500" />
              Time Tracked
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {todayTrackedMinutes}m today
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Minutes tracked across all activity, last 7 days
          </p>
          <ActivityChart history={trackedHistory} metric="trackedMinutes" />
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4">
          <ProgressRing
            taskFrac={taskFrac}
            meetingFrac={meetingFrac}
            size={96}
            strokeWidth={9}
            label={`${combinedPct}%`}
            sublabel="Progress"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Today's Progress
            </p>
            <div className="mt-0.5 space-y-0.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
                {completed.length} of {todaysTasks.length} tasks done
              </p>
              {totalMeetings > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: '#84cc16' }} />
                  {attendedMeetings} of {totalMeetings} meetings attended
                </p>
              )}
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{ width: `${taskFrac * 100}%` }}
              />
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${meetingFrac * 100}%`, backgroundColor: '#84cc16' }}
              />
            </div>
            {todayHistory.xp > 0 && (
              <p className="text-xs font-semibold text-teal-500 dark:text-teal-400 mt-1.5">
                +{todayHistory.xp} XP earned today
              </p>
            )}
          </div>
        </div>
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
                    hideJobBadge
                  />
                );
              }
              if (item.type === "meeting") {
                const meeting = item.data;
                const job = getJob(jobs, meeting.jobId);
                return (
                  <div
                    key={item.key}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${meeting.attended ? 'opacity-50' : ''}`}
                    style={{ borderLeftColor: job?.color || "#9ca3af", borderLeftWidth: 4 }}
                  >
                    {job && (
                      <div className="absolute left-0 top-0 h-full w-2 group/jobtip z-10 cursor-default">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover/jobtip:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg z-50">
                          {job.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => onToggleMeeting?.(meeting.id)}
                      className="flex-shrink-0 transition-colors"
                      title={meeting.attended ? 'Mark as not attended' : 'Mark as attended'}
                    >
                      {meeting.attended
                        ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" />
                        : <Calendar size={16} className="text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400" />}
                    </button>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatTime(meeting.time, timeFormat)}
                    </span>
                    <span className={`flex-1 text-sm text-gray-900 dark:text-gray-100 ${meeting.attended ? 'line-through' : ''}`}>
                      {meeting.title}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{meeting.duration}m</span>
                  </div>
                );
              }
              const event = item.data;
              const gAttended = gcalAttended?.[event.id]?.attended || false;
              const eventJob = jobs.find((j) => j.googleAccountEmail === event.accountEmail) || null;
              return (
                <div
                  key={item.key}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${gAttended ? 'opacity-50' : ''}`}
                  style={{ borderLeftColor: eventJob?.color || event.accountColor || "#6b7280", borderLeftWidth: 4 }}
                >
                  {(eventJob || event.account) && (
                    <div className="absolute left-0 top-0 h-full w-2 group/jobtip z-10 cursor-default">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover/jobtip:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg z-50">
                        {eventJob ? eventJob.name : event.account}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => onToggleGoogleEvent?.(event.id)}
                    className="flex-shrink-0 transition-colors"
                    title={gAttended ? 'Mark as not attended' : 'Mark as attended'}
                  >
                    {gAttended
                      ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" />
                      : <CalendarSearch size={16} className="text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400" />}
                  </button>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(event.time, timeFormat)}
                  </span>
                  <span className={`flex-1 text-sm text-gray-900 dark:text-gray-100 ${gAttended ? 'line-through' : ''}`}>
                    {event.title}
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
                  hideJobBadge
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
                      hideJobBadge
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Calendar
          </h2>
          <div className="flex-1">
            <MonthCalendar
              selectedDate={viewDate}
              onSelectDate={setViewDate}
              tasks={tasks}
              meetings={meetings}
              googleEvents={googleEvents}
              jobs={jobs}
            />
          </div>
        </div>
      </div>

      {/* Jira card — only when connected */}
      {jira?.status?.connected && (
        <JiraCard
          issues={jira.issues}
          issuesLoading={jira.issuesLoading}
          siteName={jira.status.siteName}
          onGoToJira={onGoToJira}
        />
      )}

    </div>
  );
}
