# LumosSDK — Design Document
**Date:** 2026-06-11
**Product:** AI Agent Observability SDK for Android

---

## What it is

LumosSDK is a Kotlin Android library that records every AI conversation inside an app — what the user asked, what the AI replied, what tools were called, how fast, how much it cost, and whether the user was happy. All of it flows to a web portal where the developer can see dashboards and drill into individual conversations.

Think: Langfuse, but built for Android/mobile — offline-first, battery-aware, Kotlin-native.

---

## The pieces

```
Android App (emulator / real device)
  └── LumosSDK (Kotlin library)
        │  saves events to phone storage first (offline-safe)
        │  sends batches over HTTPS with API key
        ▼
  Oracle VPS
  └── Ktor Server (Kotlin)
        │  receives events, stores in SQLite
        │  serves portal API (JWT auth)
        │  proxies demo chat to OpenRouter
        ▼
  Lumos Portal (React + Vite)
        │  dashboard + trace explorer + API key management
        │  opened in browser by the developer
```

---

## SDK

### What the developer writes

```kotlin
// Once when app starts
AgentLens.init(context) {
    apiKey = "lms_abc123..."
    serverUrl = "https://your-vps.com"
}

// Around every AI call
val trace = AgentLens.startTrace("support-chat")
trace.logPrompt(userMessage)
val reply = callMyAI(userMessage)
trace.logResponse(
    text = reply,
    model = "openai/gpt-4o-mini",
    tokensIn = 200,
    tokensOut = 80,
    latencyMs = 1200
)
trace.end()

// When user taps thumbs up or down
AgentLens.feedback(trace.id, Feedback.ThumbsUp)
AgentLens.feedback(trace.id, Feedback.ThumbsDown)
```

### Public API (6 functions — meets course requirement)

| Function | What it does |
|---|---|
| `AgentLens.init(context) { ... }` | Initialize with API key and server URL |
| `AgentLens.startTrace(feature)` | Begin recording a conversation, returns a Trace |
| `trace.logPrompt(text)` | Record the user's message |
| `trace.logResponse(text, model, tokensIn, tokensOut, latencyMs)` | Record the AI reply + metrics |
| `trace.startSpan(name)` / `span.end()` | Record a tool call or sub-step inside a trace |
| `trace.logError(throwable)` | Record a failure inside a conversation |
| `trace.end(status)` | Close the trace (OK / ERROR / ABANDONED) |
| `AgentLens.feedback(traceId, Feedback)` | Attach ThumbsUp or ThumbsDown to a trace |
| `AgentLens.flush()` | Force-send all queued events now (suspend) |
| `AgentLens.shutdown()` | Clean shutdown |
| `AgentLens.setListener(listener)` | Callbacks: onFlushSuccess, onFlushError |

### How it works internally

- Every event is written to **Room (SQLite on device)** immediately — never lost even if app crashes
- A **WorkManager** job batches and uploads events (survives process death, waits for network, retries with backoff)
- Sends `POST /v0/events` with gzip JSON + `X-Lumos-Key` header
- If server returns 401 (revoked key) → SDK goes silent, stops trying
- Nothing ever throws into the host app — internal errors go to the listener

### Data captured per trace

- Trace ID, feature name
- User prompt (text)
- AI response (text)
- Model name
- Tokens in / tokens out
- Latency (ms)
- Status: OK / ERROR / ABANDONED
- Spans: each tool call with name + duration
- Feedback: ThumbsUp / ThumbsDown
- Device info: Android version, app version, network type (no personal identifiers)
- Session ID (rotates after 30 min inactivity)

---

## Server

Runs on **Oracle VPS**. Built with **Ktor (Kotlin) + Exposed ORM + SQLite**.

### SDK endpoints (authenticated by `X-Lumos-Key` header)

```
POST /v0/events       Receive event batches from SDK
GET  /v0/config       SDK startup check (is key valid? basic config)
POST /v0/demo/chat    Demo proxy → calls OpenRouter, returns reply
```

### Portal endpoints (authenticated by JWT)

```
POST /api/auth/login
POST /api/auth/register

GET  /api/apps                    List apps
POST /api/apps                    Register app

GET  /api/apps/:id/keys           List API keys (no secrets)
POST /api/apps/:id/keys           Create key → secret shown once
DELETE /api/keys/:id              Revoke key

GET  /api/apps/:id/stats          Dashboard aggregates
GET  /api/apps/:id/traces         Trace list + filters + pagination
GET  /api/traces/:traceId         Full trace detail
```

### Database schema (SQLite via Exposed)

