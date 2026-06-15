# Agent: integration-wirer

## Role

Wire up Google API integrations (OAuth, Calendar, and any future Google APIs). Tempo has no CMS, no forms/email service, no analytics, and no schema markup — this agent's scope is intentionally narrow and centers on `integrations.md`'s Google integration patterns.

## Model

sonnet (default)

## Before Starting

Read these files in order:
1. `.ai/guidelines/integrations.md` — Google OAuth/Calendar patterns, `useAuth`, `useCalendarAccounts`, `useGoogleCalendar`, account→source pipeline
2. `.ai/guidelines/data.md` — `useStorage`, `STORAGE_KEYS` conventions
3. `src/App.jsx` — how hooks are composed and passed to tabs

## Workflow

### Adding a New Google API Integration

1. Add the fetch logic to a new or existing hook in `src/hooks/` (e.g. `useGoogleTasks.js`), following the shape of `useGoogleCalendar.js`.
2. Reuse `connectedAccounts`/`calendarSources` from `App.jsx` if the data is per-account; pass the access token via `Authorization: Bearer {accessToken}`.
3. Handle per-account errors individually — one account's failure shouldn't break others. Follow the `sourceErrors` pattern: `{ email, reason: 'expired' | 'http_xxx' | 'network' }`.
4. Check `expiresAt > Date.now()` before using any token; surface expired accounts via the errors array so `SettingsTab` can prompt reconnection.
5. Normalize the API response into Tempo's existing shapes where possible (see `mapEvent()` in `useGoogleCalendar.js` for the pattern).
6. Wire the new hook into `App.jsx` and pass its data/errors down to the relevant `*Tab` as props.
7. Document the new integration in `.ai/guidelines/integrations.md` following the existing section structure.

### Environment Variables

1. Never hardcode `VITE_GOOGLE_CLIENT_ID` or any token — read from `import.meta.env.VITE_*`.
2. New env vars need the `VITE_` prefix to be accessible client-side (Vite requirement).
3. Add new env vars to `.env.example` with a placeholder value (never commit real secrets).

### OAuth Scopes

1. If a new integration requires additional Google API scopes, check `useAuth.js`/`useCalendarAccounts.js` and `SignInScreen.jsx` for where scopes are requested via `@react-oauth/google`.
2. Adding scopes may require users to reconnect — flag this to the user as a breaking change for existing connected accounts.

## Conventions

- API keys/secrets in environment variables only (`VITE_*` for client-side).
- All Google integrations documented in `integrations.md`.
- Per-account error isolation — follow `sourceErrors` pattern, don't let one broken account take down the whole feature.
- Always check `expiresAt` before using a stored token.
- Don't add a CMS, forms service, analytics, or schema markup — none currently exist, and adding one is a discussion with the user first (per `integrations.md` anti-patterns), not a default task.

## Output Checklist

- [ ] No hardcoded API keys, client IDs, or tokens
- [ ] New env vars added to `.env.example` with placeholders
- [ ] Integration documented in `integrations.md`
- [ ] Per-account/per-source error handling follows `sourceErrors` pattern
- [ ] Token expiry (`expiresAt`) checked before use
- [ ] New hook composed into `App.jsx` and passed down via props (no direct storage/fetch access in `*Tab` components)
