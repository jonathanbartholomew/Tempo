import { useStorage } from './useStorage';
import { STORAGE_KEYS, fetchGoogleProfile } from '../utils/helpers';

export function useAuth() {
  const [auth, setAuth] = useStorage(STORAGE_KEYS.auth, null);

  async function login(tokenResponse) {
    const { access_token, expires_in } = tokenResponse;
    const profile = await fetchGoogleProfile(access_token);
    setAuth({
      user: { name: profile.name, email: profile.email, picture: profile.picture, subscription_plan: 'trial', trial_ends_at: null },
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
      provider: 'google',
    });
  }

  async function loginWithEmail(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setAuth({ user: data.user, accessToken: data.token, expiresAt: data.expiresAt, provider: 'email' });
  }

  async function registerWithEmail(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setAuth({ user: data.user, accessToken: data.token, expiresAt: data.expiresAt, provider: 'email' });
  }

  async function refreshPlan() {
    if (!auth?.accessToken) return;
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.accessToken}` } });
      if (!res.ok) return;
      const data = await res.json();
      setAuth((prev) => ({
        ...prev,
        user: { ...prev.user, subscription_plan: data.subscription_plan, trial_ends_at: data.trial_ends_at },
      }));
    } catch {}
  }

  async function subscribe(plan) {
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Subscription failed');
    setAuth((prev) => ({
      ...prev,
      user: { ...prev.user, subscription_plan: data.user.subscription_plan, trial_ends_at: null },
    }));
  }

  function logout() {
    setAuth(null);
  }

  const isCalendarConnected = auth?.provider === 'google' && !!auth?.accessToken && auth.expiresAt > Date.now();
  const plan = auth?.user?.subscription_plan ?? 'trial';

  const trialEndsAt = auth?.user?.trial_ends_at ? new Date(auth.user.trial_ends_at) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isTrialExpired = plan === 'trial' && trialDaysLeft !== null && trialDaysLeft <= 0;
  const isOnTrial = plan === 'trial' && trialDaysLeft !== null && !isTrialExpired;

  return {
    auth, login, loginWithEmail, registerWithEmail, logout,
    isCalendarConnected, plan, trialDaysLeft, isTrialExpired, isOnTrial,
    refreshPlan, subscribe,
  };
}
