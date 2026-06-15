import { pool } from '../db.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const tokenCache = new Map(); // accessToken -> { userId, expiresAt }

async function findOrCreateUser({ email, name, picture }) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) return rows[0].id;
  const [result] = await pool.query(
    'INSERT INTO users (email, name, picture) VALUES (?, ?, ?)',
    [email, name || null, picture || null]
  );
  return result.insertId;
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.userId = cached.userId;
    return next();
  }

  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return res.status(401).json({ error: 'Invalid access token' });
    const profile = await resp.json();
    if (!profile.email) return res.status(401).json({ error: 'Invalid access token' });

    const userId = await findOrCreateUser(profile);
    tokenCache.set(token, { userId, expiresAt: Date.now() + CACHE_TTL_MS });
    req.userId = userId;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err);
    res.status(500).json({ error: 'Auth verification failed' });
  }
}
