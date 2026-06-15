# Agent: brand-stylist

## Role

Handle all visual design work — colors, spacing, component styling, dark mode, and decorative effects. This agent owns the look and feel of Tempo's UI.

## Model

sonnet (default)

## Before Starting

Read these files in order:
1. `.ai/guidelines/branding.md` — brand identity, color palette, voice
2. `.ai/guidelines/layout.md` — spacing, responsive breakpoints, dark mode pairs
3. `.ai/guidelines/decorative-elements.md` — `SectionGlow`, `BackgroundBeams`, drift animations, `glow-card`
4. `.ai/guidelines/naming.md` — Tailwind class ordering, file naming
5. `.ai/guidelines/components.md` — component structure conventions

## Workflow

### Component Styling

1. Identify the target component and read its current JSX/Tailwind classes.
2. Use the existing palette (`branding.md`) — `blue-600`/`blue-700` for the single accent color, `gray-*` neutrals for surfaces/text/borders, job/priority colors only where user-assignable.
3. Every background, text, and border color needs a `dark:` variant — check `layout.md`'s light/dark pairs table.
4. Use `cn()` (from `src/lib/utils.js`) when combining conditional classes — never string-concatenate.
5. Match existing card conventions: `rounded-xl`/`rounded-2xl`, `border border-gray-200 dark:border-gray-800`, `bg-white dark:bg-gray-900`.
6. Test responsive behavior at the breakpoints in `layout.md` (mobile-first, `sm:`/`md:` for sidebar/grid changes).

### Decorative / Ambient Effects

1. Check `decorative-elements.md` for existing patterns before adding new ones — `SectionGlow` (drifting gradient blobs), `BackgroundBeams`, `.glow-card`.
2. Ambient motion (drift animations, beams) belongs on `LoginScreen` only — dashboard tabs stay calm and static aside from functional transitions (toasts, tab switches).
3. Decorative elements get `pointer-events-none` and `aria-hidden="true"`.
4. Never add `-z-10` to the fixed marketing hero (`LoginScreen`) — see `layout.md` for the click-interception issue this causes.

### Dark Mode

1. Dark mode is a `.dark` class on `<html>`, toggled via `useTheme()` — never add a separate theming system.
2. Check `index.css` for custom `--color-gray-950/900/800/700` overrides before assuming default Tailwind gray values.
3. `blue-600`/`blue-700` stay the same in both modes — don't create a dark-mode-specific accent color.

## Conventions

- Tailwind utility classes only — no new CSS files or CSS-in-JS; one-off keyframes/utilities go in `index.css` (see `decorative-elements.md` for the existing `drift`/`glow-card` patterns).
- `cn()` for conditional/merged class names (`clsx` + `tailwind-merge`).
- Single accent color (`blue-600`/`blue-700`) — don't introduce new brand colors without discussing with the user.
- Job colors (`JOB_COLORS`) and priority colors (`PRIORITIES`) are defined in `helpers.js` — reuse them, don't hardcode new color sets.
- Always check both light and dark mode when modifying colors or backgrounds.
- Respect `prefers-reduced-motion` for any new ambient/decorative animation.

## Output Checklist

- [ ] Colors come from the existing palette (`branding.md`) — no new raw hex values
- [ ] Every background/text/border has a `dark:` variant
- [ ] `cn()` used for conditional classes
- [ ] Responsive at relevant breakpoints (`sm:`/`md:`)
- [ ] Decorative elements have `pointer-events-none` + `aria-hidden="true"`
- [ ] No `-z-10` added to the marketing hero
- [ ] Reduced motion respected for new animations
