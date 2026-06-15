# Project Guidelines

Tempo is a single-page gamified productivity app: React 19 + Vite + Tailwind CSS v4, plain JS/JSX (no TypeScript source). State persists to `localStorage` via `useStorage`; Google OAuth + Calendar provide the only external integration.

## Project Structure

```
src/
├── assets/              # Static assets (logo images, favicon, etc.)
├── components/
│   ├── achievements/    # AchievementBadge, AchievementsTab
│   ├── auth/            # LoginScreen (marketing/landing), SignInScreen
│   ├── focus/            # FocusTab (Pomodoro-style focus timer)
│   ├── jobs/             # JobCard, JobsTab
│   ├── layout/           # Sidebar, Toast — app shell
│   ├── meetings/          # MeetingCard, MeetingsTab
│   ├── progress/         # ProgressTab (stats/XP charts)
│   ├── schedule/         # ScheduleTab, MonthCalendar, TimeGrid
│   ├── settings/          # SettingsTab
│   ├── tasks/             # TasksTab
│   ├── today/             # TodayTab, QuickAdd, TaskRow, ActivityChart, ProgressRing, AIPlanImport
│   └── ui/                # Aceternity-UI-style primitives (background-beams, flip-words, resizable-navbar, google-icon)
├── data/                 # Static data modules (achievements.js)
├── hooks/                # useStorage, useTheme, useAuth, useGoogleCalendar, useCalendarAccounts, useAchievements, useNotifications
├── lib/                  # utils.js — cn() helper (clsx + tailwind-merge)
├── utils/                # helpers.js (constants/formatters), aiPlan.js
├── App.jsx               # Root component — tab routing, top-level state, all mutation handlers
├── main.jsx              # Entry point — wraps <App /> in GoogleOAuthProvider
└── index.css             # Tailwind import, dark mode variant, global keyframes/overrides
```

## Placement Rules

- **Feature folders** (`today/`, `tasks/`, `schedule/`, `focus/`, `progress/`, `achievements/`, `settings/`, `jobs/`, `meetings/`, `auth/`) hold everything specific to one tab or screen — the `*Tab.jsx` entry component plus any sub-components it alone uses.
- **`layout/`** holds app-shell components shared across every tab (`Sidebar`, `Toast`).
- **`ui/`** holds generic, reusable visual primitives with no feature-specific logic (Aceternity-style components, kebab-case filenames).
- **`hooks/`** holds all custom hooks — one hook per file, `useXxx.js`.
- **`utils/`** holds plain helper functions and constants (`helpers.js`, `aiPlan.js`). **`lib/`** holds small infrastructure utilities (`cn()`).
- **`data/`** holds static data modules that aren't user state (e.g. `achievements.js` — the achievement definitions list).

## App Architecture

`App.jsx` is the composition root:

- Owns all persisted state via `useStorage` (`jobs`, `tasks`, `meetings`, `stats`, `earned`, `hiddenEventTitles`).
- Owns `activeTab` state and renders exactly one `*Tab` component based on it.
- Defines all mutation handlers (`addTask`, `toggleTask`, `addJob`, `addMeeting`, `logFocusSession`, etc.) and passes them down as props — there is no global store/context for app data.
- Wires up cross-cutting hooks (`useAuth`, `useGoogleCalendar`, `useCalendarAccounts`, `useAchievements`, `useNotifications`, `useTheme`) and derives `connectedAccounts`, `accountColors`, `calendarSources`, `visibleGoogleEvents` via `useMemo`.
- Renders `LoginScreen`/`SignInScreen` when `auth` is null, otherwise the `Sidebar` + active tab.

Tabs receive data and callbacks as props — they don't read from `localStorage` or call hooks that own shared state directly.

## Best Practices

### Accessibility

- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`, `<dialog>` where appropriate).
- Add `aria-label` to icon-only buttons (see `Sidebar`'s mobile menu toggle).
- Ensure interactive elements are reachable via keyboard and have visible focus states.
- Add `alt` text to all images (user avatars, logos).

### Component Documentation

Keep this lightweight — this project does not use JSDoc blocks on every component. Reserve comments for non-obvious logic (e.g. a workaround for a Google Calendar quirk, a streak-calculation edge case). Don't document what well-named props/functions already say.

## Development Workflow

1. **Persist with `useStorage`** — any new piece of user data that should survive a refresh goes through `useStorage(STORAGE_KEYS.xxx, defaultValue)`, with the key added to `STORAGE_KEYS` in `helpers.js`.
2. **Centralize constants** — colors, durations, label lists, etc. belong in `src/utils/helpers.js`, not hardcoded in components.
3. **Use `cn()`** for conditional/merged Tailwind class strings (`src/lib/utils.js`).
4. **Dark mode** — use Tailwind's `dark:` variant (enabled via the `.dark` class + `@custom-variant dark` in `index.css`), toggled by `useTheme`.
5. **Follow conventions** — see `naming.md`, `components.md`, `layout.md`, and `javascript.md` for file naming, component patterns, and JS conventions.
6. **Do not run `npx eslint` or `npx vite build`** to verify changes — the user runs lint/build themselves (see `CLAUDE.md`).
7. **Do not use Playwright or browser automation** to verify UI changes — describe the change and let the user check visually.

## Quick Reference

| Task | Location |
|------|----------|
| Add a new tab | `src/components/{feature}/{Feature}Tab.jsx` + wire into `App.jsx` + `Sidebar.jsx` |
| Add a constant/config value | `src/utils/helpers.js` |
| Add persisted state | `useStorage(STORAGE_KEYS.xxx, default)` in `App.jsx`, key in `helpers.js` |
| Add a custom hook | `src/hooks/useXxx.js` |
| Add a reusable visual primitive | `src/components/ui/kebab-case-name.jsx` |
| Add an external integration | `src/hooks/` + document in `integrations.md` |
| Global styles / dark mode overrides / keyframes | `src/index.css` |
