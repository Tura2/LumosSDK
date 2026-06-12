import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface KeyRow { id: string; name: string; createdAt: string; lastUsedAt: string | null; revoked: boolean; }

export default function ApiKeys() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [appId, setAppId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadKeys = (id: string) => api.get(`/api/apps/${id}/keys`).then(r => setKeys(r.data));

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) { setAppId(id); loadKeys(id); }
    });
  }, []);

  async function createKey() {
    if (!appId || !keyName.trim()) return;
    const res = await api.post(`/api/apps/${appId}/keys`, { name: keyName });
    setNewSecret(res.data.secret);
    setKeyName(''); setShowForm(false);
    loadKeys(appId);
  }

  async function revoke(keyId: string) {
    await api.delete(`/api/keys/${keyId}`);
    if (appId) loadKeys(appId);
  }

  return (
    <div style={{ color: '#ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#fff' }}>API Keys</h2>
        <button onClick={() => setShowForm(true)} style={btnStyle}>+ Create Key</button>
      </div>

      {newSecret && (
        <div style={{ background: '#1a2e1a', border: '1px solid #4caf50', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#4caf50', fontWeight: 600 }}>Key created — copy it now, it won't be shown again:</p>
          <code style={{ wordBreak: 'break-all', color: '#fff' }}>{newSecret}</code>
          <button onClick={() => setNewSecret(null)}
            style={{ marginLeft: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showForm && (
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Key name"
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #333', background: '#0f0f1a', color: '#fff', marginRight: 12, width: 240 }} />
          <button onClick={createKey} style={btnStyle}>Create</button>
          <button onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#333', marginLeft: 8 }}>Cancel</button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            {['Name', 'Created', 'Last Used', 'Status', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '12px' }}>{k.name}</td>
              <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}</td>
              <td style={{ padding: '12px', color: k.revoked ? '#e94560' : '#4caf50' }}>{k.revoked ? 'Revoked' : 'Active'}</td>
              <td style={{ padding: '12px' }}>
                {!k.revoked && (
                  <button onClick={() => revoke(k.id)}
                    style={{ background: 'none', border: '1px solid #e94560', color: '#e94560', padding: '4px 12px', borderRadius: 6, cursor: 'pointer' }}>
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#e94560', border: 'none', color: '#fff',
  padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
};
