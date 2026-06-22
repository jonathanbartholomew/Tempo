import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { requireAuth } from './middleware/auth.js';
import dataRoutes from './routes/data.js';
import aiPlanRoutes from './routes/aiPlan.js';
import jiraRoutes from './routes/jira.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import orgRoutes from './routes/org.js';
import authRoutes from './routes/auth.js';
import assignedTasksRoutes from './routes/assignedTasks.js';
import billingRoutes from './routes/billing.js';
import { pool } from './db.js';

// S3: Fail fast if required secrets are missing — prevents JWT from silently
// signing/verifying against the literal string "undefined".
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY environment variable is required');

const app = express();

// S1: Restrict CORS to the known frontend origin.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5180';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// S2: Rate limiting.
// Strict limit for auth endpoints — 10 attempts per 15 min per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});
// General API limit — 200 requests per minute per IP.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Ensure time_entries table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    category ENUM('task','ticket','focus','meeting','custom') NOT NULL DEFAULT 'custom',
    job_id VARCHAR(36) NULL,
    task_title VARCHAR(500) NULL,
    minutes INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, date)
  )
`).then(() =>
  pool.query(`ALTER TABLE time_entries MODIFY COLUMN category ENUM('task','ticket','focus','meeting','custom') NOT NULL DEFAULT 'custom'`)
).catch((err) => console.error('Failed to create/migrate time_entries table:', err));

// Add columns to existing tables if missing
pool.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(60) NULL`).catch(() => {});
pool.query(`ALTER TABLE organizations MODIFY COLUMN logo_url MEDIUMTEXT NULL`).catch(() => {});
pool.query(`ALTER TABLE users ADD COLUMN auth_provider ENUM('google','email') NOT NULL DEFAULT 'google'`).catch(() => {});
pool.query(`ALTER TABLE users ADD COLUMN trial_ends_at DATETIME NULL`).catch(() => {});
pool.query(`ALTER TABLE org_members ADD COLUMN org_xp INT NOT NULL DEFAULT 0`).catch(() => {});
pool.query(`ALTER TABLE organizations ADD COLUMN allow_personal_accounts TINYINT(1) NOT NULL DEFAULT 1`).catch(() => {});
pool.query(`ALTER TABLE organizations ADD COLUMN allow_multi_org_members TINYINT(1) NOT NULL DEFAULT 1`).catch(() => {});
pool.query(`ALTER TABLE time_entries ADD COLUMN job_id VARCHAR(36) NULL AFTER category`).catch(() => {});
pool.query(`ALTER TABLE time_entries ADD COLUMN task_title VARCHAR(500) NULL AFTER job_id`).catch(() => {});
pool.query(`ALTER TABLE time_entries MODIFY COLUMN description VARCHAR(500) NOT NULL DEFAULT ''`).catch(() => {});
pool.query(`ALTER TABLE time_entries ADD COLUMN started_at DATETIME NULL AFTER date`).catch(() => {});

// ── Corporate / Org schema ────────────────────────────────────────────────────

pool.query(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slug (slug)
  )
