# Branding Guidelines

This document defines Tempo's visual identity, color palette, and brand voice.

---

## Product

**Tempo** — a gamified daily planner that unifies tasks, meetings, and Google Calendar events into one timeline, with AI-assisted day planning and XP/streak/achievement gamification.

**Tagline**: "Plan your time. Stay in rhythm. Get things done." (the last word rotates via `FlipWords`: done / organized / scheduled)

**Positioning line** (used in the hero subtitle): "Tasks, meetings, and Google Calendar — together in one simple, gamified daily planner with AI-assisted planning built right in."

---

## Color Palette

### Primary

| Color | Tailwind token | Usage |
|-------|----------------|-------|
| Blue | `blue-600` (hover `blue-700`) | Primary CTA buttons, active nav state, primary accent — same in light and dark mode |
| Slate/Blue gradient | `from-slate-950 via-blue-950 to-slate-900` | Fixed marketing hero background |

### Neutral (Light / Dark pairs)

| Role | Light | Dark |
|------|-------|------|
| Page background | `gray-50` | `gray-950` (custom-darkened, see `index.css`) |
| Surface/card background | `white` | `gray-900` |
| Border | `gray-200` | `gray-800` |
| Primary text | `gray-900` | `gray-100` |
| Secondary text | `gray-500` | `gray-400` |

### Gamification Accents

| Color | Usage |
|-------|-------|
| Orange (`orange-500`) | Streak flame icon/text |
| Job colors (`JOB_COLORS` in `helpers.js`) | Blue, Purple, Pink, Green, Orange, Teal, Red, Indigo — user-assignable per job for color-coding tasks/events |
| Priority colors (`PRIORITIES` in `helpers.js`) | Gray (low), Blue (normal), Amber (high), Red (urgent) |

### Decorative Gradients

| Combination | Usage |
|-------------|-------|
| `bg-blue-400/20 dark:bg-blue-500/10` + `bg-purple-400/15 dark:bg-purple-500/10` | `SectionGlow` drifting blobs (see `decorative-elements.md`) |
| `from-white via-blue-50 to-blue-100` (light) / `from-blue-950 via-[#111a37] to-gray-950` (dark) | Marketing page section background gradient, beneath the fixed hero |

---

## Logo

Three logo assets in `src/assets/`:

| File | Usage |
|------|-------|
| `tempo-logo-trans.png` | Light mode (transparent background) |
| `tempo-logo-dark-mode.png` | Dark mode, and always on the dark hero regardless of app theme |
| `tempo-logo.png` | Source/full logo (general use) |

Pattern: `<img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-..." />`. The hero on `LoginScreen` always uses `logoDark` since its background is always dark (slate/blue gradient).

---

## Brand Voice

### Tone

- **Encouraging, energetic, low-pressure** — frames productivity as a rhythm/game, not a grind ("Stay in tempo", "Level up your routine", "On Fire", "Unstoppable", "Legend").
- **Plain and direct** — short sentences, concrete benefits, no jargon or corporate-speak.
- **Playful gamification language** — XP, levels, streaks, achievements use light, fun naming (see `src/data/achievements.js`: "First Step", "On Fire", "Task Machine", "Habit Master", "RFP Fighter").

### Writing Style

**Do:**
- Lead with the benefit ("Today's schedule, unified", "Every calendar, one view").
- Use second person ("Connect your calendars", "Stay in tempo").
- Keep feature descriptions to 1-2 short sentences.

**Don't:**
- Don't use filler buzzwords ("revolutionary", "game-changing", "synergy").
- Don't make achievement/notification copy preachy — keep it celebratory and brief (e.g. `+${xp} XP — Task complete!`, `Achievement unlocked: ${title} (+${xp} XP)`, `Level up! You are now Level ${level}`).

---

## Visual Personality

- **Card-based UI** — `rounded-xl`/`rounded-2xl` surfaces with subtle borders and soft shadows (`glow-card` for highlighted items).
- **Single accent color** — blue is the only "brand" color used for actions/active states; everything else is neutral grays plus user-assignable job/priority colors.
- **Dark mode parity** — every screen is designed for both themes from the start, not retrofitted.
- **Ambient motion on marketing pages only** — drifting gradient blobs and beam animations belong on `LoginScreen`; dashboard tabs stay calm and static aside from functional transitions (toasts, tab switches).

## Element Guidelines

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page background | `bg-gray-50` | `bg-gray-950` |
| Card/surface | `bg-white` | `bg-gray-900` |
| Primary CTA | `bg-blue-600 hover:bg-blue-700 text-white` | same |
| Active nav item | `bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]` | same |
| Links/secondary text | `text-gray-500` | `text-gray-400` |
| Borders | `border-gray-200` | `border-gray-800` |
