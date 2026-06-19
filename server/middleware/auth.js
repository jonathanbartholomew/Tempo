import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const tokenCache = new Map(); // accessToken -> { userId, expiresAt }

// Prune expired entries every 10 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tokenCache) {
    if (val.expiresAt <= now) tokenCache.delete(key);
  }
}, 10 * 60 * 1000).unref();

async function findOrCreateUser({ email, name, picture }) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) return rows[0].id;
  const [result] = await pool.query(
    "INSERT INTO users (email, name, picture, auth_provider) VALUES (?, ?, ?, 'google')",
    [email, name || null, picture || null]
  );
  return result.insertId;
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  // Check cache first (works for both token types)
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.userId = cached.userId;
    return next();
  }

  // Try our own JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = decoded.exp * 1000;
    tokenCache.set(token, { userId: decoded.userId, expiresAt });
    req.userId = decoded.userId;
    return next();
  } catch {
    // Not our JWT — fall through to Google validation
  }

  // Google token validation
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
