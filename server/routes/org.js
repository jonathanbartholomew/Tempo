import { Router } from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function getOrgRole(orgId, userId) {
  const [rows] = await pool.query(
    'SELECT role FROM org_members WHERE org_id = ? AND user_id = ?',
    [orgId, userId]
  );
  return rows[0]?.role ?? null;
}

async function requireOrgRole(req, res, orgId, ...allowedRoles) {
  const role = await getOrgRole(orgId, req.userId);
  if (!role) { res.status(403).json({ error: 'Not a member of this organization' }); return null; }
  if (!allowedRoles.includes(role)) { res.status(403).json({ error: 'Insufficient permissions' }); return null; }
  return role;
}

// ── Org ───────────────────────────────────────────────────────────────────────

// Create an organization (caller becomes org_admin)
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  let slug = slugify(name.trim());
  // ensure unique slug
  const [existing] = await pool.query('SELECT id FROM organizations WHERE slug LIKE ?', [`${slug}%`]);
  if (existing.length) slug = `${slug}-${existing.length}`;

  const [result] = await pool.query(
    'INSERT INTO organizations (name, slug, created_by) VALUES (?, ?, ?)',
    [name.trim(), slug, req.userId]
  );
  const orgId = result.insertId;

  await pool.query(
    'INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)',
    [orgId, req.userId, 'org_admin']
  );

  res.status(201).json({ id: orgId, name: name.trim(), slug });
});

// Get the current user's org membership (returns null if not in an org)
router.get('/me', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.name, o.slug, o.logo_url, om.role
     FROM org_members om
     JOIN organizations o ON o.id = om.org_id
     WHERE om.user_id = ?
     LIMIT 1`,
    [req.userId]
  );
  if (!rows.length) return res.json(null);
  res.json(rows[0]);
});

// Get org details + members (must be a member)
router.get('/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [[org]] = await pool.query('SELECT id, name, slug, logo_url, created_at FROM organizations WHERE id = ?', [orgId]);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const [members] = await pool.query(
    `SELECT om.user_id, om.role, om.joined_at, u.name, u.email, u.picture
     FROM org_members om JOIN users u ON u.id = om.user_id
     WHERE om.org_id = ?
     ORDER BY om.joined_at ASC`,
    [orgId]
  );

  res.json({ ...org, members, myRole: role });
});

// Update org (admin only)
router.patch('/:orgId', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const { name, logo_url } = req.body;
  const updates = [];
  const vals = [];
  if (name?.trim()) { updates.push('name = ?'); vals.push(name.trim()); }
  if (logo_url !== undefined) { updates.push('logo_url = ?'); vals.push(logo_url || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(orgId);
  await pool.query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, vals);
  res.status(204).end();
});

// ── Members ───────────────────────────────────────────────────────────────────

// Change a member's role (admin only)
router.patch('/:orgId/members/:userId/role', async (req, res) => {
  const { orgId, userId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const { role } = req.body;
  const valid = ['org_admin', 'project_manager', 'team_lead', 'member'];
  if (!valid.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  await pool.query('UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?', [role, orgId, userId]);
  res.status(204).end();
});

// Remove a member (admin only, cannot remove self if last admin)
router.delete('/:orgId/members/:userId', async (req, res) => {
  const { orgId, userId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const [admins] = await pool.query(
    "SELECT user_id FROM org_members WHERE org_id = ? AND role = 'org_admin'",
    [orgId]
  );
  if (admins.length === 1 && String(admins[0].user_id) === String(userId)) {
    return res.status(400).json({ error: 'Cannot remove the last admin' });
  }

  await pool.query('DELETE FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
  await pool.query(
    'DELETE tm FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE t.org_id = ? AND tm.user_id = ?',
    [orgId, userId]
  );
  res.status(204).end();
});

// ── Invites ───────────────────────────────────────────────────────────────────

// Send an invite (admin only)
router.post('/:orgId/invites', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const { email, role = 'member' } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: 'email is required' });

  const valid = ['project_manager', 'team_lead', 'member'];
  if (!valid.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  // Check if already a member
  const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
  if (users.length) {
    const [mem] = await pool.query('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, users[0].id]);
    if (mem.length) return res.status(409).json({ error: 'User is already a member' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Upsert — re-invite replaces the old token
  await pool.query(
    `INSERT INTO org_invites (org_id, email, role, token, invited_by, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE token = VALUES(token), role = VALUES(role),
       invited_by = VALUES(invited_by), expires_at = VALUES(expires_at), accepted_at = NULL`,
    [orgId, email.trim().toLowerCase(), role, token, req.userId, expiresAt]
  );

  const [org] = await pool.query('SELECT name FROM organizations WHERE id = ?', [orgId]);
  res.status(201).json({ token, orgName: org[0]?.name, email: email.trim().toLowerCase() });
});

// List pending invites (admin only)
router.get('/:orgId/invites', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const [rows] = await pool.query(
    `SELECT i.id, i.email, i.role, i.token, i.expires_at, i.accepted_at,
            u.name AS invited_by_name
     FROM org_invites i
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.org_id = ?
     ORDER BY i.created_at DESC`,
    [orgId]
  );
  res.json(rows);
});

// Accept an invite (auth required — user must be logged in)
router.post('/invite/:token/accept', async (req, res) => {
  const { token } = req.params;
  const [rows] = await pool.query(
    'SELECT * FROM org_invites WHERE token = ?',
    [token]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invite not found' });
  const invite = rows[0];
  if (invite.accepted_at) return res.status(410).json({ error: 'Invite already accepted' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'Invite expired' });

  // Verify the logged-in user's email matches the invite
  const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.userId]);
  if (!users.length || users[0].email.toLowerCase() !== invite.email.toLowerCase()) {
    return res.status(403).json({ error: 'This invite was sent to a different email address' });
  }

  // Add to org (ignore if already a member)
  await pool.query(
    'INSERT IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)',
    [invite.org_id, req.userId, invite.role]
  );

  await pool.query('UPDATE org_invites SET accepted_at = NOW() WHERE token = ?', [token]);

  res.status(200).json({ orgId: invite.org_id, role: invite.role });
});

// ── Teams ─────────────────────────────────────────────────────────────────────

// List teams in an org
router.get('/:orgId/teams', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [teams] = await pool.query(
    'SELECT id, name, color, created_at FROM teams WHERE org_id = ? ORDER BY created_at ASC',
    [orgId]
  );

  // For each team, attach members
  const teamIds = teams.map((t) => t.id);
  let members = [];
  if (teamIds.length) {
    [members] = await pool.query(
      `SELECT tm.team_id, tm.user_id, tm.role, u.name, u.email, u.picture
       FROM team_members tm JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id IN (?)`,
      [teamIds]
    );
  }

  const membersByTeam = {};
  for (const m of members) {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
    membersByTeam[m.team_id].push(m);
  }

  res.json(teams.map((t) => ({ ...t, members: membersByTeam[t.id] ?? [] })));
});

// Create a team (admin or project_manager)
router.post('/:orgId/teams', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin', 'project_manager')) return;

  const { name, color = '#6366f1' } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const [result] = await pool.query(
    'INSERT INTO teams (org_id, name, color, created_by) VALUES (?, ?, ?, ?)',
    [orgId, name.trim(), color, req.userId]
  );
  res.status(201).json({ id: result.insertId, name: name.trim(), color, members: [] });
});

// Update a team (admin, pm, or that team's lead)
router.patch('/:orgId/teams/:teamId', async (req, res) => {
  const { orgId, teamId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member of this organization' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    // Allow team_lead only if they lead this specific team
    const [lead] = await pool.query(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'",
      [teamId, req.userId]
    );
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { name, color } = req.body;
  const updates = [];
  const vals = [];
  if (name?.trim()) { updates.push('name = ?'); vals.push(name.trim()); }
  if (color) { updates.push('color = ?'); vals.push(color); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(teamId, orgId);
  await pool.query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ? AND org_id = ?`, vals);
  res.status(204).end();
});

