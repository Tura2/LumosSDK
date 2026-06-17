import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TraceExplorer from './pages/TraceExplorer';
import TraceDetail from './pages/TraceDetail';
import ApiKeys from './pages/ApiKeys';
import NavBar from './components/NavBar';
import { T } from './theme';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <NavBar />
      <main style={{
        marginLeft: 240,
        flex: 1,
        overflowY: 'auto',
        padding: '32px 40px',
        minHeight: '100vh',
        background: T.bg,
        width: 'calc(100% - 240px)',
      }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/traces"              element={<AppLayout><TraceExplorer /></AppLayout>} />
        <Route path="/traces/:traceId"     element={<AppLayout><TraceDetail /></AppLayout>} />
        <Route path="/keys"                element={<AppLayout><ApiKeys /></AppLayout>} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
