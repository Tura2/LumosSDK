import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface TraceRow {
  traceId: string; feature: string; status: string;
  latencyMs: number | null; tokensIn: number | null; tokensOut: number | null; startedAt: string;
}

export default function TraceExplorer() {
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) api.get(`/api/apps/${id}/traces`).then(r => setTraces(r.data));
    });
  }, []);

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Traces</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            {['Feature', 'Status', 'Latency', 'Tokens', 'Time'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {traces.map(t => (
            <tr key={t.traceId} onClick={() => nav(`/traces/${t.traceId}`)}
              style={{ borderBottom: '1px solid #222', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '12px' }}>{t.feature}</td>
              <td style={{ padding: '12px', color: t.status === 'OK' ? '#4caf50' : '#e94560' }}>{t.status}</td>
              <td style={{ padding: '12px' }}>{t.latencyMs != null ? `${t.latencyMs}ms` : '—'}</td>
              <td style={{ padding: '12px' }}>{t.tokensIn != null ? `${t.tokensIn}↑ ${t.tokensOut}↓` : '—'}</td>
              <td style={{ padding: '12px', fontSize: 12, color: '#666' }}>{new Date(t.startedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {traces.length === 0 && <p style={{ color: '#666' }}>No traces yet. Send a message in the demo app.</p>}
    </div>
  );
}
