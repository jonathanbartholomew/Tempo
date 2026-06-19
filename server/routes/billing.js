import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const VALID_PLANS = ['personal_pro', 'team', 'enterprise'];

// POST /api/billing/subscribe
// Fake checkout — sets subscription_plan and clears trial_ends_at.
// Replace this handler with real Stripe webhook logic later.
router.post('/subscribe', async (req, res) => {
  const { plan } = req.body;

  if (!VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be personal_pro, team, or enterprise.' });
  }

  await pool.query(
    'UPDATE users SET subscription_plan = ?, trial_ends_at = NULL WHERE id = ?',
    [plan, req.userId]
  );

  const [[user]] = await pool.query(
    'SELECT id, name, email, picture, subscription_plan, trial_ends_at FROM users WHERE id = ?',
    [req.userId]
  );

  res.json({ success: true, user });
});

export default router;
