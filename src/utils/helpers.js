export const STORAGE_KEYS = {
  jobs: 'tempo_jobs',
  tasks: 'tempo_tasks',
  meetings: 'tempo_meetings',
  stats: 'tempo_stats',
  earned: 'tempo_earned',
  theme: 'tempo_theme',
  auth: 'tempo_auth',
  calendarAccounts: 'tempo_calendar_accounts',
  hiddenEvents: 'tempo_hidden_calendar_events',
  gcalAttended: 'tempo_gcal_attended',
  timezone: 'tempo_timezone',
  timeFormat: 'tempo_time_format',
  focusSession: 'tempo_focus_session',
  profile: 'tempo_profile',
};

export const DEFAULT_PROFILE = {
  onboardingComplete: false,
  usageType: [],
  role: [],
  specialty: [],
  goals: [],
};

export const DEFAULT_FOCUS_SESSION = {
  mode: 'work',
  workMinutes: 25,
  breakMinutes: 5,
  secondsLeft: 25 * 60,
  running: false,
  sessionsCompleted: 0,
  updatedAt: null,
  jobId: null,
};

export const DEFAULT_TIME_FORMAT = '12h';

export const TIME_FORMATS = [
  { value: '12h', label: '12-hour (1:30 PM)' },
  { value: '24h', label: '24-hour (13:30)' },
];

export const DEFAULT_TIMEZONE = 'America/New_York';

export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST, no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
];

export const CALENDAR_ACCOUNT_COLORS = ['#6b7280', '#0ea5e9', '#a855f7', '#f97316', '#10b981', '#ec4899'];

export const JOB_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Teal', value: '#06b6d4' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
];

export const JOB_TYPES = ['Full-time', 'Freelance', 'RFP', 'Personal', 'Side Project'];

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#9ca3af', xp: 10 },
  { value: 'normal', label: 'Normal', color: '#3b82f6', xp: 10 },
  { value: 'high', label: 'High', color: '#f59e0b', xp: 15 },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', xp: 25 },
];

export const MEETING_DURATIONS = [15, 30, 45, 60, 90, 120];
export const REMINDER_LEAD_TIMES = [5, 10, 15, 30, 60];

export const DEFAULT_STATS = {
  totalXp: 0,
  tasksCompleted: 0,
  streak: 0,
  lastActiveDate: '',
  earlyBirdEarned: false,
  rfpCompleted: false,
  nightOwlEarned: false,
  futureTasksAdded: 0,
  longestStreak: 0,
  aiPlanImports: 0,
  focusSessions: 0,
  history: {},
};

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getTodayString() {
  return toDateKey(new Date());
}

export function getDateKeyInTimezone(date, timezone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function getTimeInTimezone(date, timezone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hour = lookup.hour === '24' ? '00' : lookup.hour;
  return `${hour}:${lookup.minute}`;
}

export function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatTime(timeStr, format = DEFAULT_TIME_FORMAT) {
  if (!timeStr) return timeStr;
  if (format === '24h') return timeStr;
  const [hourStr, minute] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

export function formatDateLong(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function getPriority(value) {
  return PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];
}

export function getJob(jobs, jobId) {
  return jobs.find((j) => j.id === jobId) || null;
}

export function getHistoryEntry(stats, date) {
  const entry = (stats.history || {})[date];
  return { completed: 0, xp: 0, focusMinutes: 0, focusByJob: {}, ...entry };
}

export async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 1000 },
  { level: 6, xp: 2000 },
  { level: 7, xp: 3500 },
  { level: 8, xp: 5500 },
  { level: 9, xp: 8000 },
  { level: 10, xp: 12000 },
];

export function getLevelInfo(totalXp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const xpIntoLevel = totalXp - current.xp;
  const xpForLevel = next ? next.xp - current.xp : 0;
  const progress = next ? xpIntoLevel / xpForLevel : 1;
  return {
    level: current.level,
    xpIntoLevel,
    xpForLevel,
    nextLevelXp: next ? next.xp : null,
    progress,
  };
}
