# Tempo

Tempo is a gamified daily planner that brings your tasks, meetings, and Google
Calendar into one place, with AI-assisted planning built in.

## Features

- **Today** — daily overview with your plan, upcoming events, and quick-add
  for new tasks.
- **Tasks** — unified task management across jobs/projects, with priorities
  and due dates.
- **Schedule** — calendar view (day/month) that merges your tasks, meetings,
  and synced Google Calendar events.
- **Focus** — Pomodoro-style focus timer with session logging.
- **Progress** — stats dashboard tracking XP, streaks, and activity history.
- **Achievements** — unlockable badges and bonus XP for hitting milestones
  (streaks, early starts, task counts, etc.).
- **Settings** — manage your account, connected Google Calendar accounts,
  jobs/projects, meetings, and appearance (light/dark theme).

Signing in with Google connects your calendar so events show up alongside
your tasks, and lets you add additional calendar accounts per job/project.

## Landing page

The signed-out experience is a marketing landing page with a resizable
navbar, animated hero, a horizontal-scrolling feature showcase, a "how it
works" section, and a final call-to-action.

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [motion](https://motion.dev/) for animations
- [lucide-react](https://lucide.dev/) for icons
- [@react-oauth/google](https://github.com/MomenSherif/react-oauth) for
  Google sign-in and Calendar access

## Development

```sh
npm install
npm run dev
```

Other scripts:

```sh
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # run ESLint
```
