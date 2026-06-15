import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import MeetingCard from './MeetingCard';
import { MEETING_DURATIONS, REMINDER_LEAD_TIMES, getJob, getTodayString } from '../../utils/helpers';

export default function MeetingsTab({ meetings, jobs, onAddMeeting, onDeleteMeeting }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [jobId, setJobId] = useState('');
  const [reminder, setReminder] = useState(false);
  const [reminderMins, setReminderMins] = useState(15);
  const [notes, setNotes] = useState('');

  const now = new Date();
  const upcoming = [];
  const past = [];
  for (const meeting of meetings) {
    const dt = new Date(`${meeting.date}T${meeting.time}`);
    (dt >= now ? upcoming : past).push(meeting);
  }
  upcoming.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  past.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  function resetForm() {
    setTitle('');
    setDate(getTodayString());
    setTime('09:00');
    setDuration(30);
    setJobId('');
    setReminder(false);
    setReminderMins(15);
    setNotes('');
    setShowForm(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddMeeting({ title: trimmed, jobId: jobId || null, date, time, duration, notes, reminder, reminderMins });
    resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Meetings</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Meeting'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} className="w-4 h-4" />
            Set a reminder
            {reminder && (
              <select
                value={reminderMins}
                onChange={(e) => setReminderMins(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REMINDER_LEAD_TIMES.map((m) => (
                  <option key={m} value={m}>{m} min before</option>
                ))}
              </select>
            )}
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Add Meeting
          </button>
        </form>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No upcoming meetings.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} job={getJob(jobs, m.jobId)} onDelete={onDeleteMeeting} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Past</h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No past meetings.</p>
        ) : (
          <div className="space-y-2">
            {past.map((m) => (
              <MeetingCard key={m.id} meeting={m} job={getJob(jobs, m.jobId)} onDelete={onDeleteMeeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
