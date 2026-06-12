import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import StatsCard from '../components/StatsCard';

interface Stats {
  traces: number; ok: number; errors: number;
  tokensIn: number; tokensOut: number; latencySum: number;
  thumbsUp: number; thumbsDown: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) {
        setAppId(id);
        api.get(`/api/apps/${id}/stats`).then(r => setStats(r.data));
      }
    });
  }, []);

  if (!appId) return <p style={{ color: '#ccc' }}>No apps yet. Create an app first.</p>;
  if (!stats) return <p style={{ color: '#ccc' }}>Loading...</p>;

  const thumbsTotal = stats.thumbsUp + stats.thumbsDown;
  const thumbsRatio = thumbsTotal > 0 ? Math.round((stats.thumbsUp / thumbsTotal) * 100) : 0;
  const avgLatency = stats.traces > 0 ? Math.round(stats.latencySum / stats.traces) : 0;
  const totalTokens = stats.tokensIn + stats.tokensOut;

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatsCard label="Total Conversations" value={stats.traces} />
        <StatsCard label="Success Rate" value={stats.traces > 0 ? Math.round((stats.ok / stats.traces) * 100) : 0} unit="%" />
        <StatsCard label="👍 Ratio" value={thumbsRatio} unit="%" />
        <StatsCard label="Avg Latency" value={avgLatency} unit="ms" />
        <StatsCard label="Total Tokens" value={totalTokens.toLocaleString()} />
      </div>
      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, maxWidth: 500 }}>
        <h3 style={{ color: '#ccc', marginBottom: 16 }}>Feedback</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{ name: 'Thumbs Up', value: stats.thumbsUp }, { name: 'Thumbs Down', value: stats.thumbsDown }]}>
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ background: '#0f0f1a', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#e94560" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
