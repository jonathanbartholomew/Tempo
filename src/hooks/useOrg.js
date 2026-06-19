import { useState, useEffect, useCallback, useMemo } from 'react';

export function useOrg(auth) {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = auth?.accessToken;

  const fetchOrg = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/org/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrg(res.ok ? await res.json() : null);
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  // All action functions memoized together — only recreated when token changes.
  // This keeps their references stable so useEffect deps in consumers don't
  // fire on every render.
  const actions = useMemo(() => {
    const h = (json = true) => ({
      Authorization: `Bearer ${token}`,
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    });

    async function updateOrg(orgId, data) {
      const res = await fetch(`/api/org/${orgId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchOrg();
    }

    async function updateOrgSettings(orgId, settings) {
      const res = await fetch(`/api/org/${orgId}/settings`, { method: 'PATCH', headers: h(), body: JSON.stringify(settings) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function createOrg(name) {
      const res = await fetch('/api/org', { method: 'POST', headers: h(), body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchOrg();
    }

    async function getOrgDetails(orgId) {
      const res = await fetch(`/api/org/${orgId}`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function inviteMember(orgId, email, role) {
      const res = await fetch(`/api/org/${orgId}/invites`, { method: 'POST', headers: h(), body: JSON.stringify({ email, role }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getInvites(orgId) {
      const res = await fetch(`/api/org/${orgId}/invites`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function changeMemberRole(orgId, userId, role) {
      const res = await fetch(`/api/org/${orgId}/members/${userId}/role`, { method: 'PATCH', headers: h(), body: JSON.stringify({ role }) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function removeMember(orgId, userId) {
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function createTeam(orgId, name, color) {
      const res = await fetch(`/api/org/${orgId}/teams`, { method: 'POST', headers: h(), body: JSON.stringify({ name, color }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getTeams(orgId) {
      const res = await fetch(`/api/org/${orgId}/teams`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function updateTeam(orgId, teamId, changes) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(changes) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function deleteTeam(orgId, teamId) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function addTeamMember(orgId, teamId, userId) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/members`, { method: 'POST', headers: h(), body: JSON.stringify({ userId }) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function removeTeamMember(orgId, teamId, userId) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/members/${userId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function createAssignedTask(orgId, data) {
      const res = await fetch(`/api/org/${orgId}/assigned-tasks`, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getAssignedTasksForOrg(orgId) {
      const res = await fetch(`/api/org/${orgId}/assigned-tasks`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function updateAssignedTask(orgId, taskId, data) {
      const res = await fetch(`/api/org/${orgId}/assigned-tasks/${taskId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function deleteAssignedTask(orgId, taskId) {
      const res = await fetch(`/api/org/${orgId}/assigned-tasks/${taskId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function getTeamGoals(orgId, teamId) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/goals`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getMyTeamsGoals(orgId) {
      const res = await fetch(`/api/org/${orgId}/my-teams/goals`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function createTeamGoal(orgId, teamId, data) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/goals`, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function updateTeamGoal(orgId, teamId, goalId, data) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/goals/${goalId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function deleteTeamGoal(orgId, teamId, goalId) {
      const res = await fetch(`/api/org/${orgId}/teams/${teamId}/goals/${goalId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function contributeToGoal(orgId, goalId, payload) {
      const res = await fetch(`/api/org/${orgId}/goals/${goalId}/contribute`, { method: 'POST', headers: h(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getOrgCelebrations(orgId) {
      const res = await fetch(`/api/org/${orgId}/celebrations`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function createCelebration(orgId, data) {
      const res = await fetch(`/api/org/${orgId}/celebrations`, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function getOrgAchievements(orgId) {
      const res = await fetch(`/api/org/${orgId}/achievements`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function createOrgAchievement(orgId, data) {
      const res = await fetch(`/api/org/${orgId}/achievements`, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function updateOrgAchievement(orgId, achievementId, data) {
      const res = await fetch(`/api/org/${orgId}/achievements/${achievementId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function deleteOrgAchievement(orgId, achievementId) {
      const res = await fetch(`/api/org/${orgId}/achievements/${achievementId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function syncOrgAchievements(orgId, statsSnapshot) {
      const res = await fetch(`/api/org/${orgId}/achievements/sync`, { method: 'POST', headers: h(), body: JSON.stringify(statsSnapshot) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function getOrgRoles(orgId) {
      const res = await fetch(`/api/org/${orgId}/roles`, { headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function createOrgRole(orgId, data) {
      const res = await fetch(`/api/org/${orgId}/roles`, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    }

    async function updateOrgRole(orgId, roleId, data) {
      const res = await fetch(`/api/org/${orgId}/roles/${roleId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function deleteOrgRole(orgId, roleId) {
      const res = await fetch(`/api/org/${orgId}/roles/${roleId}`, { method: 'DELETE', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
    }

    async function acceptInvite(token) {
      const res = await fetch(`/api/org/invite/${token}/accept`, { method: 'POST', headers: h(false) });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      await fetchOrg();
      return data;
    }

    return {
      updateOrg, updateOrgSettings, createOrg, getOrgDetails,
      inviteMember, getInvites, changeMemberRole, removeMember, acceptInvite,
      createTeam, getTeams, updateTeam, deleteTeam, addTeamMember, removeTeamMember,
      createAssignedTask, getAssignedTasksForOrg, updateAssignedTask, deleteAssignedTask,
      getTeamGoals, getMyTeamsGoals, createTeamGoal, updateTeamGoal, deleteTeamGoal,
      contributeToGoal,
      getOrgCelebrations, createCelebration,
      getOrgAchievements, createOrgAchievement, updateOrgAchievement, deleteOrgAchievement, syncOrgAchievements,
      getOrgRoles, createOrgRole, updateOrgRole, deleteOrgRole,
    };
  }, [token, fetchOrg]);

  return useMemo(() => ({
    org,
    loading,
    refetch: fetchOrg,
    ...actions,
  }), [org, loading, fetchOrg, actions]);
}
