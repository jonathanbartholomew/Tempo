import { useState, useEffect } from 'react';
import { Building2, Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ROLE_LABELS = {
  org_admin: 'Admin',
  project_manager: 'Project Manager',
  team_lead: 'Team Lead',
  member: 'Member',
};

export default function InviteAcceptScreen({ token, auth, onAccepted, onDecline }) {
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/org/invite/${token}`);
        const data = await res.json();
        if (!res.ok) { setLoadError(data.error || 'Invalid invite'); return; }
        setInvite(data);
      } catch {
        setLoadError('Could not load invite. Please check your connection.');
      }
    }
    loadInvite();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/org/invite/${token}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { setAcceptError(data.error || 'Failed to accept invite'); setAccepting(false); return; }
      onAccepted(data);
    } catch {
      setAcceptError('Something went wrong. Please try again.');
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 space-y-6 shadow-sm">

          {/* Loading state */}
          {!invite && !loadError && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading invite...</p>
            </div>
          )}

          {/* Error state */}
          {loadError && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle size={40} className="text-red-400" />
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{loadError}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This invite may have expired or already been used.
              </p>
              <button
                onClick={onDecline}
                className="mt-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go to Tempo
              </button>
            </div>
          )}

          {/* Invite details */}
          {invite && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <Building2 size={28} className="text-blue-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  You've been invited
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join <span className="font-semibold text-gray-900 dark:text-gray-100">{invite.org_name}</span> on Tempo
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Organization</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{invite.org_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Your role</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {ROLE_LABELS[invite.role] || invite.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Invited email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{invite.email}</span>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3 flex items-start gap-2">
                <Users size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Your personal Tempo experience stays exactly the same. Organization features like team goals and corporate achievements will appear alongside your existing data.
                </p>
              </div>

              {acceptError && (
                <p className="text-sm text-red-500 text-center">{acceptError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onDecline}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {accepting ? (
                    <><Loader2 size={15} className="animate-spin" /> Joining...</>
                  ) : (
                    <><CheckCircle2 size={15} /> Accept invite</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Signed in as */}
        {auth?.user && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
            Signed in as {auth.user.email}
          </p>
        )}
      </div>
    </div>
  );
}
