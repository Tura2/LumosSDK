import { useEffect, useState } from 'react';
import { Plus, X, Copy, Check, Key, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';
import { useApps } from '../app/AppContext';
import PageHeader from '../components/PageHeader';

interface KeyRow {
  id: string; name: string; createdAt: string;
  lastUsedAt: string | null; revoked: boolean;
}

export default function ApiKeys() {
  const { currentAppId } = useApps();
  const [keys, setKeys]           = useState<KeyRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [keyName, setKeyName]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [inputFocused, setFocused]= useState(false);

  const loadKeys = async (id: string) => {
    const r = await api.get(`/api/apps/${id}/keys`);
    setKeys(r.data);
  };

  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    loadKeys(currentAppId).finally(() => setLoading(false));
  }, [currentAppId]);

  async function createKey() {
    if (!currentAppId || !keyName.trim()) return;
    const res = await api.post(`/api/apps/${currentAppId}/keys`, { name: keyName });
    setNewSecret(res.data.secret);
    setKeyName(''); setShowForm(false);
    await loadKeys(currentAppId);
  }

  async function revoke(keyId: string) {
    await api.delete(`/api/keys/${keyId}`);
    if (currentAppId) await loadKeys(currentAppId);
  }

  async function deleteKey(keyId: string) {
    if (!currentAppId) return;
    await api.delete(`/api/apps/${currentAppId}/keys/${keyId}`);
    await loadKeys(currentAppId);
  }

  function copySecret() {
    if (!newSecret) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(newSecret).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => execCopy(newSecret));
    } else {
      execCopy(newSecret);
    }
  }

  function execCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    Object.assign(ta.style, { position: 'fixed', opacity: '0', top: '0', left: '0' });
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          icon={<Key size={16} color={T.amber} strokeWidth={1.5} />}
          title="API Keys" subtitle="Manage authentication keys for your app"
          accent="#FFB800"
          titleGradient="linear-gradient(135deg, #E8F2FF 0%, #FFB800 100%)"
        />

        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.grad, border: 'none', color: T.bg,
            fontWeight: 700, padding: '10px 20px', borderRadius: 10,
            cursor: 'pointer', fontSize: 14, minHeight: 44, transition,
            fontFamily: T.fontD, letterSpacing: '-0.01em',
            flexShrink: 0,
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
          borderRadius: 14, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>
              Key created — copy it now, it won't be shown again:
            </p>
            <button onClick={() => setNewSecret(null)}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ fontFamily: T.fontM, fontSize: 12, color: T.text, wordBreak: 'break-all', flex: 1 }}>
              {newSecret}
            </code>
            <button onClick={copySecret} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(0,232,135,0.12)', border: '1px solid rgba(0,232,135,0.25)',
              borderRadius: 6, padding: '4px 10px', color: T.green,
              cursor: 'pointer', fontSize: 12, flexShrink: 0, transition,
            }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 8, fontFamily: T.fontM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Key name
          </p>
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
                background: T.bg, color: T.text, fontSize: 14,
                outline: 'none', transition, fontFamily: 'inherit',
              }}
            />
            <button onClick={createKey} style={{
              background: T.grad, border: 'none', color: T.bg,
              fontWeight: 700, padding: '10px 20px', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, fontFamily: T.fontD,
            }}>
              Create
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: 'none', border: `1px solid ${T.border}`,
              color: T.muted, borderRadius: 10, padding: '10px 16px',
              cursor: 'pointer', fontSize: 14, transition,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Key cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keys.map(k => (
          <div key={k.id} style={{
            ...cardStyle, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            transition,
          }}>
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: k.revoked ? 'rgba(255,69,99,0.08)' : 'rgba(0,232,135,0.08)',
              border: `1px solid ${k.revoked ? 'rgba(255,69,99,0.2)' : 'rgba(0,232,135,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Key size={16} color={k.revoked ? T.red : T.green} strokeWidth={1.5} />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4, fontFamily: T.fontD }}>
                {k.name}
              </p>
              <p style={{ fontSize: 11, color: T.muted, fontFamily: T.fontM }}>
                Created {new Date(k.createdAt).toLocaleDateString()}
                {k.lastUsedAt
                  ? ` · Last used ${new Date(k.lastUsedAt).toLocaleString()}`
                  : ' · Never used'}
              </p>
            </div>

            <span style={{
              background: k.revoked ? 'rgba(255,69,99,0.12)' : 'rgba(0,232,135,0.12)',
              border: `1px solid ${k.revoked ? 'rgba(255,69,99,0.25)' : 'rgba(0,232,135,0.25)'}`,
              borderRadius: 100, padding: '4px 14px',
              color: k.revoked ? T.red : T.green,
              fontSize: 12, fontWeight: 600, fontFamily: T.fontM,
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
                  color: T.red, padding: '6px 16px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  minHeight: 36, transition,
                }}
              >
                Revoke
              </button>
            )}
            {k.revoked && (
              <button
                onClick={() => deleteKey(k.id)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,99,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: `1px solid ${T.red}`,
                  color: T.red, padding: '6px 16px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  minHeight: 36, transition,
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && keys.length === 0 && (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          No API keys yet. Create one to connect your app.
        </div>
      )}
    </div>
  );
}
