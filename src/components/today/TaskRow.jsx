import { useEffect, useRef, useState } from 'react';
import { Trash2, GripVertical, Clock, X } from 'lucide-react';
import { getPriority, formatTime } from '../../utils/helpers';

export default function TaskRow({ task, job, onToggle, onDelete, onEdit, extra, dragHandleProps, timeFormat }) {
  const priority = getPriority(task.priority);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(task.time || '');
  const titleInputRef = useRef(null);
  const timeInputRef = useRef(null);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingTime) timeInputRef.current?.focus();
  }, [editingTime]);

  function startEditingTitle() {
    if (!onEdit) return;
    setTitleValue(task.title);
    setEditingTitle(true);
  }

  function commitTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, { title: trimmed });
    } else {
      setTitleValue(task.title);
    }
    setEditingTitle(false);
  }

  function startEditingTime() {
    if (!onEdit) return;
    setTimeValue(task.time || '');
    setEditingTime(true);
  }

  function commitTime(nextValue) {
    const value = nextValue ?? timeValue;
    if (value !== (task.time || '')) {
      onEdit(task.id, { time: value || null });
    }
    setEditingTime(false);
  }

  function clearTime() {
    if (task.time) onEdit(task.id, { time: null });
    setTimeValue('');
    setEditingTime(false);
  }

  return (
    <div
      {...dragHandleProps}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        task.done
          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      {dragHandleProps && (
        <span
          className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </span>
      )}

      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }`}
        aria-label="Toggle task complete"
      >
        {task.done && (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {editingTime ? (
        <input
          ref={timeInputRef}
          type="time"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          onBlur={() => commitTime()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTime();
            if (e.key === 'Escape') {
              setTimeValue(task.time || '');
              setEditingTime(false);
            }
          }}
          aria-label="Task time"
          className="text-xs font-medium text-gray-700 dark:text-gray-200 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : task.time ? (
        <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
          <button
            onClick={startEditingTime}
            className={onEdit ? 'hover:text-blue-500 dark:hover:text-blue-400' : ''}
            aria-label="Edit task time"
            disabled={!onEdit}
          >
            {formatTime(task.time, timeFormat)}
          </button>
          {onEdit && (
            <button
              onClick={clearTime}
              className="text-gray-300 dark:text-gray-600 hover:text-red-500"
              aria-label="Clear task time"
            >
              <X size={12} />
            </button>
          )}
        </span>
      ) : (
        onEdit && (
          <button
            onClick={startEditingTime}
            className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400"
            aria-label="Add a time"
            title="Add a time"
          >
            <Clock size={14} />
          </button>
        )
      )}

      {editingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTitle();
            if (e.key === 'Escape') {
              setTitleValue(task.title);
              setEditingTitle(false);
            }
          }}
          aria-label="Task title"
          className="flex-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span
          onClick={startEditingTitle}
          className={`flex-1 text-sm ${onEdit ? 'cursor-text' : ''} ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
        >
          {task.title}
        </span>
      )}

      {extra && (
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{extra}</span>
      )}

      {job && (
        <span
          className="text-xs font-medium px-2 py-1 rounded-full text-white whitespace-nowrap"
          style={{ backgroundColor: job.color }}
        >
          {job.name}
        </span>
      )}

      <span
        className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
        style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
      >
        {priority.label}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Delete task"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
