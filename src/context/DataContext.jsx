import { createContext, useContext, useCallback } from 'react';
import { useServerData } from '../hooks/useServerData';

const DataContext = createContext(null);

export function DataProvider({ auth, children }) {
  const { loading, getValue, setValue } = useServerData(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-sm">
        Loading your data...
      </div>
    );
  }

  return <DataContext.Provider value={{ getValue, setValue }}>{children}</DataContext.Provider>;
}

export function useServerStorage(key, defaultValue) {
  const ctx = useContext(DataContext);
  const value = ctx.getValue(key, defaultValue);
  const setter = useCallback((updater) => ctx.setValue(key, updater, defaultValue), [ctx, key, defaultValue]);
  return [value, setter];
}
