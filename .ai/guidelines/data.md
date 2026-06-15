# Data & Persistence Guidelines

Tempo has no backend and no CMS. All user data lives in `localStorage`, persisted through a single hook. Static reference data (constants, achievement definitions) lives in plain JS modules.

## Persisted State: `useStorage`

`src/hooks/useStorage.js` is a `useState` + `localStorage` sync hook:

```js
export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    } catch {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

Usage in `App.jsx`:

```js
const [jobs, setJobs] = useStorage(STORAGE_KEYS.jobs, []);
const [stats, setStats] = useStorage(STORAGE_KEYS.stats, DEFAULT_STATS);
```

- `defaultValue` may be a value or a function (lazy default) — use a function if computing the default is non-trivial.
- `setValue` works exactly like `useState`'s setter, including the updater-function form (`setTasks((prev) => [...prev, newTask])`).

### Adding New Persisted State

1. Add a key to `STORAGE_KEYS` in `src/utils/helpers.js` (prefix `tempo_`, see `naming.md`).
2. Add `const [thing, setThing] = useStorage(STORAGE_KEYS.thing, defaultValue)` in `App.jsx`.
3. Pass `thing` and the relevant mutation callbacks down to the tabs that need them.

## Constants & Helpers (`src/utils/helpers.js`)

Centralizes everything that would otherwise be magic values scattered across components:

| Export | Purpose |
|--------|---------|
| `STORAGE_KEYS` | All `localStorage` key names |
| `CALENDAR_ACCOUNT_COLORS` | Fallback color palette for connected Google accounts |
| `JOB_COLORS` | Named color options for jobs (label + hex) |
| `JOB_TYPES` | Job type options (`'Full-time'`, `'Freelance'`, `'RFP'`, ...) |
| `PRIORITIES` | Task priority levels with color + XP value |
| `MEETING_DURATIONS`, `REMINDER_LEAD_TIMES` | Option lists for meeting forms |
| `DEFAULT_STATS` | Initial shape of the `stats` object (XP, streaks, history, etc.) |
| `LEVELS` | XP thresholds per level |
| `generateId()` | Timestamp + random suffix ID generator |
| `toDateKey()`, `getTodayString()`, `shiftDate()`, `formatDateLong()` | Date formatting/keying helpers (dates are keyed as `YYYY-MM-DD` strings) |
| `getPriority()`, `getJob()`, `getHistoryEntry()`, `getLevelInfo()` | Lookups/derivations over the data above |
| `fetchGoogleProfile()` | Calls Google's userinfo endpoint with an access token |

When you need a new option list, color palette, or derived lookup that's used by more than one component, add it here rather than duplicating it.

## Static Data Modules (`src/data/`)

Data that isn't user state but drives UI — currently `src/data/achievements.js`:

```js
export const ACHIEVEMENTS = [
  { id: 'first_task', icon: 'Star', title: 'First Step', description: 'Complete your first task', xp: 50 },
  // ...
];
```

- `id` values are stable strings used to track which achievements a user has `earned` (stored in `STORAGE_KEYS.earned`).
- `icon` is a `lucide-react` icon name resolved at render time (see `AchievementBadge.jsx`).
- Unlock logic lives in `src/hooks/useAchievements.js`, which evaluates `ACHIEVEMENTS` against `{ stats, jobs, tasks, meetings }`.

To add a new achievement: append an entry to `ACHIEVEMENTS` with a unique `id`, then add its unlock condition to `useAchievements.js`.

## Shape of Core Entities

These shapes are established by `App.jsx`'s mutation functions — keep new fields consistent with them:

```js
// Task
{ id, title, jobId, date, time, priority, done, doneAt, reminder, reminderTime, tags, xpAwarded }

// Job
{ id, name, type, color, googleAccountEmail, createdAt }

// Meeting
{ id, ...data } // shape defined by MeetingsTab/MeetingCard form

// Stats
{ totalXp, tasksCompleted, streak, lastActiveDate, longestStreak, earlyBirdEarned, nightOwlEarned, rfpCompleted, futureTasksAdded, history: { [dateKey]: { completed, xp, focusMinutes } } }
```

`date`/`dateKey` values are always `YYYY-MM-DD` strings produced by `toDateKey()`/`getTodayString()` — never store `Date` objects in persisted state (they don't survive `JSON.stringify`/`parse` round trips).

## Anti-Patterns

- Don't read/write `localStorage` directly outside `useStorage` — always go through the hook so state and storage stay in sync.
- Don't hardcode option lists (colors, priorities, durations) inline in a component — pull from `helpers.js`.
- Don't store `Date` objects, functions, or other non-JSON-serializable values in `useStorage` state.
