import { useState, useEffect } from 'react';
import AchievementBadge, { TieredAchievementBadge } from './AchievementBadge';
import { ACHIEVEMENTS, TIERED_ACHIEVEMENTS } from '../../data/achievements';
import { getLevelInfo } from '../../utils/helpers';
import { CheckCircle2, Flame, Trophy, Briefcase, Building2, Lock } from 'lucide-react';

const CRITERIA_LABELS = {
  level: 'Reach level',
  tasks_completed: 'Complete tasks',
  focus_hours: 'Focus hours',
  streak_days: 'Day streak',
  xp_total: 'Total XP',
};

function CompanyAchievementBadge({ achievement }) {
  const unlocked = !!achievement.unlocked_at;
  const progress = achievement.myProgress ?? 0;
  const target = achievement.criteria_value;
  const pct = Math.min(1, progress / target);

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
      unlocked
        ? 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
    }`}>
      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-2xl ${
        unlocked ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-gray-200 dark:bg-gray-800'
      }`}>
        {unlocked ? achievement.icon : <Lock size={20} className="text-gray-400 dark:text-gray-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-semibold text-sm ${unlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
            {achievement.name}
          </h3>
          {unlocked && <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">Unlocked</span>}
        </div>
        <p className={`text-xs mt-0.5 ${unlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
          {achievement.description}
        </p>

        {/* Progress bar */}
        {!unlocked && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500" style={{ width: `${pct * 100}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600">
              {progress} / {target} {CRITERIA_LABELS[achievement.criteria_type] ?? achievement.criteria_type}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {achievement.xp_reward > 0 && (
            <span className={`text-xs font-semibold ${unlocked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}>
              +{achievement.xp_reward} XP
            </span>
          )}
          {achievement.reward_type !== 'none' && achievement.reward_value && (
            <span className="text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              🎁 {achievement.reward_value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsTab({ stats, jobs, meetings, gcalAttended, earned, org, orgActions }) {
  const level = getLevelInfo(stats.totalXp);
  const context = { stats, jobs, meetings, gcalAttended };
  const [orgAchievements, setOrgAchievements] = useState([]);

  useEffect(() => {
    if (!org?.id) return;
    orgActions.getOrgAchievements(org.id).then(setOrgAchievements).catch(() => {});
  }, [org?.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>

      {/* Level card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Level</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Level {level.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total XP</p>
            <p className="text-2xl font-bold text-teal-500 dark:text-teal-400">{stats.totalXp}</p>
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
          <Stat label="Tasks Done"     value={stats.tasksCompleted} icon={CheckCircle2} iconColor="text-green-500" />
          <Stat label="Day Streak"     value={stats.streak}         icon={Flame}        iconColor="text-orange-400" />
          <Stat label="Longest Streak" value={stats.longestStreak}  icon={Trophy}       iconColor="text-amber-400" />
          <Stat label="Jobs Tracked"   value={jobs.length}          icon={Briefcase}    iconColor="text-blue-400" />
        </div>
      </div>

      {/* Company achievements */}
      {orgAchievements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {org.name} Achievements
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {orgAchievements.filter((a) => a.unlocked_at).length} / {orgAchievements.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgAchievements.map((a) => (
              <CompanyAchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {/* Tiered achievements */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Progress Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIERED_ACHIEVEMENTS.map((a) => (
            <TieredAchievementBadge key={a.id} achievement={a} earned={earned} context={context} />
          ))}
        </div>
      </div>

      {/* One-time achievements */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} achievement={a} earned={earned.includes(a.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, iconColor }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-1">
      {Icon && <Icon size={18} className={`mx-auto ${iconColor}`} />}
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}
