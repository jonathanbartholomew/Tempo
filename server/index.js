import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { requireAuth } from './middleware/auth.js';
import dataRoutes from './routes/data.js';
import aiPlanRoutes from './routes/aiPlan.js';
import jiraRoutes from './routes/jira.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import orgRoutes from './routes/org.js';
import authRoutes from './routes/auth.js';
import assignedTasksRoutes from './routes/assignedTasks.js';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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
pool.query(`ALTER TABLE users ADD COLUMN auth_provider ENUM('google','email') NOT NULL DEFAULT 'google'`).catch(() => {});
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

// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jira', jiraRoutes);

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

app.use('/api/time-entries', requireAuth, timeTrackingRoutes);
app.use('/api/assigned-tasks', requireAuth, assignedTasksRoutes);
app.use('/api/org', requireAuth, orgRoutes);
app.use('/api', requireAuth, dataRoutes);
app.use('/api/ai-plan', requireAuth, aiPlanRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tempo API server listening on port ${port}`);
});
