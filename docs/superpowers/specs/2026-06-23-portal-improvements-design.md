# Portal Improvements — Design Spec
**Date:** 2026-06-23  
**Status:** Approved

---

## Overview

Eight improvements to the LumosSDK portal and Android SDK, spanning UI layout, theming, new pages, documentation, and a new server endpoint.

| # | Feature | Scope |
|---|---------|-------|
| 1 | Apps as cards | Portal — `Apps.tsx` |
| 2 | Settings page | Portal — new page + server endpoints |
| 3 | Light / dark mode | Portal — theme system overhaul |
| 4 | Numbers font fix | Portal — `StatsCard`, `Dashboard` |
| 5 | Docs page | Portal — new public route `/docs` |
| 6 | SDK README | `lumos-android/README.md` |
| 7 | Sessions page | Portal + Server — new nav page + API endpoint |
| 8 | Persist trace days filter | Portal — `TraceExplorer.tsx` |

---

## 1. Theme System (Light / Dark Mode)

### Approach
CSS custom properties on `<html>`. Dark values are the defaults (`:root`). A `[data-theme="light"]` attribute overrides them. The existing `T` object in `theme.ts` is rewritten so every value references `var(--color-X)` — existing inline styles across all components respond automatically with no per-component changes.

### ThemeContext
New `ThemeContext` + `useTheme` hook. On mount:
1. Read `localStorage.lumos_theme` (`"dark"` | `"light"` | `"system"`)
2. If absent or `"system"`, read `matchMedia('prefers-color-scheme: dark')`
3. Set `document.documentElement.dataset.theme` accordingly
4. Listen to `matchMedia` change events when in system mode

A `ThemeToggle` button in the NavBar cycles: system → dark → light → system. Persists selection to `localStorage.lumos_theme`.

### CSS Variables

```css
/* Dark (default) */
:root {
  --color-bg:         #040810;
  --color-surface:    #070D1C;
  --color-card:       #0B1628;
  --color-card2:      #0F1E38;
  --color-border:     #2E3D54;
  --color-text:       #E8F2FF;
  --color-muted:      #6A7D9A;
  --color-cyan:       #00D4FF;
  --color-cyan-rgb:   0,212,255;
  --color-purple:     #7B5FFF;
  --color-green:      #00E887;
  --color-amber:      #FFB800;
  --color-red:        #FF4563;
}

/* Light override */
[data-theme="light"] {
  --color-bg:         #F4F7FC;
  --color-surface:    #FFFFFF;
  --color-card:       #FFFFFF;
  --color-card2:      #EEF2FA;
  --color-border:     #D0DCF0;
  --color-text:       #0D1A2E;
  --color-muted:      #5A6E8C;
  --color-cyan:       #0099BB;
  --color-cyan-rgb:   0,153,187;
  --color-purple:     #6344E0;
  --color-green:      #00A85A;
  --color-amber:      #C98A00;
  --color-red:        #D93050;
}
```

### T object rewrite
Every `T.X` becomes `var(--color-X)`. The ~10 inline `rgba(0,212,255,0.08)` usages across components are updated to `rgba(var(--color-cyan-rgb), 0.08)`. Gradient strings (`T.grad`, `T.gradientText`) remain as computed values rebuilt from CSS vars at runtime.

### NavBar toggle
A sun/moon icon button appended after the nav links. Three-state cycle with tooltip showing current mode.

---

## 2. Apps as Cards

### Layout
`Apps.tsx` grid changes from `flexDirection: column` to `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px`.

### Card anatomy
- **Header:** app name (semibold, 15px) + package name (monospace, 12px, muted)
- **Status:** cyan glow border + "Active" chip when selected
- **Footer:** Select button (or "Active" label), Rename button, Delete icon — aligned in a row
- **Hover:** `transform: translateY(-2px)` + elevated shadow

### New App card
A dashed-border card with a centered `+` icon and "New App" label sits as the first item in the grid. Clicking it expands an inline form within the card (name + package + Create). Matches Vercel / Linear new-project patterns.

---

## 3. Settings Page

### Route
`/settings` — behind `RequireAuth`. NavBar gets a `Settings` link with a `SlidersHorizontal` icon below the existing nav links (above the app switcher).

### Three sections

