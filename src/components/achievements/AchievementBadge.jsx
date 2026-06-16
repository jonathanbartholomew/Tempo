import {
  Lock,
  Star,
  Flame,
  Rocket,
  Gem,
  Crown,
  Briefcase,
  Layers,
  Trophy,
  Calendar,
  Users,
  Award,
  Zap,
  Sunrise,
  ClipboardCheck,
  Moon,
  CalendarCheck,
  Shield,
  Video,
  Building,
  TrendingUp,
  Timer,
  Brain,
  Hourglass,
  Infinity,
  Sparkles,
  Bot,
  Cpu,
} from 'lucide-react';

const ICONS = {
  Star,
  Flame,
  Rocket,
  Gem,
  Crown,
  Briefcase,
  Layers,
  Trophy,
  Calendar,
  Users,
  Award,
  Zap,
  Sunrise,
  ClipboardCheck,
  Moon,
  CalendarCheck,
  Shield,
  Video,
  Building,
  TrendingUp,
  Timer,
  Brain,
  Hourglass,
  Infinity,
  Sparkles,
  Bot,
  Cpu,
};

export default function AchievementBadge({ achievement, earned }) {
  const Icon = ICONS[achievement.icon] || Star;

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
        earned ? 'bg-white dark:bg-gray-900 border-yellow-200 dark:border-yellow-500/30 shadow-sm' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
      }`}
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${earned ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
        {earned ? <Icon size={22} /> : <Lock size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-semibold text-sm ${earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{achievement.title}</h3>
          {earned && <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">Earned</span>}
        </div>
        <p className={`text-xs mt-0.5 ${earned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{achievement.description}</p>
        <p className={`text-xs font-semibold mt-1 ${earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>+{achievement.xp} XP</p>
      </div>
    </div>
  );
}
