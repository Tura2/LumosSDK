import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TraceExplorer from './pages/TraceExplorer';
import TraceDetail from './pages/TraceDetail';
import ApiKeys from './pages/ApiKeys';
import Apps from './pages/Apps';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import NavBar from './components/NavBar';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import { AppProvider, useApps } from './app/AppContext';
import { T } from './theme';
import { ThemeProvider } from './ThemeContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { apps, loading, error } = useApps();
  if (loading) return <div style={{ minHeight: '100vh', background: T.bg }} />;
  if (error && apps.length === 0) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: 16 }}>{error}</p>
      </div>
    );
  }
  if (apps.length === 0) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: T.bg }}>
        <Onboarding />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <NavBar />
      <main style={{
        marginLeft: 240, flex: 1, overflowY: 'auto', padding: '32px 40px',
        minHeight: '100vh', background: T.bg, width: 'calc(100% - 240px)',
      }}>
        {children}
      </main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppProvider>
        <AppLayout>{children}</AppLayout>
      </AppProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"            element={<Login />} />
            <Route path="/"                 element={<Protected><Dashboard /></Protected>} />
            <Route path="/traces"           element={<Protected><TraceExplorer /></Protected>} />
            <Route path="/traces/:traceId"  element={<Protected><TraceDetail /></Protected>} />
            <Route path="/keys"             element={<Protected><ApiKeys /></Protected>} />
            <Route path="/apps"             element={<Protected><Apps /></Protected>} />
            <Route path="*"                 element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
