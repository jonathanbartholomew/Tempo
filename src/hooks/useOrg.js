import { useState, useEffect, useCallback } from 'react';

export function useOrg(auth) {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth?.accessToken}`,
    };
  }

  const fetchOrg = useCallback(async () => {
    if (!auth?.accessToken) { setLoading(false); return; }
    try {
      const res = await fetch('/api/org/me', {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      setOrg(res.ok ? await res.json() : null);
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [auth?.accessToken]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  async function createOrg(name) {
    const res = await fetch('/api/org', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    await fetchOrg();
  }

  async function getOrgDetails(orgId) {
    const res = await fetch(`/api/org/${orgId}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function inviteMember(orgId, email, role) {
    const res = await fetch(`/api/org/${orgId}/invites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function getInvites(orgId) {
    const res = await fetch(`/api/org/${orgId}/invites`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function changeMemberRole(orgId, userId, role) {
    const res = await fetch(`/api/org/${orgId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function removeMember(orgId, userId) {
    const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function createTeam(orgId, name, color) {
    const res = await fetch(`/api/org/${orgId}/teams`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function getTeams(orgId) {
    const res = await fetch(`/api/org/${orgId}/teams`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function updateTeam(orgId, teamId, changes) {
    const res = await fetch(`/api/org/${orgId}/teams/${teamId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function deleteTeam(orgId, teamId) {
    const res = await fetch(`/api/org/${orgId}/teams/${teamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function addTeamMember(orgId, teamId, userId) {
    const res = await fetch(`/api/org/${orgId}/teams/${teamId}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function removeTeamMember(orgId, teamId, userId) {
    const res = await fetch(`/api/org/${orgId}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function createAssignedTask(orgId, data) {
    const res = await fetch(`/api/org/${orgId}/assigned-tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function getAssignedTasksForOrg(orgId) {
    const res = await fetch(`/api/org/${orgId}/assigned-tasks`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  async function updateAssignedTask(orgId, taskId, data) {
    const res = await fetch(`/api/org/${orgId}/assigned-tasks/${taskId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function deleteAssignedTask(orgId, taskId) {
    const res = await fetch(`/api/org/${orgId}/assigned-tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
  }

  async function acceptInvite(token) {
    const res = await fetch(`/api/org/invite/${token}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    await fetchOrg();
    return data;
  }

  return {
    org,
    loading,
    refetch: fetchOrg,
    createOrg,
    getOrgDetails,
    inviteMember,
    getInvites,
    changeMemberRole,
    removeMember,
    createTeam,
    getTeams,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    acceptInvite,
    createAssignedTask,
    updateAssignedTask,
    getAssignedTasksForOrg,
    deleteAssignedTask,
  };
}