`).catch((err) => console.error('Failed to create organizations table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('org_admin','project_manager','team_lead','member') NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_org_user (org_id, user_id),
    INDEX idx_user (user_id)
  )
`).catch((err) => console.error('Failed to create org_members table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (org_id)
  )
`).catch((err) => console.error('Failed to create teams table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('lead','member') NOT NULL DEFAULT 'member',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_user (user_id)
  )
`).catch((err) => console.error('Failed to create team_members table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('project_manager','team_lead','member') NOT NULL DEFAULT 'member',
    token VARCHAR(64) NOT NULL,
    invited_by INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token (token),
    INDEX idx_org_email (org_id, email)
  )
`).catch((err) => console.error('Failed to create org_invites table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS corporate_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    icon VARCHAR(50) NOT NULL DEFAULT '🏆',
    xp_reward INT NOT NULL DEFAULT 0,
    reward_type ENUM('none','gift_card','pto','custom') NOT NULL DEFAULT 'none',
    reward_value VARCHAR(255) NULL,
    criteria_type ENUM('level','tasks_completed','focus_hours','streak_days','xp_total') NOT NULL,
    criteria_value INT NOT NULL,
    criteria_period ENUM('all_time','monthly','weekly') NOT NULL DEFAULT 'all_time',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (org_id)
  )
`).catch((err) => console.error('Failed to create corporate_achievements table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS corporate_achievement_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP NULL,
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_achievement (achievement_id)
  )
`).catch((err) => console.error('Failed to create corporate_achievement_progress table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS team_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    criteria_type ENUM('tasks_completed','focus_hours','xp_total') NOT NULL,
    target_value INT NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    reward_description VARCHAR(255) NULL,
    completed_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team (team_id)
  )
`).catch((err) => console.error('Failed to create team_goals table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS team_goal_contributions (
    goal_id INT NOT NULL,
    user_id INT NOT NULL,
    value INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (goal_id, user_id)
  )
`).catch((err) => console.error('Failed to create team_goal_contributions table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_celebrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT NULL,
    team_id INT NULL,
    event_type ENUM('achievement_unlocked','goal_completed','streak_milestone','level_up') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    icon VARCHAR(50) NOT NULL DEFAULT '🎉',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org_time (org_id, created_at)
  )
`).catch((err) => console.error('Failed to create org_celebrations table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    permissions JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role (org_id, name),
    INDEX idx_org (org_id)
  )
`).catch((err) => console.error('Failed to create org_roles table:', err));

// Widen role columns to VARCHAR so custom role names can be stored
pool.query(`ALTER TABLE org_members MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT 'member'`).catch(() => {});
pool.query(`ALTER TABLE org_invites MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT 'member'`).catch(() => {});

pool.query(`
  CREATE TABLE IF NOT EXISTS assigned_tasks (
    id VARCHAR(36) PRIMARY KEY,
    org_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    job_id VARCHAR(36) NULL,
    due_date DATE NULL,
    priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    done BOOLEAN NOT NULL DEFAULT FALSE,
    done_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_org (org_id)
  )
`).catch((err) => console.error('Failed to create assigned_tasks table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_time (org_id, created_at)
  )
`).catch((err) => console.error('Failed to create org_posts table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_post_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_post (post_id)
  )
`).then(() =>
  // Add updated_at to existing tables; ignore error 1060 = column already exists
  pool.query(`ALTER TABLE org_post_replies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .catch((err) => { if (err.errno !== 1060) console.error('Failed to migrate org_post_replies:', err); })
).catch((err) => console.error('Failed to create org_post_replies table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_post_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reaction (post_id, user_id, emoji),
    INDEX idx_post (post_id)
  )
`).catch((err) => console.error('Failed to create org_post_reactions table:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS org_reply_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reply_id INT NOT NULL,
    user_id INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reply_reaction (reply_id, user_id, emoji),
    INDEX idx_reply (reply_id)
  )
`).catch((err) => console.error('Failed to create org_reply_reactions table:', err));

// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jira', apiLimiter, jiraRoutes);

// Public invite lookup — no auth required (must be before the protected /api/org mount)
app.get('/api/org/invite/:token', async (req, res) => {
  const { token } = req.params;
  const [rows] = await pool.query(
    `SELECT i.email, i.role, i.expires_at, i.accepted_at, o.name AS org_name, o.logo_url
     FROM org_invites i JOIN organizations o ON o.id = i.org_id
     WHERE i.token = ?`,
    [token]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invite not found' });
  const invite = rows[0];
  if (invite.accepted_at) return res.status(410).json({ error: 'Invite already accepted' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'Invite expired' });
  res.json(invite);
});

app.use('/api/billing', apiLimiter, requireAuth, billingRoutes);
app.use('/api/time-entries', apiLimiter, requireAuth, timeTrackingRoutes);
app.use('/api/assigned-tasks', apiLimiter, requireAuth, assignedTasksRoutes);
app.use('/api/org', apiLimiter, requireAuth, orgRoutes);
app.use('/api', apiLimiter, requireAuth, dataRoutes);
app.use('/api/ai-plan', apiLimiter, requireAuth, aiPlanRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tempo API server listening on port ${port}`);
});
