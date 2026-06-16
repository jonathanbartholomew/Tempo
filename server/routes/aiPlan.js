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

function buildSystemPrompt({ jobs, tasks, meetings, googleEvents, jiraIssues, date }) {
  const jobsList = jobs?.length
    ? jobs.map((j) => j.name).join(', ')
    : 'none';

  const todayTasks = (tasks || []).filter((t) => t.date === date && !t.done);
  const tasksList = todayTasks.length
    ? todayTasks.map((t) => `${t.title}${t.time ? ` @${t.time}` : ''}${t.priority && t.priority !== 'normal' ? ` (${t.priority})` : ''}`).join('\n')
    : 'none';

  const jobNameById = (id) => jobs?.find((j) => j.id === id)?.name;
  const jobNameByAccount = (email) => jobs?.find((j) => j.googleAccountEmail === email)?.name;

  const allEvents = [
    ...(meetings || []).filter((m) => m.date === date).map((m) => {
      const job = jobNameById(m.jobId);
      return `${m.time} ${m.title} (${m.duration}m)${job ? ` [${job}]` : ''}`;
    }),
    ...(googleEvents || []).filter((e) => e.date === date).map((e) => {
      const job = jobNameByAccount(e.accountEmail) || e.account;
      return e.allDay ? `All day: ${e.title} [${job}]` : `${e.time} ${e.title} (${e.duration}m) [${job}]`;
    }),
  ].sort();
  const eventsList = allEvents.length ? allEvents.join('\n') : 'none';

  const openJira = (jiraIssues || []).filter((i) => i.statusCategory !== 'done');
  const jiraList = openJira.length
    ? openJira.map((i) => `- ${i.key}: ${i.summary} [${i.status}${i.priority ? `, ${i.priority}` : ''}${i.project ? `, ${i.project}` : ''}]`).join('\n')
    : 'none';

  return `You are a day planner assistant for ${date}.

JOBS/PROJECTS: ${jobsList}

EXISTING TASKS FOR TODAY:
${tasksList}

CALENDAR & MEETINGS:
${eventsList}

JIRA TICKETS (open):
${jiraList}

Use all of the above context to understand what's on the user's plate. Follow this exact flow:

STEP 1 — Ask 1-2 focused questions to understand what the user needs to accomplish today (factor in their calendar blocks as unavailable time, and Jira tickets as potential work items).

STEP 2 — Once you have enough info, write a short natural-language overview of the day plan. Example format:
"Here's your plan for ${date}:
• 9:00 AM — [task] ([job])
• 10:30 AM — [existing meeting, just noting it]
• ..."
Then ask: "Does this look good, or would you like to adjust anything?"

STEP 3 — Only after the user confirms (says yes, looks good, go ahead, etc.), output ONLY this JSON block with no other text:
\`\`\`json
{"tasks":[{"title":"...","priority":"low|normal|high|urgent","date":"${date}","time":"HH:MM or null","job":"exact job name or null","subtasks":["Step 1","Step 2"]}],"meetings":[]}
\`\`\`

Rules:
- job must exactly match one of [${jobsList}] or be null.
- subtasks is optional — include it when a task is complex enough to benefit from steps, or when the user asks. For broad/generic tickets (e.g. "work on X feature"), proactively suggest 3-5 concrete subtasks. Leave as [] for simple tasks.
- Don't recreate existing tasks or calendar events already listed above.
- Don't output JSON until the user explicitly confirms the plan.`;
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
      max_tokens: 1024,
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
