# App Building Guidelines

Guidelines for adding, modifying, and removing tabs/screens in Tempo's SPA. There is no `site-blueprint.json` and no router — `App.jsx` conditionally renders one `*Tab` component based on `activeTab` state.

## Adding a New Tab

1. **Create the feature folder and `*Tab` component**: `src/components/{feature}/{Feature}Tab.jsx` (PascalCase, see `naming.md`). Follow the composition pattern in `components.md` — receive data/callbacks as props, don't read storage directly.
2. **Add any sub-components** the tab needs into the same feature folder.
3. **Add persisted state if needed**: new `STORAGE_KEYS` entry in `helpers.js` + `useStorage(...)` in `App.jsx` (see `data.md`).
4. **Add mutation handlers** to `App.jsx` if the tab needs to create/update/delete data — follow the existing naming pattern (`addTask`, `toggleTask`, etc., see `naming.md`).
5. **Wire into `App.jsx`**:
   ```jsx
   import {Feature}Tab from './components/{feature}/{Feature}Tab';
   // ...
   {activeTab === '{tabId}' && (
     <{Feature}Tab {...props} />
   )}
   ```
6. **Add to `Sidebar.jsx`'s `NAV_ITEMS`**:
   ```js
   { id: '{tabId}', label: '{Label}', icon: SomeLucideIcon }
   ```
   Pick a `lucide-react` icon that's not already used by another nav item.
7. **Check achievements**: if the new tab introduces a new kind of user action worth gamifying, consider adding an entry to `ACHIEVEMENTS` (`src/data/achievements.js`) and its unlock condition in `useAchievements.js`.
8. **Update `.ai/context/main.md`** with the new tab's status.

## Removing a Tab

1. Remove the `{activeTab === '{tabId}' && (...)}` block from `App.jsx`.
2. Remove the entry from `Sidebar.jsx`'s `NAV_ITEMS`.
3. Delete the feature folder (`src/components/{feature}/`).
4. **Search for references** — grep for the tab id (e.g. `'calendar'`, `onGoToMeetings`) across `App.jsx` and other tabs for cross-tab navigation callbacks (e.g. `onGoToMeetings={() => setActiveTab('calendar')}`) and remove/redirect them.
5. Remove any `STORAGE_KEYS` entries and `useStorage` state that were exclusive to that tab — but check whether other tabs read the same data first (e.g. `tasks`/`jobs`/`meetings` are shared across almost every tab).
6. Remove any achievements that depended solely on the removed feature.
7. Update `.ai/context/main.md`.

## Asset Management

- Place images (logos, icons not covered by `lucide-react`) in `src/assets/` and `import` them directly:
  ```jsx
  import logoLight from '../../assets/tempo-logo-trans.png';
  ```
- Vite handles bundling/optimization automatically for imported assets — no separate asset pipeline or `ImageMetadata` type system (this is plain JS, not Astro).
- `public/` is for files that need a stable URL or shouldn't be processed (favicon, `tempo-app.ico`).

## Marketing Page (`LoginScreen`)

`LoginScreen.jsx` is the only "page" outside the authenticated app shell — shown when `auth === null` and `showSignIn === false`. It's a single long-scrolling component with its own sections (hero, feature showcase, how-it-works, pricing, CTA, footer). See `page-templates.md` for its section structure and `layout.md` for the fixed-hero/parallax pattern.

`SignInScreen.jsx` is the intermediate screen shown when the user clicks "Get started" but hasn't signed in yet (`showSignIn === true`).

## State Flow Summary

```
App.jsx
├── useStorage(...) — jobs, tasks, meetings, stats, earned, hiddenEventTitles
├── useTheme(), useAuth(), useCalendarAccounts(), useGoogleCalendar(...)
├── useAchievements(), useNotifications(meetings)
├── activeTab state → renders exactly one *Tab
└── mutation handlers (addTask, toggleTask, addJob, addMeeting, logFocusSession, ...) passed as props
```

New tabs plug into this flow as consumers of existing state/handlers, or by adding new `useStorage` state + handlers following the same pattern.

## Anti-Patterns

- Don't introduce a router (React Router, etc.) — tab switching is local state, not navigation, and there's no need for deep-linkable URLs at this stage.
- Don't add a global store (Redux/Zustand/Context) for app data — `App.jsx` + prop drilling is the established pattern and the data graph is small.
- Don't fetch or read `localStorage` inside a `*Tab` component — all data flows down from `App.jsx`.
