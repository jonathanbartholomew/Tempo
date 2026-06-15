# Main Context — Tempo

<!--
  This is the template shape for .ai/context/main.md.
  This file tracks tab/screen status, decisions, and issues across sessions.
  Update it whenever tab status changes.
-->

## Tab Status Tracker

| Tab / Screen | Component | Status | Notes |
|--------------|-----------|--------|-------|
| Today | `today/TodayTab.jsx` | DONE | |
| Tasks | `tasks/TasksTab.jsx` | DONE | |
| Schedule | `schedule/ScheduleTab.jsx` | DONE | `activeTab` id is `'calendar'` |
| Focus | `focus/FocusTab.jsx` | DONE | |
| Progress | `progress/ProgressTab.jsx` | DONE | |
| Achievements | `achievements/AchievementsTab.jsx` | DONE | |
| Settings | `settings/SettingsTab.jsx` | DONE | |
| Login / Marketing | `auth/LoginScreen.jsx` | DONE | Only marketing surface |
| Sign In | `auth/SignInScreen.jsx` | DONE | Shown after "Get started" |

<!--
  Status values:
  - PENDING: Not started
  - IN_PROGRESS: Being built
  - DONE: Complete, reviewed
  - TWEAK: Minor fixes needed (list specifics in Notes)
  - MAKEOVER: Significant rework needed (list specifics in Notes)
-->

## Active Decisions

<!--
  Record architectural and design decisions as they're made.
  Format: "YYYY-MM-DD: Decision description — rationale"
  Example: "2026-01-15: No router — tab switching stays as activeTab local state in App.jsx"
-->

## Known Issues

<!--
  Track bugs or issues that are discovered but not immediately fixed.
  Include file path and description. Remove when resolved.
-->

## Shared Notes

<!--
  When multiple tabs share a pattern or convention, document it here.
  Example: "All *Tab components use the p-4 sm:p-6 md:p-8 max-w-*xl mx-auto wrapper from page-templates.md"
  Example: "tasks/jobs/meetings state is shared across Today, Tasks, Schedule, and Settings — check all four before changing shapes"
-->
