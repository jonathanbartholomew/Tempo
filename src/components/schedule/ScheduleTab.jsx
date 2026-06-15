import { useState } from 'react';
import { Plus, X, Trash2, Calendar, List, ChevronLeft, ChevronRight, EyeOff, AlertTriangle } from 'lucide-react';
import TimeGrid from './TimeGrid';
import MonthCalendar from './MonthCalendar';
import TaskRow from '../today/TaskRow';
import { PRIORITIES, MEETING_DURATIONS, getJob, getTodayString, formatDateLong, shiftDate } from '../../utils/helpers';

export default function ScheduleTab({ tasks, jobs, meetings, googleEvents, googleEventErrors, onAddTask, onAddMeeting, onToggleTask, onDeleteTask, onDeleteMeeting, onHideEvent, onGoToSettings }) {
  const [date, setDate] = useState(getTodayString());
  const [viewMode, setViewMode] = useState('day');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('task');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  const dayTasks = tasks.filter((t) => t.date === date);
  const allDayGoogleEvents = (googleEvents || []).filter((e) => e.date === date && e.allDay);

  function resetForm() {
    setTitle('');
    setJobId('');
    setPriority('normal');
    setTime('09:00');
    setDuration(30);
    setNotes('');
    setShowForm(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (formType === 'task') {
      onAddTask({ title: trimmed, jobId: jobId || null, priority, date });
    } else {
      onAddMeeting({
        title: trimmed,
        jobId: jobId || null,
        date,
        time,
        duration,
        notes,
        reminder: false,
        reminderMins: 15,
      });
    }
    resetForm();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {googleEventErrors && googleEventErrors.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="flex-1">
            Couldn't load Google Calendar events for {googleEventErrors.map((e) => e.email).join(', ')}.
            {googleEventErrors.some((e) => e.reason === 'expired') ? ' Your session may have expired.' : ''}
          </span>
          {onGoToSettings && (
            <button onClick={onGoToSettings} className="font-semibold underline hover:no-underline">
              Go to Settings
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedule</h1>
        <div className="flex items-center gap-2">
          {viewMode === 'day' && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <List size={16} />
              Day
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Calendar size={16} />
              Month
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <MonthCalendar
          selectedDate={date}
          onSelectDate={setDate}
          tasks={tasks}
          meetings={meetings}
          googleEvents={googleEvents}
        />
      )}

      {viewMode === 'day' && (
      <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateLong(date)}</p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setDate(getTodayString())}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <div className="flex gap-2">
            {['task', 'meeting'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  formType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={formType === 'task' ? 'Task title...' : 'Meeting title...'}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex flex-wrap gap-2">
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>

            {formType === 'task' ? (
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MEETING_DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {formType === 'meeting' && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Add {formType === 'task' ? 'Task' : 'Meeting'}
          </button>
        </form>
      )}
      </>
      )}

      {viewMode === 'month' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateLong(date)}</p>
      )}

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

      <TimeGrid date={date} meetings={meetings} jobs={jobs} googleEvents={googleEvents} onMeetingClick={setSelectedMeeting} onHideEvent={onHideEvent} />

      {selectedMeeting && (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedMeeting.title}</h3>
            <button onClick={() => setSelectedMeeting(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMeeting.time} · {selectedMeeting.duration} min</p>
          {selectedMeeting.notes && <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMeeting.notes}</p>}
          <button
            onClick={() => {
              onDeleteMeeting(selectedMeeting.id);
              setSelectedMeeting(null);
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
          >
            <Trash2 size={16} />
            Delete meeting
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tasks for this day</h2>
        {dayTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tasks scheduled.</p>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => (
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
    </div>
  );
}
