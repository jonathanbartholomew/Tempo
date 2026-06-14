import { ACHIEVEMENTS } from '../data/achievements';

const CONDITIONS = {
  first_task: (ctx) => ctx.stats.tasksCompleted >= 1,
  task_5: (ctx) => ctx.stats.tasksCompleted >= 5,
  task_20: (ctx) => ctx.stats.tasksCompleted >= 20,
  task_50: (ctx) => ctx.stats.tasksCompleted >= 50,
  task_100: (ctx) => ctx.stats.tasksCompleted >= 100,
  first_job: (ctx) => ctx.jobs.length >= 1,
  job_3: (ctx) => ctx.jobs.length >= 3,
  job_5: (ctx) => ctx.jobs.length >= 5,
  first_meeting: (ctx) => ctx.meetings.length >= 1,
  meet_10: (ctx) => ctx.meetings.length >= 10,
  streak_3: (ctx) => ctx.stats.streak >= 3,
  streak_7: (ctx) => ctx.stats.streak >= 7,
  streak_30: (ctx) => ctx.stats.streak >= 30,
  early_bird: (ctx) => ctx.stats.earlyBirdEarned,
  rfp_complete: (ctx) => ctx.stats.rfpCompleted,
  night_owl: (ctx) => ctx.stats.nightOwlEarned,
  planner: (ctx) => ctx.stats.futureTasksAdded >= 5,
};

export function useAchievements() {
  function getNewlyUnlocked(earned, context) {
    return ACHIEVEMENTS.filter((a) => !earned.includes(a.id) && CONDITIONS[a.id]?.(context));
  }

  return { getNewlyUnlocked };
}
