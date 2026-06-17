import { useEffect, useState } from 'react';
import { Plus, X, Copy, Check } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';

interface KeyRow {
  id: string; name: string; createdAt: string;
  lastUsedAt: string | null; revoked: boolean;
}

export default function ApiKeys() {
  const [keys, setKeys]           = useState<KeyRow[]>([]);
  const [appId, setAppId]         = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [keyName, setKeyName]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [inputFocused, setFocused]= useState(false);

  const loadKeys = (id: string) =>
    api.get(`/api/apps/${id}/keys`).then(r => setKeys(r.data));

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

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700 }}>API Keys</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.grad,
            border: 'none', color: T.bg, fontWeight: 700,
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, minHeight: 44, transition,
          }}
        >
          <Plus size={16} /> New Key
        </button>
      </div>

      {/* Revealed secret */}
      {newSecret && (
        <div style={{
          background: 'rgba(0,232,135,0.06)',
          border: '1px solid rgba(0,232,135,0.3)',
          borderRadius: 12, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>
              Key created — copy it now, it won't be shown again:
            </p>
            <button
              onClick={() => setNewSecret(null)}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ fontFamily: 'monospace', fontSize: 13, color: T.text, wordBreak: 'break-all', flex: 1 }}>
              {newSecret}
            </code>
            <button
              onClick={copySecret}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(0,232,135,0.12)',
                border: '1px solid rgba(0,232,135,0.25)',
                borderRadius: 6, padding: '4px 10px',
                color: T.green, cursor: 'pointer', fontSize: 12,
                flexShrink: 0, transition,
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create key form */}
      {showForm && (
        <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Key name</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Production App"
              style={{
                width: 280, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${inputFocused ? T.cyan : T.border}`,
                background: T.bg, color: T.text, fontSize: 14, outline: 'none', transition,
              }}
            />
            <button
              onClick={createKey}
              style={{
                background: T.grad,
                border: 'none', color: T.bg, fontWeight: 700,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'none', border: `1px solid ${T.border}`,
                color: T.muted, borderRadius: 10,
                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Key cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keys.map(k => (
          <div key={k.id} style={{
            ...cardStyle, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{k.name}</p>
              <p style={{ fontSize: 11, color: T.muted }}>
                Created {new Date(k.createdAt).toLocaleDateString()}
                {k.lastUsedAt
                  ? ` · Last used ${new Date(k.lastUsedAt).toLocaleString()}`
                  : ' · Never used'}
              </p>
            </div>
            <span style={{
              background: k.revoked ? 'rgba(255,69,99,0.12)' : 'rgba(0,232,135,0.12)',
              border: `1px solid ${k.revoked ? 'rgba(255,69,99,0.25)' : 'rgba(0,232,135,0.25)'}`,
              borderRadius: 100, padding: '4px 12px',
              color: k.revoked ? T.red : T.green,
              fontSize: 12, fontWeight: 600,
            }}>
              {k.revoked ? 'Revoked' : 'Active'}
            </span>
            {!k.revoked && (
              <button
                onClick={() => revoke(k.id)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,99,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                style={{
                  background: 'none', border: `1px solid ${T.red}`,
                  color: T.red, padding: '6px 14px',
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, minHeight: 36, transition,
                }}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
