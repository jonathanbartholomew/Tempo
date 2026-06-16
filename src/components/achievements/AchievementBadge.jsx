import {
  Lock, Star, Flame, Gem, Crown, Briefcase, Layers, Trophy,
  Calendar, Users, Award, Zap, Sunrise, ClipboardCheck, Moon,
  CalendarCheck, Shield, Video, Building, TrendingUp, Timer,
  Brain, Hourglass, Sparkles, Bot, Cpu, Target,
} from 'lucide-react';
import { ROMAN } from '../../data/achievements';

const ICONS = {
  Star, Flame, Gem, Crown, Briefcase, Layers, Trophy, Calendar,
  Users, Award, Zap, Sunrise, ClipboardCheck, Moon, CalendarCheck,
  Shield, Video, Building, TrendingUp, Timer, Brain, Hourglass,
  Sparkles, Bot, Cpu, Target,
};

export default function AchievementBadge({ achievement, earned }) {
  const Icon = ICONS[achievement.icon] || Star;

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
      earned
        ? 'bg-white dark:bg-gray-900 border-yellow-200 dark:border-yellow-500/30 shadow-sm'
        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
    }`}>
      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
        earned
          ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
      }`}>
        {earned ? <Icon size={22} /> : <Lock size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-semibold text-sm ${earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
            {achievement.title}
          </h3>
          {earned && <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">Earned</span>}
        </div>
        <p className={`text-xs mt-0.5 ${earned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
          {achievement.description}
        </p>
        <p className={`text-xs font-semibold mt-1 ${earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>
          +{achievement.xp} XP
        </p>
      </div>
    </div>
  );
}

// Level 0 = locked, 1-5 = earned tiers (Common → Uncommon → Rare → Epic → Legendary)
const TIER_COLORS = [
  null, // 0 = locked, handled separately
  {
    border:   'border-slate-300 dark:border-slate-600/50',
    card:     'bg-white dark:bg-gray-900',
    icon:     'bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400',
    badge:    'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300',
    pip:      'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300',
    bar:      'from-slate-400 to-slate-500',
    text:     'text-slate-600 dark:text-slate-300',
    label:    'Common',
  },
  {
    border:   'border-green-200 dark:border-green-500/30',
    card:     'bg-white dark:bg-gray-900',
    icon:     'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400',
    badge:    'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    pip:      'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400',
    bar:      'from-green-400 to-green-500',
    text:     'text-green-600 dark:text-green-400',
    label:    'Uncommon',
  },
  {
    border:   'border-blue-200 dark:border-blue-500/30',
    card:     'bg-white dark:bg-gray-900',
    icon:     'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badge:    'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    pip:      'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
    bar:      'from-blue-400 to-blue-500',
    text:     'text-blue-600 dark:text-blue-400',
    label:    'Rare',
  },
  {
    border:   'border-purple-200 dark:border-purple-500/30',
    card:     'bg-white dark:bg-gray-900',
    icon:     'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    badge:    'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
    pip:      'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
    bar:      'from-purple-400 to-purple-500',
    text:     'text-purple-600 dark:text-purple-400',
    label:    'Epic',
  },
  {
    border:   'border-yellow-300 dark:border-yellow-500/40',
    card:     'bg-white dark:bg-gray-900',
    icon:     'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    badge:    'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
    pip:      'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    bar:      'from-yellow-400 to-amber-500',
    text:     'text-yellow-600 dark:text-yellow-400',
    label:    'Legendary',
  },
];

export function TieredAchievementBadge({ achievement, earned, context }) {
  const Icon = ICONS[achievement.icon] || Star;
  const value = achievement.getValue(context);
  const tiers = achievement.tiers;

  // Find highest earned tier
  let currentTierIdx = -1;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (earned.includes(`${achievement.id}_t${tiers[i].level}`)) {
      currentTierIdx = i;
      break;
    }
  }

  const hasAny = currentTierIdx >= 0;
  const currentTier = hasAny ? tiers[currentTierIdx] : null;
  const nextTier = tiers[currentTierIdx + 1] ?? null;
  const colors = hasAny ? TIER_COLORS[currentTierIdx + 1] : null;

  // Progress to next tier
  let progress = 0;
  let progressLabel = '';
  if (nextTier) {
    const prevThreshold = currentTier ? currentTier.threshold : 0;
    progress = Math.min(1, (value - prevThreshold) / (nextTier.threshold - prevThreshold));
    const remaining = Math.max(0, nextTier.threshold - value);
    progressLabel = `${remaining} to Level ${ROMAN[nextTier.level - 1]}`;
  }

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 shadow-sm ${
      hasAny
        ? `${colors.card} ${colors.border}`
        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
          hasAny ? colors.icon : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
        }`}>
          {hasAny ? <Icon size={22} /> : <Lock size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className={`font-semibold text-sm ${hasAny ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
              {achievement.title}
            </h3>
            {hasAny && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                {colors.label} · Lvl {ROMAN[currentTierIdx]}
              </span>
            )}
          </div>

          <p className={`text-xs mt-0.5 ${hasAny ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
            {currentTier ? currentTier.description : tiers[0].description}
          </p>

          {/* Tier pips */}
          <div className="flex gap-1 mt-2">
            {tiers.map((tier, i) => {
              const tierEarned = earned.includes(`${achievement.id}_t${tier.level}`);
              const pipColor = tierEarned ? TIER_COLORS[i + 1] : null;
              return (
                <span
                  key={tier.level}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    tierEarned
                      ? pipColor.pip
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {ROMAN[i]}
                </span>
              );
            })}
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-2 space-y-1">
              <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${TIER_COLORS[currentTierIdx + 2]?.bar || 'from-gray-300 to-gray-400'} transition-all duration-500`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">
                {progressLabel} · next: <span className={`font-semibold ${TIER_COLORS[currentTierIdx + 2]?.text || ''}`}>{TIER_COLORS[currentTierIdx + 2]?.label}</span> +{nextTier.xp} XP
              </p>
            </div>
          )}

          {!nextTier && hasAny && (
            <p className={`text-[10px] font-semibold mt-2 ${colors.text}`}>✦ Legendary — Max level reached</p>
          )}
        </div>
      </div>
    </div>
  );
}
