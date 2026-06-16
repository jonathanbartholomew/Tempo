import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toDateKey, getTodayString } from '../../utils/helpers';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - (firstDay + daysInMonth) + 1;
    cells.push({ day: next, inMonth: false, date: new Date(year, month + 1, next) });
  }
  return cells;
}

export default function MonthCalendar({ selectedDate, onSelectDate, tasks, meetings, googleEvents, jobs = [] }) {
  const initial = new Date(`${selectedDate}T00:00:00`);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  function goToPrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goToNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const today = getTodayString();
  const cells = buildGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{monthLabel}</p>
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
        {WEEKDAYS.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1">
        {cells.map((cell, i) => {
          const dateKey = toDateKey(cell.date);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === today;

          const timedTasks = tasks.filter((t) => t.date === dateKey && t.time && !t.done);
          const hasMeetingOrEvent =
            meetings.some((m) => m.date === dateKey) ||
            (googleEvents || []).some((e) => e.date === dateKey);

          const MAX = 2;
          const visible = timedTasks.slice(0, MAX);
          const overflow = timedTasks.length - MAX;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateKey)}
              className={`relative w-full h-full rounded-lg text-xs transition-colors flex flex-col items-center pt-1 gap-0.5 overflow-hidden ${
                !cell.inMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'
              } ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                  ? 'bg-blue-50 dark:bg-blue-500/10 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>{cell.day}</span>

              {cell.inMonth && (visible.length > 0 || hasMeetingOrEvent) && (
                <div className="w-full px-1 space-y-0.5">
                  {visible.map((t) => {
                    const job = jobMap[t.jobId];
                    return (
                      <div
                        key={t.id}
                        className="h-1 rounded-full w-full"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : (job?.color || '#3b82f6') }}
                      />
                    );
                  })}
                  {overflow > 0 && (
                    <p className={`text-[8px] leading-none text-center ${isSelected ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                      +{overflow}
                    </p>
                  )}
                  {hasMeetingOrEvent && timedTasks.length === 0 && (
                    <div className={`h-1 rounded-full w-full ${isSelected ? 'bg-white/50' : 'bg-blue-400 dark:bg-blue-500'}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