// Delete a team (admin only)
router.delete('/:orgId/teams/:teamId', async (req, res) => {
  const { orgId, teamId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  await pool.query('DELETE FROM team_members WHERE team_id = ?', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId]);
  res.status(204).end();
});

// Add a member to a team (admin, pm, or team lead)
router.post('/:orgId/teams/:teamId/members', async (req, res) => {
  const { orgId, teamId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member of this organization' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    const [lead] = await pool.query(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'",
      [teamId, req.userId]
    );
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { userId, role = 'member' } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  // Must be an org member first
  const [orgMem] = await pool.query('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
  if (!orgMem.length) return res.status(400).json({ error: 'User is not a member of this organization' });

  await pool.query(
    'INSERT IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
    [teamId, userId, role]
  );
  res.status(201).end();
});

// Remove a member from a team (admin, pm, or team lead)
router.delete('/:orgId/teams/:teamId/members/:userId', async (req, res) => {
  const { orgId, teamId, userId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member of this organization' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    const [lead] = await pool.query(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'",
      [teamId, req.userId]
    );
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }

  await pool.query('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
  res.status(204).end();
});

// ── Corporate achievements ────────────────────────────────────────────────────

// List achievements for an org (all members can see)
router.get('/:orgId/achievements', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [achievements] = await pool.query(
    'SELECT * FROM corporate_achievements WHERE org_id = ? AND active = TRUE ORDER BY created_at ASC',
    [orgId]
  );

  // Attach this user's progress
  const ids = achievements.map((a) => a.id);
  let progress = [];
  if (ids.length) {
    [progress] = await pool.query(
      'SELECT achievement_id, progress, unlocked_at FROM corporate_achievement_progress WHERE user_id = ? AND achievement_id IN (?)',
      [req.userId, ids]
    );
  }
  const progressMap = Object.fromEntries(progress.map((p) => [p.achievement_id, p]));

  res.json(achievements.map((a) => ({
    ...a,
    myProgress: progressMap[a.id]?.progress ?? 0,
    unlockedAt: progressMap[a.id]?.unlocked_at ?? null,
  })));
});

