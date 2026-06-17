import { useStorage } from './useStorage';
import { STORAGE_KEYS, fetchGoogleProfile } from '../utils/helpers';

export function useAuth() {
  const [auth, setAuth] = useStorage(STORAGE_KEYS.auth, null);

  // Google OAuth login (existing flow)
  async function login(tokenResponse) {
    const { access_token, expires_in } = tokenResponse;
    const profile = await fetchGoogleProfile(access_token);
    setAuth({
      user: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
      provider: 'google',
    });
  }

  // Email + password login
  async function loginWithEmail(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setAuth({
      user: data.user,
      accessToken: data.token,
      expiresAt: data.expiresAt,
      provider: 'email',
    });
  }

  // Email + password registration
  async function registerWithEmail(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setAuth({
      user: data.user,
      accessToken: data.token,
      expiresAt: data.expiresAt,
      provider: 'email',
    });
  }

  function logout() {
    setAuth(null);
  }

  // Google users have a real calendar token; email users don't
  const isCalendarConnected = auth?.provider === 'google' && !!auth?.accessToken && auth.expiresAt > Date.now();

  return { auth, login, loginWithEmail, registerWithEmail, logout, isCalendarConnected };
}
