import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/helpers';
import { apiFetch } from '../utils/api';

const MIGRATED_KEYS = [
  STORAGE_KEYS.jobs,
  STORAGE_KEYS.tasks,
  STORAGE_KEYS.meetings,
  STORAGE_KEYS.stats,
  STORAGE_KEYS.earned,
  STORAGE_KEYS.hiddenEvents,
  STORAGE_KEYS.timezone,
  STORAGE_KEYS.timeFormat,
  STORAGE_KEYS.focusSession,
  STORAGE_KEYS.profile,
  STORAGE_KEYS.calendarAccounts,
];

const MIGRATION_FLAG = 'tempo_server_migrated';
const SAVE_DELAY_MS = 500;
const MIN_LOADING_MS = 1500;

export function useServerData(auth) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const timersRef = useRef({});
  const accessToken = auth?.accessToken;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      try {
        const startTime = Date.now();
        const remote = await apiFetch('/data', { accessToken });
        if (cancelled) return;

        if (!localStorage.getItem(MIGRATION_FLAG)) {
          for (const key of MIGRATED_KEYS) {
            if (key in remote) continue;
            const local = localStorage.getItem(key);
            if (local == null) continue;
            try {
              const value = JSON.parse(local);
              await apiFetch(`/data/${key}`, { method: 'PUT', accessToken, body: { value } });
              remote[key] = value;
            } catch {
              // skip unparseable local values
            }
          }
          localStorage.setItem(MIGRATION_FLAG, 'true');
        }

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
        }
        if (cancelled) return;

        setData(remote);
      } catch {
        // fetch failed (expired token, server down) — fall through with empty data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const getValue = useCallback(
    (key, defaultValue) => {
      if (key in data) return data[key];
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    },
    [data]
  );

  const setValue = useCallback(
    (key, updater, defaultValue) => {
      setData((prev) => {
        const current = key in prev ? prev[key] : (typeof defaultValue === 'function' ? defaultValue() : defaultValue);
        const next = typeof updater === 'function' ? updater(current) : updater;

        clearTimeout(timersRef.current[key]);
        timersRef.current[key] = setTimeout(() => {
          apiFetch(`/data/${key}`, { method: 'PUT', accessToken, body: { value: next } }).catch((err) =>
            console.error(`Failed to save ${key}:`, err)
          );
        }, SAVE_DELAY_MS);

        return { ...prev, [key]: next };
      });
    },
    [accessToken]
  );

  return { loading, getValue, setValue };
}
