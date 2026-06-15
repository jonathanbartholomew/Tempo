# Page Templates

Standard structures for the two kinds of "page" in Tempo: dashboard **tabs** (authenticated app) and the **marketing landing page** (`LoginScreen`, unauthenticated).

## 1. Tab Template

**Purpose:** Any authenticated dashboard screen (Today, Tasks, Schedule, Focus, Progress, Achievements, Settings).
**When to use:** Every new top-level screen reachable from `Sidebar`.

### Structure

```jsx
export default function {Feature}Tab({ /* data + callbacks from App.jsx */ }) {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-{n}xl mx-auto">
      {/* Optional header: title + summary/actions */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Title}</h1>
      </header>

      {/* Main content: cards, lists, grids */}
      <div className="space-y-4">
        {/* ... */}
      </div>
    </div>
  );
}
```

### Key Patterns

- Outer wrapper: `p-4 sm:p-6 md:p-8` plus a `max-w-*` constraint appropriate to content density (narrow for `FocusTab`/timer-style UI, wider for `ScheduleTab`/grids).
- Cards use `rounded-xl`/`rounded-2xl`, `border border-gray-200 dark:border-gray-800`, `bg-white dark:bg-gray-900`.
- Lists of items (tasks, jobs, meetings) render via a dedicated row/card sub-component (`TaskRow`, `JobCard`, `MeetingCard`) kept in the same feature folder.
- Empty states should still render something useful (e.g. "No tasks yet — add one above") rather than a blank area.
- All interactive elements get `dark:` variants and `cursor-pointer` (global `button:not(:disabled)` rule already covers buttons).

### Existing Tabs Reference

| Tab | Component | Notes |
|-----|-----------|-------|
| Today | `today/TodayTab.jsx` | Unified timeline (tasks + meetings + Google events), `QuickAdd`, `AIPlanImport`, `ActivityChart`, `ProgressRing` |
| Tasks | `tasks/TasksTab.jsx` | Full task list/management |
| Schedule | `schedule/ScheduleTab.jsx` | `MonthCalendar` + `TimeGrid`, `activeTab` id is `'calendar'` |
| Focus | `focus/FocusTab.jsx` | Focus/timer session, logs minutes via `onLogFocus` |
| Progress | `progress/ProgressTab.jsx` | XP/level/streak stats and charts |
| Achievements | `achievements/AchievementsTab.jsx` | Grid of `AchievementBadge` (earned vs. locked) |
| Settings | `settings/SettingsTab.jsx` | Theme toggle, account/calendar management, jobs, hidden events |
| Jobs | `jobs/JobsTab.jsx` | Job management (also surfaced within Settings) |
| Meetings | `meetings/MeetingsTab.jsx` | Meeting management (also surfaced within Schedule) |

---

## 2. Marketing Landing Page Template (`LoginScreen.jsx`)

**Purpose:** Pre-auth landing page — the only marketing surface in the app.
**When to use:** Only for `LoginScreen`. Don't create additional marketing pages without discussing with the user — this is a single-page app.

### Structure

```
LoginScreen
├── Navbar (resizable-navbar) — logo, nav links (Features / How it works / Pricing), "Get started" CTA
├── Fixed Hero — slate/blue gradient + BackgroundBeams, logo, headline w/ FlipWords, subtitle, CTAs (STRONG)
├── Spacer (h-[120vh]) — lets the fixed hero show before content slides over it
└── Scrolling content (relative, gradient background, each section wrapped with SectionGlow):
    ├── Feature showcase (horizontal-scroll panels, SLIDES array — icon, title, description, mockup)
    ├── How it works (STEPS array — 3-step process)
    ├── Pricing (PRICING_TIERS — Free / Personal / Enterprise)
    ├── CTA section ("Ready to find your tempo?")
    └── Footer (logo, nav links again)
```

### Key Patterns

- Content for each section lives in a local array constant at the top of `LoginScreen.jsx` (`SLIDES`, `STEPS`, `PRICING_TIERS`, `NAV_ITEMS`) — not in a separate data file, since this is the only marketing page.
- Anchor links (`#features`, `#how-it-works`, `#pricing`) use the `scrollToHash` handler for smooth scrolling, with `suppressSnapRef` to avoid fighting the horizontal-scroll snap behavior.
- Every section is `relative` and renders `<SectionGlow />` as its first child (except the fixed hero, which has its own beams/gradient).
- The fixed hero must **not** have `-z-10` (see `layout.md` for why).
- Pricing tiers: `highlighted: true` on the recommended tier applies `glow-card` styling.

### Checklist Before Changing the Landing Page

- [ ] New sections wrapped in `relative` + `<SectionGlow />` (unless they're the hero)
- [ ] `dark:` variants present for all backgrounds/text/borders
- [ ] CTAs use `cursor-pointer` and the standard `bg-blue-600 hover:bg-blue-700` button style (or outline variant)
- [ ] Smooth-scroll anchors use `scrollToHash`, not raw `href` jumps
- [ ] No `-z-10` added to the fixed hero wrapper

## Related Guidelines

- `components.md` — component structure and styling conventions
- `layout.md` — spacing, responsive breakpoints, fixed-hero/parallax pattern
- `decorative-elements.md` — `SectionGlow`, `BackgroundBeams`, drift animations
- `branding.md` — copy tone, color palette, logo usage
