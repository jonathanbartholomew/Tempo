import { useStorage } from './useStorage';
import { STORAGE_KEYS, fetchGoogleProfile } from '../utils/helpers';

export function useAuth() {
  const [auth, setAuth] = useStorage(STORAGE_KEYS.auth, null);

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
    });
  }

  function logout() {
    setAuth(null);
  }

  const isCalendarConnected = !!auth?.accessToken && auth.expiresAt > Date.now();

  return { auth, login, logout, isCalendarConnected };
}
