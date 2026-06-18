import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, Smartphone, Download, ChevronDown, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { TracesSkeleton } from '../components/Skeleton';
import { T, cardStyle, transition } from '../theme';
import { useApps } from '../app/AppContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

const TIME_RANGES = [
  { key: '30m', label: 'Past 30 min',  ms: 30 * 60_000 },
  { key: '1h',  label: 'Past 1 hour',  ms: 60 * 60_000 },
  { key: '6h',  label: 'Past 6 hours', ms: 6  * 3_600_000 },
  { key: '1d',  label: 'Past 1 day',   ms: 24 * 3_600_000 },
  { key: '3d',  label: 'Past 3 days',  ms: 3  * 86_400_000 },
  { key: '7d',  label: 'Past 7 days',  ms: 7  * 86_400_000 },
  { key: '14d', label: 'Past 14 days', ms: 14 * 86_400_000 },
  { key: '30d', label: 'Past 30 days', ms: 30 * 86_400_000 },
  { key: '90d', label: 'Past 90 days', ms: 90 * 86_400_000 },
] as const;

function TimeRangeSelector({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = TIME_RANGES.find(r => r.key === value) ?? TIME_RANGES[3];

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.card, border: `1px solid ${open ? T.cyan : T.border}`,
          borderRadius: 10, padding: '9px 14px',
          color: T.text, fontSize: 13, cursor: 'pointer', transition,
        }}
      >
        <span style={{
          background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 11, color: T.cyan, fontWeight: 700, fontFamily: T.fontM,
        }}>
          {current.key}
        </span>
        <span style={{ color: T.muted, fontSize: 13 }}>{current.label}</span>
        <ChevronDown size={13} color={T.muted} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 6, zIndex: 200, minWidth: 210,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {TIME_RANGES.map(r => {
            const active = r.key === value;
            return (
              <button
                key={r.key}
                onClick={() => { onChange(r.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer', transition,
                }}
              >
                <span style={{
                  fontFamily: T.fontM, fontSize: 11, fontWeight: 700,
                  color: active ? T.cyan : T.muted, minWidth: 34, textAlign: 'left',
                }}>
                  {r.key}
                </span>
                <span style={{ fontSize: 13, color: active ? T.text : T.muted }}>
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DeviceInfo {
  deviceModel: string; androidVersion: number; sdkVersion: string; appVersion: string;
}

interface TraceRow {
  traceId: string; feature: string; status: string;
  model: string | null;
  latencyMs: number | null; tokensIn: number | null; tokensOut: number | null;
  startedAt: string; device?: DeviceInfo;
}

const PAGE_SIZE = 10;
const COLS = '1.6fr 0.9fr 1fr 0.9fr 0.9fr 1.1fr';

function DeviceBadge({ device }: { device?: DeviceInfo }) {
  if (!device) return <span style={{ color: '#6A7D9A', fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
      <Smartphone size={12} color="#3DDC84" strokeWidth={1.5} />
      <span style={{ color: '#3DDC84', fontFamily: "'JetBrains Mono', monospace" }}>{device.deviceModel}</span>
    </span>
  );
}

export default function TraceExplorer() {
  const { currentAppId } = useApps();
  const [traces, setTraces]         = useState<TraceRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [hoveredId, setHovered]     = useState<string | null>(null);
  const [filterStatus, setStatus]     = useState<'ALL' | 'OK' | 'ERROR'>('ALL');
  const [filterFeature, setFeature]   = useState('ALL');
  const [timeRange, setTimeRange]     = useState('1d');
  const [search, setSearch]           = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/api/apps/${currentAppId}/traces`)
      .then(r => setTraces(r.data))
      .finally(() => setLoading(false));
  }, [currentAppId, refreshKey]);

  const features = useMemo(() => [...new Set(traces.map(t => t.feature))].sort(), [traces]);

  const filteredTraces = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === timeRange);
    const cutoff = range ? Date.now() - range.ms : 0;
    return traces.filter(t => {
      if (cutoff && new Date(t.startedAt).getTime() < cutoff) return false;
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (filterFeature !== 'ALL' && t.feature !== filterFeature) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.feature.toLowerCase().includes(q) && !t.traceId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [traces, timeRange, filterStatus, filterFeature, search]);

  const pageTraces = filteredTraces.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNext    = (page + 1) * PAGE_SIZE < filteredTraces.length;

  function resetPage() { setPage(0); }

  if (loading) return <TracesSkeleton />;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ marginBottom: -32 }}>
          <PageHeader
            icon={<Activity size={16} color={T.purple} strokeWidth={1.5} />}
            title="Traces"
            subtitle={traces.length > 0 ? `${traces.length} conversations recorded` : 'No traces yet'}
            accent="#7B5FFF"
            titleGradient="linear-gradient(135deg, #E8F2FF 0%, #7B5FFF 100%)"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <TimeRangeSelector value={timeRange} onChange={k => { setTimeRange(k); resetPage(); }} />

          <button
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              color: T.muted, cursor: 'pointer', transition,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.cyan; e.currentTarget.style.borderColor = T.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
          >
            <RefreshCw size={14} strokeWidth={1.5} />
          </button>

          {traces.length > 0 && (
          <button
            onClick={() => {
              const csv = [
                ['Trace ID', 'Feature', 'Status', 'Model', 'Latency (ms)', 'Tokens In', 'Tokens Out', 'Device', 'Android API', 'SDK', 'App Version', 'Started At'].join(','),
                ...filteredTraces.map(t => [
                  t.traceId, t.feature, t.status, t.model ?? '',
                  t.latencyMs ?? '', t.tokensIn ?? '', t.tokensOut ?? '',
                  t.device?.deviceModel ?? '', t.device?.androidVersion ?? '',
                  t.device?.sdkVersion ?? '', t.device?.appVersion ?? '',
                  t.startedAt,
                ].join(',')),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href = url; a.download = 'traces.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(123,95,255,0.1)',
              border: '1px solid rgba(123,95,255,0.25)',
              color: T.purple, borderRadius: 10,
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition, fontFamily: T.fontM,
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,95,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(123,95,255,0.1)'; }}
          >
            <Download size={14} strokeWidth={1.5} />
            Export CSV
          </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {traces.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 280 }}>
            <Search size={13} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: T.muted, pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search feature or ID…"
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12,
                paddingTop: 8, paddingBottom: 8,
                background: T.card, border: `1px solid ${searchFocused ? T.cyan : T.border}`,
                borderRadius: 10, color: T.text, fontSize: 12,
                outline: 'none', fontFamily: T.fontM, transition,
              }}
            />
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['ALL', 'OK', 'ERROR'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); resetPage(); }}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${filterStatus === s
                    ? s === 'ERROR' ? T.red : s === 'OK' ? T.green : T.cyan
                    : T.border}`,
                  background: filterStatus === s
                    ? s === 'ERROR' ? 'rgba(255,69,99,0.1)' : s === 'OK' ? 'rgba(0,232,135,0.1)' : 'rgba(0,212,255,0.1)'
                    : 'transparent',
                  color: filterStatus === s
                    ? s === 'ERROR' ? T.red : s === 'OK' ? T.green : T.cyan
                    : T.muted,
                  cursor: 'pointer', transition, fontFamily: T.fontM,
                }}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Feature select */}
          <select
            value={filterFeature}
            onChange={e => { setFeature(e.target.value); resetPage(); }}
            style={{
              padding: '7px 12px', borderRadius: 8, fontSize: 12,
              background: T.card, border: `1px solid ${filterFeature !== 'ALL' ? T.purple : T.border}`,
              color: filterFeature !== 'ALL' ? '#A290FF' : T.muted,
              cursor: 'pointer', outline: 'none', fontFamily: T.fontM, transition,
            }}
          >
            <option value="ALL" style={{ background: T.card }}>All Features</option>
            {features.map(f => (
              <option key={f} value={f} style={{ background: T.card }}>{f}</option>
            ))}
          </select>

          {/* Result count */}
          <span style={{ fontSize: 12, color: T.muted, fontFamily: T.fontM, marginLeft: 'auto' }}>
            {filteredTraces.length === traces.length
              ? `${traces.length} traces`
              : `${filteredTraces.length} of ${traces.length}`}
          </span>
        </div>
      )}

      {traces.length === 0 ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          No traces yet. Send a message in the demo app.
        </div>
      ) : filteredTraces.length === 0 ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 12 }}>No traces match these filters.</p>
          <button
            onClick={() => { setStatus('ALL'); setFeature('ALL'); setSearch(''); setTimeRange('1d'); }}
            style={{
              background: 'rgba(0,212,255,0.1)', border: `1px solid rgba(0,212,255,0.25)`,
              color: T.cyan, borderRadius: 8, padding: '8px 18px',
              fontSize: 13, cursor: 'pointer', fontFamily: T.fontM, transition,
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Card table */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: COLS,
              columnGap: 20,
              padding: '12px 20px',
              borderBottom: `1px solid ${T.border}`,
            }}>
              {['Feature', 'Status', 'Device', 'Latency', 'Tokens', 'Time'].map(h => (
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
                  columnGap: 20,
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

                <StatusBadge status={t.status} />

                <DeviceBadge device={t.device} />

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
