import AchievementBadge from './AchievementBadge';
import { ACHIEVEMENTS } from '../../data/achievements';
import { getLevelInfo } from '../../utils/helpers';

export default function AchievementsTab({ stats, jobs, earned }) {
  const level = getLevelInfo(stats.totalXp);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Level</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Level {level.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total XP</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalXp}</p>
          </div>
        </div>

        {level.nextLevelXp !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{level.xpIntoLevel} / {level.xpForLevel} XP</span>
              <span>Level {level.level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300" style={{ width: `${level.progress * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{level.xpForLevel - level.xpIntoLevel} XP to next level</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Stat label="Tasks Done" value={stats.tasksCompleted} />
          <Stat label="Day Streak" value={stats.streak} />
          <Stat label="Longest Streak" value={stats.longestStreak} />
          <Stat label="Jobs Tracked" value={jobs.length} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge key={a.id} achievement={a} earned={earned.includes(a.id)} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}
