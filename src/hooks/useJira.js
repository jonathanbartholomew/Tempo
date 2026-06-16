import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export function useJira(auth) {
  const [status, setStatus] = useState({ connected: false, siteName: null, siteUrl: null });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);

  const accessToken = auth?.accessToken;

  useEffect(() => {
    if (!accessToken) return;
    apiFetch('/jira/status', { accessToken })
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const fetchIssues = useCallback(async () => {
    if (!accessToken || !status.connected) return;
    setIssuesLoading(true);
    try {
      const data = await apiFetch('/jira/issues', { accessToken });
      setIssues(data.issues || []);
    } catch {
      // leave stale
    } finally {
      setIssuesLoading(false);
    }
  }, [accessToken, status.connected]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function connect() {
    const data = await apiFetch('/jira/auth', { accessToken });
    window.location.href = data.url;
  }

  async function disconnect() {
    await apiFetch('/jira/disconnect', { method: 'DELETE', accessToken });
    setStatus({ connected: false, siteName: null, siteUrl: null });
    setIssues([]);
  }

  async function logTime(issueKey, minutes, comment) {
    await apiFetch('/jira/worklog', { method: 'POST', accessToken, body: { issueKey, minutes, comment } });
  }

  async function getTransitions(issueKey) {
    const data = await apiFetch(`/jira/transitions/${issueKey}`, { accessToken });
    return data.transitions || [];
  }

  async function transition(issueKey, transitionId) {
    await apiFetch(`/jira/transition/${issueKey}`, { method: 'POST', accessToken, body: { transitionId } });
    await fetchIssues();
  }

  function handleConnectedCallback() {
    apiFetch('/jira/status', { accessToken })
      .then((data) => {
        setStatus(data);
      })
      .catch(() => {});
  }

  return {
    status,
    issues,
    loading,
    issuesLoading,
    connect,
    disconnect,
    logTime,
    getTransitions,
    transition,
    refetch: fetchIssues,
    handleConnectedCallback,
  };
}
