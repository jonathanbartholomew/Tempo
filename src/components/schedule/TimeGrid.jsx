import { EyeOff } from 'lucide-react';
import { getJob, getTodayString, formatTime } from '../../utils/helpers';

const ROW_HEIGHT = 44; // px per 30-minute slot
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM

function buildSlots() {
  const slots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    slots.push({ hour, minute: 0 });
    slots.push({ hour, minute: 30 });
  }
  return slots;
}

function formatSlotLabel({ hour, minute }, timeFormat) {
  return formatTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, timeFormat);
}

function minutesFromGridStart(time) {
  const [h, m] = time.split(':').map(Number);
  return (h - START_HOUR) * 60 + m;
}

export default function TimeGrid({ date, meetings, jobs, googleEvents, onMeetingClick, onHideEvent, timeFormat }) {
  const slots = buildSlots();
  const isToday = date === getTodayString();
  const now = new Date();
  const currentMinutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();

  const dayMeetings = meetings.filter((m) => m.date === date);
  const dayGoogleEvents = (googleEvents || []).filter((e) => e.date === date && !e.allDay);

  return (
    <div className="relative border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      {slots.map((slot, i) => {
        const slotMinutes = (slot.hour - START_HOUR) * 60 + slot.minute;
        const isCurrent = isToday && currentMinutes >= slotMinutes && currentMinutes < slotMinutes + 30;
        return (
          <div
            key={i}
            className={`flex items-stretch border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${isCurrent ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}
            style={{ height: ROW_HEIGHT }}
          >
            <div className="w-20 flex-shrink-0 flex items-center justify-end pr-3 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-800">
              {slot.minute === 0 ? formatSlotLabel(slot, timeFormat) : ''}
            </div>
            <div className="flex-1" />
          </div>
        );
      })}

      <div className="absolute top-0 left-20 right-0 bottom-0">
        {dayGoogleEvents.map((event) => {
          const top = (minutesFromGridStart(event.time) / 30) * ROW_HEIGHT;
          const height = Math.max((event.duration / 30) * ROW_HEIGHT, ROW_HEIGHT * 0.6);
          return (
            <div
              key={event.id}
              className="absolute left-1 right-1 rounded-lg overflow-hidden border border-dashed bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group"
              style={{ top, height, borderColor: event.accountColor || '#9ca3af' }}
            >
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-2 py-1 text-left text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="truncate font-semibold pr-5">{event.title}</div>
                <div className="truncate opacity-70">{formatTime(event.time, timeFormat)} · {event.duration}m · {event.account}</div>
              </a>
              <button
                onClick={() => onHideEvent?.(event.title)}
                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Hide ${event.title}`}
                title="Hide this event from Tempo"
              >
                <EyeOff size={12} />
              </button>
            </div>
          );
        })}
        {dayMeetings.map((meeting) => {
          const job = getJob(jobs, meeting.jobId);
          const top = (minutesFromGridStart(meeting.time) / 30) * ROW_HEIGHT;
          const height = Math.max((meeting.duration / 30) * ROW_HEIGHT, ROW_HEIGHT * 0.6);
          return (
            <button
              key={meeting.id}
              onClick={() => onMeetingClick?.(meeting)}
              className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-white text-xs font-medium shadow-sm overflow-hidden hover:opacity-90 transition-opacity"
              style={{ top, height, backgroundColor: job?.color || '#6366f1' }}
            >
              <div className="truncate font-semibold">{meeting.title}</div>
              <div className="truncate opacity-80">{formatTime(meeting.time, timeFormat)} · {meeting.duration}m</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
