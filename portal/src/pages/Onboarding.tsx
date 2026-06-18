import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { api } from '../api/client';
import { useApps } from '../app/AppContext';
import { T, cardStyle } from '../theme';

export default function Onboarding() {
  const { refresh, setCurrentAppId } = useApps();
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    if (!name.trim() || !pkg.trim()) { setError('Both fields are required'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/apps', { name, packageName: pkg });
      await refresh();
      setCurrentAppId(res.data.id);
    } catch {
      setError('Could not create app. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '8vh auto 0' }}>
      <div style={{ ...cardStyle, padding: 40 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: 20,
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Rocket size={20} color={T.cyan} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.fontD, marginBottom: 8 }}>
          Create your first app
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>
          An app groups your traces and API keys. You can add more later.
        </p>
        {error && <p style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="App name (e.g. My Android App)"
          style={onbInput}
        />
        <input
          value={pkg} onChange={e => setPkg(e.target.value)}
          placeholder="Package name (e.g. com.acme.app)"
          style={{ ...onbInput, marginTop: 12 }}
        />
        <button onClick={create} disabled={busy} style={{
          width: '100%', marginTop: 20, padding: 12, border: 'none', borderRadius: 10,
          background: T.grad, color: '#fff', fontWeight: 700, fontSize: 15,
          cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
        }}>
          {busy ? 'Creating…' : 'Create app'}
        </button>
      </div>
    </div>
  );
}

const onbInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
