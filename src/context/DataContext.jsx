import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useServerData } from '../hooks/useServerData';
import LoadingScreen from '../components/layout/LoadingScreen';

const DataContext = createContext(null);

export function DataProvider({ auth, children }) {
  const { loading, getValue, setValue } = useServerData(auth);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'greeting' | 'done'

  useEffect(() => {
    if (!loading) {
      setPhase('greeting');
      const done = setTimeout(() => setPhase('done'), 2350);
      return () => clearTimeout(done);
    }
  // phase intentionally excluded — including it would clear the timeout on every phase change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <DataContext.Provider value={{ getValue, setValue, loading }}>
      {phase !== 'done' && <LoadingScreen phase={phase} user={auth?.user} />}
      {children}
    </DataContext.Provider>
  );
}

export function useServerStorage(key, defaultValue) {
  const ctx = useContext(DataContext);
  const value = ctx.getValue(key, defaultValue);
  const setter = useCallback((updater) => ctx.setValue(key, updater, defaultValue), [ctx, key, defaultValue]);
  return [value, setter];
}

export function useDataLoading() {
  return useContext(DataContext).loading;
}
