# Lumos Portal — Go-Live Design

**Date:** 2026-06-18
**Status:** Approved (pending spec review)
**Goal:** Make the Lumos portal production-ready so a user can register, create an app, generate an API key, point the Android SDK at the backend, and see **real data** (no mock/fake values) flow into the dashboard, traces, and device views.

---

## 1. Background & Problem

The portal currently works only in a "demo mode": [`portal/src/api/client.ts`](../../../portal/src/api/client.ts) silently falls back to fabricated data in [`portal/src/api/mockData.ts`](../../../portal/src/api/mockData.ts) whenever the backend is unreachable. Against a real, auth-enforcing backend, several things break or show fake data:

- **Auth is unreachable.** [`App.tsx`](../../../portal/src/App.tsx) has no `/login` route and no auth guard; the `*` route redirects to `/`. A live `401` → `window.location='/login'` → no such route → `*` → `/` → `401` … infinite loop. The existing [`Login.tsx`](../../../portal/src/pages/Login.tsx) is dead code.
- **Sign Out does nothing** ([`NavBar.tsx`](../../../portal/src/components/NavBar.tsx) button has no handler).
- **No app provisioning.** Registration creates an account with zero apps. The portal keys everything off `GET /api/apps → apps[0].id`. With no app there is no API key, so the SDK cannot authenticate and no data flows. `POST /api/apps` exists but has no UI.
- **Device data is discarded.** The SDK envelope carries `deviceModel`, `androidVersion`, `sdkVersion`, `appVersion`, but [`IngestionService.kt`](../../../server/src/main/kotlin/com/lumos/server/service/IngestionService.kt) never stores it and the trace endpoints never return it. The portal's Android/iOS/Web device UI is mock-only (and the SDK is Android-only).
- **`model` missing from traces list** → Dashboard "Model" column always `—`.
- **Fake dashboard widgets.** "Conversations per Hour" is `Math.random()`; KPI trend captions (`"↑ 12% vs last week"`) are hardcoded strings.

The register endpoint itself ([`AuthRoutes.kt`](../../../server/src/main/kotlin/com/lumos/server/routes/AuthRoutes.kt)) already works (bcrypt, returns `{token,email}`); the blocker is purely that the UI never routes to it.

---

## 2. Decisions (locked)

1. **Apps management UI** — multi-app accounts: create, list, **select, rename, delete**.
2. **Android-only, real device data** — persist & show what the SDK actually sends; remove fake iOS/Web filters.
3. **Remove mock fallback for production** — never show fabricated data; honest empty states.
4. **Real hourly chart + real week-over-week (WoW) trends** — both computed from `stats_hourly`.

---

## 3. Architecture Overview

```
Android SDK ──X-Lumos-Key──> POST /v0/events ──> IngestionService ──> SQLite (traces + device, stats_hourly)
                                                                            │
Portal (React) ──Bearer JWT──> /api/auth, /api/apps, /api/apps/{id}/{stats,traces,keys}, /api/traces/{id}
   AuthContext (token)  ──>  RequireAuth guard
   AppContext (apps, currentAppId)  ──>  Dashboard / Traces / ApiKeys / Apps pages
```

No new services or storage engines. Same Ktor + Exposed + SQLite stack; same React + Vite + axios + react-router stack. `DatabaseFactory.init()` uses `createMissingTablesAndColumns`, so new nullable columns auto-migrate.

---

## 4. Frontend Design

### 4.1 Auth & session
- **Routes:** add `/login` (renders `Login.tsx`). All other routes (`/`, `/traces`, `/traces/:traceId`, `/keys`, `/apps`) are wrapped in `RequireAuth`.
- **`RequireAuth`** component: reads `localStorage.lumos_token`; if absent, `<Navigate to="/login" replace>`; otherwise renders children inside `AppLayout`.
- **`Login.tsx`**: keep the inline Sign-in / Register toggle. On success store token, navigate to `/`. (If the user has no apps, `AppContext`/onboarding routes them to create-first-app — see 4.2.)
- **Sign Out** ([`NavBar.tsx`](../../../portal/src/components/NavBar.tsx)): `localStorage.removeItem('lumos_token')` + navigate to `/login` (clear AppContext state).
- **Interceptor** ([`client.ts`](../../../portal/src/api/client.ts)): keep the 401/403 → `/login` redirect; **delete** the network-error mock-fallback block and the import of `mockData`.

