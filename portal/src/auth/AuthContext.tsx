import { createContext, useContext, useState } from 'react';

interface AuthValue {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('lumos_token'));

  function setToken(t: string | null) {
    if (t) localStorage.setItem('lumos_token', t);
    else localStorage.removeItem('lumos_token');
    setTokenState(t);
  }

  function logout() {
    localStorage.removeItem('lumos_token');
    localStorage.removeItem('lumos_current_app');
    setTokenState(null);
  }

  return <AuthCtx.Provider value={{ token, setToken, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
