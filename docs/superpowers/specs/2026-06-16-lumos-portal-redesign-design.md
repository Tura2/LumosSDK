---
name: lumos-portal-redesign
description: Full visual redesign of the Lumos React portal to match the LumosSDK presentation aesthetic — dark deep-navy theme, gradient accents, dot-grid background, styled card-table, donut chart, timeline spans, and Lucide icons throughout.
metadata:
  type: project
---

# Lumos Portal Redesign — Design Spec

## Overview

Restyle the existing Lumos portal (React 19 + React Router 7 + Recharts 3) to match the quality and visual language of the in-app LumosSDK presentation (`docs/lumos-presentation.html`). All existing component logic, API calls, state management, and routing remain unchanged. Only styles and layout are modified.

**Approach:** Option B — shared design token file (`src/theme.ts`) first, then restyle each component file referencing the tokens.

---

## Design Tokens (`src/theme.ts`)

Single file, exported as plain JS constants. No CSS variables — all inline styles import from here.

```
Background:   #040810
Surface:      #070D1C
Card:         #0B1628
Border:       #2E3D54
Text:         #E8F2FF
Muted:        #6A7D9A

Cyan:         #00D4FF
Purple:       #7B5FFF
Green:        #00E887
Amber:        #FFB800
Red:          #FF4563

Gradient:     linear-gradient(135deg, #00D4FF, #7B5FFF)
```

Exported style objects:
- `cardStyle` — `{ background: '#0B1628', border: '1px solid #2E3D54', borderRadius: 18 }`
- `gradientText` — `{ background: 'linear-gradient(135deg,#00D4FF,#7B5FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }`
- `focusRing` — `{ outline: '2px solid #00D4FF', outlineOffset: 2 }` (for onFocus handlers)
- `transition` — `'all 200ms ease-out'`

---

## Global (`index.css` + `App.tsx`)

### index.css
- `body` background: `#040810`
- Dot-grid overlay on `body::before` using two `linear-gradient` at 1px, `background-size: 60px 60px`, opacity `rgba(0,212,255,0.03)`
- Custom scrollbar: `8px` wide, track `#070D1C`, thumb `#2E3D54`, hover thumb `#00D4FF`
- Reset: `* { box-sizing: border-box; margin: 0; padding: 0 }`
- `#root { height: 100vh; display: flex }`

### App.tsx `PrivateLayout`
- NavBar is `position: fixed`, `width: 240px`, `top: 0`, `left: 0`, `height: 100vh`, `zIndex: 100`
- Main content: `marginLeft: 240px`, `flex: 1`, `overflowY: auto`, `padding: 32px`, `minHeight: 100vh`
- Background: `#040810` (inherits from body)

---

## Side NavBar (`NavBar.tsx`)

### Layout
- `position: fixed`, `width: 240px`, `height: 100vh`, `top: 0`, `left: 0`
- Background: `#070D1C`
- Right border: `1px solid #2E3D54`
- Flex column, `padding: 24px 16px`, `gap: 4px`
- `zIndex: 100`

### Logo section (top)
- `display: flex`, `alignItems: center`, `gap: 10px`, `marginBottom: 32px`, `padding: 0 8px`
- Icon: `<img src="/lumos-icon.png" width={36} height={36} style={{ borderRadius: 10, objectFit: 'cover' }} />`
  - Source: copy `docs/Gemini_Generated_Image_cgzw89cgzw89cgzw.png` → `portal/public/lumos-icon.png`
- Text: `"LumosSDK"` using `gradientText` token, `fontSize: 18`, `fontWeight: 700`, `letterSpacing: -0.5`

### Nav links
Icons from `lucide-react` (add to dependencies):
- Dashboard → `<LayoutDashboard size={18} strokeWidth={1.5} />`
- Traces → `<Activity size={18} strokeWidth={1.5} />`
- API Keys → `<Key size={18} strokeWidth={1.5} />`

