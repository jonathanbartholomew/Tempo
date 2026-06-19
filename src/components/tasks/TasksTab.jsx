import { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, List, CalendarDays, LayoutGrid, CheckCircle2, Calendar, CalendarSearch, UserCheck, Plus, Trash2, RefreshCw, Pencil } from 'lucide-react';
import AssignTaskModal from './AssignTaskModal';
import TaskRow from '../today/TaskRow';
import QuickAdd from '../today/QuickAdd';
import AIPlanImport from '../today/AIPlanImport';
import { getJob, getTodayString, formatDateLong, formatTime } from '../../utils/helpers';

function fmtMinutes(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function toDS(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Agenda View ──────────────────────────────────────────────────────────────
function AgendaView({ tasks, meetings, googleEvents, jobs, timeFormat, onToggleTask, onToggleMeeting, gcalAttended, onToggleGoogleEvent, onDeleteTask, onEditTask, trackedFor }) {
  const today = getTodayString();
  const [showPast, setShowPast] = useState(false);

  const { pastDays, currentDays } = useMemo(() => {
    const dateSet = new Set();
    const startD = new Date(today + 'T00:00:00');
    startD.setDate(startD.getDate() - 30);
    const endD = new Date(today + 'T00:00:00');
    endD.setDate(endD.getDate() + 60);

    tasks.filter(t => t.date).forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (d >= startD && d <= endD) dateSet.add(t.date);
    });
    meetings.filter(m => m.date).forEach(m => {
      const d = new Date(m.date + 'T00:00:00');
      if (d >= startD && d <= endD) dateSet.add(m.date);
    });
    (googleEvents || []).filter(e => e.date).forEach(e => {
      const d = new Date(e.date + 'T00:00:00');
      if (d >= startD && d <= endD) dateSet.add(e.date);
    });

    const all = [...dateSet].sort().map(ds => {
      const d = new Date(ds + 'T00:00:00');
      const dayTasks = tasks.filter(t => t.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      const dayMeetings = meetings.filter(m => m.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      const dayGoogle = (googleEvents || []).filter(e => e.date === ds).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      return { ds, d, dayTasks, dayMeetings, dayGoogle };
    });

    return {
      pastDays: all.filter(({ ds }) => ds < today),
      currentDays: all.filter(({ ds }) => ds >= today),
    };
  }, [tasks, meetings, googleEvents, today]);

  if (pastDays.length === 0 && currentDays.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4">No tasks or events scheduled.</p>;
  }

  const allVisible = showPast ? [...pastDays, ...currentDays] : currentDays;

  return (
    <div className="space-y-1">
      {/* Show earlier toggle */}
      {pastDays.length > 0 && (
        <button onClick={() => setShowPast(s => !s)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2">
          <ChevronUp size={13} className={`transition-transform ${showPast ? '' : 'rotate-180'}`} />
          {showPast ? 'Hide past dates' : `Show ${pastDays.length} earlier date${pastDays.length > 1 ? 's' : ''}`}
        </button>
      )}

      {allVisible.map(({ ds, d, dayTasks, dayMeetings, dayGoogle }) => {
        const isToday = ds === today;
        const isPast = ds < today;

        return (
          <div key={ds} className="flex gap-5">
            {/* Date column */}
            <div className="w-24 flex-shrink-0 pt-3 text-right select-none">
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : isPast ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-bold leading-tight ${isToday ? 'text-blue-600 dark:text-blue-400' : isPast ? 'text-gray-200 dark:text-gray-800' : 'text-gray-700 dark:text-gray-300'}`}>
                {d.getDate()}
              </div>
              <div className={`text-[11px] ${isPast ? 'text-gray-200 dark:text-gray-800' : 'text-gray-400 dark:text-gray-600'}`}>
                {d.toLocaleDateString(undefined, { month: 'short' })}
              </div>
            </div>

            {/* Separator */}
            <div className="flex flex-col items-center pt-4 flex-shrink-0">
              <div className={`w-px flex-1 mb-2 ${isToday ? 'bg-blue-200 dark:bg-blue-800/60' : 'bg-gray-100 dark:bg-gray-800'}`} />
            </div>

            {/* Items — merged and sorted by time */}
            <div className="flex-1 min-w-0 py-2 space-y-2 pb-4">
              {[
                ...dayTasks.map(t => ({ _type: 'task', _sort: t.time || 'zzz', data: t })),
                ...dayMeetings.map(m => ({ _type: 'meeting', _sort: m.time || 'zzz', data: m })),
                ...dayGoogle.map(e => ({ _type: 'google', _sort: e.time || (e.allDay ? '000' : 'zzz'), data: e })),
              ].sort((a, b) => a._sort.localeCompare(b._sort)).map(item => {
                if (item._type === 'task') {
                  const task = item.data;
                  return (
                    <TaskRow
                      key={`t-${task.id}`}
                      task={task}
                      job={getJob(jobs, task.jobId)}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      timeFormat={timeFormat}
                      trackedMinutes={trackedFor(task)}
                    />
                  );
                }
                if (item._type === 'meeting') {
                  const m = item.data;
                  const job = getJob(jobs, m.jobId);
                  return (
                    <div key={`m-${m.id}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 ${m.attended ? 'opacity-50' : ''}`} style={{ borderLeftColor: job?.color || '#6366f1', borderLeftWidth: 4 }}>
                      <button onClick={() => onToggleMeeting?.(m.id)} className="flex-shrink-0 transition-colors" title={m.attended ? 'Mark as not attended' : 'Mark as attended'}>
                        {m.attended ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" /> : <Calendar size={16} className="text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 truncate ${m.attended ? 'line-through' : ''}`}>{m.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {m.time && <span>{formatTime(m.time, timeFormat)}</span>}
                        {m.time && m.duration && <span>·</span>}
                        {m.duration && <span>{m.duration}m</span>}
                        {job && <span className="ml-1 font-medium" style={{ color: job.color }}>{job.name}</span>}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">meeting</span>
                    </div>
                  );
                }
                const e = item.data;
                const job = jobs.find(j => j.googleAccountEmail === e.accountEmail) || null;
                const gAttended = gcalAttended?.[e.id]?.attended || false;
                return (
                  <div key={`g-${e.id}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 ${gAttended ? 'opacity-50' : ''}`} style={{ borderLeftColor: job?.color || e.accountColor || '#6b7280', borderLeftWidth: 4 }}>
                    <button onClick={() => onToggleGoogleEvent?.(e.id)} className="flex-shrink-0 transition-colors" title={gAttended ? 'Mark as not attended' : 'Mark as attended'}>
                      {gAttended ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" /> : <CalendarSearch size={16} className="text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 truncate ${gAttended ? 'line-through' : ''}`}>{e.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {!e.allDay && e.time && <span>{formatTime(e.time, timeFormat)}</span>}
                      {e.allDay && <span>all day</span>}
                      {job && <span className="ml-1 font-medium" style={{ color: job.color }}>{job.name}</span>}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">gcal</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Kanban View ─────────────────────────────────────────────────────────────
function KanbanCard({ task, job, onToggle, onDelete, trackedMinutes }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border px-3 py-2.5 space-y-1.5 shadow-sm group transition-opacity ${task.done ? 'opacity-60 border-gray-100 dark:border-gray-800' : 'border-gray-200 dark:border-gray-800'}`}
      style={job ? { borderLeftColor: job.color, borderLeftWidth: 3 } : {}}
    >
      <div className="flex items-start gap-2">
        <button onClick={() => onToggle(task.id)} className="flex-shrink-0 mt-0.5">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}>
            {task.done && (
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
        <p className={`text-sm font-medium flex-1 leading-snug ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {task.title}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600 hover:text-red-500"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pl-6">
        {job && <span className="text-[10px] font-medium" style={{ color: job.color }}>{job.name}</span>}
        {task.date && <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDateLong(task.date)}</span>}
        {(task.priority === 'high' || task.priority === 'urgent' || task.priority === 'medium') && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            task.priority === 'high' || task.priority === 'urgent'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          }`}>{task.priority}</span>
        )}
        {trackedMinutes > 0 && <span className="text-[10px] text-indigo-400 dark:text-indigo-500">{fmtMinutes(trackedMinutes)}</span>}
      </div>
    </div>
  );
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DroppableColumn({ id, bg, isOver, header, dot, label, count, children, collapsible, expanded, onToggleExpand }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${bg} rounded-2xl p-3 space-y-2 min-h-48 transition-all ${isOver ? 'ring-2 ring-inset ring-blue-400 dark:ring-blue-500' : ''}`}
    >
      {collapsible ? (
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center gap-2 px-1 pb-1 hover:opacity-80 transition-opacity"
        >
          <div className={`w-2 h-2 rounded-full ${dot}`} />
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${header}`}>{label}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">{count}</span>
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-1 pb-1">
          <div className={`w-2 h-2 rounded-full ${dot}`} />
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${header}`}>{label}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">{count}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function DraggableKanbanCard({ task, job, onToggle, onDelete, trackedMinutes }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-grab'}
      {...attributes}
      {...listeners}
    >
      <KanbanCard task={task} job={job} onToggle={onToggle} onDelete={onDelete} trackedMinutes={trackedMinutes} />
    </div>
  );
}

function KanbanView({ tasks, jobs, today, onToggleTask, onDeleteTask, onEditTask, trackedFor }) {
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const pending    = tasks.filter((t) => !t.done);
  const todo       = pending.filter((t) => !t.date || t.date > today).sort((a, b) => (a.date || 'zzz').localeCompare(b.date || 'zzz'));
  const inProgress = pending.filter((t) => t.date && t.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const allDone    = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  const doneVisible = doneExpanded ? allDone : allDone.slice(0, 5);

  function getSourceCol(task) {
    if (task.done) return 'done';
    return (!task.date || task.date > today) ? 'todo' : 'inprogress';
  }

  function handleDragStart({ active }) {
    setActiveTask(active.data.current.task);
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    setOverId(null);
    if (!over) return;

    const task = active.data.current.task;
    const target = over.id;
    if (getSourceCol(task) === target) return;

    const tomorrow = getTomorrow();

    if (target === 'done') {
      if (!task.done) onToggleTask(task.id);
    } else if (target === 'inprogress') {
      if (task.done) onToggleTask(task.id);
      onEditTask(task.id, { date: today });
    } else if (target === 'todo') {
      if (task.done) onToggleTask(task.id);
      onEditTask(task.id, { date: tomorrow });
    }
  }

  const colDefs = [
    { id: 'todo',       label: 'To Do',      items: todo,       bg: 'bg-gray-50 dark:bg-gray-800/40',    dot: 'bg-gray-400 dark:bg-gray-500', header: 'text-gray-600 dark:text-gray-400' },
    { id: 'inprogress', label: 'In Progress', items: inProgress, bg: 'bg-blue-50/50 dark:bg-blue-950/20', dot: 'bg-blue-500',                  header: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {colDefs.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            bg={col.bg}
            dot={col.dot}
            header={col.header}
            label={col.label}
            count={col.items.length}
            isOver={overId === col.id}
          >
            {col.items.length === 0
              ? <p className="text-xs text-gray-300 dark:text-gray-700 italic text-center py-6">Empty</p>
              : col.items.map((task) => (
                  <DraggableKanbanCard
                    key={task.id}
                    task={task}
                    job={getJob(jobs, task.jobId)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    trackedMinutes={trackedFor(task)}
                  />
                ))
            }
          </DroppableColumn>
        ))}

        {/* Done — droppable but collapsed by default */}
        <DroppableColumn
          id="done"
          bg="bg-green-50/50 dark:bg-green-950/20"
          dot="bg-green-500"
          header="text-green-600 dark:text-green-400"
          label="Done"
          count={allDone.length}
          isOver={overId === 'done'}
          collapsible
          expanded={doneExpanded}
          onToggleExpand={() => setDoneExpanded((s) => !s)}
        >
          {doneExpanded && (
            <div className="space-y-2">
              {doneVisible.map((task) => (
                <DraggableKanbanCard
                  key={task.id}
                  task={task}
                  job={getJob(jobs, task.jobId)}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  trackedMinutes={trackedFor(task)}
                />
              ))}
              {allDone.length > 5 && !doneExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDoneExpanded(true); }}
                  className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 py-1 transition-colors"
                >
                  + {allDone.length - 5} more
                </button>
              )}
            </div>
          )}
          {!doneExpanded && allDone.length === 0 && (
            <p className="text-xs text-gray-300 dark:text-gray-700 italic text-center py-6">Empty</p>
          )}
        </DroppableColumn>
      </div>

      {/* Ghost card that follows the cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="rotate-1 scale-105 opacity-90 shadow-xl">
            <KanbanCard
              task={activeTask}
              job={getJob(jobs, activeTask.jobId)}
              onToggle={() => {}}
              onDelete={() => {}}
              trackedMinutes={trackedFor(activeTask)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Section (list view helper) ───────────────────────────────────────────────
function Section({ title, count, accent = 'text-gray-700 dark:text-gray-300', children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${accent}`}>{title}</h2>
        {count != null && <span className="text-xs text-gray-400 dark:text-gray-500">({count})</span>}
      </div>
      {children}
    </div>
  );
}

// ─── TasksTab ─────────────────────────────────────────────────────────────────
export default function TasksTab({ tasks, jobs, meetings, googleEvents, onAddTask, onAddMeeting, onAiPlanImported, onToggleTask, onToggleMeeting, gcalAttended, onToggleGoogleEvent, onDeleteTask, onEditTask, timeFormat, timeTracking, org, orgActions }) {
  const [addDate, setAddDate] = useState(getTodayString());
  const [view, setView] = useState('list');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showAnytime, setShowAnytime] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [showTeamTasks, setShowTeamTasks] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const isPM = org && ['org_admin', 'project_manager'].includes(org.role);

  const loadTeamTasks = useCallback(async () => {
    if (!isPM || !org?.id) return;
    try {
      const [det, tasks] = await Promise.all([
        orgActions.getOrgDetails(org.id),
        orgActions.getAssignedTasksForOrg(org.id),
      ]);
      setOrgDetails(det);
      setAssignedByMe(tasks);
    } catch { /* silent */ }
  }, [isPM, org?.id]);

  useEffect(() => {
    loadTeamTasks();
    if (!isPM) return;
    const interval = setInterval(loadTeamTasks, 15000);
    return () => clearInterval(interval);
  }, [org?.id, isPM]);


  const today = getTodayString();

  const minutesByTitle = {};
  (timeTracking?.weekEntries || []).forEach((entry) => {
    const key = entry.task_title?.trim().toLowerCase();
    if (!key) return;
    minutesByTitle[key] = (minutesByTitle[key] || 0) + (entry.minutes || 0);
  });

  function trackedFor(task) {
    return minutesByTitle[task.title?.trim().toLowerCase()] || 0;
  }

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  const overdue = pending.filter((t) => t.date && t.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const todayPending = pending.filter((t) => t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todayDone = tasks.filter((t) => t.done && t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todayTotal = todayPending.length + todayDone.length;
  const todayProgress = todayTotal > 0 ? todayDone.length / todayTotal : 0;
  const upcoming = pending.filter((t) => t.date && t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const noDate = pending.filter((t) => !t.date);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
        {/* View toggle */}
        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 gap-0.5">
          {[
            { id: 'list',   icon: List,        label: 'List' },
            { id: 'kanban', icon: LayoutGrid,   label: 'Board' },
            { id: 'agenda', icon: CalendarDays, label: 'Agenda' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <label htmlFor="task-add-date">Add for:</label>
          <input
            id="task-add-date"
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <QuickAdd jobs={jobs} onAdd={(task) => onAddTask({ ...task, date: addDate })} />
      </div>

      <AIPlanImport jobs={jobs} tasks={tasks} meetings={meetings} googleEvents={googleEvents} date={addDate} onAddTask={onAddTask} onAddMeeting={onAddMeeting} onAiPlanImported={onAiPlanImported} />

      {view === 'agenda' ? (
        <AgendaView
          tasks={tasks}
          meetings={meetings}
          googleEvents={googleEvents}
          jobs={jobs}
          timeFormat={timeFormat}
          onToggleTask={onToggleTask}
          onToggleMeeting={onToggleMeeting}
          gcalAttended={gcalAttended}
          onToggleGoogleEvent={onToggleGoogleEvent}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          trackedFor={trackedFor}
        />
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={tasks}
          jobs={jobs}
          today={today}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          trackedFor={trackedFor}
        />
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} accent="text-red-500">
              {overdue.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} trackedMinutes={trackedFor(task)} />
              ))}
            </Section>
          )}

          {/* Today */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today</h2>
              {todayTotal > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{todayDone.length} / {todayTotal} done</span>
              )}
            </div>
            {todayTotal > 0 && (
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${todayProgress * 100}%` }} />
              </div>
            )}
            <div className="space-y-2">
              {todayPending.length === 0 && todayDone.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing for today.</p>
              ) : (
                todayPending.map((task) => (
                  <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
                ))
              )}
              {todayDone.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  {todayDone.map((task) => (
                    <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowUpcoming((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                {showUpcoming ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Upcoming
                <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">({upcoming.length})</span>
              </button>
              {showUpcoming && (
                <div className="space-y-2">
                  {upcoming.map((task) => (
                    <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} trackedMinutes={trackedFor(task)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Anytime */}
          {noDate.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowAnytime((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                {showAnytime ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Anytime
                <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">({noDate.length})</span>
              </button>
              {showAnytime && (
                <div className="space-y-2">
                  {noDate.map((task) => (
                    <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} trackedMinutes={trackedFor(task)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowCompleted((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Completed
                <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">({completed.length})</span>
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completed.map((task) => (
                    <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={task.date ? formatDateLong(task.date) : null} trackedMinutes={trackedFor(task)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Assignments — PM/admin only */}
          {isPM && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTeamTasks((s) => !s)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  {showTeamTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <UserCheck size={14} />
                  Team Assignments
                  <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500 normal-case tracking-normal">({assignedByMe.length})</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => { setRefreshing(true); await loadTeamTasks(); setRefreshing(false); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus size={13} />
                    Assign task
                  </button>
                </div>
              </div>

              {showTeamTasks && (
                <div className="space-y-2">
                  {assignedByMe.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tasks assigned yet.</p>
                  ) : (
                    assignedByMe.map((task) => {
                      const member = (orgDetails?.members || []).find((m) => m.user_id === task.assigned_to);
                      const memberName = member?.name || member?.email || 'Unknown';
                      return (
                        <div key={task.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${task.done ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${!!task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {!!task.done && (
                              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 text-sm ${!!task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                            {task.title}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {formatDateLong(task.due_date.slice(0, 10))}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 whitespace-nowrap">
                            <UserCheck size={11} />
                            {memberName}
                          </span>
                          {task.priority && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-gray-300 dark:text-gray-600 hover:text-violet-500 transition-colors flex-shrink-0"
                            aria-label="Edit assigned task"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await orgActions.deleteAssignedTask(org.id, task.id);
                                setAssignedByMe((prev) => prev.filter((t) => t.id !== task.id));
                              } catch { /* silent */ }
                            }}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label="Delete assigned task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {(showAssignModal || editingTask) && isPM && (
        <AssignTaskModal
          org={{ ...org, members: orgDetails?.members || [] }}
          orgActions={orgActions}
          task={editingTask}
          onClose={() => { setShowAssignModal(false); setEditingTask(null); }}
          onCreated={loadTeamTasks}
        />
      )}
    </div>
  );
}
