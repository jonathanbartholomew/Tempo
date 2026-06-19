import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const METRIC_LABELS = {
  tasks_completed: { label: 'tasks completed', unit: 'tasks' },
  focus_hours:     { label: 'focus hours logged', unit: 'hrs' },
  xp_total:        { label: 'XP earned', unit: 'XP' },
};

function goalTitle(goal) {
  const m = METRIC_LABELS[goal.criteria_type];
  return `${goal.target_value} ${m?.label ?? goal.criteria_type.replace(/_/g, ' ')}`;
}

export default function GoalsTab({ org, orgActions }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openGoal, setOpenGoal] = useState(null);

  useEffect(() => {
    if (!org?.id) return;
    setLoading(true);
    orgActions.getMyTeamsGoals(org.id)
      .then(setGoals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org?.id]);

  if (!org) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Target size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Team goals are available for organization members.</p>
      </div>
    );
  }

  const active = goals.filter((g) => !g.completed_at);
  const completed = goals.filter((g) => g.completed_at);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Goals</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Building2 size={13} className="text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">{org.name}</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-52' : 'w-40'}`} />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className={`h-3 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
              </div>
              <Skeleton className="w-4 h-4 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center">
          <Target size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No active team goals. An admin or team lead can create goals from the Admin panel.</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Active</h2>
          {active.map((goal) => <GoalCard key={goal.id} goal={goal} open={openGoal === goal.id} onToggle={() => setOpenGoal(openGoal === goal.id ? null : goal.id)} />)}
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Completed</h2>
          {completed.map((goal) => <GoalCard key={goal.id} goal={goal} open={openGoal === goal.id} onToggle={() => setOpenGoal(openGoal === goal.id ? null : goal.id)} />)}
        </section>
      )}
    </div>
  );
}

function GoalCard({ goal, open, onToggle }) {
  const pct = goal.target_value > 0 ? Math.min(1, goal.current_value / goal.target_value) : 0;
  const done = !!goal.completed_at;
  const start = String(goal.period_start).slice(0, 10);
  const end = String(goal.period_end).slice(0, 10);
  const m = METRIC_LABELS[goal.criteria_type];

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      done ? 'border-green-200 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-800'
    } bg-white dark:bg-gray-900`}>
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
        {/* Progress ring */}
        <div className="relative flex-shrink-0 w-12 h-12">
          <svg viewBox="0 0 44 44" className="-rotate-90 w-12 h-12">
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-gray-100 dark:stroke-gray-800" />
            <circle
              cx="22" cy="22" r="18" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke={done ? '#22c55e' : '#6366f1'}
              strokeDasharray={`${pct * 113} 113`}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
            {Math.round(pct * 100)}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Auto-generated title */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{goalTitle(goal)}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: goal.team_color + '22', color: goal.team_color }}>
              {goal.team_name}
            </span>
            {done && <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">✓ Completed</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {goal.current_value} / {goal.target_value} {m?.unit ?? goal.criteria_type.replace(/_/g, ' ')} · {start} – {end}
          </p>
        </div>

        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{goal.current_value} {m?.unit ?? ''} contributed by team</span>
              <span>Target: {goal.target_value}</span>
            </div>
          </div>

          {goal.myContribution > 0 && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400">
              Your contribution: {goal.myContribution} {m?.unit ?? ''}
            </p>
          )}

          {goal.reward_description && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2">
              <span>🎁</span>
              <span className="font-medium">{goal.reward_description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