Each link: `display: flex`, `alignItems: center`, `gap: 10px`, `padding: 10px 12px`, `borderRadius: 10px`, `fontSize: 14`, `fontWeight: 500`, `textDecoration: none`, `transition: all 200ms ease-out`, min height `44px`

Active state: `background: rgba(0,212,255,0.08)`, `color: #00D4FF`, left border accent `borderLeft: '2px solid #00D4FF'`, `paddingLeft: 10`

Inactive: `color: #6A7D9A`, `background: transparent`, `borderLeft: '2px solid transparent'`

Hover (inactive): `background: rgba(255,255,255,0.04)`, `color: #E8F2FF`

### Bottom section
- `marginTop: auto`
- User chip: `display: flex`, `alignItems: center`, `gap: 8px`, `padding: '10px 12px'`, `borderRadius: 10`, `background: rgba(255,255,255,0.04)`, `border: '1px solid #2E3D54'`
  - Shows app name `"Demo App"` in white `fontSize: 13` (static — no new API calls or localStorage keys needed)
  - `<User size={14} strokeWidth={1.5} color="#6A7D9A" />` icon on the left
- Logout button: below chip, `background: none`, `border: none`, `color: #6A7D9A`, `fontSize: 13`, `cursor: pointer`, `padding: '8px 12px'`, hover `color: #FF4563`

---

## Dashboard (`Dashboard.tsx` + `StatsCard.tsx`)

### StatsCard.tsx
Completely restyled. Props unchanged: `{ label, value, unit }`.

```
cardStyle + padding: '20px 24px' + minWidth: 170 + cursor: default
transition on hover: boxShadow '0 0 24px rgba(0,212,255,0.12)'
```

- Label: `fontSize: 11`, `fontWeight: 600`, `letterSpacing: 1`, `textTransform: uppercase`, `color: #6A7D9A`, `marginBottom: 8`
- Value: `fontSize: 32`, `fontWeight: 700` + `gradientText` token
- Unit: inline after value, `fontSize: 14`, `color: #6A7D9A`, `marginLeft: 4`, plain color (not gradient)

### Dashboard KPI row
`display: flex`, `gap: 16px`, `flexWrap: wrap`, `marginBottom: 32px`
5 StatsCards: Total Conversations, Success Rate (%), 👍 Ratio (%), Avg Latency (ms), Total Tokens

### Chart row
`display: grid`, `gridTemplateColumns: '1fr 1fr'`, `gap: 20px`

**Left card — Hourly Activity (BarChart)**
- Card: `cardStyle + padding: 24px`
- Title: `"Activity (24h)"`, `fontSize: 14`, `fontWeight: 600`, `color: #E8F2FF`, `marginBottom: 16`
- Data: generate 24 hourly buckets of placeholder data (`Array.from({length:24}, (_, i) => ({ hour: \`${i}h\`, calls: Math.floor(Math.random()*80)+10 }))`). Memoized with `useMemo` — stable for the session.
- Recharts `BarChart` + `ResponsiveContainer width="100%" height={220}`
- Cyan gradient bars via `<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D4FF"/><stop offset="100%" stopColor="#7B5FFF"/></linearGradient></defs>`, `fill="url(#barGrad)"`
- `XAxis stroke="#2E3D54"`, tick `fill="#6A7D9A"` `fontSize=11`
- `YAxis stroke="#2E3D54"`, tick `fill="#6A7D9A"` `fontSize=11`
- `Tooltip contentStyle={{ background:'#0B1628', border:'1px solid #2E3D54', borderRadius:8, color:'#E8F2FF' }}`
- CartesianGrid: `stroke="#2E3D54"` `strokeDasharray="4 4"`
- Bar: `radius={[4,4,0,0]}`

