# Decorative Elements

Visual enhancements used in Tempo to add ambient depth and reinforce brand identity — primarily on the `LoginScreen` marketing page. The dashboard tabs are intentionally plain/content-focused and use few decorative elements.

## Core Principles

- **Ambient, not distracting** — decorations sit behind content, move slowly, and never demand attention.
- **Performance** — pure CSS animations (`transform`/`opacity`) and SVG, no heavy JS-driven effects.
- **Accessibility** — all decorative elements are `aria-hidden` (implicitly, via being purely visual divs with no text/interactive content) and have `pointer-events-none`.
- **Dark mode aware** — opacity/intensity is reduced in dark mode to avoid glow overload.

---

## Available Patterns

### 1. `SectionGlow` — Drifting Gradient Blobs

The primary decorative pattern, used at the top of most `LoginScreen` sections. Defined locally in `LoginScreen.jsx`:

```jsx
function SectionGlow() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl animate-drift" />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-purple-400/15 dark:bg-purple-500/10 blur-3xl animate-drift-reverse" />
    </div>
  );
}
```

**When to use:** Inside any `relative`-positioned section on the landing page that needs ambient visual interest (feature sections, pricing, CTA, footer).
**When NOT to use:** Inside the fixed hero (it already has its own gradient background) or inside dashboard tab content.

Usage — render as the first child of a `relative`-positioned section wrapper:

```jsx
<section className="relative ...">
  <SectionGlow />
  <div className="max-w-5xl mx-auto px-4 py-16">
    {/* content */}
  </div>
</section>
```

The `-z-10` here is safe because `SectionGlow` is the *first* child of its own section (later siblings paint above it within the same stacking context) — this is different from the fixed full-page hero wrapper, where `-z-10` breaks click-through (see `layout.md`).

### 2. Drift Keyframes (`index.css`)

```css
@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}

@keyframes drift-reverse {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 30px) scale(1.15); }
}

.animate-drift { animation: drift 22s ease-in-out infinite; }
.animate-drift-reverse { animation: drift-reverse 28s ease-in-out infinite; }
```

Two different durations (22s/28s) and opposite translate directions keep the pair of blobs from moving in sync, which reads as more organic.

### 3. `BackgroundBeams` (`src/components/ui/background-beams.jsx`)

An Aceternity-style animated SVG beam field (many curved paths with staggered gradient animations), wrapped with `cn()` for class composition. Used for high-impact hero backgrounds where a stronger effect than `SectionGlow` is wanted.

**When to use:** Sparingly — at most one per page, typically the hero.
**When NOT to use:** Combined with `SectionGlow` in the same section (too much movement), or in dashboard tabs.

### 4. `.glow-card` (`index.css`)

```css
.glow-card {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.08), 0 8px 30px -10px rgba(37, 99, 235, 0.25);
}
.dark .glow-card {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15), 0 8px 30px -8px rgba(37, 99, 235, 0.35);
}
```

A subtle blue ring + shadow for "featured" cards (e.g. a highlighted pricing tier). Apply via `className="glow-card"` alongside normal Tailwind classes.

---

## Accessibility & Performance Rules

1. Decorative wrappers must have `pointer-events-none` so they never intercept clicks.
2. Decorative divs carry no text content and aren't focusable — no `aria-hidden` attribute is needed in practice since they're empty, non-interactive `<div>`s, but don't add `tabIndex` or text to them.
3. Reduce opacity in dark mode (`dark:bg-blue-500/10` vs `bg-blue-400/20`) rather than keeping light-mode intensity.
4. Animate only `transform`/`opacity` (GPU-accelerated); keep durations long (20s+) for ambient effects.
5. Limit blur radius to `blur-3xl` (Tailwind's largest) — don't stack multiple large-blur layers in one section.

## Combining Decorative Elements

- **Safe**: `SectionGlow` + solid section background; one `BackgroundBeams` instance per page in the hero only.
- **Avoid**: `SectionGlow` + `BackgroundBeams` in the same section; multiple `animate-drift` blob pairs stacked in adjacent sections (visually busy when scrolling).

## Related Guidelines

- `layout.md` — stacking order / z-index rules for the fixed hero vs. scrolling sections
- `branding.md` — color palette used for glows and gradients
- `components.md` — `cn()` and Tailwind composition patterns
