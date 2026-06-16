import { PRIORITIES, getTodayString } from './helpers';

const VALID_PRIORITIES = PRIORITIES.map((p) => p.value);

export function buildPromptTemplate({ jobs, tasks, meetings, googleEvents, date }) {
  const targetDate = date || getTodayString();

  const jobsList = jobs.length
    ? jobs.map((j) => `- ${j.name} (${j.type})`).join('\n')
    : '(none yet)';

  const existingTasks = tasks.filter((t) => t.date === targetDate && !t.done);
  const tasksList = existingTasks.length
    ? existingTasks.map((t) => `- ${t.title}`).join('\n')
    : '(none yet)';

  const jobNameById = (jobId) => jobs.find((j) => j.id === jobId)?.name;
  const jobNameByAccount = (email) => jobs.find((j) => j.googleAccountEmail === email)?.name;

  const existingMeetings = meetings
    .filter((m) => m.date === targetDate)
    .map((m) => {
      const job = jobNameById(m.jobId);
      return `- ${m.time} ${m.title} (${m.duration}m)${job ? ` [${job}]` : ''}`;
    });

  const calendarEvents = (googleEvents || [])
    .filter((e) => e.date === targetDate)
    .map((e) => {
      const job = jobNameByAccount(e.accountEmail);
      const label = job ? ` [${job}]` : ` [${e.account}]`;
      return e.allDay ? `- All day: ${e.title}${label}` : `- ${e.time} ${e.title} (${e.duration}m)${label}`;
    });

  const allMeetings = [...existingMeetings, ...calendarEvents];
  const meetingsList = allMeetings.length ? allMeetings.join('\n') : '(none scheduled)';

  return `I want you to help me plan my day for ${targetDate} in my productivity app, Tempo.

My jobs/projects:
${jobsList}

My existing tasks for today:
${tasksList}

My existing meetings and calendar events for that day:
${meetingsList}

Based on a conversation with me about what I need to get done, create a day plan. Respond with ONLY a single JSON code block (no other text) matching exactly this schema:

\`\`\`json
{
  "tasks": [
    { "title": "Task title", "priority": "low|normal|high|urgent", "date": "${targetDate}", "time": "HH:MM or null", "job": "Job name or null" }
  ]
}
\`\`\`

- "job" must match one of my job names above exactly, or be null if it's not work-related.
- "priority" must be one of: low, normal, high, urgent.
- "date" should be in YYYY-MM-DD format, defaulting to ${targetDate} unless I specify another day.
- Only output "tasks" — personal work items, optionally with a "time" if they should happen at a specific time. My meetings and calendar events are already synced from Google Calendar, so don't create meetings; just plan tasks around the ones listed above.
- Don't repeat my existing tasks/meetings/calendar events above in your output — only include new tasks we discuss, planned around them.
- Now ask me what I need to get done today, then output the JSON plan once we're done discussing.`;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return candidate.trim();
}

export function parsePlanText(text, jobs, defaultDate) {
  if (!text || !text.trim()) {
    throw new Error('Paste the JSON plan from Claude before importing.');
  }

  let data;
  try {
    data = JSON.parse(extractJson(text));
  } catch {
    throw new Error('Could not parse JSON. Make sure you pasted the full code block from Claude.');
  }

  const findJobId = (name) => {
    if (!name) return null;
    const raw = String(name).trim().toLowerCase();
    const stripped = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const job = jobs.find((j) => {
      const jobName = j.name.toLowerCase();
      return jobName === raw || jobName === stripped;
    });
    return job ? job.id : null;
  };

  const fallbackDate = defaultDate || getTodayString();

  const tasks = (data.tasks || []).map((t) => ({
    title: String(t.title || '').trim(),
    priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'normal',
    date: t.date || fallbackDate,
    time: t.time || null,
    jobId: findJobId(t.job),
  })).filter((t) => t.title);

  const meetings = (data.meetings || []).map((m) => ({
    title: String(m.title || '').trim(),
    date: m.date || fallbackDate,
    time: m.time || null,
    duration: typeof m.duration === 'number' ? m.duration : 30,
    jobId: findJobId(m.job),
    notes: m.notes || '',
    reminder: false,
    reminderMins: 10,
  })).filter((m) => m.title);

  if (tasks.length === 0 && meetings.length === 0) {
    throw new Error('No tasks or meetings found in that JSON.');
  }

  return { tasks, meetings };
}
