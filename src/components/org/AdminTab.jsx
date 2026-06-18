import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, X, Copy, Check, ChevronDown, Trash2,
  UserPlus, Users, Crown, Loader2, RefreshCw, Shield, ImagePlus, Pencil,
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

export default function AdminTab({ auth, org, orgActions }) {
  // Org settings
  const [editingOrgName, setEditingOrgName] = useState(false);
  const [orgNameValue, setOrgNameValue] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);

  const [details, setDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  // Team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Team expand / add member
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [addingMemberTo, setAddingMemberTo] = useState(null);

  // Achievements
  const [achievements, setAchievements] = useState([]);
  const [showAchForm, setShowAchForm] = useState(false);
  const [editingAch, setEditingAch] = useState(null);
  const [achForm, setAchForm] = useState({ name: '', description: '', icon: '🏆', xp_reward: 100, criteria_type: 'tasks_completed', criteria_value: 10, reward_type: 'none', reward_value: '' });

  const loadAll = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [det, tms, inv, achs] = await Promise.all([
        orgActions.getOrgDetails(org.id),
        orgActions.getTeams(org.id),
        orgActions.getInvites(org.id),
        orgActions.getOrgAchievements(org.id),
      ]);
      setDetails(det);
      setAchievements(achs);
      setTeams(tms);
      setInvites(inv.filter((i) => !i.accepted_at));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [org?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const members = details?.members || [];

  async function handleSaveAchievement(e) {
    e.preventDefault();
    const data = { ...achForm, xp_reward: Number(achForm.xp_reward), criteria_value: Number(achForm.criteria_value) };
    try {
      if (editingAch) {
        await orgActions.updateOrgAchievement(org.id, editingAch.id, data);
        setAchievements((prev) => prev.map((a) => a.id === editingAch.id ? { ...a, ...data } : a));
      } else {
        const created = await orgActions.createOrgAchievement(org.id, data);
        setAchievements((prev) => [...prev, { ...data, ...created, myProgress: 0 }]);
      }
    } catch (err) { alert(err.message); }
    setShowAchForm(false);
    setEditingAch(null);
    setAchForm({ name: '', description: '', icon: '🏆', xp_reward: 100, criteria_type: 'tasks_completed', criteria_value: 10, reward_type: 'none', reward_value: '' });
  }

  async function handleDeleteAchievement(achId) {
    if (!confirm('Delete this achievement? It will be hidden from all members.')) return;
    try {
      await orgActions.deleteOrgAchievement(org.id, achId);
      setAchievements((prev) => prev.filter((a) => a.id !== achId));
    } catch (err) { alert(err.message); }
  }

  function startEditAch(a) {
    setEditingAch(a);
    setAchForm({ name: a.name, description: a.description, icon: a.icon, xp_reward: a.xp_reward, criteria_type: a.criteria_type, criteria_value: a.criteria_value, reward_type: a.reward_type, reward_value: a.reward_value || '' });
    setShowAchForm(true);
  }

  async function handleSaveOrgName() {
    if (!orgNameValue.trim() || orgNameValue.trim() === org.name) { setEditingOrgName(false); return; }
    setSavingOrg(true);
    try { await orgActions.updateOrg(org.id, { name: orgNameValue.trim() }); setEditingOrgName(false); }
    catch (err) { alert(err.message); }
    finally { setSavingOrg(false); }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try { await orgActions.updateOrg(org.id, { logo_url: ev.target.result }); }
      catch (err) { alert(err.message); }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveLogo() {
    try { await orgActions.updateOrg(org.id, { logo_url: '' }); }
    catch (err) { alert(err.message); }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true); setInviteError(null); setInviteResult(null);
    try {
      const result = await orgActions.inviteMember(org.id, inviteEmail.trim(), inviteRole);
      const link = `${window.location.origin}${window.location.pathname}?invite=${result.token}`;
      setInviteResult({ ...result, link });
      setInviteEmail('');
      loadAll();
    } catch (err) { setInviteError(err.message); }
    finally { setInviting(false); }
  }

  async function handleChangeRole(userId, newRole) {
    try { await orgActions.changeMemberRole(org.id, userId, newRole); loadAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member from the organization?')) return;
    try { await orgActions.removeMember(org.id, userId); loadAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreatingTeam(true);
    try {
      await orgActions.createTeam(org.id, teamName.trim(), teamColor);
      setTeamName(''); setTeamColor(TEAM_COLORS[0]); setShowTeamForm(false);
      loadAll();
    } catch (err) { alert(err.message); }
    finally { setCreatingTeam(false); }
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('Delete this team? Members will not be removed from the org.')) return;
    try { await orgActions.deleteTeam(org.id, teamId); loadAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleAddTeamMember(teamId, userId) {
    try { await orgActions.addTeamMember(org.id, teamId, userId); setAddingMemberTo(null); loadAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleRemoveTeamMember(teamId, userId) {
    try { await orgActions.removeTeamMember(org.id, teamId, userId); loadAll(); }
    catch (err) { alert(err.message); }
  }

  if (!org) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Shield size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">You are not part of an organization.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Building2 size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{org.name}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">@{org.slug}</p>
          </div>
        </div>
        <button
          onClick={loadAll}
          title="Refresh"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Org Settings */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex items-center gap-5">
        {/* Logo */}
        <div className="relative flex-shrink-0 group">
          {org.logo_url ? (
            <img src={org.logo_url} alt="Company logo" className="w-16 h-16 rounded-xl object-contain border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Building2 size={28} className="text-blue-400" />
            </div>
          )}
          <label className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <ImagePlus size={18} className="text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          {org.logo_url && (
            <button
              onClick={handleRemoveLogo}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove logo"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingOrgName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orgNameValue}
                onChange={(e) => setOrgNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveOrgName(); if (e.key === 'Escape') setEditingOrgName(false); }}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSaveOrgName} disabled={savingOrg} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
                {savingOrg ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
              </button>
              <button onClick={() => setEditingOrgName(false)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{org.name}</p>
              <button
                onClick={() => { setOrgNameValue(org.name); setEditingOrgName(true); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                title="Edit name"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">@{org.slug}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hover the logo to upload a new one (PNG, JPG, SVG).</p>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Members <span className="text-gray-400 font-normal">({members.length})</span>
          </h2>
          <button
            onClick={() => { setShowInviteForm((s) => !s); setInviteResult(null); setInviteError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <UserPlus size={13} />
            {showInviteForm ? 'Cancel' : 'Invite member'}
          </button>
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="org_admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {inviting && <Loader2 size={13} className="animate-spin" />}
                  Send invite
                </button>
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
            </form>
          </div>
        )}

        {/* Members list */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">No members yet.</p>
          )}
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={m.name || m.email} picture={m.picture} className="w-8 h-8 text-sm flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.name || m.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
              </div>
              {m.email !== auth?.user?.email ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="org_admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove member"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <RoleBadge role={m.role} />
              )}
            </div>
          ))}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pending invites</p>
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{inv.email}</p>
                </div>
                <RoleBadge role={inv.role} />
                <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Teams <span className="text-gray-400 font-normal">({teams.length})</span>
          </h2>
          <button
            onClick={() => setShowTeamForm((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus size={13} />
            {showTeamForm ? 'Cancel' : 'New team'}
          </button>
        </div>

        {/* Create team form */}
        {showTeamForm && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name..."
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {creatingTeam && <Loader2 size={13} className="animate-spin" />}
                Create team
              </button>
            </form>
          </div>
        )}

        {/* Teams list */}
        {teams.length === 0 && !showTeamForm && (
          <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">No teams yet.</p>
        )}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {teams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const teamMembers = team.members || [];
            const nonMembers = members.filter((m) => !teamMembers.find((tm) => tm.user_id === m.user_id));

            return (
              <div key={team.id}>
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{team.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Users size={12} /> {teamMembers.length}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2 bg-gray-50 dark:bg-gray-800/30">
                    {teamMembers.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic pt-2">No members yet.</p>
                    )}
                    {teamMembers.map((tm) => (
                      <div key={tm.user_id} className="flex items-center gap-2 pt-2">
                        <Avatar name={tm.name || tm.email} picture={tm.picture} className="w-7 h-7 text-xs" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{tm.name || tm.email}</span>
                        {tm.role === 'lead' && <Crown size={13} className="text-amber-400 flex-shrink-0" title="Team lead" />}
                        <button
                          onClick={() => handleRemoveTeamMember(team.id, tm.user_id)}
                          className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                          title="Remove from team"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    {nonMembers.length > 0 && (
                      addingMemberTo === team.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            defaultValue=""
                            onChange={(e) => { if (e.target.value) handleAddTeamMember(team.id, e.target.value); }}
                          >
                            <option value="" disabled>Select member...</option>
                            {nonMembers.map((m) => (
                              <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
                            ))}
                          </select>
                          <button onClick={() => setAddingMemberTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingMemberTo(team.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 pt-1"
                        >
                          <Plus size={13} /> Add member
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 pt-1"
                    >
                      <Trash2 size={12} /> Delete team
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Company Achievements <span className="text-gray-400 font-normal text-sm">({achievements.length})</span>
          </h2>
          <button
            onClick={() => { setEditingAch(null); setAchForm({ name: '', description: '', icon: '🏆', xp_reward: 100, criteria_type: 'tasks_completed', criteria_value: 10, reward_type: 'none', reward_value: '' }); setShowAchForm((s) => !s); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus size={13} /> New achievement
          </button>
        </div>

        {/* Create/Edit form */}
        {showAchForm && (
          <form onSubmit={handleSaveAchievement} className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3 bg-indigo-50/30 dark:bg-indigo-950/20">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{editingAch ? 'Edit Achievement' : 'New Achievement'}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={achForm.icon}
                onChange={(e) => setAchForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="🏆"
                maxLength={4}
                className="w-14 px-2 py-2 text-center text-lg rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                required
                type="text"
                value={achForm.name}
                onChange={(e) => setAchForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Achievement name"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              type="text"
              value={achForm.description}
              onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Criteria</label>
                <select value={achForm.criteria_type} onChange={(e) => setAchForm((f) => ({ ...f, criteria_type: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="tasks_completed">Tasks completed</option>
                  <option value="focus_hours">Focus hours</option>
                  <option value="streak_days">Day streak</option>
                  <option value="xp_total">Total XP</option>
                  <option value="level">Level reached</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target value</label>
                <input type="number" min="1" value={achForm.criteria_value} onChange={(e) => setAchForm((f) => ({ ...f, criteria_value: e.target.value }))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">XP reward</label>
                <input type="number" min="0" value={achForm.xp_reward} onChange={(e) => setAchForm((f) => ({ ...f, xp_reward: e.target.value }))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reward type</label>
                <select value={achForm.reward_type} onChange={(e) => setAchForm((f) => ({ ...f, reward_type: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="none">No reward</option>
                  <option value="gift_card">Gift card</option>
                  <option value="pto">Extra PTO</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {achForm.reward_type !== 'none' && (
                <input type="text" value={achForm.reward_value} onChange={(e) => setAchForm((f) => ({ ...f, reward_value: e.target.value }))} placeholder="e.g. $25 Amazon gift card" className="flex-1 min-w-40 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                {editingAch ? 'Save changes' : 'Create achievement'}
              </button>
              <button type="button" onClick={() => { setShowAchForm(false); setEditingAch(null); }} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Achievement list */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {achievements.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center italic">No achievements yet. Create one to motivate your team.</p>
          )}
          {achievements.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xl w-8 text-center flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{a.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{a.criteria_value} {a.criteria_type.replace(/_/g, ' ')} · +{a.xp_reward} XP{a.reward_type !== 'none' ? ` · 🎁 ${a.reward_value}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEditAch(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDeleteAchievement(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
