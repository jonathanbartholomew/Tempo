import { getTodayString, shiftDate } from './helpers';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getNextWeekday(name, base, forceNext = false) {
  const target = DAY_NAMES.indexOf(name.toLowerCase());
  const d = new Date(base + 'T00:00:00');
  const current = d.getDay();
  let diff = target - current;
  if (forceNext) {
    if (diff <= 0) diff += 7;
  } else {
    if (diff < 0) diff += 7;
  }
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function parseTime(hourStr, minStr, meridiem) {
  let h = parseInt(hourStr, 10);
  const m = parseInt(minStr || '0', 10);
  if (meridiem) {
    const mer = meridiem.toLowerCase();
    if (mer === 'pm' && h !== 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
  }
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Returns { title, date, time } — date is YYYY-MM-DD, time is HH:MM, both nullable.
export function parseTaskInput(raw) {
  const today = getTodayString();
  let text = raw;
  let date = null;
  let time = null;

  // --- Time: "3pm", "3:30pm", "at 3:30pm", "at 15:00" ---
  const timeMeridiem = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const time24 = /\bat\s+(\d{1,2}):(\d{2})\b/;

  const tm = timeMeridiem.exec(text);
  if (tm) {
    time = parseTime(tm[1], tm[2], tm[3]);
    if (time) text = text.replace(tm[0], ' ');
  } else {
    const t24 = time24.exec(text);
    if (t24) {
      time = parseTime(t24[1], t24[2], null);
      if (time) text = text.replace(t24[0], ' ');
    }
  }

  // --- Date: today / tomorrow / next [day] / [day] ---
  const dayGroup = DAY_NAMES.join('|');
  const dateRx = new RegExp(
    `\\b(today|tomorrow|next\\s+(${dayGroup})|(${dayGroup}))\\b`,
    'i'
  );
  const dm = dateRx.exec(text);
  if (dm) {
    const full = dm[1].toLowerCase();
    if (full === 'today') {
      date = today;
    } else if (full === 'tomorrow') {
      date = shiftDate(today, 1);
    } else if (full.startsWith('next ')) {
      const day = dm[2];
      date = getNextWeekday(day, today, true);
    } else {
      date = getNextWeekday(dm[3], today, false);
    }
    text = text.replace(dm[0], ' ');
  }

  // Clean up extra whitespace
  const title = text.replace(/\s{2,}/g, ' ').trim();

  return { title, date, time };
}

export function formatParsedHint(date, time) {
  const today = getTodayString();
  const tomorrow = shiftDate(today, 1);

  let datePart = '';
  if (date === today) datePart = 'Today';
  else if (date === tomorrow) datePart = 'Tomorrow';
  else if (date) {
    const d = new Date(date + 'T00:00:00');
    datePart = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  let timePart = '';
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    timePart = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  if (datePart && timePart) return `${datePart} · ${timePart}`;
  if (datePart) return datePart;
  if (timePart) return timePart;
  return null;
}
