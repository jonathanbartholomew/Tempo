import { LineChart } from '@mui/x-charts/LineChart';
import { getTodayString, shiftDate } from '../../utils/helpers';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityChart({ history = {}, metric = 'xp', days: dayCount = 7, height = 140, color = '#3b82f6' }) {
  const today = getTodayString();
  const values = [];
  const labels = [];

  for (let i = dayCount - 1; i >= 0; i--) {
    const date = shiftDate(today, -i);
    const entry = history[date] || {};
    values.push(entry[metric] || 0);
    labels.push(DAY_LABELS[new Date(`${date}T00:00:00`).getDay()]);
  }

  return (
    <LineChart
      xAxis={[{ data: labels, scaleType: 'point' }]}
      series={[{
        data: values,
        area: true,
        color,
        showMark: false,
      }]}
      height={height}
      margin={{ top: 8, bottom: 24, left: 36, right: 16 }}
      sx={{
        '& .MuiAreaElement-root': { fillOpacity: 0.15 },
        '& .MuiLineElement-root': { strokeWidth: 2 },
        '& .MuiChartsAxis-tickLabel': { fontSize: '11px' },
      }}
    />
  );
}
