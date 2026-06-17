const COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#06b6d4',
];

function pickColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name, picture, className = 'w-8 h-8 text-sm' }) {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const initial = (name || '?').charAt(0).toUpperCase();
  const bg = pickColor(name || '?');

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white select-none`}
      style={{ backgroundColor: bg }}
    >
      {initial}
    </div>
  );
}
