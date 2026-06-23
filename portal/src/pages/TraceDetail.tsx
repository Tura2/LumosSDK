import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, ThumbsDown, Smartphone } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';
import { Bone } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import { androidOsLabel } from '../lib/format';
import { calcCost, formatCost } from '../lib/pricing';

interface DeviceInfo {
  deviceModel: string; androidVersion: number; sdkVersion: string; appVersion: string;
}

interface TraceDetailData {
  traceId: string; feature: string; status: string;
  input: string; output: string | null; model: string | null;
  tokensIn: number | null; tokensOut: number | null; latencyMs: number | null;
  startedAt: string;
  spans: { name: string; durationMs: number }[];
  feedback: string[];
  device?: DeviceInfo;
}

function FeedbackPill({ f }: { f: string }) {
  const [hovered, setHovered] = useState(false);
  const isUp = f === 'THUMBS_UP';
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: isUp
          ? hovered ? 'rgba(var(--color-green-rgb),0.22)' : 'rgba(var(--color-green-rgb),0.12)'
          : hovered ? 'rgba(var(--color-red-rgb),0.22)'  : 'rgba(var(--color-red-rgb),0.12)',
        border: `1px solid ${isUp
          ? hovered ? 'rgba(var(--color-green-rgb),0.5)' : 'rgba(var(--color-green-rgb),0.25)'
          : hovered ? 'rgba(var(--color-red-rgb),0.5)'  : 'rgba(var(--color-red-rgb),0.25)'}`,
        borderRadius: 12, padding: '12px 22px',
        fontSize: 14, color: isUp ? T.green : T.red,
        fontWeight: 500, cursor: 'default',
        transition,
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {isUp ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
      {isUp ? 'Positive' : 'Negative'}
    </div>
  );
}

