import { useEffect, useRef, useState } from 'react';
import { Trash2, GripVertical, Clock, X, AlignLeft, ChevronDown, ChevronUp, Plus, CheckSquare, Timer } from 'lucide-react';
import { getPriority, formatTime } from '../../utils/helpers';

function fmtTracked(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function generateItemId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TaskRow({ task, job, onToggle, onDelete, onEdit, extra, dragHandleProps, timeFormat, trackedMinutes }) {
  const priority = getPriority(task.priority);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(task.time || '');
  const [expanded, setExpanded] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(task.description || '');
  const [newItem, setNewItem] = useState('');
  const titleInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const descRef = useRef(null);
  const newItemRef = useRef(null);

  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingTime) timeInputRef.current?.focus(); }, [editingTime]);
  useEffect(() => { if (editingDesc) descRef.current?.focus(); }, [editingDesc]);
  useEffect(() => { setDescValue(task.description || ''); }, [task.description]);

  const checklist = task.checklist || [];
  const checklistDone = checklist.filter((i) => i.done).length;
  const hasChecklist = checklist.length > 0;
  const hasDesc = !!task.description;

  function startEditingTitle() {
    if (!onEdit) return;
    setTitleValue(task.title);
    setEditingTitle(true);
  }

  function commitTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) onEdit(task.id, { title: trimmed });
    else setTitleValue(task.title);
    setEditingTitle(false);
  }

  function startEditingTime() {
    if (!onEdit) return;
    setTimeValue(task.time || '');
    setEditingTime(true);
  }

  function commitTime(nextValue) {
    const value = nextValue ?? timeValue;
    if (value !== (task.time || '')) onEdit(task.id, { time: value || null });
    setEditingTime(false);
  }

  function clearTime() {
    if (task.time) onEdit(task.id, { time: null });
    setTimeValue('');
    setEditingTime(false);
  }

  function commitDesc() {
    const trimmed = descValue.trim();
    if (trimmed !== (task.description || '')) onEdit(task.id, { description: trimmed || null });
    setEditingDesc(false);
  }

  function handleDescKeyDown(e) {
    if (e.key === 'Escape') { setDescValue(task.description || ''); setEditingDesc(false); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitDesc();
  }

  function toggleCheckItem(itemId) {
    const updated = checklist.map((i) => i.id === itemId ? { ...i, done: !i.done } : i);
    onEdit(task.id, { checklist: updated });
  }

  function deleteCheckItem(itemId) {
    onEdit(task.id, { checklist: checklist.filter((i) => i.id !== itemId) });
  }

  function addCheckItem() {
    const text = newItem.trim();
    if (!text) return;
    onEdit(task.id, { checklist: [...checklist, { id: generateItemId(), text, done: false }] });
    setNewItem('');
    setTimeout(() => newItemRef.current?.focus(), 0);
  }

  function handleNewItemKeyDown(e) {
    if (e.key === 'Enter') addCheckItem();
    if (e.key === 'Escape') setNewItem('');
  }

  const showExpand = onEdit && (hasDesc || hasChecklist || true);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        task.done
          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        {dragHandleProps && (
          <span {...dragHandleProps} className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing" aria-label="Drag to reorder">
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
              if (e.key === 'Escape') { setTimeValue(task.time || ''); setEditingTime(false); }
            }}
            aria-label="Task time"
            className="text-xs font-medium bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
          />
        ) : task.time ? (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
            <button onClick={startEditingTime} className={onEdit ? 'hover:text-blue-500' : ''} disabled={!onEdit}>
              {formatTime(task.time, timeFormat)}
            </button>
            {onEdit && (
              <button onClick={clearTime} className="text-gray-300 dark:text-gray-600 hover:text-red-500">
                <X size={12} />
              </button>
            )}
          </span>
        ) : (
          onEdit && (
            <button onClick={startEditingTime} className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500" title="Add a time">
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
              if (e.key === 'Escape') { setTitleValue(task.title); setEditingTitle(false); }
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

        {/* Tracked time badge */}
        {fmtTracked(trackedMinutes) && (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 whitespace-nowrap" title="Time tracked this week">
            <Timer size={11} />
            {fmtTracked(trackedMinutes)}
          </span>
        )}

        {/* Checklist progress badge */}
        {hasChecklist && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
            checklistDone === checklist.length
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}>
            {checklistDone}/{checklist.length}
          </span>
        )}

        {extra && <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{extra}</span>}

        {job && (
          <span className="text-xs font-medium px-2 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: job.color }}>
            {job.name}
          </span>
        )}

        <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: `${priority.color}20`, color: priority.color }}>
          {priority.label}
        </span>

        {showExpand && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={`flex-shrink-0 transition-colors ${
              expanded || hasDesc || hasChecklist
                ? 'text-blue-400'
                : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
            }`}
            title={expanded ? 'Collapse' : 'Notes & checklist'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}

        <button onClick={() => onDelete(task.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0" aria-label="Delete task">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3 pl-[3.25rem]">

          {/* Description */}
          <div>
            {editingDesc ? (
              <textarea
                ref={descRef}
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={commitDesc}
                onKeyDown={handleDescKeyDown}
                placeholder="Add a note… (Ctrl+Enter to save)"
                rows={2}
                className="w-full text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            ) : (
              <p
                onClick={() => setEditingDesc(true)}
                className={`text-xs leading-relaxed cursor-text rounded-lg px-3 py-2 ${
                  hasDesc
                    ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'text-gray-400 dark:text-gray-600 italic hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {hasDesc ? task.description : 'Add a note…'}
              </p>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <CheckSquare size={11} /> Checklist
              {hasChecklist && (
                <span className="ml-1 font-normal normal-case tracking-normal">
                  {checklistDone}/{checklist.length}
                </span>
              )}
            </p>

            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleCheckItem(item.id)}
                  className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    item.done
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {item.done && (
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-xs ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteCheckItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add item input */}
            <div className="flex items-center gap-2 mt-1">
              <Plus size={14} className="text-gray-400 flex-shrink-0" />
              <input
                ref={newItemRef}
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleNewItemKeyDown}
                placeholder="Add an item…"
                className="flex-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 py-0.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-400"
              />
              {newItem.trim() && (
                <button
                  onClick={addCheckItem}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium flex-shrink-0"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
