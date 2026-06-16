import { useServerStorage } from '../context/DataContext';
import { STORAGE_KEYS, fetchGoogleProfile } from '../utils/helpers';

export function useCalendarAccounts() {
  const [accounts, setAccounts] = useServerStorage(STORAGE_KEYS.calendarAccounts, []);

  async function addAccount(tokenResponse) {
    const { access_token, expires_in } = tokenResponse;
    const profile = await fetchGoogleProfile(access_token);
    const account = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    };
    setAccounts((prev) => [...prev.filter((a) => a.email !== account.email), account]);
  }

  function removeAccount(email) {
    setAccounts((prev) => prev.filter((a) => a.email !== email));
  }

  return { accounts, addAccount, removeAccount };
}
