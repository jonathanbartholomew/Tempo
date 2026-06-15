# Naming Conventions

## File Names

- **Feature/layout components**: `PascalCase.jsx` (e.g. `TodayTab.jsx`, `QuickAdd.jsx`, `Sidebar.jsx`, `AchievementBadge.jsx`).
- **`ui/` primitives**: `kebab-case.jsx`, matching the Aceternity UI convention (e.g. `background-beams.jsx`, `flip-words.jsx`, `resizable-navbar.jsx`, `google-icon.jsx`).
- **Hooks**: `camelCase.js`, always prefixed `use` (e.g. `useStorage.js`, `useGoogleCalendar.js`, `useAchievements.js`).
- **Utils/lib**: `camelCase.js` (e.g. `helpers.js`, `aiPlan.js`, `utils.js`).
- **Data modules**: `camelCase.js` (e.g. `achievements.js`).

## Component Naming

- Component function names match their filename: `export default function TodayTab() {}` in `TodayTab.jsx`.
- `ui/` primitives may export differently-cased internal names but the file stays kebab-case (matches upstream Aceternity component source for easy diffing/updates).
- Tab components are always named `{Feature}Tab` (e.g. `TasksTab`, `ScheduleTab`, `FocusTab`, `ProgressTab`, `AchievementsTab`, `SettingsTab`, `JobsTab`, `MeetingsTab`).

## Variable & Function Naming

- `camelCase` for variables, functions, and props: `activeTab`, `toggleTask`, `onAddTask`, `googleEvents`.
- Event handler props passed down to children: `on{Event}` (e.g. `onAddTask`, `onToggleTask`, `onDeleteMeeting`, `onLogout`).
- Local handler functions defined in the owning component: `handle{Event}` or a direct verb (`addTask`, `toggleTask`, `logFocusSession`) — match existing `App.jsx` naming (verb + noun, no `handle` prefix for top-level mutation functions).
- Boolean state/props: `is`/`has`/`show` prefix (`isCalendarConnected`, `showSignIn`, `mobileOpen`).
- Constants and enums-style arrays: `UPPER_SNAKE_CASE` (e.g. `STORAGE_KEYS`, `JOB_COLORS`, `JOB_TYPES`, `PRIORITIES`, `CALENDAR_ACCOUNT_COLORS`, `NAV_ITEMS`, `LEVELS`).

## Storage Keys

All `localStorage` keys are defined once in `STORAGE_KEYS` (`src/utils/helpers.js`) using the `tempo_` prefix and `snake_case` suffix:

```js
export const STORAGE_KEYS = {
  jobs: 'tempo_jobs',
  tasks: 'tempo_tasks',
  hiddenEvents: 'tempo_hidden_calendar_events',
};
```

Never hardcode a storage key string in a component — add it to `STORAGE_KEYS` and reference the constant.

## Tailwind Class Ordering

Follow the rough convention seen in existing components — layout/box model first, then visual, then state variants:

```
{display/position} {sizing} {spacing} {flex/grid alignment} {color/background} {border/radius} {typography} {transitions} {hover/focus/dark variants}
```

```jsx
className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
```

`dark:` variants sit immediately after their light-mode counterpart so the pair is easy to scan.

## IDs and Data Identifiers

- Entity IDs are generated with `generateId()` (`src/utils/helpers.js`) — a timestamp + random suffix string. Never use array indices as IDs for tasks/jobs/meetings.
- Tab identifiers used in `activeTab` / `NAV_ITEMS` are lowercase single words matching the route concept: `'today'`, `'tasks'`, `'calendar'` (Schedule tab's id — kept as `calendar` for historical reasons), `'focus'`, `'progress'`, `'achievements'`, `'settings'`.

## `cn()` Usage

Import as `cn` from `src/lib/utils.js` (re-exports `clsx` + `tailwind-merge`). Use it whenever merging a base class string with conditional classes, so later classes correctly override earlier ones.