### 4.2 AppContext (new)
- Provider mounted inside `RequireAuth`. On mount calls `GET /api/apps`.
- State: `{ apps: App[], currentAppId: string | null, loading, refresh(), setCurrentAppId(id) }`.
- `currentAppId` persisted to `localStorage.lumos_current_app`; defaults to first app; validated against the fetched list (falls back to first app if the stored id no longer exists).
- **Onboarding:** if `apps.length === 0`, render a "Create your first app" view (reusing the create form) instead of the dashboard, regardless of route.
- Dashboard, TraceExplorer, ApiKeys **stop fetching `/api/apps` themselves** and read `currentAppId` from context. This removes the duplicated `api.get('/api/apps').then(r => r.data[0]?.id)` pattern in all three pages.

### 4.3 Apps management
- **NavBar app switcher** replaces the hardcoded "Demo App / Live · Mock data" chip: shows `currentApp.name`, dropdown lists apps to switch, plus "+ New App" and a link to `/apps`.
- **`/apps` page** (new `pages/Apps.tsx`): lists apps (name, package name, created date); create form (name + package name → `POST /api/apps`); per-app **Rename** (inline edit → `PATCH /api/apps/{id}`) and **Delete** (confirm → `DELETE /api/apps/{id}`).
- After deleting the current app, switch `currentAppId` to another app, or to onboarding if none remain.

### 4.4 Device UI (Android-only)
- Remove the iOS/Web platform filter buttons in [`TraceExplorer.tsx`](../../../portal/src/pages/TraceExplorer.tsx). Keep an optional Android filter only if useful; otherwise drop the platform filter entirely and keep Device as a display column.
- `device` object shape returned by API: `{ deviceModel, androidVersion, sdkVersion, appVersion }`.
- OS label helper: map Android API level → marketing version (e.g. `34 → "Android 14"`, `33 → "Android 13"`, …), fallback `"API {n}"`.
- TraceDetail "Device & Environment" card renders Device model, OS, SDK version, App version when `device` is present.

### 4.5 Dashboard real data
- **Hourly chart:** fetch `GET /api/apps/{appId}/stats/hourly` (last 24h, array of `{ hour, calls }`); replace the `useMemo` `Math.random()` generator.
- **WoW trends:** the stats response includes prior-period totals; compute real % deltas for KPI cards (Total Conversations, Success Rate, Avg Latency, Tokens). When prior period has zero data, **omit** the trend caption rather than show a fake one.
- **Est. Cost:** replace the single hardcoded `$5/$15` GPT-4o rate with a small per-model price map (`{ 'gpt-4o': {in,out}, 'gpt-4o-mini': …, default }`); label the figure "estimate."

### 4.6 Cleanup / simplify
- Extract shared components: `StatusBadge` (OK/ERROR pill, used in Dashboard, TraceExplorer, TraceDetail), `PageHeader` (icon tile + gradient title + subtitle, used in Dashboard/TraceExplorer/ApiKeys/Apps), single `Bone` skeleton (remove the duplicate inside TraceDetail).
- Move platform→color helper into `theme.ts`. Delete unused `cardGlow`, `grad2`; remove redundant `T.card2 ?? '#0F1E38'`.
- CSV export uses `filteredTraces` and includes the real `model` column.
- Add `portal/public/favicon.svg`; compress/replace the 4.9 MB `portal/public/lumos-icon.png`.
- Delete `portal/src/api/mockData.ts`.

---

## 5. Backend Design

### 5.1 Schema changes ([`Tables.kt`](../../../server/src/main/kotlin/com/lumos/server/db/Tables.kt))
Add nullable columns to `Traces`:
- `deviceModel = varchar("device_model", 200).nullable()`
- `androidVersion = integer("android_version").nullable()`
- `sdkVersion = varchar("sdk_version", 50).nullable()`
- `appVersion = varchar("app_version", 50).nullable()`

Auto-migrated by `createMissingTablesAndColumns`.

### 5.2 Ingestion ([`IngestionService.kt`](../../../server/src/main/kotlin/com/lumos/server/service/IngestionService.kt))
On `TRACE` events, persist the envelope's `deviceModel`, `androidVersion`, `sdkVersion`, `appVersion` onto the trace row. SPAN/FEEDBACK unchanged. Idempotency (`IngestedEvents`) unchanged.

