import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Key, LogOut, Boxes, ChevronDown, Moon, Sun, Monitor } from 'lucide-react';
import { T, gradientText, transition } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useApps } from '../app/AppContext';
import { useTheme } from '../ThemeContext';

const links = [
  { to: '/',       label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { to: '/traces', label: 'Traces',    icon: <Activity        size={18} strokeWidth={1.5} /> },
  { to: '/keys',   label: 'API Keys',  icon: <Key             size={18} strokeWidth={1.5} /> },
  { to: '/apps',   label: 'Apps',      icon: <Boxes           size={18} strokeWidth={1.5} /> },
];

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={to}
      end
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        minHeight: 44,
        borderRadius: 10,
        fontSize: 14, fontWeight: 500,
        textDecoration: 'none',
        transition,
        color: isActive ? T.cyan : hovered ? T.text : T.muted,
        background: isActive
          ? 'rgba(var(--color-cyan-rgb),0.08)'
          : hovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        borderLeft: isActive ? `2px solid ${T.cyan}` : '2px solid transparent',
        paddingLeft: isActive ? 10 : 12,
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}

type ThemeMode = 'dark' | 'light' | 'system';

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const cycle: Record<ThemeMode, ThemeMode> = { system: 'dark', dark: 'light', light: 'system' };
  const icon = mode === 'dark' ? <Moon size={15} /> : mode === 'light' ? <Sun size={15} /> : <Monitor size={15} />;
  const label = `Theme: ${mode}`;
  return (
    <button
      onClick={() => setMode(cycle[mode])}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        background: 'none', border: `1px solid var(--color-border)`,
        color: 'var(--color-muted)', cursor: 'pointer', transition,
      }}
    >
      {icon}
    </button>
  );
}

export default function NavBar() {
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const nav = useNavigate();
  const { logout } = useAuth();
  const { apps, currentApp, setCurrentAppId } = useApps();

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
          <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} />
        ))}
      </div>

      {/* Bottom — app identity + logout */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ThemeToggle />
        </div>
        {/* App switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(var(--color-cyan-rgb),0.05)', border: '1px solid rgba(var(--color-cyan-rgb),0.12)',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentApp?.name ?? 'No app'}
              </p>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Live</p>
            </div>
            <ChevronDown size={14} color={T.muted} style={{ transform: switcherOpen ? 'rotate(180deg)' : 'none', transition }} />
          </button>
          {switcherOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 6, zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}>
              {apps.map(a => (
                <button key={a.id}
                  onClick={() => { setCurrentAppId(a.id); setSwitcherOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                    background: a.id === currentApp?.id ? 'rgba(var(--color-cyan-rgb),0.08)' : 'transparent',
                    color: a.id === currentApp?.id ? T.cyan : T.muted,
                  }}>
                  {a.name}
                </button>
              ))}
              <button onClick={() => { setSwitcherOpen(false); nav('/apps'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: T.text }}>
                + New App
              </button>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={() => { logout(); nav('/login'); }}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 14px',
            minHeight: 44, borderRadius: 10,
            background: logoutHovered ? 'rgba(var(--color-red-rgb),0.08)' : 'transparent',
            border: `1px solid ${logoutHovered ? 'rgba(var(--color-red-rgb),0.3)' : T.border}`,
            color: logoutHovered ? T.red : T.muted,
            fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition,
          }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
