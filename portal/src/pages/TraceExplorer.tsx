import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Activity } from 'lucide-react';
import { api } from '../api/client';
import { TracesSkeleton } from '../components/Skeleton';
import { T, cardStyle, transition } from '../theme';

interface TraceRow {
  traceId: string; feature: string; status: string;
  latencyMs: number | null; tokensIn: number | null; tokensOut: number | null; startedAt: string;
}

const PAGE_SIZE = 10;
const COLS = '2fr 1fr 1fr 1fr 1.5fr';

export default function TraceExplorer() {
  const [traces, setTraces]     = useState<TraceRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) {
        api.get(`/api/apps/${id}/traces`)
          .then(r => setTraces(r.data))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const pageTraces = traces.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext    = (page + 1) * PAGE_SIZE < traces.length;

  if (loading) return <TracesSkeleton />;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(123,95,255,0.1)',
            border: '1px solid rgba(123,95,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Activity size={16} color={T.purple} strokeWidth={1.5} />
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em',
            fontFamily: T.fontD,
            background: 'linear-gradient(135deg, #E8F2FF 0%, #7B5FFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            Traces
          </h1>
        </div>
        <p style={{ color: T.muted, fontSize: 14, paddingLeft: 48 }}>
          {traces.length > 0 ? `${traces.length} conversations recorded` : 'No traces yet'}
        </p>
      </div>

      {traces.length === 0 ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          No traces yet. Send a message in the demo app.
        </div>
      ) : (
        <>
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
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: T.muted, fontFamily: T.fontM,
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
                  borderBottom: idx < pageTraces.length - 1 ? `1px solid rgba(46,61,84,0.4)` : 'none',
                  cursor: 'pointer', transition,
                  background: hoveredId === t.traceId ? 'rgba(0,212,255,0.04)' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <span style={{
                  fontFamily: T.fontM, fontSize: 11,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 6, padding: '3px 8px',
                  color: T.cyan, display: 'inline-block',
                  whiteSpace: 'nowrap',
                }}>
                  {t.feature}
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: t.status === 'OK' ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
                  border: `1px solid ${t.status === 'OK' ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
                  borderRadius: 100, padding: '3px 10px',
                  color: t.status === 'OK' ? T.green : T.red,
                  fontSize: 12, width: 'fit-content',
                }}>
                  {t.status === 'OK' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {t.status}
                </span>

                <span style={{ fontSize: 13, color: t.latencyMs != null ? T.text : T.muted, fontFamily: T.fontM }}>
                  {t.latencyMs != null ? `${t.latencyMs}ms` : '—'}
                </span>

                <span style={{ fontSize: 12, fontFamily: T.fontM }}>
                  {t.tokensIn != null ? (
                    <>
                      <span style={{ color: T.cyan }}>{t.tokensIn}↑</span>
                      {' '}
                      <span style={{ color: T.muted }}>{t.tokensOut}↓</span>
                    </>
                  ) : (
                    <span style={{ color: T.muted }}>—</span>
                  )}
                </span>

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
                onClick={() => setPage(p => p - 1)} disabled={page === 0}
                style={{
                  ...cardStyle, padding: '8px 16px', fontSize: 13,
                  color: T.text, cursor: page === 0 ? 'not-allowed' : 'pointer',
                  opacity: page === 0 ? 0.4 : 1, transition,
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: T.muted, fontFamily: T.fontM }}>Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)} disabled={!hasNext}
                style={{
                  ...cardStyle, padding: '8px 16px', fontSize: 13,
                  color: T.text, cursor: !hasNext ? 'not-allowed' : 'pointer',
                  opacity: !hasNext ? 0.4 : 1, transition,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
