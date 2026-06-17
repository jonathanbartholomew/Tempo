import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/assigned-tasks/mine — tasks assigned to the current user
router.get('/mine', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT at.*, u.name AS assigned_by_name, u.picture AS assigned_by_picture
     FROM assigned_tasks at
     JOIN users u ON u.id = at.assigned_by
     WHERE at.assigned_to = ?
     ORDER BY at.due_date ASC, at.created_at ASC`,
    [req.userId]
  );
  res.json(rows);
});

// PATCH /api/assigned-tasks/:taskId/done — assignee marks done/undone
router.patch('/:taskId/done', async (req, res) => {
  const { taskId } = req.params;
  const { done } = req.body;

  const [rows] = await pool.query(
    'SELECT assigned_to FROM assigned_tasks WHERE id = ?',
    [taskId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found' });
  if (rows[0].assigned_to !== req.userId) return res.status(403).json({ error: 'Not your task' });

  await pool.query(
    'UPDATE assigned_tasks SET done = ?, done_at = ? WHERE id = ?',
    [done ? 1 : 0, done ? new Date() : null, taskId]
  );
  res.status(204).end();
});

export default router;
