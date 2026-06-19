import { useState, useEffect, useCallback } from 'react';
import Skeleton from '../ui/Skeleton';
import {
  Building2, Plus, X, Copy, Check, ChevronDown, ChevronUp, Trash2,
  UserPlus, Users, Crown, Loader2, RefreshCw, Shield, ImagePlus, Pencil, Search, ShieldCheck,
  Trophy, ToggleLeft, ToggleRight, CheckCircle2,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getLevelInfo } from '../../utils/helpers';

const PERMISSIONS = [
  { id: 'manage_members',      label: 'Manage members',      desc: 'Invite, remove, and reassign member roles' },
  { id: 'manage_teams',        label: 'Manage teams',        desc: 'Create, edit, and delete teams' },
  { id: 'manage_roles',        label: 'Manage roles',        desc: 'Create and edit org roles' },
  { id: 'manage_goals',        label: 'Manage goals',        desc: 'Create and edit team goals' },
  { id: 'manage_achievements', label: 'Manage achievements', desc: 'Create and edit company achievements' },
  { id: 'assign_tasks',        label: 'Assign tasks',        desc: 'Assign tasks to org members' },
  { id: 'view_reports',        label: 'View reports',        desc: 'Access org-level reports and insights' },
];

const ROLE_SWATCH_COLORS = [
  '#6b7280', '#3b82f6', '#8b5cf6', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

const TEAM_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const METRIC_LABELS = {
  tasks_completed: 'tasks completed',
  focus_hours: 'focus hours logged',
  xp_total: 'XP earned',
};

const CRITERIA_LABELS = {
  tasks_completed: 'Tasks completed',
  focus_hours: 'Focus hours',
  streak_days: 'Day streak',
  xp_total: 'Total XP',
  level: 'Level reached',
};

const ACHIEVEMENT_ICONS = [
  '🏆','🥇','🥈','🥉','🎖️','🏅','👑','🎗️',
  '⭐','🌟','💫','✨','🔥','⚡','💎','💯',
  '🎯','🚀','💪','🧠','🎓','🎉','🎊','🎁',
  '📈','💡','🔑','🛡️','⚔️','🌈','💰','🌱',
  '🏋️','🏃','📚','✅','🎮','🦁','🦅','🐉',
];

const NAV = [
  { id: 'company',      label: 'Company Info' },
  { id: 'members',      label: 'Members' },
  { id: 'leaderboard',  label: 'Leaderboard' },
  { id: 'teams',        label: 'Teams' },
  { id: 'roles',        label: 'Roles' },
  { id: 'achievements', label: 'Achievements' },
];

function RoleBadge({ role, orgRoles = [] }) {
  const def = orgRoles.find((r) => r.name === role);
  const color = def?.color || '#6b7280';
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}
    >
      {role}
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
  const [view, setView] = useState('company');

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

  // Member search + sort
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState({ col: null, dir: 'asc' });

  // Team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Team expand / add member
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [addingMemberTo, setAddingMemberTo] = useState(null);

  // Team goals
  const [teamGoalsMap, setTeamGoalsMap] = useState({});
  const [showGoalFormFor, setShowGoalFormFor] = useState(null);
  const [goalForm, setGoalForm] = useState({ criteria_type: 'tasks_completed', target_value: 10, period_start: '', period_end: '', reward_description: '' });

  // Achievements
  const [achievements, setAchievements] = useState([]);
  const [showAchForm, setShowAchForm] = useState(false);
  const [editingAch, setEditingAch] = useState(null);
  const [achForm, setAchForm] = useState({ name: '', description: '', icon: '🏆', xp_reward: 100, criteria_type: 'tasks_completed', criteria_value: 10, reward_type: 'none', reward_value: '' });
  const [achSearch, setAchSearch] = useState('');

  // Roles
  const [orgRoles, setOrgRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', color: '#6b7280', is_admin: false, permissions: [] });

  // Membership settings
  const [savingSettings, setSavingSettings] = useState(false);

  const loadAll = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [det, tms, inv, achs, rls] = await Promise.all([
        orgActions.getOrgDetails(org.id),
        orgActions.getTeams(org.id),
        orgActions.getInvites(org.id),
        orgActions.getOrgAchievements(org.id),
        orgActions.getOrgRoles(org.id),
      ]);
      setDetails(det);
      setAchievements(achs);
      setTeams(tms);
      setInvites(inv.filter((i) => !i.accepted_at));
      setOrgRoles(rls);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [org?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const members = details?.members || [];
  const q = memberSearch.trim().toLowerCase();
  const filteredMembers = (() => {
    let list = q
      ? members.filter((m) => (m.name || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      : [...members];
    if (memberSort.col) {
      // Pre-compute team counts once so the comparator doesn't re-filter on every comparison
      const teamCountMap = memberSort.col === 'teams'
        ? Object.fromEntries(members.map((m) => [
            m.user_id,
            teams.filter((t) => (t.members || []).some((tm) => tm.user_id === m.user_id)).length,
          ]))
        : null;
      list.sort((a, b) => {
        let av, bv;
        if (memberSort.col === 'name')   { av = (a.name || a.email).toLowerCase(); bv = (b.name || b.email).toLowerCase(); }
        if (memberSort.col === 'email')  { av = a.email.toLowerCase();              bv = b.email.toLowerCase(); }
        if (memberSort.col === 'role')   { av = a.role.toLowerCase();               bv = b.role.toLowerCase(); }
        if (memberSort.col === 'teams')  { av = teamCountMap[a.user_id] ?? 0;       bv = teamCountMap[b.user_id] ?? 0; }
        if (memberSort.col === 'joined') { av = a.joined_at ? new Date(a.joined_at).getTime() : 0; bv = b.joined_at ? new Date(b.joined_at).getTime() : 0; }
        if (av < bv) return memberSort.dir === 'asc' ? -1 : 1;
        if (av > bv) return memberSort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  })();

  const achQ = achSearch.trim().toLowerCase();
  const filteredAchievements = achQ
    ? achievements.filter((a) => a.name.toLowerCase().includes(achQ) || (a.description || '').toLowerCase().includes(achQ))
    : achievements;

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    try { await orgActions.deleteOrgAchievement(org.id, achId); setAchievements((prev) => prev.filter((a) => a.id !== achId)); }
    catch (err) { alert(err.message); }
  }

  function startEditAch(a) {
    setEditingAch(a);
    setAchForm({ name: a.name, description: a.description, icon: a.icon, xp_reward: a.xp_reward, criteria_type: a.criteria_type, criteria_value: a.criteria_value, reward_type: a.reward_type, reward_value: a.reward_value || '' });
    setShowAchForm(true);
    setAchSearch('');
  }

  async function handleSaveRole(e) {
    e.preventDefault();
    const data = { ...roleForm, is_admin: roleForm.is_admin ? 1 : 0 };
    try {
      if (editingRole) {
        await orgActions.updateOrgRole(org.id, editingRole.id, data);
        setOrgRoles((prev) => prev.map((r) => r.id === editingRole.id ? { ...r, ...data } : r));
      } else {
        const created = await orgActions.createOrgRole(org.id, data);
        setOrgRoles((prev) => [...prev, { ...data, ...created }]);
      }
      setShowRoleForm(false);
      setEditingRole(null);
      setRoleForm({ name: '', color: '#6b7280', is_admin: false, permissions: [] });
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteRole(roleId) {
    if (!confirm('Delete this role? This will fail if any members are still assigned to it.')) return;
    try {
      await orgActions.deleteOrgRole(org.id, roleId);
      setOrgRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (err) { alert(err.message); }
  }

  function startEditRole(r) {
    setEditingRole(r);
    setRoleForm({ name: r.name, color: r.color, is_admin: !!r.is_admin, permissions: Array.isArray(r.permissions) ? r.permissions : [] });
    setShowRoleForm(true);
    setRoleSearch('');
  }

  function togglePermission(permId) {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(permId)
        ? f.permissions.filter((p) => p !== permId)
        : [...f.permissions, permId],
    }));
  }

  async function handleToggleSetting(key, currentValue) {
    setSavingSettings(true);
    try {
      await orgActions.updateOrgSettings(org.id, { [key]: !currentValue });
      setDetails((d) => ({ ...d, [key]: !currentValue ? 1 : 0 }));
    } catch (err) { alert(err.message); }
    finally { setSavingSettings(false); }
  }

  if (!org) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 text-center">
        <Shield size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">You are not part of an organization.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-xl object-contain border border-gray-100 dark:border-gray-800" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Building2 size={20} className="text-blue-500" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{org.name}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">@{org.slug} · Admin Panel</p>
          </div>
        </div>
        <button onClick={loadAll} title="Refresh" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Secondary nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              view === n.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* ── Skeleton (initial load only — no data yet) ──────────────────────── */}
      {loading && !details && (
        <>
          {view === 'company' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex items-center gap-5">
              <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-64 mt-2" />
              </div>
            </div>
          )}
          {view === 'members' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <Skeleton className="h-8 w-48 rounded-xl" />
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-28' : i % 3 === 1 ? 'w-36' : 'w-24'}`} />
                    <Skeleton className={`h-3.5 ml-4 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
                    <Skeleton className="h-5 w-20 rounded-full ml-4" />
                    <div className="flex gap-1 ml-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      {i % 2 === 0 && <Skeleton className="h-5 w-14 rounded-full" />}
                    </div>
                    <Skeleton className="h-3.5 w-24 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(view === 'teams' || view === 'roles' || view === 'achievements') && (
            <div className={`grid gap-4 ${view === 'achievements' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {Array.from({ length: view === 'achievements' ? 6 : 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {view === 'achievements' && <Skeleton className="w-8 h-8 rounded-lg" />}
                    <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
                  </div>
                  <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
                  <div className="flex gap-1.5 flex-wrap">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    {i % 2 === 0 && <Skeleton className="h-5 w-24 rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Company Info ────────────────────────────────────────────────────── */}
      {details && view === 'company' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0 group">
            {org.logo_url ? (
              <img src={org.logo_url} alt="Company logo" className="w-20 h-20 rounded-xl object-contain border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Building2 size={32} className="text-blue-400" />
              </div>
            )}
            <label className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <ImagePlus size={20} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {org.logo_url && (
              <button onClick={handleRemoveLogo} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Remove logo">
                <X size={10} />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
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
                <button onClick={handleSaveOrgName} disabled={savingOrg} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50">
                  {savingOrg ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
                <button onClick={() => setEditingOrgName(false)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{org.name}</p>
                <button onClick={() => { setOrgNameValue(org.name); setEditingOrgName(true); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">@{org.slug}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Hover the logo to upload a new one (PNG, JPG, SVG).</p>
          </div>
        </div>
      )}

      {/* ── Membership Settings (Company view) ─────────────────────────────── */}
      {details && view === 'company' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Membership Settings</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Control who can join this organization.</p>

          {[
            {
              key: 'allow_personal_accounts',
              label: 'Allow personal account members',
              desc: 'Users on a Free Trial or Personal Pro plan can be invited. Disable to restrict to Team/Enterprise plan holders only.',
            },
            {
              key: 'allow_multi_org_members',
              label: 'Allow multi-org members',
              desc: 'Members who already belong to other organizations can join. Disable if you want exclusive membership (e.g. internal company tool).',
            },
          ].map(({ key, label, desc }) => {
            const enabled = !!details[key];
            return (
              <div key={key} className="flex items-start gap-4">
                <button
                  onClick={() => handleToggleSetting(key, enabled)}
                  disabled={savingSettings}
                  className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 disabled:opacity-50 transition-colors"
                  title={enabled ? 'Disable' : 'Enable'}
                >
                  {enabled
                    ? <ToggleRight size={28} className="text-blue-500" />
                    : <ToggleLeft size={28} />}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Leaderboard ─────────────────────────────────────────────────────── */}
      {details && view === 'leaderboard' && (() => {
        const ranked = [...(details.members || [])].sort((a, b) => (b.org_xp ?? 0) - (a.org_xp ?? 0));
        const topXp = ranked[0]?.org_xp || 1;
        const medals = ['🥇', '🥈', '🥉'];
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-500" />
              <p className="text-xs text-gray-400 dark:text-gray-500">Ranked by org XP — earned from assigned tasks and company achievements only. Personal tasks don't count.</p>
            </div>
            {ranked.length === 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-400">
                No members yet.
              </div>
            )}
            {ranked.map((m, i) => {
              const xp = m.org_xp ?? 0;
              const pct = topXp > 0 ? Math.round((xp / topXp) * 100) : 0;
              const orgLevel = getLevelInfo(xp);
              const tasksCompleted = m.tasks_completed ?? 0;
              const barColor = i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-500';
              return (
                <div key={m.user_id} className={`rounded-2xl border bg-white dark:bg-gray-900 px-5 py-4 flex items-center gap-4 ${i === 0 ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-800'}`}>
                  <span className="w-8 text-center text-lg flex-shrink-0">
                    {medals[i] ?? <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
                  </span>
                  <Avatar name={m.name} picture={m.picture} className="w-9 h-9 text-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name || m.email}</p>
                      <RoleBadge role={m.role} orgRoles={orgRoles} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Level {orgLevel.level}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{xp} XP</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <CheckCircle2 size={11} className="text-green-500" />
                        {tasksCompleted} task{tasksCompleted !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Members ─────────────────────────────────────────────────────────── */}
      {details && view === 'members' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{members.length} member{members.length !== 1 ? 's' : ''}</p>
              <div className="flex-1" />
              <button
                onClick={() => { setShowInviteForm((s) => !s); setInviteResult(null); setInviteError(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex-shrink-0"
              >
                <UserPlus size={14} />
                {showInviteForm ? 'Cancel' : 'Invite member'}
              </button>
            </div>

            {/* Invite form */}
            {showInviteForm && (
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="flex gap-2">
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" autoFocus className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {orgRoles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button type="submit" disabled={inviting || !inviteEmail.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">
                      {inviting && <Loader2 size={13} className="animate-spin" />} Send invite
                    </button>
                  </div>
                  {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
                  {inviteResult && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Invite created for {inviteResult.email} — share this link:</p>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{inviteResult.link}</span>
                        <CopyButton text={inviteResult.link} />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Members table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {[
                      { col: 'name',   label: 'Member',  px: 'px-5' },
                      { col: 'email',  label: 'Email',   px: 'px-4' },
                      { col: 'role',   label: 'Role',    px: 'px-4' },
                      { col: 'teams',  label: 'Teams',   px: 'px-4' },
                      { col: 'joined', label: 'Joined',  px: 'px-4' },
                    ].map(({ col, label, px }) => {
                      const active = memberSort.col === col;
                      const Icon = active && memberSort.dir === 'asc' ? ChevronUp : ChevronDown;
                      return (
                        <th
                          key={col}
                          onClick={() => setMemberSort((s) => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })}
                          className={`text-left ${px} py-3 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors ${
                            active
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            <Icon size={12} className={active ? 'opacity-100' : 'opacity-30'} />
                          </span>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500 italic">
                        {memberSearch ? 'No members match your search.' : 'No members yet.'}
                      </td>
                    </tr>
                  )}
                  {filteredMembers.map((m) => {
                    const memberTeams = teams.filter((t) => (t.members || []).some((tm) => tm.user_id === m.user_id));
                    const visibleTeams = memberTeams.slice(0, 2);
                    const overflow = memberTeams.length - visibleTeams.length;
                    const joinedDate = m.joined_at
                      ? new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—';
                    return (
                    <tr key={m.user_id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name || m.email} picture={m.picture} className="w-8 h-8 text-sm flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{m.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{m.email}</td>
                      <td className="px-4 py-3">
                        {m.email !== auth?.user?.email ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {orgRoles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                        ) : (
                          <RoleBadge role={m.role} orgRoles={orgRoles} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {visibleTeams.length === 0 && <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>}
                          {visibleTeams.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: t.color + '22', color: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                          {overflow > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">+{overflow}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{joinedDate}</td>
                      <td className="px-4 py-3 text-right">
                        {m.email !== auth?.user?.email && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Remove member"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending Invites ({invites.length})</p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {invites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <UserPlus size={14} className="text-amber-500" />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={inv.role} orgRoles={orgRoles} /></td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-medium text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Awaiting</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Teams ───────────────────────────────────────────────────────────── */}
      {details && view === 'teams' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Teams <span className="text-gray-400 font-normal text-sm">({teams.length})</span></h2>
            <button onClick={() => setShowTeamForm((s) => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
              <Plus size={14} /> {showTeamForm ? 'Cancel' : 'New team'}
            </button>
          </div>

          {showTeamForm && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <form onSubmit={handleCreateTeam} className="space-y-3">
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name..." autoFocus className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex items-center gap-2">
                  {TEAM_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setTeamColor(c)} className={`w-6 h-6 rounded-full transition-transform flex-shrink-0 ${teamColor === c ? 'ring-2 ring-offset-2 dark:ring-offset-gray-950 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button type="submit" disabled={creatingTeam || !teamName.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">
                  {creatingTeam && <Loader2 size={13} className="animate-spin" />} Create team
                </button>
              </form>
            </div>
          )}

          {teams.length === 0 && !showTeamForm && <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 italic text-center">No teams yet.</p>}

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {teams.map((team) => {
              const isExpanded = expandedTeam === team.id;
              const teamMembers = team.members || [];
              const nonMembers = members.filter((m) => !teamMembers.find((tm) => tm.user_id === m.user_id));

              return (
                <div key={team.id}>
                  <button
                    onClick={() => {
                      const next = isExpanded ? null : team.id;
                      setExpandedTeam(next);
                      if (next && !teamGoalsMap[next]) {
                        orgActions.getTeamGoals(org.id, next).then((goals) => setTeamGoalsMap((m) => ({ ...m, [next]: goals }))).catch(() => {});
                      }
                    }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{team.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1"><Users size={12} /> {teamMembers.length}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-4">Members</p>
                      {teamMembers.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 italic">No members yet.</p>}
                      {teamMembers.map((tm) => (
                        <div key={tm.user_id} className="flex items-center gap-2">
                          <Avatar name={tm.name || tm.email} picture={tm.picture} className="w-7 h-7 text-xs" />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{tm.name || tm.email}</span>
                          {tm.role === 'lead' && <Crown size={13} className="text-amber-400 flex-shrink-0" title="Team lead" />}
                          <button onClick={() => handleRemoveTeamMember(team.id, tm.user_id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      {nonMembers.length > 0 && (
                        addingMemberTo === team.id ? (
                          <div className="flex items-center gap-2">
                            <select className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue="" onChange={(e) => { if (e.target.value) handleAddTeamMember(team.id, e.target.value); }}>
                              <option value="" disabled>Select member...</option>
                              {nonMembers.map((m) => <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>)}
                            </select>
                            <button onClick={() => setAddingMemberTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={13} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingMemberTo(team.id)} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                            <Plus size={13} /> Add member
                          </button>
                        )
                      )}

                      {/* Goals */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Goals</p>
                          <button onClick={() => { setShowGoalFormFor(showGoalFormFor === team.id ? null : team.id); setGoalForm({ criteria_type: 'tasks_completed', target_value: 10, period_start: '', period_end: '', reward_description: '' }); }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            <Plus size={11} /> Add goal
                          </button>
                        </div>
                        {showGoalFormFor === team.id && (
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const autoName = `${goalForm.target_value} ${METRIC_LABELS[goalForm.criteria_type] ?? goalForm.criteria_type}`;
                            try {
                              const created = await orgActions.createTeamGoal(org.id, team.id, { ...goalForm, name: autoName, target_value: Number(goalForm.target_value) });
                              setTeamGoalsMap((m) => ({ ...m, [team.id]: [...(m[team.id] || []), { ...goalForm, name: autoName, id: created.id, current_value: 0 }] }));
                              setShowGoalFormFor(null);
                            } catch (err) { alert(err.message); }
                          }} className="space-y-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex gap-2 flex-wrap">
                              <select value={goalForm.criteria_type} onChange={(e) => setGoalForm((f) => ({ ...f, criteria_type: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="tasks_completed">Tasks completed</option>
                                <option value="focus_hours">Focus hours</option>
                                <option value="xp_total">Total XP</option>
                              </select>
                              <input required type="number" min="1" placeholder="Target" value={goalForm.target_value} onChange={(e) => setGoalForm((f) => ({ ...f, target_value: e.target.value }))} className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              <input required type="date" value={goalForm.period_start} onChange={(e) => setGoalForm((f) => ({ ...f, period_start: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              <input required type="date" value={goalForm.period_end} onChange={(e) => setGoalForm((f) => ({ ...f, period_end: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <input type="text" placeholder="Reward (optional)" value={goalForm.reward_description} onChange={(e) => setGoalForm((f) => ({ ...f, reward_description: e.target.value }))} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <div className="flex gap-2">
                              <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">Create</button>
                              <button type="button" onClick={() => setShowGoalFormFor(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500">Cancel</button>
                            </div>
                          </form>
                        )}
                        {(teamGoalsMap[team.id] || []).length === 0 && showGoalFormFor !== team.id && <p className="text-xs text-gray-400 dark:text-gray-500 italic">No goals yet.</p>}
                        {(teamGoalsMap[team.id] || []).map((goal) => (
                          <div key={goal.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{goal.target_value} {goal.criteria_type.replace(/_/g, ' ')}</p>
                              <p className="text-gray-400 dark:text-gray-500">{goal.current_value}/{goal.target_value} · {String(goal.period_start).slice(0, 10)} – {String(goal.period_end).slice(0, 10)}</p>
                            </div>
                            <button onClick={async () => { if (!confirm('Delete this goal?')) return; await orgActions.deleteTeamGoal(org.id, team.id, goal.id).catch(() => {}); setTeamGoalsMap((m) => ({ ...m, [team.id]: m[team.id].filter((g) => g.id !== goal.id) })); }} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => handleDeleteTeam(team.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 pt-1">
                        <Trash2 size={12} /> Delete team
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Roles ───────────────────────────────────────────────────────────── */}
      {details && view === 'roles' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles…"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{orgRoles.length} role{orgRoles.length !== 1 ? 's' : ''}</p>
            <div className="flex-1" />
            <button
              onClick={() => { setEditingRole(null); setRoleForm({ name: '', color: '#6b7280', is_admin: false, permissions: [] }); setShowRoleForm((s) => !s); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex-shrink-0"
            >
              <Plus size={14} /> New role
            </button>
          </div>

          {/* Create / Edit form */}
          {showRoleForm && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{editingRole ? 'Edit Role' : 'New Role'}</p>
              <form onSubmit={handleSaveRole} className="space-y-4">
                {/* Name + color row */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm"
                    style={{ backgroundColor: roleForm.color }}
                  />
                  <input
                    required
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Role name (e.g. Developer, Designer)"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Color swatches */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ROLE_SWATCH_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRoleForm((f) => ({ ...f, color: c }))}
                        className={`w-7 h-7 rounded-full transition-transform flex-shrink-0 ${roleForm.color === c ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400 scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={roleForm.color}
                      onChange={(e) => setRoleForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Admin toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setRoleForm((f) => ({ ...f, is_admin: !f.is_admin }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${roleForm.is_admin ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${roleForm.is_admin ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Full admin access</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Overrides individual permissions — grants access to everything</p>
                  </div>
                  {roleForm.is_admin && <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />}
                </label>

                {/* Permissions */}
                {!roleForm.is_admin && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Permissions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS.map((p) => {
                        const checked = roleForm.permissions.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.id)}
                              className="mt-0.5 accent-blue-600 flex-shrink-0"
                            />
                            <div>
                              <p className={`text-sm font-medium ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{p.label}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{p.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
                    {editingRole ? 'Save changes' : 'Create role'}
                  </button>
                  <button type="button" onClick={() => { setShowRoleForm(false); setEditingRole(null); }} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Role cards */}
          {(() => {
            const rq = roleSearch.trim().toLowerCase();
            const filtered = rq ? orgRoles.filter((r) => r.name.toLowerCase().includes(rq)) : orgRoles;
            if (filtered.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    {roleSearch ? 'No roles match your search.' : 'No roles yet.'}
                  </p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r) => {
                  const perms = Array.isArray(r.permissions) ? r.permissions : [];
                  const membersWithRole = (details?.members || []).filter((m) => m.role === r.name).length;
                  return (
                    <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-none transition-all group" style={{ borderTopColor: r.color, borderTopWidth: 3 }}>
                      {/* Header row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</p>
                          {r.is_admin ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                              <ShieldCheck size={11} /> Admin
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => startEditRole(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDeleteRole(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Member count */}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {membersWithRole} member{membersWithRole !== 1 ? 's' : ''}
                      </p>

                      {/* Permissions */}
                      {r.is_admin ? (
                        <p className="text-xs text-blue-500 dark:text-blue-400">All permissions</p>
                      ) : perms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {perms.map((pid) => {
                            const def = PERMISSIONS.find((p) => p.id === pid);
                            return (
                              <span key={pid} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                {def?.label ?? pid}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No permissions</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Achievements ────────────────────────────────────────────────────── */}
      {details && view === 'achievements' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={achSearch}
                onChange={(e) => setAchSearch(e.target.value)}
                placeholder="Search achievements…"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{achievements.length} achievement{achievements.length !== 1 ? 's' : ''}</p>
            <div className="flex-1" />
            <button
              onClick={() => { setEditingAch(null); setAchForm({ name: '', description: '', icon: '🏆', xp_reward: 100, criteria_type: 'tasks_completed', criteria_value: 10, reward_type: 'none', reward_value: '' }); setShowAchForm((s) => !s); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex-shrink-0"
            >
              <Plus size={14} /> New achievement
            </button>
          </div>

          {/* Create / Edit form */}
          {showAchForm && (
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-4">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{editingAch ? 'Edit Achievement' : 'New Achievement'}</p>
              <form onSubmit={handleSaveAchievement} className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-12 h-10 flex items-center justify-center text-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 select-none">
                    {achForm.icon}
                  </div>
                  <input required type="text" value={achForm.name} onChange={(e) => setAchForm((f) => ({ ...f, name: e.target.value }))} placeholder="Achievement name" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Icon</p>
                  <div className="grid grid-cols-8 gap-1">
                    {ACHIEVEMENT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setAchForm((f) => ({ ...f, icon }))}
                        className={`text-xl py-1.5 rounded-lg transition-colors ${
                          achForm.icon === icon
                            ? 'bg-indigo-100 dark:bg-indigo-500/20 ring-2 ring-indigo-400 dark:ring-indigo-500'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="text" value={achForm.description} onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-3 flex-wrap">
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
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target</label>
                    <input type="number" min="1" value={achForm.criteria_value} onChange={(e) => setAchForm((f) => ({ ...f, criteria_value: e.target.value }))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">XP reward</label>
                    <input type="number" min="0" value={achForm.xp_reward} onChange={(e) => setAchForm((f) => ({ ...f, xp_reward: e.target.value }))} className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
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
                    <div className="flex flex-col gap-1 flex-1 min-w-40">
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reward value</label>
                      <input type="text" value={achForm.reward_value} onChange={(e) => setAchForm((f) => ({ ...f, reward_value: e.target.value }))} placeholder="e.g. $25 Amazon gift card" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">{editingAch ? 'Save changes' : 'Create achievement'}</button>
                  <button type="button" onClick={() => { setShowAchForm(false); setEditingAch(null); }} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Achievement cards grid */}
          {filteredAchievements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                {achSearch ? 'No achievements match your search.' : 'No achievements yet. Create one to motivate your team.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((a) => (
                <div key={a.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-none hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group">
                  {/* Icon + actions row */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {a.icon}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditAch(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDeleteAchievement(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{a.name}</p>
                    {a.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>}
                  </div>

                  {/* Criteria pill */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
                      {CRITERIA_LABELS[a.criteria_type] ?? a.criteria_type}: {a.criteria_value}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-lg">
                      +{a.xp_reward} XP
                    </span>
                  </div>

                  {/* Reward badge */}
                  {a.reward_type !== 'none' && a.reward_value && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-2.5 py-1.5">
                      <span>🎁</span>
                      <span className="truncate">{a.reward_value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
