import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/traces', label: 'Traces' },
  { to: '/keys', label: 'API Keys' },
];

export default function NavBar() {
  return (
    <nav style={{ width: 200, background: '#1a1a2e', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 24 }}>⚡ Lumos</div>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} end style={({ isActive }) => ({
          color: isActive ? '#e94560' : '#ccc', textDecoration: 'none', padding: '8px 12px', borderRadius: 6,
          background: isActive ? 'rgba(233,69,96,0.15)' : 'transparent',
        })}>
          {l.label}
        </NavLink>
      ))}
      <button onClick={() => { localStorage.removeItem('lumos_token'); window.location.href = '/login'; }}
        style={{ marginTop: 'auto', background: 'none', border: '1px solid #555', color: '#ccc', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
        Logout
      </button>
    </nav>
  );
}
