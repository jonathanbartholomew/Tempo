import { getTodayString, shiftDate } from '../../utils/helpers';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityChart({ history = {}, metric = 'xp', days: dayCount = 7, width = 280, height = 90, showLabels = true }) {
  const today = getTodayString();
  const days = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = shiftDate(today, -i);
    const entry = history[date] || {};
    days.push({ date, value: entry[metric] || 0 });
  }

  const max = Math.max(1, ...days.map((d) => d.value));
  const padding = 8;
  const labelHeight = showLabels ? 16 : 0;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding - labelHeight;
  const stepX = innerWidth / (days.length - 1);

  const points = days.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + innerHeight - (d.value / max) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + innerHeight} L ${points[0].x} ${padding + innerHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#activityFill)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.date} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2.5} fill="#3b82f6" />
      ))}
      {showLabels && points.map((p, i) => (
        <text key={p.date} x={p.x} y={height - 2} textAnchor="middle" fontSize="9" fill="currentColor" className="text-gray-400 dark:text-gray-500">
          {DAY_LABELS[new Date(`${p.date}T00:00:00`).getDay()]}
        </text>
      ))}
    </svg>
  );
}
