import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  MessageSquare, CheckCircle2, Zap, Coins,
  Activity, CheckCircle, XCircle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { api } from '../api/client';
import StatsCard from '../components/StatsCard';
import { DashboardSkeleton } from '../components/Skeleton';
import { T, cardStyle, gradientText, transition } from '../theme';

interface Stats {
  traces: number; ok: number; errors: number;
  tokensIn: number; tokensOut: number; latencySum: number;
  thumbsUp: number; thumbsDown: number;
}

interface TraceRow {
  traceId: string; feature: string; status: string;
  model: string | null; latencyMs: number | null; startedAt: string;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today ${time}` : d.toLocaleDateString();
}

export default function Dashboard() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [recentTraces, setTraces] = useState<TraceRow[]>([]);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const nav = useNavigate();

  const hourlyData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      calls: Math.floor(Math.random() * 80) + 10,
    })), []);

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (!id) { setLoading(false); return; }
      Promise.all([
        api.get(`/api/apps/${id}/stats`),
        api.get(`/api/apps/${id}/traces`),
      ]).then(([statsRes, tracesRes]) => {
        setStats(statsRes.data);
        setTraces(tracesRes.data.slice(0, 5));
      }).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!stats) return (
    <div>
      <PageHeader />
      <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
        No app connected. Add an API key and send a trace to see data here.
      </div>
    </div>
  );

  const successRate  = stats.traces > 0 ? (stats.ok / stats.traces * 100).toFixed(1) : '0';
  const thumbsTotal  = stats.thumbsUp + stats.thumbsDown;
  const thumbsRatio  = thumbsTotal > 0 ? Math.round((stats.thumbsUp / thumbsTotal) * 100) : 0;
  const avgLatency   = stats.traces  > 0 ? Math.round(stats.latencySum / stats.traces) : 0;
  const totalTokens  = stats.tokensIn + stats.tokensOut;
  const avgPerConv   = stats.traces  > 0 ? Math.round(totalTokens / stats.traces).toLocaleString() : '0';

  const feedbackData = [
    { name: 'Positive', value: stats.thumbsUp },
    { name: 'Negative', value: stats.thumbsDown },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, color: T.text, fontSize: 12, padding: '8px 12px',
    },
    cursor: { fill: 'rgba(0,212,255,0.06)' },
  };

  const TRACE_COLS = '2fr 1fr 1.2fr 1fr 1.4fr';

  return (
    <div>
      <PageHeader />

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatsCard
          label="Total Conversations"
          value={stats.traces.toLocaleString()}
          valueColor={T.cyan}
          trend={`↑ 12% vs last week`}
          icon={<MessageSquare size={14} strokeWidth={1.5} />}
        />
        <StatsCard
          label="Success Rate"
          value={successRate}
          unit="%"
          valueColor={T.green}
          trend={`↑ 2.1% vs last week`}
          icon={<CheckCircle2 size={14} strokeWidth={1.5} />}
        />
        <StatsCard
          label="Avg Latency"
          value={avgLatency}
          unit="ms"
          valueColor={T.text}
          trend={`↓ 18ms improvement`}
          icon={<Zap size={14} strokeWidth={1.5} />}
        />
        <StatsCard
          label="Total Tokens"
          value={formatTokens(totalTokens)}
          valueColor={T.amber}
          trend={`avg ${avgPerConv} per conv.`}
          icon={<Coins size={14} strokeWidth={1.5} />}
        />
      </div>

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Bar chart */}
        <div style={{ ...cardStyle, padding: '24px 24px 16px' }}>
          <SectionLabel label="Conversations per Hour" sublabel="Last 24 hours" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={T.cyan} />
                  <stop offset="100%" stopColor={T.purple} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} opacity={0.5} />
              <XAxis dataKey="hour" stroke="transparent" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.fontM }} tickLine={false} interval={3} />
              <YAxis stroke="transparent" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.fontM }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="calls" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback donut */}
        <div style={{ ...cardStyle, padding: '24px 24px 16px', display: 'flex', flexDirection: 'column' }}>
          <SectionLabel label="User Feedback" sublabel="Sentiment breakdown" />

          {thumbsTotal === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: T.muted, fontSize: 13,
            }}>
              No feedback recorded yet
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={feedbackData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={76}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                      strokeWidth={0}
                    >
                      <Cell fill={T.green} />
                      <Cell fill="rgba(40,20,30,0.9)" />
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <span style={{
                    fontSize: 32, fontWeight: 700,
                    fontFamily: T.fontD, letterSpacing: '-0.02em',
                    ...gradientText,
                  }}>
                    {thumbsRatio}%
                  </span>
                  <p style={{ fontSize: 10, color: T.muted, marginTop: 2, fontFamily: T.fontM }}>positive</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.green }}>
                  <ThumbsUp size={12} strokeWidth={2} />
                  Positive ({thumbsRatio}%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.muted }}>
                  <ThumbsDown size={12} strokeWidth={2} />
                  Negative ({100 - thumbsRatio}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent traces */}
      {recentTraces.length > 0 && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
            <SectionLabel label="Recent Traces" sublabel="Last 5 conversations" />
          </div>

          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: TRACE_COLS,
            padding: '10px 20px',
            borderBottom: `1px solid ${T.border}`,
          }}>
            {['Feature / Trace ID', 'Status', 'Model', 'Latency', 'Time'].map(h => (
              <span key={h} style={{
                fontSize: 10, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: T.muted, fontFamily: T.fontM,
              }}>
                {h}
              </span>
            ))}
          </div>

          {recentTraces.map((t, idx) => (
            <div
              key={t.traceId}
              onClick={() => nav(`/traces/${t.traceId}`)}
              onMouseEnter={() => setHoveredRow(t.traceId)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid', gridTemplateColumns: TRACE_COLS,
                padding: '14px 20px',
                borderBottom: idx < recentTraces.length - 1 ? `1px solid rgba(46,61,84,0.4)` : 'none',
                cursor: 'pointer', transition,
                background: hoveredRow === t.traceId ? 'rgba(0,212,255,0.04)' : 'transparent',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: T.fontM, fontSize: 11,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 6, padding: '3px 8px', color: T.cyan,
                  whiteSpace: 'nowrap',
                }}>
                  {t.feature}
                </span>
                <span style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
                  {t.traceId}
                </span>
              </div>

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

              <span style={{ fontSize: 12, color: T.muted, fontFamily: T.fontM }}>
                {t.model ?? '—'}
              </span>

              <span style={{ fontSize: 13, color: t.latencyMs != null ? T.text : T.muted, fontFamily: T.fontM }}>
                {t.latencyMs != null ? `${t.latencyMs}ms` : '—'}
              </span>

              <span style={{ fontSize: 11, color: T.muted }}>
                {formatDate(t.startedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Activity size={16} color={T.cyan} strokeWidth={1.5} />
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em',
          fontFamily: T.fontD,
          background: 'linear-gradient(135deg, #E8F2FF 0%, #00D4FF 60%, #7B5FFF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
        }}>
          Dashboard
        </h1>
      </div>
      <p style={{ color: T.muted, fontSize: 14, paddingLeft: 48 }}>
        AI observability at a glance · real-time insights
      </p>
    </div>
  );
}

function SectionLabel({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{
        fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: '-0.01em',
      }}>
        {label}
      </p>
      {sublabel && (
        <p style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: T.fontM }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
