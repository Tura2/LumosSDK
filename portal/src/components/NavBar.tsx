import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Key } from 'lucide-react';
import { T, gradientText, transition } from '../theme';

const links = [
  { to: '/',       label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { to: '/traces', label: 'Traces',    icon: <Activity        size={18} strokeWidth={1.5} /> },
  { to: '/keys',   label: 'API Keys',  icon: <Key             size={18} strokeWidth={1.5} /> },
];

export default function NavBar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0,
      width: 240, height: '100vh',
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '28px 16px 24px',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '0 8px' }}>
        <img
          src="/lumos-icon.png"
          width={36} height={36}
          alt="Lumos"
          style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />
        <span style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: T.fontD,
          letterSpacing: '-0.02em',
          ...gradientText,
        }}>
          LumosSDK
        </span>
      </div>

      {/* Section label */}
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: T.muted,
        padding: '0 8px', marginBottom: 8,
        fontFamily: T.fontM,
      }}>
        Navigation
      </p>

      {/* Nav links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              color:      isActive ? T.cyan  : T.muted,
              background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
              borderLeft: isActive ? `2px solid ${T.cyan}` : '2px solid transparent',
              paddingLeft: isActive ? 10 : 12,
            })}
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}
      </div>

      {/* Bottom — app identity */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(0,212,255,0.05)',
          border: `1px solid rgba(0,212,255,0.12)`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: T.green,
            boxShadow: `0 0 6px ${T.green}`,
            flexShrink: 0,
          }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>Demo App</p>
            <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Live · Mock data</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