**Right card — Feedback Ratio (PieChart / Donut)**
- Card: `cardStyle + padding: 24px`
- Title: `"Feedback Ratio"`, same style as left
- Recharts `PieChart` + `ResponsiveContainer width="100%" height={220}`
- `PieChart`: two cells — thumbsUp (`#00E887`), thumbsDown (`#FF4563`)
- Donut: `innerRadius={60} outerRadius={90}`
- Center label: custom `label` prop or positioned absolute `div` with `thumbsRatio%` using `gradientText` token, `fontSize: 28`, `fontWeight: 700`
- `Tooltip` same style as bar chart
- `Legend` with `wrapperStyle={{ color: '#6A7D9A', fontSize: 12 }}`
- Empty state: if `thumbsTotal === 0`, show `"No feedback yet"` in muted text centered inside the card

---

## Trace Explorer (`TraceExplorer.tsx`)

Replace raw `<table>` with a styled card-table using divs.

### Outer wrapper
`cardStyle + overflow: hidden`

### Header row
`display: grid`, `gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr'`, `padding: '12px 20px'`, `borderBottom: '1px solid #2E3D54'`
- Column labels: `fontSize: 11`, `fontWeight: 600`, `letterSpacing: 1`, `textTransform: uppercase`, `color: #6A7D9A`

### Data rows
Each row: same grid, `padding: '14px 20px'`, `borderBottom: '1px solid rgba(46,61,84,0.5)'`, `cursor: pointer`, `transition: background 150ms ease-out`
- Hover: `background: rgba(0,212,255,0.04)`
- Last row: no border bottom

**Feature cell**: monospace badge
- `fontFamily: 'monospace'`, `fontSize: 12`, `background: rgba(0,212,255,0.08)`, `border: '1px solid rgba(0,212,255,0.2)'`, `borderRadius: 6`, `padding: '3px 8px'`, `color: #00D4FF`

**Status cell**: pill badge with icon
- OK: `display: flex`, `alignItems: center`, `gap: 4`, `background: rgba(0,232,135,0.12)`, `border: '1px solid rgba(0,232,135,0.25)'`, `borderRadius: 100`, `padding: '3px 10px'`, `color: #00E887`, `fontSize: 12`, + `<CheckCircle size={12} />` from lucide-react
- ERROR: same pattern with red `#FF4563` + `<XCircle size={12} />`

**Latency cell**: `color: #E8F2FF`, `fontSize: 13`. `—` in muted if null.

**Tokens cell**: `tokensIn` in cyan `#00D4FF` + `↑`, `tokensOut` in muted + `↓`, `fontSize: 13`. `—` if null.

**Time cell**: `fontSize: 11`, `color: #6A7D9A`

### Pagination
Below the card: `display: flex`, `alignItems: center`, `justifyContent: space-between`, `marginTop: 16px`
- Prev / Next buttons: `cardStyle + padding: '8px 16px' + fontSize: 13 + color: #E8F2FF + cursor: pointer`
- Disabled state: `opacity: 0.4`, `cursor: not-allowed`
- Page indicator: `"Page X"`, `color: #6A7D9A`, `fontSize: 13`
- State: `const [page, setPage] = useState(0); const PAGE_SIZE = 10;` — slice `traces` for display, disable Prev at page 0, disable Next when end of data

### Empty state
If `traces.length === 0`: centered card with `color: #6A7D9A`, `"No traces yet. Send a message in the demo app."`

---

## Trace Detail (`TraceDetail.tsx`)

### Back button
`color: #6A7D9A`, hover `color: #00D4FF`, `fontSize: 13`, `display: flex`, `alignItems: center`, `gap: 4`
Add `<ChevronLeft size={14} />` from lucide-react before text. `marginBottom: 20`

### Header card
`cardStyle + padding: 24px + marginBottom: 16`

