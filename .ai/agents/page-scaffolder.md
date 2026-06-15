# Agent: page-scaffolder

## Role

Scaffold new tabs/screens in Tempo's SPA — create the feature folder, `*Tab.jsx` component, sub-components, persisted state, and wiring into `App.jsx`/`Sidebar.jsx`. There are no routes, layouts, or content collections in tempo-app — "pages" are tabs rendered conditionally by `App.jsx` based on `activeTab`.

## Model

sonnet (default) — fast, good at following templates

## Before Starting

Read these files in order:
1. `.ai/guidelines/app.md` — "Adding a New Tab" workflow (the primary reference for this agent)
2. `.ai/guidelines/page-templates.md` — Tab Template structure
3. `.ai/guidelines/components.md` — component composition, prop conventions
4. `.ai/guidelines/data.md` — `useStorage`, `STORAGE_KEYS`, persisted data shapes
5. `.ai/guidelines/naming.md` — file/component naming conventions
6. `.ai/context/main.md` — current tab status tracker

## Workflow

### New Tab

Follow `app.md`'s "Adding a New Tab" steps exactly:

1. Ask the user (if not already specified): tab name/id, purpose, what data it needs (existing `tasks`/`jobs`/`meetings`/`stats`, or new persisted state).
2. Create `src/components/{feature}/{Feature}Tab.jsx` using the Tab Template from `page-templates.md`:
   ```jsx
   export default function {Feature}Tab({ /* data + callbacks from App.jsx */ }) {
     return (
       <div className="p-4 sm:p-6 md:p-8 max-w-{n}xl mx-auto">
         <header className="mb-6">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Title}</h1>
         </header>
         <div className="space-y-4">
           {/* content */}
         </div>
       </div>
     );
   }
   ```
3. Create any sub-components (row/card components) in the same feature folder.
4. If new persisted state is needed: add a `STORAGE_KEYS` entry in `helpers.js`, then `useStorage(...)` + any mutation handlers in `App.jsx` (see `data.md`).
5. Wire into `App.jsx`'s `activeTab` switch:
   ```jsx
   import {Feature}Tab from './components/{feature}/{Feature}Tab';
   // ...
   {activeTab === '{tabId}' && <{Feature}Tab {...props} />}
   ```
6. Add to `Sidebar.jsx`'s `NAV_ITEMS` with a `lucide-react` icon not already in use.
7. Consider whether the new tab introduces an action worth gamifying — if so, flag for `content-writer`/achievement logic, don't add it inline unless asked.
8. Update `.ai/context/main.md`'s tab status table.

### Removing a Tab

Follow `app.md`'s "Removing a Tab" steps — remove from `App.jsx`'s switch and `Sidebar.jsx`'s `NAV_ITEMS`, delete the feature folder, grep for cross-tab navigation callbacks (e.g. `onGoToMeetings={() => setActiveTab('calendar')}`), remove exclusive `STORAGE_KEYS`/state (checking for shared usage first), and update `.ai/context/main.md`.

## Conventions

- No router — tab switching is `activeTab` local state in `App.jsx`. Don't introduce React Router or URL-based navigation.
- All data flows down from `App.jsx` via props — never read `localStorage` or call hooks directly inside a `*Tab` component.
- Match existing tab structure: `p-4 sm:p-6 md:p-8 max-w-*xl mx-auto` wrapper, card-based content (`rounded-xl`/`rounded-2xl`, `border border-gray-200 dark:border-gray-800`, `bg-white dark:bg-gray-900`).
- Every new tab needs dark mode parity from the start.
- Empty states should render something useful, not a blank area.

## Output Checklist

- [ ] `*Tab.jsx` follows the Tab Template (`page-templates.md`)
- [ ] New persisted state uses `STORAGE_KEYS` + `useStorage` (no direct `localStorage`)
- [ ] Wired into `App.jsx`'s `activeTab` switch
- [ ] Added to `Sidebar.jsx`'s `NAV_ITEMS` with a unique icon
- [ ] Dark mode variants present throughout
- [ ] `.ai/context/main.md` updated with the new tab's status
- [ ] No router, global store, or direct storage access introduced
