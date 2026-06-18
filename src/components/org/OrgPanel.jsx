import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, X, Copy, Check, ChevronDown, Trash2,
  UserPlus, Users, Crown, Loader2, RefreshCw,
} from 'lucide-react';
import Avatar from '../ui/Avatar';

const ROLE_LABELS = {
  org_admin: 'Admin',
  project_manager: 'Project Manager',
  team_lead: 'Team Lead',
  member: 'Member',
};

const ROLE_COLORS = {
  org_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  project_manager: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  team_lead: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  member: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const TEAM_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

function RoleBadge({ role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || ROLE_COLORS.member}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function OrgPanel({ auth, org, orgActions }) {
  const isAdmin = org?.role === 'org_admin';
  const canManageTeams = ['org_admin', 'project_manager', 'team_lead'].includes(org?.role);
  const canSeeTeams = org?.role !== 'member';

  // Detailed data (members, teams, invites) fetched separately
  const [details, setDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create org form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  // Create team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Members dropdown
  const [showMembers, setShowMembers] = useState(false);

  // Team member assignment
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [addingMemberTo, setAddingMemberTo] = useState(null);

  const loadDetails = useCallback(async () => {
    if (!org?.id) return;
    setDetailsLoading(true);
    try {
      const [det, tms] = await Promise.all([
        orgActions.getOrgDetails(org.id),
        orgActions.getTeams(org.id),
      ]);
      setDetails(det);
      setTeams(tms);
      if (isAdmin) {
        const inv = await orgActions.getInvites(org.id);
        setInvites(inv.filter((i) => !i.accepted_at));
      }
    } catch {
      // silent — details just won't show
    } finally {
      setDetailsLoading(false);
    }
  }, [org?.id, isAdmin]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  async function handleCreateOrg(e) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await orgActions.createOrg(orgName.trim());
      setOrgName('');
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteResult(null);
    try {
      const result = await orgActions.inviteMember(org.id, inviteEmail.trim(), inviteRole);
      const link = `${window.location.origin}${window.location.pathname}?invite=${result.token}`;
      setInviteResult({ ...result, link });
      setInviteEmail('');
      loadDetails();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(userId, newRole) {
    try {
      await orgActions.changeMemberRole(org.id, userId, newRole);
      loadDetails();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member from the organization?')) return;
    try {
      await orgActions.removeMember(org.id, userId);
      loadDetails();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreatingTeam(true);
    try {
      await orgActions.createTeam(org.id, teamName.trim(), teamColor);
      setTeamName('');
      setTeamColor(TEAM_COLORS[0]);
      setShowTeamForm(false);
      loadDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('Delete this team? Members will not be removed from the organization.')) return;
    try {
      await orgActions.deleteTeam(org.id, teamId);
      loadDetails();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddTeamMember(teamId, userId) {
    try {
      await orgActions.addTeamMember(org.id, teamId, userId);
      setAddingMemberTo(null);
      loadDetails();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveTeamMember(teamId, userId) {
    try {
      await orgActions.removeTeamMember(org.id, teamId, userId);
      loadDetails();
    } catch (err) {
      alert(err.message);
    }
  }

  // ── No org ────────────────────────────────────────────────────────────────

  if (!org) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Organization</h2>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} /> Create organization
            </button>
          )}
        </div>

        {!showCreateForm ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            You're not part of an organization yet. Create one to invite your team and set up corporate achievements.
          </p>
        ) : (
          <form onSubmit={handleCreateOrg} className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Create your organization</p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !orgName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ── In an org ─────────────────────────────────────────────────────────────

  const members = details?.members || [];
  const myUserId = members.find((m) => m.email === auth?.user?.email)?.user_id;

  // Filter teams by role — members see none, PMs see only their own teams
  const visibleTeams = ['org_admin', 'team_lead'].includes(org?.role)
    ? teams
    : teams.filter((t) => (t.members || []).some((tm) => tm.user_id === myUserId));

  return (
    <div className="space-y-5">
      {/* Org header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{org.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">@{org.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={org.role} />
          <button onClick={loadDetails} title="Refresh" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <RefreshCw size={14} className={detailsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMembers((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showMembers ? 'rotate-180' : ''}`} />
            Members {members.length > 0 && `(${members.length})`}
          </button>
          {isAdmin && (
            <button
              onClick={() => { setShowInviteForm((s) => !s); setInviteResult(null); setInviteError(null); }}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <UserPlus size={13} />
              {showInviteForm ? 'Cancel' : 'Invite member'}
            </button>
          )}
        </div>

        {/* Invite form */}
        {isAdmin && showInviteForm && (
          <form onSubmit={handleInvite} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="team_lead">Team Lead</option>
                <option value="project_manager">Project Manager</option>
              </select>
            </div>
            {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
            {inviteResult && (
              <div className="space-y-1.5">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Invite created for {inviteResult.email} — share this link:
                </p>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{inviteResult.link}</span>
                  <CopyButton text={inviteResult.link} />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {inviting && <Loader2 size={12} className="animate-spin" />}
              Generate invite link
            </button>
          </form>
        )}

        {/* Members list — collapsible */}
        {showMembers && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 px-3 py-2">
                <Avatar name={m.name || m.email} picture={m.picture} className="w-7 h-7 text-xs flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.name || m.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                </div>
                {isAdmin && m.email !== auth?.user?.email ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="org_admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <RoleBadge role={m.role} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pending invites */}
        {isAdmin && invites.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pending invites</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2 py-1">
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={13} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{inv.email}</p>
                </div>
                <RoleBadge role={inv.role} />
                <span className="text-xs text-amber-500 dark:text-amber-400">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams — hidden for plain members */}
      {canSeeTeams && <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Teams {visibleTeams.length > 0 && `(${visibleTeams.length})`}
          </h3>
          {canManageTeams && (
            <button
              onClick={() => setShowTeamForm((s) => !s)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Plus size={13} />
              {showTeamForm ? 'Cancel' : 'New team'}
            </button>
          )}
        </div>

        {/* Create team form */}
        {canManageTeams && showTeamForm && (
          <form onSubmit={handleCreateTeam} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 space-y-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTeamColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform flex-shrink-0 ${teamColor === c ? 'ring-2 ring-offset-2 dark:ring-offset-gray-950 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={creatingTeam || !teamName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creatingTeam && <Loader2 size={12} className="animate-spin" />}
              Create team
            </button>
          </form>
        )}

        {visibleTeams.length === 0 && !showTeamForm && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            {teams.length === 0 ? 'No teams yet.' : 'You are not assigned to any teams.'}
          </p>
        )}

        {/* Teams list */}
        {visibleTeams.map((team) => {
          const isExpanded = expandedTeam === team.id;
          const teamMembers = team.members || [];
          const nonMembers = members.filter((m) => !teamMembers.find((tm) => tm.user_id === m.user_id));

          return (
            <div key={team.id} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{team.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Users size={12} /> {teamMembers.length}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2">
                  {teamMembers.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No members yet.</p>
                  )}
                  {teamMembers.map((tm) => (
                    <div key={tm.user_id} className="flex items-center gap-2">
                      <Avatar name={tm.name || tm.email} picture={tm.picture} className="w-6 h-6 text-xs" />
                      <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{tm.name || tm.email}</span>
                      {tm.role === 'lead' && (
                        <Crown size={12} className="text-amber-400 flex-shrink-0" title="Team lead" />
                      )}
                      {canManageTeams && (
                        <button
                          onClick={() => handleRemoveTeamMember(team.id, tm.user_id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                          title="Remove from team"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {canManageTeams && nonMembers.length > 0 && (
                    addingMemberTo === team.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) handleAddTeamMember(team.id, e.target.value); }}
                        >
                          <option value="" disabled>Select member...</option>
                          {nonMembers.map((m) => (
                            <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setAddingMemberTo(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingMemberTo(team.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
                      >
                        <Plus size={12} /> Add member
                      </button>
                    )
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 mt-1"
                    >
                      <Trash2 size={12} /> Delete team
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
