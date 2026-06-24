import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useApps } from '../app/AppContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { T, cardStyle, transition } from '../theme';

interface SessionSummary {
  sessionId: string;
  traceCount: number;
  firstSeen: string;
  lastSeen: string;
  errorCount: number;
  features: string[];
}

interface TraceRow {
  traceId: string;
  feature: string;
  status: string;
  model: string;       // "" when null
  latencyMs: string;   // "" when null
  startedAt: string;
}

function formatDuration(firstSeen: string, lastSeen: string): string {
  const ms = new Date(lastSeen).getTime() - new Date(firstSeen).getTime();
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

function SessionCard({ session, appId }: { session: SessionSummary; appId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function toggle() {
    if (!expanded && traces.length === 0) {
      setLoading(true);
      try {
        const res = await api.get(`/api/apps/${appId}/sessions/${session.sessionId}/traces`);
        setTraces(res.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    setExpanded(e => !e);
  }

  const shortId = session.sessionId.slice(0, 12) + '…';
  const duration = formatDuration(session.firstSeen, session.lastSeen);

  return (
    <div style={{ ...cardStyle, overflow: 'hidden', transition }}>
      {/* Session header row */}
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', transition,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = `rgba(var(--color-cyan-rgb),0.03)`)}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ color: T.muted, flexShrink: 0 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>

        <span style={{ fontFamily: T.fontM, fontSize: 12, color: T.cyan, flexShrink: 0 }}>
          {shortId}
        </span>

        <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>
          {duration}
        </span>

        <span style={{
          fontSize: 11, fontWeight: 600, color: T.cyan, fontFamily: T.fontM,
          background: `rgba(var(--color-cyan-rgb),0.08)`,
          border: `1px solid rgba(var(--color-cyan-rgb),0.2)`,
          borderRadius: 6, padding: '2px 8px', flexShrink: 0,
        }}>
          {session.traceCount} {session.traceCount === 1 ? 'trace' : 'traces'}
        </span>

        {session.errorCount > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: T.red, fontFamily: T.fontM,
            background: `rgba(var(--color-red-rgb),0.08)`,
            border: `1px solid rgba(var(--color-red-rgb),0.2)`,
            borderRadius: 6, padding: '2px 8px', flexShrink: 0,
          }}>
            <AlertCircle size={10} />
            {session.errorCount} error{session.errorCount > 1 ? 's' : ''}
          </span>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {session.features.slice(0, 3).map(f => (
            <span key={f} style={{
              fontSize: 11, color: T.muted, fontFamily: T.fontM,
              background: 'var(--color-card2)', borderRadius: 6,
              padding: '2px 8px', border: '1px solid var(--color-border)',
            }}>
              {f}
            </span>
          ))}
          {session.features.length > 3 && (
            <span style={{ fontSize: 11, color: T.muted }}>+{session.features.length - 3} more</span>
          )}
        </div>

        <span style={{ fontSize: 11, color: T.muted, flexShrink: 0, marginLeft: 'auto' }}>
          {new Date(session.lastSeen).toLocaleString()}
        </span>
      </button>

      {/* Expanded trace list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {loading ? (
            <div style={{ padding: '16px 24px', color: T.muted, fontSize: 13 }}>Loading…</div>
          ) : traces.map((t, idx) => (
            <div
              key={t.traceId}
              onClick={() => nav(`/traces/${t.traceId}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.4fr',
                columnGap: 16,
                padding: '12px 20px 12px 52px',
                borderBottom: idx < traces.length - 1 ? '1px solid rgba(var(--color-border-rgb),0.4)' : 'none',
                cursor: 'pointer', transition,
                alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `rgba(var(--color-cyan-rgb),0.03)`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                fontFamily: T.fontM, fontSize: 11, color: T.cyan,
                background: `rgba(var(--color-cyan-rgb),0.08)`,
                border: `1px solid rgba(var(--color-cyan-rgb),0.2)`,
                borderRadius: 6, padding: '2px 8px', display: 'inline-block',
                whiteSpace: 'nowrap',
              }}>
                {t.feature}
              </span>
              <StatusBadge status={t.status} />
              <span style={{ fontSize: 12, color: T.muted, fontFamily: T.fontM }}>{t.model || '—'}</span>
              <span style={{ fontSize: 12, color: T.text, fontFamily: T.fontM }}>
                {t.latencyMs ? `${t.latencyMs}ms` : '—'}
              </span>
              <span style={{ fontSize: 11, color: T.muted }}>{new Date(t.startedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sessions() {
  const { currentAppId } = useApps();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    api.get(`/api/apps/${currentAppId}/sessions`)
      .then(r => setSessions(r.data))
      .catch(() => setError('Failed to load sessions.'))
      .finally(() => setLoading(false));
  }, [currentAppId]);

  return (
    <div>
      <PageHeader
        icon={<GitBranch size={16} color={T.purple} strokeWidth={1.5} />}
        title="Sessions"
        subtitle="User journeys — grouped traces by session"
        accent="#7B5FFF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #7B5FFF 100%)"
      />

      {error ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.red, fontSize: 14 }}>
          {error}
        </div>
      ) : loading ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          No sessions yet. Send traces from the SDK to see user journeys here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => (
            <SessionCard key={s.sessionId} session={s} appId={currentAppId!} />
          ))}
        </div>
      )}
    </div>
  );
}
