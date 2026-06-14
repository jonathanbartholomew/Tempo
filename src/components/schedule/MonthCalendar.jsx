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

export default function MonthCalendar({ selectedDate, onSelectDate, tasks, meetings, googleEvents }) {
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

  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2">
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

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const dateKey = toDateKey(cell.date);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === today;
          const hasItems =
            tasks.some((t) => t.date === dateKey) ||
            meetings.some((m) => m.date === dateKey) ||
            (googleEvents || []).some((e) => e.date === dateKey);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateKey)}
              className={`relative h-9 rounded-lg text-sm transition-colors ${
                !cell.inMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'
              } ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                  ? 'bg-blue-50 dark:bg-blue-500/10 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {cell.day}
              {hasItems && (
                <span
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
