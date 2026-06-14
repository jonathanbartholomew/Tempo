import { useState } from 'react';
import { Trash2, Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateLong } from '../../utils/helpers';

export default function MeetingCard({ meeting, job, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2" style={{ borderLeftColor: job?.color || '#9ca3af', borderLeftWidth: 4 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateLong(meeting.date)} · {meeting.time}</p>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{meeting.title}</h3>
        </div>
        <button onClick={() => onDelete(meeting.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        {job && (
          <span className="font-medium px-2 py-1 rounded-full text-white" style={{ backgroundColor: job.color }}>
            {job.name}
          </span>
        )}
        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{meeting.duration} min</span>
        <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${meeting.reminder ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
          {meeting.reminder ? <Bell size={12} /> : <BellOff size={12} />}
          {meeting.reminder ? `${meeting.reminderMins}m reminder` : 'No reminder'}
        </span>
      </div>

      {meeting.notes && (
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Notes
          </button>
          {expanded && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{meeting.notes}</p>}
        </div>
      )}
    </div>
  );
}