```sql
accounts(id, email, password_hash, created_at)
apps(id, account_id, name, package_name, created_at)
api_keys(id, app_id, name, key_hash, created_at, last_used_at, revoked_at)

traces(trace_id PK, app_id, feature, session_id,
       input, output, model, tokens_in, tokens_out,
       latency_ms, status, started_at)
spans(span_id PK, trace_id FK, name, duration_ms, started_at)
feedback(id PK, trace_id FK, kind, created_at)
ingested_events(event_id PK)   -- deduplication

-- Pre-aggregated table for fast dashboard queries
stats_hourly(app_id, feature, hour_bucket,
             traces_count, ok_count, error_count,
             tokens_in_sum, tokens_out_sum,
             latency_sum_ms,
             thumbs_up, thumbs_down,
             PRIMARY KEY (app_id, feature, hour_bucket))
```

**Key design decisions:**
- API key secrets stored as **SHA-256 hash only** — shown once at creation, never again
- Key format: `lms_<32 random chars>`
- Dedup by `event_id` — SDK retries are safe
- Dashboard reads from `stats_hourly` only — fast regardless of data volume
- Trace explorer uses keyset pagination on `(app_id, started_at DESC)`

---

## Portal

**Tech:** React + TypeScript + Vite + Recharts

### Pages

**Login** — email + password → JWT stored in localStorage

**Dashboard**
- Total conversations (last 7 / 30 days)
- Average latency (ms)
- Average cost per conversation (tokens)
- Thumbs up ratio (%)
- Line chart: conversations over time
- Bar chart: cost over time

**Trace Explorer**
- Table of conversations: feature, status, latency, tokens, feedback, timestamp
- Click any row → Trace Detail
- Filters: feature, status, date range

**Trace Detail**
- Full conversation: user prompt + AI reply
- Spans timeline: each tool call, name + duration
- Metrics: model, tokens in/out, total latency, cost estimate
- Feedback: thumbs up / thumbs down badge

**API Keys**
- Table: name, created, last used, status
- Create key button → modal shows secret once
- Revoke button per key

---

## Demo App

**Tech:** Kotlin + Jetpack Compose

A generic chat screen:
- User types a message → taps Send
- App calls `POST /v0/demo/chat` on the server → server calls OpenRouter → returns reply
- LumosSDK automatically traces the conversation (prompt, response, latency, tokens)
- Thumbs up / thumbs down buttons under each AI message
- All data appears in the portal in real time

---

## Tech stack summary

| Piece | Technology |
|---|---|
| Android SDK | Kotlin, Room, WorkManager, OkHttp, kotlinx.serialization |
| Server | Ktor (Kotlin), Exposed ORM, SQLite |
| Portal | React, TypeScript, Vite, Recharts |
| Demo app | Kotlin, Jetpack Compose |
| AI provider | OpenRouter (via server proxy) |
| Auth | JWT (portal login) |
| Hosting | Oracle VPS |

---

## What's out of scope (intentionally)

- Automatic AI scoring on every conversation (heuristic evals) — deferred
- Remote controls (portal changing SDK behavior live) — deferred
- iOS / web SDKs — Android only
- Multi-user teams / org management — single account per portal
- Key rotation with grace period — just create + revoke
- Live debug stream — not needed for course

---

## Milestones

1. **M1 — SDK core**: Gradle library module, event schema, Room queue, WorkManager uploader
2. **M2 — Server ingestion + auth**: Ktor server on VPS, `POST /v0/events`, API key create/revoke, JWT auth
3. **M3 — Tracing + demo app**: full trace/feedback API, Compose demo chat app, OpenRouter proxy, end-to-end working
4. **M4 — Portal**: login, dashboard, trace explorer, API key management UI
5. **M5 — Polish**: error handling, offline edge cases, README, demo prep

---

## Course checklist

| Lecturer requirement | How LumosSDK covers it |
|---|---|
| Kotlin SDK, init + API key, 4–6+ public functions | `init`, `startTrace`, `logPrompt`, `logResponse`, `feedback`, `flush` + more |
| Callbacks + error handling, never throws | `AgentLensListener`, `SdkErrorGuard` |
| Real server + DB + auth | Ktor + SQLite on Oracle VPS, X-Lumos-Key auth |
| Meaningful portal (changes behavior OR yields insight) | Dashboard + trace explorer = deep insight into AI quality |
| Demo app | Compose chat app, OpenRouter, fully instrumented |
| README + docs | Library README with install, init, examples |
| Offline, retries, validation, API key security | Room queue, WorkManager backoff, dedup, hashed keys |
