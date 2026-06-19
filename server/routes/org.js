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
  if (allowedRoles.includes(role)) return role;
  // Also allow any custom role with is_admin = 1
  const [roleRows] = await pool.query('SELECT is_admin FROM org_roles WHERE org_id = ? AND name = ?', [orgId, role]);
  if (roleRows[0]?.is_admin) return role;
  res.status(403).json({ error: 'Insufficient permissions' });
  return null;
}

const DEFAULT_ROLES = [
  { name: 'org_admin',       color: '#3b82f6', is_admin: 1, permissions: ['manage_members','manage_teams','manage_roles','manage_goals','manage_achievements','assign_tasks','view_reports'] },
  { name: 'project_manager', color: '#8b5cf6', is_admin: 0, permissions: ['manage_teams','manage_goals','manage_achievements','assign_tasks','view_reports'] },
  { name: 'team_lead',       color: '#10b981', is_admin: 0, permissions: ['manage_teams','manage_goals','assign_tasks'] },
  { name: 'member',          color: '#6b7280', is_admin: 0, permissions: [] },
];

async function seedRoles(orgId) {
  for (const r of DEFAULT_ROLES) {
    await pool.query(
      'INSERT IGNORE INTO org_roles (org_id, name, color, is_admin, permissions) VALUES (?, ?, ?, ?, ?)',
      [orgId, r.name, r.color, r.is_admin, JSON.stringify(r.permissions)]
    );
  }
}

// ── Org ───────────────────────────────────────────────────────────────────────

