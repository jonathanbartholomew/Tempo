# Component Guidelines

## Directory Structure

Components are organized by feature, plus a shared `layout/` and `ui/`:

```
src/components/
├── achievements/   # AchievementBadge.jsx, AchievementsTab.jsx
├── auth/           # LoginScreen.jsx, SignInScreen.jsx
├── focus/          # FocusTab.jsx
├── jobs/           # JobCard.jsx, JobsTab.jsx
├── layout/         # Sidebar.jsx, Toast.jsx — app shell, shared across all tabs
├── meetings/       # MeetingCard.jsx, MeetingsTab.jsx
├── progress/       # ProgressTab.jsx
├── schedule/       # ScheduleTab.jsx, MonthCalendar.jsx, TimeGrid.jsx
├── settings/       # SettingsTab.jsx
├── tasks/          # TasksTab.jsx
├── today/          # TodayTab.jsx, QuickAdd.jsx, TaskRow.jsx, ActivityChart.jsx, ProgressRing.jsx, AIPlanImport.jsx
└── ui/             # background-beams.jsx, flip-words.jsx, google-icon.jsx, resizable-navbar.jsx
```

### Placement Rules

- **Feature folder** — any component used only within one tab/feature lives in that feature's folder, even if it's a small sub-component (e.g. `today/TaskRow.jsx`, `today/QuickAdd.jsx`).
- **`layout/`** — components that make up the app shell and appear regardless of active tab (`Sidebar`, `Toast`).
- **`ui/`** — generic, brand-agnostic visual primitives with no app-specific logic. These follow the Aceternity UI convention of kebab-case filenames and are typically copied/adapted from a UI library rather than written from scratch.

## Component Architecture

### Functional Components, Plain JS

All components are functional components written in `.jsx`, exported as `default`:

```jsx
export default function TaskRow({ task, jobs, onToggle, onDelete }) {
  // ...
  return (
    <div className="flex items-center gap-3 py-2">
      {/* ... */}
    </div>
  );
}
```

### Props

- Destructure props directly in the function signature.
- No `Props` interfaces or TypeScript — this is plain JS/JSX. Document non-obvious prop shapes with a short comment only if the name doesn't make it clear.
- Pass data and callbacks down explicitly from `App.jsx` → `*Tab` → sub-components. There is no context/global store for app data.

```jsx
export default function JobCard({ job, onRemove, accountColors }) {
  // ...
}
```

### Styling

- Tailwind utility classes inline via `className`. No CSS Modules, no `<style>` blocks, no SCSS.
- Use `cn()` from `src/lib/utils.js` (clsx + tailwind-merge) whenever classes are conditional or composed from multiple sources:

```jsx
import { cn } from '../../lib/utils';

<button className={cn(
  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
  active
    ? 'bg-blue-600 text-white'
    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
)}>
```

- For simple binary class toggles (one condition, two outcomes), a template literal is fine and matches existing code (see `Sidebar.jsx`); prefer `cn()` once there are 2+ conditions or you're merging with a base class list.

### Dark Mode

Every surface that has a light-mode background/text/border color should also define a `dark:` variant. Match the existing palette: `gray-50/100/200` ↔ `gray-950/900/800/700` (with the custom dark overrides in `index.css`), `blue-600` as the primary accent in both modes.

### Animation

Use `motion/react` (Framer Motion successor) for entrance animations, transitions, and interactive motion (e.g. hover/tap scale). Keep animations subtle — short durations, small transforms — consistent with the existing landing page and tab transitions.

### Icons

Use `lucide-react` for icons. Import only the icons you need by name (`import { Sun, ListTodo } from 'lucide-react'`).

## Creating New Components

1. Pick the right folder (feature folder for tab-specific UI, `layout/` for shell, `ui/` for generic primitives).
2. Name the file per `naming.md` (PascalCase for feature/layout components, kebab-case for `ui/`).
3. Write a plain functional component, props destructured in the signature.
4. Style with Tailwind + `cn()`, include `dark:` variants.
5. If the component needs persisted state, lift it to `App.jsx` via `useStorage` rather than managing it locally — local `useState` is fine for purely transient UI state (open/closed, input drafts, hover).

## Composition Pattern

`*Tab.jsx` components are the entry point for each feature and are rendered conditionally from `App.jsx` based on `activeTab`. A `*Tab` component:

- Receives all data (tasks, jobs, meetings, stats, etc.) and mutation callbacks as props.
- Lays out the page (typically `<div className="p-4 sm:p-6 md:p-8 ...">` or similar) and composes feature sub-components.
- Does not fetch data or read `localStorage` directly — that's `App.jsx`'s job via hooks.

```jsx
// src/components/focus/FocusTab.jsx
export default function FocusTab({ stats, onLogFocus }) {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      {/* timer UI, calls onLogFocus(minutes) when a session completes */}
    </div>
  );
}
```

## Related Guidelines

- `naming.md` — file and variable naming conventions
- `layout.md` — page layout, spacing, responsive patterns, dark mode
- `decorative-elements.md` — background glows, beams, drift animations
- `javascript.md` — hooks, helper conventions, ESLint rules
