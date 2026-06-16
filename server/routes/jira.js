import { Router } from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const CLIENT_ID = process.env.JIRA_CLIENT_ID;
const CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET;
const CALLBACK_URL = process.env.JIRA_CALLBACK_URL || 'http://localhost:3001/api/jira/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5180';
const SCOPES = 'read:jira-work write:jira-work read:jira-user offline_access';

// state → { userId, expiresAt }
const stateStore = new Map();

function pruneStates() {
  const now = Date.now();
  for (const [key, val] of stateStore) {
    if (val.expiresAt < now) stateStore.delete(key);
  }
}

// GET /api/jira/auth — authenticated: returns the Atlassian auth URL
router.get('/auth', requireAuth, (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { userId: req.userId, expiresAt: Date.now() + 10 * 60 * 1000 });
  pruneStates();

  const url = new URL('https://auth.atlassian.com/authorize');
  url.searchParams.set('audience', 'api.atlassian.com');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('prompt', 'consent');

  res.json({ url: url.toString() });
});

// GET /api/jira/callback — public: Atlassian redirects here after user approves
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(`${FRONTEND_URL}?jira=error`);
  }

  const stored = stateStore.get(state);
  if (!stored || stored.expiresAt < Date.now()) {
    return res.redirect(`${FRONTEND_URL}?jira=error`);
  }
  stateStore.delete(state);
  const { userId } = stored;

  try {
    const tokenRes = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    const { access_token, refresh_token, expires_in } = await tokenRes.json();
    const tokenExpiresAt = Date.now() + expires_in * 1000;

    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
    });
    if (!resourcesRes.ok) throw new Error('Failed to get accessible resources');
    const resources = await resourcesRes.json();
    if (!resources.length) throw new Error('No Jira sites found');

    const site = resources[0];
    const { id: cloudId, url: siteUrl, name: siteName } = site;

    await pool.query(
      `INSERT INTO jira_connections (user_id, cloud_id, site_url, site_name, access_token, refresh_token, token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         site_url = VALUES(site_url),
         site_name = VALUES(site_name),
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         token_expires_at = VALUES(token_expires_at),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, cloudId, siteUrl, siteName, access_token, refresh_token || '', tokenExpiresAt]
    );

    res.redirect(`${FRONTEND_URL}?jira=connected`);
  } catch (err) {
    console.error('Jira OAuth callback error:', err);
    res.redirect(`${FRONTEND_URL}?jira=error`);
  }
});

async function getConnection(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM jira_connections WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
    [userId]
  );
  if (!rows.length) return null;

  let conn = rows[0];

  if (conn.token_expires_at - Date.now() < 5 * 60 * 1000 && conn.refresh_token) {
    try {
      const refreshRes = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: conn.refresh_token,
        }),
      });
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        const newExpiry = Date.now() + refreshed.expires_in * 1000;
        await pool.query(
          'UPDATE jira_connections SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [refreshed.access_token, refreshed.refresh_token || conn.refresh_token, newExpiry, conn.id]
        );
        conn = { ...conn, access_token: refreshed.access_token, token_expires_at: newExpiry };
      }
    } catch (err) {
      console.error('Jira token refresh failed:', err);
    }
  }

  return conn;
}

// GET /api/jira/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const conn = await getConnection(req.userId);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: true, siteName: conn.site_name, siteUrl: conn.site_url });
  } catch (err) {
    console.error('Jira status error:', err);
    res.status(500).json({ error: 'Failed to get Jira status' });
  }
});

// GET /api/jira/issues
router.get('/issues', requireAuth, async (req, res) => {
  try {
    const conn = await getConnection(req.userId);
    if (!conn) return res.status(400).json({ error: 'Jira not connected' });

    const meRes = await fetch(
      `https://api.atlassian.com/ex/jira/${conn.cloud_id}/rest/api/3/myself`,
      { headers: { Authorization: `Bearer ${conn.access_token}`, Accept: 'application/json' } }
    );
    const meText = await meRes.text();
    const me = meRes.ok ? JSON.parse(meText) : null;

    const myAccountId = me?.accountId;

    const jql = myAccountId
      ? `assignee = "${myAccountId}" AND statusCategory != Done ORDER BY updated DESC`
      : 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC';

    const apiRes = await fetch(
      `https://api.atlassian.com/ex/jira/${conn.cloud_id}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${conn.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jql,
          fields: ['summary', 'status', 'priority', 'issuetype', 'project', 'assignee', 'timetracking', 'updated'],
          maxResults: 50,
        }),
      }
    );

    if (!apiRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch issues' });
    }
    const data = await apiRes.json();

    const issues = (data.issues || []).map((issue) => ({
      key: issue.key,
      id: issue.id,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      statusCategory: issue.fields.status?.statusCategory?.key,
      priority: issue.fields.priority?.name,
      type: issue.fields.issuetype?.name,
      project: issue.fields.project?.name,
      projectKey: issue.fields.project?.key,
      url: `${conn.site_url}/browse/${issue.key}`,
      updated: issue.fields.updated,
      timeSpentSeconds: issue.fields.timetracking?.timeSpentSeconds || 0,
      originalEstimateSeconds: issue.fields.timetracking?.originalEstimateSeconds || 0,
    }));

    res.json({ issues, siteUrl: conn.site_url, siteName: conn.site_name });
  } catch (err) {
    console.error('Jira issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// POST /api/jira/worklog
router.post('/worklog', requireAuth, async (req, res) => {
  try {
    const conn = await getConnection(req.userId);
    if (!conn) return res.status(400).json({ error: 'Jira not connected' });

    const { issueKey, minutes, comment } = req.body;
    if (!issueKey || !minutes) return res.status(400).json({ error: 'issueKey and minutes required' });

    const apiRes = await fetch(
      `https://api.atlassian.com/ex/jira/${conn.cloud_id}/rest/api/3/issue/${issueKey}/worklog`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${conn.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          timeSpentSeconds: Math.round(minutes * 60),
          comment: {
            type: 'doc',
            version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text: comment || 'Logged via Tempo' }] }],
          },
        }),
      }
    );

    if (!apiRes.ok) return res.status(apiRes.status).json({ error: 'Failed to log work' });
    res.json({ success: true });
  } catch (err) {
    console.error('Jira worklog error:', err);
    res.status(500).json({ error: 'Failed to log work' });
  }
});