// Create an organization (caller becomes org_admin)
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const [[userRow]] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [req.userId]);
  if (!userRow || !['team', 'enterprise'].includes(userRow.subscription_plan)) {
    return res.status(403).json({
      error: 'Creating an organization requires a Team or Enterprise plan.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

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

  await seedRoles(orgId);

  res.status(201).json({ id: orgId, name: name.trim(), slug });
});

// Get the current user's org membership (returns null if not in an org)
router.get('/me', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.name, o.slug, o.logo_url, om.role, om.org_xp
     FROM org_members om
     JOIN organizations o ON o.id = om.org_id
     WHERE om.user_id = ?
     LIMIT 1`,
    [req.userId]
  );
  if (!rows.length) return res.json(null);
  const member = rows[0];
  const [roleRows] = await pool.query(
    'SELECT is_admin FROM org_roles WHERE org_id = ? AND name = ?',
    [member.id, member.role]
  );
  const is_admin = member.role === 'org_admin' || !!roleRows[0]?.is_admin;
  res.json({ ...member, is_admin });
});

// Get org details + members (must be a member)
router.get('/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [[org]] = await pool.query(
    'SELECT id, name, slug, logo_url, created_at, allow_personal_accounts, allow_multi_org_members FROM organizations WHERE id = ?',
    [orgId]
  );
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const [members] = await pool.query(
    `SELECT om.user_id, om.role, om.joined_at, om.org_xp, u.name, u.email, u.picture,
            COUNT(at.id) AS tasks_completed
     FROM org_members om
     JOIN users u ON u.id = om.user_id
     LEFT JOIN assigned_tasks at ON at.org_id = ? AND at.assigned_to = om.user_id AND at.done = 1
     WHERE om.org_id = ?
     GROUP BY om.user_id, om.role, om.joined_at, om.org_xp, u.name, u.email, u.picture
     ORDER BY om.joined_at ASC`,
    [orgId, orgId]
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
  if (logo_url !== undefined) {
    if (logo_url) {
      const safeDataUri = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(logo_url);
      const safeHttps   = /^https:\/\//i.test(logo_url);
      if (!safeDataUri && !safeHttps) {
        return res.status(400).json({ error: 'logo_url must be an https URL or a PNG/JPG/GIF/WebP data URI' });
      }
    }
    updates.push('logo_url = ?');
    vals.push(logo_url || null);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(orgId);
  await pool.query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, vals);
  res.status(204).end();
});

// Update membership settings (admin only)
router.patch('/:orgId/settings', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const { allow_personal_accounts, allow_multi_org_members } = req.body;
  const updates = [];
  const vals = [];
  if (allow_personal_accounts !== undefined) { updates.push('allow_personal_accounts = ?'); vals.push(allow_personal_accounts ? 1 : 0); }
  if (allow_multi_org_members !== undefined) { updates.push('allow_multi_org_members = ?'); vals.push(allow_multi_org_members ? 1 : 0); }
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
  if (!role?.trim()) return res.status(400).json({ error: 'role is required' });
  const [valid] = await pool.query('SELECT id FROM org_roles WHERE org_id = ? AND name = ?', [orgId, role]);
  if (!valid.length) return res.status(400).json({ error: 'Invalid role for this organization' });

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

  const [validRole] = await pool.query('SELECT id FROM org_roles WHERE org_id = ? AND name = ?', [orgId, role]);
  if (!validRole.length) return res.status(400).json({ error: 'Invalid role for this organization' });

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

  // Check org membership settings
  const [[org]] = await pool.query(
    'SELECT allow_personal_accounts, allow_multi_org_members FROM organizations WHERE id = ?',
    [invite.org_id]
  );
  if (org) {
    const [[userRow]] = await pool.query(
      'SELECT subscription_plan FROM users WHERE id = ?',
      [req.userId]
    );
    if (!org.allow_personal_accounts && ['trial', 'personal_pro'].includes(userRow?.subscription_plan)) {
      return res.status(403).json({ error: 'This organization only accepts members on a Team or Enterprise plan.' });
    }
    if (!org.allow_multi_org_members) {
      const [otherOrgs] = await pool.query(
        'SELECT id FROM org_members WHERE user_id = ? AND org_id != ?',
        [req.userId, invite.org_id]
      );
      if (otherOrgs.length) {
        return res.status(403).json({ error: 'This organization does not allow members who belong to other organizations.' });
      }
    }
  }

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

// ── Roles ─────────────────────────────────────────────────────────────────────

// List roles for an org (seeds defaults on first call)
router.get('/:orgId/roles', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  // Seed defaults if this org has no roles yet
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM org_roles WHERE org_id = ?', [orgId]);
  if (cnt === 0) await seedRoles(orgId);

  const [rows] = await pool.query(
    'SELECT id, name, color, is_admin, permissions FROM org_roles WHERE org_id = ? ORDER BY is_admin DESC, created_at ASC',
    [orgId]
  );
  res.json(rows.map((r) => ({ ...r, permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions })));
});

// Create a role (admin only)
router.post('/:orgId/roles', async (req, res) => {
  const { orgId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const { name, color = '#6b7280', is_admin = 0, permissions = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const [result] = await pool.query(
    'INSERT INTO org_roles (org_id, name, color, is_admin, permissions) VALUES (?, ?, ?, ?, ?)',
    [orgId, name.trim(), color, is_admin ? 1 : 0, JSON.stringify(permissions)]
  );
  res.status(201).json({ id: result.insertId, name: name.trim(), color, is_admin: is_admin ? 1 : 0, permissions });
});

// Update a role (admin only)
router.patch('/:orgId/roles/:roleId', async (req, res) => {
  const { orgId, roleId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const updates = []; const vals = [];
  if (req.body.name?.trim()) { updates.push('name = ?'); vals.push(req.body.name.trim()); }
  if (req.body.color) { updates.push('color = ?'); vals.push(req.body.color); }
  if (req.body.is_admin !== undefined) { updates.push('is_admin = ?'); vals.push(req.body.is_admin ? 1 : 0); }
  if (req.body.permissions !== undefined) { updates.push('permissions = ?'); vals.push(JSON.stringify(req.body.permissions)); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(roleId, orgId);
  await pool.query(`UPDATE org_roles SET ${updates.join(', ')} WHERE id = ? AND org_id = ?`, vals);
  res.status(204).end();
});

// Delete a role (admin only — block if members are assigned it)
router.delete('/:orgId/roles/:roleId', async (req, res) => {
  const { orgId, roleId } = req.params;
  if (!await requireOrgRole(req, res, orgId, 'org_admin')) return;

  const [[role]] = await pool.query('SELECT name FROM org_roles WHERE id = ? AND org_id = ?', [roleId, orgId]);
  if (!role) return res.status(404).json({ error: 'Role not found' });

  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM org_members WHERE org_id = ? AND role = ?', [orgId, role.name]);
  if (cnt > 0) return res.status(409).json({ error: `${cnt} member(s) still have this role. Reassign them first.` });

  await pool.query('DELETE FROM org_roles WHERE id = ? AND org_id = ?', [roleId, orgId]);
  res.status(204).end();
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

// Sync user progress against all org achievements — evaluates & unlocks
router.post('/:orgId/achievements/sync', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member' });

  const { level = 0, tasksCompleted = 0, totalXp = 0, streak = 0, focusMinutes = 0 } = req.body;

  const [achievements] = await pool.query(
    'SELECT * FROM corporate_achievements WHERE org_id = ? AND active = TRUE',
    [orgId]
  );
  if (!achievements.length) return res.json({ unlocked: [] });

  const ids = achievements.map((a) => a.id);
  const [existing] = await pool.query(
    'SELECT achievement_id, unlocked_at FROM corporate_achievement_progress WHERE user_id = ? AND achievement_id IN (?)',
    [req.userId, ids]
  );
  const alreadyUnlockedSet = new Set(
    existing.filter((r) => r.unlocked_at != null).map((r) => r.achievement_id)
  );

  const criteriaValues = {
    level,
    tasks_completed: tasksCompleted,
    focus_hours: Math.floor(focusMinutes / 60),
    streak_days: streak,
    xp_total: totalXp,
  };

  const newlyUnlocked = [];
  const now = new Date();

  // Build rows for a single bulk UPSERT — avoids N round-trips to the DB
  const upsertRows = achievements.map((a) => {
    const value = criteriaValues[a.criteria_type] ?? 0;
    const alreadyDone = alreadyUnlockedSet.has(a.id);
    const shouldUnlock = !alreadyDone && value >= a.criteria_value;
    if (shouldUnlock) newlyUnlocked.push(a);
    return [req.userId, a.id, value, shouldUnlock ? now : null];
  });

  await pool.query(
    `INSERT INTO corporate_achievement_progress (user_id, achievement_id, progress, unlocked_at)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       progress = GREATEST(progress, VALUES(progress)),
       unlocked_at = COALESCE(unlocked_at, VALUES(unlocked_at))`,
    [upsertRows]
  );

  // Award org XP for newly unlocked achievements
  if (newlyUnlocked.length) {
    const orgXpGained = newlyUnlocked.reduce((sum, a) => sum + (a.xp_reward || 0), 0);
    if (orgXpGained > 0) {
      await pool.query(
        'UPDATE org_members SET org_xp = org_xp + ? WHERE org_id = ? AND user_id = ?',
        [orgXpGained, orgId, req.userId]
      );
    }
  }

  res.json({ unlocked: newlyUnlocked });
});

// ── Team goals ────────────────────────────────────────────────────────────────

// List goals for a team
router.get('/:orgId/teams/:teamId/goals', async (req, res) => {
  const { orgId, teamId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member of this organization' });

  const [teamCheck] = await pool.query('SELECT id FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId]);
  if (!teamCheck.length) return res.status(404).json({ error: 'Team not found' });

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

  const [teamCheck] = await pool.query('SELECT id FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId]);
  if (!teamCheck.length) return res.status(404).json({ error: 'Team not found' });

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

// Update a team goal
router.patch('/:orgId/teams/:teamId/goals/:goalId', async (req, res) => {
  const { orgId, teamId, goalId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member' });

  const [teamCheck] = await pool.query('SELECT id FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId]);
  if (!teamCheck.length) return res.status(404).json({ error: 'Team not found' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    const [lead] = await pool.query("SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'", [teamId, req.userId]);
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const allowed = ['name', 'description', 'target_value', 'period_start', 'period_end', 'reward_description'];
  const updates = []; const vals = [];
  for (const f of allowed) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(goalId, teamId);
  await pool.query(`UPDATE team_goals SET ${updates.join(', ')} WHERE id = ? AND team_id = ?`, vals);
  res.status(204).end();
});

// Delete a team goal
router.delete('/:orgId/teams/:teamId/goals/:goalId', async (req, res) => {
  const { orgId, teamId, goalId } = req.params;
  const orgRole = await getOrgRole(orgId, req.userId);
  if (!orgRole) return res.status(403).json({ error: 'Not a member' });

  const [teamCheck] = await pool.query('SELECT id FROM teams WHERE id = ? AND org_id = ?', [teamId, orgId]);
  if (!teamCheck.length) return res.status(404).json({ error: 'Team not found' });

  if (!['org_admin', 'project_manager'].includes(orgRole)) {
    const [lead] = await pool.query("SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'", [teamId, req.userId]);
    if (!lead.length) return res.status(403).json({ error: 'Insufficient permissions' });
  }
  await pool.query('DELETE FROM team_goal_contributions WHERE goal_id = ?', [goalId]);
  await pool.query('DELETE FROM team_goals WHERE id = ? AND team_id = ?', [goalId, teamId]);
  res.status(204).end();
});

// Get all active goals for teams the current user belongs to
router.get('/:orgId/my-teams/goals', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member' });

  const [myTeams] = await pool.query(
    'SELECT team_id FROM team_members WHERE user_id = ?',
    [req.userId]
  );
  if (!myTeams.length) return res.json([]);

  const teamIds = myTeams.map((t) => t.team_id);
  const [goals] = await pool.query(
    `SELECT g.*, t.name AS team_name, t.color AS team_color
     FROM team_goals g
     JOIN teams t ON t.id = g.team_id
     WHERE g.team_id IN (?) AND g.period_end >= CURDATE()
     ORDER BY g.period_end ASC`,
    [teamIds]
  );

  // Attach my contribution to each goal
  const goalIds = goals.map((g) => g.id);
  let myContribs = [];
  if (goalIds.length) {
    [myContribs] = await pool.query(
      'SELECT goal_id, value FROM team_goal_contributions WHERE user_id = ? AND goal_id IN (?)',
      [req.userId, goalIds]
    );
  }
  const contribMap = Object.fromEntries(myContribs.map((c) => [c.goal_id, c.value]));
  res.json(goals.map((g) => ({ ...g, myContribution: contribMap[g.id] ?? 0 })));
});

// Contribute to a team goal (client reports stats; server aggregates + checks completion)
router.post('/:orgId/goals/:goalId/contribute', async (req, res) => {
  const { orgId, goalId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member' });

  const [goalRows] = await pool.query(
    'SELECT g.* FROM team_goals g JOIN teams t ON t.id = g.team_id WHERE g.id = ? AND t.org_id = ?',
    [goalId, orgId]
  );
  if (!goalRows.length) return res.status(404).json({ error: 'Goal not found' });
  const goal = goalRows[0];

  let value = 0;
  if (goal.criteria_type === 'tasks_completed') {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM assigned_tasks
       WHERE assigned_to = ? AND done = TRUE AND done_at >= ? AND done_at < DATE_ADD(?, INTERVAL 1 DAY)`,
      [req.userId, goal.period_start, goal.period_end]
    );
    value = rows[0].cnt;
  } else if (goal.criteria_type === 'focus_hours') {
    value = Math.floor((req.body.focusMinutes || 0) / 60);
  } else if (goal.criteria_type === 'xp_total') {
    value = req.body.totalXp || 0;
  }

  // Upsert contribution
  await pool.query(
    `INSERT INTO team_goal_contributions (goal_id, user_id, value) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = ?`,
    [goalId, req.userId, value, value]
  );

  // Re-aggregate current_value
  const [[{ total }]] = await pool.query(
    'SELECT COALESCE(SUM(value), 0) AS total FROM team_goal_contributions WHERE goal_id = ?',
    [goalId]
  );

  const wasComplete = goal.completed_at != null;
  const nowComplete = total >= goal.target_value;

  await pool.query('UPDATE team_goals SET current_value = ? WHERE id = ?', [total, goalId]);

  if (!wasComplete && nowComplete) {
    await pool.query('UPDATE team_goals SET completed_at = NOW() WHERE id = ?', [goalId]);
    // Fire celebration
    const [teamRows] = await pool.query('SELECT name FROM teams WHERE id = ?', [goal.team_id]);
    const teamName = teamRows[0]?.name || 'Your team';
    await pool.query(
      `INSERT INTO org_celebrations (org_id, team_id, event_type, title, description, icon)
       VALUES (?, ?, 'goal_completed', ?, ?, '🏁')`,
      [orgId, goal.team_id, `Team goal achieved!`, `${teamName} completed "${goal.name}"${goal.reward_description ? ` — ${goal.reward_description}` : ''}`]
    );
  }

  res.json({ current_value: total, completed: nowComplete });
});

// ── Celebrations feed ─────────────────────────────────────────────────────────

router.get('/:orgId/celebrations', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member' });

  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name, u.picture AS user_picture, t.name AS team_name
     FROM org_celebrations c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN teams t ON t.id = c.team_id
     WHERE c.org_id = ?
     ORDER BY c.created_at DESC
     LIMIT 50`,
    [orgId]
  );
  res.json(rows);
});

router.post('/:orgId/celebrations', async (req, res) => {
  const { orgId } = req.params;
  const role = await getOrgRole(orgId, req.userId);
  if (!role) return res.status(403).json({ error: 'Not a member' });

  const { event_type, title, description = '', icon = '🎉' } = req.body;
  if (!event_type || !title) return res.status(400).json({ error: 'event_type and title required' });

  await pool.query(
    `INSERT INTO org_celebrations (org_id, user_id, event_type, title, description, icon)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, req.userId, event_type, title, description, icon]
  );
  res.status(201).end();
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
