import { Router } from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/time-entries?date=YYYY-MM-DD  or  ?startDate=&endDate=
router.get('/', requireAuth, async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    if (startDate && endDate) {
      const [rows] = await pool.query(
        'SELECT * FROM time_entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC',
        [req.userId, startDate, endDate]
      );
      res.json({ entries: rows });
    } else {
      const d = date || new Date().toISOString().slice(0, 10);
      const [rows] = await pool.query(
        'SELECT * FROM time_entries WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
        [req.userId, d]
      );
      res.json({ entries: rows });
    }
  } catch (err) {
    console.error('time-entries fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// POST /api/time-entries
router.post('/', requireAuth, async (req, res) => {
  try {
    const { description, category, minutes, date, jobId, taskTitle, startedAt } = req.body;
    if (!minutes) return res.status(400).json({ error: 'minutes required' });
    if (!description && !taskTitle) return res.status(400).json({ error: 'description or taskTitle required' });
    const id = crypto.randomUUID();
    const entryDate = date || new Date().toISOString().slice(0, 10);
    const validCategory = ['task', 'ticket', 'focus', 'custom'].includes(category) ? category : 'custom';
    const startedAtVal = startedAt ? new Date(startedAt) : null;
    await pool.query(
      'INSERT INTO time_entries (id, user_id, description, category, job_id, task_title, minutes, date, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, (description || '').slice(0, 500), validCategory, jobId || null, taskTitle ? taskTitle.slice(0, 500) : null, Math.round(minutes), entryDate, startedAtVal]
    );
    const [rows] = await pool.query('SELECT * FROM time_entries WHERE id = ?', [id]);
    res.status(201).json({ entry: rows[0] });
  } catch (err) {
    console.error('time-entries create error:', err);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// PUT /api/time-entries/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { description, category, minutes, jobId, taskTitle, startedAt } = req.body;
    const validCategory = ['task', 'ticket', 'focus', 'custom'].includes(category) ? category : 'custom';
    const startedAtVal = startedAt ? new Date(startedAt) : null;
    const [result] = await pool.query(
      `UPDATE time_entries SET description = ?, category = ?, job_id = ?, task_title = ?, minutes = ?,
       started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [(description || '').slice(0, 500), validCategory, jobId || null, taskTitle ? taskTitle.slice(0, 500) : null, Math.round(minutes), startedAtVal, req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.query('SELECT * FROM time_entries WHERE id = ?', [req.params.id]);
    res.json({ entry: rows[0] });
  } catch (err) {
    console.error('time-entries update error:', err);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// DELETE /api/time-entries/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM time_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('time-entries delete error:', err);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

export default router;
