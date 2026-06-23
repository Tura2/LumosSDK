import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Copy, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useApps } from '../app/AppContext';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import { T, cardStyle, transition } from '../theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? T.green : T.muted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 8px' }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function Settings() {
  const { currentApp, currentAppId, refresh } = useApps();
  const { logout } = useAuth();
  const nav = useNavigate();

  // Account state
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');

  // SDK config state
  const [apiKey, setApiKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [debug, setDebug] = useState(false);
  const [debugSaving, setDebugSaving] = useState(false);

  // Danger zone
  const [deleteAppInput, setDeleteAppInput] = useState('');
  const [deleteAccountInput, setDeleteAccountInput] = useState('');

  useEffect(() => {
    // Fetch account info
    api.get('/api/account').then(r => {
      setAccountName(r.data.name ?? '');
      setAccountEmail(r.data.email ?? '');
    }).catch(() => {});

    // Fetch first API key for SDK config display
    if (currentAppId) {
      api.get(`/api/apps/${currentAppId}/keys`).then(r => {
        const activeKey = r.data.find((k: { revoked: boolean; id: string }) => !k.revoked);
        setApiKey(activeKey?.id ?? '');
      }).catch(() => {});
      setServerUrl(window.location.origin.replace(':5173', ':8080'));
      setDebug(currentApp?.debug ?? false);
    }
  }, [currentAppId, currentApp]);

  async function saveAccount() {
    setAccountSaving(true);
    try {
      await api.patch('/api/account', { name: accountName, email: accountEmail });
      setAccountMsg('Saved');
    } catch {
      setAccountMsg('Error saving');
    } finally {
      setAccountSaving(false);
      setTimeout(() => setAccountMsg(''), 3000);
    }
  }

  async function toggleDebug() {
    if (!currentAppId) return;
    setDebugSaving(true);
    try {
      await api.patch(`/api/apps/${currentAppId}`, { debug: !debug });
      setDebug(d => !d);
      await refresh();
    } finally {
      setDebugSaving(false);
    }
  }

  async function deleteApp() {
    if (!currentApp || deleteAppInput !== currentApp.name) return;
    await api.delete(`/api/apps/${currentApp.id}`);
    await refresh();
    nav('/apps');
  }

  async function deleteAccount() {
    if (deleteAccountInput !== accountEmail) return;
    await api.delete('/api/account');
    logout();
    nav('/login');
  }

  const initSnippet = `Lumos.init(this) {
    apiKey = "${apiKey || 'lk_your_api_key'}"
    serverUrl = "${serverUrl || 'https://your-lumos-server.com'}"
    debug = BuildConfig.DEBUG
}`;

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader
        icon={<SlidersHorizontal size={16} color={T.cyan} strokeWidth={1.5} />}
        title="Settings"
        subtitle="Account, SDK configuration, and danger zone"
        accent="#00D4FF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #00D4FF 100%)"
      />

      {/* SDK Config */}
      <Section title="SDK Configuration">
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Paste this into your <code style={{ fontFamily: T.fontM, color: T.cyan }}>Application.onCreate()</code> to initialise the SDK.
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{
              fontFamily: T.fontM, fontSize: 12, color: T.text,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '14px 16px', overflowX: 'auto', lineHeight: 1.7,
            }}>
              {initSnippet}
            </pre>
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <CopyButton text={initSnippet} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Debug logging</p>
              <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Outputs trace events to Logcat</p>
            </div>
            <button
              onClick={toggleDebug}
              disabled={debugSaving}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: debug ? T.cyan : 'var(--color-border)', transition,
                position: 'relative', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: debug ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff', transition,
              }} />
            </button>
          </div>
        </div>
      </Section>

      {/* Account Settings */}
      <Section title="Account Settings">
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>
            Display name
            <input
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Email
            <input
              value={accountEmail}
              onChange={e => setAccountEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button onClick={saveAccount} disabled={accountSaving} style={primaryBtn}>
              {accountSaving ? 'Saving…' : 'Save changes'}
            </button>
            {accountMsg && <span style={{ fontSize: 12, color: accountMsg.startsWith('Error') ? T.red : T.green }}>{accountMsg}</span>}
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Delete app */}
          {currentApp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={14} color={T.red} />
                <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Delete "{currentApp.name}"</p>
              </div>
              <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
                Permanently deletes this app and all its traces, spans, feedback, and API keys. Type the app name to confirm.
              </p>
              <input
                value={deleteAppInput}
                onChange={e => setDeleteAppInput(e.target.value)}
                placeholder={currentApp.name}
                style={{ ...inputStyle, borderColor: deleteAppInput === currentApp.name ? T.red : 'var(--color-border)' }}
              />
              <button
                onClick={deleteApp}
                disabled={deleteAppInput !== currentApp.name}
                style={{ ...dangerBtn, opacity: deleteAppInput !== currentApp.name ? 0.4 : 1 }}
              >
                Delete app
              </button>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Delete account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color={T.red} />
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Delete account</p>
            </div>
            <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Permanently deletes your account and all apps, traces, and API keys. This cannot be undone. Type your email to confirm.
            </p>
            <input
              value={deleteAccountInput}
              onChange={e => setDeleteAccountInput(e.target.value)}
              placeholder={accountEmail}
              style={{ ...inputStyle, borderColor: deleteAccountInput === accountEmail && accountEmail ? T.red : 'var(--color-border)' }}
            />
            <button
              onClick={deleteAccount}
              disabled={deleteAccountInput !== accountEmail || !accountEmail}
              style={{ ...dangerBtn, opacity: deleteAccountInput !== accountEmail || !accountEmail ? 0.4 : 1 }}
            >
              Delete account
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
  background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13,
  outline: 'none', width: '100%', marginTop: 6, transition,
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', fontSize: 12, fontWeight: 600,
  color: T.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
};
const primaryBtn: React.CSSProperties = {
  background: T.grad, border: 'none', color: '#fff', fontWeight: 600,
  padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  background: 'none', border: `1px solid ${T.red}`, color: T.red,
  padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition,
};
