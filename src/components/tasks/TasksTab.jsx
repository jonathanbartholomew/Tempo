import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TaskRow from '../today/TaskRow';
import QuickAdd from '../today/QuickAdd';
import AIPlanImport from '../today/AIPlanImport';
import { getJob, getTodayString, formatDateLong } from '../../utils/helpers';

export default function TasksTab({ tasks, jobs, meetings, googleEvents, onAddTask, onAddMeeting, onAiPlanImported, onToggleTask, onDeleteTask, onEditTask, timeFormat }) {
  const [addDate, setAddDate] = useState(getTodayString());
  const [showCompleted, setShowCompleted] = useState(false);

  const today = getTodayString();
  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));

  const overdue = pending.filter((t) => t.date && t.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const todayTasks = pending.filter((t) => t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const upcoming = pending.filter((t) => t.date && t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const noDate = pending.filter((t) => !t.date);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>

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

      {overdue.length > 0 && (
        <Section title="Overdue">
          {overdue.map((task) => (
            <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} />
          ))}
        </Section>
      )}

      <Section title="Today">
        {todayTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing for today.</p>
        ) : (
          todayTasks.map((task) => (
            <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} />
          ))
        )}
      </Section>

      <Section title="Upcoming">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nothing scheduled ahead.</p>
        ) : (
          upcoming.map((task) => (
            <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={formatDateLong(task.date)} />
          ))
        )}
      </Section>

      {noDate.length > 0 && (
        <Section title="Anytime">
          {noDate.map((task) => (
            <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} />
          ))}
        </Section>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted((s) => !s)}
            className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
          >
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map((task) => (
                <TaskRow key={task.id} task={task} job={getJob(jobs, task.jobId)} onToggle={onToggleTask} onDelete={onDeleteTask} onEdit={onEditTask} timeFormat={timeFormat} extra={task.date ? formatDateLong(task.date) : null} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
