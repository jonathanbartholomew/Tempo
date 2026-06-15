# Layout & Design Guidelines

This document defines the layout philosophy, grid system, and design patterns for Tempo.

---

## Layout Philosophy

- **Style**: Clean, modern SaaS dashboard for the app shell; warm marketing/landing feel for `LoginScreen`.
- **Key characteristics**: Card-based content blocks (`rounded-2xl`/`rounded-xl`, subtle borders, soft shadows), generous spacing, blue (`blue-600`) as the single accent color, dark mode as a first-class equal to light mode.
- **Visual priorities**: Today's tasks/schedule are the focal point of the dashboard; gamification (XP, streaks, levels, achievements) is presented as supporting/secondary visual interest, not the main focus.

---

## App Shell Layout

The authenticated app uses a fixed sidebar + scrolling content area:

```
<div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors md:pl-60">
  <Sidebar ... />      {/* fixed md:w-60 on desktop, top bar + slide-out on mobile */}
  <Toast toasts={toasts} />
  {activeTab === 'today' && <TodayTab ... />}
  ...
</div>
```

- **Desktop (`md:` and up)**: `Sidebar` is `md:fixed md:inset-y-0 md:left-0 md:w-60`; the content wrapper offsets with `md:pl-60` so content never sits under the sidebar.
- **Mobile (below `md:`)**: `Sidebar` renders a sticky top bar (`h-20`) with a hamburger menu that opens a slide-out drawer (`fixed inset-0 z-50` overlay + `w-64 max-w-[80%]` panel).
- Each `*Tab` component owns its own internal padding (typically `p-4 sm:p-6 md:p-8`) and max-width constraints — the shell itself adds no extra padding beyond the sidebar offset.

## Marketing Page Layout (`LoginScreen`)

The landing page uses a different pattern — full-bleed sections with a fixed gradient background and a parallax-style "slide over" effect:

```
<div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900">
  {/* hero content, nav */}
</div>
<div className="relative bg-gray-50 dark:bg-gray-950 ...">
  {/* feature sections scroll over the fixed hero */}
</div>
```

**Do not add `-z-10` to the fixed hero wrapper** — per CSS2.1 painting order, a negative-z-index element paints before (i.e. behind, in stacking terms that still intercept clicks for) later in-flow siblings, which breaks click-through on hero buttons. The fixed hero should remain at the default stacking level; later sections naturally paint above it because they come later in DOM order.

Each major section wraps its content with `SectionGlow` (see `decorative-elements.md`) for ambient drifting gradient blobs, and uses `max-w-5xl mx-auto px-4 py-16` for consistent section width/spacing.

## Spacing Strategy

- Section vertical padding: `py-16` for marketing sections, `p-4 sm:p-6 md:p-8` for tab content.
- Card padding: `p-4`–`p-6` depending on density; gaps between grid/flex items: `gap-3`–`gap-6`.
- Use `space-y-*` for stacked lists (e.g. `Sidebar`'s `nav` uses `space-y-1`).

## Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| Default (mobile) | Single column, stacked layout, sidebar becomes a top bar + drawer |
| `sm:` (≥640px) | Multi-column grids begin (e.g. `grid-cols-1 sm:grid-cols-3`) |
| `md:` (≥768px) | Sidebar becomes fixed left rail (`md:pl-60`), desktop nav shows |
| `lg:` | Used sparingly for wider marketing layouts |

Always design mobile-first: base classes target mobile, then layer `sm:`/`md:`/`lg:` overrides.

## Dark Mode

- Enabled via `.dark` class on `<html>`/`<body>`, toggled by `useTheme`, with `@custom-variant dark (&:where(.dark, .dark *))` defined in `index.css`.
- Custom dark-mode color overrides for `gray-950/900/800/700` are defined in `index.css` under `.dark { --color-gray-950: ...; }` — these darken Tailwind's default gray scale for a richer dark theme.
- Every component with light-mode background/border/text colors must specify the `dark:` counterpart. Standard pairs: `bg-white` ↔ `dark:bg-gray-900`, `bg-gray-50` ↔ `dark:bg-gray-950`, `border-gray-200` ↔ `dark:border-gray-800`, `text-gray-900` ↔ `dark:text-gray-100`, `text-gray-500` ↔ `dark:text-gray-400`.
- `blue-600` (primary accent / active nav state / primary buttons) stays the same in both modes.

## Special Effects

- **Parallax/slide-over**: Fixed gradient hero behind scrolling content sections (`LoginScreen` only) — see above.
- **Drift animations**: `animate-drift` / `animate-drift-reverse` keyframes (in `index.css`) move blurred gradient blobs slowly for ambient motion — see `decorative-elements.md`.
- **Glow card**: `.glow-card` utility class (in `index.css`) adds a subtle blue box-shadow ring, with a stronger dark-mode variant.
- Avoid `prefers-reduced-motion`-violating heavy animation — keep drift/transition durations long and subtle (20s+ for ambient blobs, <300ms for interactive transitions).

## Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Add `-z-10` to the fixed hero background in `LoginScreen` | Breaks click-through on hero buttons due to CSS painting order | Leave the hero at default stacking; rely on DOM order for later sections to paint on top |
| Hardcode gray/blue hex values in components | Inconsistent with Tailwind palette and dark mode overrides | Use Tailwind color utilities (`gray-900`, `blue-600`, etc.) with `dark:` variants |
| Add page-level padding in `App.jsx` | Each tab manages its own padding/max-width | Add `p-4 sm:p-6 md:p-8` (or similar) inside the `*Tab` component |
| Use `position: fixed` for new full-page overlays without checking the hero pattern | Can re-introduce the click-interception bug | Test click-through on interactive elements after adding fixed/absolute layers |
