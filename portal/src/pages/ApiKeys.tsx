import { useEffect, useState } from 'react';
import { Plus, X, Copy, Check, Key, Trash2, ShieldOff } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';
import { useApps } from '../app/AppContext';
import PageHeader from '../components/PageHeader';

interface KeyRow {
  id: string; name: string; createdAt: string;
  lastUsedAt: string | null; revoked: boolean;
  keySuffix?: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function ConfirmDialog({
  icon, title, subtitle, body, confirmLabel, onConfirm, onCancel,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; body: string;
  confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(4,8,16,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '28px 28px 24px', maxWidth: 400, width: '90%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(var(--color-red-rgb),0.1)',
            border: '1px solid rgba(var(--color-red-rgb),0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.fontD }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: T.fontM }}>{subtitle}</p>}
          </div>
        </div>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 24 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: `1px solid var(--color-border)`,
              color: T.muted, borderRadius: 8, padding: '8px 18px',
              cursor: 'pointer', fontSize: 13, transition,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.red, border: 'none',
              color: '#fff', borderRadius: 8, padding: '8px 18px',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, transition,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApiKeys() {
  const { currentAppId } = useApps();
  const [keys, setKeys]             = useState<KeyRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newSecret, setNewSecret]   = useState<string | null>(null);
  const [keyName, setKeyName]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [inputFocused, setFocused]  = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

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

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = newSecret;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
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
            fontFamily: T.fontD, letterSpacing: '-0.01em', flexShrink: 0,
          }}
        >
          <Plus size={16} /> New Key
        </button>
      </div>

      {/* Revealed secret */}
      {newSecret && (
        <div style={{
          background: 'rgba(var(--color-green-rgb),0.06)',
          border: '1px solid rgba(var(--color-green-rgb),0.3)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} color={T.green} />
              <p style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>
                Key created — copy it now, it won't be shown again
              </p>
            </div>
            <button onClick={() => setNewSecret(null)}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px',
          }}>
            <code style={{ fontFamily: T.fontM, fontSize: 12, color: T.text, wordBreak: 'break-all', flex: 1 }}>
              {newSecret}
            </code>
            <button onClick={copySecret} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(var(--color-green-rgb),0.15)', border: '1px solid rgba(var(--color-green-rgb),0.3)',
              borderRadius: 7, padding: '6px 12px', color: T.green,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0, transition,
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
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 10, fontFamily: T.fontM, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Key name
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              autoFocus
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Production App"
              style={{
                flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${inputFocused ? T.cyan : T.border}`,
                background: T.bg, color: T.text, fontSize: 14,
                outline: 'none', transition, fontFamily: 'inherit',
              }}
            />
            <button onClick={createKey} disabled={!keyName.trim()} style={{
              background: T.grad, border: 'none', color: T.bg,
              fontWeight: 700, padding: '10px 20px', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, fontFamily: T.fontD,
              opacity: keyName.trim() ? 1 : 0.5,
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

      {/* Key rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {keys.map(k => {
          const accentColor = k.revoked ? 'rgba(255,69,99,0.55)' : 'rgba(0,232,135,0.55)';
          const maskedKey = k.keySuffix
            ? `lms_${'•'.repeat(16)}${k.keySuffix}`
            : `lms_${'•'.repeat(18)}`;

          return (
            <div key={k.id} style={{
              ...cardStyle,
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              borderLeft: `3px solid ${accentColor}`,
              transition,
              opacity: k.revoked ? 0.75 : 1,
            }}>
              {/* Key icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: k.revoked ? 'rgba(255,69,99,0.08)' : 'rgba(0,232,135,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Key size={15} color={k.revoked ? T.red : T.green} strokeWidth={1.5} />
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.fontD, marginBottom: 5 }}>
                  {k.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <code style={{
                    fontSize: 11, color: T.text, fontFamily: T.fontM,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                    borderRadius: 5, padding: '2px 9px', letterSpacing: '0.04em',
                  }}>
                    {maskedKey}
                  </code>
                  <span style={{ color: T.muted, fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, color: T.muted }}>
                    Created {relativeTime(k.createdAt)}
                  </span>
                  <span style={{ color: T.muted, fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, color: k.lastUsedAt ? T.muted : 'rgba(106,125,154,0.5)' }}>
                    {k.lastUsedAt ? `Used ${relativeTime(k.lastUsedAt)}` : 'Never used'}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: k.revoked ? 'rgba(255,69,99,0.1)' : 'rgba(0,232,135,0.1)',
                border: `1px solid ${k.revoked ? 'rgba(255,69,99,0.25)' : 'rgba(0,232,135,0.25)'}`,
                borderRadius: 100, padding: '4px 12px',
                color: k.revoked ? T.red : T.green,
                fontSize: 11, fontWeight: 700, fontFamily: T.fontM,
                flexShrink: 0,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: k.revoked ? T.red : T.green,
                  flexShrink: 0,
                }} />
                {k.revoked ? 'Revoked' : 'Active'}
              </span>

              {/* Actions */}
              {!k.revoked && (
                <button
                  onClick={() => setConfirmRevokeId(k.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: `1px solid var(--color-border)`,
                    color: T.muted, padding: '6px 14px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    minHeight: 34, transition, flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.red;
                    e.currentTarget.style.color = T.red;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = T.muted;
                  }}
                >
                  <ShieldOff size={13} /> Revoke
                </button>
              )}
              {k.revoked && (
                <button
                  onClick={() => setConfirmDeleteId(k.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: `1px solid rgba(255,69,99,0.3)`,
                    color: T.red, padding: '6px 14px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    minHeight: 34, transition, flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,99,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!loading && keys.length === 0 && (
        <div style={{ ...cardStyle, padding: '56px 24px', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
            background: 'rgba(var(--color-amber-rgb),0.08)',
            border: '1px solid rgba(var(--color-amber-rgb),0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Key size={20} color={T.amber} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>No API keys yet</p>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Create a key to connect your Android app to the Lumos server.</p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: T.grad, border: 'none', color: T.bg,
              fontWeight: 700, padding: '10px 20px', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, fontFamily: T.fontD,
            }}
          >
            <Plus size={15} /> Create first key
          </button>
        </div>
      )}

      {/* Revoke confirmation */}
      {confirmRevokeId && (
        <ConfirmDialog
          icon={<ShieldOff size={18} color={T.red} />}
          title="Revoke API key?"
          subtitle={keys.find(k => k.id === confirmRevokeId)?.name}
          body="Any app or device using this key will immediately lose access. This cannot be undone."
          confirmLabel="Revoke key"
          onConfirm={async () => { await revoke(confirmRevokeId); setConfirmRevokeId(null); }}
          onCancel={() => setConfirmRevokeId(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <ConfirmDialog
          icon={<Trash2 size={18} color={T.red} />}
          title="Delete API key?"
          subtitle={keys.find(k => k.id === confirmDeleteId)?.name}
          body="This will permanently remove the key from your account. This action cannot be undone."
          confirmLabel="Delete key"
          onConfirm={async () => { await deleteKey(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
