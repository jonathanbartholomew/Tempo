export default function ProgressRing({ progress, taskFrac, meetingFrac, size = 120, strokeWidth = 10, label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (taskFrac !== undefined && meetingFrac !== undefined) {
    const taskLen = Math.min(taskFrac, 1) * circumference;
    const meetingLen = Math.min(meetingFrac, 1) * circumference;
    const meetingStartDeg = Math.min(taskFrac, 1) * 360;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-gray-800" />
          {taskLen > 0 && (
            <circle
              cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="butt"
              stroke="#3b82f6"
              strokeDasharray={`${taskLen} ${circumference}`}
              strokeDashoffset={0}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )}
          {meetingLen > 0 && (
            <circle
              cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="butt"
              stroke="#84cc16"
              strokeDasharray={`${meetingLen} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(${meetingStartDeg}, ${cx}, ${cy})`}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{label}</span>
          {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
        </div>
      </div>
    );
  }

  const offset = circumference * (1 - Math.min(1, Math.max(0, progress || 0)));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-gray-800" />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          stroke="#3b82f6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{label}</span>
        {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
}
