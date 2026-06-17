import { useState, useEffect, useCallback } from 'react';

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayString() {
  return toLocalDateStr(new Date());
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateStr(d);
}

function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDateStr(d);
}

const EMPTY_TIMER = {
  active: false,
  running: false,
  startedAt: null,
  elapsed: 0,
  description: '',
  category: 'custom',
  taskId: null,
  taskTitle: null,
  jobId: null,
  jiraKey: null,
  entryId: null, // if set, stopAndSave updates this entry instead of creating a new one
};

export function useTimeTracking(auth) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(todayString);
  const [weekStart, setWeekStart] = useState(() => getMonday(todayString()));
  const [weekEntries, setWeekEntries] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [timer, setTimer] = useState(EMPTY_TIMER);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth?.accessToken}`,
  }), [auth?.accessToken]);

  const fetchEntries = useCallback(async (d) => {
    if (!auth?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries?date=${d}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken, authHeaders]);

  const fetchWeekEntries = useCallback(async (monday) => {
    if (!auth?.accessToken) return;
    const endDate = addDays(monday, 6);
    setWeekLoading(true);
    try {
      const res = await fetch(`/api/time-entries?startDate=${monday}&endDate=${endDate}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWeekEntries(data.entries || []);
      }
    } finally {
      setWeekLoading(false);
    }
  }, [auth?.accessToken, authHeaders]);

  useEffect(() => { fetchEntries(date); }, [date, fetchEntries]);
  useEffect(() => { fetchWeekEntries(weekStart); }, [weekStart, fetchWeekEntries]);

  async function addEntry({ description, category, minutes, jobId, taskTitle, startedAt }) {
    const inferredStartedAt = startedAt || new Date(Date.now() - minutes * 60000).toISOString();
    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ description, category, minutes, date, jobId: jobId || null, taskTitle: taskTitle || null, startedAt: inferredStartedAt }),
    });
    if (res.ok) {
      const data = await res.json();
      setEntries((prev) => [data.entry, ...prev]);
      fetchWeekEntries(weekStart);
      return true;
    }
    return false;
  }

  async function updateEntry(id, fields) {
    const res = await fetch(`/api/time-entries/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
      fetchWeekEntries(weekStart);
      return true;
    }
    return false;
  }

  async function deleteEntry(id) {
    const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      fetchWeekEntries(weekStart);
      return true;
    }
    return false;
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  function startTimer({ description, category, taskId, taskTitle, jobId, jiraKey, initialMs = 0, entryId = null }) {
    setTimer({
      active: true,
      running: true,
      startedAt: Date.now(),
      elapsed: initialMs,
      description: description || '',
      category: category || 'custom',
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      jobId: jobId || null,
      jiraKey: jiraKey || null,
      entryId,
    });
  }

  function pauseTimer() {
    setTimer((prev) => ({
      ...prev,
      running: false,
      elapsed: prev.elapsed + (Date.now() - prev.startedAt),
      startedAt: null,
    }));
  }

  function resumeTimer() {
    setTimer((prev) => ({ ...prev, running: true, startedAt: Date.now() }));
  }

  async function stopAndSave() {
    const totalMs = timer.elapsed + (timer.running ? Date.now() - timer.startedAt : 0);
    const minutes = Math.max(1, Math.round(totalMs / 60000));
    const snap = { ...timer };
    setTimer(EMPTY_TIMER);
    const startedAt = new Date(Date.now() - totalMs).toISOString();
    if (snap.entryId) {
      return updateEntry(snap.entryId, {
        description: snap.description,
        category: snap.category,
        minutes,
        jobId: snap.jobId,
        taskTitle: snap.taskTitle,
        startedAt,
      });
    }
    return addEntry({
      description: snap.description,
      category: snap.category,
      minutes,
      jobId: snap.jobId,
      taskTitle: snap.taskTitle,
      startedAt,
    });
  }

  function discardTimer() {
    setTimer(EMPTY_TIMER);
  }

  function updateTimerDescription(description) {
    setTimer((prev) => ({ ...prev, description }));
  }

  async function startTimerSafe({ description, category, taskId, taskTitle, jobId, jiraKey, initialMs = 0, entryId = null }) {
    if (timer.active) await stopAndSave();
    startTimer({ description, category, taskId, taskTitle, jobId, jiraKey, initialMs, entryId });
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  return {
    entries,
    loading,
    date,
    setDate,
    addEntry,
    updateEntry,
    deleteEntry,
    totalMinutes,
    isToday: date === todayString(),
    refetch: () => fetchEntries(date),
    weekEntries,
    weekLoading,
    weekStart,
    setWeekStart,
    refetchWeek: () => fetchWeekEntries(weekStart),
    getMonday,
    addDays,
    timer,
    startTimer,
    startTimerSafe,
    pauseTimer,
    resumeTimer,
    stopAndSave,
    discardTimer,
    updateTimerDescription,
  };
}
