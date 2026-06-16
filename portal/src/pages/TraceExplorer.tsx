import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';

interface TraceRow {
  traceId: string; feature: string; status: string;
  latencyMs: number | null; tokensIn: number | null; tokensOut: number | null; startedAt: string;
}

const PAGE_SIZE = 10;
const COLS = '2fr 1fr 1fr 1fr 1.5fr';

export default function TraceExplorer() {
  const [traces, setTraces]     = useState<TraceRow[]>([]);
  const [page, setPage]         = useState(0);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) api.get(`/api/apps/${id}/traces`).then(r => setTraces(r.data));
    });
  }, []);

  const pageTraces = traces.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext    = (page + 1) * PAGE_SIZE < traces.length;

  if (traces.length === 0) return (
    <div>
      <h2 style={{ color: T.text, marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Traces</h2>
      <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
        No traces yet. Send a message in the demo app.
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: T.text, marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Traces</h2>

      {/* Card table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>

        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS,
          padding: '12px 20px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          {['Feature', 'Status', 'Latency', 'Tokens', 'Time'].map(h => (
            <span key={h} style={{
              fontSize: 11, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase' as const,
              color: T.muted,
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        {pageTraces.map((t, idx) => (
          <div
            key={t.traceId}
            onClick={() => nav(`/traces/${t.traceId}`)}
            onMouseEnter={() => setHovered(t.traceId)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'grid', gridTemplateColumns: COLS,
              padding: '14px 20px',
              borderBottom: idx < pageTraces.length - 1
                ? `1px solid rgba(46,61,84,0.5)` : 'none',
              cursor: 'pointer', transition,
              background: hoveredId === t.traceId ? 'rgba(0,212,255,0.04)' : 'transparent',
              alignItems: 'center',
            }}
          >
            {/* Feature */}
            <span style={{
              fontFamily: 'monospace', fontSize: 12,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 6, padding: '3px 8px',
              color: T.cyan, display: 'inline-block',
            }}>
              {t.feature}
            </span>

            {/* Status */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: t.status === 'OK'
                ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
              border: `1px solid ${t.status === 'OK'
                ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
              borderRadius: 100, padding: '3px 10px',
              color: t.status === 'OK' ? T.green : T.red,
              fontSize: 12, width: 'fit-content',
            }}>
              {t.status === 'OK' ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {t.status}
            </span>

            {/* Latency */}
            <span style={{ fontSize: 13, color: t.latencyMs != null ? T.text : T.muted }}>
              {t.latencyMs != null ? `${t.latencyMs}ms` : '—'}
            </span>

            {/* Tokens */}
            <span style={{ fontSize: 13 }}>
              {t.tokensIn != null
                ? <>
                    <span style={{ color: T.cyan }}>{t.tokensIn}↑</span>
                    {' '}
                    <span style={{ color: T.muted }}>{t.tokensOut}↓</span>
                  </>
                : <span style={{ color: T.muted }}>—</span>}
            </span>

            {/* Time */}
            <span style={{ fontSize: 11, color: T.muted }}>
              {new Date(t.startedAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {traces.length > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            style={{
              ...cardStyle, padding: '8px 16px', fontSize: 13,
              color: T.text, border: `1px solid ${T.border}`, transition,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: T.muted }}>Page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasNext}
            style={{
              ...cardStyle, padding: '8px 16px', fontSize: 13,
              color: T.text, border: `1px solid ${T.border}`, transition,
              cursor: !hasNext ? 'not-allowed' : 'pointer',
              opacity: !hasNext ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
