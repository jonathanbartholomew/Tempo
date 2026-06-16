import { ACHIEVEMENTS, TIERED_ACHIEVEMENTS } from '../data/achievements';

export function useAchievements() {
  function getNewlyUnlocked(earned, context) {
    const newlyEarned = [];

    // One-time achievements
    const CONDITIONS = {
      first_task:     (ctx) => ctx.stats.tasksCompleted >= 1,
      early_bird:     (ctx) => ctx.stats.earlyBirdEarned,
      night_owl:      (ctx) => ctx.stats.nightOwlEarned,
      planner:        (ctx) => ctx.stats.futureTasksAdded >= 5,
      visionary:      (ctx) => (ctx.stats.futureTasksAdded || 0) >= 20,
      first_job:      (ctx) => ctx.jobs.length >= 1,
      first_meeting:  (ctx) => ctx.meetings.length >= 1,
      focus_first:    (ctx) => (ctx.stats.focusSessions || 0) >= 1,
      ai_first:       (ctx) => (ctx.stats.aiPlanImports || 0) >= 1,
      big_day:        (ctx) => Object.values(ctx.stats.history || {}).some((d) => (d.completed || 0) >= 10),
      deep_work:      (ctx) => Object.values(ctx.stats.history || {}).some((d) => (d.focusMinutes || 0) >= 180),
      dedicated:      (ctx) => Object.keys(ctx.stats.history || {}).length >= 7,
      level_10:       (ctx) => ctx.stats.totalXp >= 12000,
    };

    for (const a of ACHIEVEMENTS) {
      if (!earned.includes(a.id) && CONDITIONS[a.id]?.(context)) {
        newlyEarned.push({ ...a, tiered: false });
      }
    }

    // Tiered achievements
    for (const ta of TIERED_ACHIEVEMENTS) {
      const value = ta.getValue(context);
      for (const tier of ta.tiers) {
        const tierId = `${ta.id}_t${tier.level}`;
        if (!earned.includes(tierId) && value >= tier.threshold) {
          newlyEarned.push({
            id: tierId,
            icon: ta.icon,
            title: `${ta.title} ${['I','II','III','IV','V'][tier.level - 1]}`,
            description: tier.description,
            xp: tier.xp,
            tiered: true,
          });
        }
      }
    }

    return newlyEarned;
  }

  return { getNewlyUnlocked };
}