// GET /api/jira/transitions/:key
router.get('/transitions/:key', requireAuth, async (req, res) => {
  try {
    const conn = await getConnection(req.userId);
    if (!conn) return res.status(400).json({ error: 'Jira not connected' });

    const apiRes = await fetch(
      `https://api.atlassian.com/ex/jira/${conn.cloud_id}/rest/api/3/issue/${req.params.key}/transitions`,
      { headers: { Authorization: `Bearer ${conn.access_token}`, Accept: 'application/json' } }
    );

    if (!apiRes.ok) return res.status(apiRes.status).json({ error: 'Failed to get transitions' });
    const data = await apiRes.json();
    res.json({ transitions: (data.transitions || []).map((t) => ({ id: t.id, name: t.name })) });
  } catch (err) {
    console.error('Jira transitions error:', err);
    res.status(500).json({ error: 'Failed to get transitions' });
  }
});

// POST /api/jira/transition/:key
router.post('/transition/:key', requireAuth, async (req, res) => {
  try {
    const conn = await getConnection(req.userId);
    if (!conn) return res.status(400).json({ error: 'Jira not connected' });

    const { transitionId } = req.body;
    if (!transitionId) return res.status(400).json({ error: 'transitionId required' });

    const apiRes = await fetch(
      `https://api.atlassian.com/ex/jira/${conn.cloud_id}/rest/api/3/issue/${req.params.key}/transitions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${conn.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition: { id: transitionId } }),
      }
    );

    if (!apiRes.ok) return res.status(apiRes.status).json({ error: 'Failed to transition issue' });
    res.json({ success: true });
  } catch (err) {
    console.error('Jira transition error:', err);
    res.status(500).json({ error: 'Failed to transition issue' });
  }
});

// DELETE /api/jira/disconnect
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM jira_connections WHERE user_id = ?', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Jira disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
