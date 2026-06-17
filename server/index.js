import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { requireAuth } from './middleware/auth.js';
import dataRoutes from './routes/data.js';
import aiPlanRoutes from './routes/aiPlan.js';
import jiraRoutes from './routes/jira.js';
import timeTrackingRoutes from './routes/timeTracking.js';
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
pool.query(`ALTER TABLE time_entries ADD COLUMN job_id VARCHAR(36) NULL AFTER category`).catch(() => {});
pool.query(`ALTER TABLE time_entries ADD COLUMN task_title VARCHAR(500) NULL AFTER job_id`).catch(() => {});
pool.query(`ALTER TABLE time_entries MODIFY COLUMN description VARCHAR(500) NOT NULL DEFAULT ''`).catch(() => {});
pool.query(`ALTER TABLE time_entries ADD COLUMN started_at DATETIME NULL AFTER date`).catch(() => {});

app.use('/api/jira', jiraRoutes);
app.use('/api/time-entries', requireAuth, timeTrackingRoutes);
app.use('/api', requireAuth, dataRoutes);
app.use('/api/ai-plan', requireAuth, aiPlanRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tempo API server listening on port ${port}`);
});
