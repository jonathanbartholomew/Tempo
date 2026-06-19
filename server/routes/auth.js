import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_EXPIRES_IN = '30d';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// GET /api/auth/me — returns current user including subscription_plan + trial_ends_at
router.get('/me', requireAuth, async (req, res) => {
  const [[user]] = await pool.query(
    'SELECT id, name, email, picture, subscription_plan, trial_ends_at FROM users WHERE id = ?',
    [req.userId]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await pool.query('SELECT id, auth_provider FROM users WHERE email = ?', [normalizedEmail]);
  if (existing.length) {
    if (existing[0].auth_provider === 'google') {
      return res.status(409).json({ error: 'This email is linked to a Google account. Sign in with Google instead.' });
    }
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [result] = await pool.query(
    "INSERT INTO users (email, name, picture, password_hash, auth_provider, subscription_plan, trial_ends_at) VALUES (?, ?, NULL, ?, 'email', 'trial', ?)",
    [normalizedEmail, name.trim(), passwordHash, trialEndsAt]
  );

  const token = signToken(result.insertId);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  res.status(201).json({
    token,
    expiresAt,
    user: { name: name.trim(), email: normalizedEmail, picture: null, subscription_plan: 'trial', trial_ends_at: trialEndsAt },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.query(
    'SELECT id, name, email, picture, password_hash, auth_provider, subscription_plan, trial_ends_at FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'No account found with that email.' });
  }

  const user = rows[0];

  if (user.auth_provider === 'google' || !user.password_hash) {
    return res.status(401).json({ error: 'This account uses Google sign-in. Please continue with Google.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = signToken(user.id);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  res.json({
    token,
    expiresAt,
    user: { name: user.name, email: user.email, picture: user.picture, subscription_plan: user.subscription_plan, trial_ends_at: user.trial_ends_at },
  });
});

export default router;