// Create an achievement (admin only)
router.post('/:orgId/achievements', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const {
    name, description = '', icon = '🏆',
    xp_reward = 0, reward_type = 'none', reward_value = null,
    criteria_type, criteria_value, criteria_period = 'all_time',
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  if (!criteria_type || !criteria_value) return res.status(400).json({ error: 'criteria_type and criteria_value are required' });

  const [result] = await pool.query(
    `INSERT INTO corporate_achievements
     (org_id, name, description, icon, xp_reward, reward_type, reward_value,
      criteria_type, criteria_value, criteria_period, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orgId, name.trim(), description, icon, xp_reward, reward_type, reward_value,
     criteria_type, criteria_value, criteria_period, req.userId]
  );
  res.status(201).json({ id: result.insertId });
});

// Update an achievement (admin only)
router.patch('/:orgId/achievements/:achievementId', async (req, res) => {
  const { orgId, achievementId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const fields = ['name', 'description', 'icon', 'xp_reward', 'reward_type', 'reward_value',
                  'criteria_type', 'criteria_value', 'criteria_period', 'active'];
  const updates = [];
  const vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(achievementId, orgId);
  await pool.query(
    `UPDATE corporate_achievements SET ${updates.join(', ')} WHERE id = ? AND org_id = ?`,
    vals
  );
  res.status(204).end();
});

// Delete an achievement (admin only — soft delete via active=false)
router.delete('/:orgId/achievements/:achievementId', async (req, res) => {
  const { orgId, achievementId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  await pool.query(
    'UPDATE corporate_achievements SET active = FALSE WHERE id = ? AND org_id = ?',
    [achievementId, orgId]
  );
  res.status(204).end();
});

// ── Team goals ────────────────────────────────────────────────────────────────

// List goals for a team
router.get('/:orgId/teams/:teamId/goals', async (req, res) => {
  const { orgId, teamId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [goals] = await pool.query(
    'SELECT * FROM team_goals WHERE team_id = ? ORDER BY period_start DESC',
    [teamId]
  );
  res.json(goals);
});

// Create a team goal (admin, pm, or team lead)
router.post('/:orgId/teams/:teamId/goals', async (req, res) => {
  const { orgId, teamId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member of this organization' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    const [lead] = await pool.query(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'",
      [teamId, req.userId]
    );
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { name, description = '', criteria_type, target_value, period_start, period_end, reward_description = null } = req.body;
  if (!name?.trim() || !criteria_type || !target_value || !period_start || !period_end) {
    return res.status(400).json({ error: 'name, criteria_type, target_value, period_start, period_end are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO team_goals (team_id, name, description, criteria_type, target_value, period_start, period_end, reward_description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [teamId, name.trim(), description, criteria_type, target_value, period_start, period_end, reward_description, req.userId]
  );
  res.status(201).json({ id: result.insertId });
});

// ── Assigned tasks (PM management) ───────────────────────────────────────────

// List all assigned tasks in an org — PM/admin view
router.get('/:orgId/assigned-tasks', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin', 'project_manager')) return;

  const [rows] = await pool.query(
    `SELECT at.*,
            assignee.name AS assigned_to_name, assignee.picture AS assigned_to_picture,
            creator.name AS assigned_by_name
     FROM assigned_tasks at
     JOIN users assignee ON assignee.id = at.assigned_to
     JOIN users creator  ON creator.id  = at.assigned_by
     WHERE at.org_id = ?
     ORDER BY at.due_date ASC, at.created_at ASC`,
    [orgId]
  );
  res.json(rows);
});

// Create + assign a task (PM/admin only)
router.post('/:orgId/assigned-tasks', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin', 'project_manager')) return;

  const { title, description = '', assigned_to, due_date, priority = 'medium' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!assigned_to) return res.status(400).json({ error: 'assigned_to is required' });
  if (!due_date) return res.status(400).json({ error: 'due_date is required' });

  // Must be an org member
  const [mem] = await pool.query('SELECT id FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, assigned_to]);
  if (!mem.length) return res.status(400).json({ error: 'Assignee is not a member of this organization' });

  const id = crypto.randomBytes(18).toString('hex');
  await pool.query(
    `INSERT INTO assigned_tasks (id, org_id, title, description, assigned_to, assigned_by, due_date, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, orgId, title.trim(), description, assigned_to, req.userId, due_date, priority]
  );
  res.status(201).json({ id });
});

// Update an assigned task (PM/admin — only creator or any admin)
router.patch('/:orgId/assigned-tasks/:taskId', async (req, res) => {
  const { orgId, taskId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin', 'project_manager')) return;

  const fields = ['title', 'description', 'assigned_to', 'due_date', 'priority'];
  const updates = [];
  const vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(taskId, orgId);
  await pool.query(`UPDATE assigned_tasks SET ${updates.join(', ')} WHERE id = ? AND org_id = ?`, vals);
  res.status(204).end();
});

// Delete an assigned task (PM/admin)
router.delete('/:orgId/assigned-tasks/:taskId', async (req, res) => {
  const { orgId, taskId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin', 'project_manager')) return;

  await pool.query('DELETE FROM assigned_tasks WHERE id = ? AND org_id = ?', [taskId, orgId]);
  res.status(204).end();
});

export default router;
