import { useState } from 'react';
import { Boxes, Plus, Trash2, Check, X, Package } from 'lucide-react';
import { api } from '../api/client';
import { useApps, type App } from '../app/AppContext';
import PageHeader from '../components/PageHeader';
import { T, cardStyle, transition } from '../theme';

export default function Apps() {
  const { apps, currentAppId, setCurrentAppId, refresh } = useApps();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function create() {
    if (!name.trim() || !pkg.trim()) return;
    const res = await api.post('/api/apps', { name, packageName: pkg });
    setName(''); setPkg(''); setShowForm(false);
    await refresh();
    setCurrentAppId(res.data.id);
  }

  async function saveRename(id: string) {
    if (editName.trim()) await api.patch(`/api/apps/${id}`, { name: editName });
    setEditingId(null);
    await refresh();
  }

  async function remove(app: App) {
    if (!window.confirm(`Delete "${app.name}" and all its traces and keys? This cannot be undone.`)) return;
    await api.delete(`/api/apps/${app.id}`);
    await refresh();
  }

  return (
    <div>
      <PageHeader
        icon={<Boxes size={16} color={T.cyan} strokeWidth={1.5} />}
        title="Apps" subtitle="Create and manage your apps"
        accent="#00D4FF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #00D4FF 100%)"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {/* New App card */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              ...cardStyle,
              padding: '32px 24px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, cursor: 'pointer',
              border: `2px dashed var(--color-border)`,
              background: 'transparent',
              transition,
              minHeight: 160,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.color = T.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = T.muted; }}
          >
            <Plus size={28} color={T.muted} strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.muted }}>New App</span>
          </button>
        ) : (
          <div style={{ ...cardStyle, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 160 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>New App</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="App name" style={inputStyle} />
            <input value={pkg} onChange={e => setPkg(e.target.value)} placeholder="com.acme.app" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={create} style={primaryBtn}>Create</button>
              <button onClick={() => { setShowForm(false); setName(''); setPkg(''); }} style={ghostBtn}>Cancel</button>
            </div>
          </div>
        )}

        {/* App cards */}
        {apps.map(app => {
          const isActive = app.id === currentAppId;
          return (
            <div
              key={app.id}
              style={{
                ...cardStyle,
                padding: 0,
                display: 'flex', flexDirection: 'column',
                borderColor: isActive ? T.cyan : 'var(--color-border)',
                boxShadow: isActive ? `0 0 24px rgba(var(--color-cyan-rgb),0.15)` : 'none',
                transition,
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = isActive
                  ? `0 0 24px rgba(var(--color-cyan-rgb),0.2)`
                  : '0 8px 24px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = isActive ? `0 0 24px rgba(var(--color-cyan-rgb),0.15)` : 'none';
              }}
            >
              {/* Card header accent */}
              {isActive && (
                <div style={{ height: 3, background: 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))' }} />
              )}

              <div style={{ padding: '20px 22px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `rgba(var(--color-cyan-rgb),0.08)`,
                    border: `1px solid rgba(var(--color-cyan-rgb),0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Package size={18} color={T.cyan} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {editingId === app.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRename(app.id); if (e.key === 'Escape') setEditingId(null); }}
                          style={{ ...inputStyle, fontSize: 13 }}
                          autoFocus
                        />
                        <button onClick={() => saveRename(app.id)} style={iconBtn}><Check size={14} color={T.green} /></button>
                        <button onClick={() => setEditingId(null)} style={iconBtn}><X size={14} color={T.muted} /></button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.name}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted, fontFamily: T.fontM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.packageName}
                        </p>
                      </>
                    )}
                  </div>
                  {isActive && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: T.cyan,
                      fontFamily: T.fontM, letterSpacing: '0.08em',
                      background: `rgba(var(--color-cyan-rgb),0.1)`,
                      border: `1px solid rgba(var(--color-cyan-rgb),0.3)`,
                      borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Card footer */}
              <div style={{
                padding: '12px 22px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {!isActive && (
                  <button onClick={() => setCurrentAppId(app.id)} style={primaryBtn}>
                    Select
                  </button>
                )}
                <button
                  onClick={() => { setEditingId(app.id); setEditName(app.name); }}
                  style={ghostBtn}
                >
                  Rename
                </button>
                <button onClick={() => remove(app)} style={{ ...iconBtn, marginLeft: 'auto' }} title="Delete">
                  <Trash2 size={15} color={T.red} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
  background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, outline: 'none', width: '100%',
};
const primaryBtn: React.CSSProperties = {
  background: T.grad, border: 'none', color: '#fff', fontWeight: 600,
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--color-border)', color: T.muted,
  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, transition,
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
};
