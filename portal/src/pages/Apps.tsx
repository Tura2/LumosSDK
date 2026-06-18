import { useState } from 'react';
import { Boxes, Plus, Trash2, Check, X } from 'lucide-react';
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

      <button onClick={() => setShowForm(s => !s)} style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        background: T.grad, border: 'none', color: '#fff', fontWeight: 700,
        padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
      }}>
        <Plus size={16} /> New App
      </button>

      {showForm && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="App name" style={appInput} />
          <input value={pkg} onChange={e => setPkg(e.target.value)} placeholder="com.acme.app" style={appInput} />
          <button onClick={create} style={primaryBtn}>Create</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apps.map(app => (
          <div key={app.id} style={{
            ...cardStyle, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
            borderColor: app.id === currentAppId ? T.cyan : T.border,
          }}>
            <div style={{ flex: 1 }}>
              {editingId === app.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={appInput} />
                  <button onClick={() => saveRename(app.id)} style={iconBtn}><Check size={16} color={T.green} /></button>
                  <button onClick={() => setEditingId(null)} style={iconBtn}><X size={16} color={T.muted} /></button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.fontD }}>{app.name}</p>
                  <p style={{ fontSize: 12, color: T.muted, fontFamily: T.fontM }}>{app.packageName}</p>
                </>
              )}
            </div>
            {app.id === currentAppId
              ? <span style={{ fontSize: 11, color: T.cyan, fontFamily: T.fontM }}>SELECTED</span>
              : <button onClick={() => setCurrentAppId(app.id)} style={ghostBtn}>Select</button>}
            <button onClick={() => { setEditingId(app.id); setEditName(app.name); }} style={ghostBtn}>Rename</button>
            <button onClick={() => remove(app)} style={iconBtn} title="Delete"><Trash2 size={16} color={T.red} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const appInput: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`,
  background: T.bg, color: T.text, fontSize: 14, outline: 'none', flex: 1, minWidth: 160,
};
const primaryBtn: React.CSSProperties = {
  background: T.grad, border: 'none', color: '#fff', fontWeight: 700,
  padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
};
const ghostBtn: React.CSSProperties = {
  background: 'none', border: `1px solid ${T.border}`, color: T.muted,
  borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, transition,
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
};
