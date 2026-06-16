import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAILY_LIMIT = 25;
const MAX_HISTORY = 10; // keep last 10 messages to cap context growth

// In-memory daily usage tracker: userId -> { date, count }
const usageMap = new Map();

function checkLimit(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = usageMap.get(userId);
  if (!entry || entry.date !== today) {
    usageMap.set(userId, { date: today, count: 0 });
    return true;
  }
  return entry.count < DAILY_LIMIT;
}

function incrementUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = usageMap.get(userId) || { date: today, count: 0 };
  usageMap.set(userId, { date: today, count: entry.count + 1 });
}

function getRemainingRequests(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = usageMap.get(userId);
  if (!entry || entry.date !== today) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - entry.count);
}

function buildSystemPrompt({ jobs, tasks, meetings, googleEvents, date }) {
  const jobsList = jobs?.length
    ? jobs.map((j) => j.name).join(', ')
    : 'none';

  const todayTasks = (tasks || []).filter((t) => t.date === date && !t.done);
  const tasksList = todayTasks.length
    ? todayTasks.map((t) => `${t.title}${t.time ? ` @${t.time}` : ''}`).join(', ')
    : 'none';

  const jobNameById = (id) => jobs?.find((j) => j.id === id)?.name;
  const jobNameByAccount = (email) => jobs?.find((j) => j.googleAccountEmail === email)?.name;

  const allEvents = [
    ...(meetings || []).filter((m) => m.date === date).map((m) => {
      const job = jobNameById(m.jobId);
      return `${m.time} ${m.title}(${m.duration}m)${job ? `[${job}]` : ''}`;
    }),
    ...(googleEvents || []).filter((e) => e.date === date).map((e) => {
      const job = jobNameByAccount(e.accountEmail) || e.account;
      return e.allDay ? `all-day:${e.title}[${job}]` : `${e.time} ${e.title}(${e.duration}m)[${job}]`;
    }),
  ];
  const eventsList = allEvents.length ? allEvents.join(', ') : 'none';

  return `Day planner for ${date}. Jobs: ${jobsList}. Existing tasks: ${tasksList}. Calendar: ${eventsList}.
Ask the user what they need to get done (1-2 questions max), then output ONLY this JSON block:
\`\`\`json
{"tasks":[{"title":"...","priority":"low|normal|high|urgent","date":"${date}","time":"HH:MM or null","job":"exact job name or null"}],"meetings":[{"title":"...","date":"${date}","time":"HH:MM","duration":30,"job":"exact job name or null","notes":null}]}
\`\`\`
Jobs must match one of: ${jobsList}. meetings array can be empty []. Don't recreate existing tasks or calendar events.`;
}

router.post('/chat', async (req, res) => {
  const { messages, context } = req.body;
  const userId = req.userId;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!checkLimit(userId)) {
    return res.status(429).json({
      error: `Daily limit of ${DAILY_LIMIT} requests reached. Resets at midnight.`,
    });
  }

  // Trim history to keep token usage low
  const trimmedMessages = messages.slice(-MAX_HISTORY);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: [{ type: 'text', text: buildSystemPrompt(context || {}), cache_control: { type: 'ephemeral' } }],
      messages: trimmedMessages,
    });

    incrementUsage(userId);

    const content = response.content[0]?.text || '';
    res.json({
      content,
      stop_reason: response.stop_reason,
      remaining: getRemainingRequests(userId),
    });
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