Top row (`display: flex`, `flexWrap: wrap`, `gap: 10px`, `marginBottom: 20px`, `alignItems: center`):
- **Feature badge**: `fontFamily: monospace`, `background: rgba(0,212,255,0.08)`, `border: '1px solid rgba(0,212,255,0.2)'`, `borderRadius: 8`, `padding: '5px 12px'`, `color: #00D4FF`, `fontSize: 13`
- **Status badge**: same pill pattern as TraceExplorer (with icon)
- **Model chip**: `background: rgba(123,95,255,0.1)`, `border: '1px solid rgba(123,95,255,0.25)'`, `borderRadius: 100`, `padding: '3px 10px'`, `color: #A290FF`, `fontSize: 12`
- **Latency**: `fontSize: 13`, `color: #E8F2FF`, e.g. `312ms`
- **Tokens**: `tokensIn↑ tokensOut↓` same style as TraceExplorer

### Conversation section (inside header card, below top row)
Divider: `borderTop: '1px solid #2E3D54'`, `paddingTop: 20`

**User bubble**:
- Label: `fontSize: 11`, `fontWeight: 600`, `letterSpacing: 1`, `textTransform: uppercase`, `color: #6A7D9A`, `marginBottom: 8`
- Bubble: `background: #040810`, `border: '1px solid #2E3D54'`, `borderRadius: 12`, `padding: 16`, `fontSize: 14`, `lineHeight: 1.6`, `color: #E8F2FF`, `marginBottom: 16`

**AI bubble**:
- Label: same style, text `"AI"`
- Bubble: `background: #0B1628`, `border: '1px solid #2E3D54'`, `borderRadius: 12`, `padding: 16`, `fontSize: 14`, `lineHeight: 1.6`, `color: #E8F2FF`

### Spans section
`cardStyle + padding: 24px + marginBottom: 16`
Title: `"Execution Spans"`, `fontSize: 14`, `fontWeight: 600`, `color: #E8F2FF`, `marginBottom: 16`

For each span: visual timeline bar row
- Row: `display: flex`, `alignItems: center`, `gap: 12`, `marginBottom: 10`
- Label: `fontSize: 12`, `color: #6A7D9A`, `minWidth: 140`, `fontFamily: monospace`
- Bar track: `flex: 1`, `height: 6`, `background: rgba(46,61,84,0.6)`, `borderRadius: 3`
  - Fill: `width: (span.durationMs / totalDurationMs * 100)%`, `height: 6`, `background: linear-gradient(90deg, #00D4FF, #7B5FFF)`, `borderRadius: 3`
  - `totalDurationMs = spans.reduce((a,s)=>a+s.durationMs,0)` (or max for proportional)
- Duration label: `fontSize: 12`, `color: #E8F2FF`, `minWidth: 48`, `textAlign: right`

### Feedback section
`cardStyle + padding: 24px`
Title: `"Feedback"`, same title style

Each feedback item:
- THUMBS_UP: `background: rgba(0,232,135,0.12)`, `border: '1px solid rgba(0,232,135,0.25)'`, `borderRadius: 12`, `padding: '12px 20px'`, `display: inline-flex`, `alignItems: center`, `gap: 8`, `fontSize: 14`, `color: #00E887`
  - `<ThumbsUp size={18} />` from lucide-react + `"Positive"`
- THUMBS_DOWN: same with red `#FF4563`, `background: rgba(255,69,99,0.12)`, `border: rgba(255,69,99,0.25)`, `<ThumbsDown size={18} />`

Empty: `color: #6A7D9A`, `"No feedback recorded"`

---

## API Keys (`ApiKeys.tsx`)

### Page header row
`display: flex`, `justifyContent: space-between`, `alignItems: center`, `marginBottom: 24`
- Title: `"API Keys"`, `fontSize: 22`, `fontWeight: 700`, `color: #E8F2FF`
- Create button: `background: linear-gradient(135deg,#00D4FF,#7B5FFF)`, `border: none`, `color: #040810`, `fontWeight: 700`, `padding: '10px 20px'`, `borderRadius: 10`, `cursor: pointer`, `fontSize: 14`, min height `44px`
  - `<Plus size={16} />` from lucide-react + `" New Key"`

