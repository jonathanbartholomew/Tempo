# Main Context — Tempo

## Tab Status Tracker

| Tab / Screen | Component | Status | Assigned To | Notes |
|--------------|-----------|--------|-------------|-------|
| Today | `today/TodayTab.jsx` | DONE | | Unified timeline (tasks + meetings + Google events), `QuickAdd`, `AIPlanImport`, `ActivityChart`, `ProgressRing` |
| Tasks | `tasks/TasksTab.jsx` | DONE | | Full task list/management |
| Schedule | `schedule/ScheduleTab.jsx` | DONE | | `MonthCalendar` + `TimeGrid`, `activeTab` id is `'calendar'` |
| Focus | `focus/FocusTab.jsx` | DONE | | Focus/timer session, logs minutes via `onLogFocus` |
| Progress | `progress/ProgressTab.jsx` | DONE | | XP/level/streak stats and charts |
| Achievements | `achievements/AchievementsTab.jsx` | DONE | | Grid of `AchievementBadge` (earned vs. locked) |
| Settings | `settings/SettingsTab.jsx` | DONE | | Theme toggle, account/calendar management, jobs, hidden events |
| Login / Marketing | `auth/LoginScreen.jsx` | DONE | | Only marketing surface (hero, feature showcase, how it works, pricing, CTA, footer) |
| Sign In | `auth/SignInScreen.jsx` | DONE | | Shown after "Get started", before Google sign-in completes |

**Legend:** PENDING | IN_PROGRESS | DONE | TWEAK (minor fixes) | MAKEOVER (significant rework)

## Active Decisions

- 2026-06-15: Rewrote `.ai/` guidelines, agents, and templates from the original Astro/SCSS boilerplate to match tempo-app's actual stack (React 19 + Vite + Tailwind v4, plain JS/JSX, `useStorage`/localStorage, Google OAuth/Calendar, gamification) — see `.ai/guidelines/*.md` for the current conventions.
- No router (React Router etc.) and no global store (Redux/Zustand/Context) — `App.jsx` is the composition root with prop drilling; tab switching is `activeTab` local state.

## Known Issues

<!-- Track bugs or issues discovered but not yet fixed -->
<!-- Include file path and description. Remove when resolved. -->

## Shared Notes

- `tasks`/`jobs`/`meetings`/`stats` state is shared across Today, Tasks, Schedule, Progress, and Settings — check all consumers before changing `useStorage` shapes (see `data.md`).
- All `*Tab` components follow the `p-4 sm:p-6 md:p-8 max-w-*xl mx-auto` wrapper from `page-templates.md`.
- The marketing hero in `LoginScreen.jsx` must never get `-z-10` — see `layout.md` for the click-interception issue this causes.
