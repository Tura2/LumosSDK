import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';

interface TraceDetailData {
  traceId: string; feature: string; status: string;
  input: string; output: string | null; model: string | null;
  tokensIn: number | null; tokensOut: number | null; latencyMs: number | null;
  startedAt: string;
  spans: { name: string; durationMs: number }[];
  feedback: string[];
}

export default function TraceDetail() {
  const { traceId } = useParams();
  const [trace, setTrace] = useState<TraceDetailData | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (traceId) api.get(`/api/traces/${traceId}`).then(r => setTrace(r.data));
  }, [traceId]);

  if (!trace) return <p style={{ color: T.muted }}>Loading...</p>;

  const totalDuration = trace.spans.reduce((a, s) => a + s.durationMs, 0);

  return (
    <div style={{ maxWidth: 800 }}>

      {/* Back button */}
      <button
        onClick={() => nav('/traces')}
        onMouseEnter={e => (e.currentTarget.style.color = T.cyan)}
        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none',
          color: T.muted, fontSize: 13, cursor: 'pointer',
          marginBottom: 20, padding: 0, transition,
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
        Back to Traces
      </button>

      {/* Header card */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 13,
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 8, padding: '5px 12px', color: T.cyan,
          }}>
            {trace.feature}
          </span>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: trace.status === 'OK' ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
            border: `1px solid ${trace.status === 'OK' ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
            borderRadius: 100, padding: '4px 10px',
            color: trace.status === 'OK' ? T.green : T.red, fontSize: 12,
          }}>
            {trace.status === 'OK' ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {trace.status}
          </span>

          {trace.model && (
            <span style={{
              background: 'rgba(123,95,255,0.1)',
              border: '1px solid rgba(123,95,255,0.25)',
              borderRadius: 100, padding: '4px 10px',
              color: '#A290FF', fontSize: 12,
            }}>
              {trace.model}
            </span>
          )}

          {trace.latencyMs != null && (
            <span style={{ fontSize: 13, color: T.text }}>{trace.latencyMs}ms</span>
          )}

          {trace.tokensIn != null && (
            <span style={{ fontSize: 13 }}>
              <span style={{ color: T.cyan }}>{trace.tokensIn}↑</span>
              {' '}
              <span style={{ color: T.muted }}>{trace.tokensOut}↓</span>
            </span>
          )}
        </div>

        {/* Conversation */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', color: T.muted, marginBottom: 8,
          }}>
            User
          </p>
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 16,
            fontSize: 14, lineHeight: 1.6, color: T.text, marginBottom: 16,
          }}>
            {trace.input}
          </div>

          {trace.output && (
            <>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 1,
                textTransform: 'uppercase', color: T.muted, marginBottom: 8,
              }}>
                AI
              </p>
              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: 16,
                fontSize: 14, lineHeight: 1.6, color: T.text,
              }}>
                {trace.output}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spans */}
      {trace.spans.length > 0 && (
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Execution Spans</p>
          {trace.spans.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: i < trace.spans.length - 1 ? 10 : 0,
            }}>
              <span style={{ fontSize: 12, color: T.muted, minWidth: 140, fontFamily: 'monospace' }}>
                {s.name}
              </span>
              <div style={{ flex: 1, height: 6, background: 'rgba(46,61,84,0.6)', borderRadius: 3 }}>
                <div style={{
                  width: `${totalDuration > 0 ? (s.durationMs / totalDuration) * 100 : 100}%`,
                  height: 6,
                  background: 'linear-gradient(90deg, #00D4FF, #7B5FFF)',
                  borderRadius: 3,
                }} />
              </div>
              <span style={{ fontSize: 12, color: T.text, minWidth: 48, textAlign: 'right' }}>
                {s.durationMs}ms
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Feedback</p>
        {trace.feedback.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 13 }}>No feedback recorded</p>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            {trace.feedback.map((f, i) => {
              const isUp = f === 'THUMBS_UP';
              return (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: isUp ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
                  border: `1px solid ${isUp ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
                  borderRadius: 12, padding: '12px 20px',
                  fontSize: 14, color: isUp ? T.green : T.red,
                }}>
                  {isUp ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
                  {isUp ? 'Positive' : 'Negative'}
                </span>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
