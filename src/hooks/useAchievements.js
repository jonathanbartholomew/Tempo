import { ACHIEVEMENTS } from '../data/achievements';

const getTotalFocusMinutes = (stats) =>
  Object.values(stats.history || {}).reduce((sum, d) => sum + (d.focusMinutes || 0), 0);

const CONDITIONS = {
  first_task: (ctx) => ctx.stats.tasksCompleted >= 1,
  task_5: (ctx) => ctx.stats.tasksCompleted >= 5,
  task_20: (ctx) => ctx.stats.tasksCompleted >= 20,
  task_50: (ctx) => ctx.stats.tasksCompleted >= 50,
  task_100: (ctx) => ctx.stats.tasksCompleted >= 100,
  task_200: (ctx) => ctx.stats.tasksCompleted >= 200,
  first_job: (ctx) => ctx.jobs.length >= 1,
  job_3: (ctx) => ctx.jobs.length >= 3,
  job_5: (ctx) => ctx.jobs.length >= 5,
  first_meeting: (ctx) => ctx.meetings.length >= 1,
  meet_5: (ctx) => ctx.meetings.length >= 5,
  meet_10: (ctx) => ctx.meetings.length >= 10,
  meet_25: (ctx) => ctx.meetings.length >= 25,
  streak_3: (ctx) => ctx.stats.streak >= 3,
  streak_7: (ctx) => ctx.stats.streak >= 7,
  streak_14: (ctx) => ctx.stats.streak >= 14,
  streak_30: (ctx) => ctx.stats.streak >= 30,
  early_bird: (ctx) => ctx.stats.earlyBirdEarned,
  rfp_complete: (ctx) => ctx.stats.rfpCompleted,
  night_owl: (ctx) => ctx.stats.nightOwlEarned,
  planner: (ctx) => ctx.stats.futureTasksAdded >= 5,
  focus_first: (ctx) => (ctx.stats.focusSessions || 0) >= 1,
  focus_60: (ctx) => getTotalFocusMinutes(ctx.stats) >= 60,
  focus_300: (ctx) => getTotalFocusMinutes(ctx.stats) >= 300,
  focus_1000: (ctx) => getTotalFocusMinutes(ctx.stats) >= 1000,
  ai_first_import: (ctx) => (ctx.stats.aiPlanImports || 0) >= 1,
  ai_plan_5: (ctx) => (ctx.stats.aiPlanImports || 0) >= 5,
  ai_plan_20: (ctx) => (ctx.stats.aiPlanImports || 0) >= 20,
};

export function useAchievements() {
  function getNewlyUnlocked(earned, context) {
    return ACHIEVEMENTS.filter((a) => !earned.includes(a.id) && CONDITIONS[a.id]?.(context));
  }

  return { getNewlyUnlocked };
}
