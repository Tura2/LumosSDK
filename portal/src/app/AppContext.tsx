import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

export interface App { id: string; name: string; packageName: string }

interface AppsValue {
  apps: App[];
  currentApp: App | null;
  currentAppId: string | null;
  loading: boolean;
  error: string | null;
  setCurrentAppId: (id: string) => void;
  refresh: () => Promise<void>;
}

const AppsCtx = createContext<AppsValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [currentAppId, setCurrentAppIdState] = useState<string | null>(
    () => localStorage.getItem('lumos_current_app'),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function setCurrentAppId(id: string) {
    localStorage.setItem('lumos_current_app', id);
    setCurrentAppIdState(id);
  }

  async function refresh() {
    const r = await api.get<App[]>('/api/apps');
    const list = r.data;
    setApps(list);
    setCurrentAppIdState(prev => {
      const valid = prev && list.some(a => a.id === prev) ? prev : (list[0]?.id ?? null);
      if (valid) localStorage.setItem('lumos_current_app', valid);
      else localStorage.removeItem('lumos_current_app');
      return valid;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        setError('Failed to load apps. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentApp = apps.find(a => a.id === currentAppId) ?? null;

  return (
    <AppsCtx.Provider value={{ apps, currentApp, currentAppId, loading, error, setCurrentAppId, refresh }}>
      {children}
    </AppsCtx.Provider>
  );
}

export function useApps(): AppsValue {
  const v = useContext(AppsCtx);
  if (!v) throw new Error('useApps must be used within AppProvider');
  return v;
}
