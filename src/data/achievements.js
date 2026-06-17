// One-time achievements — earned once, forever
export const ACHIEVEMENTS = [
  { id: 'first_task',     icon: 'Star',          title: 'First Step',      description: 'Complete your very first task',                 xp: 50   },
  { id: 'early_bird',    icon: 'Sunrise',        title: 'Early Bird',      description: 'Complete a task before 9 AM',                   xp: 150  },
  { id: 'night_owl',     icon: 'Moon',           title: 'Night Owl',       description: 'Complete a task after 9 PM',                    xp: 100  },
  { id: 'planner',       icon: 'CalendarCheck',  title: 'Planner',         description: 'Add 5 tasks to future dates',                   xp: 200  },
  { id: 'visionary',     icon: 'CalendarCheck',  title: 'Visionary',       description: 'Add 20 tasks to future dates',                  xp: 400  },
  { id: 'first_job',     icon: 'Briefcase',      title: 'Open for Business', description: 'Add your first job',                          xp: 75   },
  { id: 'first_meeting', icon: 'Calendar',       title: "Let's Talk",      description: 'Schedule your first meeting',                   xp: 50   },
  { id: 'focus_first',   icon: 'Timer',          title: 'In the Zone',     description: 'Complete your first focus session',             xp: 75   },
  { id: 'ai_first',      icon: 'Sparkles',       title: 'AI-Powered',      description: 'Import your first AI-generated plan',           xp: 150  },
  { id: 'big_day',       icon: 'Zap',            title: 'Big Day',         description: 'Complete 10 tasks in a single day',             xp: 300  },
  { id: 'deep_work',     icon: 'Brain',          title: 'Deep Worker',     description: 'Accumulate 3 hours of focus in a single day',   xp: 400  },
  { id: 'dedicated',     icon: 'Hourglass',      title: 'Dedicated',       description: 'Use Tempo on 7 different days',                 xp: 250  },
  { id: 'level_10',      icon: 'Crown',          title: 'Legendary',       description: 'Reach Level 10',                                xp: 1000 },
];

// Tiered achievements — level up over time
// Earned IDs are stored as `${id}_t${level}` in the earned array
export const TIERED_ACHIEVEMENTS = [
  {
    id: 'tasks',
    icon: 'Target',
    title: 'Task Crusher',
    getValue: (ctx) => ctx.stats.tasksCompleted,
    tiers: [
      { level: 1, threshold: 5,   xp: 100,  description: 'Complete 5 tasks'   },
      { level: 2, threshold: 25,  xp: 300,  description: 'Complete 25 tasks'  },
      { level: 3, threshold: 100, xp: 750,  description: 'Complete 100 tasks' },
      { level: 4, threshold: 250, xp: 1500, description: 'Complete 250 tasks' },
      { level: 5, threshold: 500, xp: 3000, description: 'Complete 500 tasks' },
    ],
  },
  {
    id: 'streak',
    icon: 'Flame',
    title: 'Streak Master',
    getValue: (ctx) => ctx.stats.longestStreak,
    tiers: [
      { level: 1, threshold: 3,  xp: 200,  description: '3-day streak'  },
      { level: 2, threshold: 7,  xp: 500,  description: '7-day streak'  },
      { level: 3, threshold: 14, xp: 1000, description: '14-day streak' },
      { level: 4, threshold: 30, xp: 2000, description: '30-day streak' },
      { level: 5, threshold: 60, xp: 4000, description: '60-day streak' },
    ],
  },
  {
    id: 'focus',
    icon: 'Brain',
    title: 'Deep Focus',
    getValue: (ctx) => Object.values(ctx.stats.history || {}).reduce((s, d) => s + (d.focusMinutes || 0), 0),
    tiers: [
      { level: 1, threshold: 60,   xp: 200,  description: '1 hour of focus time'   },
      { level: 2, threshold: 300,  xp: 500,  description: '5 hours of focus time'  },
      { level: 3, threshold: 1000, xp: 1500, description: '~17 hours of focus time'},
      { level: 4, threshold: 3000, xp: 3000, description: '50 hours of focus time' },
      { level: 5, threshold: 6000, xp: 6000, description: '100 hours of focus time'},
    ],
  },
  {
    id: 'meetings',
    icon: 'Users',
    title: 'Meeting Room',
    getValue: (ctx) => ctx.meetings.length,
    tiers: [
      { level: 1, threshold: 5,   xp: 100, description: 'Schedule 5 meetings'   },
      { level: 2, threshold: 15,  xp: 250, description: 'Schedule 15 meetings'  },
      { level: 3, threshold: 30,  xp: 500, description: 'Schedule 30 meetings'  },
      { level: 4, threshold: 75,  xp: 1000, description: 'Schedule 75 meetings' },
      { level: 5, threshold: 150, xp: 2000, description: 'Schedule 150 meetings'},
    ],
  },
  {
    id: 'attendance',
    icon: 'CalendarCheck',
    title: 'Show Up',
    getValue: (ctx) => {
      const appAttended = (ctx.meetings || []).filter(m => m.attended).length;
      const gcalAttended = Object.values(ctx.gcalAttended || {}).filter(v => v.attended).length;
      return appAttended + gcalAttended;
    },
    tiers: [
      { level: 1, threshold: 5,   xp: 150,  description: 'Attend 5 meetings'   },
      { level: 2, threshold: 20,  xp: 400,  description: 'Attend 20 meetings'  },
      { level: 3, threshold: 50,  xp: 1000, description: 'Attend 50 meetings'  },
      { level: 4, threshold: 100, xp: 2000, description: 'Attend 100 meetings' },
      { level: 5, threshold: 250, xp: 5000, description: 'Attend 250 meetings' },
    ],
  },
  {
    id: 'jobs',
    icon: 'Layers',
    title: 'Portfolio Builder',
    getValue: (ctx) => ctx.jobs.length,
    tiers: [
      { level: 1, threshold: 1,  xp: 75,  description: 'Track 1 job'   },
      { level: 2, threshold: 3,  xp: 200, description: 'Track 3 jobs'  },
      { level: 3, threshold: 5,  xp: 400, description: 'Track 5 jobs'  },
      { level: 4, threshold: 10, xp: 800, description: 'Track 10 jobs' },
      { level: 5, threshold: 20, xp: 1500, description: 'Track 20 jobs'},
    ],
  },
  {
    id: 'ai',
    icon: 'Bot',
    title: 'AI Devotee',
    getValue: (ctx) => ctx.stats.aiPlanImports || 0,
    tiers: [
      { level: 1, threshold: 1,  xp: 150,  description: 'Import 1 AI plan'   },
      { level: 2, threshold: 5,  xp: 400,  description: 'Import 5 AI plans'  },
      { level: 3, threshold: 20, xp: 1000, description: 'Import 20 AI plans' },
      { level: 4, threshold: 50, xp: 2000, description: 'Import 50 AI plans' },
      { level: 5, threshold: 100,xp: 4000, description: 'Import 100 AI plans'},
    ],
  },
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
