import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = Router();
const JWT_EXPIRES_IN = '30d';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

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

  const [result] = await pool.query(
    "INSERT INTO users (email, name, picture, password_hash, auth_provider) VALUES (?, ?, NULL, ?, 'email')",
    [normalizedEmail, name.trim(), passwordHash]
  );

  const token = signToken(result.insertId);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  res.status(201).json({
    token,
    expiresAt,
    user: { name: name.trim(), email: normalizedEmail, picture: null },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.query(
    'SELECT id, name, email, picture, password_hash, auth_provider FROM users WHERE email = ?',
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
    user: { name: user.name, email: user.email, picture: user.picture },
  });
});

export default router;
