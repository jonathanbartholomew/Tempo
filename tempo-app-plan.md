# Tempo — App Specification
**For use with Claude Code in VS Code**
**Stack: React + Vite + Tailwind CSS + Local Storage**

---

## Project Overview

A personal productivity web app that lives in the browser. Bookmark it and open it every morning. Tracks jobs, daily tasks, meetings, schedules, and rewards progress with an achievement and XP system. Built for someone managing multiple jobs and clients simultaneously.

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Storage:** localStorage (browser-based, no backend needed)
- **Notifications:** Web Notifications API (browser pop-ups)
- **SMS (optional phase 2):** Twilio API — add later once the core app is working
- **Icons:** Lucide React
- **No database. No login. No backend. Runs 100% in the browser.**

---

## File Structure

```
anchor/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Toast.jsx
│   │   ├── today/
│   │   │   ├── TodayTab.jsx
│   │   │   ├── TaskRow.jsx
│   │   │   └── QuickAdd.jsx
│   │   ├── schedule/
│   │   │   ├── ScheduleTab.jsx
│   │   │   └── TimeGrid.jsx
│   │   ├── jobs/
│   │   │   ├── JobsTab.jsx
│   │   │   └── JobCard.jsx
│   │   ├── meetings/
│   │   │   ├── MeetingsTab.jsx
│   │   │   └── MeetingCard.jsx
│   │   └── achievements/
│   │       ├── AchievementsTab.jsx
│   │       └── AchievementBadge.jsx
│   ├── hooks/
│   │   ├── useStorage.js
│   │   ├── useAchievements.js
│   │   └── useNotifications.js
│   ├── data/
│   │   └── achievements.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Data Models

All data stored in localStorage as JSON.

### Job
```json
{
  "id": "uid",
  "name": "Daedabyte Web Solutions",
  "type": "Freelance",
  "color": "#2563eb",
  "createdAt": "2026-06-14"
}
```
Job types: `Full-time`, `Freelance`, `RFP`, `Personal`, `Side Project`

---

### Task
```json
{
  "id": "uid",
  "title": "Submit Gilberts RFP questions",
  "jobId": "job-uid or null",
  "date": "2026-06-15",
  "priority": "high",
  "done": false,
  "doneAt": null,
  "reminder": false,
  "reminderTime": null,
  "tags": ["rfp", "urgent"]
}
```
Priority levels: `low`, `normal`, `high`, `urgent`

---

### Meeting
```json
{
  "id": "uid",
  "title": "Call with Brady Fisher - Gilberts RFP",
  "jobId": "job-uid or null",
  "date": "2026-06-15",
  "time": "10:00",
  "duration": 30,
  "notes": "",
  "reminder": true,
  "reminderMins": 15
}
```

---

### Stats (single object in localStorage)
```json
{
  "totalXp": 0,
  "tasksCompleted": 0,
  "streak": 0,
  "lastActiveDate": "",
  "earlyBirdEarned": false,
  "rfpCompleted": false,
  "longestStreak": 0
}
```

---

### Earned Achievements
```json
["first_task", "streak_3", "first_job"]
```
Array of achievement IDs stored in localStorage.

---

## Tabs / Pages

The app has 5 tabs in the top navigation bar.

---

### Tab 1: Today

**Purpose:** The main daily view. First thing you see when you open the app.

**Layout:**
- Header shows today's date (e.g. "Monday, June 15") and a greeting
- Daily progress bar: X of Y tasks done today
- XP bar and current streak shown in header area
- Quick-add task input at the top (type and press Enter)
  - Dropdown to assign a job
  - Dropdown to set priority
- Today's meetings listed in chronological order (with time)
- Task list split into two sections:
  - Pending tasks (unchecked)
  - Completed tasks (greyed out, checkmark shown, collapsible)
- Each task row shows:
  - Checkbox (click to complete — triggers XP gain and toast notification)
  - Task title
  - Job badge (color-coded pill)
  - Priority badge (color-coded: low=gray, normal=blue, high=orange, urgent=red)
  - Delete button (trash icon)
- Floating "Add Meeting" button or inline button below meetings section

**Behavior:**
- Completing a task gives +10 XP and shows a toast: "+10 XP — Task complete!"
- Completing a task before 9:00 AM unlocks the Early Bird achievement
- Tasks containing the word "rfp" (case-insensitive) trigger RFP-related achievement tracking
- Streak updates when a task is completed on a new day
- Daily progress bar fills as tasks are completed (green gradient)

---

### Tab 2: Schedule

**Purpose:** Hourly planner for a selected day.

**Layout:**
- Date picker at top right to select any day (defaults to today)
- Time grid from 6:00 AM to 10:00 PM in 30-minute slots
- Current hour is highlighted if viewing today
- Meetings appear as colored blocks at their time slot
- Tasks for the selected day appear in a list below the time grid
- "+ Add" button opens a form to add either a meeting or a task to that day

**Meeting blocks on the grid:**
- Color is based on the assigned job's color
- Shows meeting title and duration
- Click to see notes or delete

**Behavior:**
- When adding a meeting from this tab, it auto-assigns to the selected date
- Supports adding tasks to future dates (for planning ahead)

---

### Tab 3: Jobs

**Purpose:** Track all active jobs and their associated tasks.

**Layout:**
- "Add Job" button at top
- One card per job showing:
  - Colored left border (job's assigned color)
  - Job name and type badge
  - Stats: total tasks, completed tasks, pending tasks
  - Mini progress bar (tasks completed vs total)
  - Remove button (with confirmation — warns that tasks stay but lose job association)
- Job color picker: 8 preset colors to choose from
- Job type selector dropdown

**Add Job form:**
- Job name (text input)
- Job type (dropdown)
- Color picker (8 colored circles, click to select)

**Behavior:**
- Adding a job updates job count in stats and checks for job-related achievements
- Deleting a job does NOT delete tasks — tasks just lose their job association

---

### Tab 4: Meetings

**Purpose:** Full view of all upcoming and past meetings.

**Layout:**
- Two sections: Upcoming and Past
- Each meeting card shows:
  - Date and time
  - Title
  - Job badge
  - Duration
  - Reminder status
  - Notes (collapsed by default, expandable)
  - Delete button
- "Add Meeting" button at top

**Add Meeting form fields:**
- Title
- Date (date picker)
- Time (time picker)
- Duration in minutes (15, 30, 45, 60, 90, 120)
- Assign to job (dropdown)
- Reminder toggle (on/off)
- Reminder lead time (5, 10, 15, 30, 60 minutes before)
- Notes (textarea)

**Behavior:**
- When a meeting reminder is due, a browser notification fires
- App polls every 30 seconds to check for upcoming reminders
- On first reminder set, app requests browser notification permission
- Past meetings are auto-sorted to the "Past" section after the meeting time passes

---

### Tab 5: Achievements

**Purpose:** Gamification and self-gratification system. XP, levels, and badges.

**Layout:**
- Top section: Level card
  - Current level (Level 1, Level 2, etc.)
  - Total XP earned
  - XP progress bar to next level
  - XP needed to next level
  - Stats grid: Tasks Done, Day Streak, Longest Streak, Jobs Tracked
- Achievement grid below (2-3 columns, responsive)
  - Each badge shows: icon, title, description, XP reward
  - Unlocked badges are full color and bright
  - Locked badges are greyed out with a lock icon
  - Earned badges show "Earned" label

---

## Achievement List

| ID | Icon | Title | Description | XP |
|---|---|---|---|---|
| first_task | star | First Step | Complete your first task | 50 |
| task_5 | flame | On Fire | Complete 5 tasks | 100 |
| task_20 | rocket | Task Machine | Complete 20 tasks | 300 |
| task_50 | diamond | Unstoppable | Complete 50 tasks | 750 |
| task_100 | crown | Legend | Complete 100 tasks | 2000 |
| first_job | briefcase | Open for Business | Add your first job | 75 |
| job_3 | layers | Juggling Act | Track 3 jobs at once | 200 |
| job_5 | trophy | Portfolio Builder | Track 5 jobs | 400 |
| first_meeting | calendar | Let's Talk | Schedule a meeting | 50 |
| meet_10 | users | Meeting Pro | Schedule 10 meetings | 200 |
| streak_3 | award | Three-peat | 3-day completion streak | 200 |
| streak_7 | zap | Week Warrior | 7-day streak | 500 |
| streak_30 | crown | Habit Master | 30-day streak | 2000 |
| early_bird | sunrise | Early Bird | Complete a task before 9 AM | 150 |
| rfp_complete | clipboard | RFP Fighter | Complete an RFP-tagged task | 400 |
| night_owl | moon | Night Owl | Complete a task after 9 PM | 100 |
| planner | calendar-check | Planner | Add 5 tasks to future dates | 200 |

---

## XP and Level System

| Level | XP Required |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 1,000 |
| 6 | 2,000 |
| 7 | 3,500 |
| 8 | 5,500 |
| 9 | 8,000 |
| 10 | 12,000 |

XP is earned by:
- Completing a task: +10 XP
- Unlocking an achievement: +achievement XP bonus
- Completing a high priority task: +15 XP
- Completing an urgent task: +25 XP

Level up triggers a toast notification: "Level up! You're now Level X"

---

## Notifications

### Browser Notifications
- Request permission on first reminder creation
- Fire when a meeting reminder time is reached
- App polls every 30 seconds while open
- Notification shows: meeting title, time, "Starting in X minutes"

### In-App Toast Notifications
- Task completed: "+10 XP — Task complete!"
- Achievement unlocked: "Achievement unlocked: [icon] [title] (+X XP)"
- Level up: "Level up! You are now Level X"
- Toasts appear top-right, auto-dismiss after 3 seconds
- Stack if multiple fire at once

### SMS (Phase 2 — Twilio)
Add this after the core app is working. Requires:
- Twilio account (free trial available at twilio.com)
- A settings page where user enters: their phone number, wife's phone number, Twilio account SID, auth token, Twilio phone number
- A small Node/Express server (or Twilio functions) to send the SMS
- Trigger: same as browser notification — fires when meeting reminder time is reached
- Message format: "Reminder: [meeting title] starts in [X] minutes"

---

## Streak System

- Streak increments when a task is completed on a new calendar day
- If a day is skipped (no task completed), streak resets to 0
- Longest streak is tracked separately and never resets
- Streak shown in the navbar as a flame icon: 🔥 5d

---

## Design Guidelines

**This app is for someone with ADHD. Design accordingly:**

- Keep the today view uncluttered — the most important thing (today's tasks) should be immediately visible
- Use color consistently: each job has a color and it appears everywhere that job is referenced
- Priority levels should be immediately visually obvious (color-coded badges)
- Completed tasks should feel satisfying — use a checkmark animation, strikethrough text, and a toast
- No walls of text anywhere in the UI
- Large click targets on checkboxes and buttons
- The achievement tab should feel rewarding to look at — bright icons, clear progress

**Color palette for jobs (8 options):**
- Blue: #2563eb
- Purple: #8b5cf6
- Pink: #ec4899
- Green: #10b981
- Orange: #f59e0b
- Teal: #06b6d4
- Red: #ef4444
- Indigo: #6366f1

**Priority badge colors:**
- Low: gray
- Normal: blue
- High: orange
- Urgent: red

---

## localStorage Keys

| Key | Contents |
|---|---|
| `dp_jobs` | Array of job objects |
| `dp_tasks` | Array of task objects |
| `dp_meetings` | Array of meeting objects |
| `dp_stats` | Stats object |
| `dp_earned` | Array of earned achievement IDs |

---

## Phase 2 Features (build later)

- **Twilio SMS reminders** — texts to multiple phone numbers
- **Weekly review screen** — summary of the week, tasks done, XP earned
- **Time logging** — manually log hours worked per job
- **Export to CSV** — download task/meeting history
- **Repeating meetings** — daily standup, weekly calls, etc.
- **Dark/light mode toggle**
- **Custom achievement creation** — user-defined goals

---

## Setup Instructions for Claude Code

When feeding this to Claude Code, ask it to:

1. Scaffold the project with `npm create vite@latest anchor -- --template react`
2. Install dependencies: `npm install tailwindcss lucide-react`
3. Set up Tailwind with `npx tailwindcss init -p`
4. Build components in the order listed in the file structure
5. Start with `useStorage.js` hook first — everything else depends on it
6. Build the Today tab first and get it working before moving to other tabs
7. Add achievements last — they depend on all other features being in place

---

*Tempo — Built for Daedabyte Web Solutions | June 2026*