### Revealed secret box
`background: rgba(0,232,135,0.06)`, `border: '1px solid rgba(0,232,135,0.3)'`, `borderRadius: 12`, `padding: 16`, `marginBottom: 20`
- `"Key created — copy it now:"` in `#00E887`, `fontSize: 13`, `fontWeight: 600`, `marginBottom: 8`
- Secret: `fontFamily: monospace`, `fontSize: 13`, `color: #E8F2FF`, `wordBreak: 'break-all'`
- Copy button (right): `background: rgba(0,232,135,0.12)`, `border: '1px solid rgba(0,232,135,0.25)'`, `borderRadius: 6`, `padding: '4px 10px'`, `color: #00E887`, `cursor: pointer`, `fontSize: 12`
  - Copies to clipboard via `navigator.clipboard.writeText(newSecret)`
  - On copy: button text flips to `"Copied!"` for 1.5s then resets
- Close: `<X size={16} />` icon button, `color: #6A7D9A`

### Create key form card
Inline card that appears when `showForm === true`. Slides in (use `display: showForm ? 'block' : 'none'`):
`cardStyle + padding: 24px + marginBottom: 20`
- Label: `"Key name"`, `fontSize: 12`, `color: #6A7D9A`, `marginBottom: 6`
- Input: `width: 280px`, `padding: '10px 14px'`, `borderRadius: 10`, `border: '1px solid #2E3D54'`, `background: #040810`, `color: #E8F2FF`, `fontSize: 14`, `outline: none`
  - Focus: `border: '1px solid #00D4FF'`
- Create button: same gradient button style, `"Create"`
- Cancel: `background: none`, `border: '1px solid #2E3D54'`, `color: #6A7D9A`, `borderRadius: 10`, `padding: '10px 16px'`, `cursor: pointer`

### Key cards list
`display: flex`, `flexDirection: column`, `gap: 12px`

Each key card:
`cardStyle + padding: '16px 20px' + display: flex + alignItems: center + gap: 16`

Layout (left to right):
1. **Name + dates** (`flex: 1`):
   - Name: `fontSize: 14`, `fontWeight: 600`, `color: #E8F2FF`, `marginBottom: 4`
   - Created: `"Created"` + date, `fontSize: 11`, `color: #6A7D9A`
   - Last used: `"Last used"` + date or `"Never"`, `fontSize: 11`, `color: #6A7D9A`
2. **Status badge**:
   - Active: `background: rgba(0,232,135,0.12)`, `border: '1px solid rgba(0,232,135,0.25)'`, `borderRadius: 100`, `padding: '4px 12px'`, `color: #00E887`, `fontSize: 12`, `fontWeight: 600`
   - Revoked: same with red
3. **Revoke button** (if not revoked):
   - `background: none`, `border: '1px solid #FF4563'`, `color: #FF4563`, `padding: '6px 14px'`, `borderRadius: 8`, `cursor: pointer`, `fontSize: 12`, `fontWeight: 600`, min height `36px`
   - Hover: `background: rgba(255,69,99,0.1)`

---

## Dependencies to Add

- `lucide-react` — SVG icon library (not a UI component library, consistent with constraints)

## Files to Create/Copy

- `portal/public/lumos-icon.png` — copy from `docs/Gemini_Generated_Image_cgzw89cgzw89cgzw.png`
- `portal/src/theme.ts` — new design token file

## Files to Modify (styles only, no logic changes)

1. `portal/src/index.css`
2. `portal/src/App.tsx` (PrivateLayout styles)
3. `portal/src/components/NavBar.tsx`
4. `portal/src/components/StatsCard.tsx`
5. `portal/src/pages/Dashboard.tsx`
6. `portal/src/pages/TraceExplorer.tsx`
7. `portal/src/pages/TraceDetail.tsx`
8. `portal/src/pages/ApiKeys.tsx`

## Constraints

- No logic or API call changes
- No component library (lucide-react is icons only)
- No external fonts (system sans-serif)
- All dynamic values (status colors, gradient text, hover glow) via inline styles
- Static structure and token references via `theme.ts` imports
