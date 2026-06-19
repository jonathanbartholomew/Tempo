import { useState, useEffect, useCallback } from 'react';

function normalize(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || null,
    jobId: null,
    date: task.due_date ? task.due_date.slice(0, 10) : null,
    priority: task.priority,
    done: !!task.done,
    doneAt: task.done_at || null,
    time: null,
    tags: [],
    checklist: [],
    isAssigned: true,
    assignedBy: task.assigned_by_name || 'Someone',
    assignedByPicture: task.assigned_by_picture || null,
    orgId: task.org_id,
  };
}

export function useAssignedTasks(auth) {
  const [assignedTasks, setAssignedTasks] = useState([]);

  const fetchAssigned = useCallback(async () => {
    if (!auth?.accessToken) return;
    try {
      const res = await fetch('/api/assigned-tasks/mine', {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAssignedTasks(data.map(normalize));
    } catch {
      // silent — assigned tasks just won't show
    }
  }, [auth?.accessToken]);

  useEffect(() => { fetchAssigned(); }, [fetchAssigned]);

  async function toggleAssignedTaskDone(taskId) {
    const task = assignedTasks.find((t) => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;

    // Optimistic update
    setAssignedTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, done: newDone, doneAt: newDone ? new Date().toISOString() : null } : t)
    );

    try {
      const res = await fetch(`/api/assigned-tasks/${taskId}/done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ done: newDone }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
    } catch {
      // Roll back on network error or non-2xx response
      setAssignedTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, done: task.done, doneAt: task.doneAt } : t)
      );
    }
  }

  return { assignedTasks, toggleAssignedTaskDone, refetchAssigned: fetchAssigned };
}
