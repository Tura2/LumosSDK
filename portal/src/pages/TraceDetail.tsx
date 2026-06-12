import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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

  if (!trace) return <p style={{ color: '#ccc' }}>Loading...</p>;

  return (
    <div style={{ color: '#ccc', maxWidth: 800 }}>
      <button onClick={() => nav('/traces')}
        style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', marginBottom: 16 }}>
        ← Back
      </button>
      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ background: '#0f0f1a', padding: '4px 10px', borderRadius: 6 }}>{trace.feature}</span>
          <span style={{ color: trace.status === 'OK' ? '#4caf50' : '#e94560' }}>{trace.status}</span>
          {trace.latencyMs && <span>{trace.latencyMs}ms</span>}
          {trace.tokensIn && <span>{trace.tokensIn + (trace.tokensOut ?? 0)} tokens</span>}
          {trace.model && <span style={{ color: '#888', fontSize: 13 }}>{trace.model}</span>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#888', marginBottom: 4 }}>User</p>
          <p style={{ background: '#0f0f1a', padding: 12, borderRadius: 8, margin: 0 }}>{trace.input}</p>
        </div>
        {trace.output && (
          <div>
            <p style={{ color: '#888', marginBottom: 4 }}>AI</p>
            <p style={{ background: '#0f0f1a', padding: 12, borderRadius: 8, margin: 0 }}>{trace.output}</p>
          </div>
        )}
      </div>
      {trace.spans.length > 0 && (
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Spans</h3>
          {trace.spans.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
              <span>{s.name}</span><span style={{ color: '#888' }}>{s.durationMs}ms</span>
            </div>
          ))}
        </div>
      )}
      {trace.feedback.length > 0 && (
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Feedback</h3>
          {trace.feedback.map((f, i) => (
            <span key={i} style={{ background: '#0f0f1a', padding: '6px 12px', borderRadius: 6, marginRight: 8 }}>
              {f === 'THUMBS_UP' ? '👍' : '👎'} {f.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
