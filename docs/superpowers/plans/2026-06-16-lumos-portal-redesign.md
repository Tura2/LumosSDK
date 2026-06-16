# Lumos Portal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Lumos React portal to match the LumosSDK presentation aesthetic — deep-navy background, gradient accents, dot-grid overlay, Lucide icons, and polished card-based layouts — without changing any component logic or API calls.

**Architecture:** Introduce a single `src/theme.ts` token file that all components import from, keeping hex values out of JSX. Each component file is then restyled in isolation using its tokens. The Vite dev server is started once at the beginning and kept running for visual verification between tasks.

**Tech Stack:** React 19, React Router 7, Recharts 3, lucide-react (new), Vite, TypeScript, inline styles only.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `portal/src/theme.ts` | Design token constants and style objects |
| Copy | `portal/public/lumos-icon.png` | Lumos brand icon (from `docs/`) |
| Modify | `portal/src/index.css` | Body background, dot-grid overlay, scrollbar |
| Modify | `portal/src/App.tsx` | Fixed sidebar layout + main content margin |
| Modify | `portal/src/components/NavBar.tsx` | Fixed side nav with logo, Lucide icons, user chip |
| Modify | `portal/src/components/StatsCard.tsx` | Gradient value text, card glow on hover |
| Modify | `portal/src/pages/Dashboard.tsx` | KPI row + hourly bar chart + feedback donut |
| Modify | `portal/src/pages/TraceExplorer.tsx` | Div card-table, status badges, pagination |
| Modify | `portal/src/pages/TraceDetail.tsx` | Header card, chat bubbles, span timeline, feedback badges |
| Modify | `portal/src/pages/ApiKeys.tsx` | Key cards, inline form, clipboard copy |

---

## Task 1: Install lucide-react and copy the Lumos icon

**Files:**
- Modify: `portal/package.json` (via npm install)
- Create: `portal/public/lumos-icon.png`

- [ ] **Step 1: Install lucide-react**

```bash
cd portal && npm install lucide-react
```

Expected output: `added 1 package` (or similar). No errors.

- [ ] **Step 2: Copy the icon asset**

```bash
cp ../docs/Gemini_Generated_Image_cgzw89cgzw89cgzw.png public/lumos-icon.png
```

On Windows PowerShell:
```powershell
Copy-Item "..\docs\Gemini_Generated_Image_cgzw89cgzw89cgzw.png" "public\lumos-icon.png"
```

- [ ] **Step 3: Start the dev server (keep it running for all subsequent tasks)**

```bash
npm run dev
```

Expected: Vite dev server on `http://localhost:5173`. Leave this terminal open. Log in with any credentials (mock interceptor accepts all).

- [ ] **Step 4: Commit**

```bash
git add portal/package.json portal/package-lock.json portal/public/lumos-icon.png
git commit -m "chore(portal): add lucide-react + Lumos icon asset"
```

---

## Task 2: Create design token file

**Files:**
- Create: `portal/src/theme.ts`

- [ ] **Step 1: Create `portal/src/theme.ts`**

```typescript
import type React from 'react';

export const T = {
  bg:      '#040810',
  surface: '#070D1C',
  card:    '#0B1628',
  border:  '#2E3D54',
  text:    '#E8F2FF',
  muted:   '#6A7D9A',
  cyan:    '#00D4FF',
  purple:  '#7B5FFF',
  green:   '#00E887',
  amber:   '#FFB800',
  red:     '#FF4563',
  grad:    'linear-gradient(135deg, #00D4FF, #7B5FFF)',
} as const;

export const cardStyle: React.CSSProperties = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 18,
};

export const gradientText: React.CSSProperties = {
  background:           T.grad,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor:  'transparent',
  backgroundClip:       'text',
};

export const transition = 'all 200ms ease-out';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add portal/src/theme.ts
git commit -m "feat(portal): add design token file"
```

---

## Task 3: Global styles + layout fix

**Files:**
- Modify: `portal/src/index.css`
- Modify: `portal/src/App.tsx`

- [ ] **Step 1: Replace `portal/src/index.css` entirely**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #040810;
  color: #E8F2FF;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

