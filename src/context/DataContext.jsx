import { createContext, useContext, useCallback } from 'react';
import { useServerData } from '../hooks/useServerData';
import LoadingScreen from '../components/layout/LoadingScreen';

const DataContext = createContext(null);

export function DataProvider({ auth, children }) {
  const { loading, getValue, setValue } = useServerData(auth);

  if (loading) {
    return <LoadingScreen />;
  }

  return <DataContext.Provider value={{ getValue, setValue }}>{children}</DataContext.Provider>;
}

export function useServerStorage(key, defaultValue) {
  const ctx = useContext(DataContext);
  const value = ctx.getValue(key, defaultValue);
  const setter = useCallback((updater) => ctx.setValue(key, updater, defaultValue), [ctx, key, defaultValue]);
  return [value, setter];
}