export default function TraceDetail() {
  const { traceId } = useParams();
  const [trace, setTrace] = useState<TraceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    if (traceId) {
      api.get(`/api/traces/${traceId}`)
        .then(r => setTrace(r.data))
        .finally(() => setLoading(false));
    }
  }, [traceId]);

  if (loading) return (
    <div>
      <div style={{ marginBottom: 20 }}><Bone width={120} height={14} /></div>
      <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[100, 60, 70, 50].map((w, i) => <Bone key={i} width={w} height={28} />)}
        </div>
        <Bone height={2} />
        <div style={{ marginTop: 20 }}><Bone height={80} /></div>
        <div style={{ marginTop: 16 }}><Bone height={140} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 24 }}><Bone height={120} /></div>
        <div style={{ ...cardStyle, padding: 24 }}><Bone height={120} /></div>
      </div>
    </div>
  );

  if (!trace) return <p style={{ color: T.muted }}>Trace not found.</p>;

  const totalDuration = trace.spans.reduce((a, s) => a + s.durationMs, 0);

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => nav('/traces')}
        onMouseEnter={e => (e.currentTarget.style.color = T.cyan)}
        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none',
          color: T.muted, fontSize: 13, cursor: 'pointer',
          marginBottom: 24, padding: 0, transition,
          fontFamily: T.fontM,
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
        Back to Traces
      </button>

      {/* Header card — full width */}
      <div style={{ ...cardStyle, padding: 28, marginBottom: 16 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22, alignItems: 'center' }}>
          <span style={{
            fontFamily: T.fontM, fontSize: 12,
            background: 'rgba(var(--color-cyan-rgb),0.08)',
            border: '1px solid rgba(var(--color-cyan-rgb),0.2)',
            borderRadius: 8, padding: '5px 12px', color: T.cyan,
          }}>
            {trace.feature}
          </span>

          <StatusBadge status={trace.status} size={12} />

          {trace.model && (
            <span style={{
              background: 'rgba(var(--color-purple-rgb),0.1)',
              border: '1px solid rgba(var(--color-purple-rgb),0.25)',
              borderRadius: 100, padding: '4px 10px',
              color: '#A290FF', fontSize: 12, fontFamily: T.fontM,
            }}>
              {trace.model}
            </span>
          )}

          {trace.latencyMs != null && (
            <span style={{ fontSize: 13, color: T.text, fontFamily: T.fontM }}>{trace.latencyMs}ms</span>
          )}

          {trace.tokensIn != null && (
            <span style={{ fontSize: 12, fontFamily: T.fontM }}>
              <span style={{ color: T.cyan }}>{trace.tokensIn}↑</span>
              {' '}
              <span style={{ color: T.muted }}>{trace.tokensOut}↓</span>
            </span>
          )}

          {(() => {
            const cost = calcCost(trace.model, trace.tokensIn, trace.tokensOut);
            return cost != null ? (
              <span style={{
                background: 'rgba(var(--color-green-rgb),0.08)',
                border: '1px solid rgba(var(--color-green-rgb),0.2)',
                borderRadius: 100, padding: '4px 10px',
                color: T.green, fontSize: 12, fontFamily: T.fontM, fontWeight: 600,
              }}>
                {formatCost(cost)}
              </span>
            ) : null;
          })()}
        </div>

        {/* Conversation */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 22 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: T.muted, marginBottom: 10,
            fontFamily: T.fontM,
          }}>
            User
          </p>
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '14px 18px',
            fontSize: 14, lineHeight: 1.65, color: T.text, marginBottom: 18,
            maxWidth: 800,
          }}>
            {trace.input}
          </div>

          {trace.output && (
            <>
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: T.muted, marginBottom: 10,
                fontFamily: T.fontM,
              }}>
                AI Response
              </p>
              <div style={{
                background: T.card2 ?? '#0F1E38',
                border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '14px 18px',
                fontSize: 14, lineHeight: 1.65, color: T.text,
                maxWidth: 800,
                whiteSpace: 'pre-wrap',
              }}>
                {trace.output}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: Spans (left) + Device & Feedback stacked (right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: trace.spans.length > 0 ? '1fr 340px' : '1fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}>
        {/* Spans */}
        {trace.spans.length > 0 && (
          <div style={{ ...cardStyle, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontD, letterSpacing: '-0.01em' }}>
              Execution Spans
            </p>
            {trace.spans.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: i < trace.spans.length - 1 ? 14 : 0,
              }}>
                <span style={{ fontSize: 12, color: T.muted, minWidth: 160, fontFamily: T.fontM }}>
                  {s.name}
                </span>
                <div style={{ flex: 1, height: 6, background: 'rgba(var(--color-border-rgb),0.5)', borderRadius: 3 }}>
                  <div style={{
                    width: `${totalDuration > 0 ? (s.durationMs / totalDuration) * 100 : 100}%`,
                    height: 6,
                    background: 'linear-gradient(90deg, #00D4FF, #7B5FFF)',
                    borderRadius: 3,
                  }} />
                </div>
                <span style={{ fontSize: 12, color: T.text, minWidth: 56, textAlign: 'right', fontFamily: T.fontM }}>
                  {s.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Right column: Device + Feedback stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Device & Environment */}
          {trace.device && (
            <div style={{ ...cardStyle, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Smartphone size={14} color="#3DDC84" strokeWidth={1.5} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.fontD, letterSpacing: '-0.01em' }}>
                  Device & Environment
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Device',      value: trace.device.deviceModel,                    color: T.text },
                  { label: 'OS',          value: androidOsLabel(trace.device.androidVersion), color: '#3DDC84' },
                  { label: 'SDK Version', value: `v${trace.device.sdkVersion}`,               color: T.purple },
                  { label: 'App Version', value: `v${trace.device.appVersion}`,               color: T.muted },
                ].map(({ label, value, color }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < arr.length - 1 ? `1px solid rgba(var(--color-border-rgb),0.4)` : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 12, color, fontFamily: T.fontM, fontWeight: 500 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: T.fontD, letterSpacing: '-0.01em' }}>
              Feedback
            </p>
            {trace.feedback.length === 0 ? (
              <p style={{ color: T.muted, fontSize: 13, fontFamily: T.fontM }}>No feedback recorded</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {trace.feedback.map((f, i) => (
                  <FeedbackPill key={i} f={f} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
