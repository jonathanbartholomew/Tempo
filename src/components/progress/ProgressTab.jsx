import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { getLevelInfo, getTodayString, shiftDate } from '../../utils/helpers';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekData(history, metric, days = 7) {
  const today = getTodayString();
  const values = [];
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftDate(today, -i);
    const entry = history[date] || {};
    values.push(entry[metric] || 0);
    labels.push(DAY_LABELS[new Date(`${date}T00:00:00`).getDay()]);
  }
  return { values, labels };
}

const CHART_SX = {
  '& .MuiChartsAxis-tickLabel': { fontSize: '11px' },
  '& .MuiBarElement-root': { rx: 4 },
};

export default function ProgressTab({ stats }) {
  const level = getLevelInfo(stats.totalXp);
  const history = stats.history || {};

  const { values: taskValues, labels } = getWeekData(history, 'completed');
  const { values: xpValues } = getWeekData(history, 'xp');
  const { values: focusValues } = getWeekData(history, 'focusMinutes');

  const totalTasksThisWeek = taskValues.reduce((s, v) => s + v, 0);
  const totalXpThisWeek = xpValues.reduce((s, v) => s + v, 0);
  const totalFocusThisWeek = focusValues.reduce((s, v) => s + v, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Progress</h1>

      {/* Level card */}
      <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Level</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Level {level.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total XP</p>
            <p className="text-2xl font-bold text-teal-500 dark:text-teal-400">{stats.totalXp.toLocaleString()}</p>
          </div>
        </div>

        {level.nextLevelXp !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{level.xpIntoLevel.toLocaleString()} / {level.xpForLevel.toLocaleString()} XP</span>
              <span>Level {level.level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300" style={{ width: `${level.progress * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{(level.xpForLevel - level.xpIntoLevel).toLocaleString()} XP to next level</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Stat label="Tasks Done" value={stats.tasksCompleted} />
          <Stat label="Day Streak" value={stats.streak} />
          <Stat label="Longest Streak" value={stats.longestStreak} />
          <Stat label="Future Tasks Added" value={stats.futureTasksAdded} />
        </div>
      </div>

      {/* This week summary */}
      <div className="grid grid-cols-3 gap-3">
        <WeekStat label="Tasks this week" value={totalTasksThisWeek} unit="" color="text-blue-600 dark:text-blue-400" />
        <WeekStat label="XP earned" value={totalXpThisWeek} unit=" XP" color="text-teal-500 dark:text-teal-400" />
        <WeekStat label="Focus time" value={totalFocusThisWeek >= 60 ? `${Math.floor(totalFocusThisWeek / 60)}h ${totalFocusThisWeek % 60}m` : `${totalFocusThisWeek}m`} unit="" color="text-violet-600 dark:text-violet-400" raw />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tasks Completed</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 7 days — hover for details</p>
          <BarChart
            xAxis={[{ data: labels, scaleType: 'band' }]}
            series={[{ data: taskValues, color: '#3b82f6', label: 'Tasks' }]}
            height={160}
            margin={{ top: 12, bottom: 28, left: 36, right: 12 }}
            sx={CHART_SX}
          />
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">XP Earned</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 7 days — hover for details</p>
          <LineChart
            xAxis={[{ data: labels, scaleType: 'point' }]}
            series={[{ data: xpValues, area: true, color: '#14b8a6', label: 'XP', showMark: false }]}
            height={160}
            margin={{ top: 12, bottom: 28, left: 52, right: 12 }}
            sx={{
              ...CHART_SX,
              '& .MuiAreaElement-root': { fillOpacity: 0.15 },
              '& .MuiLineElement-root': { strokeWidth: 2 },
            }}
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Focus Minutes</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 7 days — hover for details</p>
          <BarChart
            xAxis={[{ data: labels, scaleType: 'band' }]}
            series={[{ data: focusValues, color: '#7c3aed', label: 'Minutes' }]}
            height={160}
            margin={{ top: 12, bottom: 28, left: 44, right: 12 }}
            sx={CHART_SX}
          />
        </div>

        <div className="glow-card rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">XP + Tasks Combined</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 7 days — hover for details</p>
          <LineChart
            xAxis={[{ data: labels, scaleType: 'point' }]}
            series={[
              { data: xpValues, color: '#14b8a6', label: 'XP', yAxisId: 'xp', showMark: false },
              { data: taskValues, color: '#3b82f6', label: 'Tasks', yAxisId: 'tasks', showMark: false },
            ]}
            yAxis={[
              { id: 'xp' },
              { id: 'tasks' },
            ]}
            rightAxis="tasks"
            height={160}
            margin={{ top: 12, bottom: 28, left: 52, right: 44 }}
            sx={{
              ...CHART_SX,
              '& .MuiLineElement-root': { strokeWidth: 2 },
            }}
          />
        </div>
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

function WeekStat({ label, value, unit, color, raw }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{raw ? value : `${value.toLocaleString()}${unit}`}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