#### SDK Config
Read-only reference card scoped to the currently selected app. Shows:
- API key (masked, with a "Copy" button that reveals/copies)
- Server URL (copyable)
- A syntax-highlighted code block: the exact `Lumos.init { }` snippet to paste into Android
- Debug toggle — `PATCH /api/apps/:appId` with `{ debug: boolean }`. Stored server-side on the app record.

#### Account Settings
Editable fields: display name, email. Save hits `PATCH /api/account`. Client validates non-empty before submitting. Shows success/error inline feedback.

Required new server route: `PATCH /api/account` — reads JWT `accountId`, updates the accounts table.

The accounts table currently has `id`, `email`, `passwordHash`. A nullable `name` varchar(255) column is added via `SchemaUtils.createMissingTablesAndColumns` (consistent with CLAUDE.md — new columns must be nullable).

#### Danger Zone
Red-bordered section. Two destructive actions:

1. **Delete App** — same logic as existing delete in `Apps.tsx`. Confirmation dialog requires typing the app name.
2. **Delete Account** — new. Wipes account + all apps + all traces + all keys. `DELETE /api/account`. Confirmation requires typing the account email. Logs the user out after success.

Required new server route: `DELETE /api/account`.

---

## 4. Numbers Font Fix

In `StatsCard.tsx` and the metric cards in `Dashboard.tsx`, numeric values currently use `fontFamily: T.fontD` (Clash Display). Switch these to the body font (`'Satoshi', 'Inter', system-ui, sans-serif`). The display font (`T.fontD`) is retained for page titles and the Lumos logo wordmark only.

No changes to `T.fontD` itself — just stop applying it to numeric values.

---

## 5. Docs Page

### Route & access
`/docs` — outside `RequireAuth`. No sidebar NavBar. Own layout with sticky left nav. Accessible publicly (shareable URL). The authenticated NavBar gets a "Docs" link (`BookOpen` icon) that navigates to `/docs`.

### Layout
- **Left sidebar (240px, fixed):** section links with scroll-spy (active section highlighted in cyan). Lumos logo at top linking back to `/`.
- **Right content area:** scrollable, max-width 760px, centered.

### Sidebar sections
1. Overview
2. Installation
3. Get Started
4. Configuration
5. API Reference
6. Server Endpoints
7. Error Codes
8. Examples
9. Changelog

### Section content

**Overview** — What LumosSDK is (2 sentences). Architecture diagram built from styled divs: `Your App → Room Queue → WorkManager → Lumos Server → Portal`.

**Installation** — Gradle `implementation` snippet. Required `AndroidManifest` permissions (`INTERNET`).

**Get Started** — Minimal working example: `Lumos.init {}` in `Application.onCreate`, `startTrace`, `endTrace`. ~15 lines Kotlin.

**Configuration** — Table: field | type | default | description for all `LumosConfig` fields (`apiKey`, `serverUrl`, `debug`).

**API Reference** — Each public function with: signature block, parameter table (name | type | required | description), return type, and a Kotlin example.
Functions: `init`, `startTrace`, `endTrace`, `addSpan`, `feedback`, `flush`, `shutdown`, `setListener`.

**Server Endpoints** — Every server route:
- Method badge (GET / POST / PATCH / DELETE, color-coded)
- URL with path params highlighted
- Required headers table
- Request body schema (JSON)
- Response schema
- Copyable `curl` example

**Error Codes** — Table: HTTP status | error key | description | how to fix.

**Examples** — Full instrumented chat screen in Kotlin. Code tabs (two tabs: coroutines style, callback style).

**Changelog** — Version cards: version number + date + bullet list of changes. Starts at v0.1.0.

### Code blocks
Styled `<pre>` with dark/light theme-aware background, a "Copy" button top-right, and syntax highlighting via inline class-based coloring (no external lib). Callout boxes (tip / warning / danger) with colored left border.

### Playwright screenshots
During implementation: start the portal dev server, use Playwright to capture screenshots of Dashboard and Traces pages. Save to `lumos-android/docs/screenshots/`. Reference in the README.

---

## 6. SDK README

File: `lumos-android/README.md`

