import { useEffect } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '../utils/helpers';

export function useTheme() {
  const [theme, setTheme] = useStorage(STORAGE_KEYS.theme, () =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return [theme, toggleTheme];
}
