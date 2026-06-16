import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../api/client';
import StatsCard from '../components/StatsCard';
import { T, cardStyle } from '../theme';

interface Stats {
  traces: number; ok: number; errors: number;
  tokensIn: number; tokensOut: number; latencySum: number;
  thumbsUp: number; thumbsDown: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  const hourlyData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      calls: Math.floor(Math.random() * 80) + 10,
    })), []);

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) {
        setAppId(id);
        api.get(`/api/apps/${id}/stats`).then(r => setStats(r.data));
      }
    });
  }, []);

  if (!appId) return <p style={{ color: T.muted }}>No apps yet. Create an app first.</p>;
  if (!stats)  return <p style={{ color: T.muted }}>Loading...</p>;

  const thumbsTotal  = stats.thumbsUp + stats.thumbsDown;
  const thumbsRatio  = thumbsTotal > 0 ? Math.round((stats.thumbsUp / thumbsTotal) * 100) : 0;
  const avgLatency   = stats.traces  > 0 ? Math.round(stats.latencySum / stats.traces) : 0;
  const totalTokens  = stats.tokensIn + stats.tokensOut;

  const feedbackData = [
    { name: 'Positive', value: stats.thumbsUp },
    { name: 'Negative', value: stats.thumbsDown },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, color: T.text,
    },
  };

  return (
    <div>
      <h2 style={{ color: T.text, marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Dashboard</h2>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatsCard label="Total Conversations" value={stats.traces} />
        <StatsCard label="Success Rate"         value={stats.traces > 0 ? Math.round((stats.ok / stats.traces) * 100) : 0} unit="%" />
        <StatsCard label="👍 Ratio"             value={thumbsRatio} unit="%" />
        <StatsCard label="Avg Latency"          value={avgLatency}  unit="ms" />
        <StatsCard label="Total Tokens"         value={totalTokens.toLocaleString()} />
      </div>

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Hourly bar chart */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Activity (24h)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={T.cyan} />
                  <stop offset="100%" stopColor={T.purple} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.border} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="hour" stroke={T.border} tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} interval={3} />
              <YAxis stroke={T.border} tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,212,255,0.06)' }} />
              <Bar dataKey="calls" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback donut */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Feedback Ratio</p>
          {thumbsTotal === 0 ? (
            <div style={{
              height: 220, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: T.muted, fontSize: 13,
            }}>
              No feedback yet
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={feedbackData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                  >
                    <Cell key="pos" fill={T.green} />
                    <Cell key="neg" fill={T.red} />
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -54%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 700,
                  background: T.grad,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {thumbsRatio}%
                </span>
                <p style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>positive</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