#root {
  min-height: 100vh;
  display: flex;
  position: relative;
  z-index: 1;
}

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #070D1C; }
::-webkit-scrollbar-thumb { background: #2E3D54; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #00D4FF; }
```

- [ ] **Step 2: Replace `PrivateLayout` in `portal/src/App.tsx`**

Replace only the `PrivateLayout` function — leave all imports and routes unchanged:

```tsx
function PrivateLayout({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('lumos_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavBar />
      <main style={{
        marginLeft: 240,
        flex: 1,
        overflowY: 'auto',
        padding: 32,
        minHeight: '100vh',
        background: '#040810',
      }}>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:5173`. The body should be deep navy `#040810` with a subtle dot grid visible. The main content area should be inset 240px from the left (NavBar hasn't been restyled yet, still shows old style on the left side).

- [ ] **Step 4: Commit**

```bash
git add portal/src/index.css portal/src/App.tsx
git commit -m "feat(portal): global dark theme + fixed sidebar layout"
```

---

## Task 4: Restyle NavBar

**Files:**
- Modify: `portal/src/components/NavBar.tsx`

- [ ] **Step 1: Replace `portal/src/components/NavBar.tsx` entirely**

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Key, User, LogOut } from 'lucide-react';
import { T, gradientText, transition } from '../theme';

const links = [
  { to: '/',       label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { to: '/traces', label: 'Traces',    icon: <Activity        size={18} strokeWidth={1.5} /> },
  { to: '/keys',   label: 'API Keys',  icon: <Key             size={18} strokeWidth={1.5} /> },
];

export default function NavBar() {
  const nav = useNavigate();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0,
      width: 240, height: '100vh',
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      gap: 4,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
        <img
          src="/lumos-icon.png"
          width={36} height={36}
          alt="Lumos"
          style={{ borderRadius: 10, objectFit: 'cover' }}
        />
        <span style={{ fontSize: 18, fontWeight: 700, ...gradientText }}>LumosSDK</span>
      </div>

      {/* Nav links */}
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            minHeight: 44,
            borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
            transition,
            color:       isActive ? T.cyan  : T.muted,
            background:  isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
            borderLeft:  isActive ? `2px solid ${T.cyan}` : '2px solid transparent',
            paddingLeft: isActive ? 10 : 12,
          })}
        >
          {l.icon}
          {l.label}
        </NavLink>
      ))}

      {/* Bottom section */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${T.border}`,
        }}>
          <User size={14} strokeWidth={1.5} color={T.muted} />
          <span style={{ fontSize: 13, color: T.text }}>Demo App</span>
        </div>

        <button
          onClick={() => { localStorage.removeItem('lumos_token'); nav('/login'); }}
          onMouseEnter={e => (e.currentTarget.style.color = T.red)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: T.muted, fontSize: 13,
            cursor: 'pointer', padding: '8px 12px',
            borderRadius: 8, transition, width: '100%',
          }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify in browser**

Reload `http://localhost:5173`. Check:
- Left sidebar shows Lumos icon + "LumosSDK" gradient text
- Three nav links with Lucide icons, active link highlighted cyan with left-border accent
- User chip and logout at bottom
- Sidebar is 240px wide and fixed (doesn't scroll with content)

- [ ] **Step 3: Commit**

```bash
git add portal/src/components/NavBar.tsx
git commit -m "feat(portal): restyle NavBar with Lumos icon + Lucide icons"
```

---

## Task 5: Restyle StatsCard

**Files:**
- Modify: `portal/src/components/StatsCard.tsx`

- [ ] **Step 1: Replace `portal/src/components/StatsCard.tsx` entirely**

```tsx
import { useState } from 'react';
import { cardStyle, gradientText } from '../theme';

export default function StatsCard({ label, value, unit = '' }: {
  label: string; value: string | number; unit?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...cardStyle,
        padding: '20px 24px',
        minWidth: 170,
        cursor: 'default',
        transition: 'box-shadow 200ms ease-out',
        boxShadow: hovered ? '0 0 24px rgba(0,212,255,0.12)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{
        fontSize: 11, fontWeight: 600,
        letterSpacing: 1, textTransform: 'uppercase',
        color: '#6A7D9A', margin: 0, marginBottom: 8,
      }}>
        {label}
      </p>
      <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 700, ...gradientText }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: '#6A7D9A' }}>{unit}</span>}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to Dashboard (`/`). The 5 KPI cards should now show gradient (cyan→purple) values with muted uppercase labels. Hover a card — a subtle cyan glow appears.

- [ ] **Step 3: Commit**

```bash
git add portal/src/components/StatsCard.tsx
git commit -m "feat(portal): restyle StatsCard with gradient value + hover glow"
```

---

## Task 6: Restyle Dashboard (KPI row + charts)

**Files:**
- Modify: `portal/src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace `portal/src/pages/Dashboard.tsx` entirely**

```tsx
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
```

- [ ] **Step 2: Verify in browser**

Navigate to `/`. Check:
- 5 KPI cards in a row with gradient values
- Left chart: 24 cyan→purple gradient bars with subtle grid
- Right chart: donut with green/red segments and centered `%` label

- [ ] **Step 3: Commit**

```bash
git add portal/src/pages/Dashboard.tsx
git commit -m "feat(portal): dashboard KPI cards + activity chart + feedback donut"
```

---

## Task 7: Restyle TraceExplorer (card-table + pagination)

**Files:**
- Modify: `portal/src/pages/TraceExplorer.tsx`

- [ ] **Step 1: Replace `portal/src/pages/TraceExplorer.tsx` entirely**

```tsx
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
```

- [ ] **Step 2: Verify in browser**

Navigate to `/traces`. Check:
- Table replaced by styled card with grid rows
- Feature names in cyan monospace badges
- Status shows icon + colored pill (OK green, ERROR red)
- Tokens show `84↑ 210↓` with cyan/muted colors
- Hover row highlights faintly cyan
- Click a row navigates to trace detail

- [ ] **Step 3: Commit**

```bash
git add portal/src/pages/TraceExplorer.tsx
git commit -m "feat(portal): TraceExplorer card-table with status badges + pagination"
```

---

## Task 8: Restyle TraceDetail

**Files:**
- Modify: `portal/src/pages/TraceDetail.tsx`

- [ ] **Step 1: Replace `portal/src/pages/TraceDetail.tsx` entirely**

```tsx
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
```

- [ ] **Step 2: Verify in browser**

Navigate to `/traces` and click any trace. Check:
- Back button with ChevronLeft icon; hover turns it cyan
- Header card: feature badge, status pill with icon, model chip, latency, token counts
- User bubble (darker) and AI bubble (slightly lighter), both with border
- Spans: proportional gradient bars with labels and ms counts
- Feedback: green 👍 or red 👎 large badge

- [ ] **Step 3: Commit**

```bash
git add portal/src/pages/TraceDetail.tsx
git commit -m "feat(portal): TraceDetail header card + chat bubbles + span timeline + feedback"
```

---

## Task 9: Restyle ApiKeys

**Files:**
- Modify: `portal/src/pages/ApiKeys.tsx`

- [ ] **Step 1: Replace `portal/src/pages/ApiKeys.tsx` entirely**

```tsx
import { useEffect, useState } from 'react';
import { Plus, X, Copy, Check } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, transition } from '../theme';

interface KeyRow {
  id: string; name: string; createdAt: string;
  lastUsedAt: string | null; revoked: boolean;
}

export default function ApiKeys() {
  const [keys, setKeys]           = useState<KeyRow[]>([]);
  const [appId, setAppId]         = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [keyName, setKeyName]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [inputFocused, setFocused]= useState(false);

  const loadKeys = (id: string) =>
    api.get(`/api/apps/${id}/keys`).then(r => setKeys(r.data));

  useEffect(() => {
    api.get('/api/apps').then(r => {
      const id = r.data[0]?.id;
      if (id) { setAppId(id); loadKeys(id); }
    });
  }, []);

  async function createKey() {
    if (!appId || !keyName.trim()) return;
    const res = await api.post(`/api/apps/${appId}/keys`, { name: keyName });
    setNewSecret(res.data.secret);
    setKeyName(''); setShowForm(false);
    loadKeys(appId);
  }

  async function revoke(keyId: string) {
    await api.delete(`/api/keys/${keyId}`);
    if (appId) loadKeys(appId);
  }

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700 }}>API Keys</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#00D4FF,#7B5FFF)',
            border: 'none', color: '#040810', fontWeight: 700,
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, minHeight: 44, transition,
          }}
        >
          <Plus size={16} /> New Key
        </button>
      </div>

      {/* Revealed secret */}
      {newSecret && (
        <div style={{
          background: 'rgba(0,232,135,0.06)',
          border: '1px solid rgba(0,232,135,0.3)',
          borderRadius: 12, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>
              Key created — copy it now, it won't be shown again:
            </p>
            <button
              onClick={() => setNewSecret(null)}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ fontFamily: 'monospace', fontSize: 13, color: T.text, wordBreak: 'break-all', flex: 1 }}>
              {newSecret}
            </code>
            <button
              onClick={copySecret}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(0,232,135,0.12)',
                border: '1px solid rgba(0,232,135,0.25)',
                borderRadius: 6, padding: '4px 10px',
                color: T.green, cursor: 'pointer', fontSize: 12,
                flexShrink: 0, transition,
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create key form */}
      {showForm && (
        <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Key name</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Production App"
              style={{
                width: 280, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${inputFocused ? T.cyan : T.border}`,
                background: T.bg, color: T.text, fontSize: 14, outline: 'none', transition,
              }}
            />
            <button
              onClick={createKey}
              style={{
                background: 'linear-gradient(135deg,#00D4FF,#7B5FFF)',
                border: 'none', color: '#040810', fontWeight: 700,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'none', border: `1px solid ${T.border}`,
                color: T.muted, borderRadius: 10,
                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Key cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keys.map(k => (
          <div key={k.id} style={{
            ...cardStyle, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{k.name}</p>
              <p style={{ fontSize: 11, color: T.muted }}>
                Created {new Date(k.createdAt).toLocaleDateString()}
                {k.lastUsedAt
                  ? ` · Last used ${new Date(k.lastUsedAt).toLocaleString()}`
                  : ' · Never used'}
              </p>
            </div>
            <span style={{
              background: k.revoked ? 'rgba(255,69,99,0.12)' : 'rgba(0,232,135,0.12)',
              border: `1px solid ${k.revoked ? 'rgba(255,69,99,0.25)' : 'rgba(0,232,135,0.25)'}`,
              borderRadius: 100, padding: '4px 12px',
              color: k.revoked ? T.red : T.green,
              fontSize: 12, fontWeight: 600,
            }}>
              {k.revoked ? 'Revoked' : 'Active'}
            </span>
            {!k.revoked && (
              <button
                onClick={() => revoke(k.id)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,99,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                style={{
                  background: 'none', border: `1px solid ${T.red}`,
                  color: T.red, padding: '6px 14px',
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, minHeight: 36, transition,
                }}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/keys`. Check:
- "New Key" gradient button top-right
- Key list shows cards (not a table): name + dates + Active/Revoked pill + Revoke button
- Click "New Key" → inline form slides in with focus-highlight on input
- Revoke button hover turns red

- [ ] **Step 3: Commit**

```bash
git add portal/src/pages/ApiKeys.tsx
git commit -m "feat(portal): ApiKeys card layout + inline form + clipboard copy"
```

---

## Task 10: TypeScript check + final QA

**Files:** none modified — verification only

- [ ] **Step 1: Run TypeScript check**

```bash
cd portal && npx tsc --noEmit
```

Expected: zero errors. If errors appear, they will be type issues from the inline style objects — fix by adding `as const` or explicit `React.CSSProperties` casts as needed.

- [ ] **Step 2: Visual walkthrough**

With the dev server running, visit each page and verify:

| Page | Check |
|------|-------|
| `/login` | Unchanged (no restyle needed) |
| `/` (Dashboard) | 5 gradient KPI cards, activity bar chart, feedback donut with center % |
| `/traces` | Card-table rows, cyan feature badges, status pills with icons, pagination |
| `/traces/trace-001` | Header badges, chat bubbles, span timeline bars, green 👍 feedback |
| `/traces/trace-003` | ERROR status in red, null latency/tokens show `—`, red 👎 feedback |
| `/keys` | Three key cards, one "Revoked" in red, "New Key" gradient button |
| NavBar | Lumos icon + gradient text, active link highlighted, user chip at bottom |

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(portal): complete visual redesign — dark theme, gradients, Lucide icons"
```

---

## Self-Review

**Spec coverage:**
- ✅ `src/theme.ts` token file (Task 2)
- ✅ `lumos-icon.png` copied to `portal/public/` (Task 1)
- ✅ `lucide-react` installed (Task 1)
- ✅ Dot-grid background overlay (Task 3, `index.css`)
- ✅ Fixed 240px sidebar layout (Task 3, `App.tsx`)
- ✅ NavBar: logo, gradient text, Lucide nav icons, active highlight, user chip, logout (Task 4)
- ✅ StatsCard: gradient value text, hover glow (Task 5)
- ✅ Dashboard: 5 KPI cards, hourly bar chart with gradient bars, feedback donut with center label (Task 6)
- ✅ TraceExplorer: card-table, feature badge, status pill with icon, tokens, pagination (Task 7)
- ✅ TraceDetail: header card, chat bubbles, span timeline, feedback badges (Task 8)
- ✅ ApiKeys: card grid, inline form, clipboard copy with "Copied!" state (Task 9)
- ✅ No logic or API changes across all tasks

**Placeholder scan:** All steps contain complete code. No TBDs.

**Type consistency:** `T`, `cardStyle`, `gradientText`, `transition` are defined once in `theme.ts` (Task 2) and imported in the same form across all component tasks. `TraceDetailData.spans` type `{ name: string; durationMs: number }[]` matches usage in Task 8.
