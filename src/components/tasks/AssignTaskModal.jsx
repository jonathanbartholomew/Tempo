import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AssignTaskModal({ org, orgActions, onClose, onCreated, task }) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ? String(task.assigned_to) : '');
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.slice(0, 10) : '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const members = (org?.members || []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !assignedTo || !dueDate) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await orgActions.updateAssignedTask(org.id, task.id, {
          title: title.trim(),
          description: description.trim(),
          assigned_to: Number(assignedTo),
          due_date: dueDate,
          priority,
        });
      } else {
        await orgActions.createAssignedTask(org.id, {
          title: title.trim(),
          description: description.trim(),
          assigned_to: Number(assignedTo),
          due_date: dueDate,
          priority,
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || (isEdit ? 'Failed to update task' : 'Failed to assign task'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit assigned task' : 'Assign a task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Task title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description <span className="font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or instructions..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assign to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors capitalize ${
                    priority === p
                      ? p === 'high' ? 'bg-red-500 border-red-500 text-white'
                        : p === 'medium' ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !assignedTo || !dueDate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save changes' : 'Assign task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
