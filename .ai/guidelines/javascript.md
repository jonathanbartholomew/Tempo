# JavaScript Guidelines

Tempo is plain JavaScript/JSX — there is no TypeScript in `src/` (only `@types/react`/`@types/react-dom` dev dependencies for editor IntelliSense). No path aliases — all imports are relative.

## General Rules

- **`.jsx`** for files containing JSX (components), **`.js`** for hooks/utils/data with no JSX.
- **Relative imports** — no `@/` or other path aliases:
  ```js
  import { cn } from '../../lib/utils';
  import { STORAGE_KEYS, generateId } from '../../utils/helpers';
  ```
- **No `any`-equivalent concerns** — since this is plain JS, focus on clear naming and small, single-purpose functions instead of type annotations.
- **ES modules** — `import`/`export`, named exports for hooks/utils/data, default export for components.

## ESLint Configuration (`eslint.config.js`)

Flat config targeting `**/*.{js,jsx}`:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
```

This enforces:
- `eslint-plugin-react-hooks` rules of hooks (`useEffect`/`useMemo`/`useCallback` dependency arrays, no conditional hook calls).
- `eslint-plugin-react-refresh`'s Vite rules (components must be the only export, or use the documented escape patterns).
- Standard JS recommended rules (no unused vars, no undefined globals, etc.).

**Do not run `npx eslint` to verify changes** — the user runs lint themselves (see `CLAUDE.md`). When `react-hooks/exhaustive-deps` would legitimately fire on an intentional omission (see `useGoogleCalendar`'s `refresh` callback or `App.jsx`'s achievement-check effect), use a targeted `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment-free justification only if the omission is intentional and documented by the surrounding code structure — don't disable broadly.

## Custom Hooks Pattern

Hooks live in `src/hooks/`, one per file, named `useXxx`. A hook returns either an array (state-pair style, mirroring `useState`) or an object (when returning multiple values/functions):

```js
// State-pair style (mirrors useState)
export function useTheme() {
  const [theme, setTheme] = useStorage(STORAGE_KEYS.theme, () =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return [theme, toggleTheme];
}

// Object style (multiple values/actions)
export function useAuth() {
  const [auth, setAuth] = useStorage(STORAGE_KEYS.auth, null);
  // ...
  return { auth, login, logout, isCalendarConnected };
}
```

- Hooks that need persistence build on `useStorage` rather than calling `localStorage` directly.
- Hooks that derive booleans from state (`isCalendarConnected`, `mobileOpen`) compute them inline rather than storing them separately.
- Side-effecting hooks (`useNotifications`) take their dependencies as parameters and manage their own `useEffect`.

## Functions & Helpers

- Plain exported functions for pure logic, grouped by domain in `src/utils/` (`helpers.js`, `aiPlan.js`).
- Prefer small, named, single-purpose functions (`getPriority`, `getJob`, `getLevelInfo`) over inlining lookups repeatedly.
- Date values are always `YYYY-MM-DD` strings (`toDateKey`/`getTodayString`) — never pass raw `Date` objects between components or into persisted state.

## React Component Conventions

- Functional components only, default export, props destructured in the signature (see `components.md`).
- Local UI state (`useState`) for transient values (open/closed, drafts, hover); persisted state goes through `useStorage` in `App.jsx` and is passed down as props.
- `useMemo` for derived values that are expensive or used by multiple children (see `App.jsx`'s `connectedAccounts`/`accountColors`/`calendarSources`).
- `useRef` for values that shouldn't trigger re-renders (e.g. `prevLevelRef` tracking the previous XP level in `App.jsx`).
- `useEffect` for side effects tied to state changes (achievement checks, level-up toasts, theme class toggling) — keep dependency arrays accurate; only suppress `exhaustive-deps` when the existing code already does so for a documented reason.

## Anti-Patterns

- Don't introduce TypeScript files (`.ts`/`.tsx`) into `src/` — this would require a build config change and isn't part of the current stack.
- Don't add path aliases — relative imports are the convention throughout.
- Don't call `localStorage` directly — use `useStorage`.
- Don't store `Date` objects, class instances, or functions in `useStorage` state (must survive `JSON.stringify`/`parse`).
