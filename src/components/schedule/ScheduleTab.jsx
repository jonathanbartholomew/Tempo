import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, AlertTriangle, Clock, Briefcase, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { getJob, getTodayString, formatTime } from '../../utils/helpers';
import { PRIORITIES, MEETING_DURATIONS } from '../../utils/helpers';
import { AnimatedModal } from '../ui/AnimatedModal';

// ─── Layout constants ─────────────────────────────────────────────────────────
const HOUR_H = 56;        // px per hour in time grid
const START_H = 6;        // grid starts 6 AM
const END_H = 23;         // grid ends 11 PM
const GUTTER_W = 52;      // px for the time label column

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toDS(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDays(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return toDS(day);
  });
}

function formatWeekRange(dateStr) {
  const days = getWeekDays(dateStr);
  const a = new Date(days[0] + 'T00:00:00');
  const b = new Date(days[6] + 'T00:00:00');
  if (a.getMonth() === b.getMonth())
    return `${a.toLocaleDateString(undefined, { month: 'long' })} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
  if (a.getFullYear() === b.getFullYear())
    return `${a.toLocaleDateString(undefined, { month: 'short' })} ${a.getDate()} – ${b.toLocaleDateString(undefined, { month: 'short' })} ${b.getDate()}, ${a.getFullYear()}`;
  return `${a.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${b.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function navDate(dateStr, view, dir) {
  const d = new Date(dateStr + 'T00:00:00');
  if (view === 'day') d.setDate(d.getDate() + dir);
  else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return toDS(d);
}

function formatLabel(dateStr, view) {
  const d = new Date(dateStr + 'T00:00:00');
  if (view === 'day') return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (view === 'week') return formatWeekRange(dateStr);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// ─── Event layout helpers ─────────────────────────────────────────────────────
function minsFromStart(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return (h - START_H) * 60 + m;
}

function computeLayout(events) {
  const sorted = [...events].sort((a, b) => a.sm - b.sm || b.em - a.em);
  const colEnds = [];
  const laid = sorted.map(ev => {
    let ci = colEnds.findIndex(end => ev.sm >= end);
    if (ci === -1) { ci = colEnds.length; colEnds.push(ev.em); }
    else colEnds[ci] = ev.em;
    return { ...ev, ci };
  });
  return laid.map(ev => ({ ...ev, nc: colEnds.length }));
}

function getDayEvents(date, tasks, meetings, googleEvents, jobs, timeFormat) {
  const raw = [];
  tasks.filter(t => t.date === date && t.time).forEach(t => {
    const job = getJob(jobs, t.jobId);
    const sm = minsFromStart(t.time);
    raw.push({ id: `t-${t.id}`, type: 'task', title: t.title, sub: formatTime(t.time, timeFormat) + (job ? ` · ${job.name}` : ''), jobName: job?.name || null, notes: t.notes || null, color: job?.color || '#3b82f6', sm, em: sm + (t.duration || 30), done: t.done });
  });
  meetings.filter(m => m.date === date && m.time).forEach(m => {
    const job = getJob(jobs, m.jobId);
    const sm = minsFromStart(m.time);
    raw.push({ id: `m-${m.id}`, type: 'meeting', title: m.title, sub: formatTime(m.time, timeFormat) + ` · ${m.duration}m` + (job ? ` · ${job.name}` : ''), jobName: job?.name || null, notes: m.notes || null, color: job?.color || '#6366f1', sm, em: sm + (m.duration || 60), done: false });
  });
  (googleEvents || []).filter(e => e.date === date && !e.allDay && e.time).forEach(e => {
    const job = jobs.find(j => j.googleAccountEmail === e.accountEmail) || null;
    const sm = minsFromStart(e.time);
    raw.push({ id: `g-${e.id}`, type: 'google', title: e.title, sub: formatTime(e.time, timeFormat) + ` · ${e.account}`, jobName: job?.name || null, color: job?.color || e.accountColor || '#6b7280', notes: e.description || null, sm, em: sm + (e.duration || 60), done: false, google: true, link: e.link });
  });
  return computeLayout(raw);
}

// ─── EventDetail modal content ────────────────────────────────────────────────
function EventDetailCard({ ev, onClose }) {
  const typeLabel = ev.google ? 'Google Calendar' : ev.type === 'meeting' ? 'Meeting' : 'Task';
  const durationMins = ev.em - ev.sm;
  const durationLabel = durationMins >= 60 ? `${Math.floor(durationMins / 60)}h${durationMins % 60 ? ` ${durationMins % 60}m` : ''}` : `${durationMins}m`;

  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700">
      {/* Color header strip */}
      <div className="h-1.5" style={{ backgroundColor: ev.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                {typeLabel}
              </span>
              {ev.done && <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">Done</span>}
            </div>
            <h2 className={`text-lg font-bold text-gray-900 dark:text-white leading-snug ${ev.done ? 'line-through opacity-50' : ''}`}>{ev.title}</h2>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
            <Clock size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span>{ev.sub.split(' · ')[0]} · {durationLabel}</span>
          </div>
          {ev.jobName && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <Briefcase size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <span>{ev.jobName}</span>
            </div>
          )}
          {ev.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {ev.notes}
            </div>
          )}
        </div>

        {ev.google && ev.link && (
          <a href={ev.link} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            <ExternalLink size={13} />
            Open in Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}

// ─── EventBlock ───────────────────────────────────────────────────────────────
function EventBlock({ ev, pxPerMin, onOpen }) {
  const top = Math.max(0, ev.sm) * pxPerMin;
  const height = Math.max((ev.em - ev.sm) * pxPerMin, 20);
  const colW = 100 / ev.nc;
  const style = {
    position: 'absolute',
    top,
    height,
    left: `calc(${ev.ci * colW}% + 1px)`,
    width: `calc(${colW}% - 3px)`,
    borderLeft: `2.5px solid ${ev.done ? '#6b7280' : ev.color}`,
    backgroundColor: ev.google ? `${ev.color}15` : `${ev.color}1a`,
    borderRadius: '4px',
    overflow: 'hidden',
    padding: '3px 5px',
    cursor: 'pointer',
  };

  return (
    <div style={style} onClick={() => onOpen(ev)} className="hover:brightness-95 dark:hover:brightness-110 transition-all">
      <div className={`text-xs font-semibold leading-tight truncate text-gray-900 dark:text-gray-100 ${ev.done ? 'line-through opacity-40' : ''}`}>{ev.title}</div>
      {height > 34 && <div className="text-[11px] opacity-55 truncate text-gray-700 dark:text-gray-400 mt-0.5">{ev.sub}</div>}
    </div>
  );
}

// ─── TimeBody (shared between DayView + WeekView) ─────────────────────────────
function TimeBody({ days, eventsByDay, pxPerMin, todayStr, nowMins, onOpen }) {
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const totalH = (END_H - START_H) * HOUR_H;

  return (
    <div className="flex" style={{ height: totalH }}>
      {/* Time gutter */}
      <div className="relative flex-shrink-0" style={{ width: GUTTER_W }}>
        {hours.map(h => (
          <div key={h} className="absolute w-full flex justify-end pr-2 select-none" style={{ top: (h - START_H) * HOUR_H - 8 }}>
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {h === 0 ? '' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((d) => (
        <div key={d} className="flex-1 relative border-l border-gray-100 dark:border-gray-800/50 min-w-0">
          {/* Hour lines */}
          {hours.map(h => (
            <div key={h} className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800/50" style={{ top: (h - START_H) * HOUR_H }} />
          ))}
          {/* Half-hour lines (subtle) */}
          {hours.map(h => (
            <div key={`hh-${h}`} className="absolute left-0 right-0 border-t border-gray-50 dark:border-gray-900/50" style={{ top: (h - START_H) * HOUR_H + HOUR_H / 2 }} />
          ))}
          {/* Today highlight */}
          {d === todayStr && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(59,130,246,0.03)' }} />}
          {/* Events */}
          {(eventsByDay[d] || []).map(ev => (
            <EventBlock key={ev.id} ev={ev} pxPerMin={pxPerMin} onOpen={onOpen} />
          ))}
          {/* Current time line */}
          {d === todayStr && nowMins >= 0 && nowMins <= (END_H - START_H) * 60 && (
            <div className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none z-10" style={{ top: nowMins * pxPerMin }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── DayView ─────────────────────────────────────────────────────────────────
function DayView({ date, tasks, meetings, jobs, googleEvents, timeFormat, onOpen }) {
  const todayStr = getTodayString();
  const now = new Date();
  const pxPerMin = HOUR_H / 60;
  const nowMins = (now.getHours() - START_H) * 60 + now.getMinutes();
  const allDay = (googleEvents || []).filter(e => e.date === date && e.allDay);
  const eventsByDay = useMemo(() => ({
    [date]: getDayEvents(date, tasks, meetings, googleEvents, jobs, timeFormat),
  }), [date, tasks, meetings, googleEvents, jobs, timeFormat]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowMins * pxPerMin - 180);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {allDay.length > 0 && (
        <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-shrink-0 flex items-center justify-end pr-2 text-xs text-gray-400 dark:text-gray-600" style={{ width: GUTTER_W }}>all day</div>
          <div className="flex-1 flex flex-wrap gap-1 p-1.5">
            {allDay.map(e => (
              <span key={e.id} className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${e.accountColor || '#6b7280'}20`, color: e.accountColor || '#9ca3af' }}>
                {e.title}
              </span>
            ))}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <TimeBody days={[date]} eventsByDay={eventsByDay} pxPerMin={pxPerMin} todayStr={todayStr} nowMins={nowMins} onOpen={onOpen} />
      </div>
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function WeekView({ date, tasks, meetings, jobs, googleEvents, timeFormat, onOpen }) {
  const todayStr = getTodayString();
  const now = new Date();
  const pxPerMin = HOUR_H / 60;
  const nowMins = (now.getHours() - START_H) * 60 + now.getMinutes();
  const days = useMemo(() => getWeekDays(date), [date]);

  const allDayByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { m[d] = (googleEvents || []).filter(e => e.date === d && e.allDay); });
    return m;
  }, [days, googleEvents]);

  const hasAllDay = days.some(d => allDayByDay[d]?.length > 0);

  const eventsByDay = useMemo(() => {
    const m = {};
    days.forEach(d => { m[d] = getDayEvents(d, tasks, meetings, googleEvents, jobs, timeFormat); });
    return m;
  }, [days, tasks, meetings, googleEvents, jobs, timeFormat]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowMins * pxPerMin - 180);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day headers */}
      <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <div className="flex-shrink-0" style={{ width: GUTTER_W }} />
        {days.map((d, i) => {
          const num = new Date(d + 'T00:00:00').getDate();
          const isToday = d === todayStr;
          return (
            <div key={d} className="flex-1 text-center py-2 border-l border-gray-100 dark:border-gray-800/50">
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{DAY_ABBR[i]}</div>
              <div className={`text-lg font-medium mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {num}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-shrink-0 flex items-end justify-end pb-1 pr-2 text-[10px] text-gray-400 dark:text-gray-600" style={{ width: GUTTER_W }}>all day</div>
          {days.map(d => (
            <div key={d} className="flex-1 p-1 border-l border-gray-100 dark:border-gray-800/50 space-y-0.5 min-w-0">
              {allDayByDay[d]?.map(e => (
                <div key={e.id} className="text-[10px] font-medium rounded px-1 py-px truncate" style={{ backgroundColor: `${e.accountColor || '#6b7280'}20`, color: e.accountColor || '#9ca3af' }}>
                  {e.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <TimeBody days={days} eventsByDay={eventsByDay} pxPerMin={pxPerMin} todayStr={todayStr} nowMins={nowMins} onOpen={onOpen} />
      </div>
    </div>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────
function MonthView({ date, tasks, meetings, googleEvents, jobs, onDayClick }) {
  const todayStr = getTodayString();
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ date: toDS(new Date(year, month - 1, daysInPrev - i)), in: false });
  for (let n = 1; n <= daysInMonth; n++) cells.push({ date: toDS(new Date(year, month, n)), in: true });
  while (cells.length % 7 !== 0) { const n = cells.length - firstDow - daysInMonth + 1; cells.push({ date: toDS(new Date(year, month + 1, n)), in: false }); }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-7 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        {DAY_ABBR.map(n => (
          <div key={n} className="py-2 text-center text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{n}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 overflow-hidden" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}>
        {cells.map((cell, i) => {
          const isToday = cell.date === todayStr;
          const dayNum = new Date(cell.date + 'T00:00:00').getDate();
          const evts = [
            ...(tasks.filter(t => t.date === cell.date).slice(0, 2).map(t => ({ id: `t${t.id}`, title: t.title, color: getJob(jobs, t.jobId)?.color || '#3b82f6' }))),
            ...(meetings.filter(m => m.date === cell.date).slice(0, 1).map(m => ({ id: `m${m.id}`, title: m.title, color: getJob(jobs, m.jobId)?.color || '#6366f1' }))),
            ...((googleEvents || []).filter(e => e.date === cell.date).slice(0, 2).map(e => ({ id: `g${e.id}`, title: e.title, color: e.accountColor || '#6b7280' }))),
          ].slice(0, 4);
          const total = tasks.filter(t => t.date === cell.date).length + meetings.filter(m => m.date === cell.date).length + (googleEvents || []).filter(e => e.date === cell.date).length;

          return (
            <div key={i} onClick={() => onDayClick(cell.date)}
              className={`border-b border-r border-gray-100 dark:border-gray-800/50 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors overflow-hidden ${!cell.in ? 'opacity-25' : ''}`}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {dayNum}
              </div>
              <div className="space-y-px">
                {evts.map(ev => (
                  <div key={ev.id} className="text-[10px] font-medium rounded px-1 truncate" style={{ backgroundColor: `${ev.color}22`, color: ev.color }}>{ev.title}</div>
                ))}
                {total > 4 && <div className="text-[10px] text-gray-400 dark:text-gray-600 px-1">+{total - 4}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────
function AddForm({ jobs, date, onAddTask, onAddMeeting, onClose }) {
  const [type, setType] = useState('task');
  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [formDate, setFormDate] = useState(date);

  function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    if (type === 'task') onAddTask({ title: t, jobId: jobId || null, priority, date: formDate });
    else onAddMeeting({ title: t, jobId: jobId || null, date: formDate, time, duration, notes, reminder: false, reminderMins: 15 });
    onClose();
  }

  return (
    <div className="absolute bottom-20 right-4 z-20 w-72 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {['task', 'meeting'].map(tp => (
            <button key={tp} type="button" onClick={() => setType(tp)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${type === tp ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >{tp}</button>
          ))}
        </div>
        <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder={type === 'task' ? 'Task title...' : 'Meeting title...'}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={jobId} onChange={e => setJobId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No job</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        {type === 'task' ? (
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        ) : (
          <>
            <div className="flex gap-2">
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MEETING_DURATIONS.map(d => <option key={d} value={d}>{d}m</option>)}
              </select>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}
        <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          Add {type === 'task' ? 'Task' : 'Meeting'}
        </button>
      </form>
    </div>
  );
}

// ─── ScheduleTab ──────────────────────────────────────────────────────────────
export default function ScheduleTab({ tasks, jobs, meetings, googleEvents, googleEventErrors, onAddTask, onAddMeeting, onGoToSettings }) {
  const today = getTodayString();
  const [view, setView] = useState('week');
  const [date, setDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [modalEv, setModalEv] = useState(null);

  return (
    <>
    <AnimatedModal open={!!modalEv} onClose={() => setModalEv(null)}>
      {modalEv && <EventDetailCard ev={modalEv} onClose={() => setModalEv(null)} />}
    </AnimatedModal>

    <div className="overflow-hidden p-6" style={{ height: '100vh' }}>
      <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
      {/* Error banner */}
      {googleEventErrors?.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span className="flex-1">Couldn't load Google Calendar events for {googleEventErrors.map(e => e.email).join(', ')}.</span>
          {onGoToSettings && <button onClick={onGoToSettings} className="font-semibold underline hover:no-underline">Go to Settings</button>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => setDate(today)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Today
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(d => navDate(d, view, -1))} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setDate(d => navDate(d, view, 1))} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">{formatLabel(date, view)}</span>
        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 gap-0.5">
          {['day', 'week', 'month'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${view === v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 min-h-0 relative bg-white dark:bg-gray-950">
        {view === 'day' && (
          <DayView date={date} tasks={tasks} meetings={meetings} jobs={jobs} googleEvents={googleEvents} timeFormat="12h" onOpen={setModalEv} />
        )}
        {view === 'week' && (
          <WeekView date={date} tasks={tasks} meetings={meetings} jobs={jobs} googleEvents={googleEvents} timeFormat="12h" onOpen={setModalEv} />
        )}
        {view === 'month' && (
          <MonthView date={date} tasks={tasks} meetings={meetings} googleEvents={googleEvents} jobs={jobs}
            onDayClick={(d) => { setDate(d); setView('day'); }}
          />
        )}

        {/* Floating Add button */}
        <button
          onClick={() => setShowForm(s => !s)}
          className={`absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold transition-all ${showForm ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add'}
        </button>

        {showForm && (
          <AddForm jobs={jobs} date={date} onAddTask={onAddTask} onAddMeeting={onAddMeeting} onClose={() => setShowForm(false)} />
        )}
      </div>
      </div>
    </div>
    </>
  );
}