### 5.3 Trace endpoints ([`TraceRoutes.kt`](../../../server/src/main/kotlin/com/lumos/server/routes/TraceRoutes.kt))
- List `GET /api/apps/{appId}/traces`: add `model` and a `device` object (`{deviceModel, androidVersion, sdkVersion, appVersion}`; `device` null if all fields null).
- Detail `GET /api/traces/{traceId}`: add the same `device` object (already returns `model`).

### 5.4 Apps endpoints ([`AppRoutes.kt`](../../../server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt))
- Existing `GET /api/apps`, `POST /api/apps` unchanged.
- **`PATCH /api/apps/{appId}`** `{ name?, packageName? }` — ownership-checked, updates provided fields, returns the updated app.
- **`DELETE /api/apps/{appId}`** — ownership-checked; in one transaction cascade-delete the app's `api_keys`, `traces` (+ their `spans`, `feedback`), `stats_hourly`, then the app row. Returns `204`.

### 5.5 Stats endpoints ([`StatsRoutes.kt`](../../../server/src/main/kotlin/com/lumos/server/routes/StatsRoutes.kt))
- Existing `GET /api/apps/{appId}/stats` extended to also return prior-period (previous 7 days) totals for WoW deltas — shape: `{ ...currentTotals, previous: { traces, ok, errors, tokensIn, tokensOut, latencySum, thumbsUp, thumbsDown } }`. (Current totals remain all-time to preserve existing KPI semantics; WoW compares last-7-days vs prior-7-days windows computed from `stats_hourly.hour_bucket`.)
- **`GET /api/apps/{appId}/stats/hourly`** — returns exactly 24 entries for the last 24 hours in chronological order: `[{ hour: "<HH>h", calls: <tracesCount sum> }]`, where `<HH>` is the bucket's hour-of-day (`"00".."23"`, matching the frontend's existing `${i}h` axis label). Ownership-checked; empty hours zero-filled.

### 5.6 Config / deployment
- `JWT_SECRET` and `OPENROUTER_API_KEY` already env-driven ([`application.conf`](../../../server/src/main/resources/application.conf)). Document required env for production.
- Portal `VITE_API_URL` must be set to the production backend URL at build time (default `http://localhost:8080`).
- CORS already `anyHost()` with needed headers/methods (note: tighten to known origins is out of scope but recommended).

---

## 6. Data Flow (go-live happy path)

1. User opens portal → `/login` (no token) → registers → token stored.
2. No apps → onboarding "Create your first app" (name + package) → `POST /api/apps`.
3. AppContext sets `currentAppId` → user goes to `/keys` → "New Key" → `POST /api/apps/{id}/keys` → copies secret.
4. SDK configured with the key → `POST /v0/events` with `X-Lumos-Key` → IngestionService writes traces (with device) + stats_hourly.
5. Dashboard/Traces/Detail show real totals, real hourly chart, real WoW deltas, real device info.

---

## 7. Testing

**Backend (Ktor tests):**
- Device fields persisted on ingest and returned by list + detail.
- `stats/hourly` returns 24 buckets, correct sums, zero-fill, ownership 403.
- Stats WoW `previous` totals correct across the 7-day boundary.
- `PATCH` updates name/packageName, ownership 403, 404 for missing.
- `DELETE` cascades (keys/traces/spans/feedback/stats removed), ownership 403, returns 204.

**Frontend:**
- `tsc -b` clean.
- Manual: register → create app → create key → simulate an event (or point SDK) → data appears; switch app; rename; delete; sign out → `/login`; refresh keeps session.

---

## 8. Out of Scope (YAGNI)
- iOS/Web SDKs and multi-platform device UI.
- CORS origin hardening, rate limiting, refresh tokens.
- Pagination/search server-side (client-side filtering retained).
- Soft-delete / audit trails for apps (hard delete with cascade).

---

## 9. Risks
- **Cascade delete** must run in a single transaction and respect FK order (feedback/spans → traces; keys; stats → app) to avoid orphan/constraint errors on SQLite.
- **WoW window math** must use `hour_bucket` consistently (UTC vs local) to avoid off-by-one-hour bucket errors.
- **Removing mock fallback** means any backend downtime shows empty states — acceptable and intended, but verify error states are user-friendly.
