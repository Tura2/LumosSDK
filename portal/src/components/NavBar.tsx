import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Key, User, LogOut } from 'lucide-react';
import { T, gradientText, transition } from '../theme';

const links = [
  { to: '/',       label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { to: '/traces', label: 'Traces',    icon: <Activity        size={18} strokeWidth={1.5} /> },
  { to: '/keys',   label: 'API Keys',  icon: <Key             size={18} strokeWidth={1.5} /> },
];

export default function NavBar() {
  const nav = useNavigate();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0,
      width: 240, height: '100vh',
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      gap: 4,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
        <img
          src="/lumos-icon.png"
          width={36} height={36}
          alt="Lumos"
          style={{ borderRadius: 10, objectFit: 'cover' }}
        />
        <span style={{ fontSize: 18, fontWeight: 700, ...gradientText }}>LumosSDK</span>
      </div>

      {/* Nav links */}
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            minHeight: 44,
            borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
            transition,
            color:       isActive ? T.cyan  : T.muted,
            background:  isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
            borderLeft:  isActive ? `2px solid ${T.cyan}` : '2px solid transparent',
            paddingLeft: isActive ? 10 : 12,
          })}
        >
          {l.icon}
          {l.label}
        </NavLink>
      ))}

      {/* Bottom section */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${T.border}`,
        }}>
          <User size={14} strokeWidth={1.5} color={T.muted} />
          <span style={{ fontSize: 13, color: T.text }}>Demo App</span>
        </div>

        <button
          onClick={() => { localStorage.removeItem('lumos_token'); nav('/login'); }}
          onMouseEnter={e => (e.currentTarget.style.color = T.red)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: T.muted, fontSize: 13,
            cursor: 'pointer', padding: '8px 12px',
            borderRadius: 8, transition, width: '100%',
          }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </nav>
  );
}
