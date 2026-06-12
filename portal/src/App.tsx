import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TraceExplorer from './pages/TraceExplorer';
import TraceDetail from './pages/TraceDetail';
import ApiKeys from './pages/ApiKeys';
import NavBar from './components/NavBar';

function PrivateLayout({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('lumos_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <NavBar />
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/traces" element={<PrivateLayout><TraceExplorer /></PrivateLayout>} />
        <Route path="/traces/:traceId" element={<PrivateLayout><TraceDetail /></PrivateLayout>} />
        <Route path="/keys" element={<PrivateLayout><ApiKeys /></PrivateLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
