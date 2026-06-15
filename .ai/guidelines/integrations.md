# External Integrations

Tempo's only external integration is Google (OAuth + Calendar API). There is no CMS, no backend, no forms/email service, and no analytics — all data is local (`localStorage`, see `data.md`).

## Google OAuth (`@react-oauth/google`)

### Setup

The app is wrapped in `GoogleOAuthProvider` in `src/main.jsx`:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
```

- `VITE_GOOGLE_CLIENT_ID` is read from `.env` (Vite `VITE_*` prefix required for client-side env vars).
- Never hardcode the client ID — always read from `import.meta.env.VITE_GOOGLE_CLIENT_ID`.

### Primary Sign-In: `useAuth`

`src/hooks/useAuth.js` manages the primary signed-in user, persisted via `useStorage(STORAGE_KEYS.auth, null)`:

```js
export function useAuth() {
  const [auth, setAuth] = useStorage(STORAGE_KEYS.auth, null);

  async function login(tokenResponse) {
    const { access_token, expires_in } = tokenResponse;
    const profile = await fetchGoogleProfile(access_token);
    setAuth({
      user: { name: profile.name, email: profile.email, picture: profile.picture },
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    });
  }

  function logout() { setAuth(null); }

  const isCalendarConnected = !!auth?.accessToken && auth.expiresAt > Date.now();

  return { auth, login, logout, isCalendarConnected };
}
```

- `auth === null` → `App.jsx` renders `LoginScreen`/`SignInScreen` instead of the dashboard.
- `login` is called with the raw token response from `@react-oauth/google`'s login hook (used in `SignInScreen`).
- `expiresAt` is a millisecond timestamp; `isCalendarConnected` checks both presence and non-expiry.
- Reconnecting after expiry re-uses `login` (see `onReconnectPrimary={login}` passed to `SettingsTab`).

### Additional Calendar Accounts: `useCalendarAccounts`

`src/hooks/useCalendarAccounts.js` manages extra connected Google accounts beyond the primary sign-in (persisted under `STORAGE_KEYS.calendarAccounts`):

```js
export function useCalendarAccounts() {
  const [accounts, setAccounts] = useStorage(STORAGE_KEYS.calendarAccounts, []);

  async function addAccount(tokenResponse) {
    const { access_token, expires_in } = tokenResponse;
    const profile = await fetchGoogleProfile(access_token);
    const account = { email: profile.email, name: profile.name, picture: profile.picture, accessToken: access_token, expiresAt: Date.now() + expires_in * 1000 };
    setAccounts((prev) => [...prev.filter((a) => a.email !== account.email), account]);
  }

  function removeAccount(email) { setAccounts((prev) => prev.filter((a) => a.email !== email)); }

  return { accounts, addAccount, removeAccount };
}
```

- Adding an account with an email that's already connected replaces the existing entry (refreshes its token).
- Both `useAuth` and `useCalendarAccounts` call the shared `fetchGoogleProfile(accessToken)` helper from `helpers.js`.

### Account → Source Pipeline (`App.jsx`)

`App.jsx` merges the primary account and any extra accounts into a unified list of calendar "sources", assigns each a color, and feeds them to `useGoogleCalendar`:

```js
const connectedAccounts = useMemo(() => {
  const list = [];
  if (isCalendarConnected) list.push({ email: auth.user.email, name: auth.user.name, accessToken: auth.accessToken, expiresAt: auth.expiresAt });
  for (const acc of calendarAccounts) list.push({ email: acc.email, name: acc.name, accessToken: acc.accessToken, expiresAt: acc.expiresAt });
  return list;
}, [auth, isCalendarConnected, calendarAccounts]);

const accountColors = useMemo(() => {
  const map = {};
  let paletteIndex = 0;
  for (const acc of connectedAccounts) {
    const linkedJob = jobs.find((j) => j.googleAccountEmail === acc.email);
    map[acc.email] = linkedJob ? linkedJob.color : CALENDAR_ACCOUNT_COLORS[paletteIndex++ % CALENDAR_ACCOUNT_COLORS.length];
  }
  return map;
}, [connectedAccounts, jobs]);

const calendarSources = useMemo(
  () => connectedAccounts.map((acc) => ({ id: acc.email, accessToken: acc.accessToken, expiresAt: acc.expiresAt, label: acc.name, email: acc.email, color: accountColors[acc.email] })),
  [connectedAccounts, accountColors]
);
```

- If a job has `googleAccountEmail` set, that account's events take the job's color; otherwise events get the next color from `CALENDAR_ACCOUNT_COLORS`.

## Google Calendar API v3: `useGoogleCalendar`

`src/hooks/useGoogleCalendar.js` fetches events for each source from `GET https://www.googleapis.com/calendar/v3/calendars/primary/events`:

- Filters sources to those with a non-expired `accessToken` (`expiresAt > Date.now()`); expired sources are reported via `sourceErrors` (`{ email, reason: 'expired' }`) instead of being silently dropped.
- Fetches a 14-day window (`timeMin` = today at midnight, `timeMax` = +14 days), `singleEvents: 'true'`, `orderBy: 'startTime'`, `maxResults: '50'`.
- Per-source fetch failures (HTTP error or network error) are caught individually and added to `sourceErrors` (`reason: 'http_xxx'` or `'network'`) without failing the whole refresh — one broken account shouldn't break the others.
- `mapEvent()` normalizes each Google event into Tempo's event shape: `{ id: 'g-{sourceId}-{eventId}', title, link, source: 'google', account, accountEmail, accountColor, date, time, duration, allDay }`. Declined events (`responseStatus === 'declined'` for the self attendee) are filtered out.
- Returns `{ events, loading, error, sourceErrors, refresh }`.

`App.jsx` filters `events` against `hiddenEventTitles` (persisted via `STORAGE_KEYS.hiddenEvents`) to produce `visibleGoogleEvents`, and surfaces `sourceErrors`/`googleEventErrors` in `SettingsTab` so the user can see and reconnect broken accounts.

### Adding a New Google API Integration

1. Add the fetch logic to a new or existing hook in `src/hooks/`.
2. Reuse `connectedAccounts`/`calendarSources` from `App.jsx` if the data is per-account; pass the access token via `Authorization: Bearer {accessToken}`.
3. Handle per-account errors individually (don't let one account's failure break others) and surface them via a `*Errors` array, following the `sourceErrors` pattern.
4. Check `expiresAt > Date.now()` before using a token; surface expired accounts so the user can reconnect via `SettingsTab`.

## AI Day Planner (`src/utils/aiPlan.js`)

Not a live API integration — `buildPromptTemplate()` generates a text prompt (including the user's jobs, existing tasks, meetings, and calendar events for a target date) that the user copies and pastes into an external AI assistant (e.g. Claude). The AI's JSON response is then imported back into Tempo via `AIPlanImport` (`src/components/today/AIPlanImport.jsx`). There is no API key or network call on Tempo's side for this feature.

## Anti-Patterns

- Never hardcode `VITE_GOOGLE_CLIENT_ID` or any token — read from env vars / `useStorage`.
- Never assume a connected account's token is valid — always check `expiresAt > Date.now()` before using it.
- Don't let one calendar account's fetch failure block events from other accounts — follow the `sourceErrors` per-source error pattern.
- Don't add a CMS, forms service, or analytics integration without discussing with the user first — none currently exist and the app's value proposition is local-first/privacy-friendly.