### Structure
1. **Header** — Lumos logo SVG (`<img>`) centered, tagline "AI observability for Android"
2. **Badges** — SDK version, min API 26, license (MIT), build passing
3. **What is LumosSDK** — 2-sentence description + link to portal
4. **Installation** — Gradle snippet
5. **Quick Start** — 15-line Kotlin snippet (init + trace + end)
6. **Configuration** — markdown table of `LumosConfig` fields
7. **How it works** — Mermaid `graph LR` flowchart: `Your App → Room Queue → WorkManager → Server → Portal`
8. **API Reference** — markdown table: method | signature | description
9. **Portal** — Playwright screenshot of Dashboard embedded as `<img>`
10. **Contributing** — brief note
11. **License** — MIT

### Icons
Lucide SVG files committed to `lumos-android/docs/icons/` and referenced via `<img src="docs/icons/X.svg" height="16">` inline in section headers where appropriate. No emoji.

---

## 7. Sessions Page

### Server endpoint
`GET /api/apps/:appId/sessions`

Ownership check: verify app belongs to JWT `accountId`, return 403 otherwise.

Query: group `traces` by `sessionId`, compute per session:
- `sessionId`
- `traceCount`
- `firstSeen` (min `startedAt`)
- `lastSeen` (max `startedAt`)
- `durationMs` (lastSeen − firstSeen)
- `errorCount` (count where status = 'ERROR')
- `features` (distinct feature names, comma-joined)

Returns JSON array sorted by `lastSeen` descending.

Secondary query on expand: `GET /api/apps/:appId/sessions/:sessionId/traces` — returns the traces for one session in chronological order (reuses existing traces query filtered by sessionId).

### Portal
New `/sessions` route. NavBar link: `Route` icon, label "Sessions".

**Session list:** each session renders as a card:
- Session ID (monospace, truncated to 12 chars + "…")
- Duration chip (e.g. "3m 42s")
- Trace count badge
- Error badge (red, only if `errorCount > 0`)
- Feature tags (up to 3, then "+N more")
- Expand chevron

**Expanded state:** clicking a card expands inline to show its traces in chronological order. Each trace row: feature tag, status badge, latency, timestamp — clicking navigates to `/traces/:traceId`. Collapse on second click.

Sessions sorted by `lastSeen` descending. No pagination in v1 (mirrors existing traces list behavior).

---

## 8. Persist Trace Days Filter

In `TraceExplorer.tsx`, the days filter (currently resets to 1 day on every mount) is persisted:
- Read initial value from `localStorage.lumos_trace_days` on mount
- On change, write to `localStorage.lumos_trace_days`
- Default to `7` (not 1) if nothing is stored

---

## Files Affected

### Portal
| File | Change |
|------|--------|
| `src/index.css` | Add CSS custom properties for all theme colors |
| `src/theme.ts` | Rewrite T values to `var(--color-X)` |
| `src/ThemeContext.tsx` | New — system/dark/light logic |
| `src/App.tsx` | Wrap with ThemeProvider, add `/docs` and `/sessions` routes |
| `src/components/NavBar.tsx` | Add ThemeToggle, Docs link, Settings link, Sessions link |
| `src/pages/Apps.tsx` | Card grid layout |
| `src/pages/Settings.tsx` | New page |
| `src/pages/Docs.tsx` | New public page |
| `src/pages/Sessions.tsx` | New page |
| `src/pages/TraceExplorer.tsx` | Persist days filter |
| `src/components/StatsCard.tsx` | Font fix |
| `src/pages/Dashboard.tsx` | Font fix |

### Server
| File | Change |
|------|--------|
| `src/main/kotlin/com/lumos/routes/AccountRoutes.kt` | New — PATCH + DELETE /api/account |
| `src/main/kotlin/com/lumos/routes/SessionRoutes.kt` | New — GET /api/apps/:appId/sessions + GET /api/apps/:appId/sessions/:sessionId/traces |
| `src/main/kotlin/com/lumos/Application.kt` | Register new routes |
| `src/main/kotlin/com/lumos/db/Tables.kt` | Add `debug` column to apps table (nullable) |

### SDK
| File | Change |
|------|--------|
| `lumos-android/README.md` | New |
| `lumos-android/docs/icons/` | Lucide SVG assets |
| `lumos-android/docs/screenshots/` | Playwright screenshots |
