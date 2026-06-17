import { Router } from 'express';
import { pool } from '../db.js';

// Mirrors the migrated subset of STORAGE_KEYS in src/utils/helpers.js
const ALLOWED_KEYS = new Set([
  'tempo_jobs',
  'tempo_tasks',
  'tempo_meetings',
  'tempo_stats',
  'tempo_earned',
  'tempo_hidden_calendar_events',
  'tempo_timezone',
  'tempo_time_format',
  'tempo_focus_session',
  'tempo_profile',
  'tempo_calendar_accounts',
  'tempo_gcal_attended',
]);

const router = Router();

router.get('/data', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT data_key, data_value FROM user_data WHERE user_id = ?',
    [req.userId]
  );
  const result = {};
  for (const row of rows) {
    result[row.data_key] = row.data_value;
  }
  res.json(result);
});

router.put('/data/:key', async (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) {
    return res.status(400).json({ error: `Unknown data key: ${key}` });
  }
  const value = JSON.stringify(req.body.value ?? null);
  await pool.query(
    `INSERT INTO user_data (user_id, data_key, data_value) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE data_value = ?`,
    [req.userId, key, value, value]
  );
  res.status(204).end();
});

export default router;
